import * as THREE from 'three/webgpu';
import { Tile } from './tile';
import { objectPool } from './instancedModelManger';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { mapGenerator } from './mapGenerator';
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

  generateMap(): void {
    // load gltf from model/board.gltf and put in scene
    const loader = new GLTFLoader();
    loader.load('models/board.glb', (gltf) => {
      const model = gltf.scene;
      model.position.add(new THREE.Vector3(0.5, 0, 0.5));
      this.mapGroup.add(model);
    });

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
    const newMap = mapGenerator(TILE_AMOUNT_Y, TILE_AMOUNT_X, true);
    const boardTiles: BoardTileSnapshot[] = [];

    newMap.forEach((mapArrayY, x) => {
      mapArrayY.forEach((mapValue, y) => {
        const flippedCoin = Math.random() < 0.15 ? 1 : 0;
        const badTile = this.getBoardTileFamily(x, y, flippedCoin, 'bad');
        const goodTile = this.getBoardTileFamily(x, y, flippedCoin, 'good');
        const randomizedMapValue = Math.random() < 0.25 ? mapValue : !mapValue;

        boardTiles.push({
          x,
          y,
          state: randomizedMapValue ? badTile : goodTile,
        });
      });
    });

    return boardTiles;
  }

  private getBoardTileFamily(
    x: number,
    y: number,
    flippedCoin: number,
    family: 'bad' | 'good'
  ): BoardTileState {
    if (family === 'bad') {
      return y % 2 === 0
        ? x % 2 === flippedCoin
          ? 'monster'
          : 'typhon'
        : x % 2 === 1
          ? 'monster'
          : 'typhon';
    }

    return y % 2 === 0
      ? x % 2 === flippedCoin
        ? 'island'
        : 'water'
      : x % 2 === 1
        ? 'island'
        : 'water';
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
