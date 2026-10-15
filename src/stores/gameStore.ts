import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { 
  GameStateEnum, 
  PlayerStats, 
  MissionStats, 
  DamageFeedbackEvent, 
  HitMarkerEvent 
} from '../types/game';
import type { WeaponId } from '../types/weapon';
import type { MissionObjective, ObjectiveId } from '../types/mission';

const HIGH_SCORE_KEY = 'shadow_protocol_records_v1';

const INITIAL_OBJECTIVES: MissionObjective[] = [
  {
    id: 'obj_infiltrate',
    title: 'INFILTRATE COMPOUND',
    description: 'Bypass exterior perimeter and reach Sector 4 industrial yard.',
    status: 'active',
    markerPosition: { x: 0, y: 0.5, z: -25 }
  },
  {
    id: 'obj_neutralize_patrol',
    title: 'ELIMINATE PATROL',
    description: 'Neutralize the hostile syndicate patrols guarding the logistics hub.',
    status: 'locked',
    progress: 0,
    total: 3
  },
  {
    id: 'obj_hack_terminal',
    title: 'OVERRIDE DATA TERMINAL',
    description: 'Locate the control room and download defense network encryption keys.',
    status: 'locked',
    markerPosition: { x: -18, y: 1.0, z: -68 }
  },
  {
    id: 'obj_survive_assault',
    title: 'SURVIVE REINFORCEMENTS',
    description: 'Terminal alert triggered heavy response team. Eliminate hostile combatants.',
    status: 'locked',
    progress: 0,
    total: 2
  },
  {
    id: 'obj_extract',
    title: 'REACH EXTRACTION ZONE',
    description: 'Proceed to helipad landing marker for VTOL tactical extraction.',
    status: 'locked',
    markerPosition: { x: 22, y: 0.5, z: -85 }
  }
];

export const useGameStore = defineStore('game', () => {
  const gameState = ref<GameStateEnum>('MAIN_MENU');
  
  // Player state
  const player = ref<PlayerStats>({
    health: 100,
    maxHealth: 100,
    armor: 50,
    maxArmor: 50,
    isDead: false,
    isSprinting: false,
    isCrouching: false,
    isAiming: false,
    speed: 0
  });

  // Weapon HUD state
  const currentWeapon = ref<WeaponId>('ar01');
  const weaponName = ref<string>('AR-01 PHANTOM');
  const currentMag = ref<number>(30);
  const maxMag = ref<number>(30);
  const reserveAmmo = ref<number>(120);
  const isReloading = ref<boolean>(false);
  const reloadProgress = ref<number>(0);

  // Objectives
  const objectives = ref<MissionObjective[]>(JSON.parse(JSON.stringify(INITIAL_OBJECTIVES)));
  const currentObjective = computed(() => {
    return objectives.value.find(o => o.status === 'active') || null;
  });

  // Interaction prompt
  const interactionPrompt = ref<string | null>(null);

  // HUD Feedbacks
  const hitMarkers = ref<HitMarkerEvent[]>([]);
  const damageFeedbacks = ref<DamageFeedbackEvent[]>([]);
  const bannerMessage = ref<{ title: string; subtitle?: string; type: 'info' | 'success' | 'danger' } | null>(null);

  // Mission Metrics
  const stats = ref<MissionStats>({
    elapsedTime: 0,
    shotsFired: 0,
    shotsHit: 0,
    accuracy: 0,
    enemiesEliminated: 0,
    totalEnemies: 5,
    damageTaken: 0,
    damageDealt: 0,
    rating: 'B'
  });

  // Records
  const bestRecord = ref<MissionStats | null>(loadBestRecord());

  function loadBestRecord(): MissionStats | null {
    try {
      const raw = localStorage.getItem(HIGH_SCORE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return null;
  }

  function saveBestRecordIfBetter(newRecord: MissionStats) {
    if (!bestRecord.value || newRecord.elapsedTime < bestRecord.value.elapsedTime || newRecord.accuracy > bestRecord.value.accuracy) {
      bestRecord.value = newRecord;
      try {
        localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(newRecord));
      } catch {
        // ignore
      }
    }
  }

  function setGameState(state: GameStateEnum) {
    gameState.value = state;
  }

  function updatePlayerStats(newStats: Partial<PlayerStats>) {
    Object.assign(player.value, newStats);
  }

  function updateWeaponState(data: {
    weaponId: WeaponId;
    name: string;
    currentMag: number;
    maxMag: number;
    reserveAmmo: number;
    isReloading: boolean;
    reloadProgress?: number;
  }) {
    currentWeapon.value = data.weaponId;
    weaponName.value = data.name;
    currentMag.value = data.currentMag;
    maxMag.value = data.maxMag;
    reserveAmmo.value = data.reserveAmmo;
    isReloading.value = data.isReloading;
    if (typeof data.reloadProgress === 'number') {
      reloadProgress.value = data.reloadProgress;
    }
  }

  function triggerHitMarker(headshot = false, kill = false) {
    hitMarkers.value.push({
      timestamp: performance.now(),
      isHeadshot: headshot,
      isKill: kill
    });
    // prune old
    if (hitMarkers.value.length > 5) {
      hitMarkers.value.shift();
    }
  }

  function triggerDamageFeedback(sourcePos: { x: number; y: number; z: number }, dmg: number) {
    damageFeedbacks.value.push({
      id: Math.random(),
      sourcePosition: sourcePos,
      damage: dmg,
      timestamp: performance.now()
    });
    if (damageFeedbacks.value.length > 4) {
      damageFeedbacks.value.shift();
    }
  }

  function showBanner(title: string, subtitle = '', type: 'info' | 'success' | 'danger' = 'info', durationMs = 3500) {
    bannerMessage.value = { title, subtitle, type };
    setTimeout(() => {
      if (bannerMessage.value?.title === title) {
        bannerMessage.value = null;
      }
    }, durationMs);
  }

  function setInteractionPrompt(text: string | null) {
    interactionPrompt.value = text;
  }

  function setObjectiveStatus(id: ObjectiveId, status: MissionObjective['status'], progress?: number, total?: number) {
    const obj = objectives.value.find(o => o.id === id);
    if (obj) {
      obj.status = status;
      if (progress !== undefined) obj.progress = progress;
      if (total !== undefined) obj.total = total;
    }
  }

  function calculateRating(): 'S' | 'A' | 'B' | 'C' | 'D' {
    const acc = stats.value.accuracy;
    const time = stats.value.elapsedTime;
    const dmg = stats.value.damageTaken;

    if (acc >= 65 && time <= 150 && dmg <= 30) return 'S';
    if (acc >= 50 && time <= 220 && dmg <= 70) return 'A';
    if (acc >= 35 && time <= 320) return 'B';
    if (acc >= 20) return 'C';
    return 'D';
  }

  function resetGame() {
    player.value = {
      health: 100,
      maxHealth: 100,
      armor: 50,
      maxArmor: 50,
      isDead: false,
      isSprinting: false,
      isCrouching: false,
      isAiming: false,
      speed: 0
    };
    objectives.value = JSON.parse(JSON.stringify(INITIAL_OBJECTIVES));
    interactionPrompt.value = null;
    hitMarkers.value = [];
    damageFeedbacks.value = [];
    bannerMessage.value = null;
    stats.value = {
      elapsedTime: 0,
      shotsFired: 0,
      shotsHit: 0,
      accuracy: 0,
      enemiesEliminated: 0,
      totalEnemies: 5,
      damageTaken: 0,
      damageDealt: 0,
      rating: 'B'
    };
  }

  return {
    gameState,
    player,
    currentWeapon,
    weaponName,
    currentMag,
    maxMag,
    reserveAmmo,
    isReloading,
    reloadProgress,
    objectives,
    currentObjective,
    interactionPrompt,
    hitMarkers,
    damageFeedbacks,
    bannerMessage,
    stats,
    bestRecord,
    setGameState,
    updatePlayerStats,
    updateWeaponState,
    triggerHitMarker,
    triggerDamageFeedback,
    showBanner,
    setInteractionPrompt,
    setObjectiveStatus,
    calculateRating,
    saveBestRecordIfBetter,
    resetGame
  };
});
