<template>
  <button type="button" :class="buttonClasses" :disabled="disabled" @click="handleClick">
    <span class="button-background" aria-hidden="true" />
    <span class="rivet rivet-top-left" aria-hidden="true" />
    <span class="rivet rivet-top-right" aria-hidden="true" />
    <span class="rivet rivet-bottom-left" aria-hidden="true" />
    <span class="rivet rivet-bottom-right" aria-hidden="true" />
    <span
      v-if="variant === 'undo'"
      class="button-icon relative z-20 flex h-5 w-5 items-center justify-center"
    >
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
import { playSound } from '../../utils/soundManager';

type ButtonVariant = 'primary' | 'secondary' | 'undo';

const props = withDefaults(
  defineProps<{
    label?: string;
    variant?: ButtonVariant;
    onClick?: ButtonHandler;
    disabled?: boolean;
    revealed?: boolean;
  }>(),
  {
    label: '',
    variant: 'primary',
    onClick: undefined,
    disabled: false,
    revealed: true,
  }
);

const resolvedLabel = computed(() => {
  if (props.label) {
    return props.label;
  }

  return props.variant === 'undo' ? 'Undo' : '';
});

const buttonClasses = computed(() => [
  'game-button relative flex h-full min-h-0 w-full items-center justify-center overflow-visible transition-opacity',
  `game-button--${props.variant}`,
  props.revealed ? 'game-button--revealed' : 'game-button--concealed',
  props.variant === 'undo' ? 'gap-2 text-left' : '',
  props.disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
]);

function handleClick() {
  if (!props.disabled) {
    playSound('uiClick');
  }

  void props.onClick?.();
}
</script>

<style scoped lang="css">
.game-button {
  --button-bg: #71320e;
  --button-bg-hover: #5d2509;
  --button-border: #f3c15a;
  --button-border-width: var(--ui-button-border-width);
  --button-scoop: var(--ui-button-scoop);
  --button-scoop-mask:
    radial-gradient(
        circle at 0 0,
        transparent 0 var(--button-scoop),
        #000 calc(var(--button-scoop) + 1px)
      )
      top left / 51% 51% no-repeat,
    radial-gradient(
        circle at 100% 0,
        transparent 0 var(--button-scoop),
        #000 calc(var(--button-scoop) + 1px)
      )
      top right / 51% 51% no-repeat,
    radial-gradient(
        circle at 0 100%,
        transparent 0 var(--button-scoop),
        #000 calc(var(--button-scoop) + 1px)
      )
      bottom left / 51% 51% no-repeat,
    radial-gradient(
        circle at 100% 100%,
        transparent 0 var(--button-scoop),
        #000 calc(var(--button-scoop) + 1px)
      )
      bottom right / 51% 51% no-repeat;
  --button-text: #fff3cb;

  color: var(--button-text);
  isolation: isolate;
  opacity: 0;
  border: var(--button-border-width) solid transparent;
  border-radius: var(--button-scoop);
  background: transparent;
  font-size: var(--ui-button-font-size);
  line-height: 1;
  padding: var(--ui-button-padding-y) var(--ui-button-padding-x);
  text-shadow: 0 2px 0 rgba(31, 10, 2, 0.8);
  transform: translate3d(0, 0.55rem, 0) scale(0.985);
  transition:
    opacity 140ms ease,
    transform 420ms cubic-bezier(0.16, 0.92, 0.18, 1);
  -webkit-tap-highlight-color: transparent;
}

.game-button::before {
  position: absolute;
  inset: calc(-1 * var(--button-border-width));
  z-index: 0;
  pointer-events: none;
  background: var(--button-border);
  content: '';
  -webkit-mask: var(--button-scoop-mask);
  mask: var(--button-scoop-mask);
  filter: drop-shadow(0 0 0 rgba(0, 0, 0, 0));
  transition: filter 420ms cubic-bezier(0.16, 0.92, 0.18, 1);
}

.game-button--revealed {
  opacity: 1;
  transform: translate3d(0, 0, 0) scale(1);
}

.game-button--revealed::before {
  filter: drop-shadow(0 0.22rem 0.1rem rgba(38, 14, 3, 0.55));
}

.game-button--revealed:disabled {
  opacity: 0.4;
}

.button-background {
  --button-scoop: var(--ui-button-inner-scoop);

  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: var(--button-bg);
  opacity: 0;
  transform: translate3d(0, 0.45rem, 0) scaleY(0.78);
  transform-origin: center bottom;
  box-shadow: inset 0 3px 0 rgba(255, 224, 133, 0.18);
  -webkit-mask: var(--button-scoop-mask);
  mask: var(--button-scoop-mask);
  filter: drop-shadow(3px 3px 4px rgba(0, 0, 0, 0.8));
  transition:
    opacity 220ms ease,
    transform 360ms cubic-bezier(0.16, 0.92, 0.18, 1.08),
    background-color 120ms ease,
    box-shadow 120ms ease,
    filter 120ms ease;
  transition-delay: 0ms;
}

.game-button--revealed .button-background {
  opacity: 1;
  transform: translate3d(0, 0, 0) scaleY(1);
  transition-delay: 110ms, 110ms, 0ms, 110ms, 110ms;
}

.rivet {
  position: absolute;
  z-index: 20;
  width: var(--ui-button-rivet-size);
  height: var(--ui-button-rivet-size);
  pointer-events: none;
  border-radius: 999px;
  background: var(--button-border);
  box-shadow:
    inset -1px -1px 1px rgba(80, 43, 5, 0.55),
    0 1px 2px rgba(0, 0, 0, 0.55);
  opacity: 0;
  transform: translate3d(0, 0.2rem, 0) scale(0.55);
  transition:
    opacity 160ms ease,
    transform 260ms cubic-bezier(0.16, 0.92, 0.18, 1.1);
}

.game-button--revealed .rivet {
  opacity: 1;
  transform: translate3d(0, 0, 0) scale(1);
  transition-delay: 60ms;
}

.rivet-top-left {
  top: 0rem;
  left: 0rem;
}

.rivet-top-right {
  top: 0rem;
  right: 0rem;
}

.rivet-bottom-left {
  bottom: 0rem;
  left: 0rem;
}

.rivet-bottom-right {
  right: 0rem;
  bottom: 0rem;
}

.text-message {
  line-height: 1.05;
  opacity: 0;
  transform: translate3d(0, 0.45rem, 0);
  transition:
    opacity 180ms ease,
    transform 300ms cubic-bezier(0.16, 0.92, 0.18, 1.05);
}

.button-icon {
  width: calc(var(--ui-button-font-size) * 1.15);
  height: calc(var(--ui-button-font-size) * 1.15);
  opacity: 0;
  transform: translate3d(0, 0.45rem, 0);
  transition:
    opacity 180ms ease,
    transform 300ms cubic-bezier(0.16, 0.92, 0.18, 1.05);
}

.game-button--revealed .text-message,
.game-button--revealed .button-icon {
  opacity: 1;
  transform: translate3d(0, 0, 0);
  transition-delay: 230ms;
}

.game-button:not(:disabled):hover .button-background,
.game-button:not(:disabled):active .button-background {
  background: var(--button-bg-hover);
  box-shadow:
    inset 3px 3px 4px rgba(0, 0, 0, 0.82),
    inset 0 -2px 0 rgba(255, 224, 133, 0.1);
  filter: drop-shadow(0 0 0 rgba(0, 0, 0, 0));
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
</style>
