/**
 * LITHOSPHERE v7.0 - Diamond Material
 *
 * The king of gemstones: exceptional brilliance, fire, and adamantine luster.
 *
 * Key Properties:
 * - IOR: 2.42 (highest natural)
 * - Dispersion: 0.044 (strong fire/rainbow)
 * - Adamantine luster (diamond-like shine)
 * - Exceptional hardness affects light behavior
 *
 * Geological Formation:
 * - Forms 150-200km below Earth's surface
 * - Requires 725,000+ psi pressure
 * - Temperature: 900-1300°C
 * - Carbon atoms in tetrahedral crystal structure
 * - Brought to surface by kimberlite eruptions
 */

import {
  Color,
  Uniform,
  Vector3,
} from 'three';
import {
  uniform,
  float,
  vec3,
  color as tslColor,
  mix,
  sin,
  cos,
  time,
  normalWorld,
  positionWorld,
  cameraPosition,
  normalize,
  dot,
  pow,
  abs,
  smoothstep,
  fract,
  add,
  mul,
  sub,
  div,
  max,
  refract,
} from 'three/tsl';

import { BaseMaterial } from '../base';
import type { MaterialDefinition } from '../types';
import {
  createSpectralDispersion,
  createAnimatedSpectralFire,
} from '../effects/spectral';

// ============================================================================
// DIAMOND DEFINITION
// ============================================================================

export const DIAMOND_DEFINITION: MaterialDefinition = {
  id: 'diamond',
  name: 'Diamond',
  category: 'gemstone',
  tier: 'free',  // Core material, free for all
  description: 'Pure carbon crystal with exceptional brilliance and fire',
  icon: '💎',

  physical: {
    ior: 2.42,          // Highest natural IOR
    roughness: 0.0,     // Perfect polish
    metalness: 0.0,     // Non-metallic
    transmission: 0.95, // Highly transparent
    thickness: 0.5,
    clearcoat: 1.0,     // Diamond-like surface coating
    clearcoatRoughness: 0.0,
    sheen: 0.0,
    sheenRoughness: 0.0,
    anisotropy: 0.0,    // Isotropic (no directional preference)
  },

  optical: {
    color: '#ffffff',          // Colorless (ideal)
    emissive: '#ffffff',
    emissiveIntensity: 0.05,   // Subtle internal glow
    dispersion: 0.044,         // Strong fire
    subsurfaceColor: '#e0e8ff',
    subsurfaceIntensity: 0.1,
    iridescence: 0.0,
    iridescenceIOR: 1.3,
    envMapIntensity: 2.0,      // Strong reflections
  },

  effects: [
    {
      type: 'spectralDispersion',
      intensity: 1.0,
      params: {
        dispersionStrength: 0.05,
        rainbowIntensity: 0.8,
        scintillation: true,
      },
    },
  ],

  audioMappings: [
    {
      band: 'brilliance',
      target: 'dispersion',
      multiplier: 0.5,
      smoothing: 0.8,
    },
    {
      band: 'bass',
      target: 'emissive',
      multiplier: 0.3,
      smoothing: 0.9,
    },
    {
      band: 'presence',
      target: 'scale',
      multiplier: 0.1,
      smoothing: 0.95,
    },
  ],

  geologicalStory: {
    title: 'Birth of a Diamond',
    description: 'Forged in the furnace of Earth\'s mantle, where immense pressure transforms humble carbon into the hardest natural substance.',
    timeScale: '1-3 billion years',
    conditions: '150-200km depth, 725,000+ psi, 900-1300°C',
    keyframes: [
      {
        time: 0.0,
        label: 'Carbon Atoms',
        properties: {
          transmission: 0.0,
          emissiveIntensity: 0.0,
          roughness: 1.0,
        },
        cameraPosition: { x: 0, y: 0, z: 5 },
      },
      {
        time: 0.3,
        label: 'Compression Begins',
        properties: {
          transmission: 0.2,
          emissiveIntensity: 0.1,
          roughness: 0.7,
        },
        cameraPosition: { x: 2, y: 1, z: 4 },
      },
      {
        time: 0.6,
        label: 'Crystal Formation',
        properties: {
          transmission: 0.7,
          emissiveIntensity: 0.3,
          roughness: 0.3,
          ior: 2.0,
        },
        cameraPosition: { x: 1, y: 2, z: 3 },
      },
      {
        time: 0.8,
        label: 'Kimberlite Eruption',
        properties: {
          transmission: 0.85,
          emissiveIntensity: 0.5,
          roughness: 0.1,
          ior: 2.3,
        },
        cameraPosition: { x: 0, y: 3, z: 2 },
      },
      {
        time: 1.0,
        label: 'Brilliant Cut',
        properties: {
          transmission: 0.95,
          emissiveIntensity: 0.05,
          roughness: 0.0,
          ior: 2.42,
        },
        cameraPosition: { x: 0, y: 0, z: 2.5 },
      },
    ],
  },

  personality: {
    trait: 'Radiant',
    mood: 'Triumphant',
    highEnergyResponse: 'amplify',
    calmResponse: 'shimmer',
    conatus: 'Diamond embodies the will to perfect clarity - carbon\'s striving toward its most ordered, luminous form through eons of pressure.',
  },
};

// ============================================================================
// DIAMOND MATERIAL CLASS
// ============================================================================

export class DiamondMaterial extends BaseMaterial {
  private uDispersion: Uniform<number>;
  private uScintillation: Uniform<number>;
  private uFireIntensity: Uniform<number>;

  constructor(definition: MaterialDefinition = DIAMOND_DEFINITION) {
    super(definition);

    // Initialize uniforms
    this.uDispersion = new Uniform(0.05);
    this.uScintillation = new Uniform(0.0);
    this.uFireIntensity = new Uniform(1.0);

    this.uniforms.set('uDispersion', this.uDispersion);
    this.uniforms.set('uScintillation', this.uScintillation);
    this.uniforms.set('uFireIntensity', this.uFireIntensity);
  }

  protected applyEffects(): void {
    // Apply spectral dispersion (rainbow fire)
    this.applySpectralDispersion();

    // Apply adamantine luster
    this.applyAdamantineLuster();

    // Apply scintillation (sparkle)
    this.applyScintillation();
  }

  private applySpectralDispersion(): void {
    const viewDir = normalize(sub(cameraPosition, positionWorld));
    const N = normalWorld;

    // Create dispersion node
    const dispersion = createSpectralDispersion(
      this.definition.optical.dispersion,
      this.definition.physical.ior
    );

    // Fresnel factor for edge fire
    const fresnel = pow(
      sub(float(1.0), abs(dot(N, viewDir))),
      float(3.0)
    );

    // Combine with fresnel for realistic fire placement
    const fire = mul(dispersion, mul(fresnel, float(0.5)));

    // Apply to emissive for glowing fire effect
    if (this.material.emissiveNode) {
      this.material.emissiveNode = add(
        this.material.emissiveNode,
        fire
      );
    } else {
      this.material.emissiveNode = fire;
    }
  }

  private applyAdamantineLuster(): void {
    const viewDir = normalize(sub(cameraPosition, positionWorld));
    const N = normalWorld;

    // Adamantine luster: extremely bright, mirror-like reflections
    // Higher than vitreous (glass) or resinous luster
    const NdotV = abs(dot(N, viewDir));

    // Sharp specular highlight
    const specular = pow(NdotV, float(64.0));

    // Bright edge reflection (characteristic of high IOR)
    const edgeReflection = pow(sub(float(1.0), NdotV), float(5.0));

    // Total luster contribution
    const luster = add(
      mul(specular, float(0.5)),
      mul(edgeReflection, float(0.3))
    );

    // Apply to material
    // Note: TSL doesn't have direct specular control, use emissive for brightness
    if (this.material.emissiveNode) {
      this.material.emissiveNode = add(
        this.material.emissiveNode,
        mul(vec3(1, 1, 1), luster)
      );
    }
  }

  private applyScintillation(): void {
    // Scintillation: sparkling effect when diamond or light moves
    const t = time;

    // Multiple sparkle points based on position
    const sparkle1 = pow(
      max(float(0), sin(add(mul(positionWorld.x, float(50.0)), t))),
      float(20.0)
    );
    const sparkle2 = pow(
      max(float(0), sin(add(mul(positionWorld.y, float(47.0)), mul(t, float(1.1))))),
      float(20.0)
    );
    const sparkle3 = pow(
      max(float(0), sin(add(mul(positionWorld.z, float(53.0)), mul(t, float(0.9))))),
      float(20.0)
    );

    // Combine sparkles
    const totalSparkle = mul(
      add(add(sparkle1, sparkle2), sparkle3),
      float(0.1)
    );

    // View-dependent visibility
    const viewDir = normalize(sub(cameraPosition, positionWorld));
    const viewFactor = pow(abs(dot(normalWorld, viewDir)), float(2.0));

    const scintillation = mul(totalSparkle, viewFactor);

    // Apply to emissive
    if (this.material.emissiveNode) {
      this.material.emissiveNode = add(
        this.material.emissiveNode,
        mul(vec3(1, 1, 1), scintillation)
      );
    }
  }

  protected updateEffects(deltaTime: number): void {
    // Update scintillation based on audio
    const audioEnergy = this.audioData.brilliance + this.audioData.presence;
    this.uScintillation.value = audioEnergy * 0.5;

    // Update fire intensity based on bass
    const bassEnergy = this.audioData.bass + this.audioData.subBass;
    this.uFireIntensity.value = 1.0 + bassEnergy * 0.3;

    // Beat detection triggers bright flash
    if (this.audioData.beat) {
      this.material.emissiveIntensity = 0.2;
      setTimeout(() => {
        this.material.emissiveIntensity = this.definition.optical.emissiveIntensity;
      }, 100);
    }
  }

  // ============================================================================
  // DIAMOND-SPECIFIC PRESETS
  // ============================================================================

  /**
   * Set diamond color grade (D-Z scale)
   */
  public setColorGrade(grade: 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'M' | 'Z'): void {
    const gradeColors: Record<string, string> = {
      'D': '#ffffff',  // Colorless
      'E': '#fefefe',
      'F': '#fdfdfd',
      'G': '#fcfcf8',  // Near colorless
      'H': '#fbfbf4',
      'I': '#fafaf0',
      'J': '#f9f9e8',
      'K': '#f8f8e0',  // Faint yellow
      'M': '#f5f5d0',
      'Z': '#f0f0b0',  // Light yellow
    };

    const color = gradeColors[grade] || gradeColors['D'];
    this.setOpticalProperty('color', color);
    this.material.color = new Color(color);
  }

  /**
   * Set cut quality (affects light performance)
   */
  public setCutQuality(quality: 'ideal' | 'excellent' | 'good' | 'fair'): void {
    const cutSettings = {
      'ideal': { roughness: 0.0, envMapIntensity: 2.5, emissiveIntensity: 0.05 },
      'excellent': { roughness: 0.02, envMapIntensity: 2.0, emissiveIntensity: 0.04 },
      'good': { roughness: 0.05, envMapIntensity: 1.5, emissiveIntensity: 0.03 },
      'fair': { roughness: 0.1, envMapIntensity: 1.0, emissiveIntensity: 0.02 },
    };

    const settings = cutSettings[quality];
    this.setPhysicalProperty('roughness', settings.roughness);
    this.setOpticalProperty('envMapIntensity', settings.envMapIntensity);
    this.setOpticalProperty('emissiveIntensity', settings.emissiveIntensity);
  }

  /**
   * Set fancy color (pink, blue, yellow, etc.)
   */
  public setFancyColor(
    fancy: 'pink' | 'blue' | 'yellow' | 'green' | 'orange' | 'red' | 'purple' | 'black'
  ): void {
    const fancyColors: Record<string, { color: string; emissive: string }> = {
      'pink': { color: '#ffb6c1', emissive: '#ff69b4' },
      'blue': { color: '#add8e6', emissive: '#4169e1' },
      'yellow': { color: '#fff8dc', emissive: '#ffd700' },
      'green': { color: '#98fb98', emissive: '#32cd32' },
      'orange': { color: '#ffa07a', emissive: '#ff8c00' },
      'red': { color: '#ffcccb', emissive: '#dc143c' },
      'purple': { color: '#dda0dd', emissive: '#9932cc' },
      'black': { color: '#2f2f2f', emissive: '#000000' },
    };

    const fancy_settings = fancyColors[fancy];
    this.setOpticalProperty('color', fancy_settings.color);
    this.setOpticalProperty('emissive', fancy_settings.emissive);
    this.material.color = new Color(fancy_settings.color);
    this.material.emissive = new Color(fancy_settings.emissive);

    // Black diamonds are opaque
    if (fancy === 'black') {
      this.setPhysicalProperty('transmission', 0.0);
    }
  }
}

export default DiamondMaterial;
