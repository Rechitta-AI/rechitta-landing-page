'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * Optical Match-Cut Screen Handoff Transition.
 *
 * Bridges the Multilingual Cities chapter (Paris phone screen) to the Finale (Boardroom Monitor):
 * - Phase 1 (0ms - 220ms): Central screen-matched luminance bloom flares, optical rack-focus blur peaks (16px),
 *   and an electric blue anamorphic lens flare sweeps across the frame.
 * - Phase 2 (220ms - 920ms): The bloom holds while the badge is read. Without this the whole
 *   thing ran in 460ms and the one line of copy on it was gone before anyone could
 *   finish it — a sync that says what it is doing has to be legible to be worth showing.
 * - Phase 3 (at 920ms): Instantaneous video/stage DOM hand-off under peak optical bloom, firing 'rechitta:ignite-world-map'.
 * - Phase 4 (920ms - 1200ms): Optical blur and bloom contract directly into the boardroom monitor bezels,
 *   snapping razor-sharp focus onto the physical display.
 * - Reversible: Symmetrical optical focus pull on reverse scroll (Dubai -> Paris).
 */
/** How long the bloomed frame holds on the badge before the cut, in seconds. */
const HOLD = 0.7;
/** When the DOM hand-off happens: the end of the ramp plus the hold. */
const CUT = 0.22 + HOLD;

export default function MacroFocusPullTransition() {
  const containerRef = useRef<HTMLDivElement>(null);
  const blurOverlayRef = useRef<HTMLDivElement>(null);
  const bloomOverlayRef = useRef<HTMLDivElement>(null);
  const flareRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const blurOverlay = blurOverlayRef.current;
    const bloomOverlay = bloomOverlayRef.current;
    const flare = flareRef.current;
    const badge = badgeRef.current;

    if (!container || !blurOverlay || !bloomOverlay || !flare || !badge) {
      return;
    }

    // Reset initial states
    gsap.set(container, { display: 'none' });
    gsap.set(blurOverlay, { opacity: 0, backdropFilter: 'blur(0px)' });
    gsap.set(bloomOverlay, { opacity: 0, scale: 0.95 });
    gsap.set(flare, { opacity: 0, scaleX: 0.1 });
    gsap.set(badge, { opacity: 0, scale: 0.9, y: 10 });

    const onTransitionEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{
        dir: 1 | -1;
        swap: () => Promise<void> | void;
        done: () => void;
      }>;
      const { dir = 1, swap, done } = customEvent.detail ?? {};

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

      // ── MATCH-CUT CHOREOGRAPHY (1.20s total, 0.70s of it the hold) ────

      tl.set(container, { display: 'block' });
      tl.set(blurOverlay, { opacity: 0, backdropFilter: 'blur(0px)' });
      tl.set(bloomOverlay, { opacity: 0, scale: 0.94 });
      tl.set(flare, { opacity: 0, scaleX: 0.1 });
      tl.set(badge, { opacity: 0, scale: 0.92, y: 8 });

      // Phase 1: 0.00s -> 0.20s — Screen light blooms, blur peaks at 16px, anamorphic laser streak expands
      tl.to(
        blurOverlay,
        {
          opacity: 1,
          backdropFilter: 'blur(16px)',
          duration: 0.2,
          ease: 'power2.inOut',
        },
        0
      );
      tl.to(
        bloomOverlay,
        {
          opacity: 1,
          scale: 1.05,
          duration: 0.2,
          ease: 'power2.out',
        },
        0
      );
      tl.to(
        flare,
        {
          opacity: 1,
          scaleX: 1,
          duration: 0.18,
          ease: 'power3.out',
        },
        0.02
      );
      tl.to(
        badge,
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.16,
          ease: 'back.out(1.4)',
        },
        0.06
      );

      /*
       * Phase 2: 0.22s -> 0.92s — the hold.
       *
       * The frame is at peak bloom with one line of copy on it, which is the
       * whole point of the beat: the film is saying what it is doing between
       * two scenes. It holds long enough to be read.
       *
       * The streak and the bloom keep drifting through it, by almost nothing.
       * Held at fixed values for seven tenths of a second the frame stops
       * reading as a shot and starts reading as a stall.
       */
      tl.to(badge, { opacity: 1, duration: HOLD, ease: 'none' }, 0.22);
      tl.to(flare, { scaleX: 1.08, duration: HOLD, ease: 'sine.inOut' }, 0.22);
      tl.to(bloomOverlay, { scale: 1.12, duration: HOLD, ease: 'sine.inOut' }, 0.22);

      // Phase 3: at 0.92s — Seamless match-cut DOM swap beneath peak bloom
      tl.call(
        () => {
          if (swap) {
            const res = swap();
            if (res instanceof Promise) {
              res.catch((err) => console.error('Match-cut transition swap error:', err));
            }
          }
          // Ignite the world map presentation immediately upon swap
          window.dispatchEvent(new CustomEvent('rechitta:ignite-world-map', { detail: { dir } }));
        },
        undefined,
        CUT
      );

      // Phase 4: 0.92s -> 1.20s — Optical blur and bloom clear, snapping sharp focus onto boardroom screen
      tl.to(
        flare,
        {
          opacity: 0,
          scaleX: 0.25,
          duration: 0.18,
          ease: 'power2.in',
        },
        CUT
      );
      tl.to(
        badge,
        {
          opacity: 0,
          scale: 1.04,
          y: -6,
          duration: 0.16,
          ease: 'power2.in',
        },
        CUT + 0.02
      );
      tl.to(
        bloomOverlay,
        {
          opacity: 0,
          scale: 1.0,
          duration: 0.24,
          ease: 'power3.out',
        },
        CUT + 0.02
      );
      tl.to(
        blurOverlay,
        {
          opacity: 0,
          backdropFilter: 'blur(0px)',
          duration: 0.25,
          ease: 'power3.out',
        },
        CUT + 0.01
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
      {/* 1. Base Optical Depth-of-Field Blur */}
      <div
        ref={blurOverlayRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          backdropFilter: 'blur(0px)',
          WebkitBackdropFilter: 'blur(0px)',
          willChange: 'backdrop-filter, opacity',
        }}
      />

      {/* 2. Central Screen-Matched Luminance Bloom (bridges phone & monitor glass) */}
      <div
        ref={bloomOverlayRef}
        className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-0"
        style={{ willChange: 'opacity, transform' }}
      >
        <div
          className="w-[125vw] h-[125vh] -translate-y-4 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 50% 46%, rgba(255, 255, 255, 0.42) 0%, rgba(86, 141, 255, 0.24) 30%, rgba(7, 10, 16, 0.58) 65%, rgba(7, 10, 16, 0.94) 100%)',
          }}
        />
      </div>

      {/* 3. Anamorphic Laser Streak in Rechitta Electric Blue (#568DFF) */}
      <div
        ref={flareRef}
        className="absolute top-[46%] left-0 right-0 h-[2.5px] -translate-y-1/2 pointer-events-none opacity-0 flex items-center justify-center"
        style={{ willChange: 'opacity, transform' }}
      >
        <div
          className="w-full h-full"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(86, 141, 255, 0.2) 20%, rgba(255, 255, 255, 0.95) 50%, rgba(86, 141, 255, 0.2) 80%, transparent 100%)',
            filter: 'drop-shadow(0 0 10px #568DFF)',
          }}
        />
      </div>

      {/* 4. Subtle Micro HUD Telemetry Badge (flashes at peak transition) */}
      <div
        ref={badgeRef}
        className="absolute top-[46%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-0 z-10"
        style={{ willChange: 'opacity, transform' }}
      >
        <div className="px-4 py-1.5 rounded-full bg-[#070A10]/95 border border-[#568DFF]/40 shadow-[0_0_25px_rgba(86,141,255,0.4)] backdrop-blur-md flex items-center gap-2 text-[10px] font-mono tracking-[0.2em] text-white">
          <span className="w-1.5 h-1.5 rounded-full bg-[#568DFF] animate-ping" />
          {/*
            Broken where it means something. Left to wrap on its own the line
            split mid-phrase on a narrow screen — "SYNCING GLOBAL / HUBS //
            DUBAI HQ" — so the two halves of the statement did not line up
            with the two lines carrying them.
          */}
          <span className="flex flex-col font-semibold uppercase leading-[1.35] text-[#8FB4FF]">
            <span className="whitespace-nowrap">SYNCING GLOBAL HUBS //</span>
            <span className="whitespace-nowrap">DUBAI HQ</span>
          </span>
        </div>
      </div>
    </div>
  );
}

