<template>
  <div class="ammo-container tactical-panel">
    <!-- Active weapon title -->
    <div class="ammo-header">
      <div class="weapon-info">
        <span class="weapon-name">{{ gameStore.weaponName }}</span>
        <span class="fire-mode mono">{{ isAR ? 'CALIBER 6.8MM // AUTO' : 'CALIBER 9MM // SEMI' }}</span>
      </div>
      <div class="weapon-slots">
        <span class="slot-badge" :class="{ active: isAR }">[1]</span>
        <span class="slot-badge" :class="{ active: !isAR }">[2]</span>
      </div>
    </div>

    <!-- Ammo readout -->
    <div class="ammo-readout">
      <div class="mag-digits mono" :class="{ low: isLowAmmo }">
        {{ String(gameStore.currentMag).padStart(2, '0') }}
      </div>
      <div class="ammo-slash">/</div>
      <div class="reserve-digits mono">
        {{ String(gameStore.reserveAmmo).padStart(3, '0') }}
      </div>
    </div>

    <!-- Reload bar -->
    <div v-if="gameStore.isReloading" class="reload-container">
      <div class="reload-label mono">RELOADING...</div>
      <div class="reload-track">
        <div class="reload-fill" :style="{ width: `${gameStore.reloadProgress * 100}%` }" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../../stores/gameStore';

const gameStore = useGameStore();

const isAR = computed(() => gameStore.currentWeapon === 'ar01');

const isLowAmmo = computed(() => {
  return gameStore.currentMag <= (isAR.value ? 7 : 3);
});
</script>

<style scoped>
.ammo-container {
  position: absolute;
  bottom: 28px;
  right: 28px;
  width: 250px;
  padding: 16px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ammo-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 6px;
}

.weapon-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.weapon-name {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--color-text-bright);
}

.fire-mode {
  font-size: 10px;
  color: var(--color-text-dim);
}

.weapon-slots {
  display: flex;
  gap: 4px;
}

.slot-badge {
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--color-text-dim);
}

.slot-badge.active {
  background: rgba(0, 240, 255, 0.2);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.ammo-readout {
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: 8px;
}

.mag-digits {
  font-size: 38px;
  font-weight: 700;
  line-height: 1;
  color: var(--color-primary);
  text-shadow: 0 0 12px var(--color-primary-glow);
}

.mag-digits.low {
  color: var(--color-danger);
  text-shadow: 0 0 14px var(--color-danger-glow);
  animation: pulseLow 0.8s infinite alternate;
}

.ammo-slash {
  font-size: 24px;
  color: var(--color-text-dim);
  opacity: 0.5;
}

.reserve-digits {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-dim);
}

.reload-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 4px;
}

.reload-label {
  font-size: 10px;
  color: var(--color-amber);
  letter-spacing: 0.1em;
}

.reload-track {
  width: 100%;
  height: 4px;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 183, 3, 0.3);
  overflow: hidden;
}

.reload-fill {
  height: 100%;
  background: var(--color-amber);
  box-shadow: 0 0 8px var(--color-amber);
  transition: width 0.05s linear;
}

@keyframes pulseLow {
  0% { opacity: 0.6; }
  100% { opacity: 1; }
}
</style>
