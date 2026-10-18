/**
 * Traitement d'une page photographiée, entièrement SUR L'APPAREIL (aucune image envoyée pour ces étapes) :
 * détection des bords de la feuille, redressement de la perspective, rotation, niveaux de gris,
 * amélioration de la lisibilité et estimation du flou.
 */
import type { RGBAImage, Px } from '@/lib/cycleAnalysis/image';

export type Quad = [Px, Px, Px, Px]; // haut-gauche, haut-droite, bas-droite, bas-gauche

const lum = (d: RGBAImage['data'], i: number) => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];

export function blank(width: number, height: number): RGBAImage {
  return { width, height, data: new Uint8ClampedArray(width * height * 4) };
}

/** Réduction (moyenne des pixels couverts) pour garder un traitement fluide. */
export function resizeMax(img: RGBAImage, maxSide: number): RGBAImage {
  const s = Math.min(1, maxSide / Math.max(img.width, img.height));
  if (s === 1) return img;
  const w = Math.max(1, Math.round(img.width * s)), h = Math.max(1, Math.round(img.height * s));
  const out = blank(w, h);
  for (let y = 0; y < h; y++) {
    const y0 = Math.floor(y / s), y1 = Math.min(img.height, Math.floor((y + 1) / s));
    for (let x = 0; x < w; x++) {
      const x0 = Math.floor(x / s), x1 = Math.min(img.width, Math.floor((x + 1) / s));
      let r = 0, g = 0, b = 0, n = 0;
      for (let yy = y0; yy < Math.max(y1, y0 + 1); yy++) for (let xx = x0; xx < Math.max(x1, x0 + 1); xx++) {
        const i = (yy * img.width + xx) * 4; r += img.data[i]; g += img.data[i + 1]; b += img.data[i + 2]; n++;
      }
      const o = (y * w + x) * 4; out.data[o] = r / n; out.data[o + 1] = g / n; out.data[o + 2] = b / n; out.data[o + 3] = 255;
    }
  }
  return out;
}

export function rotate90(img: RGBAImage, dir: 'cw' | 'ccw'): RGBAImage {
  const { width: w, height: h } = img;
  const out = blank(h, w);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const nx = dir === 'cw' ? h - 1 - y : y;
    const ny = dir === 'cw' ? x : w - 1 - x;
    const i = (y * w + x) * 4, o = (ny * h + nx) * 4;
    out.data[o] = img.data[i]; out.data[o + 1] = img.data[i + 1]; out.data[o + 2] = img.data[i + 2]; out.data[o + 3] = 255;
  }
  return out;
}

export function toGray(img: RGBAImage): RGBAImage {
  const out = blank(img.width, img.height);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = lum(img.data, i);
    out.data[i] = v; out.data[i + 1] = v; out.data[i + 2] = v; out.data[i + 3] = 255;
  }
  return out;
}

/** Lisibilité : étirement des niveaux (1 % – 99 %) puis fond éclairci. La couleur est conservée. */
export function enhance(img: RGBAImage): RGBAImage {
  const hist = new Uint32Array(256);
  for (let i = 0; i < img.data.length; i += 4) hist[Math.round(lum(img.data, i))]++;
  const total = img.width * img.height;
  let lo = 0, hi = 255, acc = 0;
  for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= total * 0.01) { lo = v; break; } }
  acc = 0;
  for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc >= total * 0.01) { hi = v; break; } }
  const span = Math.max(1, hi - lo);
  const out = blank(img.width, img.height);
  for (let i = 0; i < img.data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const v = Math.min(1, Math.max(0, (img.data[i + c] - lo) / span));
      out.data[i + c] = Math.round(255 * Math.pow(v, 0.85)); // gamma < 1 : fond plus clair, encre préservée
    }
    out.data[i + 3] = 255;
  }
  return out;
}

/** Seuil d'Otsu sur la luminance. */
function otsu(gray: Float32Array): number {
  const hist = new Float64Array(256);
  for (const v of gray) hist[Math.min(255, Math.max(0, Math.round(v)))]++;
  const total = gray.length;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sumB = 0, wB = 0, best = 0, thr = 128;
  for (let t = 0; t < 256; t++) {
    wB += hist[t]; if (!wB) continue;
    const wF = total - wB; if (!wF) break;
    sumB += t * hist[t];
    const mB = sumB / wB, mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) ** 2;
    if (between > best) { best = between; thr = t; }
  }
  return thr;
}

/**
 * Contours de la feuille : la plus grande zone claire d'un seul tenant (une feuille sur un fond plus sombre).
 * Renvoie null si rien de crédible : la personne recadre alors elle-même.
 */
export function detectQuad(img: RGBAImage): { quad: Quad; confidence: number } | null {
  const small = resizeMax(img, 240);
  const { width: w, height: h } = small;
  const gray = new Float32Array(w * h);
  for (let p = 0; p < w * h; p++) gray[p] = lum(small.data, p * 4);
  const thr = otsu(gray);
  const fg = new Uint8Array(w * h);
  for (let p = 0; p < w * h; p++) fg[p] = gray[p] > thr ? 1 : 0;
  // Plus grande composante connexe (4-voisinage)
  const label = new Int32Array(w * h).fill(-1);
  let bestId = -1, bestSize = 0, id = 0;
  const stack: number[] = [];
  for (let p = 0; p < w * h; p++) {
    if (!fg[p] || label[p] >= 0) continue;
    let size = 0; stack.push(p); label[p] = id;
    while (stack.length) {
      const q = stack.pop()!; size++;
      const x = q % w, y = (q / w) | 0;
      for (const n of [x > 0 ? q - 1 : -1, x < w - 1 ? q + 1 : -1, y > 0 ? q - w : -1, y < h - 1 ? q + w : -1]) {
        if (n >= 0 && fg[n] && label[n] < 0) { label[n] = id; stack.push(n); }
      }
    }
    if (size > bestSize) { bestSize = size; bestId = id; }
    id++;
  }
  const area = bestSize / (w * h);
  if (bestId < 0 || area < 0.15 || area > 0.985) return null;
  let tl = { x: 0, y: 0, s: Infinity }, br = { x: 0, y: 0, s: -Infinity }, tr = { x: 0, y: 0, s: -Infinity }, bl = { x: 0, y: 0, s: -Infinity };
  for (let p = 0; p < w * h; p++) {
    if (label[p] !== bestId) continue;
    const x = p % w, y = (p / w) | 0;
    if (x + y < tl.s) tl = { x, y, s: x + y };
    if (x + y > br.s) br = { x, y, s: x + y };
    if (x - y > tr.s) tr = { x, y, s: x - y };
    if (y - x > bl.s) bl = { x, y, s: y - x };
  }
  const sx = img.width / w, sy = img.height / h;
  const quad: Quad = [tl, tr, br, bl].map((c) => ({ x: Math.min(img.width - 1, (c.x + 0.5) * sx), y: Math.min(img.height - 1, (c.y + 0.5) * sy) })) as Quad;
  // Confiance : la zone trouvée remplit-elle bien le quadrilatère ? (une feuille est convexe et pleine)
  const qa = Math.abs(polyArea(quad)) / (img.width * img.height);
  const confidence = Math.max(0, Math.min(1, 1 - Math.abs(qa - area) / Math.max(qa, 0.01)));
  return { quad, confidence };
}

function polyArea(q: Px[]): number {
  let a = 0;
  for (let i = 0; i < q.length; i++) { const j = (i + 1) % q.length; a += q[i].x * q[j].y - q[j].x * q[i].y; }
  return a / 2;
}

export const fullQuad = (img: { width: number; height: number }): Quad => [
  { x: 0, y: 0 }, { x: img.width - 1, y: 0 }, { x: img.width - 1, y: img.height - 1 }, { x: 0, y: img.height - 1 },
];

/** Taille de sortie naturelle d'un recadrage (plus grands côtés opposés). */
export function quadSize(q: Quad): { width: number; height: number } {
  const d = (a: Px, b: Px) => Math.hypot(a.x - b.x, a.y - b.y);
  return { width: Math.max(1, Math.round(Math.max(d(q[0], q[1]), d(q[3], q[2])))), height: Math.max(1, Math.round(Math.max(d(q[0], q[3]), d(q[1], q[2])))) };
}

/** Homographie qui envoie le rectangle (0,0)-(w,h) sur le quadrilatère (résolution 8×8 par élimination de Gauss). */
function homography(q: Quad, w: number, h: number): number[] {
  const src = [[0, 0], [w, 0], [w, h], [0, h]];
  const A: number[][] = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i], X = q[i].x, Y = q[i].y;
    A.push([x, y, 1, 0, 0, 0, -X * x, -X * y, X]);
    A.push([0, 0, 0, x, y, 1, -Y * x, -Y * y, Y]);
  }
  for (let c = 0; c < 8; c++) {
    let piv = c;
    for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r;
    [A[c], A[piv]] = [A[piv], A[c]];
    for (let r = 0; r < 8; r++) {
      if (r === c) continue;
      const f = A[r][c] / A[c][c];
      for (let k = c; k < 9; k++) A[r][k] -= f * A[c][k];
    }
  }
  return [...A.map((row, i) => row[8] / row[i]), 1];
}

/** Redressement : la zone délimitée par le quadrilatère devient un rectangle (interpolation bilinéaire). */
export function warpPerspective(img: RGBAImage, q: Quad, outW?: number, outH?: number): RGBAImage {
  const size = quadSize(q);
  const w = outW ?? size.width, h = outH ?? size.height;
  const H = homography(q, w, h);
  const out = blank(w, h);
  const W = img.width, Ht = img.height, d = img.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const den = H[6] * x + H[7] * y + H[8];
    const sx = (H[0] * x + H[1] * y + H[2]) / den, sy = (H[3] * x + H[4] * y + H[5]) / den;
    const x0 = Math.max(0, Math.min(W - 1, Math.floor(sx))), y0 = Math.max(0, Math.min(Ht - 1, Math.floor(sy)));
    const x1 = Math.min(W - 1, x0 + 1), y1 = Math.min(Ht - 1, y0 + 1);
    const fx = Math.max(0, Math.min(1, sx - x0)), fy = Math.max(0, Math.min(1, sy - y0));
    const o = (y * w + x) * 4;
    for (let c = 0; c < 3; c++) {
      const a = d[(y0 * W + x0) * 4 + c], b = d[(y0 * W + x1) * 4 + c], e = d[(y1 * W + x0) * 4 + c], f = d[(y1 * W + x1) * 4 + c];
      out.data[o + c] = (a * (1 - fx) + b * fx) * (1 - fy) + (e * (1 - fx) + f * fx) * fy;
    }
    out.data[o + 3] = 255;
  }
  return out;
}

/** Netteté : variance du laplacien sur une version réduite. Plus c'est bas, plus la photo est floue. */
export function sharpness(img: RGBAImage): number {
  const s = resizeMax(img, 400);
  const { width: w, height: h } = s;
  let sum = 0, sum2 = 0, n = 0;
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = (y * w + x) * 4;
    const v = 4 * lum(s.data, i) - lum(s.data, i - 4) - lum(s.data, i + 4) - lum(s.data, i - w * 4) - lum(s.data, i + w * 4);
    sum += v; sum2 += v * v; n++;
  }
  if (!n) return 0;
  const m = sum / n;
  return sum2 / n - m * m;
}
/** En dessous de ce seuil, on propose de reprendre la photo (indication, pas une certitude). */
export const BLUR_THRESHOLD = 40;
