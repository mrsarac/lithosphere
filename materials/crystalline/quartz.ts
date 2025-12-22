/**
 * LITHOSPHERE v7.0 - Quartz Material
 *
 * The most common mineral: versatile, piezoelectric, and infinitely varied.
 *
 * Key Properties:
 * - IOR: 1.544-1.553 (birefringent)
 * - Piezoelectric (generates voltage under pressure)
 * - Hexagonal crystal system
 * - Vitreous luster
 *
 * Geological Formation:
 * - Forms from silica-rich solutions
 * - Crystallizes slowly over millions of years
 * - Found in almost all geological environments
 *
 * Varieties:
 * - Clear quartz (rock crystal)
 * - Amethyst (purple, iron impurity)
 * - Citrine (yellow, heat-treated amethyst)
 * - Rose quartz (pink, titanium)
 * - Smoky quartz (brown/black, radiation)
 * - Rutilated quartz (golden needles)
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
} from 'three/tsl';

import { BaseMaterial } from '../base';
import type { MaterialDefinition } from '../types';
import {
  createPhantomInclusions,
  createChloritePhantom,
  createRutileNeedles,
  createGrowthZones,
} from '../effects/inclusions';
import {
  createHexagonalPattern,
  createPrismaticFacets,
  createPiezoelectricPulse,
} from '../effects/patterns';

// ============================================================================
// QUARTZ DEFINITION
// ============================================================================

export const QUARTZ_DEFINITION: MaterialDefinition = {
  id: 'quartz',
  name: 'Quartz',
  category: 'crystalline',
  tier: 'free',  // Core material, free for all
  description: 'Silicon dioxide crystal with piezoelectric properties and endless variety',
  icon: '🔮',

  physical: {
    ior: 1.55,           // Middle value for birefringence
    roughness: 0.02,     // Well-polished
    metalness: 0.0,      // Non-metallic
    transmission: 0.9,   // Highly transparent (clear variety)
    thickness: 0.6,
    clearcoat: 0.5,
    clearcoatRoughness: 0.1,
    sheen: 0.0,
    sheenRoughness: 0.0,
    anisotropy: 0.0,
  },

  optical: {
    color: '#f8f8ff',          // Crystal clear with hint of blue
    emissive: '#e6e6fa',       // Lavender glow
    emissiveIntensity: 0.03,
    dispersion: 0.013,         // Weak dispersion
    subsurfaceColor: '#f0f0ff',
    subsurfaceIntensity: 0.15,
    iridescence: 0.1,
    iridescenceIOR: 1.5,
    envMapIntensity: 1.2,
  },

  effects: [
    {
      type: 'piezoelectric',
      intensity: 0.5,
      params: {
        pulseSpeed: 2.0,
        glowColor: '#e6e6fa',
        audioReactive: true,
      },
    },
    {
      type: 'phantomInclusions',
      intensity: 0.3,
      params: {
        layerCount: 3,
        opacity: 0.2,
      },
    },
    {
      type: 'crystallineGrowth',
      intensity: 0.4,
      params: {
        facetCount: 6,
        terminationGlow: true,
      },
    },
  ],

  audioMappings: [
    {
      band: 'bass',
      target: 'effectIntensity',  // Piezoelectric response
      multiplier: 0.8,
      smoothing: 0.7,
    },
    {
      band: 'mid',
      target: 'emissive',
      multiplier: 0.4,
      smoothing: 0.85,
    },
    {
      band: 'brilliance',
      target: 'dispersion',
      multiplier: 0.2,
      smoothing: 0.9,
    },
  ],

  geologicalStory: {
    title: 'Crystal Genesis',
    description: 'Quartz grows one atomic layer at a time from hot, silica-rich water seeping through rock - a patient crystallization that can span millions of years.',
    timeScale: 'Thousands to millions of years',
    conditions: 'Hydrothermal veins, 100-400°C, SiO₂ supersaturated solutions',
    keyframes: [
      {
        time: 0.0,
        label: 'Silica Solution',
        properties: {
          transmission: 0.1,
          emissiveIntensity: 0.0,
          roughness: 0.9,
          color: '#808080',
        },
        cameraPosition: { x: 0, y: -1, z: 4 },
      },
      {
        time: 0.2,
        label: 'Seed Crystal',
        properties: {
          transmission: 0.3,
          emissiveIntensity: 0.01,
          roughness: 0.6,
          color: '#c0c0c0',
        },
        cameraPosition: { x: 2, y: 0, z: 3 },
      },
      {
        time: 0.4,
        label: 'Hexagonal Growth',
        properties: {
          transmission: 0.5,
          emissiveIntensity: 0.02,
          roughness: 0.4,
          color: '#e0e0e8',
        },
        cameraPosition: { x: 1, y: 1, z: 3 },
      },
      {
        time: 0.6,
        label: 'Phantom Layer',
        properties: {
          transmission: 0.7,
          emissiveIntensity: 0.025,
          roughness: 0.2,
          color: '#f0f0f5',
        },
        cameraPosition: { x: 0, y: 2, z: 2.5 },
      },
      {
        time: 0.8,
        label: 'Termination',
        properties: {
          transmission: 0.85,
          emissiveIntensity: 0.03,
          roughness: 0.1,
          color: '#f5f5fa',
        },
        cameraPosition: { x: -1, y: 1, z: 2 },
      },
      {
        time: 1.0,
        label: 'Perfect Crystal',
        properties: {
          transmission: 0.9,
          emissiveIntensity: 0.03,
          roughness: 0.02,
          color: '#f8f8ff',
          iridescence: 0.1,
        },
        cameraPosition: { x: 0, y: 0, z: 2.5 },
      },
    ],
  },

  personality: {
    trait: 'Resonant',
    mood: 'Harmonious',
    highEnergyResponse: 'transform',
    calmResponse: 'pulse',
    conatus: 'Quartz embodies ordered growth - silicon and oxygen finding their perfect geometric expression through patience and pressure, converting mechanical stress into light.',
  },
};

// ============================================================================
// QUARTZ MATERIAL CLASS
// ============================================================================

export class QuartzMaterial extends BaseMaterial {
  private uPiezoIntensity: Uniform<number>;
  private uPhantomVisibility: Uniform<number>;
  private uCrystalGlow: Uniform<number>;
  private uColorTint: Uniform<Color>;

  constructor(definition: MaterialDefinition = QUARTZ_DEFINITION) {
    super(definition);

    // Initialize uniforms
    this.uPiezoIntensity = new Uniform(0.0);
    this.uPhantomVisibility = new Uniform(0.3);
    this.uCrystalGlow = new Uniform(0.0);
    this.uColorTint = new Uniform(new Color('#ffffff'));

    this.uniforms.set('uPiezoIntensity', this.uPiezoIntensity);
    this.uniforms.set('uPhantomVisibility', this.uPhantomVisibility);
    this.uniforms.set('uCrystalGlow', this.uCrystalGlow);
    this.uniforms.set('uColorTint', this.uColorTint);
  }

  protected applyEffects(): void {
    // Apply piezoelectric pulse effect
    this.applyPiezoelectricEffect();

    // Apply phantom inclusions
    this.applyPhantomInclusions();

    // Apply hexagonal crystal structure
    this.applyCrystalStructure();

    // Apply termination glow
    this.applyTerminationGlow();
  }

  private applyPiezoelectricEffect(): void {
    // Quartz generates voltage under pressure - visualize as pulsing glow
    const piezoGlow = createPiezoelectricPulse(2.0, '#e6e6fa', true);

    // Audio-reactive piezo response (bass = pressure)
    const audioIntensity = uniform(float(0.0));

    // Apply as emissive pulse
    if (this.material.emissiveNode) {
      this.material.emissiveNode = add(
        this.material.emissiveNode,
        piezoGlow
      );
    } else {
      this.material.emissiveNode = piezoGlow;
    }
  }

  private applyPhantomInclusions(): void {
    // Phantom quartz shows internal "ghost" crystals from interrupted growth
    const phantoms = createPhantomInclusions(3, 0.15, '#d3d3d3');

    // Add phantoms to the visual
    if (this.material.emissiveNode) {
      this.material.emissiveNode = add(
        this.material.emissiveNode,
        mul(phantoms, float(0.2))
      );
    }
  }

  private applyCrystalStructure(): void {
    // Hexagonal crystal system visible as facet pattern
    const hexPattern = createHexagonalPattern(5.0);
    const facets = createPrismaticFacets(6);

    // Subtle internal structure
    const structure = add(
      mul(hexPattern, float(0.05)),
      mul(facets, float(0.1))
    );

    // Apply as subtle roughness variation
    const viewDir = normalize(sub(cameraPosition, positionWorld));
    const structureHighlight = mul(
      pow(abs(dot(normalWorld, viewDir)), float(4.0)),
      structure
    );

    if (this.material.emissiveNode) {
      this.material.emissiveNode = add(
        this.material.emissiveNode,
        mul(vec3(0.95, 0.95, 1.0), structureHighlight)
      );
    }
  }

  private applyTerminationGlow(): void {
    // Crystal terminations (points) often glow more
    const pos = positionWorld;

    // Termination at top of crystal (y-axis)
    const termY = smoothstep(float(0.3), float(0.5), pos.y);

    // Hexagonal pyramid termination shape
    const distFromAxis = mul(
      add(abs(pos.x), abs(pos.z)),
      float(2.0)
    );
    const termShape = sub(float(1.0), smoothstep(float(0.0), float(0.3), distFromAxis));

    const termination = mul(termY, termShape);

    // Glow at termination
    const termGlow = mul(
      vec3(0.9, 0.9, 1.0),
      mul(termination, float(0.1))
    );

    if (this.material.emissiveNode) {
      this.material.emissiveNode = add(
        this.material.emissiveNode,
        termGlow
      );
    }
  }

  protected updateEffects(deltaTime: number): void {
    // Piezoelectric response to bass (pressure)
    const bassEnergy = this.audioData.bass + this.audioData.subBass;
    this.uPiezoIntensity.value = bassEnergy * 0.8;

    // Update emissive intensity with piezo effect
    const baseIntensity = this.definition.optical.emissiveIntensity;
    this.material.emissiveIntensity = baseIntensity + this.uPiezoIntensity.value * 0.2;

    // Crystal glow on beats
    if (this.audioData.beat) {
      this.uCrystalGlow.value = 0.5;
      this.material.emissiveIntensity = 0.15;

      // Decay
      setTimeout(() => {
        this.uCrystalGlow.value = 0.0;
        this.material.emissiveIntensity = this.definition.optical.emissiveIntensity;
      }, 200);
    }

    // Mid frequencies affect phantom visibility
    const midEnergy = this.audioData.mid + this.audioData.lowMid;
    this.uPhantomVisibility.value = 0.3 + midEnergy * 0.2;
  }

  // ============================================================================
  // QUARTZ VARIETY PRESETS
  // ============================================================================

  /**
   * Set quartz variety
   */
  public setVariety(variety:
    | 'clear'
    | 'amethyst'
    | 'citrine'
    | 'rose'
    | 'smoky'
    | 'rutilated'
    | 'phantom'
    | 'milky'
  ): void {
    switch (variety) {
      case 'clear':
        this.setOpticalProperty('color', '#f8f8ff');
        this.setOpticalProperty('emissive', '#e6e6fa');
        this.setPhysicalProperty('transmission', 0.9);
        break;

      case 'amethyst':
        this.setOpticalProperty('color', '#9966cc');
        this.setOpticalProperty('emissive', '#8b008b');
        this.setPhysicalProperty('transmission', 0.85);
        this.applyGrowthZoning('#9966cc');
        break;

      case 'citrine':
        this.setOpticalProperty('color', '#ffcc00');
        this.setOpticalProperty('emissive', '#ffa500');
        this.setPhysicalProperty('transmission', 0.85);
        this.applyGrowthZoning('#ffcc00');
        break;

      case 'rose':
        this.setOpticalProperty('color', '#ffb6c1');
        this.setOpticalProperty('emissive', '#ff69b4');
        this.setPhysicalProperty('transmission', 0.75);
        this.setOpticalProperty('subsurfaceIntensity', 0.3);
        break;

      case 'smoky':
        this.setOpticalProperty('color', '#696969');
        this.setOpticalProperty('emissive', '#2f2f2f');
        this.setPhysicalProperty('transmission', 0.6);
        break;

      case 'rutilated':
        this.setOpticalProperty('color', '#f8f8ff');
        this.setPhysicalProperty('transmission', 0.85);
        this.applyRutileInclusions();
        break;

      case 'phantom':
        this.setOpticalProperty('color', '#f0f0f0');
        this.setPhysicalProperty('transmission', 0.85);
        this.uPhantomVisibility.value = 0.6;
        break;

      case 'milky':
        this.setOpticalProperty('color', '#f5f5f5');
        this.setOpticalProperty('subsurfaceColor', '#ffffff');
        this.setOpticalProperty('subsurfaceIntensity', 0.5);
        this.setPhysicalProperty('transmission', 0.4);
        this.setPhysicalProperty('roughness', 0.15);
        break;
    }

    this.material.color = new Color(this.definition.optical.color);
    this.material.emissive = new Color(this.definition.optical.emissive);
    this.material.transmission = this.definition.physical.transmission;
  }

  private applyGrowthZoning(baseColor: string): void {
    // Color zoning from crystal growth
    const zones = createGrowthZones(4, baseColor, 0.2);

    if (this.material.emissiveNode) {
      this.material.emissiveNode = add(
        this.material.emissiveNode,
        mul(zones, float(0.1))
      );
    }
  }

  private applyRutileInclusions(): void {
    // Golden rutile needles
    const rutile = createRutileNeedles(5, '#b8860b', 0.01);

    if (this.material.emissiveNode) {
      this.material.emissiveNode = add(
        this.material.emissiveNode,
        mul(rutile, float(0.5))
      );
    }
  }

  /**
   * Trigger piezoelectric flash (simulates pressure)
   */
  public triggerPiezoFlash(intensity: number = 1.0): void {
    this.uPiezoIntensity.value = intensity;
    this.material.emissiveIntensity = 0.2 * intensity;

    // Decay over 500ms
    const startTime = Date.now();
    const decay = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < 500) {
        const t = 1 - elapsed / 500;
        this.uPiezoIntensity.value = intensity * t * t;
        this.material.emissiveIntensity = this.definition.optical.emissiveIntensity + 0.17 * t * t;
        requestAnimationFrame(decay);
      } else {
        this.uPiezoIntensity.value = 0;
        this.material.emissiveIntensity = this.definition.optical.emissiveIntensity;
      }
    };
    requestAnimationFrame(decay);
  }

  /**
   * Set phantom layer count
   */
  public setPhantomLayers(count: number): void {
    this.uPhantomVisibility.value = Math.min(1, count * 0.15);
  }
}

export default QuartzMaterial;
