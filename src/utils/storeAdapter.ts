import type { SceneManager } from '../three/sceneManager';
import { gameState } from './gameStore';
import { watch } from 'vue';

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
        this.sceneManager.mapManager.setPhase(newPhase);
        this.sceneManager.camera.setPhase(newPhase);
      }
    );
    watch(
      () => gameState.userPosition,
      (newPosition) => {
        console.log('newPosition', newPosition);
        gameState.userPositionHistory.push(newPosition.clone());
        this.sceneManager.player.setPosition(newPosition);
        // this.sceneManager.mapManager.setPlayerPosition(newPosition);
        this.sceneManager.camera.setPosition(newPosition);
      },
      { deep: true }
    );
  }
}
