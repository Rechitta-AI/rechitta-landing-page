'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import SplineOrb from './SplineOrb';
import styles from './OrbStage.module.css';

const DRIFT_START = 0.8;
const DRIFT_END = 0.96;

export default function OrbStage({
  scrollData,
  introPhase = 'done',
  onOrbLanded,
  onOrbLoaded
}: {
  scrollData: React.RefObject<{ progress: number }>;
  introPhase?: 'loading' | 'moving' | 'revealing' | 'done';
  onOrbLanded?: () => void;
  onOrbLoaded?: () => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const holderRef = useRef<HTMLDivElement>(null);
  
  // Track if we've already done the GSAP move so we don't repeat it
  const hasMovedRef = useRef(false);
  
  // Store the coordinates of the "O" so the scroll-engine can pick up exactly where GSAP left off
  const oPositionRef = useRef({ xPx: 0, yVh: 0, scale: 1 });

  useEffect(() => {
    console.log('[DEBUG] OrbStage mounted!');
    return () => console.log('[DEBUG] OrbStage UNMOUNTED!');
  }, []);

  useEffect(() => {
    if (holderRef.current) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes') {
            console.log(`[DEBUG] Holder attribute changed: ${mutation.attributeName}`, holderRef.current?.style.opacity, holderRef.current?.style.visibility);
          }
        });
      });
      observer.observe(holderRef.current, { attributes: true });
      return () => observer.disconnect();
    }
  }, []);

  useEffect(() => {
    // If introPhase is 'moving' and we haven't animated yet, trigger the GSAP move!
    if (introPhase === 'moving' && !hasMovedRef.current && holderRef.current) {
      hasMovedRef.current = true;
      
      const targetEl = document.getElementById('hero-o-anchor');
      if (targetEl) {
        const targetRect = targetEl.getBoundingClientRect();
        const holderRect = holderRef.current.getBoundingClientRect();
        
        // Calculate how much we need to move the holder to land exactly on the target
        // The holder is currently centered in the screen.
        const deltaX = targetRect.left + (targetRect.width / 2) - (holderRect.left + (holderRect.width / 2));
        const deltaY = targetRect.top + (targetRect.height / 2) - (holderRect.top + (holderRect.height / 2));
        // Save the destination for the scroll loop - preserve its original majestic size!
        oPositionRef.current = { 
          xPx: deltaX, 
          yVh: (deltaY / window.innerHeight) * 100, 
          scale: 1 
        };

        gsap.to(holderRef.current, {
          x: deltaX,
          y: deltaY,
          scale: 1, // preserve size
          duration: 1.5,
          ease: 'power3.inOut',
          onUpdate: () => {
            console.log('[DEBUG] GSAP Update. Transform:', holderRef.current?.style.transform);
          },
          onComplete: () => {
            console.log('[DEBUG] GSAP Complete! Calling onOrbLanded.');
            if (onOrbLanded) onOrbLanded();
          }
        });
      }
    }
  }, [introPhase]);

  useEffect(() => {
    let frame: number;

    const tick = () => {
      // If we are in the intro, don't let scroll data override the GSAP animation!
      if (introPhase !== 'done') {
        frame = requestAnimationFrame(tick);
        return;
      }

      const tv = scrollData.current?.progress ?? 0;
      const viewportWidth = window.innerWidth;
      const isMobile = viewportWidth > 0 && viewportWidth <= 768;

      let xPx = oPositionRef.current.xPx;
      let yVh = oPositionRef.current.yVh;
      let scale = oPositionRef.current.scale;
      let opacity = 0.9;
      
      // Fade out slightly when transitioning from hero to globe
      if (tv > 0.15 && tv <= DRIFT_START) {
        opacity = 0.9 - ((tv - 0.15) / 0.65) * 0.4;
      }
      
      if (tv <= DRIFT_START) {
        // Hold at the O's position
      } else if (tv <= DRIFT_END) {
        const p = (tv - DRIFT_START) / (DRIFT_END - DRIFT_START);
        // ease in-out
        const eased = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
        
        const endXPx = window.innerWidth * 0.05;
        const endYVh = 25;
        const endScale = 0.6;
        
        xPx = oPositionRef.current.xPx + (endXPx - oPositionRef.current.xPx) * eased;
        yVh = oPositionRef.current.yVh + (endYVh - oPositionRef.current.yVh) * eased;
        scale = oPositionRef.current.scale + (endScale - oPositionRef.current.scale) * eased;
        opacity = 0.5 + (0.4 * eased); // fade back up a bit during drift
      } else {
        xPx = window.innerWidth * 0.05;
        yVh = 25;
        scale = 0.6;
        opacity = 0.9;
      }

      if (holderRef.current) {
        holderRef.current.style.transform = `translate(${xPx}px, ${yVh}vh) scale(${scale})`;
        holderRef.current.style.opacity = opacity.toString();
      }

      if (stageRef.current) {
        stageRef.current.style.zIndex = tv >= DRIFT_START ? '27' : '25';
      }

      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [scrollData, introPhase]);

  return (
    <div ref={stageRef} className={styles.stage} aria-hidden="true">
      <div ref={holderRef} className={styles.holder}>
        <SplineOrb onLoaded={onOrbLoaded} />
      </div>
    </div>
  );
}
