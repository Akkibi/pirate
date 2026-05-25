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
      aria-label="Cacahuetes"
    >
      <img
        v-for="token in peanutTokens"
        :key="`peanut-${token}`"
        class="peanut-stack__token"
        src="/images/indicators/peanut.png"
        alt="Cacahuete"
      />
    </TransitionGroup>

    <Transition name="hand-stack">
      <button
        v-if="showHandStack"
        class="hand-stack-button"
        type="button"
        aria-label="Voir les cartes tresor en main"
        @click="handOverlayOpen = true"
      >
        <span
          v-for="card in handStackCards"
          :key="card.key"
          :class="['hand-stack-card', card.usable ? 'hand-stack-card--usable' : '']"
          :style="card.style"
        >
          <img class="hand-stack-card__image" :src="card.imageSrc" :alt="card.alt" />
        </span>
        <span v-if="crewHandCount > 1" class="hand-stack-count">
          {{ crewHandCount }}
        </span>
      </button>
    </Transition>

    <Transition name="rhum-meter">
      <div v-if="showRhum" class="rhum-meter" aria-label="Rhum">
        <TransitionGroup name="rhum-bottle" tag="div" class="rhum-meter__stack">
          <img
            v-for="bottle in rhumBottles"
            :key="`${bottle.index}-${bottle.filled ? 'full' : 'empty'}`"
            class="rhum-meter__bottle"
            :src="
              bottle.filled
                ? '/images/indicators/rhum_full.png'
                : '/images/indicators/rhum_empty.png'
            "
            :alt="bottle.filled ? 'Bouteille de rhum pleine' : 'Bouteille de rhum vide'"
          />
        </TransitionGroup>
      </div>
    </Transition>

    <Transition name="hand-overlay">
      <div v-if="handOverlayOpen && showHandStack" class="hand-overlay" aria-label="Cartes tresor">
        <button
          class="hand-overlay__scrim"
          type="button"
          aria-label="Fermer les cartes"
          @click="handOverlayOpen = false"
        ></button>

        <div class="hand-overlay__cards" :style="handOverlayStyle">
          <button
            v-for="card in handOverlayCards"
            :key="card.key"
            :class="['hand-overlay__card', card.usable ? 'hand-overlay__card--usable' : '']"
            type="button"
            :disabled="!card.usable"
            @click="handleOverlayCardClick(card)"
          >
            <img class="hand-overlay__card-image" :src="card.imageSrc" :alt="card.alt" />
          </button>
        </div>

        <div class="hand-overlay__close">
          <GameButton label="Fermer" :on-click="closeHandOverlay" />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, type CSSProperties } from 'vue';
import GameButton from './GameButton.vue';
import { gameState, getBoardTileStateAtPosition } from '../../utils/gameStore';
import {
  getTreasureCardDefinition,
  type TreasureCardInstance,
  type TreasurePhase,
} from '../../utils/treasureCards';
import type { DayPhaseIndicator } from '../../utils/uiFlowStore';

const props = withDefaults(
  defineProps<{
    phase?: DayPhaseIndicator;
    showRhum?: boolean;
    showPeanuts?: boolean;
    canUseCards?: boolean;
  }>(),
  {
    phase: undefined,
    showRhum: false,
    showPeanuts: false,
    canUseCards: false,
  }
);

const emit = defineEmits<{
  useCard: [cardInstanceId: string | number];
}>();

const handOverlayOpen = ref(false);

const phaseConfigs: Record<
  DayPhaseIndicator,
  { icon: string; label: string; parentColor: string }
> = {
  aurore: {
    icon: '/images/indicators/picto_aurore.png',
    label: 'Aurore',
    parentColor: '#CA889E',
  },
  matinee: {
    icon: '/images/indicators/picto_matinee.png',
    label: 'Matinee',
    parentColor: '#E8B94E',
  },
  journee: {
    icon: '/images/indicators/picto_journee.png',
    label: 'Journee',
    parentColor: '#E18354',
  },
  soiree: {
    icon: '/images/indicators/picto_soiree.png',
    label: 'Soiree',
    parentColor: '#3C4D90',
  },
};

const phaseConfig = computed(() => (props.phase ? phaseConfigs[props.phase] : null));
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
    filled: index < gameState.currentRhum,
  }))
);
const crewHandCount = computed(() => gameState.crewHand.length);
const showHandStack = computed(
  () => gameState.currentPhase === 'crew' && handStackCards.value.length > 0
);

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
    const isTopCard = card.instanceId === topCard.instanceId;
    const isUsable = isTopCard && card.instanceId === usableCard?.instanceId;
    const definition = getTreasureCardDefinition(card.cardId);
    const stackOffset = index - (visibleCards.length - 1);
    const imageSrc =
      isUsable && definition.imageSrc ? definition.imageSrc : '/images/cards/dos.png';
    const style = {
      '--hand-card-x': `${stackOffset * 0.18}rem`,
      '--hand-card-y': `${Math.abs(stackOffset) * 0.16}rem`,
      '--hand-card-z': index + 1,
    } as CSSProperties;

    return {
      key: card.instanceId,
      imageSrc,
      alt: isUsable ? definition.title : 'Dos de carte tresor',
      usable: isUsable,
      style,
    };
  });
});

const handOverlayCards = computed(() =>
  gameState.crewHand.map((card) => {
    const definition = getTreasureCardDefinition(card.cardId);
    const usable = isTreasureCardUsable(card);

    return {
      key: card.instanceId,
      instanceId: card.instanceId,
      imageSrc: definition.imageSrc ?? '/images/cards/dos.png',
      alt: definition.title,
      usable,
    };
  })
);
const handOverlayStyle = computed(
  () =>
    ({
      '--hand-overlay-count': Math.max(1, handOverlayCards.value.length),
      '--hand-overlay-gap': 'var(--ui-hand-overlay-gap)',
    }) as CSSProperties
);

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
</script>

<style scoped>
.phase-panel {
  position: absolute;
  top: var(--ui-grid-padding);
  left: var(--ui-chrome-side-inset);
  display: flex;
  width: var(--ui-phase-width);
  flex-direction: column;
  align-items: center;
  gap: clamp(2rem, 2vmin, 2rem);
}

.phase-panel__parent {
  position: absolute;
  top: -2rem;
  left: -0.25rem;
}

.phase-panel__icon {
  width: 100%;
  height: auto;
  object-fit: contain;
  z-index: 10;
  /* filter: drop-shadow(0 0.22rem 0.5rem rgba(0, 0, 0, 1)); */
}

.hand-stack-button {
  position: absolute;
  bottom: var(--ui-chrome-bottom-inset);
  left: var(--ui-chrome-side-inset);
  z-index: 16;
  pointer-events: auto;
  width: var(--ui-hand-stack-width);
  height: var(--ui-hand-stack-height);
  padding: 0;
  border: 0;
  background: transparent;
}

.hand-stack-card {
  position: absolute;
  inset: 0;
  z-index: var(--hand-card-z);
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translate3d(var(--hand-card-x), var(--hand-card-y), 0);
  transition:
    filter 260ms ease,
    transform 300ms cubic-bezier(0.22, 1, 0.36, 1);
}

.hand-stack-card--usable {
  transform: translate3d(0, -1.5rem, 0) scale(2.04);
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

.hand-stack-count {
  position: absolute;
  right: -0.45rem;
  bottom: -0.35rem;
  z-index: 20;
  display: grid;
  min-width: 1.25rem;
  height: 1.25rem;
  place-items: center;
  border: 0.12rem solid #532609;
  border-radius: 999px;
  background: #f6d37a;
  color: #532609;
  font-size: clamp(0.58rem, 1.45vmin, 0.82rem);
  font-weight: 900;
  line-height: 1;
  filter: drop-shadow(0 0.13rem 0.14rem rgba(0, 0, 0, 0.3));
}

.peanut-stack {
  position: absolute;
  bottom: var(--ui-chrome-bottom-inset);
  left: var(--ui-chrome-side-inset);
  z-index: 16;
  display: flex;
  width: var(--ui-resource-width);
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
  position: relative;
  z-index: 1;
  grid-column: 1 / -1;
  grid-row: 1 / 8;
  display: flex;
  width: 100%;
  height: 100%;
  max-height: 100%;
  gap: var(--hand-overlay-gap);
  align-items: center;
  justify-content: center;
  padding: var(--ui-hand-overlay-padding);
}

.hand-overlay__close {
  position: relative;
  z-index: 2;
  grid-column: 2 / 8;
  grid-row: 8 / 9;
  height: 100%;
  min-height: 0;
  pointer-events: auto;
}

.hand-overlay__card {
  position: relative;
  width: min(
    calc(
      (92vw - ((var(--hand-overlay-count) - 1) * var(--hand-overlay-gap))) /
        var(--hand-overlay-count)
    ),
    calc(72vh * 0.7),
    34rem
  );
  aspect-ratio: 350 / 500;
  flex: 0 1 auto;
  padding: 0;
  border: 0;
  background: transparent;
  transition:
    filter 220ms ease,
    opacity 220ms ease,
    transform 250ms cubic-bezier(0.22, 1, 0.36, 1);
}

.hand-overlay__card:disabled {
  cursor: default;
  opacity: 0.72;
  filter: saturate(0.8) brightness(0.78);
}

.hand-overlay__card--usable {
  cursor: pointer;
  transform: translate3d(0, -0.35rem, 0) scale(1.04);
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
  position: absolute;
  top: var(--ui-rhum-top);
  right: var(--ui-grid-padding);
  width: var(--ui-resource-width);
}

.rhum-meter__stack {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ui-resource-gap);
}

.rhum-meter__bottle {
  width: 100%;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 0.2rem 0.18rem rgba(0, 0, 0, 0.24));
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
  transform: translate3d(-0.45rem, 0.7rem, 0) scale(0.88);
}

.hand-overlay-enter-active,
.hand-overlay-leave-active {
  transition: opacity 220ms ease;
}

.hand-overlay-enter-from,
.hand-overlay-leave-to {
  opacity: 0;
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
