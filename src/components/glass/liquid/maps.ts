/**
 * Verre liquide HOMI — cartes calculées une fois par taille et par réglage (pures, testées). Aucune boucle
 * d'animation : le navigateur recompose lui-même ce qui passe derrière le verre pendant le défilement.
 *
 *  - CARTE DE DÉPLACEMENT (R = x, G = y, 128 = immobile) : nulle au centre — une carte reste reconnaissable — et
 *    croissante dans la lèvre du bord, orientée vers l'intérieur selon la normale du contour arrondi. Le contenu qui
 *    traverse le bord est donc pris un peu plus loin à l'intérieur : son arête se courbe en entrant, se redresse en
 *    ressortant. Le profil est la pente d'une lèvre « squircle » (h = (1 − (1 − x)⁴)^¼), réglée par l'épaisseur.
 *  - CARTE DE REFLET (alpha blanc) : lumière fixe d'angle `lightAngle` ; forte là où la normale du bord fait face à la
 *    source, faible rebond intérieur à l'opposé ; concentrée dans la lèvre, nulle au centre.
 */
import type { LensParams } from './params';

export interface LensGeometry { width: number; height: number; radius: number }

/** Distance signée au contour d'un rectangle arrondi (négative dedans) et normale sortante. */
export function roundedRectField(x: number, y: number, g: LensGeometry): { d: number; nx: number; ny: number } {
  const hw = g.width / 2, hh = g.height / 2;
  const r = Math.max(0, Math.min(g.radius, hw, hh));
  const px = x - hw, py = y - hh;
  const qx = Math.abs(px) - (hw - r), qy = Math.abs(py) - (hh - r);
  const sx = Math.sign(px) || 1, sy = Math.sign(py) || 1;
  if (qx > 0 && qy > 0) {
    const l = Math.hypot(qx, qy) || 1;
    return { d: l - r, nx: (qx / l) * sx, ny: (qy / l) * sy };
  }
  if (qx > qy) return { d: qx - r, nx: sx, ny: 0 };
  return { d: qy - r, nx: 0, ny: sy };
}

/** Pente normalisée (0–1) de la lèvre à la profondeur `t` (0 = bord, 1 = fin de la lèvre). */
export function lipSlope(t: number, thickness: number): number {
  if (t <= 0) return 1;
  if (t >= 1) return 0;
  // exposant : épaisseur forte → la courbure pénètre plus loin vers l'intérieur
  const k = 0.6 + (1 - thickness) * 2.4;
  const u = 1 - t;                          // 1 au bord, 0 à l'intérieur
  return Math.pow(u, k);
}

/** Carte de déplacement RGBA (taille entière, 1 px = 1 pt). */
export function displacementMap(g: LensGeometry, p: Pick<LensParams, 'bezel' | 'thickness'>): Uint8ClampedArray {
  const w = Math.max(1, Math.round(g.width)), h = Math.max(1, Math.round(g.height));
  const out = new Uint8ClampedArray(w * h * 4);
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const f = roundedRectField(i + 0.5, j + 0.5, g);
      const depth = -f.d;                   // distance au bord vers l'intérieur
      const m = depth < 0 ? 0 : lipSlope(depth / Math.max(1, p.bezel), p.thickness);
      const k = (j * w + i) * 4;
      // vers l'intérieur : −normale
      out[k] = 128 - Math.round(127 * m * f.nx);
      out[k + 1] = 128 - Math.round(127 * m * f.ny);
      out[k + 2] = 128;
      out[k + 3] = 255;
    }
  }
  return out;
}

/** Carte de reflet RGBA (blanc, alpha = lumière). */
export function highlightMap(g: LensGeometry, p: Pick<LensParams, 'bezel' | 'highlight' | 'lightAngle'>): Uint8ClampedArray {
  const w = Math.max(1, Math.round(g.width)), h = Math.max(1, Math.round(g.height));
  const out = new Uint8ClampedArray(w * h * 4);
  const a = (p.lightAngle * Math.PI) / 180;
  const lx = Math.cos(a), ly = -Math.sin(a);   // écran : y vers le bas
  const rim = Math.max(2, p.bezel * 0.55);
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const f = roundedRectField(i + 0.5, j + 0.5, g);
      const depth = -f.d;
      const k = (j * w + i) * 4;
      out[k] = 255; out[k + 1] = 255; out[k + 2] = 255;
      if (depth < 0 || depth > rim) { out[k + 3] = 0; continue; }
      const facing = f.nx * lx + f.ny * ly;   // 1 : le bord fait face à la lumière
      const lit = facing > 0 ? Math.pow(facing, 2) : Math.pow(-facing, 3) * 0.35; // rebond intérieur, plus faible
      const fall = Math.pow(1 - depth / rim, 1.6);  // plus vif à l'arête
      out[k + 3] = Math.round(255 * Math.min(1, p.highlight * lit * fall));
    }
  }
  return out;
}
