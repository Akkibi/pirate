<template>
  <div :class="gridClasses" :style="gridStyle">
    <button
      v-for="(card, index) in cards"
      :key="card.id ?? card.title"
      :class="cardClasses(card)"
      :style="cardStyles(index)"
      :disabled="card.disabled"
      @click="handleCardClick(card)"
    >
      <template v-if="card.imageSrc">
        <div class="choice-card-flipper">
          <div class="choice-card-face choice-card-back">
            <img src="/images/cards/dos.png" alt="" class="choice-card-image" />
          </div>
          <div class="choice-card-face choice-card-front">
            <img
              :src="card.imageSrc"
              :alt="card.imageAlt ?? card.title"
              class="choice-card-image"
            />
            <div v-if="card.disabledReason" class="choice-card-image-disabled">
              {{ card.disabledReason }}
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="choice-card-media relative min-h-0 overflow-hidden bg-green-600">
          <div class="flex h-full w-full items-center justify-center bg-green-600 text-4xl">?</div>
        </div>
        <div class="choice-card-copy relative flex min-h-0 flex-col justify-between bg-green-600">
          <div class="flex min-h-0 items-start justify-between gap-2">
            <h3 class="choice-card-title">{{ card.title }}</h3>
            <span
              v-if="card.badge"
              class="choice-card-badge shrink-0 rounded bg-amber-950/20 uppercase"
            >
              {{ card.badge }}
            </span>
          </div>
          <p class="choice-card-caption">{{ card.caption }}</p>
          <p v-if="card.disabledReason" class="choice-card-disabled font-bold text-amber-950/70">
            {{ card.disabledReason }}
          </p>
        </div>
      </template>
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

const columnCount = computed(() => Math.max(1, Math.min(props.cards.length, 4)));
const rowCount = computed(() => Math.max(1, Math.ceil(props.cards.length / columnCount.value)));
const gridClasses = computed(() => [
  'pointer-events-none grid h-full min-h-0 w-full overflow-hidden',
]);
const gridStyle = computed<CSSProperties>(() => ({
  gridTemplateColumns: `repeat(${columnCount.value}, minmax(0, 1fr))`,
  gridTemplateRows: `repeat(${rowCount.value}, minmax(0, 1fr))`,
  gap: 'var(--ui-choice-card-gap)',
}));

function handleCardClick(card: ChoiceCard) {
  if (card.disabled) {
    return;
  }

  void card.onSelect?.();
}

function cardClasses(card: ChoiceCard) {
  return [
    'choice-card pointer-events-auto relative h-full min-h-0 w-full overflow-hidden text-left text-black transition-opacity',
    props.revealed ? 'choice-card-revealed' : '',
    card.imageSrc ? 'flex items-center justify-center bg-transparent' : 'grid bg-green-600',
    card.disabled ? 'cursor-not-allowed opacity-45 saturate-0' : 'cursor-pointer',
  ];
}

function cardStyles(index: number): CSSProperties {
  const staggerIndex = Math.min(index, 3);

  return {
    opacity: props.revealed ? '1' : '0',
    transform: props.revealed ? 'translate3d(0, 0, 0)' : 'translate3d(0, 2rem, 0)',
    pointerEvents: props.revealed ? 'auto' : 'none',
    transitionDelay: `${staggerIndex * 110}ms`,
    transitionDuration: '480ms',
    transitionProperty: 'transform, opacity',
    transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
    '--choice-card-flip-delay': `${staggerIndex * 110 + 420}ms`,
  };
}
</script>

<style scoped>
.choice-card {
  grid-template-rows: minmax(2.5rem, 1fr) auto;
  perspective: 80rem;
}

.choice-card-flipper {
  position: relative;
  width: 100%;
  height: 100%;
  transform: rotateY(0deg);
  transform-style: preserve-3d;
  transition-delay: var(--choice-card-flip-delay, 420ms);
  transition-duration: 620ms;
  transition-property: transform;
  transition-timing-function: cubic-bezier(0.2, 0.85, 0.25, 1);
}

.choice-card-revealed .choice-card-flipper {
  transform: rotateY(180deg);
}

.choice-card-face {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  backface-visibility: hidden;
  transform-style: preserve-3d;
}

.choice-card-front {
  transform: rotateY(180deg);
}

.choice-card-image {
  display: block;
  width: auto;
  height: 100%;
  max-width: 100%;
  object-fit: contain;
  filter: drop-shadow(0 0.25rem 0.25rem rgba(0, 0, 0, 0.18));
}

.choice-card-image-disabled {
  position: absolute;
  right: clamp(0.25rem, 0.9vmin, 0.6rem);
  bottom: clamp(0.25rem, 0.9vmin, 0.6rem);
  left: clamp(0.25rem, 0.9vmin, 0.6rem);
  border-radius: 0.35rem;
  background: rgba(255, 238, 185, 0.92);
  padding: clamp(0.16rem, 0.55vmin, 0.4rem);
  color: #4b1d0a;
  font-size: clamp(0.52rem, 1.1vmin, 0.72rem);
  font-weight: 900;
  line-height: 1.05;
  text-align: center;
}

.choice-card-copy {
  gap: clamp(0.16rem, 0.7vmin, 0.4rem);
  padding: clamp(0.34rem, 1.15vmin, 0.75rem);
}

.choice-card-title {
  font-size: clamp(0.68rem, 1.55vmin, 1rem);
  line-height: 1.02;
  overflow-wrap: anywhere;
}

.choice-card-badge {
  padding: clamp(0.1rem, 0.4vmin, 0.22rem) clamp(0.22rem, 0.65vmin, 0.45rem);
  font-size: clamp(0.44rem, 0.9vmin, 0.6rem);
  line-height: 1;
}

.choice-card-caption {
  font-size: clamp(0.56rem, 1.18vmin, 0.8rem);
  line-height: 1.15;
  overflow-wrap: anywhere;
}

.choice-card-disabled {
  font-size: clamp(0.5rem, 1vmin, 0.7rem);
  line-height: 1.1;
}
</style>
