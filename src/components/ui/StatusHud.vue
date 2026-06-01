<template>
  <div
    class="status-hud pointer-events-none flex max-w-full flex-wrap items-center rounded-md border-2 border-amber-900/80 bg-[#211207]/85 text-amber-100 shadow-lg backdrop-blur-sm"
  >
    <div class="flex items-center gap-1">
      <span class="font-bold">Rhum</span>
      <span>{{ gameState.currentRhum }}/{{ gameState.maxRhum }}</span>
    </div>
    <div class="h-4 w-px bg-amber-700/70"></div>
    <div class="flex items-center gap-1">
      <span class="font-bold">Carte</span>
      <span>{{ gameState.usedTreasureThisTurn ? 'jouee' : 'dispo' }}</span>
    </div>
    <div class="h-4 w-px bg-amber-700/70"></div>
    <div class="flex items-center gap-1">
      <span class="font-bold">Main</span>
      <span>{{ gameState.crewHand.length }}</span>
    </div>
    <div class="h-4 w-px bg-amber-700/70"></div>
    <div class="flex items-center gap-1">
      <span class="font-bold">Cacahuetes</span>
      <span>{{ gameState.peanutTokens }}</span>
    </div>
    <div class="h-4 w-px bg-amber-700/70"></div>
    <div class="flex items-center gap-1">
      <span class="font-bold">Equip.</span>
      <span>{{ equipmentLabel }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { gameState } from '../../utils/gameStore';

const equipmentLabel = computed(() => {
  const equipped = [];

  if (gameState.bottleTokenEquipped) {
    equipped.push('bouteille');
  }

  if (gameState.cannonTokenEquipped) {
    equipped.push('canon');
  }

  return equipped.length > 0 ? equipped.join(' + ') : 'aucun';
});
</script>

<style scoped>
.status-hud {
  gap: clamp(0.25rem, 1vmin, 0.5rem);
  padding: clamp(0.16rem, 0.55vmin, 0.25rem) clamp(0.35rem, 1vmin, 0.5rem);
  font-size: clamp(0.62rem, 1.45vmin, 0.82rem);
}
</style>
