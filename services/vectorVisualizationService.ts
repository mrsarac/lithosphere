/**
 * Vector Visualization Service - Lithosphere v5.0.0-alpha.2
 * 
 * Renders velocity and force vectors as arrows for physics debugging.
 * Helps visualize the Three-Body Problem dynamics.
 */

import * as THREE from 'three';

export interface VectorConfig {
  velocityEnabled: boolean;
  velocityColor: THREE.Color;
  velocityScale: number;        // Arrow length multiplier
  
  forceEnabled: boolean;
  forceColor: THREE.Color;
  forceScale: number;
  
  arrowHeadLength: number;      // Relative to arrow length
  arrowHeadWidth: number;
  lineWidth: number;
}

export interface VectorSystem {
  velocityArrows: Map<string, THREE.ArrowHelper>;
  forceArrows: Map<string, THREE.ArrowHelper>;
}

export const DEFAULT_VECTOR_CONFIG: VectorConfig = {
  velocityEnabled: false,
  velocityColor: new THREE.Color(0x00ff88),  // Green
  velocityScale: 0.5,
  
  forceEnabled: false,
  forceColor: new THREE.Color(0xff8800),     // Orange
  forceScale: 0.3,
  
  arrowHeadLength: 0.2,
  arrowHeadWidth: 0.1,
  lineWidth: 2,
};

/**
 * Create vector visualization system
 */
export function createVectorSystem(): VectorSystem {
  return {
    velocityArrows: new Map(),
    forceArrows: new Map(),
  };
}

/**
 * Update velocity vector for an instance
 */
export function updateVelocityVector(
  instanceId: string,
  position: THREE.Vector3,
  velocity: THREE.Vector3,
  vectorSystem: VectorSystem,
  scene: THREE.Scene,
  config: VectorConfig
): void {
  if (!config.velocityEnabled) {
    // Remove if disabled
    const existing = vectorSystem.velocityArrows.get(instanceId);
    if (existing) {
      scene.remove(existing);
      vectorSystem.velocityArrows.delete(instanceId);
    }
    return;
  }

  const length = velocity.length() * config.velocityScale;
  
  // Don't show if velocity is too small
  if (length < 0.01) {
    const existing = vectorSystem.velocityArrows.get(instanceId);
    if (existing) {
      existing.visible = false;
    }
    return;
  }

  const direction = velocity.clone().normalize();

  // Get or create arrow
  let arrow = vectorSystem.velocityArrows.get(instanceId);
  
  if (!arrow) {
    arrow = new THREE.ArrowHelper(
      direction,
      position,
      length,
      config.velocityColor.getHex(),
      length * config.arrowHeadLength,
      length * config.arrowHeadWidth
    );
    arrow.name = `velocity_${instanceId}`;
    vectorSystem.velocityArrows.set(instanceId, arrow);
    scene.add(arrow);
  } else {
    arrow.visible = true;
    arrow.position.copy(position);
    arrow.setDirection(direction);
    arrow.setLength(length, length * config.arrowHeadLength, length * config.arrowHeadWidth);
    arrow.setColor(config.velocityColor);
  }
}

/**
 * Update force vector for an instance
 */
export function updateForceVector(
  instanceId: string,
  position: THREE.Vector3,
  force: THREE.Vector3,
  vectorSystem: VectorSystem,
  scene: THREE.Scene,
  config: VectorConfig
): void {
  if (!config.forceEnabled) {
    // Remove if disabled
    const existing = vectorSystem.forceArrows.get(instanceId);
    if (existing) {
      scene.remove(existing);
      vectorSystem.forceArrows.delete(instanceId);
    }
    return;
  }

  const length = force.length() * config.forceScale;
  
  // Don't show if force is too small
  if (length < 0.01) {
    const existing = vectorSystem.forceArrows.get(instanceId);
    if (existing) {
      existing.visible = false;
    }
    return;
  }

  const direction = force.clone().normalize();

  // Get or create arrow
  let arrow = vectorSystem.forceArrows.get(instanceId);
  
  if (!arrow) {
    arrow = new THREE.ArrowHelper(
      direction,
      position,
      length,
      config.forceColor.getHex(),
      length * config.arrowHeadLength,
      length * config.arrowHeadWidth
    );
    arrow.name = `force_${instanceId}`;
    vectorSystem.forceArrows.set(instanceId, arrow);
    scene.add(arrow);
  } else {
    arrow.visible = true;
    arrow.position.copy(position);
    arrow.setDirection(direction);
    arrow.setLength(length, length * config.arrowHeadLength, length * config.arrowHeadWidth);
    arrow.setColor(config.forceColor);
  }
}

/**
 * Remove all vectors for an instance
 */
export function removeVectors(
  instanceId: string,
  vectorSystem: VectorSystem,
  scene: THREE.Scene
): void {
  const velocityArrow = vectorSystem.velocityArrows.get(instanceId);
  if (velocityArrow) {
    scene.remove(velocityArrow);
    vectorSystem.velocityArrows.delete(instanceId);
  }

  const forceArrow = vectorSystem.forceArrows.get(instanceId);
  if (forceArrow) {
    scene.remove(forceArrow);
    vectorSystem.forceArrows.delete(instanceId);
  }
}

/**
 * Clear all vectors
 */
export function clearAllVectors(
  vectorSystem: VectorSystem,
  scene: THREE.Scene
): void {
  vectorSystem.velocityArrows.forEach(arrow => scene.remove(arrow));
  vectorSystem.forceArrows.forEach(arrow => scene.remove(arrow));
  
  vectorSystem.velocityArrows.clear();
  vectorSystem.forceArrows.clear();
}

/**
 * Set visibility for all vectors
 */
export function setVectorsVisible(
  vectorSystem: VectorSystem,
  velocityVisible: boolean,
  forceVisible: boolean
): void {
  vectorSystem.velocityArrows.forEach(arrow => {
    arrow.visible = velocityVisible;
  });
  vectorSystem.forceArrows.forEach(arrow => {
    arrow.visible = forceVisible;
  });
}

/**
 * Energy calculation helpers for visualization
 */
export function calculateKineticEnergy(mass: number, velocity: THREE.Vector3): number {
  // KE = 0.5 * m * v²
  return 0.5 * mass * velocity.lengthSq();
}

export function calculatePotentialEnergy(
  massA: number,
  massB: number,
  distance: number,
  G: number = 1.0
): number {
  // PE = -G * m1 * m2 / r
  if (distance < 0.1) distance = 0.1; // Prevent singularity
  return -G * massA * massB / distance;
}

export function calculateTotalEnergy(
  instances: Array<{
    mass: number;
    velocity: THREE.Vector3;
    position: THREE.Vector3;
  }>,
  G: number = 1.0
): { kinetic: number; potential: number; total: number } {
  let kinetic = 0;
  let potential = 0;

  // Kinetic energy
  for (const inst of instances) {
    kinetic += calculateKineticEnergy(inst.mass, inst.velocity);
  }

  // Potential energy (all pairs)
  for (let i = 0; i < instances.length; i++) {
    for (let j = i + 1; j < instances.length; j++) {
      const distance = instances[i].position.distanceTo(instances[j].position);
      potential += calculatePotentialEnergy(
        instances[i].mass,
        instances[j].mass,
        distance,
        G
      );
    }
  }

  return {
    kinetic,
    potential,
    total: kinetic + potential,
  };
}

/**
 * Create energy bar data for UI display
 */
export function createEnergyBars(
  instances: Array<{
    id: string;
    mass: number;
    velocity: THREE.Vector3;
  }>
): Array<{ id: string; kinetic: number; normalized: number }> {
  const energies = instances.map(inst => ({
    id: inst.id,
    kinetic: calculateKineticEnergy(inst.mass, inst.velocity),
    normalized: 0,
  }));

  const maxEnergy = Math.max(...energies.map(e => e.kinetic), 0.001);
  
  return energies.map(e => ({
    ...e,
    normalized: e.kinetic / maxEnergy,
  }));
}
