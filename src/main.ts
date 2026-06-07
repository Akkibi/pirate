import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import { GameLoop } from './utils/gameLoop';
import { clearSavedGameProgress } from './utils/gameProgress';
import { gameState, initializeNewBoardState, resetGameState } from './utils/gameStore';

createApp(App).mount('#app');

export async function initGame(options?: { resume?: boolean; demo?: boolean }) {
  const gameLoop = new GameLoop();

  if (options?.resume) {
    gameState.gameStarted = true;
    await gameLoop.resumeFromSavedProgress();
    return;
  }

  resetGameState();
  gameState.demoMode = options?.demo ?? false;
  initializeNewBoardState();
  clearSavedGameProgress();
  gameState.gameStarted = true;
  await gameLoop.startTurn();
}
