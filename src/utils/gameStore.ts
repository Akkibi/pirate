import { reactive } from 'vue';
import * as THREE from 'three/webgpu';
import type { TreasureCardInstance } from './treasureCards';
import { demo_map } from './demo_map';

export type PhaseType = 'crew' | 'parrot';
export type BoardTileState = 'monster' | 'typhon' | 'water' | 'island' | 'corsair';
export type GameResult = 'won' | 'lost-rhum' | 'lost-corsair' | null;
export type BoardDirection = 'left' | 'right' | 'up' | 'down';
export const BOARD_TILE_COUNT_X = 5;
export const BOARD_TILE_COUNT_Y = 7;
const MIN_INITIAL_CORSAIR_DISTANCE = 5;
const MONSTER_POOL_KEYS = ['monster_baleine', 'monster_pieuvre', 'monster_serpent'] as const;

export interface BoardTileSnapshot {
  x: number;
  y: number;
  state: BoardTileState;
  monsterType?: string;
}

export interface BoardPositionSnapshot {
  x: number;
  y: number;
}

const tileKey = (x: number, y: number) => `${x}:${y}`;

const BOARD_DIRECTION_DELTAS: Record<BoardDirection, BoardPositionSnapshot> = {
  left: { x: 0, y: -1 },
  right: { x: 0, y: 1 },
  up: { x: 1, y: 0 },
  down: { x: -1, y: 0 },
};

interface StoreInterface {
  currentPhase: PhaseType;
  currentAction: string | null;
  showActionPanel: boolean;
  showVideoOverlay: boolean;
  turnCount: number;
  crewHP: number;
  maxRhum: number;
  currentRhum: number;
  rhumConsumed: number;
  diceResult: number | null;
  lastNaturalDiceResult: number | null;
  userPosition: THREE.Vector2;
  corsairPosition: THREE.Vector2;
  cameraFocusPosition: THREE.Vector2 | null;
  displayCorsair: boolean;
  userPositionHistory: Array<THREE.Vector2>;
  entitiesVisible: boolean;
  focusedView: boolean;
  displayArrows: boolean;
  displayCannons: boolean;
  displayBottle: boolean;
  arrowClicked: string | null;
  boardTiles: Map<string, BoardTileSnapshot>;
  exhaustedIslandPositions: BoardPositionSnapshot[];
  greyedIslandPositions: BoardPositionSnapshot[];
  treasureDeck: TreasureCardInstance[];
  crewHand: TreasureCardInstance[];
  treasureDiscardPile: TreasureCardInstance[];
  usedTreasureThisTurn: boolean;
  bottleTokenEquipped: boolean;
  cannonTokenEquipped: boolean;
  peanutTokens: number;
  tequilaTonight: boolean;
  gameResult: GameResult;
  gameStartedAt: number;
  loadingProgress: number;
  gameStarted: boolean;
  debugMode: boolean;
  demoMode: boolean;
  revealMap: boolean;
  performanceMode: boolean;
}

export interface GameStateSnapshot {
  currentPhase: PhaseType;
  currentAction: string | null;
  showActionPanel: boolean;
  showVideoOverlay: boolean;
  turnCount: number;
  crewHP: number;
  maxRhum: number;
  currentRhum: number;
  rhumConsumed: number;
  diceResult: number | null;
  lastNaturalDiceResult: number | null;
  userPosition: {
    x: number;
    y: number;
  };
  corsairPosition?: {
    x: number;
    y: number;
  };
  userPositionHistory: Array<{
    x: number;
    y: number;
  }>;
  entitiesVisible: boolean;
  arrowClicked: string | null;
  boardTiles: BoardTileSnapshot[];
  exhaustedIslandPositions: BoardPositionSnapshot[];
  greyedIslandPositions?: BoardPositionSnapshot[];
  treasureDeck: TreasureCardInstance[];
  crewHand: TreasureCardInstance[];
  treasureDiscardPile: TreasureCardInstance[];
  usedTreasureThisTurn: boolean;
  bottleTokenEquipped: boolean;
  cannonTokenEquipped: boolean;
  peanutTokens: number;
  tequilaTonight: boolean;
  gameResult: GameResult;
  gameStartedAt: number;
  demoMode?: boolean;
  revealMap: false;
}

export const gameState = reactive({
  currentPhase: 'crew',
  currentAction: null as string | null,
  showActionPanel: false,
  showVideoOverlay: false,
  turnCount: 0,
  crewHP: 3,
  maxRhum: 6,
  currentRhum: 6,
  rhumConsumed: 0,
  diceResult: null,
  lastNaturalDiceResult: null,
  focusedView: false,
  userPosition: new THREE.Vector2(0, 0),
  displayCorsair: false,
  corsairPosition: new THREE.Vector2(0, 0),
  cameraFocusPosition: null as THREE.Vector2 | null,
  userPositionHistory: [new THREE.Vector2(0, 0)],
  entitiesVisible: false,
  displayArrows: false,
  displayBottle: false,
  displayCannons: false,
  arrowClicked: null,
  boardTiles: new Map(),
  exhaustedIslandPositions: [],
  greyedIslandPositions: [],
  treasureDeck: [],
  crewHand: [],
  treasureDiscardPile: [],
  usedTreasureThisTurn: false,
  bottleTokenEquipped: false,
  cannonTokenEquipped: false,
  peanutTokens: 0,
  tequilaTonight: false,
  gameResult: null,
  gameStartedAt: Date.now(),
  loadingProgress: 0,
  gameStarted: false,
  debugMode: false,
  demoMode: false,
  revealMap: false,
  performanceMode: false,
} as StoreInterface);

function createDefaultGameStateSnapshot(): GameStateSnapshot {
  return {
    currentPhase: 'crew',
    currentAction: null,
    showActionPanel: false,
    showVideoOverlay: false,
    turnCount: 0,
    crewHP: 3,
    maxRhum: 6,
    currentRhum: 6,
    rhumConsumed: 0,
    diceResult: null,
    lastNaturalDiceResult: null,
    userPosition: {
      x: 0,
      y: 0,
    },
    corsairPosition: {
      x: 0,
      y: 0,
    },
    userPositionHistory: [{ x: 0, y: 0 }],
    entitiesVisible: false,
    arrowClicked: null,
    boardTiles: [],
    exhaustedIslandPositions: [],
    greyedIslandPositions: [],
    treasureDeck: [],
    crewHand: [],
    treasureDiscardPile: [],
    usedTreasureThisTurn: false,
    bottleTokenEquipped: false,
    cannonTokenEquipped: false,
    peanutTokens: 0,
    tequilaTonight: false,
    gameResult: null,
    gameStartedAt: Date.now(),
    demoMode: false,
    revealMap: false,
  };
}

export function createGameStateSnapshot(): GameStateSnapshot {
  return {
    currentPhase: gameState.currentPhase,
    currentAction: gameState.currentAction,
    showActionPanel: gameState.showActionPanel,
    showVideoOverlay: gameState.showVideoOverlay,
    turnCount: gameState.turnCount,
    crewHP: gameState.crewHP,
    maxRhum: gameState.maxRhum,
    currentRhum: gameState.currentRhum,
    rhumConsumed: gameState.rhumConsumed,
    diceResult: gameState.diceResult,
    lastNaturalDiceResult: gameState.lastNaturalDiceResult,
    userPosition: {
      x: gameState.userPosition.x,
      y: gameState.userPosition.y,
    },
    corsairPosition: {
      x: gameState.corsairPosition.x,
      y: gameState.corsairPosition.y,
    },
    userPositionHistory: gameState.userPositionHistory.map((position) => ({
      x: position.x,
      y: position.y,
    })),
    entitiesVisible: gameState.entitiesVisible,
    arrowClicked: null,
    boardTiles: [...gameState.boardTiles.values()].map((tile) => ({
      x: tile.x,
      y: tile.y,
      state: tile.state,
      monsterType: tile.monsterType,
    })),
    exhaustedIslandPositions: gameState.exhaustedIslandPositions.map((position) => ({
      x: position.x,
      y: position.y,
    })),
    greyedIslandPositions: gameState.greyedIslandPositions.map((position) => ({
      x: position.x,
      y: position.y,
    })),
    treasureDeck: gameState.treasureDeck.map((card) => ({ ...card })),
    crewHand: gameState.crewHand.map((card) => ({ ...card })),
    treasureDiscardPile: gameState.treasureDiscardPile.map((card) => ({ ...card })),
    usedTreasureThisTurn: gameState.usedTreasureThisTurn,
    bottleTokenEquipped: gameState.bottleTokenEquipped,
    cannonTokenEquipped: gameState.cannonTokenEquipped,
    peanutTokens: gameState.peanutTokens,
    tequilaTonight: gameState.tequilaTonight,
    gameResult: gameState.gameResult,
    gameStartedAt: gameState.gameStartedAt,
    demoMode: gameState.demoMode,
    revealMap: false,
  };
}

export function applyGameStateSnapshot(snapshot: GameStateSnapshot): void {
  gameState.currentPhase = snapshot.currentPhase;
  gameState.currentAction = snapshot.currentAction;
  gameState.showActionPanel = snapshot.showActionPanel;
  gameState.showVideoOverlay = snapshot.showVideoOverlay;
  gameState.turnCount = snapshot.turnCount;
  gameState.crewHP = snapshot.crewHP;
  gameState.maxRhum = snapshot.maxRhum ?? 6;
  gameState.currentRhum = snapshot.currentRhum ?? gameState.maxRhum;
  gameState.rhumConsumed = snapshot.rhumConsumed ?? 0;
  gameState.diceResult = snapshot.diceResult;
  gameState.lastNaturalDiceResult = snapshot.lastNaturalDiceResult ?? null;
  const userPosition = clampBoardPosition(snapshot.userPosition);
  const corsairPosition = clampBoardPosition(snapshot.corsairPosition ?? { x: 0, y: 0 });
  gameState.userPosition.set(userPosition.x, userPosition.y);
  gameState.corsairPosition.set(corsairPosition.x, corsairPosition.y);
  gameState.cameraFocusPosition = null;
  gameState.displayCorsair = false;
  gameState.userPositionHistory.splice(
    0,
    gameState.userPositionHistory.length,
    ...snapshot.userPositionHistory.map((position) => {
      const clampedPosition = clampBoardPosition(position);
      return new THREE.Vector2(clampedPosition.x, clampedPosition.y);
    })
  );
  gameState.entitiesVisible = snapshot.entitiesVisible;
  gameState.boardTiles.clear();
  (snapshot.boardTiles ?? []).forEach((tile) => {
    gameState.boardTiles.set(tileKey(tile.x, tile.y), {
      x: tile.x,
      y: tile.y,
      state: tile.state,
      monsterType: tile.monsterType,
    });
  });
  gameState.exhaustedIslandPositions.splice(
    0,
    gameState.exhaustedIslandPositions.length,
    ...(snapshot.exhaustedIslandPositions ?? []).map((position) => ({
      x: position.x,
      y: position.y,
    }))
  );
  gameState.greyedIslandPositions.splice(
    0,
    gameState.greyedIslandPositions.length,
    ...(
      snapshot.greyedIslandPositions ??
      gameState.exhaustedIslandPositions.filter(
        (position) => !isSameBoardPosition(position, userPosition)
      )
    ).map((position) => ({
      x: position.x,
      y: position.y,
    }))
  );
  gameState.treasureDeck.splice(
    0,
    gameState.treasureDeck.length,
    ...(snapshot.treasureDeck ?? []).map((card) => ({ ...card }))
  );
  gameState.crewHand.splice(
    0,
    gameState.crewHand.length,
    ...(snapshot.crewHand ?? []).map((card) => ({ ...card }))
  );
  gameState.treasureDiscardPile.splice(
    0,
    gameState.treasureDiscardPile.length,
    ...(snapshot.treasureDiscardPile ?? []).map((card) => ({ ...card }))
  );
  gameState.usedTreasureThisTurn = snapshot.usedTreasureThisTurn ?? false;
  gameState.bottleTokenEquipped = snapshot.bottleTokenEquipped ?? false;
  gameState.cannonTokenEquipped = snapshot.cannonTokenEquipped ?? false;
  gameState.displayBottle = gameState.bottleTokenEquipped;
  gameState.displayCannons = gameState.cannonTokenEquipped;
  gameState.peanutTokens = snapshot.peanutTokens ?? 0;
  gameState.tequilaTonight = snapshot.tequilaTonight ?? false;
  gameState.gameResult = snapshot.gameResult ?? null;
  gameState.gameStartedAt = snapshot.gameStartedAt ?? Date.now();
  gameState.demoMode = snapshot.demoMode ?? false;
  gameState.revealMap = false;
}

export function resetGameState(): void {
  applyGameStateSnapshot(createDefaultGameStateSnapshot());
}

export function isSameBoardPosition(
  first: Pick<THREE.Vector2, 'x' | 'y'>,
  second: Pick<THREE.Vector2, 'x' | 'y'>
): boolean {
  return first.x === second.x && first.y === second.y;
}

export function clampBoardPosition(
  position: Pick<THREE.Vector2, 'x' | 'y'>
): BoardPositionSnapshot {
  return {
    x: Math.max(0, Math.min(BOARD_TILE_COUNT_X - 1, Math.round(position.x))),
    y: Math.max(0, Math.min(BOARD_TILE_COUNT_Y - 1, Math.round(position.y))),
  };
}

export function isBoardDirection(direction: string): direction is BoardDirection {
  return Object.prototype.hasOwnProperty.call(BOARD_DIRECTION_DELTAS, direction);
}

export function getNextBoardPosition(
  position: Pick<THREE.Vector2, 'x' | 'y'>,
  direction: string
): BoardPositionSnapshot | null {
  if (!isBoardDirection(direction)) {
    return null;
  }

  const clampedPosition = clampBoardPosition(position);
  const delta = BOARD_DIRECTION_DELTAS[direction];
  const nextPosition = {
    x: clampedPosition.x + delta.x,
    y: clampedPosition.y + delta.y,
  };

  if (
    nextPosition.x < 0 ||
    nextPosition.x >= BOARD_TILE_COUNT_X ||
    nextPosition.y < 0 ||
    nextPosition.y >= BOARD_TILE_COUNT_Y
  ) {
    return null;
  }

  return nextPosition;
}

export function moveUserPosition(direction: string): boolean {
  const previousPosition = clampBoardPosition(gameState.userPosition);
  const nextPosition = getNextBoardPosition(gameState.userPosition, direction);

  if (!nextPosition) {
    const clampedPosition = clampBoardPosition(gameState.userPosition);
    gameState.userPosition.set(clampedPosition.x, clampedPosition.y);
    return false;
  }

  gameState.userPosition.set(nextPosition.x, nextPosition.y);

  if (isIslandExhausted(previousPosition)) {
    markIslandGreyed(previousPosition);
  }

  return true;
}

function getAdjacentBoardPositions(
  position: Pick<THREE.Vector2, 'x' | 'y'>
): BoardPositionSnapshot[] {
  const clampedPosition = clampBoardPosition(position);
  const candidates = [
    { x: clampedPosition.x + 1, y: clampedPosition.y },
    { x: clampedPosition.x - 1, y: clampedPosition.y },
    { x: clampedPosition.x, y: clampedPosition.y + 1 },
    { x: clampedPosition.x, y: clampedPosition.y - 1 },
  ];

  return candidates.filter(
    (candidate) =>
      candidate.x >= 0 &&
      candidate.x < BOARD_TILE_COUNT_X &&
      candidate.y >= 0 &&
      candidate.y < BOARD_TILE_COUNT_Y
  );
}

function pickRandomBoardPosition(positions: BoardPositionSnapshot[]): BoardPositionSnapshot | null {
  return positions[Math.floor(Math.random() * positions.length)] ?? null;
}

function getBoardDistance(
  first: Pick<THREE.Vector2, 'x' | 'y'>,
  second: Pick<THREE.Vector2, 'x' | 'y'>
): number {
  return Math.abs(first.x - second.x) + Math.abs(first.y - second.y);
}

function getAllBoardPositions(): BoardPositionSnapshot[] {
  const positions: BoardPositionSnapshot[] = [];

  for (let x = 0; x < BOARD_TILE_COUNT_X; x++) {
    for (let y = 0; y < BOARD_TILE_COUNT_Y; y++) {
      positions.push({ x, y });
    }
  }

  return positions;
}

function createInitialBoardTiles(): BoardTileSnapshot[] {
  const boardTiles: BoardTileSnapshot[] = [];

  for (let x = 0; x < BOARD_TILE_COUNT_X; x++) {
    for (let y = 0; y < BOARD_TILE_COUNT_Y; y++) {
      boardTiles.push({
        x,
        y,
        state: 'water',
      });
    }
  }

  positionBoardTileGroup('island', boardTiles);
  positionBoardTileGroup('typhon', boardTiles);
  positionBoardTileGroup('monster', boardTiles);

  boardTiles.forEach((tile) => {
    if (tile.state === 'monster') {
      tile.monsterType = MONSTER_POOL_KEYS[Math.floor(Math.random() * MONSTER_POOL_KEYS.length)];
    }

    if (isSameBoardPosition(tile, gameState.userPosition)) {
      tile.state = 'water';
      tile.monsterType = undefined;
    }
  });

  return boardTiles;
}

function positionBoardTileGroup(group: BoardTileState, boardTiles: BoardTileSnapshot[]): void {
  const totalCount = group === 'island' ? 9 : Math.round(Math.random()) + 8;
  const blackCount = 4;
  const whiteCount = totalCount - blackCount;

  const getPool = (parity: number) => boardTiles.filter((tile) => (tile.x + tile.y) % 2 === parity);

  const tryPlace = (pool: BoardTileSnapshot[]): boolean => {
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = pool[Math.floor(Math.random() * pool.length)];

      if (!candidate || candidate.state !== 'water') {
        continue;
      }

      const sameTypeNeighbors = boardTiles.filter(
        (tile) =>
          tile.state === group &&
          ((Math.abs(tile.x - candidate.x) === 1 && tile.y === candidate.y) ||
            (Math.abs(tile.y - candidate.y) === 1 && tile.x === candidate.x))
      ).length;

      if (sameTypeNeighbors < 2) {
        candidate.state = group;
        return true;
      }
    }

    return false;
  };

  const blackPool = getPool(0);
  const whitePool = getPool(1);

  for (let index = 0; index < blackCount; index++) {
    if (!tryPlace(blackPool)) break;
  }

  for (let index = 0; index < whiteCount; index++) {
    if (!tryPlace(whitePool)) break;
  }
}

export function initializeNewBoardState(): void {
  const startPosition = new THREE.Vector2(
    Math.round(Math.random() * (BOARD_TILE_COUNT_X - 1)),
    Math.round(Math.random() * (BOARD_TILE_COUNT_Y - 1))
  );

  gameState.userPosition.set(startPosition.x, startPosition.y);
  gameState.userPositionHistory.splice(
    0,
    gameState.userPositionHistory.length,
    startPosition.clone()
  );
  randomizeCorsairAwayFromBoat();
  setBoardTiles(createInitialBoardTiles());
}

export function initializeDemoBoardState() {
  gameState.userPosition.set(2, 3);
  gameState.userPositionHistory.splice(
    0,
    gameState.userPositionHistory.length,
    new THREE.Vector2(2, 3)
  );

  gameState.corsairPosition.set(4, 6);

  const boardData = demo_map as BoardTileSnapshot[];
  setBoardTiles(boardData);
}

export function randomizeCorsairAwayFromBoat(): void {
  const nextPosition = pickRandomBoardPosition(
    getAllBoardPositions().filter(
      (position) =>
        getBoardDistance(position, gameState.userPosition) >= MIN_INITIAL_CORSAIR_DISTANCE
    )
  );

  if (!nextPosition) {
    ensureCorsairAwayFromBoat();
    return;
  }

  gameState.corsairPosition.set(nextPosition.x, nextPosition.y);
}

export function ensureCorsairAwayFromBoat(): void {
  const clampedCorsairPosition = clampBoardPosition(gameState.corsairPosition);
  gameState.corsairPosition.set(clampedCorsairPosition.x, clampedCorsairPosition.y);

  if (!isSameBoardPosition(gameState.corsairPosition, gameState.userPosition)) {
    return;
  }

  const nextPosition = pickRandomBoardPosition(
    getAdjacentBoardPositions(gameState.corsairPosition)
  );

  if (nextPosition) {
    gameState.corsairPosition.set(nextPosition.x, nextPosition.y);
  }
}

export function moveCorsairOneStep(): void {
  const clampedCorsairPosition = clampBoardPosition(gameState.corsairPosition);
  const possiblePositions = getAdjacentBoardPositions(clampedCorsairPosition).filter(
    (position) => !isSameBoardPosition(position, gameState.userPosition)
  );
  const nextPosition = pickRandomBoardPosition(possiblePositions);

  if (!nextPosition) {
    gameState.corsairPosition.set(clampedCorsairPosition.x, clampedCorsairPosition.y);
    return;
  }

  gameState.corsairPosition.set(nextPosition.x, nextPosition.y);
}

export function setBoardTiles(tiles: BoardTileSnapshot[]): void {
  gameState.boardTiles.clear();
  tiles.forEach((tile) => gameState.boardTiles.set(tileKey(tile.x, tile.y), tile));
}

export function setRhumCapacity(maxRhum: number): void {
  gameState.maxRhum = Math.max(1, Math.round(maxRhum));
  gameState.currentRhum = gameState.maxRhum;
  gameState.rhumConsumed = 0;
}

export function gainRhum(amount: number): number {
  const previousRhum = gameState.currentRhum;
  gameState.currentRhum = Math.min(gameState.maxRhum, gameState.currentRhum + amount);

  return gameState.currentRhum - previousRhum;
}

export function spendRhum(amount: number): number {
  const spent = Math.min(gameState.currentRhum, Math.max(0, amount));
  gameState.currentRhum = Math.max(0, gameState.currentRhum - amount);
  gameState.rhumConsumed += spent;

  return spent;
}

export function setTreasureDeck(deck: TreasureCardInstance[]): void {
  gameState.treasureDeck.splice(0, gameState.treasureDeck.length, ...deck);
}

export function drawTreasureCards(
  count: number,
  options?: {
    uniqueCardIds?: boolean;
  }
): TreasureCardInstance[] {
  if (!options?.uniqueCardIds) {
    return gameState.treasureDeck.splice(0, count);
  }

  const drawnCards: TreasureCardInstance[] = [];
  const deferredCards: TreasureCardInstance[] = [];

  while (drawnCards.length < count && gameState.treasureDeck.length > 0) {
    const nextCard = gameState.treasureDeck.shift();

    if (!nextCard) {
      break;
    }

    const isDuplicateChoice = drawnCards.some((card) => card.cardId === nextCard.cardId);

    if (isDuplicateChoice) {
      deferredCards.push(nextCard);
      continue;
    }

    drawnCards.push(nextCard);
  }

  if (deferredCards.length > 0) {
    gameState.treasureDeck.unshift(...deferredCards);
  }

  return drawnCards;
}

export function addTreasureCardsToHand(cards: TreasureCardInstance[]): void {
  gameState.crewHand.push(...cards);
}

export function removeTreasureCardFromHand(
  instanceId: string | number
): TreasureCardInstance | null {
  const index = gameState.crewHand.findIndex((card) => card.instanceId === instanceId);

  if (index === -1) {
    return null;
  }

  return gameState.crewHand.splice(index, 1)[0] ?? null;
}

export function discardTreasureCard(card: TreasureCardInstance): void {
  gameState.treasureDiscardPile.push(card);
}

export function discardTreasureCards(cards: TreasureCardInstance[]): void {
  gameState.treasureDiscardPile.push(...cards);
}

export function setBoardTileStateAtPosition(
  position: Pick<THREE.Vector2, 'x' | 'y'>,
  state: BoardTileState
): void {
  const tile = gameState.boardTiles.get(tileKey(position.x, position.y));
  if (!tile) return;

  tile.state = state;
  if (state !== 'monster') {
    tile.monsterType = undefined;
  }
}

export function markIslandExhausted(position: Pick<THREE.Vector2, 'x' | 'y'>): void {
  if (isIslandExhausted(position)) {
    return;
  }

  gameState.exhaustedIslandPositions.push({ x: position.x, y: position.y });
}

export function markIslandGreyed(position: Pick<THREE.Vector2, 'x' | 'y'>): void {
  if (isIslandGreyed(position)) {
    return;
  }

  gameState.greyedIslandPositions.push({ x: position.x, y: position.y });
}

export function isIslandExhausted(position: Pick<THREE.Vector2, 'x' | 'y'>): boolean {
  return gameState.exhaustedIslandPositions.some(
    (exhaustedPosition) => exhaustedPosition.x === position.x && exhaustedPosition.y === position.y
  );
}

export function isIslandGreyed(position: Pick<THREE.Vector2, 'x' | 'y'>): boolean {
  return gameState.greyedIslandPositions.some(
    (greyedPosition) => greyedPosition.x === position.x && greyedPosition.y === position.y
  );
}

export function formatBoardCoordinate(position: Pick<THREE.Vector2, 'x' | 'y'>): string {
  return `${'ABCDEFG'[6 - position.y] ?? '?'}${position.x + 1}`;
}

export function getBoardTileStateAtPosition(
  position: Pick<THREE.Vector2, 'x' | 'y'>
): BoardTileState | null {
  return gameState.boardTiles.get(tileKey(position.x, position.y))?.state ?? null;
}
