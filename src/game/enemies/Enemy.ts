import * as THREE from 'three';
import type { EnemyConfig, EnemyStateEnum } from '../../types/enemy';
import { CollisionWorld } from '../world/CollisionWorld';

export class Enemy {
  public id: string;
  public config: EnemyConfig;
  public mesh: THREE.Group;
  public headMesh: THREE.Mesh;
  public bodyMesh: THREE.Mesh;
  public state: EnemyStateEnum = 'PATROL';

  public health: number;
  public isDead = false;

  // Navigation & patrol
  public position = new THREE.Vector3();
  public forward = new THREE.Vector3(0, 0, -1);
  public currentWaypointIndex = 0;
  public lastKnownPlayerPos = new THREE.Vector3();

  // Attack timer
  public timeSinceLastAttack = 0;
  public alertTimer = 0;
  public searchTimer = 0;

  // Visual parts for locomotion animation
  private leftLeg: THREE.Group;
  private rightLeg: THREE.Group;
  private leftArm: THREE.Group;
  private rightArm: THREE.Group;
  private leftForearm: THREE.Group;
  private rightForearm: THREE.Group;
  private torsoGroup: THREE.Group;
  private goggleLens1: THREE.Mesh;
  private goggleLens2: THREE.Mesh;
  private visorMat: THREE.MeshBasicMaterial;
  private alertIndicator: THREE.Mesh;
  private animTime = 0;

  // Materials (stored to allow tinting on death/alert)
  private vestMat: THREE.MeshStandardMaterial;
  private skinMat: THREE.MeshStandardMaterial;

  constructor(config: EnemyConfig, scene: THREE.Scene) {
    this.id = config.id;
    this.config = config;
    this.health = config.health;

    const initialPos = config.patrolWaypoints[0] || { x: 0, y: 0, z: -20 };
    this.position.set(initialPos.x, initialPos.y, initialPos.z);

    // ─── MATERIALS ─────────────────────────────────────────────────────────────
    // Tactical navy blue vest
    this.vestMat = new THREE.MeshStandardMaterial({ color: 0x1a3a5c, roughness: 0.6, metalness: 0.2 });
    // Orange accent panels (chest stripes, forearm guards)
    const orangeMat = new THREE.MeshStandardMaterial({ color: 0xe05a00, roughness: 0.55, metalness: 0.15 });
    // Orange shirt (inner layer)
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0xcc4800, roughness: 0.75, metalness: 0.0 });
    // Skin tone
    this.skinMat = new THREE.MeshStandardMaterial({ color: 0xe8a07a, roughness: 0.8, metalness: 0.0 });
    // Dark pants
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1a2234, roughness: 0.85, metalness: 0.05 });
    // Tactical belt & boots
    const gearMat = new THREE.MeshStandardMaterial({ color: 0x2a3545, roughness: 0.7, metalness: 0.35 });
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x111820, roughness: 0.9, metalness: 0.1 });
    // Goggle band
    const goggleBandMat = new THREE.MeshStandardMaterial({ color: 0x0c1928, roughness: 0.7, metalness: 0.3 });
    this.visorMat = new THREE.MeshBasicMaterial({ color: 0x00d0ff, transparent: true, opacity: 0.82 });
    // Dark hair
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x1a1010, roughness: 0.9, metalness: 0.0 });
    // Alert indicator
    const alertMat = new THREE.MeshBasicMaterial({ color: 0xff3300, transparent: true, opacity: 0 });
    // Weapon
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x0d1018, metalness: 0.85, roughness: 0.3 });

    // ─── ROOT GROUP ─────────────────────────────────────────────────────────────
    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);

    // ─── FEET / BOOTS ────────────────────────────────────────────────────────────
    const bootGeo = new THREE.BoxGeometry(0.19, 0.28, 0.26);
    const lBoot = new THREE.Mesh(bootGeo, bootMat);
    lBoot.position.set(-0.16, 0.14, 0);
    lBoot.castShadow = true;
    this.mesh.add(lBoot);
    const rBoot = new THREE.Mesh(bootGeo, bootMat);
    rBoot.position.set(0.16, 0.14, 0);
    rBoot.castShadow = true;
    this.mesh.add(rBoot);

    // ─── LEGS ────────────────────────────────────────────────────────────────────
    const thighGeo = new THREE.BoxGeometry(0.22, 0.5, 0.23);
    const shinGeo  = new THREE.BoxGeometry(0.19, 0.44, 0.21);
    const kneePadGeo = new THREE.BoxGeometry(0.22, 0.12, 0.1);

    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.16, 0.28, 0);
    const lThigh = new THREE.Mesh(thighGeo, pantsMat);
    lThigh.position.set(0, 0.53, 0);
    lThigh.castShadow = true;
    this.leftLeg.add(lThigh);
    const lShin = new THREE.Mesh(shinGeo, pantsMat);
    lShin.position.set(0, 0.24, 0);
    lShin.castShadow = true;
    this.leftLeg.add(lShin);
    const lKneePad = new THREE.Mesh(kneePadGeo, gearMat);
    lKneePad.position.set(0, 0.38, -0.1);
    this.leftLeg.add(lKneePad);
    this.mesh.add(this.leftLeg);

    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.16, 0.28, 0);
    const rThigh = new THREE.Mesh(thighGeo, pantsMat);
    rThigh.position.set(0, 0.53, 0);
    rThigh.castShadow = true;
    this.rightLeg.add(rThigh);
    const rShin = new THREE.Mesh(shinGeo, pantsMat);
    rShin.position.set(0, 0.24, 0);
    rShin.castShadow = true;
    this.rightLeg.add(rShin);
    const rKneePad = new THREE.Mesh(kneePadGeo, gearMat);
    rKneePad.position.set(0, 0.38, -0.1);
    this.rightLeg.add(rKneePad);
    this.mesh.add(this.rightLeg);

    // ─── TACTICAL BELT / POUCHES ─────────────────────────────────────────────────
    const beltGeo = new THREE.BoxGeometry(0.58, 0.1, 0.28);
    const belt = new THREE.Mesh(beltGeo, gearMat);
    belt.position.set(0, 0.98, 0);
    belt.castShadow = true;
    this.mesh.add(belt);
    // Pouches
    const pouchGeo = new THREE.BoxGeometry(0.12, 0.16, 0.09);
    [-0.2, -0.07, 0.07, 0.2].forEach((px, i) => {
      const pouch = new THREE.Mesh(pouchGeo, i % 2 === 0 ? gearMat : bootMat);
      pouch.position.set(px, 0.88, -0.12);
      this.mesh.add(pouch);
    });

    // ─── TORSO GROUP (for upper body lean) ────────────────────────────────────────
    this.torsoGroup = new THREE.Group();
    this.torsoGroup.position.set(0, 1.08, 0);
    this.mesh.add(this.torsoGroup);

    // Orange inner shirt base
    const shirtGeo = new THREE.BoxGeometry(0.54, 0.72, 0.32);
    const shirt = new THREE.Mesh(shirtGeo, shirtMat);
    shirt.position.set(0, 0.36, 0);
    shirt.castShadow = true;
    this.torsoGroup.add(shirt);

    // Blue tactical vest over shirt (slightly wider/thicker)
    const vestFrontGeo = new THREE.BoxGeometry(0.56, 0.68, 0.26);
    this.bodyMesh = new THREE.Mesh(vestFrontGeo, this.vestMat);
    this.bodyMesh.position.set(0, 0.36, -0.04);
    this.bodyMesh.castShadow = true;
    (this.bodyMesh as unknown as { enemyId: string; isHead: boolean }).enemyId = this.id;
    (this.bodyMesh as unknown as { enemyId: string; isHead: boolean }).isHead = false;
    this.torsoGroup.add(this.bodyMesh);

    // Orange chest accent stripe (left panel)
    const chestAccentL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.38, 0.02), orangeMat);
    chestAccentL.position.set(-0.17, 0.5, -0.17);
    this.torsoGroup.add(chestAccentL);

    // Orange chest accent stripe (right panel)
    const chestAccentR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.38, 0.02), orangeMat);
    chestAccentR.position.set(0.17, 0.5, -0.17);
    this.torsoGroup.add(chestAccentR);

    // Shoulder pad (left)
    const shoulderGeo = new THREE.BoxGeometry(0.2, 0.15, 0.26);
    const lShoulder = new THREE.Mesh(shoulderGeo, this.vestMat);
    lShoulder.position.set(-0.34, 0.66, 0);
    lShoulder.castShadow = true;
    this.torsoGroup.add(lShoulder);
    // Orange shoulder cap
    const lShoulderCap = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.28), orangeMat);
    lShoulderCap.position.set(-0.34, 0.74, 0);
    this.torsoGroup.add(lShoulderCap);

    // Shoulder pad (right)
    const rShoulder = new THREE.Mesh(shoulderGeo, this.vestMat);
    rShoulder.position.set(0.34, 0.66, 0);
    rShoulder.castShadow = true;
    this.torsoGroup.add(rShoulder);
    const rShoulderCap = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.28), orangeMat);
    rShoulderCap.position.set(0.34, 0.74, 0);
    this.torsoGroup.add(rShoulderCap);

    // Tactical chest plate / MOLLE panel
    const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.28, 0.04), gearMat);
    chestPlate.position.set(0, 0.45, -0.17);
    this.torsoGroup.add(chestPlate);

    // Back plate
    const backPlate = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.6, 0.05), this.vestMat);
    backPlate.position.set(0, 0.36, 0.15);
    this.torsoGroup.add(backPlate);

    // ─── ARMS ─────────────────────────────────────────────────────────────────────
    const upperArmGeo = new THREE.BoxGeometry(0.17, 0.42, 0.18);
    const forearmGeo  = new THREE.BoxGeometry(0.15, 0.36, 0.16);
    const handGeo     = new THREE.BoxGeometry(0.13, 0.14, 0.14);

    // Left arm (orange forearm panel = weapon-bearing arm)
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.36, 0.6, 0);
    const lUpper = new THREE.Mesh(upperArmGeo, this.vestMat);
    lUpper.position.set(0, -0.2, 0);
    lUpper.castShadow = true;
    this.leftArm.add(lUpper);
    this.leftForearm = new THREE.Group();
    this.leftForearm.position.set(0, -0.42, 0);
    const lForearmMesh = new THREE.Mesh(forearmGeo, this.skinMat);
    lForearmMesh.position.set(0, -0.18, 0);
    lForearmMesh.castShadow = true;
    this.leftForearm.add(lForearmMesh);
    // Orange forearm guard panel
    const lForeGuard = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.06), orangeMat);
    lForeGuard.position.set(0, -0.12, -0.08);
    this.leftForearm.add(lForeGuard);
    const lHand = new THREE.Mesh(handGeo, this.skinMat);
    lHand.position.set(0, -0.36, 0);
    this.leftForearm.add(lHand);
    this.leftArm.add(this.leftForearm);
    this.torsoGroup.add(this.leftArm);

    // Right arm (extends to hold weapon)
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.36, 0.6, 0);
    const rUpper = new THREE.Mesh(upperArmGeo, this.vestMat);
    rUpper.position.set(0, -0.2, 0);
    rUpper.castShadow = true;
    this.rightArm.add(rUpper);
    this.rightForearm = new THREE.Group();
    this.rightForearm.position.set(0, -0.42, 0);
    const rForearmMesh = new THREE.Mesh(forearmGeo, this.skinMat);
    rForearmMesh.position.set(0, -0.18, 0);
    rForearmMesh.castShadow = true;
    this.rightForearm.add(rForearmMesh);
    // Orange forearm guard
    const rForeGuard = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.06), orangeMat);
    rForeGuard.position.set(0, -0.12, -0.08);
    this.rightForearm.add(rForeGuard);
    const rHand = new THREE.Mesh(handGeo, this.skinMat);
    rHand.position.set(0, -0.36, 0);
    this.rightForearm.add(rHand);
    this.rightArm.add(this.rightForearm);
    this.torsoGroup.add(this.rightArm);

    // ─── NECK ─────────────────────────────────────────────────────────────────────
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.18, 10), this.skinMat);
    neck.position.set(0, 0.76, 0);
    this.torsoGroup.add(neck);

    // ─── HEAD ─────────────────────────────────────────────────────────────────────
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.84, 0);
    this.torsoGroup.add(headGroup);

    // Head base (skin)
    const headGeo = new THREE.BoxGeometry(0.32, 0.36, 0.30);
    this.headMesh = new THREE.Mesh(headGeo, this.skinMat);
    this.headMesh.position.set(0, 0.18, 0);
    this.headMesh.castShadow = true;
    (this.headMesh as unknown as { enemyId: string; isHead: boolean }).enemyId = this.id;
    (this.headMesh as unknown as { enemyId: string; isHead: boolean }).isHead = true;
    headGroup.add(this.headMesh);

    // Jaw / chin shaping
    const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.26), this.skinMat);
    jaw.position.set(0, 0.06, 0.01);
    headGroup.add(jaw);

    // Brow ridge (more angular/heroic)
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.08, 0.1), this.skinMat);
    brow.position.set(0, 0.28, -0.12);
    headGroup.add(brow);

    // Nose
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.07), this.skinMat);
    nose.position.set(0, 0.18, -0.16);
    headGroup.add(nose);

    // Dark hair (short, spiked upward like reference)
    const hairBaseGeo = new THREE.BoxGeometry(0.34, 0.15, 0.32);
    const hairBase = new THREE.Mesh(hairBaseGeo, hairMat);
    hairBase.position.set(0, 0.36, 0.02);
    headGroup.add(hairBase);

    // Spiky front of hair
    const hairSpike1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.08), hairMat);
    hairSpike1.position.set(-0.06, 0.47, -0.09);
    hairSpike1.rotation.x = -0.4;
    headGroup.add(hairSpike1);
    const hairSpike2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.07), hairMat);
    hairSpike2.position.set(0.04, 0.49, -0.06);
    hairSpike2.rotation.x = -0.5;
    headGroup.add(hairSpike2);
    const hairSpike3 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.07), hairMat);
    hairSpike3.position.set(-0.14, 0.44, -0.05);
    hairSpike3.rotation.z = 0.3;
    headGroup.add(hairSpike3);

    // Goggle band (across forehead)
    const goggleBand = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.1, 0.06), goggleBandMat);
    goggleBand.position.set(0, 0.29, -0.14);
    headGroup.add(goggleBand);

    // Goggle side straps
    const gStrapGeo = new THREE.BoxGeometry(0.05, 0.09, 0.24);
    const gStrapL = new THREE.Mesh(gStrapGeo, goggleBandMat);
    gStrapL.position.set(-0.16, 0.29, 0.0);
    headGroup.add(gStrapL);
    const gStrapR = new THREE.Mesh(gStrapGeo, goggleBandMat);
    gStrapR.position.set(0.16, 0.29, 0.0);
    headGroup.add(gStrapR);

    // Goggle left lens (cyan tinted glass)
    this.goggleLens1 = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.082, 0.04), this.visorMat);
    this.goggleLens1.position.set(-0.09, 0.29, -0.17);
    headGroup.add(this.goggleLens1);

    // Goggle right lens
    this.goggleLens2 = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.082, 0.04), this.visorMat);
    this.goggleLens2.position.set(0.09, 0.29, -0.17);
    headGroup.add(this.goggleLens2);

    // Eye brows
    const browGeo = new THREE.BoxGeometry(0.1, 0.022, 0.025);
    const lBrow = new THREE.Mesh(browGeo, hairMat);
    lBrow.position.set(-0.09, 0.245, -0.152);
    lBrow.rotation.z = 0.18;
    headGroup.add(lBrow);
    const rBrow = new THREE.Mesh(browGeo, hairMat);
    rBrow.position.set(0.09, 0.245, -0.152);
    rBrow.rotation.z = -0.18;
    headGroup.add(rBrow);

    // Alert / exclamation indicator above head (shown when ALERT state)
    this.alertIndicator = new THREE.Mesh(
      new THREE.ConeGeometry(0.08, 0.24, 8),
      alertMat
    );
    this.alertIndicator.position.set(0, 0.55, 0);
    headGroup.add(this.alertIndicator);

    // ─── ENEMY AK-STYLE WEAPON ────────────────────────────────────────────────────
    const enemyGun = new THREE.Group();
    enemyGun.position.set(0.28, 0.42, -0.22);
    enemyGun.rotation.y = Math.PI * 0.03;
    this.torsoGroup.add(enemyGun);

    // Receiver body
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, 0.44), gunMat);
    receiver.position.set(0, 0, 0);
    enemyGun.add(receiver);

    // Dust cover / top rail
    const dustCover = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.04, 0.38), gunMat);
    dustCover.position.set(0, 0.07, -0.04);
    enemyGun.add(dustCover);

    // Curved AK magazine
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.22, 0.075), gunMat);
    mag.position.set(0, -0.16, -0.04);
    mag.rotation.x = 0.16;
    enemyGun.add(mag);

    // Pistol grip
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.14, 0.055), gunMat);
    grip.position.set(0, -0.1, 0.12);
    grip.rotation.x = 0.38;
    enemyGun.add(grip);

    // Barrel
    const barrelGun = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.013, 0.38, 10), gunMat);
    barrelGun.rotation.x = Math.PI / 2;
    barrelGun.position.set(0, 0.028, -0.34);
    enemyGun.add(barrelGun);

    // Muzzle brake
    const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.014, 0.05, 8), gunMat);
    muzzle.rotation.x = Math.PI / 2;
    muzzle.position.set(0, 0.028, -0.55);
    enemyGun.add(muzzle);

    scene.add(this.mesh);
  }

  public takeDamage(amount: number, isHeadshot: boolean): { isKill: boolean; damageDealt: number } {
    if (this.isDead) return { isKill: false, damageDealt: 0 };

    const multiplier = isHeadshot ? 2.2 : 1.0;
    const finalDamage = amount * multiplier;
    this.health = Math.max(0, this.health - finalDamage);

    // Flash vest orange on hit
    this.vestMat.emissive.setHex(0xff4400);
    this.vestMat.emissiveIntensity = 0.6;
    setTimeout(() => {
      if (!this.isDead) {
        this.vestMat.emissive.setHex(0x000000);
        this.vestMat.emissiveIntensity = 0;
      }
    }, 120);

    // If surprised, immediately alert
    if (this.state === 'PATROL' || this.state === 'SEARCH') {
      this.state = 'ALERT';
      this.alertTimer = 0.4;
    }

    if (this.health <= 0) {
      this.die();
      return { isKill: true, damageDealt: finalDamage };
    }

    return { isKill: false, damageDealt: finalDamage };
  }

  private die(): void {
    this.isDead = true;
    this.state = 'DEAD';

    // Goggle power off
    this.visorMat.color.setHex(0x334155);
    this.visorMat.opacity = 0.3;

    // Vest goes dark
    this.vestMat.color.setHex(0x0f1a28);
    this.vestMat.emissive.setHex(0x000000);
    this.vestMat.emissiveIntensity = 0;

    // Skin pallor
    this.skinMat.color.setHex(0xaa7060);

    // Ragdoll collapse
    this.mesh.rotation.x = Math.PI / 2;
    this.mesh.position.y = 0.25;
    this.torsoGroup.rotation.z = 0.15;
  }

  public updateAnimation(dt: number, isMoving: boolean): void {
    if (this.isDead) return;

    // Alert indicator pulse
    const alertMat = this.alertIndicator.material as THREE.MeshBasicMaterial;
    if (this.state === 'ALERT') {
      alertMat.opacity = (Math.sin(Date.now() * 0.01) * 0.5 + 0.5) * 0.9 + 0.1;
    } else {
      alertMat.opacity = Math.max(0, alertMat.opacity - dt * 3);
    }

    // Goggle lens pulse (cyan when alert/attack, normal otherwise)
    if (this.state === 'ATTACK') {
      (this.goggleLens1.material as THREE.MeshBasicMaterial).color.setHex(0xff3000);
      (this.goggleLens2.material as THREE.MeshBasicMaterial).color.setHex(0xff3000);
    } else if (this.state === 'ALERT' || this.state === 'CHASE') {
      (this.goggleLens1.material as THREE.MeshBasicMaterial).color.setHex(0xffaa00);
      (this.goggleLens2.material as THREE.MeshBasicMaterial).color.setHex(0xffaa00);
    } else {
      (this.goggleLens1.material as THREE.MeshBasicMaterial).color.setHex(0x00d0ff);
      (this.goggleLens2.material as THREE.MeshBasicMaterial).color.setHex(0x00d0ff);
    }

    if (isMoving) {
      this.animTime += dt * (this.state === 'CHASE' ? 11 : 7);
      const legSwing = Math.sin(this.animTime) * 0.42;
      const armSwing = Math.sin(this.animTime) * 0.30;

      // Leg cycling — legs are Groups, rotate around their hip pivot
      this.leftLeg.rotation.x = legSwing;
      this.rightLeg.rotation.x = -legSwing;

      // Natural arm counterswing
      this.leftArm.rotation.x = -armSwing * 0.6;
      this.rightArm.rotation.x = armSwing * 0.6;

      // Slight torso lean forward when running
      this.torsoGroup.rotation.x = this.state === 'CHASE' ? 0.18 : 0.06;

      // Subtle torso sway
      this.torsoGroup.rotation.z = Math.sin(this.animTime * 0.5) * 0.04;
    } else {
      // Smooth return to idle
      this.leftLeg.rotation.x   = THREE.MathUtils.lerp(this.leftLeg.rotation.x, 0, dt * 8);
      this.rightLeg.rotation.x  = THREE.MathUtils.lerp(this.rightLeg.rotation.x, 0, dt * 8);
      this.leftArm.rotation.x   = THREE.MathUtils.lerp(this.leftArm.rotation.x, 0, dt * 8);
      this.rightArm.rotation.x  = THREE.MathUtils.lerp(this.rightArm.rotation.x, 0, dt * 8);
      this.torsoGroup.rotation.x = THREE.MathUtils.lerp(this.torsoGroup.rotation.x, 0, dt * 8);
      this.torsoGroup.rotation.z = THREE.MathUtils.lerp(this.torsoGroup.rotation.z, 0, dt * 8);

      // Idle breathing
      const breathT = Date.now() * 0.001;
      this.torsoGroup.position.y = Math.sin(breathT * 1.2) * 0.008;
    }

    // Raise arms in ATTACK state (weapon-ready pose)
    if (this.state === 'ATTACK') {
      this.leftArm.rotation.x  = THREE.MathUtils.lerp(this.leftArm.rotation.x, -0.85, dt * 7);
      this.rightArm.rotation.x = THREE.MathUtils.lerp(this.rightArm.rotation.x, -0.85, dt * 7);
      this.leftArm.rotation.y  = THREE.MathUtils.lerp(this.leftArm.rotation.y, 0.2, dt * 7);
      this.rightArm.rotation.y = THREE.MathUtils.lerp(this.rightArm.rotation.y, -0.2, dt * 7);
    } else {
      this.leftArm.rotation.y  = THREE.MathUtils.lerp(this.leftArm.rotation.y, 0, dt * 5);
      this.rightArm.rotation.y = THREE.MathUtils.lerp(this.rightArm.rotation.y, 0, dt * 5);
    }
  }

  public dispose(scene: THREE.Scene): void {
    scene.remove(this.mesh);
  }
}
