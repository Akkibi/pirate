<template>
  <div v-if="shouldShowParchment" :class="parchmentClasses">
    <Parchment
      size="fill"
      surface-class="h-full"
      content-class="flex h-full items-center justify-center text-center"
      @shown="handleParchmentShown"
    >
      <slot name="message">{{ message }}</slot>
    </Parchment>
  </div>

  <div
    :class="[
      'dice-slot row-span-4 row-start-3 flex min-h-0 min-w-0 items-center justify-center transition-opacity duration-300',
      diceSlotLayoutClasses,
      diceVisible ? 'opacity-100' : 'opacity-0',
    ]"
  >
    <div class="dice-stage" aria-hidden="true">
      <div class="dice-cube text-amber-100" :style="diceStyle">
        <div class="dice-face dice-face--front">0</div>
        <div class="dice-face dice-face--right">1</div>
        <div class="dice-face dice-face--top">1</div>
        <div class="dice-face dice-face--bottom">2</div>
        <div class="dice-face dice-face--left">2</div>
        <div class="dice-face dice-face--back">3</div>
      </div>
      <div
        class="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/3 w-70 h-14 bg-black/20 -z-10 rounded-[50%]"
      ></div>
    </div>
  </div>

  <div
    v-if="hasPrimaryButton"
    :class="[
      primaryButtonClasses,
      buttonsVisible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
    ]"
  >
    <GameButton
      :label="primaryButtonLabel"
      :on-click="onPrimaryButtonClick"
      :revealed="buttonsVisible"
    >
      <slot name="primary">{{ primaryButtonLabel }}</slot>
    </GameButton>
  </div>

  <div
    v-if="hasSecondaryButton"
    :class="[
      secondaryButtonClasses,
      buttonsVisible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
    ]"
  >
    <GameButton
      variant="secondary"
      :label="secondaryButtonLabel"
      :on-click="onSecondaryButtonClick"
      :revealed="buttonsVisible"
    >
      <slot name="secondary">{{ secondaryButtonLabel }}</slot>
    </GameButton>
  </div>

  <div
    v-if="showUndo"
    :class="[
      undoButtonClasses,
      buttonsVisible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
    ]"
  >
    <GameButton
      variant="undo"
      :label="undoLabel"
      :on-click="onUndoClick"
      :revealed="buttonsVisible"
    >
      <slot name="undo">{{ undoLabel }}</slot>
    </GameButton>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useSlots } from 'vue';
import Parchment from '../parchment.vue';
import GameButton from '../ui/GameButton.vue';
import type { ButtonHandler } from '../../types/ui';
import { gameState } from '../../utils/gameStore';

const DICE_FACES = [
  { value: 0, x: 0, y: 0 },
  { value: 1, x: 0, y: -90 },
  { value: 1, x: -90, y: 0 },
  { value: 1, x: -90, y: 0 },
  { value: 1, x: -90, y: 0 },
  { value: 1, x: -90, y: 0 },
  { value: 2, x: 90, y: 0 },
  { value: 2, x: 90, y: 0 },
  { value: 2, x: 0, y: 90 },
  { value: 3, x: 0, y: 180 },
] as const;

const props = withDefaults(
  defineProps<{
    message?: string;
    showParchment?: boolean;
    primaryButtonLabel?: string;
    onPrimaryButtonClick?: ButtonHandler;
    secondaryButtonLabel?: string;
    onSecondaryButtonClick?: ButtonHandler;
    showUndo?: boolean;
    undoLabel?: string;
    onUndoClick?: ButtonHandler;
    rollDuration?: number;
    throwDice?: boolean;
    resultValue?: number;
    onRollComplete?: ((value: number) => void | Promise<void>) | undefined;
    sideChromeLayout?: boolean;
  }>(),
  {
    message: '',
    showParchment: true,
    primaryButtonLabel: '',
    onPrimaryButtonClick: undefined,
    secondaryButtonLabel: '',
    onSecondaryButtonClick: undefined,
    showUndo: false,
    throwDice: true,
    resultValue: undefined,
    undoLabel: 'Undo',
    onUndoClick: undefined,
    rollDuration: 1200,
    onRollComplete: undefined,
    sideChromeLayout: false,
  }
);

const slots = useSlots();

const shouldShowParchment = computed(
  () => props.showParchment && (Boolean(props.message) || Boolean(slots.message))
);
const hasPrimaryButton = computed(
  () => Boolean(props.primaryButtonLabel) || Boolean(slots.primary)
);
const hasSecondaryButton = computed(
  () => Boolean(props.secondaryButtonLabel) || Boolean(slots.secondary)
);
const parchmentClasses = computed(() => [
  'row-span-2 row-start-1',
  props.sideChromeLayout ? 'col-start-2 col-span-6' : 'col-start-3 col-span-4',
]);
const diceSlotLayoutClasses = computed(() =>
  props.sideChromeLayout ? 'col-start-2 col-span-6' : 'col-span-8'
);
const normalFullButtonClasses = computed(() =>
  props.sideChromeLayout ? 'col-start-2 col-span-6' : 'col-start-1 col-span-8'
);
const normalLeftButtonClasses = computed(() =>
  props.sideChromeLayout ? 'col-start-2 col-span-3' : 'col-start-1 col-span-4'
);
const normalRightButtonClasses = computed(() =>
  props.sideChromeLayout ? 'col-start-5 col-span-3' : 'col-start-5 col-span-4'
);
const normalButtonsShareFirstRow = computed(
  () => props.showUndo && hasPrimaryButton.value && hasSecondaryButton.value
);
const primaryButtonClasses = computed(() => [
  'transition-opacity duration-300',
  normalButtonsShareFirstRow.value
    ? `${normalLeftButtonClasses.value} row-start-7`
    : `${normalFullButtonClasses.value} ${hasSecondaryButton.value || props.showUndo ? 'row-start-7' : 'row-start-8'}`,
]);
const secondaryButtonClasses = computed(() => [
  'transition-opacity duration-300',
  normalButtonsShareFirstRow.value
    ? `${normalRightButtonClasses.value} row-start-7`
    : `${normalFullButtonClasses.value} ${props.showUndo ? 'row-start-7' : 'row-start-8'}`,
]);
const undoButtonClasses = computed(() => [
  'col-span-2 row-start-8 transition-opacity duration-300',
  props.sideChromeLayout ? 'col-start-2' : 'col-start-1',
]);
const diceVisible = ref(false);
const buttonsVisible = ref(false);
const hasRolled = ref(false);
const rotationX = ref(-22);
const rotationY = ref(32);
const translateY = ref('0rem');
const translateZ = ref('-5rem');

let rollTimer: number | null = null;

const diceStyle = computed(() => ({
  transform: `translate3d(0, ${translateY.value}, ${translateZ.value}) rotateX(${rotationX.value}deg) rotateY(${rotationY.value}deg)`,
  transitionDuration: `${props.rollDuration}ms`,
}));

function clearRollTimer() {
  if (rollTimer !== null) {
    window.clearTimeout(rollTimer);
    rollTimer = null;
  }
}

function clampDiceValue(value: number | null | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0;
  }

  return Math.min(3, Math.max(0, Math.round(value)));
}

function getFaceForValue(value: number) {
  return DICE_FACES.find((face) => face.value === value) ?? DICE_FACES[0];
}

function presentDice() {
  diceVisible.value = true;
  translateY.value = '-1rem';
  translateZ.value = '1.5rem';
}

function completeDiceState(result: number) {
  gameState.diceResult = result;
  buttonsVisible.value = true;
  void props.onRollComplete?.(result);
}

function showStoredDice(targetValue: number) {
  const currentValue = clampDiceValue(gameState.diceResult);
  const currentFace = getFaceForValue(currentValue);
  const targetFace = getFaceForValue(targetValue);
  const shouldAnimateTurn = gameState.diceResult !== null && targetValue !== currentValue;

  presentDice();
  rotationX.value = currentFace.x;
  rotationY.value = currentFace.y;

  if (!shouldAnimateTurn) {
    rotationX.value = targetFace.x;
    rotationY.value = targetFace.y;
    completeDiceState(targetValue);
    return;
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      rotationX.value = 360 + targetFace.x;
      rotationY.value = 360 + targetFace.y;
    });
  });

  clearRollTimer();
  rollTimer = window.setTimeout(() => {
    completeDiceState(targetValue);
  }, props.rollDuration);
}

function startRoll() {
  if (hasRolled.value) {
    return;
  }

  hasRolled.value = true;
  buttonsVisible.value = false;

  if (!props.throwDice) {
    showStoredDice(clampDiceValue(props.resultValue ?? gameState.diceResult));
    return;
  }

  const rolledFace = DICE_FACES[Math.floor(Math.random() * DICE_FACES.length)] ?? DICE_FACES[0];

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      presentDice();
      rotationX.value = 720 + rolledFace.x - 10;
      rotationY.value = 720 + rolledFace.y;
    });
  });

  clearRollTimer();
  rollTimer = window.setTimeout(() => {
    completeDiceState(rolledFace.value);
  }, props.rollDuration);
}

function handleParchmentShown() {
  startRoll();
}

onMounted(() => {
  if (!shouldShowParchment.value) {
    startRoll();
  }
});

onBeforeUnmount(() => {
  clearRollTimer();
});
</script>

<style scoped>
.dice-slot {
  container-type: size;
}

.dice-stage {
  --dice-size: min(60cqh, 60cqw, clamp(5.5rem, 28vw, 8rem));
  --dice-half-size: calc(var(--dice-size) / 2);
  flex: none;
  perspective: 900px;
  width: var(--dice-size);
  height: var(--dice-size);
}

.dice-cube {
  position: relative;
  width: 100%;
  height: 100%;
  /* background-color: red; */
  transform-style: preserve-3d;
  transition-property: transform, opacity;
  transition-timing-function: cubic-bezier(0.2, 0.9, 0.3, 1);
}

.dice-face {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  /*border: 1px solid currentColor;*/
  background: no-repeat url('/images/dice-bg.webp') center / contain;
  font-size: calc(var(--dice-size) / 2);
  font-weight: 700;
  border-radius: 2px;
  backface-visibility: hidden;
}

.dice-face--front {
  transform: translate3d(0, 0, var(--dice-half-size));
}

.dice-face--back {
  transform: rotateY(180deg) translate3d(0, 0, var(--dice-half-size));
}

.dice-face--right {
  transform: rotateY(90deg) translate3d(0, 0, var(--dice-half-size));
}

.dice-face--left {
  transform: rotateY(-90deg) translate3d(0, 0, var(--dice-half-size));
}

.dice-face--top {
  transform: rotateX(90deg) translate3d(0, 0, var(--dice-half-size));
}

.dice-face--bottom {
  transform: rotateX(-90deg) translate3d(0, 0, var(--dice-half-size));
}
</style>
