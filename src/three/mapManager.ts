import * as THREE from 'three/webgpu';
import { Tile } from './tile';
import { objectPool } from './instancedModelManger';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { mapGenerator } from './mapGenerator';
import type { PhaseType } from '../utils/gameStore';

const TILE_AMOUNT_X = 11;
const TILE_AMOUNT_Y = 15;

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
  private boat: THREE.Object3D;
  private bird: THREE.Object3D;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.mapGroup = new THREE.Group();
    this.tiles = [];
    this.scene.add(this.mapGroup);

    this.boat = new THREE.Object3D();
    this.bird = new THREE.Group();

    objectPool.init(scene, tileTypes).then(() => {
      console.log('all loaded');
      this.generateMap();
      this.tiles.forEach((tile) => {
        // const distance = 0.4;
        const distance = 10;
        tile.updateFogDistance(new THREE.Vector2(2, 2), distance);
      });
    });

    // setInterval(() => {
    //   this.hideEntities();
    //   setTimeout(() => {
    //     this.displayEntities();
    //   }, 5000);
    // }, 15000);
  }

  generateMap(): void {
    // Generate map logic here
    this.mapGroup.remove(this.bird);

    // load gltf from model/board.gltf and put in scene
    const loader = new GLTFLoader();
    loader.load('models/board.glb', (gltf) => {
      const model = gltf.scene;
      model.position.add(new THREE.Vector3(0, -0.5, 0));
      this.mapGroup.add(model);
    });

    loader.load('models/boat.glb', (gltf) => {
      this.boat = gltf.scene;
      this.boat.scale.multiplyScalar(0.5);
      this.boat.position.add(new THREE.Vector3(2, 0, 2));
      this.mapGroup.add(this.boat);
    });

    loader.load('models/bird.glb', (gltf) => {
      this.bird.add(gltf.scene);
      this.bird.scale.multiplyScalar(0.5);
      this.bird.position.add(new THREE.Vector3(2, 0, 2));
      this.mapGroup.add(this.bird);
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

  public update(time: number) {
    this.boat.rotation.y += 0.001;
    this.boat.rotation.z = Math.sin(time * 0.001 - 1) * 0.5;

    this.bird.rotation.y += 0.003;
    this.bird.position.y = Math.sin(time * 0.001) * 0.1 + 0.75;
  }

  public displayEntities() {
    this.tiles.map((tile) => {
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
}
