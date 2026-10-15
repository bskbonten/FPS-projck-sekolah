import * as THREE from 'three';
import { Enemy } from './Enemy';
import { CollisionWorld } from '../world/CollisionWorld';
import { AudioManager } from '../core/AudioManager';

export interface EnemyAttackEvent {
  enemyId: string;
  sourcePos: { x: number; y: number; z: number };
  damage: number;
}

export class EnemyAI {
  public static update(
    enemy: Enemy,
    dt: number,
    playerPosition: THREE.Vector3,
    collision: CollisionWorld,
    audioManager: AudioManager,
    onAttackPlayer: (evt: EnemyAttackEvent) => void
  ): void {
    if (enemy.isDead || enemy.state === 'DEAD') return;

    enemy.timeSinceLastAttack += dt;

    // Vector to player
    const toPlayer = new THREE.Vector3().subVectors(playerPosition, enemy.position);
    const distToPlayer = toPlayer.length();
    toPlayer.y = 0; // horizontal angle
    toPlayer.normalize();

    // Line of sight check
    const eyePos = enemy.position.clone();
    eyePos.y += 1.8;
    const playerEye = playerPosition.clone();
    playerEye.y += 1.6;

    const hasLOS = collision.hasLineOfSight(eyePos, playerEye);

    // Field of view check (angle between enemy forward and toPlayer)
    const angleToPlayer = enemy.forward.angleTo(toPlayer); // in radians
    const fovRad = (enemy.config.fieldOfView * Math.PI) / 360;
    const inFOV = angleToPlayer <= fovRad;

    // Detection logic
    const canSeePlayer = hasLOS && ((distToPlayer <= enemy.config.detectionRadius && inFOV) || distToPlayer <= 5.0);

    let isMoving = false;

    switch (enemy.state) {
      case 'PATROL': {
        if (canSeePlayer) {
          enemy.state = 'ALERT';
          enemy.alertTimer = 0.45;
          audioManager.playEnemyAlert();
          break;
        }

        // Patrol waypoints navigation
        const waypoints = enemy.config.patrolWaypoints;
        if (waypoints.length > 0) {
          const wp = waypoints[enemy.currentWaypointIndex];
          const wpVec = new THREE.Vector3(wp.x, wp.y, wp.z);
          const toWp = new THREE.Vector3().subVectors(wpVec, enemy.position);
          toWp.y = 0;
          const distToWp = toWp.length();

          if (distToWp < 1.2) {
            enemy.currentWaypointIndex = (enemy.currentWaypointIndex + 1) % waypoints.length;
          } else {
            toWp.normalize();
            // Steer towards waypoint
            enemy.forward.lerp(toWp, dt * 5).normalize();
            const moveStep = enemy.forward.clone().multiplyScalar(enemy.config.moveSpeed * dt);
            const targetPos = enemy.position.clone().add(moveStep);
            const resolved = collision.resolvePlayerCollision(enemy.position, targetPos, 0.45, 1.8);
            enemy.position.copy(resolved);
            isMoving = true;
          }
        }
        break;
      }

      case 'ALERT': {
        // Face player
        enemy.forward.lerp(toPlayer, dt * 8).normalize();
        enemy.alertTimer -= dt;
        if (enemy.alertTimer <= 0) {
          if (distToPlayer <= enemy.config.attackRange && hasLOS) {
            enemy.state = 'ATTACK';
          } else {
            enemy.state = 'CHASE';
          }
        }
        break;
      }

      case 'CHASE': {
        if (canSeePlayer) {
          enemy.lastKnownPlayerPos.copy(playerPosition);
          // Face player
          enemy.forward.lerp(toPlayer, dt * 6).normalize();

          if (distToPlayer <= enemy.config.attackRange && hasLOS) {
            enemy.state = 'ATTACK';
          } else {
            // Run toward player
            const step = enemy.forward.clone().multiplyScalar(enemy.config.runSpeed * dt);
            const targetPos = enemy.position.clone().add(step);
            const resolved = collision.resolvePlayerCollision(enemy.position, targetPos, 0.45, 1.8);
            enemy.position.copy(resolved);
            isMoving = true;
          }
        } else {
          // Lost line of sight, switch to investigate
          enemy.state = 'INVESTIGATE';
        }
        break;
      }

      case 'ATTACK': {
        // Face player directly
        enemy.forward.lerp(toPlayer, dt * 10).normalize();

        if (!hasLOS || distToPlayer > enemy.config.attackRange * 1.2) {
          enemy.state = 'CHASE';
          break;
        }

        // Fire on attack cooldown
        if (enemy.timeSinceLastAttack >= enemy.config.attackCooldown) {
          enemy.timeSinceLastAttack = 0;
          audioManager.playEnemyFire();

          // Accuracy check (rolls accuracy chance)
          const hitRoll = Math.random();
          if (hitRoll <= enemy.config.accuracy) {
            onAttackPlayer({
              enemyId: enemy.id,
              sourcePos: { x: enemy.position.x, y: enemy.position.y + 1.2, z: enemy.position.z },
              damage: enemy.config.damage
            });
          }
        }
        break;
      }

      case 'INVESTIGATE': {
        if (canSeePlayer) {
          enemy.state = 'CHASE';
          break;
        }

        const toTarget = new THREE.Vector3().subVectors(enemy.lastKnownPlayerPos, enemy.position);
        toTarget.y = 0;
        const dist = toTarget.length();

        if (dist < 1.5) {
          enemy.state = 'SEARCH';
          enemy.searchTimer = 3.5;
        } else {
          toTarget.normalize();
          enemy.forward.lerp(toTarget, dt * 5).normalize();
          const step = enemy.forward.clone().multiplyScalar(enemy.config.moveSpeed * dt);
          const targetPos = enemy.position.clone().add(step);
          const resolved = collision.resolvePlayerCollision(enemy.position, targetPos, 0.45, 1.8);
          enemy.position.copy(resolved);
          isMoving = true;
        }
        break;
      }

      case 'SEARCH': {
        if (canSeePlayer) {
          enemy.state = 'CHASE';
          break;
        }

        // Rotate slowly in place
        enemy.mesh.rotation.y += dt * 1.5;
        enemy.forward.set(-Math.sin(enemy.mesh.rotation.y), 0, -Math.cos(enemy.mesh.rotation.y));

        enemy.searchTimer -= dt;
        if (enemy.searchTimer <= 0) {
          enemy.state = 'PATROL';
        }
        break;
      }
    }

    // Update 3D mesh transform
    enemy.mesh.position.copy(enemy.position);
    if (enemy.state !== 'SEARCH') {
      const targetAngle = Math.atan2(-enemy.forward.x, -enemy.forward.z);
      enemy.mesh.rotation.y = targetAngle;
    }

    enemy.updateAnimation(dt, isMoving);
  }
}
