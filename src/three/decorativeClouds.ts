import * as THREE from 'three/webgpu';
import { gameState, type PhaseType } from '../utils/gameStore';
import { watch } from 'vue';
import { modelLoader } from './modelLoader';
import gsap from 'gsap';

export class DecorativeClouds {
  public cloudGroup: THREE.Group;
  private stopWatchers: Array<() => void> = [];

  constructor() {
    this.cloudGroup = new THREE.Group();

    const cloud = modelLoader.get('./models/clouds.glb').scene.clone();
    cloud.position.add(new THREE.Vector3(0.5, 0, 0.5));
    this.cloudGroup.add(cloud);
    this.initWatchers();
  }

  private initWatchers() {
    this.stopWatchers.push(
      watch(
        () => gameState.currentPhase,
        () => this.updatePos(gameState.currentPhase),
        { deep: true }
      )
    );
    this.updatePos(gameState.currentPhase);
  }

  public destroy() {
    this.stopWatchers.forEach((stop) => stop());
  }

  private updatePos(newPhase: PhaseType) {
    if (newPhase == 'crew') {
      gsap.to(this.cloudGroup.position, { y: -5, duration: 1, ease: 'expo.out' });
      gsap.to(this.cloudGroup.scale, { x: 0.5, y: 0.5, z: 0.5, duration: 1, ease: 'expo.out' });
    } else {
      gsap.to(this.cloudGroup.position, { y: 0, duration: 1, ease: 'expo.out' });
      gsap.to(this.cloudGroup.scale, { x: 1, y: 1, z: 1, duration: 1, ease: 'expo.out' });
    }
  }
}
