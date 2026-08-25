'use client';

import { useEffect, useState } from 'react';
import styles from './SplineOrb.module.css';

/**
 * The Rechitta orb — the Spline scene, ported from the Vue build
 * (components/TheOrb.vue): iframe at 150% inside a mix-blend-mode:screen
 * wrapper, NO mask of any kind. The scene's glow periodically fills the whole
 * frame, so any frame-edge fade reads as a visible square.
 *
 * The scroll-driven grayscale must land on the SAME element that carries
 * mix-blend-mode — a filter on any wrapper would create a new blending
 * context and break the screen blend against the page. `innerRef` hands that
 * element to the stage so it can be driven per frame without re-rendering.
 */
const SPLINE_URL = 'https://my.spline.design/meeet-K190VICHbClCgQyBKYguhj6F/';

export default function SplineOrb({ innerRef }: { innerRef?: React.Ref<HTMLDivElement> }) {
  const [revealed, setRevealed] = useState(false);

  // The iframe `load` event is unreliable — it can fire from cache before the
  // listener attaches — so reveal after a grace period regardless, and the orb
  // can never get stuck invisible.
  useEffect(() => {
    const timer = window.setTimeout(() => setRevealed(true), 2500);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className={`${styles.orb} ${revealed ? styles.revealed : ''}`} aria-hidden="true">
      <div ref={innerRef} className={styles.inner}>
        <iframe
          src={SPLINE_URL}
          title="Rechitta orb"
          allow="autoplay"
          onLoad={() => window.setTimeout(() => setRevealed(true), 150)}
        />
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={styles.brandIcon} src="/brand/rechitta-icon.svg" alt="" />
    </div>
  );
}
