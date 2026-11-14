/**
 * Chorégraphie du logo HOMI v5 « maison » (pure, testée) — toutes les durées, échelles et proportions sont nommées
 * ici, aucune valeur en dur dans les composants. Voir MOTION_SYSTEM.md › « Logo animé ».
 *
 * Le logo s'anime comme UN SEUL objet, sur une seule horloge (ms, valeur partagée, fil UI) :
 *  1. tracé : le contour de la maison se dessine, un reflet court sur le bord (tête du tracé, puis un demi-tour) ;
 *  2. illumination : la maison se remplit de violet, un halo s'allume puis retombe ;
 *  3. famille : parent, parent, enfant, enfant apparaissent en cascade avec un léger rebond (autour de leurs pieds) ;
 *  4. nom : « HOMI » se révèle dans la lumière (fenêtre qui glisse + reflet qui le traverse) ;
 *  5. déploiement (facultatif) : la maison s'ouvre en premier panneau de verre (le toit s'aplatit, la forme grandit
 *     jusqu'au panneau cible).
 * Même ordre et mêmes courbes que l'introduction historique (src/theme/motion.ts › `intro`), resserrés pour que
 * l'introduction /cinematic complète (déploiement + pose) tienne en 2,5 s.
 */
import { intro } from '@/theme/motion';
import { HOMI_HOUSE_BOX, HOMI_VIEWBOX } from './homiMarkSvg';

/** Étape [début, durée] en ms sur l'horloge. */
export type Stage = readonly [number, number];

export const LOGO_MOTION = {
  /** Le fond seul d'abord (continuité avec l'écran de lancement natif). */
  revealDelayMs: intro.revealDelayMs,
  /** Le contour se trace (courbe `reveal`). */
  traceMs: 640,
  /** Reflet qui court sur le bord : longueur du trait lumineux (part du contour). */
  cometDash: 0.09,
  /** Après le tracé, le reflet continue sa course (part d'un tour) en s'éteignant. */
  cometRunMs: 440,
  cometRunLaps: 0.55,
  /** La maison s'illumine pendant la fin du tracé (courbe `decelerate`). */
  lightAtMs: 560,
  lightMs: 360,
  /** Halo derrière la maison : monte puis retombe à 0 (l'image finale = le logo fixe). */
  haloMs: 1000,
  haloPeak: 0.6,
  /** Silhouettes : parent, parent, enfant, enfant — une toutes les `figureStepMs`. */
  figuresAtMs: 820,
  figureStepMs: 100,
  figureMs: 380,
  /** Échelle de départ (autour des pieds) et montée (unités du carré de 256). */
  figureFromScale: 0.55,
  figureRise: 14,
  /** Rebond léger : dépassement d'une courbe « back-out » (s = 1,7 → ≈ 10 %). */
  figureOvershoot: 1.7,
  /** Ensemble : 0,94 → 1 pendant la construction. */
  settleFromScale: intro.logoFromScale,
  /** Le nom se révèle quand le dernier enfant arrive (courbe `decelerate`). */
  nameAtMs: 1000,
  nameMs: 500,
  /** Reflet qui traverse le nom : largeur (part de la largeur du logo), inclinaison. */
  sheenWidth: 0.34,
  sheenSkewDeg: -18,
  /** Pause entre le logo complet et le déploiement en panneau. */
  deployGapMs: 20,
  deployMs: 560,
  /** Thème nuit (`minimal`) : logo complet en fondu court, panneau en fondu. */
  minimalFadeMs: 160,
  /** Réduire les animations / économie d'énergie (`off`) : état final, fondu d'opacité court (aucun déplacement). */
  reducedFadeMs: 180,
  /** En dessous de cette largeur (px), version FIXE : silhouettes et reflets illisibles en petit. */
  staticMaxWidth: 120,
} as const;

/** Composition verticale du logo (part de la largeur) : maison centrée en haut, nom « HOMI » dessous. */
export const LOGO_LAYOUT = { house: 0.62, gap: 0.04, nameSize: 0.22, nameLine: 0.27 } as const;

export type LogoBox = { width: number; height: number; house: { left: number; top: number; size: number }; name: { top: number; size: number; line: number } };

/** Boîte du logo pour une largeur donnée (pure) : partagée par le logo fixe, le logo animé et les mesures. */
export function logoBox(width: number): LogoBox {
  const size = Math.round(width * LOGO_LAYOUT.house);
  const gap = Math.round(width * LOGO_LAYOUT.gap);
  const line = Math.round(width * LOGO_LAYOUT.nameLine);
  return {
    width,
    height: size + gap + line,
    house: { left: Math.round((width - size) / 2), top: 0, size },
    name: { top: size + gap, size: Math.round(width * LOGO_LAYOUT.nameSize), line },
  };
}

export type LogoTimeline = {
  /** Fondu d'ensemble (nuit uniquement ; [0, 0] sinon). */
  fadeIn: Stage;
  trace: Stage;
  /** Reflet sur le bord : tête du tracé, puis sa course après le tracé. */
  comet: Stage;
  light: Stage;
  halo: Stage;
  /** parent, parent, enfant, enfant. */
  figures: readonly Stage[];
  name: Stage;
  /** Logo complet : instant où la maison « s'ouvre » (rappel `onHousePanel` sans panneau cible). */
  open: number;
  /** null : pas de déploiement en panneau. */
  deploy: Stage | null;
  /** Fin de la dernière étape. */
  end: number;
};

const DONE: Stage = [0, 0];

/** Chorégraphie selon le niveau de mouvement ('full' | 'minimal'). 'off' n'a pas d'horloge : état final. */
export function logoTimeline(level: 'full' | 'minimal', deploy = false): LogoTimeline {
  const L = LOGO_MOTION;
  if (level === 'minimal') {
    const fade: Stage = [0, L.minimalFadeMs];
    return {
      fadeIn: fade, trace: DONE, comet: DONE, light: DONE, halo: DONE, figures: [DONE, DONE, DONE, DONE], name: DONE,
      open: 0, deploy: deploy ? [0, L.minimalFadeMs] : null, end: L.minimalFadeMs,
    };
  }
  const trace: Stage = [L.revealDelayMs, L.traceMs];
  const comet: Stage = [L.revealDelayMs, L.traceMs + L.cometRunMs];
  const figures: Stage[] = [0, 1, 2, 3].map((i) => [L.figuresAtMs + i * L.figureStepMs, L.figureMs] as const);
  const name: Stage = [L.nameAtMs, L.nameMs];
  const last = figures[figures.length - 1];
  const open = Math.max(name[0] + name[1], last[0] + last[1], comet[0] + comet[1]);
  const d: Stage | null = deploy ? [open + L.deployGapMs, L.deployMs] : null;
  return {
    fadeIn: DONE, trace, comet, light: [L.lightAtMs, L.lightMs], halo: [L.lightAtMs, L.haloMs], figures, name,
    open, deploy: d, end: d ? d[0] + d[1] : open,
  };
}

/** Avancement 0 → 1 d'une étape à l'instant `t` (worklet). Durée 0 : étape déjà terminée. */
export function stageProgress(t: number, s: Stage): number {
  'worklet';
  if (s[1] <= 0) return t >= s[0] ? 1 : 0;
  return Math.min(1, Math.max(0, (t - s[0]) / s[1]));
}

/** Interpolation linéaire (worklet). */
export function mix(a: number, b: number, p: number): number {
  'worklet';
  return a + (b - a) * p;
}

/** Courbe « back-out » (worklet) : léger dépassement puis retour à 1 — le rebond des silhouettes. */
export function backOut(p: number, s: number = LOGO_MOTION.figureOvershoot): number {
  'worklet';
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  const q = p - 1;
  return 1 + (s + 1) * q * q * q + s * q * q;
}

/** Rectangle en coordonnées de fenêtre (px). */
export type WindowRect = { x: number; y: number; width: number; height: number };
/** Panneau cible du déploiement : rectangle (fenêtre) + rayon des angles + matière. */
export type HousePanelTarget = WindowRect & { radius: number; fill: string; edge?: string };
/** Mesure de la maison (fenêtre) : boîte de la maison, centre, demi-largeur `r`. */
export type HouseMeasure = WindowRect & { cx: number; cy: number; r: number };
/** Alias rétro-compatibles (logotype « lentille » v4). */
export type LensPanelTarget = HousePanelTarget;
export type LensMeasure = HouseMeasure;

/** Mesure de la maison dans la fenêtre à partir de l'origine du logo et de sa largeur (pure, testée). */
export function houseMeasureAt(origin: { x: number; y: number }, width: number): HouseMeasure {
  const b = logoBox(width);
  const k = b.house.size / HOMI_VIEWBOX;
  const x = origin.x + b.house.left + HOMI_HOUSE_BOX.x * k;
  const y = origin.y + b.house.top + HOMI_HOUSE_BOX.y * k;
  const w = HOMI_HOUSE_BOX.width * k;
  const h = HOMI_HOUSE_BOX.height * k;
  return { x, y, width: w, height: h, cx: x + w / 2, cy: y + h / 2, r: w / 2 };
}

/** Forme du panneau : rectangle + hauteur du toit + rayons (bas, avant-toits / haut). */
export type HousePanelFrame = { x: number; y: number; width: number; height: number; rx: number; roof: number; eave: number };

/**
 * Géométrie du panneau à l'avancement `p` (worklet) : de la maison (toit en pignon, angles du logo) au rectangle
 * cible (toit aplati, rayon du panneau). Pure : partagée par le rendu et les tests.
 */
export function housePanelFrame(house: HouseMeasure, target: WindowRect & { radius: number }, p: number): HousePanelFrame {
  'worklet';
  const k = house.width / HOMI_HOUSE_BOX.width;
  return {
    x: mix(house.x, target.x, p),
    y: mix(house.y, target.y, p),
    width: mix(house.width, target.width, p),
    height: mix(house.height, target.height, p),
    rx: mix(HOMI_HOUSE_BOX.cornerR * k, target.radius, p),
    roof: mix((HOMI_HOUSE_BOX.eaveY - HOMI_HOUSE_BOX.y) * k, 0, p),
    eave: mix(HOMI_HOUSE_BOX.eaveR * k, target.radius, p),
  };
}
/** Alias rétro-compatible. */
export const lensPanelFrame = housePanelFrame;

/** Tracé SVG du panneau (worklet) : pignon arrondi qui devient un rectangle aux angles arrondis quand `roof` = 0. */
export function housePanelPath(f: HousePanelFrame): string {
  'worklet';
  const { x, y, width: w, height: h } = f;
  const rb = Math.max(0, Math.min(f.rx, w / 2, h / 2));
  const roof = Math.max(0, Math.min(f.roof, h - rb));
  const ax = x + w / 2;
  const ay = y;
  // avant-toit droit (x + w, y + roof) et gauche (x, y + roof) ; direction vers le faîte
  const len = Math.sqrt((w / 2) * (w / 2) + roof * roof);
  const ux = (w / 2) / len;
  const uy = roof / len;
  const re = Math.max(0, Math.min(f.eave, len * 0.45, (h - roof - rb) * 0.9));
  const ra = Math.min(re * 0.5, len * 0.2); // faîte légèrement arrondi
  const n = (v: number) => Math.round(v * 100) / 100;
  return `M${n(ax - ux * ra)} ${n(ay + uy * ra)}`
    + ` Q${n(ax)} ${n(ay)} ${n(ax + ux * ra)} ${n(ay + uy * ra)}`
    + ` L${n(x + w - ux * re)} ${n(y + roof - uy * re)}`
    + ` Q${n(x + w)} ${n(y + roof)} ${n(x + w)} ${n(y + roof + re)}`
    + ` L${n(x + w)} ${n(y + h - rb)}`
    + ` Q${n(x + w)} ${n(y + h)} ${n(x + w - rb)} ${n(y + h)}`
    + ` L${n(x + rb)} ${n(y + h)}`
    + ` Q${n(x)} ${n(y + h)} ${n(x)} ${n(y + h - rb)}`
    + ` L${n(x)} ${n(y + roof + re)}`
    + ` Q${n(x)} ${n(y + roof)} ${n(x + ux * re)} ${n(y + roof - uy * re)} Z`;
}
