'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './ScrollRail.module.css';

/**
 * Chapter starts are the film's real cut points, derived from the frame count
 * of each sequence against the 0–0.5 span the film occupies, plus the globe
 * and finale chapters that follow it.
 */
const CHAPTERS = [
  { at: 0.0, name: 'The listing' },
  { at: 0.148, name: 'The broker' },
  { at: 0.341, name: 'The buyer' },
  { at: 0.432, name: 'The cloud' },
  { at: 0.5, name: 'One source of truth' },
  { at: 0.85, name: 'The close' },
];

export default function ScrollRail({
  scrollData,
}: {
  scrollData: React.RefObject<{ progress: number }>;
}) {
  const fillRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const [chapter, setChapter] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let eased = 0;
    let frame: number;
    let lastChapter = -1;

    const tick = () => {
      const target = scrollData.current?.progress ?? 0;
      eased += (target - eased) * (reduced ? 1 : 0.12);

      if (fillRef.current) fillRef.current.style.transform = `scaleY(${eased})`;
      if (knobRef.current && railRef.current) {
        knobRef.current.style.transform = `translateY(${eased * railRef.current.offsetHeight}px)`;
      }

      let next = 0;
      for (let i = 0; i < CHAPTERS.length; i++) {
        if (eased >= CHAPTERS[i].at) next = i;
      }
      // Only re-render on an actual chapter change, not every frame.
      if (next !== lastChapter) {
        lastChapter = next;
        setChapter(next);
      }

      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [scrollData]);

  return (
    <div ref={railRef} className={styles.rail} aria-hidden="true">
      <div className={styles.track} />
      <div ref={fillRef} className={styles.fill} />

      {CHAPTERS.map((c, i) => (
        <div
          key={c.name}
          className={`${styles.tick} ${i <= chapter ? styles.tickPassed : ''}`}
          style={{ top: `${c.at * 100}%` }}
        />
      ))}

      <div ref={knobRef} className={styles.knob}>
        <div className={styles.label}>
          <span>{CHAPTERS[chapter].name}</span>
          <span className={styles.index}>
            {String(chapter + 1).padStart(2, '0')} / {String(CHAPTERS.length).padStart(2, '0')}
          </span>
        </div>
      </div>
    </div>
  );
}
