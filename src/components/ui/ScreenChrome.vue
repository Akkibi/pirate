<template>
  <div class="pointer-events-none absolute inset-0 z-30 overflow-hidden">
    <Transition name="phase-panel" mode="out-in" appear>
      <div v-if="phaseConfig" :key="phaseConfig.label" class="phase-panel">
        <div class="phase-panel__parent">
          <svg
            width="59"
            height="100"
            viewBox="0 0 159 215"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M0 0H158.277V214.333H45.854L37.7541 199.737L29.655 214.333H0V176.031V170.215V165.889V0Z"
              :fill="phaseConfig.parentColor"
            />
          </svg>
        </div>

        <img class="phase-panel__icon" :src="phaseConfig.icon" :alt="phaseConfig.label" />
      </div>
    </Transition>

    <TransitionGroup
      v-if="showPeanutStack"
      class="peanut-stack"
      name="peanut-token"
      tag="div"
      :aria-label="gameText.screenChrome.peanutsLabel"
    >
      <img
        v-for="token in peanutTokens"
        :key="`peanut-${token}`"
        class="peanut-stack__token"
        src="/images/indicators/peanut.webp"
        :alt="gameText.screenChrome.peanutAlt"
      />
    </TransitionGroup>

    <Transition name="deck-stack">
      <button
        v-if="showDeckStack"
        class="deck-stack"
        type="button"
        :aria-label="`${gameText.screenChrome.remainingTreasureCards}: ${remainingDeckCount}`"
        @pointerdown="showDeckLabel"
        @pointerup="hideDeckLabel"
        @pointerleave="hideDeckLabel"
        @pointercancel="hideDeckLabel"
      >
        <span
          v-for="card in deckStackCards"
          :key="card.key"
          class="deck-stack-card"
          :style="card.style"
        >
          <img class="deck-stack-card__image" src="/images/cards/dos.webp" alt="" />
        </span>

        <span v-if="deckLabelVisible" class="deck-stack-label" aria-hidden="true">
          <span>{{ gameText.screenChrome.deck }}</span>
          <span>{{ gameText.screenChrome.cardsRemaining }}: {{ remainingDeckCount }}</span>
        </span>
      </button>
    </Transition>

    <Transition name="hand-stack">
      <button
        v-if="showHandStack"
        class="hand-stack-button"
        type="button"
        :aria-label="gameText.screenChrome.viewHand"
        @click="openHandOverlay()"
      >
        <span
          v-for="card in handStackCards"
          :key="card.key"
          :class="['hand-stack-card', card.usable ? 'hand-stack-card--usable' : '']"
          :style="card.style"
        >
          <img class="hand-stack-card__image" :src="card.imageSrc" :alt="card.alt" />
        </span>
      </button>
    </Transition>

    <Transition name="rhum-meter">
      <div
        v-if="showRhum"
        class="rhum-meter"
        :style="rhumMeterStyle"
        :aria-label="gameText.screenChrome.rhum"
      >
        <TransitionGroup name="rhum-bottle" tag="div" class="rhum-meter__stack">
          <span
            v-for="bottle in rhumBottles"
            :key="bottle.index"
            class="rhum-meter__slot"
            :style="bottle.style"
          >
            <img
              class="rhum-meter__bottle"
              :src="
                bottle.filled
                  ? '/images/indicators/rhum_full.webp'
                  : '/images/indicators/rhum_empty.webp'
              "
              :alt="
                bottle.filled
                  ? gameText.screenChrome.fullRhumBottle
                  : gameText.screenChrome.emptyRhumBottle
              "
            />
            <span v-if="bottle.animated" class="rhum-meter__animation" aria-hidden="true"></span>
          </span>
        </TransitionGroup>
      </div>
    </Transition>

    <Transition name="hand-overlay" :duration="{ enter: 980, leave: 760 }">
      <div
        v-if="handOverlayOpen && showHandStack"
        class="hand-overlay"
        :aria-label="gameText.screenChrome.treasureCards"
      >
        <button
          class="hand-overlay__scrim"
          type="button"
          :aria-label="gameText.screenChrome.closeCards"
          @click="closeHandOverlay"
        ></button>

        <div class="hand-overlay__cards" :style="handOverlayStyle">
          <button
            v-for="card in handOverlayCards"
            :key="card.key"
            :class="['hand-overlay__card', card.usable ? 'hand-overlay__card--usable' : '']"
            :style="card.style"
            type="button"
            :disabled="!card.usable"
            @click="handleOverlayCardClick(card)"
          >
            <img class="hand-overlay__card-image" :src="card.imageSrc" :alt="card.alt" />
          </button>
        </div>

        <div class="hand-overlay__close">
          <GameButton :label="gameText.common.close" :on-click="closeHandOverlay" />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch, type CSSProperties } from 'vue';
import GameButton from './GameButton.vue';
import { gameState, getBoardTileStateAtPosition } from '../../utils/gameStore';
import {
  getTreasureCardDefinition,
  getTreasureCardTitle,
  type TreasureCardInstance,
  type TreasurePhase,
} from '../../utils/treasureCards';
import type { DayPhaseIndicator } from '../../utils/uiFlowStore';
import { playSound } from '../../utils/soundManager';
import { gameText } from '../../content/gameText';

const props = withDefaults(
  defineProps<{
    phase?: DayPhaseIndicator;
    showRhum?: boolean;
    showPeanuts?: boolean;
    canUseCards?: boolean;
    handOpenRequestKey?: number;
  }>(),
  {
    phase: undefined,
    showRhum: false,
    showPeanuts: false,
    canUseCards: false,
    handOpenRequestKey: 0,
  }
);

const emit = defineEmits<{
  useCard: [cardInstanceId: string | number];
}>();

const handOverlayOpen = ref(false);
const deckLabelVisible = ref(false);
const displayedRhumCount = ref(gameState.currentRhum);
const initialRhumFillPlayed = ref(false);
const rhumFillTimers: number[] = [];

const phaseConfigs: Record<DayPhaseIndicator, { icon: string; parentColor: string }> = {
  aurore: {
    icon: '/images/indicators/picto_aurore.webp',
    parentColor: '#CA889E',
  },
  matinee: {
    icon: '/images/indicators/picto_matinee.webp',
    parentColor: '#E8B94E',
  },
  journee: {
    icon: '/images/indicators/picto_journee.webp',
    parentColor: '#E18354',
  },
  soiree: {
    icon: '/images/indicators/picto_nuit.webp',
    parentColor: '#3C4D90',
  },
};

const phaseConfig = computed(() =>
  props.phase
    ? {
        ...phaseConfigs[props.phase],
        label: gameText.screenChrome.phaseLabels[props.phase],
      }
    : null
);
const currentTreasurePhase = computed<TreasurePhase | null>(() => {
  switch (props.phase) {
    case 'matinee':
      return 'morning';
    case 'journee':
      return 'afternoon';
    case 'soiree':
      return 'evening';
    default:
      return null;
  }
});
const peanutTokens = computed(() =>
  Array.from({ length: gameState.peanutTokens }, (_, index) => index + 1)
);
const showPeanutStack = computed(
  () => props.showPeanuts && gameState.currentPhase === 'parrot' && peanutTokens.value.length > 0
);
const rhumBottles = computed(() =>
  Array.from({ length: gameState.maxRhum }, (_, index) => ({
    index,
    filled: index < displayedRhumCount.value,
    animated: index < displayedRhumCount.value,
    style: {
      '--rhum-bottle-animation-delay': `${index * 120}ms`,
    } as CSSProperties,
  }))
);
const rhumMeterStyle = computed(
  () =>
    ({
      '--rhum-meter-count': Math.max(1, gameState.maxRhum),
    }) as CSSProperties
);
const remainingDeckCount = computed(() => gameState.treasureDeck.length);
const showDeckStack = computed(
  () => gameState.currentPhase === 'crew' && remainingDeckCount.value > 0
);
const crewHandCount = computed(() => gameState.crewHand.length);
const showHandStack = computed(
  () => gameState.currentPhase === 'crew' && handStackCards.value.length > 0
);
const deckStackCards = computed(() => {
  const visibleCardCount = Math.min(6, remainingDeckCount.value);

  return Array.from({ length: visibleCardCount }, (_, index) => ({
    key: `deck-${index}`,
    style: {
      '--deck-card-x': `${index * 0.12}rem`,
      '--deck-card-y': `${index * 0.08}rem`,
      '--deck-card-z': visibleCardCount - index,
    } as CSSProperties,
  }));
});

function isTreasureCardUsable(card: TreasureCardInstance): boolean {
  const phase = currentTreasurePhase.value;

  if (!props.canUseCards || !phase || gameState.usedTreasureThisTurn) {
    return false;
  }

  const definition = getTreasureCardDefinition(card.cardId);

  if (!definition.playable || definition.phase !== phase) {
    return false;
  }

  if (card.cardId === 'bombe-artisanale') {
    const tileState = getBoardTileStateAtPosition(gameState.userPosition);

    return gameState.currentRhum > 0 && (tileState === 'monster' || tileState === 'typhon');
  }

  return true;
}

const handStackCards = computed(() => {
  const hand = gameState.crewHand;

  if (hand.length === 0) {
    return [];
  }

  const usableCard = hand.find(isTreasureCardUsable);
  const topCard = usableCard ?? hand[hand.length - 1]!;
  const cardsUnderTop = hand.filter((card) => card.instanceId !== topCard.instanceId).slice(-4);
  const visibleCards = [...cardsUnderTop, topCard];

  return visibleCards.map((card, index) => {
    const isUsable = isTreasureCardUsable(card);
    const definition = getTreasureCardDefinition(card.cardId);
    const fanOffset = index - (visibleCards.length - 1) / 2;
    const imageSrc = definition.imageSrc ?? '/images/cards/dos.webp';
    const style = {
      '--hand-card-x': `${index * 0.42}rem`,
      '--hand-card-y': `${Math.abs(fanOffset) * 0.18}rem`,
      '--hand-card-rotation': `${45 + fanOffset * 9}deg`,
      '--hand-card-z': index + 1,
    } as CSSProperties;

    return {
      key: card.instanceId,
      imageSrc,
      alt: getTreasureCardTitle(card.cardId),
      usable: isUsable,
      style,
    };
  });
});

const handOverlayCards = computed(() =>
  gameState.crewHand.map((card, index) => {
    const cardCount = gameState.crewHand.length;
    const definition = getTreasureCardDefinition(card.cardId);
    const usable = isTreasureCardUsable(card);
    const enterOrder = Math.min(index, 7);
    const leaveOrder = Math.min(cardCount - index - 1, 7);

    return {
      key: card.instanceId,
      instanceId: card.instanceId,
      imageSrc: definition.imageSrc ?? '/images/cards/dos.webp',
      alt: getTreasureCardTitle(card.cardId),
      usable,
      style: {
        '--hand-overlay-enter-delay': `${enterOrder * 48}ms`,
        '--hand-overlay-leave-delay': `${leaveOrder * 34}ms`,
      } as CSSProperties,
    };
  })
);
const handOverlayStyle = computed(() => {
  const cardCount = Math.max(1, handOverlayCards.value.length);
  const gapVw = 1.15;
  const availableWidthVw = 90 - Math.max(0, cardCount - 1) * gapVw;
  const cardWidthVw = Math.min(23, Math.max(12.5, availableWidthVw / cardCount));

  return {
    '--hand-overlay-count': cardCount,
    '--hand-overlay-gap': 'clamp(0.45rem, 1.15vw, 0.95rem)',
    '--hand-overlay-card-width': `${cardWidthVw}vw`,
  } as CSSProperties;
});

function openHandOverlay(options?: { playClick?: boolean }) {
  if (options?.playClick !== false) {
    playSound('uiClick');
  }

  handOverlayOpen.value = true;
}

function showDeckLabel() {
  playSound('uiClick');
  deckLabelVisible.value = true;
}

function hideDeckLabel() {
  deckLabelVisible.value = false;
}

function handleOverlayCardClick(card: { instanceId: string | number; usable: boolean }) {
  if (!card.usable) {
    return;
  }

  handOverlayOpen.value = false;
  emit('useCard', card.instanceId);
}

function closeHandOverlay() {
  handOverlayOpen.value = false;
}

function clearRhumFillTimers() {
  while (rhumFillTimers.length > 0) {
    const timer = rhumFillTimers.pop();

    if (timer !== undefined) {
      window.clearTimeout(timer);
    }
  }
}

function clampRhumCount(count: number): number {
  return Math.max(0, Math.min(gameState.maxRhum, count));
}

function shouldPlayInitialRhumFill(): boolean {
  return (
    props.showRhum &&
    !initialRhumFillPlayed.value &&
    props.phase === 'aurore' &&
    gameState.turnCount === 0 &&
    gameState.currentRhum > 0
  );
}

function startInitialRhumFill() {
  if (!shouldPlayInitialRhumFill()) {
    return false;
  }

  clearRhumFillTimers();
  initialRhumFillPlayed.value = true;
  displayedRhumCount.value = 0;
  playSound('rhumRound', { interrupt: true });

  const targetRhum = gameState.currentRhum;
  const fillStepDuration = Math.max(140, Math.min(240, 1500 / targetRhum));

  Array.from({ length: targetRhum }, (_, index) => {
    const timer = window.setTimeout(() => {
      displayedRhumCount.value = clampRhumCount(index + 1);
    }, index * fillStepDuration);

    rhumFillTimers.push(timer);
  });

  return true;
}

watch(crewHandCount, (count) => {
  if (count === 0) {
    handOverlayOpen.value = false;
  }
});

watch(showHandStack, (shown) => {
  if (!shown) {
    handOverlayOpen.value = false;
  }
});

watch(showDeckStack, (shown) => {
  if (!shown) {
    deckLabelVisible.value = false;
  }
});

watch(
  () => props.handOpenRequestKey,
  (requestKey, previousRequestKey) => {
    if (!requestKey || requestKey === previousRequestKey || !props.canUseCards) {
      return;
    }

    openHandOverlay({ playClick: false });
  }
);

watch(
  () => gameState.currentRhum,
  (currentRhum) => {
    displayedRhumCount.value = clampRhumCount(currentRhum);
  }
);

watch(
  () => gameState.maxRhum,
  () => {
    clearRhumFillTimers();
    displayedRhumCount.value = clampRhumCount(gameState.currentRhum);
  }
);

watch(
  () => props.showRhum,
  (shown) => {
    if (!shown) {
      return;
    }

    if (!startInitialRhumFill()) {
      displayedRhumCount.value = clampRhumCount(gameState.currentRhum);
    }
  },
  {
    immediate: true,
  }
);

onBeforeUnmount(() => {
  clearRhumFillTimers();
});
</script>

<style scoped>
.phase-panel {
  --phase-panel-width: clamp(3.75rem, var(--ui-phase-width), 4.85rem);
  --phase-panel-icon-width: calc(var(--phase-panel-width) * 0.9);

  position: absolute;
  top: var(--ui-grid-padding);
  left: var(--ui-chrome-side-inset);
  display: flex;
  width: var(--phase-panel-width);
  flex-direction: column;
  align-items: center;
  gap: clamp(2rem, 2vmin, 2rem);
}

.phase-panel__parent {
  position: absolute;
  top: -2rem;
  left: 50%;
  width: var(--phase-panel-width);
  transform: translateX(-50%);
}

.phase-panel__parent svg {
  display: block;
  width: 100%;
  height: auto;
}

.phase-panel__icon {
  position: relative;
  width: var(--phase-panel-icon-width);
  height: auto;
  display: block;
  object-fit: contain;
  z-index: 10;
  /* filter: drop-shadow(0 0.22rem 0.5rem rgba(0, 0, 0, 1)); */
}

.hand-stack-button {
  position: absolute;
  bottom: calc(var(--ui-hand-stack-height) * -0.72);
  left: calc(var(--ui-hand-stack-width) * -0.92);
  z-index: 16;
  pointer-events: auto;
  width: calc(var(--ui-hand-stack-width) * 5.2);
  height: calc(var(--ui-hand-stack-height) * 4.55);
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  touch-action: manipulation;
}

.deck-stack {
  position: absolute;
  top: clamp(8.5rem, 26vh, 14rem);
  left: 0;
  z-index: 15;
  width: calc(var(--ui-hand-stack-width) * 1.38);
  height: calc(var(--ui-hand-stack-height) * 1.38);
  pointer-events: auto;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  touch-action: none;
  transform: translate3d(-50%, 0, 0) rotate(90deg);
  transform-origin: 50% 50%;
}

.deck-stack-card {
  position: absolute;
  top: 0;
  left: 0;
  z-index: var(--deck-card-z);
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  border-radius: 0.28rem;
  background: #f5f1df;
  box-shadow:
    0.1rem 0.1rem 0 #e95d39,
    0.18rem 0.18rem 0 rgba(255, 255, 255, 0.92);
  transform: translate3d(var(--deck-card-x), var(--deck-card-y), 0);
}

.deck-stack-card__image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 0.16rem 0.16rem rgba(0, 0, 0, 0.24));
}

.deck-stack-label {
  position: absolute;
  top: 50%;
  left: calc(100% + 0.5rem);
  z-index: 20;
  display: flex;
  min-width: max-content;
  flex-direction: column;
  gap: 0.12rem;
  border: 0.14rem solid #7a3510;
  border-radius: 0.4rem;
  background: rgba(255, 241, 188, 0.96);
  padding: 0.34rem 0.5rem;
  color: #5a2309;
  font-size: clamp(0.62rem, 1.45vmin, 0.9rem);
  font-weight: 900;
  line-height: 1.05;
  text-align: left;
  text-shadow: none;
  transform: translateY(-50%) rotate(-90deg);
  transform-origin: left center;
  box-shadow: 0 0.22rem 0.45rem rgba(0, 0, 0, 0.22);
}

.hand-stack-card {
  position: absolute;
  bottom: calc(var(--ui-hand-stack-height) * 0.08);
  left: calc(var(--ui-hand-stack-width) * 0.22);
  z-index: var(--hand-card-z);
  display: flex;
  width: calc(var(--ui-hand-stack-width) * 2);
  height: calc(var(--ui-hand-stack-height) * 2);
  align-items: center;
  justify-content: center;
  transform: translate3d(var(--hand-card-x), var(--hand-card-y), 0)
    rotate(var(--hand-card-rotation));
  transform-origin: 16% 92%;
  transition:
    filter 260ms ease,
    transform 300ms cubic-bezier(0.22, 1, 0.36, 1);
}

.hand-stack-card--usable {
  width: calc(var(--ui-hand-stack-width) * 3);
  height: calc(var(--ui-hand-stack-height) * 3);
  transform: translate3d(calc(var(--hand-card-x) + 0.08rem), calc(var(--hand-card-y) - 0.22rem), 0)
    rotate(var(--hand-card-rotation)) scale(1.05);
}

.hand-stack-card--usable::after {
  position: absolute;
  inset: 1%;
  border: 0.14rem solid #ffe77a;
  border-radius: 0.45rem;
  box-shadow:
    0 0 0.2rem rgba(255, 248, 177, 0.95),
    0 0 0.75rem rgba(255, 214, 76, 0.9),
    0 0 1.15rem rgba(255, 128, 48, 0.72);
  content: '';
  animation: hand-card-glow 1050ms ease-in-out infinite alternate;
}

.hand-stack-card__image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 0.22rem 0.22rem rgba(0, 0, 0, 0.28));
}

.peanut-stack {
  position: absolute;
  top: calc(var(--ui-grid-padding) + var(--ui-phase-width) * 1.7);
  left: var(--ui-chrome-side-inset);
  z-index: 16;
  display: flex;
  width: calc(var(--ui-resource-width) * 1.18);
  flex-direction: column;
  align-items: center;
  gap: var(--ui-resource-gap);
}

.peanut-stack__token {
  width: 100%;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 0.2rem 0.18rem rgba(0, 0, 0, 0.24));
}

.hand-overlay {
  position: absolute;
  inset: 0;
  z-index: 40;
  pointer-events: auto;
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  grid-template-rows: repeat(8, minmax(0, 1fr));
  gap: 0.75rem;
  padding: 0.75rem;
}

.hand-overlay__scrim {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(0, 0, 0, 0.78);
}

.hand-overlay__cards {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: flex-start;
  gap: var(--hand-overlay-gap);
  overflow-x: auto;
  overflow-y: hidden;
  padding: clamp(0.75rem, 2.5vmin, 1.25rem) max(1rem, 4vw) clamp(4.2rem, 15vh, 5.5rem);
  pointer-events: none;
  scroll-padding-inline: max(1rem, 4vw);
  scroll-snap-type: x proximity;
  scrollbar-width: thin;
}

@supports (justify-content: safe center) {
  .hand-overlay__cards {
    justify-content: safe center;
  }
}

.hand-overlay__close {
  position: absolute;
  right: max(1rem, 4vw);
  bottom: 0.65rem;
  left: max(1rem, 4vw);
  z-index: 2;
  height: clamp(2.45rem, 12vh, 4rem);
  min-height: 0;
  pointer-events: auto;
}

.hand-overlay__card {
  --hand-overlay-source-x: calc(-50vw + (var(--ui-hand-stack-width) * 0.7));
  --hand-overlay-source-y: calc(
    50vh - var(--ui-chrome-bottom-inset) - (var(--ui-hand-stack-height) * 0.55)
  );
  --hand-overlay-card-width: 23vw;

  position: relative;
  flex: 0 0 auto;
  width: clamp(10rem, var(--hand-overlay-card-width), 18rem);
  max-width: calc(64dvh * 0.7);
  aspect-ratio: 350 / 500;
  padding: 0;
  border: 0;
  background: transparent;
  pointer-events: auto;
  scroll-snap-align: center;
  transform: translate3d(0, 0, 0);
  transition:
    filter 220ms ease,
    opacity 220ms ease,
    transform 250ms cubic-bezier(0.22, 1, 0.36, 1);
}

.hand-overlay__card:disabled {
  cursor: default;
}

.hand-overlay__card--usable {
  cursor: pointer;
}

.hand-overlay__card--usable::after {
  position: absolute;
  inset: 0;
  border: 0.16rem solid #ffe77a;
  border-radius: 0.55rem;
  box-shadow:
    0 0 0.25rem rgba(255, 248, 177, 0.98),
    0 0 0.9rem rgba(255, 214, 76, 0.95),
    0 0 1.45rem rgba(255, 128, 48, 0.78);
  content: '';
  animation: hand-card-glow 1050ms ease-in-out infinite alternate;
}

.hand-overlay__card-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 0.28rem 0.28rem rgba(0, 0, 0, 0.34));
}

.rhum-meter {
  --rhum-meter-gap: clamp(0.08rem, 0.58vmin, calc(var(--ui-resource-gap) * 1.15));
  --rhum-meter-lane-height: calc(100dvh - var(--ui-rhum-top) - var(--ui-chrome-bottom-inset));
  --rhum-animation-cycle-duration: 1500ms;

  position: absolute;
  top: var(--ui-rhum-top);
  right: var(--ui-grid-padding);
  width: calc(var(--ui-resource-width) * 2);
  height: var(--rhum-meter-lane-height);
}

.rhum-meter__stack {
  position: relative;
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  align-items: center;
  gap: var(--rhum-meter-gap);
}

.rhum-meter__slot {
  position: relative;
  display: flex;
  width: 100%;
  min-height: 0;
  max-height: calc(var(--ui-resource-width) * 2.44);
  flex: 1 1 0;
  align-items: center;
  justify-content: center;
}

.rhum-meter__bottle {
  position: relative;
  z-index: 1;
  width: auto;
  max-width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 0.2rem 0.18rem rgba(0, 0, 0, 0.24));
}

.rhum-meter__animation {
  position: absolute;
  inset: 0;
  z-index: 2;
  background-image: url('/images/animations/rhum_anim_1.webp');
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  opacity: 1;
  pointer-events: none;
  animation: rhum-bottle-animation-frame var(--rhum-animation-cycle-duration) steps(1, end) infinite;
  animation-delay: var(--rhum-bottle-animation-delay);
  will-change: background-image;
}

.rhum-meter-enter-active,
.rhum-meter-leave-active {
  transition:
    opacity 360ms ease,
    transform 420ms cubic-bezier(0.22, 1, 0.36, 1);
}

.phase-panel-enter-active {
  animation: phase-panel-drop 680ms cubic-bezier(0.16, 0.92, 0.18, 1.05);
}

.phase-panel-leave-active {
  animation: phase-panel-exit-up 260ms cubic-bezier(0.55, 0.05, 0.75, 0.2) forwards;
}

.rhum-meter-enter-from,
.rhum-meter-leave-to {
  opacity: 0;
  transform: translate3d(115%, 0, 0);
}

.hand-stack-enter-active,
.hand-stack-leave-active {
  transition:
    opacity 260ms ease,
    transform 300ms cubic-bezier(0.22, 1, 0.36, 1);
}

.hand-stack-enter-from,
.hand-stack-leave-to {
  opacity: 0;
  transform: translate3d(-16%, 18%, 0) scale(0.88);
}

.deck-stack-enter-active,
.deck-stack-leave-active {
  transition:
    opacity 260ms ease,
    transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
}

.deck-stack-enter-from,
.deck-stack-leave-to {
  opacity: 0;
  transform: translate3d(-62%, -8%, 0) rotate(90deg) scale(0.9);
}

.hand-overlay-enter-active,
.hand-overlay-leave-active {
  transition: opacity 220ms ease;
}

.hand-overlay-enter-from,
.hand-overlay-leave-to {
  opacity: 0;
}

.hand-overlay-enter-active .hand-overlay__card {
  animation: hand-overlay-card-in 560ms cubic-bezier(0.16, 0.92, 0.18, 1.04) both;
  animation-delay: var(--hand-overlay-enter-delay);
}

.hand-overlay-leave-active .hand-overlay__card {
  animation: hand-overlay-card-out 430ms cubic-bezier(0.55, 0.05, 0.75, 0.2) both;
  animation-delay: var(--hand-overlay-leave-delay);
}

.hand-overlay-enter-active .hand-overlay__close {
  animation: hand-overlay-close-in 260ms ease both;
  animation-delay: 430ms;
}

.hand-overlay-leave-active .hand-overlay__close {
  animation: hand-overlay-close-out 160ms ease both;
}

.peanut-token-enter-active,
.peanut-token-leave-active,
.rhum-bottle-enter-active,
.rhum-bottle-leave-active {
  transition:
    opacity 260ms ease,
    transform 260ms ease;
}

.peanut-token-enter-from,
.peanut-token-leave-to,
.rhum-bottle-enter-from,
.rhum-bottle-leave-to {
  opacity: 0;
  transform: scale(0.72);
}

@keyframes hand-card-glow {
  from {
    opacity: 0.62;
  }

  to {
    opacity: 1;
  }
}

@keyframes rhum-bottle-animation-frame {
  0%,
  19.99% {
    background-image: url('/images/animations/rhum_anim_1.webp');
  }

  20%,
  39.99% {
    background-image: url('/images/animations/rhum_anim_2.webp');
  }

  40%,
  59.99% {
    background-image: url('/images/animations/rhum_anim_3.webp');
  }

  60%,
  79.99% {
    background-image: url('/images/animations/rhum_anim_4.webp');
  }

  80%,
  100% {
    background-image: url('/images/animations/rhum_anim_5.webp');
  }
}

@keyframes hand-overlay-card-in {
  from {
    opacity: 0.3;
    transform: translate3d(var(--hand-overlay-source-x), var(--hand-overlay-source-y), 0)
      rotate(-10deg) scale(0.45);
  }

  68% {
    opacity: 1;
    transform: translate3d(0.18rem, 0, 0) rotate(-2deg) scale(1.02);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
  }
}

@keyframes hand-overlay-card-out {
  from {
    opacity: 1;
    transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
  }

  to {
    opacity: 0;
    transform: translate3d(var(--hand-overlay-source-x), var(--hand-overlay-source-y), 0)
      rotate(-10deg) scale(0.42);
  }
}

@keyframes hand-overlay-close-in {
  from {
    opacity: 0;
    transform: translate3d(0, 0.6rem, 0);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

@keyframes hand-overlay-close-out {
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
  }
}

@keyframes phase-panel-drop {
  0% {
    opacity: 0;
    transform: translate3d(0, -14rem, 0);
  }

  68% {
    opacity: 1;
    transform: translate3d(0, 0.42rem, 0);
  }

  84% {
    transform: translate3d(0, -0.15rem, 0);
  }

  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

@keyframes phase-panel-exit-up {
  from {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }

  to {
    opacity: 0;
    transform: translate3d(0, -14rem, 0);
  }
}
</style>
