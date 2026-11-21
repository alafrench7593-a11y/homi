#!/usr/bin/env python3
"""
Lumière DANS le pictogramme des onglets (ticket 2, 21/11/2026) — calcul hors application.

Les icônes de la barre (assets/brand/tabs/<nom>.png, fournies par la propriétaire) sont une TUILE de verre lavande et
un SYMBOLE blanc sculpté. La lueur jaune ne doit éclairer que le symbole, jamais la tuile ni le fond autour. Pour
chaque icône, ce script écrit :
  - assets/brand/tabs/<nom>-mask.png : masque du SYMBOLE (blanc opaque = symbole, transparent ailleurs), obtenu par
    seuil doux sur la luminance (pixels clairs et peu saturés), limité à l'intérieur de la tuile (l'arête claire de la
    tuile est exclue), petits trous de texture refermés, puis rogné d'1 px pour rester STRICTEMENT dans le dessin ;
  - assets/brand/tabs/<nom>-lit.png : le symbole « allumé » — la couleur de la lumière, d'opacité = masque × halo
    centré sur le CŒUR du dessin (soleil : centre du disque ; « + » : croisement des branches ; personnes : visage).
L'application superpose <nom>-lit.png à l'icône et ne fait varier que son opacité (src/brand/toolGlass/TabLight.tsx) :
la lumière reste dans le symbole au repos, à l'appui et pendant le changement d'onglet.

Usage : python3 scripts/brand/tab-light-masks.py [--check]
  --check : recalcule en mémoire et échoue si les fichiers écrits ne correspondent plus (icônes changées).
Dépendances : Pillow, numpy (aucune à l'exécution de l'application).
"""
import os, sys
import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..', '..', 'assets', 'brand', 'tabs')
NAMES = ['today', 'me', 'add', 'child', 'family']
# Cœur du dessin (fraction de la largeur / hauteur de l'icône 192 px), relevé sur les fichiers fournis
HEART = {'today': (0.5, 0.47), 'me': (0.5, 0.36), 'add': (0.5, 0.5), 'child': (0.5, 0.52), 'family': (0.5, 0.62)}
# Couleur de la lumière (même jaune que src/theme/toolLogo.ts TAB_LIGHT.color)
LIGHT = (0xFF, 0xC8, 0x3D)
LUM_LO, LUM_HI = 192.0, 206.0   # seuil doux : en dessous = tuile ; au-dessus = symbole
TILE_MARGIN = 12               # px exclus le long du bord de la tuile (arête claire du verre)


def shift_min(m, r):
    """Érosion (minimum) carrée de rayon r, sans scipy."""
    out = m.copy()
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            out = np.minimum(out, np.roll(np.roll(m, dy, 0), dx, 1))
    return out


def shift_max(m, r):
    out = m.copy()
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            out = np.maximum(out, np.roll(np.roll(m, dy, 0), dx, 1))
    return out


def box_blur(m, r):
    acc = np.zeros_like(m); n = 0
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            acc += np.roll(np.roll(m, dy, 0), dx, 1); n += 1
    return acc / n


def compute(name):
    a = np.asarray(Image.open(os.path.join(ROOT, f'{name}.png')).convert('RGBA')).astype(np.float64)
    h, w = a.shape[:2]
    lum = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
    sat = a[..., :3].max(-1) - a[..., :3].min(-1)
    soft = np.clip((lum - LUM_LO) / (LUM_HI - LUM_LO), 0, 1) * (sat < 40)
    tile = (a[..., 3] > 200).astype(np.float64)
    inner = shift_min(tile, TILE_MARGIN)
    soft = soft * inner
    hard = (soft > 0.5).astype(np.float64)
    hard = shift_min(shift_max(hard, 1), 1)          # referme les trous d’1 px de la texture (jamais les séparations du dessin)
    hard = shift_min(hard, 1)                         # 1 px à l'intérieur du bord : jamais de liseré sur la tuile
    mask = np.minimum(box_blur(hard, 1), hard)        # bord adouci, toujours contenu dans le dessin
    yy, xx = np.mgrid[0:h, 0:w]
    hx, hy = HEART[name][0] * w, HEART[name][1] * h
    d = np.hypot(xx - hx, yy - hy) / (0.30 * w)
    halo = 0.14 + 0.86 * np.exp(-d * d)               # vif au cœur, à peine teinté aux extrémités
    lit = np.zeros((h, w, 4), np.uint8)
    lit[..., 0], lit[..., 1], lit[..., 2] = LIGHT
    lit[..., 3] = np.round(255 * 0.85 * mask * halo).astype(np.uint8)
    m = np.zeros((h, w, 4), np.uint8)
    m[..., :3] = 255
    m[..., 3] = np.round(255 * mask).astype(np.uint8)
    return Image.fromarray(m, 'RGBA'), Image.fromarray(lit, 'RGBA')


def main():
    check = '--check' in sys.argv
    bad = []
    for n in NAMES:
        mask, lit = compute(n)
        for suffix, img in (('mask', mask), ('lit', lit)):
            path = os.path.join(ROOT, f'{n}-{suffix}.png')
            if check:
                if not os.path.exists(path) or not np.array_equal(np.asarray(Image.open(path).convert('RGBA')), np.asarray(img)):
                    bad.append(path)
            else:
                img.save(path, optimize=True)
    if bad:
        print('Masques à régénérer : python3 scripts/brand/tab-light-masks.py\n' + '\n'.join(bad)); sys.exit(1)
    print('ok' if check else f'{len(NAMES) * 2} fichiers écrits dans {os.path.normpath(ROOT)}')


if __name__ == '__main__':
    main()
