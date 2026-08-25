'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import styles from './Cursor.module.css';

const INTERACTIVE = 'a, button, input, textarea, select, [data-cursor="link"]';

export default function Cursor() {
  const layerRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only replace a pointer that actually exists.
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (!fine.matches) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    document.body.dataset.cursorActive = 'true';

    const ring = ringRef.current!;
    const dot = dotRef.current!;
    const layer = layerRef.current!;

    // The dot tracks the hardware pointer; the ring trails it slightly. That
    // small delay is the whole effect — with reduced motion, both are exact.
    const ringX = gsap.quickTo(ring, 'x', { duration: reduced ? 0 : 0.45, ease: 'power3' });
    const ringY = gsap.quickTo(ring, 'y', { duration: reduced ? 0 : 0.45, ease: 'power3' });
    const dotX = gsap.quickTo(dot, 'x', { duration: reduced ? 0 : 0.08, ease: 'power3' });
    const dotY = gsap.quickTo(dot, 'y', { duration: reduced ? 0 : 0.08, ease: 'power3' });

    const move = (e: PointerEvent) => {
      layer.classList.add(styles.visible);
      ringX(e.clientX);
      ringY(e.clientY);
      dotX(e.clientX);
      dotY(e.clientY);
    };

    const over = (e: PointerEvent) => {
      const target = e.target as Element | null;
      const hot = !!target?.closest?.(INTERACTIVE);
      ring.classList.toggle(styles.ringActive, hot);
      gsap.to(ring, { scale: hot ? 1.7 : 1, duration: 0.35, ease: 'power3' });
    };

    const leave = () => layer.classList.remove(styles.visible);

    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerover', over, { passive: true });
    document.addEventListener('pointerleave', leave);

    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerover', over);
      document.removeEventListener('pointerleave', leave);
      delete document.body.dataset.cursorActive;
    };
  }, []);

  return (
    <div ref={layerRef} className={styles.layer} aria-hidden="true">
      <div ref={ringRef} className={styles.ring} />
      <div ref={dotRef} className={styles.dot} />
    </div>
  );
}
