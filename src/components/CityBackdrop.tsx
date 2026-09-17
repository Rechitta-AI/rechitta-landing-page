'use client';

import { useEffect, useRef } from 'react';
import { CITIES, cityTime } from '@/film/score';
import CityNav, { BoardroomCta } from './CityNav';
import { registerVideo } from '@/film/media';

/**
 * The multilingual chapter's backdrop.
 *
 * The old version blitted a looping video onto a 2D canvas every frame, with a
 * per-frame blur filter over it. That is why the background appeared to move
 * and shimmer on its own: it genuinely was, sixty times a second, whether or
 * not anyone had scrolled.
 *
 * This version paints nothing. Each city is a layer the compositor owns and
 * the crossfade is a CSS opacity transition, so the drone shot can run on
 * loop the way it was always meant to without costing the main thread a
 * thing. What made the old one shimmer was the canvas, not the looping.
 *
 * Only the city on screen plays. Its neighbour is loaded and paused, ready
 * for the next step, and everything else is torn down — six 4K-ish decoders
 * open at once is more than a browser will give.
 */

/** Crossfade between two cities, ms. */
const FADE_MS = 400;

const posterFor = (key: string) => `/film/places/frames/${key}.jpg`;
export const clipFor = (key: string) => `/film/places/${key}.mp4`;

// In-memory Blob Cache: once fetched, clips reside in RAM for 0ms instantaneous switching
const cityBlobCache = new Map<string, string>();
const cityBlobPromises = new Map<string, Promise<string>>();

export async function preloadCityBlob(key: string): Promise<string> {
  if (cityBlobCache.has(key)) return cityBlobCache.get(key)!;
  if (cityBlobPromises.has(key)) return cityBlobPromises.get(key)!;

  const url = clipFor(key);
  if (typeof window === 'undefined') return url;

  const p = fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.blob();
    })
    .then((blob) => {
      const blobUrl = URL.createObjectURL(blob);
      cityBlobCache.set(key, blobUrl);
      return blobUrl;
    })
    .catch((err) => {
      console.warn(`[city] Blob preload failed for ${key}, falling back to direct URL:`, err);
      return url;
    })
    .finally(() => {
      cityBlobPromises.delete(key);
    });

  cityBlobPromises.set(key, p);
  return p;
}

export default function CityBackdrop({
  index,
  active,
  onSwap,
  isMoving = false,
}: {
  index: number;
  active: boolean;
  /** Fires as a crossfade begins, so the orb can pulse in step. */
  onSwap?: () => void;
  /** A transition is playing; the chapter's own controls step aside for it. */
  isMoving?: boolean;
}) {
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const onSwapRef = useRef(onSwap);
  useEffect(() => {
    onSwapRef.current = onSwap;
  }, [onSwap]);

  // Load the current city and bidirectional neighbours (index - 1, index, index + 1)
  // Powered by in-memory blob caching for 0ms instantaneous playback without hitching.
  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    CITIES.forEach((city, i) => {
      const v = videoRefs.current[i];
      if (!v) return;
      // Bidirectional window: keep current, previous, and next warm
      const wanted = Math.abs(i - index) <= 1;

      if (!wanted) {
        if (v.getAttribute('src')) {
          v.pause();
          v.removeAttribute('src');
          v.load();
        }
        return;
      }

      // Attach blob or direct clip with instant playback
      const assignSource = (srcUrl: string) => {
        if (cancelled) return;
        // Blob URLs never contain the key, so compare against them directly —
        // otherwise every step reloads the neighbours that are already warm.
        const current = v.getAttribute('src');
        if (!current || (current !== srcUrl && !current.includes(city.key))) {
          v.src = srcUrl;
          v.preload = 'auto';
          v.load();
        }

        if (i === index) {
          v.playbackRate = 0.85;
          v.loop = true;
          // Tells a Low Power Mode unlock to leave this one running.
          v.dataset.playing = '1';
          const p = v.play();
          if (p && typeof p.then === 'function') {
            p.catch(() => {});
          }
        } else {
          delete v.dataset.playing;
          v.pause();
        }
      };

      if (cityBlobCache.has(city.key)) {
        assignSource(cityBlobCache.get(city.key)!);
      } else {
        // Immediately assign direct clip so playback doesn't stall, while caching blob in background
        assignSource(clipFor(city.key));
        preloadCityBlob(city.key).then((blobUrl) => {
          if (!cancelled && v && v.src !== blobUrl && (i === index || wanted)) {
            const curTime = v.currentTime;
            const wasPlaying = !v.paused;
            v.src = blobUrl;
            v.currentTime = curTime;
            if (wasPlaying && i === index) {
              v.play().catch(() => {});
            }
          }
        });
      }
    });

    onSwapRef.current?.();

    // Background pre-fetch remaining cities in sequence so all 6 are warm in RAM
    const timer = setTimeout(() => {
      CITIES.forEach((c, idx) => {
        if (Math.abs(idx - index) > 1) {
          preloadCityBlob(c.key);
        }
      });
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [index, active]);

  // Leaving the chapter frees active decoder buffers, while cityBlobCache
  // preserves the downloaded bytes in RAM so re-entering starts at 0ms.
  useEffect(() => {
    // Only on the way out. Running this on entry tore down the clips the
    // effect above had just attached, so the first city sat on its poster.
    if (active) return;
    videoRefs.current.forEach((v) => {
      if (!v) return;
      v.pause();
      if (v.getAttribute('src')) {
        v.removeAttribute('src');
        v.load();
      }
    });
  }, [active]);

  const city = CITIES[index] ?? CITIES[0];

  return (
    <>
      {CITIES.map((city, i) => (
        <div
          key={city.key}
          className="absolute inset-0 w-full h-full"
          style={{
            opacity: i === index ? 1 : 0,
            transition: `opacity ${FADE_MS}ms ease-in-out`,
            willChange: 'opacity',
          }}
          aria-hidden="true"
        >
          {/* The poster carries the frame until the clip has decoded one. */}
          <img
            src={posterFor(city.key)}
            alt=""
            loading={i <= 1 ? 'eager' : 'lazy'}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <video
            ref={(el) => {
              videoRefs.current[i] = el;
              if (el) return registerVideo(el);
            }}
            muted
            loop
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      ))}

      {/*
        The city takes the right-hand half at display size, with the clock and
        the line that makes the point — every one of these reads the same
        instant — set small beneath it.

        Portrait has no right-hand half, so it runs above the phone instead.
      */}
      <div
        className="absolute z-[25] px-6 md:px-0
                   left-0 right-0 top-[max(4.25rem,calc(50%-26.5dvh-54px))] text-center
                   md:left-auto md:right-[7%] md:top-1/2 md:-translate-y-1/2 md:text-right md:max-w-[46vw]"
      >
        {/*
          Wide: the arrows sit on their own tier above the name, aligned to
          its right edge like an eyebrow would be.
        */}
        <CityNav cityIndex={index} isMoving={isMoving} className="hidden md:flex justify-end mb-5" />

        {/*
          Portrait: they flank the name instead. The band between the header
          and the top of the handset is cleanly spaced, and either side of
          the name costs no height at all.
        */}
        <div className="flex items-center justify-center gap-3.5 md:block">
          <CityNav cityIndex={index} isMoving={isMoving} only={-1} size="sm" className="md:hidden" />

          <h2
            className="type-display text-[var(--text-primary)] leading-[0.98]
                       text-[clamp(2.15rem,10vw,3.25rem)] md:text-[clamp(3.25rem,7.5vw,7rem)]
                       [text-shadow:0_2px_28px_rgba(10,10,9,0.6)]"
          >
            {city.label}
          </h2>

          <CityNav cityIndex={index} isMoving={isMoving} only={1} size="sm" className="md:hidden" />
        </div>

        {/* Desktop: time sits beneath city name on the right side */}
        <div className="hidden md:flex mt-5 flex-wrap items-baseline justify-end gap-x-3 gap-y-1">
          <span className="font-mono text-[13px] tracking-[0.3em] text-[#8BB0FF] [text-shadow:0_1px_12px_rgba(10,10,9,0.85)]">
            {cityTime(city)} LOCAL
          </span>
          <span className="font-mono text-[13px] tracking-[0.3em] text-white/45 [text-shadow:0_1px_12px_rgba(10,10,9,0.85)]">
            THE SAME MOMENT
          </span>
        </div>

        {/* Desktop: the call to action closes the block, clear of the phone. */}
        <div className="hidden md:flex mt-8 justify-end">
          <BoardroomCta isMoving={isMoving} className="btn-lg" />
        </div>
      </div>

      {/*
        Mobile Portrait only: Dynamically anchored directly below the phone's bottom,
        ensuring guaranteed non-overlapping clearance from the docked orb on every device.
      */}
      <div
        className="md:hidden absolute z-[25] left-0 right-0 top-[calc(50%+26.5dvh+34px)]
                   flex items-baseline justify-center gap-x-2.5 px-4 text-center pointer-events-none"
      >
        <span className="font-mono text-[11px] tracking-[0.28em] text-[#8BB0FF] [text-shadow:0_1px_12px_rgba(10,10,9,0.85)]">
          {cityTime(city)} LOCAL
        </span>
        <span className="font-mono text-[11px] tracking-[0.28em] text-white/45 [text-shadow:0_1px_12px_rgba(10,10,9,0.85)]">
          · THE SAME MOMENT
        </span>
      </div>
    </>
  );
}
