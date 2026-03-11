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
        <div class="flex w-6 h-full bg-green-500"></div>
        <div
          ref="contentRef"
          :class="contentClasses"
        >
          <slot>{{ text }}</slot>
        </div>
        <div class="flex w-6 h-full bg-green-500"></div>
      </div>
    </component>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { gsap } from "gsap";

type ParchmentSize = "sm" | "md" | "bg";
type DisplayMode = "inline" | "overlay";
type DismissMode = "manual" | "auto";
type HideReason = "manual" | "auto";

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
  }>(),
  {
    text: "",
    clickable: false,
    size: "md",
    visible: true,
    displayMode: "inline",
    dismissMode: "manual",
    dismissDelay: 2500,
    replayKey: null,
    disabled: false,
  },
);

const emit = defineEmits<{
  (event: "clicked", mouseEvent: MouseEvent): void;
  (event: "shown"): void;
  (event: "hidden", reason: HideReason): void;
}>();

const parchmentRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);
const isRendered = ref(props.visible);
const rootTag = computed(() => (props.clickable ? "button" : "div"));

let animationTimeline: gsap.core.Timeline | null = null;
let autoHideTimer: number | null = null;

const wrapperClasses = computed(() =>
  props.displayMode === "overlay"
    ? "absolute inset-0 z-10 flex h-full w-full items-center justify-center pointer-events-none"
    : "flex items-center justify-center",
);

const sizeClasses: Record<ParchmentSize, string> = {
  sm: "w-full h-16",
  md: "w-full h-20",
  bg: "w-2/3 h-2/3",
};

const textSizeClasses: Record<ParchmentSize, string> = {
  sm: "text-xl",
  md: "text-3xl",
  bg: "text-6xl",
};

const parchmentClasses = computed(() => [
  "pointer-events-auto scale-x-0 opacity-0",
  props.clickable ? "bg-transparent border-0 p-0" : "",
  props.clickable && !props.disabled ? "cursor-pointer" : "",
  props.disabled ? "opacity-60 cursor-not-allowed" : "",
]);

const surfaceClasses = computed(() => [
  "flex flex-row justify-center items-center bg-red-500",
  sizeClasses[props.size],
]);

const contentClasses = computed(() => [
  "flex-1 text-center opacity-0 p-4 w-full h-full",
  textSizeClasses[props.size],
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
    transformOrigin: "center center",
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
      emit("shown");

      if (props.dismissMode === "auto") {
        autoHideTimer = window.setTimeout(() => {
          void animateOut("auto");
        }, props.dismissDelay);
      }
    },
  });

  animationTimeline
    .to(parchmentRef.value, {
      opacity: 1,
      scaleX: 1,
      duration: 0.8,
      ease: "power2.out",
    }, 0)
    .to(
      contentRef.value,
      {
        opacity: 1,
        duration: 1,
        ease: "power2.out",
      },
      '>',
    );
}

async function animateOut(reason: HideReason = "manual") {
  clearAutoHideTimer();
  killActiveAnimations();

  if (!parchmentRef.value || !contentRef.value) {
    isRendered.value = false;
    emit("hidden", reason);
    return;
  }

  animationTimeline = gsap.timeline({
    onComplete: () => {
      isRendered.value = false;
      emit("hidden", reason);
    },
  });

  animationTimeline
    .to(contentRef.value, {
      opacity: 0,
      duration: 0.2,
      ease: "power2.in",
    })
    .to(
      parchmentRef.value,
      {
        opacity: 0,
        duration: 1,
        ease: "power2.in",
      },
    );
}

function handleClick(mouseEvent: MouseEvent) {
  if (!props.clickable || props.disabled) return;

  emit("clicked", mouseEvent);
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
      void animateOut("manual");
    }
  },
  { immediate: true },
);

watch(
  () => props.replayKey,
  () => {
    if (props.visible) {
      void animateIn();
    }
  },
);

onBeforeUnmount(() => {
  clearAutoHideTimer();
  killActiveAnimations();
});
</script>
