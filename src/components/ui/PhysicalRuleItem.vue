<template>
  <div class="physical-rule-item">
    <span class="physical-rule-item__label">{{ label }}</span>
    <span
      :class="['physical-rule-item__assets', double ? 'physical-rule-item__assets--double' : '']"
    >
      <img class="physical-rule-item__asset" :src="imageSrc" :alt="label" />
      <img
        v-if="double"
        class="physical-rule-item__asset"
        :src="imageSrc"
        alt=""
        aria-hidden="true"
      />
    </span>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string;
    imageSrc: string;
    double?: boolean;
  }>(),
  {
    double: false,
  }
);
</script>

<style scoped>
.physical-rule-item {
  display: flex;
  flex-direction: row;
  width: min(100%, 12rem);
  min-width: 0;
  grid-template-columns: minmax(clamp(2.65rem, 4.4cqw, 4.25rem), 0.8fr) auto;
  align-items: center;
  justify-content: center;
  gap: clamp(0.2rem, 0.9vmin, 0.62rem);
}

.physical-rule-item__label {
  min-width: 0;
  font-family: BackzoneDEMO, Georgia, serif;
  font-size: clamp(0.6rem, min(3.8cqh, 1.8cqw), 1.28rem);
  line-height: 1.08;
  hyphens: none;
  overflow-wrap: normal;
  text-align: right;
  text-wrap: nowrap;
  word-break: normal;
}

.physical-rule-item__assets {
  display: inline-grid;
  flex: 0 0 auto;
  width: clamp(1.65rem, min(15.5cqh, 5.5cqw), 4.15rem);
  aspect-ratio: 343 / 382;
  grid-template: 'stack';
  align-items: center;
  justify-items: center;
}

.physical-rule-item__assets--double {
  width: clamp(2.35rem, min(19cqh, 7.7cqw), 5.75rem);
  aspect-ratio: 1;
}

.physical-rule-item__asset {
  grid-area: stack;
  width: 72%;
  height: 100%;
  object-fit: contain;
}

.physical-rule-item__assets:not(.physical-rule-item__assets--double) .physical-rule-item__asset {
  width: 100%;
}

.physical-rule-item__assets--double .physical-rule-item__asset:first-child {
  transform: translateX(-22%);
}

.physical-rule-item__assets--double .physical-rule-item__asset:last-child {
  transform: translate(22%, 8%);
}

@media (orientation: landscape) and (max-height: 430px) {
  .physical-rule-item__label {
    font-size: clamp(0.5rem, min(3.2cqh, 1.55cqw), 0.96rem);
  }
}
</style>
