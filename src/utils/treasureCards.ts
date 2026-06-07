import { gameText } from '../content/gameText';

export type TreasurePhase = 'morning' | 'afternoon' | 'evening' | 'captain';

export type TreasureCardId =
  | 'jeter-ancre'
  | 'de-pipe'
  | 'envollee'
  | 'bombe-artisanale'
  | 'bateau-en-bouteille'
  | 'poudre-a-canon'
  | 'cacahuete'
  | 'tequilaaaa'
  | 'capitaine';

export interface TreasureCardDefinition {
  id: TreasureCardId;
  phase: TreasurePhase;
  count: number;
  playable: boolean;
  imageSrc?: string;
}

export interface TreasureCardInstance {
  instanceId: string;
  cardId: TreasureCardId;
}

export interface TreasureCardView {
  id: string;
  cardId: TreasureCardId;
  title: string;
  caption: string;
  phaseLabel: string;
  disabled?: boolean;
  disabledReason?: string;
  imageSrc?: string;
  imageAlt?: string;
}

export const CAPTAIN_FINAL_SLOT_COUNT = 3;

export const treasureCardDefinitions: Record<TreasureCardId, TreasureCardDefinition> = {
  'jeter-ancre': {
    id: 'jeter-ancre',
    phase: 'morning',
    count: 2,
    playable: true,
    imageSrc: '/images/cards/jeterlancre.webp',
  },
  'de-pipe': {
    id: 'de-pipe',
    phase: 'morning',
    count: 1,
    playable: true,
    imageSrc: '/images/cards/depipe.webp',
  },
  envollee: {
    id: 'envollee',
    phase: 'morning',
    count: 2,
    playable: true,
    imageSrc: '/images/cards/lenvolee.webp',
  },
  'bombe-artisanale': {
    id: 'bombe-artisanale',
    phase: 'afternoon',
    count: 2,
    playable: true,
    imageSrc: '/images/cards/bombeartisanale.webp',
  },
  'bateau-en-bouteille': {
    id: 'bateau-en-bouteille',
    phase: 'evening',
    count: 1,
    playable: true,
    imageSrc: '/images/cards/bateauenbouteille.webp',
  },
  'poudre-a-canon': {
    id: 'poudre-a-canon',
    phase: 'evening',
    count: 1,
    playable: true,
    imageSrc: '/images/cards/poudreacanon.webp',
  },
  cacahuete: {
    id: 'cacahuete',
    phase: 'evening',
    count: 6,
    playable: true,
    imageSrc: '/images/cards/cacahuete.webp',
  },
  tequilaaaa: {
    id: 'tequilaaaa',
    phase: 'evening',
    count: 2,
    playable: true,
    imageSrc: '/images/cards/tequila.webp',
  },
  capitaine: {
    id: 'capitaine',
    phase: 'captain',
    count: 1,
    playable: false,
    imageSrc: '/images/cards/capitaine.webp',
  },
};

export const TREASURE_DECK_TOTAL = Object.values(treasureCardDefinitions).reduce(
  (total, definition) => total + definition.count,
  0
);

export function getTreasureCardDefinition(cardId: TreasureCardId): TreasureCardDefinition {
  return treasureCardDefinitions[cardId];
}

export function getTreasureCardTitle(cardId: TreasureCardId): string {
  return gameText.treasureCards[cardId].title;
}

export function getTreasureCardImageSrc(cardId: TreasureCardId): string | undefined {
  return treasureCardDefinitions[cardId].imageSrc;
}

export function getTreasurePhaseLabel(phase: TreasurePhase): string {
  switch (phase) {
    case 'morning':
      return gameText.treasurePhases.morning;
    case 'afternoon':
      return gameText.treasurePhases.afternoon;
    case 'evening':
      return gameText.treasurePhases.evening;
    case 'captain':
      return gameText.treasurePhases.captain;
  }
}

function createTreasureCardInstance(cardId: TreasureCardId, index: number): TreasureCardInstance {
  return {
    instanceId: `${cardId}-${index + 1}-${Math.random().toString(36).slice(2, 8)}`,
    cardId,
  };
}

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = shuffled[index]!;
    shuffled[index] = shuffled[swapIndex]!;
    shuffled[swapIndex] = current;
  }

  return shuffled;
}

export function createTreasureDeck(): TreasureCardInstance[] {
  const deckWithoutCaptain: TreasureCardInstance[] = [];

  Object.values(treasureCardDefinitions).forEach((definition) => {
    if (definition.id === 'capitaine') {
      return;
    }

    for (let index = 0; index < definition.count; index++) {
      deckWithoutCaptain.push(createTreasureCardInstance(definition.id, index));
    }
  });

  const deck = shuffle(deckWithoutCaptain);
  const captainCard = createTreasureCardInstance('capitaine', 0);
  const firstFinalSlot = Math.max(0, deck.length - (CAPTAIN_FINAL_SLOT_COUNT - 1));
  const captainIndex = Math.min(
    deck.length,
    firstFinalSlot + Math.floor(Math.random() * CAPTAIN_FINAL_SLOT_COUNT)
  );

  deck.splice(captainIndex, 0, captainCard);

  return deck;
}

export function createDemoTreasureDeck(): TreasureCardInstance[] {
  const firstIslandCardIds: TreasureCardId[] = ['bateau-en-bouteille', 'poudre-a-canon'];
  const demoDeckCards: TreasureCardInstance[] = [];

  Object.values(treasureCardDefinitions).forEach((definition) => {
    if (definition.id === 'capitaine' || firstIslandCardIds.includes(definition.id)) {
      return;
    }

    for (let index = 0; index < definition.count; index++) {
      demoDeckCards.push(createTreasureCardInstance(definition.id, index));
    }
  });

  const shuffledDemoCards = shuffle(demoDeckCards);
  const initialChoiceCards = shuffledDemoCards.splice(0, 4);
  const firstIslandCards = firstIslandCardIds.map((cardId) =>
    createTreasureCardInstance(cardId, 0)
  );
  const captainCard = createTreasureCardInstance('capitaine', 0);
  const targetCaptainIndex = Math.floor(TREASURE_DECK_TOTAL / 2);
  const cardsBeforeCaptainCount = Math.max(
    0,
    targetCaptainIndex - initialChoiceCards.length - firstIslandCards.length
  );
  const cardsBeforeCaptain = shuffledDemoCards.splice(0, cardsBeforeCaptainCount);

  return [
    ...initialChoiceCards,
    ...firstIslandCards,
    ...cardsBeforeCaptain,
    captainCard,
    ...shuffledDemoCards,
  ];
}

export function toTreasureCardView(
  card: TreasureCardInstance,
  options?: {
    disabled?: boolean;
    disabledReason?: string;
  }
): TreasureCardView {
  const definition = getTreasureCardDefinition(card.cardId);

  return {
    id: card.instanceId,
    cardId: card.cardId,
    title: gameText.treasureCards[card.cardId].title,
    caption: gameText.treasureCards[card.cardId].effect,
    phaseLabel: getTreasurePhaseLabel(definition.phase),
    disabled: options?.disabled,
    disabledReason: options?.disabledReason,
    imageSrc: definition.imageSrc,
    imageAlt: gameText.treasureCards[card.cardId].title,
  };
}
