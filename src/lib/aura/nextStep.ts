/**
 * « Prochaine étape » (audit du 23/11/2026, brief § 3) : UNE action utile proposée sur l'Accueil, décidée par des règles
 * locales (aucune IA, aucun réseau, aucun crédit). Elle ouvre l'outil ; rien n'est enregistré sans le geste du parent.
 * Ignorée une fois = plus reproposée (signature mémorisée) ; recalculée quand l'enfant affiché change.
 *
 *  - aucun sommeil noté pour cet enfant → « Enregistrer un premier sommeil » ;
 *  - une sieste vient de se terminer (< 45 min) → « Voir la journée » (durée, total du jour, prochaine fenêtre).
 */
import { isDayNap } from '@/lib/domain/sleepSummary';

export type NextStepKind = 'first_sleep' | 'nap_day';
export interface NextStep { kind: NextStepKind; signature: string; href: string; childName: string | null }
export interface NextStepInput {
  child: { id: string; first_name: string };
  /** Plusieurs enfants suivis : le prénom figure sur la carte */
  severalChildren: boolean;
  /** Sommeils récents de CET enfant ; `null` = pas encore chargés (aucune proposition) */
  sleeps: { id: string; child_id: string; started_at: string; ended_at: string | null; kind?: string | null }[] | null;
  now: Date;
  seen: readonly string[];
}

export const NAP_DAY_WINDOW_MIN = 45;

export function nextStep({ child, severalChildren, sleeps, now, seen }: NextStepInput): NextStep | null {
  if (!sleeps) return null;
  const name = severalChildren ? child.first_name : null;
  const mine = sleeps.filter((s) => s.child_id === child.id);
  const out = (kind: NextStepKind, signature: string): NextStep | null =>
    (seen.includes(signature) ? null : { kind, signature, href: `/sleep/${child.id}`, childName: name });
  if (!mine.length) return out('first_sleep', `next:first_sleep:${child.id}`);
  const ended = mine
    .filter((s) => s.ended_at && isDayNap(s as never))
    .map((s) => ({ s, end: new Date(s.ended_at as string).getTime() }))
    .filter(({ end }) => end <= now.getTime() && now.getTime() - end < NAP_DAY_WINDOW_MIN * 60_000)
    .sort((a, b) => b.end - a.end)[0];
  if (ended) return out('nap_day', `next:nap_day:${ended.s.id}`);
  return null;
}
