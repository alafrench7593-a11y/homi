/**
 * Grossesse (logique pure, testée) :
 *  1. « Comment je me sens aujourd'hui ? » : symptômes proposés selon le terme, carte d'information en trois
 *     parties adaptée à la semaine, niveau de sécurité (jamais de diagnostic, jamais « c'est normal »).
 *  2. Calendrier automatique : SA, SG, trimestre, terme, fenêtres indicatives des trois échographies converties en
 *     dates du profil ; rendez-vous confirmés jamais déplacés automatiquement ; rappels choisis.
 */
import { SYMPTOM_CARE, SYMPTOMS, type SymptomKey } from '@/content/pregnancyCare';
import { addDays, daysBetween, type ISODate } from './dates';
import { lmpFromDueDate, pregnancyProgress } from './pregnancy';

// ─── Symptômes ──────────────────────────────────────────────────────────────────────────────────

export type Intensity = 1 | 2 | 3;
export type Frequency = 'once' | 'several' | 'continuous';

/** Symptômes proposés à ce terme (les mouvements du bébé seulement quand le terme est concerné). */
export function symptomsFor(weekSA: number): SymptomKey[] {
  return SYMPTOMS.filter((s) => s.fromSA == null || weekSA >= s.fromSA).map((s) => s.key);
}

/** « Fréquent à ce stade ? » : toujours prudent, jamais « c'est normal ». */
export type FrequentAnswer = 'frequent' | 'possible' | 'unusual';
export function frequentAt(symptom: SymptomKey, weekSA: number): FrequentAnswer {
  const r = SYMPTOM_CARE[symptom].frequentSA;
  if (symptom === 'bleeding' || symptom === 'movements' || symptom === 'other') return 'unusual';
  if (!r) return 'possible';
  return weekSA >= r[0] && weekSA <= r[1] ? 'frequent' : 'unusual';
}

/**
 * Niveau de sécurité :
 *  · 'emergency' : afficher immédiatement le 15 / 112 et la maternité ;
 *  · 'maternity' : contacter sans attendre la maternité ;
 *  · 'soon' : consulter rapidement (sage-femme, médecin) ;
 *  · null : information générale.
 * Intense, inhabituel ou inquiétant → jamais null.
 */
export type SafetyLevel = 'emergency' | 'maternity' | 'soon' | null;
export function safetyLevel(e: { symptom: SymptomKey; intensity?: Intensity | null; frequency?: Frequency | null; weekSA: number; worried?: boolean }): SafetyLevel {
  const strong = e.intensity === 3;
  const medium = (e.intensity ?? 1) >= 2;
  const lasting = e.frequency === 'continuous';
  let level: SafetyLevel = null;
  switch (e.symptom) {
    case 'bleeding': level = e.weekSA >= 14 ? 'maternity' : strong ? 'emergency' : 'soon'; break;
    case 'movements': level = e.weekSA >= 24 ? 'maternity' : 'soon'; break;
    case 'contractions': level = e.weekSA < 37 && (medium || lasting) ? 'maternity' : strong ? 'maternity' : null; break;
    case 'discharge': level = lasting ? 'maternity' : strong ? 'soon' : null; break;
    case 'headache': level = e.weekSA >= 20 && (medium || lasting) ? 'maternity' : strong ? 'soon' : null; break;
    case 'breathless': level = strong ? 'emergency' : lasting ? 'soon' : null; break;
    case 'swollen_legs': level = strong ? 'soon' : null; break;
    case 'itching': level = medium && e.weekSA >= 24 ? 'soon' : strong ? 'soon' : null; break;
    case 'vomiting': level = strong || lasting ? 'soon' : null; break;
    case 'pelvic_pain': level = strong ? 'maternity' : medium && lasting ? 'soon' : null; break;
    case 'dizziness': level = strong ? 'soon' : null; break;
    case 'mood': case 'anxiety': level = strong || lasting ? 'soon' : null; break;
    default: level = strong ? 'soon' : null;
  }
  if (!level && (e.worried || strong)) level = 'soon';
  return level;
}

export interface SymptomCard {
  symptom: SymptomKey;
  frequent: FrequentAnswer;
  help: string[];
  ask: string[];
  safety: SafetyLevel;
  sources: { label: string; url: string; consulted_on: string; published?: string }[];
}

export function symptomCard(e: { symptom: SymptomKey; intensity?: Intensity | null; frequency?: Frequency | null; weekSA: number; worried?: boolean }): SymptomCard {
  const c = SYMPTOM_CARE[e.symptom];
  return { symptom: e.symptom, frequent: frequentAt(e.symptom, e.weekSA), help: c.help, ask: c.ask, safety: safetyLevel(e), sources: c.sources };
}

/** Phrases interdites : aucun texte affiché ne doit les contenir (vérifié par les tests). */
export const FORBIDDEN_PHRASES = [/c[’']est normal/i, /aucun danger/i, /pas besoin de consulter/i, /inutile de consulter/i, /sans risque/i];

// ─── Calendrier de grossesse ────────────────────────────────────────────────────────────────────

export type EchoKey = 'echo_1' | 'echo_2' | 'echo_3';
export interface EchoWindow { key: EchoKey; fromSA: [number, number]; toSA: [number, number]; from: ISODate; to: ISODate }

/** Fenêtres générales : 11 SA → 13 SA + 6 j ; 20 → 24 SA ; 30 → 35 SA (ameli.fr, 2026). */
export const ECHO_WINDOWS: { key: EchoKey; fromSA: [number, number]; toSA: [number, number] }[] = [
  { key: 'echo_1', fromSA: [11, 0], toSA: [13, 6] },
  { key: 'echo_2', fromSA: [20, 0], toSA: [24, 6] },
  { key: 'echo_3', fromSA: [30, 0], toSA: [35, 6] },
];

/** Dates de début et de fin de chaque fenêtre, à partir du terme (DDR = terme − 287 jours). */
export function ultrasoundWindows(due: ISODate): EchoWindow[] {
  const lmp = lmpFromDueDate(due);
  return ECHO_WINDOWS.map((w) => ({ ...w, from: addDays(lmp, w.fromSA[0] * 7 + w.fromSA[1]), to: addDays(lmp, w.toSA[0] * 7 + w.toSA[1]) }));
}

export type WindowState = 'past' | 'current' | 'soon' | 'later';
export function windowState(w: Pick<EchoWindow, 'from' | 'to'>, today: ISODate): WindowState {
  if (today > w.to) return 'past';
  if (today >= w.from) return 'current';
  return daysBetween(today, w.from) <= 42 ? 'soon' : 'later';
}

/** Fenêtre à mettre en avant sur l'accueil : en cours ou dans les 6 semaines ; jamais une échographie lointaine. */
export function windowToShow(due: ISODate, today: ISODate): EchoWindow | null {
  return ultrasoundWindows(due).find((w) => ['current', 'soon'].includes(windowState(w, today))) ?? null;
}

export interface PregnancySummary { weeksSA: number; extraDays: number; weeksSG: number; trimester: 1 | 2 | 3; due: ISODate; lmp: ISODate; daysToDue: number }
export function pregnancySummary(due: ISODate, today: ISODate): PregnancySummary {
  const p = pregnancyProgress(due, today);
  return { weeksSA: p.weeksSA, extraDays: p.extraDays, weeksSG: p.weeksSG, trimester: p.trimester, due, lmp: lmpFromDueDate(due), daysToDue: p.daysToDue };
}

/**
 * Rendez-vous confirmés après une correction du terme : JAMAIS déplacés automatiquement.
 * Renvoie ceux qui ne tombent plus dans la nouvelle fenêtre, pour demander l'accord de la personne.
 */
export function confirmedOutsideWindow(appts: { id: string; starts_at: string; calendar_keys?: string[] | null }[], due: ISODate): { id: string; key: EchoKey; window: EchoWindow }[] {
  const ws = ultrasoundWindows(due);
  const out: { id: string; key: EchoKey; window: EchoWindow }[] = [];
  for (const a of appts) {
    const key = (a.calendar_keys ?? []).find((k): k is EchoKey => k === 'echo_1' || k === 'echo_2' || k === 'echo_3');
    if (!key) continue;
    const w = ws.find((x) => x.key === key)!;
    const day = localDay(a.starts_at);
    if (day < w.from || day > w.to) out.push({ id: a.id, key, window: w });
  }
  return out;
}

const pad = (n: number) => String(n).padStart(2, '0');
export const localDay = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

// ─── Rappels ────────────────────────────────────────────────────────────────────────────────────

/** Choix de rappels avant une période indicative ou une échéance (à 9 h), ou avant un rendez-vous confirmé. */
export type ReminderChoice = 'month' | 'two_weeks' | 'week' | 'eve' | 'hours' | 'custom';
export const WINDOW_CHOICES: ReminderChoice[] = ['month', 'two_weeks', 'week', 'custom'];
export const APPOINTMENT_CHOICES: ReminderChoice[] = ['week', 'eve', 'hours', 'custom'];

/**
 * Dates des rappels choisis. `target` : début de la période (jour) ou heure du rendez-vous.
 * Les rappels déjà passés sont ignorés (jamais de notification « en retard »).
 */
export function reminderDates(target: Date, choices: ReminderChoice[], now: Date, custom?: Date | null, allDay = false): Date[] {
  const out: Date[] = [];
  const at9 = (d: Date) => { const x = new Date(d); x.setHours(9, 0, 0, 0); return x; };
  for (const c of choices) {
    let d: Date | null = null;
    if (c === 'month') { d = new Date(target); d.setMonth(d.getMonth() - 1); d = at9(d); }
    else if (c === 'two_weeks') d = at9(new Date(target.getTime() - 14 * 86_400_000));
    else if (c === 'week') d = at9(new Date(target.getTime() - 7 * 86_400_000));
    else if (c === 'eve') { d = new Date(target.getTime() - 86_400_000); d.setHours(18, 0, 0, 0); }
    else if (c === 'hours') d = allDay ? null : new Date(target.getTime() - 3 * 3_600_000);
    else if (c === 'custom') d = custom ?? null;
    if (d && d.getTime() > now.getTime() && !out.some((x) => x.getTime() === d!.getTime())) out.push(d);
  }
  return out.sort((a, b) => a.getTime() - b.getTime());
}
