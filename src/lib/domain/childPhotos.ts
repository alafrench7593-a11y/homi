/**
 * Album photo d'un enfant : règles pures (chemins, légendes, dates, chronologie), testées sans téléphone.
 * Les fichiers vivent dans l'espace PRIVÉ « child-photos » : jamais d'adresse publique, seulement des
 * liens signés temporaires. Chemin : <foyer>/<enfant>/<identifiant>.jpg (vérifié aussi par la base).
 */
export const CHILD_PHOTO_BUCKET = 'child-photos';
/** Côté le plus long après compression (assez pour un écran de téléphone, léger à charger). */
export const CHILD_PHOTO_MAX_SIDE = 1600;
export const CHILD_PHOTO_QUALITY = 0.8;
export const CHILD_PHOTO_MAX_BYTES = 8 * 1024 * 1024;
export const CAPTION_MAX = 500;

export type PhotoVisibility = 'household' | 'private';
export interface ChildPhoto {
  id: string;
  household_id: string;
  child_id: string;
  storage_path: string;
  taken_on: string;
  caption: string | null;
  visibility: PhotoVisibility;
  width?: number | null;
  height?: number | null;
  created_by?: string | null;
  created_at: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function childPhotoPath(householdId: string, childId: string, photoId: string): string {
  if (![householdId, childId, photoId].every((x) => UUID.test(x))) throw new Error('invalid_photo_path');
  return `${householdId.toLowerCase()}/${childId.toLowerCase()}/${photoId.toLowerCase()}.jpg`;
}

/** Légende nettoyée (espaces), vide → null ; trop longue → erreur lisible. */
export function cleanCaption(raw: string): { ok: true; value: string | null } | { ok: false; error: 'too_long' } {
  const v = raw.replace(/\s+/g, ' ').trim();
  if (v.length > CAPTION_MAX) return { ok: false, error: 'too_long' };
  return { ok: true, value: v || null };
}

/** Date de la photo : AAAA-MM-JJ, pas avant la naissance (moins 1 an pour les photos de grossesse), jamais dans le futur. */
export function validTakenOn(iso: string, birthDate: string, today: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const t = Date.parse(iso + 'T00:00:00Z');
  // date réelle seulement (le 31 février n'existe pas, même si le moteur JavaScript l'accepte)
  if (Number.isNaN(t) || new Date(t).toISOString().slice(0, 10) !== iso) return false;
  const earliest = new Date(Date.parse(birthDate + 'T00:00:00Z') - 366 * 86_400_000).toISOString().slice(0, 10);
  return iso >= earliest && iso <= today;
}

/** Taille cible d'un redimensionnement : le plus long côté ramené à `maxSide`, jamais agrandi. */
export function fitWithin(width: number, height: number, maxSide = CHILD_PHOTO_MAX_SIDE): { width: number; height: number } {
  if (width <= 0 || height <= 0) return { width: maxSide, height: maxSide };
  const s = Math.min(1, maxSide / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * s)), height: Math.max(1, Math.round(height * s)) };
}

/** Chronologie : groupes par mois, du plus récent au plus ancien ; dans un mois, du plus récent au plus ancien. */
export function groupByMonth<T extends Pick<ChildPhoto, 'taken_on' | 'created_at'>>(photos: T[]): { key: string; items: T[] }[] {
  const sorted = [...photos].sort((a, b) => b.taken_on.localeCompare(a.taken_on) || b.created_at.localeCompare(a.created_at));
  const out: { key: string; items: T[] }[] = [];
  for (const p of sorted) {
    const key = p.taken_on.slice(0, 7);
    const last = out[out.length - 1];
    if (last && last.key === key) last.items.push(p);
    else out.push({ key, items: [p] });
  }
  return out;
}

/** Âge de l'enfant le jour de la photo, en mois révolus (null avant la naissance). */
export function ageInMonthsOn(birthDate: string, takenOn: string): number | null {
  const [by, bm, bd] = birthDate.split('-').map(Number);
  const [ty, tm, td] = takenOn.split('-').map(Number);
  if (!by || !ty) return null;
  let m = (ty - by) * 12 + (tm - bm);
  if (td < bd) m -= 1;
  return m < 0 ? null : m;
}
