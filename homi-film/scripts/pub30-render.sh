#!/usr/bin/env bash
# Pub 30 s — rendu final par tranches muettes (navigateur neuf à chaque tranche), assemblage sans réencodage,
# puis pose du son UNE fois (aucune coupure audio aux jonctions) : version avec voix et version sans voix.
# Usage : scripts/pub30-render.sh Pub30-Vertical renders/HOMI-pub30-vertical [échelle]
set -euo pipefail
COMP=$1; BASE=$2; SCALE=${3:-1}; STEP=300; TOTAL=1800
python3 scripts/pub30_audio.py >/dev/null
D=renders/parts-$COMP-$SCALE; mkdir -p $D; : > $D/list.txt
for ((a=0; a<TOTAL; a+=STEP)); do
  b=$((a+STEP-1)); part=$D/$(printf %04d $a).mp4
  [ -f "$part" ] || npx remotion render src/index.ts "$COMP" "$part" --frames=$a-$b --scale=$SCALE --muted --crf=14 --x264-preset=slow --concurrency=3 --timeout=120000 --browser-executable=/opt/pw-browsers/chromium --log=error
  echo "file '$(basename "$part")'" >> $D/list.txt; echo "tranche $a-$b ok"
done
ffmpeg -v error -y -f concat -safe 0 -i $D/list.txt -c copy $D/video.mp4
for v in voix sans-voix; do
  wav=public/audio/pub30-mix.wav; [ $v = sans-voix ] && wav=public/audio/pub30-mix-sans-voix.wav
  ffmpeg -v error -y -i $D/video.mp4 -i $wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart -t 30 "${BASE}-${v}.mp4"
  echo "OK ${BASE}-${v}.mp4"
done
