<template>
  <div :class="gridClasses">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    overlay?: boolean;
    pointerEvents?: 'auto' | 'none';
    padded?: boolean;
  }>(),
  {
    overlay: false,
    pointerEvents: 'none',
    padded: true,
  }
);

const gridClasses = computed(() => [
  'screen-grid grid h-full min-h-0 w-full grid-cols-[repeat(8,minmax(0,1fr))] grid-rows-[repeat(8,minmax(0,1fr))] overflow-hidden',
  props.overlay ? 'absolute inset-0 z-20' : 'relative',
  props.pointerEvents === 'none' ? 'pointer-events-none' : 'pointer-events-auto',
  props.padded ? 'screen-grid--padded' : '',
]);
</script>

<style scoped>
.screen-grid--padded {
  gap: var(--ui-grid-gap);
  padding: var(--ui-grid-padding);
}
</style>
