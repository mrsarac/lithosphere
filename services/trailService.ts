/**
 * Trail Rendering Service - Lithosphere v5.0.0-alpha.2
 * 
 * Renders orbit trails for physics-enabled instances using THREE.js Line geometry.
 * Inspired by Liu Cixin's Three-Body Problem - visualizing chaotic orbital paths.
 */

import * as THREE from 'three';

export interface TrailPoint {
  position: THREE.Vector3;
  time: number;
  velocity: number;
}

export interface TrailConfig {
  enabled: boolean;
  length: number;           // Max points in trail
  width: number;            // Line width (note: WebGL limitation)
  fade: boolean;            // Opacity fade over distance
  colorMode: 'inherit' | 'velocity' | 'custom';
  customColor: THREE.Color;
  velocityColors: {
    slow: THREE.Color;      // Low velocity color
    fast: THREE.Color;      // High velocity color
  };
}

export interface TrailSystem {
  geometries: Map<string, THREE.BufferGeometry>;
  lines: Map<string, THREE.Line>;
  materials: Map<string, THREE.LineBasicMaterial>;
}

/**
 * Default trail configuration
 */
export const DEFAULT_TRAIL_CONFIG: TrailConfig = {
  enabled: true,
  length: 100,
  width: 2,
  fade: true,
  colorMode: 'velocity',
  customColor: new THREE.Color(0x00ffff),
  velocityColors: {
    slow: new THREE.Color(0x0066ff),   // Blue for slow
    fast: new THREE.Color(0xff3300),   // Red/orange for fast
  },
};

/**
 * Initialize trail system for tracking
 */
export function createTrailSystem(): TrailSystem {
  return {
    geometries: new Map(),
    lines: new Map(),
    materials: new Map(),
  };
}

/**
 * Create or update trail geometry for an instance
 */
export function updateTrailGeometry(
  instanceId: string,
  trailPoints: TrailPoint[],
  trailSystem: TrailSystem,
  scene: THREE.Scene,
  config: TrailConfig,
  instanceColor?: THREE.Color
): void {
  if (!config.enabled || trailPoints.length < 2) {
    // Remove trail if disabled or not enough points
    removeTrail(instanceId, trailSystem, scene);
    return;
  }

  // Get or create geometry
  let geometry = trailSystem.geometries.get(instanceId);
  if (!geometry) {
    geometry = new THREE.BufferGeometry();
    trailSystem.geometries.set(instanceId, geometry);
  }

  // Convert trail points to positions array
  const positions = new Float32Array(trailPoints.length * 3);
  const colors = new Float32Array(trailPoints.length * 3);
  
  // Calculate velocity range for color mapping
  const velocities = trailPoints.map(p => p.velocity);
  const minVel = Math.min(...velocities);
  const maxVel = Math.max(...velocities);
  const velRange = maxVel - minVel || 1;

  trailPoints.forEach((point, i) => {
    // Position
    positions[i * 3] = point.position.x;
    positions[i * 3 + 1] = point.position.y;
    positions[i * 3 + 2] = point.position.z;

    // Color based on mode
    let color: THREE.Color;
    
    switch (config.colorMode) {
      case 'velocity':
        const t = (point.velocity - minVel) / velRange;
        color = config.velocityColors.slow.clone().lerp(config.velocityColors.fast, t);
        break;
      case 'custom':
        color = config.customColor;
        break;
      case 'inherit':
      default:
        color = instanceColor || new THREE.Color(0xffffff);
        break;
    }

    // Apply fade based on position in trail (older = more faded)
    if (config.fade) {
      const fadeT = i / trailPoints.length;
      color.multiplyScalar(0.3 + fadeT * 0.7);
    }

    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  });

  // Update geometry attributes
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.attributes.position.needsUpdate = true;
  geometry.attributes.color.needsUpdate = true;

  // Get or create material
  let material = trailSystem.materials.get(instanceId);
  if (!material) {
    material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      linewidth: config.width, // Note: May not work on all platforms
      blending: THREE.AdditiveBlending,
    });
    trailSystem.materials.set(instanceId, material);
  }

  // Get or create line mesh
  let line = trailSystem.lines.get(instanceId);
  if (!line) {
    line = new THREE.Line(geometry, material);
    line.frustumCulled = false; // Always render trails
    line.name = `trail_${instanceId}`;
    trailSystem.lines.set(instanceId, line);
    scene.add(line);
  }
}

/**
 * Remove trail for an instance
 */
export function removeTrail(
  instanceId: string,
  trailSystem: TrailSystem,
  scene: THREE.Scene
): void {
  const line = trailSystem.lines.get(instanceId);
  if (line) {
    scene.remove(line);
    trailSystem.lines.delete(instanceId);
  }

  const geometry = trailSystem.geometries.get(instanceId);
  if (geometry) {
    geometry.dispose();
    trailSystem.geometries.delete(instanceId);
  }

  const material = trailSystem.materials.get(instanceId);
  if (material) {
    material.dispose();
    trailSystem.materials.delete(instanceId);
  }
}

/**
 * Clear all trails
 */
export function clearAllTrails(
  trailSystem: TrailSystem,
  scene: THREE.Scene
): void {
  trailSystem.lines.forEach((line, id) => {
    scene.remove(line);
  });
  
  trailSystem.geometries.forEach(geo => geo.dispose());
  trailSystem.materials.forEach(mat => mat.dispose());
  
  trailSystem.lines.clear();
  trailSystem.geometries.clear();
  trailSystem.materials.clear();
}

/**
 * Update trail visibility
 */
export function setTrailsVisible(
  trailSystem: TrailSystem,
  visible: boolean
): void {
  trailSystem.lines.forEach(line => {
    line.visible = visible;
  });
}

/**
 * Get trail statistics for debugging
 */
export function getTrailStats(trailSystem: TrailSystem): {
  activeTrails: number;
  totalPoints: number;
} {
  let totalPoints = 0;
  trailSystem.geometries.forEach(geo => {
    const posAttr = geo.getAttribute('position');
    if (posAttr) {
      totalPoints += posAttr.count;
    }
  });

  return {
    activeTrails: trailSystem.lines.size,
    totalPoints,
  };
}
