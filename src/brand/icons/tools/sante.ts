/** Famille SANTÉ (rendez-vous, vaccins, traitements, médicaments, humeur, sécurité des produits, assistant). */
import { BUBBLE_FULL, capsule, circle, CLIP, CLIPBOARD, CLOSED_BOOK, CLOSED_BOOK_FILL, ngon, on, rrect, SCAN_CORNERS, star, type HomiIconDef } from '../geometry';

const FOLDER = 'M3.5 7A2 2 0 0 1 5.5 5h3.6l2 2.25h7.4a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z';
const THERMO = 'M10 14.2V5.5a2 2 0 0 1 4 0v8.7a3.75 3.75 0 1 1-4 0z';
const PILL_BODY = 'M7.5 6.5h9v12.5a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2z';
const PUZZLE = 'M5.5 8H9a2 2 0 1 1 4 0h3.5v3.5a2 2 0 1 1 0 4V19H13a2 2 0 1 0-4 0H5.5v-3.5a2 2 0 1 0 0-4z';
const OCT = ngon(12, 12, 8.75, 8, 22.5);
const LOCK = rrect(13, 12.5, 7.5, 6.5, 1.5);

/** Seringue sur la diagonale. */
function syringe() {
  const u = on(0, 0, 1, -45);
  const p = on(0, 0, 1, 45);
  const at = (t: number, s: number): [number, number] => [7.5 + u[0] * t + p[0] * s, 16.5 + u[1] * t + p[1] * s];
  const pt = (t: number, s: number) => at(t, s).map((v) => +v.toFixed(2)).join(' ');
  const barrel = `M${pt(0, 2.2)}L${pt(9, 2.2)}L${pt(9, -2.2)}L${pt(0, -2.2)}Z`;
  const marks = `M${pt(3, 2.2)}L${pt(3, 0.4)}M${pt(6, 2.2)}L${pt(6, 0.4)}`;
  const needle = `M${pt(0, 0)}L${pt(-4.5, 0)}`;
  const plunger = `M${pt(9, 0)}L${pt(13, 0)}M${pt(13, -2.2)}L${pt(13, 2.2)}M${pt(9, -3.4)}L${pt(9, 3.4)}`;
  return { fill: barrel, stroke: `${barrel}${marks}${needle}${plunger}` };
}

export const SANTE = {
  /** Rendez-vous et examens : le stéthoscope. */
  stethoscope: { fill: circle(18.25, 11.25, 2.25), stroke: `M6 3.5v5a4.5 4.5 0 0 0 9 0v-5M4.75 3.5h2.5M13.75 3.5h2.5M10.5 13v2.5a3.875 3.875 0 0 0 7.75 0V13.5${circle(18.25, 11.25, 2.25)}` },
  /** Questions pour le rendez-vous : une bulle et un point d'interrogation. */
  bubbleQuestion: { fill: BUBBLE_FULL, stroke: `${BUBBLE_FULL}M10 8.75a2 2 0 1 1 2.8 1.85c-.5.25-.8.65-.8 1.2v.4`, dots: [[12, 14.2, 1.05]] },
  /** Documents de santé : le dossier et la croix. */
  folderCross: { fill: FOLDER, stroke: `${FOLDER}M12 10.5v5M9.5 13h5` },
  /** Carnet de santé : le livre et la croix. */
  bookCross: { fill: CLOSED_BOOK_FILL, stroke: `${CLOSED_BOOK}M12 6.75v6M9 9.75h6` },
  /** Vaccins : la seringue. */
  syringe: syringe(),
  /** Suivi de santé, température : le thermomètre. */
  thermometer: { fill: THERMO, stroke: `${THERMO}M12 16V9.5M14 7.25h2M14 10.25h2` },
  /** Traitements : la gélule. */
  capsule: { fill: capsule(7, 17, 17, 7, 3.5, true), stroke: `${capsule(7, 17, 17, 7, 3.5)}M9.53 9.53l4.94 4.94` },
  /** Besoin particulier : la pièce de puzzle. */
  puzzle: { fill: PUZZLE, stroke: PUZZLE },
  /** Médicaments : le flacon et sa croix. */
  pillBottle: { fill: PILL_BODY, stroke: `${PILL_BODY}${rrect(7, 3, 10, 3.5, 1)}M12 11v5M9.5 13.5h5` },
  /** Démarches : la planche cochée. */
  clipboardCheck: { fill: CLIPBOARD, stroke: `${CLIPBOARD}${CLIP}M8.75 13.5l2.25 2.25 4.5-4.75` },
  /** Mon humeur : un visage qui sourit. */
  smileFace: { fill: circle(12, 12, 8.5), stroke: `${circle(12, 12, 8.5)}M8.6 14c1.9 2.1 4.9 2.1 6.8 0`, dots: [[9.2, 10, 1.1], [14.8, 10, 1.1]] },
  /** Mon journal intime : le carnet et son cadenas. */
  bookLock: { fill: `${rrect(4, 3, 12, 18, 2)}`, stroke: `M13 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5.5M7.5 7.5h5M7.5 10.5h3${LOCK}M14.75 12.5V11a2 2 0 0 1 4 0v1.5` },
  /** Point sur ma fatigue : la batterie presque vide. */
  batteryLow: { fill: rrect(3, 7.5, 16, 9, 2), stroke: `${rrect(3, 7.5, 16, 9, 2)}M21 10.5v3M6.5 10.5v3` },
  /** Produits à éviter : l'interdit dans le cadre. */
  scanBan: { fill: circle(12, 12, 4.75), stroke: `${SCAN_CORNERS}${circle(12, 12, 4.75)}M8.65 15.35l6.7-6.7` },
  /** Alertes de rappel : l'octogone et le point d'exclamation. */
  octagonAlert: { fill: OCT, stroke: `${OCT}M12 7.75v5`, dots: [[12, 15.9, 1.1]] },
  /** Assistant : la bulle et l'étincelle. */
  bubbleSpark: { fill: BUBBLE_FULL, stroke: `${BUBBLE_FULL}M12 6.75c.45 2.1 1.4 3.05 3.5 3.5-2.1.45-3.05 1.4-3.5 3.5-.45-2.1-1.4-3.05-3.5-3.5 2.1-.45 3.05-1.4 3.5-3.5z` },
  /** Assistant hors ligne : la puce. */
  chip: { fill: rrect(6.5, 6.5, 11, 11, 2), stroke: `${rrect(6.5, 6.5, 11, 11, 2)}${rrect(9.5, 9.5, 5, 5, 1)}M9.5 3.5v3M14.5 3.5v3M9.5 17.5v3M14.5 17.5v3M3.5 9.5h3M3.5 14.5h3M17.5 9.5h3M17.5 14.5h3` },
  /** Suivi des analyses médicales : le tube et la courbe des valeurs recopiées. */
  labCurve: {
    fill: 'M5.5 11h3v5.75a1.5 1.5 0 0 1-3 0z',
    stroke: 'M4.5 3.5h5M5.5 3.5v13.25a1.5 1.5 0 0 0 3 0V3.5M12.5 8v12.5h8M13.75 17l2.5-3 2 1.5 2.5-4.25',
    dots: [[20.75, 11.25, 1.1]],
  },
  /** HOMI Aura (aides thématiques) : la bulle et l'étincelle. */
  auraBubble: { fill: BUBBLE_FULL, stroke: `${BUBBLE_FULL}${star(12, 10.5, 3.75, 1.3, 4)}` },
  /** Découvrir HOMI : la boussole. */
  compassSpark: {
    fill: 'M15 9 13.1 13.1 9 15l1.9-4.1z',
    stroke: `${circle(12, 12, 8.5)}M15 9 13.1 13.1 9 15l1.9-4.1zM12 3.5v1.75M12 18.75v1.75M3.5 12h1.75M18.75 12h1.75`,
  },
} satisfies Record<string, HomiIconDef>;
