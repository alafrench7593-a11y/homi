/** Bibliothèque d'histoires HOMI : types partagés par les textes de chaque langue. */
export const STORY_IDS = [
  'petite_lune', 'chaussettes', 'nuage_doudou', 'canard_bain',
  'escargot', 'phare', 'renard_pomme', 'bottes_jaunes',
  'carte_grenier', 'robot_fleur', 'dragon_timide', 'bibliotheque',
] as const;
export type StoryId = (typeof STORY_IDS)[number];
export type StoryBand = '2-4' | '4-6' | '6-10';
export interface StoryText { title: string; paras: string[] }
/** Une langue fournit EXACTEMENT les mêmes histoires que le français (contrôlé par le compilateur). */
export type StoryTexts = Record<StoryId, StoryText>;
