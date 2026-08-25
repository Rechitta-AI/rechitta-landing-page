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

export default function Loader({ onDone }: { onDone: () => void }) {
  const shellRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);

  const [shown, setShown] = useState(0);
  const [gone, setGone] = useState(false);

  // Keep the latest callback without restarting the animation loop.
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let actual = 0;
    let eased = 0;
    let frame: number;
    let finishing = false;

    let forced = false;

    const stopListening = onLoadProgress((value) => {
      // Never let a later report walk back past the safety hatch.
      actual = forced ? 1 : value;
    });

    const safety = window.setTimeout(() => {
      forced = true;
      actual = 1;
    }, SAFETY_TIMEOUT_MS);

    const finish = () => {
      if (finishing) return;
      finishing = true;

      if (reduced) {
        setGone(true);
        onDoneRef.current();
        return;
      }

      gsap
        .timeline({
          delay: 0.35,
          onComplete: () => {
            setGone(true);
            onDoneRef.current();
          },
        })
        .to(panelRef.current, { opacity: 0, y: -14, duration: 0.5, ease: 'power2.in' })
        .to(shellRef.current, { opacity: 0, duration: 0.7, ease: 'power2.inOut' }, '-=0.15');
    };

    const tick = () => {
      // Chase the real number rather than snapping to it, so the counter
      // always reads as motion even when a large file lands at once.
      eased += (actual - eased) * (reduced ? 1 : 0.08);
      if (actual - eased < 0.001) eased = actual;

      setShown(eased);
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${eased})`;

      if (eased >= 0.999) {
        finish();
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(safety);
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
        <p className={styles.wordmark}>RECHITTA</p>
        <div className={styles.rule}>
          <div ref={fillRef} className={styles.fill} />
        </div>
        <div className={styles.readout}>
          <span className={styles.phase}>{phase.label}</span>
          <span className={styles.count}>{percent}</span>
        </div>
      </div>
    </div>
  );
}
