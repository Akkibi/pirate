<template>
  <div :class="timerClasses">
    <div class="mt-6 relative">
      <!-- Tally counter outer casing -->
      <div
        class="relative bg-amber-950 rounded-sm border-2 border-amber-800 px-5 py-3 shadow-[inset_0_2px_6px_rgba(0,0,0,0.6)]"
      >
        <!-- Corner rivets -->
        <span
          class="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-amber-700 shadow-inner"
        ></span>
        <span
          class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-700 shadow-inner"
        ></span>
        <span
          class="absolute bottom-1.5 left-1.5 w-2 h-2 rounded-full bg-amber-700 shadow-inner"
        ></span>
        <span
          class="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-700 shadow-inner"
        ></span>

        <!-- Display window -->
        <div
          class="relative overflow-hidden bg-stone-950 border border-amber-900/60 rounded-sm px-6 py-2 w-24 text-center"
        >
          <!-- Mechanical divider line -->
          <span class="absolute inset-x-0 top-1/2 h-px bg-amber-900/60 z-10"></span>

          <!-- Animated digit -->
          <Transition name="ticker" mode="out-in">
            <span
              :key="currentStep"
              class="relative block text-5xl font-bold text-amber-400 font-mono leading-none tabular-nums"
              >{{ currentStep }}</span
            >
          </Transition>
        </div>
      </div>
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

// const countdownSteps = [5, 4, 3, 2, 1];
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
.ticker-enter-active {
  animation: tick-in 0.12s ease-out;
}
.ticker-leave-active {
  animation: tick-out 0.12s ease-in;
}

@keyframes tick-in {
  from {
    transform: translateY(60%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes tick-out {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(-60%);
    opacity: 0;
  }
}
</style>
