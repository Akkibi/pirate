import * as THREE from 'three/webgpu';
import { gameState } from '../utils/gameStore';
import { watch } from 'vue';
import { modelLoader } from './modelLoader';
import { createCloudMaterial } from './shaders/cloudMaterial';
import gsap from 'gsap';

export class DecorativeClouds {
  public cloudGroup: THREE.Group;
  private stopWatchers: Array<() => void> = [];

  constructor() {
    this.cloudGroup = new THREE.Group();
    const cloud = modelLoader.get('./models/clouds.glb').scene.clone();
    cloud.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = createCloudMaterial(child.material as THREE.Material);
      }
    });
    cloud.position.add(new THREE.Vector3(0.5, -5, 0.5));
    this.cloudGroup.add(cloud);
    this.cloudGroup.scale.set(1, 1, 1);
    this.initWatchers();
  }

  private initWatchers() {
    this.stopWatchers.push(
      watch(
        () => gameState.entitiesVisible || gameState.displayCorsair,
        (isOverview) => this.updateVisibility(isOverview)
      )
    );
    this.updateVisibility(gameState.entitiesVisible || gameState.displayCorsair);
  }

  public destroy() {
    this.stopWatchers.forEach((stop) => stop());
  }

  private updateVisibility(isOverview: boolean) {
    if (isOverview) {
      gsap.to(this.cloudGroup.position, { y: 5, duration: 1, ease: 'expo.out' });
    } else {
      gsap.to(this.cloudGroup.position, { y: 0, duration: 1, ease: 'expo.out' });
    }
  }
}
