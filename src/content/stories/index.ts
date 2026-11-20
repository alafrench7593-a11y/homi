/**
 * Bibliothèque d'histoires HOMI (outil 134) : 12 histoires courtes originales, écrites à l'avance pour HOMI
 * (rédaction : Claude, Anthropic, 28/11/2026), par tranche d'âge 2–4, 4–6 et 6–10 ans, en français puis traduites en
 * anglais, allemand, espagnol et italien. Ton doux, sans contenu effrayant. Aucune génération à la demande.
 */
import { STORIES_FR } from './fr';
import { STORIES_EN } from './en';
import { STORIES_DE } from './de';
import { STORIES_ES } from './es';
import { STORIES_IT } from './it';
import { STORY_IDS, type StoryBand, type StoryId, type StoryText, type StoryTexts } from './types';

export { STORY_IDS, type StoryBand, type StoryId, type StoryText };

export interface StoryMeta { id: StoryId; band: StoryBand; icon: 'moon' | 'sun' | 'cloud' | 'droplet' | 'feather' | 'navigation' | 'gift' | 'umbrella' | 'map' | 'cpu' | 'wind' | 'book-open' }
export const STORIES: StoryMeta[] = [
  { id: 'petite_lune', band: '2-4', icon: 'moon' },
  { id: 'chaussettes', band: '2-4', icon: 'gift' },
  { id: 'nuage_doudou', band: '2-4', icon: 'cloud' },
  { id: 'canard_bain', band: '2-4', icon: 'droplet' },
  { id: 'escargot', band: '4-6', icon: 'feather' },
  { id: 'phare', band: '4-6', icon: 'navigation' },
  { id: 'renard_pomme', band: '4-6', icon: 'sun' },
  { id: 'bottes_jaunes', band: '4-6', icon: 'umbrella' },
  { id: 'carte_grenier', band: '6-10', icon: 'map' },
  { id: 'robot_fleur', band: '6-10', icon: 'cpu' },
  { id: 'dragon_timide', band: '6-10', icon: 'wind' },
  { id: 'bibliotheque', band: '6-10', icon: 'book-open' },
];
export const STORY_BANDS: StoryBand[] = ['2-4', '4-6', '6-10'];

const TEXTS: Record<string, StoryTexts> = { fr: STORIES_FR, en: STORIES_EN, de: STORIES_DE, es: STORIES_ES, it: STORIES_IT };
export function storyText(id: StoryId, lang: string): StoryText {
  return (TEXTS[lang] ?? STORIES_FR)[id];
}
export const isStoryId = (s: string | null | undefined): s is StoryId => !!s && (STORY_IDS as readonly string[]).includes(s);

/** Durée de lecture à voix haute, arrondie à la minute (≈ 110 mots par minute pour un enfant qui écoute). */
export function readingMinutes(t: StoryText): number {
  const words = t.paras.join(' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 110));
}

/** Clé de traduction d'une tranche d'âge (« st.band.b2_4 »…). */
export const bandKey = (b: StoryBand) => `st.band.b${b.replace('-', '_')}` as const;

/** Tranche d'âge conseillée pour un âge en mois (null = toutes). */
export function bandForMonths(months: number | null): StoryBand | null {
  if (months == null) return null;
  if (months < 48) return '2-4';
  if (months < 72) return '4-6';
  return '6-10';
}
