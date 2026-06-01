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

function formatCaseCount(count: number): string {
  return `${count} case${count > 1 ? 's' : ''}`;
}

function formatCorsairPositionFromBoat(): string {
  const deltaX = gameState.corsairPosition.x - gameState.userPosition.x;
  const deltaY = gameState.corsairPosition.y - gameState.userPosition.y;
  const relativeParts: string[] = [];

  if (deltaY !== 0) {
    relativeParts.push(
      `${formatCaseCount(Math.abs(deltaY))} a ${deltaY > 0 ? 'droite' : 'gauche'}`
    );
  }

  if (deltaX !== 0) {
    relativeParts.push(`${formatCaseCount(Math.abs(deltaX))} ${deltaX > 0 ? 'en haut' : 'en bas'}`);
  }

  if (relativeParts.length === 0) {
    return 'La fregate corsaire est sur la case du bateau.';
  }

  return `La fregate corsaire est a ${relativeParts.join(' et ')} du bateau.`;
}

export async function runParrotTurn({
  showCheckpointScreen,
  waitForEvent,
  startAt = 'parrot.dawnIntro',
  progressData,
}: RunParrotTurnOptions): Promise<void> {
  const isFirstTurn = gameState.turnCount === 1;
  let shouldWaitForMapReveal = false;
  let remainingParrotActions = progressData?.remainingParrotActions ?? (isFirstTurn ? 2 : 1);
  let currentStep: ParrotCheckpoint | undefined = startAt;

  while (currentStep) {
    if (currentStep === 'parrot.dawnIntro') {
      playSound('parrot');
      await showCheckpointScreen(
        'parrot.dawnIntro',
        {
          type: 'full-message-button',
          content: gameText.turn1.parrot.dawnIntro,
          props: {
            chrome: PARROT_CHROME,
            primaryButtonLabel: 'Suivant',
            showUndo: true,
          },
        },
        {
          remainingParrotActions,
        }
      );

      if (isFirstTurn) {
        remainingParrotActions = 2;
        currentStep = 'parrot.observeSurroundings';
        continue;
      }

      currentStep = gameState.peanutTokens > 0 ? 'parrot.foodChoice' : 'parrot.actionChoice';

      continue;
    }

    if (currentStep === 'parrot.foodChoice') {
      const peanutChoice = await showCheckpointScreen(
        'parrot.foodChoice',
        {
          type: 'full-message-button',
          content: {
            title: "C'est l'aurore !",
            body: `Veux-tu utiliser une cacahuete ? Reserve : ${gameState.peanutTokens}.`,
          },
          props: {
            chrome: PARROT_CHROME,
            primaryButtonLabel: 'Oui',
            secondaryButtonLabel: 'Non',
            showUndo: true,
          },
        },
        {
          remainingParrotActions,
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
            title: "C'est l'aurore !",
            body: `Tu as droit a ${remainingParrotActions} action${
              remainingParrotActions > 1 ? 's' : ''
            }.`,
          },
          props: {
            chrome: PARROT_CHROME,
            showUndo: true,
            cards: [
              {
                id: 'observe',
                title: 'Observer les alentours',
                caption: 'Regarde les 12 cases proches du bateau pendant 5 secondes.',
                variant: 'action',
                imageSrc: '/images/action_cards/action_card_observerlesalentours.webp',
                imageAlt: 'Observer les alentours',
              },
              {
                id: 'corsair',
                title: 'Reperer la fregate corsaire',
                caption: 'Affiche la case ou se situe actuellement la fregate.',
                variant: 'action',
                imageSrc: '/images/action_cards/action_card_repererlescorsaires.webp',
                imageAlt: 'Reperer les corsaires',
              },
              {
                id: 'share',
                title: "Partager a l'Equipage",
                caption: 'Utilise les tuiles et pions physiques pour transmettre des indices.',
                variant: 'action',
                imageSrc: '/images/action_cards/action_card_partagerdesinformations.webp',
                imageAlt: 'Partager des informations',
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
      remainingParrotActions = Math.max(remainingParrotActions - 1, 0);
      currentStep = 'parrot.lookAroundTimer';

      continue;
    }

    if (currentStep === 'parrot.lookAroundTimer') {
      if (shouldWaitForMapReveal) {
        await waitForEvent('parrot:map_revealed');
        playSound('corsair');
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
        }
      );

      if (isFirstTurn) {
        currentStep = 'parrot.helpCrew';
      } else {
        currentStep = remainingParrotActions > 0 ? 'parrot.actionChoice' : undefined;
      }

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
              title: 'Bateau corsaire repere',
              body: formatCorsairPositionFromBoat(),
              caption: `Corsaire : ${formatBoardCoordinate(gameState.corsairPosition)}. Bateau : ${formatBoardCoordinate(gameState.userPosition)}.`,
            },
            props: {
              chrome: PARROT_CHROME,
              primaryButtonLabel:
                remainingParrotActions > 0 ? 'Suivant' : "Passer le telephone a l'Equipage",
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
            body: 'Place au maximum 1 monstre + 1 ile + 1 typhon, ou 2 elements identiques, ou deplace 1 element, ou echange 2 elements. Tu peux aussi indiquer la derniere position connue de la fregate avec sa figurine.',
          },
          props: {
            chrome: PARROT_CHROME,
            primaryButtonLabel:
              remainingParrotActions > 0 ? 'Suivant' : "Passer le telephone a l'Equipage",
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
