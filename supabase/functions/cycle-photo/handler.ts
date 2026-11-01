/**
 * Traitement d'une demande d'analyse de photo de glaire cervicale (Deno).
 * Séparé de index.ts pour être testé avec de fausses dépendances (authentification,
 * configuration, transport Gemini).
 *
 * Confidentialité : l'image, le corps de la requête et la réponse du modèle ne sont
 * JAMAIS journalisés ni enregistrés ; la réponse porte « Cache-Control: no-store ».
 */
import { geminiGenerate, GeminiError, type GeminiConfig } from '../_shared/gemini.ts';
import {
  checkCyclePhotoBody, CYCLE_PHOTO_PROMPT, CYCLE_PHOTO_SCHEMA, CYCLE_PHOTO_SYSTEM,
  parseCyclePhotoAnswer, UNANALYZABLE, type CyclePhotoSuggestion,
} from '../_shared/cycle-photo.ts';

export const CYCLE_PHOTO_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Cache-Control': 'no-store',
};

/** Corps JSON maximal accepté avant analyse (image base64 ≈ 2 Mo + marge). */
export const MAX_BODY_CHARS = 2_200_000;

export const NOT_CONFIGURED_MESSAGE = 'Analyse de photo non configurée : la clé GEMINI_API_KEY doit être ajoutée aux secrets Supabase.';

export interface CyclePhotoDeps {
  /** Vérifie le jeton de la personne ; renvoie une réponse 401 sinon. */
  authenticate: (req: Request) => Promise<{ userId: string } | Response>;
  config: () => GeminiConfig | null;
  /** Limitation de débit par personne (true = autorisé). */
  rateLimit?: (userId: string) => Promise<boolean>;
  /** Enregistre la preuve du consentement (horodatée) avant l'envoi ; false = échec, rien n'est envoyé. */
  recordConsent?: (userId: string) => Promise<boolean>;
  fetchImpl?: typeof fetch;
}

export function reply(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CYCLE_PHOTO_HEADERS, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export async function handleCyclePhoto(req: Request, deps: CyclePhotoDeps): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CYCLE_PHOTO_HEADERS });
  if (req.method !== 'POST') return reply({ error: 'method_not_allowed' }, 405);

  const auth = await deps.authenticate(req);
  if (auth instanceof Response) {
    const h = new Headers(auth.headers);
    h.set('Cache-Control', 'no-store');
    return new Response(auth.body, { status: auth.status, headers: h });
  }

  const declared = Number(req.headers.get('content-length') ?? '0');
  if (declared > MAX_BODY_CHARS) return reply({ error: 'image_too_large', message: 'Photo trop lourde : 1,5 Mo au maximum.' }, 413);
  const text = await req.text().catch(() => '');
  if (text.length > MAX_BODY_CHARS) return reply({ error: 'image_too_large', message: 'Photo trop lourde : 1,5 Mo au maximum.' }, 413);
  let body: unknown = {};
  try { body = JSON.parse(text); } catch { body = {}; }

  // 1) Consentement explicite, avant toute autre chose
  const consent = (body && typeof body === 'object' ? (body as Record<string, unknown>).consent : undefined) === true;
  if (!consent) return reply({ error: 'consent_required', message: 'Votre accord explicite est nécessaire pour envoyer la photo à l’analyse.' }, 400);

  // 2) Service configuré ? (aucune simulation de résultat)
  const cfg = deps.config();
  if (!cfg) return reply({ error: 'ai_not_configured', message: NOT_CONFIGURED_MESSAGE }, 503);

  // 3) Image valide
  const input = checkCyclePhotoBody(body);
  if (!input.ok) return reply({ error: input.error, message: input.message }, input.status);

  if (deps.rateLimit && !(await deps.rateLimit(auth.userId))) {
    return reply({ error: 'rate_limited', message: 'Trop d’analyses demandées en une heure. Vous pouvez choisir l’aspect vous-même.' }, 429);
  }

  // 4) Preuve du consentement enregistrée en base AVANT tout envoi à l'IA (RGPD art. 9)
  if (deps.recordConsent && !(await deps.recordConsent(auth.userId))) {
    return reply({ error: 'consent_not_recorded', message: 'Votre accord n’a pas pu être enregistré : la photo n’a pas été envoyée. Réessayez plus tard.' }, 503);
  }

  let suggestion: CyclePhotoSuggestion;
  try {
    const raw = await geminiGenerate(cfg, {
      system: CYCLE_PHOTO_SYSTEM,
      turns: [{ role: 'user', text: CYCLE_PHOTO_PROMPT }],
      images: [{ mimeType: input.mimeType, base64: input.base64 }],
      maxOutputTokens: 300,
      responseSchema: CYCLE_PHOTO_SCHEMA,
    }, deps.fetchImpl ?? fetch);
    suggestion = parseCyclePhotoAnswer(raw);
  } catch (e) {
    // Réponse bloquée par les filtres : photo considérée comme inexploitable
    if (e instanceof GeminiError && e.blocked) suggestion = { ...UNANALYZABLE };
    else return reply({ error: 'ai_unavailable', message: 'Analyse momentanément indisponible. Vous pouvez choisir l’aspect vous-même.' }, 502);
  }
  return reply({ status: 'ok', suggestion });
}
