<template>
  <div ref="containerRef" class="w-full h-full inset-0 absolute overflow-hidden">
    <canvas ref="canvasRef" class="block w-full h-full absolute inset-0"></canvas>
    <div
      class="absolute top-4 left-4 bg-amber-950 border-3 border-amber-900 bg-opacity-50 p-2 text-sm text-white w-fit flex flex-row items-center justify-center gap-2"
    >
      <p class="font-black px-2">PIRAT</p>
    </div>
    <div class="absolute bottom-4 left-4 flex flex-row gap-2">
      <button
        class="bg-amber-700 min-w-20 p-1 px-2 text-amber-100 font-black border-3 border-amber-900"
        @click="toggleEntityVisibility"
      >
        {{ gameState.entitiesVisible ? 'Hide' : 'Show' }}
      </button>
      <button
        class="bg-amber-700 min-w-30 p-1 px-2 text-amber-100 font-black border-3 border-amber-900"
        @click="toggleTurn"
      >
        <span class="text-xs opacity-55"> Turn : </span>
        {{ gameState.currentPhase === 'crew' ? 'Crew' : 'Parrot' }}
      </button>
      <button
        class="bg-amber-700 min-w-24 p-1 px-2 text-amber-100 font-black border-3 border-amber-900"
        @click="toggleFocus"
      >
        {{ gameState.focusedView ? 'Focus' : 'Unfocussed' }}
      </button>
      <button
        class="bg-amber-700 min-w-24 p-1 px-2 text-amber-100 font-black border-3 border-amber-900"
        @click="toggleArrows"
      >
        {{ gameState.displayArrows ? 'Arrows On' : 'Arrows Off' }}
      </button>
    </div>
    <div class="absolute bottom-4 right-4 flex gap-2 justify-center items-center">
      <div
        class="absolute inset-0 w-full h-full bg-amber-950 rounded-[40%] scale-75 border-3 border-amber-900"
      ></div>
      <button
        class="bg-amber-700 p-1 px-2 text-amber-100 font-black min-w-16 border-3 border-amber-900 relative"
        @click="movePlayer('left')"
      >
        Left
      </button>
      <div class="flex flex-col gap-2">
        <button
          class="bg-amber-700 p-1 px-2 text-amber-100 font-black min-w-16 border-3 border-amber-900 relative"
          @click="movePlayer('up')"
        >
          Up
        </button>
        <button
          class="bg-amber-700 p-1 px-2 text-amber-100 font-black min-w-16 border-3 border-amber-900 relative"
          @click="movePlayer('down')"
        >
          Down
        </button>
      </div>
      <button
        class="bg-amber-700 p-1 px-2 text-amber-100 font-black min-w-16 border-3 border-amber-900 relative"
        @click="movePlayer('right')"
      >
        Right
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

const toggleEntityVisibility = () => {
  gameState.entitiesVisible = !gameState.entitiesVisible;
};

const toggleTurn = () => {
  gameState.currentPhase = gameState.currentPhase === 'crew' ? 'parrot' : 'crew';
};

const toggleArrows = () => {
  gameState.displayArrows = !gameState.displayArrows;
};

const toggleFocus = () => {
  gameState.focusedView = !gameState.focusedView;
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
