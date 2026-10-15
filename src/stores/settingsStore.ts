import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { GameSettings, GraphicsQuality } from '../types/game';

const SETTINGS_STORAGE_KEY = 'shadow_protocol_settings_v1';

const DEFAULT_SETTINGS: GameSettings = {
  mouseSensitivity: 0.0022,
  masterVolume: 0.8,
  sfxVolume: 0.85,
  ambientVolume: 0.6,
  graphicsQuality: 'medium',
  resolutionScale: 1.0,
  cameraBob: true,
  motionEffects: true,
  invertY: false
};

function sanitizeSettings(data: unknown): GameSettings {
  if (!data || typeof data !== 'object') {
    return { ...DEFAULT_SETTINGS };
  }

  const obj = data as Partial<GameSettings>;
  const validQualities: GraphicsQuality[] = ['low', 'medium', 'high'];

  return {
    mouseSensitivity: typeof obj.mouseSensitivity === 'number' && obj.mouseSensitivity > 0.0005 && obj.mouseSensitivity < 0.02
      ? obj.mouseSensitivity
      : DEFAULT_SETTINGS.mouseSensitivity,
    masterVolume: typeof obj.masterVolume === 'number' ? Math.max(0, Math.min(1, obj.masterVolume)) : DEFAULT_SETTINGS.masterVolume,
    sfxVolume: typeof obj.sfxVolume === 'number' ? Math.max(0, Math.min(1, obj.sfxVolume)) : DEFAULT_SETTINGS.sfxVolume,
    ambientVolume: typeof obj.ambientVolume === 'number' ? Math.max(0, Math.min(1, obj.ambientVolume)) : DEFAULT_SETTINGS.ambientVolume,
    graphicsQuality: validQualities.includes(obj.graphicsQuality as GraphicsQuality)
      ? (obj.graphicsQuality as GraphicsQuality)
      : DEFAULT_SETTINGS.graphicsQuality,
    resolutionScale: typeof obj.resolutionScale === 'number' && [0.75, 1.0, 1.25].includes(obj.resolutionScale)
      ? obj.resolutionScale
      : DEFAULT_SETTINGS.resolutionScale,
    cameraBob: typeof obj.cameraBob === 'boolean' ? obj.cameraBob : DEFAULT_SETTINGS.cameraBob,
    motionEffects: typeof obj.motionEffects === 'boolean' ? obj.motionEffects : DEFAULT_SETTINGS.motionEffects,
    invertY: typeof obj.invertY === 'boolean' ? obj.invertY : DEFAULT_SETTINGS.invertY
  };
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<GameSettings>(loadInitialSettings());

  function loadInitialSettings(): GameSettings {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return sanitizeSettings(parsed);
      }
    } catch (e) {
      console.warn('Failed to load settings from localStorage, using defaults', e);
    }
    return { ...DEFAULT_SETTINGS };
  }

  function saveSettings(newSettings: Partial<GameSettings>) {
    settings.value = sanitizeSettings({
      ...settings.value,
      ...newSettings
    });
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings.value));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
  }

  function resetSettings() {
    settings.value = { ...DEFAULT_SETTINGS };
    try {
      localStorage.removeItem(SETTINGS_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to reset settings in localStorage', e);
    }
  }

  return {
    settings,
    saveSettings,
    resetSettings
  };
});
