<template>
  <div
    class="corsair-defeat-screen col-span-8 col-start-1 row-span-8 row-start-1 z-50"
    :style="screenStyle"
    aria-live="polite"
  >
    <div class="corsair-defeat-frame">
      <img :src="imageSrc" :alt="imageAlt" class="corsair-defeat-image" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue';

const props = withDefaults(
  defineProps<{
    imageSrc: string;
    imageAlt: string;
    duration?: number;
    onComplete?: () => void;
  }>(),
  {
    duration: 2600,
    onComplete: undefined,
  }
);

let fallbackTimer: number | null = null;
let hasCompleted = false;

const screenStyle = computed(() => ({
  '--corsair-defeat-duration': `${props.duration}ms`,
}));

function completeTransition() {
  if (hasCompleted) {
    return;
  }

  hasCompleted = true;
  props.onComplete?.();
}

onMounted(() => {
  fallbackTimer = window.setTimeout(() => {
    completeTransition();
  }, props.duration + 160);
});

onBeforeUnmount(() => {
  if (fallbackTimer !== null) {
    window.clearTimeout(fallbackTimer);
  }
});
</script>

<style scoped>
.corsair-defeat-screen {
  position: relative;
  overflow: hidden;
  pointer-events: auto;
}

.corsair-defeat-frame {
  position: absolute;
  top: 50%;
  left: 50%;
  width: min(34vw, 34vh);
  aspect-ratio: 990 / 1686;
  overflow: hidden;
  border: 0.2rem solid rgba(248, 220, 150, 0.72);
  box-shadow:
    0 1.2rem 2rem rgba(0, 0, 0, 0.58),
    0 0 0 0.28rem rgba(48, 18, 10, 0.7);
  transform-origin: 50% 25%;
  animation: corsair-photo-takeover var(--corsair-defeat-duration) cubic-bezier(0.2, 0.8, 0.2, 1)
    forwards;
}

.corsair-defeat-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.02);
}

@keyframes corsair-photo-takeover {
  0% {
    opacity: 0;
    transform: translate3d(-50%, -50%, 0) scale(0.44) rotate(-1.5deg);
    filter: contrast(0.9) saturate(0.74);
  }

  16% {
    opacity: 1;
    transform: translate3d(-50%, -50%, 0) scale(0.78) rotate(0deg);
    filter: contrast(1) saturate(1);
  }

  64% {
    opacity: 1;
    transform: translate3d(-50%, -50%, 0) scale(5) rotate(0deg);
    filter: contrast(1.05) saturate(1.08);
  }

  100% {
    opacity: 0;
    transform: translate3d(-50%, -50%, 0) scale(4.35) rotate(0deg);
    filter: contrast(1.15) saturate(0.65);
  }
}
</style>
