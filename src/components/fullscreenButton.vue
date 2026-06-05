<template>
  <button
    class="bg-slate-900 rounded-full bg-opacity-50 p-2 text-sm text-white aspect-square cursor-pointer hover:bg-opacity-75 transition flex items-center justify-center"
    @click="requestFullscreen"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
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
</template>

<script setup lang="ts">
import { playSound } from '../utils/soundManager';

interface FullscreenHTMLElement extends HTMLElement {
  mozRequestFullScreen?: () => Promise<void>;
  webkitRequestFullscreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
}

const requestFullscreen = async () => {
  playSound('uiClick');

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
</script>
