<template>
  <div :class="gridClasses" :style="gridStyle">
    <button
      v-for="(card, index) in cards"
      :key="card.id ?? card.title"
      :class="cardClasses(card)"
      :style="cardStyles(index, card)"
      :disabled="card.disabled"
      @click="handleCardClick(card)"
      @mousedown="handleCardPress(card)"
      @mouseup="handleCardRelease()"
      @mouseleave="handleCardRelease()"
      @touchstart.passive="handleCardPress(card)"
      @touchend="handleCardRelease()"
      @touchcancel="handleCardRelease()"
    >
      <template v-if="card.imageSrc">
        <template v-if="isActionCard(card)">
          <div class="choice-action-card-frame">
            <img
              :src="card.imageSrc"
              :alt="card.imageAlt ?? card.title"
              class="choice-card-image choice-action-card-image"
            />
            <div v-if="card.disabledReason" class="choice-card-image-disabled">
              {{ card.disabledReason }}
            </div>
          </div>
        </template>

        <template v-else>
          <div class="choice-card-flipper">
            <div class="choice-card-face choice-card-back">
              <img src="/images/cards/dos.webp" alt="" class="choice-card-image" />
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
import { computed, onBeforeUnmount, ref, watch, type CSSProperties } from 'vue';
import type { ChoiceCard } from '../../types/ui';
import { playSound } from '../../utils/soundManager';

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
  'pointer-events-none relative h-full min-h-0 w-full overflow-visible',
]);
const hasActionCards = computed(() => props.cards.some(isActionCard));
const selectedCardKey = ref<string | number | null>(null);
const pressedCardKey = ref<string | number | null>(null);
const resolvingSelection = ref(false);

let selectionTimer: number | null = null;
let revealSoundTimers: number[] = [];

const gridStyle = computed<CSSProperties>(() => ({
  '--choice-card-columns': columnCount.value,
  '--choice-card-rows': rowCount.value,
  '--choice-card-gap': hasActionCards.value
    ? 'calc(var(--ui-choice-card-gap) * 2.35)'
    : 'var(--ui-choice-card-gap)',
}));

function getCardKey(card: ChoiceCard): string | number {
  return card.id ?? card.title;
}

function isActionCard(card: ChoiceCard): boolean {
  return card.variant === 'action';
}

function getSelectionDelay(card: ChoiceCard): number {
  return isActionCard(card) ? 180 : 620;
}

function getActionCardRotation(index: number): number {
  const rotations = [-2.6, 1.8, -1.5, 2.4];

  return rotations[index % rotations.length] ?? 0;
}

function handleCardPress(card: ChoiceCard) {
  if (!card.disabled && !resolvingSelection.value && isActionCard(card)) {
    pressedCardKey.value = getCardKey(card);
  }
}

function handleCardRelease() {
  pressedCardKey.value = null;
}

function handleCardClick(card: ChoiceCard) {
  if (card.disabled || resolvingSelection.value) {
    return;
  }

  playSound(isActionCard(card) ? 'uiClick' : 'cards');
  selectedCardKey.value = getCardKey(card);
  resolvingSelection.value = true;

  selectionTimer = window.setTimeout(() => {
    selectionTimer = null;
    void card.onSelect?.();
  }, getSelectionDelay(card));
}

function clearRevealSoundTimers() {
  for (const timer of revealSoundTimers) {
    window.clearTimeout(timer);
  }

  revealSoundTimers = [];
}

function playRevealSoundsForCards() {
  clearRevealSoundTimers();

  props.cards.forEach((_, index) => {
    const timer = window.setTimeout(
      () => {
        playSound('cards', { volume: 0.32 });
      },
      Math.min(index, 3) * 110
    );

    revealSoundTimers.push(timer);
  });
}

function cardClasses(card: ChoiceCard) {
  const isSelected = selectedCardKey.value === getCardKey(card);
  const isDimmed = resolvingSelection.value && !isSelected;

  return [
    'choice-card pointer-events-auto absolute min-h-0 overflow-visible text-left text-black transition-opacity',
    props.revealed ? 'choice-card-revealed' : '',
    card.imageSrc ? 'flex items-center justify-center bg-transparent' : 'grid bg-green-600',
    isActionCard(card) ? 'choice-card-action' : 'choice-card-deck',
    resolvingSelection.value ? 'choice-card-resolving' : '',
    isSelected ? 'choice-card-selected' : '',
    isDimmed ? 'choice-card-dimmed' : '',
    card.disabled ? 'cursor-not-allowed opacity-45 saturate-0' : 'cursor-pointer',
  ];
}

function cardStyles(index: number, card: ChoiceCard): CSSProperties {
  const staggerIndex = Math.min(index, 3);
  const isAction = isActionCard(card);
  const cardKey = getCardKey(card);
  const isSelected = selectedCardKey.value === cardKey;
  const isPressed = pressedCardKey.value === cardKey;
  const isDimmed = resolvingSelection.value && !isSelected;
  const columnIndex = index % columnCount.value;
  const rowIndex = Math.floor(index / columnCount.value);
  const actionRotation = isAction ? getActionCardRotation(index) : 0;

  return {
    left: `calc(${columnIndex} * (var(--choice-card-width) + var(--choice-card-gap)))`,
    top: `calc(${rowIndex} * (var(--choice-card-height) + var(--choice-card-gap)))`,
    width: 'var(--choice-card-width)',
    height: 'var(--choice-card-height)',
    opacity: props.revealed ? (isDimmed ? '0.22' : '1') : '0',
    transform: getCardTransform(isAction, isSelected, actionRotation, isPressed),
    pointerEvents: props.revealed && !resolvingSelection.value ? 'auto' : 'none',
    transitionDelay: isSelected || isAction ? '0ms' : `${staggerIndex * 110}ms`,
    transitionDuration: isSelected
      ? `${getSelectionDelay(card)}ms`
      : isAction
        ? isPressed
          ? '120ms'
          : '200ms'
        : '480ms',
    transitionProperty: 'transform, opacity, filter',
    transitionTimingFunction: isAction
      ? 'cubic-bezier(0.16, 1, 0.3, 1)'
      : 'cubic-bezier(0.22, 1, 0.36, 1)',
    '--choice-card-flip-delay': isAction ? '0ms' : `${staggerIndex * 110 + 420}ms`,
  };
}

function getCardTransform(
  isAction: boolean,
  isSelected: boolean,
  actionRotation: number,
  isPressed: boolean = false
): string {
  if (isSelected) {
    return isAction
      ? `translate3d(0, 0, 0) rotate(${actionRotation}deg) scale(0.96)`
      : 'translate3d(-42vw, -3vh, 0) rotate(-8deg) scale(0.42)';
  }

  if (isAction && isPressed) {
    return `translate3d(0, 1vh, 0) rotate(${actionRotation}deg) scaleX(0.9) scaleY(0.9)`;
  }

  if (props.revealed) {
    return isAction ? `translate3d(0, 0, 0) rotate(${actionRotation}deg)` : 'translate3d(0, 0, 0)';
  }

  return isAction
    ? `translate3d(0, 0, 0) rotate(${actionRotation}deg) scale(0.98)`
    : 'translate3d(0, 2rem, 0)';
}

onBeforeUnmount(() => {
  if (selectionTimer !== null) {
    window.clearTimeout(selectionTimer);
  }

  clearRevealSoundTimers();
});

watch(
  () => props.revealed,
  (revealed) => {
    if (revealed && props.cards.length > 0) {
      playRevealSoundsForCards();
    }
  }
);
</script>

<style scoped>
.choice-card {
  --choice-card-width: calc(
    (100% - ((var(--choice-card-columns) - 1) * var(--choice-card-gap))) /
      var(--choice-card-columns)
  );
  --choice-card-height: calc(
    (100% - ((var(--choice-card-rows) - 1) * var(--choice-card-gap))) / var(--choice-card-rows)
  );

  grid-template-rows: minmax(2.5rem, 1fr) auto;
  perspective: 80rem;
}

.choice-card-resolving {
  cursor: default;
}

.choice-card-selected {
  z-index: 60;
  filter: drop-shadow(0 0.6rem 0.45rem rgba(0, 0, 0, 0.34));
}

.choice-card-dimmed {
  filter: saturate(0.7);
}

.choice-card-action {
  perspective: none;
}

.choice-action-card-frame {
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
}

.choice-action-card-image {
  filter: drop-shadow(0 0.42rem 0.36rem rgba(0, 0, 0, 0.24));
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
