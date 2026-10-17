/**
 * Observation de la glaire cervicale : catégories éducatives et messages.
 * Une observation (ou une photo) ne permet JAMAIS d'affirmer qu'une ovulation a lieu.
 */

export type MucusCategory = 'dry' | 'sticky' | 'creamy' | 'egg_white' | 'watery' | 'unusual' | 'unknown';
export type MucusTexture = 'stretchy' | 'sticky' | 'creamy' | 'liquid' | 'lumpy' | 'unknown';
export type MucusSensation = 'dry' | 'damp' | 'wet' | 'slippery' | 'unknown';
export type PhotoSuggestion = Exclude<MucusCategory, 'unknown'> | 'unanalyzable';

export const MUCUS_CATEGORIES: { value: MucusCategory; label: string; hint: string }[] = [
  { value: 'dry', label: 'Sèche ou absente', hint: 'Rien de visible, sensation sèche.' },
  { value: 'sticky', label: 'Épaisse ou collante', hint: 'Pâteuse, se casse quand on l’étire.' },
  { value: 'creamy', label: 'Crémeuse', hint: 'Blanchâtre, aspect de lotion.' },
  { value: 'egg_white', label: 'Transparente et étirable', hint: 'Comme du blanc d’œuf cru, s’étire entre deux doigts.' },
  { value: 'watery', label: 'Aqueuse', hint: 'Très liquide, claire.' },
  { value: 'unusual', label: 'Inhabituelle', hint: 'Couleur, odeur ou aspect qui vous semble différent.' },
  { value: 'unknown', label: 'Je ne sais pas', hint: 'Difficile à décrire aujourd’hui.' },
];

export const MUCUS_TEXTURES: { value: MucusTexture; label: string }[] = [
  { value: 'stretchy', label: 'Étirable' },
  { value: 'sticky', label: 'Collante' },
  { value: 'creamy', label: 'Crémeuse' },
  { value: 'liquid', label: 'Liquide' },
  { value: 'lumpy', label: 'Grumeleuse' },
  { value: 'unknown', label: 'Je ne sais pas' },
];

export const MUCUS_SENSATIONS: { value: MucusSensation; label: string }[] = [
  { value: 'dry', label: 'Sèche' },
  { value: 'damp', label: 'Humide' },
  { value: 'wet', label: 'Mouillée' },
  { value: 'slippery', label: 'Glissante' },
  { value: 'unknown', label: 'Je ne sais pas' },
];

export const mucusLabel = (v: string | null | undefined) => MUCUS_CATEGORIES.find((m) => m.value === v)?.label ?? null;

/** Repère éducatif associé à une catégorie (jamais une conclusion). */
export type FertilitySign = 'less_fertile' | 'intermediate' | 'potentially_fertile' | 'see_professional' | 'none';

export function fertilitySign(c: MucusCategory | PhotoSuggestion | null | undefined): FertilitySign {
  switch (c) {
    case 'dry': case 'sticky': return 'less_fertile';
    case 'creamy': return 'intermediate';
    case 'egg_white': case 'watery': return 'potentially_fertile';
    case 'unusual': return 'see_professional';
    default: return 'none';
  }
}

export const NO_OVULATION_PROOF = 'Une observation de glaire cervicale ne permet pas de confirmer une ovulation.';
export const UNUSUAL_ADVICE =
  'L’application ne pose pas de diagnostic. Si cet aspect vous inquiète (couleur, odeur, démangeaisons, douleur, saignement inhabituel), demandez l’avis d’un professionnel de santé : sage-femme, médecin ou gynécologue.';

/** Message éducatif pour une observation saisie par l'utilisatrice. */
export function observationMessage(c: MucusCategory | null): string | null {
  switch (fertilitySign(c)) {
    case 'less_fertile': return `Ce type de glaire est souvent observé en dehors de la période la plus fertile. ${NO_OVULATION_PROOF}`;
    case 'intermediate': return `Une glaire crémeuse est souvent observée lorsque la période fertile approche ou se termine. ${NO_OVULATION_PROOF}`;
    case 'potentially_fertile': return `Une glaire transparente, étirable ou aqueuse est souvent associée à une période potentiellement fertile. ${NO_OVULATION_PROOF}`;
    case 'see_professional': return UNUSUAL_ADVICE;
    default: return null;
  }
}

export interface PhotoSuggestionResult {
  analyzable: boolean;
  category: PhotoSuggestion;
  /** 0–1, plafonné côté serveur : une photo ne donne jamais de certitude. */
  confidence: number;
}

/** Message affiché après la suggestion faite à partir d'une photo. */
export function photoSuggestionMessage(s: PhotoSuggestionResult): string {
  if (!s.analyzable || s.category === 'unanalyzable') {
    return `La photo n’a pas pu être analysée. ${UNUSUAL_ADVICE} Vous pouvez choisir vous-même la description qui correspond le mieux.`;
  }
  if (s.category === 'unusual') return `L’aspect semble inhabituel sur cette photo. ${UNUSUAL_ADVICE}`;
  const sign = fertilitySign(s.category);
  if (sign === 'potentially_fertile') {
    return 'L’aspect semble compatible avec une période potentiellement fertile, mais une photo de glaire cervicale ne permet pas de confirmer une ovulation.';
  }
  if (sign === 'intermediate') return `L’aspect semble crémeux. ${NO_OVULATION_PROOF}`;
  return `L’aspect semble plutôt sec ou épais. ${NO_OVULATION_PROOF}`;
}

/** Niveau de confiance affiché pour une suggestion photo. */
export function suggestionConfidenceLabel(c: number): string {
  return c >= 0.65 ? 'moyen' : 'faible';
}
