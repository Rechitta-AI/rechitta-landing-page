#!/usr/bin/env bash
# Rebuilds the non-AV1 tiers.
#   HEVC 4K  -> Safari / Apple devices, hardware-decoded, full resolution.
#   H.264 1080p -> last-resort fallback for browsers that have neither.
set -euo pipefail

SRC="public/upscaled-ones"
OUT="public/film/video"

SEQS=(
  "scene1-3:upscaled-start-to-screen.mp4"
  "transit-b:upscaled-screen-to-broker.mp4"
  "transit-c:upscaled-broker-to-buyer.mp4"
  "transit-d:upscaled-buyer-to-cloud.mp4"
  "transit-e:upscaled-cloud-to-dusk.mp4"
)

for entry in "${SEQS[@]}"; do
  key="${entry%%:*}"
  in="$SRC/${entry#*:}"
  echo "=== $key ==="

  # hvc1 tag is what makes Safari accept HEVC in an mp4.
  ffmpeg -v error -stats -y -i "$in" \
    -an -c:v hevc_videotoolbox -b:v 8M -g 12 -tag:v hvc1 -pix_fmt yuv420p \
    -movflags +faststart "$OUT/$key.hevc.mp4"

  ffmpeg -v error -stats -y -i "$in" \
    -an -vf "scale=-2:1080" -c:v libx264 -crf 21 -preset medium -g 12 -pix_fmt yuv420p \
    -movflags +faststart "$OUT/$key.h264.mp4"
done
echo "=== done ==="
