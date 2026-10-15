/**
 * Organisation de l'application selon le parcours choisi :
 * accueil, actions rapides, catégories d'outils, articles et espaces de communauté suggérés.
 */
import type { IconName } from '@/components/ui';
import type { Journey } from '@/lib/types';

export type MainJourney = 'avoid' | 'ttc' | 'pregnant' | 'mother' | 'family';

export const JOURNEY_OPTIONS: { key: Journey; main: MainJourney; label: string; icon: IconName; hint: string }[] = [
  { key: 'avoid', main: 'avoid', label: 'Je souhaite éviter une grossesse', icon: 'shield', hint: 'Cycle, contraception, rappels' },
  { key: 'ttc', main: 'ttc', label: 'J’essaie d’avoir un enfant', icon: 'sunrise', hint: 'Cycle, période fertile estimée, tests' },
  { key: 'pregnant', main: 'pregnant', label: 'Je suis enceinte', icon: 'moon', hint: 'Semaine après semaine' },
  { key: 'newborn', main: 'mother', label: 'Je suis maman', icon: 'heart', hint: 'Bébé ou enfant, post-partum' },
  { key: 'family', main: 'family', label: 'Je souhaite suivre plusieurs enfants', icon: 'users', hint: 'Fratrie, jumeaux, triplés' },
];

/** Parcours « principaux » actifs (l'ancien parcours « child » compte comme « maman »). */
export function mainJourneys(journeys: Journey[] | undefined | null): MainJourney[] {
  const out = new Set<MainJourney>();
  for (const j of journeys ?? []) {
    if (j === 'avoid') out.add('avoid');
    else if (j === 'ttc') out.add('ttc');
    else if (j === 'pregnant') out.add('pregnant');
    else if (j === 'newborn' || j === 'child') out.add('mother');
    else if (j === 'family') { out.add('family'); out.add('mother'); }
  }
  return [...out];
}

export interface ToolItem { icon: IconName; label: string; sub?: string; href: string }
export interface ToolCategory { key: string; title: string; items: ToolItem[] }

interface Ctx { journeys: Journey[]; hasPregnancy: boolean; childId?: string; childCount: number }

/** Catégories d'outils affichées dans « Tous mes outils », uniquement celles qui concernent la personne. */
export function toolCategories({ journeys, hasPregnancy, childId, childCount }: Ctx): ToolCategory[] {
  const m = mainJourneys(journeys);
  const cats: ToolCategory[] = [{
    key: 'scanner', title: 'Scanner', items: [
      { icon: 'maximize', label: 'Scanner un produit', sub: 'Crème, lingettes, lessive…', href: '/scanner/product' },
      { icon: 'search', label: 'Scanner un aliment', sub: 'Puis-je manger ou donner ?', href: '/scanner/food' },
      { icon: 'clock', label: 'Historique et favoris', href: '/scanner/history' },
      { icon: 'columns', label: 'Comparer deux produits', href: '/scanner/compare' },
    ],
  }];
  const child = (tab?: string) => (childId ? `/child/${childId}${tab ? `?tab=${tab}` : ''}` : '/profiles/new?kind=child');

  if (m.includes('ttc')) {
    cats.push({
      key: 'ttc', title: 'Projet bébé', items: [
        { icon: 'calendar', label: 'Cycle et période fertile', sub: 'Règles, ovulation estimée', href: '/fertility' },
        { icon: 'check-circle', label: 'Tests', sub: 'Ovulation et grossesse', href: '/fertility' },
        { icon: 'bell', label: 'Rappels', href: '/settings/reminders' },
        { icon: 'clipboard', label: 'Préparer une consultation', href: '/fertility' },
        { icon: 'book-open', label: 'Articles sur la conception', href: '/library?q=conception' },
        { icon: 'users', label: 'Communauté Projet bébé', href: '/(tabs)/community?space=projet-bebe' },
      ],
    });
  }
  if (m.includes('avoid')) {
    cats.push({
      key: 'avoid', title: 'Éviter une grossesse', items: [
        { icon: 'calendar', label: 'Mon cycle', sub: 'Règles, symptômes, estimations', href: '/contraception' },
        { icon: 'shield', label: 'Contraception', sub: 'Moyens et rappels', href: '/contraception' },
        { icon: 'alert-circle', label: 'Contraception d’urgence', href: '/contraception' },
        { icon: 'clipboard', label: 'Préparer une consultation', href: '/contraception' },
        { icon: 'users', label: 'Communauté', href: '/(tabs)/community?space=eviter-grossesse' },
      ],
    });
  }
  if (m.includes('pregnant') || hasPregnancy) {
    cats.push({
      key: 'pregnant', title: 'Ma grossesse', items: [
        { icon: 'moon', label: 'Évolution du bébé', href: '/pregnancy' },
        { icon: 'heart', label: 'Mon corps', href: '/me' },
        { icon: 'trending-up', label: 'Mon poids', href: '/pregnancy/weight' },
        { icon: 'cloud', label: 'Mon sommeil', href: '/me/sleep' },
        { icon: 'smile', label: 'Mon humeur', href: '/me/mood' },
        { icon: 'calendar', label: 'Rendez-vous et examens', href: '/appointments' },
        { icon: 'folder', label: 'Échographies et documents', href: '/documents' },
        { icon: 'book-open', label: 'Préparation à l’accouchement', href: '/library?q=accouchement' },
        { icon: 'star', label: 'Prénoms', href: '/names' },
        { icon: 'check-square', label: 'Listes', href: '/lists' },
        { icon: 'message-circle', label: 'Questions', href: '/(tabs)/ask' },
        { icon: 'users', label: 'Communauté grossesse', href: '/(tabs)/community?space=grossesse' },
      ],
    });
  }
  if (m.includes('mother') || childCount > 0) {
    cats.push({
      key: 'mother', title: childCount > 1 ? 'Mes enfants' : 'Mon bébé', items: [
        { icon: 'smile', label: childCount > 1 ? 'Mes enfants' : 'Mon bébé ou mon enfant', href: child() },
        { icon: 'clock', label: 'Minuteur biberon', sub: childCount > 1 ? 'Un minuteur par enfant' : undefined, href: childId ? `/bottle/${childId}` : '/bottle' },
        { icon: 'coffee', label: 'Biberons et allaitement', href: '/(tabs)/track' },
        { icon: 'bar-chart-2', label: 'Historique des biberons', href: childId ? `/bottle/history?child=${childId}` : '/bottle/history' },
        { icon: 'feather', label: 'Repas et diversification', href: child('foods') },
        { icon: 'wind', label: 'Couches', href: '/(tabs)/track' },
        { icon: 'moon', label: 'Sommeil du bébé', href: '/night' },
        { icon: 'trending-up', label: 'Croissance', href: child('growth') },
        { icon: 'circle', label: 'Dents', href: childId ? `/teeth?child=${childId}` : '/teeth' },
        { icon: 'calendar', label: 'Rendez-vous', href: '/appointments' },
        { icon: 'folder', label: 'Documents', href: '/documents' },
      ],
    });
    cats.push({
      key: 'me', title: 'Pour moi', items: [
        { icon: 'cloud', label: 'Mon propre sommeil', href: '/me/sleep' },
        { icon: 'heart', label: 'Post-partum', href: '/me' },
        { icon: 'activity', label: 'Rééducation', href: '/library?q=rééducation' },
        { icon: 'smile', label: 'Santé mentale', sub: 'Humeur, aide 24 h/24', href: '/me/mood' },
        { icon: 'message-circle', label: 'Questions', href: '/(tabs)/ask' },
        { icon: 'users', label: 'Communauté parents', href: '/(tabs)/community?space=parents-bebes' },
      ],
    });
  }
  cats.push({
    key: 'all', title: 'Pour tout le monde', items: [
      { icon: 'book-open', label: 'Bibliothèque', sub: 'Articles sourcés', href: '/library' },
      { icon: 'bell', label: 'Rappels', href: '/settings/reminders' },
      { icon: 'life-buoy', label: 'Urgences', sub: '15 · 112 · 3114', href: '/emergency' },
    ],
  });
  return cats;
}

export type QuickKey = 'bottle' | 'breastfeed' | 'diaper' | 'sleep' | 'meal' | 'question' | 'mood' | 'weight' | 'period' | 'test' | 'pill' | 'mysleep' | 'appointment';

/** 3 ou 4 actions rapides selon la situation affichée. */
export function quickActionsFor(subject: 'pregnancy' | 'child' | 'me' | 'family', journeys: Journey[]): QuickKey[] {
  const m = mainJourneys(journeys);
  if (subject === 'child' || subject === 'family') return ['bottle', 'diaper', 'sleep', 'meal'];
  if (subject === 'pregnancy') return ['weight', 'mood', 'mysleep', 'appointment'];
  if (m.includes('ttc')) return ['period', 'test', 'mood', 'appointment'];
  if (m.includes('avoid')) return ['period', 'pill', 'mood', 'appointment'];
  if (m.includes('mother')) return ['mysleep', 'mood', 'appointment'];
  return ['mood', 'mysleep', 'appointment'];
}

/** Questions suggérées à l'assistant selon le parcours. */
export const SPACE_FOR: Record<MainJourney, string> = {
  avoid: 'eviter-grossesse', ttc: 'projet-bebe', pregnant: 'grossesse', mother: 'parents-bebes', family: 'familles-nombreuses',
};

/** Article du jour : stable pour une journée, tiré des suggestions. */
export function articleOfDay<T>(list: T[], date = new Date()): T | undefined {
  if (!list.length) return undefined;
  const day = Math.floor(date.getTime() / 86_400_000);
  return list[day % list.length];
}

/** Rappels proposés selon le parcours (jamais créés sans l'accord de l'utilisatrice). */
export interface ReminderSuggestion {
  key: string;
  label: string;
  category: 'medication' | 'tracking' | 'custom';
  title: string;
  body: string;
  schedule: { type: 'daily'; hour: number; minute: number } | { type: 'weekly'; weekdays: (1 | 2 | 3 | 4 | 5 | 6 | 7)[]; hour: number; minute: number };
  deep_link: string;
}

export function reminderSuggestions(journeys: Journey[]): ReminderSuggestion[] {
  const m = mainJourneys(journeys);
  const out: ReminderSuggestion[] = [];
  if (m.includes('avoid')) {
    out.push({ key: 'pill', label: 'Prendre ma contraception (chaque jour à 21 h)', category: 'medication', title: 'Contraception', body: 'C’est l’heure prévue pour votre contraception.', schedule: { type: 'daily', hour: 21, minute: 0 }, deep_link: '/contraception' });
  }
  if (m.includes('ttc')) {
    out.push({ key: 'ttc-observe', label: 'Noter mes observations du matin (8 h)', category: 'tracking', title: 'Observations du jour', body: 'Température, glaire ou symptômes : notez ce que vous souhaitez.', schedule: { type: 'daily', hour: 8, minute: 0 }, deep_link: '/fertility/body' });
  }
  if (m.includes('pregnant')) {
    out.push({ key: 'vitamins', label: 'Mes vitamines prescrites (9 h)', category: 'medication', title: 'Vitamines', body: 'Pensez à vos vitamines, si elles vous ont été prescrites.', schedule: { type: 'daily', hour: 9, minute: 0 }, deep_link: '/me' });
    out.push({ key: 'weight', label: 'Mon poids, une fois par semaine (lundi 8 h)', category: 'tracking', title: 'Mon poids', body: 'Si vous le souhaitez, notez votre poids de la semaine.', schedule: { type: 'weekly', weekdays: [1], hour: 8, minute: 0 }, deep_link: '/pregnancy/weight' });
  }
  if (m.includes('mother') || m.includes('pregnant')) {
    out.push({ key: 'mysleep', label: 'Noter ma nuit (9 h 30)', category: 'tracking', title: 'Mon sommeil', body: 'Comment s’est passée votre nuit ?', schedule: { type: 'daily', hour: 9, minute: 30 }, deep_link: '/me/sleep' });
    out.push({ key: 'mood', label: 'Comment je me sens (dimanche 18 h)', category: 'custom', title: 'Comment te sens-tu ?', body: 'Un bilan privé et facultatif, quelques secondes.', schedule: { type: 'weekly', weekdays: [7], hour: 18, minute: 0 }, deep_link: '/me/mood' });
  }
  return out;
}
