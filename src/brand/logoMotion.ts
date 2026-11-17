/**
 * Chorégraphie du logo HOMI v5 « encre » (pure, testée) — durées, échelles et proportions nommées ici, aucune valeur
 * en dur dans les composants. Voir MOTION_SYSTEM.md › « Logo animé ».
 *
 * Le logo (symbole « M » + mot-symbole « HOMI », assemblage officiel) s'anime comme UN SEUL objet, sur une seule
 * horloge (ms, valeur partagée, fil UI), sobrement et vite (≤ 1,4 s) :
 *  1. corps : le « M » MONTE du sol (fenêtre qui se lève, légère montée) ;
 *  2. têtes : la tête au chignon puis la seconde tête se POSENT sur le corps avec un léger ressort (back-out) ;
 *  3. nom : « HOMI » se révèle de gauche à droite (fenêtre qui glisse) ;
 *  4. point du i : il se pose en dernier, même petit ressort que les têtes ;
 *  5. déploiement (facultatif) : le symbole s'ouvre en premier panneau de verre (rectangle arrondi qui grandit
 *     jusqu'au panneau cible).
 */
import { intro } from '@/theme/motion';
import { HOMI_LOCKUP, HOMI_PARTS, HOMI_SYMBOL_BOX } from './homiMarkSvg';

/** Étape [début, durée] en ms sur l'horloge. */
export type Stage = readonly [number, number];

export const LOGO_MOTION = {
  /** Le fond seul d'abord (continuité avec l'écran de lancement natif). */
  revealDelayMs: intro.revealDelayMs,
  /** Le corps « M » monte (courbe `decelerate`) ; montée en part de sa hauteur. */
  bodyMs: 440,
  bodyRise: 0.1,
  /** Têtes : chignon puis seconde tête, décalées de `headStepMs`. */
  headsAtMs: 220,
  headStepMs: 90,
  headMs: 420,
  /** Les têtes tombent d'une part de leur hauteur, depuis une échelle réduite (autour de leur centre). */
  headDrop: 0.45,
  headFromScale: 0.6,
  /** Ressort léger : dépassement d'une courbe « back-out » (s = 1,7 → ≈ 10 %). */
  overshoot: 1.7,
  /** Le nom se révèle quand la seconde tête se pose (courbe `decelerate`), montée de quelques unités. */
  wordAtMs: 520,
  wordMs: 440,
  wordRise: 0.06,
  /** Point du i : se pose à la fin de la révélation du nom. */
  dotAtMs: 860,
  dotMs: 340,
  /** Ensemble : 0,97 → 1 pendant la construction. */
  settleFromScale: 0.97,
  /** Pause entre le logo complet et le déploiement en panneau. */
  deployGapMs: 60,
  deployMs: 560,
  /** Thème nuit (`minimal`) : logo complet en fondu court, panneau en fondu. */
  minimalFadeMs: 160,
  /** Réduire les animations / économie d'énergie (`off`) : état final, fondu d'opacité court (aucun déplacement). */
  reducedFadeMs: 180,
  /** En dessous de cette largeur (px), version FIXE. */
  staticMaxWidth: 120,
} as const;

/** Rapport largeur / hauteur de l'assemblage officiel (viewBox de homi-logo-encre.svg). */
export const LOGO_RATIO = HOMI_LOCKUP.viewBox[2] / HOMI_LOCKUP.viewBox[3];

export type Box = { left: number; top: number; width: number; height: number };
export type LogoBox = { width: number; height: number; scale: number; symbol: Box; word: Box };

/** Unités du logo complet → px dans la boîte du logo (pure). */
export function lockupToPx(b: { x: number; y: number; width: number; height: number }, scale: number): Box {
  'worklet';
  return {
    left: (b.x - HOMI_LOCKUP.viewBox[0]) * scale,
    top: (b.y - HOMI_LOCKUP.viewBox[1]) * scale,
    width: b.width * scale,
    height: b.height * scale,
  };
}

/** Boîte du logo pour une largeur donnée (pure) : partagée par le logo fixe, le logo animé et les mesures. */
export function logoBox(width: number): LogoBox {
  const scale = width / HOMI_LOCKUP.viewBox[2];
  const wordBox = { x: HOMI_PARTS.letters.box.x, y: HOMI_PARTS.dot.box.y, width: HOMI_PARTS.letters.box.width, height: HOMI_PARTS.letters.box.y + HOMI_PARTS.letters.box.height - HOMI_PARTS.dot.box.y };
  return { width, height: Math.round(width / LOGO_RATIO), scale, symbol: lockupToPx(HOMI_SYMBOL_BOX, scale), word: lockupToPx(wordBox, scale) };
}

export type LogoTimeline = {
  /** Fondu d'ensemble (nuit uniquement ; [0, 0] sinon). */
  fadeIn: Stage;
  /** Corps « M » qui monte. */
  body: Stage;
  /** Tête au chignon, seconde tête. */
  heads: readonly [Stage, Stage];
  /** Lettres H, O, M, jambage du i. */
  word: Stage;
  /** Point du i. */
  dot: Stage;
  /** Logo complet : instant où le symbole « s'ouvre » (rappel `onHousePanel` sans panneau cible). */
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
    return { fadeIn: fade, body: DONE, heads: [DONE, DONE], word: DONE, dot: DONE, open: 0, deploy: deploy ? [0, L.minimalFadeMs] : null, end: L.minimalFadeMs };
  }
  const d0 = L.revealDelayMs;
  const body: Stage = [d0, L.bodyMs];
  const heads: [Stage, Stage] = [[d0 + L.headsAtMs, L.headMs], [d0 + L.headsAtMs + L.headStepMs, L.headMs]];
  const word: Stage = [d0 + L.wordAtMs, L.wordMs];
  const dot: Stage = [d0 + L.dotAtMs, L.dotMs];
  const open = Math.max(...[body, ...heads, word, dot].map((s) => s[0] + s[1]));
  const dep: Stage | null = deploy ? [open + L.deployGapMs, L.deployMs] : null;
  return { fadeIn: DONE, body, heads, word, dot, open, deploy: dep, end: dep ? dep[0] + dep[1] : open };
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

/** Courbe « back-out » (worklet) : léger dépassement puis retour à 1 — le ressort des têtes et du point du i. */
export function backOut(p: number, overshoot?: number): number {
  'worklet';
  // Jamais de valeur par défaut qui lit la fermeture (`s = LOGO_MOTION.overshoot`) : sur le fil UI, le paramètre par
  // défaut est évalué AVANT que la fermeture du worklet soit dépaquetée → ReferenceError → plantage au lancement (iOS).
  const s = overshoot ?? LOGO_MOTION.overshoot;
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  const q = p - 1;
  return 1 + (s + 1) * q * q * q + s * q * q;
}

/** Rectangle en coordonnées de fenêtre (px). */
export type WindowRect = { x: number; y: number; width: number; height: number };
/** Panneau cible du déploiement : rectangle (fenêtre) + rayon des angles + matière. */
export type HousePanelTarget = WindowRect & { radius: number; fill: string; edge?: string };
/** Mesure du symbole (fenêtre) : boîte, centre, demi-largeur `r`. Nom historique (« maison »). */
export type HouseMeasure = WindowRect & { cx: number; cy: number; r: number };
/** Alias rétro-compatibles (logotype « lentille » v4). */
export type LensPanelTarget = HousePanelTarget;
export type LensMeasure = HouseMeasure;

/** Mesure du symbole dans la fenêtre à partir de l'origine du logo et de sa largeur (pure, testée). */
export function houseMeasureAt(origin: { x: number; y: number }, width: number): HouseMeasure {
  const s = logoBox(width).symbol;
  const x = origin.x + s.left;
  const y = origin.y + s.top;
  return { x, y, width: s.width, height: s.height, cx: x + s.width / 2, cy: y + s.height / 2, r: s.width / 2 };
}

/** Rayon des angles du panneau au départ (part de la largeur du symbole : arrondi du corps du « M »). */
export const PANEL_FROM_RADIUS = 0.16;

/** Forme du panneau : rectangle + hauteur du toit (0 depuis la v5 « encre ») + rayons (bas, haut). */
export type HousePanelFrame = { x: number; y: number; width: number; height: number; rx: number; roof: number; eave: number };

/**
 * Géométrie du panneau à l'avancement `p` (worklet) : de la boîte du symbole (angles arrondis) au rectangle cible
 * (rayon du panneau). Pure : partagée par le rendu et les tests.
 */
export function housePanelFrame(house: HouseMeasure, target: WindowRect & { radius: number }, p: number): HousePanelFrame {
  'worklet';
  const r0 = house.width * PANEL_FROM_RADIUS;
  return {
    x: mix(house.x, target.x, p),
    y: mix(house.y, target.y, p),
    width: mix(house.width, target.width, p),
    height: mix(house.height, target.height, p),
    rx: mix(r0, target.radius, p),
    roof: 0,
    eave: mix(r0, target.radius, p),
  };
}
/** Alias rétro-compatible. */
export const lensPanelFrame = housePanelFrame;

/** Tracé SVG du panneau (worklet) : pignon arrondi si `roof` > 0, sinon rectangle aux angles arrondis. */
export function housePanelPath(f: HousePanelFrame): string {
  'worklet';
  const { x, y, width: w, height: h } = f;
  const rb = Math.max(0, Math.min(f.rx, w / 2, h / 2));
  const roof = Math.max(0, Math.min(f.roof, h - rb));
  const ax = x + w / 2;
  const ay = y;
  const len = Math.sqrt((w / 2) * (w / 2) + roof * roof);
  const ux = (w / 2) / len;
  const uy = roof / len;
  const re = Math.max(0, Math.min(f.eave, len * 0.45, (h - roof - rb) * 0.9));
  const ra = Math.min(re * 0.5, len * 0.2);
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
