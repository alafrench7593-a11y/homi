/**
 * Couleurs HOMI des fonctionnalités (13/11/2026) : remplacent le rose poudré, la pêche et le cuivre doré
 * d'« Au fil de nous ». Les écrans passent d'abord par le thème (`useTheme()`) ; ce fichier ne garde que ce que
 * le thème ne porte pas : teintes de décor (halos, ciels illustrés) et couleurs SÉMANTIQUES des catégories
 * (sommeil, repas, couche…), harmonisées avec la marque (lilas, champagne, bleu nuit, vert sauge, framboise).
 *
 * Encres « ink » : texte et pictogrammes sur fond clair, ≥ 4,5:1 sur blanc et sur l'ivoire (#F4F1EB).
 * Lueurs « glow » : les mêmes catégories sur fond sombre (graphite), ≥ 4,5:1 sur #0D0E11.
 */

/**
 * Couleurs fixes pour les dessins qui n'ont pas accès au thème (HOMI v2 : graphite, ivoire, palette Aurore par
 * défaut). Les écrans doivent préférer `useTheme()` (`theme.tokens`), qui suit la palette choisie (Auto comprise).
 * Les anciens noms (midnight, prune, lilac, champagne) sont conservés pour ne rien casser, mais réalignés.
 */
export const HOMI = {
  midnight: '#0D0E11', // graphite
  midnightSoft: '#1E1F25',
  midnightDeep: '#0A0B0D',
  ink: '#1C1B20',
  inkSoft: '#55525C',
  prune: '#5E36C4', // violet d'Aurore (encre : texte blanc ≥ 7:1)
  pruneSoft: '#7B5BD6',
  lilac: '#C4B2FF', // violet d'Aurore (lueur)
  lilacPale: '#E6E1F7',
  lilacInk: '#5E36C4',
  champagne: '#E9C987', // ambre doux (soleil, étoiles)
  champagnePale: '#F6ECDA',
  champagneInk: '#7A5212',
  pearl: '#F3F2F5',
  pearlBg: '#F4F1EB', // ivoire
  white: '#FFFFFF',
  /** Lumière d'étoile et de lune (nuit) : blanc très légèrement chaud, jamais jaune vif. */
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
  appointment: '#5E36C4', // violet d'Aurore
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

/** Voiles de verre HOMI (cartes illustrées) : ivoire le jour, graphite fumé le soir (v2). */
export const HOMI_WASH = {
  day: ['rgba(250,248,244,0.8)', 'rgba(230,240,248,0.55)', 'rgba(238,232,250,0.5)'] as [string, string, string],
  night: ['rgba(30,31,37,0.82)', 'rgba(23,24,28,0.6)', 'rgba(13,14,17,0.78)'] as [string, string, string],
};

/**
 * Dégradé des pastilles pleines portant du texte ou une icône blanche (hors thème) : encres d'Aurore, cyan → violet.
 * Les composants thématisés utilisent `theme.material.primaryGradient` (palette choisie).
 */
export const HOMI_FILL: [string, string, string] = ['#0A6176', '#34479F', '#5E36C4'];

/** Avatars à initiales : tonalité douce HOMI stable par identifiant (initiales en encre #1C1B20, ≥ 7:1). */
const INITIALS = ['#C4B2FF', '#E9C987', '#A8E6D8', '#F7C4DC', '#B7DDF5', '#C8CCFA'];
export function homiInitialsColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return INITIALS[h % INITIALS.length];
}
