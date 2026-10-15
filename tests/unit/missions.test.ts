import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { setActivePinia, createPinia } from 'pinia';
import { useGameStore } from '../../src/stores/gameStore';
import { MissionController } from '../../src/game/missions/MissionController';
import { AudioManager } from '../../src/game/core/AudioManager';
import { EnemyManager } from '../../src/game/enemies/EnemyManager';
import { CollisionWorld } from '../../src/game/world/CollisionWorld';

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

describe('MissionController and Objectives Flow', () => {
  let gameStore: ReturnType<typeof useGameStore>;
  let missionCtrl: MissionController;
  let audioManager: AudioManager;
  let enemyManager: EnemyManager;

  beforeEach(() => {
    localStorageMock.clear();
    setActivePinia(createPinia());
    gameStore = useGameStore();
    audioManager = new AudioManager();
    const scene = new THREE.Scene();
    const collision = new CollisionWorld();
    enemyManager = new EnemyManager(scene, collision, audioManager);
    missionCtrl = new MissionController(gameStore, audioManager, enemyManager);
    gameStore.setGameState('PLAYING');
  });

  it('starts with Objective 1 (Infiltrate Compound) active', () => {
    expect(gameStore.currentObjective?.id).toBe('obj_infiltrate');
  });

  it('completes Objective 1 and activates Objective 2 when player breaches perimeter (Z <= -15)', () => {
    const playerPos = new THREE.Vector3(0, 0, -16);
    missionCtrl.update(0.1, playerPos, false);

    const obj1 = gameStore.objectives.find(o => o.id === 'obj_infiltrate');
    const obj2 = gameStore.objectives.find(o => o.id === 'obj_neutralize_patrol');

    expect(obj1?.status).toBe('completed');
    expect(obj2?.status).toBe('active');
    expect(gameStore.currentObjective?.id).toBe('obj_neutralize_patrol');
  });

  it('completes Objective 2 when 3 enemies are eliminated', () => {
    // Progress past obj 1
    missionCtrl.update(0.1, new THREE.Vector3(0, 0, -16), false);

    // Eliminate 3 enemies
    gameStore.stats.enemiesEliminated = 3;
    missionCtrl.update(0.1, new THREE.Vector3(0, 0, -25), false);

    const obj2 = gameStore.objectives.find(o => o.id === 'obj_neutralize_patrol');
    const obj3 = gameStore.objectives.find(o => o.id === 'obj_hack_terminal');

    expect(obj2?.status).toBe('completed');
    expect(obj3?.status).toBe('active');
  });

  it('does NOT permit terminal hack from far away (> 3.8m)', () => {
    // Advance to obj 3
    missionCtrl.update(0.1, new THREE.Vector3(0, 0, -16), false);
    gameStore.stats.enemiesEliminated = 3;
    missionCtrl.update(0.1, new THREE.Vector3(0, 0, -25), false);

    // Player is far away at (0, 0, 0) - Terminal is at (-18, 0, -68)
    missionCtrl.update(0.1, new THREE.Vector3(0, 0, 0), true);

    const obj3 = gameStore.objectives.find(o => o.id === 'obj_hack_terminal');
    expect(obj3?.status).toBe('active');
    expect(gameStore.interactionPrompt).toBeNull();
  });

  it('shows interaction prompt and overrides terminal when within 3.5m and E is pressed', () => {
    // Advance to obj 3
    missionCtrl.update(0.1, new THREE.Vector3(0, 0, -16), false);
    gameStore.stats.enemiesEliminated = 3;
    missionCtrl.update(0.1, new THREE.Vector3(0, 0, -25), false);

    // Player is next to terminal at (-18, 0, -67.5)
    const nearTerminal = new THREE.Vector3(-18, 0, -67.5);
    missionCtrl.update(0.1, nearTerminal, false);
    expect(gameStore.interactionPrompt).toContain('PRESS [E]');

    // Press E
    missionCtrl.update(0.1, nearTerminal, true);

    const obj3 = gameStore.objectives.find(o => o.id === 'obj_hack_terminal');
    const obj4 = gameStore.objectives.find(o => o.id === 'obj_survive_assault');

    expect(obj3?.status).toBe('completed');
    expect(obj4?.status).toBe('active');
  });

  it('completes the mission and assigns rating when reaching extraction helipad (22, 0, -85)', () => {
    // Mark prior objectives completed so obj_extract is the active objective
    gameStore.setObjectiveStatus('obj_infiltrate', 'completed');
    gameStore.setObjectiveStatus('obj_neutralize_patrol', 'completed');
    gameStore.setObjectiveStatus('obj_hack_terminal', 'completed');
    gameStore.setObjectiveStatus('obj_survive_assault', 'completed');
    gameStore.setObjectiveStatus('obj_extract', 'active');

    // Player enters helipad zone
    const helipadPos = new THREE.Vector3(22, 0, -85);
    missionCtrl.update(0.1, helipadPos, false);

    expect(gameStore.gameState).toBe('MISSION_COMPLETE');
    expect(['S', 'A', 'B', 'C', 'D']).toContain(gameStore.stats.rating);
  });

  it('calculates S-tier rating correctly on high accuracy and fast clear', () => {
    gameStore.stats.accuracy = 75;
    gameStore.stats.elapsedTime = 120;
    gameStore.stats.damageTaken = 20;

    const rating = gameStore.calculateRating();
    expect(rating).toBe('S');
  });

  it('resets mission correctly on restart', () => {
    gameStore.stats.shotsFired = 50;
    gameStore.stats.enemiesEliminated = 4;
    gameStore.resetGame();

    expect(gameStore.stats.shotsFired).toBe(0);
    expect(gameStore.stats.enemiesEliminated).toBe(0);
    expect(gameStore.currentObjective?.id).toBe('obj_infiltrate');
  });
});
