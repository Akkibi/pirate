import * as THREE from 'three/webgpu';
import { Camera } from './camera';
import { MapManager } from './mapManager';
import { createSeaSkyBackground, type SeaSkyBackground } from './skytexture';
import { gsap } from 'gsap';
import { Player } from './player';
import { gameState, renderStats } from '../utils/gameStore';
import { Corsair } from './corsair';
import { objectPool } from './instancedModelManger';
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
  private statsFrameCount = 0;
  private stats: Stats;
  private gameSceneReady = false;

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
    this.stats.dom.style.display = 'none';
    this.canvas.parentElement?.appendChild(this.stats.dom);

    this.initWatchers();
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
    this.particleSystemManager.setTexture('/images/point.png');
  }

  private initWatchers(): void {
    watch(
      () => gameState.gameStarted,
      (started) => {
        if (started && !this.gameSceneReady) {
          this.initGameScene();
          this.gameSceneReady = true;
        }
        this.activeScene = started ? this.scene : this.menuScene;
      },
      { immediate: true }
    );

    watch(
      () => gameState.debugMode,
      (debug) => {
        this.stats.dom.style.display = debug ? 'block' : 'none';
      }
    );
  }

  async init(): Promise<void> {
    await this.renderer.init();
    console.log('Using WebGPU:', this.renderer.backend.renderer);
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

    this.statsFrameCount++;
    if (this.statsFrameCount % 30 === 0) {
      renderStats.fps = deltaTime > 0 ? Math.round(1000 / deltaTime) : 0;
      renderStats.frameTime = Math.round(deltaTime * 10) / 10;
      const info = this.renderer.info;
      renderStats.drawCalls = info.render.calls;
      renderStats.triangles = info.render.triangles;
      renderStats.geometries = info.memory.geometries;
      renderStats.textures = info.memory.textures;
    }
  };

  dispose(): void {
    window.removeEventListener('resize', this.onWindowResize);
    document.removeEventListener('click', this.handleCanvasClick);
    gsap.ticker.remove(this.animate);
    if (this.gameSceneReady) {
      this.mapManager.destroy();
      this.player.destroy();
      this.corsair.destroy();
      this.decorativeClouds.destroy();
      this.particleSystemManager.removeAll();
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
