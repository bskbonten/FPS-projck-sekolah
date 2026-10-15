import * as THREE from 'three';
import { useGameStore } from '../../stores/gameStore';
import { AudioManager } from '../core/AudioManager';
import { EnemyManager } from '../enemies/EnemyManager';
import type { ObjectiveId } from '../../types/mission';

export class MissionController {
  private gameStore: ReturnType<typeof useGameStore>;
  private audioManager: AudioManager;
  private enemyManager: EnemyManager;

  private terminalPos = new THREE.Vector3(-18, 0, -68);
  private extractionPos = new THREE.Vector3(22, 0, -85);

  private terminalHacked = false;
  private missionStartTime = 0;
  private isCompleted = false;

  constructor(
    gameStore: ReturnType<typeof useGameStore>,
    audioManager: AudioManager,
    enemyManager: EnemyManager
  ) {
    this.gameStore = gameStore;
    this.audioManager = audioManager;
    this.enemyManager = enemyManager;
    this.missionStartTime = performance.now();
  }

  public update(dt: number, playerPos: THREE.Vector3, interactPressed: boolean): void {
    if (this.isCompleted || this.gameStore.gameState !== 'PLAYING') return;

    // Track elapsed time
    this.gameStore.stats.elapsedTime = Math.floor((performance.now() - this.missionStartTime) / 1000);

    const currentObj = this.gameStore.currentObjective;
    if (!currentObj) return;

    switch (currentObj.id) {
      case 'obj_infiltrate': {
        // Player enters industrial compound perimeter (Z <= -15)
        if (playerPos.z <= -15) {
          this.completeObjective('obj_infiltrate');
          this.activateObjective('obj_neutralize_patrol');
          this.gameStore.showBanner('PERIMETER BREACHED', 'Hostile patrols detected in logistics yard.', 'info');
        }
        break;
      }

      case 'obj_neutralize_patrol': {
        const kills = this.gameStore.stats.enemiesEliminated;
        this.gameStore.setObjectiveStatus('obj_neutralize_patrol', 'active', kills, 3);

        // Completed either by eliminating 3 enemies or infiltrating deep to the facility entrance (Z <= -55)
        if (kills >= 3 || playerPos.z <= -55) {
          this.completeObjective('obj_neutralize_patrol');
          this.activateObjective('obj_hack_terminal');
          this.gameStore.showBanner('FACILITY ACCESSED', 'Locate the primary network terminal.', 'info');
        }
        break;
      }

      case 'obj_hack_terminal': {
        const distToTerminal = playerPos.distanceTo(this.terminalPos);
        if (distToTerminal <= 3.8) {
          this.gameStore.setInteractionPrompt('PRESS [E] TO OVERRIDE DATA TERMINAL');
          if (interactPressed && !this.terminalHacked) {
            this.terminalHacked = true;
            this.audioManager.playTerminalBeep();
            this.completeObjective('obj_hack_terminal');
            this.activateObjective('obj_survive_assault');
            this.gameStore.setInteractionPrompt(null);
            this.gameStore.showBanner('DATA DECRYPTED', 'Security network compromised! Hostiles converging!', 'danger');
            
            // Alert remaining enemies to chase player
            this.enemyManager.enemies.forEach(e => {
              if (!e.isDead) {
                e.state = 'CHASE';
              }
            });
          }
        } else {
          this.gameStore.setInteractionPrompt(null);
        }
        break;
      }

      case 'obj_survive_assault': {
        const aliveEnemies = this.enemyManager.getAliveCount();
        const needed = 5;
        const eliminated = this.gameStore.stats.enemiesEliminated;
        this.gameStore.setObjectiveStatus('obj_survive_assault', 'active', eliminated, needed);

        // Survived when either remaining enemies eliminated or player fights way through to outdoor yard (Z > -70 && X > 0)
        if (aliveEnemies <= 1 || (playerPos.x > 5 && playerPos.z >= -78)) {
          this.completeObjective('obj_survive_assault');
          this.activateObjective('obj_extract');
          this.gameStore.showBanner('EXTRACTION AUTHORIZED', 'VTOL standing by at designated helipad.', 'success');
        }
        break;
      }

      case 'obj_extract': {
        const distToExtraction = playerPos.distanceTo(this.extractionPos);
        if (distToExtraction <= 7.5) {
          this.completeMission();
        }
        break;
      }
    }
  }

  private completeObjective(id: ObjectiveId): void {
    this.gameStore.setObjectiveStatus(id, 'completed');
    this.audioManager.playObjectiveComplete();
  }

  private activateObjective(id: ObjectiveId): void {
    this.gameStore.setObjectiveStatus(id, 'active');
  }

  public completeMission(): void {
    if (this.isCompleted) return;
    this.isCompleted = true;
    this.completeObjective('obj_extract');

    // Calculate rating
    const rating = this.gameStore.calculateRating();
    this.gameStore.stats.rating = rating;
    this.gameStore.saveBestRecordIfBetter(this.gameStore.stats);

    this.audioManager.playMissionSuccess();
    this.gameStore.setGameState('MISSION_COMPLETE');
  }

  public handlePlayerDeath(): void {
    this.audioManager.playMissionDefeat();
    this.gameStore.setGameState('PLAYER_DEAD');
  }

  public reset(): void {
    this.terminalHacked = false;
    this.isCompleted = false;
    this.missionStartTime = performance.now();
  }
}
