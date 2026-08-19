#!/usr/bin/env bash
# =============================================================================
# Rechitta Scroll Film — Footage Processing Pipeline v2 (orientation-aware)
# =============================================================================
# Turns approved Veo/Flow clips into compressed, scroll-ready frame sequences
# laid out for manifest v2: frames/<name>/<orientation>/<tierWidth>/f_NNN.webp
#
# Naming convention for input clips:
#   transit-a.mp4            → landscape tiers
#   transit-a-portrait.mp4   → true portrait gen (bucket 3). If absent, the
#                              manifest marks portrait {"reuse":"landscape"}
#                              (bucket 1: crop-tolerant).
#
# Tiers are literal pixel widths — the engine picks the smallest tier that
# still covers viewport×DPR. Landscape: 1600/900. Portrait: 1080/720.
#
# Output: frames/... plus sequences.json — merge its entries into
# public/film/manifest.json "sequences" (or the CDN copy) by hand; the merge
# is deliberate — a human approves every clip that enters the film.
#
# REQUIRES: ffmpeg 5+ (ffprobe included)
# =============================================================================
set -euo pipefail

CLIPS_DIR="${1:?Usage: ./process-footage.sh <clips_dir> <output_dir>}"
OUT_DIR="${2:?Usage: ./process-footage.sh <clips_dir> <output_dir>}"

FPS=12
WEBP_Q=62
LANDSCAPE_TIERS=(1600 900)
PORTRAIT_TIERS=(1080 720)

mkdir -p "$OUT_DIR"
SEQ_JSON="$OUT_DIR/sequences.json"

# Extracts one clip into all tiers of one orientation.
# Progress goes to stderr; the manifest JSON object is echoed on stdout.
extract() { # $1 clip, $2 seq name, $3 orientation, $4.. tier widths
  local clip="$1" name="$2" orient="$3"; shift 3
  local frames=0 tier_list="" size_json="null"
  for W in "$@"; do
    local dir="$OUT_DIR/frames/$name/$orient/$W"
    mkdir -p "$dir"
    ffmpeg -y -hide_banner -loglevel error -i "$clip" \
      -vf "fps=$FPS,scale=$W:-2:flags=lanczos" \
      -c:v libwebp -quality $WEBP_Q -preset photo \
      "$dir/f_%03d.webp"
    frames=$(ls "$dir" | wc -l | tr -d ' ')
    echo "   $orient/$W: $frames frames, $(du -sh "$dir" | cut -f1)" >&2
    tier_list="${tier_list:+$tier_list, }$W"
    if [ "$size_json" = "null" ]; then
      local h
      h=$(ffprobe -v error -select_streams v:0 -show_entries stream=height \
          -of csv=p=0 "$dir/f_001.webp")
      size_json="[$W, $h]"
    fi
  done
  printf '{ "frames": %s, "tiers": [%s], "size": %s, "pattern": "frames/%s/%s/{tier}/f_{frame}.webp" }' \
    "$frames" "$tier_list" "$size_json" "$name" "$orient"
}

echo '{' > "$SEQ_JSON"
first=true
for clip in "$CLIPS_DIR"/*.mp4; do
  base=$(basename "$clip" .mp4)
  case "$base" in *-portrait) continue;; esac  # picked up with its landscape sibling
  echo "── Processing: $base" >&2

  land_json=$(extract "$clip" "$base" landscape "${LANDSCAPE_TIERS[@]}")

  port_clip="$CLIPS_DIR/$base-portrait.mp4"
  if [ -f "$port_clip" ]; then
    port_json=$(extract "$port_clip" "$base" portrait "${PORTRAIT_TIERS[@]}")
  else
    port_json='{ "reuse": "landscape" }'
  fi

  [ "$first" = true ] && first=false || echo ',' >> "$SEQ_JSON"
  printf '  "%s": {\n    "landscape": %s,\n    "portrait": %s\n  }' \
    "$base" "$land_json" "$port_json" >> "$SEQ_JSON"
done
echo '' >> "$SEQ_JSON"
echo '}' >> "$SEQ_JSON"

echo "" >&2
echo "── Totals ──────────────────────────────────" >&2
du -sh "$OUT_DIR"/frames/*/ 2>/dev/null >&2 || true
echo "" >&2
echo "Sequences fragment: $SEQ_JSON — merge into public/film/manifest.json \"sequences\"." >&2
