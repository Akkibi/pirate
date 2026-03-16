import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import { GameLoop } from "./utils/gameLoop";

createApp(App).mount("#app");

export async function initGame() {
  const gameLoop = new GameLoop();

  await gameLoop.startTurn();
}
