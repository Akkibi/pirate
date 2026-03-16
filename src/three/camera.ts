import * as THREE from "three/webgpu";
import type { PhaseType } from "../utils/gameStore";
import { gameState } from "../utils/gameStore";
import { watch } from "vue";
import gsap from "gsap";

export class Camera {
  private cameraGroup: THREE.Group;
  private camera: THREE.PerspectiveCamera;

  constructor(scene: THREE.Scene, width: number, height: number) {
    this.cameraGroup = new THREE.Group();
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    this.cameraGroup.add(this.camera);
    scene.add(this.cameraGroup);
    this.camera.position.z = 0;
    this.camera.position.x = -6;
    this.camera.position.y = 7;
    this.camera.lookAt(
      this.cameraGroup.position.clone().add(new THREE.Vector3(0, 1, 0)),
    );

    this.initWatchers();
  }

  private initWatchers(): void {
    watch(
      () => gameState.currentPhase,
      (newPhase) => {
        this.setPhase(newPhase);
      },
    );
    watch(
      () => gameState.userPosition,
      (newPosition) => {
        this.setPosition(newPosition);
      },
      { deep: true },
    );
  }

  setPhase(phase: PhaseType): void {
    // Implement phase-specific camera settings here
    console.log(phase);
  }

  getNative(): THREE.PerspectiveCamera {
    return this.camera;
  }

  updateAspect(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  getPosition() {
    return this.cameraGroup.position;
  }

  setPosition(position: THREE.Vector2): void {
    console.log("position", position);
    gsap.to(this.cameraGroup.position, {
      x: position.x,
      y: this.cameraGroup.position.y,
      z: position.y,
      duration: 0.5,
      ease: "expo.Out",
      overwrite: true,
    });
  }
}
