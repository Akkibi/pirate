<template>
  <div
    class="pointer-events-auto col-span-4 col-start-1 row-start-8 flex min-h-0 flex-wrap items-end gap-2 self-end"
  >
    <button
      class="bg-amber-700 min-w-20 p-1 px-2 text-amber-100 font-black border-3 border-amber-900"
      @click="toggleEntityVisibility"
    >
      {{ gameState.entitiesVisible ? 'Hide' : 'Show' }}
    </button>
    <button
      class="bg-amber-700 min-w-30 p-1 px-2 text-amber-100 font-black border-3 border-amber-900"
      @click="toggleTurn"
    >
      <span class="text-xs opacity-55"> Turn : </span>
      {{ gameState.currentPhase === 'crew' ? 'Crew' : 'Parrot' }}
    </button>
    <button
      class="bg-amber-700 min-w-24 p-1 px-2 text-amber-100 font-black border-3 border-amber-900"
      @click="toggleFocus"
    >
      {{ gameState.focusedView ? 'Focus' : 'Unfocussed' }}
    </button>
    <button
      class="bg-amber-700 min-w-24 p-1 px-2 text-amber-100 font-black border-3 border-amber-900"
      @click="toggleArrows"
    >
      <span class="text-xs opacity-55">Arrows are :</span>
      {{ gameState.displayArrows ? 'On' : 'Off' }}
    </button>
    <button
      class="bg-amber-700 min-w-24 p-1 px-2 text-amber-100 font-black border-3 border-amber-900"
      @click="toggleCorsair"
    >
      <span class="text-xs opacity-55">Corsair :</span>
      {{ gameState.displayCorsair ? 'On' : 'Off' }}
    </button>
    <button
      class="bg-amber-700 min-w-24 p-1 px-2 text-amber-100 font-black border-3 border-amber-900"
      @click="gameState.displayCannons = !gameState.displayCannons"
    >
      <span class="text-xs opacity-55">Cannons :</span>
      {{ gameState.displayCannons ? 'On' : 'Off' }}
    </button>
    <button
      class="bg-amber-700 min-w-24 p-1 px-2 text-amber-100 font-black border-3 border-amber-900"
      @click="gameState.displayBottle = !gameState.displayBottle"
    >
      <span class="text-xs opacity-55">Bottle :</span>
      {{ gameState.displayBottle ? 'On' : 'Off' }}
    </button>
  </div>
  <div
    class="pointer-events-auto col-span-4 col-start-5 row-span-2 row-start-7 flex min-h-0 items-end justify-end gap-2 self-end"
  >
    <div class="flex flex-col items-center gap-1">
      <span class="text-xs font-black text-amber-900">Corsair</span>
      <div class="relative flex items-center justify-center gap-2">
        <div
          class="absolute inset-0 h-full w-full scale-75 rounded-[40%] border-3 border-amber-900 bg-amber-950"
        ></div>
        <button
          class="relative min-w-16 border-3 border-amber-900 bg-amber-700 p-1 px-2 font-black text-amber-100"
          @click="moveCorsair('left')"
        >
          Left
        </button>
        <div class="flex flex-col gap-2">
          <button
            class="relative min-w-16 border-3 border-amber-900 bg-amber-700 p-1 px-2 font-black text-amber-100"
            @click="moveCorsair('up')"
          >
            Up
          </button>
          <button
            class="relative min-w-16 border-3 border-amber-900 bg-amber-700 p-1 px-2 font-black text-amber-100"
            @click="moveCorsair('down')"
          >
            Down
          </button>
        </div>
        <button
          class="relative min-w-16 border-3 border-amber-900 bg-amber-700 p-1 px-2 font-black text-amber-100"
          @click="moveCorsair('right')"
        >
          Right
        </button>
      </div>
    </div>
    <div class="flex flex-col items-center gap-1">
      <span class="text-xs font-black text-amber-900">Player</span>
      <div class="relative flex items-center justify-center gap-2">
        <div
          class="absolute inset-0 h-full w-full scale-75 rounded-[40%] border-3 border-amber-900 bg-amber-950"
        ></div>
        <button
          class="relative min-w-16 border-3 border-amber-900 bg-amber-700 p-1 px-2 font-black text-amber-100"
          @click="movePlayer('left')"
        >
          Left
        </button>
        <div class="flex flex-col gap-2">
          <button
            class="relative min-w-16 border-3 border-amber-900 bg-amber-700 p-1 px-2 font-black text-amber-100"
            @click="movePlayer('up')"
          >
            Up
          </button>
          <button
            class="relative min-w-16 border-3 border-amber-900 bg-amber-700 p-1 px-2 font-black text-amber-100"
            @click="movePlayer('down')"
          >
            Down
          </button>
        </div>
        <button
          class="relative min-w-16 border-3 border-amber-900 bg-amber-700 p-1 px-2 font-black text-amber-100"
          @click="movePlayer('right')"
        >
          Right
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { gameState } from '../utils/gameStore';

const moveCorsair = (direction: string) => {
  switch (direction) {
    case 'left':
      gameState.corsairPosition.y -= 1;
      break;
    case 'right':
      gameState.corsairPosition.y += 1;
      break;
    case 'up':
      gameState.corsairPosition.x += 1;
      break;
    case 'down':
      gameState.corsairPosition.x -= 1;
      break;
  }
};

const movePlayer = (direction: string) => {
  switch (direction) {
    case 'left':
      gameState.userPosition.y -= 1;
      break;
    case 'right':
      gameState.userPosition.y += 1;
      break;
    case 'up':
      gameState.userPosition.x += 1;
      break;
    case 'down':
      gameState.userPosition.x -= 1;
      break;
  }
};

const toggleEntityVisibility = () => {
  gameState.entitiesVisible = !gameState.entitiesVisible;
};

const toggleTurn = () => {
  gameState.currentPhase = gameState.currentPhase === 'crew' ? 'parrot' : 'crew';
};

const toggleArrows = () => {
  gameState.displayArrows = !gameState.displayArrows;
};

const toggleFocus = () => {
  gameState.focusedView = !gameState.focusedView;
};

const toggleCorsair = () => {
  gameState.displayCorsair = !gameState.displayCorsair;
};
</script>
