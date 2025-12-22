/**
 * LITHOSPHERE v7.0 - Material Registry
 *
 * Central registry for all materials.
 * Handles material loading, caching, and tier-based access control.
 */

import type {
  MaterialDefinition,
  MaterialCategory,
  MaterialTier,
  MaterialPreset,
} from './types';
import type { BaseMaterial } from './base';

// ============================================================================
// REGISTRY TYPES
// ============================================================================

export interface MaterialConstructor {
  new (definition: MaterialDefinition): BaseMaterial;
}

export interface RegisteredMaterial {
  definition: MaterialDefinition;
  constructor: MaterialConstructor;
  instance?: BaseMaterial;
}

export interface TierAccess {
  free: boolean;
  creator: boolean;
  pro: boolean;
  studio: boolean;
}

// ============================================================================
// MATERIAL REGISTRY
// ============================================================================

export class MaterialRegistry {
  private static instance: MaterialRegistry;
  private materials: Map<string, RegisteredMaterial> = new Map();
  private presets: Map<string, MaterialPreset> = new Map();
  private currentTier: MaterialTier = 'free';
  private activeMaterial: string | null = null;

  private constructor() {}

  public static getInstance(): MaterialRegistry {
    if (!MaterialRegistry.instance) {
      MaterialRegistry.instance = new MaterialRegistry();
    }
    return MaterialRegistry.instance;
  }

  // ============================================================================
  // REGISTRATION
  // ============================================================================

  /**
   * Register a material with its definition and constructor
   */
  public register(
    definition: MaterialDefinition,
    constructor: MaterialConstructor
  ): void {
    this.materials.set(definition.id, {
      definition,
      constructor,
    });

    console.log(`[Registry] Registered material: ${definition.name} (${definition.id})`);
  }

  /**
   * Register a preset for a material
   */
  public registerPreset(preset: MaterialPreset): void {
    this.presets.set(preset.id, preset);
    console.log(`[Registry] Registered preset: ${preset.name} for ${preset.materialId}`);
  }

  // ============================================================================
  // MATERIAL ACCESS
  // ============================================================================

  /**
   * Get all registered material definitions
   */
  public getAllMaterials(): MaterialDefinition[] {
    return Array.from(this.materials.values()).map((m) => m.definition);
  }

  /**
   * Get materials filtered by category
   */
  public getMaterialsByCategory(category: MaterialCategory): MaterialDefinition[] {
    return this.getAllMaterials().filter((m) => m.category === category);
  }

  /**
   * Get materials filtered by tier (includes lower tiers)
   */
  public getMaterialsByTier(tier: MaterialTier): MaterialDefinition[] {
    const tierOrder: MaterialTier[] = ['free', 'creator', 'pro', 'studio'];
    const maxIndex = tierOrder.indexOf(tier);

    return this.getAllMaterials().filter((m) => {
      const materialTierIndex = tierOrder.indexOf(m.tier);
      return materialTierIndex <= maxIndex;
    });
  }

  /**
   * Get accessible materials for current user tier
   */
  public getAccessibleMaterials(): MaterialDefinition[] {
    return this.getMaterialsByTier(this.currentTier);
  }

  /**
   * Check if a material is accessible
   */
  public isMaterialAccessible(materialId: string): boolean {
    const material = this.materials.get(materialId);
    if (!material) return false;

    const tierOrder: MaterialTier[] = ['free', 'creator', 'pro', 'studio'];
    const materialTierIndex = tierOrder.indexOf(material.definition.tier);
    const userTierIndex = tierOrder.indexOf(this.currentTier);

    return materialTierIndex <= userTierIndex;
  }

  /**
   * Get a material definition by ID
   */
  public getDefinition(materialId: string): MaterialDefinition | null {
    return this.materials.get(materialId)?.definition || null;
  }

  // ============================================================================
  // MATERIAL INSTANTIATION
  // ============================================================================

  /**
   * Create or get a cached material instance
   */
  public getMaterial(materialId: string): BaseMaterial | null {
    const registered = this.materials.get(materialId);
    if (!registered) {
      console.warn(`[Registry] Material not found: ${materialId}`);
      return null;
    }

    // Check tier access
    if (!this.isMaterialAccessible(materialId)) {
      console.warn(`[Registry] Material not accessible for tier ${this.currentTier}: ${materialId}`);
      return null;
    }

    // Return cached instance or create new one
    if (!registered.instance) {
      registered.instance = new registered.constructor(registered.definition);
    }

    return registered.instance;
  }

  /**
   * Create a fresh material instance (not cached)
   */
  public createMaterial(materialId: string): BaseMaterial | null {
    const registered = this.materials.get(materialId);
    if (!registered) return null;
    if (!this.isMaterialAccessible(materialId)) return null;

    return new registered.constructor(registered.definition);
  }

  /**
   * Set the active material
   */
  public setActiveMaterial(materialId: string): BaseMaterial | null {
    const material = this.getMaterial(materialId);
    if (material) {
      this.activeMaterial = materialId;
    }
    return material;
  }

  /**
   * Get the active material
   */
  public getActiveMaterial(): BaseMaterial | null {
    if (!this.activeMaterial) return null;
    return this.getMaterial(this.activeMaterial);
  }

  /**
   * Get the active material ID
   */
  public getActiveMaterialId(): string | null {
    return this.activeMaterial;
  }

  // ============================================================================
  // PRESETS
  // ============================================================================

  /**
   * Get all presets for a material
   */
  public getPresetsForMaterial(materialId: string): MaterialPreset[] {
    return Array.from(this.presets.values()).filter(
      (p) => p.materialId === materialId
    );
  }

  /**
   * Apply a preset to a material
   */
  public applyPreset(presetId: string): BaseMaterial | null {
    const preset = this.presets.get(presetId);
    if (!preset) return null;

    const material = this.getMaterial(preset.materialId);
    if (!material) return null;

    // Apply physical property overrides
    for (const [key, value] of Object.entries(preset.overrides)) {
      if (key in material.getDefinition().physical) {
        material.setPhysicalProperty(key as any, value as any);
      } else if (key in material.getDefinition().optical) {
        material.setOpticalProperty(key as any, value as any);
      }
    }

    return material;
  }

  // ============================================================================
  // TIER MANAGEMENT
  // ============================================================================

  /**
   * Set the user's tier level
   */
  public setTier(tier: MaterialTier): void {
    this.currentTier = tier;
    console.log(`[Registry] Tier set to: ${tier}`);
  }

  /**
   * Get the current tier
   */
  public getTier(): MaterialTier {
    return this.currentTier;
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  public getStats(): {
    total: number;
    byCategory: Record<MaterialCategory, number>;
    byTier: Record<MaterialTier, number>;
    accessible: number;
  } {
    const materials = this.getAllMaterials();

    const byCategory: Record<MaterialCategory, number> = {
      gemstone: 0,
      volcanic: 0,
      crystalline: 0,
      organic: 0,
      exotic: 0,
    };

    const byTier: Record<MaterialTier, number> = {
      free: 0,
      creator: 0,
      pro: 0,
      studio: 0,
    };

    for (const m of materials) {
      byCategory[m.category]++;
      byTier[m.tier]++;
    }

    return {
      total: materials.length,
      byCategory,
      byTier,
      accessible: this.getAccessibleMaterials().length,
    };
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  /**
   * Dispose all material instances
   */
  public disposeAll(): void {
    for (const registered of this.materials.values()) {
      if (registered.instance) {
        registered.instance.dispose();
        registered.instance = undefined;
      }
    }
    this.activeMaterial = null;
    console.log('[Registry] All materials disposed');
  }

  /**
   * Dispose a specific material instance
   */
  public dispose(materialId: string): void {
    const registered = this.materials.get(materialId);
    if (registered?.instance) {
      registered.instance.dispose();
      registered.instance = undefined;

      if (this.activeMaterial === materialId) {
        this.activeMaterial = null;
      }
    }
  }
}

// Export singleton instance
export const materialRegistry = MaterialRegistry.getInstance();
export default materialRegistry;
