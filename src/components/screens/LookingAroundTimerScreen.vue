<template>
  <div :class="timerClasses">
    <div
      v-for="step in countdownSteps"
      v-show="currentStep === step"
      :key="step"
      class="text-[clamp(3rem,10vw,6rem)] leading-none text-amber-950 relative"
    >
      <span
        class="absolute w-22 h-22 animate-spin-slow bg-amber-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
      ></span>
      <span class="relative z-10">
        {{ currentStep }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import type { ButtonHandler } from '../../types/ui';

const props = withDefaults(
  defineProps<{
    visible?: boolean;
    replayKey?: string | number | boolean | null;
    stepDuration?: number;
    onComplete?: ButtonHandler;
    sideChromeLayout?: boolean;
  }>(),
  {
    visible: true,
    replayKey: null,
    stepDuration: 1000,
    onComplete: undefined,
    sideChromeLayout: false,
  }
);

const emit = defineEmits<{
  (event: 'finished'): void;
}>();

const countdownSteps = [5, 4, 3, 2, 1];
const currentStep = ref(5);
const timerClasses = computed(() => [
  'row-span-2 flex items-start justify-baseline px-10',
  props.sideChromeLayout ? 'col-start-2 col-span-6' : 'col-span-8',
]);

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
