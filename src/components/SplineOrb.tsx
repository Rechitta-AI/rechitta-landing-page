'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './SplineOrb.module.css';

/**
 * The Rechitta orb — the Spline scene, ported from the Vue build
 * (components/TheOrb.vue): iframe at 150% inside a mix-blend-mode:screen
 * wrapper, NO mask of any kind. The scene's glow periodically fills the whole
 * frame, so any frame-edge fade reads as a visible square.
 *
 * The blend lives on the stage above, not here — z-index and mix-blend-mode
 * must share an element or the blend is isolated and the scene's dark
 * background shows as a solid blob.
 */
const SPLINE_URL = 'https://my.spline.design/meeet-K190VICHbClCgQyBKYguhj6F/';

export default function SplineOrb({ onLoaded }: { onLoaded?: () => void }) {
  const [revealed, setRevealed] = useState(false);
  const onLoadedRef = useRef(onLoaded);
  useEffect(() => {
    onLoadedRef.current = onLoaded;
  }, [onLoaded]);

  /** Reveals once, however many of the signals below arrive. */
  const revealedOnceRef = useRef(false);
  const loadTimerRef = useRef<number | null>(null);
  const reveal = () => {
    if (revealedOnceRef.current) return;
    revealedOnceRef.current = true;
    setRevealed(true);
    onLoadedRef.current?.();
  };

  // The iframe `load` event is unreliable — it can fire from cache before the
  // listener attaches — so reveal after a grace period regardless, and the orb
  // can never get stuck invisible.
  useEffect(() => {
    const isMobile = window.innerWidth < 810;
    const timer = window.setTimeout(reveal, isMobile ? 800 : 2000);
    return () => {
      window.clearTimeout(timer);
      if (loadTimerRef.current !== null) window.clearTimeout(loadTimerRef.current);
    };
  }, []);

  return (
    <div className={`${styles.orb} ${revealed ? styles.revealed : ''}`} aria-hidden="true">
      <div className={styles.inner}>
        <iframe
          src={SPLINE_URL}
          title="Rechitta orb"
          allow="autoplay"
          onLoad={() => {
            loadTimerRef.current = window.setTimeout(reveal, 150);
          }}
        />
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={styles.brandIcon} src="/brand/rechitta-icon.svg" alt="" />
    </div>
  );
}
