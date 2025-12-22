/**
 * LITHOSPHERE v7.0 - Amber Material
 *
 * Fossilized tree resin: organic time capsule with warm golden glow.
 *
 * Key Properties:
 * - IOR: 1.539-1.545
 * - Resinous luster
 * - Strong subsurface scattering (warm glow)
 * - Can contain inclusions (insects, plants, air bubbles)
 *
 * Geological Formation:
 * - Starts as tree resin (sticky sap)
 * - Hardens over millions of years
 * - Polymerization transforms resin to amber
 * - Requires burial and pressure
 *
 * Varieties:
 * - Baltic amber (most common, honey-colored)
 * - Dominican amber (blue fluorescence)
 * - Burmese amber (diverse colors)
 * - Copal (younger, not fully fossilized)
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
  floor,
  add,
  mul,
  sub,
  div,
  max,
  min,
  exp,
} from 'three/tsl';

import { BaseMaterial } from '../base';
import type { MaterialDefinition } from '../types';
import {
  createSubsurfaceScattering,
  createAmberGlow,
  createAmberCaustics,
} from '../effects/subsurface';
import {
  createTrappedParticles,
  createBubbleInclusions,
} from '../effects/inclusions';

// ============================================================================
// AMBER DEFINITION
// ============================================================================

export const AMBER_DEFINITION: MaterialDefinition = {
  id: 'amber',
  name: 'Amber',
  category: 'organic',
  tier: 'free',  // Core material, free for all
  description: 'Fossilized tree resin with warm golden glow and trapped ancient life',
  icon: '🪨',

  physical: {
    ior: 1.54,           // Resin-like
    roughness: 0.15,     // Slightly waxy feel
    metalness: 0.0,      // Non-metallic
    transmission: 0.6,   // Semi-transparent
    thickness: 0.8,
    clearcoat: 0.3,
    clearcoatRoughness: 0.2,
    sheen: 0.2,          // Waxy sheen
    sheenRoughness: 0.5,
    anisotropy: 0.0,
  },

  optical: {
    color: '#ffbf00',          // Amber gold
    emissive: '#ff8c00',       // Warm orange glow
    emissiveIntensity: 0.08,
    dispersion: 0.01,          // Minimal dispersion
    subsurfaceColor: '#ff6600',
    subsurfaceIntensity: 0.4,  // Strong subsurface scattering
    iridescence: 0.0,
    iridescenceIOR: 1.3,
    envMapIntensity: 0.8,
  },

  effects: [
    {
      type: 'trappedParticles',
      intensity: 0.3,
      params: {
        density: 0.2,
        particleSize: 0.03,
        types: ['bubble', 'organic'],
      },
    },
  ],

  audioMappings: [
    {
      band: 'lowMid',
      target: 'emissive',
      multiplier: 0.5,
      smoothing: 0.9,
    },
    {
      band: 'mid',
      target: 'effectIntensity',
      multiplier: 0.3,
      smoothing: 0.85,
    },
    {
      band: 'bass',
      target: 'scale',
      multiplier: 0.05,
      smoothing: 0.95,
    },
  ],

  geologicalStory: {
    title: 'Liquid Gold of Ages',
    description: 'Amber begins as sticky resin weeping from ancient trees - a protective response to injury. Over millions of years, it transforms into golden stone, perfectly preserving whatever it captured.',
    timeScale: '2-50 million years',
    conditions: 'Forest floor burial, 15-30°C, gradual polymerization',
    keyframes: [
      {
        time: 0.0,
        label: 'Fresh Resin',
        properties: {
          color: '#ffe4b5',
          emissive: '#ffd700',
          emissiveIntensity: 0.0,
          transmission: 0.7,
          roughness: 0.8,
          ior: 1.48,
        },
        cameraPosition: { x: 0, y: 0, z: 4 },
      },
      {
        time: 0.2,
        label: 'Dripping',
        properties: {
          color: '#ffc64d',
          emissive: '#ffb300',
          emissiveIntensity: 0.02,
          transmission: 0.65,
          roughness: 0.6,
        },
        cameraPosition: { x: 1, y: 1, z: 3 },
      },
      {
        time: 0.4,
        label: 'Trapping Life',
        properties: {
          color: '#ffaa00',
          emissive: '#ff9900',
          emissiveIntensity: 0.04,
          transmission: 0.55,
          roughness: 0.4,
        },
        cameraPosition: { x: 2, y: 0, z: 3 },
      },
      {
        time: 0.6,
        label: 'Hardening',
        properties: {
          color: '#ff9900',
          emissive: '#ff8c00',
          emissiveIntensity: 0.06,
          transmission: 0.5,
          roughness: 0.25,
        },
        cameraPosition: { x: 1, y: -1, z: 2.5 },
      },
      {
        time: 0.8,
        label: 'Copal Stage',
        properties: {
          color: '#ffa500',
          emissive: '#ff7700',
          emissiveIntensity: 0.07,
          transmission: 0.55,
          roughness: 0.2,
        },
        cameraPosition: { x: 0, y: 1, z: 2 },
      },
      {
        time: 1.0,
        label: 'True Amber',
        properties: {
          color: '#ffbf00',
          emissive: '#ff8c00',
          emissiveIntensity: 0.08,
          transmission: 0.6,
          roughness: 0.15,
          ior: 1.54,
        },
        cameraPosition: { x: 0, y: 0, z: 2.5 },
      },
    ],
  },

  personality: {
    trait: 'Nostalgic',
    mood: 'Contemplative',
    highEnergyResponse: 'absorb',
    calmResponse: 'glow',
    conatus: 'Amber is memory made solid - the tree\'s vital essence frozen in golden light, holding fragments of worlds long vanished.',
  },
};

// ============================================================================
// AMBER MATERIAL CLASS
// ============================================================================

export class AmberMaterial extends BaseMaterial {
  private uSSSIntensity: Uniform<number>;
  private uInclusionDensity: Uniform<number>;
  private uWarmth: Uniform<number>;
  private uAge: Uniform<number>;

  constructor(definition: MaterialDefinition = AMBER_DEFINITION) {
    super(definition);

    // Initialize uniforms
    this.uSSSIntensity = new Uniform(0.4);
    this.uInclusionDensity = new Uniform(0.2);
    this.uWarmth = new Uniform(1.0);
    this.uAge = new Uniform(1.0);

    this.uniforms.set('uSSSIntensity', this.uSSSIntensity);
    this.uniforms.set('uInclusionDensity', this.uInclusionDensity);
    this.uniforms.set('uWarmth', this.uWarmth);
    this.uniforms.set('uAge', this.uAge);
  }

  protected applyEffects(): void {
    // Apply warm subsurface scattering
    this.applySubsurfaceScattering();

    // Apply trapped inclusions
    this.applyTrappedInclusions();

    // Apply internal caustics
    this.applyInternalCaustics();

    // Apply warm glow effect
    this.applyWarmGlow();
  }

  private applySubsurfaceScattering(): void {
    // Amber has strong SSS - light penetrates and scatters inside
    const sss = createSubsurfaceScattering(
      this.definition.optical.subsurfaceColor,
      this.definition.optical.subsurfaceIntensity,
      2.0
    );

    // Enhanced SSS with amber-specific warmth
    const amberGlow = createAmberGlow(1.0);

    // Combine for rich amber translucency
    const combinedSSS = add(
      mul(sss, float(0.6)),
      mul(amberGlow, float(0.4))
    );

    if (this.material.emissiveNode) {
      this.material.emissiveNode = add(
        this.material.emissiveNode,
        combinedSSS
      );
    } else {
      this.material.emissiveNode = combinedSSS;
    }
  }

  private applyTrappedInclusions(): void {
    // Amber often contains trapped ancient life or bubbles
    const particles = createTrappedParticles(0.2, 0.03, '#2d1f14');
    const bubbles = createBubbleInclusions(0.15, 0.02);

    // Combine inclusions
    const inclusions = add(
      mul(particles, float(0.7)),
      mul(bubbles, float(0.3))
    );

    // Inclusions are visible through the amber
    if (this.material.emissiveNode) {
      this.material.emissiveNode = add(
        this.material.emissiveNode,
        mul(inclusions, float(0.2))
      );
    }
  }

  private applyInternalCaustics(): void {
    // Light creates swimming caustics inside amber
    const caustics = createAmberCaustics(0.3, 3.0);

    // Subtle caustic effect
    if (this.material.emissiveNode) {
      this.material.emissiveNode = add(
        this.material.emissiveNode,
        mul(caustics, float(0.15))
      );
    }
  }

  private applyWarmGlow(): void {
    // Amber glows warm when backlit
    const viewDir = normalize(sub(cameraPosition, positionWorld));
    const N = normalWorld;

    // Simulate backlight (light passing through)
    const backlight = max(float(0), sub(float(0.2), dot(N, viewDir)));

    // Warm color for backlit areas
    const warmColor = tslColor(new Color('#ff6600'));
    const backlitGlow = mul(warmColor, mul(backlight, float(0.3)));

    // Edge glow (light wrapping around)
    const edgeGlow = pow(sub(float(1.0), abs(dot(N, viewDir))), float(2.0));
    const edgeWarm = mul(tslColor(new Color('#ff9900')), mul(edgeGlow, float(0.15)));

    if (this.material.emissiveNode) {
      this.material.emissiveNode = add(
        this.material.emissiveNode,
        add(backlitGlow, edgeWarm)
      );
    }
  }

  protected updateEffects(deltaTime: number): void {
    // SSS intensity responds to low-mid frequencies
    const lowMidEnergy = this.audioData.lowMid + this.audioData.mid * 0.5;
    this.uSSSIntensity.value = 0.4 + lowMidEnergy * 0.3;

    // Update emissive intensity
    const baseIntensity = this.definition.optical.emissiveIntensity;
    this.material.emissiveIntensity = baseIntensity + lowMidEnergy * 0.1;

    // Warmth increases with bass
    const bassEnergy = this.audioData.bass + this.audioData.subBass;
    this.uWarmth.value = 1.0 + bassEnergy * 0.3;

    // Pulse warm on beat
    if (this.audioData.beat) {
      this.material.emissive = new Color('#ff6600');
      this.material.emissiveIntensity = 0.15;

      setTimeout(() => {
        this.material.emissive = new Color(this.definition.optical.emissive);
        this.material.emissiveIntensity = this.definition.optical.emissiveIntensity;
      }, 200);
    }
  }

  // ============================================================================
  // AMBER VARIETY PRESETS
  // ============================================================================

  /**
   * Set amber variety
   */
  public setVariety(variety:
    | 'baltic'
    | 'dominican'
    | 'cherry'
    | 'green'
    | 'blue'
    | 'copal'
    | 'butterscotch'
  ): void {
    switch (variety) {
      case 'baltic':
        // Classic honey amber
        this.setOpticalProperty('color', '#ffbf00');
        this.setOpticalProperty('emissive', '#ff8c00');
        this.setOpticalProperty('subsurfaceColor', '#ff6600');
        break;

      case 'dominican':
        // Blue fluorescence under UV
        this.setOpticalProperty('color', '#ffd700');
        this.setOpticalProperty('emissive', '#4169e1');  // Blue fluorescence
        this.setOpticalProperty('subsurfaceColor', '#ff9900');
        this.material.emissiveIntensity = 0.1;
        break;

      case 'cherry':
        // Deep red/cherry amber
        this.setOpticalProperty('color', '#b22222');
        this.setOpticalProperty('emissive', '#8b0000');
        this.setOpticalProperty('subsurfaceColor', '#dc143c');
        break;

      case 'green':
        // Rare green amber
        this.setOpticalProperty('color', '#9acd32');
        this.setOpticalProperty('emissive', '#6b8e23');
        this.setOpticalProperty('subsurfaceColor', '#556b2f');
        break;

      case 'blue':
        // Extremely rare blue amber
        this.setOpticalProperty('color', '#4682b4');
        this.setOpticalProperty('emissive', '#1e90ff');
        this.setOpticalProperty('subsurfaceColor', '#4169e1');
        break;

      case 'copal':
        // Young amber (not fully fossilized)
        this.setOpticalProperty('color', '#ffe4b5');
        this.setOpticalProperty('emissive', '#ffd700');
        this.setPhysicalProperty('roughness', 0.25);
        this.setPhysicalProperty('transmission', 0.7);
        this.uAge.value = 0.5;
        break;

      case 'butterscotch':
        // Opaque butterscotch amber
        this.setOpticalProperty('color', '#e2a21b');
        this.setOpticalProperty('emissive', '#cd853f');
        this.setOpticalProperty('subsurfaceColor', '#d2691e');
        this.setPhysicalProperty('transmission', 0.3);
        break;
    }

    this.material.color = new Color(this.definition.optical.color);
    this.material.emissive = new Color(this.definition.optical.emissive);
    this.material.transmission = this.definition.physical.transmission;
  }

  /**
   * Add specific inclusion type
   */
  public addInclusion(type: 'insect' | 'plant' | 'bubble' | 'debris'): void {
    // Increase inclusion density
    this.uInclusionDensity.value = Math.min(0.8, this.uInclusionDensity.value + 0.15);

    // Add visual marker based on type
    switch (type) {
      case 'insect':
        // Darker, more defined inclusions
        this.applyInsectInclusion();
        break;
      case 'plant':
        // Green-tinted inclusions
        this.applyPlantInclusion();
        break;
      case 'bubble':
        // Increase bubble density
        this.uInclusionDensity.value += 0.1;
        break;
      case 'debris':
        // Small dark particles
        this.uInclusionDensity.value += 0.05;
        break;
    }
  }

  private applyInsectInclusion(): void {
    // Create dark inclusion spot (simplified insect representation)
    const pos = positionWorld;

    // Random position for insect
    const insectPos = vec3(0.1, 0.0, -0.05);
    const dist = length(sub(pos, insectPos));

    // Insect shape (simplified as dark ellipsoid)
    const insectShape = smoothstep(float(0.08), float(0.03), dist);

    // Dark color for insect
    const insectColor = mul(vec3(0.1, 0.05, 0.0), insectShape);

    if (this.material.emissiveNode) {
      this.material.emissiveNode = sub(
        this.material.emissiveNode,
        mul(insectColor, float(0.3))
      );
    }
  }

  private applyPlantInclusion(): void {
    // Green plant matter inclusion
    const pos = positionWorld;

    // Random plant position
    const plantPos = vec3(-0.05, 0.1, 0.05);
    const dist = length(sub(pos, plantPos));

    // Plant shape (simplified)
    const plantShape = smoothstep(float(0.1), float(0.02), dist);

    // Green-brown color for plant matter
    const plantColor = mul(vec3(0.2, 0.3, 0.1), plantShape);

    if (this.material.emissiveNode) {
      this.material.emissiveNode = add(
        this.material.emissiveNode,
        mul(plantColor, float(0.2))
      );
    }
  }

  /**
   * Set age (affects transparency and color)
   */
  public setAge(age: number): void {
    // age: 0 = copal (young), 1 = ancient amber
    age = Math.max(0, Math.min(1, age));
    this.uAge.value = age;

    // Younger amber is more transparent and lighter
    const transmission = 0.7 - age * 0.2;
    this.setPhysicalProperty('transmission', transmission);

    // Color deepens with age
    const r = Math.round(255 - age * 60);
    const g = Math.round(191 - age * 80);
    const b = Math.round(age * 20);
    this.setOpticalProperty('color', `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);

    this.material.color = new Color(this.definition.optical.color);
    this.material.transmission = this.definition.physical.transmission;
  }
}

export default AmberMaterial;
