'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface BoardroomIframeTestProps {
  holdData: React.RefObject<{ clipIndex: number; progress: number; startProgress?: number; endProgress?: number }>;
}

export default function BoardroomIframeTest({ holdData }: BoardroomIframeTestProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisibleRef = useRef(false);

  // ==========================================
  // FINAL CALIBRATED VALUES
  // ==========================================
  const TOP = 13;
  const LEFT = 28.4;
  const WIDTH = 44.5;
  const HEIGHT = 48.6;
  
  const ROTATE_X = -1.7;
  const ROTATE_Y = 1;
  const ROTATE_Z = 0.3;
  const SCALE = 1.03;
  // ==========================================

  useEffect(() => {
    let frame: number;

    const render = () => {
      if (!holdData.current || !containerRef.current) {
        frame = requestAnimationFrame(render);
        return;
      }

      const { clipIndex } = holdData.current;
      const isNowVisible = clipIndex === 0;

      // Detect Entrance
      if (isNowVisible && !isVisibleRef.current) {
        isVisibleRef.current = true;
        gsap.killTweensOf(containerRef.current);
        gsap.set(containerRef.current, { autoAlpha: 1 });
        
        // Professional Smooth Fade & Scale In
        gsap.fromTo(
          containerRef.current,
          { opacity: 0, scale: 0.96 },
          { opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out' }
        );
      } 
      // Detect Exit
      else if (!isNowVisible && isVisibleRef.current) {
        isVisibleRef.current = false;
        gsap.killTweensOf(containerRef.current);
        
        // Professional Smooth Fade Out
        gsap.to(containerRef.current, {
          opacity: 0,
          scale: 0.96,
          duration: 0.5,
          ease: 'power2.inOut',
          onComplete: () => gsap.set(containerRef.current, { autoAlpha: 0 })
        });
      }

      frame = requestAnimationFrame(render);
    };

    frame = requestAnimationFrame(render);

    return () => cancelAnimationFrame(frame);
  }, [holdData]);

  return (
    <div
      ref={containerRef}
      className="absolute pointer-events-none opacity-0 invisible"
      style={{ 
        top: `${TOP}%`, 
        left: `${LEFT}%`, 
        width: `${WIDTH}%`, 
        height: `${HEIGHT}%`,
        perspective: '1000px', 
        zIndex: 50 
      }}
    >
      {/* The 3D Skewed Container */}
      <div
        className="w-full h-full overflow-hidden relative pointer-events-auto shadow-2xl"
        style={{
          transform: `rotateY(${ROTATE_Y}deg) rotateX(${ROTATE_X}deg) rotateZ(${ROTATE_Z}deg) scale(${SCALE})`,
          transformStyle: 'preserve-3d',
          // Drop the brightness slightly and add a tiny bit of contrast so it doesn't look artificially pasted on
          filter: 'brightness(0.9) contrast(1.1)',
        }}
      >
        {/* We make the iframe slightly wider than 100% to push the ugly Windows/browser scrollbar out of view, while keeping it scrollable! */}
        <iframe
          src="https://icy-sand-0d102fd00.7.azurestaticapps.net/?sessionId=0b555e4f-a0cf-4459-be58-a6d45a69ac68"
          style={{ width: 'calc(100% + 24px)', height: '100%', border: '0', opacity: 0.95 }}
          allow="microphone"
        />

        {/* Screen Glare / Reflection Overlay (pointer-events-none so it doesn't block clicks!) */}
        <div
          className="absolute inset-0 pointer-events-none mix-blend-screen"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 40%, rgba(0,0,0,0.2) 100%)'
          }}
        />

        {/* Inner shadow to simulate the TV bezel depth */}
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]" />
      </div>
    </div>
  );
}
