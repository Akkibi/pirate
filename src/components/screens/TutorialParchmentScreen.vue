<template>
  <div v-if="showParchment" :class="parchmentClasses">
    <FullScreenParchment
      content-class="tutorial-parchment flex h-full items-center justify-center"
      @shown="handleParchmentShown"
    >
      <article class="tutorial-card">
        <img class="tutorial-square-image" :src="imageSrc" :alt="imageAlt" />
        <div class="tutorial-copy">
          <h1 class="tutorial-title font-title">{{ title }}</h1>
          <p v-if="body" class="tutorial-body">{{ body }}</p>
          <ul v-if="items.length" class="tutorial-list">
            <li v-for="item in items" :key="item">{{ item }}</li>
          </ul>
          <p v-if="caption" class="tutorial-caption">{{ caption }}</p>
        </div>
      </article>
    </FullScreenParchment>
  </div>

  <div
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
</template>

<script setup lang="ts">
import { computed, onMounted, ref, useSlots } from 'vue';
import GameButton from '../ui/GameButton.vue';
import FullScreenParchment from '../ui/FullScreenParchment.vue';
import type { ButtonHandler } from '../../types/ui';

const props = withDefaults(
  defineProps<{
    title: string;
    body: string;
    caption?: string;
    items?: readonly string[];
    imageSrc: string;
    imageAlt: string;
    showParchment?: boolean;
    primaryButtonLabel?: string;
    onPrimaryButtonClick?: ButtonHandler;
    secondaryButtonLabel?: string;
    onSecondaryButtonClick?: ButtonHandler;
    sideChromeLayout?: boolean;
  }>(),
  {
    caption: '',
    items: () => [],
    showParchment: true,
    primaryButtonLabel: '',
    onPrimaryButtonClick: undefined,
    secondaryButtonLabel: '',
    onSecondaryButtonClick: undefined,
    sideChromeLayout: false,
  }
);

const slots = useSlots();
const buttonsVisible = ref(false);

const hasSecondaryButton = computed(
  () => Boolean(props.secondaryButtonLabel) || Boolean(slots.secondary)
);
const parchmentClasses = computed(() => [
  props.sideChromeLayout
    ? 'col-start-2 col-span-6 row-start-1 row-span-6'
    : 'col-start-1 col-span-8 row-start-2 row-span-4',
]);
const fullButtonClasses = computed(() =>
  props.sideChromeLayout ? 'col-start-2 col-span-6' : 'col-start-1 col-span-8'
);
const leftButtonClasses = computed(() =>
  props.sideChromeLayout ? 'col-start-2 col-span-3' : 'col-start-1 col-span-4'
);
const rightButtonClasses = computed(() =>
  props.sideChromeLayout ? 'col-start-5 col-span-3' : 'col-start-5 col-span-4'
);
const primaryButtonClasses = computed(() => [
  'transition-opacity duration-300',
  `${hasSecondaryButton.value ? rightButtonClasses.value : fullButtonClasses.value} row-start-7`,
]);
const secondaryButtonClasses = computed(() => [
  'transition-opacity duration-300',
  `${leftButtonClasses.value} row-start-7`,
]);

function handleParchmentShown() {
  buttonsVisible.value = true;
}

onMounted(() => {
  if (!props.showParchment) {
    buttonsVisible.value = true;
  }
});
</script>

<style scoped>
:deep(.tutorial-parchment) {
  padding: clamp(1rem, 3vw, 2.4rem) clamp(1.2rem, 4vw, 4.4rem);
  text-align: center;
}

.tutorial-card {
  display: flex;
  width: min(100%, 58rem);
  height: 100%;
  max-height: 100%;
  min-height: 0;
  grid-template-columns: minmax(8rem, 0.9fr) minmax(0, 1fr);
  gap: clamp(1rem, 3vw, 2.6rem);
  align-items: center;
  justify-content: center;
  color: #61220e;
  text-align: left;
}

.tutorial-title {
  min-width: 0;
  font-size: clamp(2.7rem, 6.2vw, 6.4rem);
  line-height: 1;
  overflow-wrap: anywhere;
  text-wrap: balance;
  background-color: #371412;
  color: transparent;
  text-shadow: 1px 1px 1px rgba(255, 255, 255, 0.2);
  filter: saturate(1.5);
  -webkit-background-clip: text;
  background-clip: text;
}

.tutorial-body {
  max-width: min(100%, 51rem);
  min-width: 0;
  font-size: clamp(1rem, 1.9vw, 2.2rem);
  font-weight: 900;
  line-height: 1.08;
  overflow-wrap: anywhere;
  text-wrap: pretty;
}

.tutorial-list {
  display: grid;
  gap: 0.2rem;
  margin: 0;
  /* padding-left: clamp(1.15rem, 2vw, 2rem); */
  font-size: clamp(0.95rem, 1.75vw, 2rem);
  font-weight: 900;
  line-height: 1.08;
  overflow-wrap: anywhere;
  text-wrap: pretty;
}

.tutorial-caption {
  max-width: min(100%, 36rem);
  min-width: 0;
  font-size: clamp(0.7rem, 1.05vw, 1rem);
  font-weight: 900;
  line-height: 1.1;
  overflow-wrap: anywhere;
  text-wrap: pretty;
}

.tutorial-square-image {
  width: 100%;
  height: 80%;
  border-radius: 23px;
  aspect-ratio: 1;
  object-fit: contain;
  object-position: top;
}

.tutorial-copy {
  display: grid;
  align-content: center;
  min-width: 0;
  max-height: 100%;
  gap: clamp(0.55rem, 1.5vw, 1rem);
}

@media (max-width: 760px) {
  .tutorial-card {
    grid-template-columns: minmax(0, 1fr);
    text-align: center;
  }

  .tutorial-square-image {
    width: min(100%, 18rem);
    height: auto;
    justify-self: center;
  }

  .tutorial-title,
  .tutorial-body,
  .tutorial-list,
  .tutorial-caption {
    text-align: center;
    text-wrap: balance;
  }

  .tutorial-list {
    list-style-position: inside;
    padding-left: 0;
  }
}
</style>
