<template>
  <ScreenGrid overlay>
    <div v-if="showParchment" class="col-span-8 row-span-4 row-start-2">
      <Parchment
        size="fill"
        surface-class="h-full"
        content-class="flex h-full items-center justify-center text-center"
        @shown="handleParchmentShown"
      >
        <slot name="message">{{ message }}</slot>
      </Parchment>
    </div>

    <div
      :class="[
        'col-span-full col-start-1 row-start-6 transition-opacity duration-300',
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
        'col-span-full col-start-1 row-start-7 transition-opacity duration-300',
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
      v-if="showUndo"
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
import { computed, onMounted, ref, useSlots } from 'vue';
import Parchment from '../parchment.vue';
import ScreenGrid from '../ui/ScreenGrid.vue';
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
  }
);

const slots = useSlots();
const buttonsVisible = ref(false);

const hasSecondaryButton = computed(
  () => Boolean(props.secondaryButtonLabel) || Boolean(slots.secondary)
);

function handleParchmentShown() {
  buttonsVisible.value = true;
}

onMounted(() => {
  if (!props.showParchment) {
    buttonsVisible.value = true;
  }
});
</script>
