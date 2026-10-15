import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import type { GraphicsQuality } from '../../types/game';

// Custom Cinematic Film Grading & Vignette Shader
const CinematicShader = {
  name: 'CinematicVignetteShader',
  uniforms: {
    tDiffuse: { value: null },
    vignetteDarkness: { value: 0.65 },
    vignetteOffset: { value: 0.98 },
    contrast: { value: 1.04 },
    saturation: { value: 1.05 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float vignetteDarkness;
    uniform float vignetteOffset;
    uniform float contrast;
    uniform float saturation;
    varying vec2 vUv;

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);

      // Subtle Film Contrast curve
      vec3 rgb = color.rgb;
      rgb = (rgb - 0.5) * contrast + 0.5;

      // Slight desaturation for military realism
      float luma = dot(rgb, vec3(0.2126, 0.7152, 0.0722));
      rgb = mix(vec3(luma), rgb, saturation);

      // Smooth radial vignette
      vec2 uv = (vUv - 0.5) * 2.0;
      float dist = length(uv);
      float vig = smoothstep(vignetteOffset, vignetteOffset - 0.5, dist);
      rgb *= mix(1.0 - vignetteDarkness * 0.45, 1.0, vig);

      gl_FragColor = vec4(clamp(rgb, 0.0, 1.0), color.a);
    }
  `
};

export class PostProcessingManager {
  public composer: EffectComposer | null = null;
  private renderPass: RenderPass | null = null;
  private bloomPass: UnrealBloomPass | null = null;
  private cinematicPass: ShaderPass | null = null;
  private outputPass: OutputPass | null = null;
  private isEnabled = true;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    quality: GraphicsQuality
  ) {
    if (quality === 'low') {
      this.isEnabled = false;
      return;
    }

    try {
      const size = new THREE.Vector2();
      renderer.getSize(size);

      this.composer = new EffectComposer(renderer);

      // 1. Scene Render Pass
      this.renderPass = new RenderPass(scene, camera);
      this.composer.addPass(this.renderPass);

      // 2. Controlled Subtle Unreal Bloom Pass (Tuned for morning daylight)
      const bloomStrength = quality === 'high' ? 0.20 : 0.14;
      this.bloomPass = new UnrealBloomPass(
        new THREE.Vector2(size.x, size.y),
        bloomStrength,
        0.30,
        0.88
      );
      this.composer.addPass(this.bloomPass);

      // 3. Cinematic Vignette & Tone Pass
      this.cinematicPass = new ShaderPass(CinematicShader);
      this.composer.addPass(this.cinematicPass);

      // 4. Output Pass with sRGB Color Space mapping
      this.outputPass = new OutputPass();
      this.composer.addPass(this.outputPass);

      this.isEnabled = true;
    } catch (e) {
      console.warn('PostProcessing initialization failed, falling back to direct render:', e);
      this.isEnabled = false;
      this.composer = null;
    }
  }

  public setQuality(quality: GraphicsQuality): void {
    this.isEnabled = quality !== 'low' && this.composer !== null;
    if (this.bloomPass) {
      this.bloomPass.strength = quality === 'high' ? 0.32 : 0.22;
    }
  }

  public setSize(width: number, height: number): void {
    if (this.composer) {
      this.composer.setSize(width, height);
    }
    if (this.bloomPass) {
      this.bloomPass.resolution.set(width, height);
    }
  }

  public render(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera): void {
    if (this.isEnabled && this.composer) {
      this.composer.render();
    } else {
      renderer.render(scene, camera);
    }
  }

  public dispose(): void {
    if (this.composer) {
      this.composer.renderTarget1.dispose();
      this.composer.renderTarget2.dispose();
      this.composer = null;
    }
    this.renderPass = null;
    this.bloomPass = null;
    this.cinematicPass = null;
    this.outputPass = null;
  }
}
