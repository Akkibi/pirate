<template>
  <Parchment
    size="fill"
    surface-class="h-full"
    :content-class="contentClass"
    @shown="$emit('shown')"
  >
    <slot />
  </Parchment>
</template>

<script setup lang="ts">
import Parchment from '../parchment.vue';

withDefaults(
  defineProps<{
    contentClass?: string;
  }>(),
  {
    contentClass: '',
  }
);

defineEmits<{
  (event: 'shown'): void;
}>();
</script>
