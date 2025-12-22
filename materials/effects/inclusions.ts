/**
 * LITHOSPHERE v7.0 - Inclusion Effects
 *
 * TSL effects for internal features: bubbles, particles, phantoms.
 * Used by: Amber (insects, plants), Quartz (phantoms), Tourmaline
 */

import {
  float,
  vec3,
  vec4,
  color,
  mix,
  sin,
  cos,
  time,
  uv,
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
  mod,
  clamp,
  max,
  min,
  add,
  mul,
  sub,
  div,
  length,
  step,
} from 'three/tsl';
import { Color } from 'three';

// ============================================================================
// TRAPPED PARTICLES (Amber Inclusions)
// ============================================================================

/**
 * Creates floating particle inclusions inside material
 * Simulates trapped insects, plant matter, or bubbles
 * @param density - Particle density (0-1)
 * @param particleSize - Size of particles
 * @param particleColor - Color of particles
 */
export function createTrappedParticles(
  density: number = 0.3,
  particleSize: number = 0.05,
  particleColor: string = '#2d1f14'
) {
  const pos = positionWorld;

  // 3D grid for particle placement
  const gridSize = float(particleSize * 10);
  const cellPos = div(pos, gridSize);
  const cellId = floor(cellPos);

  // Hash function for pseudo-random placement
  const hash = fract(mul(
    sin(dot(cellId, vec3(127.1, 311.7, 74.7))),
    float(43758.5453)
  ));

  // Only show particles based on density
  const showParticle = step(float(1.0 - density), hash);

  // Particle position within cell (random offset)
  const hash2 = fract(mul(
    sin(dot(cellId, vec3(269.5, 183.3, 421.1))),
    float(43758.5453)
  ));
  const hash3 = fract(mul(
    sin(dot(cellId, vec3(419.2, 371.9, 128.5))),
    float(43758.5453)
  ));

  const particleCenter = add(
    mul(cellId, gridSize),
    mul(vec3(hash, hash2, hash3), gridSize)
  );

  // Distance to particle center
  const dist = length(sub(pos, particleCenter));
  const inParticle = sub(float(1.0), smoothstep(float(0.0), float(particleSize), dist));

  // Particle visibility
  const particle = mul(inParticle, showParticle);

  // Apply color
  const pColor = color(new Color(particleColor));
  return mul(pColor, particle);
}

/**
 * Creates bubble inclusions with refraction
 * Air bubbles trapped during formation
 */
export function createBubbleInclusions(
  density: number = 0.2,
  bubbleSize: number = 0.03
) {
  const pos = positionWorld;
  const viewDir = normalize(sub(cameraPosition, positionWorld));

  // Grid-based bubble placement
  const gridSize = float(bubbleSize * 15);
  const cellPos = div(pos, gridSize);
  const cellId = floor(cellPos);

  // Random bubble existence
  const hash = fract(mul(
    sin(dot(cellId, vec3(127.1, 311.7, 74.7))),
    float(43758.5453)
  ));
  const showBubble = step(float(1.0 - density), hash);

  // Bubble position
  const hash2 = fract(mul(hash, float(127.1)));
  const hash3 = fract(mul(hash, float(311.7)));
  const bubbleCenter = add(
    mul(cellId, gridSize),
    mul(vec3(hash, hash2, hash3), gridSize)
  );

  // Spherical bubble shape
  const dist = length(sub(pos, bubbleCenter));
  const inBubble = sub(float(1.0), smoothstep(float(0.0), float(bubbleSize), dist));

  // Fresnel-like rim lighting on bubble
  const bubbleNormal = normalize(sub(pos, bubbleCenter));
  const bubbleFresnel = pow(sub(float(1.0), abs(dot(bubbleNormal, viewDir))), float(2.0));

  // Bubble appears as bright rim
  const bubbleEffect = mul(mul(inBubble, bubbleFresnel), showBubble);

  return mul(vec3(1.0, 1.0, 1.0), bubbleEffect);
}

// ============================================================================
// PHANTOM INCLUSIONS (Quartz Ghosts)
// ============================================================================

/**
 * Creates phantom crystal layers inside quartz
 * Ghost crystals formed during interrupted growth
 */
export function createPhantomInclusions(
  layerCount: number = 3,
  layerOpacity: number = 0.2,
  phantomColor: string = '#d3d3d3'
) {
  const pos = positionWorld;
  const viewDir = normalize(sub(cameraPosition, positionWorld));

  // Calculate distance from center (crystal growth axis)
  const distFromCenter = length(vec3(pos.x, float(0), pos.z));

  // Create concentric phantom layers
  let phantomSum = float(0.0);

  for (let i = 0; i < layerCount; i++) {
    const layerRadius = float((i + 1) * 0.15);
    const layerThickness = float(0.02);

    // Shell at specific radius
    const shell = smoothstep(
      sub(layerRadius, layerThickness),
      layerRadius,
      float(distFromCenter)
    );
    const shellFade = sub(float(1.0), smoothstep(
      layerRadius,
      add(layerRadius, layerThickness),
      float(distFromCenter)
    ));

    phantomSum = add(phantomSum, mul(mul(shell, shellFade), float(1.0 / layerCount)));
  }

  // Apply color with view-dependent opacity
  const opacity = mul(phantomSum, float(layerOpacity));
  const pColor = color(new Color(phantomColor));

  return mul(pColor, opacity);
}

/**
 * Creates chlorite (green) phantom inclusions
 * Common in garden quartz
 */
export function createChloritePhantom(
  intensity: number = 0.5
) {
  const pos = positionWorld;

  // Chlorite typically settles at crystal faces
  const facePattern = abs(sin(mul(pos.y, float(20.0))));

  // Green color with variation
  const greenBase = color(new Color('#228b22'));
  const greenDark = color(new Color('#006400'));

  const phantomColor = mix(greenBase, greenDark, facePattern);

  // Localized to certain depth
  const depth = smoothstep(float(-0.2), float(0.2), pos.y);
  const depthFade = sub(float(1.0), smoothstep(float(0.2), float(0.4), pos.y));

  return mul(phantomColor, mul(mul(depth, depthFade), float(intensity)));
}

// ============================================================================
// RUTILE INCLUSIONS (Rutilated Quartz)
// ============================================================================

/**
 * Creates needle-like rutile inclusions
 * Golden or red needles through clear quartz
 */
export function createRutileNeedles(
  needleCount: number = 5,
  needleColor: string = '#b8860b',
  thickness: number = 0.01
) {
  const pos = positionWorld;
  let needleSum = float(0.0);

  for (let i = 0; i < needleCount; i++) {
    // Random needle direction
    const angle = float((i * 137.5) * (Math.PI / 180)); // Golden angle
    const tilt = float((i * 42.0) * (Math.PI / 180));

    const needleDir = vec3(
      mul(cos(angle), cos(tilt)),
      sin(tilt),
      mul(sin(angle), cos(tilt))
    );

    // Distance from needle axis (line)
    const toPos = pos;
    const projection = mul(needleDir, dot(toPos, needleDir));
    const perpDist = length(sub(toPos, projection));

    // Needle cylinder
    const inNeedle = sub(float(1.0), smoothstep(float(0.0), float(thickness), perpDist));

    needleSum = max(needleSum, inNeedle);
  }

  const nColor = color(new Color(needleColor));
  return mul(nColor, needleSum);
}

// ============================================================================
// TOURMALINE INCLUSIONS
// ============================================================================

/**
 * Creates tourmaline rod inclusions
 * Black or colored rods in quartz
 */
export function createTourmalineRods(
  rodCount: number = 3,
  rodColor: string = '#1a1a1a',
  rodThickness: number = 0.03
) {
  const pos = positionWorld;
  let rodSum = float(0.0);

  for (let i = 0; i < rodCount; i++) {
    // Rods typically grow along c-axis (vertical)
    const offsetX = float((i - rodCount / 2) * 0.1);
    const offsetZ = float(Math.sin(i * 2.4) * 0.1);

    const rodCenter = vec3(offsetX, float(0), offsetZ);
    const toRod = sub(vec3(pos.x, float(0), pos.z), rodCenter);
    const distToRod = length(toRod);

    // Hexagonal cross-section approximation
    const inRod = sub(float(1.0), smoothstep(float(0.0), float(rodThickness), distToRod));

    rodSum = max(rodSum, inRod);
  }

  const rColor = color(new Color(rodColor));
  return mul(rColor, rodSum);
}

// ============================================================================
// GROWTH ZONES (Citrine/Amethyst)
// ============================================================================

/**
 * Creates color zoning from crystal growth
 * Bands of color intensity variation
 */
export function createGrowthZones(
  zoneCount: number = 4,
  baseColor: string = '#9966cc',
  intensityVariation: number = 0.3
) {
  const pos = positionWorld;

  // Distance from crystal center (growth point)
  const dist = length(pos);

  // Concentric growth zones
  const zonePhase = mul(dist, float(zoneCount * 5.0));
  const zone = mul(add(sin(zonePhase), float(1.0)), float(0.5));

  // Color intensity varies with zone
  const baseC = color(new Color(baseColor));
  const lightC = color(new Color('#ffffff'));

  const zonedColor = mix(
    baseC,
    lightC,
    mul(zone, float(intensityVariation))
  );

  return zonedColor;
}
