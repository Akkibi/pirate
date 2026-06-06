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
  isSameBoardPosition,
  isIslandExhausted,
  markIslandExhausted,
  moveCorsairOneStep,
  moveUserPosition,
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
  getTreasurePhaseLabel,
  toTreasureCardView,
  type TreasureCardInstance,
  type TreasurePhase,
} from './treasureCards';
import {
  consumeRequestedTreasureCardSelection,
  hasRequestedTreasureCardSelection,
} from './treasureCardSelection';
import { playSound } from './soundManager';

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

function formatRemainingMoves(count: number): string {
  return `Il te reste ${count} mouvement${count > 1 ? 's' : ''}.`;
}

function formatRhumBottleCount(count: number): string {
  return `${count} bouteille${Math.abs(count) > 1 ? 's' : ''} de rhum`;
}

function getCrewText() {
  return gameState.turnCount === 1 ? gameText.turn1.crew : gameText.turn2Plus.crew;
}

function getTreasurePhaseCardTitle(phase: TreasurePhase): string {
  return `${gameText.cards.usePhaseTitlePrefix} ${getTreasurePhaseLabel(phase)}`;
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
  if (isSameBoardPosition(gameState.userPosition, gameState.corsairPosition)) {
    return 'corsair';
  }

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
    return 'Déjà jouée ce tour';
  }

  if (definition.phase !== phase) {
    return `Jouable en ${getTreasurePhaseLabel(definition.phase)}`;
  }

  if (
    card.cardId === 'bombe-artisanale' &&
    context?.tileState !== 'monster' &&
    context?.tileState !== 'typhon'
  ) {
    return 'Pas de danger à éliminer';
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
  },
  options?: {
    allowManualChoice?: boolean;
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

  if (options?.allowManualChoice === false) {
    return null;
  }

  const result = await showScreen({
    type: 'top-message-lower-button-cards',
    content: {
      title: context?.title ?? getTreasurePhaseCardTitle(phase),
      body: context?.body ?? gameText.cards.usePhaseBody,
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
  playSound('rhumDefeat');
  return true;
}

function getEquippedDefenseRevealBody(tileState: BoardTileState): string | undefined {
  if (tileState === 'typhon' && gameState.bottleTokenEquipped) {
    return gameText.reveal.typhoon.bottleBody;
  }

  if (tileState !== 'monster') {
    return undefined;
  }

  const equippedBodies: string[] = [];

  if (gameState.bottleTokenEquipped) {
    equippedBodies.push(gameText.reveal.monster.bottleBody);
  }

  if (gameState.cannonTokenEquipped) {
    equippedBodies.push(gameText.reveal.monster.cannonBody);
  }

  return equippedBodies.length > 0 ? equippedBodies.join(' ') : undefined;
}

function getEncounterTitle(tileState: BoardTileState): string {
  return tileState === 'monster' ? gameText.reveal.monster.title : gameText.reveal.typhoon.title;
}

function getEncounterBody(tileState: BoardTileState, hasAfternoonCard: boolean): string {
  if (tileState === 'monster') {
    return hasAfternoonCard
      ? gameText.reveal.monster.cardBody
      : gameText.reveal.monster.sufferOnlyBody;
  }

  return hasAfternoonCard
    ? gameText.reveal.typhoon.cardBody
    : gameText.reveal.typhoon.sufferOnlyBody;
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
        title: 'Quel équipement utiliser ?',
        body: 'Les deux jetons peuvent réagir à ce monstre.',
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
            title: 'Poudre à canon',
            caption: 'Élimine le monstre définitivement.',
          },
        ],
      },
    });

    if (equipmentChoice.action === 'card' && equipmentChoice.cardId === 'cannon') {
      gameState.cannonTokenEquipped = false;
      gameState.displayCannons = false;
      eliminateCurrentDangerTile();
      playSound('poudreACanon');
      await showScreen({
        type: 'full-message-button',
        content: {
          title: 'Poudre à canon !',
          body: 'Le monstre est éliminé. Aucun rhum n’est perdu.',
        },
        props: {
          chrome: AFTERNOON_CHROME,
          primaryButtonLabel: 'Suivant',
        },
      });
    } else {
      gameState.bottleTokenEquipped = false;
      gameState.displayBottle = false;
      playSound('bateauEnBouteille');
      await showScreen({
        type: 'full-message-button',
        content: {
          title: 'Bateau en bouteille !',
          body: 'Le danger est absorbé. Aucun rhum n’est perdu.',
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
    gameState.displayBottle = false;
    playSound('bateauEnBouteille');
    await showScreen({
      type: 'full-message-button',
      content: {
        title: 'Bateau en bouteille !',
        body: 'Le danger est absorbé. Aucun rhum n’est perdu.',
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
    gameState.displayCannons = false;
    eliminateCurrentDangerTile();
    playSound('poudreACanon');
    await showScreen({
      type: 'full-message-button',
      content: {
        title: 'Poudre à canon !',
        body: 'Le monstre est éliminé. Aucun rhum n’est perdu.',
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
  let shouldOpenManualCardChoice = options?.resumeFrom === 'crew.cardChoice';

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
          primaryButtonLabel: crewText.afterRoll.noMovementButton,
          zeroResultButtonLabel: crewText.afterRoll.noMovementButton,
          movingResultButtonLabel: crewText.afterRoll.moveButton,
          secondaryButtonLabel: hasMorningCard ? 'Utiliser une carte' : undefined,
          openHandOnSecondary: hasMorningCard,
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

    shouldOpenManualCardChoice = true;
  }

  const selectedCard = await chooseTreasureCardForPhase(
    'morning',
    {
      title: getTreasurePhaseCardTitle('morning'),
      body: gameText.cards.usePhaseBody,
    },
    {
      allowManualChoice: shouldOpenManualCardChoice,
    }
  );

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
    playSound('anchor');
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

  gameState.arrowClicked = null;
  gameState.displayArrows = true;
  saveCheckpointHistory('crew.afternoonIntro', { remainingMoves });

  const screenPromise = showScreen({
    type: 'top-message-lower-button',
    content: {
      ...crewText.afternoonIntro,
      body: `${crewText.afternoonIntro.body} ${formatRemainingMoves(remainingMoves)}`,
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
    playSound('calmSea');
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
            title: 'Île déjà explorée',
            body: 'La cale et les trésors ont déjà été récupérés ici.',
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
    playSound('island');

    await showCheckpointScreen(
      'crew.revealIsland',
      {
        type: 'top-message-lower-button',
        content: {
          title: gameText.reveal.island.title,
          body: `Tu recharges ${formatRhumBottleCount(gainedRhum)} en pillant l’île.`,
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

    const drawnCards = drawTreasureCards(2, { uniqueCardIds: true });
    const captainCard = drawnCards.find((card) => card.cardId === 'capitaine');

    if (captainCard) {
      gameState.gameResult = 'won';
      playSound('captain');
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
          title: 'Trésor récupéré',
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
        content: gameText.reveal.lootChoice,
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
    gameState.displayCorsair = true;
    gameState.gameResult = 'lost-corsair';
    playSound('battle');

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

  if (startAt === 'crew.revealEncounter') {
    const hasAfternoonCard = hasUsableTreasureCards('afternoon', { tileState });
    const equippedDefenseRevealBody = getEquippedDefenseRevealBody(tileState);
    playSound(tileState === 'typhon' ? 'typhon' : 'monster');
    const encounterChoice = await showCheckpointScreen(
      'crew.revealEncounter',
      {
        type: 'top-message-lower-button',
        content: {
          title: getEncounterTitle(tileState),
          body: equippedDefenseRevealBody ?? getEncounterBody(tileState, hasAfternoonCard),
        },
        props: {
          chrome:
            hasAfternoonCard && !equippedDefenseRevealBody
              ? { ...AFTERNOON_CHROME, canUseCards: true }
              : AFTERNOON_CHROME,
          primaryButtonLabel: equippedDefenseRevealBody
            ? 'Suivant'
            : hasAfternoonCard
              ? gameText.reveal.encounterGeneric.primaryButton
              : gameText.reveal.encounterGeneric.secondaryButton,
          secondaryButtonLabel:
            !equippedDefenseRevealBody && hasAfternoonCard
              ? gameText.reveal.encounterGeneric.secondaryButton
              : undefined,
          openHandOnPrimary: !equippedDefenseRevealBody && hasAfternoonCard,
        },
      },
      {
        remainingMoves,
        tileState,
      }
    );

    if (equippedDefenseRevealBody) {
      const equippedDefenseResult = await resolveEquippedDefense(
        tileState,
        remainingMoves,
        endTurn
      );

      if (equippedDefenseResult) {
        return equippedDefenseResult;
      }
    }

    if (encounterChoice.action === 'primary' && hasAfternoonCard) {
      const hadRequestedCard = hasRequestedTreasureCardSelection();
      const selectedCard = await chooseTreasureCardForPhase(
        'afternoon',
        {
          title: getTreasurePhaseCardTitle('afternoon'),
          body: gameText.cards.usePhaseBody,
          tileState,
        },
        {
          allowManualChoice: !hadRequestedCard,
        }
      );

      if (selectedCard?.cardId === 'bombe-artisanale') {
        markTreasureCardUsed(selectedCard);
        spendRhum(1);
        eliminateCurrentDangerTile();
        playSound('bombeArtisanale');

        await showScreen({
          type: 'full-message-button',
          content: {
            title: gameText.reveal.bomb.title,
            body: `Tu élimines définitivement le ${getTileRevealLabel(tileState)} en sacrifiant 1 bouteille de rhum. Retirez-le du plateau.`,
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
        title:
          tileState === 'monster'
            ? gameText.reveal.monster.sufferTitle
            : gameText.reveal.typhoon.sufferTitle,
        body:
          tileState === 'monster'
            ? gameText.reveal.monster.sufferBody
            : gameText.reveal.typhoon.sufferBody,
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

function moveCrew(direction: string): boolean {
  return moveUserPosition(direction);
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

    const directionConfirmResult = await showCheckpointScreen(
      'crew.directionConfirm',
      {
        type: 'top-message-lower-button',
        content: {
          ...getCrewText().directionConfirm,
          body: formatRemainingMoves(remainingMoves),
        },
        props: {
          chrome: AFTERNOON_CHROME,
          primaryButtonLabel: getCrewText().directionConfirm.primaryButton,
          secondaryButtonLabel: getCrewText().directionConfirm.secondaryButton,
          primaryButtonOnClick: () => {
            const selectedDirection = gameState.arrowClicked ?? direction;

            if (!selectedDirection) {
              return;
            }

            if (moveCrew(selectedDirection)) {
              direction = selectedDirection;
              resolveScreen({ action: 'primary' });
            }
          },
        },
      },
      {
        remainingMoves,
        direction,
      }
    );

    if (directionConfirmResult.action === 'undo' || directionConfirmResult.action === 'secondary') {
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
  const hasEveningCard = hasUsableTreasureCards('evening');
  const promptText = hasEveningCard
    ? gameText.evening.promptWithCard
    : gameText.evening.promptWithoutCard;
  const prompt = await showScreen({
    type: 'top-message-lower-button',
    content: {
      title: promptText.title,
      body: promptText.body,
    },
    props: {
      chrome: hasEveningCard
        ? {
            ...EVENING_CHROME,
            canUseCards: true,
          }
        : EVENING_CHROME,
      primaryButtonLabel: promptText.primaryButton,
      secondaryButtonLabel: hasEveningCard
        ? gameText.evening.promptWithCard.secondaryButton
        : undefined,
      openHandOnPrimary: hasEveningCard,
    },
  });

  if (!hasEveningCard || prompt.action !== 'primary') {
    return;
  }

  const hadRequestedCard = hasRequestedTreasureCardSelection();
  const selectedCard = await chooseTreasureCardForPhase(
    'evening',
    {
      title: getTreasurePhaseCardTitle('evening'),
      body: gameText.cards.usePhaseBody,
    },
    {
      allowManualChoice: !hadRequestedCard,
    }
  );

  if (!selectedCard) {
    return maybePlayEveningTreasureCard();
  }

  markTreasureCardUsed(selectedCard);

  if (selectedCard.cardId === 'bateau-en-bouteille') {
    gameState.bottleTokenEquipped = true;
    gameState.displayBottle = true;
  }

  if (selectedCard.cardId === 'poudre-a-canon') {
    gameState.cannonTokenEquipped = true;
    gameState.displayCannons = true;
  }

  if (selectedCard.cardId === 'cacahuete') {
    gameState.peanutTokens += 1;
    playSound('crewPeanut');
  }

  if (selectedCard.cardId === 'tequilaaaa') {
    gameState.tequilaTonight = true;
    playSound('tequila');
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
        primaryButtonLabel: 'Mesurer le vent',
      },
    });
    startAt = 'crew.diceRoll';
  }

  if (startAt === 'crew.diceRoll' || startAt === 'crew.cardChoice') {
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
    moveCorsairOneStep();

    if (!gameState.tequilaTonight) {
      spendRhum(1);
      playSound('rhumNight');
    }

    await showCheckpointScreen('crew.nightFalls', {
      type: 'top-message-lower-button',
      content: gameState.tequilaTonight ? gameText.evening.tequila : gameText.evening.rhumRound,
      props: {
        chrome: EVENING_CHROME,
        primaryButtonLabel: gameState.tequilaTonight
          ? gameText.evening.tequila.primaryButton
          : gameText.evening.rhumRound.primaryButton,
      },
    });

    if (checkRhumLoss()) {
      gameState.diceResult = null;
      return true;
    }
  }

  return false;
}
