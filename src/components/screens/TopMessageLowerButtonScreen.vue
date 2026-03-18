<template>
  <ScreenGrid overlay>
    <div v-if="showParcement" class="col-span-8 row-span-2 row-start-1">
      <Parchment
        size="fill"
        surface-class="h-full"
        content-class="flex h-full items-center justify-center text-center"
        @shown="handleParchmentShown"
      >
        <slot name="message">{{ message }}</slot>
      </Parchment>
    </div>

    <div class="col-span-8 row-span-4 row-start-3 flex items-center justify-center">
      <div class="pointer-events-none flex h-full w-full items-center justify-center">
        <slot name="cards" :revealed="cardsVisible" />
      </div>
    </div>

    <div
      v-if="hasPrimaryButton"
      :class="[
        'col-span-4 col-start-3 row-start-7 transition-opacity duration-300',
        buttonsVisible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
      ]"
    >
      <GameButton :label="primaryButtonLabel" :on-click="onPrimaryButtonClick">
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
      >
        <slot name="secondary">{{ secondaryButtonLabel }}</slot>
      </GameButton>
    </div>

    <div
      v-if="shouldShowUndo"
      :class="[
        'col-span-2 col-start-1 row-start-8 transition-opacity duration-300',
        buttonsVisible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
      ]"
    >
      <GameButton variant="undo" :label="undoLabel" :on-click="onUndoClick">
        <slot name="undo">{{ undoLabel }}</slot>
      </GameButton>
    </div>
  </ScreenGrid>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useSlots } from 'vue';
import Parchment from '../parchment.vue';
import GameButton from '../ui/GameButton.vue';
import ScreenGrid from '../ui/ScreenGrid.vue';
import type { ButtonHandler } from '../../types/ui';

const props = withDefaults(
  defineProps<{
    message?: string;
    primaryButtonLabel?: string;
    onPrimaryButtonClick?: ButtonHandler;
    secondaryButtonLabel?: string;
    onSecondaryButtonClick?: ButtonHandler;
    showUndo?: boolean;
    undoLabel?: string;
    onUndoClick?: ButtonHandler;
  }>(),
  {
    message: '',
    primaryButtonLabel: '',
    onPrimaryButtonClick: undefined,
    secondaryButtonLabel: '',
    onSecondaryButtonClick: undefined,
    showUndo: false,
    undoLabel: 'Undo',
    onUndoClick: undefined,
  }
);

const slots = useSlots();

const showParcement = computed(() => Boolean(slots.message));

const hasPrimaryButton = computed(
  () => Boolean(props.primaryButtonLabel) || Boolean(slots.primary)
);
const hasSecondaryButton = computed(
  () => Boolean(props.secondaryButtonLabel) || Boolean(slots.secondary)
);
const hasCards = computed(() => Boolean(slots.cards));
const shouldShowUndo = computed(() => props.showUndo || hasCards.value);
const cardsVisible = ref(false);
const buttonsVisible = ref(false);

let buttonsTimer: number | null = null;

const secondaryButtonClasses = computed(() => [
  'pointer-events-auto row-start-8 transition-opacity duration-300',
  shouldShowUndo.value ? 'col-span-4 col-start-3' : 'col-span-6 col-start-2',
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
  }, 300);
}

function startRevealSequence() {
  cardsVisible.value = false;
  buttonsVisible.value = false;

  if (!showParcement.value) {
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

console.log('props', hasSecondaryButton.value, props.secondaryButtonLabel, slots.secondary);
</script>
