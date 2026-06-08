import { modelLoader } from '../three/modelLoader';
import { ImagesLoader } from './imagesLoader';
import { gameState } from './gameStore';

const MODEL_WEIGHT = 0.7;
const IMAGE_WEIGHT = 0.3;

class PreloadManager {
  private static instance: PreloadManager;

  private constructor() {}

  static getInstance(): PreloadManager {
    if (!PreloadManager.instance) {
      PreloadManager.instance = new PreloadManager();
    }
    return PreloadManager.instance;
  }

  async preloadAll(): Promise<void> {
    gameState.loadingProgress = 0;

    let modelProgress = 0;
    let imageProgress = 0;

    const updateProgress = () => {
      gameState.loadingProgress = Math.round(
        modelProgress * MODEL_WEIGHT + imageProgress * IMAGE_WEIGHT
      );
    };

    await Promise.all([
      modelLoader.preloadAll((p) => {
        modelProgress = p;
        updateProgress();
      }),
      ImagesLoader.preloadAll((p) => {
        imageProgress = p;
        updateProgress();
      }),
    ]);

    gameState.loadingProgress = 100;
  }
}

export const preloadManager = PreloadManager.getInstance();
