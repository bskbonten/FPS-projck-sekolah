<template>
  <div class="viewport-wrapper">
    <!-- 3D Three.js Canvas Container -->
    <div ref="canvasContainer" class="three-canvas-container" />

    <!-- In-Game HUD -->
    <HUD v-if="gameStore.gameState === 'PLAYING' || gameStore.gameState === 'PAUSED'" />

    <!-- Pause Menu -->
    <PauseMenu
      v-if="gameStore.gameState === 'PAUSED' && !showSettingsModal"
      @resume="resumeGame"
      @restart="restartMission"
      @open-settings="showSettingsModal = true"
      @quit="quitToMainMenu"
    />

    <!-- Mission Debrief (Victory) -->
    <MissionDebrief
      v-if="gameStore.gameState === 'MISSION_COMPLETE'"
      @replay="restartMission"
      @main-menu="quitToMainMenu"
    />

    <!-- Game Over (Defeat) -->
    <GameOver
      v-if="gameStore.gameState === 'PLAYER_DEAD'"
      @restart="restartMission"
      @quit="quitToMainMenu"
    />

    <!-- In-Game Settings Modal -->
    <SettingsMenu
      v-if="showSettingsModal"
      @close="showSettingsModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useGameStore } from '../../stores/gameStore';
import { GameEngine } from '../../game/GameEngine';
import HUD from './HUD.vue';
import PauseMenu from './PauseMenu.vue';
import MissionDebrief from '../menus/MissionDebrief.vue';
import GameOver from './GameOver.vue';
import SettingsMenu from '../menus/SettingsMenu.vue';

const gameStore = useGameStore();
const canvasContainer = ref<HTMLElement | null>(null);
const showSettingsModal = ref(false);

let engine: GameEngine | null = null;

onMounted(() => {
  if (canvasContainer.value) {
    engine = new GameEngine(canvasContainer.value);
    engine.startMission();
  }
});

onBeforeUnmount(() => {
  if (engine) {
    engine.dispose();
    engine = null;
  }
});

function resumeGame() {
  if (engine) {
    engine.resumeGame();
  }
}

function restartMission() {
  if (engine) {
    engine.restartMission();
  }
}

function quitToMainMenu() {
  if (engine) {
    engine.dispose();
    engine = null;
  }
  gameStore.setGameState('MAIN_MENU');
}
</script>

<style scoped>
.viewport-wrapper {
  position: absolute;
  inset: 0;
  overflow: hidden;
  user-select: none;
}

.three-canvas-container {
  width: 100%;
  height: 100%;
  position: absolute;
  inset: 0;
}
</style>
