<template>
  <button type="button" :class="buttonClasses" @click="handleClick">
    <span
      v-if="variant === 'undo'"
      class="flex h-5 w-5 items-center justify-center"
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
    <span class="flex-1 text-center">
      <slot>{{ resolvedLabel }}</slot>
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ButtonHandler } from "../../types/ui";

type ButtonVariant = "primary" | "secondary" | "undo";

const props = withDefaults(
  defineProps<{
    label?: string;
    variant?: ButtonVariant;
    onClick?: ButtonHandler;
  }>(),
  {
    label: "",
    variant: "primary",
    onClick: undefined,
  },
);

const resolvedLabel = computed(() => {
  if (props.label) {
    return props.label;
  }

  return props.variant === "undo" ? "Undo" : "";
});

const buttonClasses = computed(() => [
  "flex h-full min-h-0 w-full cursor-pointer bg-red-800 items-center justify-center px-3 py-2 text-sm sm:px-4 sm:py-3 sm:text-base",
  props.variant === "undo" ? "gap-2 text-left" : "",
]);

function handleClick() {
  void props.onClick?.();
}
</script>
