<template>
  <div
    class="game-menu-overlay pointer-events-auto fixed inset-0 z-50"
    role="dialog"
    aria-modal="true"
  >
    <button
      class="game-menu-overlay__scrim"
      type="button"
      :aria-label="gameText.gameMenu.closeLabel"
      @click="emit('close')"
    ></button>

    <div class="game-menu-overlay__panel">
      <Parchment size="md" surface-class="h-full" content-class="game-menu-overlay__content">
        <div class="game-menu-overlay__inner">
          <h2 class="game-menu-overlay__title font-title">{{ gameText.gameMenu.title }}</h2>

          <div class="game-menu-overlay__actions">
            <GameButton :label="gameText.gameMenu.parameters" :on-click="openSettings" />
            <GameButton :label="gameText.gameMenu.saveAndQuit" :on-click="saveAndQuit" />
            <GameButton :label="gameText.gameMenu.closeLabel" :on-click="() => emit('close')" />
          </div>
        </div>
      </Parchment>
    </div>
  </div>
</template>

<script setup lang="ts">
import Parchment from './parchment.vue';
import GameButton from './ui/GameButton.vue';
import { gameText } from '../content/gameText';

const emit = defineEmits<{
  close: [];
  saveAndQuit: [];
  openSettings: [];
}>();

function saveAndQuit(): void {
  emit('saveAndQuit');
}

function openSettings(): void {
  emit('openSettings');
}
</script>

<style scoped>
.game-menu-overlay {
  --game-menu-title-color: #371412;
  --game-menu-body-color: #61220e;

  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(0.75rem, 3vmin, 1.5rem);
}

.game-menu-overlay__scrim {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(10, 7, 5, 0.68);
}

.game-menu-overlay__panel {
  position: relative;
  width: min(82vw, 34rem);
  height: min(64vh, 22rem);
  min-height: 15rem;
}

.game-menu-overlay__inner {
  position: relative;
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  justify-content: center;
  gap: clamp(0.8rem, 2.8vmin, 1.5rem);
  padding: clamp(1.3rem, 4vmin, 2.2rem) clamp(2rem, 5vmin, 3.2rem);
  color: var(--game-menu-body-color);
}

.game-menu-overlay__close {
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
  color: var(--game-menu-title-color);
}

.game-menu-overlay__close svg {
  width: 62%;
  height: 62%;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-width: 2.6;
}

.game-menu-overlay__title {
  margin: 0;
  padding-inline: clamp(2rem, 8vmin, 4.5rem);
  text-align: center;
  font-size: clamp(3.2rem, 12vmin, 5.6rem);
  line-height: 1.05;
  background-color: var(--game-menu-title-color);
  color: transparent;
  text-shadow: 1px 1px 1px rgba(255, 255, 255, 0.2);
  filter: saturate(1.5);
  -webkit-background-clip: text;
  background-clip: text;
}

.game-menu-overlay__actions {
  display: grid;
  grid-template-rows: repeat(2, minmax(3.2rem, 1fr));
  gap: clamp(0.55rem, 2vmin, 0.95rem);
  min-height: 7rem;
}

@media (orientation: landscape) and (max-height: 430px) {
  .game-menu-overlay__panel {
    height: min(84vh, 18rem);
  }

  .game-menu-overlay__inner {
    gap: 0.55rem;
    padding-block: 0.85rem;
  }

  .game-menu-overlay__title {
    font-size: clamp(2.75rem, 8vmin, 3.3rem);
  }

  .game-menu-overlay__actions {
    min-height: 5.5rem;
    grid-template-rows: repeat(2, minmax(2.55rem, 1fr));
  }
}
</style>
