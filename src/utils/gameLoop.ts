/* eslint-disable @typescript-eslint/no-explicit-any */
import { watch } from 'vue';
import { gameText } from '../content/gameText';
import { gameEvents, type GameEvents } from '../events/gameEvents';
import {
  addTreasureCardsToHand,
  discardTreasureCards,
  drawTreasureCards,
  formatBoardCoordinate,
  gameState,
  resetGameState,
  setRhumCapacity,
  setTreasureDeck,
} from './gameStore';
import {
  clearSavedGameProgress,
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
import { createTreasureDeck, toTreasureCardView } from './treasureCards';
import { playSound } from './soundManager';

type IntroCheckpoint =
  | 'intro.gameStart'
  | 'intro.difficulty'
  | 'intro.boatPlacement'
  | 'intro.initialCardChoice';

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
      gameState.usedTreasureThisTurn = false;
      gameState.tequilaTonight = false;

      gameState.entitiesVisible = false;

      if (gameState.turnCount === 1) {
        await this.introGame();
      }

      gameState.currentPhase = 'parrot';
      playSound('crewToParrot');
      await this.parrotTurn();

      gameState.currentPhase = 'crew';
      playSound('parrotToCrew');
      const shouldStopGame = await this.crewTurn();

      if (shouldStopGame) {
        await this.handleGameOver();
        return;
      }

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
      const shouldStopGame = await this.runFromHistoryEntryToTurnEnd(savedProgress);

      if (shouldStopGame) {
        return;
      }

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

  private async runFromHistoryEntryToTurnEnd(entry: SavedGameProgress): Promise<boolean> {
    switch (entry.checkpoint) {
      case 'intro.gameStart':
      case 'intro.difficulty':
      case 'intro.boatPlacement':
      case 'intro.initialCardChoice':
        await this.introGame(entry.checkpoint);
        gameState.currentPhase = 'parrot';
        await this.parrotTurn();
        gameState.currentPhase = 'crew';
        if (await this.crewTurn()) {
          await this.handleGameOver();
          return true;
        }
        return false;

      case 'parrot.dawnIntro':
      case 'parrot.foodChoice':
      case 'parrot.actionChoice':
      case 'parrot.observeSurroundings':
      case 'parrot.corsairLocation':
      case 'parrot.lookAroundTimer':
      case 'parrot.helpCrew':
        gameState.currentPhase = 'parrot';
        await this.parrotTurn(entry.checkpoint, entry.data);
        gameState.currentPhase = 'crew';
        if (await this.crewTurn()) {
          await this.handleGameOver();
          return true;
        }
        return false;

      case 'crew.morningIntro':
      case 'crew.diceRoll':
      case 'crew.cardChoice':
      case 'crew.afternoonIntro':
      case 'crew.directionConfirm':
      case 'crew.revealCalmSea':
      case 'crew.revealEncounter':
      case 'crew.revealDefenseCards':
      case 'crew.revealIsland':
      case 'crew.revealCorsair':
      case 'crew.nightFalls':
        gameState.currentPhase = 'crew';
        if (await this.crewTurn(entry.checkpoint, entry.data)) {
          await this.handleGameOver();
          return true;
        }
        return false;

      case 'gameOver':
        await this.handleGameOver();
        return true;
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

      startAt = 'intro.difficulty';
    }

    if (startAt === 'intro.difficulty') {
      const difficulty = await this.showCheckpointScreen('intro.difficulty', {
        type: 'difficulty-setup',
        content: {
          title: "L'Arrachee doit charger sa cale",
          body: 'Moins de rhum rend la partie plus difficile. 6 bouteilles sont conseillees pour une premiere partie.',
        },
        props: {
          initialValue: gameState.maxRhum,
          minValue: 3,
          maxValue: 9,
        },
      });

      if (difficulty.action === 'difficulty') {
        setRhumCapacity(difficulty.maxRhum);
        setTreasureDeck(createTreasureDeck());
        gameState.gameStartedAt = Date.now();
      }

      startAt = 'intro.boatPlacement';
    }

    if (startAt === 'intro.boatPlacement') {
      const boatStartPosition = gameState.userPosition;

      await this.showCheckpointScreen('intro.boatPlacement', {
        type: 'full-message-button',
        content: {
          ...gameText.setup.boatPlacement,
          title: `${gameText.setup.boatPlacement.title}
          ${formatBoardCoordinate(boatStartPosition)}`,
        },
        props: {
          primaryButtonLabel: gameText.setup.boatPlacement.primaryButton,
        },
      });

      startAt = 'intro.initialCardChoice';
    }

    if (startAt === 'intro.initialCardChoice') {
      await this.initialCrewCardChoice();
    }
  }

  private async initialCrewCardChoice(): Promise<void> {
    if (gameState.crewHand.length > 0) {
      return;
    }

    const drawnCards = drawTreasureCards(4);

    if (drawnCards.length === 0) {
      return;
    }

    const result = await showScreen({
      type: 'top-message-lower-button-cards',
      content: {
        title: "L'equipage s'equipe",
        body: 'Choisissez une carte a ajouter a votre main. Les autres seront defaussees.',
      },
      props: {
        chrome: {
          phase: 'aurore',
          showRhum: true,
          showPeanuts: true,
        },
        cards: drawnCards.map((card) => {
          const view = toTreasureCardView(card);

          return {
            id: view.id,
            title: view.title,
            caption: view.caption,
            badge: view.phaseLabel,
            imageSrc: view.imageSrc,
            imageAlt: view.imageAlt,
          };
        }),
      },
    });

    const keptCard =
      result.action === 'card'
        ? drawnCards.find((card) => card.instanceId === result.cardId)
        : undefined;

    if (!keptCard) {
      discardTreasureCards(drawnCards);
      return;
    }

    addTreasureCardsToHand([keptCard]);
    discardTreasureCards(drawnCards.filter((card) => card.instanceId !== keptCard.instanceId));
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
  ): Promise<boolean> {
    return runCrewTurn({
      showCheckpointScreen: this.showCheckpointScreen.bind(this),
      waitForEvent: this.waitForEvent.bind(this),
      saveCheckpointHistory: this.saveCheckpointHistory.bind(this),
      startAt,
      progressData,
    });
  }

  private async handleGameOver(): Promise<void> {
    const elapsedMs = Math.max(0, Date.now() - gameState.gameStartedAt);
    const elapsedMinutes = Math.floor(elapsedMs / 60000);
    const elapsedSeconds = Math.floor((elapsedMs % 60000) / 1000);
    const elapsedLabel = `${elapsedMinutes.toString().padStart(2, '0')}:${elapsedSeconds
      .toString()
      .padStart(2, '0')}`;
    const resultContent =
      gameState.gameResult === 'won'
        ? {
            title: 'Le Capitaine a ete retrouve !',
            body: `Felicitations ! Temps de jeu ${elapsedLabel}. Rhum consomme : ${gameState.rhumConsumed}.`,
          }
        : gameState.gameResult === 'lost-corsair'
          ? {
              title: 'Vous avez perdu.',
              body: `L'equipage est capture par la fregate corsaire. Temps de jeu ${elapsedLabel}.`,
            }
          : {
              title: 'Vous avez perdu.',
              body: `L'equipage n'a plus de rhum et se revolte. Temps de jeu ${elapsedLabel}. Rhum consomme : ${gameState.rhumConsumed}.`,
            };

    await this.showCheckpointScreen('gameOver', {
      type: 'full-message-button',
      content: resultContent,
      props: {
        primaryButtonLabel: gameText.gameOver.primaryButton,
      },
    });

    clearSavedGameProgress();
    resetGameState();

    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }
}
