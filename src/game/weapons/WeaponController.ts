import { WEAPON_CONFIGS } from './WeaponConfig';
import type { WeaponConfig, WeaponId, WeaponState } from '../../types/weapon';
import type { InputState } from '../core/InputManager';
import { WeaponViewModel } from './WeaponViewModel';
import { AudioManager } from '../core/AudioManager';

export interface ShotEvent {
  origin: { x: number; y: number; z: number };
  direction: { x: number; y: number; z: number };
  damage: number;
  headshotMultiplier: number;
  range: number;
  spread: number;
}

export class WeaponController {
  public currentWeaponId: WeaponId = 'ar01';
  public weapons: Record<WeaponId, WeaponState>;
  public viewModel: WeaponViewModel;
  private audioManager: AudioManager;

  private isSwitching = false;
  private switchTimer = 0;
  private semiAutoFired = false;

  public onShotFired?: (shot: ShotEvent) => void;
  public onStateChanged?: (state: {
    weaponId: WeaponId;
    name: string;
    currentMag: number;
    maxMag: number;
    reserveAmmo: number;
    isReloading: boolean;
    reloadProgress: number;
  }) => void;

  constructor(viewModel: WeaponViewModel, audioManager: AudioManager) {
    this.viewModel = viewModel;
    this.audioManager = audioManager;

    this.weapons = {
      ar01: {
        config: WEAPON_CONFIGS.ar01,
        currentMag: WEAPON_CONFIGS.ar01.magazineCapacity,
        reserveAmmo: WEAPON_CONFIGS.ar01.maxReserveAmmo,
        isReloading: false,
        reloadProgress: 0,
        timeSinceLastShot: 10
      },
      p09: {
        config: WEAPON_CONFIGS.p09,
        currentMag: WEAPON_CONFIGS.p09.magazineCapacity,
        reserveAmmo: WEAPON_CONFIGS.p09.maxReserveAmmo,
        isReloading: false,
        reloadProgress: 0,
        timeSinceLastShot: 10
      }
    };

    this.viewModel.setWeapon(this.currentWeaponId);
  }

  public get activeWeapon(): WeaponState {
    return this.weapons[this.currentWeaponId];
  }

  public get config(): WeaponConfig {
    return this.activeWeapon.config;
  }

  public switchWeapon(id: WeaponId): void {
    if (this.currentWeaponId === id || this.isSwitching) return;

    this.viewModel.cancelInspect();

    // Cancel current reload if switching
    this.activeWeapon.isReloading = false;
    this.activeWeapon.reloadProgress = 0;

    this.currentWeaponId = id;
    this.isSwitching = true;
    this.switchTimer = this.config.switchTime;
    this.semiAutoFired = false;

    this.viewModel.setWeapon(id);
    this.notifyState();
  }

  public reload(): boolean {
    const w = this.activeWeapon;
    if (w.isReloading || this.isSwitching) return false;
    if (w.currentMag >= w.config.magazineCapacity || w.reserveAmmo <= 0) return false;

    w.isReloading = true;
    w.reloadProgress = 0;
    this.viewModel.startReload();
    this.audioManager.playReload(w.config.reloadTime);
    this.notifyState();
    return true;
  }

  public update(
    dt: number,
    input: InputState,
    cameraEye: { x: number; y: number; z: number },
    cameraForward: { x: number; y: number; z: number },
    isSprinting: boolean,
    isDead: boolean,
    onCameraRecoil: (vert: number, horiz: number) => void
  ): void {
    if (isDead) return;

    // Handle weapon switch inputs
    if (input.weapon1Pressed && this.currentWeaponId !== 'ar01') {
      this.switchWeapon('ar01');
    } else if (input.weapon2Pressed && this.currentWeaponId !== 'p09') {
      this.switchWeapon('p09');
    }

    if (this.isSwitching) {
      this.switchTimer -= dt;
      if (this.switchTimer <= 0) {
        this.isSwitching = false;
      }
    }

    const w = this.activeWeapon;
    w.timeSinceLastShot += dt;

    // Reload completion logic
    if (w.isReloading) {
      w.reloadProgress += dt / w.config.reloadTime;
      this.viewModel.updateReloadProgress(w.reloadProgress);

      if (w.reloadProgress >= 1.0) {
        const needed = w.config.magazineCapacity - w.currentMag;
        const available = Math.min(needed, w.reserveAmmo);
        w.currentMag += available;
        w.reserveAmmo -= available;
        w.isReloading = false;
        w.reloadProgress = 0;
        this.notifyState();
      }
    }

    // Manual reload key
    if (input.reloadPressed && !w.isReloading && w.currentMag < w.config.magazineCapacity && w.reserveAmmo > 0) {
      this.viewModel.cancelInspect();
      this.reload();
    }

    // Weapon inspection (KeyX)
    if (input.inspectPressed && !w.isReloading && !isSprinting && !input.isFiring) {
      this.viewModel.triggerInspect();
    }

    // Semi-auto reset
    if (!input.isFiring) {
      this.semiAutoFired = false;
    }

    // Fire handling
    const shotDelay = 60 / w.config.fireRate;
    if (input.isFiring && !this.isSwitching && !w.isReloading && !isSprinting) {
      this.viewModel.cancelInspect();
      if (w.config.isAutomatic || !this.semiAutoFired) {
        if (w.timeSinceLastShot >= shotDelay) {
          if (w.currentMag > 0) {
            this.fireShot(cameraEye, cameraForward, input.isAiming, onCameraRecoil);
          } else {
            // Empty magazine feedback
            this.audioManager.playEmptyClick();
            w.timeSinceLastShot = 0;
            // Auto reload prompt if reserve has ammo
            if (w.reserveAmmo > 0) {
              this.reload();
            }
          }
          this.semiAutoFired = true;
        }
      }
    }
  }

  private fireShot(
    cameraEye: { x: number; y: number; z: number },
    cameraForward: { x: number; y: number; z: number },
    isAiming: boolean,
    onCameraRecoil: (vert: number, horiz: number) => void
  ): void {
    const w = this.activeWeapon;
    w.currentMag--;
    w.timeSinceLastShot = 0;

    // 1. Play weapon sound
    if (w.config.id === 'ar01') {
      this.audioManager.playAssaultRifleShot();
    } else {
      this.audioManager.playPistolShot();
    }

    // 2. Viewmodel visual effects
    this.viewModel.triggerFireEffect();

    // 3. Camera recoil
    const vertRecoil = w.config.recoilVertical * (isAiming ? 0.65 : 1.0);
    const horizRecoil = w.config.recoilHorizontal * (isAiming ? 0.65 : 1.0);
    onCameraRecoil(vertRecoil, horizRecoil);

    // 4. Spread calculation
    const spreadVal = w.config.spread * (isAiming ? w.config.adsSpreadMultiplier : 1.0);
    const spreadDir = {
      x: cameraForward.x + (Math.random() - 0.5) * spreadVal,
      y: cameraForward.y + (Math.random() - 0.5) * spreadVal,
      z: cameraForward.z + (Math.random() - 0.5) * spreadVal
    };
    // Normalize spreadDir
    const len = Math.hypot(spreadDir.x, spreadDir.y, spreadDir.z);
    spreadDir.x /= len;
    spreadDir.y /= len;
    spreadDir.z /= len;

    // 5. Emit event for raycast combat system
    if (this.onShotFired) {
      this.onShotFired({
        origin: cameraEye,
        direction: spreadDir,
        damage: w.config.damage,
        headshotMultiplier: w.config.headshotMultiplier,
        range: w.config.range,
        spread: spreadVal
      });
    }

    this.notifyState();
  }

  public notifyState(): void {
    if (this.onStateChanged) {
      const w = this.activeWeapon;
      this.onStateChanged({
        weaponId: this.currentWeaponId,
        name: w.config.name,
        currentMag: w.currentMag,
        maxMag: w.config.magazineCapacity,
        reserveAmmo: w.reserveAmmo,
        isReloading: w.isReloading,
        reloadProgress: w.reloadProgress
      });
    }
  }

  public reset(): void {
    this.currentWeaponId = 'ar01';
    this.isSwitching = false;
    this.semiAutoFired = false;
    this.weapons.ar01.currentMag = WEAPON_CONFIGS.ar01.magazineCapacity;
    this.weapons.ar01.reserveAmmo = WEAPON_CONFIGS.ar01.maxReserveAmmo;
    this.weapons.ar01.isReloading = false;
    this.weapons.ar01.reloadProgress = 0;

    this.weapons.p09.currentMag = WEAPON_CONFIGS.p09.magazineCapacity;
    this.weapons.p09.reserveAmmo = WEAPON_CONFIGS.p09.maxReserveAmmo;
    this.weapons.p09.isReloading = false;
    this.weapons.p09.reloadProgress = 0;

    this.viewModel.setWeapon('ar01');
    this.notifyState();
  }
}
