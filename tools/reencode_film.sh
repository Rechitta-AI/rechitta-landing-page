#!/usr/bin/env bash
# Re-encodes the film with a normal keyframe interval.
#
# The original encode used -g 1 — every frame a keyframe — because the film
# used to be scrubbed frame by frame off the scroll position. It no longer is:
# transitions are played once by the hardware decoder, and seeking only happens
# when parking a beat, off screen. All-intra costs several times the bitrate
# for a property nothing needs any more.
#
# Sources are the existing all-intra masters. Writes to a staging directory;
# nothing is overwritten until the results have been checked.
set -euo pipefail

SRC="public/film/video"
OUT="public/film/video-next"
mkdir -p "$OUT"

# One second of GOP at 24fps: seeks stay cheap, bitrate drops hard.
GOP=24

KEYS=(scene1-3 transit-b transit-c transit-d last-scene)

for key in "${KEYS[@]}"; do
  in="$SRC/$key.h264.mp4"
  [ -f "$in" ] || { echo "!! missing $in"; continue; }
  echo "=== $key ==="

  ffmpeg -v error -stats -y -i "$in" \
    -an -c:v libsvtav1 -crf 32 -preset 8 -g $GOP -pix_fmt yuv420p10le \
    -movflags +faststart "$OUT/$key.av1.mp4"

  ffmpeg -v error -stats -y -i "$in" \
    -an -c:v libx265 -crf 26 -preset medium -g $GOP -tag:v hvc1 -pix_fmt yuv420p \
    -movflags +faststart "$OUT/$key.hevc.mp4"

  ffmpeg -v error -stats -y -i "$in" \
    -an -c:v libx264 -crf 22 -preset medium -g $GOP -pix_fmt yuv420p \
    -movflags +faststart "$OUT/$key.h264.mp4"
done

echo "=== done ==="
ls -lh "$OUT"
