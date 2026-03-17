import * as THREE from "three/webgpu";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

interface ModelConfig {
  name: string;
  url: string;
}

interface InstancePool {
  mesh: THREE.InstancedMesh;
  activeIndices: Set<number>;
  freeIndices: number[];
  maxInstances: number;
}

const DUMMY = new THREE.Object3D();
const MAX_INSTANCES = 165;

export class InstancedModelManager {
  private static instance: InstancedModelManager;
  public pools: Map<string, InstancePool> = new Map();
  private loader = new GLTFLoader();
  private scene: THREE.Scene | null = null;

  private constructor() {}

  static getInstance(): InstancedModelManager {
    if (!InstancedModelManager.instance) {
      InstancedModelManager.instance = new InstancedModelManager();
    }
    return InstancedModelManager.instance;
  }

  async init(
    scene: THREE.Scene,
    configs: ModelConfig[],
    maxInstances = MAX_INSTANCES,
  ): Promise<void> {
    this.scene = scene;

    const loadPromises = configs.map(async (config) => {
      const gltf = await this.loader.loadAsync(config.url);

      // Collect all meshes from the GLTF scene
      const geometries: THREE.BufferGeometry[] = [];
      const materials: THREE.Material[] = [];

      gltf.scene.updateMatrixWorld(true);

      gltf.scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          // Clone geometry so we don't mutate the original
          const geo = mesh.geometry.clone();

          // Apply the mesh's world transform to the geometry so that
          // relative positions/rotations/scales within the GLTF are baked in
          geo.applyMatrix4(mesh.matrixWorld);

          // Ensure all geometries share the same set of attributes for merging.
          // mergeGeometries requires matching attribute keys across all geometries.
          geometries.push(geo);

          // Collect materials (we'll pick a strategy below)
          const mat = mesh.material;
          if (Array.isArray(mat)) {
            materials.push(...mat);
          } else {
            materials.push(mat);
          }
        }
      });

      if (geometries.length === 0) {
        console.warn(`No meshes found in model: ${config.name}`);
        return;
      }

      // Merge all geometries into a single BufferGeometry
      let mergedGeometry: THREE.BufferGeometry;

      if (geometries.length === 1) {
        mergedGeometry = geometries[0] ?? new THREE.BufferGeometry();
      } else {
        // Normalize attributes: ensure every geometry has the same attributes.
        // Remove attributes that aren't shared by all geometries.
        const attributeSets = geometries.map(
          (g) => new Set(Object.keys(g.attributes)),
        );
        const commonAttributes = attributeSets.reduce((acc, set) => {
          return new Set([...acc].filter((attr) => set.has(attr)));
        });

        for (const geo of geometries) {
          for (const key of Object.keys(geo.attributes)) {
            if (!commonAttributes.has(key)) {
              geo.deleteAttribute(key);
            }
          }
          // Remove index if some geometries are indexed and others aren't —
          // mergeGeometries handles indexed vs non-indexed, but consistent is safer.
        }

        const merged = mergeGeometries(geometries, false);
        if (!merged) {
          console.warn(`Failed to merge geometries for model: ${config.name}`);
          return;
        }
        mergedGeometry = merged;
      }

      // For the material: if there's only one unique material, use it directly.
      // Otherwise, use the first material (or create a combined approach).
      // A simple strategy: deduplicate by reference, and if multiple remain, use the first one.
      const uniqueMaterials = [...new Set(materials)];
      const finalMaterial: THREE.Material | THREE.Material[] | undefined =
        uniqueMaterials.length === 1
          ? uniqueMaterials[0]
          : uniqueMaterials.length > 1
            ? uniqueMaterials[0] // fallback: use first material for the merged mesh
            : new THREE.MeshStandardMaterial();

      console.log(
        `generateInstances of "${config.name}": merged ${geometries.length} meshes, ` +
          `${uniqueMaterials.length} unique material(s)`,
        gltf,
        config,
      );

      const instancedMesh = new THREE.InstancedMesh(
        mergedGeometry,
        finalMaterial,
        maxInstances,
      );
      instancedMesh.count = 0; // start with nothing visible
      instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      instancedMesh.frustumCulled = false;
      instancedMesh.name = `instanced_${config.name}`;

      // Initialize all transforms to zero-scale (hidden)
      for (let i = 0; i < maxInstances; i++) {
        DUMMY.position.set(0, 0, 0);
        DUMMY.rotation.set(0, 0, 0);
        DUMMY.scale.set(0, 0, 0);
        DUMMY.updateMatrix();
        instancedMesh.setMatrixAt(i, DUMMY.matrix);
      }
      instancedMesh.instanceMatrix.needsUpdate = true;

      scene.add(instancedMesh);

      const freeIndices: number[] = [];
      for (let i = maxInstances - 1; i >= 0; i--) {
        freeIndices.push(i); // stack: pop gives lowest indices first
      }

      this.pools.set(config.name, {
        mesh: instancedMesh,
        activeIndices: new Set(),
        freeIndices,
        maxInstances,
      });
    });

    await Promise.all(loadPromises);
  }

  reserveInstance(name: string): number {
    const pool = this.getPool(name);

    if (pool.freeIndices.length === 0) {
      throw new Error(`No free instances left for "${name}"`);
    }

    const index = pool.freeIndices.pop()!;
    pool.activeIndices.add(index);

    // Expand visible count if needed
    if (index >= pool.mesh.count) {
      pool.mesh.count = index + 1;
    }

    // Reset transform to default (visible at origin, scale 1)
    DUMMY.position.set(0, 0, 0);
    DUMMY.rotation.set(0, 0, 0);
    DUMMY.scale.set(1, 1, 1);
    DUMMY.updateMatrix();
    pool.mesh.setMatrixAt(index, DUMMY.matrix);
    pool.mesh.instanceMatrix.needsUpdate = true;

    return index;
  }

  releaseInstance(name: string, index: number): void {
    const pool = this.getPool(name);

    if (!pool.activeIndices.has(index)) {
      console.warn(`Index ${index} is not active in pool "${name}"`);
      return;
    }

    // Hide by zeroing scale
    DUMMY.position.set(0, 0, 0);
    DUMMY.rotation.set(0, 0, 0);
    DUMMY.scale.set(0, 0, 0);
    DUMMY.updateMatrix();
    pool.mesh.setMatrixAt(index, DUMMY.matrix);
    pool.mesh.instanceMatrix.needsUpdate = true;

    pool.activeIndices.delete(index);
    pool.freeIndices.push(index);

    // Shrink count if possible
    this.recalculateCount(pool);
  }

  updatePosition(name: string, index: number, position: THREE.Vector3): void {
    const pool = this.getPool(name);
    this.updateTransform(pool, index, (matrix) => {
      matrix.decompose(DUMMY.position, DUMMY.quaternion, DUMMY.scale);
      DUMMY.position.copy(position);
      DUMMY.updateMatrix();
      return DUMMY.matrix;
    });
  }

  updateRotation(name: string, index: number, rotation: THREE.Euler): void {
    const pool = this.getPool(name);
    this.updateTransform(pool, index, (matrix) => {
      matrix.decompose(DUMMY.position, DUMMY.quaternion, DUMMY.scale);
      DUMMY.rotation.copy(rotation);
      DUMMY.updateMatrix();
      return DUMMY.matrix;
    });
  }

  updateScale(name: string, index: number, scale: THREE.Vector3): void {
    const pool = this.getPool(name);
    this.updateTransform(pool, index, (matrix) => {
      matrix.decompose(DUMMY.position, DUMMY.quaternion, DUMMY.scale);
      DUMMY.scale.copy(scale);
      DUMMY.updateMatrix();
      return DUMMY.matrix;
    });
  }

  /** Update position, rotation, and scale in one call (avoids 3 decompose/recompose cycles) */
  updateTransformFull(
    name: string,
    index: number,
    position: THREE.Vector3,
    rotation: THREE.Euler,
    scale: THREE.Vector3,
  ): void {
    const pool = this.getPool(name);
    DUMMY.position.copy(position);
    DUMMY.rotation.copy(rotation);
    DUMMY.scale.copy(scale);
    DUMMY.updateMatrix();
    pool.mesh.setMatrixAt(index, DUMMY.matrix);
    pool.mesh.instanceMatrix.needsUpdate = true;
  }

  getActiveCount(name: string): number {
    return this.getPool(name).activeIndices.size;
  }

  getInstancedMesh(name: string): THREE.InstancedMesh {
    return this.getPool(name).mesh;
  }

  dispose(): void {
    for (const [, pool] of this.pools) {
      this.scene?.remove(pool.mesh);
      pool.mesh.geometry.dispose();
      const mat = pool.mesh.material;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat.dispose();
    }
    this.pools.clear();
  }

  // --- Private helpers ---

  private getPool(name: string): InstancePool {
    const pool = this.pools.get(name);
    // console.log(`Getting pool "${name}"`, pool);
    if (!pool) throw new Error(`Unknown pool: "${name}"`);
    return pool;
  }

  private _tempMatrix = new THREE.Matrix4();

  private updateTransform(
    pool: InstancePool,
    index: number,
    updater: (matrix: THREE.Matrix4) => THREE.Matrix4,
  ): void {
    pool.mesh.getMatrixAt(index, this._tempMatrix);
    const result = updater(this._tempMatrix);
    pool.mesh.setMatrixAt(index, result);
    pool.mesh.instanceMatrix.needsUpdate = true;
  }

  private recalculateCount(pool: InstancePool): void {
    let max = 0;
    for (const idx of pool.activeIndices) {
      if (idx + 1 > max) max = idx + 1;
    }
    pool.mesh.count = max;
  }
}

export const objectPool = InstancedModelManager.getInstance();
