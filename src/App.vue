<script setup lang="ts">
import Toolbar from './components/Toolbar.vue'
import MindMapCanvas from './components/MindMapCanvas.vue'
</script>

<template>
  <div class="app-root">
    <Toolbar />
    <MindMapCanvas />
  </div>
</template>

<style scoped>
.app-root {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
