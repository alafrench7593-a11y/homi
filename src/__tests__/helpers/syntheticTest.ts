/**
 * Générateur de photos de synthèse d'un test à lignes (pour les tests automatiques).
 * Fond de table gris, boîtier blanc, fenêtre de résultat avec ligne de contrôle (C) et ligne de test (T).
 */
import type { RGBAImage, Px } from '@/lib/cycleAnalysis/image';

export interface SynthOptions {
  width?: number;
  height?: number;
  /** Intensité de la ligne de contrôle (0 = absente, 1 = pleine). */
  control?: number;
  /** Intensité de la ligne de test. */
  test?: number;
  /** Couleur de ligne : rose (vert qui chute) ou bleue (rouge qui chute). */
  colour?: 'pink' | 'blue';
  /** Multiplicateur de luminosité (0.15 = très sombre). */
  light?: number;
  /** Rayon de flou (boîte), 0 = net. */
  blur?: number;
  /** Bruit aléatoire (écart-type en niveaux). */
  noise?: number;
  /** Inclinaison du test en degrés. */
  angle?: number;
  seed?: number;
}

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function synthTest(o: SynthOptions = {}): { img: RGBAImage; c: Px; t: Px } {
  const w = o.width ?? 320;
  const h = o.height ?? 200;
  const rand = rng(o.seed ?? 7);
  const gauss = () => Math.sqrt(-2 * Math.log(rand() + 1e-9)) * Math.cos(2 * Math.PI * rand());
  const angle = ((o.angle ?? 0) * Math.PI) / 180;
  const cx = w / 2, cy = h / 2;
  const data = new Uint8ClampedArray(w * h * 4);
  // Fenêtre de résultat (dans le repère du test non incliné)
  const win = { x0: 90, x1: 230, y0: 85, y1: 115 };
  const cPos = 120, tPos = 200, lineHalf = 3;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // coordonnées dans le repère du test
      const dx = x - cx, dy = y - cy;
      const u = cx + dx * Math.cos(-angle) - dy * Math.sin(-angle);
      const v = cy + dx * Math.sin(-angle) + dy * Math.cos(-angle);
      let r = 150, g = 150, b = 155; // table
      if (u > 40 && u < 280 && v > 60 && v < 140) { r = 246; g = 244; b = 242; } // boîtier
      if (u > win.x0 && u < win.x1 && v > win.y0 && v < win.y1) {
        r = 240; g = 236; b = 236; // membrane
        const lineAt = (pos: number, k: number) => {
          if (!k || Math.abs(u - pos) > lineHalf) return;
          if (o.colour === 'blue') { r -= 170 * k; g -= 110 * k; b -= 20 * k; } else { r -= 40 * k; g -= 170 * k; b -= 90 * k; }
        };
        lineAt(cPos, o.control ?? 1);
        lineAt(tPos, o.test ?? 0);
      }
      const i = (y * w + x) * 4;
      data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255;
    }
  }
  let img: RGBAImage = { width: w, height: h, data };
  if (o.blur) img = boxBlur(img, o.blur);
  const light = o.light ?? 1;
  const sd = o.noise ?? 2;
  for (let i = 0; i < w * h * 4; i += 4) {
    for (let k = 0; k < 3; k++) img.data[i + k] = Math.max(0, Math.min(255, img.data[i + k] * light + gauss() * sd));
  }
  const rot = (p: Px): Px => ({ x: cx + (p.x - cx) * Math.cos(angle) - (p.y - cy) * Math.sin(angle), y: cy + (p.x - cx) * Math.sin(angle) + (p.y - cy) * Math.cos(angle) });
  return { img, c: rot({ x: win.x0 + 4, y: 100 }), t: rot({ x: win.x1 - 4, y: 100 }) };
}

function boxBlur(img: RGBAImage, r: number): RGBAImage {
  const { width: w, height: h } = img;
  let src = new Float32Array(img.data);
  for (const horizontal of [true, false]) {
    const out = new Float32Array(src.length);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        for (let k = 0; k < 3; k++) {
          let s = 0, n = 0;
          for (let d = -r; d <= r; d++) {
            const xx = horizontal ? Math.min(w - 1, Math.max(0, x + d)) : x;
            const yy = horizontal ? y : Math.min(h - 1, Math.max(0, y + d));
            s += src[(yy * w + xx) * 4 + k]; n++;
          }
          out[(y * w + x) * 4 + k] = s / n;
        }
        out[(y * w + x) * 4 + 3] = 255;
      }
    }
    src = out;
  }
  return { width: w, height: h, data: new Uint8ClampedArray(src) };
}
