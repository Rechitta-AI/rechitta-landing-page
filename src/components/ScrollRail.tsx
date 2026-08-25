'use client';

import { useEffect, useRef } from 'react';
import styles from './ScrollRail.module.css';

/** A hairline down the right edge with a dot marking scroll position. */
export default function ScrollRail({
  scrollData,
}: {
  scrollData: React.RefObject<{ progress: number }>;
}) {
  const dotRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let eased = 0;
    let frame: number;

    const tick = () => {
      const target = scrollData.current?.progress ?? 0;
      eased += (target - eased) * (reduced ? 1 : 0.12);

      if (dotRef.current && railRef.current) {
        dotRef.current.style.transform = `translateY(${eased * railRef.current.offsetHeight}px)`;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [scrollData]);

  return (
    <div ref={railRef} className={styles.rail} aria-hidden="true">
      <div className={styles.track} />
      <div ref={dotRef} className={styles.dot} />
    </div>
  );
}
