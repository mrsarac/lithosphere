/**
 * LITHOSPHERE v7.0 - Surface Pattern Effects
 *
 * TSL effects for surface textures: fractures, flow lines, crystal patterns.
 * Used by: Obsidian (conchoidal), Quartz (crystalline), Agate (banding)
 */

import {
  float,
  vec3,
  vec4,
  vec2,
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
  sqrt,
} from 'three/tsl';
import { Color } from 'three';

// ============================================================================
// CONCHOIDAL FRACTURE (Obsidian)
// ============================================================================

/**
 * Creates conchoidal (shell-like) fracture pattern
 * Characteristic of volcanic glass fracture surfaces
 */
export function createConchoidalFracture(
  frequency: number = 5.0,
  intensity: number = 0.3
) {
  const pos = positionWorld;
  const viewDir = normalize(sub(cameraPosition, positionWorld));

  // Concentric ripple pattern from impact point
  const dist = length(vec3(pos.x, mul(pos.y, float(0.5)), pos.z));
  const ripple = sin(mul(dist, float(frequency)));

  // Multiple impact points for complex fracture
  const dist2 = length(sub(pos, vec3(0.2, 0.1, -0.1)));
  const ripple2 = sin(mul(dist2, float(frequency * 1.3)));

  const dist3 = length(sub(pos, vec3(-0.15, -0.1, 0.2)));
  const ripple3 = sin(mul(dist3, float(frequency * 0.8)));

  // Combine fracture patterns
  const fracture = mul(
    add(add(ripple, ripple2), ripple3),
    float(intensity / 3.0)
  );

  // Edge highlighting (fresnel-like)
  const edgeFactor = pow(sub(float(1.0), abs(dot(normalWorld, viewDir))), float(2.0));

  return mul(fracture, add(float(1.0), edgeFactor));
}

/**
 * Creates sharp edge fracture lines
 * The actual crack lines in obsidian
 */
export function createFractureLines(
  lineFrequency: number = 20.0,
  lineSharpness: number = 50.0
) {
  const pos = positionWorld;

  // Generate crack lines using modulo pattern
  const linePattern1 = abs(sin(mul(add(pos.x, mul(pos.y, float(0.7))), float(lineFrequency))));
  const linePattern2 = abs(sin(mul(add(pos.z, mul(pos.y, float(0.5))), float(lineFrequency * 0.8))));

  // Sharpen to create distinct lines
  const line1 = pow(linePattern1, float(lineSharpness));
  const line2 = pow(linePattern2, float(lineSharpness));

  // Combine
  const lines = max(line1, line2);

  return mul(lines, float(0.5));
}

// ============================================================================
// VOLCANIC FLOW LINES (Obsidian)
// ============================================================================

/**
 * Creates flowing texture from lava cooling
 * Curved lines showing flow direction
 */
export function createVolcanicFlow(
  flowSpeed: number = 0.2,
  flowScale: number = 3.0,
  animated: boolean = true
) {
  const pos = positionWorld;
  const t = animated ? mul(time, float(flowSpeed)) : float(0);

  // Flow direction (curved)
  const flowX = sin(mul(add(pos.y, t), float(flowScale)));
  const flowZ = cos(mul(add(pos.y, t), float(flowScale * 0.7)));

  // Displaced position
  const flowedPos = add(pos, mul(vec3(flowX, float(0), flowZ), float(0.1)));

  // Create flow lines
  const flowLine = sin(mul(flowedPos.x, float(30.0)));
  const flowIntensity = mul(add(flowLine, float(1.0)), float(0.5));

  return flowIntensity;
}

/**
 * Creates banded flow pattern (mahogany obsidian style)
 */
export function createBandedFlow(
  bandCount: number = 8,
  bandColor1: string = '#1a1a1a',
  bandColor2: string = '#4a3c2c'
) {
  const pos = positionWorld;

  // Wavy bands based on Y position
  const waveOffset = mul(sin(mul(pos.x, float(5.0))), float(0.05));
  const bandY = add(pos.y, waveOffset);

  // Band pattern
  const band = mul(add(sin(mul(bandY, float(bandCount * 6.28))), float(1.0)), float(0.5));

  // Mix colors
  const color1 = color(new Color(bandColor1));
  const color2 = color(new Color(bandColor2));

  return mix(color1, color2, band);
}

// ============================================================================
// CRYSTALLINE GROWTH (Quartz)
// ============================================================================

/**
 * Creates hexagonal crystal growth pattern
 * Typical of quartz crystal structure
 */
export function createHexagonalPattern(scale: number = 5.0) {
  const pos = positionWorld;

  // Convert to hexagonal grid coordinates
  const hexScale = float(scale);
  const q = div(sub(mul(pos.x, float(1.1547)), mul(pos.z, float(0.5774))), hexScale);
  const r = div(pos.z, mul(hexScale, float(0.866)));

  // Round to nearest hex center
  const qRound = floor(add(q, float(0.5)));
  const rRound = floor(add(r, float(0.5)));

  // Distance to hex center
  const qFrac = sub(q, qRound);
  const rFrac = sub(r, rRound);
  const hexDist = max(max(abs(qFrac), abs(rFrac)), abs(add(qFrac, rFrac)));

  // Create hex pattern
  const hex = smoothstep(float(0.4), float(0.5), hexDist);

  return hex;
}

/**
 * Creates prismatic crystal facets
 */
export function createPrismaticFacets(facetCount: number = 6) {
  const pos = positionWorld;
  const viewDir = normalize(sub(cameraPosition, positionWorld));

  // Angle around crystal axis
  const angle = add(
    mul(
      div(
        add(float(Math.PI), atan2(pos.z, pos.x)),
        float(2.0 * Math.PI)
      ),
      float(facetCount)
    ),
    float(0)
  );

  // Facet boundaries
  const facetAngle = fract(angle);
  const facetEdge = min(facetAngle, sub(float(1.0), facetAngle));
  const facetLine = smoothstep(float(0.0), float(0.05), facetEdge);

  // Facet normal variation for specular
  const facetNormalShift = mul(
    floor(angle),
    float(Math.PI / facetCount)
  );

  return facetLine;
}

// Helper: atan2 approximation for TSL
function atan2(y: ReturnType<typeof float>, x: ReturnType<typeof float>) {
  // Simple atan2 approximation
  const angle = mul(
    div(y, add(abs(x), float(0.0001))),
    float(1.0)
  );
  return mul(angle, float(Math.PI / 4));
}

// ============================================================================
// PIEZOELECTRIC PULSE (Quartz)
// ============================================================================

/**
 * Creates pulsing glow effect simulating piezoelectric discharge
 * Quartz generates voltage under pressure
 */
export function createPiezoelectricPulse(
  pulseSpeed: number = 2.0,
  glowColor: string = '#e6e6fa',
  audioReactive: boolean = true
) {
  const pos = positionWorld;
  const t = mul(time, float(pulseSpeed));

  // Pulse wave from center
  const dist = length(pos);
  const pulse = mul(
    pow(add(sin(sub(mul(dist, float(10.0)), t)), float(1.0)), float(2.0)),
    float(0.25)
  );

  // Crystal termination glow (ends of crystal)
  const termGlow = pow(abs(pos.y), float(2.0));
  const terminationPulse = mul(termGlow, pulse);

  // Apply glow color
  const glow = color(new Color(glowColor));
  return mul(glow, terminationPulse);
}

// ============================================================================
// AGATE BANDING
// ============================================================================

/**
 * Creates concentric agate banding pattern
 */
export function createAgateBanding(
  bandCount: number = 12,
  colors: string[] = ['#8b4513', '#deb887', '#f5f5dc', '#d2691e']
) {
  const pos = positionWorld;

  // Distance from center for concentric bands
  const dist = length(vec3(pos.x, float(0), pos.z));

  // Add some waviness
  const wave = mul(sin(mul(pos.y, float(10.0))), float(0.02));
  const bandDist = add(dist, wave);

  // Band index
  const bandPhase = mul(bandDist, float(bandCount));
  const bandIndex = mod(floor(bandPhase), float(colors.length));

  // Interpolate between bands
  const bandFrac = fract(bandPhase);
  const bandBlend = smoothstep(float(0.4), float(0.6), bandFrac);

  // Create color stops
  const color0 = color(new Color(colors[0]));
  const color1 = color(new Color(colors[1 % colors.length]));

  return mix(color0, color1, bandBlend);
}

// ============================================================================
// MOSS/DENDRITE INCLUSIONS
// ============================================================================

/**
 * Creates moss-like dendritic patterns (moss agate)
 */
export function createDendriticPattern(
  complexity: number = 5,
  mossColor: string = '#228b22'
) {
  const pos = positionWorld;

  // Fractal-like branching using noise
  let dendrite = float(0.0);

  for (let i = 0; i < complexity; i++) {
    const scale = Math.pow(2, i);
    const scaledPos = mul(pos, float(scale * 10));

    // Branch pattern
    const branch = mul(
      sin(mul(scaledPos.x, float(1.0))),
      cos(mul(scaledPos.z, float(1.3)))
    );

    dendrite = add(dendrite, mul(branch, float(1.0 / scale)));
  }

  // Threshold to create distinct branches
  const pattern = smoothstep(float(0.3), float(0.5), dendrite);

  const moss = color(new Color(mossColor));
  return mul(moss, pattern);
}

// ============================================================================
// STAR PATTERN (Asterism)
// ============================================================================

/**
 * Creates star sapphire/ruby asterism effect
 * 6-ray star from rutile needle inclusions
 */
export function createAsterism(
  rayCount: number = 6,
  rayIntensity: number = 0.8,
  raySharpness: number = 10.0
) {
  const pos = positionWorld;
  const viewDir = normalize(sub(cameraPosition, positionWorld));

  // Angle from center
  const angle = add(
    div(
      add(float(Math.PI), atan2(pos.z, pos.x)),
      float(2.0 * Math.PI)
    ),
    float(0)
  );

  // Create rays at equal angles
  const rayAngle = mul(angle, float(rayCount));
  const rayPattern = pow(abs(cos(mul(rayAngle, float(Math.PI)))), float(raySharpness));

  // Radial falloff
  const dist = length(vec3(pos.x, float(0), pos.z));
  const falloff = div(float(1.0), add(float(1.0), mul(dist, float(5.0))));

  // View-dependent highlight
  const highlight = pow(max(float(0), dot(normalWorld, viewDir)), float(3.0));

  return mul(mul(rayPattern, falloff), mul(highlight, float(rayIntensity)));
}

// ============================================================================
// CAT'S EYE (Chatoyancy)
// ============================================================================

/**
 * Creates cat's eye effect from parallel fiber inclusions
 */
export function createChatoyancy(
  lineIntensity: number = 0.9,
  lineWidth: number = 0.1
) {
  const pos = positionWorld;
  const viewDir = normalize(sub(cameraPosition, positionWorld));

  // Light band perpendicular to fiber direction
  // Fibers run along Z axis
  const fiberDot = abs(dot(vec3(1, 0, 0), viewDir));

  // Band position based on view angle
  const bandPos = mul(fiberDot, float(2.0));
  const bandDist = abs(sub(pos.x, sub(bandPos, float(1.0))));

  // Sharp band with soft falloff
  const band = sub(float(1.0), smoothstep(float(0.0), float(lineWidth), bandDist));

  return mul(band, float(lineIntensity));
}
