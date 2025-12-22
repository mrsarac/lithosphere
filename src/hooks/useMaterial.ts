/**
 * LITHOSPHERE v7.0 - useMaterial Hook
 *
 * React hook for integrating the Material System with the scene.
 * Handles material switching, audio reactivity, and geological story mode.
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { MeshPhysicalMaterial } from 'three';
import { MaterialRegistry } from '../../materials/registry';
import { registerCoreMaterials } from '../../materials';
import type { BaseMaterial } from '../../materials/base';
import type { MaterialDefinition, MaterialCategory, MaterialTier } from '../../materials/types';
import { GeologicalStoryMode, StoryState, StoryEventHandlers, CameraTarget } from '../features/GeologicalStory/GeologicalStoryMode';

// ============================================================================
// TYPES
// ============================================================================

export interface AudioData {
  bass: number;
  mid: number;
  treble: number;
  volume: number;
}

export interface UseMaterialOptions {
  initialMaterial?: string;
  onMaterialChange?: (material: BaseMaterial, definition: MaterialDefinition) => void;
  onStoryProgress?: (progress: number, label: string) => void;
  onCameraUpdate?: (camera: CameraTarget) => void;
}

export interface UseMaterialReturn {
  // Current material
  currentMaterial: BaseMaterial | null;
  currentDefinition: MaterialDefinition | null;
  threeMaterial: MeshPhysicalMaterial | null;

  // Material selection
  allMaterials: MaterialDefinition[];
  materialsByCategory: (category: MaterialCategory) => MaterialDefinition[];
  selectMaterial: (id: string) => void;

  // Audio reactivity
  updateAudio: (data: AudioData) => void;
  setAudioEnabled: (enabled: boolean) => void;
  isAudioEnabled: boolean;

  // Geological story
  storyMode: GeologicalStoryMode | null;
  storyState: StoryState | null;
  playStory: () => void;
  pauseStory: () => void;
  stopStory: () => void;
  seekStory: (progress: number) => void;
  setStorySpeed: (speed: number) => void;

  // Animation update
  update: (deltaTime: number) => void;

  // Registry access
  registry: MaterialRegistry;
  isInitialized: boolean;
}

// ============================================================================
// HOOK
// ============================================================================

export function useMaterial(options: UseMaterialOptions = {}): UseMaterialReturn {
  const {
    initialMaterial = 'diamond',
    onMaterialChange,
    onStoryProgress,
    onCameraUpdate,
  } = options;

  // State
  const [currentMaterial, setCurrentMaterial] = useState<BaseMaterial | null>(null);
  const [currentDefinition, setCurrentDefinition] = useState<MaterialDefinition | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAudioEnabled, setAudioEnabled] = useState(true);
  const [storyState, setStoryState] = useState<StoryState | null>(null);

  // Refs
  const registryRef = useRef<MaterialRegistry | null>(null);
  const storyModeRef = useRef<GeologicalStoryMode | null>(null);
  const audioDataRef = useRef<AudioData>({ bass: 0, mid: 0, treble: 0, volume: 0 });

  // Initialize registry and materials
  useEffect(() => {
    const initMaterials = async () => {
      try {
        // Get registry instance
        registryRef.current = MaterialRegistry.getInstance();

        // Register core materials
        registerCoreMaterials();

        // Select initial material
        const material = registryRef.current.getMaterial(initialMaterial);
        if (material) {
          setCurrentMaterial(material);
          setCurrentDefinition(material.getDefinition());

          // Create story mode for this material
          const storyMode = new GeologicalStoryMode(material, {
            onProgress: (progress, label) => {
              setStoryState(storyMode.getState());
              onStoryProgress?.(progress, label);
            },
            onKeyframe: () => {
              setStoryState(storyMode.getState());
            },
            onComplete: () => {
              setStoryState(storyMode.getState());
            },
            onStart: () => {
              setStoryState(storyMode.getState());
            },
            onPause: () => {
              setStoryState(storyMode.getState());
            },
            onResume: () => {
              setStoryState(storyMode.getState());
            },
          });

          if (onCameraUpdate) {
            storyMode.setCameraUpdateCallback(onCameraUpdate);
          }

          storyModeRef.current = storyMode;
          setStoryState(storyMode.getState());
        }

        setIsInitialized(true);
        console.log('[useMaterial] Material system initialized');
      } catch (error) {
        console.error('[useMaterial] Failed to initialize:', error);
      }
    };

    initMaterials();

    return () => {
      // Cleanup
      storyModeRef.current?.dispose();
    };
  }, []);

  // Get all materials
  const allMaterials = useMemo(() => {
    if (!registryRef.current) return [];
    return registryRef.current.getAllMaterials();
  }, [isInitialized]);

  // Get materials by category
  const materialsByCategory = useCallback((category: MaterialCategory): MaterialDefinition[] => {
    if (!registryRef.current) return [];
    return registryRef.current.getMaterialsByCategory(category);
  }, [isInitialized]);

  // Select material
  const selectMaterial = useCallback((id: string) => {
    if (!registryRef.current) return;

    const material = registryRef.current.getMaterial(id);
    if (!material) {
      console.warn(`[useMaterial] Material not found: ${id}`);
      return;
    }

    // Stop current story
    storyModeRef.current?.dispose();

    // Set new material
    setCurrentMaterial(material);
    setCurrentDefinition(material.getDefinition());
    registryRef.current.setActiveMaterial(id);

    // Create new story mode
    const storyMode = new GeologicalStoryMode(material, {
      onProgress: (progress, label) => {
        setStoryState(storyMode.getState());
        onStoryProgress?.(progress, label);
      },
      onKeyframe: () => {
        setStoryState(storyMode.getState());
      },
      onComplete: () => {
        setStoryState(storyMode.getState());
      },
      onStart: () => {
        setStoryState(storyMode.getState());
      },
      onPause: () => {
        setStoryState(storyMode.getState());
      },
      onResume: () => {
        setStoryState(storyMode.getState());
      },
    });

    if (onCameraUpdate) {
      storyMode.setCameraUpdateCallback(onCameraUpdate);
    }

    storyModeRef.current = storyMode;
    setStoryState(storyMode.getState());

    // Notify callback
    onMaterialChange?.(material, material.getDefinition());

    console.log(`[useMaterial] Switched to: ${material.getDefinition().name}`);
  }, [onMaterialChange, onStoryProgress, onCameraUpdate]);

  // Update audio
  const updateAudio = useCallback((data: AudioData) => {
    audioDataRef.current = data;

    if (currentMaterial && isAudioEnabled) {
      // Pass audio data as object to match BaseMaterial.updateAudio signature
      currentMaterial.updateAudio({
        bass: data.bass,
        mid: data.mid,
        energy: data.volume,
      });
    }
  }, [currentMaterial, isAudioEnabled]);

  // Story controls
  const playStory = useCallback(() => {
    storyModeRef.current?.play();
  }, []);

  const pauseStory = useCallback(() => {
    storyModeRef.current?.pause();
  }, []);

  const stopStory = useCallback(() => {
    storyModeRef.current?.stop();
  }, []);

  const seekStory = useCallback((progress: number) => {
    storyModeRef.current?.seek(progress);
  }, []);

  const setStorySpeed = useCallback((speed: number) => {
    storyModeRef.current?.setSpeed(speed);
  }, []);

  // Animation update (call in render loop)
  const update = useCallback((deltaTime: number) => {
    if (currentMaterial) {
      // Update material effects (calls protected updateEffects internally)
      currentMaterial.update(deltaTime);

      // Apply continuous audio reactivity if enabled
      if (isAudioEnabled) {
        const { bass, mid, treble, volume } = audioDataRef.current;
        // Pass audio data as object to match BaseMaterial.updateAudio signature
        currentMaterial.updateAudio({
          bass,
          mid,
          energy: volume,
        });
      }
    }
  }, [currentMaterial, isAudioEnabled]);

  // Get Three.js material
  const threeMaterial = useMemo(() => {
    return currentMaterial?.getMaterial() ?? null;
  }, [currentMaterial]);

  return {
    // Current material
    currentMaterial,
    currentDefinition,
    threeMaterial,

    // Material selection
    allMaterials,
    materialsByCategory,
    selectMaterial,

    // Audio reactivity
    updateAudio,
    setAudioEnabled,
    isAudioEnabled,

    // Geological story
    storyMode: storyModeRef.current,
    storyState,
    playStory,
    pauseStory,
    stopStory,
    seekStory,
    setStorySpeed,

    // Animation update
    update,

    // Registry access
    registry: registryRef.current!,
    isInitialized,
  };
}

export default useMaterial;
