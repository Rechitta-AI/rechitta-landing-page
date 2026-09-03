'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BOARDROOM_SCREEN } from '@/screens/tracks';
import { coverRect, matrix3dFor, toViewport } from '@/screens/warp';

/** The deck shown on the boardroom screen, in order. */
const SLIDES = [
  '/presentation/1-FINAL.jpeg',
  '/presentation/2-FINAL.jpeg',
  '/presentation/3-FINAL.jpeg',
  '/presentation/4-FINAL.jpeg',
];

/**
 * The transform's source rectangle, at the screen's own aspect. Large enough
 * that the slides are still sharp once warped onto the display.
 */
const BASE_WIDTH = 1600;
const BASE_HEIGHT = 843;

/**
 * Margin inside the display, in base pixels — NOT a percentage. A percentage
 * padding resolves against the containing block's width, which here is the
 * whole four-slide track, so `2.5%` became 160px and shrank each slide to half
 * the screen.
 */
const INSET = 22;

/**
 * How the deck sits on the display. The slides are 16:10 and the screen is
 * nearer 16:8.4, so the two cannot both fill it and keep every edge. 'contain'
 * keeps the whole slide and lets the display's own white plate show as a
 * border; 'cover' fills the glass edge to edge and crops roughly 8% off the
 * top and bottom of each slide.
 */
const FIT: 'contain' | 'cover' = 'contain';

interface BoardroomPresentationProps {
  holdData: React.RefObject<{ clipIndex: number; progress: number; startProgress?: number; endProgress?: number }>;
}

export default function BoardroomPresentation({ holdData }: BoardroomPresentationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const slidesRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const isVisibleRef = useRef(false);

  const slideBy = (direction: -1 | 1) => {
    if (!holdData.current) return;
    const currentSlide = Math.round(holdData.current.progress * (SLIDES.length - 1));
    scrollToSlide(Math.min(SLIDES.length - 1, Math.max(0, currentSlide + direction)));
  };

  const scrollToSlide = (slideIndex: number) => {
    if (!holdData.current || holdData.current.startProgress === undefined || holdData.current.endProgress === undefined) return;
    const { startProgress, endProgress } = holdData.current;

    const progressRatio = slideIndex / (SLIDES.length - 1);
    const targetGlobalProgress = startProgress + (endProgress - startProgress) * progressRatio;

    const maxST = ScrollTrigger.maxScroll(window) || (document.documentElement.scrollHeight - window.innerHeight);
    const targetPixel = targetGlobalProgress * maxST;

    const lenis = (window as unknown as { lenis?: { scrollTo: (px: number, opts: object) => void } }).lenis;
    if (lenis) lenis.scrollTo(targetPixel, { duration: 1.2 });
    else window.scrollTo({ top: targetPixel, behavior: 'smooth' });
  };

  useEffect(() => {
    let frame: number;

    const render = () => {
      if (!holdData.current || !containerRef.current || !slidesRef.current) {
        frame = requestAnimationFrame(render);
        return;
      }

      // Where the display actually is. It was previously pinned with viewport
      // percentages, which only held at one window shape: the film is drawn
      // `object-fit: cover`, so the screen slides off the plate as soon as the
      // viewport's aspect differs from the footage's.
      const rect = coverRect(window.innerWidth, window.innerHeight);
      const quad = toViewport(BOARDROOM_SCREEN, rect);

      if (screenRef.current) {
        const matrix = matrix3dFor(BASE_WIDTH, BASE_HEIGHT, quad);
        if (matrix !== 'none') screenRef.current.style.transform = matrix;
      }

      // The controls sit below the screen rather than on top of the deck.
      if (controlsRef.current) {
        const bottomLeft = quad[3];
        const bottomRight = quad[2];
        controlsRef.current.style.left = `${(bottomLeft[0] + bottomRight[0]) / 2}px`;
        controlsRef.current.style.top = `${Math.max(bottomLeft[1], bottomRight[1]) + 28}px`;
      }

      const { clipIndex, progress } = holdData.current;
      const isNowVisible = clipIndex === 0;

      if (isNowVisible && !isVisibleRef.current) {
        isVisibleRef.current = true;
        gsap.killTweensOf(containerRef.current);
        gsap.set(containerRef.current, { autoAlpha: 1 });
        gsap.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 0.8, ease: 'power3.out' });
      } else if (!isNowVisible && isVisibleRef.current) {
        isVisibleRef.current = false;
        gsap.killTweensOf(containerRef.current);
        gsap.to(containerRef.current, {
          opacity: 0,
          duration: 0.5,
          ease: 'power2.inOut',
          onComplete: () => {
            gsap.set(containerRef.current, { autoAlpha: 0 });
            if (slidesRef.current) gsap.set(slidesRef.current, { x: '0%' });
            dotsRef.current.forEach((dot, i) => {
              if (!dot) return;
              dot.style.opacity = i === 0 ? '1' : '0.4';
              dot.style.transform = i === 0 ? 'scale(1.3)' : 'scale(1)';
            });
          },
        });
      }

      if (isNowVisible) {
        const targetX = -(progress * (100 * (SLIDES.length - 1)) / SLIDES.length);
        gsap.to(slidesRef.current, { x: `${targetX}%`, duration: 0.1, ease: 'none', overwrite: 'auto' });

        const activeSlide = Math.min(SLIDES.length - 1, Math.max(0, Math.floor(progress * SLIDES.length)));
        dotsRef.current.forEach((dot, i) => {
          if (!dot) return;
          dot.style.opacity = i === activeSlide ? '1' : '0.4';
          dot.style.transform = i === activeSlide ? 'scale(1.3)' : 'scale(1)';
        });
      }

      frame = requestAnimationFrame(render);
    };

    frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, [holdData]);

  return (
    <div ref={containerRef} className="absolute inset-0 opacity-0 invisible pointer-events-none" style={{ zIndex: 50 }}>
      {/* The deck, warped onto the display. */}
      <div
        ref={screenRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: BASE_WIDTH,
          height: BASE_HEIGHT,
          transformOrigin: '0 0',
          overflow: 'hidden',
        }}
      >
        <div
          ref={slidesRef}
          className="absolute inset-0 h-full flex"
          style={{ width: `${SLIDES.length * 100}%` }}
        >
          {SLIDES.map((src, i) => (
            <div
              key={src}
              className="h-full shrink-0 flex items-center justify-center overflow-hidden"
              style={{ width: `${100 / SLIDES.length}%`, padding: FIT === 'contain' ? INSET : 0 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`Slide ${i + 1}`}
                // Contained by default, so nothing is cut: these are slides,
                // and cropping a deck loses its headings. The margin shows the
                // display's own white plate, so it reads as part of the shot.
                className={FIT === 'contain' ? 'max-w-full max-h-full object-contain' : 'w-full h-full object-cover'}
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Arrows and dots, below the screen. */}
      <div
        ref={controlsRef}
        className="absolute flex items-center justify-center gap-6 pointer-events-auto -translate-x-1/2"
        style={{ zIndex: 100 }}
      >
        <button
          onClick={() => slideBy(-1)}
          className="p-2 rounded-full bg-black/50 text-white hover:bg-black transition-colors w-10 h-10 flex items-center justify-center font-bold"
          aria-label="Previous slide"
        >
          ←
        </button>

        <div className="flex items-center gap-4">
          {SLIDES.map((src, i) => (
            <button
              key={src}
              ref={(el) => { dotsRef.current[i] = el; }}
              onClick={() => scrollToSlide(i)}
              className="w-3 h-3 rounded-full bg-white transition-all duration-300"
              style={{ opacity: 0.4 }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

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
