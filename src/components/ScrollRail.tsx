'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { BEATS, CITIES } from '@/film/score';
import styles from './ScrollRail.module.css';

/**
 * The named chapters, and the beat each one begins at.
 *
 * The film returns to the boardroom for its closing presentation, so that
 * name appears twice on purpose.
 */
export const RAIL_CHAPTERS = [
  { id: 'hero', num: '01', label: 'DAWN', beatIndex: 0 },
  { id: 'boardroom', num: '02', label: 'BOARDROOM', beatIndex: 1 },
  { id: 'broker', num: '03', label: 'BROKER', beatIndex: 2 },
  { id: 'buyer', num: '04', label: 'BUYER', beatIndex: 3 },
  { id: 'cities', num: '05', label: 'GLOBAL', beatIndex: 4 },
  { id: 'finale-screen', num: '06', label: 'BOARDROOM', beatIndex: 10 },
  { id: 'finale', num: '07', label: 'DUSK', beatIndex: 11 },
];

/**
 * Each chapter's slice of the rail, in beats.
 *
 * The fill used to run linearly through the beat list while the labels were
 * spread evenly, so the two disagreed the moment a chapter held more than one
 * beat: the multilingual chapter is six of the twelve beats but one of the
 * seven names, which left the fill sitting under BROKER while GLOBAL was on
 * screen. Measuring the fill in chapter space instead keeps them together.
 */
const SPANS = RAIL_CHAPTERS.map((chapter, i) => {
  const from = chapter.beatIndex;
  const to = RAIL_CHAPTERS[i + 1]?.beatIndex ?? BEATS.length;
  return { from, length: Math.max(1, to - from) };
});

/**
 * A fractional beat position as a fraction of the rail's width.
 *
 * The labels are laid out with `space-between`, so the first sits at the left
 * edge and the last at the right: chapter i is at i/(n-1), not i/n. Dividing
 * by the count instead left the bar stopping six sevenths of the way along
 * with the film finished.
 */
export function railFraction(beatPosition: number): number {
  const p = Math.max(0, Math.min(beatPosition, BEATS.length - 1e-6));
  let i = SPANS.length - 1;
  while (i > 0 && p < SPANS[i].from) i--;
  const within = Math.min(1, (p - SPANS[i].from) / SPANS[i].length);
  return Math.max(0, Math.min(1, (i + within) / Math.max(1, RAIL_CHAPTERS.length - 1)));
}

export default function ScrollRail({
  beatPosition,
  beatIndex = 0,
}: {
  /** Where the film is as a fractional beat, written every frame. */
  beatPosition: React.RefObject<number>;
  beatIndex?: number;
}) {
  const fillRef = useRef<HTMLDivElement>(null);
  const glowLeadRef = useRef<HTMLSpanElement>(null);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);

  // Derive active chapter details
  const activeChapter = useMemo(() => {
    if (beatIndex >= 4 && beatIndex <= 9) {
      const cityIdx = beatIndex - 4;
      const cityName = CITIES[cityIdx]?.label ?? 'GLOBAL';
      return {
        num: '05',
        label: `GLOBAL · ${cityName}`,
        chapterIndex: 4,
      };
    }
    if (beatIndex === 10) {
      return { num: '06', label: 'BOARDROOM · CLOSING', chapterIndex: 5 };
    }
    if (beatIndex >= 11) {
      return { num: '07', label: 'DUSK', chapterIndex: 6 };
    }
    const ch = RAIL_CHAPTERS.find((c) => c.beatIndex === beatIndex) ?? RAIL_CHAPTERS[0];
    const chIdx = RAIL_CHAPTERS.indexOf(ch);
    return {
      num: ch.num,
      label: ch.label,
      chapterIndex: Math.max(0, chIdx),
    };
  }, [beatIndex]);

  useEffect(() => {
    setActiveChapterIndex(activeChapter.chapterIndex);
  }, [activeChapter]);

  // Smooth progress track loop
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
      const fraction = railFraction(eased);

      if (fillRef.current) {
        fillRef.current.style.transform = `scaleX(${fraction})`;
      }
      if (glowLeadRef.current) {
        glowLeadRef.current.style.left = `${fraction * 100}%`;
      }

      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [beatPosition]);

  const handleJump = (targetBeat: number) => {
    window.dispatchEvent(
      new CustomEvent('rechitta:jump-to-beat', { detail: { index: targetBeat } }),
    );
  };

  return (
    <div className={styles.railContainer} aria-label="Progress Rail">
      {/* Chapter Telemetry Badge */}
      <div className={styles.telemetryDock}>
        <div className={styles.telemetryTag}>
          <span className={styles.pulseBeacon} />
          <span className={styles.chapterNum}>{activeChapter.num} //</span>
          <span className={styles.chapterTitle}>{activeChapter.label}</span>
        </div>
      </div>

      {/* Main Track Dock */}
      <div className={styles.dock}>
        <div className={styles.trackBackground}>
          {/* Luminous Fill Line */}
          <div ref={fillRef} className={styles.trackFill} />
          {/* Glowing Lead Orb Head */}
          <span ref={glowLeadRef} className={styles.glowLead} />
        </div>

        {/* Clickable Chapter Segments */}
        <div className={styles.segmentsRow}>
          {RAIL_CHAPTERS.map((ch, idx) => {
            const isActive = activeChapterIndex === idx;
            const isPassed = activeChapterIndex > idx;
            return (
              <button
                key={ch.id}
                onClick={() => handleJump(ch.beatIndex)}
                className={`${styles.segmentBtn} ${isActive ? styles.segmentActive : ''} ${
                  isPassed ? styles.segmentPassed : ''
                }`}
                title={`Jump to ${ch.label}`}
                aria-label={`Jump to ${ch.label}`}
              >
                <span className={styles.segmentTick} />
                <span className={styles.segmentLabel}>{ch.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
