import * as THREE from 'three/webgpu';
import { Tile, type TileStateType } from './tile';
import { objectPool } from './instancedModelManger';
import { modelLoader } from './modelLoader';
import {
  type BoardTileSnapshot,
  type BoardTileState,
  type PhaseType,
  gameState,
  setBoardTiles,
} from '../utils/gameStore';
import { watch } from 'vue';
import { gameEvents } from '../events/gameEvents';
import type { SceneManager } from './sceneManager';
import { createWaterMaterial } from './shaders/waterMaterial';
import { createIslandMaterial } from './shaders/islandMaterial';
import { createTyphonMaterial } from './shaders/typhonMaterial';

const TILE_AMOUNT_X = 5;
const TILE_AMOUNT_Y = 7;
const MONSTER_POOL_KEYS = ['monster_baleine', 'monster_pieuvre', 'monster_serpent'] as const;

const tileTypes = [
  {
    name: 'water',
    url: './models/water.glb',
    materialBuilder: (
      _orig: THREE.Material | null,
      opacity: Parameters<typeof createWaterMaterial>[0]
    ) => createWaterMaterial(opacity),
  },
  {
    name: 'island',
    url: './models/island.glb',
    materialBuilder: (
      orig: THREE.Material | null,
      opacity: Parameters<typeof createIslandMaterial>[1]
    ) => createIslandMaterial(orig, opacity),
  },
  {
    name: 'monster_baleine',
    url: './models/monsters/baleine.glb',
    materialBuilder: (
      orig: THREE.Material | null,
      opacity: Parameters<typeof createIslandMaterial>[1]
    ) => createIslandMaterial(orig, opacity),
  },
  {
    name: 'monster_pieuvre',
    url: './models/monsters/pieuvre.glb',
    materialBuilder: (
      orig: THREE.Material | null,
      opacity: Parameters<typeof createIslandMaterial>[1]
    ) => createIslandMaterial(orig, opacity),
  },
  {
    name: 'monster_serpent',
    url: './models/monsters/serpent.glb',
    materialBuilder: (
      orig: THREE.Material | null,
      opacity: Parameters<typeof createIslandMaterial>[1]
    ) => createIslandMaterial(orig, opacity),
  },
  {
    name: 'typhon',
    url: './models/typhon.glb',
    materialBuilder: (
      _orig: THREE.Material | null,
      opacity: Parameters<typeof createTyphonMaterial>[0]
    ) => createTyphonMaterial(opacity),
  },
  { name: 'fog', url: './models/fog.glb' },
  { name: 'flag', url: './models/flag.glb' },
];

export class MapManager {
  private scene: THREE.Scene;
  private mapGroup: THREE.Group;
  private tiles: Tile[];
  private stopWatchers: Array<() => void> = [];
  private revealRunId = 0;
  private sceneManager: SceneManager;

  constructor(sceneManager: SceneManager, scene: THREE.Scene) {
    this.scene = scene;
    this.sceneManager = sceneManager;
    this.mapGroup = new THREE.Group();
    this.tiles = [];
    this.scene.add(this.mapGroup);

    // generate board and board environment
    const board = modelLoader.get('./models/board.glb').scene.clone();
    board.position.add(new THREE.Vector3(0.5, 0, 0.5));
    this.mapGroup.add(board);

    const environment = modelLoader.get('./models/environement.glb').scene.clone();
    environment.position.add(new THREE.Vector3(0.5, 0, 0.5));
    this.mapGroup.add(environment);

    objectPool.init(scene, tileTypes).then(() => {
      // Island writes depth (depthWrite=true) and must render before water.
      // Water (depthWrite=false) renders after and uses the depth test to correctly
      // occlude submerged island geometry without blocking the see-through effect.
      objectPool.getInstancedMesh('water').renderOrder = 1;
      objectPool.getInstancedMesh('typhon').renderOrder = 1;
      this.generateMap();
    });

    this.initWatchers();
  }

  private initWatchers(): void {
    this.stopWatchers.push(
      watch(
        () => gameState.userPosition,
        (newPosition) => {
          gameState.userPositionHistory.push(newPosition.clone());
        },
        { deep: true }
      )
    );
    this.stopWatchers.push(
      watch(
        () => gameState.currentPhase,
        (newPhase) => {
          this.setPhase(newPhase);
        }
      )
    );
    this.stopWatchers.push(
      watch(
        () => gameState.userPosition,
        (newPosition) => {
          this.setPlayerPosition(newPosition);
        },
        { deep: true }
      )
    );
    this.stopWatchers.push(
      watch(
        () => gameState.entitiesVisible,
        (isVisible) => {
          if (isVisible) {
            this.displayEntities();
          } else {
            this.hideEntities();
          }
        }
      )
    );
  }

  public destroy(): void {
    // Stop all watchers
    this.stopWatchers.forEach((stop) => stop());
    this.stopWatchers = [];

    // Destroy all tiles
    this.tiles.forEach((tile) => {
      tile.destroy();
    });
    this.tiles = [];

    // Remove mapGroup from scene
    this.mapGroup.children.forEach((child) => {
      this.scene.remove(child);
      child.clear();
    });
    this.scene.remove(this.mapGroup);
  }

  public generateMap(): void {
    const startPosition = new THREE.Vector2(
      Math.round(Math.random() * 4),
      Math.round(Math.random() * 6)
    );
    gameState.userPosition = startPosition;

    // generate board tiles
    const boardTiles =
      gameState.boardTiles.length > 0 ? gameState.boardTiles : this.createBoardTiles();

    if (gameState.boardTiles.length === 0) {
      setBoardTiles(boardTiles);
    }

    boardTiles.forEach((boardTile) => {
      const tile = new Tile(
        new THREE.Vector2(boardTile.x, boardTile.y),
        boardTile.state,
        boardTile.monsterType
      );
      this.tiles.push(tile);
      this.mapGroup.add(tile.tileGroup);
    });
  }

  private createBoardTiles(): BoardTileSnapshot[] {
    const boardTiles: BoardTileSnapshot[] = [];

    for (let x = 0; x < TILE_AMOUNT_X; x++) {
      for (let y = 0; y < TILE_AMOUNT_Y; y++) {
        boardTiles.push({
          x,
          y,
          state: 'water',
        });
      }
    }

    this.positionGroup('island', boardTiles);
    this.positionGroup('typhon', boardTiles);
    this.positionGroup('monster', boardTiles);

    boardTiles.forEach((tile) => {
      if (tile.state === 'monster') {
        tile.monsterType = MONSTER_POOL_KEYS[Math.floor(Math.random() * MONSTER_POOL_KEYS.length)];
      }
    });

    // place water at the spot of boat

    boardTiles.forEach((tile) => {
      if (gameState.userPosition.x === tile.x && gameState.userPosition.y === tile.y) {
        tile.state = 'water';
      }
    });

    return boardTiles;
  }

  private positionGroup(group: BoardTileState, boardTiles: BoardTileSnapshot[]): void {
    const totalCount = group === 'island' ? 9 : Math.round(Math.random()) + 8; // 8 or 9
    const blackCount = 4;
    const whiteCount = totalCount - blackCount; // 4 or 5

    const getPool = (parity: number) => boardTiles.filter((t) => (t.x + t.y) % 2 === parity);

    const tryPlace = (pool: BoardTileSnapshot[]): boolean => {
      for (let attempt = 0; attempt < 10; attempt++) {
        const candidate =
          pool[Math.floor(Math.random() * pool.length)] ?? ({} as BoardTileSnapshot);

        if (candidate.state !== 'water') continue;

        const sameTypeNeighbors = boardTiles.filter(
          (t) =>
            t.state === group &&
            ((Math.abs(t.x - candidate.x) === 1 && t.y === candidate.y) ||
              (Math.abs(t.y - candidate.y) === 1 && t.x === candidate.x))
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

    for (let i = 0; i < blackCount; i++) {
      if (!tryPlace(blackPool)) break;
    }

    for (let i = 0; i < whiteCount; i++) {
      if (!tryPlace(whitePool)) break;
    }
  }

  public displayEntities() {
    const revealRunId = ++this.revealRunId;
    const revealAnimations = this.tiles.map((tile) => tile.show());

    void Promise.all(revealAnimations).then(() => {
      if (revealRunId !== this.revealRunId || !gameState.entitiesVisible) {
        return;
      }

      this.sceneManager.corsair.displayCorsairInMap(true);

      gameEvents.emit('parrot:map_revealed', {});
    });
  }

  public hideEntities() {
    this.revealRunId += 1;
    console.log(gameState.userPositionHistory);

    this.sceneManager.corsair.displayCorsairInMap(false);
    this.tiles.forEach((tile) => {
      void tile.hide();
    });
  }

  public setPhase(phase: PhaseType): void {
    console.log(phase);
    // if (phase === 'crew') {
    //   this.displayEntities();
    // } else {
    //   this.hideEntities();
    // }
  }

  public setPlayerPosition(_position: THREE.Vector2): void {
    this.tiles.forEach((tile) => {
      tile.setFogPosition();
    });
    console.log('position list:', gameState.userPositionHistory);
  }

  public getTileState(
    position: THREE.Vector2
  ): { state: TileStateType; entitiesHidden: boolean } | null {
    const tile = this.tiles.find((tile) => tile.position.equals(position));
    return tile ? { state: tile.state, entitiesHidden: tile.isHidden } : null;
  }
}
