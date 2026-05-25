<template>
  <div :class="timerClasses">
    <div
      v-for="step in countdownSteps"
      v-show="currentStep === step"
      :key="step"
      class="countdown-number relative leading-none text-amber-950"
    >
      <span
        class="countdown-spin absolute animate-spin-slow bg-amber-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
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
  'countdown-timer row-span-2 flex items-start justify-baseline',
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

<style scoped>
.countdown-timer {
  padding-inline: clamp(1rem, 6vmin, 2.5rem);
}

.countdown-number {
  font-size: clamp(2.3rem, 11vmin, 5rem);
}

.countdown-spin {
  width: clamp(3.8rem, 16vmin, 5.5rem);
  height: clamp(3.8rem, 16vmin, 5.5rem);
}

@media (min-width: 1024px) and (min-height: 620px) {
  .countdown-number {
    font-size: clamp(3rem, 9vmin, 6rem);
  }

  .countdown-spin {
    width: clamp(5rem, 10vmin, 5.5rem);
    height: clamp(5rem, 10vmin, 5.5rem);
  }
}
</style>
