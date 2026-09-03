'use client';

import { useEffect, useRef } from 'react';
import { SCREEN_TRACKS } from '@/screens/tracks';
import { cornersAt, coverRect, edgeFade, matrix3dFor, toViewport, trackAt } from '@/screens/warp';
import type { Playhead } from '@/screens/types';

/**
 * The app screens, composited into the phones as they move through the film.
 *
 * The phones are hand-held and the camera pushes in, so a static overlay would
 * slide off within a few frames. Instead each screen follows a tracked quad and
 * is warped onto it with a perspective transform.
 *
 * Position comes from the film's own playhead rather than from scroll progress,
 * so the composite cannot drift from the frame it is sitting on — whatever the
 * scrub is doing, the image is on the same frame as the phone.
 */

/** The transform's source rectangle. Its aspect matches the supplied mockups. */
const BASE_WIDTH = 396;
const BASE_HEIGHT = 852;

/** Roughly the screen's corner rounding, as a share of its height. */
const CORNER_RADIUS = `${(30 / BASE_HEIGHT) * 100}%`;

export default function ScreenTracks({
  playheadRef,
}: {
  playheadRef: React.RefObject<Playhead | null>;
}) {
  const imagesRef = useRef<Record<string, HTMLImageElement | null>>({});

  const sources = Array.from(new Set(SCREEN_TRACKS.map((t) => t.image)));

  useEffect(() => {
    let frame: number;

    const tick = () => {
      const playhead = playheadRef.current ?? null;
      const track = trackAt(SCREEN_TRACKS, playhead);

      if (process.env.NODE_ENV !== 'production') {
        (window as unknown as { __screens?: unknown }).__screens = {
          playhead,
          track: track ? `${track.clip} ${track.from}-${track.to} ${track.image}` : null,
        };
      }

      for (const src of sources) {
        const el = imagesRef.current[src];
        if (!el) continue;

        if (!track || track.image !== src || !playhead) {
          if (el.style.opacity !== '0') el.style.opacity = '0';
          continue;
        }

        const corners = cornersAt(track, playhead.t);
        if (!corners) {
          el.style.opacity = '0';
          continue;
        }

        const rect = coverRect(window.innerWidth, window.innerHeight);
        const matrix = matrix3dFor(BASE_WIDTH, BASE_HEIGHT, toViewport(corners, rect));
        if (matrix === 'none') {
          el.style.opacity = '0';
          continue;
        }

        el.style.transform = matrix;
        el.style.opacity = String(edgeFade(track, playhead.t));
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playheadRef]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {sources.map((src) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          ref={(el) => {
            imagesRef.current[src] = el;
          }}
          src={src}
          alt=""
          draggable={false}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: BASE_WIDTH,
            height: BASE_HEIGHT,
            // The matrix maps this rectangle's own corners onto the phone, so
            // the element must scale from its top-left, not its centre.
            transformOrigin: '0 0',
            borderRadius: CORNER_RADIUS,
            opacity: 0,
            willChange: 'transform, opacity',
          }}
        />
      ))}
    </div>
  );
}
