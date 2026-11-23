/**
 * Espace Nounou — règles pures (testées sans téléphone) :
 *  - chronologie de la journée à partir des lignes du suivi existant (bottles, meals, sleeps, diapers,
 *    child_observations) et des tables de garde (childcare_events, childcare_photos) ;
 *  - détection d'un doublon probable (même type, même enfant, heures proches) et fusion proposée ;
 *  - récapitulatif « La journée de … » qui distingue « enregistré » de « non renseigné » et n'invente rien ;
 *  - nettoyage des métadonnées d'un JPEG (EXIF, dont la position GPS ; XMP ; commentaires).
 * Aucune analyse d'image, aucune reconnaissance : seules les données saisies sont utilisées.
 */

export type CareKind = 'bottle' | 'meal' | 'sleep' | 'diaper' | 'activity' | 'observation' | 'arrival' | 'departure' | 'photo';
export type CareOrigin = 'parent' | 'caregiver' | 'custody';

/** Table de chaque saisie : les saisies de la nounou SONT des lignes du suivi existant. */
export const CARE_TABLE: Record<Exclude<CareKind, 'photo'>, string> = {
  bottle: 'bottles', meal: 'meals', sleep: 'sleeps', diaper: 'diapers', observation: 'child_observations',
  activity: 'childcare_events', arrival: 'childcare_events', departure: 'childcare_events',
};
export const CARE_TABLES = ['bottles', 'meals', 'sleeps', 'diapers', 'child_observations', 'childcare_events', 'childcare_photos'] as const;
export const CARE_PHOTO_BUCKET = 'child-photos';
/** Lien signé affiché : quelques minutes seulement (une révocation coupe l'accès en pratique à son expiration). */
export const CARE_SIGNED_URL_SECONDS = 300;
export const CARE_PHOTO_MAX_SIDE = 1600;
export const CARE_PHOTO_QUALITY = 0.8;
export const CARE_PHOTO_MAX_BYTES = 8 * 1024 * 1024;
/** Écart maximal (minutes) pour proposer une fusion de deux saisies du même type. */
export const DUPLICATE_WINDOW_MIN = 20;

export const ACTIVITY_TYPES = ['outdoor', 'play', 'reading', 'music', 'motor', 'creative', 'calm', 'other'] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];
export const MOODS = ['calm', 'happy', 'tired', 'fussy', 'sad', 'other'] as const;
export type CareMood = (typeof MOODS)[number];
export const IMPORTANT_KINDS = ['incident', 'behavior', 'meal_refused', 'temperature', 'contact_parents', 'other'] as const;
export type ImportantKind = (typeof IMPORTANT_KINDS)[number];
export const RETENTIONS = ['30d', '1y', 'forever'] as const;
export type Retention = (typeof RETENTIONS)[number];
/** Légendes proposées (clés i18n) : facultatives, jamais imposées. */
export const CAPTION_SUGGESTIONS = ['nn.cap.1', 'nn.cap.2', 'nn.cap.3', 'nn.cap.4'] as const;

type Row = Record<string, unknown>;
export interface CareItem {
  kind: CareKind;
  id: string;
  /** Heure de l'événement (début pour une sieste). */
  at: string;
  endAt?: string | null;
  authorId: string | null;
  origin: CareOrigin | null;
  pending?: boolean;
  important?: boolean;
  row: Row;
}

const str = (v: unknown) => (typeof v === 'string' ? v : null);

/** Une ligne d'une table → élément de chronologie (null si la ligne n'appartient pas au carnet). */
export function toCareItem(table: string, r: Row): CareItem | null {
  const base = {
    id: String(r.id ?? r.client_id ?? ''), authorId: str(r.created_by) ?? str(r.author_id),
    origin: (str(r.origin) as CareOrigin | null) ?? null, pending: r._pending === true, row: r,
  };
  switch (table) {
    case 'bottles': return { ...base, kind: 'bottle', at: String(r.at) };
    case 'meals': return { ...base, kind: 'meal', at: String(r.at) };
    case 'diapers': return { ...base, kind: 'diaper', at: String(r.at) };
    case 'sleeps': return { ...base, kind: 'sleep', at: String(r.started_at), endAt: str(r.ended_at) };
    case 'child_observations':
      // observations du carnet : notes et températures (les autres symptômes restent dans le suivi santé)
      if (r.kind !== 'note' && r.kind !== 'temperature') return null;
      return { ...base, kind: 'observation', at: String(r.at), important: r.important === true };
    case 'childcare_events': {
      const k = r.kind === 'arrival' || r.kind === 'departure' ? r.kind : 'activity';
      return { ...base, kind: k, at: String(r.at) };
    }
    case 'childcare_photos': return { ...base, kind: 'photo', at: String(r.taken_at), authorId: str(r.author_id) };
    default: return null;
  }
}

/** Chronologie triée par heure (la plus récente en haut). Les doublons d'identifiant sont fusionnés. */
export function buildTimeline(byTable: Record<string, Row[] | undefined>, newestFirst = true): CareItem[] {
  const seen = new Set<string>();
  const out: CareItem[] = [];
  for (const [table, rows] of Object.entries(byTable)) {
    for (const r of rows ?? []) {
      const it = toCareItem(table, r);
      if (!it) continue;
      const key = `${table}:${it.id}`;
      const ck = r.client_id ? `${table}:c:${String(r.client_id)}` : null;
      if (seen.has(key) || (ck && seen.has(ck))) continue;
      seen.add(key);
      if (ck) seen.add(ck);
      out.push(it);
    }
  }
  return out.sort((a, b) => (newestFirst ? b.at.localeCompare(a.at) : a.at.localeCompare(b.at)));
}

/** Bornes locales d'un jour « AAAA-MM-JJ » (heure du téléphone). */
export function dayRange(day: string): { from: string; to: string } {
  const [y, m, d] = day.split('-').map(Number);
  const from = new Date(y, m - 1, d, 0, 0, 0, 0);
  const to = new Date(y, m - 1, d + 1, 0, 0, 0, 0);
  return { from: from.toISOString(), to: to.toISOString() };
}

// ---------------------------------------------------------------- doublons
export interface DuplicateCandidate { kind: CareKind; childId: string; at: string; authorId?: string | null }

/**
 * Doublon probable : même type, même enfant, heures proches (± DUPLICATE_WINDOW_MIN). Les arrivées/départs et les
 * photos ne sont jamais fusionnés ; une observation importante non plus (on ne mélange pas deux informations).
 */
export function findDuplicate(c: DuplicateCandidate, existing: CareItem[], windowMin = DUPLICATE_WINDOW_MIN): CareItem | null {
  if (c.kind === 'photo' || c.kind === 'observation') return null;
  const t = Date.parse(c.at);
  let best: CareItem | null = null;
  let bestGap = Infinity;
  for (const e of existing) {
    if (e.kind !== c.kind || e.pending) continue;
    if (String(e.row.child_id ?? c.childId) !== c.childId) continue;
    const gap = Math.abs(Date.parse(e.at) - t) / 60_000;
    if (gap <= windowMin && gap < bestGap) { best = e; bestGap = gap; }
  }
  return best;
}

const NOTE_COLS: Record<string, string> = { bottles: 'note', meals: 'reaction_note', sleeps: 'note', diapers: 'note', childcare_events: 'note' };

/**
 * Fusion : la saisie existante est COMPLÉTÉE (champs vides remplis, remarques mises bout à bout), jamais écrasée.
 * Renvoie le correctif à appliquer à la ligne existante ({} = rien à ajouter).
 */
export function mergePatch(table: string, existing: Row, incoming: Row): Row {
  const patch: Row = {};
  const skip = new Set(['id', 'client_id', 'child_id', 'household_id', 'created_by', 'created_at', 'origin', 'at', 'started_at', NOTE_COLS[table]]);
  for (const [k, v] of Object.entries(incoming)) {
    if (skip.has(k) || v == null || v === '' || (Array.isArray(v) && !v.length)) continue;
    const cur = existing[k];
    if (cur == null || cur === '' || (Array.isArray(cur) && !cur.length)) patch[k] = v;
    else if (Array.isArray(cur) && Array.isArray(v)) {
      const merged = [...new Set([...cur, ...v])];
      if (merged.length !== cur.length) patch[k] = merged;
    }
  }
  const nc = NOTE_COLS[table];
  if (nc) {
    const a = str(existing[nc])?.trim() ?? '';
    const b = str(incoming[nc])?.trim() ?? '';
    if (b && !a.includes(b)) patch[nc] = (a ? `${a} · ${b}` : b).slice(0, 1000);
  }
  // Une sieste sans fin reçoit la fin connue par l'autre saisie
  if (table === 'sleeps' && !existing.ended_at && incoming.ended_at) patch.ended_at = incoming.ended_at;
  return patch;
}

// ---------------------------------------------------------------- récapitulatif sans invention
export interface DaySummary {
  bottles: { count: number; totalMl: number | null; withoutAmount: number };
  meals: { count: number };
  sleep: { count: number; totalMinutes: number | null; ongoing: number };
  diapers: { count: number; wet: number; stool: number };
  activities: { count: number };
  observations: { count: number; important: number };
  photos: { count: number };
  arrival: string | null;
  departure: string | null;
}

/**
 * Récapitulatif d'une journée À PARTIR DES SEULES SAISIES : un total n'est donné que s'il repose sur des valeurs
 * saisies (aucune estimation, aucune moyenne) ; « null » = non renseigné (et non « zéro »).
 */
export function summarizeDay(items: CareItem[]): DaySummary {
  const of = (k: CareKind) => items.filter((i) => i.kind === k);
  const bottles = of('bottle');
  const amounts = bottles.map((b) => (typeof b.row.consumed_ml === 'number' ? b.row.consumed_ml : typeof b.row.prepared_ml === 'number' && b.row.consumed_ml == null ? null : null));
  const known = amounts.filter((a): a is number => typeof a === 'number');
  const sleeps = of('sleep');
  const done = sleeps.filter((s) => s.endAt);
  const minutes = done.reduce((n, s) => n + Math.max(0, Math.round((Date.parse(String(s.endAt)) - Date.parse(s.at)) / 60_000)), 0);
  const diapers = of('diaper');
  const obs = of('observation');
  const firstOf = (k: CareKind) => { const l = of(k).map((i) => i.at).sort(); return l[0] ?? null; };
  const lastOf = (k: CareKind) => { const l = of(k).map((i) => i.at).sort(); return l[l.length - 1] ?? null; };
  return {
    bottles: { count: bottles.length, totalMl: known.length ? known.reduce((a, b) => a + b, 0) : null, withoutAmount: bottles.length - known.length },
    meals: { count: of('meal').length },
    sleep: { count: sleeps.length, totalMinutes: done.length ? minutes : null, ongoing: sleeps.length - done.length },
    diapers: { count: diapers.length, wet: diapers.filter((d) => d.row.wet === true).length, stool: diapers.filter((d) => d.row.stool === true).length },
    activities: { count: of('activity').length },
    observations: { count: obs.length, important: obs.filter((o) => o.important).length },
    photos: { count: of('photo').length },
    arrival: firstOf('arrival'),
    departure: lastOf('departure'),
  };
}

/** Durée d'une sieste en minutes (null tant qu'elle est en cours). */
export function sleepMinutes(startedAt: string, endedAt: string | null | undefined): number | null {
  if (!endedAt) return null;
  return Math.max(0, Math.round((Date.parse(endedAt) - Date.parse(startedAt)) / 60_000));
}

/** Valeurs par défaut d'une nouvelle saisie = la dernière saisie du même type (sans heure ni remarque). */
export function lastDefaults(kind: CareKind, items: CareItem[]): Row {
  const last = items.filter((i) => i.kind === kind && !i.pending).sort((a, b) => b.at.localeCompare(a.at))[0];
  if (!last) return {};
  const r = last.row;
  switch (kind) {
    case 'bottle': return { consumed_ml: r.consumed_ml ?? null, milk_type: r.milk_type ?? null };
    case 'meal': return { foods: Array.isArray(r.foods) ? r.foods : [] };
    case 'diaper': return { wet: r.wet === true, stool: r.stool === true };
    case 'activity': return { activity_type: r.activity_type ?? null };
    default: return {};
  }
}

// ---------------------------------------------------------------- JPEG : métadonnées
/**
 * Retire d'un JPEG tout segment de métadonnées : APP1 (EXIF — dont la position GPS — et XMP), APP2 à APP13 et APP15
 * (ICC, IPTC/Photoshop, extensions de fabricants) et les commentaires (COM). Garde APP0 (JFIF) et APP14 (Adobe,
 * nécessaire au décodage des couleurs). L'image elle-même n'est pas modifiée (aucun ré-encodage).
 * Lève une erreur si le fichier n'est pas un JPEG lisible.
 */
export function stripJpegMetadata(bytes: Uint8Array): Uint8Array {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error('not_jpeg');
  const parts: Uint8Array[] = [bytes.subarray(0, 2)];
  let i = 2;
  while (i < bytes.length) {
    if (bytes[i] !== 0xff) throw new Error('corrupt_jpeg');
    let marker = bytes[i + 1];
    // octets de remplissage 0xFF
    while (marker === 0xff && i + 2 < bytes.length) { i++; marker = bytes[i + 1]; }
    if (marker === 0xda) { parts.push(bytes.subarray(i)); break; } // début des données d'image : tout le reste est gardé
    if (marker === 0xd9) { parts.push(bytes.subarray(i, i + 2)); break; }
    if (marker >= 0xd0 && marker <= 0xd7) { parts.push(bytes.subarray(i, i + 2)); i += 2; continue; }
    if (i + 3 >= bytes.length) throw new Error('corrupt_jpeg');
    const len = (bytes[i + 2] << 8) | bytes[i + 3];
    if (len < 2 || i + 2 + len > bytes.length) throw new Error('corrupt_jpeg');
    const isMeta = (marker >= 0xe1 && marker <= 0xed) || marker === 0xef || marker === 0xfe;
    if (!isMeta) parts.push(bytes.subarray(i, i + 2 + len));
    i += 2 + len;
  }
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

/** Segments de métadonnées présents avant l'image (pour vérifier qu'aucun n'est envoyé). */
export function jpegMetadataReport(bytes: Uint8Array): { exif: boolean; gps: boolean; xmp: boolean; comment: boolean } {
  const r = { exif: false, gps: false, xmp: false, comment: false };
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return r;
  let i = 2;
  while (i + 3 < bytes.length && bytes[i] === 0xff) {
    const marker = bytes[i + 1];
    if (marker === 0xda || marker === 0xd9) break;
    if (marker >= 0xd0 && marker <= 0xd7) { i += 2; continue; }
    const len = (bytes[i + 2] << 8) | bytes[i + 3];
    const seg = bytes.subarray(i + 4, Math.min(bytes.length, i + 2 + len));
    const head = String.fromCharCode(...seg.subarray(0, 30));
    if (marker === 0xe1 && head.startsWith('Exif')) {
      r.exif = true;
      // Tag GPS (0x8825) dans l'IFD0, en gros ou petit boutiste
      for (let k = 0; k + 1 < seg.length; k++) {
        if ((seg[k] === 0x88 && seg[k + 1] === 0x25) || (seg[k] === 0x25 && seg[k + 1] === 0x88)) { r.gps = true; break; }
      }
    }
    if (marker === 0xe1 && head.startsWith('http://ns.adobe.com/xap')) r.xmp = true;
    if (marker === 0xfe) r.comment = true;
    i += 2 + len;
  }
  return r;
}

// ---------------------------------------------------------------- photos
/** Côtés après réduction (le plus grand ≤ CARE_PHOTO_MAX_SIDE), proportions gardées, jamais d'agrandissement. */
export function fitCarePhoto(width: number, height: number, max = CARE_PHOTO_MAX_SIDE): { width: number; height: number } {
  if (width <= 0 || height <= 0) return { width: max, height: max };
  const k = Math.min(1, max / Math.max(width, height));
  return { width: Math.round(width * k), height: Math.round(height * k) };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Chemin de l'objet : <foyer>/<enfant>/<identifiant client>.jpg (le même identifiant rend l'envoi idempotent). */
export function carePhotoPath(householdId: string, childId: string, clientId: string): string {
  if (![householdId, childId, clientId].every((x) => UUID.test(x))) throw new Error('invalid_photo_path');
  return `${householdId.toLowerCase()}/${childId.toLowerCase()}/${clientId.toLowerCase()}.jpg`;
}

/** Un dépôt déjà présent (reprise après coupure) n'est pas une erreur : la photo est simplement déjà envoyée. */
export function isAlreadyUploaded(e: unknown): boolean {
  const x = e as { message?: string; status?: number; statusCode?: string | number; code?: string } | null;
  if (!x) return false;
  return x.status === 409 || String(x.statusCode) === '409' || x.code === '23505' || /already exists|duplicate/i.test(x.message ?? '');
}

/** Confidentialité : la photo n'est partagée que si elle ne montre QUE l'enfant gardé (réponse déclarée). */
export function canSharePhoto(o: { photosAllowed: boolean; otherChildren: boolean | null; confirmed: boolean }): 'ok' | 'not_allowed' | 'group_photo' | 'answer_needed' | 'confirm_needed' {
  if (!o.photosAllowed) return 'not_allowed';
  if (o.otherChildren === null) return 'answer_needed';
  if (o.otherChildren) return 'group_photo';
  if (!o.confirmed) return 'confirm_needed';
  return 'ok';
}

// ---------------------------------------------------------------- rôles
export interface CareMembership { household_id: string; role: 'owner' | 'coparent' | 'caregiver' }
/** Compte qui n'est QUE nounou (aucun foyer en tant que parent) : son accueil est « Mes gardes ». */
export function isCaregiverOnly(memberships: CareMembership[] | null | undefined): boolean {
  return !!memberships?.length && memberships.every((m) => m.role === 'caregiver');
}
