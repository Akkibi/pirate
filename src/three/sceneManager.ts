import * as THREE from 'three/webgpu';
import { Camera } from './camera';
import { MapManager } from './mapManager';
import { createSeaSkyBackground, type SeaSkyBackground } from './skytexture';
import { gsap } from 'gsap';
import { Player } from './player';
import { gameState } from '../utils/gameStore';
import Stats from 'three/examples/jsm/libs/stats.module.js';

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
  private stats: Stats;

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
      canvas: this.canvas,
      forceWebGL: false,
    });
    this.seaSky = createSeaSkyBackground(this.camera.getNative());
    this.scene.add(this.seaSky.mesh);

    this.mapManager = new MapManager(this.scene);
    this.player = new Player(this.scene);

    // Setup stats panel
    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);

    // Setup resize handler
    this.onWindowResize = this.handleWindowResize.bind(this);
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

  public startAnimation(): void {
    window.addEventListener('resize', this.onWindowResize);
    gsap.ticker.add(this.animate);
  }

  private animate = (time: number) => {
    this.stats.update();
    this.renderer.render(this.scene, this.camera.getNative());
    this.seaSky.update(time * 1000);
    this.player.update(time * 1000);
  };

  dispose(): void {
    window.removeEventListener('resize', this.onWindowResize);
    gsap.ticker.remove(this.animate);
    this.renderer.dispose();
    if (this.stats.dom.parentElement) {
      this.stats.dom.parentElement.removeChild(this.stats.dom);
    }
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
