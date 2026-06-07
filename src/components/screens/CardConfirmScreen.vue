<template>
  <div :class="parchmentClasses">
    <Parchment
      size="fill"
      surface-class="h-full"
      content-class="flex h-full items-center justify-center text-center"
      @shown="buttonsVisible = true"
    >
      <div class="card-confirm-content">
        <p class="screen-message-title font-title">
          {{ resolvedTitle }}
        </p>

        <img
          v-if="card.imageSrc"
          class="card-confirm-image"
          :src="card.imageSrc"
          :alt="card.imageAlt ?? card.title"
        />

        <div v-else class="card-confirm-fallback">
          <div class="mb-3 flex items-start justify-between gap-3">
            <h2 class="text-left text-xl font-bold leading-tight">{{ card.title }}</h2>
            <span class="rounded bg-amber-950/20 px-2 py-1 text-xs uppercase">
              {{ card.phaseLabel }}
            </span>
          </div>
          <p class="text-left text-sm leading-relaxed">{{ card.caption }}</p>
        </div>
        <p v-if="resolvedBody" class="card-confirm-body max-w-xl">
          {{ resolvedBody }}
        </p>
      </div>
    </Parchment>
  </div>
  <div
    :class="[
      'row-start-7 transition-opacity duration-300',
      confirmButtonLayoutClasses,
      buttonsVisible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
    ]"
  >
    <GameButton :label="resolvedConfirmLabel" :on-click="onConfirm" :revealed="buttonsVisible" />
  </div>

  <div
    :class="[
      'row-start-7 transition-opacity duration-300',
      cancelButtonLayoutClasses,
      buttonsVisible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
    ]"
  >
    <GameButton
      variant="secondary"
      :label="resolvedCancelLabel"
      :on-click="onCancel"
      :revealed="buttonsVisible"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import Parchment from '../parchment.vue';
import GameButton from '../ui/GameButton.vue';
import type { TreasureCardView } from '../../utils/treasureCards';
import type { ButtonHandler } from '../../types/ui';
import { gameText } from '../../content/gameText';

const props = withDefaults(
  defineProps<{
    title?: string;
    body?: string;
    card: TreasureCardView;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm?: ButtonHandler;
    onCancel?: ButtonHandler;
    sideChromeLayout?: boolean;
  }>(),
  {
    title: undefined,
    body: undefined,
    confirmLabel: undefined,
    cancelLabel: undefined,
    onConfirm: undefined,
    onCancel: undefined,
    sideChromeLayout: false,
  }
);

const buttonsVisible = ref(false);
const resolvedTitle = computed(() => props.title ?? gameText.cards.confirmTitle);
const resolvedBody = computed(() => props.body ?? gameText.cards.confirmBody);
const resolvedConfirmLabel = computed(() => props.confirmLabel ?? gameText.common.confirm);
const resolvedCancelLabel = computed(() => props.cancelLabel ?? gameText.common.cancel);
const parchmentClasses = computed(() => [
  'row-span-4 row-start-2',
  props.sideChromeLayout ? 'col-start-2 col-span-6' : 'col-span-8',
]);
const cancelButtonLayoutClasses = computed(() =>
  props.sideChromeLayout ? 'col-start-2 col-span-3' : 'col-start-1 col-span-4'
);
const confirmButtonLayoutClasses = computed(() =>
  props.sideChromeLayout ? 'col-start-5 col-span-3' : 'col-start-5 col-span-4'
);
</script>

<style scoped>
.screen-message-title {
  font-size: var(--ui-message-title-size);
  line-height: 0.95;
  filter: drop-shadow(0 4px 4px rgba(0, 0, 0, 0.25));
}

.card-confirm-content {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(0.25rem, 1.15vmin, 0.7rem);
  overflow: hidden;
  text-align: center;
}

.card-confirm-image {
  display: block;
  width: auto;
  height: min(60%, 16rem);
  max-width: min(68%, 15rem);
  object-fit: contain;
  filter: drop-shadow(0 0.22rem 0.22rem rgba(0, 0, 0, 0.18));
}

.card-confirm-fallback {
  width: min(100%, 32rem);
  border: 2px solid #f1b730;
  border-radius: 0.375rem;
  background: #472422;
  padding: clamp(0.65rem, 1.5vmin, 1rem);
  color: #fff3cb;
}

.card-confirm-body {
  width: min(100%, 52rem);
  min-width: 0;
  font-size: var(--ui-message-body-size);
  line-height: 1.22;
  white-space: normal;
  overflow-wrap: anywhere;
  hyphens: auto;
  text-wrap: pretty;
}
</style>
