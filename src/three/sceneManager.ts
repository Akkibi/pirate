import * as THREE from 'three/webgpu';
import { Camera } from './camera';
import { MapManager } from './mapManager';
import { createSeaSkyBackground, type SeaSkyBackground } from './skytexture';
import { gsap } from 'gsap';
import { Player } from './player';
import { gameState } from '../utils/gameStore';
import { Corsair } from './corsair';
import { objectPool } from './instancedModelManager';
import { ParticleSystemManager } from './particleSystemManager';
import { watch } from 'vue';
import Stats from 'stats.js';
import { createMenuBackground } from './menuBackground';
import { DecorativeClouds } from './decorativeClouds';

export class SceneManager {
  private scene: THREE.Scene;
  private menuScene: THREE.Scene;
  private activeScene: THREE.Scene;
  public camera: Camera;
  private renderer: THREE.WebGPURenderer;
  private canvas: HTMLCanvasElement;
  private onWindowResize: () => void;
  private width: number;
  private height: number;
  public mapManager!: MapManager;
  private seaSky!: SeaSkyBackground;
  public player!: Player;
  private handleCanvasClick: (event: MouseEvent) => void;
  public corsair!: Corsair;
  private particleSystemManager!: ParticleSystemManager;
  private decorativeClouds!: DecorativeClouds;
  private stats: Stats;
  private gameSceneReady = false;
  private activeGameStartedAt: number | null = null;

  constructor(canvas: HTMLCanvasElement, width: number, height: number) {
    this.canvas = canvas;
    this.width = width;
    this.height = height;

    this.menuScene = new THREE.Scene();
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x00ffff);
    this.activeScene = this.menuScene;

    this.camera = new Camera(this.scene, width, height);
    this.camera.setPosition(gameState.userPosition);

    this.renderer = new THREE.WebGPURenderer({
      antialias: true,
      canvas: this.canvas,
      forceWebGL: false,
    });

    this.onWindowResize = this.handleWindowResize.bind(this);
    this.handleCanvasClick = this.onCanvasClick.bind(this);

    createMenuBackground(this.menuScene);

    this.stats = new Stats();
    this.stats.dom.style.position = 'absolute';
    if (import.meta.env.DEV) {
      this.canvas.parentElement?.appendChild(this.stats.dom);
    }

    this.initWatchers();
    this.initPerformanceWatcher();
  }

  private initGameScene(): void {
    this.seaSky = createSeaSkyBackground(this.camera.getNative());
    this.scene.add(this.seaSky.mesh);

    this.decorativeClouds = new DecorativeClouds();
    this.scene.add(this.decorativeClouds.cloudGroup);

    this.player = new Player(this, this.scene);
    this.corsair = new Corsair(this.scene);
    this.mapManager = new MapManager(this, this.scene);

    this.particleSystemManager = ParticleSystemManager.getInstance();
    this.particleSystemManager.setScene(this.scene);
    this.particleSystemManager.setTexture('/images/point.webp');
  }

  private destroyGameScene(): void {
    if (!this.gameSceneReady) {
      return;
    }

    this.mapManager.destroy();
    this.player.destroy();
    this.corsair.destroy();
    this.decorativeClouds.destroy();
    this.scene.remove(this.decorativeClouds.cloudGroup);
    this.scene.remove(this.seaSky.mesh);
    this.seaSky.mesh.geometry.dispose();
    if (Array.isArray(this.seaSky.mesh.material)) {
      this.seaSky.mesh.material.forEach((material) => material.dispose());
    } else {
      this.seaSky.mesh.material.dispose();
    }
    this.particleSystemManager.removeAll();
    objectPool.dispose();
    this.gameSceneReady = false;
    this.activeGameStartedAt = null;
  }

  private initWatchers(): void {
    watch(
      () => gameState.gameStarted,
      async (started) => {
        if (started) {
          if (this.gameSceneReady && this.activeGameStartedAt !== gameState.gameStartedAt) {
            this.destroyGameScene();
          }

          if (!this.gameSceneReady) {
            this.initGameScene();
            this.gameSceneReady = true;
            this.activeGameStartedAt = gameState.gameStartedAt;
            await this.renderer.compileAsync(this.scene, this.camera.getNative());
            await this.renderer.renderAsync(this.scene, this.camera.getNative());
          }
          this.activeScene = this.scene;
          this.startElements();
        } else {
          this.activeScene = this.menuScene;
        }
      },
      { immediate: true }
    );
  }

  private updatePixelRatio(): void {
    const ratio = gameState.performanceMode ? 0.5 : 0.8;
    this.renderer.setPixelRatio(window.devicePixelRatio * ratio);
  }

  private initPerformanceWatcher(): void {
    watch(
      () => gameState.performanceMode,
      () => this.updatePixelRatio(),
      { immediate: true }
    );
  }

  private startElements(): void {
    this.camera.start();
  }

  async init(): Promise<void> {
    await this.renderer.init();
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(window.devicePixelRatio * 0.7);
  }

  private handleWindowResize(): void {
    const newWidth = this.canvas.parentElement?.clientWidth || this.width;
    const newHeight = this.canvas.parentElement?.clientHeight || this.height;

    this.camera.updateAspect(newWidth, newHeight);
    this.renderer.setSize(newWidth, newHeight);
  }

  private onCanvasClick(event: MouseEvent): void {
    if (!this.gameSceneReady) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const mousePosition = new THREE.Vector2(x, y);
    this.player.handleArrowClick(mousePosition, this.camera.getNative());
  }

  public startAnimation(): void {
    window.addEventListener('resize', this.onWindowResize);
    document.addEventListener('click', this.handleCanvasClick);
    gsap.ticker.add(this.animate);
  }

  private animate = (time: number, deltaTime: number) => {
    const timeSeconds = time * 1000;
    this.stats.begin();
    this.renderer.render(this.activeScene, this.camera.getNative());
    this.stats.end();

    if (this.activeScene === this.scene) {
      this.seaSky.update(timeSeconds);
      this.player.update(timeSeconds, deltaTime);
      this.corsair.update(timeSeconds);
      this.camera.update(timeSeconds);
      this.particleSystemManager.update(deltaTime);
    }
  };

  dispose(): void {
    window.removeEventListener('resize', this.onWindowResize);
    document.removeEventListener('click', this.handleCanvasClick);
    gsap.ticker.remove(this.animate);
    if (this.gameSceneReady) {
      this.destroyGameScene();
    }
    // Dispose the pool (geometries only) while the renderer is still alive,
    // so WebGPU node cleanup doesn't crash on a dead context.
    objectPool.dispose();
    this.renderer.dispose();
    this.stats.dom.remove();
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  getCamera(): Camera {
    return this.camera;
  }

  getRenderer(): THREE.WebGPURenderer {
    return this.renderer;
  }
}
