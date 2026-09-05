'use client';

import { useEffect, useRef } from 'react';
import { CITIES, cityTime } from '@/film/score';

/**
 * The multilingual chapter's backdrop.
 *
 * The old version blitted a looping video onto a 2D canvas every frame, with a
 * per-frame blur filter over it. That is why the background appeared to move
 * and shimmer on its own: it genuinely was, sixty times a second, whether or
 * not anyone had scrolled.
 *
 * This version paints nothing. Each city is a layer the compositor owns, the
 * crossfade is a CSS opacity transition, and the drone shot runs for a beat
 * after a step and then freezes on a frame. Parked means parked — no rAF, no
 * canvas, no decoder running in the background.
 */

/** How long the drone shot keeps moving after arriving at a city, ms. */
const PLAY_MS = 2000;

/** Crossfade between two cities, ms. */
const FADE_MS = 900;

const posterFor = (key: string) => `/film/places/frames/${key}.jpg`;
const clipFor = (key: string) => `/film/places/${key}.mp4`;

export default function CityBackdrop({
  index,
  active,
  onSwap,
}: {
  index: number;
  active: boolean;
  /** Fires as a crossfade begins, so the orb can pulse in step. */
  onSwap?: () => void;
}) {
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const onSwapRef = useRef(onSwap);
  useEffect(() => {
    onSwapRef.current = onSwap;
  }, [onSwap]);

  // Load the current city and the one after it, and nothing else. Six 4K-ish
  // drone clips held open at once is more decoders than a browser will give.
  useEffect(() => {
    if (!active) return;
    const timers: number[] = [];

    CITIES.forEach((city, i) => {
      const v = videoRefs.current[i];
      if (!v) return;
      const wanted = i === index || i === index + 1;

      if (!wanted) {
        if (v.getAttribute('src')) {
          v.pause();
          v.removeAttribute('src');
          v.load();
        }
        return;
      }

      if (!v.getAttribute('src')) {
        v.src = clipFor(city.key);
        v.load();
      }

      if (i === index) {
        // A short push-in on arrival, then a held frame.
        v.playbackRate = 0.85;
        void v.play().catch(() => {});
        timers.push(window.setTimeout(() => v.pause(), PLAY_MS));
      } else {
        v.pause();
      }
    });

    onSwapRef.current?.();

    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [index, active]);

  // Leaving the chapter must free every decoder, not just pause it. A paused
  // 4K element still holds its buffers, and six of them add up.
  useEffect(() => {
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
            }}
            muted
            playsInline
            preload="none"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      ))}

      {/*
        Where, what the clock says there, and the fact that every one of these
        reads the same instant.

        On a wide screen it stacks down the left, in the empty half beside the
        phone. On a portrait one there is no empty half, so it runs as a single
        line above the phone instead.
      */}
      <div
        className="absolute z-[25] px-6 md:px-0
                   left-0 right-0 top-[92px] flex flex-wrap items-baseline justify-center gap-x-4 gap-y-1 text-center
                   md:left-auto md:right-[8%] md:top-1/2 md:-translate-y-1/2 md:block md:text-left"
      >
        <span
          className="block font-mono text-[11px] md:text-[13px] tracking-[0.35em] text-[#8FB4FF]
                     [text-shadow:0_1px_12px_rgba(7,10,16,0.85)]"
        >
          {city.label}
        </span>
        <span
          className="font-mono text-[11px] md:text-[13px] tracking-[0.3em] text-white/90
                     md:mt-3 md:block [text-shadow:0_1px_12px_rgba(7,10,16,0.85)]"
        >
          {cityTime(city)} LOCAL
        </span>
        <span
          className="hidden sm:inline font-mono text-[11px] md:text-[13px] tracking-[0.3em] text-white/45
                     md:mt-1.5 md:block [text-shadow:0_1px_12px_rgba(7,10,16,0.85)]"
        >
          <span className="md:hidden">· </span>THE SAME MOMENT
        </span>
      </div>
    </>
  );
}
