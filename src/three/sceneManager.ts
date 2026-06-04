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

export class SceneManager {
  private scene: THREE.Scene;
  public camera: Camera;
  private renderer: THREE.WebGPURenderer;
  private canvas: HTMLCanvasElement;
  private onWindowResize: () => void;
  private width: number;
  private height: number;
  public mapManager: MapManager;
  private seaSky: SeaSkyBackground;
  public player: Player;
  private handleCanvasClick: (event: MouseEvent) => void;
  public corsair: Corsair;
  private particleSystemManager: ParticleSystemManager;

  constructor(canvas: HTMLCanvasElement, width: number, height: number) {
    this.canvas = canvas;
    this.width = width;
    this.height = height;

    // Initialize scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x00ffff);

    // Initialize camera
    this.camera = new Camera(this.scene, width, height);
    this.camera.setPosition(gameState.userPosition);
    // Initialize renderer
    this.renderer = new THREE.WebGPURenderer({
      antialias: true,
      canvas: this.canvas,
      forceWebGL: false,
    });
    this.seaSky = createSeaSkyBackground(this.camera.getNative());
    this.scene.add(this.seaSky.mesh);

    this.player = new Player(this, this.scene);
    this.corsair = new Corsair(this.scene);
    this.mapManager = new MapManager(this, this.scene);

    // Setup event handlers
    this.onWindowResize = this.handleWindowResize.bind(this);
    this.handleCanvasClick = this.onCanvasClick.bind(this);

    this.particleSystemManager = ParticleSystemManager.getInstance();
    this.particleSystemManager.setScene(this.scene);
    this.particleSystemManager.setTexture('/images/point.png');
  }

  async init(): Promise<void> {
    await this.renderer.init();
    console.log('Using WebGPU:', this.renderer.backend.renderer);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
  }

  private handleWindowResize(): void {
    const newWidth = this.canvas.parentElement?.clientWidth || this.width;
    const newHeight = this.canvas.parentElement?.clientHeight || this.height;

    this.camera.updateAspect(newWidth, newHeight);
    this.renderer.setSize(newWidth, newHeight);
  }

  private onCanvasClick(event: MouseEvent): void {
    // console.log('click', event);
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
    this.renderer.render(this.scene, this.camera.getNative());
    this.seaSky.update(timeSeconds);
    this.player.update(timeSeconds, deltaTime);
    this.corsair.update(timeSeconds);
    this.camera.update(timeSeconds);
    this.particleSystemManager.update(deltaTime);
  };

  dispose(): void {
    window.removeEventListener('resize', this.onWindowResize);
    document.removeEventListener('click', this.handleCanvasClick);
    gsap.ticker.remove(this.animate);
    this.mapManager.destroy();
    this.player.destroy();
    this.corsair.destroy();
    // Dispose the pool (geometries only) while the renderer is still alive,
    // so WebGPU node cleanup doesn't crash on a dead context.
    objectPool.dispose();
    this.renderer.dispose();
    this.particleSystemManager.removeAll();
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
