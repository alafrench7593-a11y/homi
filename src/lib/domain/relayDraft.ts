/**
 * Brouillon de relais parent (pur, testé) : les événements PARTAGEABLES d'un enfant depuis la dernière transmission
 * (ou depuis le début du jour), lus dans les mêmes tables que la mini-app (sommeil, biberons). Le parent retire ce qu'il
 * ne veut pas transmettre, relit, puis confirme : seul ce qui reste coché part. Une note libre n'est jamais transmise
 * sans être visible dans le brouillon.
 */
import type { SleepLike } from './sleepSummary';

export interface BottleLike { id: string; child_id: string; at: string; consumed_ml: number | null; prepared_ml?: number | null }

export type RelayItem =
  | { id: string; kind: 'sleep'; at: string; start: string; end: string | null; minutes: number; note: string | null }
  | { id: string; kind: 'bottle'; at: string; ml: number | null };

const MIN = 60_000;

export function relayItems(o: { childId: string; since: Date; now: Date; sleeps: readonly SleepLike[]; bottles: readonly BottleLike[] }): RelayItem[] {
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
  return [...sleeps, ...bottles].sort((a, b) => a.at.localeCompare(b.at));
}

/** Début du brouillon : dernière transmission de cet enfant, sinon minuit du jour. */
export function relaySince(lastSentAt: string | null | undefined, now: Date): Date {
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const last = lastSentAt ? new Date(lastSentAt) : null;
  return last && last.getTime() > midnight.getTime() && last.getTime() <= now.getTime() ? last : midnight;
}
