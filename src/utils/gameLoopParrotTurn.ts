import { gameText } from '../content/gameText';
import { type GameEvents } from '../events/gameEvents';
import { gameState } from './gameStore';
import { type GameCheckpoint, type GameProgressData } from './gameProgress';
import { resolveScreen, type UIScreen, type UIScreenResult } from './uiFlowStore';

export type ParrotCheckpoint =
  | 'parrot.dawnIntro'
  | 'parrot.foodChoice'
  | 'parrot.observeSurroundings'
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

export async function runParrotTurn({
  showCheckpointScreen,
  waitForEvent,
  startAt = 'parrot.dawnIntro',
  progressData,
}: RunParrotTurnOptions): Promise<void> {
  const isFirstTurn = gameState.turnCount === 1;
  let shouldWaitForMapReveal = false;
  let remainingParrotActions = progressData?.remainingParrotActions ?? 1;
  let currentStep: ParrotCheckpoint | undefined = startAt;

  while (currentStep) {
    if (currentStep === 'parrot.dawnIntro') {
      if (isFirstTurn) {
        await showCheckpointScreen(
          'parrot.dawnIntro',
          {
            type: 'full-message-button',
            content: gameText.turn1.parrot.dawnIntro,
            props: {
              primaryButtonLabel: 'Suivant',
              showUndo: true,
            },
          },
          {
            remainingParrotActions,
          }
        );

        currentStep = 'parrot.observeSurroundings';
        continue;
      }

      const dawnChoice = await showCheckpointScreen(
        'parrot.dawnIntro',
        {
          type: 'full-message-button',
          content: gameText.turn2Plus.parrot.dawnWithFoodCheck,
          props: {
            primaryButtonLabel: gameText.turn2Plus.parrot.dawnWithFoodCheck.primaryButton,
            secondaryButtonLabel: gameText.turn2Plus.parrot.dawnWithFoodCheck.secondaryButton,
            showUndo: true,
          },
        },
        {
          remainingParrotActions,
        }
      );

      currentStep =
        dawnChoice.action === 'primary' ? 'parrot.foodChoice' : 'parrot.observeSurroundings';

      continue;
    }

    if (currentStep === 'parrot.foodChoice') {
      const foodChoice = await showCheckpointScreen(
        'parrot.foodChoice',
        {
          type: 'top-message-lower-button-cards',
          content: gameText.turn2Plus.parrot.foodChoice,
          props: {
            showUndo: true,
            cards: gameText.turn2Plus.parrot.foodChoice.cards.map((card) => ({
              ...card,
              id: card.title,
            })),
          },
        },
        {
          remainingParrotActions,
        }
      );

      if (foodChoice.action === 'card' && foodChoice.cardId === 'Cacahuète') {
        remainingParrotActions += 1;
        currentStep = 'parrot.dawnIntro';
      } else {
        currentStep = 'parrot.observeSurroundings';
      }

      continue;
    }

    if (currentStep === 'parrot.observeSurroundings') {
      const choice = await showCheckpointScreen(
        'parrot.observeSurroundings',
        {
          type: 'top-message-lower-button',
          props: {
            primaryButtonLabel: gameText.turn1.parrot.observeSurroundings.primaryButton,
            secondaryButtonLabel: isFirstTurn ? undefined : 'Poser une tile',
            showUndo: true,
            primaryButtonOnClick: () => {
              gameState.entitiesVisible = true;
              resolveScreen({ action: 'primary' });
            },
          },
        },
        {
          remainingParrotActions,
        }
      );

      if (choice.action === 'primary') {
        shouldWaitForMapReveal = true;
        remainingParrotActions = Math.max(remainingParrotActions - 1, 0);
        currentStep = 'parrot.lookAroundTimer';
      } else {
        remainingParrotActions = Math.max(remainingParrotActions - 1, 0);
        currentStep = 'parrot.helpCrew';
      }

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
        currentStep = remainingParrotActions > 0 ? 'parrot.observeSurroundings' : undefined;
      }

      continue;
    }

    if (currentStep === 'parrot.helpCrew') {
      await showCheckpointScreen(
        'parrot.helpCrew',
        {
          type: 'full-message-button',
          content: gameText.turn1.parrot.helpCrew,
          props: {
            primaryButtonLabel: gameText.turn1.parrot.helpCrew.primaryButton,
          },
        },
        {
          remainingParrotActions,
        }
      );

      if (isFirstTurn) {
        return;
      }

      currentStep = remainingParrotActions > 0 ? 'parrot.observeSurroundings' : undefined;

      continue;
    }

    return;
  }
}
