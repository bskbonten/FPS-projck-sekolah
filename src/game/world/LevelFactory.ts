import * as THREE from 'three';
import { CollisionWorld } from './CollisionWorld';

export interface LevelObjects {
  terminalMesh: THREE.Mesh;
  terminalPosition: THREE.Vector3;
  extractionMesh: THREE.Mesh;
  extractionPosition: THREE.Vector3;
  interactiveMeshes: THREE.Object3D[];
  animatedLights: Array<{ light: THREE.PointLight; baseIntensity: number; speed: number }>;
}

export class LevelFactory {
  /**
   * Procedural high-detail city asphalt with double yellow lines, lane dashes, crosswalk, and manholes
   */
  private static createAsphaltTexture(): THREE.CanvasTexture {
    if (typeof document === 'undefined') return new THREE.CanvasTexture({} as HTMLCanvasElement);
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Base morning asphalt
    ctx.fillStyle = '#1c222b';
    ctx.fillRect(0, 0, 1024, 1024);

    // Fine mineral aggregate grain & surface wear
    const imgData = ctx.getImageData(0, 0, 1024, 1024);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 28;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise + 2));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise + 4));
    }
    ctx.putImageData(imgData, 0, 0);

    // Center double solid yellow dividers
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(506, 0);
    ctx.lineTo(506, 1024);
    ctx.moveTo(518, 0);
    ctx.lineTo(518, 1024);
    ctx.stroke();

    // White broken lane divider stripes (left and right lanes)
    ctx.strokeStyle = 'rgba(245, 250, 255, 0.92)';
    ctx.lineWidth = 7;
    ctx.setLineDash([48, 48]);

    ctx.beginPath();
    ctx.moveTo(256, 0);
    ctx.lineTo(256, 1024);
    ctx.moveTo(768, 0);
    ctx.lineTo(768, 1024);
    ctx.stroke();

    // Crosswalk pedestrian zebra stripes
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(245, 250, 255, 0.88)';
    for (let x = 64; x < 960; x += 64) {
      ctx.fillRect(x, 140, 36, 110);
      ctx.fillRect(x, 780, 36, 110);
    }

    // Circular iron manhole covers with drainage rim
    ctx.fillStyle = '#222a36';
    ctx.beginPath();
    ctx.arc(380, 480, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3d4756';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Drainage slits in manhole
    ctx.strokeStyle = '#11161f';
    ctx.lineWidth = 2;
    for (let a = 0; a < Math.PI; a += Math.PI / 4) {
      ctx.beginPath();
      ctx.moveTo(380 + Math.cos(a) * 20, 480 + Math.sin(a) * 20);
      ctx.lineTo(380 - Math.cos(a) * 20, 480 - Math.sin(a) * 20);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 12);
    texture.anisotropy = 4;
    return texture;
  }

  /**
   * Procedural concrete sidewalk slabs with expansion seams and curb edges
   */
  private static createSidewalkTexture(): THREE.CanvasTexture {
    if (typeof document === 'undefined') return new THREE.CanvasTexture({} as HTMLCanvasElement);
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Concrete base (clean morning daylight)
    ctx.fillStyle = '#2c3542';
    ctx.fillRect(0, 0, 512, 512);

    // Slab grid lines
    ctx.strokeStyle = '#18202a';
    ctx.lineWidth = 4;
    for (let y = 0; y <= 512; y += 128) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }
    for (let x = 0; x <= 512; x += 128) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }

    // Concrete micro-grit & dirt wear
    for (let i = 0; i < 4000; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 512;
      const c = Math.floor(Math.random() * 22 + 36);
      ctx.fillStyle = `rgb(${c}, ${c + 4}, ${c + 8})`;
      ctx.fillRect(rx, ry, 2, 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 16);
    return texture;
  }

  /**
   * Procedural architectural concrete panels with formwork tie holes and seams
   */
  private static createConcretePanelTexture(): THREE.CanvasTexture {
    if (typeof document === 'undefined') return new THREE.CanvasTexture({} as HTMLCanvasElement);
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Base concrete
    ctx.fillStyle = '#222933';
    ctx.fillRect(0, 0, 512, 512);

    // Formwork seams
    ctx.strokeStyle = '#141820';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, 512, 256);
    ctx.strokeRect(0, 256, 512, 256);

    // Recessed circular anchor tie holes
    const holes = [
      [36, 36], [256, 36], [476, 36],
      [36, 220], [256, 220], [476, 220],
      [36, 292], [256, 292], [476, 292],
      [36, 476], [256, 476], [476, 476]
    ];
    holes.forEach(([x, y]) => {
      ctx.fillStyle = '#0f131a';
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#333f4e';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Subtle moisture runoff stains
    ctx.fillStyle = 'rgba(10, 14, 20, 0.25)';
    for (let x = 30; x < 500; x += 60) {
      ctx.fillRect(x, 0, 8, 40);
      ctx.fillRect(x, 256, 8, 40);
    }

    // Concrete texture noise
    for (let i = 0; i < 3500; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 512;
      const c = Math.floor(Math.random() * 20 + 26);
      ctx.fillStyle = `rgb(${c}, ${c + 3}, ${c + 6})`;
      ctx.fillRect(rx, ry, 2, 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }

  /**
   * Procedural modern high-rise office building facade reflecting morning sky
   */
  private static createSkyscraperFacadeTexture(): THREE.CanvasTexture {
    if (typeof document === 'undefined') return new THREE.CanvasTexture({} as HTMLCanvasElement);
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Architectural aluminum & granite spandrel panels
    ctx.fillStyle = '#242e3b';
    ctx.fillRect(0, 0, 512, 1024);

    // Office windows matrix
    const cols = 8;
    const rows = 24;
    const cellW = 512 / cols;
    const cellH = 1024 / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const wx = c * cellW + 6;
        const wy = r * cellH + 8;
        const ww = cellW - 12;
        const wh = cellH - 16;

        // Morning sky reflections in office windows
        const rand = Math.random();
        if (rand < 0.25) {
          ctx.fillStyle = 'rgba(255, 245, 225, 0.95)'; // Morning sun glint
        } else if (rand < 0.70) {
          ctx.fillStyle = 'rgba(135, 185, 230, 0.90)'; // Blue morning sky
        } else {
          ctx.fillStyle = 'rgba(65, 100, 135, 0.88)'; // Deep tinted glass
        }
        ctx.fillRect(wx, wy, ww, wh);

        // Window mullion frame
        ctx.strokeStyle = '#18202a';
        ctx.lineWidth = 2;
        ctx.strokeRect(wx, wy, ww, wh);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }

  /**
   * Procedural industrial shipping container texture with corrugated ribs, stencils, and barcodes
   */
  private static createShippingContainerTexture(
    baseColor: string,
    accentColor: string,
    code: string,
    label: string
  ): THREE.CanvasTexture {
    if (typeof document === 'undefined') return new THREE.CanvasTexture({} as HTMLCanvasElement);
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Base industrial color
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 512, 256);

    // Corrugated vertical steel ribs
    for (let x = 0; x < 512; x += 16) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.fillRect(x, 0, 4, 256);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
      ctx.fillRect(x + 10, 0, 6, 256);
    }

    // Heavy steel frame edge
    ctx.strokeStyle = '#11161f';
    ctx.lineWidth = 12;
    ctx.strokeRect(0, 0, 512, 256);

    // Brand logo banner
    ctx.fillStyle = accentColor;
    ctx.fillRect(24, 35, 220, 36);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(label, 36, 60);

    // Serial code & military specs
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 15px monospace';
    ctx.fillText(code, 36, 105);
    ctx.font = '11px monospace';
    ctx.fillText('MAX GROSS: 32,500 KG', 36, 128);
    ctx.fillText('TARE WT:    3,800 KG', 36, 146);
    ctx.fillText('HAZMAT CLASS 9 — SEC-04', 36, 164);

    // Barcode lines
    for (let bx = 320; bx < 480; bx += 7) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx, 115, Math.random() > 0.4 ? 4 : 2, 45);
    }

    // Hazard caution stripes
    ctx.fillStyle = '#fbbf24';
    for (let cx = 320; cx < 480; cx += 20) {
      ctx.beginPath();
      ctx.moveTo(cx, 185);
      ctx.lineTo(cx + 10, 185);
      ctx.lineTo(cx, 205);
      ctx.lineTo(cx - 10, 205);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  /**
   * Procedural military ordnance supply crate texture
   */
  private static createMilitaryCrateTexture(): THREE.CanvasTexture {
    if (typeof document === 'undefined') return new THREE.CanvasTexture({} as HTMLCanvasElement);
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Tactical olive drab composite base
    ctx.fillStyle = '#1c261e';
    ctx.fillRect(0, 0, 256, 256);

    // Reinforced corner brackets & edge trims
    ctx.fillStyle = '#2e3d31';
    ctx.fillRect(0, 0, 256, 16);
    ctx.fillRect(0, 240, 256, 16);
    ctx.fillRect(0, 0, 16, 256);
    ctx.fillRect(240, 0, 16, 256);

    // Rivets
    ctx.fillStyle = '#9cb5a0';
    const rivets = [
      [8, 8], [64, 8], [128, 8], [192, 8], [248, 8],
      [8, 248], [64, 248], [128, 248], [192, 248], [248, 248],
      [8, 64], [8, 128], [8, 192],
      [248, 64], [248, 128], [248, 192]
    ];
    rivets.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Stencil typography
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('ORDNANCE', 28, 55);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '12px monospace';
    ctx.fillText('SPEC 5.56 NATO', 28, 76);
    ctx.fillText('LOT: 2089-SP', 28, 96);
    ctx.fillText('RESTRICTED', 28, 116);

    // Yellow/black warning chevron
    ctx.fillStyle = '#fbbf24';
    for (let x = 28; x < 228; x += 22) {
      ctx.beginPath();
      ctx.moveTo(x, 140);
      ctx.lineTo(x + 11, 140);
      ctx.lineTo(x, 160);
      ctx.lineTo(x - 11, 160);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  /**
   * Procedural industrial fuel drum / barrel texture
   */
  private static createBarrelTexture(baseHex: string, label: string): THREE.CanvasTexture {
    if (typeof document === 'undefined') return new THREE.CanvasTexture({} as HTMLCanvasElement);
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Barrel body
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, 256, 256);

    // Metal reinforcement ribs & shadows
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 44, 256, 14);
    ctx.fillRect(0, 124, 256, 14);
    ctx.fillRect(0, 204, 256, 14);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(0, 42, 256, 2);
    ctx.fillRect(0, 122, 256, 2);
    ctx.fillRect(0, 202, 256, 2);

    // Hazard symbol & text
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(label, 40, 95);
    ctx.fillText('DANGER - 200L', 36, 175);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  /**
   * Procedural modern ground-level glass storefront and corporate logo banner
   */
  private static createStorefrontTexture(brand: string, neonHex: string): THREE.CanvasTexture {
    if (typeof document === 'undefined') return new THREE.CanvasTexture({} as HTMLCanvasElement);
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Black architectural granite base
    ctx.fillStyle = '#11151c';
    ctx.fillRect(0, 0, 512, 256);

    // Glass display panel
    ctx.fillStyle = '#182434';
    ctx.fillRect(16, 65, 480, 175);

    // Neon Brand Sign Header
    ctx.fillStyle = '#080b0f';
    ctx.fillRect(16, 14, 480, 44);

    ctx.fillStyle = neonHex;
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(brand, 32, 44);

    // Interior showroom glow frames
    ctx.strokeStyle = neonHex;
    ctx.lineWidth = 2;
    ctx.strokeRect(32, 85, 200, 135);
    ctx.strokeRect(280, 85, 200, 135);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = '13px monospace';
    ctx.fillText('AUTHORIZED ACCESS ONLY', 44, 115);
    ctx.fillText('SECURITY STATUS: ONLINE', 44, 138);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  /**
   * Hazard yellow/black chevron striping for concrete barriers
   */
  private static createHazardTexture(): THREE.CanvasTexture {
    if (typeof document === 'undefined') return new THREE.CanvasTexture({} as HTMLCanvasElement);
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#ffb703';
    ctx.fillRect(0, 0, 256, 64);

    ctx.fillStyle = '#11151c';
    for (let x = -64; x < 256; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 16, 0);
      ctx.lineTo(x - 8, 64);
      ctx.lineTo(x - 24, 64);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 1);
    return texture;
  }

  public static buildLevel(scene: THREE.Scene, collision: CollisionWorld): LevelObjects {
    const animatedLights: Array<{ light: THREE.PointLight; baseIntensity: number; speed: number }> = [];

    // --- MATERIALS ---
    const asphaltTex = this.createAsphaltTexture();
    const asphaltMat = new THREE.MeshStandardMaterial({
      map: asphaltTex,
      roughness: 0.42,
      metalness: 0.12
    });

    const sidewalkTex = this.createSidewalkTexture();
    const sidewalkMat = new THREE.MeshStandardMaterial({
      map: sidewalkTex,
      roughness: 0.75,
      metalness: 0.1
    });

    const concretePanelTex = this.createConcretePanelTexture();
    const concreteWallMat = new THREE.MeshStandardMaterial({
      map: concretePanelTex,
      roughness: 0.82,
      metalness: 0.15
    });

    const curbMat = new THREE.MeshStandardMaterial({
      color: 0x222a36,
      roughness: 0.65,
      metalness: 0.15
    });

    const facadeTex = this.createSkyscraperFacadeTexture();
    const skyscraperMat = new THREE.MeshStandardMaterial({
      map: facadeTex,
      roughness: 0.25,
      metalness: 0.75
    });

    const paintedMetalBlack = new THREE.MeshStandardMaterial({
      color: 0x10141a,
      roughness: 0.45,
      metalness: 0.8
    });

    const vehiclePaintMat = new THREE.MeshStandardMaterial({
      color: 0x182432,
      roughness: 0.35,
      metalness: 0.85
    });

    const glassTintMat = new THREE.MeshPhysicalMaterial({
      color: 0x446688,
      transparent: true,
      opacity: 0.5,
      roughness: 0.1,
      metalness: 0.2,
      transmission: 0.7
    });

    const hazardMat = new THREE.MeshStandardMaterial({
      map: this.createHazardTexture(),
      roughness: 0.5,
      metalness: 0.2
    });

    const crateMat = new THREE.MeshStandardMaterial({
      map: this.createMilitaryCrateTexture(),
      roughness: 0.6,
      metalness: 0.35
    });

    const fuelBarrelMat = new THREE.MeshStandardMaterial({
      map: this.createBarrelTexture('#1e3a5f', 'FLAMMABLE'),
      roughness: 0.45,
      metalness: 0.75
    });

    const chemBarrelMat = new THREE.MeshStandardMaterial({
      map: this.createBarrelTexture('#7c2d12', 'BIO-HAZARD'),
      roughness: 0.45,
      metalness: 0.75
    });

    const containerNavyTex = this.createShippingContainerTexture('#162a45', '#00f0ff', 'SC-8094-N', 'SHADOW CORPS');
    const containerNavyMat = new THREE.MeshStandardMaterial({ map: containerNavyTex, roughness: 0.5, metalness: 0.65 });

    const containerOrangeTex = this.createShippingContainerTexture('#9a3412', '#ffedd5', 'CY-4410-O', 'CYBERDYNE LOGISTICS');
    const containerOrangeMat = new THREE.MeshStandardMaterial({ map: containerOrangeTex, roughness: 0.5, metalness: 0.65 });

    const containerOliveTex = this.createShippingContainerTexture('#283618', '#fef08a', 'AD-1029-G', 'AERODYNE DEFENSE');
    const containerOliveMat = new THREE.MeshStandardMaterial({ map: containerOliveTex, roughness: 0.5, metalness: 0.65 });

    // 1. MAIN ROADWAY (Central 4-lane city avenue)
    const roadW = 28;
    const roadL = 160;
    const roadGeo = new THREE.PlaneGeometry(roadW, roadL);
    const roadMesh = new THREE.Mesh(roadGeo, asphaltMat);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.position.set(0, 0, -45);
    roadMesh.receiveShadow = true;
    scene.add(roadMesh);

    // 2. RAISED SIDEWALKS (West and East)
    const sidewalkW = 10;
    const sidewalkH = 0.18;

    // West Sidewalk
    const westWalkGeo = new THREE.BoxGeometry(sidewalkW, sidewalkH, roadL);
    const westWalk = new THREE.Mesh(westWalkGeo, sidewalkMat);
    westWalk.position.set(-roadW / 2 - sidewalkW / 2, sidewalkH / 2, -45);
    westWalk.receiveShadow = true;
    scene.add(westWalk);

    // West Curb
    const curbGeo = new THREE.BoxGeometry(0.35, sidewalkH + 0.02, roadL);
    const westCurb = new THREE.Mesh(curbGeo, curbMat);
    westCurb.position.set(-roadW / 2 + 0.15, sidewalkH / 2, -45);
    westCurb.receiveShadow = true;
    scene.add(westCurb);

    // East Sidewalk
    const eastWalk = new THREE.Mesh(westWalkGeo, sidewalkMat);
    eastWalk.position.set(roadW / 2 + sidewalkW / 2, sidewalkH / 2, -45);
    eastWalk.receiveShadow = true;
    scene.add(eastWalk);

    const eastCurb = new THREE.Mesh(curbGeo, curbMat);
    eastCurb.position.set(roadW / 2 - 0.15, sidewalkH / 2, -45);
    eastCurb.receiveShadow = true;
    scene.add(eastCurb);

    // 3. ARCHITECTURAL SKYSCRAPERS (With Ground-Floor Storefronts, Setbacks, Ledges, and Antennas)
    const towerConfigs = [
      // West Side Towers
      { x: -36, z: 10, w: 22, d: 28, h: 38, brand: 'NEXUS CYBERNETICS', neon: '#00f0ff' },
      { x: -36, z: -22, w: 22, d: 30, h: 50, brand: 'QUANTUM BIOTECH', neon: '#10b981' },
      { x: -36, z: -55, w: 22, d: 32, h: 44, brand: 'AERODYNE AVIONICS', neon: '#f59e0b' },
      { x: -36, z: -90, w: 22, d: 34, h: 56, brand: 'CYBERDYNE MIL-SPEC', neon: '#ef4444' },
      // East Side Towers
      { x: 36, z: 10, w: 22, d: 28, h: 46, brand: 'HELIOS CORP', neon: '#f59e0b' },
      { x: 36, z: -22, w: 22, d: 30, h: 40, brand: 'TITAN DEFENSE', neon: '#00f0ff' },
      { x: 36, z: -55, w: 22, d: 32, h: 52, brand: 'SYNTHESIS LABS', neon: '#8b5cf6' },
      { x: 36, z: -90, w: 22, d: 34, h: 42, brand: 'SPECTRE NETWORK', neon: '#06b6d4' }
    ];

    towerConfigs.forEach(t => {
      // Main tower body
      const geo = new THREE.BoxGeometry(t.w, t.h, t.d);
      const mesh = new THREE.Mesh(geo, skyscraperMat);
      mesh.position.set(t.x, t.h / 2, t.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      collision.addMeshCollider(mesh, 'skyscraper');

      // Mid-level architectural setback ledge (breaks the plain monolithic box shape)
      const ledgeH = 0.8;
      const ledgeGeo = new THREE.BoxGeometry(t.w + 1.2, ledgeH, t.d + 1.2);
      const ledgeMesh = new THREE.Mesh(ledgeGeo, concreteWallMat);
      ledgeMesh.position.set(t.x, t.h * 0.45, t.z);
      scene.add(ledgeMesh);

      // Ground-Floor Storefront with illuminated Brand Sign
      const storeTex = this.createStorefrontTexture(t.brand, t.neon);
      const storeMat = new THREE.MeshStandardMaterial({
        map: storeTex,
        roughness: 0.25,
        metalness: 0.8
      });
      const storeGeo = new THREE.PlaneGeometry(16, 4.8);
      const storeMesh = new THREE.Mesh(storeGeo, storeMat);
      const facingSign = t.x < 0 ? 1 : -1;
      storeMesh.rotation.y = facingSign * (Math.PI / 2);
      storeMesh.position.set(t.x + facingSign * (t.w / 2 + 0.05), 2.5, t.z);
      scene.add(storeMesh);

      // Entrance Canopy overhang extending over sidewalk
      const canopy = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.25, 6.0), paintedMetalBlack);
      canopy.position.set(t.x + facingSign * (t.w / 2 + 1.75), 4.8, t.z);
      canopy.castShadow = true;
      scene.add(canopy);

      // Rooftop HVAC unit with detailed fan grill
      const hvacGeo = new THREE.BoxGeometry(4.5, 2.8, 6.5);
      const hvac = new THREE.Mesh(hvacGeo, concreteWallMat);
      hvac.position.set(t.x, t.h + 1.4, t.z);
      hvac.castShadow = true;
      scene.add(hvac);

      // Rooftop Communication Mast / Antenna Spire
      const mastGeo = new THREE.CylinderGeometry(0.08, 0.16, 9.0, 8);
      const mast = new THREE.Mesh(mastGeo, paintedMetalBlack);
      mast.position.set(t.x, t.h + 5.5, t.z);
      scene.add(mast);

      // Rooftop Red Beacon Light
      const beaconGeo = new THREE.SphereGeometry(0.3, 8, 8);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff1020 });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.set(t.x, t.h + 10.0, t.z);
      scene.add(beacon);
    });

    // 4. DISTANT SKYLINE SILHOUETTE
    const distantTowers = [
      { x: -18, z: -140, w: 26, d: 26, h: 75 },
      { x: 14, z: -145, w: 32, d: 30, h: 90 },
      { x: 48, z: -135, w: 24, d: 24, h: 65 },
      { x: -48, z: -138, w: 28, d: 28, h: 80 }
    ];
    distantTowers.forEach(dt => {
      const geo = new THREE.BoxGeometry(dt.w, dt.h, dt.d);
      const mesh = new THREE.Mesh(geo, skyscraperMat);
      mesh.position.set(dt.x, dt.h / 2, dt.z);
      scene.add(mesh);
    });

    // North & South Perimeter Concrete Walls with Panel Seams & Formwork Holes
    const northBarrier = new THREE.Mesh(new THREE.BoxGeometry(100, 8, 4), concreteWallMat);
    northBarrier.position.set(0, 4, -112);
    northBarrier.castShadow = true;
    northBarrier.receiveShadow = true;
    scene.add(northBarrier);
    collision.addMeshCollider(northBarrier, 'boundary');

    const southBarrier = new THREE.Mesh(new THREE.BoxGeometry(100, 8, 4), concreteWallMat);
    southBarrier.position.set(0, 4, 28);
    southBarrier.castShadow = true;
    southBarrier.receiveShadow = true;
    scene.add(southBarrier);
    collision.addMeshCollider(southBarrier, 'boundary');

    // 5. MODERN STREET LAMPS (Curved poles with LED heads)
    const lampPositions = [
      { x: -13.2, z: 12 },
      { x: 13.2, z: 6 },
      { x: -13.2, z: -14 },
      { x: 13.2, z: -20 },
      { x: -13.2, z: -40 },
      { x: 13.2, z: -46 },
      { x: -13.2, z: -70 },
      { x: 13.2, z: -76 }
    ];

    lampPositions.forEach((lp, idx) => {
      const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 7.5, 10);
      const pole = new THREE.Mesh(poleGeo, paintedMetalBlack);
      pole.position.set(lp.x, 3.75, lp.z);
      pole.castShadow = true;
      scene.add(pole);
      collision.addMeshCollider(pole, 'street_lamp');

      const armGeo = new THREE.BoxGeometry(1.4, 0.12, 0.2);
      const arm = new THREE.Mesh(armGeo, paintedMetalBlack);
      const armDir = lp.x < 0 ? 1 : -1;
      arm.position.set(lp.x + armDir * 0.7, 7.4, lp.z);
      scene.add(arm);

      const lampHead = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.15, 0.4),
        new THREE.MeshStandardMaterial({ color: 0xdddddd, emissive: 0xffeedd, emissiveIntensity: 0.15 })
      );
      lampHead.position.set(lp.x + armDir * 1.3, 7.3, lp.z);
      scene.add(lampHead);

      const streetLight = new THREE.PointLight(0xffeedd, 0.4, 14, 1.8);
      streetLight.position.set(lp.x + armDir * 1.3, 7.0, lp.z);
      scene.add(streetLight);
      if (idx % 2 === 0) {
        animatedLights.push({ light: streetLight, baseIntensity: 0.4, speed: 1.0 });
      }
    });

    // 6. URBAN COVER: TACTICAL VEHICLES (Abandoned Patrol SUVs)
    const spawnTacticalVehicle = (x: number, z: number, rotY: number) => {
      const vGroup = new THREE.Group();
      vGroup.position.set(x, 0, z);
      vGroup.rotation.y = rotY;

      // Chassis Body
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 5.0), vehiclePaintMat);
      body.position.set(0, 0.9, 0);
      body.castShadow = true;
      body.receiveShadow = true;
      vGroup.add(body);

      // Cabin & Windows
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.9, 2.8), glassTintMat);
      cabin.position.set(0, 1.9, -0.2);
      cabin.castShadow = true;
      vGroup.add(cabin);

      // Roof Cover
      const roof = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 2.9), vehiclePaintMat);
      roof.position.set(0, 2.38, -0.2);
      vGroup.add(roof);

      // Wheels
      const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.32, 12);
      wheelGeo.rotateZ(Math.PI / 2);
      const wheelOffsets = [
        [-1.15, 0.42, 1.6],
        [1.15, 0.42, 1.6],
        [-1.15, 0.42, -1.6],
        [1.15, 0.42, -1.6]
      ];
      wheelOffsets.forEach(wo => {
        const wheel = new THREE.Mesh(wheelGeo, paintedMetalBlack);
        wheel.position.set(wo[0], wo[1], wo[2]);
        wheel.castShadow = true;
        vGroup.add(wheel);
      });

      // Headlights
      const hlGeo = new THREE.BoxGeometry(0.35, 0.15, 0.08);
      const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const hlL = new THREE.Mesh(hlGeo, hlMat);
      hlL.position.set(-0.8, 1.0, -2.52);
      const hlR = new THREE.Mesh(hlGeo, hlMat);
      hlR.position.set(0.8, 1.0, -2.52);
      vGroup.add(hlL);
      vGroup.add(hlR);

      scene.add(vGroup);
      collision.addMeshCollider(body, 'vehicle');
    };

    spawnTacticalVehicle(-5, 4, 0.35);
    spawnTacticalVehicle(6, -8, -0.25);
    spawnTacticalVehicle(-4, -28, 0.15);
    spawnTacticalVehicle(7, -42, -0.4);

    // 7. INDUSTRIAL SHIPPING CONTAINERS (Varied tactical heights, colors, and angles)
    const spawnContainer = (
      x: number,
      z: number,
      rotY: number,
      material: THREE.Material,
      heightOffset = 0
    ) => {
      const cGeo = new THREE.BoxGeometry(2.6, 2.8, 6.4);
      const cMesh = new THREE.Mesh(cGeo, material);
      cMesh.position.set(x, 1.4 + heightOffset, z);
      cMesh.rotation.y = rotY;
      cMesh.castShadow = true;
      cMesh.receiveShadow = true;
      scene.add(cMesh);
      collision.addMeshCollider(cMesh, 'shipping_container');
    };

    // Checkpoint 1 Container Blockade (Angled tactical chokepoint)
    spawnContainer(-11.5, -2, 0.18, containerNavyMat);
    spawnContainer(11.0, -12, -0.22, containerOrangeMat);
    spawnContainer(11.0, -12, -0.22, containerNavyMat, 2.85); // Stacked 2-high!

    // Mid-Street Freight Chokepoint
    spawnContainer(-10.5, -36, 0.35, containerOliveMat);
    spawnContainer(11.5, -38, -0.15, containerNavyMat);

    // Facility Approach Containers
    spawnContainer(-9.0, -56, 0.1, containerOrangeMat);

    // 8. MILITARY SUPPLY CRATE CLUSTERS (Tactical crouch cover)
    const spawnCrateCluster = (x: number, z: number, rotY = 0) => {
      const c1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.1, 1.2), crateMat);
      c1.position.set(x, 0.55, z);
      c1.rotation.y = rotY;
      c1.castShadow = true;
      c1.receiveShadow = true;
      scene.add(c1);
      collision.addMeshCollider(c1, 'military_crate');

      const c2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.1, 1.2), crateMat);
      c2.position.set(x + 1.25, 0.55, z + 0.1);
      c2.rotation.y = rotY + 0.15;
      c2.castShadow = true;
      c2.receiveShadow = true;
      scene.add(c2);
      collision.addMeshCollider(c2, 'military_crate');

      // Top crate
      const c3 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.0, 1.1), crateMat);
      c3.position.set(x + 0.6, 1.6, z + 0.05);
      c3.rotation.y = rotY - 0.2;
      c3.castShadow = true;
      c3.receiveShadow = true;
      scene.add(c3);
      collision.addMeshCollider(c3, 'military_crate');
    };

    spawnCrateCluster(-7.5, 8, 0.2);
    spawnCrateCluster(8.5, -3, -0.1);
    spawnCrateCluster(-2.5, -22, 0.3);
    spawnCrateCluster(8.0, -32, -0.25);
    spawnCrateCluster(3.5, -50, 0.15);

    // 9. INDUSTRIAL FUEL & CHEMICAL BARRELS (Cluster of 3 ribbed drums)
    const spawnBarrelCluster = (x: number, z: number, mat: THREE.Material) => {
      const bGeo = new THREE.CylinderGeometry(0.38, 0.38, 1.1, 14);
      const offsets = [
        [0, 0],
        [0.72, 0.15],
        [0.35, 0.65]
      ];
      offsets.forEach(([ox, oz]) => {
        const barrel = new THREE.Mesh(bGeo, mat);
        barrel.position.set(x + ox, 0.55, z + oz);
        barrel.castShadow = true;
        barrel.receiveShadow = true;
        scene.add(barrel);
        collision.addMeshCollider(barrel, 'barrel');
      });
    };

    spawnBarrelCluster(-8.5, -12, fuelBarrelMat);
    spawnBarrelCluster(7.5, -19, chemBarrelMat);
    spawnBarrelCluster(-3.0, -38, fuelBarrelMat);
    spawnBarrelCluster(6.5, -60, chemBarrelMat);

    // 10. CONCRETE JERSEY HIGHWAY BARRIERS
    const spawnJerseyBarrier = (x: number, z: number, rotY = 0) => {
      const geo = new THREE.BoxGeometry(3.6, 1.1, 0.7);
      const mesh = new THREE.Mesh(geo, hazardMat);
      mesh.position.set(x, 0.55, z);
      mesh.rotation.y = rotY;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      collision.addMeshCollider(mesh, 'jersey_barrier');
    };

    spawnJerseyBarrier(-2, -3, 0.05);
    spawnJerseyBarrier(3, -15, -0.15);
    spawnJerseyBarrier(-7, -19, 0.2);
    spawnJerseyBarrier(2, -34, 0.1);
    spawnJerseyBarrier(-8, -48, -0.2);

    // 11. TRANSIT BUS STOP SHELTER
    const spawnBusStop = (x: number, z: number) => {
      const bg = new THREE.Group();
      bg.position.set(x, 0.18, z);

      const backWall = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.6, 0.1), glassTintMat);
      backWall.position.set(0, 1.3, -1.2);
      bg.add(backWall);

      const sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.6, 2.4), glassTintMat);
      sideWall.position.set(-2.2, 1.3, 0);
      bg.add(sideWall);

      const roof = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.15, 2.8), paintedMetalBlack);
      roof.position.set(0, 2.65, 0);
      bg.add(roof);

      const bench = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.45, 0.5), paintedMetalBlack);
      bench.position.set(0, 0.25, -0.8);
      bg.add(bench);

      const adPanel = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 1.8, 1.0),
        new THREE.MeshStandardMaterial({
          color: 0x00f0ff,
          emissive: 0x00f0ff,
          emissiveIntensity: 1.2
        })
      );
      adPanel.position.set(2.2, 1.1, 0);
      bg.add(adPanel);

      scene.add(bg);
      collision.addMeshCollider(backWall, 'bus_stop');
    };

    spawnBusStop(-13.5, -24);
    spawnBusStop(13.5, -52);

    // 12. CORPORATE CONTROL FACILITY INTERIOR (Z: -58 to -78, X: -28 to -8)
    const buildW = 20;
    const buildD = 20;
    const buildH = 6.5;
    const buildX = -18;
    const buildZ = -68;

    // Polished Dark Granite Server Room Floor
    const floorGeo = new THREE.BoxGeometry(buildW - 1, 0.2, buildD - 1);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0a0e14,
      roughness: 0.22,
      metalness: 0.5
    });
    const sFloor = new THREE.Mesh(floorGeo, floorMat);
    sFloor.position.set(buildX, 0.1, buildZ);
    sFloor.receiveShadow = true;
    scene.add(sFloor);

    // Roof with Concrete Panels
    const roof = new THREE.Mesh(new THREE.BoxGeometry(buildW, 0.6, buildD), concreteWallMat);
    roof.position.set(buildX, buildH, buildZ);
    roof.castShadow = true;
    scene.add(roof);

    // South Entrance Wall with Doorway
    const sWallL = new THREE.Mesh(new THREE.BoxGeometry(7, buildH, 0.8), concreteWallMat);
    sWallL.position.set(buildX - 6.5, buildH / 2, buildZ + buildD / 2);
    sWallL.castShadow = true;
    scene.add(sWallL);
    collision.addMeshCollider(sWallL, 'facility_wall');

    const sWallR = new THREE.Mesh(new THREE.BoxGeometry(7, buildH, 0.8), concreteWallMat);
    sWallR.position.set(buildX + 6.5, buildH / 2, buildZ + buildD / 2);
    sWallR.castShadow = true;
    scene.add(sWallR);
    collision.addMeshCollider(sWallR, 'facility_wall');

    // Door Header with Hazard Chevron
    const dHeader = new THREE.Mesh(new THREE.BoxGeometry(6, 1.8, 0.8), hazardMat);
    dHeader.position.set(buildX, buildH - 0.9, buildZ + buildD / 2);
    scene.add(dHeader);

    // North Wall
    const nWall = new THREE.Mesh(new THREE.BoxGeometry(buildW, buildH, 0.8), concreteWallMat);
    nWall.position.set(buildX, buildH / 2, buildZ - buildD / 2);
    nWall.castShadow = true;
    scene.add(nWall);
    collision.addMeshCollider(nWall, 'facility_wall');

    // West Wall
    const wWall = new THREE.Mesh(new THREE.BoxGeometry(0.8, buildH, buildD), concreteWallMat);
    wWall.position.set(buildX - buildW / 2, buildH / 2, buildZ);
    wWall.castShadow = true;
    scene.add(wWall);
    collision.addMeshCollider(wWall, 'facility_wall');

    // East Wall with East Exit
    const eWall1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, buildH, 7), concreteWallMat);
    eWall1.position.set(buildX + buildW / 2, buildH / 2, buildZ - 6.5);
    eWall1.castShadow = true;
    scene.add(eWall1);
    collision.addMeshCollider(eWall1, 'facility_wall');

    const eWall2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, buildH, 7), concreteWallMat);
    eWall2.position.set(buildX + buildW / 2, buildH / 2, buildZ + 6.5);
    eWall2.castShadow = true;
    scene.add(eWall2);
    collision.addMeshCollider(eWall2, 'facility_wall');

    // High-Tech Blade Server Racks
    for (let i = -1; i <= 1; i++) {
      const rackGeo = new THREE.BoxGeometry(1.6, 4.2, 3.4);
      const rackMat = new THREE.MeshStandardMaterial({
        color: 0x090d14,
        roughness: 0.35,
        metalness: 0.88
      });
      const rack = new THREE.Mesh(rackGeo, rackMat);
      rack.position.set(buildX - 4.5, 2.1, buildZ + i * 4.6);
      rack.castShadow = true;
      scene.add(rack);
      collision.addMeshCollider(rack, 'server_rack');

      // Cyan Server LED Bars
      const ledBar = new THREE.Mesh(
        new THREE.PlaneGeometry(0.12, 3.2),
        new THREE.MeshBasicMaterial({ color: 0x00f0ff })
      );
      ledBar.position.set(buildX - 3.68, 2.1, buildZ + i * 4.6);
      ledBar.rotation.y = Math.PI / 2;
      scene.add(ledBar);
    }

    // --- PRIMARY DATA TERMINAL CONSOLE (Objective 3 Target) ---
    const terminalPos = new THREE.Vector3(buildX + 3.5, 0, buildZ);
    const consolePedestal = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 1.35, 1.3),
      new THREE.MeshStandardMaterial({ color: 0x141a24, roughness: 0.3, metalness: 0.9 })
    );
    consolePedestal.position.set(terminalPos.x, 0.675, terminalPos.z);
    consolePedestal.castShadow = true;
    scene.add(consolePedestal);
    collision.addMeshCollider(consolePedestal, 'terminal_pedestal');

    // Holographic Cyber Display
    const holoScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(2.0, 1.2),
      new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00f0ff,
        emissiveIntensity: 1.4,
        roughness: 0.1,
        metalness: 0.9,
        side: THREE.DoubleSide
      })
    );
    holoScreen.position.set(terminalPos.x, 1.6, terminalPos.z);
    holoScreen.rotation.y = -Math.PI / 2;
    scene.add(holoScreen);

    // Terminal Glow Light
    const terminalLight = new THREE.PointLight(0x00f0ff, 2.0, 9, 2);
    terminalLight.position.set(terminalPos.x - 0.4, 1.8, terminalPos.z);
    scene.add(terminalLight);
    animatedLights.push({ light: terminalLight, baseIntensity: 2.0, speed: 2.8 });

    // 13. EXTRACTION HELIPAD (Plaza at X: 22, Z: -85)
    const extractPos = new THREE.Vector3(22, 0.05, -85);

    // Asphalt Landing Pad
    const pad = new THREE.Mesh(
      new THREE.CircleGeometry(8.5, 36),
      new THREE.MeshStandardMaterial({ color: 0x141a22, roughness: 0.6, metalness: 0.25 })
    );
    pad.rotation.x = -Math.PI / 2;
    pad.position.copy(extractPos);
    pad.receiveShadow = true;
    scene.add(pad);

    // Yellow Helipad Safety Perimeter Ring
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(7.8, 8.4, 36),
      new THREE.MeshBasicMaterial({ color: 0xffb703, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(extractPos.x, 0.06, extractPos.z);
    scene.add(ring);

    // White "H" Landing Decal
    const hBarL = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 4.0), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
    hBarL.rotation.x = -Math.PI / 2;
    hBarL.position.set(extractPos.x - 1.2, 0.07, extractPos.z);
    scene.add(hBarL);

    const hBarR = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 4.0), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
    hBarR.rotation.x = -Math.PI / 2;
    hBarR.position.set(extractPos.x + 1.2, 0.07, extractPos.z);
    scene.add(hBarR);

    const hBarCross = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.8), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
    hBarCross.rotation.x = -Math.PI / 2;
    hBarCross.position.set(extractPos.x, 0.07, extractPos.z);
    scene.add(hBarCross);

    // Helipad Amber Strobe Beacons
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 2) {
      const bx = extractPos.x + Math.cos(a) * 8.0;
      const bz = extractPos.z + Math.sin(a) * 8.0;

      const beaconPost = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.18, 0.65, 8),
        new THREE.MeshStandardMaterial({ color: 0xffb703, emissive: 0xffb703, emissiveIntensity: 1.2 })
      );
      beaconPost.position.set(bx, 0.35, bz);
      scene.add(beaconPost);

      const bLight = new THREE.PointLight(0xffb703, 1.5, 12, 1.8);
      bLight.position.set(bx, 0.8, bz);
      scene.add(bLight);
      animatedLights.push({ light: bLight, baseIntensity: 1.5, speed: 4.2 });
    }

    return {
      terminalMesh: holoScreen,
      terminalPosition: terminalPos,
      extractionMesh: pad,
      extractionPosition: extractPos,
      interactiveMeshes: [holoScreen],
      animatedLights
    };
  }
}
