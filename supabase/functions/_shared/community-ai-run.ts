/**
 * Appel de Gemini pour le résumé et la traduction de la communauté.
 * Sans configuration : { ai: 'not_configured' } — jamais de texte simulé.
 */
import { geminiGenerate, GeminiError, type GeminiConfig } from './gemini.ts';
import { buildSummaryPrompt, checkSummary, checkTranslation, neutralize, SUMMARY_SCHEMA, SUMMARY_SYSTEM, TRANSLATE_SCHEMA, translateSystem } from './community-ai.ts';

export type CommunityAiResult =
  | { ai: 'ok'; kind: 'summary'; points: string[]; caution: string | null; model: string }
  | { ai: 'ok'; kind: 'translation'; text: string; target: 'fr' | 'en' | 'es' | 'de' | 'it'; model: string }
  | { ai: 'not_configured' | 'unavailable' | 'rejected'; message: string; reason?: string };

export async function runSummary(cfg: GeminiConfig | null, post: { title?: string | null; body: string }, comments: { body: string }[], pseudonyms: string[], fetchImpl: typeof fetch = fetch): Promise<CommunityAiResult> {
  if (!cfg) return { ai: 'not_configured', message: 'Le résumé par IA n’est pas encore configuré.' };
  let raw: string;
  try {
    raw = await geminiGenerate(cfg, { system: SUMMARY_SYSTEM, turns: [{ role: 'user', text: buildSummaryPrompt(post, comments) }], maxOutputTokens: 700, responseSchema: SUMMARY_SCHEMA }, fetchImpl);
  } catch (e) {
    return { ai: 'unavailable', message: 'Le résumé est momentanément indisponible.', reason: e instanceof GeminiError ? `gemini_${e.status}` : 'fetch' };
  }
  const checked = checkSummary(raw, pseudonyms);
  if (!checked.ok) return { ai: 'rejected', message: 'Le résumé n’a pas passé les contrôles de prudence : lisez la discussion complète.', reason: checked.reason };
  return { ai: 'ok', kind: 'summary', points: checked.points, caution: checked.caution, model: cfg.model };
}

export async function runTranslation(cfg: GeminiConfig | null, text: string, target: 'fr' | 'en' | 'es' | 'de' | 'it', fetchImpl: typeof fetch = fetch): Promise<CommunityAiResult> {
  if (!cfg) return { ai: 'not_configured', message: 'La traduction automatique n’est pas encore configurée.' };
  const source = neutralize(text);
  let raw: string;
  try {
    raw = await geminiGenerate(cfg, { system: translateSystem(target), turns: [{ role: 'user', text: source }], maxOutputTokens: 1200, responseSchema: TRANSLATE_SCHEMA }, fetchImpl);
  } catch (e) {
    return { ai: 'unavailable', message: 'La traduction est momentanément indisponible.', reason: e instanceof GeminiError ? `gemini_${e.status}` : 'fetch' };
  }
  const checked = checkTranslation(raw, source);
  if (!checked.ok) return { ai: 'rejected', message: 'La traduction n’a pas pu être vérifiée.', reason: checked.reason };
  return { ai: 'ok', kind: 'translation', text: checked.text, target, model: cfg.model };
}
