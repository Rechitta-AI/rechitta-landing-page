/**
 * 2D projective mapping for overlay registration: pin a DOM overlay onto a
 * quadrilateral surface inside a film frame (e.g. the boardroom screen in
 * KF-03, which is not perpendicular to camera).
 *
 * Quad corner order everywhere in the film code: TL, TR, BR, BL.
 *
 * Pipeline: the calibration tool stores quads in *normalized image space*
 * (0–1 relative to the still's natural size, in the manifest's `anchors`).
 * At render time the engine converts them to viewport pixels through the same
 * cover transform the canvas uses, then this module produces the matrix3d
 * that maps an overlay of size w×h (transform-origin 0 0) onto that quad.
 */

export type Point = [number, number]
export type Quad = [Point, Point, Point, Point]

type M3 = number[] // row-major 3×3, length 9

function adjugate(m: M3): M3 {
  return [
    m[4] * m[8] - m[5] * m[7], m[2] * m[7] - m[1] * m[8], m[1] * m[5] - m[2] * m[4],
    m[5] * m[6] - m[3] * m[8], m[0] * m[8] - m[2] * m[6], m[2] * m[3] - m[0] * m[5],
    m[3] * m[7] - m[4] * m[6], m[1] * m[6] - m[0] * m[7], m[0] * m[4] - m[1] * m[3]
  ]
}

function multiply(a: M3, b: M3): M3 {
  const r = new Array(9).fill(0)
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      for (let k = 0; k < 3; k++) r[i * 3 + j] += a[i * 3 + k] * b[k * 3 + j]
  return r
}

function multiplyVector(m: M3, v: [number, number, number]): [number, number, number] {
  return [
    m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
    m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
    m[6] * v[0] + m[7] * v[1] + m[8] * v[2]
  ]
}

/** Projective basis through 4 points (Franklin Ta's method). */
function basisToPoints(q: Quad): M3 {
  const m: M3 = [q[0][0], q[1][0], q[2][0], q[0][1], q[1][1], q[2][1], 1, 1, 1]
  const v = multiplyVector(adjugate(m), [q[3][0], q[3][1], 1])
  return multiply(m, [v[0], 0, 0, 0, v[1], 0, 0, 0, v[2]])
}

/** 3×3 homography taking `src` quad to `dst` quad. */
export function homography(src: Quad, dst: Quad): M3 {
  return multiply(basisToPoints(dst), adjugate(basisToPoints(src)))
}

/**
 * CSS matrix3d string that maps an element of size w×h (with
 * `transform-origin: 0 0`) onto `dst` (viewport-pixel quad, TL TR BR BL).
 */
export function quadToMatrix3d(w: number, h: number, dst: Quad): string {
  const src: Quad = [[0, 0], [w, 0], [w, h], [0, h]]
  const t = homography(src, dst)
  // Normalize so the perspective term is 1 — keeps numbers sane for CSS.
  const n = t[8] !== 0 ? t.map((x) => x / t[8]) : t
  // Column-major 4×4 with z passed through untouched.
  const m = [
    n[0], n[3], 0, n[6],
    n[1], n[4], 0, n[7],
    0, 0, 1, 0,
    n[2], n[5], 0, n[8]
  ]
  return `matrix3d(${m.map((x) => x.toFixed(8)).join(',')})`
}

/**
 * Convert a normalized image-space quad to viewport pixels through the
 * canvas cover transform (must mirror the engine's drawCover math exactly:
 * scale k = max(W/iw, H/ih) * zoom, image centred).
 */
export function imageQuadToViewport(
  quad: Quad,
  iw: number, ih: number,
  W: number, H: number,
  zoom = 1
): Quad {
  const k = Math.max(W / iw, H / ih) * zoom
  const ox = (W - iw * k) / 2
  const oy = (H - ih * k) / 2
  return quad.map(([x, y]) => [ox + x * iw * k, oy + y * ih * k]) as Quad
}
