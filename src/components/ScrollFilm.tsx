'use client';
import { useEffect, useRef } from 'react';
import { createSequence } from '@/utils/FilmLoader';
import { manageMemory } from '@/utils/MemoryManager';
import manifest from '../../public/film/manifest.json';

interface ScrollFilmProps {
  scrollData: React.MutableRefObject<{ progress: number }>;
  sequenceKeys: string[];
  startProgress: number;
  endProgress: number;
}

export default function ScrollFilm({ scrollData, sequenceKeys, startProgress, endProgress }: ScrollFilmProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Handle high DPI displays for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    // 1. Initialize the sequence arrays and combine them dynamically
    const sequence = sequenceKeys.flatMap(key => createSequence(manifest, key));

    // 2. The Central Render Loop (Runs 60fps)
    let animationFrameId: number;
    
    // We keep track of the smoothed progress ourselves since ScrollTrigger is upstream
    let currentProgress = scrollData.current.progress;

    const renderLoop = () => {
      // Lerp the progress for smoothness (mimics GSAP quickTo)
      const targetProgress = scrollData.current.progress;
      currentProgress += (targetProgress - currentProgress) * 0.1;

      // The sequence finishes exactly at the defined endProgress
      // Normalize progress within this component's active window
      const range = endProgress - startProgress;
      const localProgress = (currentProgress - startProgress) / range;
      const videoProgress = Math.max(0, Math.min(localProgress, 1));
      
      const targetIndex = Math.max(0, Math.min(Math.round(videoProgress * (sequence.length - 1)), sequence.length - 1));
      
      // Run the memory manager
      const activeFrame = manageMemory(sequence, targetIndex);

      if (activeFrame) {
        // Draw the frame scaled to cover the screen
        const scale = Math.max(window.innerWidth / activeFrame.naturalWidth, window.innerHeight / activeFrame.naturalHeight);
        const w = activeFrame.naturalWidth * scale;
        const h = activeFrame.naturalHeight * scale;
        
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        ctx.drawImage(activeFrame, (window.innerWidth - w) / 2, (window.innerHeight - h) / 2, w, h);
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };
    
    renderLoop();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [scrollData]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute top-0 left-0 w-full h-full pointer-events-none" 
      style={{ width: '100%', height: '100%' }}
    />
  );
}
