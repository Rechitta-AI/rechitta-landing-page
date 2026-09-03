'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

import { ScrollTrigger } from 'gsap/ScrollTrigger';

/** The deck shown on the boardroom screen, in order. */
const SLIDES = [
  '/presentation/1-FINAL.jpeg',
  '/presentation/2-FINAL.jpeg',
  '/presentation/3-FINAL.jpeg',
  '/presentation/4-FINAL.jpeg',
];

interface BoardroomPresentationProps {
  holdData: React.RefObject<{ clipIndex: number; progress: number; startProgress?: number; endProgress?: number }>;
}

export default function BoardroomPresentation({ holdData }: BoardroomPresentationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const slidesRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const isVisibleRef = useRef(false);

  const slideBy = (direction: -1 | 1) => {
    if (!holdData.current) return;
    const { progress } = holdData.current;
    // progress is 0.0 to 1.0. 
    // Slide 0: 0.0, Slide 1: 0.33, Slide 2: 0.66, Slide 3: 1.0
    // We can derive the current slide by multiplying by 3 and rounding
    const currentSlide = Math.round(progress * (SLIDES.length - 1));
    const nextSlide = Math.min(SLIDES.length - 1, Math.max(0, currentSlide + direction));
    scrollToSlide(nextSlide);
  };

  const scrollToSlide = (slideIndex: number) => {
    if (!holdData.current || holdData.current.startProgress === undefined || holdData.current.endProgress === undefined) return;
    const { startProgress, endProgress } = holdData.current;
    
    const numSlides = SLIDES.length;
    const progressRatio = slideIndex / (numSlides - 1);
    const targetGlobalProgress = startProgress + (endProgress - startProgress) * progressRatio;
    
    const maxST = ScrollTrigger.maxScroll(window) || (document.documentElement.scrollHeight - window.innerHeight);
    const targetPixel = targetGlobalProgress * maxST;

    if ((window as any).lenis) {
      (window as any).lenis.scrollTo(targetPixel, { duration: 1.2 });
    } else {
      window.scrollTo({ top: targetPixel, behavior: 'smooth' });
    }
  };

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
          onComplete: () => {
            gsap.set(containerRef.current, { autoAlpha: 0 });
            if (slidesRef.current) gsap.set(slidesRef.current, { x: '0%' });
            dotsRef.current.forEach((dot, i) => {
              if (!dot) return;
              if (i === 0) {
                dot.style.opacity = '1';
                dot.style.transform = 'scale(1.3)';
              } else {
                dot.style.opacity = '0.4';
                dot.style.transform = 'scale(1)';
              }
            });
          }
        });
      }

      // clipIndex 0 is 'scene1-3'. When we are holding there, slide the UI horizontally.
      if (isNowVisible) {
        // Map the 0->1 progress across the 4 slides.
        // If we have 4 slides, we have 3 transitions.
        // We can just slide the container left horizontally.
        // -0% to -75% translation.

        // Add a tiny bit of ease so it doesn't feel jarring
        const targetX = -(progress * (100 * (SLIDES.length - 1) / SLIDES.length));
        gsap.to(slidesRef.current, {
          x: `${targetX}%`,
          duration: 0.1,
          ease: 'none',
          overwrite: 'auto'
        });

        // Update dots
        const activeSlide = Math.floor(progress * SLIDES.length);
        const clampedSlide = Math.min(SLIDES.length - 1, Math.max(0, activeSlide));
        dotsRef.current.forEach((dot, i) => {
          if (!dot) return;
          if (i === clampedSlide) {
            dot.style.opacity = '1';
            dot.style.transform = 'scale(1.3)';
          } else {
            dot.style.opacity = '0.4';
            dot.style.transform = 'scale(1)';
          }
        });
      }

      frame = requestAnimationFrame(render);
    };

    frame = requestAnimationFrame(render);

    return () => cancelAnimationFrame(frame);
  }, [holdData]);

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
        className="w-full h-[90%] overflow-hidden relative"
        style={{
          transform: `rotateY(${ROTATE_Y}deg) rotateX(${ROTATE_X}deg) rotateZ(${ROTATE_Z}deg) scale(${SCALE})`,
          transformStyle: 'preserve-3d',
        }}
      >

        {/* The Sliding Track (4x width for 4 slides) */}
        <div ref={slidesRef} className="absolute inset-0 h-full flex" style={{ width: `${SLIDES.length * 100}%` }}>

          {SLIDES.map((src, i) => (
            <div
              key={src}
              className="h-full relative overflow-hidden bg-black shrink-0"
              style={{ width: `${100 / SLIDES.length}%` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`Slide ${i + 1}`}
                // The deck fills the screen edge to edge; the panel's aspect is
                // fixed by the footage, so cover is the only fit that leaves no
                // letterboxing against the video behind it.
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
              />
            </div>
          ))}

        </div>

      </div>

      {/* Manual Slide Dots and Arrows */}
      <div className="w-full h-[10%] flex items-center justify-center gap-6 pointer-events-auto mt-4" style={{ zIndex: 100 }}>
        
        {/* Left Arrow */}
        <button
          onClick={() => slideBy(-1)}
          className="p-2 rounded-full bg-black/50 text-white hover:bg-black transition-colors w-10 h-10 flex items-center justify-center font-bold"
          aria-label="Previous slide"
        >
          ←
        </button>

        {/* Dots */}
        <div className="flex items-center gap-4">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              ref={(el) => { dotsRef.current[i] = el; }}
              onClick={() => scrollToSlide(i)}
              className="w-4 h-4 rounded-full bg-black transition-all duration-300"
              style={{ opacity: 0.4 }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => slideBy(1)}
          className="p-2 rounded-full bg-black/50 text-white hover:bg-black transition-colors w-10 h-10 flex items-center justify-center font-bold"
          aria-label="Next slide"
        >
          →
        </button>

      </div>
    </div>
  );
}
