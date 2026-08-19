#!/usr/bin/env python3
"""
Asset QC gate — run before anything enters the film manifest.

Every threshold here exists because the v1 assets failed it. The shipped hero
still (kf-01) is 1280x720 at 0.204 bits/px with a 39-207 luminance range and 98
distinct levels in its sky; it reads as dull and no amount of grading fixed it.
This script refuses assets that would repeat that.

    ./scripts/check-assets.py public/film/stills/*.webp
    ./scripts/check-assets.py --baseline          # score the current assets

Exit code is the number of failing assets, so it drops into CI unchanged.

Requires only pillow + numpy (deliberately no opencv — this needs to run on
whatever interpreter a teammate or CI has to hand).
"""
from __future__ import annotations
import argparse, glob, os, sys

try:
    import numpy as np
    from PIL import Image
except ImportError as e:
    sys.exit(f"missing dependency: {e}. pip install pillow numpy")


def _gray(a: "np.ndarray") -> "np.ndarray":
    """Rec.709 luma, float32."""
    return a.astype(np.float32) @ np.array([0.2126, 0.7152, 0.0722], np.float32)


def _laplacian_var(g: "np.ndarray") -> float:
    """Variance of a 4-neighbour Laplacian — our proxy for detail energy."""
    lap = (-4.0 * g[1:-1, 1:-1]
           + g[:-2, 1:-1] + g[2:, 1:-1] + g[1:-1, :-2] + g[1:-1, 2:])
    return float(lap.var())

# --- thresholds -------------------------------------------------------------
MIN_LONG_EDGE = 2560   # px. Below this we are upscaling on a 1440p display.
MIN_BPP       = 0.80   # bits/px. Good WebP photography sits at 1.0-2.0.
MIN_DETAIL    = 300.0  # Laplacian variance. A real photo scores ~880; kf-01 74.5.
MAX_BLACK_P1  = 12     # 1st-percentile luma. kf-01 sits at 39 — no true black.
MIN_WHITE_P99 = 235    # 99th-percentile luma. kf-01 sits at 207 — no true white.
MIN_LEVELS    = 180    # distinct luma levels in the smoothest quarter. Banding.

CHECKS = ("size", "bpp", "detail", "black", "white", "levels")


def measure(path: str) -> dict | None:
    try:
        img = Image.open(path).convert("RGB")
    except Exception:
        return None
    w, h = img.size
    g = _gray(np.array(img))
    kb = os.path.getsize(path) / 1024

    # Banding shows up in smooth areas, so score the flattest quarter of the
    # image (usually sky) rather than the frame as a whole — a busy frame can
    # hide a badly banded gradient in its average.
    qh = max(1, h // 4)
    bands = [g[i * qh:(i + 1) * qh, :] for i in range(4)]
    smoothest = min(bands, key=lambda b: float(b.std()))

    return {
        "w": w, "h": h, "kb": kb,
        "bpp": (kb * 1024 * 8) / (w * h),
        "detail": _laplacian_var(g),
        "p1": int(np.percentile(g, 1)),
        "p99": int(np.percentile(g, 99)),
        "levels": int(len(np.unique(smoothest.round().astype(np.uint8)))),
    }


def failures(m: dict) -> list[str]:
    out = []
    if max(m["w"], m["h"]) < MIN_LONG_EDGE: out.append("size")
    if m["bpp"]    < MIN_BPP:               out.append("bpp")
    if m["detail"] < MIN_DETAIL:            out.append("detail")
    if m["p1"]     > MAX_BLACK_P1:          out.append("black")
    if m["p99"]    < MIN_WHITE_P99:         out.append("white")
    if m["levels"] < MIN_LEVELS:            out.append("levels")
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("paths", nargs="*", help="image files to check")
    ap.add_argument("--baseline", action="store_true",
                    help="score the currently shipped assets instead")
    args = ap.parse_args()

    paths = args.paths
    if args.baseline:
        paths = sorted(glob.glob("public/film/stills/*.webp")) + \
                sorted(glob.glob("public/film/plates/*.webp"))
    if not paths:
        ap.error("no paths given (or use --baseline)")

    hdr = f'{"asset":26} {"px":>11} {"bits/px":>8} {"detail":>8} {"p1":>4} {"p99":>4} {"lvls":>5}  verdict'
    print(hdr); print("-" * len(hdr))

    bad = 0
    for p in paths:
        m = measure(p)
        if m is None:
            print(f"{os.path.basename(p)[:26]:26} {'unreadable':>48}")
            bad += 1
            continue
        f = failures(m)
        verdict = "PASS" if not f else "FAIL: " + ",".join(f)
        bad += bool(f)
        print(f'{os.path.basename(p)[:26]:26} {m["w"]}x{m["h"]:<6} {m["bpp"]:8.3f} '
              f'{m["detail"]:8.1f} {m["p1"]:4} {m["p99"]:4} {m["levels"]:5}  {verdict}')

    print(f"\n{len(paths) - bad}/{len(paths)} passed")
    if bad:
        print("\nthresholds: long edge >= %d, bits/px >= %.2f, detail >= %.0f,"
              % (MIN_LONG_EDGE, MIN_BPP, MIN_DETAIL))
        print("            p1 <= %d, p99 >= %d, levels >= %d"
              % (MAX_BLACK_P1, MIN_WHITE_P99, MIN_LEVELS))
    return bad


if __name__ == "__main__":
    sys.exit(main())
