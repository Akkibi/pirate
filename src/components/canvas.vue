<template>
  <div
    ref="containerRef"
    class="w-full h-full inset-0 absolute overflow-hidden"
  >
    <canvas
      ref="canvasRef"
      class="block w-full h-full absolute inset-0"
    ></canvas>
    <div
      class="absolute top-4 left-4 bg-amber-950 border-2 border-amber-900 bg-opacity-50 p-2 text-sm text-white w-fit flex flex-row items-center justify-center gap-2"
    >
      <p class="font-black px-2">PIRAT</p>
    </div>
    <div
      class="absolute top-4 right-4 bg-amber-950 border-2 border-amber-900 bg-opacity-50 p-2 text-sm text-white w-fit flex flex-row items-center justify-center gap-2 cursor-pointer hover:bg-opacity-75 transition"
      @click="requestFullscreen"
    >
      <!-- fullscreen -->
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M8 3H5a2 2 0 0 0-2 2v3" />
        <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
        <path d="M3 16v3a2 2 0 0 0 2 2h3" />
        <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
      </svg>
    </div>
    <button
      class="bg-amber-700 p-1 px-2 text-amber-100 font-black border-3 border-amber-900 absolute bottom-4 left-4"
      @click="toggleEntityVisibility"
    >
      {{ gameState.entitiesVisible ? "Hide" : "Show" }}
    </button>
    <div
      class="absolute bottom-4 right-4 flex gap-2 justify-center items-center"
    >
      <div
        class="absolute inset-0 w-full h-full bg-amber-950 rounded-[50%] scale-75 border-3 border-amber-900"
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
import { ref, onMounted, onUnmounted } from "vue";
import { SceneManager } from "../three/sceneManager";
import { gameState } from "../utils/gameStore";

interface FullscreenHTMLElement extends HTMLElement {
  mozRequestFullScreen?: () => Promise<void>;
  webkitRequestFullscreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
}

const containerRef = ref<HTMLDivElement>();
const canvasRef = ref<HTMLCanvasElement>();
let sceneManager: SceneManager | null = null;

const movePlayer = (direction: string) => {
  switch (direction) {
    case "left":
      gameState.userPosition.y -= 1;
      break;
    case "right":
      gameState.userPosition.y += 1;
      break;
    case "up":
      gameState.userPosition.x += 1;
      break;
    case "down":
      gameState.userPosition.x -= 1;
      break;
  }
};

const toggleEntityVisibility = () => {
  gameState.entitiesVisible = !gameState.entitiesVisible;
};

const requestFullscreen = async () => {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await handleFullscreen(document.documentElement);
    }
  } catch (error) {
    console.error("Fullscreen request failed:", error);
  }
};

const handleFullscreen = async (
  element: FullscreenHTMLElement,
): Promise<void> => {
  if (element.requestFullscreen) {
    return element.requestFullscreen();
  } else if (element.mozRequestFullScreen) {
    return await element.mozRequestFullScreen();
  } else if (element.webkitRequestFullscreen) {
    return await element.webkitRequestFullscreen();
  } else if (element.msRequestFullscreen) {
    return await element.msRequestFullscreen();
  }
  return Promise.resolve();
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
