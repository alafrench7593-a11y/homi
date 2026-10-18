/**
 * Organisation de l'application selon le parcours choisi :
 * accueil, actions rapides, catégories d'outils, articles et espaces de communauté suggérés.
 */
import type { IconName } from '@/components/ui';
import type { Journey } from '@/lib/types';
import { formatTime, localeTag, t as tr } from '@/i18n';

export type MainJourney = 'avoid' | 'ttc' | 'cycle' | 'pregnant' | 'mother' | 'family';

export interface JourneyOption { key: Journey; main: MainJourney; label: string; icon: IconName; hint: string }
const JOURNEY_DEFS: { key: Exclude<Journey, 'child'>; main: MainJourney; icon: IconName }[] = [
  { key: 'avoid', main: 'avoid', icon: 'shield' },
  { key: 'ttc', main: 'ttc', icon: 'sunrise' },
  { key: 'cycle', main: 'cycle', icon: 'calendar' },
  { key: 'pregnant', main: 'pregnant', icon: 'moon' },
  { key: 'newborn', main: 'mother', icon: 'heart' },
  { key: 'family', main: 'family', icon: 'users' },
];

/** Parcours proposés, dans la langue active (calculés à l'appel : jamais figés au chargement du module). */
export function journeyOptions(): JourneyOption[] {
  return JOURNEY_DEFS.map((d) => ({ ...d, label: tr(`journey.${d.key}` as const), hint: tr(`journey.${d.key}.hint` as const) }));
}

/** Centres d'intérêt facultatifs (profiles.interests). */
export type Interest = 'health' | 'community';
export const INTERESTS: { key: Interest; icon: IconName }[] = [
  { key: 'health', icon: 'activity' },
  { key: 'community', icon: 'users' },
];
export const interestLabel = (k: Interest) => tr(`interest.${k}` as const);
export const interestHint = (k: Interest) => tr(`interest.${k}.hint` as const);

/** Parcours « principaux » actifs (l'ancien parcours « child » compte comme « maman »). */
export function mainJourneys(journeys: Journey[] | undefined | null): MainJourney[] {
  const out = new Set<MainJourney>();
  for (const j of journeys ?? []) {
    if (j === 'avoid') out.add('avoid');
    else if (j === 'ttc') out.add('ttc');
    else if (j === 'cycle') out.add('cycle');
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
        { icon: 'search', label: 'Comprendre mon cycle et mes tests', sub: 'Glaire, photo de test, calendrier privé', href: '/fertility/understand' },
        { icon: 'check-circle', label: 'Tests', sub: 'Ovulation et grossesse', href: '/fertility/log' },
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
  if (m.includes('cycle') && !m.includes('ttc') && !m.includes('avoid')) {
    cats.push({
      key: 'cycle', title: 'Mon cycle', items: [
        { icon: 'calendar', label: 'Mon cycle', sub: 'Règles, symptômes, estimations', href: '/cycle' },
        { icon: 'bell', label: 'Rappels', href: '/settings/reminders' },
        { icon: 'users', label: 'Communauté', href: '/(tabs)/community?space=fertilite' },
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
        { icon: 'heart', label: 'Après la naissance', sub: 'Point du jour, soutien', href: '/postpartum' },
        { icon: 'users', label: 'Soutenir ma partenaire', sub: 'Espace conjoint', href: '/postpartum/partner' },
        { icon: 'feather', label: 'Récupération physique', href: '/me' },
        { icon: 'activity', label: 'Rééducation', href: '/library?q=rééducation' },
        { icon: 'smile', label: 'Santé mentale', sub: 'Humeur, aide 24 h/24', href: '/me/mood' },
        { icon: 'message-circle', label: 'Questions', href: '/(tabs)/ask' },
        { icon: 'users', label: 'Communauté parents', href: '/(tabs)/community?space=parents-bebes' },
      ],
    });
  }
  cats.push({
    key: 'all', title: 'Pour tout le monde', items: [
      { icon: 'check-square', label: 'Organisation familiale', sub: 'Tâches, relais, routines', href: '/family' },
      { icon: 'calendar', label: 'Agenda familial', sub: 'Jour, semaine, mois', href: '/calendar' },
      { icon: 'wind', label: 'Journée difficile', sub: 'L’essentiel seulement', href: '/family/difficult' },
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
  if (m.includes('cycle')) return ['period', 'mood', 'mysleep', 'appointment'];
  if (m.includes('mother')) return ['mysleep', 'mood', 'appointment'];
  return ['mood', 'mysleep', 'appointment'];
}

/** Questions suggérées à l'assistant selon le parcours. */
export const SPACE_FOR: Record<MainJourney, string> = {
  avoid: 'eviter-grossesse', ttc: 'projet-bebe', cycle: 'fertilite', pregnant: 'grossesse', mother: 'parents-bebes', family: 'familles-nombreuses',
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

const at = (hour: number, minute = 0) => formatTime(new Date(2026, 0, 5, hour, minute));
/** Jour de semaine ISO (1 = lundi) dans la langue active. */
const weekday = (iso: number) => new Intl.DateTimeFormat(localeTag(), { weekday: 'long' }).format(new Date(2026, 0, 4 + iso));

/** Libellés et textes des rappels dans la langue active au moment de leur création. */
export function reminderSuggestions(journeys: Journey[]): ReminderSuggestion[] {
  const m = mainJourneys(journeys);
  const out: ReminderSuggestion[] = [];
  const mk = (key: string, k: 'pill' | 'observe' | 'vitamins' | 'weight' | 'mysleep' | 'mood', category: ReminderSuggestion['category'], schedule: ReminderSuggestion['schedule'], deep_link: string): ReminderSuggestion => ({
    key, category, schedule, deep_link,
    label: tr(`rem.${k}.label` as const, { time: at(schedule.hour, schedule.minute), day: schedule.type === 'weekly' ? weekday(schedule.weekdays[0]) : '' }),
    title: tr(`rem.${k}.title` as const),
    body: tr(`rem.${k}.body` as const),
  });
  if (m.includes('avoid')) out.push(mk('pill', 'pill', 'medication', { type: 'daily', hour: 21, minute: 0 }, '/contraception'));
  if (m.includes('ttc')) out.push(mk('ttc-observe', 'observe', 'tracking', { type: 'daily', hour: 8, minute: 0 }, '/fertility/body'));
  if (m.includes('cycle') && !m.includes('ttc') && !m.includes('avoid')) out.push(mk('cycle-observe', 'observe', 'tracking', { type: 'daily', hour: 8, minute: 0 }, '/cycle'));
  if (m.includes('pregnant')) {
    out.push(mk('vitamins', 'vitamins', 'medication', { type: 'daily', hour: 9, minute: 0 }, '/me'));
    out.push(mk('weight', 'weight', 'tracking', { type: 'weekly', weekdays: [1], hour: 8, minute: 0 }, '/pregnancy/weight'));
  }
  if (m.includes('mother') || m.includes('pregnant')) {
    out.push(mk('mysleep', 'mysleep', 'tracking', { type: 'daily', hour: 9, minute: 30 }, '/me/sleep'));
    out.push(mk('mood', 'mood', 'custom', { type: 'weekly', weekdays: [7], hour: 18, minute: 0 }, '/me/mood'));
  }
  return out;
}
