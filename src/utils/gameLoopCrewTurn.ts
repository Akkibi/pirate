import { gameText } from '../content/gameText';
import { gameEvents, type GameEvents } from '../events/gameEvents';
import { gameState, getBoardTileStateAtPosition, type BoardTileState } from './gameStore';
import { type GameCheckpoint, type GameProgressData } from './gameProgress';
import { resolveScreen, showScreen, type UIScreen, type UIScreenResult } from './uiFlowStore';

export type CrewCheckpoint =
  | 'crew.morningIntro'
  | 'crew.diceRoll'
  | 'crew.cardChoice'
  | 'crew.afternoonIntro'
  | 'crew.directionConfirm'
  | 'crew.revealCalmSea'
  | 'crew.revealEncounter'
  | 'crew.revealDefenseCards'
  | 'crew.revealIsland'
  | 'crew.nightFalls';

type CrewMovementCheckpoint =
  | 'crew.afternoonIntro'
  | 'crew.directionConfirm'
  | 'crew.revealCalmSea'
  | 'crew.revealEncounter'
  | 'crew.revealDefenseCards'
  | 'crew.revealIsland';

type ShowCheckpointScreen = (
  checkpoint: GameCheckpoint,
  screen: UIScreen,
  data?: GameProgressData
) => Promise<UIScreenResult>;

type WaitForEvent = <K extends keyof GameEvents>(
  event: K,
  fn?: () => void
) => Promise<GameEvents[K]>;

interface RunCrewTurnOptions {
  showCheckpointScreen: ShowCheckpointScreen;
  waitForEvent: WaitForEvent;
  saveCheckpointHistory: (checkpoint: GameCheckpoint, data?: GameProgressData) => void;
  startAt?: CrewCheckpoint;
  progressData?: GameProgressData;
}

function getAdjustedDiceResult(step: 1 | -1): number {
  const currentValue = gameState.diceResult ?? 0;
  const nextValue = currentValue + step;

  if (nextValue < 0) {
    return currentValue;
  }

  return Math.min(3, nextValue);
}

function getCrewText() {
  return gameState.turnCount === 1 ? gameText.turn1.crew : gameText.turn2Plus.crew;
}

function isCrewMovementCheckpoint(
  checkpoint: CrewCheckpoint
): checkpoint is CrewMovementCheckpoint {
  return (
    checkpoint !== 'crew.morningIntro' &&
    checkpoint !== 'crew.diceRoll' &&
    checkpoint !== 'crew.cardChoice' &&
    checkpoint !== 'crew.nightFalls'
  );
}

function getTileRevealCheckpoint(
  tileState: BoardTileState
): Extract<
  CrewMovementCheckpoint,
  'crew.revealCalmSea' | 'crew.revealEncounter' | 'crew.revealIsland'
> {
  if (tileState === 'water') {
    return 'crew.revealCalmSea';
  }

  if (tileState === 'island') {
    return 'crew.revealIsland';
  }

  return 'crew.revealEncounter';
}

function getTileRevealLabel(tileState: BoardTileState): string {
  switch (tileState) {
    case 'monster':
      return 'monstre';
    case 'typhon':
      return 'typhon';
    case 'island':
      return 'île';
    default:
      return 'mer calme';
  }
}

function getCurrentTileState(): BoardTileState {
  return getBoardTileStateAtPosition(gameState.userPosition) ?? 'water';
}

async function diceCardsOptions(
  showCheckpointScreen: ShowCheckpointScreen,
  options?: {
    throwDice?: boolean;
    resultValue?: number;
    resumeFrom?: 'crew.diceRoll' | 'crew.cardChoice';
  }
): Promise<void> {
  const crewText = getCrewText();

  if (options?.resumeFrom !== 'crew.cardChoice') {
    const choice = await showCheckpointScreen(
      'crew.diceRoll',
      {
        type: 'top-message-lower-button-dice',
        content: crewText.diceRoll,
        props: {
          throwDice: options?.throwDice ?? true,
          resultValue: options?.resultValue,
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
    const cardChoice = await showCheckpointScreen('crew.cardChoice', {
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

    if (cardChoice.action === 'undo') {
      break;
    }

    if (cardChoice.action !== 'card') {
      continue;
    }

    if (cardChoice.cardId === 'Coup de burst') {
      gameState.diceResult = getAdjustedDiceResult(1);
      return diceCardsOptions(showCheckpointScreen, {
        throwDice: false,
        resultValue: gameState.diceResult,
      });
    }

    if (cardChoice.cardId === 'Accalmie') {
      gameState.diceResult = getAdjustedDiceResult(-1);
      return diceCardsOptions(showCheckpointScreen, {
        throwDice: false,
        resultValue: gameState.diceResult,
      });
    }

    return diceCardsOptions(showCheckpointScreen, { throwDice: true });
  }
}

async function waitForCrewDirectionSelection(
  saveCheckpointHistory: RunCrewTurnOptions['saveCheckpointHistory'],
  waitForEvent: WaitForEvent,
  remainingMoves: number
): Promise<string> {
  const crewText = getCrewText();

  gameState.displayArrows = true;
  saveCheckpointHistory('crew.afternoonIntro', { remainingMoves });

  const screenPromise = showScreen({
    type: 'top-message-lower-button',
    content: {
      ...crewText.afternoonIntro,
      body: `T'as encore ${remainingMoves} mouvements`,
    },
    props: {},
  });

  const arrowSelection = await waitForEvent('crew:arrow_click', () => {
    resolveScreen({ action: 'primary' });
  });

  await screenPromise;

  return arrowSelection.direction;
}

async function handleCrewTileReveal(
  showCheckpointScreen: ShowCheckpointScreen,
  startAt: Extract<
    CrewMovementCheckpoint,
    'crew.revealCalmSea' | 'crew.revealEncounter' | 'crew.revealDefenseCards' | 'crew.revealIsland'
  >,
  remainingMoves: number,
  tileState: BoardTileState
): Promise<{ remainingMoves: number; endTurn: boolean }> {
  if (startAt === 'crew.revealCalmSea') {
    await showCheckpointScreen(
      'crew.revealCalmSea',
      {
        type: 'top-message-lower-button',
        content: gameText.reveal.calmSea,
        props: {
          primaryButtonLabel: gameText.reveal.calmSea.primaryButton,
        },
      },
      {
        remainingMoves,
        tileState,
      }
    );

    return {
      remainingMoves,
      endTurn: remainingMoves <= 0,
    };
  }

  if (startAt === 'crew.revealIsland') {
    await showCheckpointScreen(
      'crew.revealIsland',
      {
        type: 'top-message-lower-button',
        content: gameText.reveal.island,
        props: {
          primaryButtonLabel: gameText.reveal.island.primaryButton,
        },
      },
      {
        remainingMoves,
        tileState,
      }
    );

    return {
      remainingMoves,
      endTurn: remainingMoves <= 0,
    };
  }

  if (startAt === 'crew.revealEncounter') {
    const encounterChoice = await showCheckpointScreen(
      'crew.revealEncounter',
      {
        type: 'top-message-lower-button',
        content: {
          ...gameText.reveal.encounterGeneric,
          title: gameText.reveal.encounterGeneric.title.replace(
            'XX',
            getTileRevealLabel(tileState)
          ),
        },
        props: {
          primaryButtonLabel: gameText.reveal.encounterGeneric.primaryButton,
          secondaryButtonLabel: gameText.reveal.encounterGeneric.secondaryButton,
        },
      },
      {
        remainingMoves,
        tileState,
      }
    );

    if (encounterChoice.action !== 'primary') {
      return {
        remainingMoves,
        endTurn: remainingMoves <= 0,
      };
    }
  }

  const defenseText =
    tileState === 'monster' ? gameText.reveal.encounterMonster : gameText.reveal.encounterTyphoon;

  await showCheckpointScreen(
    'crew.revealDefenseCards',
    {
      type: 'top-message-lower-button-cards',
      content: defenseText,
      props: {
        showUndo: true,
        secondaryButtonLabel: defenseText.secondaryButton,
        cards: defenseText.cards.map((card) => ({
          ...card,
          id: card.title,
        })),
      },
    },
    {
      remainingMoves,
      tileState,
    }
  );

  return {
    remainingMoves,
    endTurn: remainingMoves <= 0,
  };
}

async function runCrewMovementPhase(
  showCheckpointScreen: ShowCheckpointScreen,
  waitForEvent: WaitForEvent,
  saveCheckpointHistory: RunCrewTurnOptions['saveCheckpointHistory'],
  startAt: CrewMovementCheckpoint,
  progressData?: GameProgressData
): Promise<{ remainingMoves: number; endTurn: boolean }> {
  let remainingMoves = progressData?.remainingMoves ?? gameState.diceResult ?? 0;
  let direction = progressData?.direction;
  let tileState = progressData?.tileState;

  if (remainingMoves <= 0 && startAt === 'crew.afternoonIntro') {
    return {
      remainingMoves: 0,
      endTurn: true,
    };
  }

  if (startAt === 'crew.afternoonIntro') {
    direction = await waitForCrewDirectionSelection(
      saveCheckpointHistory,
      waitForEvent,
      remainingMoves
    );
    startAt = 'crew.directionConfirm';
  }

  if (startAt === 'crew.directionConfirm') {
    if (!direction) {
      return runCrewMovementPhase(
        showCheckpointScreen,
        waitForEvent,
        saveCheckpointHistory,
        'crew.afternoonIntro',
        {
          remainingMoves,
        }
      );
    }

    await showCheckpointScreen(
      'crew.directionConfirm',
      {
        type: 'top-message-lower-button',
        content: {
          ...getCrewText().directionConfirm,
          body: `T'as encore ${remainingMoves} mouvements`,
        },
        props: {
          showUndo: true,
          primaryButtonLabel: getCrewText().directionConfirm.primaryButton,
          primaryButtonOnClick: () => {
            gameEvents.emit('crew:move_confirmation', {
              direction,
            });
            resolveScreen({ action: 'primary' });
          },
        },
      },
      {
        remainingMoves,
        direction,
      }
    );

    gameState.displayArrows = false;
    remainingMoves = Math.max(remainingMoves - 1, 0);
    tileState = getCurrentTileState();
    startAt = getTileRevealCheckpoint(tileState);
  }

  return handleCrewTileReveal(
    showCheckpointScreen,
    startAt,
    remainingMoves,
    tileState ?? getCurrentTileState()
  );
}

export async function runCrewTurn({
  showCheckpointScreen,
  waitForEvent,
  saveCheckpointHistory,
  startAt = 'crew.morningIntro',
  progressData,
}: RunCrewTurnOptions): Promise<void> {
  const crewText = getCrewText();

  if (startAt === 'crew.morningIntro') {
    await showCheckpointScreen('crew.morningIntro', {
      type: 'full-message-button',
      content: crewText.morningIntro,
      props: {
        primaryButtonLabel: 'Lancer les dés!',
      },
    });
    startAt = 'crew.diceRoll';
  }

  if (startAt === 'crew.diceRoll' || startAt === 'crew.cardChoice') {
    console.log(gameState.diceResult);
    await diceCardsOptions(showCheckpointScreen, {
      throwDice: gameState.diceResult ? false : progressData?.throwDice,
      resultValue: progressData?.resultValue,
      resumeFrom: startAt === 'crew.cardChoice' ? 'crew.cardChoice' : 'crew.diceRoll',
    });
    startAt = 'crew.afternoonIntro';
    progressData = undefined;
  }

  if (isCrewMovementCheckpoint(startAt)) {
    let movementCheckpoint = startAt;
    let movementData = progressData;
    let shouldEndTurn = false;

    while (!shouldEndTurn) {
      const movementResult = await runCrewMovementPhase(
        showCheckpointScreen,
        waitForEvent,
        saveCheckpointHistory,
        movementCheckpoint,
        movementData
      );

      shouldEndTurn = movementResult.endTurn;
      movementCheckpoint = 'crew.afternoonIntro';
      movementData = {
        remainingMoves: movementResult.remainingMoves,
      };
    }

    gameState.diceResult = null;
    startAt = 'crew.nightFalls';
  }

  if (startAt === 'crew.nightFalls') {
    await showCheckpointScreen('crew.nightFalls', {
      type: 'top-message-lower-button',
      content: crewText.nightFalls,
      props: {
        secondaryButtonLabel: 'Suivant',
      },
    });
  }
}
