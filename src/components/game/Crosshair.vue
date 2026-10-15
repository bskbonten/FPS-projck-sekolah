<template>
  <div class="crosshair-container" :class="{ 'ads-mode': player.isAiming }">
    <!-- Center Dot -->
    <div class="crosshair-dot" />

    <!-- 4 Dynamic Reticle Ticks -->
    <div class="reticle-tick tick-top" :style="tickStyle('top')" />
    <div class="reticle-tick tick-bottom" :style="tickStyle('bottom')" />
    <div class="reticle-tick tick-left" :style="tickStyle('left')" />
    <div class="reticle-tick tick-right" :style="tickStyle('right')" />

    <!-- Hit Markers -->
    <div
      v-for="marker in activeHitMarkers"
      :key="marker.timestamp"
      class="hit-marker"
      :class="{ headshot: marker.isHeadshot, kill: marker.isKill }"
    >
      <div class="hit-slash slash-1" />
      <div class="hit-slash slash-2" />
      <div class="hit-slash slash-3" />
      <div class="hit-slash slash-4" />
      <span v-if="marker.isKill" class="kill-tag">KILLED</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../../stores/gameStore';

const gameStore = useGameStore();
const player = computed(() => gameStore.player);

const spreadGap = computed(() => {
  if (player.value.isAiming) return 6;
  if (player.value.isSprinting) return 24;
  if (player.value.speed > 1) return 16;
  return 10;
});

function tickStyle(dir: 'top' | 'bottom' | 'left' | 'right') {
  const gap = `${spreadGap.value}px`;
  switch (dir) {
    case 'top': return { transform: `translate(-50%, -${gap})` };
    case 'bottom': return { transform: `translate(-50%, ${gap})` };
    case 'left': return { transform: `translate(-${gap}, -50%)` };
    case 'right': return { transform: `translate(${gap}, -50%)` };
  }
}

const activeHitMarkers = computed(() => {
  const now = performance.now();
  return gameStore.hitMarkers.filter(m => now - m.timestamp < 300);
});
</script>

<style scoped>
.crosshair-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  pointer-events: none;
  z-index: 20;
}

.crosshair-container.ads-mode .reticle-tick {
  opacity: 0.15;
}

.crosshair-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 4px;
  height: 4px;
  background: var(--color-primary);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 6px var(--color-primary);
}

.reticle-tick {
  position: absolute;
  top: 50%;
  left: 50%;
  background: rgba(0, 240, 255, 0.85);
  box-shadow: 0 0 4px var(--color-primary-glow);
  transition: transform 0.08s ease-out, opacity 0.15s ease;
}

.tick-top, .tick-bottom {
  width: 2px;
  height: 8px;
}

.tick-left, .tick-right {
  width: 8px;
  height: 2px;
}

/* Hit Marker X */
.hit-marker {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 24px;
  height: 24px;
  transform: translate(-50%, -50%);
  animation: hitFade 0.3s forwards;
}

.hit-slash {
  position: absolute;
  width: 9px;
  height: 2px;
  background: #ffffff;
  box-shadow: 0 0 5px #ffffff;
}

.slash-1 { top: 3px; left: 3px; transform: rotate(45deg); }
.slash-2 { top: 3px; right: 3px; transform: rotate(-45deg); }
.slash-3 { bottom: 3px; left: 3px; transform: rotate(-45deg); }
.slash-4 { bottom: 3px; right: 3px; transform: rotate(45deg); }

.hit-marker.headshot .hit-slash {
  background: #ff2a4b;
  box-shadow: 0 0 8px #ff2a4b;
}

.hit-marker.kill .hit-slash {
  background: #ffb703;
  box-shadow: 0 0 10px #ffb703;
}

.kill-tag {
  position: absolute;
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: #ffb703;
  letter-spacing: 0.1em;
  text-shadow: 0 0 6px rgba(255, 183, 3, 0.8);
}

@keyframes hitFade {
  0% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
}
</style>
