<template>
  <div class="settings-modal-overlay">
    <div class="settings-card tactical-panel">
      <!-- Header -->
      <div class="settings-header">
        <div class="header-left">
          <div class="sub-tag mono">// SYSTEM CONFIGURATION</div>
          <h2 class="title">SETTINGS & CALIBRATION</h2>
        </div>
        <button class="tactical-button close-x" @click="$emit('close')">✕</button>
      </div>

      <!-- Settings content tabs/sections -->
      <div class="settings-body">
        <!-- Controls Section -->
        <div class="section-title mono">01 // CONTROL CONFIGURATION</div>
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-name">MOUSE SENSITIVITY</span>
            <span class="setting-desc">Adjust camera yaw & pitch responsiveness</span>
          </div>
          <div class="control-wrapper">
            <input
              type="range"
              min="0.001"
              max="0.006"
              step="0.0002"
              :value="settings.mouseSensitivity"
              @input="onSensitivityChange"
            />
            <span class="value-badge mono">{{ (settings.mouseSensitivity * 1000).toFixed(1) }}</span>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-name">INVERT VERTICAL LOOK</span>
            <span class="setting-desc">Invert mouse Y-axis view rotation</span>
          </div>
          <button
            class="toggle-btn mono"
            :class="{ active: settings.invertY }"
            @click="toggleInvertY"
          >
            {{ settings.invertY ? 'INVERTED' : 'STANDARD' }}
          </button>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-name">HEAD BOB & SWAY</span>
            <span class="setting-desc">Procedural camera motion during walk and sprint</span>
          </div>
          <button
            class="toggle-btn mono"
            :class="{ active: settings.cameraBob }"
            @click="toggleCameraBob"
          >
            {{ settings.cameraBob ? 'ENABLED' : 'DISABLED' }}
          </button>
        </div>

        <!-- Audio Section -->
        <div class="section-title mono">02 // AUDIO CALIBRATION</div>
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-name">MASTER VOLUME</span>
          </div>
          <div class="control-wrapper">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              :value="settings.masterVolume"
              @input="onMasterVolChange"
            />
            <span class="value-badge mono">{{ Math.round(settings.masterVolume * 100) }}%</span>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-name">SFX & WEAPONS VOLUME</span>
          </div>
          <div class="control-wrapper">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              :value="settings.sfxVolume"
              @input="onSfxVolChange"
            />
            <span class="value-badge mono">{{ Math.round(settings.sfxVolume * 100) }}%</span>
          </div>
        </div>

        <!-- Graphics & Performance Section -->
        <div class="section-title mono">03 // GRAPHICS & OPTIMIZATION (MAC M1)</div>
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-name">GRAPHICS PRESET</span>
            <span class="setting-desc">Shadow map detail, particle densities, and post-effects</span>
          </div>
          <div class="segmented-control mono">
            <button
              v-for="q in (['low', 'medium', 'high'] as const)"
              :key="q"
              :class="{ active: settings.graphicsQuality === q }"
              @click="setQuality(q)"
            >
              {{ q.toUpperCase() }}
            </button>
          </div>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div class="settings-footer">
        <button class="tactical-button danger" @click="resetToDefaults">
          RESET DEFAULTS
        </button>
        <button class="tactical-button primary-btn" @click="$emit('close')">
          APPLY & RETURN
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useSettingsStore } from '../../stores/settingsStore';
import type { GraphicsQuality } from '../../types/game';

defineEmits<{
  (e: 'close'): void;
}>();

const settingsStore = useSettingsStore();
const settings = computed(() => settingsStore.settings);

function onSensitivityChange(e: Event) {
  const val = parseFloat((e.target as HTMLInputElement).value);
  settingsStore.saveSettings({ mouseSensitivity: val });
}

function onMasterVolChange(e: Event) {
  const val = parseFloat((e.target as HTMLInputElement).value);
  settingsStore.saveSettings({ masterVolume: val });
}

function onSfxVolChange(e: Event) {
  const val = parseFloat((e.target as HTMLInputElement).value);
  settingsStore.saveSettings({ sfxVolume: val });
}

function setQuality(quality: GraphicsQuality) {
  settingsStore.saveSettings({ graphicsQuality: quality });
}

function toggleInvertY() {
  settingsStore.saveSettings({ invertY: !settings.value.invertY });
}

function toggleCameraBob() {
  settingsStore.saveSettings({ cameraBob: !settings.value.cameraBob });
}

function resetToDefaults() {
  settingsStore.resetSettings();
}
</script>

<style scoped>
.settings-modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(4, 7, 12, 0.85);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 70;
  user-select: none;
}

.settings-card {
  width: 540px;
  max-height: 85vh;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 14px;
}

.sub-tag {
  font-size: 11px;
  color: var(--color-primary);
  letter-spacing: 0.12em;
}

.title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--color-text-bright);
}

.close-x {
  padding: 6px 12px;
}

.settings-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-title {
  font-size: 11px;
  color: var(--color-text-dim);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding-bottom: 4px;
  margin-top: 8px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.setting-name {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--color-text-bright);
}

.setting-desc {
  font-size: 10px;
  color: var(--color-text-dim);
}

.control-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

input[type="range"] {
  appearance: none;
  -webkit-appearance: none;
  width: 140px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  outline: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  background: var(--color-primary);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 8px var(--color-primary);
}

.value-badge {
  font-size: 11px;
  color: var(--color-primary);
  width: 36px;
  text-align: right;
}

.toggle-btn {
  font-size: 11px;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: var(--color-text-dim);
  cursor: pointer;
}

.toggle-btn.active {
  background: rgba(0, 240, 255, 0.18);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.segmented-control {
  display: flex;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.segmented-control button {
  font-size: 10px;
  padding: 6px 12px;
  background: transparent;
  color: var(--color-text-dim);
  border: none;
  cursor: pointer;
}

.segmented-control button.active {
  background: var(--color-primary);
  color: #06090e;
  font-weight: 700;
}

.settings-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
}

.primary-btn {
  background: rgba(0, 240, 255, 0.2);
  border-color: var(--color-primary);
  color: var(--color-primary);
}
</style>
