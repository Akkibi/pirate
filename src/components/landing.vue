<template>
  <div class="flex w-full h-1/3 justify-center items-center">
    <div id="title" class="text-9xl p-8">Pirates</div>
  </div>
  <div class="flex w-full h-1/3 justify-center items-center">
    <button
      @click="emit('start')"
      class="text-4xl p-8 cursor-pointer border-2 rounded-3xl hover:bg-amber-800 transition-all"
    >
      Start Game
    </button>
  </div>
  <div class="flex w-full h-1/3 justify-center items-center">
    <button class="text-4xl p-8">Rules</button>
  </div>
  <div class="w-screen h-screen absolute top-0 -z-10 blur-md">
    <img class="object-cover w-full h-full" src="/images/background.png" alt="background" />
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{ (event: 'start'): void }>();
</script>

<style>
#title {
  font-family: 'Black Crest';
}
</style>
