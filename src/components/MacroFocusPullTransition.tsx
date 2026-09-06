'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * Pure Cinematic Blur Transition.
 *
 * A clean, minimal optical rack-focus blur bridging Paris to the Finale:
 * - 0ms -> 180ms: Screen dissolves into smooth optical depth-of-field blur (blur: 16px).
 * - 180ms: Seamless video layer hand-off to pre-seeked last.mp4 beneath peak blur.
 * - 180ms -> 380ms: Optical blur smoothly clears, resolving directly onto the boardroom screen.
 * - Pure, minimal, zero distracting badges or diagrams, locked 120 FPS.
 */

export default function MacroFocusPullTransition() {
  const containerRef = useRef<HTMLDivElement>(null);
  const blurOverlayRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const blurOverlay = blurOverlayRef.current;

    if (!container || !blurOverlay) {
      return;
    }

    // Reset initial states
    gsap.set(container, { display: 'none', opacity: 0 });
    gsap.set(blurOverlay, { opacity: 0, backdropFilter: 'blur(0px)' });

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

      container.style.display = 'block';

      const tl = gsap.timeline({
        onComplete: () => {
          container.style.display = 'none';
          done?.();
        },
      });
      timelineRef.current = tl;

      // ── CHOREOGRAPHY (Clean 380ms Optical Blur Transition) ────────────

      tl.set(container, { opacity: 1 });
      tl.set(blurOverlay, { opacity: 0, backdropFilter: 'blur(0px)' });

      // Phase 1: 0.00s -> 0.18s — Screen smoothly blurs into optical depth-of-field
      tl.to(
        blurOverlay,
        {
          opacity: 1,
          backdropFilter: 'blur(16px)',
          duration: 0.18,
          ease: 'power2.inOut',
        },
        0
      );

      // Phase 2: Exactly at 0.18s — Instant video layer swap under peak blur
      tl.call(
        () => {
          if (swap) {
            const res = swap();
            if (res instanceof Promise) {
              res.catch((err) => console.error('Blur transition swap error:', err));
            }
          }
        },
        undefined,
        0.18
      );

      // Phase 3: 0.18s -> 0.38s — Blur smoothly clears, snapping crisp focus onto the destination
      tl.to(
        blurOverlay,
        {
          opacity: 0,
          backdropFilter: 'blur(0px)',
          duration: 0.2,
          ease: 'power2.inOut',
        },
        0.18
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
      id="cinematic-blur-transition-overlay"
      className="fixed inset-0 pointer-events-none z-[55] overflow-hidden select-none"
      style={{ display: 'none', willChange: 'opacity' }}
      aria-hidden="true"
    >
      {/* Pure Optical Depth-of-Field Rack Focus Layer */}
      <div
        ref={blurOverlayRef}
        className="absolute inset-0 pointer-events-none bg-[#070A10]/30"
        style={{
          backdropFilter: 'blur(0px)',
          WebkitBackdropFilter: 'blur(0px)',
          willChange: 'backdrop-filter, opacity',
        }}
      />
    </div>
  );
}
