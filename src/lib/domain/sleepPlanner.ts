/**
 * Planificateur de sommeil personnalisé (logique pure, testée).
 *
 * Principe : après chaque réveil, on estime la prochaine période d'éveil d'UN enfant à partir de
 *  · son âge (âge corrigé si le parent l'a choisi) → repères généraux de l'application, approximatifs ;
 *  · son profil (heure habituelle du réveil et du coucher, nombre approximatif de siestes) ;
 *  · ses propres relevés des 14 derniers jours (temps d'éveil réellement observés, durée de ses siestes) ;
 *  · la durée de son dernier sommeil, le nombre de siestes déjà faites, sieste ou nuit ;
 *  · les retours du parent (« juste », « trop tôt », « trop tard »).
 * Tout est recalculé à partir des relevés à chaque affichage : une sieste déplacée, raccourcie, allongée, supprimée
 * ou interrompue change immédiatement le planning, et aucune heure déjà passée n'est présentée comme « à venir ».
 * Les relevés d'un autre enfant (jumeaux, fratrie) ne sont jamais utilisés : tout est filtré par child_id.
 *
 * Ce sont des ESTIMATIONS : jamais une consigne, jamais une promesse. Les signes de fatigue de l'enfant priment.
 */

import { formatDate, formatNumber, getLocale, t as tx, type TKey } from '@/i18n';
import { localized } from '@/i18n/localized';

const MIN = 60_000;
const DAY = 86_400_000;
export const LEARN_DAYS = 14;
export const FEEDBACK_DAYS = 30;

export type Difficulty = 'falling_asleep' | 'night_wakings' | 'short_naps' | 'early_waking' | 'irregular';
export const DIFFICULTIES: Difficulty[] = ['falling_asleep', 'night_wakings', 'short_naps', 'early_waking', 'irregular'];
export type Feeding = 'breast' | 'bottle' | 'mixed' | 'solids';

export interface WakeEvent { at: string; minutes?: number; back_at?: string; open?: boolean }
export interface SleepRecord {
  id?: string; child_id?: string | null; started_at: string; ended_at: string | null;
  kind?: 'nap' | 'night' | null; wakeups?: number; wake_events?: WakeEvent[];
}
export interface NotifyPrefs {
  enabled: boolean;
  /** Notifications souhaitées */
  signs: boolean; nap: boolean; routine: boolean;
  /** Délai avant l'heure estimée (minutes) */
  lead: number;
  /** Jours concernés : 0 = dimanche … 6 = samedi */
  days: number[];
  /** Plage silencieuse « HH:MM » (peut passer minuit) ; null = aucune */
  quiet_from: string | null; quiet_to: string | null;
}
export const DEFAULT_NOTIFY: NotifyPrefs = { enabled: false, signs: true, nap: true, routine: true, lead: 20, days: [0, 1, 2, 3, 4, 5, 6], quiet_from: '21:30', quiet_to: '07:00' };

export interface SleepProfile {
  child_id: string;
  gestational_weeks?: number | null;
  use_corrected?: boolean | null;
  usual_wake?: string | null;
  nap_count?: number | null;
  usual_bedtime?: string | null;
  feeding?: Feeding | null;
  routine_minutes?: number | null;
  routine_note?: string | null;
  difficulties?: Difficulty[] | null;
  notify?: Partial<NotifyPrefs> | null;
}
export interface SleepFeedback { child_id: string; target: 'nap' | 'bedtime'; verdict: 'right' | 'early' | 'late'; estimated_for: string; created_at: string }

export const notifyPrefs = (p?: SleepProfile | null): NotifyPrefs => ({ ...DEFAULT_NOTIFY, ...(p?.notify ?? {}) });

// ─── Outils horaires ───────────────────────────────────────────────────────────────────────────────

const t = (iso: string) => Date.parse(iso);
const round5 = (ms: number) => Math.round(ms / (5 * MIN)) * 5 * MIN;
const ceil5 = (ms: number) => Math.ceil(ms / (5 * MIN)) * 5 * MIN;
const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
export const median = (xs: number[]) => { if (!xs.length) return NaN; const s = [...xs].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

/** « HH:MM » → minutes depuis minuit (null si invalide). */
export function parseHM(v: string | null | undefined): number | null {
  const m = (v ?? '').trim().match(/^(\d{1,2})\s*[:hH]\s*(\d{2})?(?::\d{2})?$/);
  if (!m) return null;
  const h = Number(m[1]); const mi = Number(m[2] ?? 0);
  if (h > 23 || mi > 59) return null;
  return h * 60 + mi;
}
const minutesOfDay = (d: Date) => d.getHours() * 60 + d.getMinutes();
/** Date du jour de `ref` à l'heure donnée (minutes depuis minuit). */
const atMinutes = (ref: Date, minutes: number) => new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 0, minutes).getTime();

/** « 14 h 40 », « 20 h » */
export function clock(d: Date | number): string {
  const x = new Date(d);
  const m = x.getMinutes();
  if (getLocale() !== 'fr') return `${String(x.getHours()).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  return m ? `${x.getHours()} h ${String(m).padStart(2, '0')}` : `${x.getHours()} h`;
}
/** « 1 h 35 », « 45 min », « 2 h » */
export function span(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60); const r = m % 60;
  if (getLocale() !== 'fr') return r ? `${h}h ${String(r).padStart(2, '0')}` : `${h}h`;
  return r ? `${h} h ${String(r).padStart(2, '0')}` : `${h} h`;
}

// ─── Âge et repères généraux ───────────────────────────────────────────────────────────────────────

export interface PlanningAge { months: number; weeks: number; corrected: boolean }

/**
 * Âge utilisé pour les repères. L'âge corrigé (prématurité : naissance avant 37 SA) n'est utilisé que si le parent
 * l'a demandé, et seulement jusqu'à 2 ans.
 */
export function planningAge(birthDate: string, profile: SleepProfile | null | undefined, now = new Date()): PlanningAge {
  const [y, m, d] = birthDate.slice(0, 10).split('-').map(Number);
  // Jours calendaires (dates locales comparées en UTC) : un changement d'heure ne retire jamais un jour
  let days = Math.max(0, Math.round((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(y, m - 1, d)) / DAY));
  let corrected = false;
  const gw = profile?.gestational_weeks ?? null;
  if (profile?.use_corrected && gw && gw >= 22 && gw < 37 && days < 730) {
    days = Math.max(0, days - (40 - gw) * 7);
    corrected = true;
  }
  return { months: Math.floor(days / 30.44), weeks: Math.floor(days / 7), corrected };
}

export interface AgeReference {
  key: string; label: string; fromMonths: number; toMonths: number;
  naps: number;
  /** Temps d'éveil indicatifs (minutes) : avant la 1re sieste, la 2e…, puis avant le coucher du soir (naps + 1 valeurs). */
  windows: number[];
  /** Durée indicative d'une sieste (minutes) */
  napMinutes: number;
  /** Coucher indicatif si le parent n'a rien indiqué (minutes depuis minuit) */
  bedtime: number;
}

/**
 * Repères GÉNÉRAUX de l'application, volontairement approximatifs et larges. Ce ne sont pas des recommandations
 * officielles : ils servent de point de départ, puis s'effacent au profit du rythme réellement noté pour l'enfant.
 */
const AGE_REFERENCES_FR: AgeReference[] = [
  { key: '0-1', label: 'moins d’un mois', fromMonths: 0, toMonths: 1, naps: 4, windows: [50, 50, 55, 55, 60], napMinutes: 60, bedtime: 21 * 60 },
  { key: '1-3', label: '1 à 3 mois', fromMonths: 1, toMonths: 3, naps: 4, windows: [60, 70, 75, 80, 90], napMinutes: 55, bedtime: 20 * 60 + 30 },
  { key: '3-5', label: '3 à 5 mois', fromMonths: 3, toMonths: 5, naps: 3, windows: [90, 105, 110, 120], napMinutes: 60, bedtime: 20 * 60 },
  { key: '5-7', label: '5 à 7 mois', fromMonths: 5, toMonths: 7, naps: 3, windows: [120, 135, 140, 150], napMinutes: 60, bedtime: 19 * 60 + 45 },
  { key: '7-9', label: '7 à 9 mois', fromMonths: 7, toMonths: 9, naps: 2, windows: [150, 170, 185], napMinutes: 75, bedtime: 19 * 60 + 45 },
  { key: '9-12', label: '9 à 12 mois', fromMonths: 9, toMonths: 12, naps: 2, windows: [180, 200, 215], napMinutes: 75, bedtime: 19 * 60 + 45 },
  { key: '12-15', label: '12 à 15 mois', fromMonths: 12, toMonths: 15, naps: 2, windows: [195, 215, 235], napMinutes: 75, bedtime: 20 * 60 },
  { key: '15-18', label: '15 à 18 mois', fromMonths: 15, toMonths: 18, naps: 1, windows: [270, 285], napMinutes: 105, bedtime: 20 * 60 },
  { key: '18-36', label: '18 mois à 3 ans', fromMonths: 18, toMonths: 36, naps: 1, windows: [300, 330], napMinutes: 100, bedtime: 20 * 60 },
  { key: '36+', label: 'plus de 3 ans', fromMonths: 36, toMonths: 1200, naps: 0, windows: [720], napMinutes: 0, bedtime: 20 * 60 + 15 },
];

const AGE_LABEL_EN: Record<string, string> = {
  '0-1': 'under 1 month', '1-3': '1 to 3 months', '3-5': '3 to 5 months', '5-7': '5 to 7 months', '7-9': '7 to 9 months', '9-12': '9 to 12 months',
  '12-15': '12 to 15 months', '15-18': '15 to 18 months', '18-36': '18 months to 3 years', '36+': 'over 3 years',
};
const AGE_LABEL_ES: Record<string, string> = {
  '0-1': 'menos de 1 mes', '1-3': 'de 1 a 3 meses', '3-5': 'de 3 a 5 meses', '5-7': 'de 5 a 7 meses', '7-9': 'de 7 a 9 meses', '9-12': 'de 9 a 12 meses',
  '12-15': 'de 12 a 15 meses', '15-18': 'de 15 a 18 meses', '18-36': 'de 18 meses a 3 años', '36+': 'más de 3 años',
};
const AGE_LABEL_DE: Record<string, string> = {
  '0-1': 'unter 1 Monat', '1-3': '1 bis 3 Monate', '3-5': '3 bis 5 Monate', '5-7': '5 bis 7 Monate', '7-9': '7 bis 9 Monate', '9-12': '9 bis 12 Monate',
  '12-15': '12 bis 15 Monate', '15-18': '15 bis 18 Monate', '18-36': '18 Monate bis 3 Jahre', '36+': 'über 3 Jahre',
};
const AGE_LABEL_IT: Record<string, string> = {
  '0-1': 'meno di 1 mese', '1-3': 'da 1 a 3 mesi', '3-5': 'da 3 a 5 mesi', '5-7': 'da 5 a 7 mesi', '7-9': 'da 7 a 9 mesi', '9-12': 'da 9 a 12 mesi',
  '12-15': 'da 12 a 15 mesi', '15-18': 'da 15 a 18 mesi', '18-36': 'da 18 mesi a 3 anni', '36+': 'più di 3 anni',
};
const withAgeLabels = (labels: Record<string, string>) => AGE_REFERENCES_FR.map((r) => ({ ...r, label: labels[r.key] ?? r.label }));
export const AGE_REFERENCES: AgeReference[] = localized(AGE_REFERENCES_FR, withAgeLabels(AGE_LABEL_EN), { es: withAgeLabels(AGE_LABEL_ES), de: withAgeLabels(AGE_LABEL_DE), it: withAgeLabels(AGE_LABEL_IT) });

export const referenceFor = (months: number): AgeReference =>
  AGE_REFERENCES.find((r) => months >= r.fromMonths && months < r.toMonths) ?? AGE_REFERENCES[AGE_REFERENCES.length - 1];

/** Adapte la suite des temps d'éveil au nombre de siestes indiqué (interpolation entre le premier et le dernier). */
export function resizeWindows(windows: number[], naps: number): number[] {
  const n = naps + 1;
  if (windows.length === n) return [...windows];
  const first = windows[0]; const last = windows[windows.length - 1];
  // Moins de siestes → éveils plus longs ; plus de siestes → éveils plus courts (proportionnellement)
  const scale = windows.length / n;
  return Array.from({ length: n }, (_, i) => Math.round((n === 1 ? last : first + ((last - first) * i) / (n - 1)) * clamp(scale, 0.6, 1.8)));
}

// ─── Lecture des relevés ───────────────────────────────────────────────────────────────────────────

/** Sieste ou nuit : la valeur notée, sinon d'après l'heure de début (19 h → 7 h = nuit). */
export function sleepKind(s: SleepRecord): 'nap' | 'night' {
  if (s.kind === 'nap' || s.kind === 'night') return s.kind;
  const h = new Date(s.started_at).getHours();
  return h >= 19 || h < 7 ? 'night' : 'nap';
}
/** Réveil nocturne en cours : la nuit est ouverte et le dernier réveil noté n'a pas encore de « rendormi ». */
export const openNightWaking = (s: SleepRecord): WakeEvent | null => {
  if (s.ended_at || sleepKind(s) !== 'night') return null;
  const last = s.wake_events?.[s.wake_events.length - 1];
  return last?.open && !last.back_at ? last : null;
};
/** Minutes de sommeil réelles d'une période (réveils nocturnes chronométrés déduits). */
export function sleptMinutes(s: SleepRecord, now: number): number {
  const end = s.ended_at ? t(s.ended_at) : now;
  let m = Math.max(0, (end - t(s.started_at)) / MIN);
  for (const w of s.wake_events ?? []) {
    if (w.back_at) m -= Math.max(0, (t(w.back_at) - t(w.at)) / MIN);
    else if (w.open && !s.ended_at) m -= Math.max(0, (now - t(w.at)) / MIN);
  }
  return Math.max(0, Math.round(m));
}
export const wakingsOf = (s: SleepRecord) => Math.max(s.wake_events?.length ?? 0, s.wakeups ?? 0);

/** Uniquement les relevés de CET enfant, valides, triés du plus ancien au plus récent. */
export function ownSleeps(sleeps: SleepRecord[], childId: string): SleepRecord[] {
  return sleeps
    .filter((s) => (s.child_id == null || s.child_id === childId) && !Number.isNaN(t(s.started_at)) && (!s.ended_at || t(s.ended_at) >= t(s.started_at)))
    .sort((a, b) => a.started_at.localeCompare(b.started_at));
}

export interface LearnedRhythm {
  /** Temps d'éveil observés, par rang (0 = avant la 1re sieste), puis « final » = avant la nuit */
  byIndex: number[][]; final: number[];
  napDurations: number[];
  napsPerDay: number[];
  samples: number;
}

/**
 * Journées complètes des 14 derniers jours : fin d'une nuit → siestes → début de la nuit suivante.
 * Les écarts invraisemblables (relevé oublié) sont ignorés.
 */
export function learnRhythm(own: SleepRecord[], now = new Date(), days = LEARN_DAYS): LearnedRhythm {
  const from = now.getTime() - days * DAY;
  const out: LearnedRhythm = { byIndex: [], final: [], napDurations: [], napsPerDay: [], samples: 0 };
  const recent = own.filter((s) => t(s.started_at) >= from - DAY);
  for (const s of recent) if (sleepKind(s) === 'nap' && s.ended_at && t(s.started_at) >= from) {
    const d = (t(s.ended_at) - t(s.started_at)) / MIN;
    if (d >= 10 && d <= 240) out.napDurations.push(d);
  }
  const nights = recent.filter((s) => sleepKind(s) === 'night');
  for (let i = 0; i < nights.length; i++) {
    const night = nights[i];
    if (!night.ended_at || t(night.ended_at) < from) continue;
    const dayStart = t(night.ended_at);
    const next = nights.slice(i + 1).find((n) => t(n.started_at) > dayStart);
    const dayEnd = next ? t(next.started_at) : null;
    if (dayEnd !== null && (dayEnd - dayStart) > 20 * 60 * MIN) continue; // journée incomplète
    const naps = recent.filter((s) => sleepKind(s) === 'nap' && t(s.started_at) > dayStart && (dayEnd === null || t(s.started_at) < dayEnd));
    if (naps.some((n) => !n.ended_at)) continue;
    let prev = dayStart; let ok = true;
    naps.forEach((n, k) => {
      const w = (t(n.started_at) - prev) / MIN;
      if (w >= 20 && w <= 420) { (out.byIndex[k] ??= []).push(w); out.samples++; } else ok = false;
      prev = t(n.ended_at!);
    });
    if (dayEnd !== null) {
      const w = (dayEnd - prev) / MIN;
      if (w >= 30 && w <= 780) { out.final.push(w); out.samples++; } else ok = false;
      if (ok) out.napsPerDay.push(naps.length);
    }
  }
  return out;
}

/** Décalage appris des retours du parent (± 10 min par avis net, plafonné à ± 30 min ; 10 derniers avis, 30 jours). */
export function feedbackOffset(feedback: SleepFeedback[], childId: string, target: 'nap' | 'bedtime', now = new Date()): number {
  const recent = feedback
    .filter((f) => f.child_id === childId && f.target === target && now.getTime() - t(f.created_at) <= FEEDBACK_DAYS * DAY)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 10);
  const net = recent.reduce((n, f) => n + (f.verdict === 'early' ? 1 : f.verdict === 'late' ? -1 : 0), 0);
  return clamp(net * 10, -30, 30);
}

// ─── Planning ──────────────────────────────────────────────────────────────────────────────────────

export type PlanState = 'awake' | 'asleep_nap' | 'asleep_night' | 'night_waking' | 'unknown' | 'stale';
export type Basis = 'reference' | 'learning' | 'personal';

export interface Estimate {
  /** Heure estimée (arrondie à 5 min) */
  at: number;
  /** Fourchette */
  from: number; to: number;
  /** Début de routine suggéré */
  routineAt: number;
  /** L'heure initialement estimée est passée : on n'affiche plus d'heure passée */
  overdue: boolean;
  /** Heure initialement estimée (pour le retour « juste / trop tôt / trop tard ») */
  initial: number;
}

export interface PlanItem {
  kind: 'night' | 'nap' | 'awake' | 'nap_est' | 'routine' | 'bedtime';
  from: number; to: number | null;
  estimated: boolean; ongoing?: boolean;
  id?: string;
}

export interface SleepPlan {
  childId: string;
  state: PlanState;
  /** Endormi ou éveillé depuis */
  since: number | null;
  awakeMinutes: number | null;
  /** Réveil supposé d'après l'heure habituelle (aucun réveil noté aujourd'hui) */
  assumedWake: boolean;
  age: PlanningAge; reference: AgeReference;
  basis: Basis; samples: number;
  napsTarget: number; napsDone: number;
  nextNap: Estimate | null;
  bedtime: Estimate | null;
  /** Réveil de sieste estimé (si une sieste est en cours) */
  expectedWake: number | null;
  /** Temps d'éveil utilisé pour la prochaine estimation (minutes) */
  windowMinutes: number | null;
  daySleepMinutes: number;
  dayStart: number | null;
  items: PlanItem[];
}

export interface PlanInput {
  childId: string; birthDate: string;
  profile?: SleepProfile | null;
  sleeps: SleepRecord[];
  feedback?: SleepFeedback[];
  now?: Date;
}

/** Début de la journée en cours : fin de la dernière nuit notée (moins de 20 h), sinon heure habituelle du réveil. */
function dayStartOf(own: SleepRecord[], profile: SleepProfile | null | undefined, now: Date): { at: number | null; assumed: boolean } {
  const N = now.getTime();
  const nights = own.filter((s) => sleepKind(s) === 'night' && s.ended_at && t(s.ended_at) <= N && N - t(s.ended_at!) < 20 * 60 * MIN);
  const last = nights[nights.length - 1];
  const usual = parseHM(profile?.usual_wake);
  if (last) {
    // Une nuit terminée la veille au soir (réveil puis nouvelle nuit non notée) n'ouvre pas la journée d'aujourd'hui
    return { at: t(last.ended_at!), assumed: false };
  }
  if (usual !== null) {
    const at = atMinutes(now, usual);
    if (at <= N) return { at, assumed: true };
  }
  return { at: null, assumed: false };
}

/** Calcule le planning du jour d'un enfant. Pur : mêmes entrées → même résultat. */
export function planDay(input: PlanInput): SleepPlan {
  const now = input.now ?? new Date();
  const N = now.getTime();
  const own = ownSleeps(input.sleeps, input.childId).filter((s) => t(s.started_at) <= N);
  const profile = input.profile && input.profile.child_id === input.childId ? input.profile : null;
  const feedback = (input.feedback ?? []).filter((f) => f.child_id === input.childId);
  const age = planningAge(input.birthDate, profile, now);
  const reference = referenceFor(age.months);
  const learned = learnRhythm(own, now);

  // Nombre de siestes : celui du profil, sinon l'habitude observée (au moins 3 jours), sinon le repère
  const learnedNaps = learned.napsPerDay.length >= 3 ? Math.round(median(learned.napsPerDay)) : null;
  const napsTarget = clamp(profile?.nap_count ?? learnedNaps ?? reference.naps, 0, 6);
  const baseWindows = resizeWindows(reference.windows, napsTarget);
  const napDur = learned.napDurations.length >= 3 ? median(learned.napDurations) : reference.napMinutes || 60;
  const offNap = feedbackOffset(feedback, input.childId, 'nap', now);
  const offBed = feedbackOffset(feedback, input.childId, 'bedtime', now);
  const usualBed = parseHM(profile?.usual_bedtime);
  // Point d'ancrage du coucher : l'heure habituelle indiquée, sinon celle observée (≥ 3 soirs), sinon le repère
  const observedBeds = own.filter((s) => sleepKind(s) === 'night' && N - t(s.started_at) <= LEARN_DAYS * DAY).map((s) => { const m = minutesOfDay(new Date(s.started_at)); return m < 12 * 60 ? m + 1440 : m; });
  const bedAnchor = usualBed ?? (observedBeds.length >= 3 ? Math.round(median(observedBeds)) : reference.bedtime);
  const routineEvening = clamp(profile?.routine_minutes ?? 20, 5, 60);
  const routineNap = Math.min(20, routineEvening);

  /** Temps d'éveil pour le rang `i` (i = napsTarget → avant la nuit), personnalisé par les relevés de l'enfant. */
  const windowFor = (i: number): number => {
    const isFinal = i >= napsTarget;
    const base = baseWindows[Math.min(i, baseWindows.length - 1)];
    const ownW = isFinal ? learned.final : learned.byIndex[i] ?? [];
    if (!ownW.length) return base;
    const w = Math.min(ownW.length, 7) / 10;
    return base * (1 - w) + median(ownW) * w;
  };
  const basis: Basis = learned.samples === 0 ? 'reference' : learned.samples < 7 ? 'learning' : 'personal';

  const open = [...own].reverse().find((s) => !s.ended_at) ?? null;
  const ds = dayStartOf(own, profile, now);
  const dayStart = ds.at;
  const napsToday = dayStart === null ? own.filter((s) => sleepKind(s) === 'nap' && t(s.started_at) >= atMinutes(now, 0))
    : own.filter((s) => sleepKind(s) === 'nap' && t(s.started_at) >= dayStart);
  const napsDone = napsToday.filter((s) => s.ended_at || s === open).length;
  const daySleepMinutes = Math.round(napsToday.reduce((m, s) => m + ((s.ended_at ? t(s.ended_at) : N) - t(s.started_at)) / MIN, 0));

  const base: SleepPlan = {
    childId: input.childId, state: 'unknown', since: null, awakeMinutes: null, assumedWake: false,
    age, reference, basis, samples: learned.samples, napsTarget, napsDone,
    nextNap: null, bedtime: null, expectedWake: null, windowMinutes: null, daySleepMinutes, dayStart, items: [],
  };

  // Planning visuel : ce qui a été noté aujourd'hui
  const items: PlanItem[] = [];
  const lastNight = [...own].reverse().find((s) => sleepKind(s) === 'night' && (s === open || (s.ended_at && dayStart !== null && t(s.ended_at) === dayStart)));
  if (lastNight && (!open || lastNight === open)) items.push({ kind: 'night', from: t(lastNight.started_at), to: lastNight.ended_at ? t(lastNight.ended_at) : null, estimated: false, ongoing: !lastNight.ended_at, id: lastNight.id });
  for (const s of napsToday) items.push({ kind: 'nap', from: t(s.started_at), to: s.ended_at ? t(s.ended_at) : null, estimated: false, ongoing: !s.ended_at, id: s.id });

  // Nuit en cours (avec éventuel réveil nocturne)
  if (open && sleepKind(open) === 'night') {
    const waking = openNightWaking(open);
    return { ...base, items, state: waking ? 'night_waking' : 'asleep_night', since: waking ? t(waking.at) : t(open.started_at), awakeMinutes: waking ? Math.round((N - t(waking.at)) / MIN) : null };
  }

  let wakeAt: number | null; let lastNapMinutes: number | null = null; let state: PlanState;
  let since: number | null;
  if (open) {
    // Sieste en cours : on estime son réveil d'après la durée habituelle de ses siestes
    state = 'asleep_nap'; since = t(open.started_at);
    wakeAt = Math.max(N, round5(t(open.started_at) + napDur * MIN));
    base.expectedWake = wakeAt;
    lastNapMinutes = (wakeAt - t(open.started_at)) / MIN;
  } else {
    const lastEnded = [...own].reverse().find((s) => s.ended_at);
    const lastEnd = lastEnded ? t(lastEnded.ended_at!) : null;
    wakeAt = lastEnd !== null && (dayStart === null || lastEnd >= dayStart) ? lastEnd : dayStart;
    if (wakeAt === null) return { ...base, items };
    if (lastEnded && lastEnd === wakeAt && sleepKind(lastEnded) === 'nap') lastNapMinutes = (lastEnd - t(lastEnded.started_at)) / MIN;
    state = 'awake'; since = wakeAt;
    base.assumedWake = ds.assumed && wakeAt === dayStart;
    // Éveil invraisemblable (un relevé a sans doute été oublié) : pas d'estimation trompeuse
    const longest = Math.max(...baseWindows);
    if ((N - wakeAt) / MIN > Math.max(longest * 2, 360)) return { ...base, items, state: 'stale', since: wakeAt, awakeMinutes: Math.round((N - wakeAt) / MIN) };
    items.push({ kind: 'awake', from: wakeAt, to: null, estimated: false, ongoing: true });
  }

  // Projection de la suite de la journée
  const latestBed = atMinutes(now, bedAnchor + 60);
  const earliestBed = atMinutes(now, bedAnchor - 60);
  let cursor = wakeAt; let idx = napsDone; let first = true;
  let nextNap: Estimate | null = null; let windowMinutes: number | null = null;
  // Facteur « dernier sommeil » : une sieste courte rapproche la suivante, une longue l'éloigne un peu
  const factor = lastNapMinutes !== null ? clamp(1 + 0.15 * (lastNapMinutes - napDur) / napDur, 0.85, 1.1) : 1;
  const finalW = windowFor(napsTarget);
  while (idx < napsTarget) {
    const w = windowFor(idx) * (first ? factor : 1) + offNap;
    const initial = round5(cursor + w * MIN);
    let at = initial; let overdue = false;
    if (first && state === 'awake' && at < N - 10 * MIN) { at = round5(N + 2.5 * MIN); overdue = true; }
    // Trop tard dans la journée pour une sieste de plus : on passe directement au coucher
    if (at + napDur * MIN + finalW * 0.75 * MIN > latestBed) break;
    // Début de routine : jamais dans le passé tant que la sieste est à venir
    const routineAt = first && state === 'awake' ? Math.min(at, Math.max(at - routineNap * MIN, ceil5(N))) : at - routineNap * MIN;
    const est: Estimate = { at, from: at - 15 * MIN, to: at + 15 * MIN, routineAt, overdue, initial };
    if (first) { windowMinutes = Math.round(w); nextNap = est; }
    items.push({ kind: 'nap_est', from: at, to: at + napDur * MIN, estimated: true });
    cursor = at + napDur * MIN; idx++; first = false;
  }
  const wBed = finalW * (first ? factor : 1);
  let bed = cursor + wBed * MIN + offBed * MIN;
  // Mélange : rythme projeté de la journée et heure habituelle, dans une fourchette de ± 1 h autour de l'habitude
  bed = clamp((bed + atMinutes(now, bedAnchor)) / 2, earliestBed, latestBed);
  bed = round5(bed);
  const initialBed = bed;
  let bedOverdue = false;
  if (state === 'awake' && bed < N - 10 * MIN) { bed = round5(N + 2.5 * MIN); bedOverdue = true; }
  const bedtime: Estimate = { at: bed, from: bed - 15 * MIN, to: bed + 15 * MIN, routineAt: state === 'awake' ? Math.min(bed, Math.max(bed - routineEvening * MIN, ceil5(N))) : bed - routineEvening * MIN, overdue: bedOverdue, initial: initialBed };
  if (first) windowMinutes = Math.round(wBed);
  items.push({ kind: 'routine', from: bedtime.routineAt, to: bedtime.at, estimated: true });
  items.push({ kind: 'bedtime', from: bedtime.at, to: null, estimated: true });
  items.sort((a, b) => a.from - b.from);

  return {
    ...base, items, state, since,
    awakeMinutes: state === 'awake' ? Math.round((N - wakeAt) / MIN) : null,
    nextNap, bedtime, windowMinutes,
  };
}

/** L'estimation qui était affichée juste avant le début d'un sommeil (pour recueillir l'avis du parent). */
export function estimateBefore(input: Omit<PlanInput, 'now'>, sleep: SleepRecord): { target: 'nap' | 'bedtime'; at: number } | null {
  const start = t(sleep.started_at);
  const before = input.sleeps.filter((s) => t(s.started_at) < start).map((s) => (s.ended_at && t(s.ended_at) > start ? { ...s, ended_at: null } : s));
  const p = planDay({ ...input, sleeps: before, now: new Date(start - MIN) });
  if (p.state !== 'awake') return null;
  if (sleepKind(sleep) === 'nap' && p.nextNap) return { target: 'nap', at: p.nextNap.initial };
  if (sleepKind(sleep) === 'night' && p.bedtime) return { target: 'bedtime', at: (p.bedtime.initial) };
  return null;
}

// ─── Textes (jamais d'obligation, jamais de culpabilisation) ───────────────────────────────────────

export type Sex = 'female' | 'male' | 'unspecified' | null | undefined;
export const agree = (sex: Sex, masc: string, fem: string, neutral: string) => (sex === 'female' ? fem : sex === 'male' ? masc : neutral);

/** Mots accordés selon la langue : [masculin, féminin, neutre] (l'anglais et l'allemand n'accordent pas ces adjectifs). */
type Agreed = Record<'fr' | 'en' | 'es' | 'de' | 'it', [string, string, string]>;
const AWAKE_WORD: Agreed = {
  fr: ['Éveillé', 'Éveillée', 'Éveillé·e'], en: ['Awake', 'Awake', 'Awake'], es: ['Despierto', 'Despierta', 'Despierto/a'],
  de: ['Wach', 'Wach', 'Wach'], it: ['Sveglio', 'Sveglia', 'Sveglio/a'],
};
const ASLEEP_WORD: Agreed = {
  fr: ['Endormi', 'Endormie', 'Endormi·e'], en: ['Asleep', 'Asleep', 'Asleep'], es: ['Dormido', 'Dormida', 'Dormido/a'],
  de: ['Schlafend', 'Schlafend', 'Schlafend'], it: ['Addormentato', 'Addormentata', 'Addormentato/a'],
};
const AWAKE_LOWER: Agreed = {
  fr: ['éveillé', 'éveillée', 'éveillé·e'], en: ['awake', 'awake', 'awake'], es: ['despierto', 'despierta', 'despierto/a'],
  de: ['wach', 'wach', 'wach'], it: ['sveglio', 'sveglia', 'sveglio/a'],
};
const agreedWord = (w: Agreed, sex: Sex) => { const l = getLocale(); const set = w[l as keyof Agreed] ?? w.fr; return agree(sex, set[0], set[1], set[2]); };

export function planLines(plan: SleepPlan, name: string, sex?: Sex, now = new Date()) {
  // Accord en genre (français, espagnol, italien) ; l'anglais et l'allemand n'accordent pas
  const awakeWord = agreedWord(AWAKE_WORD, sex);
  const asleepWord = agreedWord(ASLEEP_WORD, sex);
  const N = now.getTime();
  const lines: { key: string; text: string }[] = [];
  switch (plan.state) {
    case 'awake': lines.push({ key: 'state', text: tx('l7.sp.awake_for', { word: awakeWord, span: span(plan.awakeMinutes ?? 0) }) }); break;
    case 'asleep_nap': lines.push({ key: 'state', text: tx('l7.sp.asleep_nap', { word: asleepWord, span: span((N - (plan.since ?? N)) / MIN) }) }); break;
    case 'asleep_night': lines.push({ key: 'state', text: tx('l7.sp.asleep_night', { word: asleepWord, time: clock(plan.since ?? N) }) }); break;
    case 'night_waking': lines.push({ key: 'state', text: tx('l7.sp.night_waking', { span: span(plan.awakeMinutes ?? 0) }) }); break;
    case 'stale': lines.push({ key: 'state', text: tx('l7.sp.stale', { span: span(plan.awakeMinutes ?? 0) }) }); break;
    default: lines.push({ key: 'state', text: tx('l7.sp.start', { name }) });
  }
  if (plan.nextNap) {
    if (plan.nextNap.overdue) lines.push({ key: 'nap', text: tx('l7.sp.nap_overdue', { time: clock(plan.nextNap.initial) }) });
    else {
      if (plan.state === 'awake') lines.push({ key: 'routine', text: tx('l7.sp.routine_nap', { time: clock(plan.nextNap.routineAt) }) });
      lines.push({ key: 'nap', text: tx('l7.sp.nap_next', { time: clock(plan.nextNap.at) }) });
    }
  }
  if (plan.bedtime) {
    if (plan.bedtime.overdue) lines.push({ key: 'bedtime', text: tx('l7.sp.bed_overdue', { name }) });
    else {
      if (!plan.nextNap && plan.state === 'awake') lines.push({ key: 'routine', text: tx('l7.sp.routine_evening', { time: clock(plan.bedtime.routineAt) }) });
      lines.push({ key: 'bedtime', text: tx('l7.sp.bed_between', { from: clock(plan.bedtime.from), to: clock(plan.bedtime.to) }) });
    }
  }
  if (plan.state === 'asleep_nap' && plan.expectedWake) lines.push({ key: 'wake', text: tx('l7.sp.nap_wake', { time: clock(plan.expectedWake) }) });
  return lines;
}

export function basisText(plan: SleepPlan, name: string): string {
  const ageTxt = plan.age.corrected ? tx('l7.sp.age_corrected', { label: plan.reference.label }) : plan.reference.label;
  if (plan.basis === 'reference') return tx('l7.sp.basis_reference', { age: ageTxt, name });
  if (plan.basis === 'learning') return tx('l7.sp.basis_learning', { age: ageTxt, count: plan.samples, samples: String(plan.samples), name });
  return tx('l7.sp.basis_personal', { samples: String(plan.samples), name });
}

// ─── Notifications ─────────────────────────────────────────────────────────────────────────────────

export interface PlannedNotification { id: string; at: number; title: string; body: string; kind: 'signs' | 'nap' | 'routine' }

/** Plage silencieuse (gère le passage de minuit). */
export function inQuiet(at: number, from: string | null, to: string | null): boolean {
  const a = parseHM(from); const b = parseHM(to);
  if (a === null || b === null || a === b) return false;
  const m = minutesOfDay(new Date(at));
  return a < b ? m >= a && m < b : m >= a || m < b;
}

/**
 * Notifications à programmer pour le planning en cours. Recalculées à chaque changement : les anciennes sont
 * annulées par l'appelant. Aucune n'est proposée si le parent les a coupées, hors des jours choisis,
 * pendant la plage silencieuse, ou pour une heure déjà passée.
 */
export function planSleepNotifications(plan: SleepPlan, prefs: NotifyPrefs, name: string, sex: Sex, now = new Date()): PlannedNotification[] {
  if (!prefs.enabled || plan.state !== 'awake') return [];
  const N = now.getTime();
  const lead = clamp(Math.round(prefs.lead), 0, 90) * MIN;
  const title = tx('l7.sp.notif_title', { name });
  const out: PlannedNotification[] = [];
  const awake = agreedWord(AWAKE_LOWER, sex);
  if (plan.nextNap && !plan.nextNap.overdue) {
    if (prefs.signs && plan.since !== null) {
      const at = plan.nextNap.routineAt - lead;
      out.push({ id: `sleep-${plan.childId}-signs`, at, kind: 'signs', title, body: tx('l7.sp.notif_signs', { name, awake, span: span((at - plan.since) / MIN) }) });
    }
    if (prefs.nap) out.push({ id: `sleep-${plan.childId}-nap`, at: plan.nextNap.at - lead, kind: 'nap', title, body: tx('l7.sp.notif_nap', { name, time: clock(plan.nextNap.at) }) });
  }
  if (plan.bedtime && !plan.bedtime.overdue && prefs.routine) {
    const minutes = Math.round(lead / MIN);
    out.push({ id: `sleep-${plan.childId}-routine`, at: plan.bedtime.routineAt - lead, kind: 'routine', title, body: minutes ? tx('l7.sp.notif_routine_in', { minutes: String(minutes) }) : tx('l7.sp.notif_routine_now') });
  }
  return out.filter((n) => n.at > N + MIN && prefs.days.includes(new Date(n.at).getDay()) && !inQuiet(n.at, prefs.quiet_from, prefs.quiet_to));
}

// ─── Résumés et tendances (constats, jamais un diagnostic) ─────────────────────────────────────────

export interface FeedLog { at: string }
export interface NightReport { start: number; end: number | null; sleptMinutes: number; wakings: number; feeds: number; lastFeed: number | null }

/** Dernière nuit (ou nuit en cours) de l'enfant : sommeil, réveils, repas nocturnes notés. */
export function lastNightReport(sleeps: SleepRecord[], childId: string, feeds: FeedLog[], now = new Date()): NightReport | null {
  const N = now.getTime();
  const own = ownSleeps(sleeps, childId).filter((s) => sleepKind(s) === 'night' && t(s.started_at) <= N && N - t(s.started_at) < 30 * 60 * MIN);
  const night = own[own.length - 1];
  if (!night) return null;
  const start = t(night.started_at); const end = night.ended_at ? t(night.ended_at) : null;
  const inNight = feeds.filter((f) => t(f.at) >= start && t(f.at) <= (end ?? N)).map((f) => t(f.at)).sort((a, b) => a - b);
  return { start, end, sleptMinutes: sleptMinutes(night, N), wakings: wakingsOf(night), feeds: inNight.length, lastFeed: inNight.length ? inNight[inNight.length - 1] : null };
}

export interface DayStat { date: string; naps: number; napMinutes: number; nightMinutes: number; wakings: number; bedtime: number | null; wake: number | null }

const dayKey = (ms: number) => { const d = new Date(ms); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

/** Vue jour par jour (du plus ancien au plus récent) : siestes du jour, nuit commencée ce soir-là, heures de coucher/réveil. */
export function weekView(sleeps: SleepRecord[], childId: string, now = new Date(), days = 7): DayStat[] {
  const own = ownSleeps(sleeps, childId); const N = now.getTime();
  return Array.from({ length: days }, (_, k) => {
    // Bornes en heure locale (et non « + 24 h ») : les jours de changement d'heure durent 23 h ou 25 h
    const at = (dayOffset: number, hour: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1 - k) + dayOffset, hour).getTime();
    const d0 = at(0, 0);
    const d1 = at(1, 0);
    const stat: DayStat = { date: dayKey(d0), naps: 0, napMinutes: 0, nightMinutes: 0, wakings: 0, bedtime: null, wake: null };
    for (const s of own) {
      const a = t(s.started_at);
      if (sleepKind(s) === 'nap') {
        if (a >= d0 && a < d1) { stat.naps++; stat.napMinutes += Math.round(((s.ended_at ? t(s.ended_at) : N) - a) / MIN); }
      } else {
        // Nuit « du soir » : commencée entre midi ce jour et midi le lendemain
        if (a >= at(0, 12) && a < at(1, 12)) { stat.nightMinutes += sleptMinutes(s, N); stat.wakings += wakingsOf(s); stat.bedtime ??= a; }
        // Réveil du matin de ce jour
        if (s.ended_at && t(s.ended_at) >= d0 && t(s.ended_at) < at(0, 14)) stat.wake = t(s.ended_at);
      }
    }
    return stat;
  });
}

export interface Trends {
  days: number;
  avgBedtime: number | null; avgWake: number | null; avgNapMinutes: number | null; avgWakings: number | null;
  avgNaps: number | null; avgDaySleep: number | null; avgNight: number | null;
  changes: string[];
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
/** Minutes « depuis midi » pour moyenner des heures de coucher qui passent minuit. */
const bedMinutes = (ms: number) => { const m = minutesOfDay(new Date(ms)); return m < 12 * 60 ? m + 1440 : m; };
export const minutesToClock = (m: number) => { const x = ((Math.round(m / 5) * 5) % 1440 + 1440) % 1440; return clock(new Date(2000, 0, 1, Math.floor(x / 60), x % 60)); };

/** Moyennes sur les 7 derniers jours complets et évolution (3 derniers jours vs 4 à 10 jours avant). */
export function sleepTrends(sleeps: SleepRecord[], childId: string, now = new Date()): Trends {
  const view = weekView(sleeps, childId, now, 11).slice(0, 10); // aujourd'hui exclu
  const last7 = view.slice(-7).filter((d) => d.naps || d.nightMinutes);
  const own = ownSleeps(sleeps, childId);
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).getTime();
  const napDur = own.filter((s) => sleepKind(s) === 'nap' && s.ended_at && t(s.started_at) >= from).map((s) => (t(s.ended_at!) - t(s.started_at)) / MIN);
  const beds = last7.filter((d) => d.bedtime !== null).map((d) => bedMinutes(d.bedtime!));
  const wakes = last7.filter((d) => d.wake !== null).map((d) => minutesOfDay(new Date(d.wake!)));
  const nights = last7.filter((d) => d.nightMinutes);
  const tr: Trends = {
    days: last7.length,
    avgBedtime: avg(beds), avgWake: avg(wakes), avgNapMinutes: avg(napDur),
    avgWakings: nights.length ? avg(nights.map((d) => d.wakings)) : null,
    avgNaps: last7.length ? avg(last7.map((d) => d.naps)) : null,
    avgDaySleep: last7.length ? avg(last7.map((d) => d.napMinutes)) : null,
    avgNight: nights.length ? avg(nights.map((d) => d.nightMinutes)) : null,
    changes: [],
  };
  const recent = view.slice(-3).filter((d) => d.naps || d.nightMinutes);
  const before = view.slice(0, 7).filter((d) => d.naps || d.nightMinutes);
  if (recent.length >= 2 && before.length >= 2) {
    const diff = (f: (d: DayStat) => number | null, xs: DayStat[]) => avg(xs.map(f).filter((v): v is number => v !== null));
    const b1 = diff((d) => (d.bedtime === null ? null : bedMinutes(d.bedtime)), recent); const b0 = diff((d) => (d.bedtime === null ? null : bedMinutes(d.bedtime)), before);
    if (b1 !== null && b0 !== null && Math.abs(b1 - b0) >= 20) tr.changes.push(tx(b1 > b0 ? 'l7.sp.chg_bed_later' : 'l7.sp.chg_bed_earlier', { span: span(Math.abs(b1 - b0)) }));
    const w1 = diff((d) => (d.wake === null ? null : minutesOfDay(new Date(d.wake))), recent); const w0 = diff((d) => (d.wake === null ? null : minutesOfDay(new Date(d.wake))), before);
    if (w1 !== null && w0 !== null && Math.abs(w1 - w0) >= 20) tr.changes.push(tx(w1 > w0 ? 'l7.sp.chg_wake_later' : 'l7.sp.chg_wake_earlier', { span: span(Math.abs(w1 - w0)) }));
    const n1 = diff((d) => d.naps, recent)!; const n0 = diff((d) => d.naps, before)!;
    if (Math.abs(n1 - n0) >= 0.9) tr.changes.push(tx(n1 > n0 ? 'l7.sp.chg_nap_more' : 'l7.sp.chg_nap_less'));
    const k1 = diff((d) => (d.nightMinutes ? d.wakings : null), recent); const k0 = diff((d) => (d.nightMinutes ? d.wakings : null), before);
    if (k1 !== null && k0 !== null && Math.abs(k1 - k0) >= 1) tr.changes.push(tx(k1 > k0 ? 'l7.sp.chg_wakings_more' : 'l7.sp.chg_wakings_less', { n: String(Math.round(Math.abs(k1 - k0))) }));
    const d1 = diff((d) => d.napMinutes, recent)!; const d0 = diff((d) => d.napMinutes, before)!;
    if (Math.abs(d1 - d0) >= 40) tr.changes.push(tx(d1 > d0 ? 'l7.sp.chg_napmin_more' : 'l7.sp.chg_napmin_less', { span: span(Math.abs(d1 - d0)) }));
  }
  return tr;
}

// ─── Fiche pour un professionnel (gratuite, rien n'est envoyé automatiquement) ─────────────────────

export const DIFFICULTY_LABEL: Record<Difficulty, string> = localized(
  { falling_asleep: 'Endormissement difficile', night_wakings: 'Réveils fréquents', short_naps: 'Siestes courtes', early_waking: 'Réveil matinal', irregular: 'Rythme irrégulier' } as Record<Difficulty, string>,
  { falling_asleep: 'Trouble falling asleep', night_wakings: 'Frequent night wakings', short_naps: 'Short naps', early_waking: 'Early waking', irregular: 'Irregular rhythm' } as Record<Difficulty, string>,
  {
    es: { falling_asleep: 'Dificultad para dormirse', night_wakings: 'Despertares frecuentes', short_naps: 'Siestas cortas', early_waking: 'Despertar temprano', irregular: 'Ritmo irregular' } as Record<Difficulty, string>,
    de: { falling_asleep: 'Schwieriges Einschlafen', night_wakings: 'Häufiges Aufwachen', short_naps: 'Kurze Tagschläfchen', early_waking: 'Frühes Aufwachen', irregular: 'Unregelmäßiger Rhythmus' } as Record<Difficulty, string>,
    it: { falling_asleep: 'Addormentamento difficile', night_wakings: 'Risvegli frequenti', short_naps: 'Sonnellini brevi', early_waking: 'Risveglio precoce', irregular: 'Ritmo irregolare' } as Record<Difficulty, string>,
  },
);

/** Texte à montrer ou partager avec un médecin, une sage-femme ou la PMI. Uniquement ce qui a été noté. */
export function proSheet(name: string, ageLabel: string, profile: SleepProfile | null | undefined, sleeps: SleepRecord[], childId: string, now = new Date(), note = ''): string {
  const tr = sleepTrends(sleeps, childId, now);
  const dec1 = (n: number) => formatNumber(Math.round(n * 10) / 10);
  const lines = [tx('l7.sp.pro_title', { name, age: ageLabel }), tx('l7.sp.pro_prepared', { date: formatDate(now, { day: 'numeric', month: 'numeric', year: 'numeric' }) }), ''];
  const diffs = (profile?.difficulties ?? []).map((d) => DIFFICULTY_LABEL[d]);
  lines.push(diffs.length ? tx('l7.sp.pro_diffs', { list: diffs.join(', ') }) : tx('l7.sp.pro_no_diffs'));
  if (tr.days) {
    lines.push(tx('l7.sp.pro_days', { days: String(tr.days) }));
    if (tr.avgBedtime !== null) lines.push(tx('l7.sp.pro_bed', { time: minutesToClock(tr.avgBedtime) }));
    if (tr.avgWake !== null) lines.push(tx('l7.sp.pro_wake', { time: minutesToClock(tr.avgWake) }));
    if (tr.avgNaps !== null) lines.push(tx('l7.sp.pro_naps', { n: dec1(tr.avgNaps) }) + (tr.avgNapMinutes !== null ? tx('l7.sp.pro_naps_avg', { span: span(tr.avgNapMinutes) }) : ''));
    if (tr.avgNight !== null) lines.push(tx('l7.sp.pro_night', { span: span(tr.avgNight) }));
    if (tr.avgWakings !== null) lines.push(tx('l7.sp.pro_wakings', { n: dec1(tr.avgWakings) }));
    for (const c of tr.changes) lines.push(`• ${c}`);
  } else lines.push(tx('l7.sp.pro_not_enough'));
  if (profile?.feeding) lines.push(tx('l7.sp.pro_feeding', { kind: tx(`l7.sp.feeding_${profile.feeding}` as TKey) }));
  if (profile?.routine_note) lines.push(tx('l7.sp.pro_routine', { note: profile.routine_note }));
  if (note.trim()) lines.push('', tx('l7.sp.pro_note', { note: note.trim() }));
  lines.push('', tx('l7.sp.pro_footer'));
  return lines.join('\n');
}

// ─── Aide pour cette nuit ──────────────────────────────────────────────────────────────────────────

export interface TonightInfo {
  /** Dernier réveil noté (réveil nocturne ou fin du dernier sommeil) */
  lastWake: number | null;
  /** Dernier repas de nuit noté (tétée ou biberon depuis le coucher, ou ces 12 dernières heures) */
  lastFeed: number | null;
  /** Durée du sommeil précédent (dernière période de sommeil continue) */
  previousSleepMinutes: number | null;
  /** Réveils de la nuit en cours ou de la dernière nuit */
  wakings: number;
}

export function tonightInfo(sleeps: SleepRecord[], childId: string, feeds: FeedLog[], now = new Date()): TonightInfo {
  const N = now.getTime();
  const own = ownSleeps(sleeps, childId).filter((s) => t(s.started_at) <= N);
  const last = own[own.length - 1];
  const night = [...own].reverse().find((s) => sleepKind(s) === 'night' && N - t(s.started_at) < 20 * 60 * MIN) ?? null;
  // Périodes de sommeil continues de la dernière entrée (découpées par les réveils nocturnes chronométrés)
  let lastWake: number | null = null; let previous: number | null = null;
  if (last) {
    const events = (last.wake_events ?? []).filter((w) => t(w.at) >= t(last.started_at)).sort((a, b) => a.at.localeCompare(b.at));
    let segStart = t(last.started_at);
    const stretches: number[] = [];
    for (const w of events) {
      stretches.push((t(w.at) - segStart) / MIN);
      lastWake = t(w.at);
      segStart = w.back_at ? t(w.back_at) : w.minutes ? t(w.at) + w.minutes * MIN : t(w.at);
      if (w.open && !w.back_at) segStart = NaN;
    }
    if (last.ended_at) { stretches.push((t(last.ended_at) - segStart) / MIN); lastWake = t(last.ended_at); }
    const done = stretches.filter((x) => Number.isFinite(x) && x > 0);
    // Pendant un sommeil, le « précédent » est la dernière période terminée ; sinon la dernière période tout court
    previous = done.length ? Math.round(done[done.length - 1]) : null;
    if (!last.ended_at && !events.some((w) => w.open && !w.back_at)) {
      const prevEnded = [...own].reverse().find((s) => s !== last && s.ended_at);
      if (!events.length && prevEnded) { previous = Math.round((t(prevEnded.ended_at!) - t(prevEnded.started_at)) / MIN); lastWake = t(prevEnded.ended_at!); }
    }
  }
  const from = night ? t(night.started_at) : N - 12 * 60 * MIN;
  const nightFeeds = feeds.map((f) => t(f.at)).filter((x) => x >= from && x <= N).sort((a, b) => a - b);
  return { lastWake, lastFeed: nightFeeds.length ? nightFeeds[nightFeeds.length - 1] : null, previousSleepMinutes: previous, wakings: night ? wakingsOf(night) : 0 };
}
