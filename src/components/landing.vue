<template>
  <button
    class="absolute top-4 right-4 bg-amber-700 border-3 border-amber-900 bg-opacity-50 p-2 text-sm text-amber-100 w-fit flex flex-row items-center justify-center gap-2 cursor-pointer hover:bg-opacity-75 transition"
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
  </button>
  <div class="flex w-full h-1/3 justify-center items-center">
    <div id="title" class="text-9xl p-8">Pirates</div>
  </div>
  <div class="flex w-full h-1/3 justify-center items-center">
    <Parchment text="Start Game" clickable size="md" :on-click="startGame" />
  </div>
  <div class="flex w-full h-1/3 justify-center items-center">
    <Parchment text="Rules Coming Soon" size="sm" />
  </div>
  <div class="inset-0 absolute top-0 -z-10">
    <img
      class="object-cover w-full h-full blur-md scale-105"
      src="/images/background.png"
      alt="background"
    />
  </div>
</template>

<script setup lang="ts">
import Parchment from './parchment.vue';

interface FullscreenHTMLElement extends HTMLElement {
  mozRequestFullScreen?: () => Promise<void>;
  webkitRequestFullscreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
}

const emit = defineEmits<{ (event: 'start'): void }>();

const requestFullscreen = async () => {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await handleFullscreen(document.documentElement);
    }
  } catch (error) {
    console.error('Fullscreen request failed:', error);
  }
};

const handleFullscreen = async (element: FullscreenHTMLElement): Promise<void> => {
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

function startGame() {
  emit('start');
}
</script>

<style>
#title {
  font-family: 'Black Crest';
}
</style>
