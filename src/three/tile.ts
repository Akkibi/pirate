import * as THREE from 'three/webgpu';
import { objectPool } from './instancedModelManager';
import { gsap } from 'gsap';
import { gameState, isIslandGreyed, type BoardTileState } from '../utils/gameStore';
import { instanceTween } from '../utils/instanceTween';
export type TileStateType = BoardTileState;

const FOG_MIN_DISTANCE = 0.612;

export class Tile {
  public position: THREE.Vector2;
  public tileGroup: THREE.Group;
  public state: TileStateType;
  public monsterType: string | null = null;
  private idx: number;
  private activePoolKey: string | null = null;
  private fogIdx: number;
  private waterIdx: number;
  private fogDistance: number;
  private fogDistanceBuffer: number;
  public isHistory: boolean;
  private pendingTimeout: ReturnType<typeof setTimeout> | null = null;
  private activeTween: gsap.core.Tween | null = null;
  private isTileShared: boolean = false;
  public isHidden: boolean;

  constructor(position: THREE.Vector2, state: TileStateType, monsterType?: string) {
    this.position = position;
    this.idx = -1;
    this.waterIdx = -1;
    this.fogIdx = -1;
    this.isHistory = false;
    this.tileGroup = new THREE.Group();
    this.fogDistance = FOG_MIN_DISTANCE;
    this.state = state;
    if (state === 'monster') {
      this.monsterType = monsterType ?? null;
    }
    this.fogDistanceBuffer = FOG_MIN_DISTANCE;
    this.tileGroup.position.set(position.x, 0, position.y);
    this.updateObject(false);
    this.isHidden = false;

    this.placeFog();
    if (gameState.entitiesVisible) {
      this.show();
    } else {
      this.hide();
    }
  }

  public setTileVisited() {
    this.isHistory = true;
    this.pendingTimeout = setTimeout(() => {
      this.pendingTimeout = null;
      this.isHidden = false;
      this.updateObject(false);
      this.updatePositionShift();
    }, 300);
  }

  public updatePositionShift() {
    if (this.idx === -1 || this.state === 'water' || this.state === 'typhon') return;

    const poolKey = this.activePoolKey ?? this.poolKey;

    if (
      !this.isTileShared &&
      (this.isHistory || gameState.userPosition.equals(this.position)) &&
      gameState.userPosition.x === this.position.x &&
      gameState.userPosition.y === this.position.y
    ) {
      instanceTween.to(this.poolKey, this.idx, {
        x: this.position.x - 0.2,
        z: this.position.y + 0.2,
        duration: 2,
        ease: 'expo.out',
      });

      if (this.state === 'monster') {
        const posProxy = { y: 0 };
        gsap.to(posProxy, {
          y: 0.5,
          duration: 0.5,
          ease: 'sin.inOut',
          yoyo: true,
          repeat: 1,
          onUpdate: () => {
            objectPool.updatePosition(
              this.poolKey,
              this.idx,
              new THREE.Vector3(this.position.x - 0.2, posProxy.y, this.position.y + 0.2)
            );
          },
        });

        const mat = new THREE.Matrix4();
        const quat = new THREE.Quaternion();
        const pos = new THREE.Vector3();
        const scale = new THREE.Vector3();
        objectPool.getInstancedMesh(this.poolKey).getMatrixAt(this.idx, mat);
        mat.decompose(pos, quat, scale);
        const startAngle = new THREE.Euler().setFromQuaternion(quat).y;
        const rotProxy = { angle: startAngle };
        gsap.to(rotProxy, {
          angle: startAngle + Math.PI * 2,
          duration: 1,
          ease: 'expo.out',
          onUpdate: () => {
            objectPool.updateRotation(
              this.poolKey,
              this.idx,
              new THREE.Euler(0, rotProxy.angle, 0)
            );
          },
        });
      }

      this.isTileShared = true;
      return;
    } else if (this.isTileShared) {
      instanceTween.to(poolKey, this.idx, {
        x: this.position.x,
        z: this.position.y,
        duration: 2,
        ease: 'expo.out',
      });
      this.isTileShared = false;
    }
  }

  private shouldUseExhaustedIslandPool(): boolean {
    return this.state === 'island' && isIslandGreyed(this.position);
  }

  public syncIslandVisualState(): void {
    if (this.state !== 'island' || this.idx === -1) {
      return;
    }

    const nextPoolKey = this.poolKey;

    if (this.activePoolKey === nextPoolKey) {
      return;
    }

    this.isTileShared = false;
    this.updateObject(this.isHidden);
    this.updatePositionShift();
  }

  public destroy() {
    // Stop watchers before cleanup so no further reactions fire during teardown
    if (this.pendingTimeout !== null) {
      clearTimeout(this.pendingTimeout);
      this.pendingTimeout = null;
    }

    this.activeTween?.kill();
    this.activeTween = null;

    this.tileGroup.remove(...this.tileGroup.children);
    this.tileGroup.removeFromParent();
    this.tileGroup.clear();

    if (this.idx !== -1) {
      objectPool.releaseInstance(this.activePoolKey ?? this.poolKey, this.idx);
      this.idx = -1;
      this.activePoolKey = null;
    }
    if (this.waterIdx !== -1) {
      objectPool.releaseInstance('water', this.waterIdx);
      this.waterIdx = -1;
    }
    if (this.fogIdx !== -1) {
      objectPool.releaseInstance('fog', this.fogIdx);
      this.fogIdx = -1;
    }
  }

  private updateObject(isHidden: boolean) {
    this.tileGroup.remove(...this.tileGroup.children);

    if (this.idx !== -1) {
      objectPool.releaseInstance(this.activePoolKey ?? this.poolKey, this.idx);
      this.idx = -1;
      this.activePoolKey = null;
    }
    if (this.waterIdx !== -1) {
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

  private get poolKey(): string {
    if (this.shouldUseExhaustedIslandPool()) {
      return 'island_exhausted';
    }

    return this.state === 'monster' && this.monsterType ? this.monsterType : this.state;
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
      new THREE.Vector3(this.position.x, -10, this.position.y)
    );
    objectPool.updateScale('fog', this.fogIdx, new THREE.Vector3(0.5, 0.5, 0.5));
  }

  private placeTile() {
    if (this.idx !== -1) return;
    const poolKey = this.poolKey;
    this.idx = objectPool.reserveInstance(poolKey);
    this.activePoolKey = poolKey;
    objectPool.updateTransformFull(
      poolKey,
      this.idx,
      new THREE.Vector3(this.position.x, 0, this.position.y),
      this.state === 'typhon'
        ? new THREE.Euler(0, 0, 0)
        : new THREE.Euler(0, Math.PI * 2 * Math.random(), 0),
      this.state === 'typhon' ? new THREE.Vector3(0.5, 0.5, 0.5) : new THREE.Vector3(0.4, 0.4, 0.4)
    );
  }

  public setState(state: TileStateType, monsterType?: string | null): void {
    const nextMonsterType = state === 'monster' ? (monsterType ?? null) : null;

    if (this.state === state && this.monsterType === nextMonsterType) {
      return;
    }

    this.state = state;
    this.monsterType = nextMonsterType;
    this.isTileShared = false;
    this.updateObject(this.isHidden);
    this.updatePositionShift();
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
            this.fogDistance = this.fogDistanceBuffer + eased * scale;
            this.updateFog();
          },
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
          this.fogDistance = this.fogDistanceBuffer + scale - eased * scale;
          this.updateFog();
        },
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
      if (this.isHidden) {
        this.isHidden = false;
        this.updateObject(false);
        this.updatePositionShift();
      }

      return Promise.resolve();
    }
    this.isHidden = true;
    this.updateObject(true);
    return this.smoothMoveFog(true);
  }

  public show(): Promise<void> {
    if (this.isHistory) {
      if (this.isHidden) {
        this.isHidden = false;
        this.updateObject(false);
        this.updatePositionShift();
      }

      return Promise.resolve();
    }
    this.isHidden = false;
    return this.smoothMoveFog(false, () => {
      this.updateObject(false);
    });
  }

  public setFogPosition(): void {
    this.updateFog();
  }

  private updateFog() {
    const playerPosition = gameState.userPosition;
    // Manhattan distance matches the diamond-shaped fog reveal area
    const distance =
      Math.abs(playerPosition.x - this.position.x) + Math.abs(playerPosition.y - this.position.y);

    const calculatedAmount = -Math.max(0, 5 - distance / this.fogDistance);
    const opacity = Math.min(1, Math.max(0, 1.5 + calculatedAmount * 1.5));

    objectPool.updatePosition(
      'fog',
      this.fogIdx,
      new THREE.Vector3(this.position.x, calculatedAmount, this.position.y)
    );

    objectPool.updateOpacity('fog', this.fogIdx, opacity);
  }
}
