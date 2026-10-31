#!/usr/bin/env bash
# Fabrique la vidéo de fond de l'introduction cinématique (assets/video/intro-cinematique.mp4)
# à partir des vidéos déjà fournies avec l'application (aucune ressource externe) :
#   histoire-3d.mp4 (parcours : ciel, désir d'enfant, embryon, grossesse, naissance, bébé, premiers pas,
#   enfance) puis jour-1.mp4 (nuages et fil doré) pour l'apparition du logo.
# Chaque séquence reçoit un zoom lent (effet « Ken Burns ») et les séquences s'enchaînent par des
# transitions de cinéma. Les textes, le logo et les effets graphiques sont animés DANS l'application
# (src/features/cinematicIntro), en français ou en anglais : la vidéo ne contient aucun texte.
# Usage : bash scripts/build-intro-video.sh   (nécessite ffmpeg)
set -euo pipefail
cd "$(dirname "$0")/.."
H=assets/video/histoire-3d.mp4
J=assets/video/jour-1.mp4
OUT=assets/video/intro-cinematique.mp4
W=720; HH=1280; FPS=30; X=0.6   # taille, images/s, durée des transitions (s)

# source|début|durée|zoom (in = avance, out = recule)
SEGS=(
  "$H|0.0|3.4|in"    # ciel et lumière
  "$H|4.2|3.0|in"    # désir d'enfant
  "$H|8.0|3.0|out"   # une vie commence (embryon)
  "$H|12.0|2.8|out"  # grossesse
  "$H|15.0|2.8|in"   # naissance
  "$H|19.0|2.8|out"  # premiers mois
  "$H|22.2|2.4|in"   # premiers pas
  "$H|29.0|2.8|out"  # enfance
  "$J|0.0|4.6|in"    # fil doré : logo
)
TRANS=(fade circleopen smoothup fadewhite fade smoothleft fade fade)

args=(); filt=""; i=0
for s in "${SEGS[@]}"; do
  IFS='|' read -r src ss d z <<<"$s"
  args+=(-ss "$ss" -t "$d" -i "$src")
  n=$(python3 -c "print(round($d*$FPS))")
  if [ "$z" = in ]; then zexpr="1+0.06*on/$n"; else zexpr="1.06-0.06*on/$n"; fi
  filt+="[$i:v]fps=$FPS,scale=${W}*2:${HH}*2:force_original_aspect_ratio=increase:flags=lanczos,crop=${W}*2:${HH}*2,"
  filt+="zoompan=z='$zexpr':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${W}x${HH}:fps=$FPS,setsar=1,format=yuv420p[v$i];"
  i=$((i+1))
done
prev="v0"; off=0
for ((k=1; k<i; k++)); do
  IFS='|' read -r _ _ dprev _ <<<"${SEGS[$((k-1))]}"
  off=$(python3 -c "print(round($off+$dprev-$X,3))")
  filt+="[$prev][v$k]xfade=transition=${TRANS[$((k-1))]}:duration=$X:offset=$off[x$k];"
  prev="x$k"
done
# légère montée des couleurs chaudes et grain très fin (texture « cinéma »)
filt+="[$prev]eq=saturation=1.06:contrast=1.03,noise=alls=3:allf=t,format=yuv420p[out]"
ffmpeg -v error -y "${args[@]}" -filter_complex "$filt" -map "[out]" -an -c:v libx264 -preset slow -crf 21 -profile:v high -pix_fmt yuv420p -movflags +faststart -r $FPS "$OUT"
ffmpeg -v error -y -i "$OUT" -frames:v 1 -q:v 3 assets/video/intro-cinematique.jpg
ffprobe -v error -show_entries format=duration:stream=width,height -of default=nw=1 "$OUT"
du -h "$OUT"
