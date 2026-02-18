import * as THREE from 'three/webgpu';
import { objectPool } from './instancedModelManger';

export type TileStateType = 'monster' | 'typhon' | 'water' | 'island';

export class Tile {
  public position: THREE.Vector2;
  public tileGroup: THREE.Group;
  public state: TileStateType;
  private idx: number;
  private waterIdx: number;

  constructor(position: THREE.Vector2, state: TileStateType) {
    this.position = position;
    this.idx = -1;
    this.waterIdx = -1;
    this.tileGroup = new THREE.Group();
    this.state = state;
    this.tileGroup.position.set(position.x, 0, position.y);
    console.log('new tile', this.state, position);
    this.updateState(this.state);
  }

  updateState(newState: TileStateType) {
    this.state = newState;
    this.tileGroup.remove(...this.tileGroup.children);

    if (this.idx !== -1) {
      console.log('releasing tile', this.state, this.position);
      objectPool.releaseInstance(this.state, this.idx);
    }
    if (this.waterIdx !== -1) {
      console.log('releasing tile', 'water', this.position);
      objectPool.releaseInstance(this.state, this.idx);
    }

    // place tile with model
    if (this.state !== 'water') {
      this.idx = objectPool.reserveInstance(this.state);
      objectPool.updateTransformFull(
        this.state,
        this.idx,
        new THREE.Vector3(this.position.x, 0, this.position.y),
        this.state === 'typhon'
          ? new THREE.Euler(0, 0, 0)
          : new THREE.Euler(0, Math.PI * 2 * Math.random(), 0),
        new THREE.Vector3(0.5, 0.5, 0.5)
      );
    }
    if (this.state !== 'typhon') {
      // place water
      this.waterIdx = objectPool.reserveInstance('water');
      objectPool.updatePosition(
        'water',
        this.waterIdx,
        new THREE.Vector3(this.position.x, 0, this.position.y)
      );
      objectPool.updateScale('water', this.waterIdx, new THREE.Vector3(0.5, 0.5, 0.5));
    }
  }
}
