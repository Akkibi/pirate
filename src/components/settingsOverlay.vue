<template>
  <div
    class="settings-overlay pointer-events-auto fixed inset-0 z-50"
    role="dialog"
    aria-modal="true"
  >
    <button
      class="settings-overlay__scrim"
      type="button"
      :aria-label="gameText.settings.closeLabel"
      @click="emit('close')"
    ></button>

    <div class="settings-overlay__panel">
      <Parchment size="md" surface-class="h-full" content-class="settings-overlay__content">
        <div class="settings-overlay__inner">
          <h2 class="settings-overlay__title font-title">{{ gameText.settings.title }}</h2>

          <div class="settings-overlay__controls">
            <label class="settings-overlay__check-row">
              <input
                class="settings-overlay__checkbox"
                type="checkbox"
                :checked="appSettings.musicEnabled"
                @change="handleMusicChange"
              />
              <span>{{ gameText.settings.music }}</span>
            </label>

            <label class="settings-overlay__check-row">
              <input
                class="settings-overlay__checkbox"
                type="checkbox"
                :checked="appSettings.soundEffectsEnabled"
                @change="handleSoundEffectsChange"
              />
              <span>{{ gameText.settings.soundEffects }}</span>
            </label>

            <label class="settings-overlay__select-row">
              <span>{{ gameText.settings.language }}</span>
              <select
                class="settings-overlay__select"
                :value="appSettings.language"
                @change="handleLanguageChange"
              >
                <option value="fr">{{ gameText.settings.french }}</option>
                <option value="en">{{ gameText.settings.english }}</option>
              </select>
            </label>

            <GameButton :label="gameText.settings.closeLabel" :on-click="() => emit('close')" />
          </div>
        </div>
      </Parchment>
    </div>
  </div>
</template>

<script setup lang="ts">
import Parchment from './parchment.vue';
import { gameText } from '../content/gameText';
import {
  appSettings,
  setAppLanguage,
  setMusicEnabled,
  setSoundEffectsEnabled,
  type LanguageCode,
} from '../utils/appSettings';
import {
  playSound,
  startBackgroundMusic,
  stopBackgroundMusic,
  stopSoundEffects,
} from '../utils/soundManager';
import GameButton from './ui/GameButton.vue';

const emit = defineEmits<{
  close: [];
}>();

function getEventTarget(event: unknown): Record<string, unknown> | null {
  if (!event || typeof event !== 'object' || !('target' in event)) {
    return null;
  }

  const target = (event as { target?: unknown }).target;

  return target && typeof target === 'object' ? (target as Record<string, unknown>) : null;
}

function isChecked(event: unknown): boolean {
  return Boolean(getEventTarget(event)?.checked);
}

function handleMusicChange(event: unknown): void {
  const enabled = isChecked(event);

  setMusicEnabled(enabled);

  if (enabled) {
    startBackgroundMusic();
  } else {
    stopBackgroundMusic();
  }
}

function handleSoundEffectsChange(event: unknown): void {
  const enabled = isChecked(event);

  setSoundEffectsEnabled(enabled);

  if (enabled) {
    playSound('uiClick');
  } else {
    stopSoundEffects();
  }
}

function handleLanguageChange(event: unknown): void {
  const language = getEventTarget(event)?.value;

  if (language !== 'fr' && language !== 'en') {
    return;
  }

  setAppLanguage(language as LanguageCode);
  playSound('uiClick');
}
</script>

<style scoped>
.settings-overlay {
  --settings-title-color: #371412;
  --settings-body-color: #61220e;
  --settings-button-color: #472422;

  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(0.75rem, 3vmin, 1.5rem);
}

.settings-overlay__scrim {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(10, 7, 5, 0.68);
}

.settings-overlay__panel {
  position: relative;
  width: min(88vw, 42rem);
  height: min(78vh, 30rem);
  min-height: 18rem;
}

.settings-overlay__inner {
  position: relative;
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  justify-content: center;
  gap: clamp(0.75rem, 2.4vmin, 1.35rem);
  padding: clamp(1.4rem, 4vmin, 2.4rem) clamp(2rem, 5vmin, 3.2rem);
  color: var(--settings-body-color);
}

.settings-overlay__close {
  position: absolute;
  top: clamp(0.45rem, 1.6vmin, 0.8rem);
  right: clamp(1.4rem, 4vmin, 2.4rem);
  display: flex;
  width: clamp(2rem, 7vmin, 2.8rem);
  height: clamp(2rem, 7vmin, 2.8rem);
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: var(--settings-title-color);
}

.settings-overlay__close svg {
  width: 62%;
  height: 62%;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-width: 2.6;
}

.settings-overlay__title {
  margin: 0;
  padding-inline: clamp(2rem, 8vmin, 4.5rem);
  text-align: center;
  font-size: clamp(2.1rem, 9vmin, 4.4rem);
  line-height: 1;
  background-color: var(--settings-title-color);
  color: transparent;
  text-shadow: 1px 1px 1px rgba(255, 255, 255, 0.2);
  filter: saturate(1.5);
  -webkit-background-clip: text;
  background-clip: text;
}

.settings-overlay__controls {
  display: grid;
  gap: clamp(0.55rem, 1.8vmin, 0.9rem);
  font-size: clamp(1rem, 3.2vmin, 1.45rem);
  line-height: 1.05;
}

.settings-overlay__check-row,
.settings-overlay__select-row {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: clamp(0.8rem, 3vmin, 1.5rem);
  border: 0;
  background: transparent;
  padding: clamp(0.55rem, 1.8vmin, 0.8rem) clamp(0.7rem, 2.5vmin, 1rem);
  box-shadow: none;
}

.settings-overlay__checkbox {
  width: clamp(1.25rem, 4vmin, 1.7rem);
  height: clamp(1.25rem, 4vmin, 1.7rem);
  flex: 0 0 auto;
  accent-color: var(--settings-button-color);
}

.settings-overlay__select {
  min-width: min(42vw, 11rem);
  border: 0;
  background: transparent;
  padding: 0.35rem 0.55rem;
  color: var(--settings-title-color);
  font: inherit;
}

@media (orientation: landscape) and (max-height: 430px) {
  .settings-overlay__panel {
    height: min(88vh, 22rem);
  }

  .settings-overlay__inner {
    gap: 0.45rem;
    padding-block: 2rem;
  }

  .settings-overlay__title {
    font-size: clamp(1.7rem, 8vmin, 3.2rem);
  }
}
</style>
