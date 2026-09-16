'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * Optical Match-Cut Screen Handoff Transition (Panavision Anamorphic Cinema).
 *
 * Bridges both major film boundaries (Broker <-> Cities, and Cities <-> Finale):
 * - Pure floating cinema typography — zero pills, zero containers, zero boxes.
 * - Multi-layered anamorphic flare: razor-sharp white core, champagne gold halo, and electric sapphire streak.
 * - Central vertical optical glint spike mimicking real cylindrical anamorphic cinema lenses.
 * - Sequential choreography with complete dissolution into solid black before DOM swap (zero ghosting).
 */
export default function MacroFocusPullTransition() {
  const containerRef = useRef<HTMLDivElement>(null);
  const curtainRef = useRef<HTMLDivElement>(null);
  const blurOverlayRef = useRef<HTMLDivElement>(null);
  const bloomOverlayRef = useRef<HTMLDivElement>(null);
  const flareRef = useRef<HTMLDivElement>(null);
  const glintRef = useRef<HTMLDivElement>(null);
  const typographyRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLSpanElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const curtain = curtainRef.current;
    const blurOverlay = blurOverlayRef.current;
    const bloomOverlay = bloomOverlayRef.current;
    const flare = flareRef.current;
    const glint = glintRef.current;
    const typography = typographyRef.current;

    if (!container || !curtain || !blurOverlay || !bloomOverlay || !flare || !glint || !typography) {
      return;
    }

    // Reset initial dormant states
    gsap.set(container, { display: 'none' });
    gsap.set(curtain, { opacity: 1 });
    gsap.set(blurOverlay, { opacity: 0 });
    gsap.set(bloomOverlay, { opacity: 0, scale: 0.95 });
    gsap.set(flare, { opacity: 0, scaleX: 0.05 });
    gsap.set(glint, { opacity: 0, scaleY: 0.2 });
    gsap.set(typography, { opacity: 0, scale: 0.95, filter: 'blur(10px)' });

    const onTransitionEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{
        dir: 1 | -1;
        swap: () => Promise<void> | void;
        done: () => void;
        title?: string;
        subtitle?: string;
        igniteWorldMap?: boolean;
      }>;
      const {
        dir = 1,
        swap,
        done,
        title = 'SYNCING GLOBAL HUBS //',
        subtitle = 'DUBAI HQ BOARDROOM',
        igniteWorldMap = false,
      } = customEvent.detail ?? {};

      if (titleRef.current) titleRef.current.textContent = title;
      if (subtitleRef.current) subtitleRef.current.textContent = subtitle;

      if (timelineRef.current) {
        timelineRef.current.kill();
      }

      const tl = gsap.timeline({
        onComplete: () => {
          gsap.set(container, { display: 'none' });
          done?.();
        },
      });
      timelineRef.current = tl;

      // ── CINEMA ANAMORPHIC DUAL-PHASE CHOREOGRAPHY (1.85s total, swap at 1.20s) ────
      tl.set(container, { display: 'block' });
      tl.set(curtain, { opacity: 0 }); // Starts transparent so outgoing scene blurs & dissolves smoothly!
      tl.set([blurOverlay, bloomOverlay, flare, glint, typography], { opacity: 0 });

      // Phase 1: 0.00s -> 0.50s — Outgoing scene softly blurs and blooms; anamorphic flare sweeps open
      tl.to(
        blurOverlay,
        {
          opacity: 0.85,
          duration: 0.48,
          ease: 'power2.inOut',
        },
        0,
      );
      tl.to(
        bloomOverlay,
        {
          opacity: 1,
          scale: 1.06,
          duration: 0.50,
          ease: 'power2.out',
        },
        0,
      );
      tl.to(
        flare,
        {
          opacity: 1,
          scaleX: 1,
          duration: 0.46,
          ease: 'power3.out',
        },
        0.02,
      );
      tl.to(
        glint,
        {
          opacity: 0.95,
          scaleY: 1,
          duration: 0.38,
          ease: 'power2.out',
        },
        0.06,
      );
      tl.to(
        typography,
        {
          opacity: 1,
          scale: 1,
          filter: 'blur(0px)',
          duration: 0.50,
          ease: 'power2.out',
        },
        0.04,
      );

      // Smooth curtain fade-in: starts gentle so outgoing scene blurs under flare, reaches 100% black by 0.78s
      tl.to(
        curtain,
        {
          opacity: 1,
          duration: 0.62,
          ease: 'power2.inOut',
        },
        0.16,
      );

      // Phase 2: 0.50s -> 0.92s — Cinema hold: subtle organic drift in pristine clarity
      tl.to(typography, { scale: 1.015, duration: 0.42, ease: 'sine.inOut' }, 0.50);
      tl.to(flare, { scaleX: 1.03, duration: 0.42, ease: 'sine.inOut' }, 0.50);
      tl.to(glint, { opacity: 0.6, scaleY: 0.75, duration: 0.42, ease: 'sine.inOut' }, 0.50);
      tl.to(bloomOverlay, { scale: 1.10, duration: 0.42, ease: 'sine.inOut' }, 0.50);

      // Phase 3: 0.92s -> 1.16s — Pure dissolution of flare/typography into solid black curtain BEFORE swap!
      tl.to(
        flare,
        {
          opacity: 0,
          scaleX: 0.15,
          duration: 0.22,
          ease: 'power2.in',
        },
        0.92,
      );
      tl.to(
        glint,
        {
          opacity: 0,
          scaleY: 0.1,
          duration: 0.18,
          ease: 'power2.in',
        },
        0.94,
      );
      tl.to(
        typography,
        {
          opacity: 0,
          filter: 'blur(8px)',
          scale: 1.03,
          duration: 0.22,
          ease: 'power2.in',
        },
        0.94,
      );
      tl.to(
        bloomOverlay,
        {
          opacity: 0,
          scale: 1.0,
          duration: 0.24,
          ease: 'power2.inOut',
        },
        0.94,
      );
      tl.to(
        blurOverlay,
        {
          opacity: 0,
          duration: 0.24,
          ease: 'power2.inOut',
        },
        0.94,
      );

      // Phase 4: at 1.20s — DOM swap under 100% clean black curtain (zero ghosting)
      tl.call(
        () => {
          if (swap) {
            const res = swap();
            if (res instanceof Promise) {
              res.catch((err) => console.error('Focus pull transition swap error:', err));
            }
          }
          if (igniteWorldMap) {
            // Ignite the world map presentation immediately upon swap
            window.dispatchEvent(new CustomEvent('rechitta:ignite-world-map', { detail: { dir } }));
          }
        },
        undefined,
        1.20,
      );

      // Phase 5: 1.20s -> 1.85s — Solid black curtain dissolves smoothly, revealing incoming scene in full glory
      tl.to(
        curtain,
        {
          opacity: 0,
          duration: 0.65,
          ease: 'power2.out',
        },
        1.20,
      );
    };

    window.addEventListener('rechitta:macro-focus-pull-transition', onTransitionEvent);
    window.addEventListener('rechitta:match-cut-transition', onTransitionEvent);
    window.addEventListener('rechitta:satellite-beam-transition', onTransitionEvent);

    return () => {
      window.removeEventListener('rechitta:macro-focus-pull-transition', onTransitionEvent);
      window.removeEventListener('rechitta:match-cut-transition', onTransitionEvent);
      window.removeEventListener('rechitta:satellite-beam-transition', onTransitionEvent);
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="cinematic-match-cut-transition-overlay"
      className="fixed inset-0 pointer-events-none z-[55] overflow-hidden select-none"
      style={{ display: 'none' }}
      aria-hidden="true"
    >
      {/* 0. Solid Obsidian Backdrop Curtain — guarantees 100% black during DOM swap */}
      <div
        ref={curtainRef}
        className="absolute inset-0 w-full h-full bg-[#0A0A09]"
        style={{ willChange: 'opacity' }}
      />

      {/* 1. Optical Depth-of-Field Rack Blur */}
      <div
        ref={blurOverlayRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          opacity: 0,
          willChange: 'opacity',
        }}
      />

      {/* 2. Central Screen-Matched Luminance Bloom */}
      <div
        ref={bloomOverlayRef}
        className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-0"
        style={{ willChange: 'opacity, transform' }}
      >
        <div
          className="w-[125vw] h-[125vh] -translate-y-4 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 50% 46%, rgba(255, 255, 255, 0.38) 0%, rgba(221, 187, 115, 0.18) 22%, rgba(61, 111, 245, 0.16) 42%, rgba(10, 10, 9, 0.6) 70%, rgba(10, 10, 9, 0.98) 100%)',
          }}
        />
      </div>

      {/* 3. Multi-Layered Cinema Anamorphic Streak (Hot White Core + Gold & Sapphire Halo) */}
      <div
        ref={flareRef}
        className="absolute top-[46%] left-0 right-0 h-[2px] -translate-y-1/2 pointer-events-none opacity-0 flex items-center justify-center"
        style={{ willChange: 'opacity, transform' }}
      >
        {/* Outer Sapphire Gradient Flare */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(61, 111, 245, 0.08) 12%, rgba(61, 111, 245, 0.65) 32%, rgba(221, 187, 115, 0.85) 47%, rgba(255, 255, 255, 1) 50%, rgba(221, 187, 115, 0.85) 53%, rgba(61, 111, 245, 0.65) 68%, rgba(61, 111, 245, 0.08) 88%, transparent 100%)',
            filter: 'drop-shadow(0 0 14px rgba(61, 111, 245, 0.8))',
          }}
        />
        {/* Intense Razor White Core Line */}
        <div
          className="absolute h-[0.75px] w-[90vw] max-w-[1200px]"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 20%, rgba(255, 255, 255, 1) 50%, rgba(255, 255, 255, 0.4) 80%, transparent 100%)',
            filter: 'drop-shadow(0 0 4px #FFFFFF)',
          }}
        />
      </div>

      {/* 4. Vertical Optical Glint Spike (Cylindrical Anamorphic Lens Refraction) */}
      <div
        ref={glintRef}
        className="absolute top-[46%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] h-[48px] pointer-events-none opacity-0"
        style={{
          background:
            'linear-gradient(180deg, transparent 0%, rgba(221, 187, 115, 0.5) 25%, #FFFFFF 50%, rgba(221, 187, 115, 0.5) 75%, transparent 100%)',
          filter: 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.9))',
          willChange: 'opacity, transform',
        }}
      />

      {/* 5. Pure Floating Cinema Typography — Zero Pills, Zero Boxes */}
      <div
        ref={typographyRef}
        className="absolute top-[46%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-0 z-10 flex flex-col items-center justify-center text-center px-6 w-full max-w-2xl"
        style={{ willChange: 'opacity, transform, filter' }}
      >
        {/* Delicate Gold Status Eyebrow (Above Beam) */}
        <div className="flex items-center gap-2 mb-3.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#DDBB73] animate-ping" />
          <span className="text-[9.5px] sm:text-[10.5px] font-mono tracking-[0.38em] text-[#DDBB73] font-semibold uppercase drop-shadow-[0_0_10px_rgba(221,187,115,0.6)]">
            04:11 UTC · GLOBAL PROTOCOL
          </span>
        </div>

        {/* Main Cinematic Chapter Titles (Below Beam) */}
        <div className="flex flex-col items-center text-center mt-3.5">
          <h2
            ref={titleRef}
            className="text-xs sm:text-sm font-mono tracking-[0.32em] text-white/95 font-semibold uppercase drop-shadow-[0_2px_14px_rgba(0,0,0,0.9)]"
          >
            DISPATCHING BRIEFING
          </h2>
          <span
            ref={subtitleRef}
            className="text-[10px] sm:text-[11px] font-mono tracking-[0.28em] text-[#8FB4FF] uppercase mt-1.5 drop-shadow-[0_0_12px_rgba(61,111,245,0.5)]"
          >
            6 GLOBAL HUBS
          </span>
        </div>
      </div>
    </div>
  );
}
