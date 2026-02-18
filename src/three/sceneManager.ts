import * as THREE from "three/webgpu";
import { color } from "three/src/nodes/TSL.js";
import { Camera } from "./camera";
import { MapManager } from "./mapManager";
import { createSeaSkyBackground, type SeaSkyBackground } from "./skytexture";
import { gameEvents } from "../events/gameEvents";

export class SceneManager {
	private scene: THREE.Scene;
	private camera: Camera;
	private renderer: THREE.WebGPURenderer;
	private canvas: HTMLCanvasElement;
	private torus: THREE.Mesh;
	private onWindowResize: () => void;
	private width: number;
	private height: number;
	private mapManager: MapManager;
	private seaSky: SeaSkyBackground;

	constructor(canvas: HTMLCanvasElement, width: number, height: number) {
		this.canvas = canvas;
		this.width = width;
		this.height = height;

		// Initialize scene
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0x00ffff);

		// Initialize camera
		this.camera = new Camera(this.scene, width, height);
		this.camera.setPosition(0, 0, 0);
		// Initialize renderer
		this.renderer = new THREE.WebGPURenderer({
			canvas: this.canvas,
			forceWebGL: false,
		});
		this.seaSky = createSeaSkyBackground(this.camera.getNative());
		this.scene.add(this.seaSky.mesh);

		this.mapManager = new MapManager(this.scene);
		this.mapManager.generateMap();

		// Create geometry
		const torusGeometry = new THREE.TorusGeometry(3.5, 0.3, 16, 100);

		// Create materials
		const torusColorNode = color(0xffe66d);
		const torusMaterial = new THREE.MeshBasicNodeMaterial();
		torusMaterial.colorNode = torusColorNode;
		torusMaterial.opacity = 0.9;
		this.torus = new THREE.Mesh(torusGeometry, torusMaterial);
		this.torus.position.x = 2.5;

		gameEvents.on("crew:move", ({ from, to }) => {
			// animate boat movement in 3D
			// when done:
			gameEvents.emit("animation:complete", { name: "crew:move" });
		});

		this.scene.add(this.torus);

		// Add lighting
		const light = new THREE.DirectionalLight(0xffffff, 1);
		light.position.set(5, 5, 5);
		this.scene.add(light);

		const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
		this.scene.add(ambientLight);

		// Setup resize handler
		this.onWindowResize = this.handleWindowResize.bind(this);
	}

	async init(): Promise<void> {
		await this.renderer.init();
		console.log("Using WebGPU:", this.renderer.backend.renderer);
		this.renderer.setSize(this.width, this.height);
		this.renderer.setPixelRatio(window.devicePixelRatio);
	}

	private handleWindowResize(): void {
		const newWidth = this.canvas.parentElement?.clientWidth || this.width;
		const newHeight =
			this.canvas.parentElement?.clientHeight || this.height;

		this.camera.updateAspect(newWidth, newHeight);
		this.renderer.setSize(newWidth, newHeight);
	}

	startAnimation(): void {
		window.addEventListener("resize", this.onWindowResize);
		this.renderer.setAnimationLoop((time: number) => {
			if (this.torus) {
				this.torus.rotation.x += 0.008;
				this.torus.rotation.y += 0.012;
			}

			this.renderer.render(this.scene, this.camera.getNative());
			this.seaSky.update(time);
		});
	}

	dispose(): void {
		window.removeEventListener("resize", this.onWindowResize);
		this.renderer.setAnimationLoop(null);
		this.renderer.dispose();
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
