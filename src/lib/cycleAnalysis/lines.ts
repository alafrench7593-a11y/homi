/**
 * Détection des lignes d'un test à bandelette ou cassette.
 *
 * Recadrage guidé : l'utilisatrice touche l'extrémité de la fenêtre côté ligne de contrôle (C),
 * puis l'extrémité opposée (côté ligne de test, T). On échantillonne une bande le long de ce segment,
 * quelle que soit l'orientation du test sur la photo. Les lignes sont perpendiculaires au segment.
 *
 * Méthode : profil d'« encre » le long de la bande → soustraction du fond (médiane glissante)
 * → bruit estimé par l'écart absolu médian → pics significatifs.
 * La moitié côté C contient la ligne de contrôle, l'autre moitié la ligne de test.
 */
import { ink, luminance, median, pixel, type Px, type RGBAImage } from './image';

export interface DetectedLine {
  /** Position le long de la fenêtre : 0 = extrémité C, 1 = extrémité T. */
  position: number;
  /** Intensité du pic au-dessus du fond (0–255). */
  height: number;
  /** Rapport signal / bruit. */
  snr: number;
}

export interface LineScan {
  profile: number[];
  residual: number[];
  noise: number;
  /** Luminosité moyenne de la bande analysée (0–255). */
  bandBrightness: number;
  control: DetectedLine | null;
  test: DetectedLine | null;
  /** Tous les pics retenus (pour l'affichage). */
  peaks: DetectedLine[];
  /** Intensité test / contrôle (null si l'une des lignes manque). */
  ratio: number | null;
}

export const LINE_THRESHOLDS = {
  samples: 200,
  /** Pic retenu si > 3 × bruit ET > 4 niveaux. */
  minSnr: 3,
  minHeight: 4,
  /** Écart minimal entre deux lignes (fraction de la fenêtre). */
  minSeparation: 0.06,
};

/** Profil le long du segment C → T, sur une bande de largeur `bandRatio` × longueur. */
export function sampleProfile(img: RGBAImage, c: Px, t: Px, bandRatio = 0.22, samples = LINE_THRESHOLDS.samples) {
  const dx = t.x - c.x;
  const dy = t.y - c.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const half = (len * bandRatio) / 2;
  const across = 9;
  const profile: number[] = [];
  let lumSum = 0;
  let lumN = 0;
  for (let i = 0; i < samples; i++) {
    const f = i / (samples - 1);
    const px = c.x + dx * f;
    const py = c.y + dy * f;
    const vals: number[] = [];
    for (let k = 0; k < across; k++) {
      const o = -half + (2 * half * k) / (across - 1);
      const [r, g, b] = pixel(img, px + nx * o, py + ny * o);
      vals.push(ink(r, g, b));
      lumSum += luminance(r, g, b);
      lumN++;
    }
    // moyenne des valeurs centrales : robuste aux bords du boîtier
    vals.sort((a, b) => a - b);
    const mid = vals.slice(2, across - 2);
    profile.push(mid.reduce((a, b) => a + b, 0) / mid.length);
  }
  return { profile, bandBrightness: lumN ? lumSum / lumN : 0 };
}

function rollingMedian(values: number[], window: number): number[] {
  const half = Math.floor(window / 2);
  return values.map((_, i) => median(values.slice(Math.max(0, i - half), Math.min(values.length, i + half + 1))));
}

export function findPeaks(profile: number[]) {
  const n = profile.length;
  const baseline = rollingMedian(profile, Math.max(9, Math.round(n * 0.3)));
  const raw = profile.map((v, i) => v - baseline[i]);
  const residual = raw.map((_, i) => (raw[Math.max(0, i - 1)] + raw[i] + raw[Math.min(n - 1, i + 1)]) / 3);
  const med = median(residual);
  const noise = Math.max(0.5, 1.4826 * median(residual.map((r) => Math.abs(r - med))));
  const th = LINE_THRESHOLDS;
  const candidates: DetectedLine[] = [];
  for (let i = 1; i < n - 1; i++) {
    const r = residual[i];
    if (r >= residual[i - 1] && r > residual[i + 1] && r > th.minSnr * noise && r > th.minHeight) {
      candidates.push({ position: i / (n - 1), height: r, snr: r / noise });
    }
  }
  // fusion des pics trop proches (on garde le plus fort)
  candidates.sort((a, b) => b.height - a.height);
  const peaks: DetectedLine[] = [];
  for (const p of candidates) if (!peaks.some((q) => Math.abs(q.position - p.position) < th.minSeparation)) peaks.push(p);
  peaks.sort((a, b) => a.position - b.position);
  return { residual, noise, peaks };
}

export function scanLines(img: RGBAImage, c: Px, t: Px, bandRatio = 0.22): LineScan {
  const { profile, bandBrightness } = sampleProfile(img, c, t, bandRatio);
  const { residual, noise, peaks } = findPeaks(profile);
  // On ignore les 4 % aux extrémités (bords du boîtier ou de la fenêtre touchés par le cadrage).
  const inner = peaks.filter((p) => p.position > 0.04 && p.position < 0.96);
  const strongest = (list: DetectedLine[]) => list.reduce<DetectedLine | null>((best, p) => (!best || p.height > best.height ? p : best), null);
  const control = strongest(inner.filter((p) => p.position < 0.5));
  const test = strongest(inner.filter((p) => p.position >= 0.5));
  const ratio = control && test ? test.height / control.height : null;
  return { profile, residual, noise, bandBrightness, control, test, peaks: inner, ratio };
}
