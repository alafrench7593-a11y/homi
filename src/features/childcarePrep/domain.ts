/**
 * Avant la garde — règles pures (aucun accès aux données, testées dans src/__tests__/childcarePrep.test.ts).
 *
 *  - Coût mensuel d'une candidate à partir des SEULES saisies des parents (taux horaire × heures, ou forfait) et des
 *    frais (repas, entretien, autres). C'est un reste à charge AVANT aides : aucune aide (CMG, crédit d'impôt) n'est
 *    calculée ni promise.
 *  - Heures de garde : paires arrivée → départ du carnet de liaison (childcare_events), totaux par semaine et par mois.
 *    Ce suivi n'a pas de valeur légale de pointage.
 *  - Planning prévu (jours et horaires) et absences / congés / fermetures, réunis jour par jour.
 */
import { addDays, toISODate, type ISODate } from '@/lib/domain/dates';
import { csvCell } from '@/lib/csv';

/** Pages publiques déjà sourcées dans les guides HOMI (src/content/articles/guide/b26.ts, b27.ts, bebe.ts ; consultées le 27/10/2026). */
export const OFFICIAL = {
  modes: { label: 'gp.src.modes', url: 'https://monenfant.fr/quel-mode-d-accueil-choisir' },
  creche: { label: 'gp.src.creche', url: 'https://www.caf.fr/allocataires/vies-de-famille/articles/trouver-une-place-en-creche-mode-d-emploi' },
  garder: { label: 'gp.src.garder', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F601' },
  cmg: { label: 'gp.src.cmg', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F39152' },
  cmgStructure: { label: 'gp.src.cmgStructure', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F345' },
  creditHome: { label: 'gp.src.creditHome', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F12' },
  creditOut: { label: 'gp.src.creditOut', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F8' },
} as const satisfies Record<string, { label: `gp.src.${string}`; url: string }>;

// ---------------------------------------------------------------- candidates
export const CANDIDATE_KINDS = ['assmat', 'nanny', 'creche', 'micro_creche', 'shared'] as const;
export type CandidateKind = (typeof CANDIDATE_KINDS)[number];
export const CANDIDATE_STATUSES = ['to_contact', 'interview', 'visited', 'chosen', 'dismissed'] as const;
export type CandidateStatus = (typeof CANDIDATE_STATUSES)[number];
export type RateMode = 'hourly' | 'monthly';

export interface Candidate {
  id: string;
  household_id: string;
  name: string;
  kind: CandidateKind;
  status: CandidateStatus;
  phone: string | null;
  email: string | null;
  address: string | null;
  availability: string | null;
  rate_mode: RateMode;
  hourly_rate: number | null;
  hours_per_week: number | null;
  weeks_per_year: number;
  days_per_week: number | null;
  monthly_fee: number | null;
  meal_fee_per_day: number | null;
  upkeep_fee_per_day: number | null;
  other_monthly: number | null;
  interview_at: string | null;
  notes: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at?: string;
}

/** Type de garde : crèche et micro-crèche se visitent ; une personne (assistante maternelle, nounou) se rencontre. */
export const isStructure = (k: CandidateKind) => k === 'creche' || k === 'micro_creche';

const num = (v: unknown): number => {
  const n = typeof v === 'string' ? Number(v) : (v as number);
  return typeof n === 'number' && Number.isFinite(n) ? n : 0;
};
const round2 = (n: number) => Math.round(n * 100) / 100;

export interface CostBreakdown {
  /** Rémunération ou forfait mensuel. */
  base: number;
  meals: number;
  upkeep: number;
  other: number;
  /** Reste à charge mensuel AVANT aides. */
  total: number;
  /** Heures gardées par mois (taux horaire), sinon null. */
  hoursPerMonth: number | null;
  /** Vrai si les saisies suffisent au calcul (taux et heures, ou forfait). */
  complete: boolean;
}

/**
 * Coût mensuel estimé. Taux horaire : taux × heures par semaine × semaines par an ÷ 12 (mensualisation sur l'année).
 * Forfait : montant mensuel saisi. Frais par jour (repas, entretien) : × jours par semaine × semaines par an ÷ 12.
 */
export function monthlyCost(c: Pick<Candidate, 'rate_mode' | 'hourly_rate' | 'hours_per_week' | 'weeks_per_year' | 'days_per_week' | 'monthly_fee' | 'meal_fee_per_day' | 'upkeep_fee_per_day' | 'other_monthly'>): CostBreakdown {
  const weeks = Math.min(52, Math.max(1, num(c.weeks_per_year) || 52));
  const hourly = c.rate_mode === 'hourly';
  const hoursPerMonth = hourly && c.hours_per_week != null ? (num(c.hours_per_week) * weeks) / 12 : null;
  const base = hourly ? num(c.hourly_rate) * (hoursPerMonth ?? 0) : num(c.monthly_fee);
  const daysPerMonth = (num(c.days_per_week) * weeks) / 12;
  const meals = num(c.meal_fee_per_day) * daysPerMonth;
  const upkeep = num(c.upkeep_fee_per_day) * daysPerMonth;
  const other = num(c.other_monthly);
  const complete = hourly ? c.hourly_rate != null && c.hours_per_week != null : c.monthly_fee != null;
  return {
    base: round2(base), meals: round2(meals), upkeep: round2(upkeep), other: round2(other),
    total: round2(base + meals + upkeep + other),
    hoursPerMonth: hoursPerMonth == null ? null : round2(hoursPerMonth),
    complete,
  };
}

/** Montant saisi (« 4,20 », « 4.2 », « 380 € ») → nombre, ou null si vide ; NaN si illisible. */
export function parseAmount(input: string): number | null {
  const s = input.replace(/\s|€| /g, '').replace(',', '.');
  if (!s) return null;
  if (!/^\d+(\.\d+)?$/.test(s)) return Number.NaN;
  return Number(s);
}

export type CandidateSort = 'cost' | 'status' | 'name' | 'recent';
const STATUS_RANK: Record<CandidateStatus, number> = { chosen: 0, visited: 1, interview: 2, to_contact: 3, dismissed: 4 };

/** Tri de la comparaison. Coût : les fiches sans tarif complet à la fin ; les candidates écartées toujours en dernier. */
export function sortCandidates(list: Candidate[], by: CandidateSort): Candidate[] {
  const out = [...list];
  const dismissedLast = (a: Candidate, b: Candidate) => Number(a.status === 'dismissed') - Number(b.status === 'dismissed');
  out.sort((a, b) => {
    const d = dismissedLast(a, b);
    if (d) return d;
    if (by === 'name') return a.name.localeCompare(b.name);
    if (by === 'recent') return b.created_at.localeCompare(a.created_at);
    if (by === 'status') return STATUS_RANK[a.status] - STATUS_RANK[b.status] || a.name.localeCompare(b.name);
    const ca = monthlyCost(a); const cb = monthlyCost(b);
    if (ca.complete !== cb.complete) return ca.complete ? -1 : 1;
    return ca.total - cb.total || a.name.localeCompare(b.name);
  });
  return out;
}

// ---------------------------------------------------------------- questions d'entretien et checklist de visite
export type PrepKind = 'interview' | 'visit';
/** Modèle fourni (textes traduits : gp.q.<clé> et gp.v.<clé>). */
export const INTERVIEW_TEMPLATE = ['experience', 'approval', 'children', 'day', 'meals', 'sleep', 'outings', 'illness', 'first_aid', 'adaptation', 'holidays', 'hours', 'screens', 'references'] as const;
export const VISIT_TEMPLATE = ['welcome', 'hygiene', 'safety', 'sleep_room', 'outdoor', 'meals', 'activities', 'adults', 'adaptation', 'hours', 'closures', 'illness', 'transmissions'] as const;
export const templateOf = (k: PrepKind): readonly string[] => (k === 'interview' ? INTERVIEW_TEMPLATE : VISIT_TEMPLATE);

export interface PrepItem { id: string; household_id: string; kind: PrepKind; template_key: string | null; label: string | null; position: number; archived: boolean; created_at?: string }
export interface PrepAnswer { id?: string; household_id: string; candidate_id: string; item_id: string; answer: string | null; checked: boolean; updated_at?: string }

/** Questions actives, dans l'ordre (position, puis date de création). */
export function activeItems(items: PrepItem[], kind: PrepKind): PrepItem[] {
  return items.filter((i) => i.kind === kind && !i.archived)
    .sort((a, b) => a.position - b.position || String(a.created_at ?? '').localeCompare(String(b.created_at ?? '')));
}

/** Avancement d'une candidate : réponses notées (entretien) ou points cochés (visite). */
export function progressOf(items: PrepItem[], answers: PrepAnswer[], candidateId: string, kind: PrepKind): { done: number; total: number } {
  const list = activeItems(items, kind);
  const done = list.filter((i) => {
    const a = answers.find((x) => x.candidate_id === candidateId && x.item_id === i.id);
    return !!a && (kind === 'visit' ? a.checked : !!(a.answer && a.answer.trim()) || a.checked);
  }).length;
  return { done, total: list.length };
}

// ---------------------------------------------------------------- planning, absences
export interface ScheduleDay { wd: number; start: string; end: string }
export interface Schedule { id: string; household_id: string; child_id: string; label: string; days: ScheduleDay[]; starts_on: ISODate; ends_on: ISODate | null }
export type AbsenceKind = 'child' | 'caregiver_leave' | 'closure';
export interface Absence { id: string; household_id: string; child_id: string; kind: AbsenceKind; from_on: ISODate; to_on: ISODate; caregiver_id: string | null; note: string | null; created_by?: string | null; _pending?: boolean }

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
export const minutesOf = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
/** « 8h30 », « 08:30 », « 8:30 » → « 08:30 » ; null si invalide. */
export function normTime(v: string): string | null {
  const m = v.trim().match(/^(\d{1,2})(?:\s*[:hH.]\s*(\d{2})?)?$/);
  if (!m) return null;
  const out = `${m[1].padStart(2, '0')}:${m[2] ?? '00'}`;
  return HHMM.test(out) ? out : null;
}
/** Créneau valide : jour 1 à 7, heures HH:MM, début avant fin (même règle que la base). */
export const validDay = (d: ScheduleDay) => Number.isInteger(d.wd) && d.wd >= 1 && d.wd <= 7 && HHMM.test(d.start) && HHMM.test(d.end) && d.start < d.end;

/** Jour ISO de la semaine : lundi = 1 … dimanche = 7. */
export function isoWeekday(date: ISODate): number {
  const [y, m, d] = date.split('-').map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return wd === 0 ? 7 : wd;
}
export const mondayOfWeek = (date: ISODate): ISODate => addDays(date, 1 - isoWeekday(date));
export const monthStart = (date: ISODate): ISODate => `${date.slice(0, 7)}-01`;
export function monthEnd(date: ISODate): ISODate {
  const [y, m] = date.split('-').map(Number);
  return toISODate(new Date(y, m, 0));
}

export const absencesOn = (date: ISODate, list: Absence[]) => list.filter((a) => a.from_on <= date && date <= a.to_on);

/** Planning applicable un jour donné (le plus récent qui couvre la date). */
export function scheduleOn(date: ISODate, schedules: Schedule[]): Schedule | null {
  return schedules.filter((s) => s.starts_on <= date && (!s.ends_on || date <= s.ends_on)).sort((a, b) => b.starts_on.localeCompare(a.starts_on))[0] ?? null;
}

export interface PlannedDay { date: ISODate; slots: ScheduleDay[]; plannedMin: number; absences: Absence[]; off: boolean }
/** Prévu un jour : créneaux du planning, sauf absence de l'enfant, congé de la nounou ou fermeture (alors 0). */
export function plannedOn(date: ISODate, schedules: Schedule[], absences: Absence[]): PlannedDay {
  const s = scheduleOn(date, schedules);
  const slots = (s?.days ?? []).filter((d) => d.wd === isoWeekday(date) && validDay(d));
  const abs = absencesOn(date, absences);
  const off = abs.length > 0;
  const plannedMin = off ? 0 : slots.reduce((sum, d) => sum + minutesOf(d.end) - minutesOf(d.start), 0);
  return { date, slots, plannedMin, absences: abs, off };
}

// ---------------------------------------------------------------- heures (arrivées / départs du carnet)
export interface PunchEvent { id: string; kind: 'arrival' | 'departure'; at: string; child_id: string; note?: string | null; _pending?: boolean }
export interface Shift { date: ISODate; arrival: PunchEvent | null; departure: PunchEvent | null; minutes: number }

const localDate = (iso: string) => toISODate(new Date(iso));
/** Une garde ne dépasse pas 16 h : au-delà, l'arrivée et le départ ne sont pas appariés (oubli de pointage). */
export const MAX_SHIFT_MIN = 16 * 60;

/**
 * Appariement arrivée → départ, dans l'ordre chronologique. Une arrivée sans départ (oubli) ou un départ sans arrivée
 * donne une ligne incomplète (0 minute), jamais une durée inventée.
 */
export function pairShifts(events: PunchEvent[]): Shift[] {
  const sorted = [...events].filter((e) => e.kind === 'arrival' || e.kind === 'departure').sort((a, b) => a.at.localeCompare(b.at));
  const out: Shift[] = [];
  let open: PunchEvent | null = null;
  for (const e of sorted) {
    if (e.kind === 'arrival') {
      if (open) out.push({ date: localDate(open.at), arrival: open, departure: null, minutes: 0 });
      open = e;
      continue;
    }
    if (open) {
      const min = Math.round((Date.parse(e.at) - Date.parse(open.at)) / 60_000);
      if (min >= 0 && min <= MAX_SHIFT_MIN) {
        out.push({ date: localDate(open.at), arrival: open, departure: e, minutes: min });
        open = null;
        continue;
      }
      out.push({ date: localDate(open.at), arrival: open, departure: null, minutes: 0 });
      open = null;
    }
    out.push({ date: localDate(e.at), arrival: null, departure: e, minutes: 0 });
  }
  if (open) out.push({ date: localDate(open.at), arrival: open, departure: null, minutes: 0 });
  return out;
}

export const sumMinutes = (shifts: Shift[], from: ISODate, to: ISODate) => shifts.filter((s) => s.date >= from && s.date <= to).reduce((n, s) => n + s.minutes, 0);

export interface PeriodSummary { workedMin: number; plannedMin: number; childDays: number; leaveDays: number; closureDays: number; incomplete: number }
/** Bilan d'une période : heures pointées, heures prévues (hors absences), jours d'absence par genre, pointages incomplets. */
export function periodSummary(from: ISODate, to: ISODate, shifts: Shift[], schedules: Schedule[], absences: Absence[]): PeriodSummary {
  const res: PeriodSummary = { workedMin: sumMinutes(shifts, from, to), plannedMin: 0, childDays: 0, leaveDays: 0, closureDays: 0, incomplete: 0 };
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const p = plannedOn(d, schedules, absences);
    res.plannedMin += p.plannedMin;
    if (p.absences.some((a) => a.kind === 'child')) res.childDays += 1;
    if (p.absences.some((a) => a.kind === 'caregiver_leave')) res.leaveDays += 1;
    if (p.absences.some((a) => a.kind === 'closure')) res.closureDays += 1;
  }
  res.incomplete = shifts.filter((s) => s.date >= from && s.date <= to && (!s.arrival || !s.departure)).length;
  return res;
}

/** « 7 h 45 » — durée en heures et minutes, sans arrondi. */
export function hoursLabel(min: number, h = 'h'): string {
  const m = Math.max(0, Math.round(min));
  return `${Math.floor(m / 60)} ${h} ${String(m % 60).padStart(2, '0')}`;
}
/** Heures décimales pour le tableur (7,75 en français : séparateur choisi par l'appelant). */
export const decimalHours = (min: number) => Math.round((min / 60) * 100) / 100;

export interface CsvLabels { date: string; arrival: string; departure: string; duration: string; hours: string; absence: string; total: string; notice: string; kinds: Record<AbsenceKind, string>; decimalComma: boolean }
const hhmmOf = (iso: string | undefined) => { if (!iso) return ''; const d = new Date(iso); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };

/** Export CSV d'une période : une ligne par pointage, les jours d'absence, le total et la mention « sans valeur légale ». */
export function hoursCsv(from: ISODate, to: ISODate, shifts: Shift[], absences: Absence[], l: CsvLabels): string {
  const sep = l.decimalComma ? ';' : ',';
  const dec = (n: number) => (l.decimalComma ? String(decimalHours(n)).replace('.', ',') : String(decimalHours(n)));
  const rows: string[][] = [[l.date, l.arrival, l.departure, l.duration, l.hours, l.absence]];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const day = shifts.filter((s) => s.date === d);
    const abs = absencesOn(d, absences).map((a) => l.kinds[a.kind]).join(' + ');
    if (!day.length && abs) rows.push([d, '', '', '', '', abs]);
    for (const s of day) rows.push([d, hhmmOf(s.arrival?.at), hhmmOf(s.departure?.at), s.minutes ? hoursLabel(s.minutes) : '', s.minutes ? dec(s.minutes) : '', abs]);
  }
  const total = sumMinutes(shifts, from, to);
  rows.push([l.total, '', '', hoursLabel(total), dec(total), '']);
  rows.push([l.notice, '', '', '', '', '']);
  return `﻿${rows.map((r) => r.map((c) => csvCell(c)).join(sep)).join('\r\n')}\r\n`;
}
