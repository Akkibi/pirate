import * as THREE from 'three/webgpu';
import {
  positionWorld,
  mix,
  clamp,
  vec3,
  vec4,
  diffuseColor,
  normalWorld,
  cameraPosition,
  normalize,
  dot,
  pow,
  float,
} from 'three/tsl';
import type { PhaseType } from '../utils/gameStore';
import { gameState, formatBoardCoordinate } from '../utils/gameStore';
import { modelLoader } from './modelLoader';
import { watch } from 'vue';
import gsap from 'gsap';
import { cameraPositions } from './camera';
import { gameEvents } from '../events/gameEvents';
import { ParticleSystemManager } from './particleSystemManager';

const _teal = new THREE.Color(0x008c74);
const TEAL_COLOR = vec3(_teal.r, _teal.g, _teal.b);
import type { SceneManager } from './sceneManager';

export class Player {
  private position: THREE.Vector2;
  private playerGroup: THREE.Group;
  private boatGroup: THREE.Group;
  private birdGroup: THREE.Group;
  private arrowGroup: THREE.Group;
  private arrowMeshes: Map<string, THREE.Mesh> = new Map();
  private arrowOverlays: Map<string, HTMLElement> = new Map();
  private cannonsMod: THREE.Object3D | null = null;
  private bottleMod: THREE.Object3D | null = null;
  private sceneManager: SceneManager;

  private readonly arrowOffsets: Record<string, { x: number; y: number }> = {
    left: { x: 0, y: -1 },
    right: { x: 0, y: 1 },
    down: { x: -1, y: 0 },
    up: { x: 1, y: 0 },
  };

  constructor(sceneManager: SceneManager, scene: THREE.Scene) {
    this.sceneManager = sceneManager;
    this.playerGroup = new THREE.Group();
    this.boatGroup = new THREE.Group();
    this.birdGroup = new THREE.Group();

    this.arrowGroup = new THREE.Group();
    this.playerGroup.add(this.arrowGroup);

    this.playerGroup.add(this.boatGroup, this.birdGroup);
    this.position = new THREE.Vector2();
    scene.add(this.playerGroup);

    const boat = modelLoader.get('./models/boat.glb').scene.clone();
    boat.scale.multiplyScalar(0.5);
    boat.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const orig = child.material as THREE.MeshBasicMaterial;
        const mat = new THREE.MeshBasicNodeMaterial();
        mat.color.copy(orig.color);
        mat.vertexColors = orig.vertexColors;
        if (orig.map) mat.map = orig.map;
        const factor = clamp(positionWorld.y.negate().div(0.25), 0, 1);
        mat.outputNode = vec4(mix(diffuseColor.rgb, TEAL_COLOR, factor), diffuseColor.a);
        mat.side = THREE.DoubleSide;
        child.material = mat;
      }
    });
    this.boatGroup.add(boat);

    const cannons = modelLoader.get('./models/boat-mods/cannons.glb').scene.clone();
    cannons.scale.multiplyScalar(0.5);
    cannons.visible = gameState.displayCannons;
    this.boatGroup.add(cannons);
    this.cannonsMod = cannons;

    const bottle = modelLoader.get('./models/boat-mods/bottle.glb').scene.clone();
    bottle.scale.multiplyScalar(0.5);
    bottle.visible = gameState.displayBottle;
    bottle.traverse((child) => {
      if (child.name === 'shader-bottle' && child instanceof THREE.Mesh) {
        const mat = new THREE.MeshBasicNodeMaterial();
        mat.transparent = true;
        mat.side = THREE.DoubleSide;
        mat.depthWrite = false;
        mat.blending = THREE.NormalBlending;

        // Schlick Fresnel — IOR 1.5, F0 = ((1-1.5)/(1+1.5))^2 = 0.04
        const viewDir = normalize(cameraPosition.sub(positionWorld));
        const NdotV = dot(normalWorld, viewDir).clamp(0, 1);
        const F0 = float(0.04);
        const fresnel = F0.add(
          float(1)
            .sub(F0)
            .mul(pow(float(1).sub(NdotV), float(5)))
        );

        // Math node: Fresnel × 4, clamped
        const mixFactor = fresnel.mul(4).clamp(0, 1);

        // Mix Shader: Transparent BSDF (center) → Color (edges)
        mat.outputNode = mix(
          vec4(0.8308, 0.7913, 0.5395, 0.0),
          vec4(0.8308, 0.7913, 0.5395, 1.0),
          mixFactor
        );

        child.material = mat;
      }
    });
    this.boatGroup.add(bottle);
    this.bottleMod = bottle;

    const bird = modelLoader.get('./models/bird.glb').scene.clone();
    this.birdGroup.add(bird);
    this.birdGroup.scale.multiplyScalar(0.5);
    this.playerGroup.add(this.birdGroup);

    this.loadArrowPlanes();
    this.initWatchers();

    this.playerGroup.position.x = gameState.userPosition.x;
    this.playerGroup.position.z = gameState.userPosition.y;
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
          depthTest: false,
          depthWrite: false,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.renderOrder = 999;
        mesh.position.copy(arrow.position.clone().add(new THREE.Vector3(0, 0.4, 0)));
        mesh.lookAt(cameraPositions.gameplay);
        mesh.visible = gameState.displayArrows;

        this.arrowMeshes.set(arrow.name, mesh);
        this.arrowGroup.add(mesh);
        this.createArrowOverlay(arrow.name);
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
      () => gameState.entitiesVisible,
      () => {
        this.updatePositionShift();
      }
    );
    watch(
      () => gameState.displayArrows,
      (isDisplayed) => {
        this.updateArrowVisibility(isDisplayed);
      }
    );
    watch(
      () => gameState.displayCannons,
      (visible) => {
        if (this.cannonsMod) this.cannonsMod.visible = visible;
      }
    );
    watch(
      () => gameState.displayBottle,
      (visible) => {
        if (this.bottleMod) {
          this.bottleMod.visible = visible;
          if (visible === true) {
            this.boatGroup.scale.set(0.75, 0.75, 0.75);
          } else {
            this.boatGroup.scale.set(1, 1, 1);
          }
        }
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
        this.updatePositionShift();
      },
      { deep: true }
    );
    gameEvents.on('boat:shoot_cannons', () => {
      if (!this.cannonsMod) return;
      const cannonLeft = this.cannonsMod.getObjectByName('cannon-left');
      const cannonRight = this.cannonsMod.getObjectByName('cannon-right');
      if (!cannonLeft || !cannonRight) return;

      const psm = ParticleSystemManager.getInstance();
      psm.removeAll();
      const boatWorldPos = new THREE.Vector3();
      this.boatGroup.getWorldPosition(boatWorldPos);

      for (const cannon of [cannonLeft, cannonRight]) {
        const cannonWorldPos = new THREE.Vector3();
        cannon.getWorldPosition(cannonWorldPos);

        const dir = new THREE.Vector3()
          .subVectors(cannonWorldPos.clone().add(new THREE.Vector3(0, -0.15, 0)), boatWorldPos)
          .normalize();

        for (let i = 0; i < 20; i++) {
          const spread = 0.4;
          const velocity = new THREE.Vector3(
            dir.x + (Math.random() - 0.5) * spread,
            dir.y + (Math.random() - 0.5) * spread,
            dir.z + (Math.random() - 0.5) * spread
          )
            .multiplyScalar(1 + Math.random() * 0.5)
            .multiplyScalar(0.004);

          const velocity2 = new THREE.Vector3(
            (Math.random() - 0.5) * spread,
            0.1 + (Math.random() - 0.5) * spread,
            (Math.random() - 0.5) * spread
          )
            .multiplyScalar(1 + Math.random() * 0.5)
            .multiplyScalar(0.001);

          psm.addParticle(
            cannonWorldPos.clone(),
            velocity,
            800,
            new THREE.Vector2(0.04, 0.005),
            -Math.atan2(velocity.z, velocity.x),
            new THREE.Color(0, 0, 0),
            0.5 + Math.random() * 0.5
          );
          psm.addParticle(
            cannonWorldPos.clone(),
            velocity2,
            1000,
            new THREE.Vector2(0.03, 0.02),
            -Math.atan2(velocity2.z, velocity2.x),
            new THREE.Color(0.5, 0.5, 0.5),
            0.5 + Math.random() * 0.5
          );
        }
      }
    });
    this.setPhase(gameState.currentPhase);
    this.setPosition(gameState.userPosition);
  }

  private updatePositionShift(): void {
    const tileType = this.sceneManager.mapManager.getTileState(this.position);
    if (!tileType) return;
    const isMonsterTile = tileType.state == 'monster';
    const isTileShared = isMonsterTile || tileType.state == 'island';

    if ((gameState.entitiesVisible || tileType.entitiesHidden) && isTileShared) {
      // this.boatGroup.position.set(0.25, 0, -0.25);
      gsap.to(this.boatGroup.position, {
        duration: 1,
        ease: 'sin.inOut',
        x: 0.2,
        z: -0.2,
      });
    } else {
      // this.boatGroup.position.set(0, 0, 0);
      gsap.to(this.boatGroup.position, {
        duration: 1,
        ease: 'sin.inOut',
        x: 0,
        z: 0,
      });
    }
    const isTakingDamage = isMonsterTile || tileType.state == 'typhon';

    if (isTakingDamage) {
      gsap
        .timeline({ overwrite: true })
        .fromTo(
          this.boatGroup.rotation,
          { z: 0 },
          { duration: 0.2, ease: 'expo.out', delay: 0.25, z: Math.PI * 0.5 }
        )
        .to(this.boatGroup.rotation, { duration: 2, ease: 'elastic.out(1, 0.3)', z: 0 });
    }
  }

  private createArrowOverlay(arrowName: string): void {
    const overlay = document.createElement('div');
    overlay.className = [
      'absolute',
      'pointer-events-none',
      '-translate-x-1/2',
      '-translate-y-1/2',
      'font-black',
      'font-title',
      'text-[5vh]',
      'text-amber-950',
      '[-webkit-text-stroke:3px_#fbbf24]',
      '[paint-order:stroke_fill]',
      'hidden',
    ].join(' ');
    const canvas = this.sceneManager.getRenderer().domElement;
    canvas.parentElement?.appendChild(overlay);
    this.arrowOverlays.set(arrowName, overlay);
  }

  private projectArrowToScreen(mesh: THREE.Mesh): { x: number; y: number } {
    const worldPos = new THREE.Vector3();
    mesh.getWorldPosition(worldPos);
    const camera = this.sceneManager.camera.getNative();
    const canvas = this.sceneManager.getRenderer().domElement;
    worldPos.project(camera);
    const x = (worldPos.x + 1) * 0.5 * canvas.clientWidth;
    const y = -(worldPos.y - 1) * 0.5 * canvas.clientHeight;
    return { x, y };
  }

  private getArrowTargetLabel(arrowName: string): string {
    const offset = this.arrowOffsets[arrowName];
    if (!offset) return '';
    const target = {
      x: gameState.userPosition.x + offset.x,
      y: gameState.userPosition.y + offset.y,
    };
    return formatBoardCoordinate(target);
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
      // do not display arrows when the boat is on borders
      const onBorder =
        (name === 'left' && this.position.y === 0) ||
        (name === 'right' && this.position.y === 6) ||
        (name === 'down' && this.position.x === 0) ||
        (name === 'up' && this.position.x === 4);

      const visible = !onBorder && isDisplayed && name !== blockedArrowDirection;
      mesh.visible = visible;
      const overlay = this.arrowOverlays.get(name);
      if (overlay) {
        overlay.classList.toggle('hidden', !visible);
        if (visible) overlay.textContent = this.getArrowTargetLabel(name);
      }
    }
  }

  private setPhase(phase: PhaseType): void {
    // Implement phase-specific camera settings here
    console.log(phase);
  }

  public setPosition(position: THREE.Vector2): void {
    this.position.copy(position);

    // limit position
    const maxX = 5;
    const maxZ = 7;
    this.position.x = Math.max(0, Math.min(maxX, this.position.x));
    this.position.y = Math.max(0, Math.min(maxZ, this.position.y));

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
    this.boatGroup.rotation.z = Math.sin(time * 0.0005) * 0.2;
    this.boatGroup.position.y = Math.sin(time * 0.001) * 0.025 - 0.025;

    this.birdGroup.rotation.y += 0.003;
    this.birdGroup.position.y = Math.sin(time * 0.001) * 0.1 + 0.75;
    this.birdGroup.rotation.z = Math.sin(time * 0.00113) * 0.1;

    if (gameState.displayArrows) {
      for (const [name, mesh] of this.arrowMeshes) {
        const overlay = this.arrowOverlays.get(name);
        if (!overlay || !mesh.visible) continue;
        const { x, y } = this.projectArrowToScreen(mesh);
        overlay.style.left = `${x}px`;
        overlay.style.top = `${y}px`;
      }
    }
  }

  getPosition() {
    return this.position;
  }

  public destroy(): void {
    this.arrowGroup.removeFromParent();
    this.boatGroup.removeFromParent();
    this.birdGroup.removeFromParent();
    this.playerGroup.removeFromParent();
    this.playerGroup.clear();
    this.arrowMeshes.clear();
    for (const overlay of this.arrowOverlays.values()) {
      overlay.remove();
    }
    this.arrowOverlays.clear();
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
