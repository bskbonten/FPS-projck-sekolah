import * as THREE from 'three';
import type { GraphicsQuality } from '../../types/game';

export class LightingSetup {
  public dirLight: THREE.DirectionalLight | null = null;
  public hemiLight: THREE.HemisphereLight | null = null;
  public pointLights: THREE.PointLight[] = [];

  public init(scene: THREE.Scene, quality: GraphicsQuality): void {
    // Set morning sky background color
    scene.background = new THREE.Color(0x9cc3e6);

    // 1. Hemisphere Light: Crisp morning blue sky to neutral street ground bounce
    this.hemiLight = new THREE.HemisphereLight(0xa5d0f5, 0x424f60, 0.95);
    scene.add(this.hemiLight);

    // 2. Main Directional Morning Sunlight
    // Low-angled morning sun casting warm golden directional light and long shadows
    this.dirLight = new THREE.DirectionalLight(0xfff0db, 2.3);
    this.dirLight.position.set(45, 42, 22);

    if (quality !== 'low') {
      this.dirLight.castShadow = true;
      this.dirLight.shadow.mapSize.width = quality === 'high' ? 2048 : 1024;
      this.dirLight.shadow.mapSize.height = quality === 'high' ? 2048 : 1024;
      this.dirLight.shadow.camera.near = 15;
      this.dirLight.shadow.camera.far = 160;
      const d = 60;
      this.dirLight.shadow.camera.left = -d;
      this.dirLight.shadow.camera.right = d;
      this.dirLight.shadow.camera.top = d;
      this.dirLight.shadow.camera.bottom = -d;
      this.dirLight.shadow.bias = -0.0003;
      this.dirLight.shadow.normalBias = 0.02;
    }
    scene.add(this.dirLight);

    // 3. Crisp Morning Atmospheric Horizon Mist
    scene.fog = new THREE.FogExp2(0xb2d2ee, 0.0085);
  }

  public addLocalLight(
    scene: THREE.Scene,
    pos: THREE.Vector3,
    color: number,
    intensity: number,
    distance: number
  ): THREE.PointLight {
    const light = new THREE.PointLight(color, intensity, distance, 1.8);
    light.position.copy(pos);
    scene.add(light);
    this.pointLights.push(light);
    return light;
  }

  public dispose(scene: THREE.Scene): void {
    if (this.hemiLight) scene.remove(this.hemiLight);
    if (this.dirLight) scene.remove(this.dirLight);
    this.pointLights.forEach(pl => scene.remove(pl));
    this.pointLights = [];
  }
}
