'use client';

import { useEffect, useRef } from 'react';
import styles from './ScrollRail.module.css';

/**
 * The chapter rail.
 *
 * The name comes from the beat the film is actually parked on rather than from
 * a table of progress thresholds — those had to be re-derived by hand every
 * time a clip was retrimmed, and quietly drifted off the footage when nobody
 * did. The bar still reads continuous progress, so it sweeps during a shot.
 */
export default function ScrollRail({
  scrollData,
  label,
}: {
  scrollData: React.RefObject<{ progress: number }>;
  label: string;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let eased = 0;
    let last = performance.now();
    let frame: number;

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;

      const target = scrollData.current?.progress ?? 0;
      // Time-based easing, so the rail settles in the same ~0.2s regardless of
      // frame rate or how far the jump was.
      eased += (target - eased) * (reduced ? 1 : 1 - Math.exp(-dt / 0.2));

      if (dotRef.current) dotRef.current.style.transform = `scaleY(${eased})`;

      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [scrollData]);

  // Cross-fade the name rather than swapping it mid-glance.
  const shownRef = useRef(label);
  useEffect(() => {
    const el = labelRef.current;
    if (!el) return;
    if (shownRef.current === label) {
      el.textContent = label;
      el.style.opacity = '1';
      return;
    }
    el.style.opacity = '0';
    const timer = window.setTimeout(() => {
      shownRef.current = label;
      el.textContent = label;
      el.style.opacity = '1';
    }, 200);
    return () => window.clearTimeout(timer);
  }, [label]);

  return (
    <div ref={railRef} className={styles.rail} aria-hidden="true">
      <span ref={labelRef} className={styles.label} />
      <div className={styles.track} />
      <div ref={dotRef} className={styles.dot} />
    </div>
  );
}
