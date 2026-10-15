export type GameStateEnum = 
  | 'MAIN_MENU'
  | 'BRIEFING'
  | 'PLAYING'
  | 'PAUSED'
  | 'MISSION_COMPLETE'
  | 'PLAYER_DEAD';

export type GraphicsQuality = 'low' | 'medium' | 'high';

export interface GameSettings {
  mouseSensitivity: number; // e.g. 0.002
  masterVolume: number;     // 0 to 1
  sfxVolume: number;        // 0 to 1
  ambientVolume: number;    // 0 to 1
  graphicsQuality: GraphicsQuality;
  resolutionScale: number;  // 0.75, 1.0, 1.25
  cameraBob: boolean;
  motionEffects: boolean;
  invertY: boolean;
}

export interface PlayerStats {
  health: number;
  maxHealth: number;
  armor: number;
  maxArmor: number;
  isDead: boolean;
  isSprinting: boolean;
  isCrouching: boolean;
  isAiming: boolean;
  speed: number;
}

export interface MissionStats {
  elapsedTime: number; // seconds
  shotsFired: number;
  shotsHit: number;
  accuracy: number;    // percentage 0 - 100
  enemiesEliminated: number;
  totalEnemies: number;
  damageTaken: number;
  damageDealt: number;
  rating: 'S' | 'A' | 'B' | 'C' | 'D';
}

export interface DamageFeedbackEvent {
  id: number;
  sourcePosition: { x: number; y: number; z: number };
  damage: number;
  timestamp: number;
}

export interface HitMarkerEvent {
  timestamp: number;
  isHeadshot: boolean;
  isKill: boolean;
}
