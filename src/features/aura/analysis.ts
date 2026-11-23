/**
 * « Analyser avec HOMI Aura » — agrégats MINIMISÉS calculés sur le téléphone (logique pure, testée). Seuls ces chiffres
 * partent, après que la personne les a vus et a donné son accord pour CETTE analyse : jamais un prénom, une date de
 * naissance, une note libre (sauf les pages du journal qu'elle coche elle-même), ni un identifiant.
 */
import type { MoodCheckin } from '@/lib/types';
import type { LoadRow } from '@/lib/domain/mentalLoad';
import type { SleepContext } from '../../../supabase/functions/_shared/assistant-prompt';

const DAY = 86_400_000;
const r1 = (n: number) => Math.round(n * 10) / 10;

/** Humeur sur `windowDays` jours : nombre de bilans, répartition 1–5, ressentis les plus fréquents (mots-clés). */
export function moodAggregate(rows: readonly MoodCheckin[], now = new Date(), windowDays = 30) {
  const since = now.getTime() - windowDays * DAY;
  const recent = rows.filter((r) => Date.parse(r.checked_at) >= since);
  if (!recent.length) return null;
  const distribution: Record<string, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const feelings = new Map<string, number>();
  for (const r of recent) {
    distribution[String(r.mood)] = (distribution[String(r.mood)] ?? 0) + 1;
    for (const f of r.feelings) if (/^[a-z][a-z0-9_]{1,30}$/.test(f)) feelings.set(f, (feelings.get(f) ?? 0) + 1);
  }
  const top = [...feelings.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k);
  return { window_days: windowDays, checkins: recent.length, distribution, top_feelings: top };
}

/** Cycle : moyennes descriptives déjà affichées par l'écran de statistiques. */
export function cycleAggregate(s: { cycles: unknown[]; averageLength: number | null; shortest: number | null; longest: number | null; averagePeriod: number | null; symptomCounts: { key: string; count: number }[] }) {
  if (!s.cycles.length && s.averagePeriod == null) return null;
  return {
    cycles_count: s.cycles.length, avg_cycle_days: s.averageLength != null ? r1(s.averageLength) : null, min_cycle_days: s.shortest, max_cycle_days: s.longest,
    avg_period_days: s.averagePeriod != null ? r1(s.averagePeriod) : null, top_symptoms: s.symptomCounts.slice(0, 5).map((x) => x.key),
  };
}

/** Sommeil d'un enfant : moyennes de la semaine (déjà calculées pour « M'aider pour les nuits »), âge en mois seulement. */
export function sleepAggregate(z: SleepContext | null | undefined) {
  if (!z || z.daysNoted < 1) return null;
  return {
    age_months: z.ageMonths, days_noted: z.daysNoted, avg_night_minutes: z.nightMinutes ?? null, avg_naps: z.napsPerDay ?? null,
    avg_nap_minutes: z.napMinutes ?? null, avg_wakeups: z.nightWakeups ?? null, usual_bedtime: z.usualBedtime ?? null,
  };
}

/** Charge mentale sur 30 jours : « moi » / « l'autre adulte » (jamais un prénom), tâches par catégorie. */
export function loadAggregate(rows: readonly LoadRow[], me: string | null | undefined, tasks: readonly { category?: string | null; created_at: string }[], now = new Date()) {
  const since = now.getTime() - 30 * DAY;
  const recent = tasks.filter((t) => Date.parse(t.created_at) >= since);
  const total = rows.reduce((n, r) => n + r.thought + r.done, 0);
  if (!total && !recent.length) return null;
  const byCat = new Map<string, number>();
  for (const t of recent) { const c = t.category && /^[a-z_]{2,30}$/.test(t.category) ? t.category : 'other'; byCat.set(c, (byCat.get(c) ?? 0) + 1); }
  return {
    window_days: 30, tasks_total: recent.length,
    by_person: rows.slice(0, 4).map((r) => ({ who: r.person === me ? 'me' : 'other', count: r.thought + r.done })),
    by_category: [...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([category, count]) => ({ category, count })),
  };
}

/**
 * Biberons d'un enfant sur 7 jours (ticket 5) : moyennes calculées SUR LE TÉLÉPHONE, âge en mois seulement.
 * Moins de 3 jours notés → `null` : l'écran dit clairement qu'il n'y a pas assez de données (aucune conclusion inventée).
 */
export const BOTTLE_MIN_DAYS = 3;
export function bottleAggregate(
  bottles: readonly { at: string; consumed_ml: number | null }[], birthDate: string | null | undefined, now = new Date(), windowDays = 7,
) {
  const since = now.getTime() - windowDays * DAY;
  const recent = bottles.filter((b) => { const t = Date.parse(b.at); return t >= since && t <= now.getTime(); }).sort((a, b) => a.at.localeCompare(b.at));
  const dayOf = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; };
  const days = new Map<string, { n: number; ml: number; withMl: boolean }>();
  for (const b of recent) {
    const k = dayOf(b.at);
    const cur = days.get(k) ?? { n: 0, ml: 0, withMl: false };
    cur.n += 1;
    if (b.consumed_ml != null) { cur.ml += b.consumed_ml; cur.withMl = true; }
    days.set(k, cur);
  }
  if (days.size < BOTTLE_MIN_DAYS) return null;
  const gaps: number[] = [];
  for (let i = 1; i < recent.length; i++) gaps.push((Date.parse(recent[i].at) - Date.parse(recent[i - 1].at)) / 60_000);
  const mlDays = [...days.values()].filter((d) => d.withMl);
  const birth = birthDate ? Date.parse(birthDate) : NaN;
  return {
    window_days: windowDays,
    days_noted: days.size,
    age_months: Number.isFinite(birth) ? Math.max(0, Math.floor((now.getTime() - birth) / (30.44 * DAY))) : null,
    avg_bottles_per_day: r1(recent.length / days.size),
    avg_ml_per_day: mlDays.length ? Math.round(mlDays.reduce((s, d) => s + d.ml, 0) / mlDays.length) : null,
    avg_gap_minutes: gaps.length ? Math.round(gaps.reduce((s, g) => s + g, 0) / gaps.length) : null,
  };
}

/** Période couverte par une analyse, affichée AVANT l'envoi (clé de traduction + nombre de jours éventuel). */
export function analysisPeriod(kind: string, data: Record<string, unknown> | null): { key: string; days: number | null } {
  if (kind === 'cycle') return { key: 'sa.an.period.cycles', days: null };
  if (kind === 'diary') return { key: 'sa.an.period.pages', days: null };
  if (kind === 'nap') return { key: 'sa.an.period.days', days: typeof data?.period_days === 'number' ? data.period_days : 14 };
  const days = typeof data?.window_days === 'number' ? data.window_days : kind === 'sleep' ? 7 : kind === 'load' ? 30 : null;
  return { key: 'sa.an.period.days', days };
}

/** Lignes lisibles de l'aperçu « ce qui sera envoyé » : clé → valeur (sans transformation). */
export function previewRows(data: Record<string, unknown>): { key: string; value: string }[] {
  const out: { key: string; value: string }[] = [];
  for (const [key, v] of Object.entries(data)) {
    if (v == null || (Array.isArray(v) && !v.length)) continue;
    if (key === 'entries' && Array.isArray(v)) { out.push({ key, value: String(v.length) }); continue; }
    if (Array.isArray(v)) out.push({ key, value: v.map((x) => (x && typeof x === 'object' ? Object.values(x).join(' : ') : String(x))).join(', ') });
    else if (typeof v === 'object') out.push({ key, value: Object.entries(v as Record<string, unknown>).map(([k, n]) => `${k} : ${n}`).join(' · ') });
    else out.push({ key, value: String(v) });
  }
  return out;
}

/**
 * Sieste en cours : ce qui part pour « Analyser avec Aura » — l'heure d'endormissement, la durée écoulée et les DURÉES
 * des siestes comparables (nap-window.ts) ; jamais un prénom, une date, une note ni un identifiant. Le serveur
 * recalcule plage, nombre dans la plage et fenêtre à partir de ces durées.
 */
export function napPayload(o: { startedAt: string; now: Date; ongoing: boolean; ageMonths: number | null; samples: readonly { started_at: string; minutes: number }[] }) {
  const s = new Date(o.startedAt);
  const hm = `${String(s.getHours()).padStart(2, '0')}:${String(s.getMinutes()).padStart(2, '0')}`;
  const oldest = o.samples.length ? Date.parse(o.samples[o.samples.length - 1].started_at) : null;
  return {
    age_months: o.ageMonths,
    started_hm: hm,
    elapsed_minutes: Math.max(0, Math.round((o.now.getTime() - s.getTime()) / 60_000)),
    ongoing: o.ongoing,
    comparable_minutes: o.samples.map((x) => x.minutes),
    period_days: oldest != null ? Math.max(1, Math.ceil((s.getTime() - oldest) / DAY)) : 0,
  };
}
