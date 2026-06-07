<template>
  <div
    class="status-hud pointer-events-none flex max-w-full flex-wrap items-center rounded-md border-2 border-amber-900/80 bg-[#211207]/85 text-amber-100 shadow-lg backdrop-blur-sm"
  >
    <div class="flex items-center gap-1">
      <span class="font-bold">{{ gameText.statusHud.rhum }}</span>
      <span>{{ gameState.currentRhum }}/{{ gameState.maxRhum }}</span>
    </div>
    <div class="h-4 w-px bg-amber-700/70"></div>
    <div class="flex items-center gap-1">
      <span class="font-bold">{{ gameText.statusHud.card }}</span>
      <span>{{
        gameState.usedTreasureThisTurn
          ? gameText.statusHud.cardPlayed
          : gameText.statusHud.cardAvailable
      }}</span>
    </div>
    <div class="h-4 w-px bg-amber-700/70"></div>
    <div class="flex items-center gap-1">
      <span class="font-bold">{{ gameText.statusHud.hand }}</span>
      <span>{{ gameState.crewHand.length }}</span>
    </div>
    <div class="h-4 w-px bg-amber-700/70"></div>
    <div class="flex items-center gap-1">
      <span class="font-bold">{{ gameText.statusHud.peanuts }}</span>
      <span>{{ gameState.peanutTokens }}</span>
    </div>
    <div class="h-4 w-px bg-amber-700/70"></div>
    <div class="flex items-center gap-1">
      <span class="font-bold">{{ gameText.statusHud.equipment }}</span>
      <span>{{ equipmentLabel }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { gameState } from '../../utils/gameStore';
import { gameText } from '../../content/gameText';

const equipmentLabel = computed(() => {
  const equipped = [];

  if (gameState.bottleTokenEquipped) {
    equipped.push(gameText.statusHud.bottle);
  }

  if (gameState.cannonTokenEquipped) {
    equipped.push(gameText.statusHud.cannon);
  }

  return equipped.length > 0 ? equipped.join(' + ') : gameText.statusHud.none;
});
</script>

<style scoped>
.status-hud {
  gap: clamp(0.25rem, 1vmin, 0.5rem);
  padding: clamp(0.16rem, 0.55vmin, 0.25rem) clamp(0.35rem, 1vmin, 0.5rem);
  font-size: clamp(0.62rem, 1.45vmin, 0.82rem);
}
</style>
