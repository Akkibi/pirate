<template>
  <FullMessageButtonScreen
    primary-button-label="Valider"
    :on-primary-button-click="confirm"
    :side-chrome-layout="sideChromeLayout"
  >
    <template #message>
      <div class="difficulty-content">
        <p class="difficulty-title font-title">
          {{ title }}
        </p>
        <p class="difficulty-body">
          {{ body }}
        </p>
        <div class="difficulty-selector pointer-events-auto text-amber-950">
          <button class="difficulty-step" type="button" @click="decrement">-</button>
          <div class="difficulty-value font-title">
            {{ selectedValue }}
          </div>
          <button class="difficulty-step" type="button" @click="increment">+</button>
        </div>
      </div>
    </template>
  </FullMessageButtonScreen>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import FullMessageButtonScreen from './FullMessageButtonScreen.vue';

const props = withDefaults(
  defineProps<{
    title?: string;
    body?: string;
    initialValue: number;
    minValue?: number;
    maxValue?: number;
    onConfirm?: (value: number) => void | Promise<void>;
    sideChromeLayout?: boolean;
  }>(),
  {
    title: "L'Arraches doit charger sa cale",
    body: 'Choisissez le nombre de bouteilles de rhum. 6 est conseille pour une premiere partie.',
    minValue: 3,
    maxValue: 9,
    onConfirm: undefined,
    sideChromeLayout: false,
  }
);

const selectedValue = ref(props.initialValue);

function increment() {
  selectedValue.value = Math.min(props.maxValue, selectedValue.value + 1);
}

function decrement() {
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
  gap: clamp(0.45rem, 1.8vh, 1.1rem);
  overflow: hidden;
  text-align: center;
}

.difficulty-title {
  max-width: min(100%, 54rem);
  color: #7c3f16;
  font-size: clamp(2rem, 7vmin, 4.5rem);
  line-height: 0.85;
  overflow-wrap: anywhere;
  filter: drop-shadow(0 4px 4px rgba(0, 0, 0, 0.25));
}

.difficulty-body {
  max-width: min(100%, 50rem);
  color: #7c3f16;
  font-size: clamp(0.9rem, 2.4vmin, 1.5rem);
  line-height: 1.2;
}

.difficulty-selector {
  display: flex;
  align-items: center;
  gap: clamp(0.65rem, 2.8vw, 2rem);
}

.difficulty-step {
  width: clamp(2.3rem, 6vmin, 4rem);
  height: clamp(2.3rem, 6vmin, 4rem);
  border-radius: 0.5rem;
  font-size: clamp(1.5rem, 4vmin, 2.6rem);
  font-weight: 900;
  line-height: 1;
}

.difficulty-value {
  min-width: clamp(3rem, 9vmin, 6rem);
  color: #3f1309;
  font-size: clamp(3rem, 10vmin, 6rem);
  line-height: 1;
  padding-top: 1rem;
}
</style>
