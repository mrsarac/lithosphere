/**
 * LITHOSPHERE v7.0 - Material System
 *
 * Central export for all materials, types, and utilities.
 *
 * Core Materials (Free Tier):
 * - Diamond: Spectral dispersion, adamantine luster
 * - Obsidian: Volcanic glass, conchoidal fracture, rainbow sheen
 * - Quartz: Piezoelectric, phantom inclusions, prismatic
 * - Amber: Subsurface scattering, trapped particles
 * - Opal: Play of color, silica sphere diffraction
 */

// ============================================================================
// TYPES
// ============================================================================

export type {
  MaterialCategory,
  MaterialTier,
  PhysicalProperties,
  OpticalProperties,
  MaterialEffectType,
  MaterialEffect,
  AudioBand,
  AudioTarget,
  AudioMapping,
  GeologicalStory,
  GeologicalKeyframe,
  MaterialDefinition,
  MaterialPersonality,
  MaterialPreset,
} from './types';

// ============================================================================
// BASE CLASSES
// ============================================================================

export { BaseMaterial } from './base';
export type { AudioData } from './base';

// ============================================================================
// REGISTRY
// ============================================================================

export { materialRegistry } from './registry';
export type { MaterialConstructor, RegisteredMaterial, TierAccess } from './registry';

// ============================================================================
// MATERIALS BY CATEGORY
// ============================================================================

// Gemstones
export { DiamondMaterial, DIAMOND_DEFINITION } from './gemstones';

// Volcanic
export { ObsidianMaterial, OBSIDIAN_DEFINITION } from './volcanic';

// Crystalline
export { QuartzMaterial, QUARTZ_DEFINITION } from './crystalline';

// Organic
export { AmberMaterial, AMBER_DEFINITION } from './organic';

// Exotic
export { OpalMaterial, OPAL_DEFINITION } from './exotic';

// ============================================================================
// EFFECTS
// ============================================================================

export * from './effects';

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

/**
 * All core material definitions
 */
export const CORE_MATERIALS = {
  diamond: DIAMOND_DEFINITION,
  obsidian: OBSIDIAN_DEFINITION,
  quartz: QUARTZ_DEFINITION,
  amber: AMBER_DEFINITION,
  opal: OPAL_DEFINITION,
} as const;

/**
 * All core material constructors
 */
export const MATERIAL_CONSTRUCTORS = {
  diamond: DiamondMaterial,
  obsidian: ObsidianMaterial,
  quartz: QuartzMaterial,
  amber: AmberMaterial,
  opal: OpalMaterial,
} as const;

// ============================================================================
// REGISTRATION HELPER
// ============================================================================

import { materialRegistry } from './registry';
import { DIAMOND_DEFINITION, DiamondMaterial } from './gemstones';
import { OBSIDIAN_DEFINITION, ObsidianMaterial } from './volcanic';
import { QUARTZ_DEFINITION, QuartzMaterial } from './crystalline';
import { AMBER_DEFINITION, AmberMaterial } from './organic';
import { OPAL_DEFINITION, OpalMaterial } from './exotic';

/**
 * Register all core materials with the registry
 */
export function registerCoreMaterials(): void {
  materialRegistry.register(DIAMOND_DEFINITION, DiamondMaterial);
  materialRegistry.register(OBSIDIAN_DEFINITION, ObsidianMaterial);
  materialRegistry.register(QUARTZ_DEFINITION, QuartzMaterial);
  materialRegistry.register(AMBER_DEFINITION, AmberMaterial);
  materialRegistry.register(OPAL_DEFINITION, OpalMaterial);

  console.log('[Materials] Core materials registered:', materialRegistry.getStats());
}

/**
 * Get a material by ID (convenience function)
 */
export function getMaterial(id: string) {
  return materialRegistry.getMaterial(id);
}

/**
 * Get all available materials
 */
export function getAllMaterials() {
  return materialRegistry.getAllMaterials();
}

/**
 * Get materials by category
 */
export function getMaterialsByCategory(category: import('./types').MaterialCategory) {
  return materialRegistry.getMaterialsByCategory(category);
}
