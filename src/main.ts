import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import { GameLoop } from './utils/gameLoop';
import { clearSavedGameProgress } from './utils/gameProgress';
import {
  gameState,
  initializeDemoBoardState,
  initializeNewBoardState,
  resetGameState,
} from './utils/gameStore';
import { gameEvents } from './events/gameEvents';

createApp(App).mount('#app');

export async function initGame(options?: { resume?: boolean; demo?: boolean }) {
  const gameLoop = new GameLoop();

  if (options?.resume) {
    gameState.gameStarted = true;
    await gameLoop.resumeFromSavedProgress();
    gameEvents.emit('scene:game');
    return;
  }

  resetGameState();
  gameState.demoMode = options?.demo ?? false;
  if (gameState.demoMode) {
    initializeDemoBoardState();
  } else {
    initializeNewBoardState();
  }

  clearSavedGameProgress();
  gameState.gameStarted = true;
  await gameLoop.startTurn();
  gameEvents.emit('scene:game');
}
