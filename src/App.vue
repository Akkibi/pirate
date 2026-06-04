<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import Canvas from './components/canvas.vue';
import Landing from './components/landing.vue';
import FullMessageButtonScreen from './components/screens/FullMessageButtonScreen.vue';
import DifficultySetupScreen from './components/screens/DifficultySetupScreen.vue';
import CardConfirmScreen from './components/screens/CardConfirmScreen.vue';
import LookingAroundTimerScreen from './components/screens/LookingAroundTimerScreen.vue';
import TopMessageLowerButtonScreen from './components/screens/TopMessageLowerButtonScreen.vue';
import TopMessageLowerButtonCardsScreen from './components/screens/TopMessageLowerButtonCardsScreen.vue';
import TopMessageLowerButtonDiceScreen from './components/screens/TopMessageLowerButtonDiceScreen.vue';
import { initGame } from './main';
import { hasSavedGameProgress } from './utils/gameProgress';
import { modelLoader } from './three/modelLoader';
import {
  currentScreen,
  resolveScreen,
  type ScreenChrome as ScreenChromeState,
} from './utils/uiFlowStore';
import FullscreenButton from './components/fullscreenButton.vue';
import DebugControls from './components/debugControls.vue';
import ScreenGrid from './components/ui/ScreenGrid.vue';
import ScreenChrome from './components/ui/ScreenChrome.vue';
import {
  clearRequestedTreasureCardSelection,
  requestTreasureCardSelection,
} from './utils/treasureCardSelection';
import { playSound, startBackgroundMusic } from './utils/soundManager';
import Silk from './components/Silk.vue';

const started = ref(false);
const UIShown = ref(true);
const canResume = ref(hasSavedGameProgress());

onMounted(() => {
  startBackgroundMusic();
  void modelLoader.preloadAll();
});

const screenComponentMap = {
  'difficulty-setup': DifficultySetupScreen,
  'card-confirm': CardConfirmScreen,
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

const activeScreenChrome = computed(() => currentScreen.value?.props.chrome ?? null);
const lastActiveScreenChrome = ref<ScreenChromeState | null>(null);
const displayedScreenChrome = computed(
  () =>
    activeScreenChrome.value ?? (currentScreen.value === null ? lastActiveScreenChrome.value : null)
);
const usesSideChromeLayout = computed(() => Boolean(currentScreen.value));

watch(
  activeScreenChrome,
  (chrome) => {
    if (chrome) {
      lastActiveScreenChrome.value = chrome;
    }
  },
  { immediate: true }
);

function withoutChrome<T extends Record<string, unknown>>(props: T): Omit<T, 'chrome'> {
  const screenProps = { ...props };

  delete screenProps.chrome;

  return screenProps;
}

const activeScreenProps = computed<Record<string, unknown> | null>(() => {
  const screen = currentScreen.value;

  if (!screen) {
    return null;
  }

  switch (screen.type) {
    case 'difficulty-setup':
      return {
        ...withoutChrome(screen.props),
        sideChromeLayout: usesSideChromeLayout.value,
        title: screen.content?.title,
        body: screen.content?.body,
        onConfirm: (maxRhum: number) => resolveScreen({ action: 'difficulty', maxRhum }),
      };

    case 'card-confirm':
      return {
        ...withoutChrome(screen.props),
        sideChromeLayout: usesSideChromeLayout.value,
        title: screen.content?.title,
        body: screen.content?.body,
        onConfirm: () => resolveScreen({ action: 'primary' }),
        onCancel: () => resolveScreen({ action: 'secondary' }),
      };

    case 'full-message-button':
      return {
        ...withoutChrome(screen.props),
        sideChromeLayout: usesSideChromeLayout.value,
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
        ...withoutChrome(screen.props),
        sideChromeLayout: usesSideChromeLayout.value,
        onComplete: screen.props.onComplete
          ? screen.props.onComplete
          : () => resolveScreen({ action: 'timer-complete' }),
      };

    case 'top-message-lower-button':
      return {
        ...withoutChrome(screen.props),
        sideChromeLayout: usesSideChromeLayout.value,
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
        ...withoutChrome(screen.props),
        sideChromeLayout: usesSideChromeLayout.value,
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
        ...withoutChrome(screen.props),
        sideChromeLayout: usesSideChromeLayout.value,
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
  playSound('pirateIntro');
  startBackgroundMusic();
  started.value = true;

  initGame();
}

function resumeGame() {
  startBackgroundMusic();
  started.value = true;

  initGame({ resume: true });
}

function toggleUI() {
  playSound('uiClick');
  UIShown.value = !UIShown.value;
}

function handleChromeCardUse(cardInstanceId: string | number) {
  const screen = currentScreen.value;

  if (!screen?.props.chrome?.canUseCards) {
    return;
  }

  requestTreasureCardSelection(cardInstanceId);

  if (screen.type === 'top-message-lower-button-dice') {
    resolveScreen({ action: 'secondary' });
    return;
  }

  if (screen.type === 'top-message-lower-button') {
    resolveScreen({ action: 'primary' });
    return;
  }

  if (screen.type === 'top-message-lower-button-cards') {
    resolveScreen({ action: 'card', cardId: cardInstanceId });
    return;
  }

  clearRequestedTreasureCardSelection();
}
</script>

<template>
  <div class="relative h-full w-full overflow-hidden bg-[#120c08]">
    <template v-if="!started">
      <div class="absolute inset-0">
        <Silk />

        <!-- <div
          class="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,10,7,0.25)_0%,rgba(17,10,7,0.55)_45%,rgba(17,10,7,0.92)_100%)]"
        ></div> -->
        <!-- <div
          class="absolute -top-2 -left-2 w-30 h-30 bg-[url('/images/screen-border.webp')] bg-cover bg-center"
        ></div>
        <div
          class="absolute -top-2 rotate-90 -right-2 w-30 h-30 bg-[url('/images/screen-border.webp')] bg-cover bg-center"
        ></div>

        <div
          class="absolute -bottom-2 -rotate-90 -left-2 w-30 h-30 bg-[url('/images/screen-border.webp')] bg-cover bg-center"
        ></div>
        <div
          class="absolute -bottom-2 rotate-180 -right-2 w-30 h-30 bg-[url('/images/screen-border.webp')] bg-cover bg-center"
        ></div> -->
        <!-- <div
          class="absolute inset-0 bg-[url('/images/boundstexture.webp')] bg-center bg-cover mix-blend-multiply"
        ></div> -->
      </div>
    </template>

    <Canvas v-else />

    <ScreenGrid overlay class="z-20">
      <div
        v-if="started && UIShown && displayedScreenChrome"
        class="resource-stable screen-chrome-layer col-span-full col-start-1 row-span-full row-start-1 z-30"
      >
        <ScreenChrome
          :phase="displayedScreenChrome.phase"
          :show-rhum="displayedScreenChrome.showRhum"
          :show-peanuts="displayedScreenChrome.showPeanuts"
          :can-use-cards="displayedScreenChrome.canUseCards"
          @use-card="handleChromeCardUse"
        />
      </div>

      <div
        class="resource-stable pointer-events-auto col-span-2 col-start-7 row-start-1 row-span-1 z-40 flex flex-row h-full items-start justify-end gap-2 self-start"
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
        <!-- This template is replacing the <slot/> component in the Parchment in every ScreenComponent -->
        <template #message v-if="currentScreen.content">
          <div class="screen-message">
            <p v-if="currentScreen.content.title" class="screen-message-title font-title">
              {{ currentScreen.content.title }}
            </p>
            <p v-if="currentScreen.content.body" class="screen-message-body">
              {{ currentScreen.content.body }}
            </p>
            <p v-if="currentScreen.content.caption" class="screen-message-caption">
              {{ currentScreen.content.caption }}
            </p>
            <p v-if="currentScreen.content.footer" class="screen-message-footer">
              {{ currentScreen.content.footer }}
            </p>
          </div>
        </template>
      </component>

      <DebugControls v-if="started && !UIShown" />
    </ScreenGrid>
  </div>
</template>

<style scoped>
.screen-message {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--ui-message-gap);
  overflow: hidden;
  color: #71320e;
  text-align: center;
}

.screen-message-title {
  max-width: min(100%, 64rem);
  font-size: var(--ui-message-title-size);
  line-height: 0.88;
  overflow-wrap: anywhere;
  filter: drop-shadow(0 4px 4px rgba(0, 0, 0, 0.25));
}

.screen-message-body {
  width: min(100%, 52rem);
  min-width: 0;
  font-size: var(--ui-message-body-size);
  line-height: 1.22;
  white-space: normal;
  overflow-wrap: anywhere;
  hyphens: auto;
  text-wrap: pretty;
}

.screen-message-caption,
.screen-message-footer {
  width: min(100%, 48rem);
  min-width: 0;
  font-size: var(--ui-message-caption-size);
  line-height: 1.18;
  white-space: normal;
  overflow-wrap: anywhere;
  hyphens: auto;
  text-wrap: pretty;
}
</style>
