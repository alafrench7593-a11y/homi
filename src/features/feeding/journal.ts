/**
 * 75 — Allaitement mixte · 83 — Analyse des habitudes d'alimentation · 84 — Export du journal alimentaire.
 * Logique pure (testée) : tétées, biberons et repas DÉJÀ notés, réunis dans un seul journal, par jour et par semaine.
 *
 * Présentation strictement factuelle : nombres, durées et quantités notées, répartition des prises notées (au sein /
 * au biberon). Aucune norme, aucune « bonne quantité », aucun objectif, aucune comparaison avec d'autres enfants.
 * Les jours sont ceux de l'appareil (heure locale), comme le reste du suivi.
 */
import { csvCell } from '@/lib/csv';
import { addDays, todayISO } from '@/lib/domain/dates';

export type FeedKind = 'breast' | 'bottle' | 'meal';
export interface FeedEntry {
  id: string; kind: FeedKind; at: string; day: string;
  /** tétée : durée notée (min) ; null si la fin n'est pas notée */
  minutes: number | null; side: 'left' | 'right' | 'both' | null;
  /** biberon : quantité bue si notée, sinon préparée */
  ml: number | null; mlKind: 'consumed' | 'prepared' | null; milk: string | null;
  foods: string[]; refused: string[]; description: string | null; note: string | null; by: string | null; pending: boolean;
}

interface BreastIn { id: string; started_at: string; ended_at: string | null; side: 'left' | 'right' | 'both'; note?: string | null; created_by?: string | null; _pending?: boolean }
interface BottleIn { id: string; at: string; prepared_ml: number | null; consumed_ml: number | null; milk_type: string | null; note?: string | null; created_by?: string | null; _pending?: boolean }
interface MealIn { id: string; at: string; foods: string[]; refused_foods?: string[] | null; description: string | null; note?: string | null; reaction_note?: string | null; created_by?: string | null; _pending?: boolean }

const dayOf = (iso: string) => todayISO(new Date(iso));

/** Journal unique, du plus récent au plus ancien (une saisie encore hors ligne compte, marquée « en attente »). */
export function buildEntries(breastfeeds: BreastIn[], bottles: BottleIn[], meals: MealIn[]): FeedEntry[] {
  const base = { minutes: null, side: null, ml: null, mlKind: null, milk: null, foods: [], refused: [], description: null } as const;
  const out: FeedEntry[] = [
    ...breastfeeds.map((b) => {
      const mins = b.ended_at ? Math.round((Date.parse(b.ended_at) - Date.parse(b.started_at)) / 60_000) : null;
      return { ...base, id: b.id, kind: 'breast' as const, at: b.started_at, day: dayOf(b.started_at), minutes: mins != null && mins >= 0 ? mins : null, side: b.side, note: b.note ?? null, by: b.created_by ?? null, pending: !!b._pending, foods: [], refused: [] };
    }),
    ...bottles.map((b) => ({
      ...base, id: b.id, kind: 'bottle' as const, at: b.at, day: dayOf(b.at), ml: b.consumed_ml ?? b.prepared_ml ?? null,
      mlKind: b.consumed_ml != null ? 'consumed' as const : b.prepared_ml != null ? 'prepared' as const : null, milk: b.milk_type ?? null,
      note: b.note ?? null, by: b.created_by ?? null, pending: !!b._pending, foods: [], refused: [],
    })),
    ...meals.map((m) => ({
      ...base, id: m.id, kind: 'meal' as const, at: m.at, day: dayOf(m.at), foods: m.foods ?? [], refused: m.refused_foods ?? [], description: m.description ?? null,
      note: m.reaction_note ?? m.note ?? null, by: m.created_by ?? null, pending: !!m._pending,
    })),
  ];
  return out.sort((a, b) => b.at.localeCompare(a.at));
}

export interface DayTotals {
  day: string;
  breast: { count: number; minutes: number; withDuration: number; left: number; right: number; both: number };
  bottle: { count: number; ml: number; withQty: number };
  meal: { count: number; refused: number };
  /** prises de lait notées (tétées + biberons) */
  feeds: number;
}

export function totalsOf(entries: FeedEntry[], day: string): DayTotals {
  const t: DayTotals = { day, breast: { count: 0, minutes: 0, withDuration: 0, left: 0, right: 0, both: 0 }, bottle: { count: 0, ml: 0, withQty: 0 }, meal: { count: 0, refused: 0 }, feeds: 0 };
  for (const e of entries) {
    if (e.day !== day) continue;
    if (e.kind === 'breast') {
      t.breast.count++;
      if (e.minutes != null) { t.breast.minutes += e.minutes; t.breast.withDuration++; }
      if (e.side) t.breast[e.side]++;
    } else if (e.kind === 'bottle') {
      t.bottle.count++;
      if (e.ml != null) { t.bottle.ml += e.ml; t.bottle.withQty++; }
    } else {
      t.meal.count++;
      t.meal.refused += e.refused.length;
    }
  }
  t.feeds = t.breast.count + t.bottle.count;
  return t;
}

/** Les n derniers jours (aujourd'hui d'abord). */
export function lastDays(n: number, today: string = todayISO()): string[] {
  return Array.from({ length: n }, (_, i) => addDays(today, -i));
}

export function weekTotals(entries: FeedEntry[], days: string[]): DayTotals[] {
  return days.map((d) => totalsOf(entries, d));
}

/** Répartition des prises de lait NOTÉES (pourcentages entiers, total 100) ; null s'il n'y en a aucune. */
export function split(totals: DayTotals[]): { breast: number; bottle: number; breastCount: number; bottleCount: number } | null {
  const breastCount = totals.reduce((s, t) => s + t.breast.count, 0);
  const bottleCount = totals.reduce((s, t) => s + t.bottle.count, 0);
  const all = breastCount + bottleCount;
  if (!all) return null;
  const breast = Math.round((breastCount / all) * 100);
  return { breast, bottle: 100 - breast, breastCount, bottleCount };
}

/** Sommes sur une période (semaine) : mêmes champs que la journée. */
export function sumTotals(totals: DayTotals[]): Omit<DayTotals, 'day'> {
  const z = { breast: { count: 0, minutes: 0, withDuration: 0, left: 0, right: 0, both: 0 }, bottle: { count: 0, ml: 0, withQty: 0 }, meal: { count: 0, refused: 0 }, feeds: 0 };
  for (const t of totals) {
    for (const k of ['count', 'minutes', 'withDuration', 'left', 'right', 'both'] as const) z.breast[k] += t.breast[k];
    for (const k of ['count', 'ml', 'withQty'] as const) z.bottle[k] += t.bottle[k];
    z.meal.count += t.meal.count; z.meal.refused += t.meal.refused; z.feeds += t.feeds;
  }
  return z;
}

/** Heures où les prises de lait ont été notées (par tranche de 3 h) : description, jamais un rythme « attendu ». */
export function hourBands(entries: FeedEntry[]): number[] {
  const bands = [0, 0, 0, 0, 0, 0, 0, 0];
  for (const e of entries) if (e.kind !== 'meal') bands[Math.floor(new Date(e.at).getHours() / 3)]++;
  return bands;
}

export interface JournalLabels {
  date: string; time: string; type: string; duration: string; side: string; quantity: string; milk: string; foods: string; refused: string; note: string;
  kinds: Record<FeedKind, string>; sides: Record<'left' | 'right' | 'both', string>; prepared: string; by: string; nameOf: (id: string | null) => string;
}
const hhmm = (iso: string) => { const d = new Date(iso); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };

/** CSV (séparateur « ; », BOM UTF-8 pour Excel) : une ligne par saisie, de la plus ancienne à la plus récente. */
export function journalCsv(entries: FeedEntry[], l: JournalLabels): string {
  const rows: string[][] = [[l.date, l.time, l.type, l.duration, l.side, l.quantity, l.milk, l.foods, l.refused, l.note, l.by]];
  for (const e of [...entries].sort((a, b) => a.at.localeCompare(b.at))) {
    rows.push([
      e.day, hhmm(e.at), l.kinds[e.kind], e.minutes != null ? String(e.minutes) : '', e.side ? l.sides[e.side] : '',
      e.ml != null ? `${e.ml}${e.mlKind === 'prepared' ? ` (${l.prepared})` : ''}` : '', e.milk ?? '', e.foods.join(', '), e.refused.join(', '),
      [e.description, e.note].filter(Boolean).join(' — '), e.by ? l.nameOf(e.by) : '',
    ]);
  }
  return `﻿${rows.map((r) => r.map((c) => csvCell(c)).join(';')).join('\r\n')}\r\n`;
}

/** Lignes du PDF : un paragraphe par jour (totaux notés), puis le détail horodaté. */
export function journalPdfSections(entries: FeedEntry[], days: string[], f: {
  dayTitle: (day: string) => string; totals: (t: DayTotals) => string; line: (e: FeedEntry) => string; empty: string;
}): { heading: string; lines: string[] }[] {
  return [...days].sort().map((d) => {
    const list = entries.filter((e) => e.day === d).sort((a, b) => a.at.localeCompare(b.at));
    return { heading: f.dayTitle(d), lines: list.length ? [f.totals(totalsOf(entries, d)), ...list.map(f.line)] : [f.empty] };
  });
}
