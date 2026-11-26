/**
 * 79 — Historique des changements de lait infantile : logique pure (testée). Marque, type, début / fin, raison,
 * observations. Affiché aussi dans la frise de l'enfant (journal des moments). Aucune recommandation de lait.
 */
import { formatDate, t as tr, type TKey } from '@/i18n';

export type FormulaKind = 'first_age' | 'second_age' | 'growing' | 'hydrolysed' | 'anti_regurgitation' | 'lactose_free' | 'thickened' | 'other';
export const FORMULA_KINDS: readonly FormulaKind[] = ['first_age', 'second_age', 'growing', 'anti_regurgitation', 'thickened', 'hydrolysed', 'lactose_free', 'other'];
export type FormulaReason = 'start' | 'age' | 'professional_advice' | 'tolerance' | 'availability' | 'price' | 'preference' | 'other';
export const FORMULA_REASONS: readonly FormulaReason[] = ['start', 'age', 'professional_advice', 'tolerance', 'availability', 'price', 'preference', 'other'];

export interface FormulaChange {
  id: string; household_id: string; child_id: string; brand: string; kind: FormulaKind; started_on: string; ended_on: string | null;
  reason: FormulaReason | null; observations: string | null; created_by: string | null; created_at: string; updated_at: string; _pending?: boolean;
}

export const kindLabel = (k: FormulaKind) => tr(`fml.kind.${k}` as TKey);
export const reasonLabel = (r: FormulaReason) => tr(`fml.reason.${r}` as TKey);

/** « 2026-11-26 » → date LOCALE à midi (new Date('AAAA-MM-JJ') = minuit UTC, la veille à l'ouest de Greenwich). */
export const localDay = (iso: string) => new Date(`${iso}T12:00:00`);

/** Plus récent d'abord. */
export const sorted = (list: FormulaChange[]) => [...list].sort((a, b) => b.started_on.localeCompare(a.started_on) || b.created_at.localeCompare(a.created_at));

/** Lait actuel : commencé, sans date de fin (ou fin à venir) ; le plus récent s'il y en a plusieurs. */
export function current(list: FormulaChange[], today: string): FormulaChange | null {
  return sorted(list).find((f) => f.started_on <= today && (!f.ended_on || f.ended_on >= today)) ?? null;
}

/** Enregistrer un nouveau lait : la période ouverte du lait précédent se clôt la veille (proposé, modifiable). */
export function closePrevious(list: FormulaChange[], newStart: string): { id: string; ended_on: string } | null {
  const open = sorted(list).find((f) => !f.ended_on && f.started_on < newStart);
  if (!open) return null;
  const d = new Date(`${newStart}T12:00:00`); d.setDate(d.getDate() - 1);
  const ended = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { id: open.id, ended_on: ended < open.started_on ? open.started_on : ended };
}

export function validateFormula(d: { brand: string; startedOn: string | null; endedOn: string | null }, today: string): 'fml.err.brand' | 'fml.err.start' | 'fml.err.end' | 'fml.err.future' | null {
  if (!d.brand.trim() || d.brand.trim().length > 80) return 'fml.err.brand';
  if (!d.startedOn) return 'fml.err.start';
  if (d.startedOn > today) return 'fml.err.future';
  if (d.endedOn && d.endedOn < d.startedOn) return 'fml.err.end';
  return null;
}

/** Ligne de la frise : « Lait A · 1er âge » + période. */
export function timelineLine(f: FormulaChange): { title: string; subtitle: string } {
  const from = formatDate(localDay(f.started_on), { day: 'numeric', month: 'short', year: 'numeric' });
  const period = f.ended_on ? tr('fml.period', { from, to: formatDate(localDay(f.ended_on), { day: 'numeric', month: 'short', year: 'numeric' }) }) : tr('fml.since', { from });
  return {
    title: tr('fml.frise.title', { brand: f.brand, kind: kindLabel(f.kind) }),
    subtitle: [period, f.reason ? reasonLabel(f.reason) : null, f.observations].filter(Boolean).join(' · '),
  };
}

/** Années de la frise (la frise de l'enfant est rangée par année). */
export const yearOf = (f: FormulaChange) => f.started_on.slice(0, 4);
