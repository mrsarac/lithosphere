/**
 * LITHOSPHERE v7.0 - Opal Material
 *
 * Queen of gems: hydrated silica spheres creating spectacular play of color.
 *
 * Key Properties:
 * - IOR: 1.37-1.47 (varies with water content)
 * - Play of color from silica sphere diffraction
 * - Hydrated (contains 3-21% water)
 * - Amorphous (like glass, no crystal structure)
 *
 * The Science of Play of Color:
 * - Tiny silica spheres (150-400nm) arranged in 3D grid
 * - Light diffracts through sphere layers
 * - Different sphere sizes create different colors
 * - Viewing angle changes which wavelengths diffract
 *
 * Varieties:
 * - Precious opal (play of color)
 * - Fire opal (transparent orange, no play)
 * - Black opal (dark body, vivid play)
 * - Boulder opal (attached to host rock)
 * - Crystal opal (transparent with play)
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
  mod,
} from 'three/tsl';

import { BaseMaterial } from '../base';
import type { MaterialDefinition } from '../types';
import { createPlayOfColor } from '../effects/spectral';

// ============================================================================
// OPAL DEFINITION
// ============================================================================

export const OPAL_DEFINITION: MaterialDefinition = {
  id: 'opal',
  name: 'Opal',
  category: 'exotic',
  tier: 'free',  // Core material, free for all
  description: 'Hydrated silica with spectacular play of color from microscopic sphere diffraction',
  icon: '🌈',

  physical: {
    ior: 1.45,           // Silica-based
    roughness: 0.08,     // Smooth polish
    metalness: 0.0,      // Non-metallic
    transmission: 0.3,   // Semi-translucent
    thickness: 0.5,
    clearcoat: 0.6,
    clearcoatRoughness: 0.1,
    sheen: 0.1,
    sheenRoughness: 0.3,
    anisotropy: 0.0,
  },

  optical: {
    color: '#e8e8e8',          // Milky white base
    emissive: '#4488ff',       // Blue-dominant play
    emissiveIntensity: 0.1,
    dispersion: 0.0,           // No dispersion (color from diffraction)
    subsurfaceColor: '#f0f8ff',
    subsurfaceIntensity: 0.2,
    iridescence: 0.8,          // High iridescence for play of color
    iridescenceIOR: 2.0,
    envMapIntensity: 0.8,
  },

  effects: [
    {
      type: 'playOfColor',
      intensity: 1.0,
      params: {
        sphereSize: 0.3,
        layers: 5,
        dominantColor: 'full-spectrum',
      },
    },
  ],

  audioMappings: [
    {
      band: 'mid',
      target: 'effectIntensity',
      multiplier: 0.5,
      smoothing: 0.85,
    },
    {
      band: 'highMid',
      target: 'color',  // Shifts play of color
      multiplier: 0.3,
      smoothing: 0.8,
    },
    {
      band: 'brilliance',
      target: 'emissive',
      multiplier: 0.4,
      smoothing: 0.9,
    },
  ],

  geologicalStory: {
    title: 'Rainbow Trapped in Stone',
    description: 'Opal forms as silica-rich water seeps through rock, depositing microscopic spheres in void spaces. When the spheres arrange just right, they trap rainbows.',
    timeScale: '5-20 million years',
    conditions: 'Arid climate, silica gel deposition, 50-100m depth, slow dehydration',
    keyframes: [
      {
        time: 0.0,
        label: 'Silica Solution',
        properties: {
          color: '#d0d0d0',
          emissive: '#ffffff',
          emissiveIntensity: 0.0,
          transmission: 0.6,
          iridescence: 0.0,
        },
        cameraPosition: { x: 0, y: 0, z: 4 },
      },
      {
        time: 0.2,
        label: 'Gel Formation',
        properties: {
          color: '#e0e0e0',
          emissive: '#cccccc',
          emissiveIntensity: 0.02,
          transmission: 0.5,
          iridescence: 0.1,
        },
        cameraPosition: { x: 1, y: 1, z: 3 },
      },
      {
        time: 0.4,
        label: 'Sphere Arrangement',
        properties: {
          color: '#e8e8e8',
          emissive: '#8888ff',
          emissiveIntensity: 0.05,
          transmission: 0.4,
          iridescence: 0.3,
        },
        cameraPosition: { x: 2, y: 0, z: 3 },
      },
      {
        time: 0.6,
        label: 'Color Emergence',
        properties: {
          color: '#f0f0f0',
          emissive: '#4488ff',
          emissiveIntensity: 0.08,
          transmission: 0.35,
          iridescence: 0.5,
        },
        cameraPosition: { x: 1, y: -1, z: 2.5 },
      },
      {
        time: 0.8,
        label: 'Play Intensifies',
        properties: {
          color: '#f5f5f5',
          emissive: '#22ff88',
          emissiveIntensity: 0.1,
          transmission: 0.32,
          iridescence: 0.7,
        },
        cameraPosition: { x: 0, y: 1, z: 2 },
      },
      {
        time: 1.0,
        label: 'Precious Opal',
        properties: {
          color: '#e8e8e8',
          emissive: '#4488ff',
          emissiveIntensity: 0.1,
          transmission: 0.3,
          iridescence: 0.8,
        },
        cameraPosition: { x: 0, y: 0, z: 2.5 },
      },
    ],
  },

  personality: {
    trait: 'Mercurial',
    mood: 'Enchanting',
    highEnergyResponse: 'transform',
    calmResponse: 'shimmer',
    conatus: 'Opal captures fleeting rainbows - water and silica conspiring to create windows into the color of light itself.',
  },
};

// ============================================================================
// OPAL MATERIAL CLASS
// ============================================================================

export class OpalMaterial extends BaseMaterial {
  private uPlayIntensity: Uniform<number>;
  private uDominantHue: Uniform<number>;
  private uSphereSize: Uniform<number>;
  private uBodyTone: Uniform<Color>;

  constructor(definition: MaterialDefinition = OPAL_DEFINITION) {
    super(definition);

    // Initialize uniforms
    this.uPlayIntensity = new Uniform(1.0);
    this.uDominantHue = new Uniform(0.6);  // Blue-green
    this.uSphereSize = new Uniform(0.3);
    this.uBodyTone = new Uniform(new Color('#e8e8e8'));

    this.uniforms.set('uPlayIntensity', this.uPlayIntensity);
    this.uniforms.set('uDominantHue', this.uDominantHue);
    this.uniforms.set('uSphereSize', this.uSphereSize);
    this.uniforms.set('uBodyTone', this.uBodyTone);
  }

  protected applyEffects(): void {
    // Apply play of color (the signature opal effect)
    this.applyPlayOfColor();

    // Apply body translucency
    this.applyBodyEffect();

    // Apply potch areas (no play)
    this.applyPotchAreas();
  }

  private applyPlayOfColor(): void {
    // Opal's play of color from silica sphere diffraction
    const viewDir = normalize(sub(cameraPosition, positionWorld));
    const N = normalWorld;

    // Base play of color
    const play = createPlayOfColor(0.3, 5);

    // View angle strongly affects color
    const viewAngle = dot(N, viewDir);

    // Create multi-layered color play
    const layer1 = this.createColorLayer(viewAngle, 0.0, '#ff0000');   // Red
    const layer2 = this.createColorLayer(viewAngle, 0.16, '#ff8800');  // Orange
    const layer3 = this.createColorLayer(viewAngle, 0.33, '#00ff00');  // Green
    const layer4 = this.createColorLayer(viewAngle, 0.5, '#00ffff');   // Cyan
    const layer5 = this.createColorLayer(viewAngle, 0.66, '#0000ff');  // Blue
    const layer6 = this.createColorLayer(viewAngle, 0.83, '#ff00ff');  // Violet

    // Combine all color layers
    const fullPlay = add(
      add(add(layer1, layer2), add(layer3, layer4)),
      add(layer5, layer6)
    );

    // Position-based variation (different areas show different colors)
    const posNoise = fract(mul(
      sin(dot(positionWorld, vec3(12.9898, 78.233, 45.543))),
      float(43758.5453)
    ));
    const areaVariation = mul(posNoise, float(0.3));

    // Final play of color
    const finalPlay = add(
      mul(fullPlay, float(0.7)),
      mul(play, areaVariation)
    );

    if (this.material.emissiveNode) {
      this.material.emissiveNode = add(
        this.material.emissiveNode,
        mul(finalPlay, float(0.5))
      );
    } else {
      this.material.emissiveNode = mul(finalPlay, float(0.5));
    }
  }

  private createColorLayer(
    viewAngle: ReturnType<typeof dot>,
    hueOffset: number,
    colorHex: string
  ): ReturnType<typeof vec3> {
    // Create a color band at specific viewing angle
    const layerAngle = float(hueOffset);
    const bandwidth = float(0.15);

    // Distance from this layer's optimal angle
    const angleDist = abs(sub(viewAngle, layerAngle));

    // Smooth color appearance
    const intensity = sub(
      float(1.0),
      smoothstep(float(0.0), bandwidth, angleDist)
    );

    // Apply color
    const layerColor = tslColor(new Color(colorHex));
    return mul(layerColor, intensity);
  }

  private applyBodyEffect(): void {
    // Opal body tone (milky translucent base)
    const viewDir = normalize(sub(cameraPosition, positionWorld));
    const N = normalWorld;

    // Depth effect - lighter at edges
    const depth = pow(abs(dot(N, viewDir)), float(0.5));

    // Milky appearance
    const milky = sub(float(1.0), mul(depth, float(0.3)));

    // Subtle blue-white body glow
    const bodyGlow = mul(
      tslColor(new Color('#f0f8ff')),
      mul(milky, float(0.1))
    );

    if (this.material.emissiveNode) {
      this.material.emissiveNode = add(
        this.material.emissiveNode,
        bodyGlow
      );
    }
  }

  private applyPotchAreas(): void {
    // Potch = areas without play of color (common opal sections)
    const pos = positionWorld;

    // Random potch areas
    const potchNoise = fract(mul(
      sin(dot(pos, vec3(127.1, 311.7, 74.7))),
      float(43758.5453)
    ));

    // Some areas have reduced play
    const potchMask = smoothstep(float(0.7), float(0.8), potchNoise);

    // Reduce emissive in potch areas
    if (this.material.emissiveNode) {
      this.material.emissiveNode = mul(
        this.material.emissiveNode,
        sub(float(1.0), mul(potchMask, float(0.5)))
      );
    }
  }

  protected updateEffects(deltaTime: number): void {
    // Play intensity responds to mid frequencies
    const midEnergy = this.audioData.mid + this.audioData.highMid * 0.5;
    this.uPlayIntensity.value = 1.0 + midEnergy * 0.5;

    // Update emissive intensity
    const baseIntensity = this.definition.optical.emissiveIntensity;
    this.material.emissiveIntensity = baseIntensity + midEnergy * 0.15;

    // Dominant hue shifts with brilliance
    const brillianceEnergy = this.audioData.brilliance + this.audioData.presence * 0.5;
    this.uDominantHue.value = 0.6 + brillianceEnergy * 0.3;

    // Beat triggers color flash
    if (this.audioData.beat) {
      // Cycle through colors on beat
      const hues = ['#ff0000', '#00ff00', '#0000ff', '#ff00ff', '#ffff00', '#00ffff'];
      const randomHue = hues[Math.floor(Math.random() * hues.length)];
      this.material.emissive = new Color(randomHue);
      this.material.emissiveIntensity = 0.2;

      setTimeout(() => {
        this.material.emissive = new Color(this.definition.optical.emissive);
        this.material.emissiveIntensity = this.definition.optical.emissiveIntensity;
      }, 150);
    }
  }

  // ============================================================================
  // OPAL VARIETY PRESETS
  // ============================================================================

  /**
   * Set opal variety
   */
  public setVariety(variety:
    | 'white'
    | 'black'
    | 'boulder'
    | 'crystal'
    | 'fire'
    | 'water'
    | 'matrix'
    | 'harlequin'
  ): void {
    switch (variety) {
      case 'white':
        // Classic white precious opal
        this.setOpticalProperty('color', '#e8e8e8');
        this.setPhysicalProperty('transmission', 0.3);
        this.uBodyTone.value = new Color('#e8e8e8');
        break;

      case 'black':
        // Premium black opal (vivid play against dark body)
        this.setOpticalProperty('color', '#1a1a2e');
        this.setOpticalProperty('emissiveIntensity', 0.15);
        this.setPhysicalProperty('transmission', 0.15);
        this.uBodyTone.value = new Color('#1a1a2e');
        this.uPlayIntensity.value = 1.5;  // More vivid play
        break;

      case 'boulder':
        // Opal with ironstone matrix
        this.setOpticalProperty('color', '#8b4513');
        this.setPhysicalProperty('transmission', 0.2);
        this.setPhysicalProperty('roughness', 0.15);
        this.uBodyTone.value = new Color('#8b4513');
        this.applyBoulderMatrix();
        break;

      case 'crystal':
        // Transparent with play
        this.setOpticalProperty('color', '#f0f0ff');
        this.setPhysicalProperty('transmission', 0.7);
        this.uBodyTone.value = new Color('#f0f0ff');
        break;

      case 'fire':
        // Transparent orange (no play typical)
        this.setOpticalProperty('color', '#ff6600');
        this.setOpticalProperty('emissive', '#ff4400');
        this.setPhysicalProperty('transmission', 0.8);
        this.material.iridescence = 0.1;  // Minimal play
        break;

      case 'water':
        // Clear/colorless opal
        this.setOpticalProperty('color', '#f8f8ff');
        this.setPhysicalProperty('transmission', 0.85);
        this.material.iridescence = 0.9;
        break;

      case 'matrix':
        // Opal distributed through host rock
        this.setOpticalProperty('color', '#a0a0a0');
        this.setPhysicalProperty('transmission', 0.1);
        this.setPhysicalProperty('roughness', 0.2);
        this.applyMatrixPattern();
        break;

      case 'harlequin':
        // Rare pattern: angular patches of color
        this.setOpticalProperty('color', '#e0e0e0');
        this.setOpticalProperty('emissiveIntensity', 0.12);
        this.uPlayIntensity.value = 1.3;
        this.applyHarlequinPattern();
        break;
    }

    this.material.color = new Color(this.definition.optical.color);
    this.material.emissive = new Color(this.definition.optical.emissive);
    this.material.transmission = this.definition.physical.transmission;
    this.material.iridescence = this.definition.optical.iridescence;
  }

  private applyBoulderMatrix(): void {
    // Boulder opal has ironstone background
    const pos = positionWorld;

    // Rock texture
    const rockNoise = fract(mul(
      sin(dot(pos, vec3(127.1, 311.7, 74.7))),
      float(43758.5453)
    ));

    // Brown rock areas
    const rockColor = mix(
      tslColor(new Color('#8b4513')),
      tslColor(new Color('#654321')),
      rockNoise
    );

    // Veins of opal through rock
    const opalVein = smoothstep(float(0.3), float(0.35), rockNoise);

    // Apply rock color to non-opal areas
    if (this.material.emissiveNode) {
      this.material.emissiveNode = mix(
        mul(rockColor, float(0.1)),
        this.material.emissiveNode,
        opalVein
      );
    }
  }

  private applyMatrixPattern(): void {
    // Matrix opal: small spots of opal in host rock
    const pos = positionWorld;

    // Spotty pattern
    const gridSize = float(5.0);
    const cellPos = mul(pos, gridSize);
    const cellId = floor(cellPos);

    const hash = fract(mul(
      sin(dot(cellId, vec3(127.1, 311.7, 74.7))),
      float(43758.5453)
    ));

    // Only some cells have opal
    const hasOpal = smoothstep(float(0.6), float(0.65), hash);

    if (this.material.emissiveNode) {
      this.material.emissiveNode = mul(
        this.material.emissiveNode,
        hasOpal
      );
    }
  }

  private applyHarlequinPattern(): void {
    // Harlequin: angular mosaic pattern of colors
    const pos = positionWorld;

    // Angular grid pattern
    const gridSize = float(3.0);
    const cellPos = mul(pos, gridSize);
    const cellId = floor(cellPos);

    // Each cell gets different hue
    const cellHue = fract(mul(
      sin(dot(cellId, vec3(127.1, 311.7, 74.7))),
      float(6.0)  // 6 color zones
    ));

    // Angular color patches (more distinct than normal play)
    const patchColor = this.hueToColor(cellHue);

    if (this.material.emissiveNode) {
      this.material.emissiveNode = add(
        mul(this.material.emissiveNode, float(0.5)),
        mul(patchColor, float(0.3))
      );
    }
  }

  private hueToColor(hue: ReturnType<typeof fract>): ReturnType<typeof vec3> {
    // Convert hue (0-1) to RGB
    const h6 = mul(hue, float(6.0));

    const r = abs(sub(mod(h6, float(6.0)), float(3.0)));
    const g = abs(sub(mod(add(h6, float(4.0)), float(6.0)), float(3.0)));
    const b = abs(sub(mod(add(h6, float(2.0)), float(6.0)), float(3.0)));

    return vec3(
      clamp(sub(r, float(1.0)), float(0.0), float(1.0)),
      clamp(sub(g, float(1.0)), float(0.0), float(1.0)),
      clamp(sub(b, float(1.0)), float(0.0), float(1.0))
    );
  }

  /**
   * Set dominant color in play
   */
  public setDominantColor(color: 'red' | 'orange' | 'green' | 'blue' | 'violet' | 'full'): void {
    const hueMap: Record<string, number> = {
      'red': 0.0,
      'orange': 0.1,
      'green': 0.33,
      'blue': 0.6,
      'violet': 0.8,
      'full': 0.5,  // All colors
    };

    this.uDominantHue.value = hueMap[color] ?? 0.5;

    // Adjust emissive to match dominant
    const colorMap: Record<string, string> = {
      'red': '#ff4444',
      'orange': '#ff8844',
      'green': '#44ff44',
      'blue': '#4488ff',
      'violet': '#8844ff',
      'full': '#4488ff',
    };

    this.setOpticalProperty('emissive', colorMap[color] ?? '#4488ff');
    this.material.emissive = new Color(this.definition.optical.emissive);
  }
}

// Helper function
function clamp(value: ReturnType<typeof float>, minVal: ReturnType<typeof float>, maxVal: ReturnType<typeof float>) {
  return max(minVal, min(maxVal, value));
}

export default OpalMaterial;
