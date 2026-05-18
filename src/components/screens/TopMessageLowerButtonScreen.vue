<template>
  <div v-if="shouldShowParchment" :class="parchmentClasses">
    <Parchment
      size="fill"
      surface-class="h-full"
      content-class="flex h-full items-center justify-center text-center"
      @shown="handleParchmentShown"
    >
      <slot name="message">{{ message }}</slot>
    </Parchment>
  </div>

  <div :class="cardsAreaClasses">
    <div class="pointer-events-none flex h-full min-h-0 w-full items-stretch justify-center">
      <slot name="cards" :revealed="cardsVisible" />
    </div>
  </div>

  <div
    v-if="hasPrimaryButton"
    :class="[
      primaryButtonClasses,
      buttonsVisible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
    ]"
  >
    <GameButton
      :label="primaryButtonLabel"
      :on-click="onPrimaryButtonClick"
      :revealed="buttonsVisible"
    >
      <slot name="primary">{{ primaryButtonLabel }}</slot>
    </GameButton>
  </div>

  <div
    v-if="hasSecondaryButton"
    :class="[
      secondaryButtonClasses,
      buttonsVisible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
    ]"
  >
    <GameButton
      variant="secondary"
      :label="secondaryButtonLabel"
      :on-click="onSecondaryButtonClick"
      :revealed="buttonsVisible"
    >
      <slot name="secondary">{{ secondaryButtonLabel }}</slot>
    </GameButton>
  </div>

  <div
    v-if="shouldShowUndo"
    :class="[
      undoButtonClasses,
      buttonsVisible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
    ]"
  >
    <GameButton
      variant="undo"
      :label="undoLabel"
      :on-click="onUndoClick"
      :revealed="buttonsVisible"
    >
      <slot name="undo">{{ undoLabel }}</slot>
    </GameButton>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useSlots } from 'vue';
import Parchment from '../parchment.vue';
import GameButton from '../ui/GameButton.vue';
import type { ButtonHandler } from '../../types/ui';

const props = withDefaults(
  defineProps<{
    message?: string;
    showParchment?: boolean;
    primaryButtonLabel?: string;
    onPrimaryButtonClick?: ButtonHandler;
    secondaryButtonLabel?: string;
    onSecondaryButtonClick?: ButtonHandler;
    showUndo?: boolean;
    undoLabel?: string;
    onUndoClick?: ButtonHandler;
    sideChromeLayout?: boolean;
  }>(),
  {
    message: '',
    showParchment: true,
    primaryButtonLabel: '',
    onPrimaryButtonClick: undefined,
    secondaryButtonLabel: '',
    onSecondaryButtonClick: undefined,
    showUndo: false,
    undoLabel: 'Undo',
    onUndoClick: undefined,
    sideChromeLayout: false,
  }
);

const slots = useSlots();

const shouldShowParchment = computed(
  () => props.showParchment && (Boolean(props.message) || Boolean(slots.message))
);

const hasPrimaryButton = computed(
  () => Boolean(props.primaryButtonLabel) || Boolean(slots.primary)
);
const hasSecondaryButton = computed(
  () => Boolean(props.secondaryButtonLabel) || Boolean(slots.secondary)
);
const hasCards = computed(() => Boolean(slots.cards));
const shouldShowUndo = computed(() => props.showUndo);
const cardsVisible = ref(false);
const buttonsVisible = ref(false);

let buttonsTimer: number | null = null;

const normalButtonCount = computed(
  () => Number(hasPrimaryButton.value) + Number(hasSecondaryButton.value)
);
const normalFullButtonClasses = computed(() =>
  props.sideChromeLayout ? 'col-start-2 col-span-6' : 'col-start-1 col-span-8'
);
const normalLeftButtonClasses = computed(() =>
  props.sideChromeLayout ? 'col-start-2 col-span-3' : 'col-start-1 col-span-4'
);
const normalRightButtonClasses = computed(() =>
  props.sideChromeLayout ? 'col-start-5 col-span-3' : 'col-start-5 col-span-4'
);
const normalButtonsShareFirstRow = computed(
  () => shouldShowUndo.value && hasPrimaryButton.value && hasSecondaryButton.value
);
const buttonRowCount = computed(() => {
  if (normalButtonCount.value === 0) {
    return shouldShowUndo.value ? 1 : 0;
  }

  if (normalButtonsShareFirstRow.value) {
    return 2;
  }

  return Math.min(2, normalButtonCount.value + Number(shouldShowUndo.value));
});
const parchmentClasses = computed(() => [
  'row-span-2 row-start-1',
  props.sideChromeLayout ? 'col-start-2 col-span-6' : 'col-start-3 col-span-4',
]);
const cardsAreaClasses = computed(() => [
  'row-start-3 flex min-h-0 items-stretch justify-center',
  props.sideChromeLayout ? 'col-start-2 col-span-6' : 'col-span-8',
  buttonRowCount.value >= 2
    ? 'row-span-4'
    : buttonRowCount.value === 1
      ? 'row-span-5'
      : 'row-span-6',
]);
const primaryButtonClasses = computed(() => [
  'transition-opacity duration-300',
  normalButtonsShareFirstRow.value
    ? `${normalLeftButtonClasses.value} row-start-7`
    : `${normalFullButtonClasses.value} ${hasSecondaryButton.value || shouldShowUndo.value ? 'row-start-7' : 'row-start-8'}`,
]);
const secondaryButtonClasses = computed(() => [
  'pointer-events-auto transition-opacity duration-300',
  normalButtonsShareFirstRow.value
    ? `${normalRightButtonClasses.value} row-start-7`
    : `${normalFullButtonClasses.value} ${shouldShowUndo.value ? 'row-start-7' : 'row-start-8'}`,
]);
const undoButtonClasses = computed(() => [
  'col-span-2 row-start-8 transition-opacity duration-300',
  props.sideChromeLayout ? 'col-start-2' : 'col-start-1',
]);

function clearButtonsTimer() {
  if (buttonsTimer !== null) {
    window.clearTimeout(buttonsTimer);
    buttonsTimer = null;
  }
}

function revealButtonsAfterCards() {
  clearButtonsTimer();
  buttonsTimer = window.setTimeout(() => {
    buttonsVisible.value = true;
  }, 1500);
}

function startRevealSequence() {
  cardsVisible.value = false;
  buttonsVisible.value = false;

  if (!shouldShowParchment.value) {
    if (hasCards.value) {
      cardsVisible.value = true;
      revealButtonsAfterCards();
      return;
    }

    buttonsVisible.value = true;
  }
}

function handleParchmentShown() {
  if (hasCards.value) {
    cardsVisible.value = true;
    revealButtonsAfterCards();
    return;
  }

  buttonsVisible.value = true;
}

onMounted(() => {
  startRevealSequence();
});

onBeforeUnmount(() => {
  clearButtonsTimer();
});
</script>
