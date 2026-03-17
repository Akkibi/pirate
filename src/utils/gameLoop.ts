/* eslint-disable @typescript-eslint/no-explicit-any */
import { gameText } from '../content/gameText';
import { gameEvents, type GameEvents } from '../events/gameEvents';
import { gameState } from './gameStore';
import {
  peekSavedGameProgress,
  popSavedGameProgress,
  restoreGameProgress,
  restoreSavedGameProgress,
  saveGameProgress,
  type GameCheckpoint,
  type GameProgressData,
  type SavedGameProgress,
} from './gameProgress';
import { resolveScreen, showScreen, type UIScreen, type UIScreenResult } from './uiFlowStore';

type IntroCheckpoint = 'intro.gameStart' | 'intro.boatPlacement';
type ParrotCheckpoint =
  | 'parrot.dawnIntro'
  | 'parrot.observeSurroundings'
  | 'parrot.lookAroundTimer'
  | 'parrot.helpCrew';
type CrewCheckpoint =
  | 'crew.morningIntro'
  | 'crew.diceRoll'
  | 'crew.cardChoice'
  | 'crew.afternoonIntro'
  | 'crew.directionConfirm'
  | 'crew.nightFalls';

class UndoNavigationError extends Error {
  constructor() {
    super('Undo navigation handled');
  }
}

export class GameLoop {
  private skipNextHistoryPushFor: GameCheckpoint | null = null;

  async startTurn(): Promise<void> {
    try {
      gameState.turnCount++;

      gameState.entitiesVisible = false;

      if (gameState.turnCount === 1) {
        await this.introGame();
      }

      gameState.currentPhase = 'parrot';
      await this.parrotTurn();

      gameState.currentPhase = 'crew';
      await this.crewTurn();

      return this.startTurn();
    } catch (error) {
      if (error instanceof UndoNavigationError) {
        return;
      }

      throw error;
    }
  }

  async resumeFromSavedProgress() {
    const savedProgress = restoreSavedGameProgress();

    if (!savedProgress) {
      return this.startTurn();
    }

    this.skipNextHistoryPushFor = savedProgress.checkpoint;

    try {
      await this.runFromHistoryEntryToTurnEnd(savedProgress);
      return this.startTurn();
    } catch (error) {
      if (error instanceof UndoNavigationError) {
        return;
      }

      throw error;
    }
  }

  waitForEvent<K extends keyof GameEvents>(event: K, fn?: () => void): Promise<GameEvents[K]> {
    return new Promise((resolve) => {
      const handler = (payload: GameEvents[K]) => {
        if (fn) fn();
        console.log('received', event);
        gameEvents.off(event as any, handler);
        resolve(payload);
      };
      gameEvents.on(event as any, handler);
    });
  }

  private async runFromHistoryEntryToTurnEnd(entry: SavedGameProgress): Promise<void> {
    switch (entry.checkpoint) {
      case 'intro.gameStart':
      case 'intro.boatPlacement':
        await this.introGame(entry.checkpoint);
        gameState.currentPhase = 'parrot';
        await this.parrotTurn();
        gameState.currentPhase = 'crew';
        await this.crewTurn();
        return;

      case 'parrot.dawnIntro':
      case 'parrot.observeSurroundings':
      case 'parrot.lookAroundTimer':
      case 'parrot.helpCrew':
        gameState.currentPhase = 'parrot';
        await this.parrotTurn(entry.checkpoint);
        gameState.currentPhase = 'crew';
        await this.crewTurn();
        return;

      case 'crew.morningIntro':
      case 'crew.diceRoll':
      case 'crew.cardChoice':
      case 'crew.afternoonIntro':
      case 'crew.directionConfirm':
        gameState.currentPhase = 'crew';
        await this.crewTurn(
          entry.checkpoint,
          entry.checkpoint === 'crew.diceRoll' || entry.checkpoint === 'crew.cardChoice'
            ? entry.data
            : undefined
        );
        return;
    }
  }

  private async showCheckpointScreen(
    checkpoint: GameCheckpoint,
    screen: UIScreen,
    data?: GameProgressData
  ): Promise<UIScreenResult> {
    const shouldPushHistory = this.skipNextHistoryPushFor !== checkpoint;

    if (shouldPushHistory) {
      saveGameProgress(checkpoint, data);
    } else {
      this.skipNextHistoryPushFor = null;
    }

    const result = await showScreen(screen);

    if (result.action === 'undo') {
      await this.undoToPreviousScreen();
      throw new UndoNavigationError();
    }

    return result;
  }

  private async undoToPreviousScreen(): Promise<void> {
    popSavedGameProgress();

    const previousProgress = peekSavedGameProgress();

    if (!previousProgress) {
      return;
    }

    restoreGameProgress(previousProgress);
    this.skipNextHistoryPushFor = previousProgress.checkpoint;

    try {
      await this.runFromHistoryEntryToTurnEnd(previousProgress);
      await this.startTurn();
    } catch (error) {
      if (error instanceof UndoNavigationError) {
        return;
      }

      throw error;
    }
  }

  private async introGame(startAt: IntroCheckpoint = 'intro.gameStart'): Promise<void> {
    if (startAt === 'intro.gameStart') {
      await this.showCheckpointScreen('intro.gameStart', {
        type: 'full-message-button',
        content: gameText.setup.gameStart,
        props: {
          primaryButtonLabel: gameText.setup.gameStart.primaryButton,
        },
      });
    }

    const boatStartPosition = gameState.userPosition;

    await this.showCheckpointScreen('intro.boatPlacement', {
      type: 'full-message-button',
      content: {
        ...gameText.setup.boatPlacement,
        title: `${gameText.setup.boatPlacement.title}
          ${boatStartPosition.x},
          ${boatStartPosition.y}`,
      },
      props: {
        primaryButtonLabel: gameText.setup.boatPlacement.primaryButton,
      },
    });
  }

  private async parrotTurn(startAt: ParrotCheckpoint = 'parrot.dawnIntro'): Promise<void> {
    if (startAt === 'parrot.dawnIntro') {
      await this.showCheckpointScreen('parrot.dawnIntro', {
        type: 'full-message-button',
        content: gameText.turn1.parrot.dawnIntro,
        props: {
          primaryButtonLabel: 'Suivant',
          showUndo: true,
        },
      });
      startAt = 'parrot.observeSurroundings';
    }

    if (startAt === 'parrot.observeSurroundings') {
      await this.showCheckpointScreen('parrot.observeSurroundings', {
        type: 'top-message-lower-button',
        props: {
          primaryButtonLabel: gameText.turn1.parrot.observeSurroundings.primaryButton,
          showUndo: true,
          primaryButtonOnClick: () => {
            gameState.entitiesVisible = true;
            resolveScreen({ action: 'primary' });
          },
        },
      });
      startAt = 'parrot.lookAroundTimer';
    }

    if (startAt === 'parrot.lookAroundTimer') {
      await this.showCheckpointScreen('parrot.lookAroundTimer', {
        type: 'looking-around-timer',
        props: {
          onComplete: () => {
            gameState.entitiesVisible = false;
            resolveScreen({ action: 'timer-complete' });
          },
          replayKey: true,
        },
      });
    }

    await this.showCheckpointScreen('parrot.helpCrew', {
      type: 'full-message-button',
      content: gameText.turn1.parrot.helpCrew,
      props: {
        primaryButtonLabel: gameText.turn1.parrot.helpCrew.primaryButton,
      },
    });
  }

  private getAdjustedDiceResult(step: 1 | -1): number {
    const currentValue = gameState.diceResult ?? 0;
    const nextValue = currentValue + step;

    if (nextValue < 0) {
      return currentValue;
    }

    return Math.min(3, nextValue);
  }

  private async diceCardsOptions(options?: {
    throwDice?: boolean;
    resultValue?: number;
    resumeFrom?: 'crew.diceRoll' | 'crew.cardChoice';
  }): Promise<void> {
    const crewText = gameState.turnCount === 1 ? gameText.turn1.crew : gameText.turn2Plus.crew;

    if (options?.resumeFrom !== 'crew.cardChoice') {
      const choice = await this.showCheckpointScreen(
        'crew.diceRoll',
        {
          type: 'top-message-lower-button-dice',
          content: crewText.diceRoll,
          props: {
            throwDice: options?.throwDice ?? true,
            resultValue: options?.resultValue,
            showUndo: true,
            primaryButtonLabel: crewText.afterRoll.primaryButton,
            secondaryButtonLabel: crewText.afterRoll.secondaryButton,
          },
        },
        {
          throwDice: options?.throwDice ?? true,
          resultValue: options?.resultValue,
        }
      );

      if (choice.action !== 'secondary') {
        return;
      }
    }

    while (true) {
      const cardChoice = await this.showCheckpointScreen('crew.cardChoice', {
        type: 'top-message-lower-button-cards',
        content: crewText.chooseCard,
        props: {
          showUndo: true,
          cards: crewText.chooseCard.cards.map((card) => ({
            ...card,
            id: card.title,
          })),
        },
      });

      if (cardChoice.action !== 'card') {
        continue;
      }

      if (cardChoice.cardId === 'Coup de burst') {
        gameState.diceResult = this.getAdjustedDiceResult(1);
        return this.diceCardsOptions({
          throwDice: false,
          resultValue: gameState.diceResult,
        });
      }

      if (cardChoice.cardId === 'Accalmie') {
        gameState.diceResult = this.getAdjustedDiceResult(-1);
        return this.diceCardsOptions({
          throwDice: false,
          resultValue: gameState.diceResult,
        });
      }

      return this.diceCardsOptions({ throwDice: true });
    }
  }

  private async crewTurn(
    startAt: CrewCheckpoint = 'crew.morningIntro',
    diceOptions?: GameProgressData
  ): Promise<void> {
    const crewText = gameState.turnCount === 1 ? gameText.turn1.crew : gameText.turn2Plus.crew;

    if (startAt === 'crew.morningIntro') {
      await this.showCheckpointScreen('crew.morningIntro', {
        type: 'full-message-button',
        content: crewText.morningIntro,
        props: {
          primaryButtonLabel: 'Lancer les dés!',
          //   showUndo: true,
        },
      });
      startAt = 'crew.diceRoll';
    }

    if (startAt === 'crew.diceRoll' || startAt === 'crew.cardChoice') {
      await this.diceCardsOptions({
        throwDice: diceOptions?.throwDice,
        resultValue: diceOptions?.resultValue,
        resumeFrom: startAt === 'crew.cardChoice' ? 'crew.cardChoice' : 'crew.diceRoll',
      });
      startAt = 'crew.afternoonIntro';
    }

    if (startAt === 'crew.afternoonIntro') {
      const moves = gameState.diceResult ?? 0;
      for (let i = 0; i < moves; i++) {
        gameState.displayArrows = true;

        this.showCheckpointScreen('crew.afternoonIntro', {
          type: 'top-message-lower-button',
          content: {
            ...crewText.afternoonIntro,
            body: `T'as encore ${moves - i} mouvements`,
          },
          props: {},
        });

        const res = await this.waitForEvent('crew:arrow_click');

        await this.showCheckpointScreen('crew.directionConfirm', {
          type: 'top-message-lower-button',
          content: {
            ...crewText.directionConfirm,
            body: `T'as encore ${moves - i} mouvements`,
          },
          props: {
            showUndo: true,
            primaryButtonLabel: 'Confirm',
            primaryButtonOnClick: () => {
              gameEvents.emit('crew:move_confirmation', {
                direction: res.direction,
              });
              resolveScreen({ action: 'primary' });
            },
            undoLabel: 'Change Direction',
          },
        });
        startAt = 'crew.directionConfirm';
        gameState.displayArrows = false;
      }
    }

    if (startAt === 'crew.nightFalls') {
      await this.showCheckpointScreen('crew.nightFalls', {
        type: 'top-message-lower-button',
        content: crewText.nightFalls,
        props: {
          showUndo: true,
          secondaryButtonLabel: 'Suivant',
        },
      });
    }
  }
}
