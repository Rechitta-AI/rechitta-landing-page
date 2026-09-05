'use client';

import { useEffect, useRef } from 'react';
import { BEATS } from '@/film/score';
import styles from './ScrollRail.module.css';

/**
 * The chapter rail: a single pulsing dot travelling the foot of the screen.
 *
 * It reads the fractional beat position the stage publishes, so it sweeps
 * during a shot rather than snapping when one lands.
 *
 * The named-chapter version it replaces — six evenly spaced labels over one
 * tick per beat — is kept below, commented out. It took a band about sixty
 * pixels deep across the bottom of every scene; this takes a hairline.
 */

/* ── The named-chapter rail, kept for reference ───────────────────────────
const CHAPTERS: { label: string; from: string }[] = [
  { label: 'Dawn', from: 'hero' },
  { label: 'Boardroom', from: 'boardroom' },
  { label: 'Broker', from: 'broker' },
  { label: 'Buyer', from: 'buyer' },
  { label: 'World', from: 'city-mumbai' },
  { label: 'Dusk', from: 'finale' },
];

const GROUPS = CHAPTERS.map((chapter, ci) => {
  const start = BEATS.findIndex((b) => b.id === chapter.from);
  const nextChapter = CHAPTERS[ci + 1];
  const end = nextChapter ? BEATS.findIndex((b) => b.id === nextChapter.from) : BEATS.length;
  return { label: chapter.label, from: start, count: Math.max(1, end - start) };
});

  const fillRefs = useRef<(HTMLSpanElement | null)[]>([]);

  fillRefs.current.forEach((el, i) => {
    if (!el) return;
    el.style.transform = `scaleX(${Math.max(0, Math.min(1, eased - i + 1))})`;
  });

  const activeChapter = Math.max(
    0,
    GROUPS.findIndex((g, i) => {
      const next = GROUPS[i + 1];
      return beatIndex >= g.from && (!next || beatIndex < next.from);
    }),
  );

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
      <span className={styles.labelSolo}>{GROUPS[activeChapter]?.label}</span>
    </div>
──────────────────────────────────────────────────────────────────────── */

/** The last beat's index, which the dot's travel is measured against. */
const LAST = Math.max(1, BEATS.length - 1);

export default function ScrollRail({
  beatPosition,
}: {
  /** Where the film is as a fractional beat, written every frame. */
  beatPosition: React.RefObject<number>;
  /** Kept for the commented-out chapter rail above. */
  beatIndex?: number;
}) {
  const dotRef = useRef<HTMLSpanElement>(null);

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

      if (dotRef.current) {
        const fraction = Math.max(0, Math.min(1, eased / LAST));
        dotRef.current.style.transform = `translateX(${fraction * 100}%)`;
      }

      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [beatPosition]);

  return (
    <div className={styles.dotRail} aria-hidden="true">
      <div className={styles.dotTrack}>
        {/* Travels the track; the pulse lives on the child so the two do not
            fight over the same transform. */}
        <span ref={dotRef} className={styles.dotCarriage}>
          <span className={styles.dot} />
        </span>
      </div>
    </div>
  );
}
