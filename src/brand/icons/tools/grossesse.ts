/** Famille GROSSESSE et POST-PARTUM (début, évolution, poids, ressenti, mouvements, listes, récupération). */
import { calendar, capsule, circle, CLIP, CLIPBOARD, heart, rotRect, rrect, type HomiIconDef } from '../geometry';

const HEART = heart(12, 12.7, 7.6);
const CAL_FILL = rrect(3.5, 5, 17, 15.5, 2.25);
const SCALE = rrect(3.5, 4, 17, 16.5, 3.5);
const PETAL = 'M12 5c2 2 3 4.2 3 6.5S14 16.6 12 18c-2-1.4-3-3.6-3-6s1-4.5 3-7z';
const SOLE = (cx: number, cy: number) => `M${cx} ${cy - 4}a2.6 4 0 0 1 0 8a2.6 4 0 0 1 0-8z`;
const TAG = 'M3.5 5.5v5.3c0 .5.2 1 .6 1.4l8.1 8.1a1.75 1.75 0 0 0 2.5 0l5.2-5.2a1.75 1.75 0 0 0 0-2.5L11.8 4.1c-.4-.4-.9-.6-1.4-.6H5.5a2 2 0 0 0-2 2z';
const CASE = rrect(3.5, 7.5, 17, 12.5, 2.5);
const BAND = capsule(6.25, 17.75, 17.75, 6.25, 3.6);
const NOTE = rrect(5, 3.5, 14, 17, 2);
const CLOUD = 'M7 15.5a4 4 0 0 1-.4-8A5.5 5.5 0 0 1 17 8a3.75 3.75 0 0 1 .5 7.5z';
const TORSO = 'M9 10.5h6l-.5 5h-5z';
const BELLY = 'M8.75 8.5C7.4 9.4 6.75 11 6.75 13v7.25h7c2.15 0 3.75-1.5 3.75-3.5 0-2.55-2-4.85-5-5.15 0-1.3-.45-2.4-1.25-3.1';
const BODY1 = 'M3.5 19.5c.6-3.3 2.8-5.25 5.5-5.25s4.9 1.95 5.5 5.25z';

export const GROSSESSE = {
  /** Démarrer ma grossesse : le cœur et le « + ». */
  heartPlus: { fill: HEART, stroke: `${HEART}M12 10v5M9.5 12.5h5` },
  /** Ma grossesse semaine par semaine : la silhouette au ventre rond. */
  belly: { fill: `${BELLY}z`, stroke: `${circle(10, 5, 2.25)}${BELLY}` },
  /** Mon poids : le pèse-personne. */
  scale: { fill: SCALE, stroke: `${SCALE}M8 10.25a4 4 0 0 1 8 0zM12 10.25l1.6-2.5` },
  /** Mes symptômes : le lotus. */
  lotus: { fill: PETAL, stroke: `${PETAL}M8.7 9.6C6 9.3 4 10 3 11c.5 3.7 3.5 6.8 9 7M15.3 9.6c2.7-.3 4.7.4 5.7 1.4-.5 3.7-3.5 6.8-9 7` },
  /** Mouvements de bébé : deux petits pieds. */
  footprints: {
    fill: `${SOLE(8.5, 15.5)}${SOLE(15.5, 11)}`,
    stroke: `${SOLE(8.5, 15.5)}${SOLE(15.5, 11)}`,
    dots: [[6.6, 9.25, 1], [8.7, 8.55, 1], [10.6, 9.15, 1], [13.6, 4.75, 1], [15.7, 4.05, 1], [17.6, 4.65, 1]],
  },
  /** Calendrier de grossesse : le calendrier au cœur. */
  calendarHeart: { fill: CAL_FILL, stroke: `${calendar(3.5, 5, 17, 15.5)}${heart(12, 14.6, 3.3)}` },
  /** Idées de prénoms : l'étiquette. */
  tagHeart: { fill: TAG, stroke: `${TAG}${circle(7.5, 7.5, 1.25)}${heart(13.2, 12.6, 2.5)}` },
  /** Listes de préparation : la valise. */
  suitcase: { fill: CASE, stroke: `${CASE}M9 7.5V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5v2M8 7.5V20M16 7.5V20` },
  /** Ma récupération : le pansement. */
  bandage: { fill: BAND, stroke: `${BAND}${rotRect(12, 12, 5.2, 4.6, -45)}` },
  /** Mon point du jour : le carnet au cœur. */
  notebookHeart: { fill: NOTE, stroke: `${NOTE}M8.5 3.5v17${heart(13.75, 11.75, 2.9)}` },
  /** Mon évolution : la tendance et sa flèche. */
  trendLine: { fill: 'M7 15.5l3.5-4 3 2.5 5-5.5V20H7z', stroke: 'M4 3.75V20h16.25M7 15.5l3.5-4 3 2.5 5.25-5.75M15 8.25h3.75V12' },
  /** Cicatrisation et rééducation : le corps qui s'étire. */
  stretch: { fill: TORSO, stroke: `${circle(12, 5, 2.1)}M5.5 6.5 9 10.5h6l3.5-4${TORSO}M9.5 15.5 8 21M14.5 15.5 16 21` },
  /** Baby blues : le nuage et la pluie. */
  cloudRain: { fill: CLOUD, stroke: `${CLOUD}M8.5 18.5l-1 2M12.5 18.5l-1 2M16.5 18.5l-1 2` },
  /** Trouver de l'aide : la main qui tend un cœur. */
  handHeart: {
    fill: heart(13, 7.6, 3.6),
    stroke: `${heart(13, 7.6, 3.6)}M3.5 14.25h2.75l3.75 1.25h3.25a1.25 1.25 0 0 1 0 2.5H9.5M6.25 20H11l7-3.25a1.4 1.4 0 0 0-1.2-2.55l-3.3 1.55M3.5 14.25V20h2.75v-5.75`,
  },
  /** Espace du co-parent : deux personnes. */
  twoPeople: { fill: `${circle(9, 8, 3.1)}${BODY1}`, stroke: `${circle(9, 8, 3.1)}${BODY1}${circle(16.5, 9, 2.5)}M16.5 14.25c2.2 0 3.75 1.65 4.25 4.25` },
  /** Chronomètre des contractions : le chronomètre et la vague. */
  contractionTimer: { fill: circle(12, 13.5, 7), stroke: `${circle(12, 13.5, 7)}M10 3.5h4M12 3.5v3M7.75 13.5c1-1.9 2-1.9 3 0s2 1.9 3 0 2-1.9 3 0` },
  /** Projet de naissance : la page au cœur. */
  birthPlan: { fill: rrect(5, 3.5, 14, 17, 2), stroke: `${rrect(5, 3.5, 14, 17, 2)}${heart(12, 9.4, 3)}M8.5 15h7M8.5 18h4.5` },
  /** Préparation du coparent : la liste du jour J. */
  dayList: { fill: CLIPBOARD, stroke: `${CLIPBOARD}${CLIP}M8.25 11.25l1.5 1.5 2.5-2.75M14 11.5h2M8.25 16.25l1.5 1.5 2.5-2.75M14 16.5h2` },
  /** Rééducation périnéale : le hamac soutenu. */
  pelvicLift: { fill: 'M3.5 8.5c2.5 6.5 14.5 6.5 17 0z', stroke: 'M3.5 8.5c2.5 6.5 14.5 6.5 17 0M8 20.5v-4.75M5.9 17.75 8 15.65l2.1 2.1M16 20.5v-4.75M13.9 17.75 16 15.65l2.1 2.1' },
  /** Suivi de la cicatrisation : la pousse. */
  sprout: { fill: 'M12 13c0-3.5-2.5-6-6.5-6 0 3.5 2.5 6 6.5 6zM12 11c0-3 2-5.5 6-5.5 0 3-2 5.5-6 5.5z', stroke: 'M12 20.5V11M12 13c0-3.5-2.5-6-6.5-6 0 3.5 2.5 6 6.5 6zM12 11c0-3 2-5.5 6-5.5 0 3-2 5.5-6 5.5zM7.5 20.5h9' },
} satisfies Record<string, HomiIconDef>;
