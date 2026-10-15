import * as THREE from 'three';

interface SparkParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  color: THREE.Color;
  size: number;
}

export class ParticleManager {
  private scene: THREE.Scene;
  private rainPoints: THREE.Points | null = null;
  private sparks: SparkParticle[] = [];
  private sparkPoints: THREE.Points | null = null;
  private sparkGeo: THREE.BufferGeometry | null = null;
  private sparkPositions: Float32Array;
  private sparkColors: Float32Array;
  private readonly MAX_SPARKS = 400;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.sparkPositions = new Float32Array(this.MAX_SPARKS * 3);
    this.sparkColors = new Float32Array(this.MAX_SPARKS * 3);
    this.initSparks();
    this.initRain();
  }

  private initSparks(): void {
    this.sparkGeo = new THREE.BufferGeometry();
    this.sparkGeo.setAttribute('position', new THREE.BufferAttribute(this.sparkPositions, 3));
    this.sparkGeo.setAttribute('color', new THREE.BufferAttribute(this.sparkColors, 3));

    const sparkMat = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.sparkPoints = new THREE.Points(this.sparkGeo, sparkMat);
    this.sparkPoints.frustumCulled = false;
    this.scene.add(this.sparkPoints);
  }

  private initRain(): void {
    const rainCount = 1500;
    const rainGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(rainCount * 3);

    for (let i = 0; i < rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 120;
      positions[i * 3 + 1] = Math.random() * 25;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 140 - 45;
    }

    rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const rainMat = new THREE.PointsMaterial({
      color: 0xfff6dc, // Warm golden morning sunlight motes
      size: 0.07,
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.rainPoints = new THREE.Points(rainGeo, rainMat);
    this.scene.add(this.rainPoints);
  }

  public spawnImpactSparks(point: THREE.Vector3, normal: THREE.Vector3, isFlesh = false): void {
    const count = isFlesh ? 8 : 14;
    const baseColor = isFlesh ? new THREE.Color(0xff2a4b) : new THREE.Color(0xffb703);

    for (let i = 0; i < count; i++) {
      if (this.sparks.length >= this.MAX_SPARKS) {
        this.sparks.shift();
      }

      // Random bounce cone around normal
      const vel = normal.clone().multiplyScalar(Math.random() * 4 + 2);
      vel.x += (Math.random() - 0.5) * 4;
      vel.y += (Math.random() - 0.5) * 4;
      vel.z += (Math.random() - 0.5) * 4;

      this.sparks.push({
        position: point.clone(),
        velocity: vel,
        life: 0,
        maxLife: Math.random() * 0.25 + 0.15,
        color: baseColor.clone(),
        size: Math.random() * 0.15 + 0.08
      });
    }
  }

  public update(dt: number, playerPos?: THREE.Vector3): void {
    // 1. Update Morning Atmospheric Motes
    if (this.rainPoints) {
      const posAttr = this.rainPoints.geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < arr.length; i += 3) {
        arr[i + 1] -= dt * 1.2; // Gentle slow float
        arr[i] += dt * 1.6;     // Morning wind
        arr[i + 2] += Math.sin(arr[i] * 0.4) * dt * 0.6;
        if (arr[i + 1] < 0.2) {
          arr[i + 1] = 20;
          if (playerPos) {
            arr[i] = playerPos.x + (Math.random() - 0.5) * 60;
            arr[i + 2] = playerPos.z + (Math.random() - 0.5) * 60;
          }
        }
      }
      posAttr.needsUpdate = true;
    }

    // 2. Update Sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const sp = this.sparks[i];
      sp.life += dt;
      if (sp.life >= sp.maxLife) {
        this.sparks.splice(i, 1);
        continue;
      }

      // Physics
      sp.velocity.y -= dt * 9.8;
      sp.position.addScaledVector(sp.velocity, dt);
    }

    // Write sparks to buffer
    for (let i = 0; i < this.MAX_SPARKS; i++) {
      if (i < this.sparks.length) {
        const sp = this.sparks[i];
        this.sparkPositions[i * 3] = sp.position.x;
        this.sparkPositions[i * 3 + 1] = sp.position.y;
        this.sparkPositions[i * 3 + 2] = sp.position.z;

        const progress = 1 - sp.life / sp.maxLife;
        this.sparkColors[i * 3] = sp.color.r * progress;
        this.sparkColors[i * 3 + 1] = sp.color.g * progress;
        this.sparkColors[i * 3 + 2] = sp.color.b * progress;
      } else {
        this.sparkPositions[i * 3] = 0;
        this.sparkPositions[i * 3 + 1] = -100;
        this.sparkPositions[i * 3 + 2] = 0;
      }
    }

    if (this.sparkGeo) {
      this.sparkGeo.attributes.position.needsUpdate = true;
      this.sparkGeo.attributes.color.needsUpdate = true;
    }
  }

  public dispose(): void {
    if (this.rainPoints) {
      this.scene.remove(this.rainPoints);
      this.rainPoints.geometry.dispose();
      (this.rainPoints.material as THREE.Material).dispose();
      this.rainPoints = null;
    }
    if (this.sparkPoints) {
      this.scene.remove(this.sparkPoints);
      this.sparkPoints.geometry.dispose();
      (this.sparkPoints.material as THREE.Material).dispose();
      this.sparkPoints = null;
    }
  }
}
