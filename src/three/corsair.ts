import * as THREE from 'three/webgpu';
import { BOARD_TILE_COUNT_X, BOARD_TILE_COUNT_Y, gameState } from '../utils/gameStore';
import { modelLoader } from './modelLoader';
import { createAtlasMaterial } from './shaders/atlasMaterial';
import { watch, type WatchStopHandle } from 'vue';
import gsap from 'gsap';
import type { SceneManager } from './sceneManager';

export class Corsair {
  private corsairGroup: THREE.Group;
  private isDisplayedInMap: boolean;
  private isDisplayed: boolean;
  private stopWatchers: WatchStopHandle[] = [];
  private sceneManager: SceneManager;
  private baseX: number = 0;
  private baseZ: number = 0;

  constructor(sceneManager: SceneManager, scene: THREE.Scene) {
    this.sceneManager = sceneManager;
    this.corsairGroup = new THREE.Group();

    scene.add(this.corsairGroup);

    this.isDisplayedInMap = false;
    this.isDisplayed = false;

    const corsair = modelLoader.get('./models/models-no-texture/corsair.glb').scene.clone();
    corsair.scale.multiplyScalar(0.5);
    corsair.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const orig = child.material as THREE.MeshStandardMaterial | THREE.MeshBasicMaterial;
      if (orig.map) {
        const mat = new THREE.MeshBasicNodeMaterial();
        mat.map = orig.map;
        mat.side = THREE.DoubleSide;
        child.material = mat;
      } else {
        child.material = createAtlasMaterial({ side: THREE.DoubleSide });
      }
    });
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
          this.updatePositionShift();
        },
        { deep: true }
      )
    );
    this.stopWatchers.push(
      watch(
        () => gameState.entitiesVisible,
        () => {
          this.updatePositionShift();
        }
      )
    );
    this.displayCorsair(gameState.displayCorsair);
    this.setPosition(gameState.corsairPosition);
    // updatePositionShift not called here — mapManager isn't ready yet
  }

  private setPosition(newPosition: THREE.Vector2): void {
    const maxX = BOARD_TILE_COUNT_X - 1;
    const maxZ = BOARD_TILE_COUNT_Y - 1;
    this.baseX = Math.max(0, Math.min(maxX, newPosition.x));
    this.baseZ = Math.max(0, Math.min(maxZ, newPosition.y));
    this.corsairGroup.position.x = this.baseX;
    this.corsairGroup.position.z = this.baseZ;
  }

  private updatePositionShift(): void {
    if (!this.sceneManager.mapManager) return;

    const tileState = this.sceneManager.mapManager.getTileState(
      new THREE.Vector2(this.baseX, this.baseZ)
    );
    const isSharedTile =
      tileState &&
      (tileState.state === 'island' || tileState.state === 'monster') &&
      !tileState.entitiesHidden;

    if (gameState.entitiesVisible && isSharedTile) {
      gsap.to(this.corsairGroup.position, {
        x: this.baseX + 0.2,
        z: this.baseZ - 0.2,
        duration: 1,
        ease: 'sin.inOut',
        overwrite: true,
      });
    } else {
      gsap.to(this.corsairGroup.position, {
        x: this.baseX,
        z: this.baseZ,
        duration: 1,
        ease: 'sin.inOut',
        overwrite: true,
      });
    }
  }

  private displayCorsair(isDisplayed: boolean): void {
    this.isDisplayed = isDisplayed;
    this.updateDisplay(isDisplayed, this.isDisplayedInMap);
  }

  public displayCorsairInMap(isDisplayedInMap: boolean): void {
    this.isDisplayedInMap = isDisplayedInMap;
    this.updateDisplay(this.isDisplayed, isDisplayedInMap);
    if (isDisplayedInMap) {
      this.updatePositionShift();
    }
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
