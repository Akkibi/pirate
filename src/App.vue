<script setup lang="ts">
import { computed, ref } from "vue";
import Canvas from "./components/canvas.vue";
import Landing from "./components/landing.vue";
import { initGame } from "./main";
import Parchment from "./components/parchment.vue";
import { gameState } from "./utils/gameStore";

const started = ref(false);
const overlayVisible = computed(
  () => started.value && (gameState.showActionPanel || gameState.showVideoOverlay),
);
const overlayText = computed(() =>
  gameState.currentPhase === "crew" ? "Crew Turn" : "Parrot Turn",
);
const overlayReplayKey = computed(
  () => `${gameState.currentPhase}-${gameState.turnCount}`,
);

function startGame() {
  started.value = true;

  initGame();
}
</script>

<template>
  <Landing v-if="!started" @start="startGame" />
  <template v-else>
    <Parchment
      :text="overlayText"
      size="bg"
      display-mode="overlay"
      dismiss-mode="auto"
      :dismiss-delay="2600"
      :visible="overlayVisible"
      :replay-key="overlayReplayKey"
    />
    <Canvas />
  </template>
</template>
