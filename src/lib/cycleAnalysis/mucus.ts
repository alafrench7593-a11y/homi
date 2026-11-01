/**
 * Observation de la glaire cervicale : catégories éducatives et messages.
 * Une observation (ou une photo) ne permet JAMAIS d'affirmer qu'une ovulation a lieu.
 */
import { onLocaleChange, t as tr } from '@/i18n';
import { localized } from '@/i18n/localized';

export type MucusCategory = 'dry' | 'sticky' | 'creamy' | 'egg_white' | 'watery' | 'unusual' | 'unknown';
export type MucusTexture = 'stretchy' | 'sticky' | 'creamy' | 'liquid' | 'lumpy' | 'unknown';
export type MucusSensation = 'dry' | 'damp' | 'wet' | 'slippery' | 'unknown';
export type PhotoSuggestion = Exclude<MucusCategory, 'unknown'> | 'unanalyzable';

const MUCUS_CATEGORIES_FR: { value: MucusCategory; label: string; hint: string }[] = [
  { value: 'dry', label: 'Sèche ou absente', hint: 'Rien de visible, sensation sèche.' },
  { value: 'sticky', label: 'Épaisse ou collante', hint: 'Pâteuse, se casse quand on l’étire.' },
  { value: 'creamy', label: 'Crémeuse', hint: 'Blanchâtre, aspect de lotion.' },
  { value: 'egg_white', label: 'Transparente et étirable', hint: 'Comme du blanc d’œuf cru, s’étire entre deux doigts.' },
  { value: 'watery', label: 'Aqueuse', hint: 'Très liquide, claire.' },
  { value: 'unusual', label: 'Inhabituelle', hint: 'Couleur, odeur ou aspect qui vous semble différent.' },
  { value: 'unknown', label: 'Je ne sais pas', hint: 'Difficile à décrire aujourd’hui.' },
];

const MUCUS_TEXTURES_FR: { value: MucusTexture; label: string }[] = [
  { value: 'stretchy', label: 'Étirable' },
  { value: 'sticky', label: 'Collante' },
  { value: 'creamy', label: 'Crémeuse' },
  { value: 'liquid', label: 'Liquide' },
  { value: 'lumpy', label: 'Grumeleuse' },
  { value: 'unknown', label: 'Je ne sais pas' },
];

const MUCUS_SENSATIONS_FR: { value: MucusSensation; label: string }[] = [
  { value: 'dry', label: 'Sèche' },
  { value: 'damp', label: 'Humide' },
  { value: 'wet', label: 'Mouillée' },
  { value: 'slippery', label: 'Glissante' },
  { value: 'unknown', label: 'Je ne sais pas' },
];

const MUCUS_CATEGORIES_EN: { value: MucusCategory; label: string; hint: string }[] = [
  { value: 'dry', label: 'Dry or absent', hint: 'Nothing visible, dry feeling.' },
  { value: 'sticky', label: 'Thick or sticky', hint: 'Pasty, breaks when stretched.' },
  { value: 'creamy', label: 'Creamy', hint: 'Whitish, like a lotion.' },
  { value: 'egg_white', label: 'Clear and stretchy', hint: 'Like raw egg white, stretches between two fingers.' },
  { value: 'watery', label: 'Watery', hint: 'Very runny, clear.' },
  { value: 'unusual', label: 'Unusual', hint: 'A colour, smell or look that seems different to you.' },
  { value: 'unknown', label: 'I don’t know', hint: 'Hard to describe today.' },
];

const MUCUS_TEXTURES_EN: { value: MucusTexture; label: string }[] = [
  { value: 'stretchy', label: 'Stretchy' },
  { value: 'sticky', label: 'Sticky' },
  { value: 'creamy', label: 'Creamy' },
  { value: 'liquid', label: 'Runny' },
  { value: 'lumpy', label: 'Lumpy' },
  { value: 'unknown', label: 'I don’t know' },
];

const MUCUS_SENSATIONS_EN: { value: MucusSensation; label: string }[] = [
  { value: 'dry', label: 'Dry' },
  { value: 'damp', label: 'Damp' },
  { value: 'wet', label: 'Wet' },
  { value: 'slippery', label: 'Slippery' },
  { value: 'unknown', label: 'I don’t know' },
];

export const MUCUS_CATEGORIES: { value: MucusCategory; label: string; hint: string }[] = localized(MUCUS_CATEGORIES_FR, MUCUS_CATEGORIES_EN);
export const MUCUS_TEXTURES: { value: MucusTexture; label: string }[] = localized(MUCUS_TEXTURES_FR, MUCUS_TEXTURES_EN);
export const MUCUS_SENSATIONS: { value: MucusSensation; label: string }[] = localized(MUCUS_SENSATIONS_FR, MUCUS_SENSATIONS_EN);

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

export let NO_OVULATION_PROOF = tr('l8.mu.noProof');
export let UNUSUAL_ADVICE = tr('l8.mu.unusualAdvice');
onLocaleChange(() => {
  NO_OVULATION_PROOF = tr('l8.mu.noProof');
  UNUSUAL_ADVICE = tr('l8.mu.unusualAdvice');
});

/** Message éducatif pour une observation saisie par l'utilisatrice. */
export function observationMessage(c: MucusCategory | null): string | null {
  const proof = NO_OVULATION_PROOF;
  switch (fertilitySign(c)) {
    case 'less_fertile': return tr('l8.mu.lessFertile', { proof });
    case 'intermediate': return tr('l8.mu.intermediate', { proof });
    case 'potentially_fertile': return tr('l8.mu.potential', { proof });
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
  const proof = NO_OVULATION_PROOF;
  const advice = UNUSUAL_ADVICE;
  if (!s.analyzable || s.category === 'unanalyzable') return tr('l8.mu.photoFail', { advice });
  if (s.category === 'unusual') return tr('l8.mu.photoUnusual', { advice });
  const sign = fertilitySign(s.category);
  if (sign === 'potentially_fertile') return tr('l8.mu.photoPotential');
  if (sign === 'intermediate') return tr('l8.mu.photoCreamy', { proof });
  return tr('l8.mu.photoDry', { proof });
}

/** Niveau de confiance affiché pour une suggestion photo. */
export function suggestionConfidenceLabel(c: number): string {
  return c >= 0.65 ? tr('l8.mu.confMid') : tr('l8.mu.confLow');
}
