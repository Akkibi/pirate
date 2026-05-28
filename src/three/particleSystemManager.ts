import * as THREE from 'three/webgpu';
import { attribute } from 'three/tsl';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  lifetime: number;
  maxLifetime: number;
  index: number;
  scale: THREE.Vector2;
  rotation: number;
  color: THREE.Color;
  color2?: THREE.Color;
  opacity: number;
}

export class ParticleSystemManager {
  private static instance: ParticleSystemManager;
  private scene: THREE.Scene | null;
  private particles: Particle[] = [];
  private textureLoader: THREE.TextureLoader = new THREE.TextureLoader();

  // Instanced mesh components
  private particleGeometry: THREE.PlaneGeometry;
  private particleMaterial: THREE.MeshBasicNodeMaterial;
  private instancedMesh: THREE.InstancedMesh;
  private maxParticles: number = 10000;

  // Per-instance data
  private dummy: THREE.Object3D = new THREE.Object3D();
  private colors: Float32Array;
  private opacities: Float32Array;

  private constructor() {
    this.scene = null;

    // Create a simple plane geometry for each particle
    this.particleGeometry = new THREE.PlaneGeometry(1, 1);

    // Initialize colors and opacities arrays
    this.colors = new Float32Array(this.maxParticles * 3);
    this.opacities = new Float32Array(this.maxParticles);

    this.particleGeometry.setAttribute(
      'instanceOpacity',
      new THREE.InstancedBufferAttribute(this.opacities, 1)
    );

    // Create instanced material
    this.particleMaterial = new THREE.MeshBasicNodeMaterial({
      transparent: true,
      opacity: 1,
      blending: THREE.NormalBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.particleMaterial.opacityNode = attribute('instanceOpacity', 'float');

    // Create instanced mesh
    this.instancedMesh = new THREE.InstancedMesh(
      this.particleGeometry,
      this.particleMaterial,
      this.maxParticles
    );
    this.instancedMesh.frustumCulled = false;

    // Set up color attribute for instancing
    this.instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(this.colors, 3);

    // Initially no instances are visible
    this.instancedMesh.count = 0;
  }

  public setScene(scene: THREE.Scene) {
    if (this.scene && this.instancedMesh) {
      this.scene.remove(this.instancedMesh);
    }
    this.scene = scene;
    if (scene) {
      scene.add(this.instancedMesh);
    }
  }

  public static getInstance(): ParticleSystemManager {
    if (!ParticleSystemManager.instance) {
      ParticleSystemManager.instance = new ParticleSystemManager();
    }
    return ParticleSystemManager.instance;
  }

  /**
   * Loads a texture for the particle system
   * @param img The URL of the image to use for the particle's texture
   */
  public setTexture(img: string): void {
    this.textureLoader.load(
      img,
      (texture) => {
        this.particleMaterial.map = texture;
        this.particleMaterial.needsUpdate = true;
      },
      undefined,
      (error) => {
        console.error('Error loading particle texture:', error);
      }
    );
  }

  /**
   * Adds a new particle to the system
   * @param position The initial position of the particle
   * @param velocity The initial velocity of the particle
   * @param duration The lifespan of the particle in seconds
   * @param size Optional size for the particle (default: 1)
   * @param color Optional color for the particle (default: white)
   */
  public addParticle(
    position: THREE.Vector3,
    velocity: THREE.Vector3,
    duration: number,
    size: THREE.Vector2 = new THREE.Vector2(1, 1),
    rotation: number = 0,
    color: THREE.Color = new THREE.Color(0xffffff),
    opacity: number = 1,
    color2?: THREE.Color
  ): void {
    const index = this.particles.length;

    // Set initial transform
    this.dummy.position.copy(position);
    this.dummy.scale.set(size.x, size.y, 1);
    this.dummy.rotation.set(0, rotation, 0);
    this.dummy.updateMatrix();
    this.instancedMesh.setMatrixAt(index, this.dummy.matrix);

    // Set color and opacity
    this.colors[index * 3] = color.r;
    this.colors[index * 3 + 1] = color.g;
    this.colors[index * 3 + 2] = color.b;
    this.opacities[index] = opacity;

    // Add to particle array
    this.particles.push({
      position: position.clone(),
      velocity: velocity.clone(),
      lifetime: duration,
      maxLifetime: duration,
      index,
      scale: size,
      rotation,
      color,
      opacity,
      color2,
    });

    // Update instance count
    this.instancedMesh.count = this.particles.length;
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.instancedMesh.instanceColor!.needsUpdate = true;
  }

  /**
   * Emits multiple particles at once (useful for bursts)
   * @param count Number of particles to emit
   * @param position Center position for the emission
   * @param velocityRange Range for random velocity components
   * @param duration Particle lifespan
   * @param size Particle size
   * @param color Particle color
   */
  public emitBurst(
    count: number,
    position: THREE.Vector3,
    velocityRange: {
      x: [number, number];
      y: [number, number];
      z: [number, number];
    },
    duration: number,
    rotation: number = 0,
    size: THREE.Vector2 = new THREE.Vector2(1, 1),
    color: THREE.Color = new THREE.Color(0xffffff)
  ): void {
    for (let i = 0; i < count; i++) {
      const velocity = new THREE.Vector3(
        Math.random() * (velocityRange.x[1] - velocityRange.x[0]) + velocityRange.x[0],
        Math.random() * (velocityRange.y[1] - velocityRange.y[0]) + velocityRange.y[0],
        Math.random() * (velocityRange.z[1] - velocityRange.z[0]) + velocityRange.z[0]
      );
      this.addParticle(position, velocity, duration, size, rotation, color);
    }
  }

  /**
   * Removes all particles from the system
   */
  public reset(): void {
    this.particles = [];
    this.instancedMesh.count = 0;
    console.log('All particles reset.');
  }

  /**
   * Updates the position and lifetime of all active particles
   * @param deltaTime The time elapsed since the last update in seconds
   * @param camera Optional camera for billboard effect (sprites face camera)
   */
  public update(deltaTime: number): void {
    if (!this.scene || this.particles.length === 0) return;

    let writeIndex = 0;

    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      if (!particle) continue;

      // Update position
      particle.position.x += particle.velocity.x * deltaTime;
      particle.position.y += particle.velocity.y * deltaTime;
      particle.position.z += particle.velocity.z * deltaTime;

      // Update lifetime
      particle.lifetime -= deltaTime;

      // If particle is still alive, update its instance data
      if (particle.lifetime > 0) {
        // Update transform
        this.dummy.position.copy(particle.position);

        // Make the particle rotate upwards
        // this.dummy.quaternion.setFromAxisAngle(
        //   new THREE.Vector3(1, 0, 0),
        //   Math.PI / 2,
        // );
        this.dummy.rotation.set(Math.PI / 2, 0, -particle.rotation);
        // this.dummy.quaternion.copy(camera.quaternion);

        // Fade out particle as it approaches end of life
        const lifetimeRatio = particle.lifetime / particle.maxLifetime;

        // Scale down as it fades
        // const originalSize = this.particles[i].maxLifetime; // Store size in a better way if needed

        this.dummy.scale.set(
          (1.1 - lifetimeRatio) * particle.scale.x * 10,
          (1.1 - lifetimeRatio) * particle.scale.y * 10,
          1
        );
        this.dummy.updateMatrix();

        this.instancedMesh.setMatrixAt(writeIndex, this.dummy.matrix);

        let finalColor = particle.color;
        if (particle.color2) {
          // Interpolate from color (start) to color2 (end) over lifetime
          const t = 1 - lifetimeRatio; // 0 at start, 1 at end
          finalColor = new THREE.Color().lerpColors(particle.color, particle.color2, t);
        }

        // Update color and opacity separately
        this.colors[writeIndex * 3] = finalColor.r;
        this.colors[writeIndex * 3 + 1] = finalColor.g;
        this.colors[writeIndex * 3 + 2] = finalColor.b;
        this.opacities[writeIndex] = lifetimeRatio * particle.opacity;

        // Keep particle in array at writeIndex
        if (writeIndex !== i) {
          this.particles[writeIndex] = particle;
          particle.index = writeIndex;
        }

        writeIndex++;
      }
    }

    // Remove dead particles
    this.particles.length = writeIndex;

    // Update instance count and data
    this.instancedMesh.count = this.particles.length;
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }
    (
      this.particleGeometry.getAttribute('instanceOpacity') as THREE.InstancedBufferAttribute
    ).needsUpdate = true;
  }

  /**
   * Disposes of all resources
   */
  public dispose(): void {
    if (this.scene && this.instancedMesh) {
      this.scene.remove(this.instancedMesh);
    }
    this.particleGeometry.dispose();
    this.particleMaterial.dispose();
    if (this.particleMaterial.map) {
      this.particleMaterial.map.dispose();
    }
  }

  public removeAll(): void {
    this.particles.forEach((particle) => {
      particle.lifetime = 0;
    });
    this.update(0);
    this.particles = [];
    this.instancedMesh.count = 0;
  }
}
