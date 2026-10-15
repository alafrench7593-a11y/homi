/**
 * Appel de Gemini pour l'explication d'un résultat du scanner (Deno uniquement).
 * Sans configuration : { ai: 'not_configured' } — jamais de texte simulé.
 */
import { geminiGenerate, GeminiError, type GeminiConfig } from './gemini.ts';
import { buildExplainPrompt, checkExplanation, EXPLAIN_SCHEMA, EXPLAIN_SYSTEM, type Explanation, type ExplainPayload } from './scan-explain.ts';

export type ExplainResult =
  | { ai: 'ok'; model: string; generated_on: string; verdict: string; explanation: Explanation }
  | { ai: 'not_configured' | 'unavailable' | 'rejected'; message: string; reason?: string };

export async function runExplain(payload: ExplainPayload, cfg: GeminiConfig | null, fetchImpl: typeof fetch = fetch, today = new Date().toISOString().slice(0, 10)): Promise<ExplainResult> {
  if (!cfg) return { ai: 'not_configured', message: 'Explication IA non configurée.' };
  let raw: string;
  try {
    raw = await geminiGenerate(cfg, { system: EXPLAIN_SYSTEM, turns: [{ role: 'user', text: buildExplainPrompt(payload) }], maxOutputTokens: 900, responseSchema: EXPLAIN_SCHEMA }, fetchImpl);
  } catch (e) {
    return { ai: 'unavailable', message: 'L’explication IA est momentanément indisponible. L’explication des règles reste affichée.', reason: e instanceof GeminiError ? `gemini_${e.status}` : 'fetch' };
  }
  const checked = checkExplanation(raw, payload);
  if (!checked.ok) return { ai: 'rejected', message: 'L’explication IA n’a pas passé les contrôles de prudence : seule l’explication des règles est affichée.', reason: checked.reason };
  return { ai: 'ok', model: cfg.model, generated_on: today, verdict: payload.verdict, explanation: checked.explanation };
}
