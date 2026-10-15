import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSettingsStore } from '../../src/stores/settingsStore';

// Mock localStorage for Node test runner
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true
});

describe('SettingsStore and LocalStorage Persistence', () => {
  let settingsStore: ReturnType<typeof useSettingsStore>;

  beforeEach(() => {
    localStorageMock.clear();
    setActivePinia(createPinia());
    settingsStore = useSettingsStore();
  });

  it('loads safe defaults on clean initialization', () => {
    expect(settingsStore.settings.mouseSensitivity).toBe(0.0022);
    expect(settingsStore.settings.masterVolume).toBe(0.8);
    expect(settingsStore.settings.graphicsQuality).toBe('medium');
    expect(settingsStore.settings.cameraBob).toBe(true);
  });

  it('saves settings to localStorage and retains changes', () => {
    settingsStore.saveSettings({
      mouseSensitivity: 0.0035,
      graphicsQuality: 'high',
      invertY: true
    });

    expect(settingsStore.settings.mouseSensitivity).toBe(0.0035);
    expect(settingsStore.settings.graphicsQuality).toBe('high');
    expect(settingsStore.settings.invertY).toBe(true);

    const stored = JSON.parse(localStorage.getItem('shadow_protocol_settings_v1') || '{}');
    expect(stored.mouseSensitivity).toBe(0.0035);
    expect(stored.graphicsQuality).toBe('high');
    expect(stored.invertY).toBe(true);
  });

  it('falls back to safe defaults when invalid or corrupted settings are passed', () => {
    settingsStore.saveSettings({
      // @ts-expect-error test invalid string quality
      graphicsQuality: 'ultra_mega_rtx',
      masterVolume: 99999, // Should be clamped
      mouseSensitivity: -5 // Invalid negative sensitivity
    });

    expect(settingsStore.settings.graphicsQuality).toBe('medium');
    expect(settingsStore.settings.masterVolume).toBe(1);
    expect(settingsStore.settings.mouseSensitivity).toBe(0.0022);
  });

  it('resets settings to defaults properly', () => {
    settingsStore.saveSettings({ mouseSensitivity: 0.005 });
    expect(settingsStore.settings.mouseSensitivity).toBe(0.005);

    settingsStore.resetSettings();
    expect(settingsStore.settings.mouseSensitivity).toBe(0.0022);
  });
});
