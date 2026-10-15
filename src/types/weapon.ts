export type WeaponId = 'ar01' | 'p09';

export interface WeaponConfig {
  id: WeaponId;
  name: string;
  type: 'assault_rifle' | 'pistol';
  isAutomatic: boolean;
  fireRate: number; // rounds per minute
  damage: number;
  headshotMultiplier: number;
  magazineCapacity: number;
  maxReserveAmmo: number;
  reloadTime: number; // seconds
  range: number; // meters/units
  spread: number; // base bullet spread in radians
  adsSpreadMultiplier: number;
  recoilVertical: number;
  recoilHorizontal: number;
  recoilRecoverySpeed: number;
  switchTime: number; // seconds
  colorHex: number;
  accentColorHex: number;
}

export interface WeaponState {
  config: WeaponConfig;
  currentMag: number;
  reserveAmmo: number;
  isReloading: boolean;
  reloadProgress: number; // 0 to 1
  timeSinceLastShot: number;
}
