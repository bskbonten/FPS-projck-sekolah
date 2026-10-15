<template>
  <div class="main-menu-root">
    <!-- Background atmospheric grid and scanlines -->
    <div class="scanlines" />

    <!-- Center tactical frame -->
    <div class="menu-content">
      <!-- Title & Branding -->
      <div class="title-block">
        <div class="subtitle-tag mono">// COVERT RECONNAISSANCE SQUADRON // 2089</div>
        <h1 class="main-title">SHADOW PROTOCOL</h1>
        <div class="title-meta mono">TACTICAL FIRST-PERSON CAMPAIGN // THREE.JS ENGINE</div>
      </div>

      <!-- Mission Briefing Panel -->
      <div class="briefing-card tactical-panel">
        <div class="briefing-header">
          <span class="briefing-badge mono">CAMPAIGN // ACT 1</span>
          <span class="mission-status mono">STATUS: READY TO DEPLOY</span>
        </div>
        <h3 class="briefing-title">MISSION 01: BLACKOUT</h3>
        <p class="briefing-text">
          Hostile syndicate forces have seized the Sector 4 logistics hub following an automated defense grid blackout. 
          Infiltrate the perimeter, eliminate patrolling guards, breach the interior control building, and extract classified defense network encryption keys before extraction.
        </p>

        <!-- Directives List -->
        <div class="directives-list mono">
          <div class="dir-item"><span>[1]</span> Infiltrate Sector 4 perimeter</div>
          <div class="dir-item"><span>[2]</span> Neutralize or evade hostile logistics patrol</div>
          <div class="dir-item"><span>[3]</span> Locate and override primary data terminal</div>
          <div class="dir-item"><span>[4]</span> Survive alert response & reach extraction helipad</div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="actions-panel">
        <button class="tactical-button deploy-btn" @click="$emit('start')">
          <span class="btn-bracket">[▶]</span>
          <span>DEPLOY MISSION</span>
        </button>

        <div class="secondary-actions">
          <button class="tactical-button" @click="$emit('open-settings')">
            SETTINGS
          </button>
          <button class="tactical-button" @click="showRecords = !showRecords">
            RECORDS
          </button>
          <button class="tactical-button" @click="showControls = !showControls">
            CONTROLS
          </button>
        </div>
      </div>

      <!-- Notice regarding pointer lock -->
      <div class="launch-notice mono">
        CLICK "DEPLOY MISSION" TO ENGAGE FIRST-PERSON POINTER LOCK & AUDIO
      </div>

      <!-- Controls Popover -->
      <div v-if="showControls" class="popover-card tactical-panel">
        <div class="popover-header">
          <span class="mono">TACTICAL KEYBINDINGS</span>
          <button class="close-btn" @click="showControls = false">✕</button>
        </div>
        <div class="key-grid mono">
          <div><kbd>W A S D</kbd> Move</div>
          <div><kbd>MOUSE</kbd> Aim / Look</div>
          <div><kbd>LEFT CLICK</kbd> Fire Weapon</div>
          <div><kbd>RIGHT CLICK</kbd> Aim Down Sights</div>
          <div><kbd>R</kbd> Reload</div>
          <div><kbd>SHIFT</kbd> Tactical Sprint</div>
          <div><kbd>SPACE</kbd> Jump</div>
          <div><kbd>CTRL / C</kbd> Crouch</div>
          <div><kbd>1 / 2</kbd> Primary / Pistol</div>
          <div><kbd>E</kbd> Interact (Terminal)</div>
          <div><kbd>X</kbd> Inspect Weapon</div>
          <div><kbd>ESC</kbd> Tactical Pause</div>
        </div>
      </div>

      <!-- Records Popover -->
      <div v-if="showRecords" class="popover-card tactical-panel">
        <div class="popover-header">
          <span class="mono">MISSION RECORDS</span>
          <button class="close-btn" @click="showRecords = false">✕</button>
        </div>
        <div v-if="bestRecord" class="record-details mono">
          <div>TOP MISSION GRADE: <span class="highlight">{{ bestRecord.rating }}</span></div>
          <div>FASTEST CLEAR: <span class="highlight">{{ bestRecord.elapsedTime }}s</span></div>
          <div>HIGHEST ACCURACY: <span class="highlight">{{ bestRecord.accuracy }}%</span></div>
          <div>ENEMIES CLEARED: <span class="highlight">{{ bestRecord.enemiesEliminated }} / {{ bestRecord.totalEnemies }}</span></div>
        </div>
        <div v-else class="record-details mono dim">
          NO CLASSIFIED MISSION RECORDS RECORDED YET. COMPLETE MISSION 01 TO LOG DEBRIEF.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useGameStore } from '../../stores/gameStore';

defineEmits<{
  (e: 'start'): void;
  (e: 'open-settings'): void;
}>();

const gameStore = useGameStore();
const bestRecord = computed(() => gameStore.bestRecord);

const showControls = ref(false);
const showRecords = ref(false);
</script>

<style scoped>
.main-menu-root {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 50% 40%, #0e1724 0%, #06090e 100%);
  z-index: 40;
  overflow: hidden;
  user-select: none;
}

.scanlines {
  position: absolute;
  inset: 0;
  background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%);
  background-size: 100% 4px;
  pointer-events: none;
  opacity: 0.6;
}

.menu-content {
  width: 620px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  z-index: 10;
  position: relative;
}

.title-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: center;
}

.subtitle-tag {
  font-size: 11px;
  color: var(--color-primary);
  letter-spacing: 0.2em;
}

.main-title {
  font-size: 44px;
  font-weight: 800;
  letter-spacing: 0.18em;
  color: var(--color-text-bright);
  text-shadow: 0 0 24px var(--color-primary-glow);
  margin: 4px 0;
}

.title-meta {
  font-size: 11px;
  color: var(--color-text-dim);
  letter-spacing: 0.12em;
}

.briefing-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.briefing-header {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 6px;
}

.briefing-badge {
  color: var(--color-amber);
}

.mission-status {
  color: var(--color-success);
}

.briefing-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-bright);
  letter-spacing: 0.08em;
}

.briefing-text {
  font-size: 12px;
  color: var(--color-text-dim);
  line-height: 1.5;
}

.directives-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  font-size: 11px;
  color: var(--color-text-main);
  background: rgba(0, 0, 0, 0.35);
  padding: 12px;
  border-left: 2px solid var(--color-primary);
}

.dir-item span {
  color: var(--color-primary);
  margin-right: 4px;
}

.actions-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.deploy-btn {
  padding: 18px 36px;
  font-size: 18px;
  background: rgba(0, 240, 255, 0.22);
  border-color: var(--color-primary);
  color: var(--color-primary);
  box-shadow: 0 0 24px var(--color-primary-glow);
}

.deploy-btn:hover {
  background: rgba(0, 240, 255, 0.35);
  transform: translateY(-2px);
  box-shadow: 0 0 32px rgba(0, 240, 255, 0.4);
}

.btn-bracket {
  margin-right: 6px;
}

.secondary-actions {
  display: flex;
  gap: 12px;
}

.secondary-actions button {
  flex: 1;
}

.launch-notice {
  font-size: 10px;
  color: var(--color-text-dim);
  text-align: center;
  letter-spacing: 0.08em;
}

.popover-card {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px;
  background: rgba(8, 14, 22, 0.98);
  display: flex;
  flex-direction: column;
  gap: 14px;
  z-index: 20;
}

.popover-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--color-primary);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 8px;
}

.close-btn {
  color: var(--color-text-dim);
  font-size: 14px;
}

.key-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  font-size: 11px;
}

kbd {
  background: rgba(0, 240, 255, 0.15);
  border: 1px solid rgba(0, 240, 255, 0.4);
  color: var(--color-primary);
  padding: 2px 6px;
  border-radius: 2px;
  margin-right: 6px;
}

.record-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12px;
}

.record-details .highlight {
  color: var(--color-amber);
  font-weight: 700;
}

.record-details.dim {
  color: var(--color-text-dim);
  font-size: 11px;
}
</style>
