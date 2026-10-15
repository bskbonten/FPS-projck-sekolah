<template>
  <div class="debrief-overlay">
    <div class="debrief-card tactical-panel">
      <!-- Header -->
      <div class="debrief-header">
        <div class="header-left">
          <div class="mission-tag mono">MISSION COMPLETE // DEBRIEFING</div>
          <h1 class="mission-title">OPERATION: BLACKOUT</h1>
          <div class="mission-sub mono">DATA SECURED // VTOL EXTRACTION SUCCESSFUL</div>
        </div>

        <!-- Rating Stamp -->
        <div class="rating-badge" :class="`rating-${stats.rating}`">
          <span class="rating-grade">{{ stats.rating }}</span>
          <span class="rating-label mono">RANK</span>
        </div>
      </div>

      <!-- Metrics Grid -->
      <div class="metrics-grid">
        <div class="metric-box tactical-panel">
          <span class="metric-label">TIME ELAPSED</span>
          <span class="metric-value mono">{{ formatTime(stats.elapsedTime) }}</span>
          <span class="metric-sub mono">{{ stats.elapsedTime }} SECONDS</span>
        </div>

        <div class="metric-box tactical-panel">
          <span class="metric-label">COMBAT ACCURACY</span>
          <span class="metric-value mono">{{ stats.accuracy }}%</span>
          <span class="metric-sub mono">{{ stats.shotsHit }} / {{ stats.shotsFired }} HITS</span>
        </div>

        <div class="metric-box tactical-panel">
          <span class="metric-label">ENEMIES ELIMINATED</span>
          <span class="metric-value mono">{{ stats.enemiesEliminated }} / {{ stats.totalEnemies }}</span>
          <span class="metric-sub mono">THREATS CLEARED</span>
        </div>

        <div class="metric-box tactical-panel">
          <span class="metric-label">DAMAGE TAKEN</span>
          <span class="metric-value mono">{{ Math.round(stats.damageTaken) }}</span>
          <span class="metric-sub mono">ARMOR / HEALTH</span>
        </div>
      </div>

      <!-- Historical Best Record -->
      <div v-if="gameStore.bestRecord" class="record-box tactical-panel">
        <div class="record-title mono">// PERSONAL BEST RECORD</div>
        <div class="record-stats mono">
          <span>BEST TIME: {{ formatTime(gameStore.bestRecord.elapsedTime) }}</span>
          <span>BEST ACCURACY: {{ gameStore.bestRecord.accuracy }}%</span>
          <span>GRADE: {{ gameStore.bestRecord.rating }}</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="debrief-actions">
        <button class="tactical-button primary-btn" @click="$emit('replay')">
          RE-RUN MISSION
        </button>
        <button class="tactical-button" @click="$emit('main-menu')">
          RETURN TO HEADQUARTERS
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../../stores/gameStore';

defineEmits<{
  (e: 'replay'): void;
  (e: 'main-menu'): void;
}>();

const gameStore = useGameStore();
const stats = computed(() => gameStore.stats);

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
</script>

<style scoped>
.debrief-overlay {
  position: absolute;
  inset: 0;
  background: rgba(6, 10, 16, 0.92);
  backdrop-filter: blur(14px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 60;
  user-select: none;
}

.debrief-card {
  width: 580px;
  padding: 36px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.debrief-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 16px;
}

.mission-tag {
  font-size: 11px;
  color: var(--color-success);
  letter-spacing: 0.15em;
}

.mission-title {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--color-text-bright);
}

.mission-sub {
  font-size: 11px;
  color: var(--color-text-dim);
}

.rating-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border: 2px solid;
  border-radius: 4px;
}

.rating-grade {
  font-size: 38px;
  font-weight: 800;
  line-height: 1;
}

.rating-label {
  font-size: 9px;
  letter-spacing: 0.1em;
}

.rating-S {
  border-color: #ffd700;
  color: #ffd700;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
}

.rating-A {
  border-color: #00f0ff;
  color: #00f0ff;
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.4);
}

.rating-B {
  border-color: #05f1af;
  color: #05f1af;
}

.rating-C {
  border-color: #ffaa00;
  color: #ffaa00;
}

.rating-D {
  border-color: #ff2a4b;
  color: #ff2a4b;
}

.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.metric-box {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: rgba(0, 0, 0, 0.35);
}

.metric-label {
  font-size: 11px;
  color: var(--color-text-dim);
  letter-spacing: 0.08em;
}

.metric-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-bright);
}

.metric-sub {
  font-size: 10px;
  color: var(--color-primary);
}

.record-box {
  padding: 14px;
  background: rgba(0, 240, 255, 0.04);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.record-title {
  font-size: 10px;
  color: var(--color-primary);
}

.record-stats {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--color-text-dim);
}

.debrief-actions {
  display: flex;
  gap: 16px;
}

.debrief-actions button {
  flex: 1;
}

.primary-btn {
  background: rgba(0, 240, 255, 0.2);
  border-color: var(--color-primary);
  color: var(--color-primary);
}
</style>
