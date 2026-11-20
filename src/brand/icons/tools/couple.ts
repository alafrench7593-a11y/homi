/** Famille COUPLE (charge mentale, domaines, point de couple, se comprendre, bilan, temps pour soi, difficultés). */
import { BUBBLE_FULL, circle, heart, rrect, type HomiIconDef } from '../geometry';

const HEART = heart(12, 12.7, 7.6);
const CUP = 'M4.5 9.5h12v5a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5z';
const BOX = rrect(3.5, 3.5, 17, 17, 4.5);
const CUPS = `${rrect(3.5, 13.5, 4.5, 7, 2)}${rrect(16, 13.5, 4.5, 7, 2)}`;
const DOME = 'M6.5 16.5V12a5.5 5.5 0 0 1 11 0v4.5z';

export const COUPLE = {
  /** Répartition de la charge mentale : le camembert et la part de chacun. */
  pie: { fill: 'M12 12V3.5A8.5 8.5 0 0 1 20.5 12z', stroke: `${circle(12, 12, 8.5)}M12 3.5V12h8.5` },
  /** Confier un domaine : une personne et la flèche. */
  personArrow: { fill: circle(9, 7.5, 3.25), stroke: `${circle(9, 7.5, 3.25)}M3 19.5c.6-3.4 3-5.5 6-5.5 1.5 0 2.8.5 3.8 1.4M14.5 16.5h6.25M18.25 14l2.5 2.5-2.5 2.5` },
  /** Qui porte quel domaine : une personne cochée. */
  personCheck: { fill: circle(9, 7.5, 3.25), stroke: `${circle(9, 7.5, 3.25)}M3 19.5c.6-3.4 3-5.5 6-5.5 1.5 0 2.8.5 3.8 1.4M14.75 16.25l2 2 4-4.25` },
  /** Point de couple : la tasse fumante. */
  cup: { fill: CUP, stroke: `${CUP}M16.5 11h1.25a2.25 2.25 0 0 1 0 4.5H16M8.5 3.5c-.8 1 .8 2 0 3M12.5 3.5c-.8 1 .8 2 0 3` },
  /** Se comprendre : la bulle au cœur. */
  bubbleHeart: { fill: BUBBLE_FULL, stroke: `${BUBBLE_FULL}${heart(12, 10.4, 3.3)}` },
  /** Bilan de la semaine : le tableau et ses barres. */
  chartBox: { fill: BOX, stroke: `${BOX}M8 16v-3M12 16V8M16 16v-5` },
  /** Temps pour soi : le casque. */
  headphones: { fill: CUPS, stroke: `M4 15v-2.5a8 8 0 0 1 16 0V15${CUPS}` },
  /** Je décroche : le bouton d'arrêt. */
  power: { fill: circle(12, 13, 7.5), stroke: 'M12 3.5v8M7.3 6.5a7.5 7.5 0 1 0 9.4 0' },
  /** Journée difficile : le vent. */
  wind: { fill: circle(16.25, 6.25, 2.75), stroke: 'M3.5 9h12.75a2.75 2.75 0 1 0-2.75-2.75M3.5 13h13a2.75 2.75 0 1 1-2.75 2.75M3.5 17h6' },
  /** Mode urgence du foyer : le gyrophare. */
  siren: { fill: DOME, stroke: `${DOME}${rrect(4.5, 16.5, 15, 3.5, 1.25)}M12 2.75v2M4.4 5.9l1.4 1.4M19.6 5.9l-1.4 1.4M2.75 12h1.5M19.75 12h1.5M9.5 12a2.5 2.5 0 0 1 2.5-2.5` },
  /** Je craque : la pause dans le cœur. */
  heartPause: { fill: HEART, stroke: `${HEART}M10.25 10.25v4.5M13.75 10.25v4.5` },
  /** Parent solo : l'ancre. */
  anchor: { fill: 'M4.5 13.5a7.5 7.5 0 0 0 15 0z', stroke: `${circle(12, 5.25, 1.9)}M12 7.15V20.5M8.5 10h7M4.5 13.5a7.5 7.5 0 0 0 15 0M3 15l1.5-1.5L6 15M18 15l1.5-1.5L21 15` },
  /** Mode embrouille : la bulle et la coche (une demande, un geste). */
  bubbleCheck: { fill: BUBBLE_FULL, stroke: `${BUBBLE_FULL}M8.75 10.5l2.25 2.25 4.25-4.5` },
  /** Moments à deux : deux cœurs. */
  twoHearts: { fill: heart(9.25, 10.75, 5.25), stroke: `${heart(9.25, 10.75, 5.25)}${heart(16, 14.75, 4.25)}` },
  /** Dépenses familiales : le portefeuille. */
  wallet: { fill: rrect(3.5, 7.5, 17, 12, 2.5), stroke: `${rrect(3.5, 7.5, 17, 12, 2.5)}M5 7.5V7a2 2 0 0 1 2-2h10.5v2.5M20.5 11.5h-3.75a2 2 0 0 0 0 4h3.75`, dots: [[16.75, 13.5, 1]] },
} satisfies Record<string, HomiIconDef>;
