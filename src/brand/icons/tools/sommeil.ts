/** Famille SOMMEIL (sommeil de l'enfant, rythme, veilleuse, nuits, relais, mon sommeil). Grille 24, trait 1,75. */
import { arc, crescent, on, rrect, star, tip, type HomiIconDef } from '../geometry';

const PILLOW = 'M4 15.5c0-2 1-3 3-3h10c2 0 3 1 3 3s-1 3-3 3H7c-2 0-3-1-3-3z';
const BLOCKS = `${rrect(3.5, 4.75, 10, 3.75, 1.875)}${rrect(9, 10.25, 11.5, 3.75, 1.875)}${rrect(5, 15.75, 8, 3.75, 1.875)}`;
const STAR = star(12, 12.6, 8.6, 3.9);
const [ra, rb] = on(12, 12, 8.25, 330);
const [la, lb] = on(12, 12, 8.25, 150);

export const SOMMEIL = {
  /** Sommeil de l'enfant : le lit à barreaux. */
  crib: { fill: 'M3.5 9h17v8h-17z', stroke: 'M3.5 9h17M3.5 17h17M3.5 5.5v15M20.5 5.5v15M8 9v8M12 9v8M16 9v8' },
  /** Planning de sommeil : les plages de sommeil de la journée. */
  sleepBlocks: { fill: BLOCKS, stroke: BLOCKS },
  /** Aide au sommeil : la veilleuse. */
  nightLamp: { fill: 'M8.5 4h7l2.5 8h-12z', stroke: 'M8.5 4h7l2.5 8h-12zM12 12v8.25M8.5 20.25h7M4.75 14.75 3.25 16M19.25 14.75 20.75 16' },
  /** Bilan de la nuit : une étoile. */
  starNight: { fill: STAR, stroke: STAR },
  /** Relais de nuit : deux flèches qui se passent le relais autour d'une lune. */
  relayMoon: {
    fill: crescent(12, 12, 3.6),
    stroke: `${arc(12, 12, 8.25, 200, 330)}${tip(ra, rb, 60)}${arc(12, 12, 8.25, 20, 150)}${tip(la, lb, 240)}${crescent(12, 12, 3.6)}`,
  },
  /** Mon sommeil : l'oreiller et les « z ». */
  pillowZ: { fill: PILLOW, stroke: `${PILLOW}M8.5 4.25h4.5l-4.5 5h4.5M15.5 6.75h3l-3 3.25h3` },
} satisfies Record<string, HomiIconDef>;
