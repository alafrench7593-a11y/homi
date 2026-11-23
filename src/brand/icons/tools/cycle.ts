/** Famille CYCLE (règles, calendrier, symptômes, contraception, fertilité, PMA). Grille 24, trait 1,75. */
import { arc, calendar, circle, CLIP, CLIPBOARD, drop, heart, rrect, type HomiIconDef } from '../geometry';

const SHIELD = 'M12 3.5l7 2.6v5.3c0 4.5-2.9 7.8-7 9.1-4.1-1.3-7-4.6-7-9.1V6.1z';
const CAL = calendar(3.5, 5, 17, 15.5);
const CAL_FILL = rrect(3.5, 5, 17, 15.5, 2.25);
const BARS = `${rrect(4.5, 12, 3.75, 8.25, 1.25)}${rrect(10.125, 6.75, 3.75, 13.5, 1.25)}${rrect(15.75, 9.75, 3.75, 10.5, 1.25)}`;
const BULB = 'M12 3.5a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2v1.2h5.2v-1.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3.5z';
const POUCH = 'M3.5 10a3 3 0 0 1 3-3h11a3 3 0 0 1 3 3v6.5a3 3 0 0 1-3 3h-11a3 3 0 0 1-3-3z';
const PAN_L = 'M2.5 13.25a2.5 2.5 0 0 0 5 0z';
const PAN_R = 'M16.5 13.25a2.5 2.5 0 0 0 5 0z';
const MED = rrect(3.5, 3.5, 17, 17, 4.5);
const TULIP = 'M7 5.5l2.5 2 2.5-3 2.5 3 2.5-2V10a5 5 0 0 1-10 0z';
const STRIP = rrect(8.75, 3, 6.5, 18, 3.25);
const BAG = rrect(3.5, 7, 17, 13, 2.5);
const LOCK = rrect(5, 10, 14, 10.5, 2.5);
const CAP = 'M2.75 9.5 12 5l9.25 4.5L12 14z';
const FLASK = 'M10.5 3.5V9L5 18.5a1.75 1.75 0 0 0 1.5 2.5h11a1.75 1.75 0 0 0 1.5-2.5L13.5 9V3.5';
const LIQUID = 'M7.05 15h9.9l2.05 3.5a1.75 1.75 0 0 1-1.5 2.5h-11a1.75 1.75 0 0 1-1.5-2.5z';

export const CYCLE = {
  /** Mon cycle : la goutte dans l'anneau du mois. */
  ringDrop: { fill: drop(12, 13.6, 3.3), stroke: `${arc(12, 12, 8.5, -40, 250)}${drop(12, 13.6, 3.3)}`, dots: [[17.8, 4.95, 1.3]] },
  /** Calendrier du cycle : la grille et un jour entouré. */
  calendarDot: { fill: CAL_FILL, stroke: `${CAL}${circle(16, 16.5, 2)}`, dots: [[8, 12.75, 1.05], [12, 12.75, 1.05], [16, 12.75, 1.05], [8, 16.5, 1.05], [12, 16.5, 1.05]] },
  /** Symptômes : le tracé du pouls. */
  pulse: { fill: circle(12, 12, 8.75), stroke: `${circle(12, 12, 8.75)}M5.5 12.5h2.25l1.75-3.75 3 7.5 2-5 1.25 1.25h2.75` },
  /** Douleurs : l'éclair. */
  bolt: { fill: 'M13.5 3 6 13.5h5.5L10.5 21 18 10.5h-5.5z', stroke: 'M13.5 3 6 13.5h5.5L10.5 21 18 10.5h-5.5z' },
  /** Pertes : deux gouttes. */
  drops: { fill: `${drop(9, 14.5, 4.25)}${drop(17, 15.75, 2.6)}`, stroke: `${drop(9, 14.5, 4.25)}${drop(17, 15.75, 2.6)}` },
  /** Saignements inhabituels : la goutte et le point d'exclamation. */
  dropAlert: { fill: drop(12, 14, 6), stroke: `${drop(12, 14, 6)}M12 9.5v4`, dots: [[12, 16.75, 1.1]] },
  /** Journal du cycle : la page et le stylo. */
  pagePen: { fill: rrect(4, 4, 12, 16, 2), stroke: `M16 11.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M7 8.5h6M7 12h4M18.2 9.8a1.6 1.6 0 0 1 2.3 2.3l-6.8 6.8-3 .7.7-3z` },
  /** Statistiques : trois barres. */
  bars: { fill: BARS, stroke: `${BARS}` },
  /** Mes conseils : l'ampoule. */
  bulb: { fill: BULB, stroke: `${BULB}M9.5 20.25h5` },
  /** Résumé du mois : le calendrier écrit. */
  calendarLines: { fill: CAL_FILL, stroke: `${CAL}M7.5 13.5h9M7.5 17h6` },
  /** Trousse de règles : la pochette et sa fermeture. */
  pouch: { fill: POUCH, stroke: `${POUCH}M3.5 11h17M15 11v3` },
  /** Ma contraception : le bouclier coché. */
  shieldCheck: { fill: SHIELD, stroke: `${SHIELD}M8.75 12.25l2.25 2.25 4.25-4.5` },
  /** Comparer les contraceptions : la balance. */
  balance: { fill: `${PAN_L}${PAN_R}`, stroke: `M12 5v15M8.5 20h7M4.5 6.75h15M5 6.75l-2.5 6.5M5 6.75l2.5 6.5M19 6.75l-2.5 6.5M19 6.75l2.5 6.5${PAN_L}${PAN_R}`, dots: [[12, 4.25, 1.4]] },
  /** Contraception d'urgence : le cercle d'alerte. */
  alertCircle: { fill: circle(12, 12, 8.5), stroke: `${circle(12, 12, 8.5)}M12 7.5v5.25`, dots: [[12, 16, 1.1]] },
  /** Rappels de contraception : le réveil. */
  alarmClock: { fill: circle(12, 13, 7), stroke: `${circle(12, 13, 7)}M12 9.5V13l2.25 1.5M4 6.5 6.5 4M20 6.5 17.5 4M7.25 19 5.75 20.75M16.75 19l1.5 1.75` },
  /** Préparer ma consultation : la croix médicale. */
  medCross: { fill: MED, stroke: `${MED}M10 7h4v3h3v4h-3v3h-4v-3H7v-4h3z` },
  /** Journal de ma contraception : le carnet à spirale. */
  spiralNote: { fill: rrect(5, 5, 14, 16, 2), stroke: `${rrect(5, 5, 14, 16, 2)}M8.5 3v4M12 3v4M15.5 3v4M8.5 11.5h7M8.5 15h4.5` },
  /** Cycle et période fertile : la tulipe. */
  tulip: { fill: TULIP, stroke: `${TULIP}M12 15v6M12 19.25c-2.5 0-4-1.5-4.5-3.5 2.5 0 4 1.25 4.5 3.5z` },
  /** Tests d'ovulation et de grossesse : la bandelette. */
  testStrip: { fill: STRIP, stroke: `${STRIP}${rrect(10.25, 9.5, 3.5, 6.5, 1)}M10.25 11.75h3.5M10.25 13.75h3.5M10.75 5.5h2.5` },
  /** Glaire cervicale : la loupe et la goutte. */
  magnifierDrop: { fill: circle(10.5, 10.5, 6.5), stroke: `${circle(10.5, 10.5, 6.5)}M15.25 15.25 20 20${drop(10.5, 11.6, 2.4)}` },
  /** Température au réveil : le soleil qui se lève. */
  sunrise: { fill: 'M7 17.5a5 5 0 0 1 10 0z', stroke: 'M7 17.5a5 5 0 0 1 10 0M3 17.5h18M8.5 20.75h7M12 6.25v2.25M5.4 10.15l1.55 1.55M18.6 10.15l-1.55 1.55M3.25 14h1.75M19 14h1.75' },
  /** Rapports : le cadenas au cœur. */
  lockHeart: { fill: LOCK, stroke: `${LOCK}M8 10V7.5a4 4 0 0 1 8 0V10${heart(12, 15.3, 2.75)}` },
  /** Examens de fertilité : la planche et le tracé. */
  clipboardPulse: { fill: CLIPBOARD, stroke: `${CLIPBOARD}${CLIP}M7.75 14h2l1.25-2.5 2 4.5 1.25-2h2` },
  /** Comprendre mon cycle : la toque. */
  mortarboard: { fill: CAP, stroke: `${CAP}M6.5 11.75v4c0 1.4 2.5 2.75 5.5 2.75s5.5-1.35 5.5-2.75v-4M21.25 9.5v5` },
  /** Consultation de fertilité : la trousse médicale. */
  medBag: { fill: BAG, stroke: `${BAG}M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M12 10.5v6M9 13.5h6` },
  /** Rappels du projet bébé : le calendrier et l'horloge. */
  calendarClock: { fill: circle(17, 17, 4), stroke: `M11.5 18H5.5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3.5M3.5 9.25h15M7.5 3.25v3.5M14.5 3.25v3.5${circle(17, 17, 4)}M17 15.25V17l1.25.75` },
  /** Suivi de PMA : le flacon du laboratoire. */
  flask: { fill: LIQUID, stroke: `${FLASK}M9.25 3.5h5.5M7.05 15h9.9`, dots: [[11, 12.25, 0.95], [13.1, 10.75, 0.8]] },
  /** Calendrier des examens (liste des 200, n° 27) : le calendrier et le flacon d'analyse. */
  calendarFlask: {
    fill: rrect(3, 5.5, 12.5, 13, 2.25),
    stroke: `${calendar(3, 5.5, 12.5, 13)}M17.25 11.5v3l-2.4 4.85a1 1 0 0 0 .9 1.4h4.95a1 1 0 0 0 .9-1.4L19.25 14.5v-3M16.5 11.5h3.5`,
  },
} satisfies Record<string, HomiIconDef>;
