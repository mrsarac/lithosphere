/**
 * Collision Detection & Response Service - Lithosphere v5.0.0-alpha.2
 * 
 * Handles sphere-sphere collision detection and various response modes.
 * Part of the Three-Body Problem physics simulation.
 */

import * as THREE from 'three';

export type CollisionMode = 'none' | 'bounce' | 'merge' | 'scatter';

export interface CollisionConfig {
  enabled: boolean;
  mode: CollisionMode;
  elasticity: number;       // 0-1, bounce energy retention
  effectEnabled: boolean;   // Visual flash on collision
  effectDuration: number;   // ms
  mergeThreshold: number;   // Distance for merge mode
  scatterForce: number;     // Force multiplier for scatter
}

export interface CollisionEvent {
  instanceA: string;
  instanceB: string;
  point: THREE.Vector3;
  normal: THREE.Vector3;
  relativeVelocity: number;
  time: number;
}

export interface InstancePhysics {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  radius: number;
  mass: number;
}

export const DEFAULT_COLLISION_CONFIG: CollisionConfig = {
  enabled: true,
  mode: 'bounce',
  elasticity: 0.8,
  effectEnabled: true,
  effectDuration: 200,
  mergeThreshold: 0.1,
  scatterForce: 2.0,
};

/**
 * Check for collision between two spheres
 */
export function checkSphereSphereCollision(
  a: InstancePhysics,
  b: InstancePhysics
): { collided: boolean; overlap: number; normal: THREE.Vector3 } {
  const diff = new THREE.Vector3().subVectors(b.position, a.position);
  const distance = diff.length();
  const combinedRadius = a.radius + b.radius;
  
  if (distance < combinedRadius && distance > 0.001) {
    return {
      collided: true,
      overlap: combinedRadius - distance,
      normal: diff.normalize(),
    };
  }
  
  return {
    collided: false,
    overlap: 0,
    normal: new THREE.Vector3(),
  };
}

/**
 * Resolve collision with bounce response (elastic collision)
 */
export function resolveBounceCollision(
  a: InstancePhysics,
  b: InstancePhysics,
  normal: THREE.Vector3,
  overlap: number,
  elasticity: number
): void {
  // Separate overlapping objects
  const separation = normal.clone().multiplyScalar(overlap * 0.5);
  a.position.sub(separation);
  b.position.add(separation);

  // Calculate relative velocity
  const relativeVelocity = new THREE.Vector3().subVectors(a.velocity, b.velocity);
  const velocityAlongNormal = relativeVelocity.dot(normal);

  // Don't resolve if objects are moving apart
  if (velocityAlongNormal > 0) return;

  // Calculate impulse
  const totalMass = a.mass + b.mass;
  const impulse = -(1 + elasticity) * velocityAlongNormal / totalMass;
  const impulseVector = normal.clone().multiplyScalar(impulse);

  // Apply impulse
  a.velocity.add(impulseVector.clone().multiplyScalar(b.mass));
  b.velocity.sub(impulseVector.clone().multiplyScalar(a.mass));
}

/**
 * Resolve collision with scatter response (explosion-like)
 */
export function resolveScatterCollision(
  a: InstancePhysics,
  b: InstancePhysics,
  normal: THREE.Vector3,
  overlap: number,
  scatterForce: number
): void {
  // Separate objects
  const separation = normal.clone().multiplyScalar(overlap * 0.5);
  a.position.sub(separation);
  b.position.add(separation);

  // Apply scatter force in opposite directions
  const force = scatterForce / Math.max(a.mass, 0.1);
  a.velocity.sub(normal.clone().multiplyScalar(force));
  b.velocity.add(normal.clone().multiplyScalar(force / Math.max(b.mass / a.mass, 0.1)));

  // Add some randomness for chaotic scatter
  const randomAngle = Math.random() * Math.PI * 2;
  const perpendicular = new THREE.Vector3(
    Math.cos(randomAngle),
    Math.sin(randomAngle) * 0.5,
    Math.sin(randomAngle)
  ).multiplyScalar(force * 0.3);
  
  a.velocity.add(perpendicular);
  b.velocity.sub(perpendicular);
}

/**
 * Check if instances should merge (for merge mode)
 */
export function shouldMerge(
  a: InstancePhysics,
  b: InstancePhysics,
  threshold: number
): boolean {
  const distance = a.position.distanceTo(b.position);
  const combinedRadius = a.radius + b.radius;
  return distance < combinedRadius * threshold;
}

/**
 * Process all collisions for a list of instances
 */
export function processCollisions(
  instances: InstancePhysics[],
  config: CollisionConfig,
  onCollision?: (event: CollisionEvent) => void
): CollisionEvent[] {
  if (!config.enabled || config.mode === 'none') {
    return [];
  }

  const events: CollisionEvent[] = [];

  // Check all pairs (O(n²) - could optimize with spatial partitioning)
  for (let i = 0; i < instances.length; i++) {
    for (let j = i + 1; j < instances.length; j++) {
      const a = instances[i];
      const b = instances[j];

      const { collided, overlap, normal } = checkSphereSphereCollision(a, b);

      if (collided) {
        // Create collision event
        const event: CollisionEvent = {
          instanceA: a.id,
          instanceB: b.id,
          point: new THREE.Vector3().addVectors(a.position, b.position).multiplyScalar(0.5),
          normal: normal.clone(),
          relativeVelocity: new THREE.Vector3().subVectors(a.velocity, b.velocity).length(),
          time: performance.now(),
        };
        events.push(event);

        // Resolve based on mode
        switch (config.mode) {
          case 'bounce':
            resolveBounceCollision(a, b, normal, overlap, config.elasticity);
            break;
          case 'scatter':
            resolveScatterCollision(a, b, normal, overlap, config.scatterForce);
            break;
          case 'merge':
            // Merge handling should be done at a higher level
            // Here we just prevent overlap
            const separation = normal.clone().multiplyScalar(overlap * 0.5);
            a.position.sub(separation);
            b.position.add(separation);
            break;
        }

        // Trigger callback if provided
        if (onCollision) {
          onCollision(event);
        }
      }
    }
  }

  return events;
}

/**
 * Create collision flash effect data
 */
export function createCollisionEffect(
  event: CollisionEvent,
  config: CollisionConfig
): {
  position: THREE.Vector3;
  intensity: number;
  startTime: number;
  duration: number;
} | null {
  if (!config.effectEnabled) return null;

  return {
    position: event.point.clone(),
    intensity: Math.min(event.relativeVelocity * 0.5, 1.0),
    startTime: event.time,
    duration: config.effectDuration,
  };
}

/**
 * Spatial hash for O(n) collision detection (optimization for many instances)
 */
export class SpatialHash {
  private cellSize: number;
  private cells: Map<string, InstancePhysics[]>;

  constructor(cellSize: number = 2.0) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  private getKey(x: number, y: number, z: number): string {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    const cz = Math.floor(z / this.cellSize);
    return `${cx},${cy},${cz}`;
  }

  clear(): void {
    this.cells.clear();
  }

  insert(instance: InstancePhysics): void {
    const key = this.getKey(
      instance.position.x,
      instance.position.y,
      instance.position.z
    );
    
    if (!this.cells.has(key)) {
      this.cells.set(key, []);
    }
    this.cells.get(key)!.push(instance);
  }

  getNearby(instance: InstancePhysics): InstancePhysics[] {
    const nearby: InstancePhysics[] = [];
    const pos = instance.position;
    
    // Check 3x3x3 neighborhood
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const key = this.getKey(
            pos.x + dx * this.cellSize,
            pos.y + dy * this.cellSize,
            pos.z + dz * this.cellSize
          );
          const cell = this.cells.get(key);
          if (cell) {
            nearby.push(...cell.filter(i => i.id !== instance.id));
          }
        }
      }
    }
    
    return nearby;
  }
}
