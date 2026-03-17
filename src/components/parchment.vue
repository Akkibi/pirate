<template>
  <div v-if="isRendered" :class="wrapperClasses">
    <component
      :is="rootTag"
      ref="parchmentRef"
      :type="clickable ? 'button' : undefined"
      :disabled="clickable ? disabled : undefined"
      :class="parchmentClasses"
      @click="handleClick"
    >
      <div :class="surfaceClasses">
        <div ref="contentRef" :class="contentClasses">
          <slot>{{ text }}</slot>
        </div>
      </div>
    </component>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useSlots, watch } from 'vue';
import { gsap } from 'gsap';

type ParchmentSize = 'sm' | 'md' | 'bg' | 'fill';
type DisplayMode = 'inline' | 'overlay';
type DismissMode = 'manual' | 'auto';
type HideReason = 'manual' | 'auto';

const props = withDefaults(
  defineProps<{
    text?: string;
    clickable?: boolean;
    size?: ParchmentSize;
    onClick?: (() => void | Promise<void>) | undefined;
    visible?: boolean;
    displayMode?: DisplayMode;
    dismissMode?: DismissMode;
    dismissDelay?: number;
    replayKey?: string | number | boolean | null;
    disabled?: boolean;
    surfaceClass?: string;
    contentClass?: string;
  }>(),
  {
    text: '',
    clickable: false,
    size: 'md',
    visible: true,
    displayMode: 'inline',
    dismissMode: 'manual',
    dismissDelay: 2500,
    replayKey: null,
    disabled: false,
    surfaceClass: '',
    contentClass: '',
  }
);

const emit = defineEmits<{
  (event: 'clicked', mouseEvent: globalThis.MouseEvent): void;
  (event: 'shown'): void;
  (event: 'hidden', reason: HideReason): void;
}>();

const slots = useSlots();
const parchmentRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);
const isRendered = ref(props.visible);
const rootTag = computed(() => (props.clickable ? 'button' : 'div'));
const hasDefaultSlot = computed(() => Boolean(slots.default));

let animationTimeline: gsap.core.Timeline | null = null;
let autoHideTimer: number | null = null;

const wrapperClasses = computed(() =>
  props.displayMode === 'overlay'
    ? 'absolute inset-0 z-10 flex h-full w-full items-center justify-center p-2 sm:p-4 pointer-events-none'
    : 'flex h-full w-full min-h-0 items-center justify-center'
);

const sizeClasses: Record<ParchmentSize, string> = {
  sm: 'min-h-16 w-full max-w-[22rem]',
  md: 'min-h-20 w-full max-w-[28rem]',
  bg: 'h-[clamp(16rem,50vh,30rem)] w-[min(82vw,30rem)]',
  fill: 'h-full w-full',
};

const textSizeClasses: Record<ParchmentSize, string> = {
  sm: 'text-xl',
  md: 'text-3xl',
  bg: 'text-5xl sm:text-6xl',
  fill: 'text-lg sm:text-xl',
};

const parchmentClasses = computed(() => [
  'w-full h-full pointer-events-auto opacity-0 bg-yellow-800 scale-x-0',
  props.clickable ? 'border-0 bg-transparent p-0' : '',
  props.clickable && !props.disabled ? 'cursor-pointer' : '',
  props.disabled ? 'cursor-not-allowed opacity-60' : '',
]);

const surfaceClasses = computed(() => [
  'relative flex h-full min-h-0 items-stretch justify-stretch',
  sizeClasses[props.size],
  props.surfaceClass,
]);

const contentClasses = computed(() => [
  'relative h-full min-h-0 w-full opacity-0',
  hasDefaultSlot.value
    ? `p-3 sm:p-6 ${props.contentClass}`
    : `flex items-center justify-center px-6 py-4 text-center ${textSizeClasses[props.size]} ${props.contentClass}`,
]);

function clearAutoHideTimer() {
  if (autoHideTimer !== null) {
    window.clearTimeout(autoHideTimer);
    autoHideTimer = null;
  }
}

function killActiveAnimations() {
  animationTimeline?.kill();
  animationTimeline = null;

  if (parchmentRef.value) {
    gsap.killTweensOf(parchmentRef.value);
  }

  if (contentRef.value) {
    gsap.killTweensOf(contentRef.value);
  }
}

function applyHiddenState() {
  if (!parchmentRef.value || !contentRef.value) return;

  gsap.set(parchmentRef.value, {
    opacity: 0,
    scaleX: 0,
    transformOrigin: 'center center',
  });
  gsap.set(contentRef.value, {
    opacity: 0,
  });
}

async function animateIn() {
  clearAutoHideTimer();
  killActiveAnimations();

  isRendered.value = true;
  await nextTick();

  if (!parchmentRef.value || !contentRef.value) return;

  applyHiddenState();

  animationTimeline = gsap.timeline({
    onComplete: () => {
      emit('shown');

      if (props.dismissMode === 'auto') {
        autoHideTimer = window.setTimeout(() => {
          void animateOut('auto');
        }, props.dismissDelay);
      }
    },
  });

  animationTimeline
    .to(parchmentRef.value, {
      opacity: 1,
      scaleX: 1,
      duration: 0.5,
      ease: 'power2.out',
    })
    .to(
      contentRef.value,
      {
        opacity: 1,
        duration: 0.5,
        ease: 'power2.out',
      },
      '>'
    );
}

async function animateOut(reason: HideReason = 'manual') {
  clearAutoHideTimer();
  killActiveAnimations();

  if (!parchmentRef.value || !contentRef.value) {
    isRendered.value = false;
    emit('hidden', reason);
    return;
  }

  animationTimeline = gsap.timeline({
    onComplete: () => {
      isRendered.value = false;
      emit('hidden', reason);
    },
  });

  animationTimeline
    .to(contentRef.value, {
      opacity: 0,
      duration: 0.2,
      ease: 'power2.in',
    })
    .to(parchmentRef.value, {
      opacity: 0,
      duration: 1,
      ease: 'power2.in',
    });
}

function handleClick(mouseEvent: globalThis.MouseEvent) {
  if (!props.clickable || props.disabled) return;

  emit('clicked', mouseEvent);
  void props.onClick?.();
}

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      void animateIn();
      return;
    }

    if (isRendered.value) {
      void animateOut('manual');
    }
  },
  { immediate: true }
);

watch(
  () => props.replayKey,
  () => {
    if (props.visible) {
      void animateIn();
    }
  }
);

onBeforeUnmount(() => {
  clearAutoHideTimer();
  killActiveAnimations();
});
</script>
