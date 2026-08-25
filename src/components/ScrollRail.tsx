'use client';

import { useEffect, useRef } from 'react';
import styles from './ScrollRail.module.css';

/**
 * Chapter starts, read off the footage itself rather than clip boundaries —
 * the visual beats fall inside clips, not between them. Each is the moment
 * described, converted to a fraction of the film's 44.1s across the 0–0.5
 * span the film occupies.
 */
const CHAPTERS = [
  { at: 0.0, label: 'I · Dawn' },
  { at: 0.051, label: 'II · The boardroom' },
  { at: 0.197, label: 'III · The broker' },
  { at: 0.396, label: 'IV · The buyer' },
  { at: 0.477, label: 'V · Worldwide' },
  { at: 0.85, label: 'VI · Dusk' },
];

export default function ScrollRail({
  scrollData,
}: {
  scrollData: React.RefObject<{ progress: number }>;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let eased = 0;
    let last = performance.now();
    let frame: number;
    let activeIndex = -1;
    let swapTimer = 0;

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;

      const target = scrollData.current?.progress ?? 0;
      // Time-based easing, so the rail settles in the same ~0.2s regardless of
      // frame rate or how far the jump was.
      eased += (target - eased) * (reduced ? 1 : 1 - Math.exp(-dt / 0.2));

      if (dotRef.current && railRef.current) {
        dotRef.current.style.transform = `translateY(${eased * railRef.current.offsetHeight}px)`;
      }

      let next = 0;
      for (let i = 0; i < CHAPTERS.length; i++) {
        if (eased >= CHAPTERS[i].at) next = i;
      }

      if (next !== activeIndex && labelRef.current) {
        const el = labelRef.current;
        const isFirst = activeIndex === -1;
        activeIndex = next;

        // Cross-fade the name rather than swapping it mid-glance.
        window.clearTimeout(swapTimer);
        if (isFirst || reduced) {
          el.textContent = CHAPTERS[next].label;
          el.style.opacity = '1';
        } else {
          el.style.opacity = '0';
          swapTimer = window.setTimeout(() => {
            el.textContent = CHAPTERS[activeIndex].label;
            el.style.opacity = '1';
          }, 200);
        }
      }

      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(swapTimer);
    };
  }, [scrollData]);

  return (
    <div ref={railRef} className={styles.rail} aria-hidden="true">
      <span ref={labelRef} className={styles.label} />
      <div className={styles.track} />
      <div ref={dotRef} className={styles.dot} />
    </div>
  );
}
