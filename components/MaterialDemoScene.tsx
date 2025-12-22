/**
 * LITHOSPHERE v7.0 - Material Demo Scene
 *
 * Simple scene demonstrating the Material System.
 * Uses BaseMaterial classes with TSL shader effects.
 */

import React, { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
// @ts-ignore
import { WebGPURenderer, PostProcessing } from 'three/webgpu';
// @ts-ignore
import { pass } from 'three/tsl';
// @ts-ignore
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
// @ts-ignore
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { UseMaterialReturn } from '../src/hooks/useMaterial';
import type { CameraTarget } from '../src/features/GeologicalStory/GeologicalStoryMode';

// ============================================================================
// TYPES
// ============================================================================

interface MaterialDemoSceneProps {
  materialHook: UseMaterialReturn;
}

// ============================================================================
// COMPONENT
// ============================================================================

const MaterialDemoScene: React.FC<MaterialDemoSceneProps> = ({ materialHook }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<WebGPURenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());

  const { threeMaterial, update: updateMaterial, currentDefinition } = materialHook;

  // Handle camera updates from story mode
  const handleCameraUpdate = useCallback((target: CameraTarget) => {
    if (!cameraRef.current || !controlsRef.current) return;

    cameraRef.current.position.copy(target.position);
    controlsRef.current.target.copy(target.lookAt);
    controlsRef.current.update();
  }, []);

  // Initialize scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0c);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 5);
    cameraRef.current = camera;

    // Renderer
    const renderer = new WebGPURenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 15;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2);
    keyLight.position.set(5, 5, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x8888ff, 0.8);
    fillLight.position.set(-5, 0, -5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xff8844, 0.6);
    rimLight.position.set(0, -3, -3);
    scene.add(rimLight);

    // Environment map placeholder (simple gradient)
    const envScene = new THREE.Scene();
    const gradientMesh = new THREE.Mesh(
      new THREE.SphereGeometry(50, 32, 32),
      new THREE.MeshBasicMaterial({
        color: 0x222233,
        side: THREE.BackSide,
      })
    );
    envScene.add(gradientMesh);

    // Geometry - icosahedron for gem-like facets
    const geometry = new THREE.IcosahedronGeometry(1.5, 2);

    // Initial material (fallback)
    const fallbackMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x88ccff,
      metalness: 0,
      roughness: 0.1,
      transmission: 0.9,
      thickness: 1.5,
      ior: 2.4,
    });

    // Mesh
    const mesh = new THREE.Mesh(geometry, fallbackMaterial);
    scene.add(mesh);
    meshRef.current = mesh;

    // Post-processing
    let postProcessing: PostProcessing | null = null;

    const initPostProcessing = async () => {
      await renderer.init();

      postProcessing = new PostProcessing(renderer);
      const scenePass = pass(scene, camera);
      const bloomPass = bloom(scenePass, 0.5, 0.4, 0.85);
      postProcessing.outputNode = bloomPass;
    };

    initPostProcessing();

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      const deltaTime = clockRef.current.getDelta();

      // Update material effects
      updateMaterial(deltaTime);

      // Rotate mesh slowly
      if (meshRef.current) {
        meshRef.current.rotation.y += deltaTime * 0.2;
        meshRef.current.rotation.x += deltaTime * 0.1;
      }

      // Update controls
      controls.update();

      // Render
      if (postProcessing) {
        postProcessing.render();
      } else {
        renderer.render(scene, camera);
      }
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();

      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);

      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }

      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }

      geometry.dispose();
      fallbackMaterial.dispose();
    };
  }, []);

  // Update material when it changes
  useEffect(() => {
    if (meshRef.current && threeMaterial) {
      meshRef.current.material = threeMaterial;
      console.log(`[MaterialDemoScene] Applied material: ${currentDefinition?.name}`);
    }
  }, [threeMaterial, currentDefinition]);

  // Set up camera callback for story mode
  useEffect(() => {
    if (materialHook.storyMode) {
      materialHook.storyMode.setCameraUpdateCallback(handleCameraUpdate);
    }
  }, [materialHook.storyMode, handleCameraUpdate]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ touchAction: 'none' }}
    />
  );
};

export default MaterialDemoScene;
