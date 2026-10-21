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

const clock = (iso: string, tz?: string) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: tz }).replace(':', ' h ');
const dayLabel = (iso: string, tz?: string) => new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: tz });
const inRange = (iso: string | null | undefined, from: Date, to: Date) => !!iso && Date.parse(iso) >= from.getTime() && Date.parse(iso) < to.getTime();

/** Début de la période : aujourd'hui 0 h, 7 jours, ou depuis le dernier rendez-vous passé (30 jours au plus). */
export function periodStart(period: SummaryPeriod, now: Date, lastAppointment?: string | null): Date {
  const d0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === 'day') return d0;
  if (period === 'week') return new Date(d0.getTime() - 6 * 86_400_000);
  const max = new Date(d0.getTime() - 29 * 86_400_000);
  return lastAppointment && Date.parse(lastAppointment) > max.getTime() ? new Date(lastAppointment) : max;
}

const OBS: Record<Observation['kind'], string> = {
  temperature: 'Température', medication: 'Médicament noté', symptom: 'Symptôme', note: 'Note', vomit: 'Vomissement', regurgitation: 'Régurgitation',
  diarrhea: 'Diarrhée', abdominal_pain: 'Douleur au ventre', bloating: 'Ballonnements', crying: 'Pleurs',
};

export function childSummary(d: ChildData, from: Date, to: Date, tz?: string): SummarySection[] {
  const out: SummarySection[] = [];
  const multiDay = to.getTime() - from.getTime() > 86_400_000 + 1;
  const when = (iso: string) => (multiDay ? `${dayLabel(iso, tz)} ${clock(iso, tz)}` : clock(iso, tz));

  const bottles = d.bottles.filter((b) => inRange(b.at, from, to)).sort((a, b) => b.at.localeCompare(a.at));
  const feeds = d.feeds.filter((f) => inRange(f.started_at, from, to)).sort((a, b) => b.started_at.localeCompare(a.started_at));
  if (bottles.length || feeds.length) {
    const ml = bottles.reduce((t, b) => t + (b.consumed_ml ?? 0), 0);
    const lines = [
      ...(bottles.length ? [`${bottles.length} biberon(s)${ml ? ` · ${ml} ml bus au total (quantités notées)` : ''}`] : []),
      ...(feeds.length ? [`${feeds.length} tétée(s)`] : []),
      ...bottles.slice(0, 5).map((b) => `Biberon ${when(b.at)}${b.consumed_ml != null ? ` · ${b.consumed_ml} ml bus` : ''}${b.prepared_ml != null ? ` (préparés : ${b.prepared_ml} ml)` : ''}`),
      ...feeds.slice(0, 5).map((f) => `Tétée ${when(f.started_at)}${f.ended_at ? ` · ${formatDuration((Date.parse(f.ended_at) - Date.parse(f.started_at)) / 60000)}` : ''} · ${f.side === 'left' ? 'gauche' : f.side === 'right' ? 'droit' : 'les deux'}`),
    ];
    out.push({ heading: 'Repas lactés', lines });
  }
  const sleeps = d.sleeps.filter((s) => inRange(s.started_at, from, to));
  if (sleeps.length) {
    const total = sleeps.reduce((t, s) => t + (s.ended_at ? (Date.parse(s.ended_at) - Date.parse(s.started_at)) / 60000 : 0), 0);
    const wake = sleeps.reduce((t, s) => t + (s.wakeups ?? 0), 0);
    out.push({ heading: 'Sommeil', lines: [`${sleeps.length} période(s) de sommeil notée(s) · ${formatDuration(total)} au total`, ...(wake ? [`${wake} réveil(s) noté(s)`] : []), ...(sleeps.some((s) => !s.ended_at) ? ['Un sommeil est en cours.'] : [])] });
  }
  const diapers = d.diapers.filter((x) => inRange(x.at, from, to));
  if (diapers.length) out.push({ heading: 'Couches', lines: [`${diapers.length} change(s) · ${diapers.filter((x) => x.wet).length} mouillée(s) · ${diapers.filter((x) => x.stool).length} selle(s)`, ...(diapers.some((x) => x.blood_seen) ? ['Sang noté dans une selle (à signaler au professionnel).'] : [])] });
  const meals = d.meals.filter((x) => inRange(x.at, from, to));
  if (meals.length) out.push({ heading: 'Repas', lines: meals.slice(0, 8).map((m) => `${when(m.at)} · ${m.description || m.foods.join(', ') || 'repas'}${m.reaction_note ? ` · réaction notée : ${m.reaction_note}` : ''}`) });
  const obs = d.observations.filter((x) => inRange(x.at, from, to));
  if (obs.length) out.push({ heading: 'Symptômes et observations notés', lines: obs.slice(0, 12).map((o) => `${when(o.at)} · ${OBS[o.kind]}${o.kind === 'temperature' && o.value_num != null ? ` ${String(o.value_num).replace('.', ',')} °C` : ''}${o.label ? ` · ${o.label}` : ''}`) });
  const meds = d.treatments.filter((t) => t.active || (t.end_date && Date.parse(t.end_date) >= from.getTime()));
  if (meds.length) {
    const logs = d.treatmentLogs.filter((l) => inRange(l.scheduled_for, from, to));
    out.push({ heading: 'Médicaments prescrits (saisis par le parent)', lines: meds.map((t) => {
      const mine = logs.filter((l) => l.treatment_id === t.id);
      return `${t.name} · ${t.dose_text}${t.times.length ? ` · ${t.times.join(', ')}` : ''}${mine.length ? ` · pris ${mine.filter((l) => l.status === 'taken').length}, reportés ${mine.filter((l) => l.status === 'snoozed').length}, ignorés ${mine.filter((l) => l.status === 'skipped').length}` : ''}`;
    }) });
  }
  const meas = d.measurements.filter((m) => Date.parse(m.measured_on) >= from.getTime() - 86_400_000 * 60).sort((a, b) => b.measured_on.localeCompare(a.measured_on)).slice(0, 3);
  if (meas.length) out.push({ heading: 'Mesures de croissance (dernières)', lines: meas.map((m) => `${new Date(m.measured_on).toLocaleDateString('fr-FR', { timeZone: tz })} · ${[m.weight_kg != null ? `${String(m.weight_kg).replace('.', ',')} kg` : null, m.height_cm != null ? `${String(m.height_cm).replace('.', ',')} cm` : null, m.head_cm != null ? `PC ${String(m.head_cm).replace('.', ',')} cm` : null].filter(Boolean).join(' · ')}${m.source === 'professional' ? ' (professionnel)' : ''}`) });
  const appts = d.appointments.filter((a) => Date.parse(a.starts_at) >= from.getTime()).sort((a, b) => a.starts_at.localeCompare(b.starts_at)).slice(0, 4);
  if (appts.length) out.push({ heading: 'Rendez-vous', lines: appts.map((a) => `${new Date(a.starts_at).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: tz })} · ${a.title}${a.questions?.length ? ` · ${a.questions.length} question(s) préparée(s)` : ''}`) });
  return out;
}

/** Texte à partager (message) : mêmes faits, sans mise en forme. */
export function summaryText(title: string, subtitle: string, sections: SummarySection[]): string {
  return [title, subtitle, '', ...sections.flatMap((s) => [s.heading.toUpperCase(), ...s.lines.map((l) => `- ${l}`), '']),
    'Faits enregistrés dans Toi & Moi par la famille. Ce résumé ne contient ni diagnostic ni interprétation médicale.'].join('\n');
}
