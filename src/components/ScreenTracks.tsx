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
  return null;
}
