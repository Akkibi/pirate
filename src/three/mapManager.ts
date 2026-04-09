import * as THREE from 'three/webgpu';
import { Tile } from './tile';
import { objectPool } from './instancedModelManger';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  type BoardTileSnapshot,
  type BoardTileState,
  type PhaseType,
  gameState,
  setBoardTiles,
} from '../utils/gameStore';
import { watch } from 'vue';
import { DecorativeClouds } from './decorativeClouds';
import { gameEvents } from '../events/gameEvents';

const TILE_AMOUNT_X = 5;
const TILE_AMOUNT_Y = 7;

const tileTypes = [
  { name: 'water', url: './models/water.glb' },
  { name: 'island', url: './models/island.glb' },
  { name: 'monster', url: './models/monster.glb' },
  { name: 'typhon', url: './models/typhon.glb' },
  { name: 'fog', url: './models/fog.glb' },
  { name: 'flag', url: './models/flag.glb' },
];

export class MapManager {
  private scene: THREE.Scene;
  private mapGroup: THREE.Group;
  private tiles: Tile[];
  private stopWatchers: Array<() => void> = [];
  private clouds: DecorativeClouds;
  private revealRunId = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.mapGroup = new THREE.Group();
    this.tiles = [];
    this.scene.add(this.mapGroup);

    this.clouds = new DecorativeClouds();
    this.scene.add(this.clouds.cloudGroup);

    objectPool.init(scene, tileTypes).then(() => {
      console.log('all loaded');
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
    this.scene.remove(this.mapGroup, this.clouds.cloudGroup);
  }

  public generateMap(): void {
    // genetate board and board environement
    const loader = new GLTFLoader();
    loader.load('models/board.glb', (gltf) => {
      const model = gltf.scene;
      model.position.add(new THREE.Vector3(0.5, 0, 0.5));
      this.mapGroup.add(model);
    });
    loader.load('models/environement.glb', (gltf) => {
      const model = gltf.scene;
      model.position.add(new THREE.Vector3(0.5, 0, 0.5));
      this.mapGroup.add(model);
    });

    // generate board tiles
    const boardTiles =
      gameState.boardTiles.length > 0 ? gameState.boardTiles : this.createBoardTiles();

    if (gameState.boardTiles.length === 0) {
      setBoardTiles(boardTiles);
    }

    boardTiles.forEach((boardTile) => {
      const tile = new Tile(new THREE.Vector2(boardTile.x, boardTile.y), boardTile.state);
      this.tiles.push(tile);
      this.mapGroup.add(tile.tileGroup);
    });

    const startPosition = new THREE.Vector2(
      Math.round(Math.random() * 4),
      Math.round(Math.random() * 6)
    );
    gameState.userPosition = startPosition;
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

      gameEvents.emit('parrot:map_revealed', {});
    });
  }

  public hideEntities() {
    this.revealRunId += 1;
    console.log(gameState.userPositionHistory);
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
}
