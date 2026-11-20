/**
 * Client Gemini API (Google AI) — utilisé UNIQUEMENT côté serveur (fonctions Supabase).
 * La clé GEMINI_API_KEY est un secret Supabase : elle n'est jamais envoyée à l'application.
 *
 * Endpoints (API REST v1beta) :
 *   POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
 *   POST https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent?alt=sse
 *   En-tête : x-goog-api-key
 */

import { GeminiError } from './gemini-error.ts';

export const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
export const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash-lite';
/** Délai maximal d'un appel à Gemini (au-delà : erreur « indisponible », question rendue). */
export const GEMINI_TIMEOUT_MS = 30_000;

export interface GeminiConfig { apiKey: string; model: string }

/** Lit la configuration ; renvoie null si la clé n'est pas configurée (aucune simulation de succès). */
export function geminiConfig(): GeminiConfig | null {
  // Lecture via globalThis : ce module est aussi importé par les tests Jest (Node), où Deno n'existe pas
  const env = (globalThis as { Deno?: { env: { get(name: string): string | undefined } } }).Deno?.env;
  const apiKey = env?.get('GEMINI_API_KEY') ?? '';
  if (!apiKey) return null;
  return { apiKey, model: env?.get('GEMINI_MODEL') || DEFAULT_GEMINI_MODEL };
}

export interface GeminiTurn { role: 'user' | 'model'; text: string }
export interface GeminiImage { mimeType: string; base64: string }

export interface GeminiRequestOptions {
  system: string;
  turns: GeminiTurn[];
  images?: GeminiImage[];
  maxOutputTokens?: number;
  /** Réponse JSON contrainte par un schéma (OpenAPI 3 subset). */
  responseSchema?: Record<string, unknown>;
  /**
   * Appel de fonctions (« function calling ») : déclarations proposées au modèle. Le modèle ne fait que DEMANDER un
   * appel ; c'est le serveur qui décide (liste blanche, src : _shared/aura-tools.ts).
   */
  functions?: GeminiFunctionDeclaration[];
  /**
   * Contenus bruts déjà construits (tour d'appel de fonction : les parties renvoyées par le modèle sont recopiées
   * TELLES QUELLES, signatures de pensée comprises, puis la réponse de la fonction). Remplace `turns` s'il est fourni.
   */
  contents?: GeminiContent[];
}

/** Déclaration d'une fonction proposée au modèle (schéma OpenAPI 3, sous-ensemble accepté par Gemini). */
export interface GeminiFunctionDeclaration {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}
export type GeminiPart = Record<string, unknown>;
export interface GeminiContent { role: 'user' | 'model'; parts: GeminiPart[] }
export interface GeminiFunctionCall { name: string; args: Record<string, unknown> }

/**
 * Réflexion du modèle : facturée comme du texte de sortie. Les modèles Gemini 3.x acceptent `thinkingLevel` ; on le
 * fixe à « minimal » (déjà le défaut de gemini-3.5-flash-lite) pour qu'un changement de GEMINI_MODEL ne fasse pas
 * exploser le coût d'une question. Les autres modèles gardent leur réglage par défaut (le paramètre y serait refusé).
 */
export function thinkingConfigFor(model?: string): Record<string, unknown> | null {
  return model && /^gemini-3/.test(model) ? { thinkingLevel: 'minimal' } : null;
}

/** Nombre de jetons d'un appel (aucun contenu) : journalisé pour mesurer le vrai coût d'un crédit. */
export function geminiUsage(payload: unknown): { input: number; cached: number; output: number; thoughts: number } | null {
  const u = (payload as { usageMetadata?: Record<string, number> })?.usageMetadata;
  if (!u) return null;
  return { input: u.promptTokenCount ?? 0, cached: u.cachedContentTokenCount ?? 0, output: u.candidatesTokenCount ?? 0, thoughts: u.thoughtsTokenCount ?? 0 };
}

function logUsage(model: string, payload: unknown) {
  const u = geminiUsage(payload);
  if (u) console.log(`gemini_usage model=${model} in=${u.input} cached=${u.cached} out=${u.output} thoughts=${u.thoughts}`);
}

export function buildGeminiBody(o: GeminiRequestOptions, model?: string): Record<string, unknown> {
  const contents = o.contents ?? o.turns.map((t, i) => {
    const parts: Record<string, unknown>[] = [{ text: t.text }];
    // Les images accompagnent le dernier message de l'utilisatrice
    if (i === o.turns.length - 1 && t.role === 'user') for (const img of o.images ?? []) parts.push({ inlineData: { mimeType: img.mimeType, data: img.base64 } });
    return { role: t.role, parts };
  });
  const generationConfig: Record<string, unknown> = { maxOutputTokens: o.maxOutputTokens ?? 1200 };
  if (o.responseSchema) {
    generationConfig.responseMimeType = 'application/json';
    generationConfig.responseSchema = o.responseSchema;
  }
  const thinking = thinkingConfigFor(model);
  if (thinking) generationConfig.thinkingConfig = thinking;
  const body: Record<string, unknown> = { systemInstruction: { parts: [{ text: o.system }] }, contents, generationConfig };
  if (o.functions?.length) {
    body.tools = [{ functionDeclarations: o.functions }];
    // AUTO : le modèle choisit de répondre en texte ou de demander une fonction de la liste (jamais une autre)
    body.toolConfig = { functionCallingConfig: { mode: 'AUTO' } };
  }
  return body;
}

// Classe d'erreur dans un module à part (partagé avec l'application sans le client Gemini), ré-exportée ici
export { GeminiError };

/** Extrait le texte d'une réponse generateContent (ou d'un fragment de flux). */
export function geminiText(payload: unknown): { text: string; finishReason: string | null; blocked: boolean } {
  const p = payload as {
    candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
    promptFeedback?: { blockReason?: string };
  };
  const c = p?.candidates?.[0];
  const text = (c?.content?.parts ?? []).map((x) => x.text ?? '').join('');
  const finishReason = c?.finishReason ?? null;
  const blocked = !!p?.promptFeedback?.blockReason || finishReason === 'SAFETY' || finishReason === 'PROHIBITED_CONTENT';
  return { text, finishReason, blocked };
}

export async function geminiGenerate(cfg: GeminiConfig, o: GeminiRequestOptions, fetchImpl: typeof fetch = fetch): Promise<string> {
  const res = await fetchImpl(`${GEMINI_BASE}/models/${encodeURIComponent(cfg.model)}:generateContent`, {
    method: 'POST',
    headers: { 'x-goog-api-key': cfg.apiKey, 'content-type': 'application/json' },
    body: JSON.stringify(buildGeminiBody(o, cfg.model)),
    signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
  }).catch((e) => { throw new GeminiError(`Gemini ${(e as Error).name === 'TimeoutError' ? 'timeout' : 'network'}`, 504); });
  if (!res.ok) throw new GeminiError(`Gemini ${res.status}`, res.status);
  const payload = await res.json();
  logUsage(cfg.model, payload);
  const out = geminiText(payload);
  if (out.blocked) throw new GeminiError('Réponse bloquée par les filtres de sécurité', 200, true);
  return out.text;
}

/** Résultat d'un tour : texte, appels de fonction demandés, et parties brutes du modèle (à renvoyer telles quelles). */
export interface GeminiTurnResult { text: string; calls: GeminiFunctionCall[]; parts: GeminiPart[]; finishReason: string | null }

/** Lit un tour generateContent qui peut contenir des appels de fonction. */
export function geminiTurn(payload: unknown): GeminiTurnResult & { blocked: boolean } {
  const base = geminiText(payload);
  const p = payload as { candidates?: { content?: { parts?: GeminiPart[] } }[] };
  const parts = (p?.candidates?.[0]?.content?.parts ?? []).filter((x) => x && typeof x === 'object');
  const calls: GeminiFunctionCall[] = [];
  for (const part of parts) {
    const fc = part.functionCall as { name?: unknown; args?: unknown } | undefined;
    if (fc && typeof fc.name === 'string') calls.push({ name: fc.name, args: fc.args && typeof fc.args === 'object' ? (fc.args as Record<string, unknown>) : {} });
  }
  // Texte : seulement les parties de texte qui ne sont pas des « pensées »
  const text = parts.filter((x) => typeof x.text === 'string' && x.thought !== true).map((x) => x.text as string).join('');
  return { text, calls, parts, finishReason: base.finishReason, blocked: base.blocked };
}

/** Un tour non diffusé, avec appel de fonction possible. */
export async function geminiGenerateTurn(cfg: GeminiConfig, o: GeminiRequestOptions, fetchImpl: typeof fetch = fetch): Promise<GeminiTurnResult> {
  const res = await fetchImpl(`${GEMINI_BASE}/models/${encodeURIComponent(cfg.model)}:generateContent`, {
    method: 'POST',
    headers: { 'x-goog-api-key': cfg.apiKey, 'content-type': 'application/json' },
    body: JSON.stringify(buildGeminiBody(o, cfg.model)),
    signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
  }).catch((e) => { throw new GeminiError(`Gemini ${(e as Error).name === 'TimeoutError' ? 'timeout' : 'network'}`, 504); });
  if (!res.ok) throw new GeminiError(`Gemini ${res.status}`, res.status);
  const payload = await res.json();
  logUsage(cfg.model, payload);
  const out = geminiTurn(payload);
  if (out.blocked) throw new GeminiError('Réponse bloquée par les filtres de sécurité', 200, true);
  return { text: out.text, calls: out.calls, parts: out.parts, finishReason: out.finishReason };
}

/** Flux SSE : appelle onDelta pour chaque fragment de texte ; renvoie le texte complet. */
export async function geminiStream(cfg: GeminiConfig, o: GeminiRequestOptions, onDelta: (t: string) => void | Promise<void>, fetchImpl: typeof fetch = fetch): Promise<string> {
  const res = await fetchImpl(`${GEMINI_BASE}/models/${encodeURIComponent(cfg.model)}:streamGenerateContent?alt=sse`, {
    method: 'POST',
    headers: { 'x-goog-api-key': cfg.apiKey, 'content-type': 'application/json' },
    body: JSON.stringify(buildGeminiBody(o, cfg.model)),
    // délai pour le début de la réponse ; le flux lui-même est borné par la fonction (maxOutputTokens)
    signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS * 2),
  }).catch((e) => { throw new GeminiError(`Gemini ${(e as Error).name === 'TimeoutError' ? 'timeout' : 'network'}`, 504); });
  if (!res.ok || !res.body) throw new GeminiError(`Gemini ${res.status}`, res.status);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  let full = '';
  let lastUsage: unknown = null;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (!data || data === '[DONE]') continue;
      try {
        const chunk = JSON.parse(data);
        // Le dernier fragment porte le total des jetons de l'appel
        if (geminiUsage(chunk)?.output) lastUsage = chunk;
        const out = geminiText(chunk);
        if (out.blocked) throw new GeminiError('Réponse bloquée par les filtres de sécurité', 200, true);
        if (out.text) { full += out.text; await onDelta(out.text); }
      } catch (e) {
        if (e instanceof GeminiError) throw e;
      }
    }
  }
  if (lastUsage) logUsage(cfg.model, lastUsage);
  return full;
}
