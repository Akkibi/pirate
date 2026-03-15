import * as THREE from 'three/webgpu';
import type { PhaseType } from '../utils/gameStore';
import { gameState } from '../utils/gameStore';
import { watch } from 'vue';
import gsap from 'gsap';

export const cameraPositions = {
  default: new THREE.Vector3(-10, 3.5, 0),
  parrot: new THREE.Vector3(-5, 10, 0),
  crew: new THREE.Vector3(-10, 5, 0),
};

export class Camera {
  private cameraPositionGroup: THREE.Group;
  private cameraGroup: THREE.Group;
  private camera: THREE.PerspectiveCamera;
  private isFocused: boolean = true;
  private targetPosition: THREE.Vector2;
  private phase: PhaseType;

  constructor(scene: THREE.Scene, width: number, height: number) {
    this.cameraGroup = new THREE.Group();
    this.cameraPositionGroup = new THREE.Group();
    this.camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 1000);

    this.targetPosition = new THREE.Vector2().copy(gameState.userPosition);
    this.phase = gameState.currentPhase;

    const helper = new THREE.PolarGridHelper(4, 2, 4, 0);
    helper.position.y = 0.1;
    this.cameraGroup.add(helper);

    this.cameraPositionGroup.add(this.camera);
    this.cameraGroup.add(this.cameraPositionGroup);
    scene.add(this.cameraGroup);

    this.cameraPositionGroup.position.copy(cameraPositions.crew);
    this.camera.lookAt(this.cameraGroup.position.clone().add(new THREE.Vector3(0, -1, 0)));

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
    watch(
      () => gameState.focusedView,
      (newFocused) => {
        this.setFocused(newFocused);
      }
    );
    this.setPhase(gameState.currentPhase);
    this.setPosition(gameState.userPosition);
    this.setFocused(gameState.focusedView);
  }

  setFocused(focused: boolean): void {
    this.isFocused = focused;
    this.updatePosition();
    this.updateView();
  }

  setPhase(phase: PhaseType): void {
    // Implement phase-specific camera settings here
    this.phase = phase;
    this.updateView();
  }

  getNative(): THREE.PerspectiveCamera {
    return this.camera;
  }

  updateAspect(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  getPosition() {
    return new THREE.Vector3(this.targetPosition.x, 0, this.targetPosition.y);
  }

  updateView(): void {
    const newViewPos = this.isFocused ? cameraPositions.default : cameraPositions[this.phase];
    gsap.to(this.cameraPositionGroup.position, {
      duration: 2,
      ease: 'expo.out',
      x: newViewPos.x,
      y: newViewPos.y,
      z: newViewPos.z,
      onUpdate: () => {
        this.camera.lookAt(this.cameraGroup.position.clone().add(new THREE.Vector3(0, 0.1, 0)));
      },
    });
  }

  updatePosition(): void {
    const newPos = this.isFocused
      ? new THREE.Vector3(1.75, this.cameraGroup.position.y, 3)
      : new THREE.Vector3(
          this.targetPosition.x,
          this.cameraGroup.position.y,
          this.targetPosition.y
        );
    gsap.to(this.cameraGroup.position, {
      x: newPos.x,
      y: newPos.y,
      z: newPos.z,
      duration: 2,
      ease: 'expo.Out',
      overwrite: true,
    });
  }

  setPosition(position: THREE.Vector2): void {
    this.targetPosition.copy(position);
    this.updatePosition();
  }
}
