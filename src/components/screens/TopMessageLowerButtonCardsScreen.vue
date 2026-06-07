<template>
  <TopMessageLowerButtonScreen
    :message="message"
    :show-parchment="showParchment"
    :primary-button-label="primaryButtonLabel"
    :on-primary-button-click="onPrimaryButtonClick"
    :secondary-button-label="secondaryButtonLabel"
    :on-secondary-button-click="onSecondaryButtonClick"
    :show-undo="showUndo"
    :undo-label="undoLabel"
    :on-undo-click="onUndoClick"
    :side-chrome-layout="sideChromeLayout"
    :buttons-on-last-row="buttonsOnLastRow"
  >
    <template #message>
      <slot name="message">{{ message }}</slot>
    </template>

    <template #cards="{ revealed }">
      <div class="h-full min-h-0 w-full">
        <ChoiceCards :cards="cards" :revealed="revealed" />
      </div>
    </template>

    <!-- <template #primary>
      <slot name="primary">{{ primaryButtonLabel }}</slot>
    </template>

    <template #secondary>
      <slot name="secondary">{{ secondaryButtonLabel }}</slot>
    </template> -->

    <template #undo>
      <slot name="undo">{{ undoLabel }}</slot>
    </template>
  </TopMessageLowerButtonScreen>
</template>

<script setup lang="ts">
import TopMessageLowerButtonScreen from './TopMessageLowerButtonScreen.vue';
import ChoiceCards from '../ui/ChoiceCards.vue';
import type { ButtonHandler, ChoiceCard } from '../../types/ui';

withDefaults(
  defineProps<{
    cards: ChoiceCard[];
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
    buttonsOnLastRow?: boolean;
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
    buttonsOnLastRow: false,
  }
);
</script>
