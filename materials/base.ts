/**
 * LITHOSPHERE v7.0 - Base Material System
 *
 * Abstract base class for all materials.
 * Handles Three.js material creation, audio reactivity, and shader compilation.
 */

import {
  MeshPhysicalMaterial,
  Color,
  Vector3,
  Uniform,
} from 'three';
// @ts-ignore - WebGPU module
import { MeshPhysicalNodeMaterial } from 'three/webgpu';
import {
  uniform,
  float,
  vec3,
  color as tslColor,
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
} from 'three/tsl';
import type {
  MaterialDefinition,
  MaterialEffect,
  AudioMapping,
  AudioBand,
  PhysicalProperties,
  OpticalProperties,
} from './types';

// ============================================================================
// AUDIO DATA INTERFACE
// ============================================================================

export interface AudioData {
  subBass: number;      // 20-60 Hz
  bass: number;         // 60-250 Hz
  lowMid: number;       // 250-500 Hz
  mid: number;          // 500-2000 Hz
  highMid: number;      // 2000-4000 Hz
  presence: number;     // 4000-6000 Hz
  brilliance: number;   // 6000-20000 Hz
  energy: number;       // Overall energy
  beat: boolean;        // Beat detected
  bpm: number;          // Current BPM
}

// ============================================================================
// BASE MATERIAL CLASS
// ============================================================================

export abstract class BaseMaterial {
  protected definition: MaterialDefinition;
  protected material: MeshPhysicalNodeMaterial;
  protected uniforms: Map<string, Uniform<number | Color | Vector3>>;
  protected audioData: AudioData;
  protected timeOffset: number;

  constructor(definition: MaterialDefinition) {
    this.definition = definition;
    this.uniforms = new Map();
    this.timeOffset = Math.random() * 1000;
    this.audioData = this.createDefaultAudioData();
    this.material = this.createMaterial();
  }

  // ============================================================================
  // ABSTRACT METHODS (Must be implemented by each material)
  // ============================================================================

  /**
   * Apply material-specific shader effects using TSL
   */
  protected abstract applyEffects(): void;

  /**
   * Update material-specific animations
   */
  protected abstract updateEffects(deltaTime: number): void;

  // ============================================================================
  // MATERIAL CREATION
  // ============================================================================

  protected createMaterial(): MeshPhysicalNodeMaterial {
    const { physical, optical } = this.definition;

    // Create base material with physical properties
    const mat = new MeshPhysicalNodeMaterial({
      color: new Color(optical.color),
      emissive: new Color(optical.emissive),
      emissiveIntensity: optical.emissiveIntensity,
      roughness: physical.roughness,
      metalness: physical.metalness,
      ior: physical.ior,
      transmission: physical.transmission,
      thickness: physical.thickness,
      clearcoat: physical.clearcoat,
      clearcoatRoughness: physical.clearcoatRoughness,
      sheen: physical.sheen,
      sheenRoughness: physical.sheenRoughness,
      anisotropy: physical.anisotropy,
      iridescence: optical.iridescence,
      iridescenceIOR: optical.iridescenceIOR,
      envMapIntensity: optical.envMapIntensity,
    });

    // Apply material-specific TSL effects
    this.applyEffects();

    return mat;
  }

  // ============================================================================
  // AUDIO REACTIVITY
  // ============================================================================

  protected createDefaultAudioData(): AudioData {
    return {
      subBass: 0,
      bass: 0,
      lowMid: 0,
      mid: 0,
      highMid: 0,
      presence: 0,
      brilliance: 0,
      energy: 0,
      beat: false,
      bpm: 120,
    };
  }

  public updateAudio(data: Partial<AudioData>): void {
    this.audioData = { ...this.audioData, ...data };
    this.applyAudioReactivity();
  }

  protected applyAudioReactivity(): void {
    const { audioMappings } = this.definition;

    for (const mapping of audioMappings) {
      const bandValue = this.getAudioBandValue(mapping.band);
      const smoothedValue = this.smoothValue(
        bandValue,
        mapping.smoothing
      );
      const finalValue = smoothedValue * mapping.multiplier;

      this.applyAudioToTarget(mapping.target, finalValue);
    }
  }

  protected getAudioBandValue(band: AudioBand): number {
    return this.audioData[band] || 0;
  }

  protected smoothValue(value: number, smoothing: number): number {
    // Simple exponential smoothing
    const prevValue = this.uniforms.get('smoothedValue')?.value as number || 0;
    return prevValue + (value - prevValue) * (1 - smoothing);
  }

  protected applyAudioToTarget(target: string, value: number): void {
    switch (target) {
      case 'emissive':
        const emissiveIntensity = this.definition.optical.emissiveIntensity;
        this.material.emissiveIntensity = emissiveIntensity + value;
        break;
      case 'roughness':
        const baseRoughness = this.definition.physical.roughness;
        this.material.roughness = Math.max(0, Math.min(1, baseRoughness + value * 0.2));
        break;
      case 'dispersion':
        // Handled in shader uniforms
        this.uniforms.get('uDispersion')?.value;
        break;
      case 'scale':
        // Handled externally by the scene manager
        break;
    }
  }

  // ============================================================================
  // COMMON TSL UTILITIES
  // ============================================================================

  /**
   * Fresnel effect for edge glow
   */
  protected createFresnelNode(power: number = 2.0, intensity: number = 1.0) {
    const viewDir = normalize(sub(cameraPosition, positionWorld));
    const fresnel = pow(sub(float(1.0), abs(dot(normalWorld, viewDir))), float(power));
    return mul(fresnel, float(intensity));
  }

  /**
   * Noise function for organic variation
   */
  protected createNoiseNode(scale: number = 1.0) {
    const p = mul(positionWorld, float(scale));
    const noise = fract(mul(sin(add(dot(p, vec3(12.9898, 78.233, 45.543)), time)), float(43758.5453)));
    return noise;
  }

  /**
   * Spectral rainbow calculation
   */
  protected createSpectralNode(wavelength: number) {
    // Approximate visible spectrum colors (380nm - 700nm)
    const t = clamp(div(sub(float(wavelength), float(380)), float(320)), float(0), float(1));

    const r = smoothstep(float(0.0), float(0.2), t);
    const g = smoothstep(float(0.2), float(0.5), t);
    const b = sub(float(1.0), smoothstep(float(0.5), float(1.0), t));

    return vec3(r, g, b);
  }

  /**
   * Subsurface scattering approximation
   */
  protected createSubsurfaceNode(color: string, intensity: number) {
    const sssColor = tslColor(new Color(color));
    const viewDir = normalize(sub(cameraPosition, positionWorld));
    const sss = pow(max(float(0), dot(normalWorld, viewDir)), float(2.0));
    return mul(sssColor, mul(sss, float(intensity)));
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  public getMaterial(): MeshPhysicalNodeMaterial {
    return this.material;
  }

  public getDefinition(): MaterialDefinition {
    return this.definition;
  }

  public update(deltaTime: number): void {
    this.updateEffects(deltaTime);
  }

  public setUniform(name: string, value: number | Color | Vector3): void {
    const uniform = this.uniforms.get(name);
    if (uniform) {
      uniform.value = value;
    }
  }

  public dispose(): void {
    this.material.dispose();
    this.uniforms.clear();
  }

  // ============================================================================
  // PROPERTY OVERRIDES
  // ============================================================================

  public setPhysicalProperty<K extends keyof PhysicalProperties>(
    key: K,
    value: PhysicalProperties[K]
  ): void {
    this.definition.physical[key] = value;

    // Apply to material
    switch (key) {
      case 'roughness':
        this.material.roughness = value as number;
        break;
      case 'metalness':
        this.material.metalness = value as number;
        break;
      case 'ior':
        this.material.ior = value as number;
        break;
      case 'transmission':
        this.material.transmission = value as number;
        break;
      case 'thickness':
        this.material.thickness = value as number;
        break;
      case 'clearcoat':
        this.material.clearcoat = value as number;
        break;
      case 'clearcoatRoughness':
        this.material.clearcoatRoughness = value as number;
        break;
      case 'sheen':
        this.material.sheen = value as number;
        break;
      case 'sheenRoughness':
        this.material.sheenRoughness = value as number;
        break;
      case 'anisotropy':
        this.material.anisotropy = value as number;
        break;
    }
  }

  public setOpticalProperty<K extends keyof OpticalProperties>(
    key: K,
    value: OpticalProperties[K]
  ): void {
    this.definition.optical[key] = value;

    // Apply to material
    switch (key) {
      case 'color':
        this.material.color = new Color(value as string);
        break;
      case 'emissive':
        this.material.emissive = new Color(value as string);
        break;
      case 'emissiveIntensity':
        this.material.emissiveIntensity = value as number;
        break;
      case 'iridescence':
        this.material.iridescence = value as number;
        break;
      case 'iridescenceIOR':
        this.material.iridescenceIOR = value as number;
        break;
      case 'envMapIntensity':
        this.material.envMapIntensity = value as number;
        break;
    }
  }
}

export default BaseMaterial;
