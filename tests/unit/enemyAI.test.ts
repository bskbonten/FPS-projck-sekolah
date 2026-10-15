import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { Enemy } from '../../src/game/enemies/Enemy';
import { EnemyAI } from '../../src/game/enemies/EnemyAI';
import { CollisionWorld } from '../../src/game/world/CollisionWorld';
import { AudioManager } from '../../src/game/core/AudioManager';
import type { EnemyConfig } from '../../src/types/enemy';

describe('Enemy Entity and FSM State Transitions', () => {
  let scene: THREE.Scene;
  let collision: CollisionWorld;
  let audioManager: AudioManager;
  let testConfig: EnemyConfig;
  let enemy: Enemy;

  beforeEach(() => {
    scene = new THREE.Scene();
    collision = new CollisionWorld();
    audioManager = new AudioManager();

    testConfig = {
      id: 'test_enemy',
      name: 'Test Enforcer',
      health: 100,
      maxHealth: 100,
      moveSpeed: 3.0,
      runSpeed: 5.0,
      detectionRadius: 20,
      alertRadius: 15,
      attackRange: 20,
      fieldOfView: 110,
      attackCooldown: 1.0,
      damage: 15,
      accuracy: 0.6,
      patrolWaypoints: [
        { x: 0, y: 0, z: -10 },
        { x: 0, y: 0, z: -20 }
      ]
    };

    enemy = new Enemy(testConfig, scene);
  });

  it('initializes in PATROL state with full health', () => {
    expect(enemy.state).toBe('PATROL');
    expect(enemy.health).toBe(100);
    expect(enemy.isDead).toBe(false);
  });

  it('inflicts regular damage on body hit', () => {
    const result = enemy.takeDamage(30, false);
    expect(result.damageDealt).toBe(30);
    expect(enemy.health).toBe(70);
    expect(enemy.isDead).toBe(false);
  });

  it('inflicts critical damage on headshot (2.2x multiplier)', () => {
    const result = enemy.takeDamage(40, true);
    expect(result.damageDealt).toBe(88); // 40 * 2.2 = 88
    expect(enemy.health).toBe(12);
  });

  it('transitions to DEAD state when health is reduced to zero', () => {
    const result = enemy.takeDamage(120, false);
    expect(result.isKill).toBe(true);
    expect(enemy.health).toBe(0);
    expect(enemy.isDead).toBe(true);
    expect(enemy.state).toBe('DEAD');
  });

  it('transitions from PATROL to ALERT when player is spotted in line of sight', () => {
    // Enemy is at (0, 0, -10), facing forward (0, 0, -1)
    // Place player directly in front at (0, 0, -15)
    const playerPos = new THREE.Vector3(0, 0, -15);
    
    EnemyAI.update(enemy, 0.1, playerPos, collision, audioManager, () => {});
    expect(enemy.state).toBe('ALERT');
  });

  it('does not detect player if blocked by a solid wall collider', () => {
    // Add a solid wall between enemy and player
    const wallBox = new THREE.Box3(
      new THREE.Vector3(-5, 0, -13),
      new THREE.Vector3(5, 4, -12)
    );
    collision.addBoxCollider(wallBox, 'wall');

    const playerPos = new THREE.Vector3(0, 0, -15);
    EnemyAI.update(enemy, 0.1, playerPos, collision, audioManager, () => {});
    expect(enemy.state).toBe('PATROL'); // Blocked by wall
  });

  it('attacks when within attack range and cooldown permits', () => {
    enemy.state = 'ATTACK';
    enemy.timeSinceLastAttack = 1.5; // Cooldown is 1.0s
    enemy.config.accuracy = 1.0;     // Force 100% hit for test

    let attackFired = false;
    const playerPos = new THREE.Vector3(0, 0, -14); // In range (dist: 4m < 20m)

    EnemyAI.update(enemy, 0.1, playerPos, collision, audioManager, () => {
      attackFired = true;
    });

    expect(attackFired).toBe(true);
    expect(enemy.timeSinceLastAttack).toBe(0);
  });
});
