<script setup lang="ts">
import { computed, ref } from 'vue';
import Canvas from './components/canvas.vue';
import Landing from './components/landing.vue';
import FullMessageButtonScreen from './components/screens/FullMessageButtonScreen.vue';
import LookingAroundTimerScreen from './components/screens/LookingAroundTimerScreen.vue';
import TopMessageLowerButtonScreen from './components/screens/TopMessageLowerButtonScreen.vue';
import TopMessageLowerButtonCardsScreen from './components/screens/TopMessageLowerButtonCardsScreen.vue';
import TopMessageLowerButtonDiceScreen from './components/screens/TopMessageLowerButtonDiceScreen.vue';
import { initGame } from './main';
import { hasSavedGameProgress } from './utils/gameProgress';
import { currentScreen, resolveScreen } from './utils/uiFlowStore';
import FullscreenButton from './components/fullscreenButton.vue';

const started = ref(false);
const UIShown = ref(true);
const canResume = ref(hasSavedGameProgress());

const screenComponentMap = {
  'full-message-button': FullMessageButtonScreen,
  'looking-around-timer': LookingAroundTimerScreen,
  'top-message-lower-button': TopMessageLowerButtonScreen,
  'top-message-lower-button-cards': TopMessageLowerButtonCardsScreen,
  'top-message-lower-button-dice': TopMessageLowerButtonDiceScreen,
} as const;

const activeScreenComponent = computed(() => {
  if (!currentScreen.value) {
    return null;
  }

  return screenComponentMap[currentScreen.value.type];
});

const activeScreenProps = computed<Record<string, unknown> | null>(() => {
  const screen = currentScreen.value;

  if (!screen) {
    return null;
  }

  switch (screen.type) {
    case 'full-message-button':
      return {
        ...screen.props,
        onPrimaryButtonClick: screen.props.primaryButtonOnClick
          ? screen.props.primaryButtonOnClick
          : () => resolveScreen({ action: 'primary' }),
        onSecondaryButtonClick: screen.props.secondaryButtonOnClick
          ? screen.props.secondaryButtonOnClick
          : () => resolveScreen({ action: 'secondary' }),
        onUndoClick: () => resolveScreen({ action: 'undo' }),
      };

    case 'looking-around-timer':
      return {
        ...screen.props,
        onComplete: screen.props.onComplete
          ? screen.props.onComplete
          : () => resolveScreen({ action: 'timer-complete' }),
      };

    case 'top-message-lower-button':
      return {
        ...screen.props,
        onPrimaryButtonClick: screen.props.primaryButtonOnClick
          ? screen.props.primaryButtonOnClick
          : () => resolveScreen({ action: 'primary' }),
        onSecondaryButtonClick: screen.props.secondaryButtonOnClick
          ? screen.props.secondaryButtonOnClick
          : () => resolveScreen({ action: 'secondary' }),
        onUndoClick: () => resolveScreen({ action: 'undo' }),
      };

    case 'top-message-lower-button-cards':
      return {
        ...screen.props,
        cards: screen.props.cards.map((card) => ({
          ...card,
          onSelect: () => resolveScreen({ action: 'card', cardId: card.id }),
        })),
        onPrimaryButtonClick: screen.props.primaryButtonOnClick
          ? screen.props.primaryButtonOnClick
          : () => resolveScreen({ action: 'primary' }),
        onSecondaryButtonClick: screen.props.secondaryButtonOnClick
          ? screen.props.secondaryButtonOnClick
          : () => resolveScreen({ action: 'secondary' }),
        onUndoClick: () => resolveScreen({ action: 'undo' }),
      };

    case 'top-message-lower-button-dice':
      return {
        ...screen.props,
        onPrimaryButtonClick: screen.props.primaryButtonOnClick
          ? screen.props.primaryButtonOnClick
          : () => resolveScreen({ action: 'primary' }),
        onSecondaryButtonClick: screen.props.secondaryButtonOnClick
          ? screen.props.secondaryButtonOnClick
          : () => resolveScreen({ action: 'secondary' }),
        onUndoClick: () => resolveScreen({ action: 'undo' }),
      };
  }

  return null;
});

function startGame() {
  started.value = true;

  initGame();
}

function resumeGame() {
  started.value = true;

  initGame({ resume: true });
}

function toggleUI() {
  UIShown.value = !UIShown.value;
}
</script>

<template>
  <Landing v-if="!started" :show-resume="canResume" @resume="resumeGame" @start="startGame" />
  <div v-else class="relative h-full w-full">
    <Canvas />
    <div class="absolute top-4 right-4 flex flex-row gap-2 z-20">
      <button
        class="bg-amber-700 min-w-30 p-1 px-2 text-amber-100 font-black border-3 border-amber-900"
        @click="toggleUI"
      >
        {{ UIShown ? 'Hide UI' : 'Show UI' }}
      </button>
      <FullscreenButton />
    </div>
    <component
      :is="activeScreenComponent"
      v-if="activeScreenComponent && activeScreenProps && currentScreen && UIShown"
      :key="currentScreen.instanceId"
      v-bind="activeScreenProps"
    >
      <template #message v-if="currentScreen.content">
        <div class="flex h-full w-full flex-col items-center justify-center gap-2 text-center">
          <p v-if="currentScreen.content.title" class="text-2xl font-semibold sm:text-4xl">
            {{ currentScreen.content.title }}
          </p>
          <p v-if="currentScreen.content.body" class="text-sm sm:text-base">
            {{ currentScreen.content.body }}
          </p>
          <p v-if="currentScreen.content.caption" class="text-xs sm:text-sm">
            {{ currentScreen.content.caption }}
          </p>
          <p v-if="currentScreen.content.footer" class="text-xs sm:text-sm">
            {{ currentScreen.content.footer }}
          </p>
        </div>
      </template>
    </component>
  </div>
</template>
