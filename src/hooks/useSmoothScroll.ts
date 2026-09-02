'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useDemoModal } from '@/contexts/DemoModalContext';

/**
 * Smooth scrolling, driven off GSAP's ticker so Lenis and ScrollTrigger share
 * one clock. Without this they run on separate rAF loops and the film lags a
 * frame behind the scroll position.
 *
 * `enabled` gates motion while the loader is up — Lenis is created once and
 * paused, rather than being torn down and rebuilt.
 */
export function useSmoothScroll(enabled: boolean) {
  const lenisRef = useRef<Lenis | null>(null);
  const { isOpen } = useDemoModal();

  useEffect(() => {
    // Honour the OS setting: no inertia for anyone who asked for less motion.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({
      duration: 0.9,
      smoothWheel: true,
      // Touch devices already have native inertia; overriding it feels wrong.
      syncTouch: false,
    });
    lenisRef.current = lenis;
    // Expose globally for programmatic scrolling
    (window as any).lenis = lenis;
    lenis.stop();

    lenis.on('scroll', ScrollTrigger.update);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    // Lag smoothing makes GSAP skip time after a stall, which desyncs Lenis.
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
      lenisRef.current = null;
      delete (window as any).lenis;
    };
  }, []);

  useEffect(() => {
    if (!lenisRef.current) return;
    if (enabled && !isOpen) lenisRef.current.start();
    else lenisRef.current.stop();
  }, [enabled, isOpen]);
}
