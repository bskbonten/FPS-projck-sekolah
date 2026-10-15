<template>
  <div class="shadow-protocol-app">
    <!-- Main Menu -->
    <MainMenu
      v-if="gameStore.gameState === 'MAIN_MENU'"
      @start="startDeployment"
      @open-settings="showSettings = true"
    />

    <!-- Active 3D Gameplay Viewport & HUD -->
    <GameViewport
      v-else
    />

    <!-- Settings Menu from Main Menu -->
    <SettingsMenu
      v-if="showSettings && gameStore.gameState === 'MAIN_MENU'"
      @close="showSettings = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useGameStore } from './stores/gameStore';
import MainMenu from './components/menus/MainMenu.vue';
import GameViewport from './components/game/GameViewport.vue';
import SettingsMenu from './components/menus/SettingsMenu.vue';

const gameStore = useGameStore();
const showSettings = ref(false);

function startDeployment() {
  gameStore.setGameState('PLAYING');
}
</script>

<style scoped>
.shadow-protocol-app {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background-color: var(--color-bg-base);
}
</style>
