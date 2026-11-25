#!/usr/bin/env bash
# Rendu par tranches (navigateur neuf à chaque tranche : évite l'usure des onglets sur les longs rendus), puis assemblage sans réencodage.
# Usage : scripts/render-chunks.sh <Composition> <sortie.mp4> <images_par_tranche> <total_images>
set -euo pipefail
COMP=${1:-Animatic}; OUT=${2:-renders/homi-animatic-720p30.mp4}; STEP=${3:-900}
TOTAL=${4:?nombre total d’images (Animatic : 5400, Master : 10800)}
mkdir -p renders/parts; : > renders/parts/list.txt
for ((a=0; a<TOTAL; a+=STEP)); do
  b=$((a+STEP-1)); [ $b -ge $TOTAL ] && b=$((TOTAL-1))
  part=renders/parts/${COMP}-$(printf %05d $a).mp4
  [ -f "$part" ] || npx remotion render src/index.ts "$COMP" "$part" --frames=$a-$b --browser-executable=/opt/pw-browsers/chromium --concurrency=3 --timeout=120000 --log=error
  echo "file '$(basename "$part")'" >> renders/parts/list.txt
  echo "tranche $a-$b ok"
done
npx remotion ffmpeg -y -f concat -safe 0 -i renders/parts/list.txt -c copy "$OUT" -loglevel error
echo "OK $OUT"
