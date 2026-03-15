import * as THREE from 'three/webgpu';
import type { PhaseType } from '../utils/gameStore';
import { gameState } from '../utils/gameStore';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { watch } from 'vue';
import gsap from 'gsap';
import { cameraPositions } from './camera';

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
  }

  private loadArrowPlanes(): void {
    const textureLoader = new THREE.TextureLoader();

    const arrows = [
      { name: 'front', position: new THREE.Vector3(0, 0, -0.75) },
      { name: 'back', position: new THREE.Vector3(0, 0, 0.75) },
      { name: 'left', position: new THREE.Vector3(-0.75, 0, 0) },
      { name: 'right', position: new THREE.Vector3(0.75, 0, 0) },
    ];

    arrows.forEach((arrow) => {
      textureLoader.load(`images/arrow-${arrow.name}.png`, (texture) => {
        const geometry = new THREE.PlaneGeometry(0.3, 0.3);
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(arrow.position.clone().add(new THREE.Vector3(0, 0.4, 0)));
        mesh.lookAt(cameraPositions.crew);
        mesh.visible = gameState.displayArrows;

        this.arrowMeshes.set(arrow.name, mesh);
        this.arrowGroup.add(mesh);
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
      () => gameState.userPosition,
      (newPosition) => {
        this.setPosition(newPosition);
      },
      { deep: true }
    );
    this.setPhase(gameState.currentPhase);
    this.setPosition(gameState.userPosition);
  }

  private updateArrowVisibility(isDisplayed: boolean): void {
    this.arrowGroup.children.forEach((child) => {
      child.visible = isDisplayed;
    });
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
          console.log(`Arrow clicked: ${name}`);
          break;
        }
      }
    }
  }
}
