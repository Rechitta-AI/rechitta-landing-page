'use client';

import { useEffect, useRef } from 'react';
import { BEATS } from '@/film/score';
import styles from './ScrollRail.module.css';

/**
 * The chapter rail.
 *
 * Six named chapters, each given the same share of the width so the names can
 * never crowd one another. Inside a chapter there is one tick per beat, which
 * is what shows the transitions and the scenes sitting between the named
 * moments — the multilingual chapter is six cities wide, the others are one.
 *
 * It runs along the bottom because every scene puts its copy down the side of
 * the window, which is where the rail used to be.
 */

const CHAPTERS: { label: string; from: string }[] = [
  { label: 'Dawn', from: 'hero' },
  { label: 'Boardroom', from: 'boardroom' },
  { label: 'Broker', from: 'broker' },
  { label: 'Buyer', from: 'buyer' },
  { label: 'World', from: 'city-mumbai' },
  { label: 'Dusk', from: 'finale' },
];

/** The beats belonging to each chapter, in order. */
const GROUPS = CHAPTERS.map((chapter, ci) => {
  const start = BEATS.findIndex((b) => b.id === chapter.from);
  const nextChapter = CHAPTERS[ci + 1];
  const end = nextChapter ? BEATS.findIndex((b) => b.id === nextChapter.from) : BEATS.length;
  return { label: chapter.label, from: start, count: Math.max(1, end - start) };
});

export default function ScrollRail({
  beatPosition,
  beatIndex,
}: {
  /** Where the film is as a fractional beat, written every frame. */
  beatPosition: React.RefObject<number>;
  /** The beat last arrived at, for the chapter name. */
  beatIndex: number;
}) {
  const fillRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let eased = 0;
    let last = performance.now();
    let frame: number;

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;

      const target = beatPosition.current ?? 0;
      eased += (target - eased) * (reduced ? 1 : 1 - Math.exp(-dt / 0.16));

      // Ticks behind the playhead are full, the one being travelled fills
      // across, and the rest are empty.
      fillRefs.current.forEach((el, i) => {
        if (!el) return;
        el.style.transform = `scaleX(${Math.max(0, Math.min(1, eased - i + 1))})`;
      });

      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [beatPosition]);

  const activeChapter = Math.max(
    0,
    GROUPS.findIndex((g, i) => {
      const next = GROUPS[i + 1];
      return beatIndex >= g.from && (!next || beatIndex < next.from);
    }),
  );

  return (
    <div className={styles.rail} aria-hidden="true">
      <div className={styles.chapters}>
        {GROUPS.map((group) => (
          <div key={group.label} className={styles.chapter}>
            <div className={styles.ticks}>
              {Array.from({ length: group.count }).map((_, n) => {
                const beat = group.from + n;
                return (
                  <div key={beat} className={styles.tick}>
                    <span
                      ref={(el) => {
                        fillRefs.current[beat] = el;
                      }}
                      className={styles.tickFill}
                    />
                  </div>
                );
              })}
            </div>
            <span
              className={`${styles.label} ${
                GROUPS[activeChapter]?.label === group.label ? styles.labelActive : ''
              }`}
            >
              {group.label}
            </span>
          </div>
        ))}
      </div>

      {/* Six names will not fit across a phone. The current one will. */}
      <span className={styles.labelSolo}>{GROUPS[activeChapter]?.label}</span>
    </div>
  );
}
