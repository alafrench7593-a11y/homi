/**
 * Questions suggérées à l'assistant, selon la semaine de grossesse exacte ou l'âge exact de l'enfant (Premium).
 * Ce sont des idées de questions générales : l'assistant ne pose aucun diagnostic et ne recommande aucune dose.
 */
import { t as tr } from '@/i18n';

export function pregnancySuggestions(weeksSA: number, multiple: boolean): string[] {
  const out: string[] = [];
  if (weeksSA < 14) out.push(tr('l6.sug.preg1a'), tr('l6.sug.preg1b'));
  else if (weeksSA < 28) out.push(tr('l6.sug.preg2a'), tr('l6.sug.preg2b'));
  else out.push(tr('l6.sug.preg3a'), tr('l6.sug.preg3b'));
  if (weeksSA >= 20) out.push(tr('l6.sug.birthPlan'));
  if (multiple) out.push(tr('l6.sug.twins'));
  return out.slice(0, 4);
}

export function childSuggestions(name: string, months: number): string[] {
  if (months < 3) return [tr('l6.sug.c0a', { name }), tr('l6.sug.c0b', { name }), tr('l6.sug.c0c')];
  if (months < 7) return [tr('l6.sug.c3a', { name }), tr('l6.sug.c3b'), tr('l6.sug.c3c', { name })];
  if (months < 13) return [tr('l6.sug.c7a', { name }), tr('l6.sug.c7b'), tr('l6.sug.c7c')];
  if (months < 36) return [tr('l6.sug.c13a', { name }), tr('l6.sug.c13b'), tr('l6.sug.c13c', { name })];
  return [tr('l6.sug.c36a', { name }), tr('l6.sug.c36b', { name }), tr('l6.sug.c36c')];
}
