#!/usr/bin/env bash
# =============================================================================
# Rechitta Scroll Film — Footage Processing Pipeline
# =============================================================================
# Turns approved Veo/Flow clips into compressed, scroll-ready frame sequences.
#
# THE SIZE PROBLEM, SOLVED:
#   A raw 8s 1080p Veo clip is ~20-60MB. We do NOT ship video. We ship frames:
#   - 12 fps effective scrub rate (96 frames per 8s transit) — indistinguishable
#     from full rate under scroll-scrub, because the scroll position (not a
#     clock) drives playback; the eye reads it as smooth motion.
#   - Two resolution tiers: 1600px (desktop) and 900px (mobile).
#   - WebP q62 ≈ 25-45KB/frame → ~3-4MB per transit desktop tier,
#     ~1.2MB mobile tier. Full film ≈ 15-18MB desktop, lazy-loaded per scene
#     so first paint needs only the hero + Transit A (~4MB).
#
# USAGE:
#   ./process-footage.sh <clips_dir> <output_dir>
#   Clips must be named:  transit-a.mp4  transit-b.mp4  transit-c.mp4  transit-d.mp4
#   (plus optional hero.mp4 / finale.mp4 for ambient loops)
#
# REQUIRES: ffmpeg 5+ (brew install ffmpeg / apt install ffmpeg)
# =============================================================================
set -euo pipefail

CLIPS_DIR="${1:?Usage: ./process-footage.sh <clips_dir> <output_dir>}"
OUT_DIR="${2:?Usage: ./process-footage.sh <clips_dir> <output_dir>}"

FPS=12               # effective scrub framerate
DESKTOP_W=1600
MOBILE_W=900
WEBP_Q=62            # sweet spot: artifacts invisible over motion footage
mkdir -p "$OUT_DIR"

MANIFEST="$OUT_DIR/manifest.json"
echo '{ "fps": '"$FPS"', "sequences": {' > "$MANIFEST"
first_entry=true

for clip in "$CLIPS_DIR"/*.mp4; do
  name=$(basename "$clip" .mp4)
  echo "── Processing: $name"

  for tier in desktop mobile; do
    if [ "$tier" = "desktop" ]; then W=$DESKTOP_W; else W=$MOBILE_W; fi
    dir="$OUT_DIR/$name/$tier"
    mkdir -p "$dir"

    # Extract + resize + compress in one pass.
    # -vf: sample to target fps, scale to width (height auto, even).
    ffmpeg -hide_banner -loglevel error -i "$clip" \
      -vf "fps=$FPS,scale=$W:-2:flags=lanczos" \
      -c:v libwebp -quality $WEBP_Q -preset photo \
      "$dir/f_%03d.webp"

    count=$(ls "$dir" | wc -l | tr -d ' ')
    size=$(du -sh "$dir" | cut -f1)
    echo "   $tier: $count frames, $size"
  done

  frames=$(ls "$OUT_DIR/$name/desktop" | wc -l | tr -d ' ')
  if [ "$first_entry" = true ]; then first_entry=false; else echo ',' >> "$MANIFEST"; fi
  printf '  "%s": { "frames": %s, "pattern": "%s/{tier}/f_%%03d.webp" }' \
    "$name" "$frames" "$name" >> "$MANIFEST"
done

echo '' >> "$MANIFEST"
echo '} }' >> "$MANIFEST"

echo ""
echo "── Totals ──────────────────────────────────"
du -sh "$OUT_DIR"/*/ 2>/dev/null || true
echo ""
echo "Manifest written: $MANIFEST"
echo "The scroll engine reads manifest.json and swaps its procedural"
echo "placeholder scenes for these sequences — no engine changes needed."

# =============================================================================
# ALTERNATIVE: all-intra video scrubbing (smaller, slightly riskier)
# -----------------------------------------------------------------------------
# Instead of frame sequences, encode every frame as a keyframe and scrub the
# <video> element's currentTime on scroll. ~40% smaller than frame sequences,
# but seek latency varies by browser/device — test on a mid-range Android
# before committing. To try it:
#
#   ffmpeg -i transit-a.mp4 -vf "fps=24,scale=1600:-2" \
#     -c:v libx264 -g 1 -crf 23 -pix_fmt yuv420p -movflags +faststart \
#     transit-a-scrub.mp4
#
#   (-g 1 = every frame is an I-frame = instant seeking)
# =============================================================================
