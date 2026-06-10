<template>
  <div v-if="isRendered" :class="wrapperClasses">
    <component
      :is="rootTag"
      ref="parchmentRef"
      :type="clickable ? 'button' : undefined"
      :disabled="clickable ? disabled : undefined"
      :class="parchmentClasses"
      :style="{
        '--parchment-clip-x': '50%',
      }"
      @click="handleClick"
    >
      <img
        ref="leftEndRef"
        class="parchment-end absolute top-0 z-10 h-full w-auto"
        src="/images/parchment/left_end.webp"
        alt=""
        aria-hidden="true"
        :draggable="false"
        :style="{
          left: 'var(--parchment-clip-x)',
        }"
      />
      <div :class="surfaceClasses">
        <div
          ref="contentRef"
          :class="contentClasses"
          :style="{
            backgroundImage: 'url(/images/parchment/background.webp)',
            backgroundSize: '100% 100%',
            clipPath: 'inset(0 var(--parchment-clip-x) 0 var(--parchment-clip-x))',
            WebkitClipPath: 'inset(0 var(--parchment-clip-x) 0 var(--parchment-clip-x))',
          }"
        >
          <div
            ref="textRef"
            class="flex h-full min-h-0 w-full items-center justify-center overflow-hidden opacity-0"
          >
            <slot>{{ text }}</slot>
          </div>
        </div>
      </div>
      <img
        ref="rightEndRef"
        class="parchment-end absolute top-0 z-10 h-full w-auto"
        src="/images/parchment/right_end.webp"
        alt=""
        aria-hidden="true"
        :draggable="false"
        :style="{
          right: 'var(--parchment-clip-x)',
        }"
      />
    </component>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useSlots, watch } from 'vue';
import { gsap } from 'gsap';

type ParchmentSize = 'sm' | 'small' | 'md' | 'medium' | 'bg' | 'fill';
type NormalizedParchmentSize = 'sm' | 'md' | 'bg' | 'fill';
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
const textRef = ref<HTMLElement | null>(null);
const leftEndRef = ref<HTMLElement | null>(null);
const rightEndRef = ref<HTMLElement | null>(null);
const isRendered = ref(props.visible);
const rootTag = computed(() => (props.clickable ? 'button' : 'div'));
const hasDefaultSlot = computed(() => Boolean(slots.default));
const normalizedSize = computed<NormalizedParchmentSize>(() => {
  if (props.size === 'small') return 'sm';
  if (props.size === 'medium') return 'md';
  return props.size;
});

let animationTimeline: gsap.core.Timeline | null = null;
let autoHideTimer: number | null = null;

const wrapperClasses = computed(() =>
  props.displayMode === 'overlay'
    ? 'parchment-overlay absolute inset-0 z-10 flex h-full w-full items-center justify-center pointer-events-none'
    : 'flex h-full w-full min-h-0 items-center justify-center'
);

const sizeClasses: Record<NormalizedParchmentSize, string> = {
  sm: 'parchment-root--sm',
  md: 'parchment-root--md',
  bg: 'parchment-root--bg',
  fill: 'parchment-root--fill',
};

const textSizeClasses: Record<NormalizedParchmentSize, string> = {
  sm: 'parchment-text--sm',
  md: 'parchment-text--md',
  bg: 'parchment-text--bg',
  fill: 'parchment-text--fill',
};

const parchmentClasses = computed(() => [
  'parchment-root relative flex min-h-0 overflow-hidden pointer-events-auto text-yellow-800',
  sizeClasses[normalizedSize.value],
  props.clickable ? 'border-0 bg-transparent p-0' : '',
  props.clickable && !props.disabled ? 'cursor-pointer' : '',
  props.disabled ? 'cursor-not-allowed opacity-60' : '',
]);

const surfaceClasses = computed(() => [
  'parchment-surface relative flex h-full min-h-0 w-full items-stretch justify-stretch',
  props.surfaceClass,
]);

const contentClasses = computed(() => [
  'relative min-h-0 w-full h-full overflow-hidden text-black',
  hasDefaultSlot.value
    ? `parchment-content ${props.contentClass}`
    : `parchment-text flex items-center justify-center text-center ${textSizeClasses[normalizedSize.value]} ${props.contentClass} text-black`,
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

  if (textRef.value) {
    gsap.killTweensOf(textRef.value);
  }

  if (leftEndRef.value) {
    gsap.killTweensOf(leftEndRef.value);
  }

  if (rightEndRef.value) {
    gsap.killTweensOf(rightEndRef.value);
  }
}

function applyHiddenState() {
  if (!parchmentRef.value || !contentRef.value || !leftEndRef.value || !rightEndRef.value) return;

  gsap.set(parchmentRef.value, {
    opacity: 1,
    scaleX: 1,
    transformOrigin: 'center center',
  });
  gsap.set(parchmentRef.value, {
    '--parchment-clip-x': '50%',
  });
  gsap.set(contentRef.value, {
    opacity: 1,
  });
  gsap.set(textRef.value, {
    opacity: 0,
  });
  gsap.set(leftEndRef.value, {
    xPercent: 0,
    opacity: 1,
  });
  gsap.set(rightEndRef.value, {
    xPercent: 0,
    opacity: 1,
  });
}

async function animateIn() {
  clearAutoHideTimer();
  killActiveAnimations();

  isRendered.value = true;
  await nextTick();

  if (!parchmentRef.value || !contentRef.value || !leftEndRef.value || !rightEndRef.value) return;

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
    .to(
      parchmentRef.value,
      {
        '--parchment-clip-x': '0%',
        duration: 1,
        ease: 'expo.out',
      },
      0
    )
    .to(
      textRef.value,
      {
        opacity: 1,
        duration: 0.9,
        ease: 'expo.out',
      },
      '>-0.9'
    );
}

async function animateOut(reason: HideReason = 'manual') {
  clearAutoHideTimer();
  killActiveAnimations();

  if (!parchmentRef.value || !contentRef.value || !leftEndRef.value || !rightEndRef.value) {
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
    .to(textRef.value, {
      opacity: 0,
      duration: 0.16,
      ease: 'power2.in',
    })
    .to(
      parchmentRef.value,
      {
        '--parchment-clip-x': '50%',
        duration: 0.55,
        ease: 'power2.in',
      },
      '>-0.05'
    )
    .to(parchmentRef.value, {
      opacity: 0,
      duration: 0.12,
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

<style scoped>
.parchment-overlay {
  padding: var(--ui-grid-padding);
}

.parchment-root {
  width: 100%;
  max-width: 100%;
}

.parchment-root--sm {
  height: auto;
  min-height: 4rem;
  max-width: 22rem;
}

.parchment-root--md {
  height: auto;
  min-height: 5rem;
  max-width: vw;
}

.parchment-root--bg {
  width: min(82vw, 30rem);
  height: clamp(16rem, 50vh, 30rem);
}

.parchment-root--fill {
  width: 100%;
  height: 100%;
}

.parchment-end {
  pointer-events: none;
  user-select: none;
}

.parchment-surface {
  height: 100%;
  width: 100%;
  padding: var(--ui-parchment-surface-pad-y) var(--ui-parchment-surface-pad-x);
}

.parchment-root--sm .parchment-surface,
.parchment-root--md .parchment-surface {
  height: auto;
  min-height: inherit;
}

.parchment-content {
  height: 100%;
  padding: var(--ui-parchment-content-pad) 4rem;
}

.parchment-text {
  height: 100%;
  padding: var(--ui-parchment-text-pad-y) 2rem;
  min-width: 0;
  white-space: normal;
  overflow-wrap: anywhere;
  hyphens: auto;
  line-height: 1.18;
  text-wrap: pretty;
}

.parchment-root--sm .parchment-content,
.parchment-root--sm .parchment-text,
.parchment-root--md .parchment-content,
.parchment-root--md .parchment-text {
  height: auto;
  min-height: inherit;
}

.parchment-text--sm {
  font-size: var(--ui-parchment-text-sm);
}

.parchment-text--md {
  font-size: var(--ui-parchment-text-md);
}

.parchment-text--bg {
  font-size: var(--ui-parchment-text-bg);
}

.parchment-text--fill {
  font-size: var(--ui-parchment-text-fill);
}
</style>
