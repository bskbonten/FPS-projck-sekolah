import * as THREE from 'three';
import { Enemy } from './Enemy';
import { EnemyAI, type EnemyAttackEvent } from './EnemyAI';
import type { EnemyConfig } from '../../types/enemy';
import { CollisionWorld } from '../world/CollisionWorld';
import { AudioManager } from '../core/AudioManager';

export const INITIAL_ENEMY_CONFIGS: EnemyConfig[] = [
  {
    id: 'enemy_alpha',
    name: 'Syndicate Scout Alpha',
    health: 80,
    maxHealth: 80,
    moveSpeed: 2.8,
    runSpeed: 4.8,
    detectionRadius: 22,
    alertRadius: 18,
    attackRange: 26,
    fieldOfView: 110,
    attackCooldown: 1.2,
    damage: 14,
    accuracy: 0.55,
    patrolWaypoints: [
      { x: -2, y: 0, z: -10 },
      { x: 4, y: 0, z: -16 },
      { x: -5, y: 0, z: -20 },
      { x: 3, y: 0, z: -8 }
    ]
  },
  {
    id: 'enemy_beta',
    name: 'Yard Enforcer Beta',
    health: 100,
    maxHealth: 100,
    moveSpeed: 2.6,
    runSpeed: 5.0,
    detectionRadius: 24,
    alertRadius: 20,
    attackRange: 28,
    fieldOfView: 110,
    attackCooldown: 1.0,
    damage: 16,
    accuracy: 0.60,
    patrolWaypoints: [
      { x: -14, y: 0, z: -25 },
      { x: -8, y: 0, z: -38 },
      { x: -16, y: 0, z: -46 },
      { x: -12, y: 0, z: -32 }
    ]
  },
  {
    id: 'enemy_gamma',
    name: 'Yard Enforcer Gamma',
    health: 100,
    maxHealth: 100,
    moveSpeed: 2.6,
    runSpeed: 5.0,
    detectionRadius: 24,
    alertRadius: 20,
    attackRange: 28,
    fieldOfView: 110,
    attackCooldown: 1.0,
    damage: 16,
    accuracy: 0.60,
    patrolWaypoints: [
      { x: 10, y: 0, z: -24 },
      { x: 15, y: 0, z: -36 },
      { x: 8, y: 0, z: -48 },
      { x: 14, y: 0, z: -30 }
    ]
  },
  {
    id: 'enemy_delta',
    name: 'Facility Sentinel Delta',
    health: 120,
    maxHealth: 120,
    moveSpeed: 2.4,
    runSpeed: 4.5,
    detectionRadius: 22,
    alertRadius: 18,
    attackRange: 22,
    fieldOfView: 120,
    attackCooldown: 0.9,
    damage: 18,
    accuracy: 0.65,
    patrolWaypoints: [
      { x: -15, y: 0, z: -62 },
      { x: -21, y: 0, z: -64 },
      { x: -18, y: 0, z: -72 },
      { x: -14, y: 0, z: -66 }
    ]
  },
  {
    id: 'enemy_epsilon',
    name: 'VTOL Perimeter Guard Epsilon',
    health: 110,
    maxHealth: 110,
    moveSpeed: 2.8,
    runSpeed: 5.2,
    detectionRadius: 26,
    alertRadius: 22,
    attackRange: 30,
    fieldOfView: 120,
    attackCooldown: 0.95,
    damage: 18,
    accuracy: 0.65,
    patrolWaypoints: [
      { x: 16, y: 0, z: -76 },
      { x: 26, y: 0, z: -80 },
      { x: 20, y: 0, z: -90 },
      { x: 14, y: 0, z: -82 }
    ]
  }
];

export class EnemyManager {
  public enemies: Enemy[] = [];
  private scene: THREE.Scene;
  private collision: CollisionWorld;
  private audioManager: AudioManager;

  public onEnemyKilled?: (enemy: Enemy) => void;
  public onPlayerAttacked?: (evt: EnemyAttackEvent) => void;

  constructor(scene: THREE.Scene, collision: CollisionWorld, audioManager: AudioManager) {
    this.scene = scene;
    this.collision = collision;
    this.audioManager = audioManager;
  }

  public spawnEnemies(): void {
    this.clear();
    INITIAL_ENEMY_CONFIGS.forEach(cfg => {
      const enemy = new Enemy(cfg, this.scene);
      this.enemies.push(enemy);
    });
  }

  public getTargetMeshes(): THREE.Object3D[] {
    const list: THREE.Object3D[] = [];
    this.enemies.forEach(e => {
      if (!e.isDead) {
        list.push(e.headMesh);
        list.push(e.bodyMesh);
      }
    });
    return list;
  }

  public getEnemyById(id: string): Enemy | undefined {
    return this.enemies.find(e => e.id === id);
  }

  public update(dt: number, playerPos: THREE.Vector3): void {
    for (let i = 0; i < this.enemies.length; i++) {
      const enemy = this.enemies[i];
      if (enemy.isDead) continue;

      EnemyAI.update(
        enemy,
        dt,
        playerPos,
        this.collision,
        this.audioManager,
        (evt) => {
          if (this.onPlayerAttacked) {
            this.onPlayerAttacked(evt);
          }
        }
      );
    }
  }

  public getAliveCount(): number {
    return this.enemies.filter(e => !e.isDead).length;
  }

  public clear(): void {
    this.enemies.forEach(e => e.dispose(this.scene));
    this.enemies = [];
  }
}
