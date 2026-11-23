/** Famille COMMUNAUTÉ (l'espace, les messages privés, la recherche de discussions). */
import { circle, rrect, type HomiIconDef } from '../geometry';

const BODY = 'M7 18.75c.5-3 2.4-4.75 5-4.75s4.5 1.75 5 4.75z';
const ENV = rrect(3, 5.5, 18, 13, 2.25);

export const COMMUNAUTE = {
  /** Communauté : trois personnes. */
  group: { fill: `${circle(12, 7.5, 2.75)}${BODY}`, stroke: `${circle(12, 7.5, 2.75)}${BODY}${circle(5.5, 9.75, 2.1)}${circle(18.5, 9.75, 2.1)}M2.75 17.5c.3-2 1.4-3.25 3-3.4M21.25 17.5c-.3-2-1.4-3.25-3-3.4` },
  /** Messages privés : l'enveloppe. */
  envelope: { fill: ENV, stroke: `${ENV}M3.75 7.25l8.25 6 8.25-6` },
  /** Rechercher : la loupe. */
  magnifier: { fill: circle(10.5, 10.5, 6.25), stroke: `${circle(10.5, 10.5, 6.25)}M15.25 15.25 20.5 20.5` },
} satisfies Record<string, HomiIconDef>;
