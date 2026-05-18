import { reactive } from 'vue';
import * as THREE from 'three/webgpu';
import type { TreasureCardInstance } from './treasureCards';

export type PhaseType = 'crew' | 'parrot';
export type BoardTileState = 'monster' | 'typhon' | 'water' | 'island' | 'corsair';
export type GameResult = 'won' | 'lost-rhum' | 'lost-corsair' | null;

export interface BoardTileSnapshot {
  x: number;
  y: number;
  state: BoardTileState;
}

export interface BoardPositionSnapshot {
  x: number;
  y: number;
}

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
  userPosition: THREE.Vector2;
  corsairPosition: THREE.Vector2;
  displayCorsair: boolean;
  userPositionHistory: Array<THREE.Vector2>;
  entitiesVisible: boolean;
  focusedView: boolean;
  displayArrows: boolean;
  arrowClicked: string | null;
  boardTiles: BoardTileSnapshot[];
  exhaustedIslandPositions: BoardPositionSnapshot[];
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
  userPosition: {
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
  focusedView: false,
  userPosition: new THREE.Vector2(0, 0),
  displayCorsair: false,
  corsairPosition: new THREE.Vector2(0, 0),
  userPositionHistory: [new THREE.Vector2(0, 0)],
  entitiesVisible: false,
  displayArrows: false,
  arrowClicked: null,
  boardTiles: [],
  exhaustedIslandPositions: [],
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
    userPosition: {
      x: 0,
      y: 0,
    },
    userPositionHistory: [{ x: 0, y: 0 }],
    entitiesVisible: true,
    arrowClicked: null,
    boardTiles: [],
    exhaustedIslandPositions: [],
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
    userPosition: {
      x: gameState.userPosition.x,
      y: gameState.userPosition.y,
    },
    userPositionHistory: gameState.userPositionHistory.map((position) => ({
      x: position.x,
      y: position.y,
    })),
    entitiesVisible: gameState.entitiesVisible,
    arrowClicked: null,
    boardTiles: gameState.boardTiles.map((tile) => ({
      x: tile.x,
      y: tile.y,
      state: tile.state,
    })),
    exhaustedIslandPositions: gameState.exhaustedIslandPositions.map((position) => ({
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
  gameState.userPosition.set(snapshot.userPosition.x, snapshot.userPosition.y);
  gameState.userPositionHistory.splice(
    0,
    gameState.userPositionHistory.length,
    ...snapshot.userPositionHistory.map((position) => new THREE.Vector2(position.x, position.y))
  );
  gameState.entitiesVisible = snapshot.entitiesVisible;
  gameState.boardTiles.splice(
    0,
    gameState.boardTiles.length,
    ...(snapshot.boardTiles ?? []).map((tile) => ({
      x: tile.x,
      y: tile.y,
      state: tile.state,
    }))
  );
  gameState.exhaustedIslandPositions.splice(
    0,
    gameState.exhaustedIslandPositions.length,
    ...(snapshot.exhaustedIslandPositions ?? []).map((position) => ({
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
  gameState.peanutTokens = snapshot.peanutTokens ?? 0;
  gameState.tequilaTonight = snapshot.tequilaTonight ?? false;
  gameState.gameResult = snapshot.gameResult ?? null;
  gameState.gameStartedAt = snapshot.gameStartedAt ?? Date.now();
}

export function resetGameState(): void {
  applyGameStateSnapshot(createDefaultGameStateSnapshot());
}

export function setBoardTiles(tiles: BoardTileSnapshot[]): void {
  gameState.boardTiles.splice(0, gameState.boardTiles.length, ...tiles);
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

export function drawTreasureCards(count: number): TreasureCardInstance[] {
  return gameState.treasureDeck.splice(0, count);
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
  const matchingTile = gameState.boardTiles.find(
    (tile) => tile.x === position.x && tile.y === position.y
  );

  if (!matchingTile) {
    return;
  }

  matchingTile.state = state;
}

export function markIslandExhausted(position: Pick<THREE.Vector2, 'x' | 'y'>): void {
  if (isIslandExhausted(position)) {
    return;
  }

  gameState.exhaustedIslandPositions.push({ x: position.x, y: position.y });
}

export function isIslandExhausted(position: Pick<THREE.Vector2, 'x' | 'y'>): boolean {
  return gameState.exhaustedIslandPositions.some(
    (exhaustedPosition) => exhaustedPosition.x === position.x && exhaustedPosition.y === position.y
  );
}

export function formatBoardCoordinate(position: Pick<THREE.Vector2, 'x' | 'y'>): string {
  return `${'ABCDEFG'[6 - position.y] ?? '?'}${position.x + 1}`;
}

export function getBoardTileStateAtPosition(
  position: Pick<THREE.Vector2, 'x' | 'y'>
): BoardTileState | null {
  const matchingTile = gameState.boardTiles.find(
    (tile) => tile.x === position.x && tile.y === position.y
  );

  return matchingTile?.state ?? null;
}
