'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { onLoadProgress } from '@/utils/loadProgress';
import styles from './Loader.module.css';

/** If the film stalls, the site still opens. Never trap someone here. */
const SAFETY_TIMEOUT_MS = 15000;

const PHASES = [
  { until: 0.45, label: 'Reading developer inventory' },
  { until: 0.8, label: 'Reconciling every unit' },
  { until: 1.01, label: 'Establishing the source of truth' },
];

export default function Loader({ onDone, orbReady = true }: { onDone: () => void, orbReady?: boolean }) {
  const shellRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<SVGCircleElement>(null);

  const [shown, setShown] = useState(0);
  const [gone, setGone] = useState(false);

  // Keep the latest callback without restarting the animation loop.
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  // Keep latest orbReady value to prevent stale closures in the tick loop
  const orbReadyRef = useRef(orbReady);
  useEffect(() => {
    orbReadyRef.current = orbReady;
  }, [orbReady]);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 810;
    const safetyTimeoutMs = isMobile ? 1800 : SAFETY_TIMEOUT_MS;

    let actual = 0;
    let eased = 0;
    let frame: number;
    let finishing = false;
    let mobileTimer: number | null = null;

    const safetyTimer = window.setTimeout(() => {
      finish();
    }, safetyTimeoutMs);

    const stopListening = onLoadProgress((value) => {
      if (value > actual) actual = value;
    });

    // On mobile devices, ensure a smooth, premium climb to 100% over 1.2s
    if (isMobile) {
      const start = performance.now();
      const mobileDuration = 1200;
      const updateMobileProgress = () => {
        const elapsed = performance.now() - start;
        const autoProgress = Math.min(1, elapsed / mobileDuration);
        if (autoProgress > actual) {
          actual = autoProgress;
        }
        if (autoProgress < 1 && !finishing) {
          mobileTimer = window.requestAnimationFrame(updateMobileProgress);
        }
      };
      mobileTimer = window.requestAnimationFrame(updateMobileProgress);
    }

    const finish = () => {
      if (finishing) return;
      finishing = true;
      if (mobileTimer) cancelAnimationFrame(mobileTimer);

      if (reduced) {
        setGone(true);
        onDoneRef.current();
        return;
      }

      // Smoothly fade out the loader ring, then fire onDone so the cinematic hero reveal can begin
      gsap.to(shellRef.current, { 
        opacity: 0, 
        duration: isMobile ? 0.45 : 0.8, 
        ease: 'power2.inOut',
        onComplete: () => {
          setGone(true);
          onDoneRef.current();
        }
      });
    };

    const tick = () => {
      // Chase the real number rather than snapping to it
      eased += (actual - eased) * (reduced ? 1 : isMobile ? 0.12 : 0.08);
      if (actual - eased < 0.001) eased = actual;

      // Re-render only when the readout would actually change, not every frame.
      setShown((prev) => (Math.round(prev * 1000) === Math.round(eased * 1000) ? prev : eased));

      // Update SVG circle stroke-dashoffset (circumference = 282.743)
      if (fillRef.current) {
        const offset = 282.743 * (1 - Math.min(1, eased));
        fillRef.current.style.strokeDashoffset = String(offset);
      }

      // Once visually at 100% (eased >= 0.99) and the 3D scene is ready, enter the site
      if ((eased >= 0.99 && orbReadyRef.current) || (isMobile && eased >= 0.99)) {
        finish();
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      if (mobileTimer) cancelAnimationFrame(mobileTimer);
      window.clearTimeout(safetyTimer);
      stopListening();
    };
  }, []);

  const phase = PHASES.find((p) => shown < p.until) ?? PHASES[PHASES.length - 1];
  const percent = String(Math.round(shown * 100)).padStart(3, '0');

  return (
    <div
      ref={shellRef}
      className={styles.shell}
      style={gone ? { display: 'none' } : undefined}
      role="progressbar"
      aria-label="Loading the Rechitta film"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(shown * 100)}
    >
      <div ref={panelRef} className={styles.panel}>
        
        {/* Massive Glowing Cyan SVG Ring */}
        <svg viewBox="0 0 100 100" className={styles.ringSvg}>
          <circle cx="50" cy="50" r="45" className={styles.track} />
          <circle ref={fillRef} cx="50" cy="50" r="45" className={styles.fill} />
        </svg>

        <div className={styles.readout}>
          <span className={styles.phase}>{phase.label}</span>
          <span className={styles.count}>{percent}%</span>
        </div>
      </div>
    </div>
  );
}
