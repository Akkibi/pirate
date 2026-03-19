/* eslint-disable @typescript-eslint/no-explicit-any */
import { watch } from 'vue';
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
import { showScreen, type UIScreen, type UIScreenResult } from './uiFlowStore';
import { runParrotTurn, type ParrotCheckpoint } from './gameLoopParrotTurn';
import { runCrewTurn, type CrewCheckpoint } from './gameLoopCrewTurn';

type IntroCheckpoint = 'intro.gameStart' | 'intro.boatPlacement';

class UndoNavigationError extends Error {
  constructor() {
    super('Undo navigation handled');
  }
}

export class GameLoop {
  private skipNextHistoryPushFor: GameCheckpoint | null = null;

  initWatchers = () => {
    watch(
      () => gameState.diceResult,
      (res) => {
        console.log('diceResult', res);
      },
      { deep: true }
    );
  };

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

  private saveCheckpointHistory(checkpoint: GameCheckpoint, data?: GameProgressData): void {
    const shouldPushHistory = this.skipNextHistoryPushFor !== checkpoint;

    if (shouldPushHistory) {
      saveGameProgress(checkpoint, data);
      return;
    }

    this.skipNextHistoryPushFor = null;
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
      case 'parrot.foodChoice':
      case 'parrot.observeSurroundings':
      case 'parrot.lookAroundTimer':
      case 'parrot.helpCrew':
        gameState.currentPhase = 'parrot';
        await this.parrotTurn(entry.checkpoint, entry.data);
        gameState.currentPhase = 'crew';
        await this.crewTurn();
        return;

      case 'crew.morningIntro':
      case 'crew.diceRoll':
      case 'crew.cardChoice':
      case 'crew.afternoonIntro':
      case 'crew.directionConfirm':
      case 'crew.revealCalmSea':
      case 'crew.revealEncounter':
      case 'crew.revealDefenseCards':
      case 'crew.revealIsland':
      case 'crew.nightFalls':
        gameState.currentPhase = 'crew';
        await this.crewTurn(entry.checkpoint, entry.data);
        return;
    }
  }

  private async showCheckpointScreen(
    checkpoint: GameCheckpoint,
    screen: UIScreen,
    data?: GameProgressData
  ): Promise<UIScreenResult> {
    const isCardsScreen = screen.type === 'top-message-lower-button-cards';

    if (!isCardsScreen) {
      this.saveCheckpointHistory(checkpoint, data);
    }

    const result = await showScreen(screen);

    if (result.action === 'undo') {
      await this.undoToPreviousScreen({
        popCurrentCheckpoint: !isCardsScreen,
        restorePreviousProgress: !isCardsScreen,
      });
      throw new UndoNavigationError();
    }

    return result;
  }

  private async undoToPreviousScreen(options?: {
    popCurrentCheckpoint?: boolean;
    restorePreviousProgress?: boolean;
  }): Promise<void> {
    if (options?.popCurrentCheckpoint ?? true) {
      popSavedGameProgress();
    }

    const previousProgress = peekSavedGameProgress();

    if (!previousProgress) {
      return;
    }

    if (options?.restorePreviousProgress ?? true) {
      restoreGameProgress(previousProgress);
    }
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
          ${'ABCDEFG'[boatStartPosition.x]},
          ${boatStartPosition.y + 1}`,
      },
      props: {
        primaryButtonLabel: gameText.setup.boatPlacement.primaryButton,
      },
    });
  }

  private async parrotTurn(
    startAt: ParrotCheckpoint = 'parrot.dawnIntro',
    progressData?: GameProgressData
  ): Promise<void> {
    await runParrotTurn({
      showCheckpointScreen: this.showCheckpointScreen.bind(this),
      waitForEvent: this.waitForEvent.bind(this),
      startAt,
      progressData,
    });
  }

  private async crewTurn(
    startAt: CrewCheckpoint = 'crew.morningIntro',
    progressData?: GameProgressData
  ): Promise<void> {
    await runCrewTurn({
      showCheckpointScreen: this.showCheckpointScreen.bind(this),
      waitForEvent: this.waitForEvent.bind(this),
      saveCheckpointHistory: this.saveCheckpointHistory.bind(this),
      startAt,
      progressData,
    });
  }
}
