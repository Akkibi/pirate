import * as THREE from 'three/webgpu';
import { objectPool } from './instancedModelManger';
import { gsap } from 'gsap';
export type TileStateType = 'monster' | 'typhon' | 'water' | 'island';

export class Tile {
  public position: THREE.Vector2;
  public tileGroup: THREE.Group;
  public state: TileStateType;
  private idx: number;
  private fogIdx: number;
  private waterIdx: number;
  private fogDistance: number;
  private fogPosition: THREE.Vector2;

  constructor(position: THREE.Vector2, state: TileStateType) {
    this.position = position;
    this.idx = -1;
    this.waterIdx = -1;
    this.fogIdx = -1;
    this.tileGroup = new THREE.Group();
    this.fogDistance = 0;
    this.fogPosition = new THREE.Vector2();
    this.state = state;
    this.tileGroup.position.set(position.x, 0, position.y);
    console.log('new tile', this.state, position);
    this.updateObject(false);

    // add fog
    this.placeFog();
  }

  updateObject(isHidden: boolean) {
    this.tileGroup.remove(...this.tileGroup.children);

    // release previous instance
    if (this.idx !== -1) {
      console.log('releasing tile', this.state, this.position);
      objectPool.releaseInstance(this.state, this.idx);
      this.idx = -1;
    }
    if (this.waterIdx !== -1) {
      console.log('releasing tile', 'water', this.position);
      objectPool.releaseInstance('water', this.waterIdx);
      this.waterIdx = -1;
    }

    if (isHidden) {
      this.placeWater();
      return;
    }

    if (this.state !== 'water') {
      this.placeTile();
    }
    if (this.state !== 'typhon') {
      this.placeWater();
    }
  }

  updateFogDistance(position: THREE.Vector2, amount: number) {
    this.fogDistance = amount;
    this.fogPosition = position;
    this.updateFogPosition(position, amount);
  }

  private updateFogPosition(position: THREE.Vector2, amount: number) {
    const distance = Math.sqrt(
      Math.pow(position.x - this.position.x, 2) + Math.pow(position.y - this.position.y, 2)
    );
    const calculatedAmount = -Math.max(0, 5 - distance / amount);

    objectPool.updatePosition(
      'fog',
      this.fogIdx,
      new THREE.Vector3(this.position.x, calculatedAmount, this.position.y)
    );
  }

  private placeFog() {
    if (this.fogIdx !== -1) return;
    this.fogIdx = objectPool.reserveInstance('fog');
    objectPool.updatePosition(
      'fog',
      this.fogIdx,
      new THREE.Vector3(this.position.x, 0, this.position.y)
    );
    objectPool.updateScale('fog', this.fogIdx, new THREE.Vector3(0.5, 0.5, 0.5));
  }

  private placeTile() {
    if (this.idx !== -1) return;
    this.idx = objectPool.reserveInstance(this.state);
    objectPool.updateTransformFull(
      this.state,
      this.idx,
      new THREE.Vector3(this.position.x, 0, this.position.y),
      this.state === 'typhon'
        ? new THREE.Euler(0, 0, 0)
        : new THREE.Euler(0, Math.PI * 2 * Math.random(), 0),
      this.state === 'typhon' ? new THREE.Vector3(0.5, 0.5, 0.5) : new THREE.Vector3(0.4, 0.4, 0.4)
    );
  }

  private placeWater() {
    if (this.waterIdx !== -1) return;
    this.waterIdx = objectPool.reserveInstance('water');
    objectPool.updatePosition(
      'water',
      this.waterIdx,
      new THREE.Vector3(this.position.x, 0, this.position.y)
    );
    objectPool.updateScale('water', this.waterIdx, new THREE.Vector3(0.5, 0.5, 0.5));
  }

  smoothMoveFog(hideFog: boolean, oncomplete?: () => void) {
    const emptyObject = {};
    const scale = 4;
    if (hideFog) {
      const ease = gsap.parseEase('expo.in');
      console.log('hide clouds');
      const tween = gsap.to(emptyObject, {
        duration: 1,
        onUpdate: () => {
          const eased = ease(tween.progress());
          const progress = eased * scale; // 0 to 1, eased
          // console.log('progress', progress);
          this.updateFogPosition(this.fogPosition, this.fogDistance + progress);
        },
        ease: 'bounce.inOut',
        onComplete: oncomplete,
      });
    } else {
      const ease = gsap.parseEase('expo.out');
      console.log('reverse hide clouds');
      const tween = gsap.to(emptyObject, {
        duration: 2,
        onUpdate: () => {
          const eased = ease(tween.progress());
          const progress = scale - eased * scale; // 0 to 1, eased
          // console.log('progress', progress);
          this.updateFogPosition(this.fogPosition, this.fogDistance + progress);
        },
        ease: 'bounce.inOut',
        onComplete: oncomplete,
      });
    }
  }

  public hide() {
    this.updateObject(true);
    this.smoothMoveFog(true);
  }

  public show() {
    this.smoothMoveFog(false, () => {
      this.updateObject(false);
    });
  }
}
