/**
 * 76 — Journal des difficultés d'allaitement et 77 — douleurs pendant les tétées : logique pure (testée).
 * Données personnelles (le corps de la personne qui allaite). Aucun diagnostic : seulement ce qui a été noté, et des
 * questions à préparer pour la consultante en lactation (81, liste « Mes questions pour le rendez-vous »).
 */
import { t as tr, type TKey } from '@/i18n';

export type IssueKind = 'latch' | 'sore_nipple' | 'cracked' | 'engorgement' | 'blocked_duct' | 'low_supply' | 'oversupply' | 'baby_sleepy' | 'pain_only' | 'other';
export const ISSUE_KINDS: readonly IssueKind[] = ['pain_only', 'latch', 'sore_nipple', 'cracked', 'engorgement', 'blocked_duct', 'low_supply', 'oversupply', 'baby_sleepy', 'other'];
export type Side = 'left' | 'right' | 'both';

export interface FeedingIssue {
  id: string; user_id: string; child_id: string | null; breastfeed_id: string | null; at: string; side: Side | null;
  kind: IssueKind; pain: number | null; note: string | null; created_at: string; _pending?: boolean;
}
export interface FeedLite { id: string; started_at: string; ended_at: string | null; side: Side }

export const kindLabel = (k: IssueKind) => tr(`bfi.kind.${k}` as TKey);

const dayOf = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

/** Historique par jour (plus récent d'abord) : les tétées notées ce jour-là et les difficultés, reliées si possible. */
export function byDay(issues: FeedingIssue[], feeds: FeedLite[]): { day: string; feeds: number; issues: FeedingIssue[]; maxPain: number | null }[] {
  const days = new Map<string, { feeds: number; issues: FeedingIssue[] }>();
  const get = (d: string) => { if (!days.has(d)) days.set(d, { feeds: 0, issues: [] }); return days.get(d)!; };
  for (const f of feeds) get(dayOf(f.started_at)).feeds++;
  for (const i of issues) get(dayOf(i.at)).issues.push(i);
  return [...days.entries()].filter(([, v]) => v.issues.length)
    .map(([day, v]) => {
      const pains = v.issues.map((i) => i.pain).filter((p): p is number => p != null);
      return { day, feeds: v.feeds, issues: v.issues.sort((a, b) => b.at.localeCompare(a.at)), maxPain: pains.length ? Math.max(...pains) : null };
    })
    .sort((a, b) => b.day.localeCompare(a.day));
}

/** La tétée la plus proche (± 90 min) d'un instant : pour relier une difficulté à la tétée existante. */
export function nearestFeed(feeds: FeedLite[], atIso: string, windowMin = 90): FeedLite | null {
  const at = Date.parse(atIso);
  let best: FeedLite | null = null;
  let gap = windowMin * 60_000 + 1;
  for (const f of feeds) {
    const g = Math.abs(Date.parse(f.started_at) - at);
    if (g < gap) { gap = g; best = f; }
  }
  return best;
}

/**
 * Questions à préparer pour la consultante (81), d'après les types notés ces 14 derniers jours (sans les doublons).
 * Formulations ouvertes, sans diagnostic.
 */
export function suggestedQuestions(issues: FeedingIssue[], now: Date = new Date()): string[] {
  const from = now.getTime() - 14 * 86_400_000;
  const kinds = new Set(issues.filter((i) => Date.parse(i.at) >= from).map((i) => i.kind));
  const out: string[] = [];
  if (kinds.has('latch') || kinds.has('sore_nipple') || kinds.has('cracked') || kinds.has('pain_only')) out.push(tr('bfi.q.latch'));
  if (kinds.has('engorgement') || kinds.has('blocked_duct')) out.push(tr('bfi.q.engorgement'));
  if (kinds.has('low_supply') || kinds.has('oversupply')) out.push(tr('bfi.q.supply'));
  if (kinds.has('baby_sleepy')) out.push(tr('bfi.q.sleepy'));
  out.push(tr('bfi.q.positions'));
  return out;
}

/** 81 : questions de départ de la liste « consultante en lactation » (formulations ouvertes, sans diagnostic). */
export function lactationSuggestions(): string[] {
  return [tr('bfi.q.latch'), tr('bfi.q.positions'), tr('bfi.q.supply'), tr('bfi.q.engorgement'), tr('bfi.q.sleepy')];
}

/** Texte d'une difficulté (liste, historique) : type · sein · douleur. */
export function issueLine(i: FeedingIssue): string {
  return [kindLabel(i.kind), i.side ? tr(`bfi.side.${i.side}` as TKey) : null, i.pain != null ? tr('bfi.painValue', { pain: i.pain }) : null].filter(Boolean).join(' · ');
}
