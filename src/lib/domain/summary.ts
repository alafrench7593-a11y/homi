/**
 * Résumés automatiques : les FAITS enregistrés par la famille pour un profil et une période, sans diagnostic ni
 * interprétation médicale. Utilisé à l'écran, dans le PDF exporté et dans le texte partagé.
 */
import type { Appointment, Bottle, Breastfeed, Diaper, Meal, Measurement, Observation, Sleep } from '../types';
import type { Treatment, TreatmentLog } from '../data/hooks-needs';
import { formatDuration } from './dates';

export type SummaryPeriod = 'day' | 'week' | 'appointment';
export interface SummarySection { heading: string; lines: string[] }
export interface ChildData {
  bottles: Bottle[]; feeds: Breastfeed[]; sleeps: Sleep[]; diapers: Diaper[]; meals: Meal[]; observations: Observation[];
  treatments: Treatment[]; treatmentLogs: TreatmentLog[]; appointments: Appointment[]; measurements: Measurement[];
}

import { formatDate, formatTime, localeTag, t as tr, type TKey } from '@/i18n';

const clock = (iso: string, tz?: string) => {
  const v = formatTime(iso, { hour: '2-digit', minute: '2-digit', timeZone: tz });
  return localeTag().startsWith('fr') ? v.replace(':', ' h ') : v;
};
const dayLabel = (iso: string, tz?: string) => formatDate(iso, { weekday: 'short', day: 'numeric', month: 'short', timeZone: tz });
const inRange = (iso: string | null | undefined, from: Date, to: Date) => !!iso && Date.parse(iso) >= from.getTime() && Date.parse(iso) < to.getTime();

/** Début de la période : aujourd'hui 0 h, 7 jours, ou depuis le dernier rendez-vous passé (30 jours au plus). */
export function periodStart(period: SummaryPeriod, now: Date, lastAppointment?: string | null): Date {
  // Jours calendaires locaux (et non « − n × 24 h ») : une période qui traverse un changement d'heure commence bien à 0 h
  const dayStart = (back: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - back);
  const d0 = dayStart(0);
  if (period === 'day') return d0;
  if (period === 'week') return dayStart(6);
  const max = dayStart(29);
  return lastAppointment && Date.parse(lastAppointment) > max.getTime() ? new Date(lastAppointment) : max;
}

const OBS_KEY: Record<Observation['kind'], string> = {
  temperature: 'temperature', medication: 'medication', symptom: 'symptom', note: 'note', vomit: 'vomit', regurgitation: 'regurgitation',
  diarrhea: 'diarrhea', abdominal_pain: 'abdominal_pain', bloating: 'bloating', crying: 'crying',
};
const obsLabel = (k: Observation['kind']) => tr(`l7.sum.obs_${OBS_KEY[k]}` as TKey);
/** Nombre décimal à virgule en français, à point en anglais. */
const dec = (n: number) => { const v = String(n); return localeTag().startsWith('fr') ? v.replace('.', ',') : v; };

export function childSummary(d: ChildData, from: Date, to: Date, tz?: string): SummarySection[] {
  const out: SummarySection[] = [];
  // Plusieurs jours calendaires (un jour de changement d'heure dure 25 h : ce n'est pas « plusieurs jours »)
  const multiDay = from.toDateString() !== new Date(to.getTime() - 1).toDateString();
  const when = (iso: string) => (multiDay ? `${dayLabel(iso, tz)} ${clock(iso, tz)}` : clock(iso, tz));

  const bottles = d.bottles.filter((b) => inRange(b.at, from, to)).sort((a, b) => b.at.localeCompare(a.at));
  const feeds = d.feeds.filter((f) => inRange(f.started_at, from, to)).sort((a, b) => b.started_at.localeCompare(a.started_at));
  if (bottles.length || feeds.length) {
    const ml = bottles.reduce((t, b) => t + (b.consumed_ml ?? 0), 0);
    const lines = [
      ...(bottles.length ? [`${tr('l7.sum.bottles_n', { n: String(bottles.length) })}${ml ? ` · ${tr('l7.sum.ml_total', { ml: String(ml) })}` : ''}`] : []),
      ...(feeds.length ? [tr('l7.sum.feeds_n', { n: String(feeds.length) })] : []),
      ...bottles.slice(0, 5).map((b) => `${tr('l7.sum.bottle_at', { when: when(b.at) })}${b.consumed_ml != null ? ` · ${tr('l7.sum.ml_drunk', { ml: String(b.consumed_ml) })}` : ''}${b.prepared_ml != null ? ` (${tr('l7.sum.ml_prepared', { ml: String(b.prepared_ml) })})` : ''}`),
      ...feeds.slice(0, 5).map((f) => `${tr('l7.sum.feed_at', { when: when(f.started_at) })}${f.ended_at ? ` · ${formatDuration((Date.parse(f.ended_at) - Date.parse(f.started_at)) / 60000)}` : ''} · ${f.side === 'left' ? tr('l7.sum.side_left') : f.side === 'right' ? tr('l7.sum.side_right') : tr('l7.sum.side_both')}`),
    ];
    out.push({ heading: tr('l7.sum.h_milk'), lines });
  }
  const sleeps = d.sleeps.filter((s) => inRange(s.started_at, from, to));
  if (sleeps.length) {
    const total = sleeps.reduce((t, s) => t + (s.ended_at ? (Date.parse(s.ended_at) - Date.parse(s.started_at)) / 60000 : 0), 0);
    const wake = sleeps.reduce((t, s) => t + (s.wakeups ?? 0), 0);
    out.push({ heading: tr('l7.sum.h_sleep'), lines: [tr('l7.sum.sleep_periods', { n: String(sleeps.length), total: formatDuration(total) }), ...(wake ? [tr('l7.sum.wakeups', { n: String(wake) })] : []), ...(sleeps.some((s) => !s.ended_at) ? [tr('l7.sum.sleep_ongoing')] : [])] });
  }
  const diapers = d.diapers.filter((x) => inRange(x.at, from, to));
  if (diapers.length) out.push({ heading: tr('l7.sum.h_diapers'), lines: [tr('l7.sum.diapers_line', { n: String(diapers.length), wet: String(diapers.filter((x) => x.wet).length), stool: String(diapers.filter((x) => x.stool).length) }), ...(diapers.some((x) => x.blood_seen) ? [tr('l7.sum.blood_seen')] : [])] });
  const meals = d.meals.filter((x) => inRange(x.at, from, to));
  if (meals.length) out.push({ heading: tr('l7.sum.h_meals'), lines: meals.slice(0, 8).map((m) => `${when(m.at)} · ${m.description || m.foods.join(', ') || tr('l7.sum.meal_word')}${m.reaction_note ? ` · ${tr('l7.sum.reaction_noted', { note: m.reaction_note })}` : ''}`) });
  const obs = d.observations.filter((x) => inRange(x.at, from, to));
  if (obs.length) out.push({ heading: tr('l7.sum.h_obs'), lines: obs.slice(0, 12).map((o) => `${when(o.at)} · ${obsLabel(o.kind)}${o.kind === 'temperature' && o.value_num != null ? ` ${dec(o.value_num)} °C` : ''}${o.label ? ` · ${o.label}` : ''}`) });
  const meds = d.treatments.filter((t) => t.active || (t.end_date && Date.parse(t.end_date) >= from.getTime()));
  if (meds.length) {
    const logs = d.treatmentLogs.filter((l) => inRange(l.scheduled_for, from, to));
    out.push({ heading: tr('l7.sum.h_meds'), lines: meds.map((t) => {
      const mine = logs.filter((l) => l.treatment_id === t.id);
      return `${t.name} · ${t.dose_text}${t.times.length ? ` · ${t.times.join(', ')}` : ''}${mine.length ? ` · ${tr('l7.sum.med_logs', { taken: String(mine.filter((l) => l.status === 'taken').length), snoozed: String(mine.filter((l) => l.status === 'snoozed').length), skipped: String(mine.filter((l) => l.status === 'skipped').length) })}` : ''}`;
    }) });
  }
  const meas = d.measurements.filter((m) => Date.parse(m.measured_on) >= from.getTime() - 86_400_000 * 60).sort((a, b) => b.measured_on.localeCompare(a.measured_on)).slice(0, 3);
  if (meas.length) out.push({ heading: tr('l7.sum.h_growth'), lines: meas.map((m) => `${formatDate(m.measured_on, { timeZone: tz })} · ${[m.weight_kg != null ? `${dec(m.weight_kg)} kg` : null, m.height_cm != null ? `${dec(m.height_cm)} cm` : null, m.head_cm != null ? tr('l7.sum.head_cm', { v: dec(m.head_cm) }) : null].filter(Boolean).join(' · ')}${m.source === 'professional' ? ` (${tr('l7.sum.professional')})` : ''}`) });
  const appts = d.appointments.filter((a) => Date.parse(a.starts_at) >= from.getTime()).sort((a, b) => a.starts_at.localeCompare(b.starts_at)).slice(0, 4);
  if (appts.length) out.push({ heading: tr('l7.sum.h_appts'), lines: appts.map((a) => `${new Date(a.starts_at).toLocaleString(localeTag(), { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: tz })} · ${a.title}${a.questions?.length ? ` · ${tr('l7.sum.questions_prepared', { n: String(a.questions.length) })}` : ''}`) });
  return out;
}

/** Texte à partager (message) : mêmes faits, sans mise en forme. */
export function summaryText(title: string, subtitle: string, sections: SummarySection[]): string {
  return [title, subtitle, '', ...sections.flatMap((s) => [s.heading.toUpperCase(), ...s.lines.map((l) => `- ${l}`), '']),
    tr('l7.sum.footer')].join('\n');
}
