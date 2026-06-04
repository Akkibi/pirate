import * as THREE from 'three/webgpu';
import type { PhaseType } from '../utils/gameStore';
import { gameState } from '../utils/gameStore';
import { watch } from 'vue';
import gsap from 'gsap';
import { DecorativeClouds } from './decorativeClouds';

export const cameraPositions = {
  focused: new THREE.Vector3(-10, 3.5, 0),
  overview: new THREE.Vector3(-5, 8.5, 0),
  gameplay: new THREE.Vector3(-5, 4, 0),
};

export class Camera {
  private cameraPositionGroup: THREE.Group;
  private cameraGroup: THREE.Group;
  private camera: THREE.PerspectiveCamera;
  private isFocused: boolean = true;
  private globalPosition: THREE.Vector2;
  private targetPosition: THREE.Vector2;
  private phase: PhaseType;
  private clouds: DecorativeClouds;

  constructor(scene: THREE.Scene, width: number, height: number) {
    this.cameraGroup = new THREE.Group();
    this.cameraGroup.position.add(new THREE.Vector3(-0, 0, 2.5));
    this.cameraPositionGroup = new THREE.Group();
    this.camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 1000);

    this.clouds = new DecorativeClouds();
    scene.add(this.clouds.cloudGroup);

    this.targetPosition = new THREE.Vector2().copy(gameState.userPosition);
    this.globalPosition = new THREE.Vector2().copy(gameState.userPosition);
    this.phase = gameState.currentPhase;

    // const helper = new THREE.PolarGridHelper(4, 2, 4, 4);
    // helper.position.y = 0.1;
    // this.cameraGroup.add(helper);

    this.cameraPositionGroup.add(this.camera);
    this.cameraGroup.add(this.cameraPositionGroup);
    scene.add(this.cameraGroup);

    gsap.fromTo(
      this.camera.position,
      { x: -50, y: 0, z: 2.5 },
      { x: 0, y: 0, z: 0, duration: 2, ease: 'expo.out' }
    );

    this.cameraPositionGroup.position.copy(cameraPositions.focused);
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
        if (!gameState.cameraFocusPosition) {
          this.setPosition(newPosition);
        }
      },
      { deep: true }
    );
    watch(
      () => gameState.cameraFocusPosition,
      (newPosition) => {
        this.setPosition(newPosition ?? gameState.userPosition);
      },
      { deep: true }
    );
    watch(
      () => gameState.focusedView,
      (newFocused) => {
        this.setFocused(newFocused);
      }
    );
    watch(
      () => gameState.entitiesVisible,
      () => {
        this.updateView();
      }
    );
    watch(
      () => gameState.displayCorsair,
      () => {
        this.updateView();
      }
    );

    this.setPhase(gameState.currentPhase);
    this.setPosition(gameState.userPosition);
    this.setFocused(gameState.focusedView);
  }

  setFocused(focused: boolean): void {
    this.isFocused = focused;
    this.updatePosition();
    this.setPosition(this.globalPosition);
    this.updateView();
  }

  setPhase(phase: PhaseType): void {
    // Implement phase-specific camera settings here
    this.phase = phase;
    this.setPosition(gameState.cameraFocusPosition ?? this.globalPosition);
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
    let newViewPos: THREE.Vector3;
    if (this.isFocused) {
      newViewPos = cameraPositions.focused;
    } else if (gameState.entitiesVisible || gameState.displayCorsair) {
      newViewPos = cameraPositions.overview;
    } else {
      newViewPos = cameraPositions.gameplay;
    }
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

    gsap.to(this.cameraGroup.rotation, {
      duration: 4,
      ease: 'expo.out',
      y: this.phase === 'parrot' ? -Math.PI : 0,
      overwrite: true,
    });
  }

  public update(time: number): void {
    this.cameraGroup.rotation.x = Math.sin(time * 0.0005) * 0.02;
    // this.cameraGroup.rotation.x = time * 0.0005;
    this.cameraGroup.rotation.z = Math.sin(time * 0.00021) * 0.02;
  }

  private updatePosition(): void {
    const newPos = this.isFocused
      ? new THREE.Vector3(2, this.cameraGroup.position.y, 3)
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
    this.globalPosition.copy(position);
    this.targetPosition.copy(position);
    if (this.phase === 'parrot') {
      this.targetPosition.x = (position.x + 2) / 2;
      this.targetPosition.y = (position.y + 3) / 2;
    } else {
      this.targetPosition.x = position.x;
      this.targetPosition.y = position.y;
    }
    this.updatePosition();
  }
}
