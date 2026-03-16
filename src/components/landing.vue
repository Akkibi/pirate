<template>
  <div class="relative h-full w-full overflow-hidden bg-[#120c08]">
    <div class="absolute inset-0">
      <img
        class="h-full w-full object-cover opacity-70"
        src="/images/background.png"
        alt="background"
      />
      <div
        class="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,10,7,0.25)_0%,rgba(17,10,7,0.55)_45%,rgba(17,10,7,0.92)_100%)]"
      ></div>
    </div>

    <ScreenGrid :pointer-events="'auto'" class="relative z-10">
      <div
        class="col-span-8 row-span-2 row-start-1 flex items-end justify-center px-3"
      >
        <div
          id="title"
          class="px-2 text-center text-[clamp(3.1rem,14vw,6rem)] text-[#f7e8c6]"
        >
          Pirates
        </div>
      </div>

      <div class="col-span-6 col-start-2 row-start-6 min-h-0">
        <GameButton label="Start Game" :on-click="startGame" />
      </div>

      <div class="col-span-3 col-start-2 row-start-7 min-h-0">
        <GameButton label="Settings" :on-click="startGame" />
      </div>

      <div class="col-span-3 col-start-5 row-start-7 min-h-0">
        <GameButton label="Tutorial" :on-click="startGame" />
      </div>
    </ScreenGrid>
  </div>
</template>

<script setup lang="ts">
import ScreenGrid from "./ui/ScreenGrid.vue";
import GameButton from "./ui/GameButton.vue";

const emit = defineEmits<{ (event: "start"): void }>();

function startGame() {
  emit("start");
}
</script>

<style scoped>
#title {
  font-family: "Black Crest", "IM Fell English", Georgia, serif;
  line-height: 0.85;
  text-shadow: 0 12px 30px rgba(17, 10, 7, 0.55);
}
</style>
