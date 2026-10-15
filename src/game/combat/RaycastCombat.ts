import * as THREE from 'three';
import { CollisionWorld } from '../world/CollisionWorld';
import { EnemyManager } from '../enemies/EnemyManager';
import { ParticleManager } from '../effects/ParticleManager';
import { DecalManager } from '../effects/DecalManager';
import { AudioManager } from '../core/AudioManager';
import type { ShotEvent } from '../weapons/WeaponController';

export interface CombatHitResult {
  hitSomething: boolean;
  hitEnemy: boolean;
  isHeadshot: boolean;
  isKill: boolean;
  damageDealt: number;
  hitPoint?: THREE.Vector3;
}

export class RaycastCombat {
  private raycaster = new THREE.Raycaster();
  private collision: CollisionWorld;
  private enemyManager: EnemyManager;
  private particles: ParticleManager;
  private decalManager?: DecalManager;
  private audioManager: AudioManager;

  constructor(
    collision: CollisionWorld,
    enemyManager: EnemyManager,
    particles: ParticleManager,
    audioManager: AudioManager,
    decalManager?: DecalManager
  ) {
    this.collision = collision;
    this.enemyManager = enemyManager;
    this.particles = particles;
    this.audioManager = audioManager;
    this.decalManager = decalManager;
  }

  public processShot(shot: ShotEvent): CombatHitResult {
    const origin = new THREE.Vector3(shot.origin.x, shot.origin.y, shot.origin.z);
    const direction = new THREE.Vector3(shot.direction.x, shot.direction.y, shot.direction.z).normalize();

    this.raycaster.set(origin, direction);
    this.raycaster.far = shot.range;

    // Gather candidate meshes to test
    const solidMeshes = this.collision.solidMeshes;
    const targetMeshes = this.enemyManager.getTargetMeshes();
    const allMeshes = [...solidMeshes, ...targetMeshes];

    const intersections = this.raycaster.intersectObjects(allMeshes, true);

    if (intersections.length === 0) {
      return {
        hitSomething: false,
        hitEnemy: false,
        isHeadshot: false,
        isKill: false,
        damageDealt: 0
      };
    }

    // Closest object hit
    const hit = intersections[0];
    const hitObj = hit.object;

    // Check if this object belongs to an enemy
    const enemyData = (hitObj as unknown as { enemyId?: string; isHead?: boolean });
    if (enemyData.enemyId) {
      const enemy = this.enemyManager.getEnemyById(enemyData.enemyId);
      if (enemy && !enemy.isDead) {
        const isHeadshot = !!enemyData.isHead;
        const result = enemy.takeDamage(shot.damage, isHeadshot);

        // Sparks & blood
        const hitNormal = hit.face ? hit.face.normal : new THREE.Vector3(0, 1, 0);
        this.particles.spawnImpactSparks(hit.point, hitNormal, true);
        this.audioManager.playHitMarker();

        if (result.isKill && this.enemyManager.onEnemyKilled) {
          this.enemyManager.onEnemyKilled(enemy);
        }

        return {
          hitSomething: true,
          hitEnemy: true,
          isHeadshot,
          isKill: result.isKill,
          damageDealt: result.damageDealt,
          hitPoint: hit.point
        };
      }
    }

    // Struck environment wall/crate
    const hitNormal = hit.face ? hit.face.normal : new THREE.Vector3(0, 1, 0);
    this.particles.spawnImpactSparks(hit.point, hitNormal, false);
    if (this.decalManager) {
      this.decalManager.spawnDecal(hit.point, hitNormal);
    }

    return {
      hitSomething: true,
      hitEnemy: false,
      isHeadshot: false,
      isKill: false,
      damageDealt: 0,
      hitPoint: hit.point
    };
  }
}
