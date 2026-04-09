import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import { GameLoop } from './utils/gameLoop';
import { clearSavedGameProgress } from './utils/gameProgress';
import { resetGameState } from './utils/gameStore';

createApp(App).mount('#app');

export async function initGame(options?: { resume?: boolean }) {
  const gameLoop = new GameLoop();

  if (options?.resume) {
    await gameLoop.resumeFromSavedProgress();
    return;
  }

  resetGameState();
  clearSavedGameProgress();
  await gameLoop.startTurn();
}
