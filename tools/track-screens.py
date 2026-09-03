"""
Finds the blank phone screen in a clip and writes its corners over time.

Run from the repo root:  python3 tools/track-screens.py [debug_dir]
Writes src/screens/tracks.ts. Re-run whenever the footage is re-cut.

The screens in the footage are pure white plates — they were shot that way so
something could be composited into them. That makes them findable: the biggest
bright, unsaturated, four-sided blob in the frame is the screen.

Output corners are normalised 0..1 against the frame, ordered
top-left, top-right, bottom-right, bottom-left.
"""

import json
import sys

import cv2
import numpy as np

VIDEO_DIR = "public/film/video"


def find_screen(frame):
    h, w = frame.shape[:2]
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

    # Bright and washed out: the plate is white, the sky and sea are not quite.
    mask = cv2.inRange(hsv, (0, 0, 205), (180, 60, 255))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    best = None
    best_area = 0

    for contour in contours:
        area = cv2.contourArea(contour)
        # Below this it is glare; above it the whole frame has blown out.
        if area < (w * h) * 0.004 or area > (w * h) * 0.75:
            continue

        peri = cv2.arcLength(contour, True)
        quad = None
        for eps in (0.02, 0.03, 0.045, 0.06):
            approx = cv2.approxPolyDP(contour, eps * peri, True)
            if len(approx) == 4 and cv2.isContourConvex(approx):
                quad = approx
                break
        if quad is None:
            continue

        # A phone screen is markedly taller than it is wide, whatever the angle.
        pts = quad.reshape(4, 2).astype(np.float32)
        side_a = np.linalg.norm(pts[0] - pts[1])
        side_b = np.linalg.norm(pts[1] - pts[2])
        long_side, short_side = max(side_a, side_b), min(side_a, side_b)
        if short_side <= 0 or not (1.4 < long_side / short_side < 3.2):
            continue

        # It should fill most of its own bounding quad — hands cut into glare,
        # not into the screen.
        if area / max(cv2.contourArea(quad), 1) < 0.86:
            continue

        if area > best_area:
            best_area = area
            best = pts

    return best


def order_corners(pts):
    """Top-left, top-right, bottom-right, bottom-left."""
    centre = pts.mean(axis=0)
    angles = np.arctan2(pts[:, 1] - centre[1], pts[:, 0] - centre[0])
    ordered = pts[np.argsort(angles)]
    # argsort by angle starts somewhere arbitrary; rotate so the top-left is first.
    start = int(np.argmin(ordered[:, 0] + ordered[:, 1]))
    return np.roll(ordered, -start, axis=0)


def track(clip, t_from, t_to, step=0.1, debug_dir=None):
    cap = cv2.VideoCapture(f"{VIDEO_DIR}/{clip}.h264.mp4")
    samples = []
    t = t_from
    while t <= t_to + 1e-6:
        cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000.0)
        ok, frame = cap.read()
        if not ok:
            break
        h, w = frame.shape[:2]
        found = find_screen(frame)
        if found is not None:
            pts = order_corners(found)
            samples.append({
                "t": round(t, 3),
                "corners": [[round(float(x) / w, 5), round(float(y) / h, 5)] for x, y in pts],
            })
            if debug_dir:
                cv2.polylines(frame, [pts.astype(np.int32)], True, (0, 0, 255), 3)
                for i, (x, y) in enumerate(pts):
                    cv2.circle(frame, (int(x), int(y)), 7, (0, 255, 0), -1)
                    cv2.putText(frame, str(i), (int(x) + 8, int(y)), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
                cv2.imwrite(f"{debug_dir}/{clip}_{t:.2f}.jpg", cv2.resize(frame, (640, 360)))
        else:
            samples.append({"t": round(t, 3), "corners": None})
        t += step
    cap.release()
    return samples


def centre(corners):
    xs = [c[0] for c in corners]
    ys = [c[1] for c in corners]
    return sum(xs) / 4, sum(ys) / 4


def quad_area(corners):
    pts = np.array(corners, dtype=np.float64)
    x, y = pts[:, 0], pts[:, 1]
    return 0.5 * abs(np.dot(x, np.roll(y, 1)) - np.dot(y, np.roll(x, 1)))


def enforce_continuity(samples, max_jump=0.09, area_ratio=(0.55, 1.8)):
    """
    Keeps only detections that form a continuous track.

    A single frame can lock onto hazy sky instead of a small phone. Such a
    detection is nowhere near where the screen was a frame earlier, so growing
    the track outward from the most confident frame rejects it.
    """
    hits = [(i, s) for i, s in enumerate(samples) if s["corners"]]
    if not hits:
        return samples

    def grow(seed):
        chain = {seed}
        for direction in (1, -1):
            last = samples[seed]
            i = seed + direction
            while 0 <= i < len(samples):
                s = samples[i]
                if s["corners"]:
                    cx, cy = centre(s["corners"])
                    lx, ly = centre(last["corners"])
                    moved = ((cx - lx) ** 2 + (cy - ly) ** 2) ** 0.5
                    ratio = quad_area(s["corners"]) / max(quad_area(last["corners"]), 1e-9)
                    if moved <= max_jump and area_ratio[0] <= ratio <= area_ratio[1]:
                        chain.add(i)
                        last = s
                i += direction
        return chain

    # The biggest detection is not necessarily the real one — a blown-out sky
    # outranks a small phone. The longest agreeing chain is.
    keep = max((grow(i) for i, _ in hits), key=len)

    return [s if i in keep else {"t": s["t"], "corners": None} for i, s in enumerate(samples)]


if __name__ == "__main__":
    debug = sys.argv[1] if len(sys.argv) > 1 else None
    out = []
    # Clip, window, and whose phone it is.
    windows = [
        ("transit-b", 13.6, 17.0, "BROKER"),
        ("transit-c", 0.0, 3.6, "BROKER"),
        ("transit-c", 5.4, 8.0, "BUYER"),
        ("transit-d", 0.0, 3.0, "BUYER"),
    ]
    for clip, a, b, mock in windows:
        raw = track(clip, a, b, debug_dir=debug)
        s = enforce_continuity(raw)
        before = sum(1 for x in raw if x["corners"])
        kept = [x for x in s if x["corners"]]
        print(f"{clip} {a}-{b}s: {len(kept)}/{len(s)} kept "
              f"({before - len(kept)} rejected as discontinuous)")
        out.append((clip, a, b, mock, kept))

    blocks = []
    for clip, a, b, mock, kept in out:
        samples = ",\n      ".join(
            "{ t: %.2f, corners: [%s] }" % (
                x["t"], ", ".join("[%.5f, %.5f]" % (c[0], c[1]) for c in x["corners"]))
            for x in kept)
        blocks.append("""  {
    clip: '%s',
    from: %.2f,
    to: %.2f,
    image: %s,
    samples: [
      %s,
    ],
  },""" % (clip, a, b, mock, samples))

    with open("src/screens/tracks.ts", "w") as f:
        f.write("""/**
 * Where the phone screens are, frame by frame.
 *
 * Generated by tools/track-screens.py, which finds the blank white plate in
 * each shot and records its four corners. Corners are normalised 0..1 against
 * the video frame — not the viewport — and ordered top-left, top-right,
 * bottom-right, bottom-left. Re-run the tool if the footage is re-cut.
 *
 * Do not hand-edit.
 */

import type { ScreenTrack } from './types';

const BROKER = '/live-inventory-final.jpeg';
const BUYER = '/live-interruption-final.jpeg';

export const SCREEN_TRACKS: ScreenTrack[] = [
%s
];
""" % "\n".join(blocks))
    print("wrote src/screens/tracks.ts")
