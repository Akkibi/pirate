import * as THREE from 'three/webgpu';
import { Camera } from './camera';
import { MapManager } from './mapManager';
import { createSeaSkyBackground, type SeaSkyBackground } from './skytexture';
import { gsap } from 'gsap';
import { Player } from './player';
import { gameState } from '../utils/gameStore';
import { Corsair } from './corsair';
import { objectPool } from './instancedModelManger';
import { ParticleSystemManager } from './particleSystemManager';
import { watch } from 'vue';
import Stats from 'stats.js';
import { createMenuBackground } from './menuBackground';
import { DecorativeClouds } from './decorativeClouds';

const DEFAULT_RENDER_PIXEL_RATIO_SCALE = 0.7;
const IOS_STANDALONE_RENDER_PIXEL_RATIO_SCALE = 0.45;
const IOS_STANDALONE_RENDER_PIXEL_RATIO_MAX = 1.35;

function isIosDevice(): boolean {
  const userAgent = window.navigator.userAgent;
  const platform = window.navigator.platform;
  const maxTouchPoints = window.navigator.maxTouchPoints;

  return /iP(hone|ad|od)/.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1);
}

function isStandaloneDisplayMode(): boolean {
  const standaloneNavigator = window.navigator as typeof window.navigator & {
    standalone?: boolean;
  };

  return (
    Boolean(standaloneNavigator.standalone) ||
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches
  );
}

function getRenderPixelRatio(): number {
  const devicePixelRatio = window.devicePixelRatio || 1;

  if (isIosDevice() && isStandaloneDisplayMode()) {
    return Math.max(
      1,
      Math.min(
        devicePixelRatio * IOS_STANDALONE_RENDER_PIXEL_RATIO_SCALE,
        IOS_STANDALONE_RENDER_PIXEL_RATIO_MAX
      )
    );
  }

  return devicePixelRatio * DEFAULT_RENDER_PIXEL_RATIO_SCALE;
}

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

  private startElements(): void {
    this.camera.start();
  }

  async init(): Promise<void> {
    await this.renderer.init();
    console.log('Using WebGPU:', this.renderer.backend.renderer);
    this.applyRendererSize(this.width, this.height);
  }

  private handleWindowResize(): void {
    const newWidth = this.canvas.parentElement?.clientWidth || this.width;
    const newHeight = this.canvas.parentElement?.clientHeight || this.height;

    this.width = newWidth;
    this.height = newHeight;
    this.camera.updateAspect(newWidth, newHeight);
    this.applyRendererSize(newWidth, newHeight);
  }

  private applyRendererSize(width: number, height: number): void {
    this.renderer.setPixelRatio(getRenderPixelRatio());
    this.renderer.setSize(width, height);
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
    } else {
      // animate the menu shader
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
