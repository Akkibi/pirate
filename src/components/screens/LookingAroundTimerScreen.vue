<template>
  <div :class="timerClasses">
    <div class="mt-6 flex flex-col items-center gap-2 origin-center" ref="timerRef">
      <!-- Number at top -->
      <Transition name="ticker" mode="out-in">
        <span
          :key="currentStep"
          class="timer-number text-5xl font-bold font-mono tabular-nums leading-none"
          >{{ currentStep }}</span
        >
      </Transition>

      <!-- Clock face -->
      <div class="timer-clock relative w-32 h-32">
        <svg viewBox="0 0 100 100" class="w-full h-full">
          <!-- Outer bezel -->
          <circle cx="50" cy="50" r="48" fill="#472422" stroke="#f1b730" stroke-width="2" />
          <!-- Clock face -->
          <circle cx="50" cy="50" r="44" fill="#371412" />

          <!-- Background ring -->
          <circle
            cx="50"
            cy="50"
            r="36"
            fill="none"
            stroke="#f1b730"
            stroke-opacity="0.15"
            stroke-width="8"
          />

          <!-- Elapsed arc sweeping clockwise from 12 o'clock -->
          <circle
            cx="50"
            cy="50"
            r="36"
            fill="none"
            stroke="#f1b730"
            stroke-opacity="0.7"
            stroke-width="8"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="dashOffset"
            transform="rotate(-90 50 50)"
            style="transition: stroke-dashoffset 1s linear"
          />

          <!-- Tick marks at each step position -->
          <g v-for="i in 5" :key="i" :transform="`rotate(${(i - 1) * 72} 50 50)`">
            <line
              x1="50"
              y1="7"
              x2="50"
              y2="16"
              stroke="#d7a75b"
              stroke-width="2.5"
              stroke-linecap="round"
            />
          </g>

          <!-- Needle -->
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="13"
            stroke="#f1b730"
            stroke-width="3"
            stroke-linecap="round"
            :style="{
              transform: `rotate(${needleRotation}deg)`,
              transformOrigin: '50px 50px',
              transition: 'transform 0.2s cubic-bezier(0.22, 1, 0.36, 1.2)',
            }"
          />
          <!-- Needle tail (counterweight) -->
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="60"
            stroke="#d7a75b"
            stroke-width="2"
            stroke-linecap="round"
            :style="{
              transform: `rotate(${needleRotation}deg)`,
              transformOrigin: '50px 50px',
              transition: 'transform 0.2s cubic-bezier(0.22, 1, 0.36, 1.2)',
            }"
          />

          <!-- Center pivot -->
          <circle cx="50" cy="50" r="5" fill="#472422" stroke="#f1b730" stroke-width="1.5" />
          <circle cx="50" cy="50" r="2.5" fill="#f1b730" />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import gsap from 'gsap';
import type { ButtonHandler } from '../../types/ui';
import { playSound } from '../../utils/soundManager';

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

const timerRef = ref<HTMLElement | null>(null);
const currentStep = ref(5);
const timerClasses = computed(() => [
  'countdown-timer row-span-2 flex items-start justify-baseline',
  props.sideChromeLayout ? 'col-start-2 col-span-6' : 'col-span-8',
]);

const circumference = 2 * Math.PI * 36;
const needleRotation = computed(() => ((5 - currentStep.value) / 5) * 360);
const dashOffset = computed(() => circumference - ((5 - currentStep.value) / 5) * circumference);

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
    if (currentStep.value === 0) {
      emit('finished');
      void props.onComplete?.();
      return;
    }

    currentStep.value -= 1;
    if (currentStep.value == 0 && timerRef.value) {
      gsap
        .timeline()
        .to(timerRef.value, { rotation: -8, duration: 0.07, ease: 'power2.out' })
        .to(timerRef.value, { rotation: 7, duration: 0.07, ease: 'power2.inOut' })
        .to(timerRef.value, { rotation: -6, duration: 0.07, ease: 'power2.inOut' })
        .to(timerRef.value, { rotation: 5, duration: 0.07, ease: 'power2.inOut' })
        .to(timerRef.value, { rotation: -3, duration: 0.06, ease: 'power2.inOut' })
        .to(timerRef.value, { rotation: 0, duration: 0.1, ease: 'power2.out' })
        .to(timerRef.value, { y: '50vh', opacity: 0, duration: 0.25, ease: 'bounce.in' });
    }
    tickCountdown();
  }, props.stepDuration);
}

function startCountdown() {
  currentStep.value = 5;

  if (!props.visible) {
    clearCountdownTimer();
    return;
  }

  playSound('timer', { interrupt: true });
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

onMounted(() => {
  if (timerRef.value) {
    gsap.fromTo(
      timerRef.value,
      { y: '60vh', opacity: 0 },
      { y: 0, opacity: 1, duration: 0.55, ease: 'back.out(1.3)', clearProps: 'opacity' }
    );
  }
});

onBeforeUnmount(() => {
  clearCountdownTimer();
});
</script>

<style scoped>
.timer-number {
  color: rgba(255, 244, 205, 1);
  -webkit-text-stroke: 4px rgba(38, 14, 3);
  paint-order: stroke fill;
}

.timer-clock {
  filter: drop-shadow(3px 3px 0 rgba(38, 14, 3, 0.25)) drop-shadow(0 0 20px rgba(241, 183, 48, 0.5));
}

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
