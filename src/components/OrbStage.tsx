'use client';

import { useEffect, useRef } from 'react';
import SplineOrb from './SplineOrb';
import { multiMap } from '@/utils/multiMap';
import styles from './OrbStage.module.css';

/**
 * Scroll-driven orb journey, ported from the Vue build (components/OrbStage.vue,
 * itself a port of v1's updateOrb): the orb lives in a fixed full-viewport
 * layer, journeys right then left past the content, and finally drifts into
 * the demo phone (#investor-phone) to be absorbed by the product.
 *
 * v1's greyscale-to-colour absorption is deliberately dropped — the orb reads
 * blue from the first frame rather than fading up from black.
 */
const DRIFT_START = 0.8;
const DRIFT_END = 0.96;

/* v1 ease-in-out for the phone drift */
function easeInOut(p: number) {
  return p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
}

/* Where the phone screen's centre sits relative to the viewport centre
   (v1 targeted 38% down the phone — where the orb appears in the product UI).
   With no phone on the page yet, this resolves to the viewport centre. */
function phoneTarget(): { xPx: number; yVh: number } {
  const phone = document.getElementById('investor-phone');
  if (!phone) return { xPx: 0, yVh: 0 };
  const r = phone.getBoundingClientRect();
  return {
    xPx: r.left + r.width * 0.5 - window.innerWidth * 0.5,
    yVh: ((r.top + r.height * 0.38 - window.innerHeight * 0.5) / window.innerHeight) * 100,
  };
}

export default function OrbStage({
  scrollData,
}: {
  scrollData: React.RefObject<{ progress: number }>;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const holderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame: number;

    const tick = () => {
      const tv = scrollData.current?.progress ?? 0;
      const viewportWidth = window.innerWidth;
      const isMobile = viewportWidth > 0 && viewportWidth <= 768;

      let xPx: number, yVh: number, scale: number, opacity: number;

      if (tv <= DRIFT_START) {
        /* Journey: hero (centre, raised) → right → left */
        let xVw: number;
        if (isMobile) {
          xVw = 0;
          yVh = multiMap(tv, [0, 0.12], [-16, 0]);
          scale = multiMap(tv, [0, 0.12, 0.2], [1.05, 0.8, 0.62]);
          opacity = multiMap(tv, [0, 0.1, 0.22, DRIFT_START], [0.9, 0.7, 0.3, 0.3]);
        } else {
          xVw = multiMap(
            tv,
            [0, 0.1, 0.2, 0.42, 0.62, 0.7, DRIFT_START],
            [0, 0, 22, 22, 22, -22, -22]
          );
          yVh = multiMap(tv, [0, 0.1, 0.2], [-14, -14, 0]);
          scale = multiMap(tv, [0, 0.1, 0.2], [1.18, 1.18, 1]);
          opacity = multiMap(tv, [0, 0.16, 0.24], [0.9, 0.9, 0.62]);
        }
        xPx = (xVw / 100) * viewportWidth;
      } else if (tv <= DRIFT_END) {
        /* v1 investor phase 2: drift into the demo phone */
        const e = easeInOut((tv - DRIFT_START) / (DRIFT_END - DRIFT_START));
        const startXPx = ((isMobile ? 0 : -22) / 100) * viewportWidth;
        const end = phoneTarget();
        const startScale = isMobile ? 0.62 : 1;
        const startOpacity = isMobile ? 0.3 : 0.62;

        xPx = startXPx + (end.xPx - startXPx) * e;
        yVh = end.yVh * e;
        scale = startScale * (1 - e);
        opacity = startOpacity * (1 - e);
      } else {
        /* Fully absorbed into the demo */
        xPx = 0;
        yVh = 0;
        scale = 0;
        opacity = 0;
      }

      if (holderRef.current) {
        holderRef.current.style.transform = `translateX(${xPx}px) translateY(${yVh}vh) scale(${scale})`;
        holderRef.current.style.opacity = String(opacity);
      }

      /* Above both film layers, below the HUD. Keeps v1's relative ordering:
         the orb slides up a step once the drift begins. */
      if (stageRef.current) {
        stageRef.current.style.zIndex = tv >= DRIFT_START ? '27' : '25';
      }

      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [scrollData]);

  return (
    <div ref={stageRef} className={styles.stage} aria-hidden="true">
      <div ref={holderRef} className={styles.holder}>
        <SplineOrb />
      </div>
    </div>
  );
}
