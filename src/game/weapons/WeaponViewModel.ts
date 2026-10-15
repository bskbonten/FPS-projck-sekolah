import * as THREE from 'three';
import type { WeaponId } from '../../types/weapon';
import { WeaponAnimationController } from './WeaponAnimationController';

interface ShellCasing {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  rotVelocity: THREE.Vector3;
  life: number;
}

export class WeaponViewModel {
  public root: THREE.Group;
  public animController: WeaponAnimationController;

  private arGroup: THREE.Group;
  private pistolGroup: THREE.Group;
  private muzzleFlashGroup: THREE.Group;
  private muzzleFlashPlanes: THREE.Mesh[] = [];
  private muzzleLight: THREE.PointLight;

  private flashTime = 0;
  private activeWeaponId: WeaponId = 'ar01';

  // Shell casings
  private shellCasings: ShellCasing[] = [];
  private shellGeo: THREE.CylinderGeometry;
  private shellMat: THREE.MeshStandardMaterial;

  constructor() {
    this.root = new THREE.Group();
    this.animController = new WeaponAnimationController();

    // 1. Build Detailed AR-01 Assault Rifle
    this.arGroup = this.buildDetailedAssaultRifle();
    this.root.add(this.arGroup);

    // 2. Build Detailed P-09 Combat Pistol
    this.pistolGroup = this.buildDetailedPistol();
    this.pistolGroup.visible = false;
    this.root.add(this.pistolGroup);

    // 3. Multi-plane Cross Muzzle Flash
    this.muzzleFlashGroup = new THREE.Group();
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xfff2aa,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    const pGeo = new THREE.PlaneGeometry(0.16, 0.16);
    const plane1 = new THREE.Mesh(pGeo, flashMat);
    const plane2 = new THREE.Mesh(pGeo, flashMat);
    plane2.rotation.z = Math.PI / 2;
    this.muzzleFlashPlanes.push(plane1, plane2);
    this.muzzleFlashGroup.add(plane1);
    this.muzzleFlashGroup.add(plane2);

    this.muzzleLight = new THREE.PointLight(0xffaa22, 0, 5, 2);
    this.muzzleFlashGroup.add(this.muzzleLight);

    this.root.add(this.muzzleFlashGroup);

    // 4. Shell Casings Setup
    this.shellGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.02, 6);
    this.shellMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37, // brass gold
      metalness: 0.95,
      roughness: 0.25
    });

    this.setWeapon('ar01');
  }

  private buildDetailedAssaultRifle(): THREE.Group {
    const group = new THREE.Group();

    // ─── MATERIALS (AK-style black matte tactical rifle) ─────────────────────────
    const receiverMat  = new THREE.MeshStandardMaterial({ color: 0x111418, roughness: 0.45, metalness: 0.80 });
    const polymerMat   = new THREE.MeshStandardMaterial({ color: 0x0a0d12, roughness: 0.88, metalness: 0.12 });
    const steelMat     = new THREE.MeshStandardMaterial({ color: 0x1c2128, roughness: 0.32, metalness: 0.95 });
    const gasBlockMat  = new THREE.MeshStandardMaterial({ color: 0x161b22, roughness: 0.55, metalness: 0.82 });
    const brassMat     = new THREE.MeshStandardMaterial({ color: 0xb8a255, roughness: 0.35, metalness: 0.92 });

    // ─── LOWER RECEIVER ──────────────────────────────────────────────────────────
    // AK lower receiver (houses the FCG, mag well, pistol grip)
    const lowerRec = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.075, 0.26), receiverMat);
    lowerRec.position.set(0, -0.018, 0.04);
    group.add(lowerRec);

    // ─── UPPER RECEIVER (AK-style flat top with dust cover) ──────────────────────
    const upperRec = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.048, 0.28), receiverMat);
    upperRec.position.set(0, 0.032, 0.035);
    group.add(upperRec);

    // Dust cover (removable top plate, slightly wider)
    const dustCover = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.014, 0.24), receiverMat);
    dustCover.position.set(0, 0.059, 0.02);
    group.add(dustCover);

    // Ejection port cover (right side)
    const portCover = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.028, 0.07), steelMat);
    portCover.position.set(0.025, 0.028, 0.02);
    group.add(portCover);

    // Charging handle (right-side AK cocking handle stub)
    const chargingHandle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.018, 0.025), receiverMat);
    chargingHandle.position.set(0.028, 0.028, 0.02);
    group.add(chargingHandle);

    // ─── TRIGGER GUARD ────────────────────────────────────────────────────────────
    const tGuardGeo = new THREE.TorusGeometry(0.022, 0.005, 5, 10, Math.PI);
    const tGuard = new THREE.Mesh(tGuardGeo, steelMat);
    tGuard.rotation.x = -Math.PI / 2;
    tGuard.position.set(0, -0.045, 0.14);
    group.add(tGuard);

    // ─── SELECTOR / SAFETY SWITCH ─────────────────────────────────────────────────
    const safetyLever = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.032, 0.048), receiverMat);
    safetyLever.position.set(0.026, 0.0, 0.09);
    safetyLever.rotation.z = -0.3;
    group.add(safetyLever);

    // ─── HANDGUARD / FOREND ──────────────────────────────────────────────────────
    // AK-style ribbed polymer lower handguard (between gas tube & magazine)
    const handguardLower = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.055, 0.20), polymerMat);
    handguardLower.position.set(0, 0.014, -0.165);
    group.add(handguardLower);

    // Handguard ventilation ribs (AK-style)
    for (let i = -3; i <= 3; i++) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.047, 0.007, 0.015), polymerMat);
      rib.position.set(0, 0.014, -0.165 + i * 0.028);
      group.add(rib);
    }

    // Upper handguard (covers gas tube)
    const handguardUpper = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.028, 0.18), polymerMat);
    handguardUpper.position.set(0, 0.058, -0.16);
    group.add(handguardUpper);

    // ─── GAS TUBE (above barrel from gas block to receiver) ───────────────────────
    const gasTube = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.22, 8), gasBlockMat);
    gasTube.rotation.x = Math.PI / 2;
    gasTube.position.set(0, 0.066, -0.14);
    group.add(gasTube);

    // Gas block (triangular sight base, AK-style)
    const gasBlock = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.038, 0.032), gasBlockMat);
    gasBlock.position.set(0, 0.042, -0.26);
    group.add(gasBlock);

    // ─── BARREL ──────────────────────────────────────────────────────────────────
    // AK barrel — long, slightly thinner at front
    const barrelBody = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.014, 0.42, 12), steelMat);
    barrelBody.rotation.x = Math.PI / 2;
    barrelBody.position.set(0, 0.034, -0.37);
    group.add(barrelBody);

    // Barrel extension (front taper)
    const barrelExt = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.013, 0.12, 10), steelMat);
    barrelExt.rotation.x = Math.PI / 2;
    barrelExt.position.set(0, 0.034, -0.60);
    group.add(barrelExt);

    // ─── AK MUZZLE BRAKE (slotted compensator) ────────────────────────────────────
    const muzzleBrake = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.015, 0.06, 10), steelMat);
    muzzleBrake.rotation.x = Math.PI / 2;
    muzzleBrake.position.set(0, 0.034, -0.68);
    group.add(muzzleBrake);

    // Muzzle vent slots (top)
    for (let i = 0; i < 3; i++) {
      const slot = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.007, 0.015), steelMat);
      slot.position.set(0, 0.052, -0.665 + i * 0.018);
      group.add(slot);
    }

    // Front sight post (tall AK-style hooded front post)
    const frontSightBase = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.028, 0.02), gasBlockMat);
    frontSightBase.position.set(0, 0.042, -0.26);
    group.add(frontSightBase);

    const frontSightPost = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.045, 0.006), steelMat);
    frontSightPost.position.set(0, 0.068, -0.26);
    group.add(frontSightPost);

    // Front sight wings (protective ears)
    const sightEarGeo = new THREE.BoxGeometry(0.028, 0.032, 0.006);
    const sightEarL = new THREE.Mesh(sightEarGeo, gasBlockMat);
    sightEarL.position.set(-0.02, 0.06, -0.26);
    group.add(sightEarL);
    const sightEarR = new THREE.Mesh(sightEarGeo, gasBlockMat);
    sightEarR.position.set(0.02, 0.06, -0.26);
    group.add(sightEarR);

    // ─── REAR SIGHT (AK-style tangent leaf) ───────────────────────────────────────
    const rearSightBase = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.06), receiverMat);
    rearSightBase.position.set(0, 0.064, 0.16);
    group.add(rearSightBase);

    const rearSightLeaf = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.038, 0.008), steelMat);
    rearSightLeaf.position.set(0, 0.079, 0.14);
    group.add(rearSightLeaf);

    // Rear sight notch slot
    const rearSightSlot = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.018, 0.004), receiverMat);
    rearSightSlot.position.set(0, 0.085, 0.138);
    group.add(rearSightSlot);

    // ─── CURVED 30-ROUND MAGAZINE (AK-style, large curved banana mag) ─────────────
    const magGroup = new THREE.Group();
    magGroup.position.set(0, -0.062, 0.04);
    magGroup.rotation.x = 0.18; // AK natural forward curve angle

    // Main mag body
    const magBody = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.20, 0.072), polymerMat);
    magBody.position.set(0, -0.10, 0);
    magGroup.add(magBody);

    // Mag curvature shim (bottom front)
    const magCurveF = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.06, 0.08), polymerMat);
    magCurveF.position.set(0, -0.19, -0.008);
    magCurveF.rotation.x = 0.22;
    magGroup.add(magCurveF);

    // Mag feed lips (steel top)
    const feedLips = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.018, 0.068), steelMat);
    feedLips.position.set(0, -0.0, 0);
    magGroup.add(feedLips);

    // Magazine baseplate
    const basePlate = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.012, 0.078), steelMat);
    basePlate.position.set(0, -0.205, -0.004);
    magGroup.add(basePlate);

    // Brass case visible in feed (added realism)
    const caseTip = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.007, 0.018, 6), brassMat);
    caseTip.position.set(0, -0.005, -0.02);
    caseTip.rotation.x = 0.3;
    magGroup.add(caseTip);

    group.add(magGroup);

    // ─── PISTOL GRIP (AK ergonomic polymer) ─────────────────────────────────────
    const gripBody = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.12, 0.058), polymerMat);
    gripBody.position.set(0, -0.09, 0.14);
    gripBody.rotation.x = 0.38;
    group.add(gripBody);

    // Grip stippling/texture grooves
    for (let i = 0; i < 4; i++) {
      const groove = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.006, 0.055), receiverMat);
      groove.position.set(0, -0.068 - i * 0.024, 0.136 + i * 0.012);
      groove.rotation.x = 0.38;
      group.add(groove);
    }

    // Grip backstrap (curved for ergonomics)
    const backstrap = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.10, 0.022), polymerMat);
    backstrap.position.set(0, -0.098, 0.175);
    backstrap.rotation.x = 0.1;
    group.add(backstrap);

    // ─── SKELETON / FOLDING STOCK ─────────────────────────────────────────────────
    // AK skeleton wire-frame collapsible stock
    const stockSpineGeo = new THREE.BoxGeometry(0.014, 0.014, 0.26);

    // Top stock tube
    const stockTop = new THREE.Mesh(stockSpineGeo, steelMat);
    stockTop.position.set(0, 0.024, 0.30);
    group.add(stockTop);

    // Bottom stock tube
    const stockBottom = new THREE.Mesh(stockSpineGeo, steelMat);
    stockBottom.position.set(0, -0.044, 0.30);
    group.add(stockBottom);

    // Stock cross brace (middle)
    const stockCross = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.072, 0.012), steelMat);
    stockCross.position.set(0, -0.01, 0.30);
    group.add(stockCross);

    // Stock butt plate
    const stockButt = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.09, 0.016), steelMat);
    stockButt.position.set(0, -0.01, 0.432);
    group.add(stockButt);

    // Cheekpiece / stock pad
    const stockPad = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.028, 0.014), polymerMat);
    stockPad.position.set(0, 0.026, 0.42);
    group.add(stockPad);

    // Stock rear hinge (where it folds)
    const stockHinge = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.05, 8), steelMat);
    stockHinge.rotation.z = Math.PI / 2;
    stockHinge.position.set(0, 0.0, 0.175);
    group.add(stockHinge);

    // ─── LOWER RECEIVER / TRIGGER GROUP DETAILS ──────────────────────────────────
    // Mag catch / release button
    const magCatch = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.016, 0.018), steelMat);
    magCatch.position.set(0.025, -0.018, 0.072);
    group.add(magCatch);

    // Trigger
    const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.028, 0.018), steelMat);
    trigger.position.set(0, -0.046, 0.135);
    trigger.rotation.x = 0.2;
    group.add(trigger);

    // ─── SLING LOOP (front) ───────────────────────────────────────────────────────
    const slingLoop = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.004, 5, 10), steelMat);
    slingLoop.position.set(-0.024, 0.02, -0.28);
    slingLoop.rotation.y = Math.PI / 2;
    group.add(slingLoop);

    return group;
  }


  private buildDetailedPistol(): THREE.Group {
    const group = new THREE.Group();

    const slideMat = new THREE.MeshStandardMaterial({ color: 0x303642, roughness: 0.32, metalness: 0.92 });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x12151c, roughness: 0.85, metalness: 0.18 });
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0x1a1e26, roughness: 0.25, metalness: 0.95 });
    const tritiumGreen = new THREE.MeshBasicMaterial({ color: 0x05f1af });
    const amberLaser = new THREE.MeshBasicMaterial({ color: 0xffaa00 });

    // Steel Slide
    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.045, 0.20), slideMat);
    slide.position.set(0, 0.025, -0.05);
    group.add(slide);

    // Cocking Serrations (Rear & Front)
    for (let i = 0; i < 4; i++) {
      const serration = new THREE.Mesh(new THREE.BoxGeometry(0.037, 0.03, 0.004), barrelMat);
      serration.position.set(0, 0.025, 0.02 - i * 0.009);
      group.add(serration);
    }
    for (let i = 0; i < 3; i++) {
      const serration = new THREE.Mesh(new THREE.BoxGeometry(0.037, 0.03, 0.004), barrelMat);
      serration.position.set(0, 0.025, -0.11 - i * 0.009);
      group.add(serration);
    }

    // Ejection Port Cutout
    const port = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.02, 0.04), barrelMat);
    port.position.set(0.015, 0.038, -0.04);
    group.add(port);

    // Barrel tip protruding
    const barrelTip = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.06, 10), barrelMat);
    barrelTip.rotation.x = Math.PI / 2;
    barrelTip.position.set(0, 0.024, -0.16);
    group.add(barrelTip);

    // Polymer Frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.035, 0.18), frameMat);
    frame.position.set(0, -0.005, -0.04);
    group.add(frame);

    // Tactical Under-barrel Rail & Light
    const tacLight = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.024, 0.065), frameMat);
    tacLight.position.set(0, -0.026, -0.09);
    group.add(tacLight);

    const lightLens = new THREE.Mesh(new THREE.CircleGeometry(0.008, 8), amberLaser);
    lightLens.position.set(0, -0.026, -0.123);
    lightLens.rotation.y = Math.PI;
    group.add(lightLens);

    // Ergonomic Grip with Beavertail
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.12, 0.055), frameMat);
    grip.position.set(0, -0.065, 0.01);
    grip.rotation.x = 0.28;
    group.add(grip);

    // Magazine Baseplate
    const baseplate = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.014, 0.062), slideMat);
    baseplate.position.set(0, -0.128, 0.028);
    baseplate.rotation.x = 0.28;
    group.add(baseplate);

    // Combat Sights: Tritium Dots
    // Front blade
    const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.012, 0.01), slideMat);
    frontSight.position.set(0, 0.052, -0.14);
    group.add(frontSight);

    const frontDot = new THREE.Mesh(new THREE.CircleGeometry(0.0018, 6), tritiumGreen);
    frontDot.position.set(0, 0.052, -0.134);
    group.add(frontDot);

    // Rear notch
    const rearSight = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.014, 0.01), slideMat);
    rearSight.position.set(0, 0.052, 0.035);
    group.add(rearSight);

    const rearDotL = new THREE.Mesh(new THREE.CircleGeometry(0.0016, 6), tritiumGreen);
    rearDotL.position.set(-0.008, 0.052, 0.03);
    group.add(rearDotL);

    const rearDotR = new THREE.Mesh(new THREE.CircleGeometry(0.0016, 6), tritiumGreen);
    rearDotR.position.set(0.008, 0.052, 0.03);
    group.add(rearDotR);

    return group;
  }

  public setWeapon(weaponId: WeaponId): void {
    this.activeWeaponId = weaponId;
    if (weaponId === 'ar01') {
      this.arGroup.visible = true;
      this.pistolGroup.visible = false;
      this.muzzleFlashGroup.position.set(0, 0.03, -0.54);
    } else {
      this.arGroup.visible = false;
      this.pistolGroup.visible = true;
      this.muzzleFlashGroup.position.set(0, 0.024, -0.18);
    }
    this.animController.reset();
  }

  public triggerFireEffect(): void {
    this.flashTime = 0.045;
    for (let i = 0; i < this.muzzleFlashPlanes.length; i++) {
      (this.muzzleFlashPlanes[i].material as THREE.MeshBasicMaterial).opacity = 0.95;
      this.muzzleFlashPlanes[i].rotation.z = Math.random() * Math.PI;
    }
    this.muzzleLight.intensity = 4.0;

    // Recoil kick in animation controller
    if (this.activeWeaponId === 'ar01') {
      this.animController.triggerRecoil(0.05, 0.012, 0.10, 0.03);
    } else {
      this.animController.triggerRecoil(0.04, 0.016, 0.14, 0.02);
    }

    // Spawn physical spent brass shell
    this.spawnSpentCasing();
  }

  private spawnSpentCasing(): void {
    if (this.shellCasings.length > 20) {
      const old = this.shellCasings.shift()!;
      this.root.remove(old.mesh);
    }

    const mesh = new THREE.Mesh(this.shellGeo, this.shellMat);
    const ejectionOrigin = this.activeWeaponId === 'ar01'
      ? new THREE.Vector3(0.04, 0.02, -0.05)
      : new THREE.Vector3(0.03, 0.03, -0.04);
    mesh.position.copy(ejectionOrigin);

    // Eject to the right and slightly up and back
    const vel = new THREE.Vector3(
      Math.random() * 1.5 + 1.2,
      Math.random() * 1.2 + 0.8,
      (Math.random() - 0.5) * 0.6
    );

    const rotVel = new THREE.Vector3(
      Math.random() * 20,
      Math.random() * 20,
      Math.random() * 20
    );

    this.root.add(mesh);
    this.shellCasings.push({ mesh, velocity: vel, rotVelocity: rotVel, life: 0 });
  }

  public triggerInspect(): boolean {
    return this.animController.triggerInspect();
  }

  public cancelInspect(): void {
    this.animController.cancelInspect();
  }

  public startReload(): void {
    this.cancelInspect();
  }

  public updateReloadProgress(_progress: number): void {
    // Handled in update()
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
    // 1. Muzzle Flash Decay
    if (this.flashTime > 0) {
      this.flashTime -= dt;
      if (this.flashTime <= 0) {
        for (let i = 0; i < this.muzzleFlashPlanes.length; i++) {
          (this.muzzleFlashPlanes[i].material as THREE.MeshBasicMaterial).opacity = 0;
        }
        this.muzzleLight.intensity = 0;
      }
    }

    // 2. Update Shell Casings
    for (let i = this.shellCasings.length - 1; i >= 0; i--) {
      const casing = this.shellCasings[i];
      casing.life += dt;
      if (casing.life > 0.6) {
        this.root.remove(casing.mesh);
        this.shellCasings.splice(i, 1);
        continue;
      }

      casing.velocity.y -= dt * 9.8;
      casing.mesh.position.addScaledVector(casing.velocity, dt);
      casing.mesh.rotation.x += casing.rotVelocity.x * dt;
      casing.mesh.rotation.y += casing.rotVelocity.y * dt;
    }

    // 3. Update Animation State Machine
    this.animController.update(
      dt,
      weaponId,
      isAiming,
      isSprinting,
      isMoving,
      isReloading,
      reloadProgress,
      mouseDeltaX,
      mouseDeltaY
    );

    // 4. Apply output transforms to viewmodel root
    this.root.position.copy(this.animController.outPosition);
    this.root.rotation.copy(this.animController.outRotation);
  }

  public dispose(): void {
    this.shellCasings.forEach(c => this.root.remove(c.mesh));
    this.shellCasings = [];
    this.shellGeo.dispose();
    this.shellMat.dispose();
  }
}
