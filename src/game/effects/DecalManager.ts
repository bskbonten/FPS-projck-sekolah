import * as THREE from 'three';

export class DecalManager {
  private scene: THREE.Scene;
  private maxDecals = 64;
  private decalPool: THREE.Mesh[] = [];
  private activeDecals: THREE.Mesh[] = [];
  private decalMat: THREE.MeshBasicMaterial;
  private decalGeo: THREE.PlaneGeometry;

  constructor(scene: THREE.Scene, maxDecals = 64) {
    this.scene = scene;
    this.maxDecals = maxDecals;

    let texture: THREE.Texture | null = null;
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Black center hole
        const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
        grad.addColorStop(0, 'rgba(10, 10, 10, 0.95)');
        grad.addColorStop(0.3, 'rgba(25, 25, 28, 0.9)');
        grad.addColorStop(0.6, 'rgba(50, 48, 45, 0.5)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 64);

        // Spatter cracks
        ctx.strokeStyle = 'rgba(15, 15, 15, 0.8)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3 + (Math.random() - 0.5) * 0.4;
          const len = 14 + Math.random() * 12;
          ctx.beginPath();
          ctx.moveTo(32, 32);
          ctx.lineTo(32 + Math.cos(angle) * len, 32 + Math.sin(angle) * len);
          ctx.stroke();
        }
        texture = new THREE.CanvasTexture(canvas);
      }
    }

    this.decalGeo = new THREE.PlaneGeometry(0.22, 0.22);
    this.decalMat = new THREE.MeshBasicMaterial({
      map: texture,
      color: texture ? 0xffffff : 0x111115,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    });

    // Pre-allocate pool
    for (let i = 0; i < this.maxDecals; i++) {
      const mesh = new THREE.Mesh(this.decalGeo, this.decalMat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.decalPool.push(mesh);
    }
  }

  public spawnDecal(point: THREE.Vector3, normal: THREE.Vector3): void {
    let decal: THREE.Mesh;
    if (this.decalPool.length > 0) {
      decal = this.decalPool.pop()!;
    } else {
      // Recycle oldest active decal
      decal = this.activeDecals.shift()!;
    }

    // Position slightly along normal to prevent z-fighting
    decal.position.copy(point).addScaledVector(normal, 0.008);

    // Orient facing outwards from surface normal
    const target = decal.position.clone().add(normal);
    decal.lookAt(target);
    // Random roll for visual variation
    decal.rotateZ(Math.random() * Math.PI * 2);

    decal.visible = true;
    this.activeDecals.push(decal);
  }

  public clear(): void {
    while (this.activeDecals.length > 0) {
      const d = this.activeDecals.pop()!;
      d.visible = false;
      this.decalPool.push(d);
    }
  }

  public dispose(): void {
    this.clear();
    for (let i = 0; i < this.decalPool.length; i++) {
      this.scene.remove(this.decalPool[i]);
    }
    this.decalPool = [];
    this.decalGeo.dispose();
    this.decalMat.dispose();
    if (this.decalMat.map) this.decalMat.map.dispose();
  }
}
