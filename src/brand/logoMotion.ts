/**
 * Chorégraphie du logotype HOMI v4 « lentille » (pure, testée) — toutes les durées et échelles nommées ici,
 * aucune valeur en dur dans les composants. Voir MOTION_SYSTEM.md › « Logotype animé ».
 *
 * Le logo s'anime comme UN SEUL objet, sur une seule horloge (ms, valeur partagée, fil UI) :
 *  1. reflet : une bande de lumière balaie le mot de gauche à droite et le RÉVÈLE (fenêtre en transform seulement) ;
 *  2. volume : la lentille du O passe du verre « à plat » au verre en volume (reflet, caustique, liseré) ;
 *  3. déploiement (facultatif) : la lentille se déploie en premier panneau de l'introduction (un seul rectangle
 *     SVG animé, du disque de la lentille au rectangle du panneau).
 */

/** Étape [début, durée] en ms sur l'horloge. */
export type Stage = readonly [number, number];

export const LOGO_MOTION = {
  /** Le fond seul d'abord (continuité avec l'écran de lancement natif). */
  revealDelayMs: 120,
  /** Balayage du reflet qui révèle le mot (courbe `reveal`). */
  revealMs: 900,
  /** Largeur de la bande de reflet, en part de la largeur du mot. */
  sheenWidth: 0.26,
  /** Inclinaison de la bande (degrés). */
  sheenSkewDeg: -18,
  /** La lentille prend du volume quand le reflet a passé le O (≈ 45 % du balayage). */
  lensAtMs: 560,
  lensMs: 560,
  /** Échelle de départ du verre en volume (autour du centre de la lentille), puis 1. */
  lensFromScale: 0.86,
  /** Halo bref derrière la lentille au moment où elle prend du volume (opacité de crête). */
  lensHaloPeak: 0.55,
  /** Pause entre la fin du volume et le déploiement en panneau. */
  deployGapMs: 40,
  /** Déploiement de la lentille en panneau (courbe `decelerate`). */
  deployMs: 620,
  /** Thème nuit (`minimal`) : logo complet en fondu court, panneau en fondu. */
  minimalFadeMs: 160,
  /** Réduire les animations / économie d'énergie (`off`) : état final, fondu d'opacité court (aucun déplacement). */
  reducedFadeMs: 180,
  /** En dessous de cette largeur (px), version FIXE : aucun reflet ni volume (illisible et inutile en petit). */
  staticMaxWidth: 120,
} as const;

export type LogoTimeline = {
  /** Fondu d'ensemble (nuit uniquement ; [0, 0] sinon). */
  fadeIn: Stage;
  reveal: Stage;
  lens: Stage;
  /** null : pas de déploiement en panneau. */
  deploy: Stage | null;
  /** Fin de la dernière étape. */
  end: number;
};

/** Chorégraphie selon le niveau de mouvement ('full' | 'minimal'). 'off' n'a pas d'horloge : état final. */
export function logoTimeline(level: 'full' | 'minimal', deploy = false): LogoTimeline {
  if (level === 'minimal') {
    const fade: Stage = [0, LOGO_MOTION.minimalFadeMs];
    const d: Stage | null = deploy ? [0, LOGO_MOTION.minimalFadeMs] : null;
    return { fadeIn: fade, reveal: [0, 0], lens: [0, 0], deploy: d, end: LOGO_MOTION.minimalFadeMs };
  }
  const reveal: Stage = [LOGO_MOTION.revealDelayMs, LOGO_MOTION.revealMs];
  const lens: Stage = [LOGO_MOTION.revealDelayMs + LOGO_MOTION.lensAtMs, LOGO_MOTION.lensMs];
  const volumeEnd = Math.max(reveal[0] + reveal[1], lens[0] + lens[1]);
  const d: Stage | null = deploy ? [volumeEnd + LOGO_MOTION.deployGapMs, LOGO_MOTION.deployMs] : null;
  return { fadeIn: [0, 0], reveal, lens, deploy: d, end: d ? d[0] + d[1] : volumeEnd };
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

/** Rectangle en coordonnées de fenêtre (px). */
export type WindowRect = { x: number; y: number; width: number; height: number };
/** Panneau cible du déploiement : rectangle (fenêtre) + rayon des angles + matière. */
export type LensPanelTarget = WindowRect & { radius: number; fill: string; edge?: string };
/** Mesure de la lentille (fenêtre) : carré circonscrit au O. */
export type LensMeasure = WindowRect & { cx: number; cy: number; r: number };

/**
 * Géométrie du panneau à l'avancement `p` (worklet) : du disque de la lentille (rayon = demi-côté) au rectangle
 * cible. Pure : partagée par le rendu et les tests.
 */
export function lensPanelFrame(lens: LensMeasure, target: WindowRect & { radius: number }, p: number) {
  'worklet';
  const d = lens.r * 2;
  return {
    x: mix(lens.cx - lens.r, target.x, p),
    y: mix(lens.cy - lens.r, target.y, p),
    width: mix(d, target.width, p),
    height: mix(d, target.height, p),
    rx: mix(lens.r, target.radius, p),
  };
}
