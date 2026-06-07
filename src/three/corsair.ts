import * as THREE from 'three/webgpu';
import { BOARD_TILE_COUNT_X, BOARD_TILE_COUNT_Y, gameState } from '../utils/gameStore';
import { modelLoader } from './modelLoader';
import { watch, type WatchStopHandle } from 'vue';

export class Corsair {
  private corsairGroup: THREE.Group;
  private isDisplayedInMap: boolean;
  private isDisplayed: boolean;
  private stopWatchers: WatchStopHandle[] = [];

  constructor(scene: THREE.Scene) {
    this.corsairGroup = new THREE.Group();

    scene.add(this.corsairGroup);

    this.isDisplayedInMap = false;
    this.isDisplayed = false;

    const corsair = modelLoader.get('./models/corsair.glb').scene.clone();
    corsair.scale.multiplyScalar(0.5);
    this.corsairGroup.add(corsair);
    this.corsairGroup.rotation.y = Math.PI;

    this.initWatchers();
  }

  public destroy(): void {
    this.stopWatchers.forEach((stop) => stop());
    this.stopWatchers = [];
    this.corsairGroup.removeFromParent();
    this.corsairGroup.clear();
  }

  public initWatchers(): void {
    this.stopWatchers.push(
      watch(
        () => gameState.displayCorsair,
        (isDisplayed) => {
          this.displayCorsair(isDisplayed);
        }
      )
    );
    this.stopWatchers.push(
      watch(
        () => gameState.corsairPosition,
        (newPosition) => {
          this.setPosition(newPosition);
        },
        { deep: true }
      )
    );
    this.displayCorsair(gameState.displayCorsair);
    this.setPosition(gameState.corsairPosition);
  }

  private setPosition(newPosition: THREE.Vector2): void {
    const maxX = BOARD_TILE_COUNT_X - 1;
    const maxZ = BOARD_TILE_COUNT_Y - 1;
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
    // this.corsairGroup.rotation.z = Math.sin(time * 0.001 - 1) * 0.4;

    this.corsairGroup.rotation.y += 0.001;
    this.corsairGroup.rotation.z = Math.sin(time * 0.0005) * 0.2;
    this.corsairGroup.position.y = Math.sin(time * 0.001) * 0.025 + 0.12;
  }
}
