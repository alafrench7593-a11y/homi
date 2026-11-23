/**
 * Brouillon de relais parent (pur, testé) : les événements PARTAGEABLES d'un enfant depuis la dernière transmission
 * (ou depuis le début du jour), lus dans les mêmes tables que la mini-app (sommeil, biberons). Le parent retire ce qu'il
 * ne veut pas transmettre, relit, puis confirme : seul ce qui reste coché part. Une note libre n'est jamais transmise
 * sans être visible dans le brouillon.
 */
import type { SleepLike } from './sleepSummary';

export interface BottleLike { id: string; child_id: string; at: string; consumed_ml: number | null; prepared_ml?: number | null }
export interface DiaperLike { id: string; child_id: string; at: string; wet: boolean; stool: boolean }
export interface BreastfeedLike { id: string; child_id: string; started_at: string; ended_at: string | null; side: 'left' | 'right' | 'both' }

export type RelayItem =
  | { id: string; kind: 'sleep'; at: string; start: string; end: string | null; minutes: number; note: string | null }
  | { id: string; kind: 'bottle'; at: string; ml: number | null }
  | { id: string; kind: 'diaper'; at: string; wet: boolean; stool: boolean }
  | { id: string; kind: 'breastfeed'; at: string; start: string; end: string | null; minutes: number; side: 'left' | 'right' | 'both' };

const MIN = 60_000;

export function relayItems(o: {
  childId: string; since: Date; now: Date; sleeps: readonly SleepLike[]; bottles: readonly BottleLike[];
  diapers?: readonly DiaperLike[]; breastfeeds?: readonly BreastfeedLike[];
}): RelayItem[] {
  const after = (iso: string) => Date.parse(iso) >= o.since.getTime() && Date.parse(iso) <= o.now.getTime();
  const sleeps: RelayItem[] = o.sleeps
    .filter((s) => s.child_id === o.childId && (after(s.started_at) || (s.ended_at ? after(s.ended_at) : true)))
    .map((s) => ({
      id: s.id, kind: 'sleep' as const, at: s.ended_at ?? s.started_at, start: s.started_at, end: s.ended_at,
      minutes: Math.max(0, Math.round(((s.ended_at ? Date.parse(s.ended_at) : o.now.getTime()) - Date.parse(s.started_at)) / MIN)), note: s.note ?? null,
    }));
  const bottles: RelayItem[] = o.bottles
    .filter((b) => b.child_id === o.childId && after(b.at))
    .map((b) => ({ id: b.id, kind: 'bottle' as const, at: b.at, ml: b.consumed_ml ?? b.prepared_ml ?? null }));
  const diapers: RelayItem[] = (o.diapers ?? [])
    .filter((d) => d.child_id === o.childId && after(d.at))
    .map((d) => ({ id: d.id, kind: 'diaper' as const, at: d.at, wet: !!d.wet, stool: !!d.stool }));
  const feeds: RelayItem[] = (o.breastfeeds ?? [])
    .filter((f) => f.child_id === o.childId && (after(f.started_at) || (f.ended_at ? after(f.ended_at) : true)))
    .map((f) => ({
      id: f.id, kind: 'breastfeed' as const, at: f.ended_at ?? f.started_at, start: f.started_at, end: f.ended_at, side: f.side,
      minutes: Math.max(0, Math.round(((f.ended_at ? Date.parse(f.ended_at) : o.now.getTime()) - Date.parse(f.started_at)) / MIN)),
    }));
  return [...sleeps, ...bottles, ...diapers, ...feeds].sort((a, b) => a.at.localeCompare(b.at));
}

/** Début du brouillon : dernière transmission de cet enfant, sinon minuit du jour. */
export function relaySince(lastSentAt: string | null | undefined, now: Date): Date {
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // Audit final (23/11/2026) : juste après minuit, la soirée ne doit pas disparaître du relais (biberon de 23 h vu à
  // 0 h 30) — le début par défaut est le plus tôt entre minuit et 12 h avant maintenant
  const start = new Date(Math.min(midnight.getTime(), now.getTime() - 12 * 3_600_000));
  const last = lastSentAt ? new Date(lastSentAt) : null;
  return last && last.getTime() > start.getTime() && last.getTime() <= now.getTime() ? last : start;
}
