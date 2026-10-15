import * as THREE from 'three';
import type { GraphicsQuality } from '../../types/game';

export class PerformanceManager {
  private fps = 60;
  private frameCount = 0;
  private lastFpsUpdate = 0;

  constructor() {
    this.lastFpsUpdate = performance.now();
  }

  public getTargetPixelRatio(quality: GraphicsQuality, resolutionScale = 1.0): number {
    const dpr = window.devicePixelRatio || 1;
    let baseDpr = 1.0;
    switch (quality) {
      case 'low':
        baseDpr = Math.min(dpr, 1.0);
        break;
      case 'medium':
        baseDpr = Math.min(dpr, 1.25);
        break;
      case 'high':
        baseDpr = Math.min(dpr, 1.5);
        break;
    }
    return Math.max(0.65, Math.min(2.0, baseDpr * resolutionScale));
  }

  public configureRenderer(renderer: THREE.WebGLRenderer, quality: GraphicsQuality): void {
    if (quality === 'low') {
      renderer.shadowMap.enabled = false;
    } else {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = quality === 'high' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
    }
  }

  public recordFrame(): void {
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsUpdate >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
  }

  public getFPS(): number {
    return this.fps;
  }
}
