/**
 * Lecture, aide et scanners (22/11/2026) — fonctions PURES (testées : src/__tests__/readTrack.test.ts).
 *
 *  · Mémoire de lecture PAR PROFIL (moi, ma grossesse, chaque enfant) : favoris (étoile) et « Reprendre la lecture »
 *    (dernier contenu long ouvert + position de défilement). État d'interface local, jamais une donnée de santé :
 *    seulement l'identifiant, le titre et l'adresse du contenu.
 *  · Questions de consultation : compte « à poser », prochain rendez-vous du même profil, fusion sans doublon dans
 *    la liste de questions du rendez-vous (`appointments.questions`, lien qui existe déjà dans la donnée).
 *  · Journal des scans : regroupement par jour, heure affichée telle qu'enregistrée (aucune réinterprétation).
 */

// ------------------------------------------------------------------ mémoire de lecture
export type ReadKind = 'article' | 'guide' | 'night' | 'source';
export interface ReadRef { kind: ReadKind; id: string; title: string; href: string }
export interface ReadFav extends ReadRef { at: string }
export interface ReadLast extends ReadRef { at: string; y: number }
export interface ProfileReading {
  favorites: ReadFav[];
  last: ReadLast | null;
  /** Position de défilement par contenu (`kind:id`), en px. */
  positions: Record<string, { y: number; at: string }>;
}

export const EMPTY_READING: ProfileReading = { favorites: [], last: null, positions: {} };
export const MAX_FAVORITES = 100;
export const MAX_POSITIONS = 40;
/** En dessous, la position n'est pas restaurée (on est encore en haut du contenu). */
export const RESUME_MIN_Y = 48;

/** Profil affiché → clé locale : compte + profil (enfant, grossesse ou « moi »). */
export function profileKey(p: { userId: string | null | undefined; scope: string; childId?: string | null; pregnancyId?: string | null }): string {
  const who = p.childId ? `child:${p.childId}` : p.scope === 'pregnancy' && p.pregnancyId ? `pregnancy:${p.pregnancyId}` : `me:${p.scope}`;
  return `${p.userId || 'anon'}|${who}`;
}

export const itemKey = (kind: ReadKind, id: string) => `${kind}:${id}`;

export const isFav = (p: ProfileReading, kind: ReadKind, id: string) => p.favorites.some((f) => f.kind === kind && f.id === id);

/** Ajoute (en tête) ou retire un favori ; titre et adresse mis à jour s'il existait. */
export function toggleFav(p: ProfileReading, ref: ReadRef, now: Date): ProfileReading {
  if (isFav(p, ref.kind, ref.id)) return { ...p, favorites: p.favorites.filter((f) => !(f.kind === ref.kind && f.id === ref.id)) };
  return { ...p, favorites: [{ ...clean(ref), at: now.toISOString() }, ...p.favorites].slice(0, MAX_FAVORITES) };
}

const clean = (r: ReadRef): ReadRef => ({ kind: r.kind, id: r.id, title: r.title.trim().slice(0, 160), href: r.href });

/** Ouverture d'un contenu long : il devient « dernier contenu », avec sa position enregistrée (0 sinon). */
export function opened(p: ProfileReading, ref: ReadRef, now: Date): ProfileReading {
  const y = p.positions[itemKey(ref.kind, ref.id)]?.y ?? 0;
  return { ...p, last: { ...clean(ref), at: now.toISOString(), y } };
}

/** Position de défilement : entier ≥ 0 ; les plus anciennes sont oubliées au-delà de MAX_POSITIONS. */
export function savePosition(p: ProfileReading, kind: ReadKind, id: string, y: number, now: Date): ProfileReading {
  if (!Number.isFinite(y)) return p;
  const v = Math.max(0, Math.round(y));
  const k = itemKey(kind, id);
  if (p.positions[k]?.y === v && (!p.last || p.last.kind !== kind || p.last.id !== id || p.last.y === v)) return p;
  const at = now.toISOString();
  const entries = Object.entries({ ...p.positions, [k]: { y: v, at } })
    .sort((a, b) => b[1].at.localeCompare(a[1].at)).slice(0, MAX_POSITIONS);
  const last = p.last && p.last.kind === kind && p.last.id === id ? { ...p.last, y: v } : p.last;
  return { ...p, positions: Object.fromEntries(entries), last };
}

export const positionOf = (p: ProfileReading, kind: ReadKind, id: string) => p.positions[itemKey(kind, id)]?.y ?? 0;

/** Position à restaurer à l'ouverture (null : rester en haut). */
export const restoreY = (p: ProfileReading, kind: ReadKind, id: string): number | null => {
  const y = positionOf(p, kind, id);
  return y >= RESUME_MIN_Y ? y : null;
};

/** Carte « Reprendre la lecture » : le dernier contenu ouvert, sauf celui qu'on regarde (et seulement certains types). */
export function resumeOf(p: ProfileReading, opts: { kinds?: ReadKind[]; except?: { kind: ReadKind; id: string } | null } = {}): ReadLast | null {
  const l = p.last;
  if (!l) return null;
  if (opts.kinds && !opts.kinds.includes(l.kind)) return null;
  if (opts.except && opts.except.kind === l.kind && opts.except.id === l.id) return null;
  return l;
}

/** Favoris d'un ou plusieurs types, du plus récent au plus ancien. */
export const favoritesOf = (p: ProfileReading, kinds: ReadKind[]) => p.favorites.filter((f) => kinds.includes(f.kind));

// ------------------------------------------------------------------ questions de consultation
export interface QuestionLike { id: string; question: string; done: boolean; answer?: string | null }

/** Normalisation pour comparer deux questions (casse, espaces, ponctuation finale). */
export const questionKey = (q: string) => q.trim().replace(/\s+/g, ' ').replace(/[\s?!.…]+$/u, '').toLocaleLowerCase('fr');

export function questionCounts(list: QuestionLike[]): { toAsk: number; asked: number; answered: number } {
  return {
    toAsk: list.filter((q) => !q.done).length,
    asked: list.filter((q) => q.done).length,
    answered: list.filter((q) => !!q.answer?.trim()).length,
  };
}

export interface ApptLike { id: string; starts_at: string; child_id: string | null; pregnancy_id: string | null; for_parent: boolean; questions: string[] | null; title: string }

/** Prochain rendez-vous À VENIR du même profil (enfant, grossesse, ou soi). */
export function nextAppointmentFor<A extends ApptLike>(appts: A[], who: { childId?: string | null; pregnancyId?: string | null; me?: boolean }, now: Date): A | null {
  const t = now.getTime();
  const fits = (a: A) => (who.childId ? a.child_id === who.childId : who.pregnancyId ? a.pregnancy_id === who.pregnancyId : !!who.me && !a.child_id && (a.for_parent || !a.pregnancy_id));
  return appts.filter((a) => fits(a) && Date.parse(a.starts_at) > t).sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0] ?? null;
}

/** Questions déjà présentes dans la liste du rendez-vous. */
export const inAppointment = (appt: Pick<ApptLike, 'questions'> | null, question: string) =>
  !!appt && (appt.questions ?? []).some((q) => questionKey(q) === questionKey(question));

/** Fusion : questions du rendez-vous + questions À POSER absentes (ordre conservé). `added` = nombre ajouté. */
export function mergeIntoAppointment(existing: string[] | null, list: QuestionLike[]): { questions: string[]; added: number } {
  const base = [...(existing ?? [])];
  const seen = new Set(base.map(questionKey));
  let added = 0;
  for (const q of list) {
    if (q.done) continue;
    const k = questionKey(q.question);
    if (!k || seen.has(k)) continue;
    seen.add(k); base.push(q.question.trim()); added += 1;
  }
  return { questions: base, added };
}

/** Texte d'une question corrigée : non vide, 300 caractères au plus, pas un doublon d'une autre question. */
export function validateQuestion(text: string, others: QuestionLike[], selfId: string | null): 'empty' | 'dup' | null {
  const k = questionKey(text);
  if (!k) return 'empty';
  return others.some((o) => o.id !== selfId && questionKey(o.question) === k) ? 'dup' : null;
}

// ------------------------------------------------------------------ journal des scans
export interface ScanLike { id: string; analysed_at: string | null; created_at: string }

const pad = (n: number) => String(n).padStart(2, '0');
/** Jour local AAAA-MM-JJ d'un horodatage. */
export const localDay = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
/** Heure locale HH:MM d'un horodatage (colonne fixe du journal). */
export const localHm = (iso: string) => { const d = new Date(iso); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };

/** Scans regroupés par jour (le plus récent d'abord), dans chaque jour du plus récent au plus ancien. */
export function scanJournal<S extends ScanLike>(rows: S[]): { day: string; items: S[] }[] {
  const at = (s: S) => s.analysed_at ?? s.created_at;
  const sorted = [...rows].sort((a, b) => at(b).localeCompare(at(a)));
  const out: { day: string; items: S[] }[] = [];
  for (const s of sorted) {
    const d = localDay(at(s));
    const g = out[out.length - 1];
    if (g && g.day === d) g.items.push(s); else out.push({ day: d, items: [s] });
  }
  return out;
}
