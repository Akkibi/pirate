<template>
  <div class="captain-celebration-confetti col-span-8 col-start-1 row-span-8 row-start-1 z-40">
    <canvas ref="confettiCanvas" class="captain-celebration-canvas" aria-hidden="true"></canvas>
  </div>

  <div :class="stageClasses">
    <img :src="imageSrc" :alt="imageAlt" class="captain-celebration-card" />
  </div>

  <div
    :class="[
      buttonClasses,
      buttonVisible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
    ]"
  >
    <GameButton
      :label="primaryButtonLabel"
      :on-click="onPrimaryButtonClick"
      :revealed="buttonVisible"
    >
      <slot name="primary">{{ primaryButtonLabel }}</slot>
    </GameButton>
  </div>
</template>

<script setup lang="ts">
import JSConfetti from 'js-confetti';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import GameButton from '../ui/GameButton.vue';
import type { ButtonHandler } from '../../types/ui';

const props = withDefaults(
  defineProps<{
    imageSrc: string;
    imageAlt: string;
    primaryButtonLabel: string;
    onPrimaryButtonClick?: ButtonHandler;
    sideChromeLayout?: boolean;
  }>(),
  {
    onPrimaryButtonClick: undefined,
    sideChromeLayout: false,
  }
);

const confettiCanvas = ref<HTMLCanvasElement | null>(null);
const buttonVisible = ref(false);

const fireworkPoints = [
  { x: 0.24, y: 0.3 },
  { x: 0.76, y: 0.28 },
  { x: 0.35, y: 0.48 },
  { x: 0.65, y: 0.47 },
  { x: 0.5, y: 0.22 },
];
const confettiColors = ['#f8d45c', '#f06a3a', '#e64037', '#3fbf83', '#2f8fd7', '#f5f0cf'];

let confetti: JSConfetti | null = null;
let fireworkInterval: number | null = null;
let buttonTimer: number | null = null;
let burstTimers: number[] = [];

const stageClasses = computed(() => [
  'captain-celebration-stage row-span-6 row-start-1 z-50',
  props.sideChromeLayout ? 'col-start-2 col-span-6' : 'col-start-1 col-span-8',
]);
const buttonClasses = computed(() => [
  'captain-celebration-button row-start-7 z-50 transition-opacity duration-300',
  props.sideChromeLayout ? 'col-start-2 col-span-6' : 'col-start-2 col-span-6',
]);

function launchFirework(pointIndex: number) {
  const canvas = confettiCanvas.value;

  if (!canvas || !confetti) {
    return;
  }

  const rect = canvas.getBoundingClientRect();
  const point = fireworkPoints[pointIndex % fireworkPoints.length] ?? fireworkPoints[0]!;

  void confetti.addConfettiAtPosition({
    confettiColors,
    confettiNumber: 140,
    confettiRadius: 4,
    confettiDispatchPosition: {
      x: rect.width * point.x,
      y: rect.height * point.y,
    },
  });
}

function clearBurstTimers() {
  for (const timer of burstTimers) {
    window.clearTimeout(timer);
  }

  burstTimers = [];
}

function startFireworks() {
  if (!confettiCanvas.value) {
    return;
  }

  confetti = new JSConfetti({ canvas: confettiCanvas.value });

  [0, 180, 420, 760].forEach((delay, index) => {
    const timer = window.setTimeout(() => {
      launchFirework(index);
    }, delay);

    burstTimers.push(timer);
  });

  fireworkInterval = window.setInterval(() => {
    launchFirework(Math.floor(Math.random() * fireworkPoints.length));
  }, 950);
}

onMounted(() => {
  startFireworks();

  buttonTimer = window.setTimeout(() => {
    buttonVisible.value = true;
  }, 900);
});

onBeforeUnmount(() => {
  clearBurstTimers();

  if (fireworkInterval !== null) {
    window.clearInterval(fireworkInterval);
  }

  if (buttonTimer !== null) {
    window.clearTimeout(buttonTimer);
  }

  confetti?.clearCanvas();
});
</script>

<style scoped>
.captain-celebration-confetti {
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 0 8rem rgba(0, 0, 0, 0.55);
  pointer-events: none;
}

.captain-celebration-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.captain-celebration-stage {
  display: flex;
  min-height: 0;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.captain-celebration-card {
  width: auto;
  max-width: min(40vw, 21rem);
  height: min(55vh, 25rem);
  max-height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 1.4rem 1.1rem rgba(0, 0, 0, 0.48));
  transform-origin: center;
  animation: captain-card-reveal 880ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes captain-card-reveal {
  0% {
    opacity: 0;
    transform: translate3d(0, 1.3rem, 0) rotate(-3deg) scale(0.72);
  }

  62% {
    opacity: 1;
    transform: translate3d(0, -0.3rem, 0) rotate(1.2deg) scale(1.05);
  }

  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
  }
}
</style>
