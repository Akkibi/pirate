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
  title: string;
  phase: TreasurePhase;
  count: number;
  effect: string;
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
    title: "Jeter l'ancre",
    phase: 'morning',
    count: 2,
    effect: 'Reduit de 1 le lancer de de.',
    playable: true,
    imageSrc: '/images/cards/jeterlancre.webp',
  },
  'de-pipe': {
    id: 'de-pipe',
    title: 'De pipe',
    phase: 'morning',
    count: 1,
    effect: 'Relance le de du vent.',
    playable: true,
    imageSrc: '/images/cards/depipe.webp',
  },
  envollee: {
    id: 'envollee',
    title: "L'envolee",
    phase: 'morning',
    count: 2,
    effect: 'Augmente de 1 le lancer de de.',
    playable: true,
    imageSrc: '/images/cards/lenvolee.webp',
  },
  'bombe-artisanale': {
    id: 'bombe-artisanale',
    title: 'Bombe artisanale',
    phase: 'afternoon',
    count: 2,
    effect: 'Sacrifie 1 rhum pour eliminer definitivement un monstre ou un typhon.',
    playable: true,
    imageSrc: '/images/cards/bombeartisanale.webp',
  },
  'bateau-en-bouteille': {
    id: 'bateau-en-bouteille',
    title: 'Bateau en bouteille',
    phase: 'evening',
    count: 1,
    effect: 'Equipe une protection qui absorbe le prochain monstre ou typhon.',
    playable: true,
    imageSrc: '/images/cards/bateauenbouteille.webp',
  },
  'poudre-a-canon': {
    id: 'poudre-a-canon',
    title: 'Poudre a canon',
    phase: 'evening',
    count: 1,
    effect: 'Equipe un tir qui eliminera le prochain monstre rencontre.',
    playable: true,
    imageSrc: '/images/cards/poudreacanon.webp',
  },
  cacahuete: {
    id: 'cacahuete',
    title: 'Cacahuete',
    phase: 'evening',
    count: 6,
    effect: 'Ajoute un jeton cacahuete a la reserve du Perroquet.',
    playable: true,
    imageSrc: '/images/cards/cacahuete.webp',
  },
  tequilaaaa: {
    id: 'tequilaaaa',
    title: 'Tequilaaaa!',
    phase: 'evening',
    count: 2,
    effect: "Remplace la ration de rhum du soir. L'Equipage ne boit pas de rhum ce tour.",
    playable: true,
    imageSrc: '/images/cards/tequila.webp',
  },
  capitaine: {
    id: 'capitaine',
    title: 'Capitaine, mon capitaine !',
    phase: 'captain',
    count: 1,
    effect: 'Le Capitaine est retrouve. Vous gagnez la partie.',
    playable: false,
  },
};

export const TREASURE_DECK_TOTAL = Object.values(treasureCardDefinitions).reduce(
  (total, definition) => total + definition.count,
  0
);

export function getTreasureCardDefinition(cardId: TreasureCardId): TreasureCardDefinition {
  return treasureCardDefinitions[cardId];
}

export function getTreasureCardImageSrc(cardId: TreasureCardId): string | undefined {
  return treasureCardDefinitions[cardId].imageSrc;
}

export function getTreasurePhaseLabel(phase: TreasurePhase): string {
  switch (phase) {
    case 'morning':
      return 'Matinee';
    case 'afternoon':
      return 'Apres-midi';
    case 'evening':
      return 'Soiree';
    case 'captain':
      return 'Capitaine';
  }
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
      deckWithoutCaptain.push({
        instanceId: `${definition.id}-${index + 1}-${Math.random().toString(36).slice(2, 8)}`,
        cardId: definition.id,
      });
    }
  });

  const deck = shuffle(deckWithoutCaptain);
  const captainCard: TreasureCardInstance = {
    instanceId: `capitaine-1-${Math.random().toString(36).slice(2, 8)}`,
    cardId: 'capitaine',
  };
  const firstFinalSlot = Math.max(0, deck.length - (CAPTAIN_FINAL_SLOT_COUNT - 1));
  const captainIndex = Math.min(
    deck.length,
    firstFinalSlot + Math.floor(Math.random() * CAPTAIN_FINAL_SLOT_COUNT)
  );

  deck.splice(captainIndex, 0, captainCard);

  return deck;
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
    title: definition.title,
    caption: definition.effect,
    phaseLabel: getTreasurePhaseLabel(definition.phase),
    disabled: options?.disabled,
    disabledReason: options?.disabledReason,
    imageSrc: definition.imageSrc,
    imageAlt: definition.title,
  };
}
