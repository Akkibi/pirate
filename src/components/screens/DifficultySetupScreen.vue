<template>
  <FullMessageButtonScreen
    :primary-button-label="resolvedPrimaryButtonLabel"
    :on-primary-button-click="confirm"
    :side-chrome-layout="sideChromeLayout"
  >
    <template #message>
      <div class="difficulty-content">
        <p class="difficulty-title font-title">
          {{ resolvedTitle }}
        </p>
        <p class="difficulty-body">
          {{ resolvedBody }}
        </p>
        <div class="difficulty-selector pointer-events-auto">
          <button
            class="difficulty-step"
            type="button"
            :disabled="selectedValue <= minValue"
            @click="decrement"
          >
            -
          </button>
          <div class="difficulty-value font-title overflow-hidden relative">
            <Transition name="ticker" mode="out-in">
              <span :key="selectedValue" class="block">{{ selectedValue }}</span>
            </Transition>
          </div>
          <button
            class="difficulty-step"
            type="button"
            :disabled="selectedValue >= maxValue"
            @click="increment"
          >
            +
          </button>
        </div>
      </div>
    </template>
  </FullMessageButtonScreen>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import FullMessageButtonScreen from './FullMessageButtonScreen.vue';
import { playSound } from '../../utils/soundManager';
import { gameText } from '../../content/gameText';

const props = withDefaults(
  defineProps<{
    title?: string;
    body?: string;
    initialValue: number;
    minValue?: number;
    maxValue?: number;
    primaryButtonLabel?: string;
    onConfirm?: (value: number) => void | Promise<void>;
    sideChromeLayout?: boolean;
  }>(),
  {
    title: undefined,
    body: undefined,
    minValue: 3,
    maxValue: 9,
    primaryButtonLabel: undefined,
    onConfirm: undefined,
    sideChromeLayout: false,
  }
);

const selectedValue = ref(props.initialValue);
const resolvedTitle = computed(() => props.title ?? gameText.setup.difficulty.title);
const resolvedBody = computed(() => props.body ?? gameText.setup.difficulty.body);
const resolvedPrimaryButtonLabel = computed(
  () => props.primaryButtonLabel ?? gameText.setup.difficulty.primaryButton
);

function increment() {
  playSound('rhumSelect');
  selectedValue.value = Math.min(props.maxValue, selectedValue.value + 1);
}

function decrement() {
  playSound('rhumSelect');
  selectedValue.value = Math.max(props.minValue, selectedValue.value - 1);
}

function confirm() {
  void props.onConfirm?.(selectedValue.value);
}
</script>

<style scoped>
.difficulty-content {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(0.3rem, 1.6vmin, 0.9rem);
  overflow: hidden;
  text-align: center;
}

.difficulty-title {
  max-width: min(100%, 54rem);
  font-size: clamp(1.45rem, 7vmin, 4.5rem);
  line-height: 1.05;
  overflow-wrap: anywhere;
  background-color: #371412;
  color: transparent;
  text-shadow: 1px 1px 1px rgba(255, 255, 255, 0.2);
  filter: saturate(1.5);
  -webkit-background-clip: text;
  background-clip: text;
}

.difficulty-body {
  width: min(100%, 52rem);
  min-width: 0;
  font-size: var(--ui-message-body-size);
  line-height: 1.22;
  white-space: normal;
  overflow-wrap: anywhere;
  hyphens: auto;
  text-wrap: pretty;
  background-color: #61220e;
  color: transparent;
  text-shadow: 1px 1px 1px rgba(255, 255, 255, 0.2);
  -webkit-background-clip: text;
  background-clip: text;
}

.difficulty-selector {
  display: flex;
  align-items: center;
  gap: clamp(0.55rem, 4vmin, 1.7rem);
  /*background-color: #371412;*/
  background: radial-gradient(circle at center, #472422 0%, #371412 70%);

  color: rgba(255, 244, 205, 1);
  -webkit-mask-image: url(/images/parchment/phase_parent.svg);
  -webkit-mask-size: 100% 100%;
  mask-image: url(/images/parchment/phase_parent.svg);
  mask-size: 100% 100%;
  padding: clamp(0.5rem, 2vmin, 1rem) clamp(0.75rem, 3vmin, 1.5rem);
  clip-path: polygon(5% 0, 100% 5%, 95% 100%, 0 100%);
}

.difficulty-step {
  width: clamp(2rem, 7.5vmin, 3.6rem);
  height: clamp(2rem, 7.5vmin, 3.6rem);
  border-radius: 0.5rem;
  background: transparent;
  font-size: clamp(1.2rem, 4.6vmin, 2.3rem);
  font-weight: 900;
  line-height: 1;
  transition: opacity 0.2s ease;
}

.difficulty-step:disabled {
  opacity: 0.25;
  cursor: default;
}

.difficulty-value {
  min-width: clamp(2.6rem, 10vmin, 5.2rem);
  font-size: clamp(2.25rem, 10.5vmin, 5.5rem);
  line-height: 1;
  padding-top: clamp(0.25rem, 2.2vmin, 1rem);
  background-color: rgba(255, 244, 205, 1);
  color: transparent;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.15);
  -webkit-background-clip: text;
  background-clip: text;
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
