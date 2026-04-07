<template>
  <ScreenGrid overlay>
    <div class="col-span-8 row-span-2 flex items-center justify-center">
      <div
        v-for="step in countdownSteps"
        v-show="currentStep === step"
        :key="step"
        class="text-[clamp(4rem,22vw,8rem)] leading-none text-amber-950 relative"
      >
        <span
          class="absolute w-32 h-32 animate-spin-slow bg-amber-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        ></span>
        <span class="relative z-10">
          {{ currentStep }}
        </span>
      </div>
    </div>
  </ScreenGrid>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
import ScreenGrid from '../ui/ScreenGrid.vue';
import type { ButtonHandler } from '../../types/ui';

const props = withDefaults(
  defineProps<{
    visible?: boolean;
    replayKey?: string | number | boolean | null;
    stepDuration?: number;
    onComplete?: ButtonHandler;
  }>(),
  {
    visible: true,
    replayKey: null,
    stepDuration: 1000,
    onComplete: undefined,
  }
);

const emit = defineEmits<{
  (event: 'finished'): void;
}>();

const countdownSteps = [5, 4, 3, 2, 1];
const currentStep = ref(5);

let countdownTimer: number | null = null;

function clearCountdownTimer() {
  if (countdownTimer !== null) {
    window.clearTimeout(countdownTimer);
    countdownTimer = null;
  }
}

function tickCountdown() {
  clearCountdownTimer();

  countdownTimer = window.setTimeout(() => {
    if (currentStep.value === 1) {
      emit('finished');
      void props.onComplete?.();
      return;
    }

    currentStep.value -= 1;
    tickCountdown();
  }, props.stepDuration);
}

function startCountdown() {
  currentStep.value = 5;

  if (!props.visible) {
    clearCountdownTimer();
    return;
  }

  tickCountdown();
}

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      startCountdown();
      return;
    }

    clearCountdownTimer();
  },
  { immediate: true }
);

watch(
  () => props.replayKey,
  () => {
    if (props.visible) {
      startCountdown();
    }
  }
);

onBeforeUnmount(() => {
  clearCountdownTimer();
});
</script>
