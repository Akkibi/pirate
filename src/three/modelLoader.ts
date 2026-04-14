import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { gameState } from '../utils/gameStore';

const ALL_MODELS = [
  './models/water.glb',
  './models/island.glb',
  './models/monster.glb',
  './models/typhon.glb',
  './models/fog.glb',
  './models/flag.glb',
  './models/board.glb',
  './models/environement.glb',
  './models/boat.glb',
  './models/bird.glb',
  './models/clouds.glb',
];

class ModelLoader {
  private static instance: ModelLoader;
  private cache = new Map<string, GLTF>();
  private loader = new GLTFLoader();

  private constructor() {}

  static getInstance(): ModelLoader {
    if (!ModelLoader.instance) {
      ModelLoader.instance = new ModelLoader();
    }
    return ModelLoader.instance;
  }

  async preloadAll(): Promise<void> {
    gameState.loadingProgress = 0;

    const fileSizes = await Promise.all(
      ALL_MODELS.map(async (path) => {
        try {
          const res = await fetch(path, { method: 'HEAD' });
          return Number(res.headers.get('content-length') ?? 0);
        } catch {
          return 0;
        }
      })
    );

    const totalBytes = fileSizes.reduce((a, b) => a + b, 0);
    const bytesLoaded = new Array(ALL_MODELS.length).fill(0);

    const updateProgress = () => {
      if (totalBytes === 0) return;
      const loaded = bytesLoaded.reduce((a, b) => a + b, 0);
      gameState.loadingProgress = Math.round((loaded / totalBytes) * 100);
    };

    await Promise.all(
      ALL_MODELS.map(
        (path, i) =>
          new Promise<void>((resolve, reject) => {
            this.loader.load(
              path,
              (gltf) => {
                this.cache.set(path, gltf);
                bytesLoaded[i] = fileSizes[i];
                updateProgress();
                resolve();
              },
              (event) => {
                if (event.lengthComputable) {
                  bytesLoaded[i] = event.loaded;
                  updateProgress();
                }
              },
              reject
            );
          })
      )
    );
  }

  get(path: string): GLTF {
    const gltf = this.cache.get(path);
    if (!gltf) throw new Error(`Model not preloaded: "${path}"`);
    return gltf;
  }

  has(path: string): boolean {
    return this.cache.has(path);
  }
}

export const modelLoader = ModelLoader.getInstance();
