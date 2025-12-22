/**
 * LITHOSPHERE v7.0 - Obsidian Material
 *
 * Volcanic glass: rapid cooling creates amorphous structure with unique properties.
 *
 * Key Properties:
 * - IOR: 1.48-1.51 (similar to glass)
 * - Conchoidal fracture (smooth, curved breaks)
 * - Vitreous to sub-vitreous luster
 * - Can exhibit rainbow sheen (thin-film interference)
 *
 * Geological Formation:
 * - Forms when felsic lava cools rapidly
 * - No time for crystal structure to form
 * - Amorphous (non-crystalline) solid
 * - Found near volcanic eruptions
 *
 * Varieties:
 * - Black obsidian (most common)
 * - Rainbow obsidian (thin-film iridescence)
 * - Mahogany obsidian (brown/red banding)
 * - Snowflake obsidian (cristobalite inclusions)
 * - Fire obsidian (layers of different colors)
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
  min,
} from 'three/tsl';

import { BaseMaterial } from '../base';
import type { MaterialDefinition } from '../types';
import { createThinFilmInterference } from '../effects/spectral';
import {
  createConchoidalFracture,
  createFractureLines,
  createVolcanicFlow,
  createBandedFlow,
} from '../effects/patterns';

// ============================================================================
// OBSIDIAN DEFINITION
// ============================================================================

export const OBSIDIAN_DEFINITION: MaterialDefinition = {
  id: 'obsidian',
  name: 'Obsidian',
  category: 'volcanic',
  tier: 'free',  // Core material, free for all
  description: 'Volcanic glass formed by rapid cooling of silica-rich lava',
  icon: '🌋',

  physical: {
    ior: 1.50,           // Glass-like
    roughness: 0.05,     // Very smooth (except fractures)
    metalness: 0.0,      // Non-metallic
    transmission: 0.1,   // Mostly opaque
    thickness: 0.8,
    clearcoat: 0.8,      // Glass-like surface
    clearcoatRoughness: 0.1,
    sheen: 0.0,
    sheenRoughness: 0.0,
    anisotropy: 0.0,
  },

  optical: {
    color: '#0a0a0a',          // Deep black
    emissive: '#1a0a1a',       // Subtle purple undertone
    emissiveIntensity: 0.02,
    dispersion: 0.01,          // Minimal dispersion
    subsurfaceColor: '#200010',
    subsurfaceIntensity: 0.05,
    iridescence: 0.3,          // Rainbow sheen
    iridescenceIOR: 1.8,
    envMapIntensity: 1.5,
  },

  effects: [
    {
      type: 'conchoidal',
      intensity: 0.5,
      params: {
        frequency: 5.0,
        depth: 0.3,
      },
    },
    {
      type: 'rainbowSheen',
      intensity: 0.4,
      params: {
        filmThickness: 0.5,
        viewDependence: true,
      },
    },
    {
      type: 'volcanoicFlow',
      intensity: 0.3,
      params: {
        flowDirection: 'vertical',
        animated: false,
      },
    },
  ],

  audioMappings: [
    {
      band: 'subBass',
      target: 'emissive',
      multiplier: 0.5,
      smoothing: 0.9,
    },
    {
      band: 'lowMid',
      target: 'effectIntensity',
      multiplier: 0.3,
      smoothing: 0.85,
    },
    {
      band: 'presence',
      target: 'roughness',
      multiplier: -0.05,  // Gets smoother with high frequencies
      smoothing: 0.8,
    },
  ],

  geologicalStory: {
    title: 'Frozen Fire',
    description: 'Born from violent volcanic eruption, obsidian is liquid rock frozen in time - cooled so quickly that atoms had no chance to organize into crystals.',
    timeScale: 'Hours to days',
    conditions: 'Surface volcanic eruption, rapid cooling, 700-1200°C → ambient',
    keyframes: [
      {
        time: 0.0,
        label: 'Magma Chamber',
        properties: {
          color: '#ff4400',
          emissive: '#ff2200',
          emissiveIntensity: 1.0,
          transmission: 0.3,
          roughness: 0.8,
        },
        cameraPosition: { x: 0, y: -2, z: 4 },
      },
      {
        time: 0.2,
        label: 'Eruption',
        properties: {
          color: '#cc3300',
          emissive: '#ff4400',
          emissiveIntensity: 0.8,
          transmission: 0.2,
          roughness: 0.6,
        },
        cameraPosition: { x: 2, y: 1, z: 3 },
      },
      {
        time: 0.4,
        label: 'Lava Flow',
        properties: {
          color: '#881100',
          emissive: '#aa2200',
          emissiveIntensity: 0.4,
          transmission: 0.15,
          roughness: 0.4,
        },
        cameraPosition: { x: 1, y: 2, z: 3 },
      },
      {
        time: 0.6,
        label: 'Rapid Cooling',
        properties: {
          color: '#330808',
          emissive: '#440000',
          emissiveIntensity: 0.1,
          transmission: 0.1,
          roughness: 0.2,
        },
        cameraPosition: { x: 0, y: 2, z: 2.5 },
      },
      {
        time: 0.8,
        label: 'Glass Formation',
        properties: {
          color: '#1a0a0a',
          emissive: '#200010',
          emissiveIntensity: 0.05,
          transmission: 0.1,
          roughness: 0.1,
        },
        cameraPosition: { x: -1, y: 1, z: 2 },
      },
      {
        time: 1.0,
        label: 'Volcanic Glass',
        properties: {
          color: '#0a0a0a',
          emissive: '#1a0a1a',
          emissiveIntensity: 0.02,
          transmission: 0.1,
          roughness: 0.05,
          iridescence: 0.3,
        },
        cameraPosition: { x: 0, y: 0, z: 2.5 },
      },
    ],
  },

  personality: {
    trait: 'Intense',
    mood: 'Brooding',
    highEnergyResponse: 'absorb',
    calmResponse: 'pulse',
    conatus: 'Obsidian holds volcanic fury frozen in glass - the earth\'s molten rage crystallized into sharp, protective darkness.',
  },
};

// ============================================================================
// OBSIDIAN MATERIAL CLASS
// ============================================================================

export class ObsidianMaterial extends BaseMaterial {
  private uFlowIntensity: Uniform<number>;
  private uRainbowIntensity: Uniform<number>;
  private uFractureDepth: Uniform<number>;
  private uGlowPulse: Uniform<number>;

  constructor(definition: MaterialDefinition = OBSIDIAN_DEFINITION) {
    super(definition);

    // Initialize uniforms
    this.uFlowIntensity = new Uniform(0.3);
    this.uRainbowIntensity = new Uniform(0.4);
    this.uFractureDepth = new Uniform(0.3);
    this.uGlowPulse = new Uniform(0.0);

    this.uniforms.set('uFlowIntensity', this.uFlowIntensity);
    this.uniforms.set('uRainbowIntensity', this.uRainbowIntensity);
    this.uniforms.set('uFractureDepth', this.uFractureDepth);
    this.uniforms.set('uGlowPulse', this.uGlowPulse);
  }

  protected applyEffects(): void {
    // Apply conchoidal fracture pattern
    this.applyConchoidalFracture();

    // Apply rainbow sheen (thin-film interference)
    this.applyRainbowSheen();

    // Apply volcanic flow lines
    this.applyVolcanicFlow();

    // Apply deep black depth effect
    this.applyDepthEffect();
  }

  private applyConchoidalFracture(): void {
    // Conchoidal fracture creates shell-like curved surfaces
    const fracture = createConchoidalFracture(5.0, 0.3);
    const fractureLines = createFractureLines(20.0, 50.0);

    // Combine fracture patterns
    const combinedFracture = add(
      mul(fracture, float(0.5)),
      mul(fractureLines, float(0.3))
    );

    // Apply to roughness variation
    const baseRoughness = float(this.definition.physical.roughness);
    const fractureRoughness = add(baseRoughness, mul(combinedFracture, float(0.15)));

    // Fracture areas catch light differently
    // Apply subtle specular variation based on fracture
    const viewDir = normalize(sub(cameraPosition, positionWorld));
    const fractureHighlight = mul(
      pow(abs(dot(normalWorld, viewDir)), float(8.0)),
      combinedFracture
    );

    if (this.material.emissiveNode) {
      this.material.emissiveNode = add(
        this.material.emissiveNode,
        mul(vec3(0.1, 0.1, 0.12), fractureHighlight)
      );
    } else {
      this.material.emissiveNode = mul(vec3(0.1, 0.1, 0.12), fractureHighlight);
    }
  }

  private applyRainbowSheen(): void {
    // Rainbow obsidian has thin-film interference
    const rainbow = createThinFilmInterference(0.5, 0.4);

    // Rainbow only visible at certain angles (characteristic of the material)
    const viewDir = normalize(sub(cameraPosition, positionWorld));
    const grazeAngle = sub(float(1.0), abs(dot(normalWorld, viewDir)));
    const rainbowVisibility = smoothstep(float(0.3), float(0.7), grazeAngle);

    const rainbowEffect = mul(rainbow, rainbowVisibility);

    // Add to emissive for visible color play
    if (this.material.emissiveNode) {
      this.material.emissiveNode = add(
        this.material.emissiveNode,
        mul(rainbowEffect, float(0.3))
      );
    }
  }

  private applyVolcanicFlow(): void {
    // Flow lines from original lava movement
    const flowPattern = createVolcanicFlow(0.1, 3.0, true);

    // Subtle color variation along flow
    const baseColor = tslColor(new Color(this.definition.optical.color));
    const flowColor = tslColor(new Color('#150510'));

    const flowMix = mul(flowPattern, float(0.2));

    // Apply flow-based color variation
    // Note: In TSL, we modify the emissive for visible effect
    if (this.material.emissiveNode) {
      this.material.emissiveNode = add(
        this.material.emissiveNode,
        mul(flowColor, flowMix)
      );
    }
  }

  private applyDepthEffect(): void {
    // Obsidian has a unique depth - you can see slightly into it
    const viewDir = normalize(sub(cameraPosition, positionWorld));
    const depth = pow(abs(dot(normalWorld, viewDir)), float(3.0));

    // Darker at edges (like looking into black glass)
    const edgeDarkening = mul(
      sub(float(1.0), depth),
      float(0.3)
    );

    // Apply as color multiplier effect through emissive
    if (this.material.emissiveNode) {
      this.material.emissiveNode = sub(
        this.material.emissiveNode,
        mul(vec3(1, 1, 1), edgeDarkening)
      );
    }
  }

  protected updateEffects(deltaTime: number): void {
    // Pulse inner glow with bass frequencies
    const bassEnergy = this.audioData.bass + this.audioData.subBass;
    this.uGlowPulse.value = bassEnergy * 0.5;

    // Update material emissive intensity
    const baseIntensity = this.definition.optical.emissiveIntensity;
    this.material.emissiveIntensity = baseIntensity + this.uGlowPulse.value * 0.1;

    // Rainbow intensity increases with presence frequencies
    const presenceEnergy = this.audioData.presence + this.audioData.brilliance;
    this.uRainbowIntensity.value = 0.4 + presenceEnergy * 0.3;

    // Beat triggers brief red glow (volcanic memory)
    if (this.audioData.beat) {
      this.material.emissive = new Color('#2a0505');
      setTimeout(() => {
        this.material.emissive = new Color(this.definition.optical.emissive);
      }, 150);
    }
  }

  // ============================================================================
  // OBSIDIAN VARIETY PRESETS
  // ============================================================================

  /**
   * Set obsidian variety
   */
  public setVariety(variety: 'black' | 'rainbow' | 'mahogany' | 'snowflake' | 'fire' | 'gold'): void {
    switch (variety) {
      case 'black':
        this.setOpticalProperty('color', '#0a0a0a');
        this.setOpticalProperty('iridescence', 0.0);
        break;

      case 'rainbow':
        this.setOpticalProperty('color', '#0a0a0a');
        this.setOpticalProperty('iridescence', 0.6);
        this.setOpticalProperty('iridescenceIOR', 2.0);
        this.uRainbowIntensity.value = 0.7;
        break;

      case 'mahogany':
        this.setOpticalProperty('color', '#1a0808');
        this.setOpticalProperty('emissive', '#2a1008');
        this.applyMahoganyBanding();
        break;

      case 'snowflake':
        this.setOpticalProperty('color', '#0a0a0a');
        this.applySnowflakePattern();
        break;

      case 'fire':
        this.setOpticalProperty('color', '#0a0505');
        this.setOpticalProperty('iridescence', 0.8);
        this.setOpticalProperty('emissiveIntensity', 0.05);
        break;

      case 'gold':
        // Gold sheen obsidian
        this.setOpticalProperty('color', '#0a0a08');
        this.setOpticalProperty('emissive', '#1a1500');
        this.applyGoldSheen();
        break;
    }

    this.material.color = new Color(this.definition.optical.color);
    this.material.emissive = new Color(this.definition.optical.emissive);
    this.material.iridescence = this.definition.optical.iridescence;
  }

  private applyMahoganyBanding(): void {
    // Mahogany obsidian has brown/red banding from iron oxidation
    const banded = createBandedFlow(8, '#1a0808', '#2a1008');

    // Update emissive with banded pattern
    if (this.material.emissiveNode) {
      this.material.emissiveNode = add(
        this.material.emissiveNode,
        mul(banded, float(0.15))
      );
    }
  }

  private applySnowflakePattern(): void {
    // Snowflake obsidian has cristobalite (white) crystal inclusions
    const pos = positionWorld;

    // Random snowflake positions
    const hash = fract(mul(
      sin(dot(pos, vec3(127.1, 311.7, 74.7))),
      float(43758.5453)
    ));

    // Circular snowflake shapes
    const snowflake = smoothstep(float(0.7), float(0.8), hash);

    // White color for cristobalite
    const snowflakeColor = mul(vec3(0.8, 0.8, 0.85), snowflake);

    if (this.material.emissiveNode) {
      this.material.emissiveNode = add(
        this.material.emissiveNode,
        mul(snowflakeColor, float(0.3))
      );
    }
  }

  private applyGoldSheen(): void {
    // Gold sheen obsidian has oriented gas bubbles
    const viewDir = normalize(sub(cameraPosition, positionWorld));
    const grazeAngle = pow(sub(float(1.0), abs(dot(normalWorld, viewDir))), float(2.0));

    const goldSheen = mul(
      vec3(1.0, 0.84, 0.0),  // Gold color
      mul(grazeAngle, float(0.3))
    );

    if (this.material.emissiveNode) {
      this.material.emissiveNode = add(
        this.material.emissiveNode,
        goldSheen
      );
    }
  }

  /**
   * Simulate volcanic heat state
   */
  public setHeatLevel(heat: number): void {
    // 0 = cold obsidian, 1 = molten lava
    heat = Math.max(0, Math.min(1, heat));

    if (heat < 0.3) {
      // Cold obsidian
      this.setOpticalProperty('color', '#0a0a0a');
      this.setOpticalProperty('emissive', '#1a0a1a');
      this.material.emissiveIntensity = 0.02;
    } else if (heat < 0.6) {
      // Warm obsidian
      this.setOpticalProperty('color', '#1a0505');
      this.setOpticalProperty('emissive', '#3a0505');
      this.material.emissiveIntensity = 0.1 + heat * 0.2;
    } else {
      // Hot/molten
      const t = (heat - 0.6) / 0.4;
      const r = Math.round(26 + t * 229);
      const g = Math.round(5 + t * 63);
      const b = Math.round(5);
      this.setOpticalProperty('color', `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);
      this.setOpticalProperty('emissive', '#ff4400');
      this.material.emissiveIntensity = 0.3 + heat * 0.7;
    }

    this.material.color = new Color(this.definition.optical.color);
    this.material.emissive = new Color(this.definition.optical.emissive);
  }
}

export default ObsidianMaterial;
