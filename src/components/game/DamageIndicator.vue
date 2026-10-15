<template>
  <div class="damage-indicator-root">
    <div
      v-for="item in activeDamageFeedbacks"
      :key="item.id"
      class="damage-arc"
      :style="getArcStyle(item)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../../stores/gameStore';
import type { DamageFeedbackEvent } from '../../types/game';

const gameStore = useGameStore();

const activeDamageFeedbacks = computed(() => {
  const now = performance.now();
  return gameStore.damageFeedbacks.filter(d => now - d.timestamp < 1200);
});

function getArcStyle(item: DamageFeedbackEvent) {
  const ageMs = performance.now() - item.timestamp;
  const opacity = Math.max(0, 1 - ageMs / 1200);

  // Approximate screen angle relative to world forward
  const dx = item.sourcePosition.x;
  const dz = item.sourcePosition.z;
  const angleRad = Math.atan2(dx, dz);
  const angleDeg = (angleRad * 180) / Math.PI;

  return {
    transform: `translate(-50%, -50%) rotate(${angleDeg}deg)`,
    opacity: opacity.toFixed(2)
  };
}
</script>

<style scoped>
.damage-indicator-root {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 15;
}

.damage-arc {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  border-top: 5px solid #ff2a4b;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-bottom: 5px solid transparent;
  filter: drop-shadow(0 0 10px #ff2a4b);
  transition: opacity 0.1s linear;
}
</style>
