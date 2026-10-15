<template>
  <div class="game-over-overlay">
    <div class="defeat-card tactical-panel">
      <div class="defeat-header">
        <div class="defeat-tag mono">// CRITICAL FAILURE</div>
        <h2 class="defeat-title">OPERATIVE DOWN</h2>
        <div class="defeat-sub mono">BIOMETRIC SIGNALS TERMINATED. MISSION ABORTED.</div>
      </div>

      <div class="defeat-stats tactical-panel">
        <div class="stat-item">
          <span class="stat-label">ENEMIES KILLED</span>
          <span class="stat-val mono">{{ gameStore.stats.enemiesEliminated }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">ACCURACY</span>
          <span class="stat-val mono">{{ gameStore.stats.accuracy }}%</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">SURVIVAL TIME</span>
          <span class="stat-val mono">{{ gameStore.stats.elapsedTime }}s</span>
        </div>
      </div>

      <div class="defeat-actions">
        <button class="tactical-button primary-btn" @click="$emit('restart')">
          RE-DEPLOY // RESTART MISSION
        </button>
        <button class="tactical-button danger" @click="$emit('quit')">
          RETURN TO MAIN MENU
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from '../../stores/gameStore';

defineEmits<{
  (e: 'restart'): void;
  (e: 'quit'): void;
}>();

const gameStore = useGameStore();
</script>

<style scoped>
.game-over-overlay {
  position: absolute;
  inset: 0;
  background: rgba(18, 4, 8, 0.88);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 60;
  user-select: none;
}

.defeat-card {
  width: 440px;
  padding: 36px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  border-color: rgba(255, 42, 75, 0.4);
  box-shadow: 0 0 40px var(--color-danger-glow);
}

.defeat-card::before,
.defeat-card::after {
  border-color: var(--color-danger);
}

.defeat-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-bottom: 1px solid rgba(255, 42, 75, 0.2);
  padding-bottom: 16px;
}

.defeat-tag {
  font-size: 11px;
  color: var(--color-danger);
  letter-spacing: 0.15em;
}

.defeat-title {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #ffccd4;
}

.defeat-sub {
  font-size: 11px;
  color: var(--color-text-dim);
}

.defeat-stats {
  display: flex;
  justify-content: space-around;
  padding: 14px;
  background: rgba(0, 0, 0, 0.4);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-label {
  font-size: 10px;
  color: var(--color-text-dim);
}

.stat-val {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-danger);
}

.defeat-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.primary-btn {
  background: rgba(255, 42, 75, 0.2);
  border-color: var(--color-danger);
  color: #ffffff;
}

.primary-btn:hover {
  background: rgba(255, 42, 75, 0.35);
}
</style>
