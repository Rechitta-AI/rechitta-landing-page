#!/usr/bin/env bash
# Encodes the source films into web-ready AV1 + H.264 + 720p proxy.
# Reads from public/upscaled-ones/, writes to public/film/video/.
# Never modifies or deletes the sources.
set -euo pipefail

SRC="public/upscaled-ones"
OUT="public/film/video"
mkdir -p "$OUT"

# sequence-key : source file
SEQS=(
  "scene1-3:upscaled-start-to-screen.mp4"
  "transit-b:upscaled-screen-to-broker.mp4"
  "transit-c:upscaled-broker-to-buyer.mp4"
  "transit-d:upscaled-buyer-to-cloud.mp4"
  "transit-e:upscaled-cloud-to-dusk.mp4"
)

for entry in "${SEQS[@]}"; do
  key="${entry%%:*}"
  file="${entry#*:}"
  in="$SRC/$file"

  echo "=== $key  <-  $file ==="

  # AV1: primary. 10-bit, dense keyframes (g=1) so scrubbing can seek cheaply.
  ffmpeg -v error -stats -y -i "$in" \
    -an -c:v libsvtav1 -crf 28 -preset 7 -g 1 -pix_fmt yuv420p10le \
    -movflags +faststart "$OUT/$key.av1.mp4"

  # H.264: fallback for browsers without AV1.
  ffmpeg -v error -stats -y -i "$in" \
    -an -c:v libx264 -crf 20 -preset medium -g 1 -pix_fmt yuv420p \
    -movflags +faststart "$OUT/$key.h264.mp4"

  # 720p proxy: loads in ~1s so the film is scrubbable before the 4K lands.
  ffmpeg -v error -stats -y -i "$in" \
    -an -vf "scale=-2:720" -c:v libx264 -crf 26 -preset medium -g 1 -pix_fmt yuv420p \
    -movflags +faststart "$OUT/$key.proxy.mp4"
done

echo "=== done ==="
ls -lh "$OUT"
