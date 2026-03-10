import * as THREE from 'three/webgpu';
import { Tile } from './tile';
import { objectPool } from './instancedModelManger';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { mapGenerator } from './mapGenerator';
import { type PhaseType, gameState } from '../utils/gameStore';
import { watch } from 'vue';

const TILE_AMOUNT_X = 5;
const TILE_AMOUNT_Y = 7;

const tileTypes = [
  { name: 'water', url: './models/water.glb' },
  { name: 'island', url: './models/island.glb' },
  { name: 'monster', url: './models/monster.glb' },
  { name: 'typhon', url: './models/typhon.glb' },
  { name: 'fog', url: './models/fog.glb' },
];

export class MapManager {
  private scene: THREE.Scene;
  private mapGroup: THREE.Group;
  private tiles: Tile[];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.mapGroup = new THREE.Group();
    this.tiles = [];
    this.scene.add(this.mapGroup);

    objectPool.init(scene, tileTypes).then(() => {
      console.log('all loaded');
      this.generateMap();
      this.updateFog();
    });

    this.initWatchers();
  }

  private initWatchers(): void {
    watch(
      () => gameState.currentPhase,
      (newPhase) => {
        this.setPhase(newPhase);
      }
    );
    watch(
      () => gameState.userPosition,
      (newPosition) => {
        this.setPlayerPosition(newPosition);
      },
      { deep: true }
    );
    watch(
      () => gameState.entitiesVisible,
      (isVisible) => {
        if (isVisible) {
          this.displayEntities();
        } else {
          this.hideEntities();
        }
      }
    );
  }

  updateFog() {
    this.tiles.forEach((tile) => {
      // const distance = 0.4;
      const distance = 0.4;
      tile.setFogPosition();
      tile.setFogAmount(distance);
    });
  }

  generateMap(): void {
    // load gltf from model/board.gltf and put in scene
    const loader = new GLTFLoader();
    loader.load('models/board.glb', (gltf) => {
      const model = gltf.scene;
      model.position.add(new THREE.Vector3(0, -0.75, 0));
      this.mapGroup.add(model);
    });

    const newMap = mapGenerator(TILE_AMOUNT_Y, TILE_AMOUNT_X, true);
    console.log(newMap);
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

        const tileType = randomizedMapValue ? bad : good;

        const tile = new Tile(new THREE.Vector2(x, y), tileType);
        this.tiles.push(tile);
        this.mapGroup.add(tile.tileGroup);
      });
    });
  }

  public displayEntities() {
    this.tiles.forEach((tile) => {
      tile.show();
    });
  }

  public hideEntities() {
    this.tiles.map((tile) => {
      tile.hide();
    });
  }

  public setPhase(phase: PhaseType): void {
    if (phase === 'crew') {
      this.displayEntities();
    } else {
      this.hideEntities();
    }
  }

  public setPlayerPosition(_position: THREE.Vector2): void {
    this.tiles.forEach((tile) => {
      tile.setFogPosition();
    });
  }
}
