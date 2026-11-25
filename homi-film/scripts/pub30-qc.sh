#!/usr/bin/env bash
# Contrôle d'un rendu Pub30 : durée, images, i/s, images noires, images figées (> 0,5 s), sonie, crête audio.
f="$1"
echo "== $f"
ffprobe -v error -select_streams v:0 -count_frames -show_entries stream=width,height,r_frame_rate,nb_read_frames -show_entries format=duration -of default=nw=1 "$f" | tr '\n' ' '; echo
echo -n "noir: "; ffmpeg -hide_banner -i "$f" -vf blackdetect=d=0.05:pix_th=0.08 -an -f null - 2>&1 | grep -c black_start
echo -n "figé>0.5s: "; ffmpeg -hide_banner -i "$f" -vf freezedetect=n=0.0005:d=0.5 -an -f null - 2>&1 | grep -o 'freeze_start: [0-9.]*\|freeze_duration: [0-9.]*' | tr '\n' ' '; echo
ffmpeg -hide_banner -i "$f" -af ebur128=peak=true -vn -f null - 2>&1 | grep -E '^\s+(I|True peak|Peak):' | tr -s ' ' | tr '\n' ' '; echo
