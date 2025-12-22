/**
 * LITHOSPHERE v7.0 - Spectral Effects
 *
 * TSL effects for light dispersion, rainbow fire, and color play.
 * Used by: Diamond, Opal, Labradorite
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
  reflect,
  refract,
  length,
  cross,
  step,
} from 'three/tsl';
import { Color, Vector3 } from 'three';

// ============================================================================
// SPECTRAL DISPERSION (Diamond Fire)
// ============================================================================

/**
 * Creates rainbow dispersion effect simulating light splitting through crystal
 * @param dispersionStrength - How much colors separate (0.01 - 0.1)
 * @param ior - Index of refraction (2.42 for diamond)
 */
export function createSpectralDispersion(
  dispersionStrength: number = 0.05,
  ior: number = 2.42
) {
  const viewDir = normalize(sub(cameraPosition, positionWorld));
  const N = normalWorld;

  // Calculate refraction for different wavelengths
  const iorRed = float(ior - dispersionStrength);
  const iorGreen = float(ior);
  const iorBlue = float(ior + dispersionStrength);

  // Refracted rays for each color channel
  const refractR = refract(viewDir, N, div(float(1.0), iorRed));
  const refractG = refract(viewDir, N, div(float(1.0), iorGreen));
  const refractB = refract(viewDir, N, div(float(1.0), iorBlue));

  // Calculate dispersion based on angle difference
  const angleR = dot(refractR, N);
  const angleG = dot(refractG, N);
  const angleB = dot(refractB, N);

  // Create rainbow color based on dispersion angles
  const r = smoothstep(float(-0.5), float(0.5), angleR);
  const g = smoothstep(float(-0.3), float(0.7), angleG);
  const b = smoothstep(float(-0.1), float(0.9), angleB);

  return vec3(r, g, b);
}

/**
 * Animated spectral fire with time-based shimmer
 */
export function createAnimatedSpectralFire(
  intensity: number = 1.0,
  speed: number = 1.0
) {
  const viewDir = normalize(sub(cameraPosition, positionWorld));
  const fresnel = pow(sub(float(1.0), abs(dot(normalWorld, viewDir))), float(3.0));

  // Time-based wavelength shift
  const t = mul(time, float(speed));
  const phase = add(
    mul(sin(add(mul(positionWorld.x, float(10.0)), t)), float(0.5)),
    float(0.5)
  );

  // Spectral colors
  const wavelength = add(mul(phase, float(320.0)), float(380.0)); // 380-700nm range
  const spectral = wavelengthToRGB(wavelength);

  // Combine with fresnel for edge fire
  return mul(spectral, mul(fresnel, float(intensity)));
}

/**
 * Convert wavelength (nm) to RGB color
 */
export function wavelengthToRGB(wavelength: ReturnType<typeof float>) {
  // Approximate visible spectrum
  const t = div(sub(wavelength, float(380.0)), float(320.0));

  // RGB response curves
  const r = smoothstep(float(0.5), float(0.8), t);
  const g = mul(
    smoothstep(float(0.0), float(0.4), t),
    sub(float(1.0), smoothstep(float(0.6), float(1.0), t))
  );
  const b = sub(float(1.0), smoothstep(float(0.2), float(0.5), t));

  return vec3(r, g, b);
}

// ============================================================================
// PLAY OF COLOR (Opal Effect)
// ============================================================================

/**
 * Creates opal-like play of color from silica sphere diffraction
 * @param sphereSize - Size of internal silica spheres (affects color scale)
 * @param layers - Number of diffractive layers
 */
export function createPlayOfColor(
  sphereSize: number = 0.3,
  layers: number = 5
) {
  const viewDir = normalize(sub(cameraPosition, positionWorld));
  const viewAngle = dot(normalWorld, viewDir);

  // Layer-based color shifting
  let colorSum = vec3(0, 0, 0);

  for (let i = 0; i < layers; i++) {
    const layerOffset = float(i * 0.2);
    const phase = add(mul(viewAngle, float(sphereSize * (i + 1))), layerOffset);

    // Different wavelength peaks per layer
    const r = pow(sin(mul(phase, float(3.14159))), float(2.0));
    const g = pow(sin(add(mul(phase, float(3.14159)), float(2.094))), float(2.0));
    const b = pow(sin(add(mul(phase, float(3.14159)), float(4.188))), float(2.0));

    const layerColor = vec3(r, g, b);
    colorSum = add(colorSum, mul(layerColor, float(1.0 / layers)));
  }

  // Add time-based shimmer
  const shimmer = mul(
    sin(add(mul(time, float(0.5)), mul(viewAngle, float(10.0)))),
    float(0.1)
  );

  return add(colorSum, vec3(shimmer, shimmer, shimmer));
}

// ============================================================================
// LABRADORESCENCE (Flash Effect)
// ============================================================================

/**
 * Creates labradorite-style color flash at specific angles
 * @param flashAngle - Angle at which flash appears (0-1)
 * @param flashWidth - Width of the flash zone
 */
export function createLabradorescence(
  flashAngle: number = 0.5,
  flashWidth: number = 0.2,
  baseColor: string = '#1e90ff'
) {
  const viewDir = normalize(sub(cameraPosition, positionWorld));
  const viewAngle = dot(normalWorld, viewDir);

  // Flash appears at specific angle
  const flashCenter = float(flashAngle);
  const flash = smoothstep(
    sub(flashCenter, float(flashWidth)),
    flashCenter,
    viewAngle
  );
  const fadeOut = sub(
    float(1.0),
    smoothstep(flashCenter, add(flashCenter, float(flashWidth)), viewAngle)
  );

  const flashIntensity = mul(flash, fadeOut);

  // Iridescent color shift
  const hueShift = mul(sub(viewAngle, flashCenter), float(10.0));
  const r = add(float(0.5), mul(sin(hueShift), float(0.5)));
  const g = add(float(0.5), mul(sin(add(hueShift, float(2.094))), float(0.5)));
  const b = add(float(0.5), mul(sin(add(hueShift, float(4.188))), float(0.5)));

  const flashColor = vec3(r, g, b);

  return mul(flashColor, flashIntensity);
}

// ============================================================================
// ALEXANDRITE EFFECT (Color Change)
// ============================================================================

/**
 * Creates alexandrite-style color change based on light temperature
 * @param daylightColor - Color under daylight (typically green/blue-green)
 * @param incandescentColor - Color under incandescent (typically red/purple)
 * @param lightTemperature - 0 = incandescent, 1 = daylight
 */
export function createAlexandriteEffect(
  daylightColor: string = '#228b22',
  incandescentColor: string = '#dc143c',
  lightTemperature: number = 0.5
) {
  const dayColor = color(new Color(daylightColor));
  const incColor = color(new Color(incandescentColor));

  // Mix based on light temperature
  const t = float(lightTemperature);
  return mix(incColor, dayColor, t);
}

// ============================================================================
// THIN-FILM INTERFERENCE (Rainbow Sheen)
// ============================================================================

/**
 * Creates thin-film interference for rainbow surface effects
 * Used by: Obsidian (rainbow sheen), bubbles, oil slicks
 */
export function createThinFilmInterference(
  filmThickness: number = 0.5,
  intensity: number = 0.5
) {
  const viewDir = normalize(sub(cameraPosition, positionWorld));
  const cosAngle = abs(dot(normalWorld, viewDir));

  // Optical path difference based on angle and thickness
  const pathDiff = mul(div(float(filmThickness), cosAngle), float(2.0));

  // Interference colors (simplified)
  const phase = mul(pathDiff, float(6.28318));
  const r = mul(add(sin(phase), float(1.0)), float(0.5));
  const g = mul(add(sin(add(phase, float(2.094))), float(1.0)), float(0.5));
  const b = mul(add(sin(add(phase, float(4.188))), float(1.0)), float(0.5));

  // Intensity based on fresnel (stronger at grazing angles)
  const fresnel = pow(sub(float(1.0), cosAngle), float(2.0));

  return mul(vec3(r, g, b), mul(fresnel, float(intensity)));
}
