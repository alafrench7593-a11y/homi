/**
 * Frise d'une journée (00 h → 24 h) pour les outils du quotidien : couches, sommeils, tétées, biberons.
 * Logique pure : positionne les saisies RÉELLES du jour, rien n'est estimé ni recommandé.
 */

export type DayEventKind = 'diaper' | 'sleep' | 'feed' | 'bottle';

export interface DayEvent {
  kind: DayEventKind;
  /** Minutes depuis minuit (0..1440) du jour affiché, bornées au jour. */
  start: number;
  /** Fin (sommeils, tétées) ; absent pour un instant (couche, biberon). */
  end?: number;
  /** En cours (sommeil ou tétée sans fin). */
  open?: boolean;
  /** Pour les couches : mouillée / selles. */
  wet?: boolean;
  stool?: boolean;
  id?: string;
}

interface Timed { id?: string; at?: string; started_at?: string; ended_at?: string | null; wet?: boolean; stool?: boolean }

const DAY = 1440;

function dayStart(day: Date) {
  const d = new Date(day);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

const clampMin = (ms: number, base: number) => Math.max(0, Math.min(DAY, (ms - base) / 60000));

/** Saisies d'un type converties en événements du jour `day` (les sommeils commencés la veille sont coupés à minuit). */
export function toDayEvents(kind: DayEventKind, rows: Timed[], day: Date = new Date(), now: Date = new Date()): DayEvent[] {
  const base = dayStart(day);
  const end = base + DAY * 60000;
  const out: DayEvent[] = [];
  for (const r of rows) {
    if (kind === 'sleep' || kind === 'feed') {
      if (!r.started_at) continue;
      const s = Date.parse(r.started_at);
      const e = r.ended_at ? Date.parse(r.ended_at) : Math.min(now.getTime(), end);
      if (Number.isNaN(s) || e < base || s >= end) continue;
      out.push({ kind, id: r.id, start: clampMin(s, base), end: clampMin(Math.max(e, s), base), open: !r.ended_at });
    } else {
      if (!r.at) continue;
      const t = Date.parse(r.at);
      if (Number.isNaN(t) || t < base || t >= end) continue;
      out.push({ kind, id: r.id, start: clampMin(t, base), wet: r.wet, stool: r.stool });
    }
  }
  return out.sort((a, b) => a.start - b.start);
}

/** Position de « maintenant » sur la frise (minutes depuis minuit), ou null si le jour affiché n'est pas aujourd'hui. */
export function nowMinute(day: Date = new Date(), now: Date = new Date()): number | null {
  const base = dayStart(day);
  const m = (now.getTime() - base) / 60000;
  return m >= 0 && m < DAY ? m : null;
}

/** Dernier côté noté (allaitement), parmi les saisies — simple rappel, jamais une consigne. */
export function lastSide<T extends { side: 'left' | 'right' | 'both'; started_at: string }>(feeds: T[]): { side: T['side']; at: string } | null {
  const last = [...feeds].filter((f) => f.started_at).sort((a, b) => b.started_at.localeCompare(a.started_at))[0];
  return last ? { side: last.side, at: last.started_at } : null;
}

export type QuickDiaper = 'wet' | 'stool' | 'both';
/** Ligne de couche enregistrée en un geste « maintenant ». */
export function quickDiaperRow(kind: QuickDiaper, at: Date = new Date()) {
  return { at: at.toISOString(), wet: kind !== 'stool', stool: kind !== 'wet', stool_color: null, stool_consistency: null, blood_seen: false };
}

/** « il y a 2 h 10 », « il y a 25 min » (à partir de maintenant). */
export function agoLabel(iso: string, now: Date = new Date()): string {
  const m = Math.max(0, Math.round((now.getTime() - Date.parse(iso)) / 60000));
  if (m < 1) return 'à l’instant';
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return `il y a ${h} h${r ? ` ${String(r).padStart(2, '0')}` : ''}`;
}

/** Aliments proposés récemment (repas des N derniers jours), du plus récent au plus ancien, sans doublon. */
export function recentFoods(meals: { at: string; foods: string[] | null }[], limit = 12): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of [...meals].sort((a, b) => b.at.localeCompare(a.at))) {
    for (const f of m.foods ?? []) {
      const k = f.trim().toLowerCase();
      if (!k || seen.has(k)) continue;
      seen.add(k);
      out.push(f.trim());
      if (out.length >= limit) return out;
    }
  }
  return out;
}

/** Aliments proposés récemment (diversification), du plus récent au plus ancien, sans doublon : clé d'aliment ou nom. */
export function recentlyOffered(tastings: { food_key: string | null; food_name: string; tasted_on: string }[], today: string, days = 30, limit = 10): string[] {
  const from = new Date(`${today}T12:00:00`);
  from.setDate(from.getDate() - days);
  const fromISO = from.toISOString().slice(0, 10);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of [...tastings].sort((a, b) => b.tasted_on.localeCompare(a.tasted_on))) {
    if (t.tasted_on < fromISO || t.tasted_on > today) continue;
    const k = t.food_key ?? t.food_name;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(k);
    if (out.length >= limit) break;
  }
  return out;
}
