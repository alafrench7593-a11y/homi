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
  /** Parcours auquel le rappel appartient : il s'arrête quand ce parcours est archivé. */
  journey_type: 'avoid' | 'ttc' | 'cycle' | 'pregnancy' | null;
}

const at = (hour: number, minute = 0) => formatTime(new Date(2026, 0, 5, hour, minute));
/** Jour de semaine ISO (1 = lundi) dans la langue active. */
const weekday = (iso: number) => new Intl.DateTimeFormat(localeTag(), { weekday: 'long' }).format(new Date(2026, 0, 4 + iso));

/** Libellés et textes des rappels dans la langue active au moment de leur création. */
export function reminderSuggestions(journeys: Journey[]): ReminderSuggestion[] {
  const m = mainJourneys(journeys);
  const out: ReminderSuggestion[] = [];
  const mk = (key: string, k: 'pill' | 'observe' | 'vitamins' | 'weight' | 'mysleep' | 'mood', category: ReminderSuggestion['category'], schedule: ReminderSuggestion['schedule'], deep_link: string, journey_type: ReminderSuggestion['journey_type'] = null): ReminderSuggestion => ({
    key, category, schedule, deep_link, journey_type,
    label: tr(`rem.${k}.label` as const, { time: at(schedule.hour, schedule.minute), day: schedule.type === 'weekly' ? weekday(schedule.weekdays[0]) : '' }),
    title: tr(`rem.${k}.title` as const),
    body: tr(`rem.${k}.body` as const),
  });
  if (m.includes('avoid')) out.push(mk('pill', 'pill', 'medication', { type: 'daily', hour: 21, minute: 0 }, '/contraception', 'avoid'));
  if (m.includes('ttc')) out.push(mk('ttc-observe', 'observe', 'tracking', { type: 'daily', hour: 8, minute: 0 }, '/fertility/body', 'ttc'));
  if (m.includes('cycle') && !m.includes('ttc') && !m.includes('avoid')) out.push(mk('cycle-observe', 'observe', 'tracking', { type: 'daily', hour: 8, minute: 0 }, '/cycle', 'cycle'));
  if (m.includes('pregnant')) {
    out.push(mk('vitamins', 'vitamins', 'medication', { type: 'daily', hour: 9, minute: 0 }, '/me', 'pregnancy'));
    out.push(mk('weight', 'weight', 'tracking', { type: 'weekly', weekdays: [1], hour: 8, minute: 0 }, '/pregnancy/weight', 'pregnancy'));
  }
  if (m.includes('mother') || m.includes('pregnant')) {
    out.push(mk('mysleep', 'mysleep', 'tracking', { type: 'daily', hour: 9, minute: 30 }, '/me/sleep'));
    out.push(mk('mood', 'mood', 'custom', { type: 'weekly', weekdays: [7], hour: 18, minute: 0 }, '/me/mood'));
  }
  return out;
}
