<template>
  <div
    class="pointer-events-auto col-span-4 col-start-1 row-start-8 flex min-h-0 flex-wrap items-end gap-2 self-end"
  >
    <button
      class="bg-slate-900 rounded-full min-w-20 p-1 px-3 text-white font-black"
      @click="toggleEntityVisibility"
    >
      {{ gameState.entitiesVisible ? 'Hide' : 'Show' }}
    </button>
    <button
      class="bg-slate-900 rounded-full min-w-30 p-1 px-3 text-white font-black"
      @click="toggleTurn"
    >
      <span class="text-xs opacity-55"> Turn : </span>
      {{ gameState.currentPhase === 'crew' ? 'Crew' : 'Parrot' }}
    </button>
    <button
      class="bg-slate-900 rounded-full min-w-24 p-1 px-3 text-white font-black"
      @click="toggleFocus"
    >
      {{ gameState.focusedView ? 'Focus' : 'Unfocussed' }}
    </button>
    <button
      class="bg-slate-900 rounded-full min-w-24 p-1 px-3 text-white font-black"
      @click="toggleArrows"
    >
      <span class="text-xs opacity-55">Arrows are :</span>
      {{ gameState.displayArrows ? 'On' : 'Off' }}
    </button>
    <button
      class="bg-slate-900 rounded-full min-w-24 p-1 px-3 text-white font-black"
      @click="toggleCorsair"
    >
      <span class="text-xs opacity-55">Corsair :</span>
      {{ gameState.displayCorsair ? 'On' : 'Off' }}
    </button>
    <button
      class="bg-slate-900 rounded-full min-w-24 p-1 px-3 text-white font-black"
      @click="gameState.displayCannons = !gameState.displayCannons"
    >
      <span class="text-xs opacity-55">Cannons :</span>
      {{ gameState.displayCannons ? 'On' : 'Off' }}
    </button>
    <button
      class="bg-slate-900 rounded-full min-w-24 p-1 px-3 text-white font-black"
      @click="gameState.displayBottle = !gameState.displayBottle"
    >
      <span class="text-xs opacity-55">Bottle :</span>
      {{ gameState.displayBottle ? 'On' : 'Off' }}
    </button>
    <button
      class="bg-slate-900 rounded-full min-w-24 p-1 px-3 text-white font-black"
      @click="gameEvents.emit('boat:shoot_cannons', {})"
    >
      Shoot Cannons
    </button>
    <button
      class="bg-slate-900 rounded-full min-w-24 p-1 px-3 text-white font-black"
      @click="gameState.gameStarted = !gameState.gameStarted"
    >
      <span class="text-xs opacity-55">Game :</span>
      {{ gameState.gameStarted ? 'Started' : 'Stopped' }}
    </button>
  </div>
  <div
    class="pointer-events-auto col-span-4 col-start-5 row-span-2 row-start-7 flex min-h-0 items-end justify-end gap-2 self-end"
  >
    <div class="flex flex-col items-center gap-1">
      <span class="text-xs font-black text-white">Corsair</span>
      <div class="relative flex items-center justify-center gap-2">
        <div class="absolute inset-0 h-full w-full scale-75 rounded-[40%] bg-black"></div>
        <button
          class="relative min-w-16 bg-slate-900 rounded-full p-1 px-3 font-black text-white"
          @click="moveCorsair('left')"
        >
          Left
        </button>
        <div class="flex flex-col gap-2">
          <button
            class="relative min-w-16 bg-slate-900 rounded-full p-1 px-3 font-black text-white"
            @click="moveCorsair('up')"
          >
            Up
          </button>
          <button
            class="relative min-w-16 bg-slate-900 rounded-full p-1 px-3 font-black text-white"
            @click="moveCorsair('down')"
          >
            Down
          </button>
        </div>
        <button
          class="relative min-w-16 bg-slate-900 rounded-full p-1 px-3 font-black text-white"
          @click="moveCorsair('right')"
        >
          Right
        </button>
      </div>
    </div>
    <div class="flex flex-col items-center gap-1">
      <span class="text-xs font-black text-white">Player</span>
      <div class="relative flex items-center justify-center gap-2">
        <div class="absolute inset-0 h-full w-full scale-75 rounded-[40%] bg-black"></div>
        <button
          class="relative min-w-16 bg-slate-900 rounded-full p-1 px-3 font-black text-white"
          @click="movePlayer('left')"
        >
          Left
        </button>
        <div class="flex flex-col gap-2">
          <button
            class="relative min-w-16 bg-slate-900 rounded-full p-1 px-3 font-black text-white"
            @click="movePlayer('up')"
          >
            Up
          </button>
          <button
            class="relative min-w-16 bg-slate-900 rounded-full p-1 px-3 font-black text-white"
            @click="movePlayer('down')"
          >
            Down
          </button>
        </div>
        <button
          class="relative min-w-16 bg-slate-900 rounded-full p-1 px-3 font-black text-white"
          @click="movePlayer('right')"
        >
          Right
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { gameState, getNextBoardPosition, moveUserPosition } from '../utils/gameStore';
import { gameEvents } from '../events/gameEvents';

const moveCorsair = (direction: string) => {
  const nextPosition = getNextBoardPosition(gameState.corsairPosition, direction);
  if (nextPosition) {
    gameState.corsairPosition.set(nextPosition.x, nextPosition.y);
  }
};

const movePlayer = (direction: string) => {
  moveUserPosition(direction);
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
