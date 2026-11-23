/** Famille GARDE (école, fiche à transmettre, routines en images, garde alternée, nounou, photos de garde). */
import { circle, rrect, star, type HomiIconDef } from '../geometry';

const PACK = 'M6 9a6 6 0 0 1 12 0v9.5a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z';
const ID = rrect(3, 5.5, 18, 14, 2.25);
const BOXES = `${rrect(3.5, 4.5, 6, 6, 1.5)}${rrect(3.5, 13.5, 6, 6, 1.5)}`;
const HOUSES = 'M3 13.5 7 10l4 3.5V20H3zM13 13.5l4-3.5 4 3.5V20h-8z';
const ADULT = 'M4.5 20v-5.5a4 4 0 0 1 8 0V20z';
const CHILD = 'M13.5 20v-3a3 3 0 0 1 6 0v3z';
const CAMERA = 'M3.5 9a2 2 0 0 1 2-2h2.5l1.5-2.5h5L16 7h2.5a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z';

export const GARDE = {
  /** École ou mode de garde : le cartable. */
  backpack: { fill: PACK, stroke: `${PACK}${rrect(8.5, 13, 7, 4.5, 1.25)}M10 3.6a2 2 0 0 1 4 0` },
  /** Fiche à transmettre : la carte, sa photo et son cordon. */
  idCard: { fill: ID, stroke: `${ID}${rrect(6, 9, 5, 6, 1.25)}M13.5 10.5h4.5M13.5 13.5h3M10 5.5V3.5h4v2` },
  /** Routines en images : les cases à cocher de la journée. */
  routineChart: { fill: BOXES, stroke: `${BOXES}M5 7.6l1.3 1.3 2-2.3M12.5 7.5h8M12.5 16.5h6`, dots: [[6.5, 16.5, 1.2]] },
  /** Garde alternée : deux maisons, une flèche de l'une à l'autre. */
  twoHouses: { fill: HOUSES, stroke: `${HOUSES}M7 7.25c2.5-3 7.5-3 10 0M17 7.25l-.35-2.6M17 7.25l-2.6.45` },
  /** Garde et nounou : une adulte et un enfant. */
  adultChild: { fill: `${ADULT}${CHILD}`, stroke: `${circle(8.5, 6, 2.5)}${ADULT}${circle(16.5, 10.5, 2)}${CHILD}` },
  /** Appareil photo intégré. */
  camera: { fill: CAMERA, stroke: `${CAMERA}${circle(12, 13, 3.5)}`, dots: [[17.5, 9.75, 0.95]] },
  /** Activités extrascolaires : le ballon et l'étincelle de la séance. */
  activityBall: {
    fill: circle(9.5, 14, 6.5),
    stroke: `${circle(9.5, 14, 6.5)}M3.25 12.4c2.6 1.2 6.5 1.3 12.5-.5M9.5 7.5c-2 2.6-2 10.4 0 13${star(18.25, 5.75, 2.75, 1.1, 4)}`,
  },
  /** Suivi des devoirs : le cahier et le crayon. */
  homework: {
    fill: rrect(3.5, 4, 12, 16.5, 2),
    stroke: `${rrect(3.5, 4, 12, 16.5, 2)}M7 8.5h5M7 12h5M7 15.5h2.5M17.75 7.25l2.5 2.5-6.5 6.5-3.25.75.75-3.25z`,
  },
} satisfies Record<string, HomiIconDef>;
