import * as THREE from 'three/webgpu';
import type { PhaseType } from '../utils/gameStore';
import { gameState } from '../utils/gameStore';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { watch } from 'vue';
import gsap from 'gsap';

export class Player {
  private position: THREE.Vector2;
  private playerGroup: THREE.Group;
  private boatGroup: THREE.Group;
  private birdGroup: THREE.Group;

  constructor(scene: THREE.Scene) {
    this.playerGroup = new THREE.Group();
    this.boatGroup = new THREE.Group();
    this.birdGroup = new THREE.Group();

    this.playerGroup.add(this.boatGroup, this.birdGroup);
    this.position = new THREE.Vector2();
    scene.add(this.playerGroup);

    const loader = new GLTFLoader();

    loader.load('models/boat.glb', (gltf) => {
      const boat = gltf.scene;
      boat.scale.multiplyScalar(0.5);
      boat.position.y = -0.1;
      this.boatGroup.add(boat);
    });

    loader.load('models/bird.glb', (gltf) => {
      this.birdGroup.add(gltf.scene);
      this.birdGroup.scale.multiplyScalar(0.5);
      this.playerGroup.add(this.birdGroup);
    });

    this.initWatchers();
  }

  private initWatchers(): void {
    watch(
      () => gameState.currentPhase,
      (newPhase) => {
        this.setPhase(newPhase);
      }
    );
    watch(
      () => gameState.userPosition,
      (newPosition) => {
        this.setPosition(newPosition);
      },
      { deep: true }
    );
    this.setPhase(gameState.currentPhase);
    this.setPosition(gameState.userPosition);
  }

  setPhase(phase: PhaseType): void {
    // Implement phase-specific camera settings here
    console.log(phase);
  }

  public setPosition(position: THREE.Vector2): void {
    this.position.copy(position);

    gsap.to(this.playerGroup.position, {
      x: this.position.x,
      y: this.playerGroup.position.y,
      z: this.position.y,
      duration: 2,
      ease: 'expo.out',
      overwrite: true,
    });
  }

  public update(time: number) {
    this.boatGroup.rotation.y += 0.001;
    this.boatGroup.rotation.z = Math.sin(time * 0.001 - 1) * 0.4;

    this.birdGroup.rotation.y += 0.003;
    this.birdGroup.position.y = Math.sin(time * 0.001) * 0.1 + 0.75;
    this.birdGroup.rotation.z = Math.sin(time * 0.00113) * 0.1;
  }

  getPosition() {
    return this.position;
  }
}
