import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WeaponController } from '../../src/game/weapons/WeaponController';
import { WeaponViewModel } from '../../src/game/weapons/WeaponViewModel';
import { AudioManager } from '../../src/game/core/AudioManager';
import type { InputState } from '../../src/game/core/InputManager';

describe('WeaponController and Ammunition Logic', () => {
  let controller: WeaponController;
  let viewModel: WeaponViewModel;
  let audioManager: AudioManager;

  const mockInput = (): InputState => ({
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    isSprinting: false,
    isCrouching: false,
    jumpPressed: false,
    isFiring: false,
    isAiming: false,
    reloadPressed: false,
    interactPressed: false,
    weapon1Pressed: false,
    weapon2Pressed: false,
    inspectPressed: false,
    pausePressed: false,
    mouseDeltaX: 0,
    mouseDeltaY: 0,
    isPointerLocked: true
  });

  beforeEach(() => {
    viewModel = new WeaponViewModel();
    audioManager = new AudioManager();
    controller = new WeaponController(viewModel, audioManager);
  });

  it('initializes with AR-01 active, 30 round mag, 120 reserve', () => {
    expect(controller.currentWeaponId).toBe('ar01');
    expect(controller.activeWeapon.currentMag).toBe(30);
    expect(controller.activeWeapon.reserveAmmo).toBe(120);
  });

  it('switches to secondary weapon P-09 with 12 mag and 48 reserve', () => {
    controller.switchWeapon('p09');
    expect(controller.currentWeaponId).toBe('p09');
    expect(controller.activeWeapon.currentMag).toBe(12);
    expect(controller.activeWeapon.reserveAmmo).toBe(48);
  });

  it('fires weapon, decrements current magazine and emits shot event', () => {
    const shotSpy = vi.fn();
    controller.onShotFired = shotSpy;

    const input = mockInput();
    input.isFiring = true;

    // Simulate update step with enough elapsed time for fire rate
    controller.update(
      0.2,
      input,
      { x: 0, y: 1.7, z: 0 },
      { x: 0, y: 0, z: -1 },
      false,
      false,
      () => {}
    );

    expect(controller.activeWeapon.currentMag).toBe(29);
    expect(shotSpy).toHaveBeenCalledTimes(1);
    expect(shotSpy.mock.calls[0][0].damage).toBe(32);
  });

  it('enforces fire rate limit and prevents firing faster than rate allows', () => {
    const shotSpy = vi.fn();
    controller.onShotFired = shotSpy;

    const input = mockInput();
    input.isFiring = true;

    // First shot fired
    controller.update(0.2, input, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: -1 }, false, false, () => {});
    expect(shotSpy).toHaveBeenCalledTimes(1);

    // Frame after only 0.01s (AR-01 requires 0.1s delay for 600 RPM)
    controller.update(0.01, input, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: -1 }, false, false, () => {});
    expect(shotSpy).toHaveBeenCalledTimes(1); // Still 1

    // Frame after 0.1s passes
    controller.update(0.1, input, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: -1 }, false, false, () => {});
    expect(shotSpy).toHaveBeenCalledTimes(2); // Second shot fires
  });

  it('handles reload completion and transfers ammo from reserve', () => {
    controller.activeWeapon.currentMag = 10;
    controller.activeWeapon.reserveAmmo = 90;

    const reloaded = controller.reload();
    expect(reloaded).toBe(true);
    expect(controller.activeWeapon.isReloading).toBe(true);

    const input = mockInput();
    // Simulate elapsed reload time (2.0s for AR-01)
    controller.update(2.1, input, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: -1 }, false, false, () => {});

    expect(controller.activeWeapon.isReloading).toBe(false);
    expect(controller.activeWeapon.currentMag).toBe(30);
    expect(controller.activeWeapon.reserveAmmo).toBe(70); // 90 - 20 = 70
  });

  it('reloads with insufficient reserve ammo transferring only what is left', () => {
    controller.activeWeapon.currentMag = 5;
    controller.activeWeapon.reserveAmmo = 12; // Only 12 remaining in reserve

    controller.reload();
    const input = mockInput();
    controller.update(2.1, input, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: -1 }, false, false, () => {});

    expect(controller.activeWeapon.currentMag).toBe(17); // 5 + 12
    expect(controller.activeWeapon.reserveAmmo).toBe(0);
  });

  it('cannot reload when magazine is already full', () => {
    expect(controller.activeWeapon.currentMag).toBe(30);
    const reloaded = controller.reload();
    expect(reloaded).toBe(false);
  });

  it('cannot reload when reserve ammo is 0', () => {
    controller.activeWeapon.currentMag = 15;
    controller.activeWeapon.reserveAmmo = 0;
    const reloaded = controller.reload();
    expect(reloaded).toBe(false);
  });

  it('cancels reload if user switches weapon', () => {
    controller.activeWeapon.currentMag = 10;
    controller.reload();
    expect(controller.activeWeapon.isReloading).toBe(true);

    controller.switchWeapon('p09');
    expect(controller.weapons.ar01.isReloading).toBe(false);
  });

  it('triggers weapon inspection and cancels on firing or sprinting', () => {
    const input = mockInput();
    input.inspectPressed = true;

    controller.update(0.1, input, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: -1 }, false, false, () => {});
    expect(viewModel.animController.currentState).toBe('INSPECTING');

    // Firing cancels inspection immediately
    input.inspectPressed = false;
    input.isFiring = true;
    controller.update(0.2, input, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: -1 }, false, false, () => {});
    expect(viewModel.animController.currentState).not.toBe('INSPECTING');
  });
});
