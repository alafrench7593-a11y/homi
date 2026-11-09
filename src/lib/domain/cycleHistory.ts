/**
 * Calendrier privé du cycle : regroupe par jour les règles, la glaire, la température, les tests,
 * les symptômes, les notes et (seulement si l'option est activée) les rapports.
 * Les estimations croisées restent des ESTIMATIONS : jamais d'ovulation ni de grossesse « confirmée ».
 */
import { formatNumber, t as tr } from '@/i18n';
import { localized } from '@/i18n/localized';
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

const OVU_LABEL_FR: Record<string, string> = { positive: 'pic de LH possible', peak: 'pic de LH possible', negative: 'pic de LH non détecté', invalid: 'test invalide', uncertain: 'résultat incertain' };
const PREG_LABEL_FR: Record<string, string> = { positive: 'possiblement positif', faint: 'ligne pâle', negative: 'possiblement négatif', invalid: 'test invalide', uncertain: 'résultat incertain' };
const OVU_LABEL_EN: Record<string, string> = { positive: 'possible LH surge', peak: 'possible LH surge', negative: 'LH surge not detected', invalid: 'invalid test', uncertain: 'uncertain result' };
const PREG_LABEL_EN: Record<string, string> = { positive: 'possibly positive', faint: 'faint line', negative: 'possibly negative', invalid: 'invalid test', uncertain: 'uncertain result' };
const OVU_LABEL_ES: Record<string, string> = { positive: 'posible pico de LH', peak: 'posible pico de LH', negative: 'pico de LH no detectado', invalid: 'test no válido', uncertain: 'resultado incierto' };
const OVU_LABEL_DE: Record<string, string> = { positive: 'möglicher LH-Anstieg', peak: 'möglicher LH-Anstieg', negative: 'kein LH-Anstieg erkannt', invalid: 'ungültiger Test', uncertain: 'unsicheres Ergebnis' };
const OVU_LABEL_IT: Record<string, string> = { positive: 'possibile picco di LH', peak: 'possibile picco di LH', negative: 'picco di LH non rilevato', invalid: 'test non valido', uncertain: 'risultato incerto' };
const PREG_LABEL_ES: Record<string, string> = { positive: 'posiblemente positivo', faint: 'línea tenue', negative: 'posiblemente negativo', invalid: 'test no válido', uncertain: 'resultado incierto' };
const PREG_LABEL_DE: Record<string, string> = { positive: 'möglicherweise positiv', faint: 'schwache Linie', negative: 'möglicherweise negativ', invalid: 'ungültiger Test', uncertain: 'unsicheres Ergebnis' };
const PREG_LABEL_IT: Record<string, string> = { positive: 'forse positivo', faint: 'linea debole', negative: 'forse negativo', invalid: 'test non valido', uncertain: 'risultato incerto' };
const OVU_LABEL: Record<string, string> = localized(OVU_LABEL_FR, OVU_LABEL_EN, { es: OVU_LABEL_ES, de: OVU_LABEL_DE, it: OVU_LABEL_IT });
const PREG_LABEL: Record<string, string> = localized(PREG_LABEL_FR, PREG_LABEL_EN, { es: PREG_LABEL_ES, de: PREG_LABEL_DE, it: PREG_LABEL_IT });

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
    for (let d = p.start_date, i = 0; d <= end && i < 15; d = addDays(d, 1), i++) add(d, { kind: 'period', label: i === 0 ? tr('l8.ch.periodStart') : tr('l8.ch.period'), sourceId: p.id });
  }
  for (const o of input.observations) {
    if (o.cervical_mucus) add(o.observed_on, { kind: 'mucus', label: tr('l8.ch.mucus', { what: (mucusLabel(o.cervical_mucus) ?? o.cervical_mucus).toLowerCase() }), detail: o.photo_path ? tr('l8.ch.photoKept') : null, sourceId: o.id });
    if (o.bbt_celsius != null) add(o.observed_on, { kind: 'temperature', label: tr('l8.ch.temp', { value: formatNumber(o.bbt_celsius, { maximumFractionDigits: 2 }) }), sourceId: o.id });
    if (o.note) add(o.observed_on, { kind: 'note', label: tr('l8.ch.note'), detail: o.note, sourceId: o.id });
  }
  for (const t of input.ovulationTests) add(localDay(t.tested_at), { kind: 'ovulation_test', label: tr('l8.ch.ovuTest', { result: OVU_LABEL[t.result] ?? t.result }), detail: [t.brand_label, t.note].filter(Boolean).join(' · ') || null, sourceId: t.id });
  for (const t of input.pregnancyTests) add(localDay(t.tested_at), { kind: 'pregnancy_test', label: tr('l8.ch.pregTest', { result: PREG_LABEL[t.result] ?? t.result }), detail: [t.brand_label, t.note].filter(Boolean).join(' · ') || null, sourceId: t.id });
  for (const s of input.symptoms) add(s.logged_on, { kind: 'symptom', label: s.symptoms.length ? tr('l8.ch.symptomsList', { list: s.symptoms.join(', ') }) : tr('l8.ch.symptoms'), detail: s.note, sourceId: s.id });
  if (input.intercourse) for (const r of input.intercourse) add(r.occurred_on, { kind: 'intercourse', label: tr('l8.ch.intercourse'), sourceId: r.id });
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
      text: tr('l8.ch.estLh', { ovulation: fmt(ovulation), lh: fmt(lh), mucus: fertileMucus ? tr('l8.ch.estMucusPart') : '' }),
    };
  }
  const w = windows.find((x) => x.nextPeriod >= today) ?? windows[0];
  if (!w) return null;
  return { ovulation: w.ovulation, basis: 'calendar', text: tr('l8.ch.estCalendar', { ovulation: fmt(w.ovulation) }) };
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

const EVENT_LABEL_FR: Record<DayEventKind, string> = {
  period: 'Règles', mucus: 'Glaire', temperature: 'Température', ovulation_test: 'Test d’ovulation',
  pregnancy_test: 'Test de grossesse', symptom: 'Symptômes', intercourse: 'Rapport', note: 'Note',
};
const EVENT_LABEL_EN: Record<DayEventKind, string> = {
  period: 'Period', mucus: 'Mucus', temperature: 'Temperature', ovulation_test: 'Ovulation test',
  pregnancy_test: 'Pregnancy test', symptom: 'Symptoms', intercourse: 'Intercourse', note: 'Note',
};
const EVENT_LABEL_ES: Record<DayEventKind, string> = {
  period: 'Regla', mucus: 'Moco cervical', temperature: 'Temperatura', ovulation_test: 'Test de ovulación',
  pregnancy_test: 'Test de embarazo', symptom: 'Síntomas', intercourse: 'Relación sexual', note: 'Nota',
};
const EVENT_LABEL_DE: Record<DayEventKind, string> = {
  period: 'Periode', mucus: 'Zervixschleim', temperature: 'Temperatur', ovulation_test: 'Ovulationstest',
  pregnancy_test: 'Schwangerschaftstest', symptom: 'Symptome', intercourse: 'Geschlechtsverkehr', note: 'Notiz',
};
const EVENT_LABEL_IT: Record<DayEventKind, string> = {
  period: 'Mestruazioni', mucus: 'Muco cervicale', temperature: 'Temperatura', ovulation_test: 'Test di ovulazione',
  pregnancy_test: 'Test di gravidanza', symptom: 'Sintomi', intercourse: 'Rapporto', note: 'Nota',
};
export const EVENT_LABEL: Record<DayEventKind, string> = localized(EVENT_LABEL_FR, EVENT_LABEL_EN, { es: EVENT_LABEL_ES, de: EVENT_LABEL_DE, it: EVENT_LABEL_IT });
