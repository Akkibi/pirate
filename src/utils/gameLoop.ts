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
import { createDemoTreasureDeck, createTreasureDeck, toTreasureCardView } from './treasureCards';
import { playSound } from './soundManager';

type IntroCheckpoint =
  | 'intro.gameStart'
  | 'intro.tutorialPerroquet'
  | 'intro.tutorialEquipage'
  | 'intro.tutorialCorsaires'
  | 'intro.tutorialMiseEnPlace'
  | 'intro.difficulty'
  | 'intro.boatPlacement'
  | 'intro.initialCardChoice';

type TutorialCheckpoint = Extract<IntroCheckpoint, `intro.tutorial${string}`>;
type TutorialContentKey = 'perroquet' | 'equipage' | 'corsaires' | 'miseEnPlace';

const INTRO_TUTORIAL_SCREENS: Array<{
  checkpoint: TutorialCheckpoint;
  contentKey: TutorialContentKey;
  imageSrc: string;
}> = [
  {
    checkpoint: 'intro.tutorialPerroquet',
    contentKey: 'perroquet',
    imageSrc: '/images/perroquet.webp',
  },
  {
    checkpoint: 'intro.tutorialEquipage',
    contentKey: 'equipage',
    imageSrc: '/images/equipage.webp',
  },
  {
    checkpoint: 'intro.tutorialCorsaires',
    contentKey: 'corsaires',
    imageSrc: '/images/corsaires.webp',
  },
  {
    checkpoint: 'intro.tutorialMiseEnPlace',
    contentKey: 'miseEnPlace',
    imageSrc: '/images/mise-en-place.webp',
  },
];

function isTutorialCheckpoint(checkpoint: IntroCheckpoint): checkpoint is TutorialCheckpoint {
  return INTRO_TUTORIAL_SCREENS.some((screen) => screen.checkpoint === checkpoint);
}

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
      gameState.focusedView = false;

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
      case 'intro.tutorialPerroquet':
      case 'intro.tutorialEquipage':
      case 'intro.tutorialCorsaires':
      case 'intro.tutorialMiseEnPlace':
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
      case 'parrot.exhaustedAfterObservation':
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

    const result = await showScreen(screen, { checkpoint, data });

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

      startAt = 'intro.tutorialPerroquet';
    }

    if (isTutorialCheckpoint(startAt)) {
      startAt = await this.tutorialScreens(startAt);
    }

    if (startAt === 'intro.difficulty') {
      const difficulty = await this.showCheckpointScreen('intro.difficulty', {
        type: 'difficulty-setup',
        content: gameText.setup.difficulty,
        props: {
          initialValue: gameState.maxRhum,
          minValue: 3,
          maxValue: 9,
          primaryButtonLabel: gameText.setup.difficulty.primaryButton,
        },
      });

      if (difficulty.action === 'difficulty') {
        setRhumCapacity(difficulty.maxRhum);
        setTreasureDeck(gameState.demoMode ? createDemoTreasureDeck() : createTreasureDeck());
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
          title: `${gameText.setup.boatPlacement.title} ${formatBoardCoordinate(boatStartPosition)}`,
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

  private async tutorialScreens(startAt: TutorialCheckpoint): Promise<IntroCheckpoint> {
    const startIndex = Math.max(
      0,
      INTRO_TUTORIAL_SCREENS.findIndex((screen) => screen.checkpoint === startAt)
    );

    for (const tutorialScreen of INTRO_TUTORIAL_SCREENS.slice(startIndex)) {
      const content = gameText.tutorial[tutorialScreen.contentKey];
      const result = await this.showCheckpointScreen(tutorialScreen.checkpoint, {
        type: 'tutorial',
        content,
        props: {
          imageSrc: tutorialScreen.imageSrc,
          imageAlt: content.title,
          primaryButtonLabel: gameText.tutorial.nextButton,
          secondaryButtonLabel: gameText.tutorial.skipButton,
        },
      });

      if (result.action === 'secondary') {
        return 'intro.difficulty';
      }
    }

    return 'intro.difficulty';
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
      content: gameText.setup.initialCardChoice,
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
    const elapsedLabel = `${elapsedMinutes.toString().padStart(2, '0')}m${elapsedSeconds
      .toString()
      .padStart(2, '0')}s`;
    const rhumConsumedUnit =
      gameState.rhumConsumed > 1
        ? gameText.units.rhumBottlePlural
        : gameText.units.rhumBottleSingular;
    const rhumConsumedLabel = `${gameState.rhumConsumed} ${rhumConsumedUnit}`;
    const resultStats = [
      {
        label: gameText.gameOver.elapsedTimeLabel,
        value: elapsedLabel,
      },
      {
        label: gameText.gameOver.rhumConsumedLabel,
        value: rhumConsumedLabel,
      },
    ];
    const resultContent =
      gameState.gameResult === 'won'
        ? {
            title: gameText.gameOver.wonTitle,
            body: gameText.gameOver.wonBody,
            stats: resultStats,
          }
        : gameState.gameResult === 'lost-corsair'
          ? {
              title: gameText.gameOver.lostTitle,
              body: gameText.gameOver.lostCorsairBody,
              stats: resultStats,
            }
          : {
              title: gameText.gameOver.lostTitle,
              body: gameText.gameOver.lostRhumBody,
              stats: resultStats,
            };

    const gameOverAction = await this.showCheckpointScreen('gameOver', {
      type: 'full-message-button',
      content: resultContent,
      props: {
        primaryButtonLabel: gameText.gameOver.revealMapButton,
        secondaryButtonLabel: gameText.gameOver.primaryButton,
      },
    });

    if (gameOverAction.action === 'primary') {
      gameState.revealMap = true;
      gameState.focusedView = true;
      gameState.displayCorsair = true;
      gameState.cameraFocusPosition = null;

      await showScreen({
        type: 'full-message-button',
        props: {
          showParchment: false,
          primaryButtonLabel: gameText.gameOver.primaryButton,
          primaryButtonOnLastRow: true,
        },
      });
    }

    clearSavedGameProgress();
    resetGameState();

    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }
}
