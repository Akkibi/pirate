<template>
  <div ref="containerRef" class="w-full h-full inset-0 absolute overflow-hidden">
    <canvas ref="canvasRef" class="block w-full h-full absolute inset-0"></canvas>
    <div
      class="absolute bottom-4 left-4 bg-amber-950 border-2 border-amber-900 bg-opacity-50 p-2 rounded-2xl text-sm text-white w-fit flex flex-row items-center justify-center gap-2"
    >
      <p class="font-black px-2">PIRAT</p>
      <input
        type="number"
        placeholder="X"
        class="max-w-20 bg-amber-900 p-1 px-2 rounded-md"
        :value="gameState.userPosition.x"
        @input="
          (e) => {
            const positionx = parseFloat((e.target as HTMLInputElement).value);
            gameState.userPosition.x = positionx ? positionx : 0;
          }
        "
      />
      <input
        type="number"
        placeholder="Y"
        class="max-w-20 bg-amber-900 p-1 px-2 rounded-md"
        :value="gameState.userPosition.y"
        @input="
          (e) => {
            const positiony = parseFloat((e.target as HTMLInputElement).value);
            gameState.userPosition.y = positiony ? positiony : 0;
          }
        "
      />
      <button class="bg-amber-500 p-1 px-2 rounded-md text-amber-950" @click="movePlayer('left')">
        left
      </button>
      <button class="bg-amber-500 p-1 px-2 rounded-md text-amber-950" @click="movePlayer('right')">
        right
      </button>
      <button class="bg-amber-500 p-1 px-2 rounded-md text-amber-950" @click="movePlayer('up')">
        up
      </button>
      <button class="bg-amber-500 p-1 px-2 rounded-md text-amber-950" @click="movePlayer('down')">
        down
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { SceneManager } from '../three/sceneManager';
import { gameState } from '../utils/gameStore';

const containerRef = ref<HTMLDivElement>();
const canvasRef = ref<HTMLCanvasElement>();
let sceneManager: SceneManager | null = null;

const movePlayer = (direction: string) => {
  switch (direction) {
    case 'left':
      gameState.userPosition.y -= 1;
      break;
    case 'right':
      gameState.userPosition.y += 1;
      break;
    case 'up':
      gameState.userPosition.x += 1;
      break;
    case 'down':
      gameState.userPosition.x -= 1;
      break;
  }
};

onMounted(async () => {
  if (!containerRef.value || !canvasRef.value) return;

  const width = containerRef.value.clientWidth;
  const height = containerRef.value.clientHeight;

  sceneManager = new SceneManager(canvasRef.value, width, height);
  await sceneManager.init();
  sceneManager.startAnimation();
});

onUnmounted(() => {
  sceneManager?.dispose();
});
</script>
