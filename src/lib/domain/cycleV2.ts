/**
 * Suivi menstruel v2 : listes de valeurs (identiques aux contraintes de la base), lecture des anciens symptômes,
 * statistiques DESCRIPTIVES, calendrier mensuel, orientation prudente pour les pertes et les saignements.
 *
 * Règles : aucune observation n'est transformée en diagnostic ; les estimations restent des estimations ;
 * l'orientation médicale ne dépend que de signes explicitement saisis, et une orientation urgente n'attend rien.
 */
import { estimateCycle, type PeriodEntry as PeriodLike } from './cycle';

export const FLOWS = ['spotting', 'light', 'medium', 'heavy', 'very_heavy'] as const;
export type Flow = (typeof FLOWS)[number];

export const SYMPTOM_KEYS = [
  'cramps', 'pelvic_pain', 'back_pain', 'pain', 'fatigue', 'headache', 'bloating', 'nausea', 'breast_tenderness', 'digestion',
  'constipation', 'diarrhea', 'skin', 'acne', 'libido_up', 'libido_down', 'dizziness', 'hot_flashes', 'cravings', 'insomnia', 'other',
] as const;
export type SymptomKey = (typeof SYMPTOM_KEYS)[number];
/** Symptômes « libido » : affichés seulement si l'utilisatrice active le suivi de la sexualité. */
export const INTIMATE_SYMPTOMS: SymptomKey[] = ['libido_up', 'libido_down'];

/** Anciennes saisies (libellés français enregistrés tels quels) → clés. */
const LEGACY: Record<string, SymptomKey> = {
  'crampes': 'cramps', 'maux de tête': 'headache', 'seins sensibles': 'breast_tenderness', 'ballonnements': 'bloating', 'fatigue': 'fatigue',
  'nausées': 'nausea', 'acné': 'acne', 'douleur pelvienne': 'pelvic_pain', 'libido ↑': 'libido_up', 'libido ↓': 'libido_down', 'libido en hausse': 'libido_up',
  'libido en baisse': 'libido_down', 'douleurs': 'pain', 'mal de dos': 'back_pain',
};
export function symptomKeysOf(row: { symptom_keys?: string[] | null; symptoms?: string[] | null }): SymptomKey[] {
  const keys = new Set<SymptomKey>((row.symptom_keys ?? []).filter((k): k is SymptomKey => (SYMPTOM_KEYS as readonly string[]).includes(k)));
  for (const s of row.symptoms ?? []) { const k = LEGACY[s.trim().toLowerCase()]; if (k) keys.add(k); }
  return [...keys];
}

export const DISCHARGE = {
  amount: ['very_low', 'low', 'moderate', 'heavy', 'very_heavy', 'unsure'],
  color: ['clear', 'white', 'creamy_white', 'milky', 'pink', 'brown', 'yellowish', 'greenish', 'greyish', 'other', 'unsure'],
  textures: ['fluid', 'watery', 'creamy', 'sticky', 'elastic', 'stringy', 'slippery', 'thick', 'lumpy', 'other'],
  odor: ['none', 'usual_light', 'stronger', 'unusual', 'unpleasant', 'unsure'],
  symptoms: ['none', 'itching', 'irritation', 'burning', 'pain', 'urinary', 'painful_sex', 'dryness', 'other'],
  pregnancy: ['no', 'known', 'possible', 'unknown'],
} as const;

export interface DischargeObs {
  amount?: string | null; color?: string | null; textures?: string[]; odor?: string | null; symptoms?: string[];
  pregnancy?: string | null; recent_sex?: boolean | null; antibiotics?: boolean | null;
}

export type GuideSlug =
  | 'clear-fluid' | 'white-creamy' | 'stretchy-slippery' | 'more-abundant' | 'thick-lumpy' | 'yellow-green' | 'unusual-odor'
  | 'pink-brown' | 'itching' | 'dryness';

/** Fiches pertinentes pour une observation : uniquement pour LIRE, jamais une conclusion. */
export function guidesFor(o: DischargeObs): GuideSlug[] {
  const out: GuideSlug[] = [];
  const tx = new Set(o.textures ?? []);
  const sy = new Set(o.symptoms ?? []);
  if (o.color === 'clear' || tx.has('watery') || tx.has('fluid')) out.push('clear-fluid');
  if (o.color === 'white' || o.color === 'creamy_white' || o.color === 'milky' || tx.has('creamy')) out.push('white-creamy');
  if (tx.has('elastic') || tx.has('stringy') || tx.has('slippery')) out.push('stretchy-slippery');
  if (o.amount === 'heavy' || o.amount === 'very_heavy') out.push('more-abundant');
  if (tx.has('thick') || tx.has('lumpy')) out.push('thick-lumpy');
  if (o.color === 'yellowish' || o.color === 'greenish' || o.color === 'greyish') out.push('yellow-green');
  if (o.odor === 'stronger' || o.odor === 'unusual' || o.odor === 'unpleasant') out.push('unusual-odor');
  if (o.color === 'pink' || o.color === 'brown') out.push('pink-brown');
  if (sy.has('itching') || sy.has('irritation') || sy.has('burning')) out.push('itching');
  if (sy.has('dryness') || o.amount === 'very_low') out.push('dryness');
  return [...new Set(out)];
}

export type Orientation = 'urgent' | 'see_soon' | 'mention' | 'none';

/**
 * Orientation pour les pertes, d'après des signes SAISIS (jamais d'après une interprétation) :
 *  - « urgent » : grossesse connue ou possible avec pertes rosées/brunâtres et douleur ;
 *  - « see_soon » : démangeaisons, brûlure, douleur, odeur inhabituelle ou désagréable, couleur jaunâtre/verdâtre/grisâtre,
 *    gêne urinaire, douleur pendant les rapports, ou pertes rosées/brunâtres pendant une grossesse ;
 *  - « mention » : changement de quantité ou de texture sans autre signe ;
 *  - « none » : rien de particulier saisi.
 */
export function dischargeOrientation(o: DischargeObs): Orientation {
  const sy = new Set(o.symptoms ?? []);
  const pregnant = o.pregnancy === 'known' || o.pregnancy === 'possible';
  const bloodTinged = o.color === 'pink' || o.color === 'brown';
  if (pregnant && bloodTinged && sy.has('pain')) return 'urgent';
  if (sy.has('itching') || sy.has('burning') || sy.has('pain') || sy.has('urinary') || sy.has('painful_sex') || sy.has('irritation')) return 'see_soon';
  if (o.odor === 'unusual' || o.odor === 'unpleasant') return 'see_soon';
  if (o.color === 'yellowish' || o.color === 'greenish' || o.color === 'greyish') return 'see_soon';
  if (pregnant && bloodTinged) return 'see_soon';
  if (o.amount === 'very_heavy' || (o.textures ?? []).includes('lumpy') || o.odor === 'stronger') return 'mention';
  return 'none';
}

export const BLEEDING_KINDS = ['between_periods', 'after_sex', 'pink_brown', 'unknown_origin', 'during_pregnancy'] as const;
export interface BleedingObs { kind: string; amount?: string | null; pain?: boolean | null; pregnancy?: string | null }

/**
 * Saignements inhabituels : grossesse connue/possible avec saignement abondant OU douleur → urgent (numéro d'urgence) ;
 * saignement très abondant → urgent ; entre les règles ou après un rapport → consulter (pas en urgence) ; sinon noter.
 * L'écran affiche l'orientation AVANT tout enregistrement : rien ne retarde un appel.
 */
export function bleedingOrientation(b: BleedingObs): Orientation {
  const pregnant = b.kind === 'during_pregnancy' || b.pregnancy === 'known' || b.pregnancy === 'possible';
  const heavy = b.amount === 'heavy' || b.amount === 'very_heavy';
  if (b.amount === 'very_heavy') return 'urgent';
  if (pregnant && (heavy || b.pain)) return 'urgent';
  if (pregnant) return 'see_soon';
  if (b.kind === 'between_periods' || b.kind === 'after_sex' || b.kind === 'unknown_origin') return 'see_soon';
  return 'mention';
}

// ---------------------------------------------------------------- statistiques descriptives
const DAY = 86_400_000;
const toDay = (iso: string) => Math.floor(Date.parse(`${iso.slice(0, 10)}T00:00:00Z`) / DAY);

export interface CycleStats {
  cycles: { start: string; length: number }[];
  averageLength: number | null;
  shortest: number | null;
  longest: number | null;
  periodDurations: number[];
  averagePeriod: number | null;
  flowCounts: Record<string, number>;
  symptomCounts: { key: SymptomKey; count: number }[];
  /** Moyennes (1–5) sur les jours renseignés, sans interprétation. */
  wellbeing: { mood: number | null; energy: number | null; sleep: number | null; stress: number | null; days: number };
}

const mean = (a: number[]) => (a.length ? Math.round((a.reduce((x, y) => x + y, 0) / a.length) * 10) / 10 : null);

export function cycleStats(periods: (PeriodLike & { flow?: string | null })[], symptoms: { logged_on: string; symptom_keys?: string[] | null; symptoms?: string[] | null; mood?: number | null; energy?: number | null; sleep?: number | null; stress?: number | null }[]): CycleStats {
  const sorted = [...periods].sort((a, b) => a.start_date.localeCompare(b.start_date));
  const cycles: CycleStats['cycles'] = [];
  for (let i = 1; i < sorted.length; i++) {
    const len = toDay(sorted[i].start_date) - toDay(sorted[i - 1].start_date);
    if (len >= 15 && len <= 90) cycles.push({ start: sorted[i - 1].start_date, length: len });
  }
  const lens = cycles.map((c) => c.length);
  const periodDurations = sorted.filter((p) => p.end_date).map((p) => toDay(p.end_date!) - toDay(p.start_date) + 1).filter((d) => d >= 1 && d <= 15);
  const flowCounts: Record<string, number> = {};
  for (const p of sorted) if (p.flow) flowCounts[p.flow] = (flowCounts[p.flow] ?? 0) + 1;
  const counts = new Map<SymptomKey, number>();
  for (const s of symptoms) for (const k of symptomKeysOf(s)) counts.set(k, (counts.get(k) ?? 0) + 1);
  const pick = (k: 'mood' | 'energy' | 'sleep' | 'stress') => symptoms.map((s) => s[k]).filter((v): v is number => typeof v === 'number');
  return {
    cycles, averageLength: mean(lens), shortest: lens.length ? Math.min(...lens) : null, longest: lens.length ? Math.max(...lens) : null,
    periodDurations, averagePeriod: mean(periodDurations), flowCounts,
    symptomCounts: [...counts.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count),
    wellbeing: { mood: mean(pick('mood')), energy: mean(pick('energy')), sleep: mean(pick('sleep')), stress: mean(pick('stress')), days: symptoms.filter((s) => [s.mood, s.energy, s.sleep, s.stress].some((v) => typeof v === 'number')).length },
  };
}

// ---------------------------------------------------------------- calendrier mensuel
export interface DayCell {
  iso: string; inMonth: boolean; today: boolean;
  /** Règles ENREGISTRÉES ce jour. */
  period: boolean;
  /** Règles ESTIMÉES (jamais confondues avec les enregistrées). */
  estimatedPeriod: boolean;
  estimatedFertile: boolean;
  symptoms: number; discharge: boolean; bleeding: boolean; tests: number; journal: boolean; appointment: boolean;
}

const isoOf = (d: number) => new Date(d * DAY).toISOString().slice(0, 10);

/** Grille du mois (semaines commençant le lundi) avec ce qui a été saisi et, à part, ce qui est estimé. */
export function monthCells(year: number, month0: number, data: {
  periods: PeriodLike[]; symptoms: { logged_on: string }[]; discharge: { observed_at: string }[]; bleeding: { occurred_on: string }[];
  tests: { tested_on?: string; tested_at?: string; created_at?: string }[]; journal: { entry_on: string }[]; appointments?: { starts_at?: string; date?: string }[];
}, todayIso = new Date().toISOString().slice(0, 10)): DayCell[] {
  const first = Date.UTC(year, month0, 1) / DAY;
  const dow = (new Date(first * DAY).getUTCDay() + 6) % 7;
  const start = first - dow;
  const last = Date.UTC(year, month0 + 1, 0) / DAY;
  const end = last + (6 - ((new Date(last * DAY).getUTCDay() + 6) % 7));
  const recorded = new Set<number>();
  const sorted = [...data.periods].sort((a, b) => a.start_date.localeCompare(b.start_date));
  for (const p of sorted) {
    const s = toDay(p.start_date);
    const e = p.end_date ? toDay(p.end_date) : Math.min(s + 4, toDay(todayIso));
    for (let d = s; d <= e; d++) recorded.add(d);
  }
  const est = estimateCycle(sorted);
  const estimated = new Set<number>();
  const fertile = new Set<number>();
  if (est.nextPeriod) {
    const len = est.averageLength ?? 28;
    const dur = 5;
    for (let k = 0; k < 4; k++) {
      const s = toDay(est.nextPeriod) + k * len;
      for (let d = s; d < s + dur; d++) if (!recorded.has(d) && d > toDay(todayIso) - 1) estimated.add(d);
      const ov = s - 14;
      for (let d = ov - 5; d <= ov + 1; d++) if (d >= toDay(todayIso)) fertile.add(d);
    }
  }
  const countBy = (list: string[]) => { const m = new Map<number, number>(); for (const iso of list) { const d = toDay(iso); m.set(d, (m.get(d) ?? 0) + 1); } return m; };
  const sym = countBy(data.symptoms.map((x) => x.logged_on));
  const dis = countBy(data.discharge.map((x) => x.observed_at));
  const ble = countBy(data.bleeding.map((x) => x.occurred_on));
  const tst = countBy(data.tests.map((x) => x.tested_on ?? x.tested_at ?? x.created_at ?? '').filter(Boolean));
  const jou = countBy(data.journal.map((x) => x.entry_on));
  const app = countBy((data.appointments ?? []).map((x) => x.starts_at ?? x.date ?? '').filter(Boolean));
  const out: DayCell[] = [];
  for (let d = start; d <= end; d++) {
    out.push({
      iso: isoOf(d), inMonth: d >= first && d <= last, today: isoOf(d) === todayIso,
      period: recorded.has(d), estimatedPeriod: estimated.has(d), estimatedFertile: fertile.has(d) && !recorded.has(d),
      symptoms: sym.get(d) ?? 0, discharge: dis.has(d), bleeding: ble.has(d), tests: tst.get(d) ?? 0, journal: jou.has(d), appointment: app.has(d),
    });
  }
  return out;
}

/** Jour du cycle (1 = premier jour des dernières règles enregistrées), en jours calendaires locaux. */
export function cycleDayOn(periods: PeriodLike[], todayIso: string): number | null {
  const starts = periods.map((p) => p.start_date).filter((s) => s <= todayIso).sort();
  if (!starts.length) return null;
  const d = toDay(todayIso) - toDay(starts[starts.length - 1]) + 1;
  return d >= 1 && d <= 120 ? d : null;
}
