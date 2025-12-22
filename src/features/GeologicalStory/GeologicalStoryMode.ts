/**
 * LITHOSPHERE v7.0 - Geological Story Mode
 *
 * Joy Team Feature: Animated material formation stories.
 *
 * Watch how each material forms over millions of years:
 * - Diamond: From carbon atoms under extreme pressure to brilliant gem
 * - Obsidian: From molten lava to volcanic glass in seconds
 * - Quartz: From silica solution to hexagonal crystal
 * - Amber: From tree resin to fossilized time capsule
 * - Opal: From silica gel to rainbow-trapped stone
 *
 * Features:
 * - Keyframe-based property animation
 * - Camera path animation
 * - Narration text sync
 * - Time scale visualization
 * - Interactive pause/resume/scrub
 */

import { Vector3 } from 'three';
import type {
  MaterialDefinition,
  GeologicalStory,
  GeologicalKeyframe,
  PhysicalProperties,
  OpticalProperties,
} from '../../../materials/types';
import type { BaseMaterial } from '../../../materials/base';

// ============================================================================
// TYPES
// ============================================================================

export interface StoryState {
  isPlaying: boolean;
  isPaused: boolean;
  progress: number;        // 0-1 normalized
  currentKeyframeIndex: number;
  currentLabel: string;
  elapsedTime: number;     // Animation time in ms
  totalDuration: number;   // Total animation duration in ms
}

export interface StoryEventHandlers {
  onProgress?: (progress: number, label: string) => void;
  onKeyframe?: (index: number, keyframe: GeologicalKeyframe) => void;
  onComplete?: () => void;
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
}

export interface CameraTarget {
  position: Vector3;
  lookAt: Vector3;
}

// ============================================================================
// GEOLOGICAL STORY MODE CLASS
// ============================================================================

export class GeologicalStoryMode {
  private material: BaseMaterial;
  private story: GeologicalStory;
  private state: StoryState;
  private handlers: StoryEventHandlers;

  private animationFrame: number | null = null;
  private lastTimestamp: number = 0;
  private onCameraUpdate: ((camera: CameraTarget) => void) | null = null;

  // Default animation duration: 30 seconds
  private readonly DEFAULT_DURATION = 30000;

  constructor(
    material: BaseMaterial,
    handlers: StoryEventHandlers = {},
    duration: number = 30000
  ) {
    this.material = material;
    this.story = material.getDefinition().geologicalStory;
    this.handlers = handlers;

    this.state = {
      isPlaying: false,
      isPaused: false,
      progress: 0,
      currentKeyframeIndex: 0,
      currentLabel: this.story.keyframes[0]?.label || '',
      elapsedTime: 0,
      totalDuration: duration,
    };
  }

  // ============================================================================
  // PLAYBACK CONTROLS
  // ============================================================================

  /**
   * Start or resume the story animation
   */
  public play(): void {
    if (this.state.isPlaying && !this.state.isPaused) return;

    if (this.state.isPaused) {
      this.state.isPaused = false;
      this.handlers.onResume?.();
    } else {
      this.state.isPlaying = true;
      this.state.progress = 0;
      this.state.elapsedTime = 0;
      this.state.currentKeyframeIndex = 0;
      this.handlers.onStart?.();
    }

    this.lastTimestamp = performance.now();
    this.animate();
  }

  /**
   * Pause the story animation
   */
  public pause(): void {
    if (!this.state.isPlaying || this.state.isPaused) return;

    this.state.isPaused = true;
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.handlers.onPause?.();
  }

  /**
   * Stop and reset the story animation
   */
  public stop(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    this.state.isPlaying = false;
    this.state.isPaused = false;
    this.state.progress = 0;
    this.state.elapsedTime = 0;
    this.state.currentKeyframeIndex = 0;
    this.state.currentLabel = this.story.keyframes[0]?.label || '';

    // Reset material to first keyframe
    this.applyKeyframe(0);
  }

  /**
   * Seek to a specific progress point (0-1)
   */
  public seek(progress: number): void {
    progress = Math.max(0, Math.min(1, progress));
    this.state.progress = progress;
    this.state.elapsedTime = progress * this.state.totalDuration;

    // Find and apply keyframe
    const keyframeIndex = this.findKeyframeIndex(progress);
    this.state.currentKeyframeIndex = keyframeIndex;
    this.state.currentLabel = this.story.keyframes[keyframeIndex]?.label || '';

    // Interpolate and apply properties
    this.applyInterpolatedKeyframe(progress);

    // Update camera
    this.updateCamera(progress);

    this.handlers.onProgress?.(progress, this.state.currentLabel);
  }

  /**
   * Set playback speed multiplier
   */
  public setSpeed(multiplier: number): void {
    this.state.totalDuration = this.DEFAULT_DURATION / multiplier;
  }

  /**
   * Set camera update callback
   */
  public setCameraUpdateCallback(callback: (camera: CameraTarget) => void): void {
    this.onCameraUpdate = callback;
  }

  // ============================================================================
  // STATE GETTERS
  // ============================================================================

  public getState(): StoryState {
    return { ...this.state };
  }

  public getStory(): GeologicalStory {
    return this.story;
  }

  public isPlaying(): boolean {
    return this.state.isPlaying && !this.state.isPaused;
  }

  // ============================================================================
  // ANIMATION LOOP
  // ============================================================================

  private animate = (): void => {
    if (!this.state.isPlaying || this.state.isPaused) return;

    const currentTimestamp = performance.now();
    const deltaTime = currentTimestamp - this.lastTimestamp;
    this.lastTimestamp = currentTimestamp;

    // Update elapsed time
    this.state.elapsedTime += deltaTime;
    this.state.progress = Math.min(1, this.state.elapsedTime / this.state.totalDuration);

    // Find current keyframe
    const keyframeIndex = this.findKeyframeIndex(this.state.progress);
    if (keyframeIndex !== this.state.currentKeyframeIndex) {
      this.state.currentKeyframeIndex = keyframeIndex;
      this.state.currentLabel = this.story.keyframes[keyframeIndex]?.label || '';
      this.handlers.onKeyframe?.(keyframeIndex, this.story.keyframes[keyframeIndex]);
    }

    // Apply interpolated properties
    this.applyInterpolatedKeyframe(this.state.progress);

    // Update camera
    this.updateCamera(this.state.progress);

    // Notify progress
    this.handlers.onProgress?.(this.state.progress, this.state.currentLabel);

    // Check completion
    if (this.state.progress >= 1) {
      this.state.isPlaying = false;
      this.handlers.onComplete?.();
      return;
    }

    // Continue animation
    this.animationFrame = requestAnimationFrame(this.animate);
  };

  // ============================================================================
  // KEYFRAME INTERPOLATION
  // ============================================================================

  private findKeyframeIndex(progress: number): number {
    const keyframes = this.story.keyframes;
    for (let i = keyframes.length - 1; i >= 0; i--) {
      if (progress >= keyframes[i].time) {
        return i;
      }
    }
    return 0;
  }

  private applyKeyframe(index: number): void {
    const keyframe = this.story.keyframes[index];
    if (!keyframe) return;

    // Apply all properties from keyframe
    this.applyProperties(keyframe.properties);

    // Apply camera
    if (keyframe.cameraPosition) {
      this.onCameraUpdate?.({
        position: new Vector3(
          keyframe.cameraPosition.x,
          keyframe.cameraPosition.y,
          keyframe.cameraPosition.z
        ),
        lookAt: new Vector3(0, 0, 0),
      });
    }
  }

  private applyInterpolatedKeyframe(progress: number): void {
    const keyframes = this.story.keyframes;
    const currentIndex = this.findKeyframeIndex(progress);
    const nextIndex = Math.min(currentIndex + 1, keyframes.length - 1);

    const currentKeyframe = keyframes[currentIndex];
    const nextKeyframe = keyframes[nextIndex];

    if (!currentKeyframe || !nextKeyframe || currentIndex === nextIndex) {
      this.applyKeyframe(currentIndex);
      return;
    }

    // Calculate interpolation factor between keyframes
    const keyframeRange = nextKeyframe.time - currentKeyframe.time;
    const t = keyframeRange > 0
      ? (progress - currentKeyframe.time) / keyframeRange
      : 0;

    // Ease function (ease-in-out)
    const easedT = this.easeInOutCubic(t);

    // Interpolate properties
    const interpolatedProps = this.interpolateProperties(
      currentKeyframe.properties,
      nextKeyframe.properties,
      easedT
    );

    this.applyProperties(interpolatedProps);
  }

  private interpolateProperties(
    from: Partial<PhysicalProperties & OpticalProperties>,
    to: Partial<PhysicalProperties & OpticalProperties>,
    t: number
  ): Partial<PhysicalProperties & OpticalProperties> {
    const result: Partial<PhysicalProperties & OpticalProperties> = {};

    // Interpolate all numeric properties
    const keys = new Set([...Object.keys(from), ...Object.keys(to)]);

    for (const key of keys) {
      const fromValue = (from as any)[key];
      const toValue = (to as any)[key];

      if (typeof fromValue === 'number' && typeof toValue === 'number') {
        (result as any)[key] = this.lerp(fromValue, toValue, t);
      } else if (typeof fromValue === 'string' && typeof toValue === 'string') {
        // Color interpolation
        (result as any)[key] = this.lerpColor(fromValue, toValue, t);
      } else if (fromValue !== undefined) {
        (result as any)[key] = fromValue;
      } else {
        (result as any)[key] = toValue;
      }
    }

    return result;
  }

  private applyProperties(props: Partial<PhysicalProperties & OpticalProperties>): void {
    const def = this.material.getDefinition();

    // Physical properties
    if (props.ior !== undefined) this.material.setPhysicalProperty('ior', props.ior);
    if (props.roughness !== undefined) this.material.setPhysicalProperty('roughness', props.roughness);
    if (props.metalness !== undefined) this.material.setPhysicalProperty('metalness', props.metalness);
    if (props.transmission !== undefined) this.material.setPhysicalProperty('transmission', props.transmission);
    if (props.thickness !== undefined) this.material.setPhysicalProperty('thickness', props.thickness);
    if (props.clearcoat !== undefined) this.material.setPhysicalProperty('clearcoat', props.clearcoat);
    if (props.clearcoatRoughness !== undefined) this.material.setPhysicalProperty('clearcoatRoughness', props.clearcoatRoughness);
    if (props.sheen !== undefined) this.material.setPhysicalProperty('sheen', props.sheen);
    if (props.sheenRoughness !== undefined) this.material.setPhysicalProperty('sheenRoughness', props.sheenRoughness);
    if (props.anisotropy !== undefined) this.material.setPhysicalProperty('anisotropy', props.anisotropy);

    // Optical properties
    if (props.color !== undefined) this.material.setOpticalProperty('color', props.color);
    if (props.emissive !== undefined) this.material.setOpticalProperty('emissive', props.emissive);
    if (props.emissiveIntensity !== undefined) this.material.setOpticalProperty('emissiveIntensity', props.emissiveIntensity);
    if (props.dispersion !== undefined) this.material.setOpticalProperty('dispersion', props.dispersion);
    if (props.subsurfaceColor !== undefined) this.material.setOpticalProperty('subsurfaceColor', props.subsurfaceColor);
    if (props.subsurfaceIntensity !== undefined) this.material.setOpticalProperty('subsurfaceIntensity', props.subsurfaceIntensity);
    if (props.iridescence !== undefined) this.material.setOpticalProperty('iridescence', props.iridescence);
    if (props.iridescenceIOR !== undefined) this.material.setOpticalProperty('iridescenceIOR', props.iridescenceIOR);
    if (props.envMapIntensity !== undefined) this.material.setOpticalProperty('envMapIntensity', props.envMapIntensity);
  }

  // ============================================================================
  // CAMERA ANIMATION
  // ============================================================================

  private updateCamera(progress: number): void {
    if (!this.onCameraUpdate) return;

    const keyframes = this.story.keyframes;
    const currentIndex = this.findKeyframeIndex(progress);
    const nextIndex = Math.min(currentIndex + 1, keyframes.length - 1);

    const currentKeyframe = keyframes[currentIndex];
    const nextKeyframe = keyframes[nextIndex];

    if (!currentKeyframe?.cameraPosition || !nextKeyframe?.cameraPosition) {
      if (currentKeyframe?.cameraPosition) {
        this.onCameraUpdate({
          position: new Vector3(
            currentKeyframe.cameraPosition.x,
            currentKeyframe.cameraPosition.y,
            currentKeyframe.cameraPosition.z
          ),
          lookAt: new Vector3(0, 0, 0),
        });
      }
      return;
    }

    // Interpolate camera position
    const keyframeRange = nextKeyframe.time - currentKeyframe.time;
    const t = keyframeRange > 0
      ? (progress - currentKeyframe.time) / keyframeRange
      : 0;
    const easedT = this.easeInOutCubic(t);

    const x = this.lerp(currentKeyframe.cameraPosition.x, nextKeyframe.cameraPosition.x, easedT);
    const y = this.lerp(currentKeyframe.cameraPosition.y, nextKeyframe.cameraPosition.y, easedT);
    const z = this.lerp(currentKeyframe.cameraPosition.z, nextKeyframe.cameraPosition.z, easedT);

    this.onCameraUpdate({
      position: new Vector3(x, y, z),
      lookAt: new Vector3(0, 0, 0),
    });
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private lerpColor(colorA: string, colorB: string, t: number): string {
    // Parse hex colors
    const parseHex = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : { r: 0, g: 0, b: 0 };
    };

    const a = parseHex(colorA);
    const b = parseHex(colorB);

    const r = Math.round(this.lerp(a.r, b.r, t));
    const g = Math.round(this.lerp(a.g, b.g, t));
    const bVal = Math.round(this.lerp(a.b, b.b, t));

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bVal.toString(16).padStart(2, '0')}`;
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  public dispose(): void {
    this.stop();
    this.onCameraUpdate = null;
  }
}

export default GeologicalStoryMode;
