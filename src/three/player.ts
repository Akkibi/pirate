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
import { clampBoardPosition, gameState } from '../utils/gameStore';
import { modelLoader } from './modelLoader';
import { watch } from 'vue';
import gsap from 'gsap';
import { gameEvents } from '../events/gameEvents';
import { ParticleSystemManager } from './particleSystemManager';
import { ArrowManager } from './arrowManager';
import { playSound } from '../utils/soundManager';

const _teal = new THREE.Color(0x008c74);
const TEAL_COLOR = vec3(_teal.r, _teal.g, _teal.b);
import type { SceneManager } from './sceneManager';

export class Player {
  private position: THREE.Vector2;
  private playerGroup: THREE.Group;
  private boatGroup: THREE.Group;
  private birdGroup: THREE.Group;
  private arrowManager: ArrowManager;
  private cannonsMod: THREE.Object3D | null = null;
  private bottleMod: THREE.Object3D | null = null;
  private sceneManager: SceneManager;

  constructor(sceneManager: SceneManager, scene: THREE.Scene) {
    this.sceneManager = sceneManager;
    this.playerGroup = new THREE.Group();
    this.boatGroup = new THREE.Group();
    this.birdGroup = new THREE.Group();

    const arrowGroup = new THREE.Group();
    this.playerGroup.add(arrowGroup);
    this.arrowManager = new ArrowManager(sceneManager, arrowGroup);

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

    this.arrowManager.load();
    this.initWatchers();

    this.playerGroup.position.x = gameState.userPosition.x;
    this.playerGroup.position.z = gameState.userPosition.y;
    // set to random int position between 0 and 5 and 0 and 7
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
        this.arrowManager.updateVisibility(isDisplayed, this.position);
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
          this.arrowManager.updateVisibility(true, this.position);
        }
      }
    );
    watch(
      () => gameState.userPosition,
      (newPosition) => {
        this.setPosition(newPosition);
        this.updatePositionShift();
        this.arrowManager.updateVisibility(gameState.displayArrows, this.position);
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

  private setPhase(phase: PhaseType): void {
    // Implement phase-specific camera settings here
    console.log(phase);
  }

  public setPosition(position: THREE.Vector2): void {
    const clampedPosition = clampBoardPosition(position);

    if (
      position === gameState.userPosition &&
      (position.x !== clampedPosition.x || position.y !== clampedPosition.y)
    ) {
      gameState.userPosition.set(clampedPosition.x, clampedPosition.y);
      return;
    }

    this.position.set(clampedPosition.x, clampedPosition.y);

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
    this.boatGroup.rotation.z = Math.sin(time * 0.0005) * 0.2;
    this.boatGroup.position.y = Math.sin(time * 0.001) * 0.025 - 0.025;

    this.birdGroup.rotation.y += 0.003;
    this.birdGroup.position.y = Math.sin(time * 0.001) * 0.1 + 0.75;
    this.birdGroup.rotation.z = Math.sin(time * 0.00113) * 0.1;

    if (gameState.displayArrows) {
      const camera = this.sceneManager.camera.getNative();
      const canvas = this.sceneManager.getRenderer().domElement;
      this.arrowManager.updateOverlayPositions(camera, canvas);
    }
  }

  getPosition() {
    return this.position;
  }

  public destroy(): void {
    this.boatGroup.removeFromParent();
    this.birdGroup.removeFromParent();
    this.playerGroup.removeFromParent();
    this.playerGroup.clear();
    this.arrowManager.destroy();
  }

  public handleArrowClick(mousePosition: THREE.Vector2, camera: THREE.Camera): void {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mousePosition, camera);

    const arrowMeshes = this.arrowManager.getMeshes();
    const intersects = raycaster.intersectObjects([...arrowMeshes.values()]);

    if (intersects.length > 0) {
      const clickedMesh = intersects[0]?.object as THREE.Mesh;
      if (!clickedMesh.visible) return;

      for (const [name, mesh] of arrowMeshes) {
        if (mesh === clickedMesh) {
          this.arrowManager.highlight(name);
          playSound('uiClick');
          gameState.arrowClicked = name;
          gameEvents.emit('crew:arrow_click', { direction: name });
          break;
        }
      }
    }
  }
}
