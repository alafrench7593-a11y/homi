/**
 * Repères ÉDUCATIFS semaine par semaine (en SA).
 * Taille et poids : MOYENNES GÉNÉRALES publiées par une source française, arrondies ; entre deux points
 * publiés, la valeur est interpolée. Ce ne sont jamais les mesures de VOTRE bébé (seule l'échographie mesure).
 * Les comparaisons avec des fruits sont seulement illustratives.
 */

import { t as tr, formatNumber } from '@/i18n';
import { localized } from '@/i18n/localized';

/** Source des tailles et poids moyens affichés. */
export const FETAL_SIZE_SOURCE = {
  name: 'mpedia (Association française de pédiatrie ambulatoire) — « La grossesse mois par mois »',
  url: 'https://www.mpedia.fr/art-grossesse-mois-apres-mois/',
  updatedOn: '2022-09-23',
} as const;

interface SizePoint {
  sa: number;
  lengthCm: number;
  weightG: number;
  compare: string;
}

/** Valeurs de la source (6 à 41 SA). Avant 6 SA, aucune valeur n'est affichée. */
const SIZES_FR: SizePoint[] = [
  { sa: 6, lengthCm: 0.5, weightG: 1, compare: 'un grain de riz' },
  { sa: 8, lengthCm: 1.5, weightG: 2, compare: 'une myrtille' },
  { sa: 10, lengthCm: 3, weightG: 11, compare: 'une olive' },
  { sa: 12, lengthCm: 5, weightG: 28, compare: 'un citron vert' },
  { sa: 14, lengthCm: 8.5, weightG: 65, compare: 'un citron' },
  { sa: 16, lengthCm: 13, weightG: 135, compare: 'un avocat' },
  { sa: 18, lengthCm: 18, weightG: 200, compare: 'un poivron' },
  { sa: 20, lengthCm: 23, weightG: 345, compare: 'une banane' },
  { sa: 22, lengthCm: 27, weightG: 500, compare: 'une papaye' },
  { sa: 24, lengthCm: 31, weightG: 660, compare: 'un épi de maïs' },
  { sa: 26, lengthCm: 33, weightG: 890, compare: 'une laitue' },
  { sa: 28, lengthCm: 35, weightG: 1130, compare: 'une aubergine' },
  { sa: 30, lengthCm: 38, weightG: 1400, compare: 'un chou' },
  { sa: 32, lengthCm: 41.5, weightG: 1700, compare: 'une noix de coco' },
  { sa: 34, lengthCm: 45, weightG: 2000, compare: 'un melon' },
  { sa: 36, lengthCm: 47, weightG: 2680, compare: 'une laitue romaine' },
  { sa: 38, lengthCm: 50, weightG: 3000, compare: 'une petite citrouille' },
  { sa: 40, lengthCm: 51.5, weightG: 3400, compare: 'une pastèque' },
  { sa: 41, lengthCm: 52, weightG: 3500, compare: 'une pastèque' },
];
const SIZES_EN: SizePoint[] = [
  { sa: 6, lengthCm: 0.5, weightG: 1, compare: 'a grain of rice' },
  { sa: 8, lengthCm: 1.5, weightG: 2, compare: 'a blueberry' },
  { sa: 10, lengthCm: 3, weightG: 11, compare: 'an olive' },
  { sa: 12, lengthCm: 5, weightG: 28, compare: 'a lime' },
  { sa: 14, lengthCm: 8.5, weightG: 65, compare: 'a lemon' },
  { sa: 16, lengthCm: 13, weightG: 135, compare: 'an avocado' },
  { sa: 18, lengthCm: 18, weightG: 200, compare: 'a pepper' },
  { sa: 20, lengthCm: 23, weightG: 345, compare: 'a banana' },
  { sa: 22, lengthCm: 27, weightG: 500, compare: 'a papaya' },
  { sa: 24, lengthCm: 31, weightG: 660, compare: 'an ear of sweetcorn' },
  { sa: 26, lengthCm: 33, weightG: 890, compare: 'a lettuce' },
  { sa: 28, lengthCm: 35, weightG: 1130, compare: 'an aubergine' },
  { sa: 30, lengthCm: 38, weightG: 1400, compare: 'a cabbage' },
  { sa: 32, lengthCm: 41.5, weightG: 1700, compare: 'a coconut' },
  { sa: 34, lengthCm: 45, weightG: 2000, compare: 'a melon' },
  { sa: 36, lengthCm: 47, weightG: 2680, compare: 'a romaine lettuce' },
  { sa: 38, lengthCm: 50, weightG: 3000, compare: 'a small pumpkin' },
  { sa: 40, lengthCm: 51.5, weightG: 3400, compare: 'a watermelon' },
  { sa: 41, lengthCm: 52, weightG: 3500, compare: 'a watermelon' },
];
const SIZES = localized(SIZES_FR, SIZES_EN);

interface Stage {
  from: number;
  to: number;
  baby: string[];
  mother: string[];
}

const STAGES_FR: Stage[] = [
  { from: 0, to: 7, baby: ['Les toutes premières structures se mettent en place.', 'Le cœur commence à se former.'],
    mother: ['Fatigue, seins sensibles ou nausées sont possibles — ou absents : chaque grossesse est différente.'] },
  { from: 8, to: 13, baby: ['Les principaux organes se forment.', 'Les mains et les pieds se dessinent.'],
    mother: ['Les nausées peuvent être présentes, puis s’atténuer chez beaucoup de personnes autour de la fin du 1er trimestre.', 'C’est souvent la période de la première échographie.'] },
  { from: 14, to: 19, baby: ['Le bébé bouge beaucoup, même si on ne le sent pas encore toujours.', 'Les traits du visage s’affinent.'],
    mother: ['Beaucoup de personnes retrouvent un peu d’énergie.', 'Les premiers mouvements peuvent être perçus entre 16 et 22 SA environ.'] },
  { from: 20, to: 27, baby: ['Le bébé entend des sons, dont votre voix.', 'Il alterne des périodes d’éveil et de sommeil.'],
    mother: ['Le ventre s’arrondit ; le dos peut être sollicité.', 'C’est souvent la période de l’échographie du 2e trimestre.'] },
  { from: 28, to: 33, baby: ['Le bébé prend du poids et ses poumons poursuivent leur maturation.', 'Il ouvre les yeux par moments.'],
    mother: ['Le sommeil peut devenir moins confortable.', 'Signalez toute diminution nette des mouvements du bébé.'] },
  { from: 34, to: 37, baby: ['Le bébé prend des forces et des réserves.', 'Il se positionne souvent pour la naissance.'],
    mother: ['Des contractions irrégulières peuvent apparaître.', 'Pensez à préparer la valise et les papiers.'] },
  { from: 38, to: 45, baby: ['Le bébé est prêt à naître : il continue de grandir jusqu’à la naissance.'],
    mother: ['Le terme approche : suivez les consignes de votre maternité pour savoir quand venir.'] },
];

const STAGES_EN: Stage[] = [
  { from: 0, to: 7, baby: ['The very first structures are forming.', 'The heart is starting to develop.'],
    mother: ['Tiredness, tender breasts or nausea are possible, or none at all: every pregnancy is different.'] },
  { from: 8, to: 13, baby: ['The main organs are forming.', 'Hands and feet are taking shape.'],
    mother: ['Nausea may be present, then ease for many people around the end of the first trimester.', 'This is often when the first scan takes place.'] },
  { from: 14, to: 19, baby: ['Your baby moves a lot, even if you cannot always feel it yet.', 'Facial features are becoming more defined.'],
    mother: ['Many people get a little energy back.', 'First movements may be felt at around 16 to 22 weeks.'] },
  { from: 20, to: 27, baby: ['Your baby can hear sounds, including your voice.', 'They alternate between periods of waking and sleeping.'],
    mother: ['Your bump is rounding out; your back may feel the strain.', 'This is often when the second-trimester scan takes place.'] },
  { from: 28, to: 33, baby: ['Your baby is putting on weight and their lungs are continuing to mature.', 'They open their eyes at times.'],
    mother: ['Sleep may become less comfortable.', 'Report any clear reduction in your baby’s movements.'] },
  { from: 34, to: 37, baby: ['Your baby is building up strength and reserves.', 'They often settle into position for the birth.'],
    mother: ['Irregular contractions may appear.', 'Think about packing your bag and gathering your papers.'] },
  { from: 38, to: 45, baby: ['Your baby is ready to be born: they keep growing right up to the birth.'],
    mother: ['Your due date is approaching: follow your maternity unit’s guidance on when to come in.'] },
];

const STAGES = localized(STAGES_FR, STAGES_EN);

export interface WeekInfo {
  sa: number;
  /** null avant 6 SA : la source ne publie pas de valeur */
  lengthCm: number | null;
  weightG: number | null;
  compare: string;
  baby: string[];
  mother: string[];
  /** 0..1 — sert uniquement à faire évoluer l'illustration */
  growth: number;
}

export function weekInfo(sa: number): WeekInfo {
  const w = Math.max(4, Math.min(42, sa));
  const stage = STAGES.find((x) => w >= x.from && w <= x.to) ?? STAGES[STAGES.length - 1];
  const base = { sa: w, baby: stage.baby, mother: stage.mother, growth: Math.min(1, Math.max(0, (w - 4) / 37)) };
  if (w < SIZES[0].sa) return { ...base, lengthCm: null, weightG: null, compare: w < 5 ? tr('l4.fw.poppy') : tr('l4.fw.sesame') };
  const c = Math.min(w, SIZES[SIZES.length - 1].sa);
  let lower = SIZES[SIZES.length - 1];
  let upper = lower;
  for (let i = 0; i < SIZES.length - 1; i++) {
    if (c >= SIZES[i].sa && c <= SIZES[i + 1].sa) { lower = SIZES[i]; upper = SIZES[i + 1]; break; }
  }
  const t = upper.sa === lower.sa ? 0 : (c - lower.sa) / (upper.sa - lower.sa);
  const nearest = t < 0.5 ? lower : upper;
  return {
    ...base,
    lengthCm: Math.round((lower.lengthCm + (upper.lengthCm - lower.lengthCm) * t) * 10) / 10,
    weightG: Math.round(lower.weightG + (upper.weightG - lower.weightG) * t),
    compare: nearest.compare,
  };
}

/** « environ 23 cm », ou « moins de 5 mm » avant 6 SA. */
export function formatLength(cm: number | null): string {
  if (cm == null) return tr('l4.fw.lt5mm');
  return cm < 1 ? tr('l4.fw.aboutMm', { n: Math.round(cm * 10) }) : tr('l4.fw.aboutCm', { n: formatNumber(cm) });
}

export function formatWeight(g: number | null): string {
  if (g == null) return tr('l4.fw.lt1g');
  if (g < 1000) return tr('l4.fw.aboutG', { n: g });
  return tr('l4.fw.aboutKg', { n: formatNumber(g / 1000, { maximumFractionDigits: 1 }) });
}
