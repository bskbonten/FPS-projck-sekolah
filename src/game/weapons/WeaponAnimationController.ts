import * as THREE from 'three';
import type { WeaponId } from '../../types/weapon';

export type WeaponAnimState =
  | 'IDLE'
  | 'WALK'
  | 'SPRINT'
  | 'ADS'
  | 'FIRING'
  | 'RELOADING'
  | 'INSPECTING'
  | 'SWITCHING'
  | 'DISABLED';

export interface WeaponTransform {
  position: THREE.Vector3;
  rotation: THREE.Euler;
}

export class WeaponAnimationController {
  public currentState: WeaponAnimState = 'IDLE';

  // Base Stance Targets (Offsets from camera eye in meters)
  public hipAR = new THREE.Vector3(0.22, -0.21, -0.38);
  public adsAR = new THREE.Vector3(0.0, -0.158, -0.28); // Precision sight alignment

  public hipPistol = new THREE.Vector3(0.20, -0.20, -0.34);
  public adsPistol = new THREE.Vector3(0.0, -0.142, -0.26); // Precision iron sight alignment

  public sprintOffset = new THREE.Vector3(0.12, -0.14, 0.08);
  public sprintRotation = new THREE.Euler(-0.35, -0.55, 0.45, 'YXZ');

  // Dynamic Output Transform
  public outPosition = new THREE.Vector3();
  public outRotation = new THREE.Euler(0, 0, 0, 'YXZ');

  // Animation Timers & Phases
  private idleTime = 0;
  private walkTime = 0;
  private inspectTime = 0;
  private readonly INSPECT_DURATION = 2.4; // 2.4 seconds

  // Recoil Offsets (Recover via spring-damper)
  public recoilPos = new THREE.Vector3();
  public recoilRot = new THREE.Euler(0, 0, 0, 'YXZ');

  // Sway Offsets
  public swayPos = new THREE.Vector3();
  public swayRot = new THREE.Euler(0, 0, 0, 'YXZ');

  constructor() {
    this.outPosition.copy(this.hipAR);
  }

  public triggerRecoil(kickZ: number, kickY: number, rotX: number, rotY: number): void {
    this.recoilPos.z += kickZ;
    this.recoilPos.y += kickY;
    this.recoilRot.x -= rotX;
    this.recoilRot.y += (Math.random() - 0.5) * rotY * 2;
    this.recoilRot.z += (Math.random() - 0.5) * rotY;
  }

  public triggerInspect(): boolean {
    if (this.currentState === 'RELOADING' || this.currentState === 'SWITCHING' || this.currentState === 'DISABLED') {
      return false;
    }
    this.currentState = 'INSPECTING';
    this.inspectTime = 0;
    return true;
  }

  public cancelInspect(): void {
    if (this.currentState === 'INSPECTING') {
      this.currentState = 'IDLE';
      this.inspectTime = 0;
    }
  }

  public update(
    dt: number,
    weaponId: WeaponId,
    isAiming: boolean,
    isSprinting: boolean,
    isMoving: boolean,
    isReloading: boolean,
    reloadProgress: number,
    mouseDeltaX: number,
    mouseDeltaY: number
  ): void {
    // 1. Determine primary state
    if (isReloading) {
      this.currentState = 'RELOADING';
    } else if (isSprinting) {
      this.cancelInspect();
      this.currentState = 'SPRINT';
    } else if (isAiming) {
      this.cancelInspect();
      this.currentState = 'ADS';
    } else if (this.currentState === 'INSPECTING') {
      this.inspectTime += dt;
      if (this.inspectTime >= this.INSPECT_DURATION) {
        this.currentState = 'IDLE';
        this.inspectTime = 0;
      }
    } else if (isMoving) {
      this.currentState = 'WALK';
    } else {
      this.currentState = 'IDLE';
    }

    // 2. Base Stance Target (Hip vs ADS)
    const baseHip = weaponId === 'ar01' ? this.hipAR : this.hipPistol;
    const baseAds = weaponId === 'ar01' ? this.adsAR : this.adsPistol;
    const targetBasePos = isAiming ? baseAds : baseHip;

    // 3. Sway from mouse look
    const swayFactor = isAiming ? 0.003 : 0.012;
    this.swayPos.x = THREE.MathUtils.lerp(this.swayPos.x, -mouseDeltaX * swayFactor, dt * 10);
    this.swayPos.y = THREE.MathUtils.lerp(this.swayPos.y, mouseDeltaY * swayFactor, dt * 10);
    this.swayRot.y = THREE.MathUtils.lerp(this.swayRot.y, -mouseDeltaX * swayFactor * 2.5, dt * 12);
    this.swayRot.x = THREE.MathUtils.lerp(this.swayRot.x, mouseDeltaY * swayFactor * 2.5, dt * 12);

    // 4. Idle breathing & Walk bobbing
    let bobX = 0;
    let bobY = 0;
    let bobRotZ = 0;

    if (!isAiming && this.currentState !== 'INSPECTING') {
      if (this.currentState === 'WALK' || isMoving) {
        const bobSpeed = isSprinting ? 14 : 9;
        this.walkTime += dt * bobSpeed;
        const amp = isSprinting ? 0.024 : 0.012;
        bobX = Math.cos(this.walkTime * 0.5) * amp;
        bobY = Math.abs(Math.sin(this.walkTime)) * amp * 0.8;
        bobRotZ = Math.cos(this.walkTime * 0.5) * 0.035;
      } else {
        this.idleTime += dt * 1.8;
        bobY = Math.sin(this.idleTime) * 0.003;
        bobX = Math.cos(this.idleTime * 0.5) * 0.002;
      }
    }

    // 5. Inspect animation layer
    let inspectPosX = 0;
    let inspectPosY = 0;
    let inspectRotX = 0;
    let inspectRotY = 0;
    let inspectRotZ = 0;

    if (this.currentState === 'INSPECTING') {
      const p = this.inspectTime / this.INSPECT_DURATION; // 0 to 1
      const inspectCurve = Math.sin(p * Math.PI); // smooth in and out curve
      inspectPosX = -0.12 * inspectCurve;
      inspectPosY = 0.04 * inspectCurve;
      inspectRotY = 0.75 * inspectCurve;
      inspectRotX = 0.25 * inspectCurve;
      inspectRotZ = -0.55 * inspectCurve;
    }

    // 6. Reload animation layer
    let reloadPosY = 0;
    let reloadRotX = 0;
    let reloadRotZ = 0;

    if (this.currentState === 'RELOADING') {
      const rp = reloadProgress;
      // Multi-stage:
      // Stage 1 (0 to 0.35): tilt weapon up-left, magazine eject dip
      // Stage 2 (0.35 to 0.75): mag insertion snap
      // Stage 3 (0.75 to 1.0): bolt rack & return
      const reloadCurve = Math.sin(rp * Math.PI);
      reloadPosY = -0.15 * reloadCurve;
      reloadRotX = 0.28 * reloadCurve;
      reloadRotZ = -0.38 * reloadCurve;
    }

    // 7. Sprint stance layer
    let sprintX = 0;
    let sprintY = 0;
    let sprintZ = 0;
    let sprintRotX = 0;
    let sprintRotY = 0;
    let sprintRotZ = 0;

    if (isSprinting && !isAiming) {
      sprintX = this.sprintOffset.x;
      sprintY = this.sprintOffset.y;
      sprintZ = this.sprintOffset.z;
      sprintRotX = this.sprintRotation.x;
      sprintRotY = this.sprintRotation.y;
      sprintRotZ = this.sprintRotation.z;
    }

    // 8. Recover recoil offsets exponentially
    this.recoilPos.lerp(new THREE.Vector3(0, 0, 0), dt * 16);
    this.recoilRot.x = THREE.MathUtils.lerp(this.recoilRot.x, 0, dt * 16);
    this.recoilRot.y = THREE.MathUtils.lerp(this.recoilRot.y, 0, dt * 16);
    this.recoilRot.z = THREE.MathUtils.lerp(this.recoilRot.z, 0, dt * 16);

    // 9. Compose final target position and rotation
    const lerpSpeed = isAiming ? 18 : 12;
    const targetX = targetBasePos.x + bobX + sprintX + inspectPosX + this.swayPos.x + this.recoilPos.x;
    const targetY = targetBasePos.y + bobY + sprintY + inspectPosY + reloadPosY + this.swayPos.y + this.recoilPos.y;
    const targetZ = targetBasePos.z + sprintZ + this.recoilPos.z;

    this.outPosition.x = THREE.MathUtils.lerp(this.outPosition.x, targetX, dt * lerpSpeed);
    this.outPosition.y = THREE.MathUtils.lerp(this.outPosition.y, targetY, dt * lerpSpeed);
    this.outPosition.z = THREE.MathUtils.lerp(this.outPosition.z, targetZ, dt * lerpSpeed);

    const targetRotX = sprintRotX + inspectRotX + reloadRotX + this.swayRot.x + this.recoilRot.x;
    const targetRotY = sprintRotY + inspectRotY + this.swayRot.y + this.recoilRot.y;
    const targetRotZ = bobRotZ + sprintRotZ + inspectRotZ + reloadRotZ + this.recoilRot.z;

    this.outRotation.x = THREE.MathUtils.lerp(this.outRotation.x, targetRotX, dt * lerpSpeed);
    this.outRotation.y = THREE.MathUtils.lerp(this.outRotation.y, targetRotY, dt * lerpSpeed);
    this.outRotation.z = THREE.MathUtils.lerp(this.outRotation.z, targetRotZ, dt * lerpSpeed);
  }

  public reset(): void {
    this.currentState = 'IDLE';
    this.idleTime = 0;
    this.walkTime = 0;
    this.inspectTime = 0;
    this.recoilPos.set(0, 0, 0);
    this.recoilRot.set(0, 0, 0);
    this.swayPos.set(0, 0, 0);
    this.swayRot.set(0, 0, 0);
    this.outPosition.copy(this.hipAR);
    this.outRotation.set(0, 0, 0);
  }
}
