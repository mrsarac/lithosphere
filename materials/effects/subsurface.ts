/**
 * LITHOSPHERE v7.0 - Subsurface Scattering Effects
 *
 * TSL effects for light transmission through translucent materials.
 * Used by: Amber, Jade, Wax, Skin-like materials
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
  clamp,
  max,
  min,
  add,
  mul,
  sub,
  div,
  exp,
  length,
} from 'three/tsl';
import { Color } from 'three';

// ============================================================================
// SUBSURFACE SCATTERING APPROXIMATION
// ============================================================================

/**
 * Creates basic subsurface scattering effect
 * Light appears to glow through the material
 * @param scatterColor - Color of the scattered light
 * @param scatterDistance - How far light penetrates
 * @param power - Falloff power
 */
export function createSubsurfaceScattering(
  scatterColor: string = '#ffcc00',
  scatterDistance: number = 1.0,
  power: number = 2.0
) {
  const viewDir = normalize(sub(cameraPosition, positionWorld));
  const N = normalWorld;

  // Wrap lighting (light wraps around the surface)
  const NdotV = dot(N, viewDir);
  const wrap = add(NdotV, float(0.5));
  const wrapDiffuse = max(float(0.0), div(wrap, float(1.5)));

  // Subsurface factor (stronger at thin/edge areas)
  const edgeFactor = sub(float(1.0), abs(NdotV));
  const sss = pow(edgeFactor, float(power));

  // Apply scatter color
  const sssColor = color(new Color(scatterColor));
  return mul(sssColor, mul(sss, float(scatterDistance)));
}

/**
 * Advanced SSS with depth-based attenuation
 * Simulates light absorption based on material thickness
 */
export function createDepthBasedSSS(
  scatterColor: string = '#ffaa00',
  absorptionColor: string = '#ff4400',
  thickness: number = 0.5
) {
  const viewDir = normalize(sub(cameraPosition, positionWorld));
  const N = normalWorld;

  // Simulate depth through material
  const cosAngle = abs(dot(N, viewDir));
  const depth = div(float(thickness), max(cosAngle, float(0.01)));

  // Beer-Lambert absorption
  const absorption = exp(mul(float(-depth), float(2.0)));

  // Mix scatter and absorption colors based on depth
  const scatter = color(new Color(scatterColor));
  const absorb = color(new Color(absorptionColor));

  return mix(absorb, scatter, absorption);
}

// ============================================================================
// AMBER-SPECIFIC EFFECTS
// ============================================================================

/**
 * Creates warm amber glow with honey-like appearance
 * Includes internal light scattering and golden tones
 */
export function createAmberGlow(intensity: number = 1.0) {
  const viewDir = normalize(sub(cameraPosition, positionWorld));
  const NdotV = abs(dot(normalWorld, viewDir));

  // Core glow (brighter at center)
  const coreGlow = pow(NdotV, float(1.5));

  // Edge darkening (amber is darker at edges)
  const edgeDark = pow(NdotV, float(0.5));

  // Warm color gradient
  const warmColor = mix(
    color(new Color('#8b4513')),  // Saddle brown (edges)
    color(new Color('#ffd700')),  // Gold (center)
    coreGlow
  );

  // Add subtle orange rim
  const rimLight = mul(
    pow(sub(float(1.0), NdotV), float(3.0)),
    float(0.3)
  );
  const rimColor = mul(color(new Color('#ff8c00')), rimLight);

  return mul(add(warmColor, rimColor), float(intensity));
}

/**
 * Simulates light caustics inside amber
 * Creates swimming light patterns
 */
export function createAmberCaustics(
  speed: number = 0.5,
  scale: number = 3.0
) {
  // Animated UV distortion
  const t = mul(time, float(speed));
  const uvDistort = add(
    uv(),
    mul(
      vec3(
        sin(add(mul(uv().y, float(scale)), t)),
        cos(add(mul(uv().x, float(scale)), t)),
        float(0)
      ),
      float(0.05)
    )
  );

  // Caustic pattern
  const caustic1 = sin(mul(length(uvDistort), float(20.0)));
  const caustic2 = sin(mul(length(add(uvDistort, vec3(0.5, 0.5, 0))), float(15.0)));

  const caustics = mul(
    add(mul(caustic1, caustic2), float(1.0)),
    float(0.5)
  );

  // Golden caustic color
  return mul(color(new Color('#ffe4b5')), mul(caustics, float(0.2)));
}

// ============================================================================
// JADE-LIKE EFFECTS
// ============================================================================

/**
 * Creates jade-like translucency with green depth
 * Light penetrates and exits with green tint
 */
export function createJadeTranslucency(
  jadeColor: string = '#00a86b',
  depth: number = 0.8
) {
  const viewDir = normalize(sub(cameraPosition, positionWorld));
  const NdotV = abs(dot(normalWorld, viewDir));

  // Light penetration depth
  const penetration = pow(NdotV, float(1.0 / depth));

  // Jade shows lighter areas where thin
  const thinAreas = sub(float(1.0), penetration);

  // Color shift from green to white in thin areas
  const jade = color(new Color(jadeColor));
  const white = color(new Color('#f0fff0'));

  return mix(jade, white, mul(thinAreas, float(0.3)));
}

// ============================================================================
// WAX/ORGANIC EFFECTS
// ============================================================================

/**
 * Creates waxy subsurface appearance
 * Soft light diffusion like candle wax
 */
export function createWaxSSS(
  waxColor: string = '#fff8dc',
  softness: number = 0.8
) {
  const viewDir = normalize(sub(cameraPosition, positionWorld));
  const NdotV = abs(dot(normalWorld, viewDir));

  // Very soft falloff for waxy materials
  const softDiffuse = pow(NdotV, float(0.3));

  // Slight reddening at thin edges (like ear lobes)
  const edgeTint = mul(
    pow(sub(float(1.0), NdotV), float(2.0)),
    float(0.2)
  );

  const baseWax = color(new Color(waxColor));
  const redTint = color(new Color('#ffcccc'));

  return mix(baseWax, redTint, edgeTint);
}

// ============================================================================
// PEARL/NACRE EFFECTS
// ============================================================================

/**
 * Creates pearlescent subsurface with orient (color play)
 */
export function createPearlSSS(
  baseColor: string = '#faf0e6',
  orientIntensity: number = 0.3
) {
  const viewDir = normalize(sub(cameraPosition, positionWorld));
  const NdotV = dot(normalWorld, viewDir);

  // Base pearl luminosity
  const luminosity = pow(abs(NdotV), float(0.5));
  const pearlBase = mul(color(new Color(baseColor)), luminosity);

  // Orient (iridescent color play)
  const orientPhase = mul(NdotV, float(6.28318));
  const orientR = mul(add(sin(orientPhase), float(1.0)), float(0.5));
  const orientG = mul(add(sin(add(orientPhase, float(2.0))), float(1.0)), float(0.5));
  const orientB = mul(add(sin(add(orientPhase, float(4.0))), float(1.0)), float(0.5));

  const orient = mul(vec3(orientR, orientG, orientB), float(orientIntensity));

  return add(pearlBase, orient);
}
