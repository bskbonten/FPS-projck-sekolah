import type { WeaponConfig, WeaponId } from '../../types/weapon';

export const WEAPON_CONFIGS: Record<WeaponId, WeaponConfig> = {
  ar01: {
    id: 'ar01',
    name: 'AR-01 PHANTOM',
    type: 'assault_rifle',
    isAutomatic: true,
    fireRate: 600, // 10 rounds/sec = 100ms per round
    damage: 32,
    headshotMultiplier: 2.2,
    magazineCapacity: 30,
    maxReserveAmmo: 120,
    reloadTime: 2.0,
    range: 120,
    spread: 0.018,
    adsSpreadMultiplier: 0.3,
    recoilVertical: 0.028,
    recoilHorizontal: 0.012,
    recoilRecoverySpeed: 12,
    switchTime: 0.35,
    colorHex: 0x1e293b,
    accentColorHex: 0x00f0ff
  },
  p09: {
    id: 'p09',
    name: 'P-09 ENFORCER',
    type: 'pistol',
    isAutomatic: false,
    fireRate: 340, // ~5.6 rounds/sec = 176ms per round
    damage: 44,
    headshotMultiplier: 2.0,
    magazineCapacity: 12,
    maxReserveAmmo: 48,
    reloadTime: 1.4,
    range: 80,
    spread: 0.012,
    adsSpreadMultiplier: 0.25,
    recoilVertical: 0.02,
    recoilHorizontal: 0.006,
    recoilRecoverySpeed: 16,
    switchTime: 0.22,
    colorHex: 0x0f172a,
    accentColorHex: 0xffaa00
  }
};
