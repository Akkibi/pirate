<template>
  <div class="relative h-full w-full overflow-hidden bg-[#120c08]">
    <div class="absolute inset-0">
      <img
        class="h-full w-full object-cover opacity-70"
        src="/images/background.png"
        alt="background"
      />
      <div
        class="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,10,7,0.25)_0%,rgba(17,10,7,0.55)_45%,rgba(17,10,7,0.92)_100%)]"
      ></div>
    </div>

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

    <ScreenGrid :pointer-events="'auto'" class="relative z-10">
      <div class="col-span-8 row-span-2 row-start-1 flex items-end justify-center px-3">
        <div id="title" class="px-2 text-center text-[clamp(3.1rem,14vw,6rem)] text-[#f7e8c6]">
          Pirates
        </div>
      </div>

      <div class="col-span-6 col-start-2 row-start-6 min-h-0">
        <GameButton label="Start Game" :on-click="startGame" />
      </div>

      <div v-if="showResume" class="col-span-6 col-start-2 row-start-7 min-h-0">
        <GameButton label="Resume" :on-click="resumeGame" />
      </div>

      <div :class="['col-span-3 col-start-2 min-h-0', showResume ? 'row-start-8' : 'row-start-7']">
        <GameButton label="Settings" :on-click="startGame" />
      </div>

      <div :class="['col-span-3 col-start-5 min-h-0', showResume ? 'row-start-8' : 'row-start-7']">
        <GameButton label="Tutorial" :on-click="startGame" />
      </div>
    </ScreenGrid>
  </div>
</template>

<script setup lang="ts">
import ScreenGrid from './ui/ScreenGrid.vue';
import GameButton from './ui/GameButton.vue';

withDefaults(
  defineProps<{
    showResume?: boolean;
  }>(),
  {
    showResume: false,
  }
);

const emit = defineEmits<{
  (event: 'start'): void;
  (event: 'resume'): void;
}>();

interface FullscreenHTMLElement extends HTMLElement {
  mozRequestFullScreen?: () => Promise<void>;
  webkitRequestFullscreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
}

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

function resumeGame() {
  emit('resume');
}
</script>

<style scoped>
#title {
  font-family: 'Black Crest', 'IM Fell English', Georgia, serif;
  line-height: 0.85;
  text-shadow: 0 12px 30px rgba(17, 10, 7, 0.55);
}
</style>
