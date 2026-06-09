<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import Canvas from './components/canvas.vue';
import Landing from './components/landing.vue';
import SettingsOverlay from './components/settingsOverlay.vue';
import GameMenuOverlay from './components/gameMenuOverlay.vue';
import FullMessageButtonScreen from './components/screens/FullMessageButtonScreen.vue';
import TutorialParchmentScreen from './components/screens/TutorialParchmentScreen.vue';
import DifficultySetupScreen from './components/screens/DifficultySetupScreen.vue';
import CardConfirmScreen from './components/screens/CardConfirmScreen.vue';
import LookingAroundTimerScreen from './components/screens/LookingAroundTimerScreen.vue';
import TopMessageLowerButtonScreen from './components/screens/TopMessageLowerButtonScreen.vue';
import TopMessageLowerButtonCardsScreen from './components/screens/TopMessageLowerButtonCardsScreen.vue';
import TopMessageLowerButtonDiceScreen from './components/screens/TopMessageLowerButtonDiceScreen.vue';
import HelpCrewScreen from './components/screens/HelpCrewScreen.vue';
import CaptainCelebrationScreen from './components/screens/CaptainCelebrationScreen.vue';
import CorsairDefeatTransitionScreen from './components/screens/CorsairDefeatTransitionScreen.vue';
import { initGame } from './main';
import { hasSavedGameProgress, saveGameProgress } from './utils/gameProgress';
import { preloadManager } from './utils/preloadManager';
import {
  clearScreen,
  currentScreen,
  currentScreenProgress,
  resolveScreen,
  type ScreenChrome as ScreenChromeState,
} from './utils/uiFlowStore';
import FullscreenButton from './components/fullscreenButton.vue';
import ScreenGrid from './components/ui/ScreenGrid.vue';
import ScreenChrome from './components/ui/ScreenChrome.vue';
import {
  clearRequestedTreasureCardSelection,
  requestTreasureCardSelection,
} from './utils/treasureCardSelection';
import { gameState } from './utils/gameStore';
import { initAudio, playSound, startBackgroundMusic } from './utils/soundManager';
import { gameText } from './content/gameText';
import DebugControls from './components/debugControls.vue';

const isDev = import.meta.env.DEV;
const started = ref(false);
const startedDelayed = ref(false);
const landingRef = ref<InstanceType<typeof Landing> | null>(null);
const UIShown = ref(true);
const canResume = ref(hasSavedGameProgress());
const handOverlayRequestKey = ref(0);
const settingsOpen = ref(false);
const gameMenuOpen = ref(false);

onMounted(() => {
  initAudio();
  startBackgroundMusic();
  void preloadManager.preloadAll();
});

const screenComponentMap = {
  'difficulty-setup': DifficultySetupScreen,
  'card-confirm': CardConfirmScreen,
  'full-message-button': FullMessageButtonScreen,
  tutorial: TutorialParchmentScreen,
  'looking-around-timer': LookingAroundTimerScreen,
  'top-message-lower-button': TopMessageLowerButtonScreen,
  'top-message-lower-button-cards': TopMessageLowerButtonCardsScreen,
  'top-message-lower-button-dice': TopMessageLowerButtonDiceScreen,
  'help-crew': HelpCrewScreen,
  'captain-celebration': CaptainCelebrationScreen,
  'corsair-defeat-transition': CorsairDefeatTransitionScreen,
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
  delete screenProps.openHandOnPrimary;
  delete screenProps.openHandOnSecondary;

  return screenProps;
}

function requestChromeHandOverlay() {
  handOverlayRequestKey.value += 1;
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
          : screen.props.openHandOnPrimary
            ? requestChromeHandOverlay
            : () => resolveScreen({ action: 'primary' }),
        onSecondaryButtonClick: screen.props.secondaryButtonOnClick
          ? screen.props.secondaryButtonOnClick
          : screen.props.openHandOnSecondary
            ? requestChromeHandOverlay
            : () => resolveScreen({ action: 'secondary' }),
        onUndoClick: () => resolveScreen({ action: 'undo' }),
      };

    case 'tutorial':
      return {
        ...withoutChrome(screen.props),
        sideChromeLayout: usesSideChromeLayout.value,
        title: screen.content.title,
        body: screen.content.body,
        caption: screen.content.caption,
        items: screen.content.items ?? [],
        onPrimaryButtonClick: screen.props.primaryButtonOnClick
          ? screen.props.primaryButtonOnClick
          : () => resolveScreen({ action: 'primary' }),
        onSecondaryButtonClick: screen.props.secondaryButtonOnClick
          ? screen.props.secondaryButtonOnClick
          : () => resolveScreen({ action: 'secondary' }),
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
          : screen.props.openHandOnPrimary
            ? requestChromeHandOverlay
            : () => resolveScreen({ action: 'primary' }),
        onSecondaryButtonClick: screen.props.secondaryButtonOnClick
          ? screen.props.secondaryButtonOnClick
          : screen.props.openHandOnSecondary
            ? requestChromeHandOverlay
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
          : screen.props.openHandOnPrimary
            ? requestChromeHandOverlay
            : () => resolveScreen({ action: 'primary' }),
        onSecondaryButtonClick: screen.props.secondaryButtonOnClick
          ? screen.props.secondaryButtonOnClick
          : screen.props.openHandOnSecondary
            ? requestChromeHandOverlay
            : () => resolveScreen({ action: 'secondary' }),
        onUndoClick: () => resolveScreen({ action: 'undo' }),
      };

    case 'top-message-lower-button-dice':
      return {
        ...withoutChrome(screen.props),
        sideChromeLayout: usesSideChromeLayout.value,
        onPrimaryButtonClick: screen.props.primaryButtonOnClick
          ? screen.props.primaryButtonOnClick
          : screen.props.openHandOnPrimary
            ? requestChromeHandOverlay
            : () => resolveScreen({ action: 'primary' }),
        onSecondaryButtonClick: screen.props.secondaryButtonOnClick
          ? screen.props.secondaryButtonOnClick
          : screen.props.openHandOnSecondary
            ? requestChromeHandOverlay
            : () => resolveScreen({ action: 'secondary' }),
        onUndoClick: () => resolveScreen({ action: 'undo' }),
      };

    case 'help-crew':
      return {
        ...withoutChrome(screen.props),
        sideChromeLayout: usesSideChromeLayout.value,
        onPrimaryButtonClick: screen.props.primaryButtonOnClick
          ? screen.props.primaryButtonOnClick
          : screen.props.openHandOnPrimary
            ? requestChromeHandOverlay
            : () => resolveScreen({ action: 'primary' }),
      };

    case 'captain-celebration':
      return {
        ...withoutChrome(screen.props),
        sideChromeLayout: usesSideChromeLayout.value,
        onPrimaryButtonClick: screen.props.primaryButtonOnClick
          ? screen.props.primaryButtonOnClick
          : screen.props.openHandOnPrimary
            ? requestChromeHandOverlay
            : () => resolveScreen({ action: 'primary' }),
      };

    case 'corsair-defeat-transition':
      return {
        ...withoutChrome(screen.props),
        sideChromeLayout: usesSideChromeLayout.value,
        onComplete: screen.props.onComplete
          ? screen.props.onComplete
          : () => resolveScreen({ action: 'timer-complete' }),
      };
  }

  return null;
});

function runAfterLandingExit(callback: () => void) {
  if (!landingRef.value) {
    callback();
    return;
  }

  landingRef.value.exit(callback);
}

function startGame() {
  runAfterLandingExit(() => {
    playSound('pirateIntro');
    startBackgroundMusic();
    started.value = true;
    settingsOpen.value = false;
    gameMenuOpen.value = false;
    canResume.value = false;

    void initGame();
  });
}

function startDemoGame() {
  runAfterLandingExit(() => {
    playSound('pirateIntro');
    startBackgroundMusic();
    started.value = true;
    settingsOpen.value = false;
    gameMenuOpen.value = false;
    canResume.value = false;

    void initGame({ demo: true });
  });
}

function resumeGame() {
  runAfterLandingExit(() => {
    startBackgroundMusic();
    started.value = true;
    settingsOpen.value = false;
    gameMenuOpen.value = false;

    void initGame({ resume: true });
  });
}

watch(started, (value) => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        startedDelayed.value = value;
      });
    });
  });
});

function openSettings() {
  settingsOpen.value = true;
}

function closeSettings() {
  playSound('uiClick');
  settingsOpen.value = false;
}

function openGameMenu() {
  playSound('uiClick');
  gameMenuOpen.value = true;
}

function toggleDebugMode() {
  playSound('uiClick');
  gameState.debugMode = !gameState.debugMode;
}

function closeGameMenu() {
  playSound('uiClick');
  gameMenuOpen.value = false;
}

function openGameSettings() {
  gameMenuOpen.value = false;
  settingsOpen.value = true;
}

function saveGameAndReturnHome() {
  if (currentScreenProgress.value) {
    saveGameProgress(currentScreenProgress.value.checkpoint, currentScreenProgress.value.data);
  }

  clearScreen();

  gameMenuOpen.value = false;
  settingsOpen.value = false;
  UIShown.value = true;
  started.value = false;
  gameState.debugMode = false;
  gameState.gameStarted = false;
  canResume.value = hasSavedGameProgress();
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
    <Canvas />

    <div class="portrait-rotation-screen" aria-live="polite">
      <div class="portrait-rotation-icon" aria-hidden="true">
        <span class="portrait-rotation-phone"></span>
        <span class="portrait-rotation-arrow">↻</span>
      </div>
      <p class="portrait-rotation-title font-title">{{ gameText.ui.orientationTitle }}</p>
      <p class="portrait-rotation-body">{{ gameText.ui.orientationBody }}</p>
    </div>

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
          :hand-open-request-key="handOverlayRequestKey"
          @use-card="handleChromeCardUse"
        />
      </div>

      <div
        class="resource-stable pointer-events-auto col-span-2 col-start-7 row-start-1 row-span-1 z-40 flex flex-row h-full items-start justify-end gap-2 self-start"
      >
        <button
          v-if="started && isDev"
          class="top-menu-button top-menu-button--debug"
          type="button"
          :aria-pressed="gameState.debugMode"
          aria-label="Debug controls"
          @click="toggleDebugMode"
        >
          D
        </button>
        <button
          v-if="started"
          class="top-menu-button"
          type="button"
          :aria-label="gameText.ui.menuButtonLabel"
          @click="openGameMenu"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7H20" />
            <path d="M4 12H20" />
            <path d="M4 17H20" />
          </svg>
        </button>
        <FullscreenButton />
      </div>

      <Landing
        ref="landingRef"
        v-if="!startedDelayed"
        :show-resume="canResume"
        @demo="startDemoGame"
        @resume="resumeGame"
        @settings="openSettings"
        @start="startGame"
      />

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
            <div
              v-if="currentScreen.content.stats?.length"
              class="screen-message-stats"
              :style="{ '--stats-count': currentScreen.content.stats.length }"
            >
              <p
                v-for="stat in currentScreen.content.stats"
                :key="`label-${stat.label}`"
                class="screen-message-stat-label"
              >
                {{ stat.label }}
              </p>
              <p
                v-for="stat in currentScreen.content.stats"
                :key="`value-${stat.label}`"
                class="screen-message-stat-value"
              >
                {{ stat.value }}
              </p>
            </div>
            <p v-if="currentScreen.content.caption" class="screen-message-caption">
              {{ currentScreen.content.caption }}
            </p>
            <p v-if="currentScreen.content.footer" class="screen-message-footer">
              {{ currentScreen.content.footer }}
            </p>
          </div>
        </template>
      </component>

      <DebugControls v-if="started && gameState.debugMode && isDev" />
      <div
        class="w-[5vh] h-[5vh] bg-black absolute z-10 -translate-x-1/2 -translate-y-1/2 rotate-45"
      ></div>
      <div
        class="w-[5vh] h-[5vh] bg-black absolute z-10 -translate-x-1/2 translate-y-1/2 rotate-45 bottom-0"
      ></div>
      <div
        class="w-[5vh] h-[5vh] bg-black absolute z-10 translate-x-1/2 translate-y-1/2 rotate-45 bottom-0 right-0"
      ></div>
      <div
        class="w-[5vh] h-[5vh] bg-black absolute z-10 translate-x-1/2 -translate-y-1/2 rotate-45 right-0"
      ></div>
    </ScreenGrid>

    <GameMenuOverlay
      v-if="started && gameMenuOpen"
      @close="closeGameMenu"
      @open-settings="openGameSettings"
      @save-and-quit="saveGameAndReturnHome"
    />

    <SettingsOverlay v-if="settingsOpen" @close="closeSettings" />
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
  text-align: center;
  background-color: #61220e;
  color: transparent;
  text-shadow: 1px 1px 1px rgba(255, 255, 255, 0.2);
  -webkit-background-clip: text;
  -moz-background-clip: text;
  background-clip: text;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

.screen-message-title {
  max-width: min(100%, 64rem);
  font-size: var(--ui-message-title-size);
  line-height: 1.05;
  /*color: #472422;*/
  overflow-wrap: anywhere;
  /*filter: drop-shadow(0 4px 4px rgba(0, 0, 0, 0.25));*/
  background-color: #371412;
  color: transparent;
  text-shadow: 1px 1px 1px rgba(255, 255, 255, 0.2);
  filter: saturate(1.5);
  -webkit-background-clip: text;
  -moz-background-clip: text;
  background-clip: text;
  padding-top: 0.5rem;
  padding-bottom: 0.25rem;
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

.screen-message-stats {
  --stats-count: 2;
  display: grid;
  width: min(100%, 42rem);
  grid-template-columns: repeat(var(--stats-count), minmax(0, 1fr));
  gap: 0.35rem 1.25rem;
  align-items: end;
  margin-block: 0.35rem;
}

.screen-message-stat-label {
  min-width: 0;
  font-size: clamp(1.1rem, 1.8vw, 2rem);
  line-height: 1;
  overflow-wrap: anywhere;
  text-wrap: balance;
}

.screen-message-stat-value {
  min-width: 0;
  font-size: clamp(1.9rem, 4vw, 4.5rem);
  font-weight: 900;
  line-height: 1.05;
  overflow-wrap: anywhere;
  text-wrap: balance;
}

.portrait-rotation-screen {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
  background: #120c08;
  color: #f7ddb1;
  text-align: center;
}

.portrait-rotation-icon {
  position: relative;
  width: 5.5rem;
  height: 5.5rem;
}

.portrait-rotation-phone {
  position: absolute;
  inset: 0.7rem 1.75rem;
  border: 0.22rem solid currentColor;
  border-radius: 0.55rem;
  box-shadow: 0 0 0 0.16rem rgba(55, 20, 18, 0.45);
  transform: rotate(-22deg);
}

.portrait-rotation-phone::after {
  position: absolute;
  bottom: 0.28rem;
  left: 50%;
  width: 0.35rem;
  height: 0.35rem;
  border-radius: 999px;
  background: currentColor;
  content: '';
  transform: translateX(-50%);
}

.portrait-rotation-arrow {
  position: absolute;
  right: -0.1rem;
  bottom: -0.35rem;
  font-size: 2.7rem;
  font-weight: 900;
  line-height: 1;
}

.portrait-rotation-title {
  max-width: 18rem;
  font-size: clamp(2.4rem, 12vw, 4.8rem);
  line-height: 1.05;
  color: #f7ddb1;
}

.portrait-rotation-body {
  max-width: 18rem;
  font-size: clamp(1rem, 4.8vw, 1.45rem);
  line-height: 1.15;
  color: #e7c28d;
}

@media (orientation: portrait) {
  .portrait-rotation-screen {
    display: flex;
  }
}

.top-menu-button {
  display: flex;
  aspect-ratio: 1;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 999px;
  background: #472422;
  padding: 0.5rem;
  color: #fff;
  cursor: pointer;
  transition:
    background-color 120ms ease,
    opacity 120ms ease;
}

.top-menu-button:hover {
  background: rgba(15, 23, 42, 0.75);
}

.top-menu-button svg {
  width: 1.125rem;
  height: 1.125rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-width: 2.4;
}

.top-menu-button--debug {
  font-size: 0.82rem;
  font-weight: 900;
  line-height: 1;
}
</style>
