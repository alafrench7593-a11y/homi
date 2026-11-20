/**
 * « Analyser avec HOMI IA » — agrégats MINIMISÉS calculés sur le téléphone (logique pure, testée). Seuls ces chiffres
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
