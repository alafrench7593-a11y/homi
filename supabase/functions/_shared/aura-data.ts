/**
 * HOMI Aura — données CHOISIES par la personne (module PUR). L'application n'envoie que des agrégats ou des entrées
 * qu'elle a cochées, après consentement explicite pour CETTE demande ; ce module refait la minimisation côté serveur :
 * schémas fermés, nombres bornés, listes de mots-clés courts, textes tronqués, aucun nom ni identifiant.
 * Rien n'est enregistré : les données servent à une seule réponse.
 */
// 'bottle' (21/11/2026, ticket 5) : biberons des 7 derniers jours, agrégats seulement (facturé comme « tool_analysis »)
export const AURA_ANALYSIS_KINDS = ['sleep', 'cycle', 'mood', 'diary', 'load', 'bottle'] as const;
export type AuraAnalysisKind = (typeof AURA_ANALYSIS_KINDS)[number];

export const MAX_JOURNAL_ENTRIES = 14;
export const MAX_ENTRY_TEXT = 400;

const num = (v: unknown, min: number, max: number, decimals = 0): number | null => {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) return null;
  const f = 10 ** decimals;
  return Math.round(v * f) / f;
};
const hm = (v: unknown) => (typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? v : null);
const day = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
/** Mots-clés : jetons techniques courts (« tired », « headache »), jamais du texte libre. */
const keys = (v: unknown, max = 8) => (Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string' && /^[a-z][a-z0-9_]{1,30}$/.test(x)))].slice(0, max) : []);
const text = (v: unknown) => (typeof v === 'string' ? v.replace(/[<>\u0000-\u0008\u000B-\u001F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, MAX_ENTRY_TEXT) : '');

export interface JournalEntry { date: string; mood: number | null; feelings: string[]; text: string }

/** Entrées d'un journal (humeur ou journal intime), au plus 14, triées par date. */
export function sanitizeJournal(raw: unknown): { journal: 'mood' | 'diary'; entries: JournalEntry[] } | null {
  const o = (raw && typeof raw === 'object' ? raw : null) as Record<string, unknown> | null;
  if (!o || (o.journal !== 'mood' && o.journal !== 'diary') || !Array.isArray(o.entries)) return null;
  const entries = o.entries.slice(0, MAX_JOURNAL_ENTRIES).map((e) => {
    const x = (e && typeof e === 'object' ? e : {}) as Record<string, unknown>;
    return { date: day(x.date), mood: num(x.mood, 1, 5), feelings: keys(x.feelings), text: o.journal === 'diary' ? text(x.text) : '' };
  }).filter((e): e is JournalEntry => !!e.date).sort((a, b) => a.date.localeCompare(b.date));
  return entries.length ? { journal: o.journal, entries } : null;
}

/** Données agrégées d'une analyse d'outil (schéma fermé par type). */
export function sanitizeAnalysis(kind: AuraAnalysisKind, raw: unknown): Record<string, unknown> | null {
  const d = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  let out: Record<string, unknown> = {};
  switch (kind) {
    case 'sleep':
      out = {
        age_months: num(d.age_months, 0, 72), days_noted: num(d.days_noted, 0, 14), avg_night_minutes: num(d.avg_night_minutes, 0, 900),
        avg_naps: num(d.avg_naps, 0, 8, 1), avg_nap_minutes: num(d.avg_nap_minutes, 0, 600), avg_wakeups: num(d.avg_wakeups, 0, 20, 1), usual_bedtime: hm(d.usual_bedtime),
      };
      break;
    case 'bottle':
      out = {
        window_days: num(d.window_days, 1, 14), days_noted: num(d.days_noted, 0, 14), age_months: num(d.age_months, 0, 72),
        avg_bottles_per_day: num(d.avg_bottles_per_day, 0, 24, 1), avg_ml_per_day: num(d.avg_ml_per_day, 0, 3000), avg_gap_minutes: num(d.avg_gap_minutes, 0, 1440),
      };
      break;
    case 'cycle':
      out = {
        cycles_count: num(d.cycles_count, 0, 48), avg_cycle_days: num(d.avg_cycle_days, 10, 120, 1), min_cycle_days: num(d.min_cycle_days, 10, 120),
        max_cycle_days: num(d.max_cycle_days, 10, 120), avg_period_days: num(d.avg_period_days, 1, 15, 1), top_symptoms: keys(d.top_symptoms),
      };
      break;
    case 'mood': {
      const dist = (d.distribution && typeof d.distribution === 'object' ? d.distribution : {}) as Record<string, unknown>;
      out = {
        window_days: num(d.window_days, 1, 92), checkins: num(d.checkins, 0, 400),
        distribution: Object.fromEntries(['1', '2', '3', '4', '5'].map((k) => [k, num(dist[k], 0, 400) ?? 0])), top_feelings: keys(d.top_feelings),
      };
      break;
    }
    case 'load': {
      const people = Array.isArray(d.by_person) ? d.by_person : [];
      const cats = Array.isArray(d.by_category) ? d.by_category : [];
      out = {
        window_days: num(d.window_days, 1, 92), tasks_total: num(d.tasks_total, 0, 2000),
        by_person: people.slice(0, 4).map((p) => {
          const x = (p && typeof p === 'object' ? p : {}) as Record<string, unknown>;
          return { who: ['me', 'other', 'shared', 'nobody'].includes(x.who as string) ? x.who : 'nobody', count: num(x.count, 0, 2000) ?? 0 };
        }),
        by_category: cats.slice(0, 14).map((c) => {
          const x = (c && typeof c === 'object' ? c : {}) as Record<string, unknown>;
          return { category: keys([x.category], 1)[0] ?? 'other', count: num(x.count, 0, 2000) ?? 0 };
        }),
      };
      break;
    }
    case 'diary': {
      const j = sanitizeJournal({ journal: 'diary', entries: d.entries });
      return j ? { entries: j.entries } : null;
    }
  }
  const meaningful = Object.values(out).some((v) => (Array.isArray(v) ? v.length > 0 : v && typeof v === 'object' ? Object.values(v).some((x) => x) : v != null));
  return meaningful ? out : null;
}

/** Textes libres présents dans les données (vérifiés par la détection de détresse AVANT tout). */
export function freeTexts(journal: ReturnType<typeof sanitizeJournal>, analysis: Record<string, unknown> | null): string[] {
  const out: string[] = [];
  for (const e of journal?.entries ?? []) if (e.text) out.push(e.text);
  const entries = (analysis?.entries ?? []) as JournalEntry[];
  for (const e of entries) if (e.text) out.push(e.text);
  return out;
}

/** Action facturée selon la demande (le coût affiché par l'application doit être le même). */
export function auraCreditAction(kind: 'chat' | 'reformulate' | 'analysis', o: { journal: boolean; analysis: AuraAnalysisKind | null }): 'assistant_question' | 'journal_summary' | 'tool_analysis' | 'action_plan' {
  if (kind === 'analysis') return o.analysis === 'diary' ? 'journal_summary' : o.analysis === 'load' ? 'action_plan' : 'tool_analysis';
  if (kind === 'chat' && o.journal) return 'journal_summary';
  return 'assistant_question';
}
