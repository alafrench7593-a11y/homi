/** Famille ALIMENTATION (allaitement, biberons, diversification, repas, scanner d'aliments). Grille 24, trait 1,75. */
import { BUBBLE_FULL, circle, drop, heart, rrect, SCAN_CORNERS, type HomiIconDef } from '../geometry';

const BOTTLE = 'M6.6 9h6.8v9.5a2.5 2.5 0 0 1-2.5 2.5H9.1a2.5 2.5 0 0 1-2.5-2.5z';
const BOWL = 'M3.75 11.5h16.5a8.25 7.5 0 0 1-16.5 0z';
const PLATE = circle(12, 12, 4.75);
const CUP = 'M7 4h10v4.5a5 5 0 0 1-10 0z';
const APPLE = 'M12 10.1c-1.15-.85-4.2-.95-4.2 2.4 0 2.75 1.85 4.85 3.1 4.85.45 0 .75-.2 1.1-.2s.65.2 1.1.2c1.25 0 3.1-2.1 3.1-4.85 0-3.35-3.05-3.25-4.2-2.4z';
const CARROT = 'M5 19.25 13.66 6.66A2.6 2.6 0 0 1 17.34 10.34z';
const SAND = 'M8.9 20.5c.55-2.35 3.1-3.4 3.1-4.9 0 1.5 2.55 2.55 3.1 4.9z';

export const ALIMENTATION = {
  /** Allaitement : le bébé dans le creux du bras, une goutte de lait. */
  nursing: { fill: circle(14, 10.5, 3.4), stroke: `${circle(14, 10.5, 3.4)}M3.75 12.5c1.8 4.5 5 7 9 7 2.9 0 5.3-1.2 7.25-3.5${drop(6.5, 7.6, 1.8)}` },
  /** Noter un biberon : le biberon et un « + ». */
  bottlePlus: { fill: BOTTLE, stroke: `${BOTTLE}M6 6.5h8V9H6zM8.2 6.5V5.2a1.8 1.8 0 0 1 3.6 0v1.3M9 13h2M9 16h2M18 4.5v5M15.5 7h5` },
  /** Journée des biberons : un sablier jusqu'au prochain. */
  hourglass: { fill: SAND, stroke: 'M6 3.5h12M6 20.5h12M7.5 3.5c0 4 4.5 5.5 4.5 8.5s-4.5 4.5-4.5 8.5M16.5 3.5c0 4-4.5 5.5-4.5 8.5s4.5 4.5 4.5 8.5' },
  /** Historique des biberons : une courbe qui monte, un repère. */
  areaChart: { fill: 'M7 16 10.5 11.5 13.5 14 19 7.5V20H7z', stroke: 'M4 3.75V20h16.25M7 16l3.5-4.5 3 2.5L19 7.5', dots: [[19, 7.5, 1.4]] },
  /** Mesurettes : la cuillère doseuse et trois pincées de lait en poudre. */
  scoop: { fill: 'M3.5 11h10v.75a5 5 0 0 1-10 0z', stroke: 'M3.5 11h10v.75a5 5 0 0 1-10 0zM13.5 11.4 20.5 9', dots: [[6, 6.75, 1.2], [9, 5.25, 1.2], [11.75, 7.25, 1.2]] },
  /** Diversification : un bol et sa cuillère. */
  bowlSpoon: { fill: BOWL, stroke: `${BOWL}M9 20.5h6M12.75 11.25 16.9 6.1${circle(18.2, 4.75, 1.75)}` },
  /** Repas et recettes : l'assiette, la fourchette et le couteau. */
  plateCutlery: { fill: PLATE, stroke: `${PLATE}M3.5 4v4a1.25 1.25 0 0 0 2.5 0V4M4.75 4v16M20.5 20V4c-1.7 1-2.5 3.2-2.5 6.5V12h2.5` },
  /** Menu de la semaine : la cloche de service. */
  cloche: { fill: 'M4.5 17a7.5 7.5 0 0 1 15 0z', stroke: 'M4.5 17a7.5 7.5 0 0 1 15 0M2.75 17.25h18.5M12 9.5v-.75M8 13.5a4.5 4.5 0 0 1 2.25-2.6', dots: [[12, 7.5, 1.4]] },
  /** Cuisiner avec ce que j'ai : le réfrigérateur. */
  fridge: { fill: 'M6 9.5h12V19a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z', stroke: 'M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM6 9.5h12M9 5.5v2M9 12v3' },
  /** Classement des recettes : la coupe. */
  trophy: { fill: CUP, stroke: `${CUP}M7 5.5H4.75v1.25A3 3 0 0 0 7.5 9.7M17 5.5h2.25v1.25A3 3 0 0 1 16.5 9.7M12 13.5V17M8.75 17h6.5v3.5h-6.5z` },
  /** Bien manger enceinte : une carotte. */
  carrot: { fill: CARROT, stroke: `${CARROT}M17.3 6.7 17.9 3.4M17.3 6.7l3.25-.65M17.3 6.7l2.4-2.4M9.2 13.4l1.5 1.5M11.9 10.7l1.5 1.5` },
  /** Scanner un aliment : une pomme dans le cadre. */
  appleScan: { fill: APPLE, stroke: `${SCAN_CORNERS}${APPLE}M12 10.1c0-1.15.6-1.95 1.65-2.35` },
  /** Stock de lait maternel : deux contenants datés. */
  milkJars: {
    fill: `${rrect(4, 8.5, 7, 12, 2)}${rrect(13, 6.5, 7, 14, 2)}`,
    stroke: `${rrect(4, 8.5, 7, 12, 2)}${rrect(13, 6.5, 7, 14, 2)}M5.25 5.75h4.5M14.25 3.75h4.5M6.25 14.25h2.5M15.25 12.25h2.5`,
  },
  /** Difficultés d'allaitement : la goutte et la question. */
  milkQuestion: { fill: drop(12, 14, 6), stroke: `${drop(12, 14, 6)}M10.25 12.25a1.75 1.75 0 1 1 2.5 1.6c-.45.2-.75.55-.75 1.05v.35`, dots: [[12, 17.5, 1]] },
  /** Laits infantiles : la boîte de lait. */
  formulaTin: { fill: rrect(5, 6.5, 14, 14, 2.5), stroke: `${rrect(5, 6.5, 14, 14, 2.5)}M5 10h14M6.5 3.75h11a1.5 1.5 0 0 1 1.5 1.5V6.5H5V5.25a1.5 1.5 0 0 1 1.5-1.5z${heart(12, 15.2, 2.6)}` },
  /** Portions préparées : le bac à portions. */
  portionTray: { fill: rrect(3, 6, 18, 12, 2.25), stroke: `${rrect(3, 6, 18, 12, 2.25)}M9 6v12M15 6v12M3 12h18` },
  /** Suivi du lait maternel tiré : l'entonnoir du tire-lait sur son flacon gradué. */
  pumpBottle: {
    fill: rrect(8, 11.5, 8, 9, 2),
    stroke: `${rrect(8, 11.5, 8, 9, 2)}M9.5 11.5V9.5h5v2M5.5 3.75h13L15 9.5H9zM10.25 15h2M10.25 17.75h2`,
  },
  /** Allaitement mixte : la goutte partagée, sein d'un côté, biberon de l'autre. */
  splitDrop: {
    fill: 'M12 2.3C12 2.3 5.5 9.4 5.5 14a6.5 6.5 0 0 0 6.5 6.5z',
    stroke: `${drop(12, 14, 6.5)}M12 2.3v18.2`,
  },
  /** Biberons avec le coparent : deux biberons qui se relaient. */
  bottleRelay: {
    fill: rrect(3.5, 9, 6, 11.5, 2),
    stroke: `${rrect(3.5, 9, 6, 11.5, 2)}M5 9V6.75h3V9${rrect(14.5, 9, 6, 11.5, 2)}M16 9V6.75h3V9M10.75 12h2.75M12.25 10.5l1.5 1.5-1.5 1.5M13.25 17h-2.75M11.75 15.5l-1.5 1.5 1.5 1.5`,
  },
  /** Questions pour la consultante en lactation : la bulle et la goutte de lait. */
  bubbleDrop: { fill: BUBBLE_FULL, stroke: `${BUBBLE_FULL}${drop(12, 11.75, 2.6)}` },
  /** Habitudes d'alimentation : la grille des jours et des heures. */
  hourGrid: {
    fill: 'M9.25 9.5h5.5V15h-5.5z',
    stroke: `${rrect(3.5, 4, 17, 16, 2.5)}M3.5 9.5h17M3.5 15h17M9.25 4v16M14.75 4v16`,
    dots: [[6.4, 6.75, 1.1], [17.6, 6.75, 1.1], [17.6, 17.5, 1.1]],
  },
  /** Diversification menée par l'enfant : le brocoli à attraper. */
  broccoli: {
    fill: 'M6.25 11.75a3.25 3.25 0 0 1 .9-6.1 3.75 3.75 0 0 1 7-1.4 3.5 3.5 0 0 1 4.2 5 2.75 2.75 0 0 1-1.1 2.5z',
    stroke: 'M6.25 11.75a3.25 3.25 0 0 1 .9-6.1 3.75 3.75 0 0 1 7-1.4 3.5 3.5 0 0 1 4.2 5 2.75 2.75 0 0 1-1.1 2.5zM10 11.75l-1 8.75h6l-1-8.75M12 14.5v3',
  },
  /** Refus alimentaires : la cuillère et le non, sans jugement. */
  spoonRefuse: {
    fill: circle(17, 16, 4.25),
    stroke: `M8 3.5c2.2 0 3.5 2 3.5 4.25S10 12 8 12 4.5 10 4.5 7.75 5.8 3.5 8 3.5zM8 12v8.5${circle(17, 16, 4.25)}M15.4 14.4l3.2 3.2M18.6 14.4l-3.2 3.2`,
  },
} satisfies Record<string, HomiIconDef>;
