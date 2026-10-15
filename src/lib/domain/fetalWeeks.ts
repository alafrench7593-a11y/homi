/**
 * Repères ÉDUCATIFS semaine par semaine (en SA).
 * Valeurs moyennes indicatives, arrondies : chaque bébé grandit à son rythme.
 * Ces repères ne sont ni une échographie ni une mesure de VOTRE bébé.
 * ⚠️ Contenu de développement : à faire valider par un professionnel
 * (sage-femme / gynécologue-obstétricien) avant publication.
 */

interface SizePoint {
  sa: number;
  lengthCm: number; // avant 20 SA : longueur tête-fesses ; ensuite : tête-talons
  weightG: number | null;
  compare: string;
}

const SIZES: SizePoint[] = [
  { sa: 4, lengthCm: 0.1, weightG: null, compare: 'une graine de pavot' },
  { sa: 5, lengthCm: 0.2, weightG: null, compare: 'une graine de sésame' },
  { sa: 6, lengthCm: 0.4, weightG: null, compare: 'un grain de riz' },
  { sa: 7, lengthCm: 0.8, weightG: null, compare: 'une lentille' },
  { sa: 8, lengthCm: 1.5, weightG: 1, compare: 'une myrtille' },
  { sa: 9, lengthCm: 2.2, weightG: 2, compare: 'une framboise' },
  { sa: 10, lengthCm: 3, weightG: 4, compare: 'une olive' },
  { sa: 11, lengthCm: 4, weightG: 7, compare: 'une figue' },
  { sa: 12, lengthCm: 5.5, weightG: 14, compare: 'un citron vert' },
  { sa: 14, lengthCm: 8.5, weightG: 45, compare: 'un citron' },
  { sa: 16, lengthCm: 11.5, weightG: 100, compare: 'un avocat' },
  { sa: 18, lengthCm: 14, weightG: 190, compare: 'un poivron' },
  { sa: 20, lengthCm: 25, weightG: 300, compare: 'une banane' },
  { sa: 22, lengthCm: 28, weightG: 430, compare: 'une papaye' },
  { sa: 24, lengthCm: 30, weightG: 600, compare: 'un épi de maïs' },
  { sa: 26, lengthCm: 35, weightG: 760, compare: 'une laitue' },
  { sa: 28, lengthCm: 37, weightG: 1000, compare: 'une aubergine' },
  { sa: 30, lengthCm: 39, weightG: 1300, compare: 'un chou' },
  { sa: 32, lengthCm: 42, weightG: 1700, compare: 'une noix de coco' },
  { sa: 34, lengthCm: 45, weightG: 2100, compare: 'un melon' },
  { sa: 36, lengthCm: 47, weightG: 2600, compare: 'une laitue romaine' },
  { sa: 38, lengthCm: 49, weightG: 3000, compare: 'une petite citrouille' },
  { sa: 40, lengthCm: 50, weightG: 3300, compare: 'une pastèque' },
  { sa: 42, lengthCm: 51, weightG: 3500, compare: 'une pastèque' },
];

interface Stage {
  from: number;
  to: number;
  baby: string[];
  mother: string[];
}

const STAGES: Stage[] = [
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

export interface WeekInfo {
  sa: number;
  lengthCm: number;
  weightG: number | null;
  compare: string;
  lengthKind: 'tête-fesses' | 'tête-talons';
  baby: string[];
  mother: string[];
  /** 0..1 — sert uniquement à faire évoluer l'illustration */
  growth: number;
}

export function weekInfo(sa: number): WeekInfo {
  const w = Math.max(4, Math.min(42, sa));
  let lower = SIZES[0];
  let upper = SIZES[SIZES.length - 1];
  for (let i = 0; i < SIZES.length - 1; i++) {
    if (w >= SIZES[i].sa && w <= SIZES[i + 1].sa) {
      lower = SIZES[i];
      upper = SIZES[i + 1];
      break;
    }
  }
  const t = upper.sa === lower.sa ? 0 : (w - lower.sa) / (upper.sa - lower.sa);
  const nearest = t < 0.5 ? lower : upper;
  const lengthCm = Math.round((lower.lengthCm + (upper.lengthCm - lower.lengthCm) * t) * 10) / 10;
  const weightG =
    lower.weightG != null && upper.weightG != null ? Math.round(lower.weightG + (upper.weightG - lower.weightG) * t) : nearest.weightG;
  const stage = STAGES.find((s) => w >= s.from && w <= s.to) ?? STAGES[STAGES.length - 1];
  return {
    sa: w,
    lengthCm,
    weightG,
    compare: nearest.compare,
    lengthKind: w < 20 ? 'tête-fesses' : 'tête-talons',
    baby: stage.baby,
    mother: stage.mother,
    growth: Math.min(1, Math.max(0, (w - 4) / 37)),
  };
}

export function formatWeight(g: number | null): string {
  if (g == null) return 'moins d’un gramme';
  if (g < 1000) return `environ ${g} g`;
  return `environ ${(g / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} kg`;
}
