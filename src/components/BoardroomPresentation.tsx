'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface BoardroomPresentationProps {
  holdData: React.RefObject<{ clipIndex: number; progress: number }>;
}

export default function BoardroomPresentation({ holdData }: BoardroomPresentationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const slidesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame: number;

    const render = () => {
      if (!holdData.current || !containerRef.current || !slidesRef.current) {
        frame = requestAnimationFrame(render);
        return;
      }

      const { clipIndex, progress } = holdData.current;

      // clipIndex 0 is 'scene1-3'. When we are holding there, fade in the UI.
      if (clipIndex === 0) {
        // Fade in
        gsap.set(containerRef.current, { autoAlpha: 1 });

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

      } else {
        // Fade out when not holding on the TV
        gsap.set(containerRef.current, { autoAlpha: 0 });
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
            <h2 className="text-5xl md:text-6xl text-black font-bold mb-6 text-center leading-tight" style={{ fontFamily: 'var(--font-marcellus)' }}>
              Slide 1: Overview
            </h2>
            <p className="text-xl md:text-2xl text-black text-center font-medium max-w-2xl" style={{ fontFamily: 'var(--font-sora)' }}>
              Welcome to the boardroom. Scroll down to advance the slides.
            </p>
          </div>

          {/* Slide 2 */}
          <div className="w-1/4 h-full flex flex-col items-center justify-center p-8">
            <h2 className="text-5xl md:text-6xl text-black font-bold mb-6 text-center leading-tight" style={{ fontFamily: 'var(--font-marcellus)' }}>
              Slide 2: Data
            </h2>
            <p className="text-xl md:text-2xl text-black text-center font-medium max-w-2xl" style={{ fontFamily: 'var(--font-sora)' }}>
              We track everything. No dropped frames.
            </p>
          </div>

          {/* Slide 3 */}
          <div className="w-1/4 h-full flex flex-col items-center justify-center p-8">
            <h2 className="text-5xl md:text-6xl text-black font-bold mb-6 text-center leading-tight" style={{ fontFamily: 'var(--font-marcellus)' }}>
              Slide 3: Growth
            </h2>
            <p className="text-xl md:text-2xl text-black text-center font-medium max-w-2xl" style={{ fontFamily: 'var(--font-sora)' }}>
              Scaling infinitely with React and GSAP.
            </p>
          </div>

          {/* Slide 4 */}
          <div className="w-1/4 h-full flex flex-col items-center justify-center p-8">
            <h2 className="text-5xl md:text-6xl text-black font-bold mb-6 text-center leading-tight" style={{ fontFamily: 'var(--font-marcellus)' }}>
              Slide 4: End
            </h2>
            <p className="text-xl md:text-2xl text-black text-center font-medium max-w-2xl" style={{ fontFamily: 'var(--font-sora)' }}>
              Keep scrolling to resume the video.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
