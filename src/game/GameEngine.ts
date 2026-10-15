import * as THREE from 'three';
import { useGameStore } from '../stores/gameStore';
import { useSettingsStore } from '../stores/settingsStore';
import { InputManager } from './core/InputManager';
import { AudioManager } from './core/AudioManager';
import { GameLoop } from './core/GameLoop';
import { PerformanceManager } from './core/PerformanceManager';
import { CollisionWorld } from './world/CollisionWorld';
import { LightingSetup } from './world/LightingSetup';
import { LevelFactory, type LevelObjects } from './world/LevelFactory';
import { PlayerMovement } from './player/PlayerMovement';
import { PlayerCamera } from './player/PlayerCamera';
import { PlayerHealth } from './player/PlayerHealth';
import { WeaponViewModel } from './weapons/WeaponViewModel';
import { WeaponController } from './weapons/WeaponController';
import { EnemyManager } from './enemies/EnemyManager';
import { RaycastCombat } from './combat/RaycastCombat';
import { ParticleManager } from './effects/ParticleManager';
import { DecalManager } from './effects/DecalManager';
import { PostProcessingManager } from './effects/PostProcessingManager';
import { MissionController } from './missions/MissionController';

export class GameEngine {
  private container: HTMLElement;
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public playerCamera: PlayerCamera;

  // Subsystems
  public inputManager: InputManager;
  public audioManager: AudioManager;
  public performanceManager: PerformanceManager;
  public collisionWorld: CollisionWorld;
  public lightingSetup: LightingSetup;
  public levelObjects!: LevelObjects;

  public playerMovement: PlayerMovement;
  public playerHealth: PlayerHealth;
  public weaponViewModel: WeaponViewModel;
  public weaponController: WeaponController;
  public enemyManager: EnemyManager;
  public raycastCombat: RaycastCombat;
  public particleManager: ParticleManager;
  public decalManager: DecalManager;
  public postProcessingManager: PostProcessingManager;
  public missionController: MissionController;
  public gameLoop: GameLoop;

  private gameStore: ReturnType<typeof useGameStore>;
  private settingsStore: ReturnType<typeof useSettingsStore>;

  private hudUpdateTimer = 0;
  private isDestroyed = false;
  private resizeObserver: ResizeObserver | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.gameStore = useGameStore();
    this.settingsStore = useSettingsStore();

    // 1. Scene & Renderer
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({
      antialias: this.settingsStore.settings.graphicsQuality !== 'low',
      powerPreference: 'high-performance'
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height);

    this.performanceManager = new PerformanceManager();
    const dpr = this.performanceManager.getTargetPixelRatio(
      this.settingsStore.settings.graphicsQuality,
      this.settingsStore.settings.resolutionScale
    );
    this.renderer.setPixelRatio(dpr);
    this.performanceManager.configureRenderer(this.renderer, this.settingsStore.settings.graphicsQuality);

    container.appendChild(this.renderer.domElement);

    // 2. Camera
    this.playerCamera = new PlayerCamera(75, width / height, 0.1, 200);
    this.scene.add(this.playerCamera.camera);

    // 3. Audio & Input
    this.audioManager = new AudioManager();
    this.audioManager.init(this.settingsStore.settings);

    this.inputManager = new InputManager(container);
    this.inputManager.setSensitivity(this.settingsStore.settings.mouseSensitivity);
    this.inputManager.setInvertY(this.settingsStore.settings.invertY);

    this.inputManager.onPointerLockChangeCallback = (locked) => {
      if (!locked && this.gameStore.gameState === 'PLAYING') {
        this.pauseGame();
      }
    };

    this.inputManager.onPauseRequested = () => {
      if (this.gameStore.gameState === 'PLAYING') {
        this.pauseGame();
      } else if (this.gameStore.gameState === 'PAUSED') {
        this.resumeGame();
      }
    };

    // 4. Lighting & Level & Collision
    this.collisionWorld = new CollisionWorld();
    this.lightingSetup = new LightingSetup();
    this.lightingSetup.init(this.scene, this.settingsStore.settings.graphicsQuality);

    this.levelObjects = LevelFactory.buildLevel(this.scene, this.collisionWorld);

    // 5. Effects: Particles, Decals, Post-Processing
    this.particleManager = new ParticleManager(this.scene);
    this.decalManager = new DecalManager(this.scene, 64);
    this.postProcessingManager = new PostProcessingManager(
      this.renderer,
      this.scene,
      this.playerCamera.camera,
      this.settingsStore.settings.graphicsQuality
    );

    // 6. Player Systems
    this.playerMovement = new PlayerMovement(0, 0, 15);
    this.playerHealth = new PlayerHealth(100, 50);

    // 7. Weapon Viewmodel & Controller
    this.weaponViewModel = new WeaponViewModel();
    this.playerCamera.camera.add(this.weaponViewModel.root);

    this.weaponController = new WeaponController(this.weaponViewModel, this.audioManager);
    this.weaponController.onStateChanged = (wState) => {
      this.gameStore.updateWeaponState(wState);
    };

    // 8. Enemy Manager & Combat
    this.enemyManager = new EnemyManager(this.scene, this.collisionWorld, this.audioManager);
    this.enemyManager.spawnEnemies();

    this.raycastCombat = new RaycastCombat(
      this.collisionWorld,
      this.enemyManager,
      this.particleManager,
      this.audioManager,
      this.decalManager
    );

    // Wire up Weapon firing to Raycast Combat
    this.weaponController.onShotFired = (shot) => {
      this.gameStore.stats.shotsFired++;
      const result = this.raycastCombat.processShot(shot);
      if (result.hitEnemy) {
        this.gameStore.stats.shotsHit++;
        this.gameStore.stats.damageDealt += result.damageDealt;
        this.gameStore.triggerHitMarker(result.isHeadshot, result.isKill);
      }
      // Recompute accuracy
      if (this.gameStore.stats.shotsFired > 0) {
        this.gameStore.stats.accuracy = Math.round(
          (this.gameStore.stats.shotsHit / this.gameStore.stats.shotsFired) * 100
        );
      }
    };

    // Wire up enemy kills
    this.enemyManager.onEnemyKilled = (enemy) => {
      this.gameStore.stats.enemiesEliminated++;
      this.gameStore.showBanner('HOSTILE NEUTRALIZED', `${enemy.config.name} eliminated`, 'info', 2000);
    };

    // Wire up enemy attacks on player
    this.enemyManager.onPlayerAttacked = (evt) => {
      if (this.playerHealth.isDead) return;

      const dmgResult = this.playerHealth.takeDamage(evt.damage);
      this.gameStore.stats.damageTaken += evt.damage;
      this.audioManager.playPlayerHurt();
      this.gameStore.triggerDamageFeedback(evt.sourcePos, evt.damage);

      // Camera flinch
      this.playerCamera.addRecoil(0.04, 0.03);

      if (dmgResult.isDead) {
        this.missionController.handlePlayerDeath();
      }
    };

    // 9. Mission Controller
    this.missionController = new MissionController(
      this.gameStore,
      this.audioManager,
      this.enemyManager
    );

    // 10. Game Loop
    this.gameLoop = new GameLoop(
      this.update.bind(this),
      this.render.bind(this)
    );

    // 11. Resize handling
    this.setupResizeHandler();

    // Initial state sync
    this.weaponController.notifyState();
  }

  private setupResizeHandler(): void {
    const handleResize = () => {
      if (this.isDestroyed || !this.container) return;
      const w = this.container.clientWidth || window.innerWidth;
      const h = this.container.clientHeight || window.innerHeight;
      this.renderer.setSize(w, h);
      this.postProcessingManager.setSize(w, h);
      this.playerCamera.updateAspect(w / h);
    };

    window.addEventListener('resize', handleResize);
    this.resizeObserver = new ResizeObserver(handleResize);
    this.resizeObserver.observe(this.container);
  }

  public startMission(): void {
    this.gameStore.resetGame();
    this.playerHealth.reset();
    this.playerMovement.reset(0, 0, 15);
    this.weaponController.reset();
    this.enemyManager.spawnEnemies();
    this.missionController.reset();
    this.decalManager.clear();

    this.audioManager.init(this.settingsStore.settings);
    this.audioManager.resume();

    this.gameStore.setGameState('PLAYING');
    this.inputManager.requestPointerLock();
    this.gameLoop.start();
  }

  public pauseGame(): void {
    if (this.gameStore.gameState !== 'PLAYING') return;
    this.gameStore.setGameState('PAUSED');
    this.gameLoop.setPaused(true);
    this.inputManager.exitPointerLock();
  }

  public resumeGame(): void {
    if (this.gameStore.gameState !== 'PAUSED') return;
    this.gameStore.setGameState('PLAYING');
    this.gameLoop.setPaused(false);
    this.inputManager.requestPointerLock();
  }

  public restartMission(): void {
    this.startMission();
  }

  public update(dt: number): void {
    if (this.gameStore.gameState !== 'PLAYING') return;

    const input = this.inputManager.state;

    // 1. Mouse view deltas
    const mouseDeltas = this.inputManager.consumeMouseDeltas();
    this.playerCamera.handleMouseLook(mouseDeltas.x, mouseDeltas.y);

    // 2. Player movement & collision
    this.playerMovement.update(dt, input, this.playerCamera.yaw, this.collisionWorld);

    // 3. Footstep audio cadence
    const horizSpeed = Math.hypot(this.playerMovement.velocity.x, this.playerMovement.velocity.z);
    if (this.playerMovement.isGrounded && horizSpeed > 0.8) {
      this.audioManager.playFootstep(this.playerMovement.isSprinting);
    }

    // 4. Head bobbing
    if (this.settingsStore.settings.cameraBob && this.playerMovement.isGrounded && horizSpeed > 0.5) {
      const bobFreq = this.playerMovement.isSprinting ? 12 : 8;
      this.playerCamera.bobTime += dt * bobFreq;
      const bobAmp = this.playerMovement.isSprinting ? 0.05 : 0.025;
      this.playerCamera.bobOffset.set(
        Math.cos(this.playerCamera.bobTime * 0.5) * bobAmp * 0.8,
        Math.abs(Math.sin(this.playerCamera.bobTime)) * bobAmp,
        0
      );
    } else {
      this.playerCamera.bobOffset.lerp(new THREE.Vector3(0, 0, 0), dt * 10);
    }

    // 5. Update camera
    const eyePos = this.playerMovement.getEyePosition();
    this.playerCamera.update(dt, eyePos, input.isAiming, this.settingsStore.settings.cameraBob);

    // Camera forward vector for shooting
    const cameraForward = new THREE.Vector3(0, 0, -1);
    cameraForward.applyQuaternion(this.playerCamera.camera.quaternion);

    // 6. Update weapon controller & viewmodel animation state
    this.weaponController.update(
      dt,
      input,
      this.playerCamera.camera.position,
      cameraForward,
      this.playerMovement.isSprinting,
      this.playerHealth.isDead,
      (vert, horiz) => this.playerCamera.addRecoil(vert, horiz)
    );

    const isMoving = horizSpeed > 0.4;
    this.weaponViewModel.update(
      dt,
      this.weaponController.currentWeaponId,
      input.isAiming,
      this.playerMovement.isSprinting,
      isMoving,
      this.weaponController.activeWeapon.isReloading,
      this.weaponController.activeWeapon.reloadProgress,
      mouseDeltas.x,
      mouseDeltas.y
    );

    // 7. Update Enemies & AI
    this.enemyManager.update(dt, this.playerMovement.position);

    // 8. Update Mission objectives & interactions
    this.missionController.update(dt, this.playerMovement.position, input.interactPressed);

    // 9. Update particles & weather
    this.particleManager.update(dt, this.playerMovement.position);

    // 10. Update animated level lights (terminal beacon pulsing)
    const timeSec = performance.now() * 0.001;
    this.levelObjects.animatedLights.forEach(item => {
      item.light.intensity = item.baseIntensity * (0.8 + 0.3 * Math.sin(timeSec * item.speed));
    });

    // 11. Controlled HUD state updates (throttled to ~15 Hz to protect Vue reactivity)
    this.hudUpdateTimer += dt;
    if (this.hudUpdateTimer >= 0.065) {
      this.hudUpdateTimer = 0;
      this.gameStore.updatePlayerStats({
        health: this.playerHealth.health,
        maxHealth: this.playerHealth.maxHealth,
        armor: this.playerHealth.armor,
        maxArmor: this.playerHealth.maxArmor,
        isDead: this.playerHealth.isDead,
        isSprinting: this.playerMovement.isSprinting,
        isCrouching: this.playerMovement.isCrouching,
        isAiming: input.isAiming,
        speed: horizSpeed
      });
    }
  }

  public render(): void {
    this.performanceManager.recordFrame();
    this.postProcessingManager.render(this.renderer, this.scene, this.playerCamera.camera);
  }

  public dispose(): void {
    this.isDestroyed = true;
    this.gameLoop.stop();
    this.inputManager.dispose();
    this.audioManager.dispose();
    this.particleManager.dispose();
    this.decalManager.dispose();
    this.postProcessingManager.dispose();
    this.enemyManager.clear();
    this.lightingSetup.dispose(this.scene);

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    if (this.renderer.domElement && this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
