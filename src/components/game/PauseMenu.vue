<template>
  <div class="pause-overlay">
    <div class="pause-card tactical-panel">
      <div class="pause-header">
        <div class="pause-tag mono">// TACTICAL PAUSE</div>
        <h2 class="pause-title">MISSION SUSPENDED</h2>
      </div>

      <div class="pause-actions">
        <button class="tactical-button primary-btn" @click="$emit('resume')">
          RESUME MISSION
        </button>
        <button class="tactical-button" @click="$emit('restart')">
          RESTART MISSION
        </button>
        <button class="tactical-button" @click="$emit('open-settings')">
          SETTINGS
        </button>
        <button class="tactical-button danger" @click="$emit('quit')">
          ABORT TO MAIN MENU
        </button>
      </div>

      <div class="pause-footer mono">
        PRESS [ESC] OR CLICK RESUME TO CONTINUE COMBAT
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  (e: 'resume'): void;
  (e: 'restart'): void;
  (e: 'open-settings'): void;
  (e: 'quit'): void;
}>();
</script>

<style scoped>
.pause-overlay {
  position: absolute;
  inset: 0;
  background: rgba(4, 7, 12, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  user-select: none;
}

.pause-card {
  width: 380px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.pause-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 12px;
}

.pause-tag {
  font-size: 11px;
  color: var(--color-amber);
  letter-spacing: 0.15em;
}

.pause-title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--color-text-bright);
}

.pause-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.primary-btn {
  background: rgba(0, 240, 255, 0.18);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.pause-footer {
  font-size: 10px;
  color: var(--color-text-dim);
  text-align: center;
}
</style>
