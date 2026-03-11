<template>
  <div class="flex w-full h-1/3 justify-center items-center">
    <div id="title" class="text-9xl p-8">Pirates</div>
  </div>
  <div class="flex w-full h-1/3 justify-center items-center">
    <Parchment
      text="Start Game"
      clickable
      size="md"
      :on-click="startGame"
    />
  </div>
  <div class="flex w-full h-1/3 justify-center items-center">
    <Parchment
      text="Rules Coming Soon"
      size="sm"
    />
  </div>
  <div class="w-screen h-screen absolute top-0 -z-10 blur-md">
    <img
      class="object-cover w-full h-full"
      src="/images/background.png"
      alt="background"
    />
  </div>
</template>

<script setup lang="ts">
import Parchment from "./parchment.vue";

const emit = defineEmits<{ (event: "start"): void }>();

function startGame() {
  emit("start");
}
</script>

<style>
#title {
  font-family: "Black Crest";
}
</style>
