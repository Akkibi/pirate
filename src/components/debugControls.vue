<template>
  <div class="absolute bottom-4 left-4 flex flex-row gap-2">
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
  </div>
  <div class="absolute bottom-4 right-4 flex gap-2 justify-center items-center">
    <div
      class="absolute inset-0 w-full h-full bg-amber-950 rounded-[40%] scale-75 border-3 border-amber-900"
    ></div>
    <button
      class="bg-amber-700 p-1 px-2 text-amber-100 font-black min-w-16 border-3 border-amber-900 relative"
      @click="movePlayer('left')"
    >
      Left
    </button>
    <div class="flex flex-col gap-2">
      <button
        class="bg-amber-700 p-1 px-2 text-amber-100 font-black min-w-16 border-3 border-amber-900 relative"
        @click="movePlayer('up')"
      >
        Up
      </button>
      <button
        class="bg-amber-700 p-1 px-2 text-amber-100 font-black min-w-16 border-3 border-amber-900 relative"
        @click="movePlayer('down')"
      >
        Down
      </button>
    </div>
    <button
      class="bg-amber-700 p-1 px-2 text-amber-100 font-black min-w-16 border-3 border-amber-900 relative"
      @click="movePlayer('right')"
    >
      Right
    </button>
  </div>
</template>

<script setup lang="ts">
import { gameState } from '../utils/gameStore';
import { gameEvents } from '../events/gameEvents';

gameEvents.on('crew:move_confirmation', (e) => movePlayer(e.direction));

const movePlayer = (direction: string) => {
  console.log('move', direction);
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
</script>
