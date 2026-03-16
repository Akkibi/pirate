import * as THREE from "three/webgpu";
import { objectPool } from "./instancedModelManger";
import { gsap } from "gsap";
import { gameState } from "../utils/gameStore";
import { watch } from "vue";
export type TileStateType = "monster" | "typhon" | "water" | "island";

export class Tile {
  public position: THREE.Vector2;
  public tileGroup: THREE.Group;
  public state: TileStateType;
  private idx: number;
  private fogIdx: number;
  private waterIdx: number;
  private fogDistance: number;
  private fogDistanceBuffer: number;
  private fogAmount: number;
  private isHistory: boolean;

  constructor(position: THREE.Vector2, state: TileStateType) {
    this.position = position;
    this.idx = -1;
    this.waterIdx = -1;
    this.fogIdx = -1;
    this.isHistory = false;
    this.tileGroup = new THREE.Group();
    this.fogDistance = 0.4;
    this.state = state;
    this.fogAmount = 0.4;
    this.fogDistanceBuffer = 0.4;
    this.tileGroup.position.set(position.x, 0, position.y);
    console.log("new tile", this.state, position);
    this.updateObject(false);

    // add fog
    this.placeFog();

    watch(
      () => gameState.userPosition,
      (newPosition) => {
        gameState.userPositionHistory.push(newPosition.clone());
        this.setFogPosition();
      },
      { deep: true },
    );
  }

  destroy() {
    this.tileGroup.remove(...this.tileGroup.children);
    this.tileGroup.removeFromParent();
  }

  updateObject(isHidden: boolean) {
    this.tileGroup.remove(...this.tileGroup.children);

    // release previous instance
    if (this.idx !== -1) {
      console.log("releasing tile", this.state, this.position);
      objectPool.releaseInstance(this.state, this.idx);
      this.idx = -1;
    }
    if (this.waterIdx !== -1) {
      console.log("releasing tile", "water", this.position);
      objectPool.releaseInstance("water", this.waterIdx);
      this.waterIdx = -1;
    }

    if (isHidden) {
      this.placeWater();
      return;
    }

    if (this.state !== "water") {
      this.placeTile();
    }
    if (this.state !== "typhon") {
      this.placeWater();
    }
  }

  public setFogAmount(amount: number) {
    this.fogAmount = amount;
  }

  private placeFog() {
    if (this.fogIdx !== -1) return;
    this.fogIdx = objectPool.reserveInstance("fog");
    objectPool.updatePosition(
      "fog",
      this.fogIdx,
      new THREE.Vector3(this.position.x, 0, this.position.y),
    );
    objectPool.updateScale(
      "fog",
      this.fogIdx,
      new THREE.Vector3(0.5, 0.5, 0.5),
    );
  }

  private placeTile() {
    if (this.idx !== -1) return;
    this.idx = objectPool.reserveInstance(this.state);
    objectPool.updateTransformFull(
      this.state,
      this.idx,
      new THREE.Vector3(this.position.x, 0, this.position.y),
      this.state === "typhon"
        ? new THREE.Euler(0, 0, 0)
        : new THREE.Euler(0, Math.PI * 2 * Math.random(), 0),
      this.state === "typhon"
        ? new THREE.Vector3(0.5, 0.5, 0.5)
        : new THREE.Vector3(0.4, 0.4, 0.4),
    );
  }

  private placeWater() {
    if (this.waterIdx !== -1) return;
    this.waterIdx = objectPool.reserveInstance("water");
    objectPool.updatePosition(
      "water",
      this.waterIdx,
      new THREE.Vector3(this.position.x, 0, this.position.y),
    );
    objectPool.updateScale(
      "water",
      this.waterIdx,
      new THREE.Vector3(0.5, 0.5, 0.5),
    );
  }

  smoothMoveFog(hideFog: boolean, oncomplete?: () => void) {
    const emptyObject = {};
    const scale = 4;
    this.fogDistanceBuffer = this.fogDistance;
    if (hideFog) {
      const ease = gsap.parseEase("expo.in");
      // console.log('hide clouds');
      const tween = gsap.to(emptyObject, {
        duration: 1,
        onUpdate: () => {
          const eased = ease(tween.progress());
          const progress = eased * scale; // 0 to 1, eased
          // console.log('progress', progress);
          this.fogDistance = this.fogDistanceBuffer + progress;
          this.updateFog();
        },
        ease: "bounce.inOut",
        onComplete: oncomplete,
      });
    } else {
      const ease = gsap.parseEase("expo.out");
      console.log("reverse hide clouds");
      const tween = gsap.to(emptyObject, {
        duration: 2,
        onUpdate: () => {
          const eased = ease(tween.progress());
          const progress = scale - eased * scale; // 0 to 1, eased
          // console.log('progress', progress);
          this.fogDistance = this.fogDistanceBuffer + progress;
          this.updateFog();
        },
        ease: "bounce.inOut",
        onComplete: oncomplete,
      });
    }
  }

  public hide() {
    this.updateObject(true);
    this.smoothMoveFog(true);
    console.log("hide fog");
  }

  public show() {
    if (this.isHistory) return;
    this.smoothMoveFog(false, () => {
      this.updateObject(false);
    });
    console.log("show fog");
  }

  public setFogPosition(): void {
    this.updateFog();
  }

  private updateFog() {
    const playerPosition = gameState.userPosition;
    // const isHistory = gameState.userPositionHistory.includes(this.position);

    const distance = Math.sqrt(
      Math.pow(playerPosition.x - this.position.x, 2) +
        Math.pow(playerPosition.y - this.position.y, 2),
    );
    const calculatedAmount = -Math.max(0, 5 - distance / this.fogAmount);

    objectPool.updatePosition(
      "fog",
      this.fogIdx,
      new THREE.Vector3(this.position.x, calculatedAmount, this.position.y),
    );
  }
}
