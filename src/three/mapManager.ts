import * as THREE from 'three/webgpu';
import { Tile, type TileStateType } from './tile';

const TILE_AMOUNT_X = 11;
const TILE_AMOUNT_Y = 15;

export class MapManager {
  private scene: THREE.Scene;
  private mapGroup: THREE.Group;
  private tiles: Tile[];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.mapGroup = new THREE.Group();
    this.tiles = [];
    this.scene.add(this.mapGroup);
  }

  generateMap(): void {
    // Generate basic floor
    const waterFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(TILE_AMOUNT_X + 0.5, TILE_AMOUNT_Y + 0.5),
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    waterFloor.position.x = (TILE_AMOUNT_X - 0.5) * 0.5;
    waterFloor.position.z = (TILE_AMOUNT_Y - 0.5) * 0.5;
    waterFloor.position.y = -0.3;
    waterFloor.rotation.x = -Math.PI / 2;
    this.mapGroup.add(waterFloor);

    // Generate map logic here
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

  updateTile(x: number, y: number, state: TileStateType): void {
    const tile = this.tiles.find((t) => t.position.x === x && t.position.y === y);
    if (tile) {
      tile.updateState(state);
    }
  }
}
