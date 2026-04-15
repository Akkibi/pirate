import * as THREE from 'three/webgpu';
import { objectPool } from './instancedModelManger';
import { gsap } from 'gsap';
import { gameState, type BoardTileState } from '../utils/gameStore';
import { watch } from 'vue';
export type TileStateType = BoardTileState;

const FOG_MIN_DISTANCE = 0.612;

export class Tile {
  public position: THREE.Vector2;
  public tileGroup: THREE.Group;
  public state: TileStateType;
  private idx: number;
  private fogIdx: number;
  private waterIdx: number;
  private fogDistance: number;
  private fogDistanceBuffer: number;
  private isHistory: boolean;
  private stopWatcher: (() => void) | null = null;
  private pendingTimeout: ReturnType<typeof setTimeout> | null = null;
  private activeTween: gsap.core.Tween | null = null;

  constructor(position: THREE.Vector2, state: TileStateType) {
    this.position = position;
    this.idx = -1;
    this.waterIdx = -1;
    this.fogIdx = -1;
    this.isHistory = false;
    this.tileGroup = new THREE.Group();
    this.fogDistance = FOG_MIN_DISTANCE;
    this.state = state;
    this.fogDistanceBuffer = FOG_MIN_DISTANCE;
    this.tileGroup.position.set(position.x, 0, position.y);
    console.log('new tile', this.state, position);
    this.updateObject(false);

    // add fog
    this.placeFog();
    if (gameState.entitiesVisible) {
      this.show();
    } else {
      this.hide();
    }

    this.stopWatcher = watch(
      () => gameState.userPosition,
      () => {
        this.setFogPosition();
        if (
          !this.isHistory &&
          gameState.userPosition.x === this.position.x &&
          gameState.userPosition.y === this.position.y
        ) {
          this.isHistory = true;
          console.log('history tile', this.position);

          this.pendingTimeout = setTimeout(() => {
            this.pendingTimeout = null;
            this.updateObject(false);
            this.setTileVisited();
          }, 300);
        }
      },
      { deep: true }
    );
  }

  private setTileVisited() {
    // add a path on the tile
  }

  public destroy() {
    // Stop the watcher FIRST so no further reactions fire during cleanup
    this.stopWatcher?.();
    this.stopWatcher = null;

    // Cancel pending delayed updateObject call
    if (this.pendingTimeout !== null) {
      clearTimeout(this.pendingTimeout);
      this.pendingTimeout = null;
    }

    // Kill any running GSAP tween
    this.activeTween?.kill();
    this.activeTween = null;

    this.tileGroup.remove(...this.tileGroup.children);
    this.tileGroup.removeFromParent();
    this.tileGroup.clear();

    if (this.idx !== -1) {
      objectPool.releaseInstance(this.state, this.idx);
      this.idx = -1;
    }
    if (this.waterIdx !== -1) {
      objectPool.releaseInstance('water', this.waterIdx);
      this.waterIdx = -1;
    }
    if (this.fogIdx !== -1) {
      objectPool.releaseInstance('fog', this.fogIdx);
      this.fogIdx = -1;
    }

    console.log('[Tile] destroyed', this.position.x, this.position.y);
  }

  private updateObject(isHidden: boolean) {
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

    if (this.isRenderableTileState(this.state)) {
      this.placeTile();
    }
    if (this.state !== 'typhon') {
      this.placeWater();
    }
  }

  private isRenderableTileState(
    state: TileStateType
  ): state is Exclude<TileStateType, 'water' | 'corsair'> {
    return state !== 'water' && state !== 'corsair';
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

  smoothMoveFog(hideFog: boolean, oncomplete?: () => void): Promise<void> {
    // Kill any previous tween before starting a new one
    this.activeTween?.kill();
    this.activeTween = null;

    return new Promise((resolve) => {
      const emptyObject = {};
      const scale = 4;
      this.fogDistanceBuffer = FOG_MIN_DISTANCE;

      if (hideFog) {
        const ease = gsap.parseEase('expo.in');
        const tween = gsap.to(emptyObject, {
          duration: 1,
          onUpdate: () => {
            const eased = ease(tween.progress());
            const progress = eased * scale;
            this.fogDistance = this.fogDistanceBuffer + progress;
            this.updateFog();
          },
          ease: 'bounce.inOut',
          onComplete: () => {
            this.activeTween = null;
            oncomplete?.();
            resolve();
          },
        });
        this.activeTween = tween;
        return;
      }

      const ease = gsap.parseEase('expo.out');
      const tween = gsap.to(emptyObject, {
        duration: 2,
        onUpdate: () => {
          const eased = ease(tween.progress());
          const progress = scale - eased * scale;
          this.fogDistance = this.fogDistanceBuffer + progress;
          this.updateFog();
        },
        ease: 'bounce.inOut',
        onComplete: () => {
          this.activeTween = null;
          oncomplete?.();
          resolve();
        },
      });
      this.activeTween = tween;
    });
  }

  public hide(): Promise<void> {
    if (this.isHistory) {
      return Promise.resolve();
    }
    this.updateObject(true);
    return this.smoothMoveFog(true);
  }

  public show(): Promise<void> {
    if (this.isHistory) {
      return Promise.resolve();
    }

    return this.smoothMoveFog(false, () => {
      this.updateObject(false);
    });
  }

  public setFogPosition(): void {
    this.updateFog();
  }

  private updateFog() {
    // if (this.isHistory) return;
    const playerPosition = gameState.userPosition;
    // const isHistory = gameState.userPositionHistory.includes(this.position);

    // circle distance
    // const distance = Math.sqrt(
    //   Math.pow(playerPosition.x - this.position.x, 2) +
    //     Math.pow(playerPosition.y - this.position.y, 2)
    // );

    // diamond distance
    const distance =
      Math.abs(playerPosition.x - this.position.x) + Math.abs(playerPosition.y - this.position.y);

    const calculatedAmount = -Math.max(0, 5 - distance / this.fogDistance);
    // console.log(this.fogDistance, calculatedAmount);

    const opacity = Math.min(1, Math.max(0, 1.5 + calculatedAmount * 1.5));

    objectPool.updatePosition(
      'fog',
      this.fogIdx,
      new THREE.Vector3(this.position.x, calculatedAmount, this.position.y)
    );

    objectPool.updateOpacity('fog', this.fogIdx, opacity);
  }
}
