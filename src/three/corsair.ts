import * as THREE from 'three/webgpu';
import { gameState } from '../utils/gameStore';
import { modelLoader } from './modelLoader';
import { watch } from 'vue';

export class Corsair {
  private corsairGroup: THREE.Group;
  private isDisplayedInMap: boolean;
  private isDisplayed: boolean;

  constructor(scene: THREE.Scene) {
    this.corsairGroup = new THREE.Group();

    scene.add(this.corsairGroup);

    this.isDisplayedInMap = false;
    this.isDisplayed = false;

    const corsair = modelLoader.get('./models/boat.glb').scene.clone();
    corsair.scale.multiplyScalar(0.5);
    corsair.position.y = -0.1;
    this.corsairGroup.add(corsair);
    this.corsairGroup.rotation.y = Math.PI;

    this.initWatchers();
  }

  public destroy(): void {
    this.corsairGroup.removeFromParent();
    this.corsairGroup.clear();
  }

  public initWatchers(): void {
    watch(
      () => gameState.displayCorsair,
      (isDisplayed) => {
        this.displayCorsair(isDisplayed);
      }
    );
    watch(
      () => gameState.corsairPosition,
      (newPosition) => {
        this.setPosition(newPosition);
      },
      { deep: true }
    );
    this.displayCorsair(gameState.displayCorsair);
    this.setPosition(gameState.userPosition);
  }

  private setPosition(newPosition: THREE.Vector2): void {
    const maxX = 5;
    const maxZ = 7;
    this.corsairGroup.position.x = Math.max(0, Math.min(maxX, newPosition.x));
    this.corsairGroup.position.z = Math.max(0, Math.min(maxZ, newPosition.y));
  }

  private displayCorsair(isDisplayed: boolean): void {
    // display the corsair based on isDisplayed
    this.isDisplayed = isDisplayed;
    this.updateDisplay(isDisplayed, this.isDisplayedInMap);
  }

  public displayCorsairInMap(isDisplayedInMap: boolean): void {
    // display the corsair based on isDisplayed
    this.isDisplayedInMap = isDisplayedInMap;
    this.updateDisplay(this.isDisplayed, isDisplayedInMap);
  }

  private updateDisplay(isDisplayed: boolean, isDisplayedInMap: boolean): void {
    // display if one of two conditions is met
    this.corsairGroup.visible = isDisplayed || isDisplayedInMap;
  }

  public update(time: number): void {
    this.corsairGroup.rotation.y += 0.001;
    this.corsairGroup.rotation.z = Math.sin(time * 0.001 - 1) * 0.4;
  }
}
