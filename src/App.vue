<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import Canvas from './components/canvas.vue';
import Landing from './components/landing.vue';
import FullMessageButtonScreen from './components/screens/FullMessageButtonScreen.vue';
import LookingAroundTimerScreen from './components/screens/LookingAroundTimerScreen.vue';
import TopMessageLowerButtonScreen from './components/screens/TopMessageLowerButtonScreen.vue';
import TopMessageLowerButtonCardsScreen from './components/screens/TopMessageLowerButtonCardsScreen.vue';
import TopMessageLowerButtonDiceScreen from './components/screens/TopMessageLowerButtonDiceScreen.vue';
import { initGame } from './main';
import { hasSavedGameProgress } from './utils/gameProgress';
import { modelLoader } from './three/modelLoader';
import { currentScreen, resolveScreen } from './utils/uiFlowStore';
import FullscreenButton from './components/fullscreenButton.vue';
import DebugControls from './components/debugControls.vue';
import ScreenGrid from './components/ui/ScreenGrid.vue';

const started = ref(false);
const UIShown = ref(true);
const canResume = ref(hasSavedGameProgress());

onMounted(() => {
  void modelLoader.preloadAll();
});

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
  <div class="relative h-full w-full overflow-hidden bg-[#120c08]">
    <template v-if="!started">
      <div class="absolute inset-0">
        <img class="h-full w-full object-cover opacity-70" src="/images/bg.png" alt="background" />
        <div
          class="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,10,7,0.25)_0%,rgba(17,10,7,0.55)_45%,rgba(17,10,7,0.92)_100%)]"
        ></div>
        <div
          class="absolute -top-2 -left-2 w-30 h-30 bg-[url('images/screen-border.png')] bg-cover bg-center"
        ></div>
        <div
          class="absolute -top-2 rotate-90 -right-2 w-30 h-30 bg-[url('images/screen-border.png')] bg-cover bg-center"
        ></div>

        <div
          class="absolute -bottom-2 -rotate-90 -left-2 w-30 h-30 bg-[url('images/screen-border.png')] bg-cover bg-center"
        ></div>
        <div
          class="absolute -bottom-2 rotate-180 -right-2 w-30 h-30 bg-[url('images/screen-border.png')] bg-cover bg-center"
        ></div>
        <div
          class="absolute inset-0 bg-[url('images/boundstexture.png')] bg-center bg-cover mix-blend-multiply"
        ></div>
      </div>
    </template>

    <Canvas v-else />

    <ScreenGrid overlay class="z-20">
      <div
        class="pointer-events-auto col-span-2 col-start-7 row-start-1 row-span-1 z-30 flex flex-row h-full items-start justify-end gap-2 self-start"
      >
        <button
          v-if="started"
          class="border-2 border-amber-900 bg-amber-700 px-2 py-1 font-black text-amber-100"
          @click="toggleUI"
        >
          {{ UIShown ? 'Hide UI' : 'Show UI' }}
        </button>
        <FullscreenButton />
      </div>

      <Landing v-if="!started" :show-resume="canResume" @resume="resumeGame" @start="startGame" />

      <component
        :is="activeScreenComponent"
        v-else-if="activeScreenComponent && activeScreenProps && currentScreen && UIShown"
        :key="currentScreen.instanceId"
        v-bind="activeScreenProps"
      >
        <template #message v-if="currentScreen.content">
          <div class="flex h-full w-full flex-col items-center justify-center gap-2 text-center">
            <p v-if="currentScreen.content.title" class="text-lg font-semibold sm:text-3xl">
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

      <DebugControls v-if="started && !UIShown" />
    </ScreenGrid>
  </div>
</template>
