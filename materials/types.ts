/**
 * LITHOSPHERE v7.0 - Material System Types
 *
 * Type definitions for the multi-material system.
 * Each material has physical, optical, and audio-reactive properties.
 */

import type { Color } from 'three';

// ============================================================================
// MATERIAL CATEGORIES
// ============================================================================

export type MaterialCategory =
  | 'gemstone'      // Diamond, Ruby, Emerald, Sapphire, Amethyst
  | 'volcanic'      // Obsidian, Pumice, Basalt
  | 'crystalline'   // Quartz, Selenite, Fluorite
  | 'organic'       // Amber, Pearl, Coral
  | 'exotic';       // Alexandrite, Labradorite, Opal, Moldavite

export type MaterialTier = 'free' | 'creator' | 'pro' | 'studio';

// ============================================================================
// PHYSICAL PROPERTIES
// ============================================================================

export interface PhysicalProperties {
  /** Index of Refraction (1.0 = air, 1.5 = glass, 2.42 = diamond) */
  ior: number;

  /** Surface roughness (0 = mirror, 1 = diffuse) */
  roughness: number;

  /** Metalness (0 = dielectric, 1 = metal) */
  metalness: number;

  /** Transmission for transparent materials (0-1) */
  transmission: number;

  /** Thickness for transmission effects */
  thickness: number;

  /** Clearcoat layer intensity (0-1) */
  clearcoat: number;

  /** Clearcoat roughness */
  clearcoatRoughness: number;

  /** Sheen intensity for fabric-like materials */
  sheen: number;

  /** Sheen roughness */
  sheenRoughness: number;

  /** Anisotropy for directional reflections (-1 to 1) */
  anisotropy: number;
}

// ============================================================================
// OPTICAL PROPERTIES
// ============================================================================

export interface OpticalProperties {
  /** Base color */
  color: string;

  /** Emissive color (for glowing materials) */
  emissive: string;

  /** Emissive intensity */
  emissiveIntensity: number;

  /** Spectral dispersion strength (rainbow fire in diamonds) */
  dispersion: number;

  /** Subsurface scattering color */
  subsurfaceColor: string;

  /** Subsurface scattering intensity */
  subsurfaceIntensity: number;

  /** Iridescence intensity (color shift with angle) */
  iridescence: number;

  /** Iridescence IOR */
  iridescenceIOR: number;

  /** Environment map intensity */
  envMapIntensity: number;
}

// ============================================================================
// UNIQUE EFFECTS
// ============================================================================

export type MaterialEffectType =
  | 'spectralDispersion'    // Diamond rainbow fire
  | 'playOfColor'           // Opal color play
  | 'labradorescence'       // Labradorite flash
  | 'asterism'              // Star sapphire effect
  | 'chatoyancy'            // Cat's eye effect
  | 'adularescence'         // Moonstone glow
  | 'alexandriteEffect'     // Color change daylight/incandescent
  | 'phantomInclusions'     // Quartz ghost crystals
  | 'trappedParticles'      // Amber inclusions
  | 'conchoidal'            // Obsidian fracture pattern
  | 'rainbowSheen'          // Thin-film interference
  | 'piezoelectric'         // Quartz audio pulse
  | 'volcanoicFlow'         // Obsidian flow lines
  | 'crystallineGrowth';    // Crystal formation pattern

export interface MaterialEffect {
  type: MaterialEffectType;
  intensity: number;
  params: Record<string, number | string | boolean>;
}

// ============================================================================
// AUDIO REACTIVITY
// ============================================================================

export type AudioBand =
  | 'subBass'     // 20-60 Hz
  | 'bass'        // 60-250 Hz
  | 'lowMid'      // 250-500 Hz
  | 'mid'         // 500-2000 Hz
  | 'highMid'     // 2000-4000 Hz
  | 'presence'    // 4000-6000 Hz
  | 'brilliance'; // 6000-20000 Hz

export type AudioTarget =
  | 'scale'
  | 'emissive'
  | 'roughness'
  | 'dispersion'
  | 'rotation'
  | 'effectIntensity'
  | 'color';

export interface AudioMapping {
  band: AudioBand;
  target: AudioTarget;
  multiplier: number;
  smoothing: number;
}

// ============================================================================
// GEOLOGICAL STORY
// ============================================================================

export interface GeologicalStory {
  /** Title for story mode */
  title: string;

  /** Formation description */
  description: string;

  /** Formation time scale */
  timeScale: string;

  /** Formation conditions */
  conditions: string;

  /** Animation keyframes */
  keyframes: GeologicalKeyframe[];
}

export interface GeologicalKeyframe {
  time: number;  // 0-1 normalized
  label: string;
  properties: Partial<PhysicalProperties & OpticalProperties>;
  cameraPosition?: { x: number; y: number; z: number };
}

// ============================================================================
// MATERIAL DEFINITION
// ============================================================================

export interface MaterialDefinition {
  /** Unique identifier */
  id: string;

  /** Display name */
  name: string;

  /** Material category */
  category: MaterialCategory;

  /** Tier (for monetization) */
  tier: MaterialTier;

  /** Short description */
  description: string;

  /** Icon emoji */
  icon: string;

  /** Physical properties */
  physical: PhysicalProperties;

  /** Optical properties */
  optical: OpticalProperties;

  /** Unique visual effects */
  effects: MaterialEffect[];

  /** Audio reactivity mappings */
  audioMappings: AudioMapping[];

  /** Geological formation story */
  geologicalStory: GeologicalStory;

  /** Material "personality" for AI-like behavior */
  personality: MaterialPersonality;
}

// ============================================================================
// MATERIAL PERSONALITY (Joy Team Feature)
// ============================================================================

export interface MaterialPersonality {
  /** One-word trait */
  trait: string;

  /** Mood adjective */
  mood: string;

  /** Response to high energy audio */
  highEnergyResponse: 'amplify' | 'absorb' | 'transform' | 'resist';

  /** Response to calm audio */
  calmResponse: 'glow' | 'settle' | 'pulse' | 'shimmer';

  /** Spinoza concept alignment */
  conatus: string;
}

// ============================================================================
// MATERIAL PRESET
// ============================================================================

export interface MaterialPreset {
  id: string;
  name: string;
  materialId: string;
  overrides: Partial<PhysicalProperties & OpticalProperties>;
}
