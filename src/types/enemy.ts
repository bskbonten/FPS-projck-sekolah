export type EnemyStateEnum = 
  | 'PATROL'
  | 'ALERT'
  | 'INVESTIGATE'
  | 'CHASE'
  | 'ATTACK'
  | 'SEARCH'
  | 'DEAD';

export interface EnemyConfig {
  id: string;
  name: string;
  health: number;
  maxHealth: number;
  moveSpeed: number;
  runSpeed: number;
  detectionRadius: number;
  alertRadius: number;
  attackRange: number;
  fieldOfView: number; // degrees e.g. 110
  attackCooldown: number; // seconds
  damage: number;
  accuracy: number; // 0 to 1
  patrolWaypoints: Array<{ x: number; y: number; z: number }>;
}

export interface EnemySnapshot {
  id: string;
  state: EnemyStateEnum;
  position: { x: number; y: number; z: number };
  health: number;
  maxHealth: number;
  isDead: boolean;
}
