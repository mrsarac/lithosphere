/**
 * Physics Presets - Lithosphere v5.0.0-alpha.2
 * 
 * Famous orbital configurations for the Three-Body Problem.
 * Inspired by Liu Cixin's masterpiece and real astrophysics.
 * 
 * "The universe is a dark forest." - Liu Cixin
 */

import * as THREE from 'three';

export interface OrbitalBody {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  mass: number;
  scale: number;
  color?: THREE.Color;
}

export interface PhysicsPreset {
  id: string;
  name: string;
  description: string;
  emoji: string;
  bodies: OrbitalBody[];
  recommendedSettings: {
    gravityStrength: number;
    gravityType: 'newton' | 'artistic' | 'magnetic';
    damping: number;
    timeScale: number;
    boundaryMode: 'none' | 'bounce' | 'wrap' | 'contain';
    boundaryRadius: number;
  };
}

/**
 * Figure-8 Orbit - The famous stable 3-body solution
 * Discovered by Cris Moore (1993), proven by Chenciner & Montgomery (2000)
 * Three equal masses chase each other in a figure-8 pattern
 */
export const FIGURE_8_PRESET: PhysicsPreset = {
  id: 'figure-8',
  name: 'Figure-8',
  description: 'Stable 3-body orbit discovered in 1993. Three equal masses dance in an infinite loop.',
  emoji: '∞',
  bodies: [
    {
      position: new THREE.Vector3(-0.97000436, 0.24308753, 0),
      velocity: new THREE.Vector3(0.4662036850, 0.4323657300, 0),
      mass: 1.0,
      scale: 0.8,
      color: new THREE.Color(0xff3333), // Red
    },
    {
      position: new THREE.Vector3(0.97000436, -0.24308753, 0),
      velocity: new THREE.Vector3(0.4662036850, 0.4323657300, 0),
      mass: 1.0,
      scale: 0.8,
      color: new THREE.Color(0x33ff33), // Green
    },
    {
      position: new THREE.Vector3(0, 0, 0),
      velocity: new THREE.Vector3(-0.93240737, -0.86473146, 0),
      mass: 1.0,
      scale: 0.8,
      color: new THREE.Color(0x3333ff), // Blue
    },
  ],
  recommendedSettings: {
    gravityStrength: 1.0,
    gravityType: 'newton',
    damping: 0.0,
    timeScale: 1.0,
    boundaryMode: 'none',
    boundaryRadius: 10,
  },
};

/**
 * Binary Star System - Two bodies orbiting each other
 * Classic Kepler problem with optional satellite
 */
export const BINARY_PRESET: PhysicsPreset = {
  id: 'binary',
  name: 'Binary ★',
  description: 'Two massive bodies orbiting their center of mass. A dance as old as the universe.',
  emoji: '★',
  bodies: [
    {
      position: new THREE.Vector3(-1.5, 0, 0),
      velocity: new THREE.Vector3(0, 0.6, 0),
      mass: 2.0,
      scale: 1.2,
      color: new THREE.Color(0xffaa00), // Orange (star)
    },
    {
      position: new THREE.Vector3(1.5, 0, 0),
      velocity: new THREE.Vector3(0, -0.6, 0),
      mass: 2.0,
      scale: 1.2,
      color: new THREE.Color(0xffcc44), // Yellow (star)
    },
  ],
  recommendedSettings: {
    gravityStrength: 0.8,
    gravityType: 'newton',
    damping: 0.0,
    timeScale: 1.0,
    boundaryMode: 'none',
    boundaryRadius: 10,
  },
};

/**
 * Binary + Satellite - Hierarchical 3-body system
 * A small body orbits a binary pair
 */
export const BINARY_SATELLITE_PRESET: PhysicsPreset = {
  id: 'binary-satellite',
  name: 'Binary + Satellite',
  description: 'A tiny moon orbits a binary star system. Stable... for now.',
  emoji: '🌙',
  bodies: [
    {
      position: new THREE.Vector3(-1.0, 0, 0),
      velocity: new THREE.Vector3(0, 0.7, 0),
      mass: 2.0,
      scale: 1.0,
      color: new THREE.Color(0xffaa00),
    },
    {
      position: new THREE.Vector3(1.0, 0, 0),
      velocity: new THREE.Vector3(0, -0.7, 0),
      mass: 2.0,
      scale: 1.0,
      color: new THREE.Color(0xffcc44),
    },
    {
      position: new THREE.Vector3(3.5, 0, 0),
      velocity: new THREE.Vector3(0, 0.45, 0),
      mass: 0.1,
      scale: 0.4,
      color: new THREE.Color(0x888888), // Gray (moon)
    },
  ],
  recommendedSettings: {
    gravityStrength: 0.7,
    gravityType: 'newton',
    damping: 0.0,
    timeScale: 1.0,
    boundaryMode: 'contain',
    boundaryRadius: 8,
  },
};

/**
 * Chaotic Dance - The quintessential three-body chaos
 * Slightly asymmetric initial conditions lead to unpredictable motion
 */
export const CHAOS_PRESET: PhysicsPreset = {
  id: 'chaos',
  name: 'Chaotic Dance',
  description: 'The butterfly effect in action. Tiny differences, massive consequences.',
  emoji: '🌀',
  bodies: [
    {
      position: new THREE.Vector3(-1.5, 0.5, 0),
      velocity: new THREE.Vector3(0.3, 0.2, 0),
      mass: 1.5,
      scale: 0.9,
      color: new THREE.Color(0xff0066),
    },
    {
      position: new THREE.Vector3(1.5, -0.3, 0),
      velocity: new THREE.Vector3(-0.2, 0.4, 0),
      mass: 1.2,
      scale: 0.85,
      color: new THREE.Color(0x00ff66),
    },
    {
      position: new THREE.Vector3(0, -1.2, 0),
      velocity: new THREE.Vector3(-0.1, -0.3, 0),
      mass: 1.0,
      scale: 0.8,
      color: new THREE.Color(0x6600ff),
    },
  ],
  recommendedSettings: {
    gravityStrength: 1.0,
    gravityType: 'newton',
    damping: 0.001, // Tiny damping for stability
    timeScale: 1.0,
    boundaryMode: 'bounce',
    boundaryRadius: 6,
  },
};

/**
 * Lagrange Points Demo - L4 and L5 stable points
 * One massive body with two smaller bodies at triangular points
 */
export const LAGRANGE_PRESET: PhysicsPreset = {
  id: 'lagrange',
  name: 'Lagrange Points',
  description: 'L4 and L5 equilibrium points. Where physics finds peace.',
  emoji: '△',
  bodies: [
    {
      // Central massive body
      position: new THREE.Vector3(0, 0, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      mass: 10.0,
      scale: 1.5,
      color: new THREE.Color(0xffdd00), // Sun
    },
    {
      // L4 point (60° ahead)
      position: new THREE.Vector3(2.0, 3.464, 0), // 60° from horizontal
      velocity: new THREE.Vector3(-0.5, 0.288, 0),
      mass: 0.1,
      scale: 0.4,
      color: new THREE.Color(0x00ddff), // Trojan asteroid
    },
    {
      // L5 point (60° behind)
      position: new THREE.Vector3(2.0, -3.464, 0),
      velocity: new THREE.Vector3(0.5, 0.288, 0),
      mass: 0.1,
      scale: 0.4,
      color: new THREE.Color(0xff00dd), // Greek asteroid
    },
  ],
  recommendedSettings: {
    gravityStrength: 0.5,
    gravityType: 'newton',
    damping: 0.0,
    timeScale: 0.8,
    boundaryMode: 'none',
    boundaryRadius: 10,
  },
};

/**
 * Trisolaran System - Inspired by Liu Cixin
 * Three equal stars in chaotic motion
 */
export const TRISOLARAN_PRESET: PhysicsPreset = {
  id: 'trisolaran',
  name: 'Trisolaran',
  description: '"In chaotic eras, life was uncertain. In stable eras, civilization flourished."',
  emoji: '☀',
  bodies: [
    {
      position: new THREE.Vector3(-2, 0, 0),
      velocity: new THREE.Vector3(0.1, 0.5, 0),
      mass: 3.0,
      scale: 1.1,
      color: new THREE.Color(0xff4400), // Red star
    },
    {
      position: new THREE.Vector3(1, 1.732, 0),
      velocity: new THREE.Vector3(-0.4, -0.1, 0),
      mass: 3.0,
      scale: 1.1,
      color: new THREE.Color(0xff8800), // Orange star
    },
    {
      position: new THREE.Vector3(1, -1.732, 0),
      velocity: new THREE.Vector3(0.3, -0.4, 0),
      mass: 3.0,
      scale: 1.1,
      color: new THREE.Color(0xffcc00), // Yellow star
    },
  ],
  recommendedSettings: {
    gravityStrength: 0.6,
    gravityType: 'newton',
    damping: 0.0,
    timeScale: 0.7,
    boundaryMode: 'contain',
    boundaryRadius: 8,
  },
};

/**
 * Butterfly Effect Demo - Two nearly identical systems
 * Tiny initial difference leads to divergent outcomes
 */
export const BUTTERFLY_PRESET: PhysicsPreset = {
  id: 'butterfly',
  name: 'Butterfly Effect',
  description: 'Does the flap of a butterfly wing cause a tornado?',
  emoji: '🦋',
  bodies: [
    // System A
    {
      position: new THREE.Vector3(-3, 0, 0),
      velocity: new THREE.Vector3(0, 0.5, 0),
      mass: 1.0,
      scale: 0.7,
      color: new THREE.Color(0x4488ff),
    },
    {
      position: new THREE.Vector3(-1.5, 0, 0),
      velocity: new THREE.Vector3(0, -0.5, 0),
      mass: 1.0,
      scale: 0.7,
      color: new THREE.Color(0x4488ff),
    },
    // System B (tiny difference: 0.001 in position)
    {
      position: new THREE.Vector3(1.5, 0.001, 0), // 0.001 difference!
      velocity: new THREE.Vector3(0, 0.5, 0),
      mass: 1.0,
      scale: 0.7,
      color: new THREE.Color(0xff8844),
    },
    {
      position: new THREE.Vector3(3, 0, 0),
      velocity: new THREE.Vector3(0, -0.5, 0),
      mass: 1.0,
      scale: 0.7,
      color: new THREE.Color(0xff8844),
    },
  ],
  recommendedSettings: {
    gravityStrength: 1.0,
    gravityType: 'newton',
    damping: 0.0,
    timeScale: 1.0,
    boundaryMode: 'bounce',
    boundaryRadius: 8,
  },
};

/**
 * All available presets
 */
export const PHYSICS_PRESETS: PhysicsPreset[] = [
  FIGURE_8_PRESET,
  BINARY_PRESET,
  BINARY_SATELLITE_PRESET,
  CHAOS_PRESET,
  LAGRANGE_PRESET,
  TRISOLARAN_PRESET,
  BUTTERFLY_PRESET,
];

/**
 * Get preset by ID
 */
export function getPresetById(id: string): PhysicsPreset | undefined {
  return PHYSICS_PRESETS.find(p => p.id === id);
}

/**
 * Apply preset to scene - returns configuration for creating instances
 */
export function applyPreset(preset: PhysicsPreset): {
  bodies: OrbitalBody[];
  settings: PhysicsPreset['recommendedSettings'];
} {
  // Clone bodies to prevent mutation
  const bodies = preset.bodies.map(body => ({
    position: body.position.clone(),
    velocity: body.velocity.clone(),
    mass: body.mass,
    scale: body.scale,
    color: body.color?.clone(),
  }));

  return {
    bodies,
    settings: { ...preset.recommendedSettings },
  };
}

/**
 * Create random chaotic configuration
 */
export function createRandomChaos(
  bodyCount: number = 3,
  spawnRadius: number = 3,
  maxVelocity: number = 0.5,
  massRange: [number, number] = [0.5, 2.0]
): OrbitalBody[] {
  const bodies: OrbitalBody[] = [];
  const colors = [
    new THREE.Color(0xff3366),
    new THREE.Color(0x33ff66),
    new THREE.Color(0x3366ff),
    new THREE.Color(0xffff33),
    new THREE.Color(0xff33ff),
    new THREE.Color(0x33ffff),
  ];

  for (let i = 0; i < bodyCount; i++) {
    const angle = (i / bodyCount) * Math.PI * 2;
    const radius = spawnRadius * (0.5 + Math.random() * 0.5);
    
    bodies.push({
      position: new THREE.Vector3(
        Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5,
        Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5
      ),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * maxVelocity,
        (Math.random() - 0.5) * maxVelocity,
        (Math.random() - 0.5) * maxVelocity * 0.2
      ),
      mass: massRange[0] + Math.random() * (massRange[1] - massRange[0]),
      scale: 0.6 + Math.random() * 0.4,
      color: colors[i % colors.length],
    });
  }

  return bodies;
}
