<template>
  <div :class="gridClasses">
    <button
      v-for="(card, index) in limitedCards"
      :key="card.id ?? card.title"
      class="pointer-events-auto flex h-full flex-col overflow-hidden bg-green-600 text-left text-black"
      :style="cardStyles(index)"
      @click="handleCardClick(card)"
    >
      <div class="relative min-h-28 overflow-hidden bg-green-600">
        <img
          v-if="card.imageSrc"
          :src="card.imageSrc"
          :alt="card.imageAlt ?? card.title"
          class="h-full w-full object-cover"
        />
        <div v-else class="flex h-full w-full items-center justify-center bg-green-600 text-4xl">
          ?
        </div>
      </div>
      <div class="relative flex flex-1 flex-col justify-between gap-3 bg-green-600 px-4 py-4">
        <h3 class="text-lg">{{ card.title }}</h3>
        <p class="text-sm leading-relaxed">{{ card.caption }}</p>
      </div>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue';
import type { ChoiceCard } from '../../types/ui';

const props = withDefaults(
  defineProps<{
    cards: ChoiceCard[];
    revealed?: boolean;
  }>(),
  {
    revealed: true,
  }
);

const limitedCards = computed(() => props.cards.slice(0, 3));

const gridClasses = computed(() => [
  'pointer-events-none grid w-full gap-3',
  limitedCards.value.length <= 2 ? 'grid-cols-2' : 'grid-cols-3',
]);

function handleCardClick(card: ChoiceCard) {
  void card.onSelect?.();
}

function cardStyles(index: number): CSSProperties {
  return {
    opacity: props.revealed ? '1' : '0',
    transform: props.revealed ? 'translate3d(0, 0, 0)' : 'translate3d(0, 2rem, 0)',
    pointerEvents: props.revealed ? 'auto' : 'none',
    transitionDelay: `${index * 110}ms`,
    transitionDuration: '480ms',
    transitionProperty: 'transform, opacity',
    transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
  };
}
</script>
