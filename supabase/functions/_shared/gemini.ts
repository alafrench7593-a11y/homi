/**
 * Client Gemini API (Google AI) — utilisé UNIQUEMENT côté serveur (fonctions Supabase).
 * La clé GEMINI_API_KEY est un secret Supabase : elle n'est jamais envoyée à l'application.
 *
 * Endpoints (API REST v1beta) :
 *   POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
 *   POST https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent?alt=sse
 *   En-tête : x-goog-api-key
 */

export const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
export const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash-lite';

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
}

export function buildGeminiBody(o: GeminiRequestOptions): Record<string, unknown> {
  const contents = o.turns.map((t, i) => {
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
  return { systemInstruction: { parts: [{ text: o.system }] }, contents, generationConfig };
}

export class GeminiError extends Error {
  constructor(message: string, public status: number, public blocked = false) { super(message); }
}

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
    body: JSON.stringify(buildGeminiBody(o)),
  });
  if (!res.ok) throw new GeminiError(`Gemini ${res.status}`, res.status);
  const out = geminiText(await res.json());
  if (out.blocked) throw new GeminiError('Réponse bloquée par les filtres de sécurité', 200, true);
  return out.text;
}

/** Flux SSE : appelle onDelta pour chaque fragment de texte ; renvoie le texte complet. */
export async function geminiStream(cfg: GeminiConfig, o: GeminiRequestOptions, onDelta: (t: string) => void | Promise<void>, fetchImpl: typeof fetch = fetch): Promise<string> {
  const res = await fetchImpl(`${GEMINI_BASE}/models/${encodeURIComponent(cfg.model)}:streamGenerateContent?alt=sse`, {
    method: 'POST',
    headers: { 'x-goog-api-key': cfg.apiKey, 'content-type': 'application/json' },
    body: JSON.stringify(buildGeminiBody(o)),
  });
  if (!res.ok || !res.body) throw new GeminiError(`Gemini ${res.status}`, res.status);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  let full = '';
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
        const out = geminiText(JSON.parse(data));
        if (out.blocked) throw new GeminiError('Réponse bloquée par les filtres de sécurité', 200, true);
        if (out.text) { full += out.text; await onDelta(out.text); }
      } catch (e) {
        if (e instanceof GeminiError) throw e;
      }
    }
  }
  return full;
}
