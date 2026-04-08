<template>
  <div class="col-span-8 row-span-2 row-start-2 flex items-end justify-center px-3">
    <div id="title" class="px-2 text-center text-[clamp(3.1rem,14vw,6rem)] text-[#f7e8c6]">
      Pirates
    </div>
  </div>

  <div class="pointer-events-auto col-span-6 col-start-2 row-start-6 min-h-0">
    <GameButton label="Start Game" :on-click="startGame" />
  </div>

  <div v-if="showResume" class="pointer-events-auto col-span-6 col-start-2 row-start-7 min-h-0">
    <GameButton label="Resume" :on-click="resumeGame" />
  </div>

  <div
    :class="[
      'pointer-events-auto col-span-3 col-start-2 min-h-0',
      showResume ? 'row-start-8' : 'row-start-7',
    ]"
  >
    <GameButton label="Settings" :on-click="startGame" />
  </div>

  <div
    :class="[
      'pointer-events-auto col-span-3 col-start-5 min-h-0',
      showResume ? 'row-start-8' : 'row-start-7',
    ]"
  >
    <GameButton label="Tutorial" :on-click="startGame" />
  </div>
</template>

<script setup lang="ts">
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
