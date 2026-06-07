import { gameText } from '../content/gameText';
import { type GameEvents } from '../events/gameEvents';
import { formatBoardCoordinate, gameState } from './gameStore';
import { type GameCheckpoint, type GameProgressData } from './gameProgress';
import {
  resolveScreen,
  type ScreenChrome,
  type UIScreen,
  type UIScreenResult,
} from './uiFlowStore';
import { playSound } from './soundManager';

export type ParrotCheckpoint =
  | 'parrot.dawnIntro'
  | 'parrot.foodChoice'
  | 'parrot.actionChoice'
  | 'parrot.observeSurroundings'
  | 'parrot.corsairLocation'
  | 'parrot.lookAroundTimer'
  | 'parrot.exhaustedAfterObservation'
  | 'parrot.helpCrew';

type ShowCheckpointScreen = (
  checkpoint: GameCheckpoint,
  screen: UIScreen,
  data?: GameProgressData
) => Promise<UIScreenResult>;

type WaitForEvent = <K extends keyof GameEvents>(
  event: K,
  fn?: () => void
) => Promise<GameEvents[K]>;

interface RunParrotTurnOptions {
  showCheckpointScreen: ShowCheckpointScreen;
  waitForEvent: WaitForEvent;
  startAt?: ParrotCheckpoint;
  progressData?: GameProgressData;
}

const PARROT_CHROME: ScreenChrome = {
  phase: 'aurore',
  showRhum: true,
  showPeanuts: true,
};

function formatActionCount(count: number): string {
  const unit = count > 1 ? gameText.units.actionPlural : gameText.units.actionSingular;

  return `${count} ${unit}`;
}

function formatCaseCount(count: number): string {
  const unit = count > 1 ? gameText.units.casePlural : gameText.units.caseSingular;

  return `${count} ${unit}`;
}

function formatCorsairPositionFromBoat(): string {
  const corsairText = gameText.turn2Plus.parrot.corsairLocation;
  const deltaX = gameState.corsairPosition.x - gameState.userPosition.x;
  const deltaY = gameState.corsairPosition.y - gameState.userPosition.y;
  const relativeParts: string[] = [];

  if (deltaY !== 0) {
    relativeParts.push(
      `${formatCaseCount(Math.abs(deltaY))} ${deltaY > 0 ? corsairText.right : corsairText.left}`
    );
  }

  if (deltaX !== 0) {
    relativeParts.push(
      `${formatCaseCount(Math.abs(deltaX))} ${deltaX > 0 ? corsairText.up : corsairText.down}`
    );
  }

  if (relativeParts.length === 0) {
    return corsairText.onBoat;
  }

  return `${corsairText.relativePrefix} ${relativeParts.join(corsairText.relativeJoin)} ${corsairText.fromBoatSuffix}`;
}

export async function runParrotTurn({
  showCheckpointScreen,
  waitForEvent,
  startAt = 'parrot.dawnIntro',
  progressData,
}: RunParrotTurnOptions): Promise<void> {
  const isFirstTurn = gameState.turnCount === 1;
  let shouldWaitForMapReveal = false;
  let shouldShowObservationRest = progressData?.shouldShowObservationRest ?? false;
  let remainingParrotActions = progressData?.remainingParrotActions ?? (isFirstTurn ? 2 : 1);
  let currentStep: ParrotCheckpoint | undefined = startAt;

  while (currentStep) {
    if (currentStep === 'parrot.dawnIntro') {
      playSound('parrot');

      if (isFirstTurn) {
        await showCheckpointScreen(
          'parrot.dawnIntro',
          {
            type: 'full-message-button',
            content: gameText.turn1.parrot.dawnIntro,
            props: {
              chrome: PARROT_CHROME,
              primaryButtonLabel: gameText.turn1.parrot.dawnIntro.primaryButton,
              showUndo: true,
              undoLabel: gameText.turn1.parrot.dawnIntro.undoLabel,
            },
          },
          {
            remainingParrotActions,
            shouldShowObservationRest,
          }
        );

        remainingParrotActions = 2;
        currentStep = 'parrot.observeSurroundings';
        continue;
      }

      if (gameState.peanutTokens > 0) {
        currentStep = 'parrot.foodChoice';
        continue;
      }

      await showCheckpointScreen(
        'parrot.dawnIntro',
        {
          type: 'full-message-button',
          content: gameText.turn2Plus.parrot.dawnIntro,
          props: {
            chrome: PARROT_CHROME,
            primaryButtonLabel: gameText.turn2Plus.parrot.dawnIntro.primaryButton,
            showUndo: true,
            undoLabel: gameText.turn2Plus.parrot.dawnIntro.undoLabel,
          },
        },
        {
          remainingParrotActions,
          shouldShowObservationRest,
        }
      );

      currentStep = 'parrot.actionChoice';

      continue;
    }

    if (currentStep === 'parrot.foodChoice') {
      const peanutChoice = await showCheckpointScreen(
        'parrot.foodChoice',
        {
          type: 'full-message-button',
          content: {
            title: gameText.turn2Plus.parrot.dawnWithFoodCheck.title,
            body: `${gameText.turn2Plus.parrot.dawnWithFoodCheck.body} ${gameText.turn2Plus.parrot.dawnWithFoodCheck.ownedCountPrefix} ${gameState.peanutTokens}${gameText.turn2Plus.parrot.dawnWithFoodCheck.ownedCountSuffix}`,
          },
          props: {
            chrome: PARROT_CHROME,
            primaryButtonLabel: gameText.turn2Plus.parrot.dawnWithFoodCheck.primaryButton,
            secondaryButtonLabel: gameText.turn2Plus.parrot.dawnWithFoodCheck.secondaryButton,
          },
        },
        {
          remainingParrotActions,
          shouldShowObservationRest,
        }
      );

      if (peanutChoice.action === 'primary') {
        gameState.peanutTokens = Math.max(0, gameState.peanutTokens - 1);
        remainingParrotActions = 2;
        playSound('peanut');
      } else {
        remainingParrotActions = 1;
      }

      currentStep = 'parrot.actionChoice';

      continue;
    }

    if (currentStep === 'parrot.actionChoice') {
      const actionChoice = await showCheckpointScreen(
        'parrot.actionChoice',
        {
          type: 'top-message-lower-button-cards',
          content: {
            title: gameText.turn2Plus.parrot.dawnChoice.title,
            body: `${gameText.turn2Plus.parrot.dawnChoice.actionCountPrefix} ${formatActionCount(remainingParrotActions)} ${gameText.turn2Plus.parrot.dawnChoice.actionCountSuffix}`,
          },
          props: {
            chrome: PARROT_CHROME,
            showUndo: true,
            undoLabel: gameText.turn2Plus.parrot.dawnChoice.undoLabel,
            buttonsOnLastRow: true,
            cards: [
              {
                id: 'observe',
                title: gameText.turn2Plus.parrot.dawnChoice.cards[0].title,
                caption: gameText.turn2Plus.parrot.dawnChoice.cards[0].caption,
                variant: 'action',
                imageSrc: '/images/action_cards/action_card_observerlesalentours.webp',
                imageAlt: gameText.turn2Plus.parrot.dawnChoice.cards[0].title,
              },
              {
                id: 'corsair',
                title: gameText.turn2Plus.parrot.dawnChoice.cards[1].title,
                caption: gameText.turn2Plus.parrot.dawnChoice.cards[1].caption,
                variant: 'action',
                imageSrc: '/images/action_cards/action_card_repererlescorsaires.webp',
                imageAlt: gameText.turn2Plus.parrot.dawnChoice.cards[1].title,
              },
              {
                id: 'share',
                title: gameText.turn2Plus.parrot.dawnChoice.cards[2].title,
                caption: gameText.turn2Plus.parrot.dawnChoice.cards[2].caption,
                variant: 'action',
                imageSrc: '/images/action_cards/action_card_partagerdesinformations.webp',
                imageAlt: gameText.turn2Plus.parrot.dawnChoice.cards[2].title,
              },
            ],
          },
        },
        {
          remainingParrotActions,
        }
      );

      if (actionChoice.action === 'card' && actionChoice.cardId === 'observe') {
        gameState.entitiesVisible = true;
        shouldWaitForMapReveal = true;
        shouldShowObservationRest = true;
        remainingParrotActions = Math.max(remainingParrotActions - 1, 0);
        currentStep = 'parrot.lookAroundTimer';
      } else if (actionChoice.action === 'card' && actionChoice.cardId === 'corsair') {
        remainingParrotActions = Math.max(remainingParrotActions - 1, 0);
        currentStep = 'parrot.corsairLocation';
      } else if (actionChoice.action === 'card' && actionChoice.cardId === 'share') {
        remainingParrotActions = Math.max(remainingParrotActions - 1, 0);
        currentStep = 'parrot.helpCrew';
      }

      continue;
    }

    if (currentStep === 'parrot.observeSurroundings') {
      gameState.entitiesVisible = true;
      shouldWaitForMapReveal = true;
      shouldShowObservationRest = false;
      remainingParrotActions = Math.max(remainingParrotActions - 1, 0);
      currentStep = 'parrot.lookAroundTimer';

      continue;
    }

    if (currentStep === 'parrot.lookAroundTimer') {
      if (shouldWaitForMapReveal) {
        await waitForEvent('parrot:map_revealed');
        shouldWaitForMapReveal = false;
      }

      await showCheckpointScreen(
        'parrot.lookAroundTimer',
        {
          type: 'looking-around-timer',
          props: {
            chrome: PARROT_CHROME,
            onComplete: () => {
              gameState.entitiesVisible = false;
              resolveScreen({ action: 'timer-complete' });
            },
            replayKey: true,
          },
        },
        {
          remainingParrotActions,
          shouldShowObservationRest,
        }
      );

      if (isFirstTurn) {
        currentStep = 'parrot.helpCrew';
      } else if (shouldShowObservationRest) {
        shouldShowObservationRest = false;
        currentStep = 'parrot.exhaustedAfterObservation';
      } else {
        currentStep = remainingParrotActions > 0 ? 'parrot.actionChoice' : undefined;
      }

      continue;
    }

    if (currentStep === 'parrot.exhaustedAfterObservation') {
      await showCheckpointScreen(
        'parrot.exhaustedAfterObservation',
        {
          type: 'full-message-button',
          content: gameText.turn2Plus.parrot.exhaustedAfterObservation,
          props: {
            chrome: PARROT_CHROME,
            primaryButtonLabel:
              remainingParrotActions > 0
                ? gameText.turn2Plus.parrot.exhaustedAfterObservation.continueButton
                : gameText.turn2Plus.parrot.exhaustedAfterObservation.primaryButton,
          },
        },
        {
          remainingParrotActions,
        }
      );

      currentStep = remainingParrotActions > 0 ? 'parrot.actionChoice' : undefined;

      continue;
    }

    if (currentStep === 'parrot.corsairLocation') {
      gameState.displayCorsair = true;
      gameState.cameraFocusPosition = gameState.corsairPosition.clone();
      playSound('corsair');

      try {
        await showCheckpointScreen(
          'parrot.corsairLocation',
          {
            type: 'top-message-lower-button',
            content: {
              title: `${gameText.turn2Plus.parrot.corsairLocation.title} ${formatBoardCoordinate(gameState.corsairPosition)}`,
              body:
                remainingParrotActions > 0
                  ? gameText.turn2Plus.parrot.corsairLocation.remainingActionsBody
                  : gameText.turn2Plus.parrot.corsairLocation.lastActionBody,
              caption: formatCorsairPositionFromBoat(),
            },
            props: {
              chrome: PARROT_CHROME,
              primaryButtonLabel:
                remainingParrotActions > 1
                  ? gameText.common.next
                  : gameText.turn1.parrot.helpCrew.primaryButton,
            },
          },
          {
            remainingParrotActions,
          }
        );
      } finally {
        gameState.displayCorsair = false;
        gameState.cameraFocusPosition = null;
      }

      currentStep = remainingParrotActions > 0 ? 'parrot.actionChoice' : undefined;

      continue;
    }

    if (currentStep === 'parrot.helpCrew') {
      playSound('parrotShare');

      await showCheckpointScreen(
        'parrot.helpCrew',
        {
          type: 'full-message-button',
          content: {
            title: gameText.turn1.parrot.helpCrew.title,
            body: gameText.turn1.parrot.helpCrew.body,
            caption: gameText.turn1.parrot.helpCrew.caption,
          },
          props: {
            chrome: PARROT_CHROME,
            primaryButtonLabel:
              remainingParrotActions > 1
                ? gameText.common.next
                : gameText.turn1.parrot.helpCrew.primaryButton,
          },
        },
        {
          remainingParrotActions,
        }
      );

      if (isFirstTurn) {
        return;
      }

      currentStep = remainingParrotActions > 0 ? 'parrot.actionChoice' : undefined;

      continue;
    }

    return;
  }
}
