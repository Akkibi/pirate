<script setup lang="ts">
import { ref } from "vue";
import Canvas from "./components/canvas.vue";
import Landing from "./components/landing.vue";
import { initGame } from "./main";

const started = ref(false);

function startGame() {
  started.value = true;

  initGame();
}
</script>

<template>
  <Landing v-if="!started" @start="startGame" />
  <Canvas v-else />
</template>
