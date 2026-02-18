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
      class="absolute bottom-4 left-4 bg-black bg-opacity-50 p-4 rounded text-sm text-white w-fit"
    >
      <p>PIRAT</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { SceneManager } from "../three/sceneManager";

const containerRef = ref<HTMLDivElement>();
const canvasRef = ref<HTMLCanvasElement>();
let sceneManager: SceneManager | null = null;

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
