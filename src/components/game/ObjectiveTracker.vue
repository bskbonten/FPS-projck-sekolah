<template>
  <div class="objective-container tactical-panel">
    <div class="obj-header">
      <div class="mission-tag mono">MISSION 01 // BLACKOUT</div>
      <div class="directive-pulse" />
    </div>

    <div v-if="currentObj" class="obj-content">
      <div class="obj-title">
        <span class="icon-bracket">[!]</span>
        <span>{{ currentObj.title }}</span>
      </div>
      <div class="obj-desc">{{ currentObj.description }}</div>

      <!-- Counter progress if applicable -->
      <div v-if="currentObj.total !== undefined" class="obj-progress mono">
        PROGRESS: {{ currentObj.progress || 0 }} / {{ currentObj.total }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../../stores/gameStore';

const gameStore = useGameStore();
const currentObj = computed(() => gameStore.currentObjective);
</script>

<style scoped>
.objective-container {
  position: absolute;
  top: 28px;
  left: 28px;
  width: 320px;
  padding: 14px 16px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.obj-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 6px;
}

.mission-tag {
  font-size: 11px;
  color: var(--color-primary);
  letter-spacing: 0.12em;
}

.directive-pulse {
  width: 6px;
  height: 6px;
  background: var(--color-primary);
  border-radius: 50%;
  box-shadow: 0 0 6px var(--color-primary);
  animation: radarBlink 1.5s infinite;
}

.obj-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.obj-title {
  display: flex;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--color-text-bright);
}

.icon-bracket {
  color: var(--color-amber);
}

.obj-desc {
  font-size: 11px;
  color: var(--color-text-dim);
  line-height: 1.4;
}

.obj-progress {
  font-size: 11px;
  color: var(--color-amber);
  margin-top: 2px;
}

@keyframes radarBlink {
  0% { opacity: 0.2; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.3); }
  100% { opacity: 0.2; transform: scale(0.8); }
}
</style>
