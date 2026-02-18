import * as THREE from 'three/webgpu';

export type TileStateType = 'monster' | 'typhon' | 'water' | 'island';

export class Tile {
  public position: THREE.Vector2;
  public tileGroup: THREE.Group;
  public state: TileStateType;

  constructor(position: THREE.Vector2, state: TileStateType) {
    this.position = position;
    this.tileGroup = new THREE.Group();
    this.state = state;
    this.tileGroup.position.set(position.x, 0, position.y);
    console.log('new tile', this.state, position);
    this.updateState(this.state);
  }

  updateState(newState: TileStateType) {
    this.state = newState;
    this.tileGroup.remove(...this.tileGroup.children);

    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(0.99, 0.99),
      new THREE.MeshBasicMaterial({ color: 0x00ffff })
    );
    water.position.y = -0.25;
    water.rotation.x = -Math.PI / 2;
    this.tileGroup.add(water);

    switch (this.state) {
      case 'monster':
        this.tileGroup.add(
          new THREE.Mesh(
            new THREE.SphereGeometry(0.25),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
          )
        );
        break;
      case 'typhon':
        this.tileGroup.add(
          new THREE.Mesh(
            new THREE.ConeGeometry(0.25, 0.25),
            new THREE.MeshBasicMaterial({ color: 0xff00ff })
          )
        );
        break;
      case 'island':
        this.tileGroup.add(
          new THREE.Mesh(
            new THREE.CylinderGeometry(0.25, 0.25, 0.25),
            new THREE.MeshBasicMaterial({ color: 0x00ff00 })
          )
        );
        break;
      default:
        break;
    }
  }
}
