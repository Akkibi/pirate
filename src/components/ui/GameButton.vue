<template>
  <button type="button" :class="buttonClasses" :disabled="disabled" @click="handleClick">
    <span class="button-background" aria-hidden="true" />
    <span class="rivet rivet-top-left" aria-hidden="true" />
    <span class="rivet rivet-top-right" aria-hidden="true" />
    <span class="rivet rivet-bottom-left" aria-hidden="true" />
    <span class="rivet rivet-bottom-right" aria-hidden="true" />
    <span v-if="variant === 'undo'" class="relative z-20 flex h-5 w-5 items-center justify-center">
      <slot name="icon">
        <svg
          class="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M9 7L4 12L9 17"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M20 12H4"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </slot>
    </span>
    <span class="text-message relative z-20 flex-1 text-center">
      <slot>{{ resolvedLabel }}</slot>
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ButtonHandler } from '../../types/ui';

type ButtonVariant = 'primary' | 'secondary' | 'undo';

const props = withDefaults(
  defineProps<{
    label?: string;
    variant?: ButtonVariant;
    onClick?: ButtonHandler;
    disabled?: boolean;
  }>(),
  {
    label: '',
    variant: 'primary',
    onClick: undefined,
    disabled: false,
  }
);

const resolvedLabel = computed(() => {
  if (props.label) {
    return props.label;
  }

  return props.variant === 'undo' ? 'Undo' : '';
});

const buttonClasses = computed(() => [
  'game-button relative flex h-full min-h-0 w-full items-center justify-center overflow-hidden px-3 py-2 sm:px-4 sm:py-3 sm:text-xl transition-opacity',
  `game-button--${props.variant}`,
  props.variant === 'undo' ? 'gap-2 text-left' : '',
  props.disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
]);

function handleClick() {
  void props.onClick?.();
}
</script>

<style scoped lang="css">
.game-button {
  --button-bg: #71320e;
  --button-bg-hover: #5d2509;
  --button-border: #f3c15a;
  --button-text: #fff3cb;

  color: var(--button-text);
  border: 4px solid var(--button-border);
  border-radius: 1rem;
  corner-shape: scoop;
  background: #2a1107;
  text-shadow: 0 2px 0 rgba(31, 10, 2, 0.8);
  -webkit-tap-highlight-color: transparent;
}

.button-background {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  border-radius: calc(1rem - 2px);
  corner-shape: scoop;
  background: var(--button-bg);
  box-shadow:
    3px 3px 4px rgba(0, 0, 0, 0.8),
    inset 0 3px 0 rgba(255, 224, 133, 0.18);
  transition:
    background-color 120ms ease,
    box-shadow 120ms ease;
}

.rivet {
  position: absolute;
  z-index: 10;
  width: 0.35rem;
  height: 0.35rem;
  pointer-events: none;
  border-radius: 999px;
  background: var(--button-border);
  box-shadow:
    inset -1px -1px 1px rgba(80, 43, 5, 0.55),
    0 1px 2px rgba(0, 0, 0, 0.55);
}

.rivet-top-left {
  top: 0;
  left: 0;
}

.rivet-top-right {
  top: 0;
  right: 0;
}

.rivet-bottom-left {
  bottom: 0;
  left: 0;
}

.rivet-bottom-right {
  right: 0;
  bottom: 0;
}

.text-message {
  line-height: 1.05;
  transition: transform 120ms ease;
}

.game-button:not(:disabled):hover .button-background,
.game-button:not(:disabled):active .button-background {
  background: var(--button-bg-hover);
  box-shadow:
    inset 3px 3px 4px rgba(0, 0, 0, 0.82),
    inset 0 -2px 0 rgba(255, 224, 133, 0.1);
}

.game-button:not(:disabled):hover .text-message,
.game-button:not(:disabled):active .text-message {
  transform: translateY(2px);
}

.game-button:focus-visible {
  outline: 3px solid rgba(255, 244, 205, 0.95);
  outline-offset: 4px;
}

.game-button--secondary {
  --button-bg: #5d3820;
  --button-bg-hover: #472514;
  --button-border: #d7a75b;
}

.game-button--undo {
  --button-bg: #6b2618;
  --button-bg-hover: #50170f;
  --button-border: #e7a45e;
}

@media (min-width: 1024px) {
  .game-button {
    border-radius: 2rem;
  }

  .button-background {
    border-radius: calc(2rem - 2px);
  }

  .rivet {
    width: 0.75rem;
    height: 0.75rem;
  }
}
</style>
