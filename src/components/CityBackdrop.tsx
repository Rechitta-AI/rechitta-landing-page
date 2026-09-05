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
        // A touch under speed: a drone shot, not a video playing.
        v.playbackRate = 0.85;
        v.loop = true;
        void v.play().catch(() => {});
      } else {
        v.pause();
      }
    });

    onSwapRef.current?.();
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
            loop
            playsInline
            preload="none"
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
                   left-0 right-0 top-[92px] text-center
                   md:left-auto md:right-[7%] md:top-1/2 md:-translate-y-1/2 md:text-right md:max-w-[46vw]"
      >
        <h2
          className="text-white leading-[0.92] tracking-tighter
                     text-[clamp(1.75rem,9vw,2.75rem)] md:text-[clamp(3.25rem,7.5vw,7rem)]
                     [text-shadow:0_2px_28px_rgba(7,10,16,0.6)]"
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          {city.label}
        </h2>

        <div className="mt-2 md:mt-5 flex flex-wrap items-baseline justify-center md:justify-end gap-x-3 gap-y-1">
          <span className="font-mono text-[11px] md:text-[13px] tracking-[0.3em] text-[#8FB4FF] [text-shadow:0_1px_12px_rgba(7,10,16,0.85)]">
            {cityTime(city)} LOCAL
          </span>
          <span className="hidden sm:inline font-mono text-[11px] md:text-[13px] tracking-[0.3em] text-white/45 [text-shadow:0_1px_12px_rgba(7,10,16,0.85)]">
            <span className="md:hidden">· </span>THE SAME MOMENT
          </span>
        </div>
      </div>
    </>
  );
}
