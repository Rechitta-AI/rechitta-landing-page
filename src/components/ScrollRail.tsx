'use client';

import { useEffect, useRef, useMemo } from 'react';
import { BEATS, CITIES, beatIndexById } from '@/film/score';
import styles from './ScrollRail.module.css';

/**
 * The named chapters, and the beat each one begins at.
 *
 * The film returns to the boardroom for its closing presentation, so that
 * name appears twice on purpose.
 *
 * Beat numbers are looked up rather than typed. They used to be literals, and
 * retiring one beat — the buyer — silently slid every chapter after it onto
 * the wrong slot: the rail read BOARDROOM while the film was on DUSK.
 */
export const RAIL_CHAPTERS = [
  { id: 'hero', label: 'START', beatIndex: beatIndexById('hero') },
  { id: 'boardroom', label: 'BOARDROOM', beatIndex: beatIndexById('boardroom') },
  { id: 'broker', label: 'BROKER', beatIndex: beatIndexById('broker') },
  { id: 'cities', label: 'GLOBAL', beatIndex: beatIndexById('city-mumbai') },
  { id: 'finale-screen', label: 'BOARDROOM', beatIndex: beatIndexById('finale-screen') },
  { id: 'finale', label: 'END', beatIndex: beatIndexById('finale') },
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

  /**
   * Which name is lit.
   *
   * A chapter owns every beat from its own up to the next one's, so the
   * multilingual chapter keeps GLOBAL lit across all six cities without
   * needing a case of its own.
   */
  const activeChapterIndex = useMemo(() => {
    let index = 0;
    RAIL_CHAPTERS.forEach((chapter, i) => {
      if (beatIndex >= chapter.beatIndex) index = i;
    });
    return index;
  }, [beatIndex]);

  /**
   * The name of the chapter on screen, for the badge above the rail.
   *
   * The badge is the phone's only label — the row under the track drops its
   * names below 640px, where six of them will not fit — so it carries the city
   * as well, which is the one thing that changes while the name does not.
   */
  const activeLabel = useMemo(() => {
    const chapter = RAIL_CHAPTERS[activeChapterIndex];
    const num = String(activeChapterIndex + 1).padStart(2, '0');
    if (chapter.id !== 'cities') return { num, label: chapter.label };
    const city = CITIES[beatIndex - chapter.beatIndex];
    return { num, label: city ? `${chapter.label} · ${city.label}` : chapter.label };
  }, [activeChapterIndex, beatIndex]);

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
      {/*
        The floating chapter badge, on a phone only.

        On a wide screen it named the chapter the rail already names directly
        underneath it, one line up. Below 640px the row under the track drops
        its names — six of them will not fit — so up here is the only place
        the chapter is written down.
      */}
      <div className={styles.telemetryDock}>
        <div className={styles.telemetryTag}>
          <span className={styles.pulseBeacon} />
          <span className={styles.chapterNum}>{activeLabel.num} {'//'}</span>
          <span className={styles.chapterTitle}>{activeLabel.label}</span>
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
