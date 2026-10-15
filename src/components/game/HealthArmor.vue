<template>
  <div class="vital-container tactical-panel">
    <!-- Status header -->
    <div class="vital-header">
      <span class="operative-id">OPERATIVE // SPEC-OPS</span>
      <span class="status-indicator" :class="{ critical: isCritical }">
        {{ isCritical ? 'VITAL STATUS: CRITICAL' : 'VITAL STATUS: NOMINAL' }}
      </span>
    </div>

    <!-- Health bar -->
    <div class="gauge-row">
      <div class="gauge-label">
        <span class="label-text">HEALTH</span>
        <span class="gauge-val mono">{{ Math.round(player.health) }}</span>
      </div>
      <div class="gauge-track">
        <div
          class="gauge-fill health-fill"
          :class="{ critical: isCritical }"
          :style="{ width: `${(player.health / player.maxHealth) * 100}%` }"
        />
      </div>
    </div>

    <!-- Armor bar -->
    <div class="gauge-row">
      <div class="gauge-label">
        <span class="label-text">ARMOR</span>
        <span class="gauge-val mono">{{ Math.round(player.armor) }}</span>
      </div>
      <div class="gauge-track">
        <div
          class="gauge-fill armor-fill"
          :style="{ width: `${(player.armor / player.maxArmor) * 100}%` }"
        />
      </div>
    </div>

    <!-- Stance indicator -->
    <div class="stance-row">
      <span class="stance-pill" :class="{ active: player.isCrouching }">CROUCH</span>
      <span class="stance-pill" :class="{ active: player.isSprinting }">SPRINT</span>
      <span class="stance-pill" :class="{ active: player.isAiming }">ADS</span>
    </div>

    <!-- Critical low-health overlay pulse -->
    <div v-if="isCritical" class="critical-vignette" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../../stores/gameStore';

const gameStore = useGameStore();
const player = computed(() => gameStore.player);

const isCritical = computed(() => {
  return player.value.health > 0 && player.value.health < 30;
});
</script>

<style scoped>
.vital-container {
  position: absolute;
  bottom: 28px;
  left: 28px;
  width: 280px;
  padding: 16px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.vital-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--color-text-dim);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 6px;
}

.status-indicator.critical {
  color: var(--color-danger);
  animation: pulse 1s infinite alternate;
}

.gauge-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.gauge-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.gauge-val {
  font-size: 15px;
  font-weight: 700;
}

.gauge-track {
  width: 100%;
  height: 8px;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  position: relative;
}

.gauge-fill {
  height: 100%;
  transition: width 0.15s ease-out;
}

.health-fill {
  background: linear-gradient(90deg, #05f1af, #00f0ff);
  box-shadow: 0 0 8px rgba(0, 240, 255, 0.5);
}

.health-fill.critical {
  background: linear-gradient(90deg, #ff2a4b, #ff7a00);
  box-shadow: 0 0 10px rgba(255, 42, 75, 0.8);
}

.armor-fill {
  background: linear-gradient(90deg, #00a2ff, #7000ff);
  box-shadow: 0 0 8px rgba(0, 162, 255, 0.5);
}

.stance-row {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.stance-pill {
  font-family: var(--font-mono);
  font-size: 10px;
  padding: 3px 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--color-text-dim);
}

.stance-pill.active {
  background: rgba(0, 240, 255, 0.15);
  border-color: var(--color-primary);
  color: var(--color-primary);
  box-shadow: 0 0 8px var(--color-primary-glow);
}

.critical-vignette {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(circle, transparent 40%, rgba(255, 42, 75, 0.45) 100%);
  z-index: 100;
  animation: hurtThrob 1.2s infinite ease-in-out;
}

@keyframes pulse {
  0% { opacity: 0.5; }
  100% { opacity: 1; }
}

@keyframes hurtThrob {
  0% { opacity: 0.4; }
  50% { opacity: 0.85; }
  100% { opacity: 0.4; }
}
</style>
