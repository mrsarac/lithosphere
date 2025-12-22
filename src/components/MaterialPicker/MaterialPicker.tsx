/**
 * LITHOSPHERE v7.0 - Material Picker Component
 *
 * Browse and switch materials with live preview.
 * Features:
 * - Category-based navigation
 * - Material cards with icons and descriptions
 * - Live preview on hover
 * - Tier indicators (free, creator, pro, studio)
 * - Variety selection for each material
 */

import React, { useState, useCallback, useMemo } from 'react';
import type { MaterialDefinition, MaterialCategory, MaterialTier } from '../../../materials/types';
import { materialRegistry, CORE_MATERIALS } from '../../../materials';
import './MaterialPicker.css';

// ============================================================================
// TYPES
// ============================================================================

interface MaterialPickerProps {
  onMaterialSelect: (materialId: string) => void;
  currentMaterialId: string | null;
  userTier?: MaterialTier;
  isOpen: boolean;
  onClose: () => void;
}

interface CategoryConfig {
  id: MaterialCategory;
  label: string;
  icon: string;
  description: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CATEGORIES: CategoryConfig[] = [
  {
    id: 'gemstone',
    label: 'Gemstones',
    icon: '💎',
    description: 'Precious crystalline minerals',
  },
  {
    id: 'volcanic',
    label: 'Volcanic',
    icon: '🌋',
    description: 'Formed by fire and rapid cooling',
  },
  {
    id: 'crystalline',
    label: 'Crystalline',
    icon: '🔮',
    description: 'Ordered crystal structures',
  },
  {
    id: 'organic',
    label: 'Organic',
    icon: '🪨',
    description: 'From ancient life processes',
  },
  {
    id: 'exotic',
    label: 'Exotic',
    icon: '🌈',
    description: 'Rare optical phenomena',
  },
];

const TIER_CONFIG: Record<MaterialTier, { label: string; color: string; icon: string }> = {
  free: { label: 'Free', color: '#4CAF50', icon: '✓' },
  creator: { label: 'Creator', color: '#2196F3', icon: '★' },
  pro: { label: 'Pro', color: '#9C27B0', icon: '⬡' },
  studio: { label: 'Studio', color: '#FF9800', icon: '◆' },
};

// ============================================================================
// COMPONENT
// ============================================================================

export const MaterialPicker: React.FC<MaterialPickerProps> = ({
  onMaterialSelect,
  currentMaterialId,
  userTier = 'free',
  isOpen,
  onClose,
}) => {
  const [activeCategory, setActiveCategory] = useState<MaterialCategory>('gemstone');
  const [hoveredMaterial, setHoveredMaterial] = useState<string | null>(null);

  // Get all materials
  const allMaterials = useMemo(() => {
    return Object.values(CORE_MATERIALS);
  }, []);

  // Filter materials by category
  const filteredMaterials = useMemo(() => {
    return allMaterials.filter((m) => m.category === activeCategory);
  }, [allMaterials, activeCategory]);

  // Check if material is accessible for user's tier
  const isMaterialAccessible = useCallback(
    (material: MaterialDefinition): boolean => {
      const tierOrder: MaterialTier[] = ['free', 'creator', 'pro', 'studio'];
      return tierOrder.indexOf(material.tier) <= tierOrder.indexOf(userTier);
    },
    [userTier]
  );

  // Handle material selection
  const handleMaterialClick = useCallback(
    (material: MaterialDefinition) => {
      if (isMaterialAccessible(material)) {
        onMaterialSelect(material.id);
      }
    },
    [isMaterialAccessible, onMaterialSelect]
  );

  // Handle category change
  const handleCategoryChange = useCallback((category: MaterialCategory) => {
    setActiveCategory(category);
  }, []);

  // Get material count per category
  const getCategoryCount = useCallback(
    (category: MaterialCategory): number => {
      return allMaterials.filter((m) => m.category === category).length;
    },
    [allMaterials]
  );

  if (!isOpen) return null;

  return (
    <div className="material-picker-overlay" onClick={onClose}>
      <div className="material-picker" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="material-picker-header">
          <h2>
            <span className="header-icon">💎</span>
            Material Library
          </h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Category Tabs */}
        <div className="category-tabs">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              className={`category-tab ${activeCategory === category.id ? 'active' : ''}`}
              onClick={() => handleCategoryChange(category.id)}
              title={category.description}
            >
              <span className="category-icon">{category.icon}</span>
              <span className="category-label">{category.label}</span>
              <span className="category-count">{getCategoryCount(category.id)}</span>
            </button>
          ))}
        </div>

        {/* Materials Grid */}
        <div className="materials-grid">
          {filteredMaterials.map((material) => {
            const isAccessible = isMaterialAccessible(material);
            const isSelected = currentMaterialId === material.id;
            const isHovered = hoveredMaterial === material.id;
            const tierConfig = TIER_CONFIG[material.tier];

            return (
              <div
                key={material.id}
                className={`material-card ${isSelected ? 'selected' : ''} ${
                  !isAccessible ? 'locked' : ''
                } ${isHovered ? 'hovered' : ''}`}
                onClick={() => handleMaterialClick(material)}
                onMouseEnter={() => setHoveredMaterial(material.id)}
                onMouseLeave={() => setHoveredMaterial(null)}
              >
                {/* Material Icon */}
                <div className="material-icon">{material.icon}</div>

                {/* Material Info */}
                <div className="material-info">
                  <h3 className="material-name">{material.name}</h3>
                  <p className="material-description">{material.description}</p>
                </div>

                {/* Tier Badge */}
                <div
                  className="tier-badge"
                  style={{ backgroundColor: tierConfig.color }}
                  title={`${tierConfig.label} Tier`}
                >
                  {tierConfig.icon}
                </div>

                {/* Lock Overlay */}
                {!isAccessible && (
                  <div className="lock-overlay">
                    <span className="lock-icon">🔒</span>
                    <span className="lock-text">Upgrade to {tierConfig.label}</span>
                  </div>
                )}

                {/* Selection Indicator */}
                {isSelected && <div className="selection-indicator">✓</div>}

                {/* Hover Preview Info */}
                {isHovered && isAccessible && (
                  <div className="hover-preview">
                    <div className="preview-stats">
                      <div className="stat">
                        <span className="stat-label">IOR</span>
                        <span className="stat-value">{material.physical.ior.toFixed(2)}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Dispersion</span>
                        <span className="stat-value">{material.optical.dispersion.toFixed(3)}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Transmission</span>
                        <span className="stat-value">{Math.round(material.physical.transmission * 100)}%</span>
                      </div>
                    </div>
                    <div className="preview-personality">
                      <span className="personality-trait">{material.personality.trait}</span>
                      <span className="personality-mood">{material.personality.mood}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Material Detail Panel (shown when material is hovered) */}
        {hoveredMaterial && (
          <MaterialDetailPanel
            material={allMaterials.find((m) => m.id === hoveredMaterial)!}
          />
        )}

        {/* Footer */}
        <div className="material-picker-footer">
          <div className="footer-info">
            <span className="material-count">
              {filteredMaterials.length} materials in {CATEGORIES.find((c) => c.id === activeCategory)?.label}
            </span>
          </div>
          <div className="footer-actions">
            <button className="action-button" onClick={() => onMaterialSelect('random')}>
              🎲 Random
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MATERIAL DETAIL PANEL
// ============================================================================

interface MaterialDetailPanelProps {
  material: MaterialDefinition;
}

const MaterialDetailPanel: React.FC<MaterialDetailPanelProps> = ({ material }) => {
  return (
    <div className="material-detail-panel">
      <div className="detail-header">
        <span className="detail-icon">{material.icon}</span>
        <h3>{material.name}</h3>
      </div>

      <div className="detail-section">
        <h4>Physical Properties</h4>
        <div className="property-grid">
          <PropertyItem label="IOR" value={material.physical.ior.toFixed(2)} />
          <PropertyItem label="Roughness" value={material.physical.roughness.toFixed(2)} />
          <PropertyItem label="Metalness" value={material.physical.metalness.toFixed(2)} />
          <PropertyItem label="Transmission" value={`${Math.round(material.physical.transmission * 100)}%`} />
        </div>
      </div>

      <div className="detail-section">
        <h4>Optical Properties</h4>
        <div className="property-grid">
          <PropertyItem label="Dispersion" value={material.optical.dispersion.toFixed(3)} />
          <PropertyItem label="Iridescence" value={material.optical.iridescence.toFixed(2)} />
          <PropertyItem label="Env Map" value={material.optical.envMapIntensity.toFixed(1)} />
        </div>
      </div>

      <div className="detail-section">
        <h4>Geological Story</h4>
        <p className="story-title">{material.geologicalStory.title}</p>
        <p className="story-description">{material.geologicalStory.description}</p>
        <div className="story-meta">
          <span className="meta-item">⏱️ {material.geologicalStory.timeScale}</span>
        </div>
      </div>

      <div className="detail-section">
        <h4>Personality</h4>
        <div className="personality-info">
          <span className="trait-badge">{material.personality.trait}</span>
          <span className="mood-badge">{material.personality.mood}</span>
        </div>
        <p className="conatus-text">"{material.personality.conatus}"</p>
      </div>

      <div className="detail-section">
        <h4>Audio Reactivity</h4>
        <div className="audio-mappings">
          {material.audioMappings.map((mapping, index) => (
            <div key={index} className="audio-mapping">
              <span className="band">{mapping.band}</span>
              <span className="arrow">→</span>
              <span className="target">{mapping.target}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

interface PropertyItemProps {
  label: string;
  value: string;
}

const PropertyItem: React.FC<PropertyItemProps> = ({ label, value }) => (
  <div className="property-item">
    <span className="property-label">{label}</span>
    <span className="property-value">{value}</span>
  </div>
);

export default MaterialPicker;
