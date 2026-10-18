/**
 * Lecture d'un document par le service Gemini (côté serveur, avec l'accord « lecture automatique des documents »).
 * Le service TRANSCRIT seulement : aucun résumé, aucune interprétation ; les passages illisibles sont marqués « [illisible] ».
 * La structuration (dates, valeurs, ordonnance) et le résumé sont faits ensuite sur l'appareil, à partir de ce texte.
 */
export const READ_INSTRUCTIONS = `Tu transcris un document (médical, administratif ou familial) photographié ou numérisé.
Règles absolues :
- Recopie le texte imprimé ou manuscrit TEL QU'IL EST ÉCRIT, ligne par ligne, dans la langue d'origine.
- Conserve exactement les nombres, virgules, unités, doses, dates et plages de référence. Ne convertis et ne corrige rien.
- Si un mot ou une valeur est illisible ou incertain, écris [illisible] à sa place. N'invente et ne devine jamais.
- N'ajoute aucun commentaire, aucun résumé, aucune interprétation, aucun avis médical.
Réponds UNIQUEMENT avec un objet JSON : {"text": string, "illegible_passages": number}`;

export const READ_SCHEMA = {
  type: 'object',
  properties: { text: { type: 'string' }, illegible_passages: { type: 'integer' } },
  required: ['text'],
};

export const MAX_TEXT = 200_000;
export const MAX_READ_BYTES = 10 * 1024 * 1024; // au-delà, la lecture serveur est refusée (le document reste consultable)
export const READABLE_MIME = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic']);

/** Nettoie la réponse : texte uniquement, sans caractères de contrôle, longueur bornée. Null si inexploitable. */
export function parseReadResponse(raw: string): { text: string; illegible: number } | null {
  let obj: { text?: unknown; illegible_passages?: unknown } | null = null;
  try {
    obj = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
  } catch {
    return null;
  }
  if (!obj || typeof obj.text !== 'string') return null;
  // deno-lint-ignore no-control-regex
  const text = obj.text.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').slice(0, MAX_TEXT).trim();
  if (!text) return null;
  const illegible = typeof obj.illegible_passages === 'number' && obj.illegible_passages >= 0 ? Math.floor(obj.illegible_passages) : (text.match(/\[illisible\]/gi) ?? []).length;
  return { text, illegible };
}

export function toBase64(buf: ArrayBuffer): string {
  let s = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
