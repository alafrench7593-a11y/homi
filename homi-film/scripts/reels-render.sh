#!/usr/bin/env bash
# Reels Instagram HOMI (15 s, 1080×1920, 60 i/s) : rendu muet, puis pose du son (avec voix / sans voix).
set -euo pipefail
python3 scripts/reels_audio.py >/dev/null
mkdir -p renders/instagram/reels
for n in ${REELS:-02 05 08 11 14}; do
  v=renders/instagram/reels/video-$n.mp4
  [ -f "$v" ] || npx remotion render src/index.ts Insta-Reel-$n "$v" --muted --crf=15 --concurrency=3 --timeout=240000 --browser-executable=/opt/pw-browsers/chromium --log=error
  for s in "" "-sans-voix"; do
    ffmpeg -v error -y -i "$v" -i public/audio/reel-$n$s.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -movflags +faststart -t 15 "renders/instagram/reels/HOMI-Reel-$n${s:-}.mp4"
  done
  echo "OK reel $n"
done
