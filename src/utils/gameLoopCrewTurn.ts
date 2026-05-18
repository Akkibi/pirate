import { gameText } from '../content/gameText';
import { type GameEvents } from '../events/gameEvents';
import {
  addTreasureCardsToHand,
  discardTreasureCard,
  discardTreasureCards,
  drawTreasureCards,
  gainRhum,
  gameState,
  getBoardTileStateAtPosition,
  isIslandExhausted,
  markIslandExhausted,
  removeTreasureCardFromHand,
  setBoardTileStateAtPosition,
  spendRhum,
  type BoardTileState,
} from './gameStore';
import { type GameCheckpoint, type GameProgressData } from './gameProgress';
import {
  resolveScreen,
  showScreen,
  type ScreenChrome,
  type UIScreen,
  type UIScreenResult,
} from './uiFlowStore';
import {
  getTreasureCardDefinition,
  toTreasureCardView,
  type TreasureCardInstance,
  type TreasurePhase,
} from './treasureCards';
import { consumeRequestedTreasureCardSelection } from './treasureCardSelection';

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
  | 'crew.revealCorsair'
  | 'crew.nightFalls';

type CrewMovementCheckpoint =
  | 'crew.afternoonIntro'
  | 'crew.directionConfirm'
  | 'crew.revealCalmSea'
  | 'crew.revealEncounter'
  | 'crew.revealDefenseCards'
  | 'crew.revealCorsair'
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

const MORNING_CHROME: ScreenChrome = {
  phase: 'matinee',
  showRhum: true,
};

const AFTERNOON_CHROME: ScreenChrome = {
  phase: 'journee',
  showRhum: true,
};

const EVENING_CHROME: ScreenChrome = {
  phase: 'soiree',
  showRhum: true,
};

function getChromeForTreasurePhase(phase: TreasurePhase): ScreenChrome {
  switch (phase) {
    case 'morning':
      return MORNING_CHROME;
    case 'afternoon':
      return AFTERNOON_CHROME;
    case 'evening':
      return EVENING_CHROME;
    case 'captain':
      return AFTERNOON_CHROME;
  }
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
  'crew.revealCalmSea' | 'crew.revealEncounter' | 'crew.revealIsland' | 'crew.revealCorsair'
> {
  if (tileState === 'water') {
    return 'crew.revealCalmSea';
  }

  if (tileState === 'island') {
    return 'crew.revealIsland';
  }

  if (tileState === 'corsair') {
    return 'crew.revealCorsair';
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
    case 'corsair':
      return 'corsaires';
    default:
      return 'mer calme';
  }
}

function getCurrentTileState(): BoardTileState {
  return getBoardTileStateAtPosition(gameState.userPosition) ?? 'water';
}

function hasUsableTreasureCards(
  phase: TreasurePhase,
  context?: {
    tileState?: BoardTileState;
  }
): boolean {
  if (gameState.usedTreasureThisTurn) {
    return false;
  }

  return gameState.crewHand.some((card) => {
    const definition = getTreasureCardDefinition(card.cardId);

    if (!definition.playable || definition.phase !== phase) {
      return false;
    }

    if (card.cardId === 'bombe-artisanale') {
      return (
        gameState.currentRhum > 0 &&
        (context?.tileState === 'monster' || context?.tileState === 'typhon')
      );
    }

    return true;
  });
}

function getTreasureCardDisabledReason(
  card: TreasureCardInstance,
  phase: TreasurePhase,
  context?: {
    tileState?: BoardTileState;
  }
): string | undefined {
  const definition = getTreasureCardDefinition(card.cardId);

  if (!definition.playable) {
    return 'Non jouable';
  }

  if (gameState.usedTreasureThisTurn) {
    return 'Deja joue ce tour';
  }

  if (definition.phase !== phase) {
    return `Jouable en ${definition.phase}`;
  }

  if (
    card.cardId === 'bombe-artisanale' &&
    context?.tileState !== 'monster' &&
    context?.tileState !== 'typhon'
  ) {
    return 'Pas de danger a eliminer';
  }

  if (card.cardId === 'bombe-artisanale' && gameState.currentRhum <= 0) {
    return 'Pas assez de rhum';
  }

  return undefined;
}

async function confirmTreasureCard(card: TreasureCardInstance): Promise<boolean> {
  const definition = getTreasureCardDefinition(card.cardId);
  const result = await showScreen({
    type: 'card-confirm',
    props: {
      chrome: getChromeForTreasurePhase(definition.phase),
      card: toTreasureCardView(card),
    },
  });

  return result.action === 'primary';
}

async function chooseTreasureCardForPhase(
  phase: TreasurePhase,
  context?: {
    title?: string;
    body?: string;
    tileState?: BoardTileState;
  }
): Promise<TreasureCardInstance | null> {
  if (gameState.crewHand.length === 0 || !hasUsableTreasureCards(phase, context)) {
    return null;
  }

  const requestedCardId = consumeRequestedTreasureCardSelection();

  if (requestedCardId !== null) {
    const requestedCard = gameState.crewHand.find((card) => card.instanceId === requestedCardId);

    if (!requestedCard || getTreasureCardDisabledReason(requestedCard, phase, context)) {
      return null;
    }

    return (await confirmTreasureCard(requestedCard)) ? requestedCard : null;
  }

  const result = await showScreen({
    type: 'top-message-lower-button-cards',
    content: {
      title: context?.title ?? 'Cartes tresor',
      body: context?.body ?? 'Choisis une carte a utiliser.',
    },
    props: {
      chrome: getChromeForTreasurePhase(phase),
      secondaryButtonLabel: 'Annuler',
      cards: gameState.crewHand.map((card) => {
        const disabledReason = getTreasureCardDisabledReason(card, phase, context);
        const view = toTreasureCardView(card, {
          disabled: Boolean(disabledReason),
          disabledReason,
        });

        return {
          id: view.id,
          title: view.title,
          caption: view.caption,
          badge: view.phaseLabel,
          disabled: view.disabled,
          disabledReason: view.disabledReason,
          imageSrc: view.imageSrc,
          imageAlt: view.imageAlt,
        };
      }),
    },
  });

  if (result.action !== 'card' || result.cardId === undefined) {
    return null;
  }

  const selectedCard = gameState.crewHand.find((card) => card.instanceId === result.cardId);

  if (!selectedCard || !(await confirmTreasureCard(selectedCard))) {
    return null;
  }

  return selectedCard;
}

function markTreasureCardUsed(card: TreasureCardInstance): void {
  const removedCard = removeTreasureCardFromHand(card.instanceId);

  if (!removedCard) {
    return;
  }

  discardTreasureCard(removedCard);
  gameState.usedTreasureThisTurn = true;
}

function eliminateCurrentDangerTile(): void {
  setBoardTileStateAtPosition(gameState.userPosition, 'water');
}

function checkRhumLoss(): boolean {
  if (gameState.currentRhum > 0) {
    return false;
  }

  gameState.gameResult = 'lost-rhum';
  return true;
}

async function resolveEquippedDefense(
  tileState: BoardTileState,
  remainingMoves: number,
  endTurn: boolean
): Promise<{ remainingMoves: number; endTurn: boolean } | null> {
  if (tileState === 'monster' && gameState.bottleTokenEquipped && gameState.cannonTokenEquipped) {
    const equipmentChoice = await showScreen({
      type: 'top-message-lower-button-cards',
      content: {
        title: 'Quel equipement utiliser ?',
        body: 'Les deux jetons peuvent reagir a ce monstre.',
      },
      props: {
        chrome: AFTERNOON_CHROME,
        cards: [
          {
            id: 'bottle',
            title: 'Bateau en bouteille',
            caption: 'Absorbe le choc. Le monstre reste sur la case.',
          },
          {
            id: 'cannon',
            title: 'Poudre a canon',
            caption: 'Elimine le monstre definitivement.',
          },
        ],
      },
    });

    if (equipmentChoice.action === 'card' && equipmentChoice.cardId === 'cannon') {
      gameState.cannonTokenEquipped = false;
      eliminateCurrentDangerTile();
      await showScreen({
        type: 'full-message-button',
        content: {
          title: 'Poudre a canon !',
          body: 'Le monstre est elimine. Aucun rhum perdu.',
        },
        props: {
          chrome: AFTERNOON_CHROME,
          primaryButtonLabel: 'Suivant',
        },
      });
    } else {
      gameState.bottleTokenEquipped = false;
      await showScreen({
        type: 'full-message-button',
        content: {
          title: 'Bateau en bouteille !',
          body: 'Le danger est absorbe. Aucun rhum perdu.',
        },
        props: {
          chrome: AFTERNOON_CHROME,
          primaryButtonLabel: 'Suivant',
        },
      });
    }

    return {
      remainingMoves,
      endTurn,
    };
  }

  if (gameState.bottleTokenEquipped) {
    gameState.bottleTokenEquipped = false;
    await showScreen({
      type: 'full-message-button',
      content: {
        title: 'Bateau en bouteille !',
        body: 'Le danger est absorbe. Aucun rhum perdu.',
      },
      props: {
        chrome: AFTERNOON_CHROME,
        primaryButtonLabel: 'Suivant',
      },
    });

    return {
      remainingMoves,
      endTurn,
    };
  }

  if (tileState === 'monster' && gameState.cannonTokenEquipped) {
    gameState.cannonTokenEquipped = false;
    eliminateCurrentDangerTile();
    await showScreen({
      type: 'full-message-button',
      content: {
        title: 'Poudre a canon !',
        body: 'Le monstre est elimine. Aucun rhum perdu.',
      },
      props: {
        chrome: AFTERNOON_CHROME,
        primaryButtonLabel: 'Suivant',
      },
    });

    return {
      remainingMoves,
      endTurn,
    };
  }

  return null;
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
    const hasMorningCard = hasUsableTreasureCards('morning');
    const chrome = hasMorningCard ? { ...MORNING_CHROME, canUseCards: true } : MORNING_CHROME;
    const choice = await showCheckpointScreen(
      'crew.diceRoll',
      {
        type: 'top-message-lower-button-dice',
        content: crewText.diceRoll,
        props: {
          chrome,
          throwDice: options?.throwDice ?? true,
          resultValue: options?.resultValue,
          primaryButtonLabel: crewText.afterRoll.primaryButton,
          secondaryButtonLabel: hasMorningCard ? crewText.afterRoll.secondaryButton : undefined,
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

  const selectedCard = await chooseTreasureCardForPhase('morning', {
    title: 'Carte de matinee',
    body: 'Tu peux jouer une seule carte tresor ce tour.',
  });

  if (!selectedCard) {
    return diceCardsOptions(showCheckpointScreen, {
      throwDice: false,
      resultValue: gameState.diceResult ?? 0,
    });
  }

  markTreasureCardUsed(selectedCard);

  if (selectedCard.cardId === 'envollee') {
    gameState.diceResult = getAdjustedDiceResult(1);
    return diceCardsOptions(showCheckpointScreen, {
      throwDice: false,
      resultValue: gameState.diceResult,
    });
  }

  if (selectedCard.cardId === 'jeter-ancre') {
    gameState.diceResult = getAdjustedDiceResult(-1);
    return diceCardsOptions(showCheckpointScreen, {
      throwDice: false,
      resultValue: gameState.diceResult,
    });
  }

  if (selectedCard.cardId === 'de-pipe') {
    gameState.diceResult = null;
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
    props: {
      chrome: AFTERNOON_CHROME,
    },
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
    | 'crew.revealCalmSea'
    | 'crew.revealEncounter'
    | 'crew.revealDefenseCards'
    | 'crew.revealIsland'
    | 'crew.revealCorsair'
  >,
  remainingMoves: number,
  tileState: BoardTileState
): Promise<{ remainingMoves: number; endTurn: boolean; gameOver?: boolean }> {
  const endTurn = remainingMoves <= 0;

  if (startAt === 'crew.revealCalmSea') {
    await showCheckpointScreen(
      'crew.revealCalmSea',
      {
        type: 'top-message-lower-button',
        content: gameText.reveal.calmSea,
        props: {
          chrome: AFTERNOON_CHROME,
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
      endTurn,
    };
  }

  if (startAt === 'crew.revealIsland') {
    if (isIslandExhausted(gameState.userPosition)) {
      await showCheckpointScreen(
        'crew.revealIsland',
        {
          type: 'top-message-lower-button',
          content: {
            title: 'Ile deja exploree',
            body: 'La cale et les tresors ont deja ete recuperes ici.',
          },
          props: {
            chrome: AFTERNOON_CHROME,
            primaryButtonLabel: 'Suivant',
          },
        },
        {
          remainingMoves,
          tileState,
        }
      );

      return {
        remainingMoves,
        endTurn,
      };
    }

    const gainedRhum = gainRhum(3);
    markIslandExhausted(gameState.userPosition);

    await showCheckpointScreen(
      'crew.revealIsland',
      {
        type: 'top-message-lower-button',
        content: {
          title: "C'est une ile ! Capitaine ?",
          body: `Tu recuperes ${gainedRhum} rhum. Choisis une carte tresor a garder.`,
        },
        props: {
          chrome: AFTERNOON_CHROME,
          primaryButtonLabel: gameText.reveal.island.primaryButton,
        },
      },
      {
        remainingMoves,
        tileState,
      }
    );

    const drawnCards = drawTreasureCards(2);
    const captainCard = drawnCards.find((card) => card.cardId === 'capitaine');

    if (captainCard) {
      gameState.gameResult = 'won';
      discardTreasureCards(drawnCards.filter((card) => card.cardId !== 'capitaine'));
      return {
        remainingMoves,
        endTurn: true,
        gameOver: true,
      };
    }

    if (drawnCards.length === 1) {
      addTreasureCardsToHand(drawnCards);
      await showScreen({
        type: 'full-message-button',
        content: {
          title: 'Tresor recupere',
          body: `${getTreasureCardDefinition(drawnCards[0]!.cardId).title} rejoint votre main.`,
        },
        props: {
          chrome: AFTERNOON_CHROME,
          primaryButtonLabel: 'Suivant',
        },
      });
    } else if (drawnCards.length > 1) {
      const choice = await showScreen({
        type: 'top-message-lower-button-cards',
        content: {
          title: 'Gardes une carte !',
          body: 'Votre capacite de transport est limitee. Une seule carte rejoint la main.',
        },
        props: {
          chrome: AFTERNOON_CHROME,
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
        choice.action === 'card'
          ? drawnCards.find((card) => card.instanceId === choice.cardId)
          : undefined;

      if (keptCard) {
        addTreasureCardsToHand([keptCard]);
        discardTreasureCards(drawnCards.filter((card) => card.instanceId !== keptCard.instanceId));
      } else {
        discardTreasureCards(drawnCards);
      }
    }

    return {
      remainingMoves,
      endTurn,
    };
  }

  if (startAt === 'crew.revealCorsair') {
    gameState.gameResult = 'lost-corsair';

    await showCheckpointScreen(
      'crew.revealCorsair',
      {
        type: 'full-message-button',
        content: gameText.reveal.corsair,
        props: {
          chrome: AFTERNOON_CHROME,
          primaryButtonLabel: gameText.reveal.corsair.primaryButton,
        },
      },
      {
        remainingMoves,
        tileState,
      }
    );

    return {
      remainingMoves,
      endTurn: true,
      gameOver: true,
    };
  }

  const equippedDefenseResult = await resolveEquippedDefense(tileState, remainingMoves, endTurn);

  if (equippedDefenseResult) {
    return equippedDefenseResult;
  }

  if (startAt === 'crew.revealEncounter') {
    const hasAfternoonCard = hasUsableTreasureCards('afternoon', { tileState });
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
          body: hasAfternoonCard ? 'Tu peux utiliser une carte.' : undefined,
        },
        props: {
          chrome: hasAfternoonCard ? { ...AFTERNOON_CHROME, canUseCards: true } : AFTERNOON_CHROME,
          primaryButtonLabel: hasAfternoonCard ? 'Utiliser une carte' : 'Suivant',
          secondaryButtonLabel: hasAfternoonCard ? 'Subir' : undefined,
        },
      },
      {
        remainingMoves,
        tileState,
      }
    );

    if (encounterChoice.action === 'primary' && hasAfternoonCard) {
      const selectedCard = await chooseTreasureCardForPhase('afternoon', {
        title: 'Carte de journee',
        body: 'La Bombe artisanale peut eliminer le danger sur cette case.',
        tileState,
      });

      if (selectedCard?.cardId === 'bombe-artisanale') {
        markTreasureCardUsed(selectedCard);
        spendRhum(1);
        eliminateCurrentDangerTile();

        await showScreen({
          type: 'full-message-button',
          content: {
            title: 'Bombe artisanale !',
            body: 'Le danger est elimine definitivement. Vous videz 1 rhum.',
          },
          props: {
            chrome: AFTERNOON_CHROME,
            primaryButtonLabel: 'Suivant',
          },
        });

        return {
          remainingMoves,
          endTurn,
          gameOver: checkRhumLoss(),
        };
      }

      return handleCrewTileReveal(
        showCheckpointScreen,
        'crew.revealEncounter',
        remainingMoves,
        tileState
      );
    }
  }

  const rhumLoss = tileState === 'monster' ? 2 : 1;
  spendRhum(rhumLoss);

  await showCheckpointScreen(
    'crew.revealDefenseCards',
    {
      type: 'top-message-lower-button',
      content: {
        title: tileState === 'monster' ? 'C’est un monstre !' : 'C’est un typhon !',
        body: `Tu perds ${rhumLoss} rhum.`,
      },
      props: {
        chrome: AFTERNOON_CHROME,
        primaryButtonLabel: 'Suivant',
      },
    },
    {
      remainingMoves,
      tileState,
    }
  );

  return {
    remainingMoves,
    endTurn,
    gameOver: checkRhumLoss(),
  };
}

function moveCrew(direction: string): void {
  switch (direction) {
    case 'left':
      gameState.userPosition.y -= 1;
      break;
    case 'right':
      gameState.userPosition.y += 1;
      break;
    case 'up':
      gameState.userPosition.x += 1;
      break;
    case 'down':
      gameState.userPosition.x -= 1;
      break;
  }
}

async function runCrewMovementPhase(
  showCheckpointScreen: ShowCheckpointScreen,
  waitForEvent: WaitForEvent,
  saveCheckpointHistory: RunCrewTurnOptions['saveCheckpointHistory'],
  startAt: CrewMovementCheckpoint,
  progressData?: GameProgressData
): Promise<{ remainingMoves: number; endTurn: boolean; gameOver?: boolean }> {
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
          chrome: AFTERNOON_CHROME,
          showUndo: true,
          primaryButtonLabel: getCrewText().directionConfirm.primaryButton,
          primaryButtonOnClick: () => {
            moveCrew(direction);
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

async function maybePlayEveningTreasureCard(): Promise<void> {
  if (!hasUsableTreasureCards('evening')) {
    return;
  }

  const prompt = await showScreen({
    type: 'top-message-lower-button',
    content: {
      title: 'La nuit tombe !',
      body: 'Tu peux utiliser une carte de soiree avant la tournee de rhum.',
    },
    props: {
      chrome: {
        ...EVENING_CHROME,
        canUseCards: true,
      },
      primaryButtonLabel: 'Utiliser une carte',
      secondaryButtonLabel: 'Boire du rhum',
    },
  });

  if (prompt.action !== 'primary') {
    return;
  }

  const selectedCard = await chooseTreasureCardForPhase('evening', {
    title: 'Carte de soiree',
    body: 'Tu peux jouer une seule carte tresor ce tour.',
  });

  if (!selectedCard) {
    return maybePlayEveningTreasureCard();
  }

  markTreasureCardUsed(selectedCard);

  if (selectedCard.cardId === 'bateau-en-bouteille') {
    gameState.bottleTokenEquipped = true;
  }

  if (selectedCard.cardId === 'poudre-a-canon') {
    gameState.cannonTokenEquipped = true;
  }

  if (selectedCard.cardId === 'cacahuete') {
    gameState.peanutTokens += 1;
  }

  if (selectedCard.cardId === 'tequilaaaa') {
    gameState.tequilaTonight = true;
  }
}

export async function runCrewTurn({
  showCheckpointScreen,
  waitForEvent,
  saveCheckpointHistory,
  startAt = 'crew.morningIntro',
  progressData,
}: RunCrewTurnOptions): Promise<boolean> {
  const crewText = getCrewText();

  if (startAt === 'crew.morningIntro') {
    await showCheckpointScreen('crew.morningIntro', {
      type: 'full-message-button',
      content: crewText.morningIntro,
      props: {
        chrome: MORNING_CHROME,
        primaryButtonLabel: 'Lancer les dés!',
      },
    });
    startAt = 'crew.diceRoll';
  }

  if (startAt === 'crew.diceRoll' || startAt === 'crew.cardChoice') {
    console.log(gameState.diceResult);
    await diceCardsOptions(showCheckpointScreen, {
      throwDice: gameState.diceResult !== null ? false : progressData?.throwDice,
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

      if (movementResult.gameOver) {
        gameState.diceResult = null;
        return true;
      }

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
    await maybePlayEveningTreasureCard();

    if (!gameState.tequilaTonight) {
      spendRhum(1);
    }

    await showCheckpointScreen('crew.nightFalls', {
      type: 'top-message-lower-button',
      content: {
        ...crewText.nightFalls,
        body: gameState.tequilaTonight
          ? 'TEQUILAAAA ! Pas de rhum consomme ce soir.'
          : `TOURNEE DE RHUM ! Il reste ${gameState.currentRhum} rhum.`,
      },
      props: {
        chrome: EVENING_CHROME,
        secondaryButtonLabel: 'Suivant',
      },
    });

    if (checkRhumLoss()) {
      gameState.diceResult = null;
      return true;
    }
  }

  return false;
}
