import * as THREE from 'three/webgpu';
import type { PhaseType } from '../utils/gameStore';
import { gameState } from '../utils/gameStore';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { watch } from 'vue';
import gsap from 'gsap';
import { cameraPositions } from './camera';
import { gameEvents } from '../events/gameEvents';

export class Player {
  private position: THREE.Vector2;
  private playerGroup: THREE.Group;
  private boatGroup: THREE.Group;
  private birdGroup: THREE.Group;
  private arrowGroup: THREE.Group;
  private arrowMeshes: Map<string, THREE.Mesh> = new Map();

  constructor(scene: THREE.Scene) {
    this.playerGroup = new THREE.Group();
    this.boatGroup = new THREE.Group();
    this.birdGroup = new THREE.Group();

    this.arrowGroup = new THREE.Group();
    this.playerGroup.add(this.arrowGroup);

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

    this.loadArrowPlanes();
    this.initWatchers();

    this.playerGroup.position.x = gameState.userPosition.x;
    this.playerGroup.position.y = gameState.userPosition.y;
    // set to random int position between 0 and 5 and 0 and 7
  }

  private loadArrowPlanes(): void {
    const textureLoader = new THREE.TextureLoader();

    const arrows = [
      { name: 'left', position: new THREE.Vector3(0, 0, -0.75) },
      { name: 'right', position: new THREE.Vector3(0, 0, 0.75) },
      { name: 'down', position: new THREE.Vector3(-0.75, 0, 0) },
      { name: 'up', position: new THREE.Vector3(0.75, 0, 0) },
    ];

    arrows.forEach((arrow) => {
      textureLoader.load(`images/arrow-${arrow.name}.png`, (texture) => {
        const geometry = new THREE.PlaneGeometry(0.5, 0.5);
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          color: '#ffffff',
          transparent: true,
          side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(arrow.position.clone().add(new THREE.Vector3(0, 0.4, 0)));
        mesh.lookAt(cameraPositions.crew);
        mesh.visible = gameState.displayArrows;

        this.arrowMeshes.set(arrow.name, mesh);
        this.arrowGroup.add(mesh);
        this.updateArrowVisibility(gameState.displayArrows);
      });
    });
  }

  private initWatchers(): void {
    watch(
      () => gameState.currentPhase,
      (newPhase) => {
        this.setPhase(newPhase);
      }
    );
    watch(
      () => gameState.displayArrows,
      (isDisplayed) => {
        this.updateArrowVisibility(isDisplayed);
      }
    );
    watch(
      () => gameState.userPositionHistory.length,
      () => {
        if (gameState.displayArrows) {
          this.updateArrowVisibility(true);
        }
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

  private resetArrowHighlight(): void {
    for (const mesh of this.arrowMeshes.values()) {
      const material = mesh.material;

      if (!(material instanceof THREE.MeshBasicMaterial)) {
        continue;
      }

      material.color.set('#ffffff');
    }
  }

  private getBlockedArrowDirection(): string | null {
    if (gameState.turnCount < 2 || gameState.userPositionHistory.length < 2) {
      return null;
    }

    const previousPosition =
      gameState.userPositionHistory[gameState.userPositionHistory.length - 2];

    if (!previousPosition) {
      return null;
    }

    const deltaX = previousPosition.x - gameState.userPosition.x;
    const deltaY = previousPosition.y - gameState.userPosition.y;

    if (deltaX === 1 && deltaY === 0) {
      return 'up';
    }

    if (deltaX === -1 && deltaY === 0) {
      return 'down';
    }

    if (deltaX === 0 && deltaY === 1) {
      return 'right';
    }

    if (deltaX === 0 && deltaY === -1) {
      return 'left';
    }

    return null;
  }

  private updateArrowVisibility(isDisplayed: boolean): void {
    this.resetArrowHighlight();
    gameState.arrowClicked = null;

    const blockedArrowDirection = this.getBlockedArrowDirection();

    for (const [name, mesh] of this.arrowMeshes) {
      mesh.visible = isDisplayed && name !== blockedArrowDirection;
    }
  }

  private setPhase(phase: PhaseType): void {
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

  private updateArrowHighlight(selectedArrowName: string): void {
    for (const [name, mesh] of this.arrowMeshes) {
      const material = mesh.material;

      if (!(material instanceof THREE.MeshBasicMaterial)) {
        continue;
      }

      material.color.set(name === selectedArrowName ? '#22c55e' : '#ffffff');
    }
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

  public handleArrowClick(mousePosition: THREE.Vector2, camera: THREE.Camera): void {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mousePosition, camera);

    const intersects = raycaster.intersectObjects(this.arrowGroup.children);

    if (intersects.length > 0) {
      const clickedMesh = intersects[0]?.object as THREE.Mesh;

      // Only register click if mesh is visible
      if (!clickedMesh.visible) return;

      // Find the arrow name
      for (const [name, mesh] of this.arrowMeshes) {
        if (mesh === clickedMesh) {
          this.updateArrowHighlight(name);
          console.log(`Arrow clicked: ${name}`);
          gameEvents.emit('crew:arrow_click', { direction: name });
          gameState.arrowClicked = name;
          break;
        }
      }
    }
  }
}
