// Lecture et validation des corps de requête des fonctions serveur (audit 04, 13/11/2026).
// Pur (sans dépendance Deno ni Supabase) : testé par Jest (src/__tests__/serverInput.test.ts).

/** Corps JSON maximal des fonctions « texte » (identifiants, questions, résultat d'analyse) : 64 Ko. */
export const MAX_JSON_BYTES = 64 * 1024;

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (v: unknown): v is string => typeof v === 'string' && UUID_RE.test(v);

/**
 * Lit un corps JSON borné. Renvoie l'objet lu, `{}` si le corps est absent ou illisible (comportement historique
 * des fonctions : « bad_request » ensuite), ou `null` s'il dépasse la taille permise (→ 413).
 * La taille est vérifiée sur l'en-tête Content-Length ET sur le texte réellement reçu.
 */
export async function readJsonBody(req: Request, maxBytes = MAX_JSON_BYTES): Promise<Record<string, unknown> | null> {
  const declared = Number(req.headers.get('content-length') ?? '0');
  if (Number.isFinite(declared) && declared > maxBytes) return null;
  let text: string;
  try {
    text = await req.text();
  } catch {
    return {};
  }
  if (new TextEncoder().encode(text).length > maxBytes) return null;
  try {
    const v = JSON.parse(text);
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** Chaîne libre bornée (null si absente, vide ou d'un autre type). */
export function optText(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim().slice(0, max);
  return s ? s : null;
}

/** Échappe les jokers d'un motif ILIKE (% _ \) : une saisie est cherchée telle quelle. */
export const escapeLike = (s: string): string => s.replace(/[\\%_]/g, (c) => `\\${c}`);
