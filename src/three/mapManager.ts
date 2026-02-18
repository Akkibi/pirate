import * as THREE from 'three/webgpu';
import { Tile, type TileStateType } from './tile';
import { objectPool } from './instancedModelManger';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const TILE_AMOUNT_X = 11;
const TILE_AMOUNT_Y = 15;

const tileTypes = [
  { name: 'water', url: './models/water.glb' },
  { name: 'island', url: './models/island.glb' },
  { name: 'monster', url: './models/monster.glb' },
  { name: 'typhon', url: './models/typhon.glb' },
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
    });
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

    for (let x = 0; x < TILE_AMOUNT_X; x++) {
      for (let y = 0; y < TILE_AMOUNT_Y; y++) {
        const bad = Math.random() < 0.5 ? 'monster' : 'typhon';
        const good = Math.random() < 0.5 ? 'island' : 'water';

        const tileType = Math.random() < 0.5 ? bad : good;

        const tile = new Tile(new THREE.Vector2(x, y), tileType);
        this.tiles.push(tile);
        this.mapGroup.add(tile.tileGroup);
      }
    }
  }

  public update(time: number) {
    this.boat.rotation.y += 0.001;
    this.boat.rotation.z = Math.sin(time * 0.001) * 0.5;

    this.bird.rotation.y += 0.003;
  }

  updateTile(x: number, y: number, state: TileStateType): void {
    const tile = this.tiles.find((t) => t.position.x === x && t.position.y === y);
    if (tile) {
      tile.updateState(state);
    }
  }
}
