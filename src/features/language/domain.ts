/**
 * 129 — Journal du développement du langage : logique pure, testée (partiels2.test.ts).
 * Premiers mots, phrases, langues parlées à la maison, notes ; une frise par mois. AUCUNE norme d'âge n'est
 * appliquée aux saisies : les repères de « Je grandis » (catégorie langage) sont affichés à part, avec leur source,
 * comme indicatifs — jamais de « retard », de score ni de comparaison.
 */
import { STEPS, type StepDef } from '@/content/discoveries/steps';
import type { ISODate } from '@/lib/domain/dates';

export const LANGUAGE_KINDS = ['word', 'sentence', 'language', 'note'] as const;
export type LanguageKind = (typeof LANGUAGE_KINDS)[number];

export interface LanguageEntry {
  id: string; household_id: string; child_id: string; kind: LanguageKind; text: string; language: string | null;
  said_on: ISODate | null; note: string | null; created_at?: string; _pending?: boolean;
}

export interface FriseGroup { key: string; month: ISODate | null; entries: LanguageEntry[] }

/** Frise : entrées datées regroupées par mois (le plus récent d'abord), puis celles sans date. Les langues n'y sont pas. */
export function frise(entries: LanguageEntry[]): FriseGroup[] {
  const dated = entries.filter((e) => e.kind !== 'language' && e.said_on).sort((a, b) => b.said_on!.localeCompare(a.said_on!) || (b.created_at ?? '').localeCompare(a.created_at ?? ''));
  const groups = new Map<string, FriseGroup>();
  for (const e of dated) {
    const k = e.said_on!.slice(0, 7);
    if (!groups.has(k)) groups.set(k, { key: k, month: `${k}-01`, entries: [] });
    groups.get(k)!.entries.push(e);
  }
  const undated = entries.filter((e) => e.kind !== 'language' && !e.said_on);
  const out = [...groups.values()];
  if (undated.length) out.push({ key: 'undated', month: null, entries: undated });
  return out;
}

/** Ce que l'on a noté, par type (aucun total ni comparaison : simple inventaire pour le parent). */
export function counts(entries: Pick<LanguageEntry, 'kind'>[]): Record<LanguageKind, number> {
  const c = { word: 0, sentence: 0, language: 0, note: 0 } as Record<LanguageKind, number>;
  for (const e of entries) c[e.kind] += 1;
  return c;
}

/** Langues parlées à la maison (une par nom, sans doublon de casse). */
export function homeLanguages(entries: LanguageEntry[]): LanguageEntry[] {
  const seen = new Set<string>();
  return entries.filter((e) => e.kind === 'language').filter((e) => {
    const k = e.text.trim().toLocaleLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** Un mot déjà noté (même orthographe, sans tenir compte de la casse) : on le signale au lieu de dupliquer. */
export const alreadyNoted = (entries: Pick<LanguageEntry, 'kind' | 'text' | 'id'>[], kind: LanguageKind, text: string, exceptId?: string) =>
  entries.some((e) => e.id !== exceptId && e.kind === kind && e.text.trim().toLocaleLowerCase() === text.trim().toLocaleLowerCase());

/** Repères indicatifs : les étapes « langage » de « Je grandis » (avec leur source), pour lecture seulement. */
export function languageMilestones(): StepDef[] {
  return STEPS.filter((s) => s.category === 'language');
}
