'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface BoardroomPresentationProps {
  holdData: React.RefObject<{ clipIndex: number; progress: number }>;
}

export default function BoardroomPresentation({ holdData }: BoardroomPresentationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const slidesRef = useRef<HTMLDivElement>(null);

  const isVisibleRef = useRef(false);

  useEffect(() => {
    let frame: number;

    const render = () => {
      if (!holdData.current || !containerRef.current || !slidesRef.current) {
        frame = requestAnimationFrame(render);
        return;
      }

      const { clipIndex, progress } = holdData.current;
      const isNowVisible = clipIndex === 0;

      // Detect Entrance
      if (isNowVisible && !isVisibleRef.current) {
        isVisibleRef.current = true;
        gsap.killTweensOf(containerRef.current);
        gsap.set(containerRef.current, { autoAlpha: 1 });
        
        // CRT Glitch In
        const tl = gsap.timeline();
        tl.fromTo(containerRef.current, { opacity: 0, skewX: 30, scale: 1.05 }, { opacity: 0.8, skewX: -15, scale: 0.98, duration: 0.05 })
          .to(containerRef.current, { opacity: 0.3, skewX: 20, scale: 1.02, duration: 0.05 })
          .to(containerRef.current, { opacity: 1, skewX: 0, scale: 1, duration: 0.1 });
      } 
      // Detect Exit
      else if (!isNowVisible && isVisibleRef.current) {
        isVisibleRef.current = false;
        gsap.killTweensOf(containerRef.current);
        
        // CRT Glitch Out
        const tl = gsap.timeline();
        tl.to(containerRef.current, { opacity: 0.8, skewX: -20, scale: 1.05, duration: 0.05 })
          .to(containerRef.current, { opacity: 0.3, skewX: 30, scale: 0.95, duration: 0.05 })
          .to(containerRef.current, { opacity: 0, skewX: 0, scale: 1, duration: 0.05, onComplete: () => {
            gsap.set(containerRef.current, { autoAlpha: 0 });
          }});
      }

      // clipIndex 0 is 'scene1-3'. When we are holding there, slide the UI horizontally.
      if (isNowVisible) {
        // Map the 0->1 progress across the 4 slides.
        // If we have 4 slides, we have 3 transitions.
        // We can just slide the container left horizontally.
        // -0% to -75% translation.

        // Add a tiny bit of ease so it doesn't feel jarring
        const targetX = -(progress * 75); // moves from 0 to -75% width
        gsap.to(slidesRef.current, {
          x: `${targetX}%`,
          duration: 0.1,
          ease: 'none',
          overwrite: 'auto'
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
      className="absolute top-[20%] left-[28%] w-[44.5%] h-[30%] pointer-events-none opacity-0 invisible"
      style={{ perspective: '1000px', zIndex: 50 }}
    >

      {/* The 3D Skewed Container */}
      <div
        className="w-full h-full overflow-hidden relative"
        style={{
          transform: 'rotateY(0deg) rotateX(0deg) rotateZ(0deg)',
          transformStyle: 'preserve-3d',
        }}
      >

        {/* The Sliding Track (4x width for 4 slides) */}
        <div ref={slidesRef} className="absolute inset-0 w-[400%] h-full flex">

          {/* Slide 1 */}
          <div className="w-1/4 h-full flex flex-col items-center justify-center p-8">
            <h2 className="text-4xl md:text-[4.5rem] text-black font-bold mb-6 text-center leading-tight" style={{ fontFamily: 'var(--font-monument)' }}>
              Slide 1: Overview
            </h2>
            <p className="text-lg md:text-xl text-black text-center font-medium max-w-2xl" style={{ fontFamily: 'var(--font-space-mono)' }}>
              Welcome to the boardroom. Scroll down to advance the slides.
            </p>
          </div>

          {/* Slide 2 */}
          <div className="w-1/4 h-full flex flex-col items-center justify-center p-8">
            <h2 className="text-4xl md:text-[4.5rem] text-black font-bold mb-6 text-center leading-tight" style={{ fontFamily: 'var(--font-monument)' }}>
              Slide 2: Data
            </h2>
            <p className="text-lg md:text-xl text-black text-center font-medium max-w-2xl" style={{ fontFamily: 'var(--font-space-mono)' }}>
              We track everything. No dropped frames.
            </p>
          </div>

          {/* Slide 3 */}
          <div className="w-1/4 h-full flex flex-col items-center justify-center p-8">
            <h2 className="text-4xl md:text-[4.5rem] text-black font-bold mb-6 text-center leading-tight" style={{ fontFamily: 'var(--font-monument)' }}>
              Slide 3: Growth
            </h2>
            <p className="text-lg md:text-xl text-black text-center font-medium max-w-2xl" style={{ fontFamily: 'var(--font-space-mono)' }}>
              Visualizing the infrastructure scale worldwide.
            </p>
          </div>

          {/* Slide 4 */}
          <div className="w-1/4 h-full flex flex-col items-center justify-center p-8">
            <h2 className="text-4xl md:text-[4.5rem] text-black font-bold mb-6 text-center leading-tight" style={{ fontFamily: 'var(--font-monument)' }}>
              Slide 4: End
            </h2>
            <p className="text-lg md:text-xl text-black text-center font-medium max-w-2xl" style={{ fontFamily: 'var(--font-space-mono)' }}>
              Prepare for the global rollout sequence.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
