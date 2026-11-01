/**
 * « Mon sommeil » — calculs purs pour le carnet de sommeil du parent.
 * Descriptif uniquement : aucune cible, aucune « norme », aucun diagnostic.
 */
import { t as tr, getLocale } from '@/i18n';
import { localized } from '@/i18n/localized';
import { addDays, daysBetween, type ISODate, parseISODate } from './dates';
import type { Nap, NightWaking, ParentSleepLog } from '../types-sleep';

const MIN_PER_DAY = 1440;

// ---------------------------------------------------------------- heures et durées
/** « 22:30 », « 22h30 », « 22h », « 7 », « 07.05 » -> minutes depuis minuit, ou null. */
export function parseHHMM(input: string | null | undefined): number | null {
  if (!input) return null;
  const m = input.trim().toLowerCase().match(/^(\d{1,2})(?:\s*[:h.]\s*(\d{2})?)?$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = m[2] ? Number(m[2]) : 0;
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export function formatHHMM(minutes: number): string {
  const m = ((Math.round(minutes) % MIN_PER_DAY) + MIN_PER_DAY) % MIN_PER_DAY;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** Heure locale « HH:MM » d'un horodatage ISO. */
export function timeOfIso(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return formatHHMM(d.getHours() * 60 + d.getMinutes());
}

/** Durée saisie : « 7h30 », « 7:30 », « 7 h 05 », « 7 », « 6,5 » -> minutes, ou null. */
export function parseDuration(input: string | null | undefined): number | null {
  if (!input) return null;
  const s = input.trim().toLowerCase().replace(/\s+/g, '');
  if (!s) return null;
  let m = s.match(/^(\d{1,4})min$/);
  if (m) {
    const total = Number(m[1]);
    return total <= MIN_PER_DAY ? total : null;
  }
  m = s.match(/^(\d{1,2})(?:[:h](\d{1,2})?)?(?:min)?$/);
  if (m) {
    const h = Number(m[1]);
    const min = m[2] ? Number(m[2]) : 0;
    if (min > 59) return null;
    const total = h * 60 + min;
    return total <= MIN_PER_DAY ? total : null;
  }
  m = s.match(/^(\d{1,2})[,.](\d{1,2})$/);
  if (m) {
    const total = Math.round(Number(`${m[1]}.${m[2]}`) * 60);
    return total <= MIN_PER_DAY ? total : null;
  }
  return null;
}

/** Durée pour un champ de saisie : 450 -> « 7h30 ». */
export function durationInput(minutes: number | null | undefined): string {
  if (minutes == null) return '';
  const m = Math.max(0, Math.round(minutes));
  return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`;
}

const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

/** « Nuit du 14 au 15 octobre », « Nuit du 31 octobre au 1er novembre ». */
export function nightLabel(logDate: ISODate): string {
  const end = parseISODate(logDate);
  const start = parseISODate(addDays(logDate, -1));
  const en = getLocale() === 'en';
  const MONTHS = en ? MONTHS_EN : MONTHS_FR;
  const day = (d: Date) => (!en && d.getUTCDate() === 1 ? '1er' : String(d.getUTCDate()));
  const sameMonth = start.getUTCMonth() === end.getUTCMonth();
  return tr('l1.sleep.nightLabel', { from: `${day(start)}${sameMonth ? '' : ` ${MONTHS[start.getUTCMonth()]}`}`, to: `${day(end)} ${MONTHS[end.getUTCMonth()]}` });
}

/**
 * Place le coucher et le réveil dans le temps. Le réveil est le jour `logDate` ;
 * le coucher est la veille s'il est « après » l'heure du réveil (22:30 -> 07:00),
 * sinon le même jour (01:00 -> 07:00).
 */
export function resolveNight(logDate: ISODate, bed: string, wake: string): { bedtime: Date; wake: Date } | null {
  const b = parseHHMM(bed);
  const w = parseHHMM(wake);
  if (b == null || w == null || b === w) return null;
  const [y, mo, d] = logDate.split('-').map(Number);
  const wakeAt = new Date(y, mo - 1, d, Math.floor(w / 60), w % 60);
  const bedDay = b > w ? -1 : 0;
  const bedAt = new Date(y, mo - 1, d + bedDay, Math.floor(b / 60), b % 60);
  return { bedtime: bedAt, wake: wakeAt };
}

export function spanMinutes(bedtime: string | Date | null | undefined, wake: string | Date | null | undefined): number | null {
  if (!bedtime || !wake) return null;
  const diff = (new Date(wake).getTime() - new Date(bedtime).getTime()) / 60_000;
  return Number.isFinite(diff) && diff > 0 && diff <= MIN_PER_DAY ? Math.round(diff) : null;
}

/** Total des périodes d'éveil renseignées (en minutes). */
export function wakingMinutes(details: NightWaking[] | null | undefined): number {
  return (details ?? []).reduce((s, w) => s + (w.minutes != null && Number.isFinite(w.minutes) && w.minutes > 0 ? w.minutes : 0), 0);
}

/** Durée approximative : temps au lit moins les éveils renseignés. */
export function estimateSleepMinutes(bedtime: string | Date | null | undefined, wake: string | Date | null | undefined, details: NightWaking[] | null | undefined): number | null {
  const span = spanMinutes(bedtime, wake);
  if (span == null) return null;
  return Math.max(0, span - wakingMinutes(details));
}

/** Durée d'une sieste (0 si incomplète ou incohérente). */
export function napMinutes(nap: Nap): number {
  const s = parseHHMM(nap.start);
  const e = parseHHMM(nap.end);
  if (s == null || e == null || e <= s) return 0;
  return e - s;
}

export function totalNapMinutes(naps: Nap[] | null | undefined): number {
  return (naps ?? []).reduce((s, n) => s + napMinutes(n), 0);
}

/** Durée retenue pour une nuit : la saisie (ou correction) sinon l'estimation. */
export function nightMinutes(log: Pick<ParentSleepLog, 'sleep_minutes' | 'bedtime' | 'wake_time' | 'waking_details'>): number | null {
  if (log.sleep_minutes != null) return log.sleep_minutes;
  return estimateSleepMinutes(log.bedtime, log.wake_time, log.waking_details);
}

// ---------------------------------------------------------------- formulaire
export interface SleepForm {
  logDate: ISODate;
  bed: string;
  wake: string;
  wakings: string;
  details: { at: string; minutes: string }[];
  duration: string;
  durationEdited: boolean;
  naps: Nap[];
}

/** Vérifie la saisie ; renvoie les erreurs (clé du champ -> message). */
export function validateSleepForm(f: SleepForm, today: ISODate): Record<string, string> {
  const e: Record<string, string> = {};
  if (f.logDate > today) e.logDate = tr('l1.sleep.err.futureDate');
  if (f.bed && parseHHMM(f.bed) == null) e.bed = tr('l1.sleep.err.bed');
  if (f.wake && parseHHMM(f.wake) == null) e.wake = tr('l1.sleep.err.wake');
  if (f.bed && f.wake && !e.bed && !e.wake && !resolveNight(f.logDate, f.bed, f.wake)) e.wake = tr('l1.sleep.err.wakeSame');
  const n = f.wakings.trim() === '' ? 0 : Number(f.wakings);
  if (!Number.isInteger(n) || n < 0 || n > 30) e.wakings = tr('l1.sleep.err.wakings');
  f.details.forEach((d, i) => {
    if (d.at && parseHHMM(d.at) == null) e[`detail${i}`] = tr('l1.sleep.err.detailTime');
    else if (d.minutes && (!/^\d{1,3}$/.test(d.minutes.trim()) || Number(d.minutes) > 600)) e[`detail${i}`] = tr('l1.sleep.err.detailMinutes');
  });
  if (f.duration && parseDuration(f.duration) == null) e.duration = tr('l1.sleep.err.duration');
  f.naps.forEach((nap, i) => {
    if (parseHHMM(nap.start) == null || parseHHMM(nap.end) == null) e[`nap${i}`] = tr('l1.sleep.err.nap');
    else if (napMinutes(nap) === 0) e[`nap${i}`] = tr('l1.sleep.err.napOrder');
  });
  return e;
}

// ---------------------------------------------------------------- résumé des 7 derniers jours
const WEEKDAYS_FR = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];
const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS = localized(WEEKDAYS_FR, WEEKDAYS_EN);

export interface WeekDay { date: ISODate; label: string; minutes: number | null }
export interface WeekSummary {
  days: WeekDay[];
  nightsLogged: number;
  avgSleepMinutes: number | null;
  napsCount: number;
  napMinutes: number;
  totalWakings: number;
  avgQuality: number | null;
  avgFatigue: number | null;
  avgMood: number | null;
}

const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);

export function logsInWindow<T extends { log_date: string }>(logs: T[], today: ISODate, days = 7): T[] {
  const from = addDays(today, -(days - 1));
  return logs.filter((l) => l.log_date >= from && l.log_date <= today);
}

/** Résumé descriptif des `days` derniers jours (aujourd'hui inclus). */
export function summarizeWeek(logs: ParentSleepLog[], today: ISODate, days = 7): WeekSummary {
  const recent = logsInWindow(logs, today, days);
  const byDate = new Map(recent.map((l) => [l.log_date, l]));
  const list: WeekDay[] = Array.from({ length: days }, (_, i) => {
    const date = addDays(today, i - (days - 1));
    const log = byDate.get(date);
    return { date, label: WEEKDAYS[parseISODate(date).getUTCDay()], minutes: log ? nightMinutes(log) : null };
  });
  const durations = list.map((d) => d.minutes).filter((m): m is number => m != null);
  const pick = (k: 'quality' | 'fatigue' | 'mood') => recent.map((l) => l[k]).filter((v): v is NonNullable<typeof v> => v != null);
  return {
    days: list,
    nightsLogged: durations.length,
    avgSleepMinutes: durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null,
    napsCount: recent.reduce((s, l) => s + (l.naps ?? []).filter((n) => napMinutes(n) > 0).length, 0),
    napMinutes: recent.reduce((s, l) => s + totalNapMinutes(l.naps), 0),
    totalWakings: recent.reduce((s, l) => s + (l.night_wakings ?? 0), 0),
    avgQuality: avg(pick('quality')),
    avgFatigue: avg(pick('fatigue')),
    avgMood: avg(pick('mood')),
  };
}

// ---------------------------------------------------------------- signaux de soutien (jamais un diagnostic)
export const VERY_HIGH_FATIGUE = 5;
export const VERY_LOW_MOOD = 1;
export const FATIGUE_STREAK_DAYS = 3;

/** Plus longue suite de jours consécutifs où la fatigue est très élevée, sur la fenêtre. */
export function fatigueStreak(logs: Pick<ParentSleepLog, 'log_date' | 'fatigue'>[], today: ISODate, days = 7): number {
  const dates = new Set(logsInWindow(logs, today, days).filter((l) => (l.fatigue ?? 0) >= VERY_HIGH_FATIGUE).map((l) => l.log_date));
  let best = 0;
  let cur = 0;
  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(today, -i);
    cur = dates.has(date) ? cur + 1 : 0;
    best = Math.max(best, cur);
  }
  return best;
}

export interface SupportSignal { show: boolean; fatigue: boolean; lowMood: boolean }

/**
 * Faut-il proposer, avec douceur, d'en parler à un professionnel ?
 * - fatigue très élevée (5/5) au moins 3 jours d'affilée sur les 7 derniers jours ;
 * - ou humeur très basse (1/5) sur les 7 derniers jours.
 */
export function supportSignal(logs: Pick<ParentSleepLog, 'log_date' | 'fatigue' | 'mood'>[], today: ISODate): SupportSignal {
  const fatigue = fatigueStreak(logs, today) >= FATIGUE_STREAK_DAYS;
  const lowMood = logsInWindow(logs, today).some((l) => l.mood != null && l.mood <= VERY_LOW_MOOD);
  return { show: fatigue || lowMood, fatigue, lowMood };
}

// ---------------------------------------------------------------- contexte et repères
export interface SleepContext { pregnant: boolean; latePregnancy: boolean; postpartum: boolean }

/** Grossesse en cours et/ou bébé de moins de 12 mois (post-partum). */
export function sleepContext(input: { journeys: string[]; activePregnancyWeeksSA: number | null; childBirthDates: ISODate[]; today: ISODate }): SleepContext {
  const pregnant = input.activePregnancyWeeksSA != null || input.journeys.includes('pregnant');
  const latePregnancy = input.activePregnancyWeeksSA != null && input.activePregnancyWeeksSA >= 28;
  const baby = input.childBirthDates.some((b) => {
    const d = daysBetween(b, input.today);
    return d >= 0 && d < 365;
  });
  return { pregnant, latePregnancy, postpartum: baby || input.journeys.includes('newborn') };
}

export interface SleepTip { key: string; icon: string; title: string; text: string }

const POSTPARTUM_TIPS_FR: SleepTip[] = [
  { key: 'sieste-bebe', icon: 'moon', title: 'Dormir quand bébé dort, quand c’est possible', text: 'S’allonger pendant une sieste de bébé compte, même 20 minutes. Le linge et la vaisselle peuvent attendre.' },
  { key: 'relais', icon: 'users', title: 'Demander un relais la nuit', text: 'Partager les nuits avec l’autre parent ou un proche (change, bercement, biberon) permet à chacun d’avoir un bloc de sommeil plus long.' },
  { key: 'aide', icon: 'gift', title: 'Accepter l’aide proposée', text: 'Un repas apporté, une course, une heure de garde : accepter, c’est aussi prendre soin de votre famille.' },
];
const POSTPARTUM_TIPS_EN: SleepTip[] = [
  { key: 'sieste-bebe', icon: 'moon', title: 'Sleep when baby sleeps, when you can', text: 'Lying down during one of baby’s naps counts, even for 20 minutes. The laundry and the washing-up can wait.' },
  { key: 'relais', icon: 'users', title: 'Ask for a night-time handover', text: 'Sharing the nights with the other parent or a relative (changing, rocking, bottle) lets each of you have a longer block of sleep.' },
  { key: 'aide', icon: 'gift', title: 'Accept the help you are offered', text: 'A meal brought round, an errand, an hour of childcare: accepting is also a way of looking after your family.' },
];
const POSTPARTUM_TIPS = localized(POSTPARTUM_TIPS_FR, POSTPARTUM_TIPS_EN);

function pregnancyTips(late: boolean): SleepTip[] {
  return [
    late
      ? { key: 'cote', icon: 'rotate-cw', title: tr('l1.sleep.tip.sideLate.title'), text: tr('l1.sleep.tip.sideLate.text') }
      : { key: 'cote', icon: 'rotate-cw', title: tr('l1.sleep.tip.sideEarly.title'), text: tr('l1.sleep.tip.sideEarly.text') },
    { key: 'hydratation', icon: 'droplet', title: tr('l1.sleep.tip.hydration.title'), text: tr('l1.sleep.tip.hydration.text') },
    { key: 'repos', icon: 'sun', title: tr('l1.sleep.tip.rest.title'), text: tr('l1.sleep.tip.rest.text') },
  ];
}

const GENERAL_TIPS_FR: SleepTip[] = [
  { key: 'ecrans', icon: 'smartphone', title: 'Limiter les écrans le soir', text: 'Si vous le pouvez, posez le téléphone un moment avant de dormir et baissez la luminosité. Le mode nuit de l’application est pensé pour les réveils.' },
  { key: 'rituel', icon: 'feather', title: 'Un petit rituel du soir', text: 'Lumière douce, boisson chaude sans caféine, quelques respirations lentes : un repère simple aide parfois à lâcher prise.' },
  { key: 'cafeine', icon: 'coffee', title: 'La caféine plutôt le matin', text: 'Café, thé, sodas : les garder pour le début de journée peut faciliter l’endormissement.' },
];
const GENERAL_TIPS_EN: SleepTip[] = [
  { key: 'ecrans', icon: 'smartphone', title: 'Cut back on screens in the evening', text: 'If you can, put the phone down a little while before sleeping and turn the brightness down. The app’s night mode is designed for night wakings.' },
  { key: 'rituel', icon: 'feather', title: 'A little evening ritual', text: 'Soft light, a warm caffeine-free drink, a few slow breaths: a simple cue can sometimes help you let go.' },
  { key: 'cafeine', icon: 'coffee', title: 'Caffeine in the morning rather than later', text: 'Coffee, tea, fizzy drinks: keeping them for the start of the day may make it easier to fall asleep.' },
];
const GENERAL_TIPS = localized(GENERAL_TIPS_FR, GENERAL_TIPS_EN);

/** Repères généraux et doux adaptés au contexte. Jamais d'objectif chiffré. */
export function sleepTips(ctx: SleepContext): SleepTip[] {
  return [
    ...(ctx.postpartum ? POSTPARTUM_TIPS : []),
    ...(ctx.pregnant ? pregnancyTips(ctx.latePregnancy) : []),
    ...GENERAL_TIPS,
  ];
}
