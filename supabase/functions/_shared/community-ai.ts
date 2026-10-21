/**
 * Communauté — résumé d'une longue discussion et traduction (Premium), logique pure (testée avec Jest).
 *
 * Données transmises à Gemini, et seulement à la demande de la personne :
 *  - le texte de la publication et des réponses VISIBLES pour elle (déjà partagés avec tous les membres) ;
 *  - jamais de pseudonyme, d'identifiant, d'avatar ni d'information de profil ; les mentions @… sont neutralisées ;
 *  - jamais de données de suivi, de santé ou d'enfant de l'application.
 * Le résumé présente des témoignages, n'ajoute aucun conseil médical et ne promet rien.
 */

export const MIN_COMMENTS_FOR_SUMMARY = 6;
export const MAX_SOURCE_CHARS = 24_000;

export type CommunityAiAction = 'summarize' | 'translate';
export interface CommunityAiRequest { action: CommunityAiAction; post_id: string; comment_id?: string | null; target_lang?: 'fr' | 'en' }

export function parseRequest(body: unknown): CommunityAiRequest | null {
  const b = (body ?? {}) as Record<string, unknown>;
  const uuidRe = /^[0-9a-f-]{36}$/i;
  if (b.action !== 'summarize' && b.action !== 'translate') return null;
  if (typeof b.post_id !== 'string' || !uuidRe.test(b.post_id)) return null;
  if (b.comment_id != null && (typeof b.comment_id !== 'string' || !uuidRe.test(b.comment_id))) return null;
  const target = b.target_lang === 'en' ? 'en' : 'fr';
  return { action: b.action, post_id: b.post_id, comment_id: (b.comment_id as string | null) ?? null, target_lang: target };
}

/** Retire ce qui pourrait identifier un membre (mentions, adresses e-mail, numéros) avant l'envoi. */
export function neutralize(text: string): string {
  return String(text ?? '')
    .replace(/(^|[^A-Za-z0-9_@])@[A-Za-z0-9_]{3,20}/g, '$1@membre')
    .replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, '[e-mail retiré]')
    .replace(/(\+33|\b0)[1-9]([ .-]?[0-9]{2}){4}/g, '[numéro retiré]')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .trim();
}

export const SUMMARY_SYSTEM = [
  'Tu résumes une discussion entre parents sur un forum francophone.',
  'Règles absolues :',
  '- Résume UNIQUEMENT ce qui est écrit. N’ajoute aucun fait, aucun chiffre, aucun conseil.',
  '- Présente les avis comme des témoignages (« plusieurs parents racontent… »), jamais comme des recommandations.',
  '- Aucun conseil médical, aucune posologie, aucune promesse (« sans risque », « garanti », « fera ses nuits » sont interdits).',
  '- Ne cite aucun nom ni pseudonyme.',
  '- Si un sujet de santé est abordé, ajoute dans « caution » : « Pour une question de santé, demandez l’avis d’un professionnel. »',
  'Réponds en JSON : { "points": [3 à 6 phrases courtes], "caution": texte ou null }.',
].join('\n');

export const SUMMARY_SCHEMA = {
  type: 'object',
  properties: { points: { type: 'array', items: { type: 'string' } }, caution: { type: 'string', nullable: true } },
  required: ['points'],
};

export const TRANSLATE_SCHEMA = { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] };

export function translateSystem(target: 'fr' | 'en') {
  return `Traduis fidèlement le message d’un parent en ${target === 'en' ? 'anglais' : 'français'}. Garde le ton, n’ajoute ni ne retire rien, ne commente pas. Réponds en JSON : { "text": "…" }.`;
}

export function buildSummaryPrompt(post: { title?: string | null; body: string }, comments: { body: string }[]): string {
  let out = `Publication :\n${neutralize(`${post.title ? `${post.title}\n` : ''}${post.body}`)}\n\nRéponses :\n`;
  for (const [i, c] of comments.entries()) {
    const line = `${i + 1}. ${neutralize(c.body)}\n`;
    if (out.length + line.length > MAX_SOURCE_CHARS) break;
    out += line;
  }
  return out;
}

const FORBIDDEN = /sans (aucun )?risque|garanti|fera ses nuits|dormira toute la nuit|\d+\s?(mg|ml)\s?(\/|par)\s?kg/i;

/** Contrôle de prudence : JSON attendu, 1 à 6 points, aucune promesse ni posologie, aucun pseudonyme cité. */
export function checkSummary(raw: string, pseudonyms: string[] = []): { ok: true; points: string[]; caution: string | null } | { ok: false; reason: string } {
  let parsed: { points?: unknown; caution?: unknown };
  try {
    parsed = JSON.parse(raw.replace(/^```(json)?\s*|\s*```$/g, ''));
  } catch {
    return { ok: false, reason: 'json' };
  }
  const points = Array.isArray(parsed.points) ? parsed.points.filter((p): p is string => typeof p === 'string' && p.trim().length > 0).map((p) => p.trim().slice(0, 300)) : [];
  if (points.length < 1 || points.length > 6) return { ok: false, reason: 'points' };
  const all = `${points.join(' ')} ${typeof parsed.caution === 'string' ? parsed.caution : ''}`;
  if (FORBIDDEN.test(all)) return { ok: false, reason: 'promesse' };
  if (pseudonyms.some((p) => p.length >= 3 && all.toLowerCase().includes(p.toLowerCase()))) return { ok: false, reason: 'pseudonyme' };
  const caution = typeof parsed.caution === 'string' && parsed.caution.trim() ? parsed.caution.trim().slice(0, 200) : null;
  return { ok: true, points, caution };
}

export function checkTranslation(raw: string, source: string): { ok: true; text: string } | { ok: false; reason: string } {
  try {
    const p = JSON.parse(raw.replace(/^```(json)?\s*|\s*```$/g, '')) as { text?: unknown };
    const text = typeof p.text === 'string' ? p.text.trim() : '';
    if (!text) return { ok: false, reason: 'vide' };
    if (text.length > source.length * 3 + 200) return { ok: false, reason: 'longueur' };
    return { ok: true, text };
  } catch {
    return { ok: false, reason: 'json' };
  }
}

/**
 * Résumé extractif SANS IA (mode démonstration, ou repli) : premières phrases des réponses les plus récentes.
 * Toujours présenté comme tel : « Extraits, sans IA ».
 */
export function extractiveSummary(comments: { body: string }[], max = 4): string[] {
  const firsts = comments.map((c) => neutralize(c.body).split(/(?<=[.!?])\s/)[0]).filter((x) => x.length >= 12);
  return [...new Set(firsts)].slice(0, max).map((x) => (x.length > 160 ? `${x.slice(0, 157)}…` : x));
}
