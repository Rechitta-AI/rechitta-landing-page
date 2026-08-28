'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const TOTAL_FRAMES = 586;
const CACHE_SIZE = 40; // Number of frames to keep in VRAM to prevent GPU out-of-memory

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
uniform sampler2D tDiffuse;
uniform float velocity;
uniform vec2 mouse;
varying vec2 vUv;

void main() {
  // 1. Mouse Parallax (Fake 3D)
  vec2 centeredUv = vUv - 0.5;
  centeredUv *= 0.95; // Zoom in by 5% to hide the edges during parallax
  
  // state.pointer is [-1, 1], invert Y for natural feel
  vec2 parallaxOffset = vec2(mouse.x, -mouse.y) * 0.015;
  vec2 finalUv = centeredUv + parallaxOffset + 0.5;
  
  // 2. Velocity-Based Motion Blur
  vec4 color = vec4(0.0);
  float samples = 8.0;
  
  for(float i = 0.0; i < 8.0; i++) {
     // Blur vertically based on scroll velocity
     float vOffset = velocity * ((i / (samples - 1.0)) - 0.5) * 0.1;
     color += texture2D(tDiffuse, finalUv + vec2(0.0, vOffset));
  }
  
  color /= samples;

  // Fallback for unloaded texture (RED)
  if (color.a == 0.0 && color.r == 0.0 && color.g == 0.0 && color.b == 0.0) {
      gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); 
  } else {
      gl_FragColor = color;
      
      // Fix Color Space (Linear to sRGB mapping for ShaderMaterial)
      #include <colorspace_fragment>
  }
}
`;

function ShaderPlane({ maxScroll, onPreloadProgress }: { maxScroll: number, onPreloadProgress: (progress: number) => void }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const textureCache = useRef<Map<number, THREE.Texture>>(new Map());
  const loadingSet = useRef<Set<number>>(new Set());
  const textureLoader = useMemo(() => new THREE.TextureLoader(), []);
  
  // Track scroll without triggering React renders!
  const targetScrollY = useRef(0);
  const currentScrollY = useRef(0);
  const currentFrameFloat = useRef(1);
  const activeFrame = useRef(1);
  
  const PRELOAD_REQUIRED = 30;
  let preloadedCount = useRef(0);
  
  useEffect(() => {
    const onScroll = () => { targetScrollY.current = window.scrollY; };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const lastLoadedFrame = useRef(-1);
  const mouseLerp = useRef(new THREE.Vector2(0, 0));
  
  useFrame((state, delta) => {
    if (!materialRef.current) return;
    
    // Smoothly interpolate mouse for parallax
    mouseLerp.current.x += (state.pointer.x - mouseLerp.current.x) * 5.0 * delta;
    mouseLerp.current.y += (state.pointer.y - mouseLerp.current.y) * 5.0 * delta;
    
    // Smoothly interpolate scroll position (Lerp)
    const scrollDiff = targetScrollY.current - currentScrollY.current;
    currentScrollY.current += scrollDiff * 8.0 * delta;
    
    // Apply uniforms
    materialRef.current.uniforms.mouse.value = mouseLerp.current;
    materialRef.current.uniforms.velocity.value = scrollDiff * 0.0005; // Reduced blur strength (was 0.002)
    
    // Calculate exact float progress
    const progress = Math.max(0, Math.min(1, maxScroll > 0 ? currentScrollY.current / maxScroll : 0));
    
    // Target exact frame
    const targetFrame = (progress * (TOTAL_FRAMES - 1)) + 1;
    
    // Smoothly interpolate the frame float for buttery transitions
    currentFrameFloat.current += (targetFrame - currentFrameFloat.current) * 15.0 * delta;
    
    // Snap to closest integer frame
    const drawFrame = Math.round(currentFrameFloat.current);
    activeFrame.current = drawFrame;
    
    // --- VRAM Sliding Window Manager ---
    // Only run if we actually moved to a new frame to save CPU
    if (drawFrame !== lastLoadedFrame.current) {
      lastLoadedFrame.current = drawFrame;
      
      const loadUntil = Math.max(
        Math.min(TOTAL_FRAMES, drawFrame + Math.floor(CACHE_SIZE / 2)), 
        PRELOAD_REQUIRED + 1
      );
      
      // 1. Preload upcoming frames
      for (let i = drawFrame; i < loadUntil; i++) {
        if (!textureCache.current.has(i) && !loadingSet.current.has(i)) {
          loadingSet.current.add(i);
          const paddedIndex = String(i).padStart(4, '0');
          const url = `/film/frames/test/frame_${paddedIndex}.webp`;
          
          textureLoader.load(url, (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.generateMipmaps = false; 
            tex.minFilter = THREE.LinearFilter;
            textureCache.current.set(i, tex);
            loadingSet.current.delete(i);
            
            if (i <= PRELOAD_REQUIRED) {
              preloadedCount.current += 1;
              onPreloadProgress(Math.min(100, Math.floor((preloadedCount.current / PRELOAD_REQUIRED) * 100)));
            }
          });
        }
      }
      
      // 2. Preload a few previous frames (in case they scroll backward)
      for (let i = drawFrame - 1; i > Math.max(1, drawFrame - Math.floor(CACHE_SIZE / 4)); i--) {
          if (!textureCache.current.has(i) && !loadingSet.current.has(i)) {
            loadingSet.current.add(i);
            const paddedIndex = String(i).padStart(4, '0');
            const url = `/film/frames/test/frame_${paddedIndex}.webp`;
            
            textureLoader.load(url, (tex) => {
              tex.colorSpace = THREE.SRGBColorSpace;
              tex.generateMipmaps = false;
              tex.minFilter = THREE.LinearFilter;
              textureCache.current.set(i, tex);
              loadingSet.current.delete(i);
            });
          }
      }
  
      // 3. Evict old frames to prevent VRAM overflow
      for (const [key, tex] of Array.from(textureCache.current.entries())) {
        if (Math.abs(key - drawFrame) > CACHE_SIZE) {
          tex.dispose(); 
          textureCache.current.delete(key);
        }
      }
    }
    // --- End VRAM Manager ---

    // Apply current frame texture
    const currentTex = textureCache.current.get(drawFrame);
    if (currentTex) {
      materialRef.current.uniforms.tDiffuse.value = currentTex;
    }
  });

  const viewport = useThree((state) => state.viewport);
  
  // Calculate object-fit: cover for a 16:9 video
  const videoAspect = 16 / 9;
  const viewportAspect = viewport.width / viewport.height;
  
  let scaleX = 1;
  let scaleY = 1;
  
  if (viewportAspect > videoAspect) {
    // Screen is wider than video: scale Y up to fill
    scaleY = viewportAspect / videoAspect;
  } else {
    // Screen is taller than video (e.g. mobile): scale X up to fill
    scaleX = videoAspect / viewportAspect;
  }
  
  return (
    <mesh scale={[scaleX, scaleY, 1]}>
      <planeGeometry args={[viewport.width, viewport.height]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          tDiffuse: { value: null },
          velocity: { value: 0 },
          mouse: { value: new THREE.Vector2(0, 0) }
        }}
      />
    </mesh>
  );
}

export default function ShaderSequence() {
  const [maxScroll, setMaxScroll] = useState(8000); 
  const [loadingProgress, setLoadingProgress] = useState(0);
  const isLoaded = loadingProgress >= 100;

  useEffect(() => {
    if (!isLoaded) return; 
    
    const handleResize = () => setMaxScroll(8000 - window.innerHeight);
    window.addEventListener('resize', handleResize, { passive: true });
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    }
  }, [isLoaded]);

  // Lock scrolling on the body until loaded
  useEffect(() => {
    if (!isLoaded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isLoaded]);

  return (
    <div style={{ height: '8000px', position: 'relative' }}>
      
      {/* Loading Screen Overlay */}
      {!isLoaded && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center text-white transition-opacity duration-1000">
          <div className="text-3xl font-bold tracking-[0.2em] mb-4">PRIMING VRAM</div>
          <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-300 ease-out" 
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <div className="mt-4 text-gray-400 font-mono text-sm">{loadingProgress}%</div>
        </div>
      )}

      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0 }}>
        <Canvas gl={{ antialias: false, powerPreference: 'high-performance' }}>
          <ShaderPlane 
             maxScroll={maxScroll} 
             onPreloadProgress={setLoadingProgress} 
          />
        </Canvas>
      </div>
      
      {/* Test UI overlay */}
      <div className="fixed inset-0 z-10 pointer-events-none flex items-center justify-center">
        <h1 className="text-white text-5xl font-bold tracking-widest drop-shadow-[0_0_20px_rgba(0,0,0,0.8)] opacity-50 mix-blend-overlay">
          WEBGL SHADER SCRUB
        </h1>
      </div>
    </div>
  );
}
