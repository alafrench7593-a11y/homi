/** Famille SOIN (journée, couches, dents, produits, journal, fiche et croissance de l'enfant, humeur, album). */
import { circle, CLIP, CLIPBOARD, CLOSED_BOOK, CLOSED_BOOK_FILL, crescent, heart, on, rrect, SCAN_CORNERS, star, type HomiIconDef } from '../geometry';

const DIAPER = 'M3.5 7.5h17V10c0 5.2-3.8 9.5-8.5 9.5S3.5 15.2 3.5 10z';
const TOOTH = 'M8 4c-2.5 0-4 2-4 4.6 0 2.1.8 3.5 1.4 5.2.6 1.8.9 6.2 2.6 6.2 1.8 0 1.8-4.7 4-4.7s2.2 4.7 4 4.7c1.7 0 2-4.4 2.6-6.2.6-1.7 1.4-3.1 1.4-5.2C20 6 18.5 4 16 4c-1.6 0-2.4.9-4 .9S9.6 4 8 4z';
const BAG = 'M5.5 8h13l-.9 11.4a1.5 1.5 0 0 1-1.5 1.35H7.9a1.5 1.5 0 0 1-1.5-1.35z';
const NODES = `${circle(6.5, 6, 2)}${circle(6.5, 12, 2)}${circle(6.5, 18, 2)}`;
const CARD = rrect(3, 5, 18, 14, 2.25);
const RULER = rrect(4, 3, 6, 18, 1.5);
const FLAG = 'M5.5 4.5h11l-2.5 3.75 2.5 3.75h-11z';
const STAIRS = 'M3.5 20h4v-4.5H12V11h4.5V6.5h4V20z';
const FACE = circle(12, 12, 5.5);
const RAYS = Array.from({ length: 8 }, (_, i) => {
  const [x0, y0] = on(12, 12, 7.6, i * 45 - 90);
  const [x1, y1] = on(12, 12, 9.1, i * 45 - 90);
  return `M${+x0.toFixed(2)} ${+y0.toFixed(2)}L${+x1.toFixed(2)} ${+y1.toFixed(2)}`;
}).join('');
const PHOTO = rrect(3.5, 7.5, 14, 12, 1.75);

export const SOIN = {
  /** Suivi de la journée : la liste du jour sur sa planche. */
  clipboardList: { fill: CLIPBOARD, stroke: `${CLIPBOARD}${CLIP}M11 11h4.5M11 14.5h4.5M11 18h3`, dots: [[8.6, 11, 1.05], [8.6, 14.5, 1.05], [8.6, 18, 1.05]] },
  /** Couches : la couche et sa ceinture. */
  diaper: { fill: DIAPER, stroke: `${DIAPER}M3.5 10.25h17M7.6 18.2c.6-2.4 2.3-3.9 4.4-3.9s3.8 1.5 4.4 3.9` },
  /** Dents : une dent et son reflet. */
  tooth: { fill: TOOTH, stroke: `${TOOTH}M7.4 8.2c.2-1 .85-1.6 1.8-1.7` },
  /** Scanner un produit : le code-barres dans le cadre. */
  barcodeScan: { fill: rrect(6.5, 7, 11, 10, 1.5), stroke: `${SCAN_CORNERS}M8.25 8.5v7M10.75 8.5v7M13.25 8.5v7M15.75 8.5v7` },
  /** Produits scannés : l'horloge qui remonte le temps. */
  historyArrow: { fill: circle(12, 12, 8), stroke: 'M4 12a8 8 0 1 0 2.35-5.65L4 8.75M4 4.75v4h4M12 8v4l2.75 1.6' },
  /** Comparer deux produits : deux fiches et la double flèche. */
  compareCards: {
    fill: `${rrect(4, 3.5, 6.5, 11.5, 1.5)}${rrect(13.5, 3.5, 6.5, 11.5, 1.5)}`,
    stroke: `${rrect(4, 3.5, 6.5, 11.5, 1.5)}${rrect(13.5, 3.5, 6.5, 11.5, 1.5)}M6.25 7h2M15.75 7h2M5 19.25h14M7 17.25l-2 2 2 2M17 17.25l2 2-2 2`,
  },
  /** Guide des produits pour enfants : le sac et un cœur. */
  bagHeart: { fill: BAG, stroke: `${BAG}M9 8V6.5a3 3 0 0 1 6 0V8${heart(12, 14.2, 2.9)}` },
  /** Journal complet : la frise et ses événements. */
  timeline: { fill: NODES, stroke: `${NODES}M6.5 8v2M6.5 14v2M10.5 6h9M10.5 12h7M10.5 18h8` },
  /** Fiche de l'enfant : sa carte, son portrait. */
  kidCard: { fill: CARD, stroke: `${CARD}${circle(8.5, 10.25, 2)}M5.5 16.5c.5-1.7 1.6-2.6 3-2.6s2.5.9 3 2.6M14 10h4M14 13.5h3M8.6 8.25c-.25-.6.05-1.2.75-1.35` },
  /** Croissance : la toise et la flèche qui monte. */
  ruler: { fill: RULER, stroke: `${RULER}M10 7H7.5M10 11H6.5M10 15H7.5M16.5 20V5M13.5 8l3-3 3 3` },
  /** Grandes étapes : le fanion. */
  flag: { fill: FLAG, stroke: `${FLAG}M5.5 21V3.5` },
  /** Étapes du développement : les marches. */
  stairs: { fill: STAIRS, stroke: 'M3.5 20h4v-4.5H12V11h4.5V6.5h4M3.5 20h17', dots: [[18.5, 3.6, 1.45]] },
  /** Humeur de l'enfant : un visage souriant et ses rayons. */
  sunnyFace: { fill: FACE, stroke: `${FACE}${RAYS}M9.9 13.6c1.2 1.1 3 1.1 4.2 0`, dots: [[10.1, 11, 0.95], [13.9, 11, 0.95]] },
  /** Album photo : deux photos, une montagne, un soleil. */
  photos: { fill: PHOTO, stroke: `${PHOTO}M7 4.5h11.5a2 2 0 0 1 2 2V16M5.5 17.5l3.5-4 2.5 2.5 1.5-1.5 3 3`, dots: [[13.5, 10.75, 1.35]] },
  /** Habitudes de lecture : le livre et l'étoile. */
  bookStar: { fill: CLOSED_BOOK_FILL, stroke: `${CLOSED_BOOK}${star(12, 10, 3.6, 1.6)}` },
  /** Bibliothèque d'histoires : le livre ouvert sous la lune. */
  storyMoon: {
    fill: crescent(12, 5.75, 2.75),
    stroke: `M3.75 10.7c2.8-.95 5.55-.6 8.25 1.2v8.6c-2.7-1.8-5.45-2.15-8.25-1.2zM20.25 10.7c-2.8-.95-5.55-.6-8.25 1.2v8.6c2.7-1.8 5.45-2.15 8.25-1.2z${crescent(12, 5.75, 2.75)}`,
    dots: [[6.5, 5, 1], [17.75, 4.25, 1]],
  },
} satisfies Record<string, HomiIconDef>;
