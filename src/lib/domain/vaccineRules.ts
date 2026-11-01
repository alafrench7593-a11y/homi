/**
 * Base de règles vaccinales versionnée (logique pure, testée).
 *  · Un calendrier = pays + version + date d'effet + règles + sources officielles.
 *  · Les calendriers intégrés à l'application (repli hors ligne) et ceux publiés dans la table vaccine_calendars
 *    sont fusionnés : la version en vigueur la plus récente pour le pays est retenue.
 *  · Les échéances sont calculées à partir de la date de naissance ET des doses réellement notées : une dose suivante
 *    garde l'écart prévu par le calendrier après la dose précédente notée.
 *  · Jamais « en retard », jamais « vacciné » sans saisie du parent.
 */
import { t as tr } from '@/i18n';
import { addDays, daysBetween, type ISODate } from './dates';

export interface VaccineSource { key: string; label: string; url: string; published: string; consulted: string }
export type VaccineStatus = 'mandatory' | 'recommended';

export interface VaccineRule {
  key: string;
  group: string;
  /** Âge indicatif en mois (début de fenêtre). */
  months: number;
  toMonths?: number;
  label: string;
  dose: string;
  /** Obligatoire pour les enfants nés à partir de cette date (sinon recommandé). */
  mandatoryFrom?: string;
  /** Population concernée (texte officiel résumé). */
  population?: string;
  note?: string;
  source: string;
}

export interface VaccineCalendar {
  country: string;
  version: string;
  label: string;
  effectiveFrom: ISODate;
  updated: ISODate;
  checked: ISODate;
  sourceUrl: string;
  sources: Record<string, VaccineSource>;
  rules: VaccineRule[];
  situational: string[];
}

/** Calendrier en vigueur pour un pays : la date d'effet la plus récente qui n'est pas dans le futur. */
export function selectCalendar(all: VaccineCalendar[], country: string, today: ISODate): VaccineCalendar | null {
  return all.filter((c) => c.country === country && c.effectiveFrom <= today && c.rules.length)
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom) || b.version.localeCompare(a.version))[0] ?? null;
}

/** Ligne de la table vaccine_calendars → calendrier (règles validées ; une ligne invalide est ignorée). */
export function calendarFromRow(row: { country: string; version: string; label: string; effective_from: string; updated_on: string; source_url: string; rules: unknown }, fallback: VaccineCalendar): VaccineCalendar | null {
  if (!Array.isArray(row.rules)) return null;
  const rules = (row.rules as Partial<VaccineRule>[]).filter((r): r is VaccineRule =>
    !!r && typeof r.key === 'string' && /^[a-z0-9_]{2,40}$/.test(r.key) && typeof r.group === 'string' && typeof r.months === 'number'
    && r.months >= 0 && r.months <= 240 && typeof r.label === 'string' && typeof r.dose === 'string' && typeof r.source === 'string');
  if (!rules.length || rules.length !== row.rules.length) return null;
  return {
    country: row.country, version: row.version, label: row.label, effectiveFrom: row.effective_from, updated: row.updated_on, checked: row.updated_on,
    sourceUrl: row.source_url, sources: { ...fallback.sources, official: { key: 'official', label: row.label, url: row.source_url, published: row.updated_on, consulted: row.updated_on } },
    rules: rules.map((r) => ({ ...r, source: fallback.sources[r.source] ? r.source : 'official' })), situational: fallback.situational,
  };
}

/** Ajoute des mois à une date ISO (fin de mois gérée : 31 janvier + 1 mois → 28/29 février). */
export function addMonthsISO(iso: ISODate, months: number): ISODate {
  const [y, m, d] = iso.split('-').map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, last));
  return target.toISOString().slice(0, 10);
}

export type DoseState = 'done' | 'planned' | 'postponed' | 'upcoming' | 'due' | 'later' | 'check';
export interface ScheduledDose extends VaccineRule {
  date: ISODate;
  dateTo?: ISODate;
  status: VaccineStatus;
  state: DoseState;
  doneOn?: string | null;
  /** Rang dans la série (1re, 2e…) et nombre de doses de la série. */
  index: number;
  series: number;
  /** Date recalculée à partir de la dose précédente réellement notée. */
  shifted?: boolean;
  postponedTo?: ISODate | null;
}

export interface ScheduleOptions {
  done?: Record<string, string | null>;
  planned?: string[];
  postponed?: Record<string, ISODate | null>;
}

export function scheduleFor(cal: VaccineCalendar, birthDate: ISODate, today: ISODate, o: ScheduleOptions = {}): ScheduledDose[] {
  const done = o.done ?? {};
  const planned = o.planned ?? [];
  const postponed = o.postponed ?? {};
  const byGroup = new Map<string, VaccineRule[]>();
  for (const r of cal.rules) byGroup.set(r.group, [...(byGroup.get(r.group) ?? []), r]);
  return cal.rules.map((v) => {
    const series = byGroup.get(v.group)!;
    const index = series.indexOf(v);
    let date = addMonthsISO(birthDate, v.months);
    let shifted = false;
    // Écart du calendrier après la dose précédente notée (si elle a été faite plus tard que la date indicative)
    const prev = index > 0 ? series[index - 1] : null;
    const prevDone = prev ? done[prev.key] : null;
    if (prev && prevDone) {
      const after = addMonthsISO(prevDone, v.months - prev.months);
      if (after > date) { date = after; shifted = true; }
    }
    const dateTo = v.toMonths ? addMonthsISO(birthDate, v.toMonths) : undefined;
    const status: VaccineStatus = v.mandatoryFrom && birthDate >= v.mandatoryFrom ? 'mandatory' : 'recommended';
    const end = dateTo && dateTo > date ? dateTo : addDays(date, 30);
    let state: DoseState;
    if (v.key in done) state = 'done';
    else if (planned.includes(v.key)) state = 'planned';
    else if (v.key in postponed) state = 'postponed';
    else if (today < date) state = daysBetween(today, date) <= 45 ? 'upcoming' : 'later';
    else if (today <= end) state = 'due';
    else state = 'check';
    return {
      ...v, date, ...(dateTo ? { dateTo } : {}), status, state, doneOn: done[v.key] ?? null, index: index + 1, series: series.length,
      ...(shifted ? { shifted } : {}), ...(v.key in postponed ? { postponedTo: postponed[v.key] } : {}),
    };
  });
}

/** Regroupe par âge (« 2 mois », « 16 à 18 mois »…) dans l'ordre du calendrier. */
export function byVisit(list: ScheduledDose[]): { months: number; toMonths?: number; date: ISODate; doses: ScheduledDose[] }[] {
  const out: { months: number; toMonths?: number; date: ISODate; doses: ScheduledDose[] }[] = [];
  for (const d of list) {
    const g = out.find((x) => x.months === d.months && x.toMonths === d.toMonths);
    if (g) g.doses.push(d); else out.push({ months: d.months, toMonths: d.toMonths, date: d.date, doses: [d] });
  }
  return out;
}

/** Prochaines échéances (non faites, non reportées), la plus proche d'abord. */
export function nextDoses(list: ScheduledDose[], n = 3): ScheduledDose[] {
  return list.filter((d) => d.state === 'upcoming' || d.state === 'due' || d.state === 'planned').sort((a, b) => a.date.localeCompare(b.date)).slice(0, n);
}

/** Texte de la notification « à vérifier prochainement » (jamais de détail médical sur l'écran verrouillé). */
export function vaccineNotice(cal: Pick<VaccineCalendar, 'version' | 'country'>, name: string): string {
  const which = cal.country === 'FR' ? tr('l3.vaccine.cal_fr', { version: cal.version }) : tr('l3.vaccine.cal', { version: cal.version });
  return tr('l3.vaccine.notice', { which, name });
}
