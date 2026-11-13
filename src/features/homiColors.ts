/**
 * Couleurs HOMI des fonctionnalités (13/11/2026) : remplacent le rose poudré, la pêche et le cuivre doré
 * d'« Au fil de nous ». Les écrans passent d'abord par le thème (`useTheme()`) ; ce fichier ne garde que ce que
 * le thème ne porte pas : teintes de décor (halos, ciels illustrés) et couleurs SÉMANTIQUES des catégories
 * (sommeil, repas, couche…), harmonisées avec la marque (lilas, champagne, bleu nuit, vert sauge, framboise).
 *
 * Encres « ink » : texte et pictogrammes sur fond clair, ≥ 4,5:1 sur blanc et sur la perle (#F4F0FA).
 * Lueurs « glow » : les mêmes catégories sur fond sombre (Minuit), ≥ 4,5:1 sur #16112B.
 */

/** Palette de marque (identique à src/theme/tokens.ts, pour les dessins qui n'ont pas accès au thème). */
export const HOMI = {
  midnight: '#16112B',
  midnightSoft: '#261C4A',
  midnightDeep: '#0F0B1E',
  ink: '#1C1533',
  inkSoft: '#584D72',
  prune: '#5B2A86',
  pruneSoft: '#7A4FB0',
  lilac: '#CDBEFA',
  lilacPale: '#E4DAFB',
  lilacInk: '#5E44A8',
  champagne: '#E9CFA4',
  champagnePale: '#F6ECDA',
  champagneInk: '#76561D',
  pearl: '#F7F4FB',
  pearlBg: '#F4F0FA',
  white: '#FFFFFF',
  /** Lumière d'étoile et de lune (nuit) : perle très légèrement champagne, jamais jaune vif. */
  starlight: '#F6EFE4',
} as const;

/** Catégories du suivi : une couleur par sorte d'événement, distincte des autres. */
export type HomiCategory =
  | 'sleep' | 'wake' | 'bottle' | 'breastfeed' | 'meal' | 'diaper' | 'medication' | 'appointment'
  | 'symptom' | 'note' | 'growth' | 'pumping' | 'feel' | 'mother_sleep' | 'weight' | 'reminder';

export const CATEGORY_INK: Record<HomiCategory, string> = {
  sleep: '#5E44A8', // lilas encre
  wake: '#76561D', // champagne encre (soleil du réveil)
  bottle: '#1C6672', // bleu lait
  breastfeed: '#A8346A', // framboise (cœur)
  meal: '#286B40', // vert sauge
  diaper: '#2A609C', // bleu
  medication: '#4B3FB0', // indigo
  appointment: '#5B2A86', // prune
  symptom: '#8A5A0E', // ambre : attention, sans alarme
  note: '#5E5873', // gris lilas
  growth: '#4A6E2A', // vert mousse
  pumping: '#8A3F9A', // mauve
  feel: '#A8346A',
  mother_sleep: '#3F4FA8',
  weight: '#4F5E70',
  reminder: '#5E44A8',
};

export const CATEGORY_GLOW: Record<HomiCategory, string> = {
  sleep: '#B9A8FF',
  wake: '#EBD3A6',
  bottle: '#9ED6DE',
  breastfeed: '#FF9CC3',
  meal: '#9EDDB2',
  diaper: '#A8CCFF',
  medication: '#C5B8FF',
  appointment: '#D9C8FF',
  symptom: '#F2D49A',
  note: '#D9CCE6',
  growth: '#BFE0A4',
  pumping: '#E8B8F2',
  feel: '#FF9CC3',
  mother_sleep: '#B3BEFF',
  weight: '#C9D3E0',
  reminder: '#CDBEFA',
};

/** Encre ou lueur selon le fond. */
export const categoryColor = (k: HomiCategory, dark: boolean): string => (dark ? CATEGORY_GLOW[k] : CATEGORY_INK[k]);

/** Voiles de verre HOMI (cartes illustrées) : perle et lilas le jour, midnight violet le soir. */
export const HOMI_WASH = {
  day: ['rgba(244,240,250,0.78)', 'rgba(228,218,251,0.55)', 'rgba(246,236,218,0.5)'] as [string, string, string],
  night: ['rgba(38,28,74,0.78)', 'rgba(91,42,134,0.5)', 'rgba(22,17,43,0.72)'] as [string, string, string],
};

/**
 * Dégradé des boutons et pastilles pleines portant du texte ou une icône blanche : prune → midnight violet.
 * (Le dégradé signature NACRE commence en champagne : un texte blanc n'y est pas lisible.)
 */
export const HOMI_FILL: [string, string, string] = ['#7A4FB0', '#5B2A86', '#3E2370'];

/** Avatars à initiales : tonalité douce HOMI stable par identifiant (initiales en encre #1C1533, ≥ 7:1). */
const INITIALS = ['#CDBEFA', '#E9CFA4', '#B5D3BE', '#D3B3E3', '#BCD0F0', '#B9AEDB'];
export function homiInitialsColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return INITIALS[h % INITIALS.length];
}
