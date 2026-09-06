'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { BEATS, CITIES } from '@/film/score';
import styles from './ScrollRail.module.css';

/** Primary narrative chapters for the rail */
export const RAIL_CHAPTERS = [
  { id: 'hero', num: '01', label: 'DAWN', beatIndex: 0 },
  { id: 'boardroom', num: '02', label: 'BOARDROOM', beatIndex: 1 },
  { id: 'broker', num: '03', label: 'BROKER', beatIndex: 2 },
  { id: 'buyer', num: '04', label: 'BUYER', beatIndex: 3 },
  { id: 'cities', num: '05', label: 'GLOBAL', beatIndex: 4 },
  { id: 'finale-screen', num: '06', label: 'PRESENTATION', beatIndex: 10 },
  { id: 'finale', num: '07', label: 'HORIZON', beatIndex: 11 },
];

const LAST = Math.max(1, BEATS.length - 1);

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
      return { num: '06', label: 'PRESENTATION', chapterIndex: 5 };
    }
    if (beatIndex >= 11) {
      return { num: '07', label: 'HORIZON · FINALE', chapterIndex: 6 };
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
      const fraction = Math.max(0, Math.min(1, eased / LAST));

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
