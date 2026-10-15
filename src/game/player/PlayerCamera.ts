import * as THREE from 'three';

export class PlayerCamera {
  public camera: THREE.PerspectiveCamera;
  public yaw = 0;
  public pitch = 0;
  
  // Recoil
  private currentRecoilPitch = 0;
  private currentRecoilYaw = 0;
  private targetRecoilPitch = 0;
  private targetRecoilYaw = 0;

  // Head bob
  public bobTime = 0;
  public bobOffset = new THREE.Vector3();

  // FOV
  private defaultFOV = 75;
  private adsFOV = 55;
  private currentFOV = 75;

  constructor(fov = 75, aspect = 16 / 9, near = 0.1, far = 200) {
    this.defaultFOV = fov;
    this.currentFOV = fov;
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera.rotation.order = 'YXZ';
  }

  public handleMouseLook(deltaX: number, deltaY: number): void {
    this.yaw -= deltaX;
    this.pitch -= deltaY;

    // Clamp pitch (-85 to +85 deg)
    const maxPitch = (85 * Math.PI) / 180;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
  }

  public addRecoil(vertical: number, horizontal: number): void {
    this.targetRecoilPitch += vertical;
    this.targetRecoilYaw += (Math.random() - 0.5) * horizontal * 2;
  }

  public update(dt: number, eyePosition: THREE.Vector3, isAiming: boolean, enableBob = true): void {
    // 1. Recover recoil smoothly
    this.targetRecoilPitch = THREE.MathUtils.lerp(this.targetRecoilPitch, 0, dt * 10);
    this.targetRecoilYaw = THREE.MathUtils.lerp(this.targetRecoilYaw, 0, dt * 10);

    this.currentRecoilPitch = THREE.MathUtils.lerp(this.currentRecoilPitch, this.targetRecoilPitch, dt * 25);
    this.currentRecoilYaw = THREE.MathUtils.lerp(this.currentRecoilYaw, this.targetRecoilYaw, dt * 25);

    // 2. FOV interpolation (ADS zoom)
    const targetFOV = isAiming ? this.adsFOV : this.defaultFOV;
    this.currentFOV = THREE.MathUtils.lerp(this.currentFOV, targetFOV, dt * 12);
    if (Math.abs(this.camera.fov - this.currentFOV) > 0.05) {
      this.camera.fov = this.currentFOV;
      this.camera.updateProjectionMatrix();
    }

    // 3. Set camera rotation
    this.camera.rotation.y = this.yaw + this.currentRecoilYaw;
    this.camera.rotation.x = this.pitch + this.currentRecoilPitch;

    // 4. Set camera position with bob
    this.camera.position.copy(eyePosition);
    if (enableBob) {
      this.camera.position.add(this.bobOffset);
    }
  }

  public updateAspect(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }
}
