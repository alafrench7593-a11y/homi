/**
 * ALLAITEMENT — une tétée = UNE ligne de `breastfeeds` (22/11/2026). Fonctions PURES, testées
 * (src/__tests__/breastSession.test.ts) ; la mini-app, l'accueil et les totaux lisent la même donnée.
 *
 *  - Les côtés d'une même tétée sont dans `segments` : [{ side, from, to }] (to = null : côté en cours). Changer de côté
 *    ferme le segment courant et en ouvre un autre DANS LA MÊME LIGNE (jamais une seconde tétée).
 *  - Sans `segments` (saisies plus anciennes, formulaire manuel, colonne absente du serveur) : un côté unique couvre
 *    toute la tétée ; « les deux » sans répartition → durées par côté INCONNUES (null), jamais 0.
 *  - Tétée en cours = `ended_at` vide ET dernier segment ouvert. Sans segments, une tétée sans fin commencée il y a
 *    moins de 3 h est considérée en cours (au-delà : « durée non notée »). L'état vient toujours de la donnée.
 *  - Une tétée qui traverse minuit est répartie sur les deux jours civils locaux.
 *  - Unités : minutes (durées), secondes pour le chronomètre affiché. Rien de noté → null, jamais 0.
 */
import { dayKey, proposedEnd } from './sleepSummary';

export type BreastSide = 'left' | 'right';
export type FeedSide = BreastSide | 'both';
export interface SideSegment { side: BreastSide; from: string; to: string | null }
export interface FeedLike {
  id: string; child_id: string; side: FeedSide; started_at: string; ended_at: string | null;
  note?: string | null; segments?: SideSegment[] | null;
}

const MIN = 60_000;
/** Au-delà, une tétée sans fin et sans segments n'est plus « en cours » : sa durée n'a simplement pas été notée. */
export const OPEN_FEED_MAX_MIN = 180;
/** Nombre maximal de changements de côté gardés dans une tétée (borne aussi vérifiée par la base). */
export const MAX_SEGMENTS = 40;
/** Appui manqué : un côté tenu moins de 5 s est remplacé au lieu de créer un segment minuscule. */
const MISTAP_MS = 5_000;

const ms = (iso: string) => Date.parse(iso);
const iso = (t: number) => new Date(t).toISOString();
export const otherSide = (s: BreastSide): BreastSide => (s === 'left' ? 'right' : 'left');

/** Segments notés et valides (triés), sinon null. */
export function validSegments(f: Pick<FeedLike, 'segments'>): SideSegment[] | null {
  const s = f.segments;
  if (!Array.isArray(s) || !s.length) return null;
  const ok = s.every((x) => !!x && (x.side === 'left' || x.side === 'right') && typeof x.from === 'string' && Number.isFinite(ms(x.from))
    && (x.to === null || x.to === undefined || (typeof x.to === 'string' && Number.isFinite(ms(x.to)))));
  return ok ? [...s].map((x) => ({ side: x.side, from: x.from, to: x.to ?? null })).sort((a, b) => a.from.localeCompare(b.from)) : null;
}

/** Tétée en cours (d'après la donnée seule). */
export function isOngoing(f: FeedLike, now: Date): boolean {
  if (f.ended_at) return false;
  const s = validSegments(f);
  if (s) return s[s.length - 1].to == null;
  const age = (now.getTime() - ms(f.started_at)) / MIN;
  return age >= -1 && age < OPEN_FEED_MAX_MIN;
}

/** Segments effectifs : ceux notés ; sinon un côté unique ; null si « les deux » sans répartition. */
export function feedSegments(f: FeedLike): SideSegment[] | null {
  const s = validSegments(f);
  if (s) return s;
  if (f.side === 'both') return null;
  return [{ side: f.side, from: f.started_at, to: f.ended_at }];
}

/** Côté en cours d'une tétée en cours (null : inconnu ou terminée). */
export function currentSide(f: FeedLike, now: Date): BreastSide | null {
  if (!isOngoing(f, now)) return null;
  const s = feedSegments(f);
  return s ? s[s.length - 1].side : null;
}

/** Fin effective en ms : fin notée, maintenant si en cours, sinon null (durée non notée). */
function endMs(f: FeedLike, now: Date): number | null {
  if (f.ended_at) return ms(f.ended_at);
  return isOngoing(f, now) ? now.getTime() : null;
}

const clip = (a: number, b: number, lo: number, hi: number) => Math.max(0, Math.min(b, hi) - Math.max(a, lo));

/** Millisecondes par côté (bornées à [lo, hi[) ; null là où rien n'est connu. */
export function feedSplitMs(f: FeedLike, now: Date, lo = -Infinity, hi = Infinity): { total: number | null; left: number | null; right: number | null } {
  const end = endMs(f, now);
  if (end == null) return { total: null, left: null, right: null };
  const segs = feedSegments(f);
  if (!segs) return { total: clip(ms(f.started_at), end, lo, hi), left: null, right: null };
  let left = 0; let right = 0;
  segs.forEach((s, i) => {
    const a = ms(s.from);
    const b = Math.min(s.to ? ms(s.to) : segs[i + 1] ? ms(segs[i + 1].from) : end, end);
    const v = clip(a, b, lo, hi);
    if (s.side === 'left') left += v; else right += v;
  });
  return { total: left + right, left, right };
}

export interface FeedDurations { total: number | null; left: number | null; right: number | null }

/** Durées en minutes (arrondies côté par côté ; total = somme des côtés quand la répartition est connue). */
export function feedMinutes(f: FeedLike, now: Date): FeedDurations {
  const x = feedSplitMs(f, now);
  if (x.total == null) return { total: null, left: null, right: null };
  if (x.left == null || x.right == null) return { total: Math.round(x.total / MIN), left: null, right: null };
  const left = Math.round(x.left / MIN); const right = Math.round(x.right / MIN);
  return { total: left + right, left, right };
}

/** Durées en secondes (chronomètre affiché). */
export function feedSeconds(f: FeedLike, now: Date): FeedDurations {
  const x = feedSplitMs(f, now);
  const s = (v: number | null) => (v == null ? null : Math.floor(v / 1000));
  return { total: s(x.total), left: s(x.left), right: s(x.right) };
}

/** « 08:42 » (min:s, chiffres à largeur fixe) ; au-delà d'une heure « 1:08:42 ». */
export function stopwatch(seconds: number): string {
  const v = Math.max(0, Math.floor(seconds));
  const h = Math.floor(v / 3600); const m = Math.floor((v % 3600) / 60); const s = v % 60;
  const mm = String(m).padStart(2, '0'); const ss = String(s).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Côtés réellement utilisés (ordre d'apparition). */
export function sidesUsed(f: FeedLike): BreastSide[] {
  const s = feedSegments(f);
  if (!s) return [];
  const out: BreastSide[] = [];
  for (const x of s) if (!out.includes(x.side)) out.push(x.side);
  return out;
}

// ─── Écritures (patchs purs) ────────────────────────────────────────────────────────────────────

/** Nouvelle tétée sur un côté, maintenant. */
export function startRow(side: BreastSide, at: Date) {
  return { side, started_at: iso(at.getTime()), ended_at: null, segments: [{ side, from: iso(at.getTime()), to: null }] as SideSegment[] };
}

/** Changer de côté DANS la même tétée : le côté courant se ferme, l'autre s'ouvre. */
export function switchPatch(f: FeedLike, at: Date): { side: FeedSide; segments: SideSegment[] } | null {
  if (!isOngoing(f, at)) return null;
  const segs = feedSegments(f);
  if (!segs) return null;
  const t = Math.max(at.getTime(), ms(segs[segs.length - 1].from));
  const last = segs[segs.length - 1];
  let out: SideSegment[];
  if (t - ms(last.from) < MISTAP_MS) {
    // Appui manqué : le côté tout juste ouvert est simplement remplacé
    const prev = segs[segs.length - 2];
    out = prev && prev.side === otherSide(last.side)
      ? [...segs.slice(0, -2), { ...prev, to: null }]
      : [...segs.slice(0, -1), { side: otherSide(last.side), from: last.from, to: null }];
  } else {
    out = [...segs.slice(0, -1), { ...last, to: iso(t) }, { side: otherSide(last.side), from: iso(t), to: null }];
  }
  out = out.slice(-MAX_SEGMENTS);
  const used = new Set(out.map((x) => x.side));
  return { side: used.size > 1 ? 'both' : out[0].side, segments: out };
}

/** Terminer la tétée à `at` (jamais avant son début). */
export function finishPatch(f: FeedLike, at: Date): { ended_at: string; segments?: SideSegment[] } {
  const end = Math.max(at.getTime(), ms(f.started_at));
  const segs = validSegments(f);
  if (!segs) return { ended_at: iso(end) };
  return { ended_at: iso(end), segments: closeAt(segs, end) };
}

/** Segments ramenés à une fin donnée : ceux commencés après sont retirés, le dernier se termine à `end`. */
function closeAt(segs: SideSegment[], end: number): SideSegment[] {
  const kept = segs.filter((s, i) => i === 0 || ms(s.from) < end);
  return kept.map((s, i) => (i === kept.length - 1 ? { ...s, to: iso(end) } : { ...s, to: s.to && ms(s.to) > end ? iso(end) : s.to ?? kept[i + 1].from }));
}

/** Fin corrigée (« 11:24 ») : même jour que le début, ou le lendemain si l'heure est avant (tétée de nuit). */
export function proposedFeedEnd(f: FeedLike, hhmm: string): Date | null {
  return proposedEnd({ id: f.id, child_id: f.child_id, started_at: f.started_at, ended_at: f.ended_at }, hhmm);
}

/** Nouvelle fin d'une tétée terminée (début et ordre des côtés inchangés). */
export function withEnd(f: FeedLike, end: Date): { ended_at: string; segments?: SideSegment[] } | null {
  const e = end.getTime();
  if (!Number.isFinite(e) || e < ms(f.started_at)) return null;
  const segs = validSegments(f);
  return segs ? { ended_at: iso(e), segments: closeAt(segs, e) } : { ended_at: iso(e) };
}

/**
 * Durée d'UN côté corrigée (minutes entières). Le début reste ancré ; l'écart s'applique au DERNIER passage sur ce
 * côté (puis aux précédents si on raccourcit), les passages suivants sont décalés d'autant et la fin suit. Sans
 * répartition connue (« les deux » sans segments) : ce côté d'abord, l'autre ensuite pour le reste de la durée.
 */
export function withSideMinutes(f: FeedLike, side: BreastSide, minutes: number, now: Date): { side: FeedSide; ended_at: string; segments: SideSegment[] } | null {
  if (!Number.isInteger(minutes) || minutes < 0 || minutes > 300 || isOngoing(f, now)) return null;
  const start = ms(f.started_at);
  const end = endMs(f, now);
  let parts: { side: BreastSide; a: number; b: number }[];
  const segs = feedSegments(f);
  if (!segs) {
    const total = end != null ? end - start : minutes * MIN;
    const rest = Math.max(0, total - minutes * MIN);
    parts = [{ side, a: start, b: start + minutes * MIN }, { side: otherSide(side), a: start + minutes * MIN, b: start + minutes * MIN + rest }];
  } else {
    const e0 = end ?? start;
    parts = segs.map((s, i) => ({ side: s.side, a: ms(s.from), b: Math.min(s.to ? ms(s.to) : segs[i + 1] ? ms(segs[i + 1].from) : e0, e0) }));
    const cur = parts.filter((p) => p.side === side).reduce((n, p) => n + (p.b - p.a), 0);
    let delta = minutes * MIN - cur;
    const shiftAfter = (i: number, d: number) => { for (let j = i + 1; j < parts.length; j++) { parts[j].a += d; parts[j].b += d; } };
    if (delta > 0) {
      const i = parts.map((p) => p.side).lastIndexOf(side);
      if (i < 0) { const tail = parts[parts.length - 1].b; parts.push({ side, a: tail, b: tail + delta }); }
      else { parts[i].b += delta; shiftAfter(i, delta); }
    } else {
      for (let i = parts.length - 1; i >= 0 && delta < 0; i--) {
        if (parts[i].side !== side) continue;
        const cut = Math.min(-delta, parts[i].b - parts[i].a);
        parts[i].b -= cut; shiftAfter(i, -cut); delta += cut;
      }
    }
  }
  let kept = parts.filter((p) => p.b > p.a);
  if (!kept.length) kept = [{ side, a: start, b: start }];
  // Le début de la tétée reste ancré même si son premier passage disparaît
  const lead = kept[0].a - start;
  if (lead > 0) kept = kept.map((p) => ({ ...p, a: p.a - lead, b: p.b - lead }));
  // Passages consécutifs du même côté fusionnés
  const merged: typeof kept = [];
  for (const p of kept) { const l = merged[merged.length - 1]; if (l && l.side === p.side && l.b === p.a) l.b = p.b; else merged.push({ ...p }); }
  const used = new Set(merged.map((p) => p.side));
  return {
    side: used.size > 1 ? 'both' : merged[0].side,
    ended_at: iso(merged[merged.length - 1].b),
    segments: merged.map((p) => ({ side: p.side, from: iso(p.a), to: iso(p.b) })).slice(-MAX_SEGMENTS),
  };
}

// ─── Lecture : journée, semaine, dernière tétée ─────────────────────────────────────────────────

export interface DayFeeds {
  day: string;
  /** Tétées qui touchent ce jour */
  count: number;
  /** Minutes de tétée ce jour (seules les durées notées) ; null si aucune tétée ou aucune durée notée. */
  minutes: number | null;
  left: number | null;
  right: number | null;
  /** Tétées du jour sans durée notée / sans répartition par côté */
  noDuration: number;
  noSplit: number;
  sessions: FeedLike[];
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** Tétées de CET enfant par jour civil local, des `days` derniers jours jusqu'à `now` inclus (plus ancien d'abord). */
export function feedsByDay(all: readonly FeedLike[], childId: string, now: Date, days: number): DayFeeds[] {
  const mine = all.filter((f) => f.child_id === childId);
  const first = startOfDay(addDays(now, -(days - 1)));
  const out: DayFeeds[] = [];
  for (let i = 0; i < days; i++) {
    const a = addDays(first, i).getTime(); const b = Math.min(addDays(first, i + 1).getTime(), now.getTime() + 1);
    let total = 0; let left = 0; let right = 0; let known = 0; let split = 0; let noDuration = 0; let noSplit = 0;
    const sessions: FeedLike[] = [];
    for (const f of mine) {
      const s0 = ms(f.started_at); const e = endMs(f, now);
      const touches = e != null ? clip(s0, Math.max(e, s0 + 1), a, b) > 0 : s0 >= a && s0 < b;
      if (!touches) continue;
      sessions.push(f);
      const x = feedSplitMs(f, now, a, b);
      if (x.total == null) { noDuration++; continue; }
      total += x.total; known++;
      if (x.left == null || x.right == null) { noSplit++; continue; }
      left += x.left; right += x.right; split++;
    }
    out.push({
      day: dayKey(new Date(a)), count: sessions.length,
      minutes: known ? Math.round(total / MIN) : null,
      left: split ? Math.round(left / MIN) : null, right: split ? Math.round(right / MIN) : null,
      noDuration, noSplit, sessions: sessions.sort((x, y) => x.started_at.localeCompare(y.started_at)),
    });
  }
  return out;
}

/** Tétée en cours de cet enfant, sinon la plus récente. */
export function lastFeed(all: readonly FeedLike[], childId: string, now: Date): { feed: FeedLike; ongoing: boolean } | null {
  const mine = all.filter((f) => f.child_id === childId).sort((a, b) => b.started_at.localeCompare(a.started_at));
  const open = mine.find((f) => isOngoing(f, now));
  if (open) return { feed: open, ongoing: true };
  return mine[0] ? { feed: mine[0], ongoing: false } : null;
}
