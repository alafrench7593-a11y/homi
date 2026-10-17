/**
 * Calendrier privé du cycle : regroupe par jour les règles, la glaire, la température, les tests,
 * les symptômes, les notes et (seulement si l'option est activée) les rapports.
 * Les estimations croisées restent des ESTIMATIONS : jamais d'ovulation ni de grossesse « confirmée ».
 */
import { addDays, type ISODate } from './dates';
import type { FertileWindowEstimate } from './cycle';
import { fertilitySign, mucusLabel } from '../cycleAnalysis/mucus';

export type DayEventKind = 'period' | 'mucus' | 'temperature' | 'ovulation_test' | 'pregnancy_test' | 'symptom' | 'intercourse' | 'note';

export interface DayEvent { kind: DayEventKind; label: string; detail?: string | null; sourceId?: string }

export interface HistoryInput {
  periods: { id?: string; start_date: string; end_date?: string | null }[];
  observations: { id: string; observed_on: string; bbt_celsius: number | null; cervical_mucus: string | null; note: string | null; photo_path?: string | null }[];
  ovulationTests: { id: string; tested_at: string; result: string; analysis_outcome?: string | null; brand_label?: string | null; note: string | null }[];
  pregnancyTests: { id: string; tested_at: string; result: string; analysis_outcome?: string | null; brand_label?: string | null; note: string | null }[];
  symptoms: { id: string; logged_on: string; symptoms: string[]; note: string | null }[];
  /** null = option « rapports » désactivée : rien n'est affiché. */
  intercourse: { id: string; occurred_on: string }[] | null;
}

const OVU_LABEL: Record<string, string> = { positive: 'pic de LH possible', peak: 'pic de LH possible', negative: 'pic de LH non détecté', invalid: 'test invalide', uncertain: 'résultat incertain' };
const PREG_LABEL: Record<string, string> = { positive: 'possiblement positif', faint: 'ligne pâle', negative: 'possiblement négatif', invalid: 'test invalide', uncertain: 'résultat incertain' };

/** Date locale (AAAA-MM-JJ) d'un horodatage. */
export function localDay(ts: string): ISODate {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts.slice(0, 10);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function buildDayEvents(input: HistoryInput): Map<ISODate, DayEvent[]> {
  const map = new Map<ISODate, DayEvent[]>();
  const add = (day: ISODate, e: DayEvent) => {
    const list = map.get(day) ?? [];
    list.push(e);
    map.set(day, list);
  };
  for (const p of input.periods) {
    const end = p.end_date && p.end_date >= p.start_date ? p.end_date : p.start_date;
    for (let d = p.start_date, i = 0; d <= end && i < 15; d = addDays(d, 1), i++) add(d, { kind: 'period', label: i === 0 ? 'Début des règles' : 'Règles', sourceId: p.id });
  }
  for (const o of input.observations) {
    if (o.cervical_mucus) add(o.observed_on, { kind: 'mucus', label: `Glaire : ${(mucusLabel(o.cervical_mucus) ?? o.cervical_mucus).toLowerCase()}`, detail: o.photo_path ? 'Photo gardée (chiffrée)' : null, sourceId: o.id });
    if (o.bbt_celsius != null) add(o.observed_on, { kind: 'temperature', label: `Température : ${String(o.bbt_celsius).replace('.', ',')} °C`, sourceId: o.id });
    if (o.note) add(o.observed_on, { kind: 'note', label: 'Note', detail: o.note, sourceId: o.id });
  }
  for (const t of input.ovulationTests) add(localDay(t.tested_at), { kind: 'ovulation_test', label: `Test d’ovulation : ${OVU_LABEL[t.result] ?? t.result}`, detail: [t.brand_label, t.note].filter(Boolean).join(' · ') || null, sourceId: t.id });
  for (const t of input.pregnancyTests) add(localDay(t.tested_at), { kind: 'pregnancy_test', label: `Test de grossesse : ${PREG_LABEL[t.result] ?? t.result}`, detail: [t.brand_label, t.note].filter(Boolean).join(' · ') || null, sourceId: t.id });
  for (const s of input.symptoms) add(s.logged_on, { kind: 'symptom', label: s.symptoms.length ? `Symptômes : ${s.symptoms.join(', ')}` : 'Symptômes', detail: s.note, sourceId: s.id });
  if (input.intercourse) for (const r of input.intercourse) add(r.occurred_on, { kind: 'intercourse', label: 'Rapport', sourceId: r.id });
  return map;
}

export interface CrossedEstimate {
  /** Date d'ovulation ESTIMÉE (jamais confirmée). */
  ovulation: ISODate;
  basis: 'calendar' | 'lh_test' | 'lh_test_and_mucus';
  text: string;
}

/**
 * Croise le calendrier, les tests d'ovulation et la glaire pour affiner l'estimation du cycle en cours.
 * La hausse de LH précède généralement l'ovulation d'environ 24 à 36 heures : on estime donc le lendemain du test.
 */
export function crossedOvulationEstimate(
  windows: FertileWindowEstimate[],
  lastPeriodStart: ISODate | null,
  input: Pick<HistoryInput, 'ovulationTests' | 'observations'>,
  today: ISODate,
): CrossedEstimate | null {
  const fmt = (d: ISODate) => `${Number(d.slice(8, 10))}/${d.slice(5, 7)}`;
  const lhDays = input.ovulationTests
    .filter((t) => t.result === 'positive' || t.result === 'peak')
    .map((t) => localDay(t.tested_at))
    .filter((d) => (!lastPeriodStart || d >= lastPeriodStart) && d <= today)
    .sort();
  if (lhDays.length) {
    const lh = lhDays[0];
    const ovulation = addDays(lh, 1);
    const fertileMucus = input.observations.some((o) => fertilitySign(o.cervical_mucus as never) === 'potentially_fertile' && Math.abs(Date.parse(o.observed_on) - Date.parse(lh)) <= 2 * 86400000);
    return {
      ovulation,
      basis: fertileMucus ? 'lh_test_and_mucus' : 'lh_test',
      text: `Ovulation estimée vers le ${fmt(ovulation)}, d’après votre test d’ovulation positif du ${fmt(lh)}${fertileMucus ? ' et vos observations de glaire' : ''}. C’est une estimation : un test d’ovulation ne prouve pas que l’ovulation a eu lieu.`,
    };
  }
  const w = windows.find((x) => x.nextPeriod >= today) ?? windows[0];
  if (!w) return null;
  return { ovulation: w.ovulation, basis: 'calendar', text: `Ovulation estimée vers le ${fmt(w.ovulation)}, d’après la durée de vos cycles. C’est une estimation, pas une certitude.` };
}

export const EVENT_COLOURS: Record<DayEventKind, string> = {
  period: '#E0607E',
  mucus: '#7FB6E8',
  temperature: '#F2A65A',
  ovulation_test: '#9B7FD4',
  pregnancy_test: '#4FB39A',
  symptom: '#C9A227',
  intercourse: '#D46FA8',
  note: '#8C8C99',
};

export const EVENT_LABEL: Record<DayEventKind, string> = {
  period: 'Règles', mucus: 'Glaire', temperature: 'Température', ovulation_test: 'Test d’ovulation',
  pregnancy_test: 'Test de grossesse', symptom: 'Symptômes', intercourse: 'Rapport', note: 'Note',
};
