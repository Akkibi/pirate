import type { SceneManager } from './three/sceneManager';
import { watch } from 'vue';
import { gameState, type PhaseType } from './utils/gameStore';

export class StoreAdapter {
  private sceneManager: SceneManager;

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
    this.initWatchers();
  }

  private initWatchers() {
    watch(
      () => gameState.currentPhase,
      (newPhase) => {
        this.updateCurrentPhase(newPhase);
      }
    );

    // TODO : Add more watchers here
  }

  // functions adapter
  updateCurrentPhase(phase: PhaseType) {
    this.sceneManager.mapManager.setPhase(phase);
    this.sceneManager.camera.setPhase(phase);
  }
}
