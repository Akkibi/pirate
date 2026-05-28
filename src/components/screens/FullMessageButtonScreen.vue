<template>
  <div v-if="showParchment" :class="parchmentClasses">
    <Parchment
      size="fill"
      surface-class="h-full"
      content-class="flex h-full items-center justify-center text-center"
      @shown="handleParchmentShown"
    >
      <!-- Replaced by the <template/> in App vue -->
      <div class="full-message-copy">
        <slot name="message">{{ message }}</slot>
      </div>
    </Parchment>
  </div>

  <div
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
    v-if="showUndo"
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
import { computed, onMounted, ref, useSlots } from 'vue';
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
const buttonsVisible = ref(false);

const hasSecondaryButton = computed(
  () => Boolean(props.secondaryButtonLabel) || Boolean(slots.secondary)
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
const normalButtonsShareFirstRow = computed(() => props.showUndo && hasSecondaryButton.value);
const parchmentClasses = computed(() => [
  props.sideChromeLayout
    ? 'col-start-2 col-span-6 row-start-1 row-span-6'
    : 'col-span-8 row-span-4 row-start-2',
]);
const primaryButtonClasses = computed(() => [
  'transition-opacity duration-300',
  normalButtonsShareFirstRow.value
    ? `${normalLeftButtonClasses.value} row-start-7`
    : `${normalFullButtonClasses.value} row-start-7`,
]);
const secondaryButtonClasses = computed(() => [
  'transition-opacity duration-300',
  normalButtonsShareFirstRow.value
    ? `${normalRightButtonClasses.value} row-start-7`
    : `${normalFullButtonClasses.value} row-start-8`,
]);
const undoButtonClasses = computed(() => [
  'col-span-2 row-start-8 transition-opacity duration-300',
  props.sideChromeLayout ? 'col-start-2' : 'col-start-1',
]);

function handleParchmentShown() {
  buttonsVisible.value = true;
}

onMounted(() => {
  if (!props.showParchment) {
    buttonsVisible.value = true;
  }
});
</script>

<style scoped>
.full-message-copy {
  width: 100%;
  height: 100%;
  min-height: 0;
}

.full-message-copy :deep(.screen-message) {
  gap: clamp(0.25rem, 1.15vmin, 0.75rem);
  padding-inline: clamp(0.25rem, 1.5vw, 1rem);
}

.full-message-copy :deep(.screen-message-title) {
  max-width: min(100%, 78rem);
  font-size: clamp(3.45rem, 16.2vmin, 6rem);
  line-height: 0.78;
  overflow-wrap: anywhere;
  text-wrap: balance;
}
</style>
