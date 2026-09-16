'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import SplineOrb from './SplineOrb';
import styles from './OrbStage.module.css';
import { createClock, advanceClock } from '@/utils/filmClock';
import { ORB_PATH, EXCLUSION_ZONES, MIN_SCALE_FRACTION } from '@/orb/path';
import { findExclusionViolations, poseAt, resolvePath } from '@/orb/flight';
import { isPortraitFor, TABLET_MIN } from '@/hooks/useDeviceMode';
import type { FilmTiming, Keyframe, ResolvedKeyframe } from '@/orb/types';

/** How many past positions the trail replays. */
const TRAIL_LENGTH = 8;

/** Viewport-percent per frame below which the orb reads as settled, not flying. */
const TRAIL_MIN_SPEED = 0.06;
const TRAIL_MAX_SPEED = 1.1;

/** How long a hand-off flare lasts, ms. */
/*
 * The orb's visible core, in pixels at scale 1. The element around it is
 * `clamp(260px, 32vw, 420px)` because the bloom needs the room, so its box is
 * no use for working out where the sphere actually ends.
 */
const ORB_CORE_PX = 68;

/** Tablet and desktop draw the orb a quarter larger than phones (SplineOrb.module.css). */
const coreSizeFor = (width: number) => (width >= TABLET_MIN ? ORB_CORE_PX * 1.25 : ORB_CORE_PX);

/** What the chapter rail reserves along the bottom, badge included. */
const RAIL_BAND_PX = 78;

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
  const dockPoseRef = useRef<{ x: number; y: number } | null>(null);
  const finaleDockPoseRef = useRef<{ x: number; y: number } | null>(null);

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
    const portrait = isPortraitFor(window.innerWidth, window.innerHeight);
    return {
      x: ((rect.left + rect.width / 2) / window.innerWidth) * 100,
      y: ((rect.top + rect.height / 2) / window.innerHeight) * 100,
      scale: portrait ? 0.75 : 1.2,
    };
  };

  /**
   * Measures the bottom-center dock anchor inside the phone mockup.
   * Gives pixel-perfect docking across every phone height and aspect ratio.
   */
  const measureDockPose = (): { x: number; y: number } | null => {
    if (typeof window === 'undefined') return null;
    const target = document.getElementById('multilingual-dock-anchor');
    if (!target) return null;
    const rect = target.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return null;
    return {
      x: ((rect.left + rect.width / 2) / window.innerWidth) * 100,
      y: ((rect.top + rect.height / 2) / window.innerHeight) * 100,
    };
  };

  /**
   * Measures the finale dock anchor at the bottom of the boardroom table
   * below all content in the presentation scene.
   */
  const measureFinaleDockPose = (): { x: number; y: number } | null => {
    if (typeof window === 'undefined') return null;
    const target = document.getElementById('finale-dock-anchor');
    if (!target) return null;
    const rect = target.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return null;
    const x = ((rect.left + rect.width / 2) / window.innerWidth) * 100;
    const y = ((rect.top + rect.height / 2) / window.innerHeight) * 100;
    // Safety guard: ensure the docked orb never encroaches into the text/button space across any responsive screen
    return {
      x: Math.max(20, Math.min(80, x)),
      y: Math.max(88, Math.min(95, y)),
    };
  };

  /**
   * Measures the broker scene's orb anchor, above the answer column. Only
   * rendered on a composited desktop layout, so anywhere else this is null and
   * the authored pose stands.
   */
  const measureBrokerPose = (): { x: number; y: number } | null => {
    if (typeof window === 'undefined') return null;
    const target = document.getElementById('broker-orb-anchor');
    if (!target) return null;
    const rect = target.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return null;
    return {
      x: ((rect.left + rect.width / 2) / window.innerWidth) * 100,
      // Kept clear of the header along the top.
      y: Math.max(14, ((rect.top + rect.height / 2) / window.innerHeight) * 100),
    };
  };

  /**
   * Rebuilds the resolved path. Cheap, and only run when the film's measured
   * timing changes or the viewport resizes — not per frame.
   */
  const rebuildPath = () => {
    const timing = timingRef?.current ?? null;
    const hero = heroPoseRef.current;
    const portrait = typeof window !== 'undefined' ? isPortraitFor(window.innerWidth, window.innerHeight) : false;
    const dock = portrait ? (dockPoseRef.current ?? measureDockPose()) : null;
    const finaleDock = finaleDockPoseRef.current ?? measureFinaleDockPose();
    const brokerDock = portrait ? null : measureBrokerPose();

    const path: Keyframe[] = hero || dock || finaleDock || brokerDock
      ? ORB_PATH.map((k) => {
          let next = k;
          if (hero && k.hero) {
            next = { ...next, x: hero.x, y: hero.y, scale: hero.scale };
          }
          if (dock && k.dock) {
            next = {
              ...next,
              portrait: {
                ...next.portrait,
                x: +dock.x.toFixed(2),
                y: +dock.y.toFixed(2),
              },
            };
          }
          if (brokerDock && k.brokerDock) {
            next = { ...next, x: +brokerDock.x.toFixed(2), y: +brokerDock.y.toFixed(2) };
          }
          if (finaleDock && k.finaleDock) {
            next = {
              ...next,
              portrait: {
                ...next.portrait,
                x: +finaleDock.x.toFixed(2),
                y: +finaleDock.y.toFixed(2),
              },
            };
          }
          return next;
        })
      : ORB_PATH;

    /*
      The floor, measured off whatever the hero actually landed at rather than
      off the authored number: the hero's pose comes from the live
      `#hero-o-anchor`, so on a portrait screen it is a different size and the
      floor has to follow it.
    */
    const heroScale = hero?.scale ?? (portrait ? 0.75 : 1.2);
    const resolved = resolvePath(path, timing, portrait, heroScale * MIN_SCALE_FRACTION);
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
    const dock = measureDockPose();
    if (dock) dockPoseRef.current = dock;
    rebuildPath();

    const landingScale = heroPoseRef.current?.scale ?? (isPortraitFor(window.innerWidth, window.innerHeight) ? 0.75 : 1.2);

    gsap.to(holderRef.current, {
      x: deltaX,
      y: deltaY,
      scale: landingScale,
      duration: 1.5,
      ease: 'power3.inOut',
      onComplete: () => onOrbLanded?.(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [introPhase]);

  // ── Re-measure the anchors when the viewport changes ──────────────────
  useEffect(() => {
    const onResize = () => {
      const measured = measureHeroPose();
      if (measured) heroPoseRef.current = measured;
      const dock = measureDockPose();
      if (dock) dockPoseRef.current = dock;
      const fDock = measureFinaleDockPose();
      if (fDock) finaleDockPoseRef.current = fDock;
      rebuildPath();
    };
    const onRemeasure = () => {
      const dock = measureDockPose();
      if (dock) dockPoseRef.current = dock;
      const fDock = measureFinaleDockPose();
      if (fDock) finaleDockPoseRef.current = fDock;
      rebuildPath();
    };
    const dock = measureDockPose();
    if (dock) {
      dockPoseRef.current = dock;
      rebuildPath();
    }
    window.addEventListener('resize', onResize);
    window.addEventListener('rechitta:remeasure-dock', onRemeasure);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('rechitta:remeasure-dock', onRemeasure);
    };
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

      // Lazy-measure finale dock as the playhead approaches the finale scene
      if (progress >= 0.92 && !finaleDockPoseRef.current) {
        const fDock = measureFinaleDockPose();
        if (fDock) {
          finaleDockPoseRef.current = fDock;
          rebuildPath();
        }
      }

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
      const scale = pose.scale * (1 + breath + flare * 0.22);

      /*
       * The floor: the orb never sits on the chapter rail.
       *
       * Several beats park it low in the frame, and on a phone the rail also
       * carries the chapter badge above its track — so a pose that cleared the
       * rail on a desktop landed straight on "02 // BOARDROOM". Rather than
       * re-author every low keyframe per viewport, the path is clamped here
       * against the band the rail reserves, which is the one place that knows
       * both the pose and the viewport.
       */
      const coreRadius = (coreSizeFor(vw) / 2) * scale;
      const yCeiling = ((vh - RAIL_BAND_PX - coreRadius) / vh) * 100;
      const poseY = Math.min(pose.y, yCeiling);

      const px = vw * (pose.x / 100 - 0.5);
      const py = vh * (poseY / 100 - 0.5);

      if (holderRef.current) {
        holderRef.current.style.transform = `translate(${px}px, ${py}px) scale(${scale})`;
        holderRef.current.style.opacity = String(Math.min(1, pose.opacity + flare * 0.3) * fade);
        holderRef.current.style.filter = pose.blur > 0.05 ? `blur(${pose.blur}px)` : '';
      }


      // ── The trail ──────────────────────────────────────────────────
      const previousSample = history[0];
      const speed = previousSample
        ? Math.hypot(pose.x - previousSample.x, poseY - previousSample.y)
        : 0;

      history.unshift({ x: pose.x, y: poseY, scale });
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

      /*
       * The filament that used to reach across to the phone on a city change.
       *
       * It drew a line from the orb to the middle of the handset, which made
       * sense while the orb hung in the sky on the far side of the frame. The
       * orb now sits on the phone's own foot, so the line would be a stub
       * across the briefing it is supposed to be delivering. The flare on
       * every city change carries that beat on its own.
       */
      if (filamentRef.current) filamentRef.current.style.opacity = '0';

      // Above the drifted-orb threshold the orb should sit over the film,
      // below it the film's own overlays win.
      // Above the chapter rail at the foot of the screen — the orb is the
      // only thing that may cross it — and above the film's own overlays once
      // it has drifted past the halfway mark.
      if (stageRef.current) stageRef.current.style.zIndex = progress >= 0.5 ? '132' : '130';

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
