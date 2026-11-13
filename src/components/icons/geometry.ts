/**
 * Outils géométriques des pictogrammes « Au fil de nous » (grille 24 × 24).
 *
 * Fichier sans dépendance (ni React ni React Native) : il sert à la fois à l'application, aux tests et au script
 * de planche de contrôle (scripts/icon-sheet.mjs, exécuté directement par Node).
 *
 * Convention des angles : en degrés, 0 = en haut (midi), sens des aiguilles d'une montre (comme un cadran).
 */

/** Arrondi à 2 décimales (tracés compacts et stables). */
export const n = (v: number) => Math.round(v * 100) / 100;

/** Point sur un cercle (angle « cadran »). */
export function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [n(cx + r * Math.sin(a)), n(cy - r * Math.cos(a))];
}

/** Cercle complet sous forme de chemin (deux demi-arcs). */
export function circle(cx: number, cy: number, r: number): string {
  return `M${n(cx - r)} ${n(cy)}A${n(r)} ${n(r)} 0 1 0 ${n(cx + r)} ${n(cy)}A${n(r)} ${n(r)} 0 1 0 ${n(cx - r)} ${n(cy)}Z`;
}

/** Arc ouvert de `from` à `to` (degrés « cadran », sens horaire). */
export function arc(cx: number, cy: number, r: number, from: number, to: number): string {
  const [x1, y1] = polar(cx, cy, r, from);
  const [x2, y2] = polar(cx, cy, r, to);
  const sweep = (((to - from) % 360) + 360) % 360;
  return `M${x1} ${y1}A${n(r)} ${n(r)} 0 ${sweep > 180 ? 1 : 0} 1 ${x2} ${y2}`;
}

/** Pointe de flèche douce (deux branches) au point `tip`, orientée selon l'angle `deg` (cadran). */
export function arrowHead(tip: [number, number], deg: number, size = 2.6): string {
  const [ax, ay] = polar(tip[0], tip[1], size, deg + 180 - 40);
  const [bx, by] = polar(tip[0], tip[1], size, deg + 180 + 40);
  return `M${ax} ${ay}L${tip[0]} ${tip[1]}L${bx} ${by}`;
}

/** Goutte : pointe en (cx, top), largeur w, hauteur h ; le bas est un demi-cercle. */
export function drop(cx: number, top: number, w: number, h: number): string {
  const r = w / 2;
  const cy = top + h - r;
  return `M${n(cx)} ${n(top)}C${n(cx - w * 0.1)} ${n(top + h * 0.24)} ${n(cx - r)} ${n(top + h * 0.4)} ${n(cx - r)} ${n(cy)}`
    + `A${n(r)} ${n(r)} 0 0 0 ${n(cx + r)} ${n(cy)}`
    + `C${n(cx + r)} ${n(top + h * 0.4)} ${n(cx + w * 0.1)} ${n(top + h * 0.24)} ${n(cx)} ${n(top)}Z`;
}

/** Cœur centré horizontalement sur cx, haut des lobes en `top`, largeur w (hauteur ≈ 0,9 w). */
export function heart(cx: number, top: number, w: number): string {
  const x = (u: number) => n(cx - w / 2 + u * w);
  const y = (v: number) => n(top + v * w);
  return `M${x(0.5)} ${y(0.24)}C${x(0.44)} ${y(0.06)} ${x(0.34)} ${y(0)} ${x(0.25)} ${y(0)}C${x(0.1)} ${y(0)} ${x(0)} ${y(0.12)} ${x(0)} ${y(0.3)}`
    + `C${x(0)} ${y(0.54)} ${x(0.26)} ${y(0.72)} ${x(0.5)} ${y(0.88)}`
    + `C${x(0.74)} ${y(0.72)} ${x(1)} ${y(0.54)} ${x(1)} ${y(0.3)}C${x(1)} ${y(0.12)} ${x(0.9)} ${y(0)} ${x(0.75)} ${y(0)}`
    + `C${x(0.66)} ${y(0)} ${x(0.56)} ${y(0.06)} ${x(0.5)} ${y(0.24)}Z`;
}

/**
 * Feuille du logo : deux pointes, bombée symétriquement (`bulge` = rapport à la longueur).
 * `vein` ajoute la nervure centrale (comme les feuilles du logo).
 */
export function leaf(x1: number, y1: number, x2: number, y2: number, bulge = 0.32, vein = false): string {
  const dx = x2 - x1; const dy = y2 - y1;
  const L = Math.hypot(dx, dy);
  const nx = (-dy / L) * L * bulge; const ny = (dx / L) * L * bulge;
  const p = (t: number, s: number) => `${n(x1 + dx * t + nx * s)} ${n(y1 + dy * t + ny * s)}`;
  const body = `M${n(x1)} ${n(y1)}C${p(0.22, 1)} ${p(0.62, 1)} ${n(x2)} ${n(y2)}C${p(0.62, -1)} ${p(0.22, -1)} ${n(x1)} ${n(y1)}Z`;
  return vein ? `${body}M${n(x1)} ${n(y1)}L${p(0.66, 0)}` : body;
}

/** Étincelle à quatre branches courbes (centre, rayon). */
export function sparkle(cx: number, cy: number, r: number): string {
  const k = r * 0.16;
  return `M${n(cx)} ${n(cy - r)}C${n(cx + k)} ${n(cy - k)} ${n(cx + k)} ${n(cy - k)} ${n(cx + r)} ${n(cy)}`
    + `C${n(cx + k)} ${n(cy + k)} ${n(cx + k)} ${n(cy + k)} ${n(cx)} ${n(cy + r)}`
    + `C${n(cx - k)} ${n(cy + k)} ${n(cx - k)} ${n(cy + k)} ${n(cx - r)} ${n(cy)}`
    + `C${n(cx - k)} ${n(cy - k)} ${n(cx - k)} ${n(cy - k)} ${n(cx)} ${n(cy - r)}Z`;
}

/** Rectangle aux coins arrondis. */
export function roundRect(x: number, y: number, w: number, h: number, r: number): string {
  return `M${n(x + r)} ${n(y)}H${n(x + w - r)}A${n(r)} ${n(r)} 0 0 1 ${n(x + w)} ${n(y + r)}V${n(y + h - r)}`
    + `A${n(r)} ${n(r)} 0 0 1 ${n(x + w - r)} ${n(y + h)}H${n(x + r)}A${n(r)} ${n(r)} 0 0 1 ${n(x)} ${n(y + h - r)}`
    + `V${n(y + r)}A${n(r)} ${n(r)} 0 0 1 ${n(x + r)} ${n(y)}Z`;
}

// ---------------------------------------------------------------------------------------------------------------
// Longueur d'un tracé (pour l'animation « le fil se dessine » : strokeDasharray / strokeDashoffset).
// react-native-svg ne fournit pas getTotalLength() de façon fiable sur toutes les plateformes : on la calcule ici.
// Commandes prises en charge : M L H V C S Q T A Z, absolues et relatives.
// ---------------------------------------------------------------------------------------------------------------

const TOKEN = /([MLHVCSQTAZmlhvcsqtaz])|(-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)/g;
const ARITY: Record<string, number> = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };

function bezierLength(pts: number[][], steps = 24): number {
  let len = 0; let [px, py] = pts[0];
  for (let i = 1; i <= steps; i++) {
    const t = i / steps; const u = 1 - t;
    let x: number; let y: number;
    if (pts.length === 4) {
      x = u * u * u * pts[0][0] + 3 * u * u * t * pts[1][0] + 3 * u * t * t * pts[2][0] + t * t * t * pts[3][0];
      y = u * u * u * pts[0][1] + 3 * u * u * t * pts[1][1] + 3 * u * t * t * pts[2][1] + t * t * t * pts[3][1];
    } else {
      x = u * u * pts[0][0] + 2 * u * t * pts[1][0] + t * t * pts[2][0];
      y = u * u * pts[0][1] + 2 * u * t * pts[1][1] + t * t * pts[2][1];
    }
    len += Math.hypot(x - px, y - py); px = x; py = y;
  }
  return len;
}

/** Longueur d'un arc elliptique SVG (conversion extrémités → centre, puis échantillonnage). */
function arcLength(x1: number, y1: number, rx: number, ry: number, phiDeg: number, large: number, sweep: number, x2: number, y2: number): number {
  if (rx === 0 || ry === 0) return Math.hypot(x2 - x1, y2 - y1);
  rx = Math.abs(rx); ry = Math.abs(ry);
  const phi = (phiDeg * Math.PI) / 180; const cos = Math.cos(phi); const sin = Math.sin(phi);
  const dx = (x1 - x2) / 2; const dy = (y1 - y2) / 2;
  const x1p = cos * dx + sin * dy; const y1p = -sin * dx + cos * dy;
  const lam = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  const coef = (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, num / den));
  const cxp = (coef * rx * y1p) / ry; const cyp = (-coef * ry * x1p) / rx;
  const ang = (ux: number, uy: number, vx: number, vy: number) => {
    const a = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
    return a;
  };
  const th1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let dth = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  if (!sweep && dth > 0) dth -= 2 * Math.PI;
  if (sweep && dth < 0) dth += 2 * Math.PI;
  const steps = Math.max(8, Math.ceil(Math.abs(dth) / (Math.PI / 24)));
  let len = 0; let px = rx * Math.cos(th1); let py = ry * Math.sin(th1);
  for (let i = 1; i <= steps; i++) {
    const th = th1 + (dth * i) / steps;
    const x = rx * Math.cos(th); const y = ry * Math.sin(th);
    len += Math.hypot(x - px, y - py); px = x; py = y;
  }
  return len;
}

/** Longueur totale approchée d'un tracé SVG (précision ≈ 1 %, suffisante pour un tiret d'animation). */
export function pathLength(d: string): number {
  const tokens = d.match(TOKEN) ?? [];
  let i = 0; let cmd = ''; let x = 0; let y = 0; let sx = 0; let sy = 0;
  let lcx = 0; let lcy = 0; let lastCmd = '';
  let len = 0;
  const num = () => Number(tokens[i++]);
  while (i < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[i])) cmd = tokens[i++];
    const up = cmd.toUpperCase(); const rel = cmd !== up;
    if (up === 'Z') {
      len += Math.hypot(sx - x, sy - y); x = sx; y = sy; lastCmd = 'Z';
      continue;
    }
    if (i + ARITY[up] > tokens.length) break;
    const ox = rel ? x : 0; const oy = rel ? y : 0;
    switch (up) {
      case 'M': { x = num() + ox; y = num() + oy; sx = x; sy = y; cmd = rel ? 'l' : 'L'; break; }
      case 'L': { const nx = num() + ox; const ny = num() + oy; len += Math.hypot(nx - x, ny - y); x = nx; y = ny; break; }
      case 'H': { const nx = num() + ox; len += Math.abs(nx - x); x = nx; break; }
      case 'V': { const ny = num() + oy; len += Math.abs(ny - y); y = ny; break; }
      case 'C': {
        const c1 = [num() + ox, num() + oy]; const c2 = [num() + ox, num() + oy]; const e = [num() + ox, num() + oy];
        len += bezierLength([[x, y], c1, c2, e]); lcx = c2[0]; lcy = c2[1]; x = e[0]; y = e[1]; break;
      }
      case 'S': {
        const c1 = /[CS]/i.test(lastCmd) ? [2 * x - lcx, 2 * y - lcy] : [x, y];
        const c2 = [num() + ox, num() + oy]; const e = [num() + ox, num() + oy];
        len += bezierLength([[x, y], c1, c2, e]); lcx = c2[0]; lcy = c2[1]; x = e[0]; y = e[1]; break;
      }
      case 'Q': {
        const c = [num() + ox, num() + oy]; const e = [num() + ox, num() + oy];
        len += bezierLength([[x, y], c, e]); lcx = c[0]; lcy = c[1]; x = e[0]; y = e[1]; break;
      }
      case 'T': {
        const c = /[QT]/i.test(lastCmd) ? [2 * x - lcx, 2 * y - lcy] : [x, y];
        const e = [num() + ox, num() + oy];
        len += bezierLength([[x, y], c, e]); lcx = c[0]; lcy = c[1]; x = e[0]; y = e[1]; break;
      }
      case 'A': {
        const rx = num(); const ry = num(); const phi = num(); const la = num(); const sw = num();
        const ex = num() + ox; const ey = num() + oy;
        len += arcLength(x, y, rx, ry, phi, la, sw, ex, ey); x = ex; y = ey; break;
      }
      default: i++;
    }
    lastCmd = up;
  }
  return len;
}
