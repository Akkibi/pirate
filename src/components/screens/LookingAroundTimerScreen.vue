<template>
  <ScreenGrid overlay>
    <div class="col-span-6 col-start-2 row-span-3 row-start-1">
      <div
        class="relative flex h-full min-h-[12rem] items-center justify-center overflow-hidden rounded-[30px] border-[3px] border-[#5b3a1f] bg-[#d9bc87] shadow-[0_18px_40px_rgba(38,24,12,0.35)]"
      >
        <div
          class="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,246,217,0.92)_0%,rgba(228,197,139,0.95)_52%,rgba(190,142,85,0.98)_100%)]"
        ></div>
        <div
          v-for="step in countdownSteps"
          v-show="currentStep === step"
          :key="step"
          class="relative flex h-full w-full items-center justify-center px-6 py-4"
        >
          <div
            class="timer-number flex h-full w-full items-center justify-center rounded-[24px] border border-[#8d5d2d]/40 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.28),transparent_50%),linear-gradient(180deg,rgba(121,79,39,0.18),rgba(91,58,31,0.08))] text-[clamp(4rem,22vw,8rem)] text-[#533116]"
          >
            {{ step }}
          </div>
        </div>
      </div>
    </div>
  </ScreenGrid>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";
import ScreenGrid from "../ui/ScreenGrid.vue";
import type { ButtonHandler } from "../../types/ui";

const props = withDefaults(
  defineProps<{
    visible?: boolean;
    replayKey?: string | number | boolean | null;
    stepDuration?: number;
    onComplete?: ButtonHandler;
  }>(),
  {
    visible: true,
    replayKey: null,
    stepDuration: 1000,
    onComplete: undefined,
  },
);

const emit = defineEmits<{
  (event: "finished"): void;
}>();

const countdownSteps = [5, 4, 3, 2, 1];
const currentStep = ref(5);

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
      emit("finished");
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
  { immediate: true },
);

watch(
  () => props.replayKey,
  () => {
    if (props.visible) {
      startCountdown();
    }
  },
);

onBeforeUnmount(() => {
  clearCountdownTimer();
});
</script>

<style scoped>
.timer-number {
  font-family: "Black Crest", "IM Fell English", Georgia, serif;
}
</style>
