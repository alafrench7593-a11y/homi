/**
 * Représentation minimale d'une image en mémoire (RGBA 8 bits) et opérations de base.
 * Tout le traitement se fait SUR L'APPAREIL : aucune image n'est envoyée pour l'analyse des tests.
 */

export interface RGBAImage {
  width: number;
  height: number;
  /** Pixels RGBA ligne par ligne (4 octets par pixel). */
  data: Uint8Array | Uint8ClampedArray;
}

/** Point en pixels dans l'image analysée. */
export interface Px { x: number; y: number }

export function pixel(img: RGBAImage, x: number, y: number): [number, number, number] {
  const xi = Math.min(img.width - 1, Math.max(0, Math.round(x)));
  const yi = Math.min(img.height - 1, Math.max(0, Math.round(y)));
  const i = (yi * img.width + xi) * 4;
  return [img.data[i], img.data[i + 1], img.data[i + 2]];
}

export function luminance(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * « Encre » d'un pixel : 255 − min(R, V, B).
 * Une ligne rose/violette fait chuter le vert, une ligne bleue fait chuter le rouge :
 * dans les deux cas le canal minimal baisse, alors qu'un fond blanc reste proche de 255.
 */
export function ink(r: number, g: number, b: number): number {
  return 255 - Math.min(r, g, b);
}

/** Réduction par moyenne de blocs (garde le rapport largeur/hauteur). */
export function downscale(img: RGBAImage, maxSide: number): RGBAImage {
  const scale = Math.max(img.width, img.height) / maxSide;
  if (scale <= 1) return img;
  const w = Math.max(1, Math.round(img.width / scale));
  const h = Math.max(1, Math.round(img.height / scale));
  const out = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    const y0 = Math.floor(y * scale);
    const y1 = Math.min(img.height, Math.floor((y + 1) * scale));
    for (let x = 0; x < w; x++) {
      const x0 = Math.floor(x * scale);
      const x1 = Math.min(img.width, Math.floor((x + 1) * scale));
      let r = 0, g = 0, b = 0, n = 0;
      for (let yy = y0; yy < Math.max(y1, y0 + 1); yy++) {
        for (let xx = x0; xx < Math.max(x1, x0 + 1); xx++) {
          const i = (yy * img.width + xx) * 4;
          r += img.data[i]; g += img.data[i + 1]; b += img.data[i + 2]; n++;
        }
      }
      const o = (y * w + x) * 4;
      out[o] = r / n; out[o + 1] = g / n; out[o + 2] = b / n; out[o + 3] = 255;
    }
  }
  return { width: w, height: h, data: out };
}

export function median(values: number[]): number {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.max(0, Math.round((p / 100) * (s.length - 1))))];
}
