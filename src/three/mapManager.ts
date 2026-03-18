import * as THREE from 'three/webgpu';
import { Tile, type TileStateType } from './tile';
import { objectPool } from './instancedModelManger';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { mapGenerator } from './mapGenerator';
import { type PhaseType, gameState } from '../utils/gameStore';
import { watch } from 'vue';
import { DecorativeClouds } from './decorativeClouds';

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

    const newMap = mapGenerator(TILE_AMOUNT_Y, TILE_AMOUNT_X, true);
    console.log(newMap);

    const startPosition = new THREE.Vector2(
      Math.round(Math.random() * 4),
      Math.round(Math.random() * 6)
    );

    newMap.map((mapArrayY, x) => {
      mapArrayY.map((mapValue, y) => {
        const flippedCoin = Math.random() < 0.15 ? 1 : 0;

        const bad =
          y % 2 === 0
            ? x % 2 === flippedCoin
              ? 'monster'
              : 'typhon'
            : x % 2 === 1
              ? 'monster'
              : 'typhon';
        const good =
          y % 2 === 0
            ? x % 2 === flippedCoin
              ? 'island'
              : 'water'
            : x % 2 === 1
              ? 'island'
              : 'water';

        // const tileType = Math.random() < 0.5 ? bad : good;
        console.log('tile :', mapValue);

        const randomizedMapValue = Math.random() < 0.25 ? mapValue : !mapValue;

        let tileType: TileStateType = randomizedMapValue ? bad : good;

        if (startPosition.x === x && startPosition.y === y) {
          tileType = 'water';
        }
        const tile = new Tile(new THREE.Vector2(x, y), tileType);
        this.tiles.push(tile);
        this.mapGroup.add(tile.tileGroup);
      });
    });

    gameState.userPosition = startPosition;
  }

  public displayEntities() {
    this.tiles.forEach((tile) => {
      tile.show();
    });
  }

  public hideEntities() {
    console.log(gameState.userPositionHistory);
    this.tiles.map((tile) => {
      tile.hide();
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
