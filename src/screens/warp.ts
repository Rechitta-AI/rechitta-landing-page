/**
 * Putting a flat image inside a phone that is moving through a shot.
 *
 * The tracker records where each screen's corners are in the *video frame*.
 * The video is displayed with `object-fit: cover`, so those corners have to be
 * pushed through the same crop before they mean anything in viewport pixels —
 * and then a perspective transform maps the image onto them.
 *
 * All pure: no DOM, no time.
 */

import type { Playhead, Quad, Rect, ScreenTrack } from './types';

/** Every clip in the film is 16:9. */
export const FILM_ASPECT = 16 / 9;

/**
 * Where a `object-fit: cover` video actually lands inside the viewport.
 * The overflowing axis is cropped evenly, so the rect can start negative.
 */
export function coverRect(viewportWidth: number, viewportHeight: number, aspect = FILM_ASPECT): Rect {
  const viewportAspect = viewportWidth / viewportHeight;
  if (viewportAspect > aspect) {
    // Viewport is wider than the film: full width, cropped top and bottom.
    const height = viewportWidth / aspect;
    return { x: 0, y: (viewportHeight - height) / 2, width: viewportWidth, height };
  }
  const width = viewportHeight * aspect;
  return { x: (viewportWidth - width) / 2, y: 0, width, height: viewportHeight };
}

/** Normalised frame corners → viewport pixels. */
export function toViewport(corners: Quad, rect: Rect): Quad {
  return corners.map(([nx, ny]) => [rect.x + nx * rect.width, rect.y + ny * rect.height]) as Quad;
}

/**
 * The corners at a moment, interpolated between samples.
 *
 * Returns null outside the tracked range rather than clamping to the nearest
 * sample. Clamping is what put a floating card beside the phone before it had
 * arrived and after it had left: the screen genuinely is somewhere else then,
 * and holding the last known corners is a confident wrong answer.
 */
export function cornersAt(track: ScreenTrack, t: number): Quad | null {
  const samples = track.samples;
  if (samples.length === 0) return null;
  if (t < samples[0].t || t > samples[samples.length - 1].t) return null;

  let hi = 1;
  while (hi < samples.length - 1 && samples[hi].t < t) hi++;

  const from = samples[hi - 1];
  const to = samples[hi];
  const span = to.t - from.t;
  if (span <= 0) return to.corners as Quad;

  const k = (t - from.t) / span;
  return from.corners.map((c, i) => [
    c[0] + (to.corners[i][0] - c[0]) * k,
    c[1] + (to.corners[i][1] - c[1]) * k,
  ]) as Quad;
}

/** The track showing at this playhead, if any. */
export function trackAt(tracks: ScreenTrack[], playhead: Playhead | null): ScreenTrack | null {
  if (!playhead) return null;
  return (
    tracks.find((t) => t.clip === playhead.clip && playhead.t >= t.from && playhead.t <= t.to) ?? null
  );
}

/**
 * Fades the composite in and out at the edges of its window, so the app screen
 * never pops on while the phone is still sliding into shot.
 */
export function edgeFade(track: ScreenTrack, t: number, seconds = 0.35): number {
  const intoStart = (t - track.from) / seconds;
  const toEnd = (track.to - t) / seconds;
  return Math.max(0, Math.min(1, intoStart, toEnd));
}

/**
 * Solves the 3x3 homography taking the rectangle (0,0)-(width,height) onto
 * `dst`, and formats it as a CSS `matrix3d`.
 *
 * The element must carry `transform-origin: 0 0` for this to line up.
 */
export function matrix3dFor(width: number, height: number, dst: Quad): string {
  const src: Quad = [
    [0, 0],
    [width, 0],
    [width, height],
    [0, height],
  ];

  // Eight unknowns (h33 is fixed at 1), two equations per corner.
  const a: number[][] = [];
  const b: number[] = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i];
    const [u, v] = dst[i];
    a.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    b.push(u);
    a.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    b.push(v);
  }

  const h = solve(a, b);
  if (!h) return 'none';

  const [h11, h12, h13, h21, h22, h23, h31, h32] = h;

  // CSS matrix3d is column-major.
  return `matrix3d(${h11}, ${h21}, 0, ${h31}, ${h12}, ${h22}, 0, ${h32}, 0, 0, 1, 0, ${h13}, ${h23}, 0, 1)`;
}

/**
 * Solves an affine 2D homography (no perspective division, h31 = 0, h32 = 0)
 * taking the rectangle (0,0)-(width,height) onto `dst`, and formats it as a CSS `matrix3d`.
 * Because h31 and h32 are zero, cross-origin OOPIF iframes preserve 100% click/touch hit-testing.
 */
export function affineMatrix3dFor(width: number, height: number, dst: Quad): string {
  const [p0, p1, p2, p3] = dst;
  const a = ((p1[0] - p0[0]) + (p2[0] - p3[0])) / (2 * width);
  const b = ((p3[0] - p0[0]) + (p2[0] - p1[0])) / (2 * height);
  const e = (p0[0] + p1[0] + p2[0] + p3[0]) / 4 - (a * width + b * height) / 2;

  const c = ((p1[1] - p0[1]) + (p2[1] - p3[1])) / (2 * width);
  const d = ((p3[1] - p0[1]) + (p2[1] - p1[1])) / (2 * height);
  const f = (p0[1] + p1[1] + p2[1] + p3[1]) / 4 - (c * width + d * height) / 2;

  return `matrix3d(${a.toFixed(7)}, ${c.toFixed(7)}, 0, 0, ${b.toFixed(7)}, ${d.toFixed(7)}, 0, 0, 0, 0, 1, 0, ${e.toFixed(3)}, ${f.toFixed(3)}, 0, 1)`;
}

/** Gaussian elimination with partial pivoting. Returns null if degenerate. */
function solve(a: number[][], b: number[]): number[] | null {
  const n = b.length;
  const m = a.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(m[row][col]) > Math.abs(m[pivot][col])) pivot = row;
    }
    if (Math.abs(m[pivot][col]) < 1e-12) return null;
    [m[col], m[pivot]] = [m[pivot], m[col]];

    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = m[row][col] / m[col][col];
      for (let k = col; k <= n; k++) m[row][k] -= factor * m[col][k];
    }
  }

  return m.map((row, i) => row[n] / row[i]);
}
