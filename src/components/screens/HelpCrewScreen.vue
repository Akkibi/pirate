<template>
  <section :class="panelClasses" aria-labelledby="help-crew-title">
    <FullScreenParchment content-class="help-crew-parchment-content" @shown="handleParchmentShown">
      <div class="help-crew-panel">
        <div class="help-crew-copy">
          <h1 id="help-crew-title" class="help-crew-title font-title">
            {{ helpCrewText.title }}
          </h1>
          <p class="help-crew-intro">
            {{ helpCrewText.body }}
          </p>
        </div>

        <div class="help-crew-options">
          <article class="help-crew-option">
            <h2 class="help-crew-option-title">{{ details.placeTitle }}</h2>
            <div class="help-crew-stack" :aria-label="placeOneSetLabel">
              <PhysicalRuleItem
                :label="details.oneMonster"
                image-src="/images/physical_assets/octopus.webp"
              />
              <span class="help-crew-separator help-crew-separator--first" aria-hidden="true">
                +
              </span>
              <PhysicalRuleItem
                :label="details.oneIsland"
                image-src="/images/physical_assets/island.webp"
              />
              <span class="help-crew-separator help-crew-separator--second" aria-hidden="true">
                +
              </span>
              <PhysicalRuleItem
                :label="details.oneTyphoon"
                image-src="/images/physical_assets/typhon.webp"
              />
            </div>
          </article>

          <article class="help-crew-option">
            <h2 class="help-crew-option-title">{{ details.placeTitle }}</h2>
            <div class="help-crew-stack" :aria-label="placeTwoSetLabel">
              <PhysicalRuleItem
                :label="details.twoMonsters"
                image-src="/images/physical_assets/octopus.webp"
                double
              />
              <span
                class="help-crew-separator help-crew-separator--word help-crew-separator--first"
              >
                {{ details.or }}
              </span>
              <PhysicalRuleItem
                :label="details.twoIslands"
                image-src="/images/physical_assets/island.webp"
                double
              />
              <span
                class="help-crew-separator help-crew-separator--word help-crew-separator--second"
              >
                {{ details.or }}
              </span>
              <PhysicalRuleItem
                :label="details.twoTyphoons"
                image-src="/images/physical_assets/typhon.webp"
                double
              />
            </div>
          </article>

          <article class="help-crew-option help-crew-option--centered">
            <h2 class="help-crew-option-title">{{ details.moveTitle }}</h2>
            <div class="help-crew-single-asset" aria-hidden="true">
              <img src="/images/physical_assets/move.png" alt="" />
            </div>
          </article>

          <article class="help-crew-option help-crew-option--centered">
            <h2 class="help-crew-option-title help-crew-option-title--small">
              {{ details.swapTitle }}
            </h2>
            <div class="help-crew-swap" aria-hidden="true">
              <img src="/images/physical_assets/exchange.png" alt="" />
            </div>
          </article>
        </div>

        <p class="help-crew-footer">
          {{ details.footer }}
        </p>
      </div>
    </FullScreenParchment>
  </section>

  <div
    :class="[
      buttonClasses,
      buttonsVisible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
    ]"
  >
    <GameButton
      :label="primaryButtonLabel"
      :on-click="onPrimaryButtonClick"
      :revealed="buttonsVisible"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import GameButton from '../ui/GameButton.vue';
import FullScreenParchment from '../ui/FullScreenParchment.vue';
import PhysicalRuleItem from '../ui/PhysicalRuleItem.vue';
import { gameText } from '../../content/gameText';
import type { ButtonHandler } from '../../types/ui';

const props = withDefaults(
  defineProps<{
    primaryButtonLabel?: string;
    onPrimaryButtonClick?: ButtonHandler;
    sideChromeLayout?: boolean;
  }>(),
  {
    primaryButtonLabel: '',
    onPrimaryButtonClick: undefined,
    sideChromeLayout: false,
  }
);

const buttonsVisible = ref(false);
const helpCrewText = computed(() => gameText.turn1.parrot.helpCrew);
const details = computed(() => gameText.turn1.parrot.helpCrew.details);
const placeOneSetLabel = computed(
  () => `${details.value.oneMonster}, ${details.value.oneIsland}, ${details.value.oneTyphoon}`
);
const placeTwoSetLabel = computed(
  () =>
    `${details.value.twoMonsters}, ${details.value.or} ${details.value.twoIslands}, ${details.value.or} ${details.value.twoTyphoons}`
);
const panelClasses = computed(() => [
  'help-crew-screen',
  props.sideChromeLayout
    ? 'col-start-2 col-span-6 row-start-1 row-span-7'
    : 'col-start-1 col-span-8 row-start-1 row-span-7',
]);
const buttonClasses = computed(() => [
  'transition-opacity duration-300',
  props.sideChromeLayout
    ? 'col-start-2 col-span-6 row-start-8'
    : 'col-start-1 col-span-8 row-start-8',
]);

function handleParchmentShown() {
  buttonsVisible.value = true;
}
</script>

<style scoped>
.help-crew-screen {
  container-type: size;
  min-height: 0;
  overflow: hidden;
  pointer-events: auto;
}

.help-crew-screen :deep(.help-crew-parchment-content) {
  padding: clamp(0.32rem, 1.35vmin, 0.9rem) clamp(1.3rem, 4.8vmin, 3.25rem);
}

.help-crew-panel {
  container-type: size;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  width: 100%;
  min-height: 0;
  min-width: 0;
  gap: clamp(0.28rem, 1.4cqh, 0.8rem);
  overflow: hidden;
  color: #61220e;
  text-align: center;
}

.help-crew-copy {
  min-width: 0;
}

.help-crew-title {
  margin: 0;
  font-size: clamp(1rem, min(8.2cqh, 4.25cqw), 3.1rem);
  line-height: 1.05;
  text-transform: uppercase;
}

.help-crew-intro,
.help-crew-footer {
  margin: 0;
  font-size: clamp(0.66rem, min(3.8cqh, 1.95cqw), 1.35rem);
  line-height: 1.04;
}

.help-crew-options {
  display: grid;
  flex: 0 1 auto;
  width: min(100%, 68rem);
  height: clamp(14rem, 45cqh, 34rem);
  min-height: clamp(12rem, 38cqh, 20rem);
  max-height: 58cqh;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: stretch;
  justify-content: center;
  gap: clamp(0.45rem, 1.8cqw, 1.75rem);
  margin-inline: auto;
  padding-inline: clamp(0.75rem, 2cqw, 2rem);
}

.help-crew-option {
  display: grid;
  width: 100%;
  min-width: 0;
  min-height: 0;
  padding-top: 0.2rem;
  grid-template-rows: auto minmax(0, 1fr);
  align-items: center;
  justify-items: center;
  text-align: center;
}

.help-crew-option--centered {
  align-items: center;
}

.help-crew-option-title {
  align-self: start;
  margin: 0;
  max-width: 100%;
  font-family: BackzoneDEMO, Georgia, serif;
  font-size: clamp(0.68rem, min(4.2cqh, 1.85cqw), 1.42rem);
  font-weight: 400;
  line-height: 1.08;
  text-wrap: balance;
}

.help-crew-option-title--small {
  max-width: 11rem;
  font-size: clamp(0.58rem, min(3.7cqh, 1.65cqw), 1.08rem);
}

.help-crew-stack {
  position: relative;
  align-self: center;
  display: grid;
  width: min(100%, 13rem);
  height: min(100%, clamp(9rem, 36cqh, 19rem));
  min-height: 0;
  grid-template-rows: repeat(3, minmax(0, 1fr));
  align-items: center;
  justify-items: center;
  gap: clamp(0.02rem, 0.28cqh, 0.12rem);
}

.help-crew-separator {
  position: absolute;
  left: 50%;
  font-size: clamp(0.62rem, min(3.4cqh, 1.55cqw), 1.16rem);
  line-height: 1;
  transform: translate(-50%, -50%);
}

.help-crew-separator--first {
  top: 33.333%;
}

.help-crew-separator--second {
  top: 66.666%;
}

.help-crew-separator--word {
  font-size: clamp(0.48rem, min(2.6cqh, 1.18cqw), 0.86rem);
}

.help-crew-single-asset {
  position: relative;
  align-self: center;
  width: min(100%, clamp(5.4rem, min(36cqh, 15cqw), 11.5rem));
  aspect-ratio: 1.05;
}

.help-crew-single-asset img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.help-crew-swap {
  position: relative;
  align-self: center;
  width: min(100%, clamp(5.4rem, min(36cqh, 15cqw), 11.5rem));
  aspect-ratio: 1.05;
}

.help-crew-swap img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

@media (orientation: landscape) and (max-height: 430px) {
  .help-crew-screen :deep(.help-crew-parchment-content) {
    padding: clamp(0.5rem, 1vmin, 0.7rem) clamp(1rem, 4vmin, 2.25rem);
  }

  .help-crew-options {
    height: clamp(10rem, 50cqh, 14rem);
    min-height: 0;
  }

  .help-crew-title {
    font-size: clamp(0.8rem, min(7.4cqh, 3.7cqw), 2.15rem);
  }

  .help-crew-intro,
  .help-crew-footer {
    font-size: clamp(0.52rem, min(3.3cqh, 1.6cqw), 1rem);
  }
}

@media (min-width: 1024px) and (min-height: 620px) {
  .help-crew-screen :deep(.parchment-root--fill) {
    width: min(100%, 145cqh);
    height: min(100%, 88cqh);
  }
}
</style>
