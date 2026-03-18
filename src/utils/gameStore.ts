import { reactive } from 'vue';
import * as THREE from 'three/webgpu';

export type PhaseType = 'crew' | 'parrot';
export type BoardTileState = 'monster' | 'typhon' | 'water' | 'island';

export interface BoardTileSnapshot {
  x: number;
  y: number;
  state: BoardTileState;
}

interface StoreInterface {
  currentPhase: PhaseType;
  currentAction: string | null;
  showActionPanel: boolean;
  showVideoOverlay: boolean;
  turnCount: number;
  crewHP: number;
  diceResult: number | null;
  userPosition: THREE.Vector2;
  userPositionHistory: Array<THREE.Vector2>;
  entitiesVisible: boolean;
  focusedView: boolean;
  displayArrows: boolean;
  arrowClicked: string | null;
  boardTiles: BoardTileSnapshot[];
}

export interface GameStateSnapshot {
  currentPhase: PhaseType;
  currentAction: string | null;
  showActionPanel: boolean;
  showVideoOverlay: boolean;
  turnCount: number;
  crewHP: number;
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
}

export const gameState = reactive({
  currentPhase: 'crew',
  currentAction: null as string | null,
  showActionPanel: false,
  showVideoOverlay: false,
  turnCount: 0,
  crewHP: 3,
  diceResult: null,
  focusedView: false,
  userPosition: new THREE.Vector2(0, 0),
  userPositionHistory: [new THREE.Vector2(0, 0)],
  entitiesVisible: false,
  displayArrows: false,
  arrowClicked: null,
  boardTiles: [],
} as StoreInterface);

function createDefaultGameStateSnapshot(): GameStateSnapshot {
  return {
    currentPhase: 'crew',
    currentAction: null,
    showActionPanel: false,
    showVideoOverlay: false,
    turnCount: 0,
    crewHP: 3,
    diceResult: null,
    userPosition: {
      x: 0,
      y: 0,
    },
    userPositionHistory: [{ x: 0, y: 0 }],
    entitiesVisible: true,
    arrowClicked: null,
    boardTiles: [],
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
  };
}

export function applyGameStateSnapshot(snapshot: GameStateSnapshot): void {
  gameState.currentPhase = snapshot.currentPhase;
  gameState.currentAction = snapshot.currentAction;
  gameState.showActionPanel = snapshot.showActionPanel;
  gameState.showVideoOverlay = snapshot.showVideoOverlay;
  gameState.turnCount = snapshot.turnCount;
  gameState.crewHP = snapshot.crewHP;
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
}

export function resetGameState(): void {
  applyGameStateSnapshot(createDefaultGameStateSnapshot());
}

export function setBoardTiles(tiles: BoardTileSnapshot[]): void {
  gameState.boardTiles.splice(0, gameState.boardTiles.length, ...tiles);
}

export function getBoardTileStateAtPosition(
  position: Pick<THREE.Vector2, 'x' | 'y'>
): BoardTileState | null {
  const matchingTile = gameState.boardTiles.find(
    (tile) => tile.x === position.x && tile.y === position.y
  );

  return matchingTile?.state ?? null;
}
