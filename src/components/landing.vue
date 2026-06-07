<template>
  <div
    class="absolute bg-black inset-0 z-0 anchor-mask"
    :style="{
      maskImage: `url(${randomMask}), linear-gradient(black, black)`,
      maskSize: '10000vh, cover',
    }"
    ref="maskRef"
  ></div>
  <div
    ref="logoRef"
    class="col-span-8 col-start-1 row-span-4 row-start-1 flex items-center justify-center p-4"
  >
    <div class="landing-logo z-10" aria-label="Captain!">
      <div class="landing-logo__artwork">
        <img
          class="landing-logo__base"
          src="/images/logo/captain_logo_withoutboussole2.webp"
          alt=""
        />
        <div class="landing-logo__compass" aria-hidden="true">
          <img class="landing-logo__needles" src="/images/logo/bussole_aiguilles.webp" alt="" />
          <img class="landing-logo__pin" src="/images/logo/bussole_epingle.webp" alt="" />
        </div>
      </div>
    </div>
  </div>

  <div
    ref="loadingBarRef"
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

  <div ref="startButtonRef" class="pointer-events-auto col-span-6 col-start-2 row-start-6 min-h-0">
    <GameButton
      :label="gameText.landing.primaryButton"
      :on-click="startGame"
      :disabled="!isLoaded"
    />
  </div>

  <div
    v-if="showResume"
    ref="resumeButtonRef"
    class="pointer-events-auto col-span-2 col-start-2 row-start-7 min-h-0"
  >
    <GameButton
      :label="gameText.landing.resumeButton"
      :on-click="resumeGame"
      :disabled="!isLoaded"
    />
  </div>

  <div
    ref="demoButtonRef"
    :class="[
      'pointer-events-auto row-start-7 min-h-0',
      showResume ? 'col-span-2 col-start-4' : 'col-span-3 col-start-2',
    ]"
  >
    <GameButton
      :label="gameText.landing.demoButton"
      :on-click="startDemoGame"
      :disabled="!isLoaded"
    />
  </div>

  <div
    ref="settingsButtonRef"
    :class="[
      'pointer-events-auto row-start-7 min-h-0',
      showResume ? 'col-span-2 col-start-6' : 'col-span-3 col-start-5',
    ]"
  >
    <GameButton
      :label="gameText.landing.secondaryButton"
      :on-click="openSettings"
      :disabled="!isLoaded"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import gsap from 'gsap';
import GameButton from './ui/GameButton.vue';
import { gameText } from '../content/gameText';
import { gameState } from '../utils/gameStore';

withDefaults(
  defineProps<{
    showResume?: boolean;
  }>(),
  {
    showResume: false,
  }
);

const masks = ['/images/masks/anchor.svg', '/images/masks/wheel.svg'];
const randomMask = masks[Math.floor(Math.random() * masks.length)];

const logoRef = ref<HTMLElement | null>(null);

onMounted(() => {
  const tl = gsap.timeline();

  if (logoRef.value) {
    tl.from(logoRef.value, { y: '-110vh', duration: 0.75, ease: 'elastic.out(1, 0.75)' }, 0.25);
  }

  const buttonEls = [
    loadingBarRef.value,
    startButtonRef.value,
    resumeButtonRef.value,
    demoButtonRef.value,
    settingsButtonRef.value,
  ].filter(Boolean) as HTMLElement[];

  buttonEls.forEach((el, i) => {
    tl.from(el, { y: '110vh', duration: 0.75, ease: 'elastic.out(1, 0.75)' }, 0.25 + i * 0.08);
  });
});
const loadingBarRef = ref<HTMLElement | null>(null);
const maskRef = ref<HTMLElement | null>(null);
const startButtonRef = ref<HTMLElement | null>(null);
const resumeButtonRef = ref<HTMLElement | null>(null);
const demoButtonRef = ref<HTMLElement | null>(null);
const settingsButtonRef = ref<HTMLElement | null>(null);

function exit(onSceneChange?: () => void) {
  const tl = gsap.timeline({ onComplete: () => onSceneChange?.() });

  if (logoRef.value) {
    tl.to(
      logoRef.value,
      {
        y: '-110vh',
        duration: 0.5,
        ease: 'expo.in',
      },
      '<'
    );
  }
  if (maskRef.value) {
    tl.fromTo(
      maskRef.value,
      { maskSize: '1000%, cover' },
      {
        maskSize: '0.1%, cover',
        duration: 0.5,
        ease: 'expo.out',
      },
      '<'
    );
  }

  const buttonEls = [
    loadingBarRef.value,
    startButtonRef.value,
    resumeButtonRef.value,
    demoButtonRef.value,
    settingsButtonRef.value,
  ].filter(Boolean) as HTMLElement[];

  buttonEls.forEach((el, i) => {
    tl.to(
      el,
      {
        y: '110vh',
        duration: 0.5,
        ease: 'expo.in',
        delay: (3 - i) * 0.05,
      },
      '0'
    );
  });
}

defineExpose({ exit });

const emit = defineEmits<{
  (event: 'start'): void;
  (event: 'demo'): void;
  (event: 'resume'): void;
  (event: 'settings'): void;
}>();

const isLoaded = computed(() => gameState.loadingProgress >= 100);
const openSettings = () => emit('settings');

function startGame() {
  emit('start');
}

function startDemoGame() {
  emit('demo');
  gameState.gameStarted = true;
}

function resumeGame() {
  emit('resume');
}
</script>

<style scoped>
.anchor-mask {
  mask-repeat: no-repeat, no-repeat;
  mask-position: center, center;
  mask-size: contain, cover;
  mask-composite: exclude;
  -webkit-mask-composite: xor;
}

.landing-logo {
  position: relative;
  width: min(88vw, 46rem, calc((50vh - 2rem) * 2.169));
  aspect-ratio: 2572 / 1186;
  pointer-events: none;
  filter: drop-shadow(0 1.1rem 1.35rem rgba(17, 10, 7, 0.58));
}

.landing-logo__artwork {
  position: absolute;
  top: -39.63%;
  left: -3.11%;
  width: 106.22%;
  aspect-ratio: 2732 / 2048;
}

.landing-logo__base {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.landing-logo__compass {
  position: absolute;
  top: 41.25%;
  left: 45.95%;
  width: 11.5%;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
}

.landing-logo__compass::before {
  position: absolute;
  inset: 24%;
  border-radius: 999px;
  background: rgba(21, 13, 9, 0.35);
  filter: blur(0.32rem);
  transform: translate(0.42rem, 0.5rem) rotate(-11deg);
  content: '';
  animation: compass-shadow 4.2s ease-in-out infinite;
}

.landing-logo__needles,
.landing-logo__pin {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.landing-logo__needles {
  filter: drop-shadow(0.32rem 0.5rem 0 rgba(25, 19, 23, 0.42))
    drop-shadow(0 0.18rem 0.16rem rgba(0, 0, 0, 0.26));
  transform-origin: 50% 50%;
  animation: compass-needles 4.2s ease-in-out infinite;
}

.landing-logo__pin {
  z-index: 1;
  filter: drop-shadow(0.12rem 0.18rem 0.08rem rgba(0, 0, 0, 0.38));
}

@keyframes compass-needles {
  0%,
  100% {
    transform: rotate(-7deg) translate3d(-0.5%, 0.2%, 0);
  }
  45% {
    transform: rotate(8deg) translate3d(0.7%, -0.25%, 0);
  }
  68% {
    transform: rotate(3deg) translate3d(0.1%, 0, 0);
  }
}

@keyframes compass-shadow {
  0%,
  100% {
    opacity: 0.42;
    transform: translate(0.36rem, 0.48rem) rotate(-10deg) scale(0.96);
  }
  45% {
    opacity: 0.58;
    transform: translate(0.58rem, 0.42rem) rotate(8deg) scale(1.04);
  }
  68% {
    opacity: 0.48;
    transform: translate(0.45rem, 0.5rem) rotate(3deg) scale(1);
  }
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
