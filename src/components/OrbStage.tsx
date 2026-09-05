'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import SplineOrb from './SplineOrb';
import styles from './OrbStage.module.css';
import { createClock, advanceClock } from '@/utils/filmClock';
import { ORB_PATH, EXCLUSION_ZONES } from '@/orb/path';
import { findExclusionViolations, poseAt, resolvePath } from '@/orb/flight';
import type { FilmTiming, Keyframe, ResolvedKeyframe } from '@/orb/types';

/** How many past positions the trail replays. */
const TRAIL_LENGTH = 8;

/** Viewport-percent per frame below which the orb reads as settled, not flying. */
const TRAIL_MIN_SPEED = 0.06;
const TRAIL_MAX_SPEED = 1.1;

/** How long a hand-off flare lasts, ms. */
const PULSE_MS = 520;

/** The orb's idle breathing while it is parked. */
const BREATH_AMPLITUDE = 0.02;
const BREATH_PERIOD_MS = 5200;

type Sample = { x: number; y: number; scale: number };

export default function OrbStage({
  scrollData,
  timingRef,
  cityPulseRef,
  introPhase = 'done',
  onOrbLanded,
  onOrbLoaded,
}: {
  scrollData: React.RefObject<{ progress: number }>;
  timingRef?: React.RefObject<FilmTiming | null>;
  cityPulseRef?: React.RefObject<{ at: number }>;
  introPhase?: 'loading' | 'moving' | 'revealing' | 'done';
  onOrbLanded?: () => void;
  onOrbLoaded?: () => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const holderRef = useRef<HTMLDivElement>(null);
  const trailLayerRef = useRef<HTMLDivElement>(null);
  const trailDotsRef = useRef<(HTMLDivElement | null)[]>([]);
  const filamentRef = useRef<HTMLDivElement>(null);

  // The GSAP intro move runs once; the scroll path picks up where it lands.
  const hasMovedRef = useRef(false);

  /**
   * The hero pose, measured from the "O" rather than authored. The first and
   * last keyframes both resolve to it, which is what makes the loop back to
   * the top invisible.
   */
  const heroPoseRef = useRef<Sample | null>(null);

  const resolvedRef = useRef<ResolvedKeyframe[]>([]);
  const lastTimingRef = useRef<FilmTiming | null>(null);
  const pulseAtRef = useRef<number>(-Infinity);
  const lastProgressRef = useRef<number>(0);
  const snappedIndexRef = useRef<number>(-1);
  const snappedAtRef = useRef<number>(-Infinity);

  /**
   * The hero pose: centred on the headline, not on its first letter.
   *
   * The orb used to land on the "O" and stand in for it. It now sits in the
   * middle of the line instead, with the heading painting over it, and the
   * finale resolves to this same measured pose so the loop stays seamless.
   */
  const measureHeroPose = (): Sample | null => {
    if (typeof window === 'undefined') return null;
    const target =
      document.getElementById('hero-orb-anchor') ??
      document.getElementById('hero-heading') ??
      document.getElementById('hero-o-anchor');
    if (!target) return null;
    const rect = target.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return null;
    return {
      x: ((rect.left + rect.width / 2) / window.innerWidth) * 100,
      y: ((rect.top + rect.height / 2) / window.innerHeight) * 100,
      scale: 1.2,
    };
  };

  /**
   * Rebuilds the resolved path. Cheap, and only run when the film's measured
   * timing changes or the viewport resizes — not per frame.
   */
  const rebuildPath = () => {
    const timing = timingRef?.current ?? null;
    const hero = heroPoseRef.current;

    const path: Keyframe[] = hero
      ? ORB_PATH.map((k) => (k.hero ? { ...k, x: hero.x, y: hero.y, scale: hero.scale } : k))
      : ORB_PATH;

    const resolved = resolvePath(path, timing);
    resolvedRef.current = resolved;
    lastTimingRef.current = timing;

    if (process.env.NODE_ENV !== 'production') {
      // A window onto the resolved path, for the calibration pass and for
      // automated verification. Dev only.
      (window as unknown as { __orb?: unknown }).__orb = {
        hero,
        timing,
        resolved: resolved.map((k) => ({ progress: +k.progress.toFixed(4), x: k.x, y: k.y, note: k.note })),
      };

      const dropped = path.length - resolved.length;
      if (timing && dropped > 0) {
        console.warn(`[orb] ${dropped} keyframe(s) could not be placed — anchored outside a clip's trim range?`);
      }
      findExclusionViolations(resolved, EXCLUSION_ZONES, timing).forEach((v) => {
        console.error(`[orb] keyframe ${v.keyframeIndex} sits on "${v.zoneLabel}" — an app mockup goes there.\n       ${v.note}`);
      });
    }
  };

  // ── The cinematic intro hand-off ──────────────────────────────────────
  useEffect(() => {
    if (introPhase !== 'moving' || hasMovedRef.current || !holderRef.current) return;
    hasMovedRef.current = true;

    const targetEl =
      document.getElementById('hero-orb-anchor') ??
      document.getElementById('hero-heading') ??
      document.getElementById('hero-o-anchor');
    if (!targetEl) return;

    const targetRect = targetEl.getBoundingClientRect();
    const holderRect = holderRef.current.getBoundingClientRect();

    const deltaX = targetRect.left + targetRect.width / 2 - (holderRect.left + holderRect.width / 2);
    const deltaY = targetRect.top + targetRect.height / 2 - (holderRect.top + holderRect.height / 2);

    heroPoseRef.current = measureHeroPose();
    rebuildPath();

    gsap.to(holderRef.current, {
      x: deltaX,
      y: deltaY,
      scale: 1.2,
      duration: 1.5,
      ease: 'power3.inOut',
      onComplete: () => onOrbLanded?.(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [introPhase]);

  // ── Re-measure the hero anchor when the viewport changes ──────────────
  useEffect(() => {
    const onResize = () => {
      const measured = measureHeroPose();
      if (measured) heroPoseRef.current = measured;
      rebuildPath();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── The flight ────────────────────────────────────────────────────────
  useEffect(() => {
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const clock = createClock(scrollData.current?.progress ?? 0);
    const history: Sample[] = [];
    let lastTime = performance.now();
    let frame: number;

    const tick = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (introPhase !== 'done') {
        frame = requestAnimationFrame(tick);
        return;
      }

      // The film republishes its timing as clip metadata arrives.
      if ((timingRef?.current ?? null) !== lastTimingRef.current) rebuildPath();

      const target = scrollData.current?.progress ?? 0;
      const progress = advanceClock(clock, target, dt);

      let pose = poseAt(resolvedRef.current, progress);

      // Reduced motion: the orb does not fly. It sits at the nearest beat and
      // dips through a fade when the beat changes, so the choreography still
      // reads without anything travelling across the screen.
      let fade = 1;
      if (reduceMotion && resolvedRef.current.length > 0) {
        let nearest = 0;
        let bestDistance = Infinity;
        resolvedRef.current.forEach((k, i) => {
          const distance = Math.abs(k.progress - progress);
          if (distance < bestDistance) {
            bestDistance = distance;
            nearest = i;
          }
        });
        if (nearest !== snappedIndexRef.current) {
          snappedIndexRef.current = nearest;
          snappedAtRef.current = now;
        }
        const k = resolvedRef.current[nearest];
        pose = { x: k.x, y: k.y, scale: k.scale, opacity: k.opacity, blur: k.blur };

        const sinceSnap = now - snappedAtRef.current;
        const FADE_MS = 320;
        fade = sinceSnap < FADE_MS ? Math.abs(sinceSnap / FADE_MS - 0.5) * 2 : 1;
      }

      // ── Hand-off flares ────────────────────────────────────────────
      if (!reduceMotion) {
        const previous = lastProgressRef.current;
        for (const k of resolvedRef.current) {
          if (!k.pulse) continue;
          const crossed =
            (previous < k.progress && progress >= k.progress) ||
            (previous > k.progress && progress <= k.progress);
          if (crossed) pulseAtRef.current = now;
        }
      }
      lastProgressRef.current = progress;

      // The multilingual chapter pulses on the cities, not on scroll.
      const cityAt = cityPulseRef?.current?.at ?? 0;
      if (!reduceMotion && cityAt > pulseAtRef.current) pulseAtRef.current = cityAt;

      const sincePulse = now - pulseAtRef.current;
      const pulse = sincePulse >= 0 && sincePulse < PULSE_MS ? 1 - sincePulse / PULSE_MS : 0;
      const flare = pulse * pulse;

      // A parked orb should look alive, not frozen.
      const breath = reduceMotion
        ? 0
        : Math.sin((now / BREATH_PERIOD_MS) * Math.PI * 2) * BREATH_AMPLITUDE;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const px = vw * (pose.x / 100 - 0.5);
      const py = vh * (pose.y / 100 - 0.5);
      const scale = pose.scale * (1 + breath + flare * 0.22);

      if (holderRef.current) {
        holderRef.current.style.transform = `translate(${px}px, ${py}px) scale(${scale})`;
        holderRef.current.style.opacity = String(Math.min(1, pose.opacity + flare * 0.3) * fade);
        holderRef.current.style.filter = pose.blur > 0.05 ? `blur(${pose.blur}px)` : '';
      }


      // ── The trail ──────────────────────────────────────────────────
      const previousSample = history[0];
      const speed = previousSample
        ? Math.hypot(pose.x - previousSample.x, pose.y - previousSample.y)
        : 0;

      history.unshift({ x: pose.x, y: pose.y, scale });
      if (history.length > TRAIL_LENGTH + 1) history.pop();

      const intensity = reduceMotion
        ? 0
        : Math.max(0, Math.min(1, (speed - TRAIL_MIN_SPEED) / (TRAIL_MAX_SPEED - TRAIL_MIN_SPEED)));

      trailDotsRef.current.forEach((dot, i) => {
        if (!dot) return;
        const sample = history[i + 1];
        if (!sample || intensity <= 0) {
          dot.style.opacity = '0';
          return;
        }
        const age = 1 - i / TRAIL_LENGTH;
        const dx = vw * (sample.x / 100 - 0.5);
        const dy = vh * (sample.y / 100 - 0.5);
        dot.style.transform = `translate(${dx}px, ${dy}px) scale(${sample.scale * age})`;
        dot.style.opacity = String(intensity * age * 0.5 * pose.opacity);
      });

      // ── The filament, drawn to the phone on a city change ──────────
      if (filamentRef.current) {
        const active = flare > 0.01 && progress > 0.5 && progress < 0.95;
        if (!active) {
          filamentRef.current.style.opacity = '0';
        } else {
          const phone = document.getElementById('multilingual-phone');
          const rect = phone?.getBoundingClientRect();
          if (rect) {
            const dx = rect.left + rect.width / 2 - (vw / 2 + px);
            const dy = rect.top + rect.height / 2 - (vh / 2 + py);
            filamentRef.current.style.width = `${Math.hypot(dx, dy)}px`;
            filamentRef.current.style.transform =
              `translate(${px}px, ${py}px) rotate(${Math.atan2(dy, dx)}rad)`;
            filamentRef.current.style.opacity = String(flare * 0.75);
          }
        }
      }

      // Above the drifted-orb threshold the orb should sit over the film,
      // below it the film's own overlays win.
      if (stageRef.current) stageRef.current.style.zIndex = progress >= 0.5 ? '27' : '25';

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollData, introPhase, timingRef, cityPulseRef]);

  return (
    <>

      <div ref={trailLayerRef} className={styles.trailLayer} aria-hidden="true">
        {Array.from({ length: TRAIL_LENGTH }).map((_, i) => (
          <div
            key={i}
            ref={(el) => {
              trailDotsRef.current[i] = el;
            }}
            className={styles.trailDot}
          />
        ))}
        <div ref={filamentRef} className={styles.filament} />
      </div>

      <div ref={stageRef} className={styles.stage} aria-hidden="true">
        <div ref={holderRef} className={styles.holder}>
          <SplineOrb onLoaded={onOrbLoaded} />
        </div>
      </div>
    </>
  );
}
