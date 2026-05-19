<template>
  <div class="col-span-8 row-span-2 row-start-2 flex items-end justify-center px-3">
    <div
      id="title"
      class="px-2 text-center font-title text-[clamp(3.1rem,14vw,6rem)] text-[#f7e8c6]"
    >
      Pirates
    </div>
  </div>

  <div
    :class="[
      'col-span-6 col-start-2 row-start-5 flex flex-col justify-end gap-1 px-1',
      isLoaded && 'animate-hide',
    ]"
  >
    <div class="flex items-center gap-2">
      <div class="h-1 flex-1 overflow-hidden rounded-full bg-[#2a1a0e]">
        <div
          class="h-full rounded-full bg-[#c8a87a] transition-all ease-out duration-300"
          :style="{ width: `${gameState.loadingProgress}%` }"
        />
      </div>
      <span class="w-9 text-right text-xs text-[#c8a87a]">{{ gameState.loadingProgress }}%</span>
    </div>
  </div>

  <div class="pointer-events-auto col-span-6 col-start-2 row-start-6 min-h-0">
    <GameButton label="Start Game" :on-click="startGame" :disabled="!isLoaded" />
  </div>

  <div v-if="showResume" class="pointer-events-auto col-span-6 col-start-2 row-start-7 min-h-0">
    <GameButton label="Resume" :on-click="resumeGame" :disabled="!isLoaded" />
  </div>

  <div
    :class="[
      'pointer-events-auto col-span-3 col-start-2 min-h-0',
      showResume ? 'row-start-8' : 'row-start-7',
    ]"
  >
    <GameButton label="Settings" :on-click="startGame" :disabled="!isLoaded" />
  </div>

  <div
    :class="[
      'pointer-events-auto col-span-3 col-start-5 min-h-0',
      showResume ? 'row-start-8' : 'row-start-7',
    ]"
  >
    <GameButton label="Tutorial" :on-click="startGame" :disabled="!isLoaded" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import GameButton from './ui/GameButton.vue';
import { gameState } from '../utils/gameStore';

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

const isLoaded = computed(() => gameState.loadingProgress >= 100);

function startGame() {
  emit('start');
}

function resumeGame() {
  emit('resume');
}
</script>

<style scoped>
#title {
  line-height: 0.85;
  text-shadow: 0 12px 30px rgba(17, 10, 7, 0.55);
}

.animate-hide {
  animation: fade-out 0.6s ease 0.6s forwards;
}

@keyframes fade-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
</style>
