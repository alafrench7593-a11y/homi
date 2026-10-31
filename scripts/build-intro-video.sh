#!/usr/bin/env bash
# Fabrique la vidéo de fond de l'introduction cinématique (assets/video/intro-cinematique.mp4)
# à partir des vidéos déjà fournies avec l'application (aucune ressource externe) :
#   histoire-3d.mp4 (parcours : ciel, désir d'enfant, embryon, grossesse, naissance, bébé, premiers pas,
#   enfance) puis jour-1.mp4 (nuages et fil doré) pour l'apparition du logo.
# Chaque séquence reçoit un zoom lent (effet « Ken Burns ») et les séquences s'enchaînent par des
# transitions de cinéma. Les textes, le logo et les effets graphiques sont animés DANS l'application
# (src/features/cinematicIntro), en français ou en anglais : la vidéo ne contient aucun texte.
# Qualité maximale (4K, 2160×3840) : les images de chaque séquence sont d'abord agrandies ×4 par IA
# (Real-ESRGAN, modèle realesr-animevideov3, adapté aux images de style animation 3D) puis montées ici :
#   SR_DIR=/chemin/vers/up bash scripts/build-intro-video.sh   (SR_DIR/seg0 … seg8 : images PNG agrandies)
# Sans SR_DIR, montage direct depuis les vidéos d'origine (720×1280).
# Produit aussi une version 1080×1920 (téléphones Android d'entrée de gamme) et l'image d'attente.
# Usage : bash scripts/build-intro-video.sh   (nécessite ffmpeg)
set -euo pipefail
cd "$(dirname "$0")/.."
H=assets/video/histoire-3d.mp4
J=assets/video/jour-1.mp4
OUT=assets/video/intro-cinematique.mp4
FPS=30; X=0.6   # images/s, durée des transitions (s)
if [ -n "${SR_DIR:-}" ]; then W=2160; HH=3840; PRE=1; else W=720; HH=1280; PRE=2; fi
OUT_HD=assets/video/intro-cinematique-1080.mp4

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
  if [ -n "${SR_DIR:-}" ]; then
    rate=$([ "$src" = "$J" ] && echo 30 || echo 24)
    args+=(-framerate "$rate" -t "$d" -i "$SR_DIR/seg$i/%05d.png")
  else
    args+=(-ss "$ss" -t "$d" -i "$src")
  fi
  n=$(python3 -c "print(round($d*$FPS))")
  if [ "$z" = in ]; then zexpr="1+0.06*on/$n"; else zexpr="1.06-0.06*on/$n"; fi
  filt+="[$i:v]fps=$FPS,scale=${W}*$PRE:${HH}*$PRE:force_original_aspect_ratio=increase:flags=lanczos,crop=${W}*$PRE:${HH}*$PRE,"
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
if [ -n "${SR_DIR:-}" ]; then
  # 4K : H.264 High 5.1 (lu en matériel par les iPhone et la plupart des Android), qualité quasi transparente
  ffmpeg -v error -y "${args[@]}" -filter_complex "$filt" -map "[out]" -an -c:v libx264 -preset slow -crf 17 -tune animation \
    -profile:v high -level:v 5.1 -pix_fmt yuv420p -movflags +faststart -r $FPS "$OUT"
  ffmpeg -v error -y -i "$OUT" -vf scale=1080:1920:flags=lanczos -an -c:v libx264 -preset slow -crf 18 -tune animation \
    -profile:v high -level:v 4.1 -pix_fmt yuv420p -movflags +faststart "$OUT_HD"
  ffmpeg -v error -y -i "$OUT" -frames:v 1 -vf scale=1440:2560:flags=lanczos -q:v 2 assets/video/intro-cinematique.jpg
else
  ffmpeg -v error -y "${args[@]}" -filter_complex "$filt" -map "[out]" -an -c:v libx264 -preset slow -crf 21 -profile:v high -pix_fmt yuv420p -movflags +faststart -r $FPS "$OUT"
  cp "$OUT" "$OUT_HD"
  ffmpeg -v error -y -i "$OUT" -frames:v 1 -q:v 3 assets/video/intro-cinematique.jpg
fi
ffprobe -v error -show_entries format=duration:stream=width,height -of default=nw=1 "$OUT"
du -h "$OUT" "$OUT_HD"
