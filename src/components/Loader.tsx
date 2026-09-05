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

    let actual = 0;
    let eased = 0;
    let frame: number;
    let finishing = false;

    const safetyTimer = window.setTimeout(() => {
      finish();
    }, SAFETY_TIMEOUT_MS);

    const stopListening = onLoadProgress((value) => {
      actual = value;
    });

    const finish = () => {
      if (finishing) return;
      finishing = true;

      if (reduced) {
        setGone(true);
        onDoneRef.current();
        return;
      }

      // Smoothly fade out the loader ring, then fire onDone so the cinematic hero reveal can begin
      gsap.to(shellRef.current, { 
        opacity: 0, 
        duration: 0.8, 
        ease: 'power2.inOut',
        onComplete: () => {
          setGone(true);
          onDoneRef.current();
        }
      });
    };

    const tick = () => {
      // Chase the real number rather than snapping to it
      eased += (actual - eased) * (reduced ? 1 : 0.08);
      if (actual - eased < 0.001) eased = actual;

      setShown(eased);
      
      // Update SVG circle stroke-dashoffset (circumference = 282.743)
      if (fillRef.current) {
        const offset = 282.743 * (1 - Math.min(1, eased));
        fillRef.current.style.strokeDashoffset = String(offset);
      }

      // Once visually at 100% (eased >= 0.99) and the 3D scene is ready, enter the site
      if (eased >= 0.99 && orbReadyRef.current) {
        finish();
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
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
