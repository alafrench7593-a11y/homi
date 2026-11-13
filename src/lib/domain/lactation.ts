/**
 * Allaitement, tirage et réserve de lait — logique pure (testée par Jest, sans interface ni réseau).
 *
 * Chronomètre de tétée : la durée est TOUJOURS calculée à partir d'horodatages réels (Date.now au moment des
 * gestes), jamais d'un compteur incrémenté. Une session = une suite de segments { sein, début, fin } ;
 * la pause ferme le segment en cours, la reprise en ouvre un nouveau, le changement de sein ferme et ouvre.
 * Durée = somme des segments. La session est sérialisable telle quelle (reprise après fermeture de l'app).
 *
 * Enregistrement : une ligne `breastfeeds` par segment (le schéma garde un seul côté par ligne), toutes reliées
 * par `session_id`. Les `client_id` des lignes sont DÉRIVÉS de l'identifiant de session : renvoyer la même
 * session (double appui, file hors ligne rejouée) produit les mêmes identifiants, que le serveur ignore.
 *
 * Aucune durée cible, aucune quantité « normale », aucune déduction de lait à partir d'une durée.
 */

export type BreastSide = 'left' | 'right';
export type FeedStatus = 'running' | 'paused' | 'finished';

export interface FeedSegment {
  side: BreastSide;
  /** Horodatages en millisecondes (Date.now). */
  startedAt: number;
  endedAt: number | null;
}

export interface FeedSession {
  /** Identifiant stable créé au démarrage (uuid) : sert de `session_id` et de base aux `client_id`. */
  id: string;
  childId: string;
  status: FeedStatus;
  segments: FeedSegment[];
  /** Horodatage de l'enregistrement réussi (ou mis en file) : un second enregistrement est refusé. */
  savedAt: number | null;
}

export class FeedError extends Error {
  constructor(public code: 'not_running' | 'not_paused' | 'finished' | 'already_saved' | 'empty' | 'start_after_end' | 'future' | 'bad_time') {
    super(code);
  }
}

const other = (s: BreastSide): BreastSide => (s === 'left' ? 'right' : 'left');
const last = <T>(a: T[]): T | undefined => a[a.length - 1];

export function startSession(p: { id: string; childId: string; side: BreastSide; now: number }): FeedSession {
  return { id: p.id, childId: p.childId, status: 'running', segments: [{ side: p.side, startedAt: p.now, endedAt: null }], savedAt: null };
}

/** Ferme le segment ouvert (s'il y en a un) à `now` — jamais avant son début. */
function closeOpen(segments: FeedSegment[], now: number): FeedSegment[] {
  return segments.map((s) => (s.endedAt == null ? { ...s, endedAt: Math.max(s.startedAt, now) } : s));
}

export function pauseSession(s: FeedSession, now: number): FeedSession {
  if (s.status !== 'running') throw new FeedError(s.status === 'finished' ? 'finished' : 'not_running');
  return { ...s, status: 'paused', segments: closeOpen(s.segments, now) };
}

/** Reprend sur le même sein que le dernier segment (ou sur `side` si précisé). */
export function resumeSession(s: FeedSession, now: number, side?: BreastSide): FeedSession {
  if (s.status !== 'paused') throw new FeedError(s.status === 'finished' ? 'finished' : 'not_paused');
  const sd = side ?? last(s.segments)?.side ?? 'left';
  return { ...s, status: 'running', segments: [...s.segments, { side: sd, startedAt: Math.max(now, lastEnd(s) ?? now), endedAt: null }] };
}

/** Change de sein : en cours → ferme et ouvre l'autre sein ; en pause → reprend sur l'autre sein. */
export function switchSide(s: FeedSession, now: number): FeedSession {
  if (s.status === 'finished') throw new FeedError('finished');
  const next = other(currentSide(s));
  if (s.status === 'paused') return resumeSession(s, now, next);
  const closed = closeOpen(s.segments, now);
  return { ...s, segments: [...closed, { side: next, startedAt: Math.max(now, last(closed)!.endedAt!), endedAt: null }] };
}

export function finishSession(s: FeedSession, now: number): FeedSession {
  if (s.status === 'finished') return s;
  return { ...s, status: 'finished', segments: closeOpen(s.segments, now) };
}

/** « Continuer la tétée » après « Terminer » (pas encore enregistrée) : la session repasse en pause. */
export function reopenSession(s: FeedSession): FeedSession {
  if (s.savedAt != null) throw new FeedError('already_saved');
  if (s.status !== 'finished') return s;
  return { ...s, status: 'paused' };
}

export function currentSide(s: FeedSession): BreastSide {
  return last(s.segments)?.side ?? 'left';
}

const segMs = (g: FeedSegment, now: number) => Math.max(0, (g.endedAt ?? now) - g.startedAt);

/** Temps passé au sein (somme des segments ; le segment ouvert compte jusqu'à `now`). Les pauses ne comptent pas. */
export function elapsedMs(s: FeedSession, now: number): number {
  return s.segments.reduce((n, g) => n + segMs(g, now), 0);
}

export function durationBySide(s: FeedSession, now: number): Record<BreastSide, number> {
  const out: Record<BreastSide, number> = { left: 0, right: 0 };
  for (const g of s.segments) out[g.side] += segMs(g, now);
  return out;
}

/** Temps du segment en cours (0 en pause). */
export function currentSegmentMs(s: FeedSession, now: number): number {
  const g = last(s.segments);
  return g && g.endedAt == null ? segMs(g, now) : 0;
}

export const firstStart = (s: FeedSession): number => s.segments[0]?.startedAt ?? 0;
export function lastEnd(s: FeedSession): number | null {
  const g = last(s.segments);
  return g ? g.endedAt : null;
}

/**
 * Correction manuelle de l'heure de début et de fin AVANT l'enregistrement (session terminée).
 * Le début remplace celui du premier segment, la fin celle du dernier. Les segments intermédiaires ne bougent pas.
 */
export function correctTimes(s: FeedSession, p: { start?: number; end?: number }, now: number): FeedSession {
  if (s.status !== 'finished') throw new FeedError('not_paused');
  if (s.savedAt != null) throw new FeedError('already_saved');
  const segs = s.segments.map((g) => ({ ...g }));
  if (!segs.length) throw new FeedError('empty');
  const start = p.start ?? segs[0].startedAt;
  const end = p.end ?? segs[segs.length - 1].endedAt!;
  if (!Number.isFinite(start) || !Number.isFinite(end)) throw new FeedError('bad_time');
  if (end > now + 60_000 || start > now + 60_000) throw new FeedError('future');
  if (end <= start) throw new FeedError('start_after_end');
  segs[0].startedAt = start;
  segs[segs.length - 1].endedAt = end;
  // Chaque segment doit rester dans l'ordre (le début corrigé ne peut pas dépasser la fin du premier segment, etc.)
  for (const g of segs) if ((g.endedAt ?? now) < g.startedAt) throw new FeedError('start_after_end');
  for (let i = 1; i < segs.length; i++) if (segs[i].startedAt < (segs[i - 1].endedAt ?? 0)) throw new FeedError('start_after_end');
  return { ...s, segments: segs };
}

/** Identifiant de ligne déterministe : les 4 derniers chiffres hexadécimaux de l'uuid de session portent le rang du segment. */
export function segmentClientId(sessionId: string, index: number): string {
  const hex = (0xa000 + (index & 0x0fff)).toString(16);
  return `${sessionId.slice(0, -4)}${hex}`;
}

export interface BreastfeedRow {
  client_id: string;
  session_id: string;
  child_id: string;
  side: BreastSide;
  started_at: string;
  ended_at: string;
  note: string | null;
}

/**
 * Lignes `breastfeeds` d'une session terminée : une par segment de plus d'une seconde (un appui accidentel sur
 * « changer de sein » ne crée pas de ligne vide). La note n'est portée que par la première ligne.
 */
export function toBreastfeedRows(s: FeedSession, note: string | null = null): BreastfeedRow[] {
  if (s.status !== 'finished') throw new FeedError('not_paused');
  const kept = s.segments.filter((g) => g.endedAt != null && g.endedAt - g.startedAt >= 1000);
  if (!kept.length) throw new FeedError('empty');
  return kept.map((g, i) => ({
    client_id: segmentClientId(s.id, i),
    session_id: s.id,
    child_id: s.childId,
    side: g.side,
    started_at: new Date(g.startedAt).toISOString(),
    ended_at: new Date(g.endedAt!).toISOString(),
    note: i === 0 ? note : null,
  }));
}

/** Un enregistrement par session : refuse une session déjà enregistrée ou encore en cours. */
export function canSave(s: FeedSession): boolean {
  return s.status === 'finished' && s.savedAt == null;
}
export function markSaved(s: FeedSession, now: number): FeedSession {
  if (s.savedAt != null) throw new FeedError('already_saved');
  return { ...s, savedAt: now };
}

/** Relit une session conservée sur l'appareil (stockage local) ; null si elle est illisible. */
export function reviveSession(raw: unknown): FeedSession | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<FeedSession>;
  if (typeof r.id !== 'string' || typeof r.childId !== 'string' || !Array.isArray(r.segments) || !r.segments.length) return null;
  if (r.status !== 'running' && r.status !== 'paused' && r.status !== 'finished') return null;
  const segs: FeedSegment[] = [];
  for (const g of r.segments as unknown[]) {
    const x = g as Partial<FeedSegment>;
    if ((x.side !== 'left' && x.side !== 'right') || typeof x.startedAt !== 'number' || !(x.endedAt == null || typeof x.endedAt === 'number')) return null;
    segs.push({ side: x.side, startedAt: x.startedAt, endedAt: x.endedAt ?? null });
  }
  // Seul le dernier segment peut être ouvert, et seulement si la session est en cours
  if (segs.slice(0, -1).some((g) => g.endedAt == null)) return null;
  if (r.status !== 'running' && segs[segs.length - 1].endedAt == null) return null;
  return { id: r.id, childId: r.childId, status: r.status, segments: segs, savedAt: typeof r.savedAt === 'number' ? r.savedAt : null };
}

/** Durée écrite pour les lecteurs d'écran et l'affichage : « 12:05 » ou « 1:02:05 ». */
export function clock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
}

/** Composantes d'une durée (heures, minutes, secondes) pour une phrase traduite (« 12 minutes 5 secondes »). */
export function durationParts(ms: number): { h: number; m: number; s: number } {
  const total = Math.max(0, Math.floor(ms / 1000));
  return { h: Math.floor(total / 3600), m: Math.floor((total % 3600) / 60), s: total % 60 };
}

// =====================================================================================================
// Tirage
// =====================================================================================================
export type PumpMode = 'left' | 'right' | 'both';
export type PumpComfort = 'comfortable' | 'uncomfortable' | 'painful';
export const PUMP_COMFORTS: PumpComfort[] = ['comfortable', 'uncomfortable', 'painful'];
export const MAX_ML = 1000;

export interface PumpInput {
  mode: PumpMode;
  leftMl: number | null;
  rightMl: number | null;
  /** Total saisi à la main (null : calculé). */
  totalMl: number | null;
  durationMin: number | null;
  comfort: PumpComfort | null;
}

/** Total calculé à partir des quantités par sein connues (null si aucune). */
export function computedTotal(leftMl: number | null, rightMl: number | null): number | null {
  if (leftMl == null && rightMl == null) return null;
  return (leftMl ?? 0) + (rightMl ?? 0);
}

export type PumpError = 'no_amount' | 'amount_range' | 'duration_range' | 'total_below_sides';

/** Ligne `pumpings` (amount_ml reste le total) ou erreur de saisie. */
export function pumpRow(p: PumpInput): { row: { side: PumpMode; amount_ml: number; left_ml: number | null; right_ml: number | null; duration_min: number | null; comfort: PumpComfort | null } } | { error: PumpError } {
  const left = p.mode === 'right' ? null : p.leftMl;
  const right = p.mode === 'left' ? null : p.rightMl;
  for (const v of [left, right, p.totalMl]) if (v != null && (!Number.isInteger(v) || v < 0 || v > MAX_ML)) return { error: 'amount_range' };
  const total = p.totalMl ?? computedTotal(left, right);
  if (total == null) return { error: 'no_amount' };
  if (total > MAX_ML) return { error: 'amount_range' };
  // Un total corrigé à la main ne peut pas être inférieur à la somme des seins saisis
  const sides = computedTotal(left, right);
  if (sides != null && total < sides) return { error: 'total_below_sides' };
  if (p.durationMin != null && (!Number.isInteger(p.durationMin) || p.durationMin < 1 || p.durationMin > 300)) return { error: 'duration_range' };
  return { row: { side: p.mode, amount_ml: total, left_ml: left, right_ml: right, duration_min: p.durationMin, comfort: p.comfort } };
}

export interface PumpingLike { at: string; amount_ml: number | null }

/** Jour local AAAA-MM-JJ d'un horodatage. */
export function localDay(d: Date | number | string): string {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

/**
 * Volumes tirés par jour sur les `days` derniers jours (aujourd'hui compris), du plus ancien au plus récent.
 * Uniquement des volumes saisis ; un jour sans tirage vaut 0 avec count = 0 (affiché « aucun tirage »).
 */
export function dailyPumpVolumes(rows: PumpingLike[], days: number, now: Date): { day: string; ml: number; count: number }[] {
  const out: { day: string; ml: number; count: number }[] = [];
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() - i);
    out.push({ day: localDay(d), ml: 0, count: 0 });
  }
  const idx = new Map(out.map((x, i) => [x.day, i]));
  for (const r of rows) {
    const i = idx.get(localDay(r.at));
    if (i == null) continue;
    out[i].count += 1;
    out[i].ml += typeof r.amount_ml === 'number' ? r.amount_ml : 0;
  }
  return out;
}

// =====================================================================================================
// Réserve de lait
// =====================================================================================================
export type StashStorage = 'fridge' | 'freezer' | 'other';
export type StashStatus = 'available' | 'used' | 'discarded';
export const STASH_STORAGES: StashStorage[] = ['fridge', 'freezer', 'other'];

export interface StashPortion {
  id: string;
  volume_ml: number;
  collected_at: string;
  storage: StashStorage;
  location: string | null;
  status: StashStatus;
  status_at: string | null;
}

export type StashError = 'volume_range' | 'future' | 'location_long' | 'not_available' | 'before_collect';

export function stashRow(p: { volumeMl: number | null; collectedAt: Date; storage: StashStorage; location: string; note: string }, now: Date):
  { row: { volume_ml: number; collected_at: string; storage: StashStorage; location: string | null; note: string | null; status: 'available'; status_at: null } } | { error: StashError } {
  if (p.volumeMl == null || !Number.isInteger(p.volumeMl) || p.volumeMl < 1 || p.volumeMl > MAX_ML) return { error: 'volume_range' };
  if (p.collectedAt.getTime() > now.getTime() + 60_000) return { error: 'future' };
  const loc = p.location.trim();
  if (loc.length > 120) return { error: 'location_long' };
  return { row: { volume_ml: p.volumeMl, collected_at: p.collectedAt.toISOString(), storage: p.storage, location: loc || null, note: p.note.trim() || null, status: 'available', status_at: null } };
}

/** Passage d'une portion disponible à « utilisée » ou « jetée », avec la date du geste. */
export function stashTransition(p: StashPortion, to: 'used' | 'discarded', at: Date): { patch: { status: 'used' | 'discarded'; status_at: string } } | { error: StashError } {
  if (p.status !== 'available') return { error: 'not_available' };
  if (at.getTime() < Date.parse(p.collected_at)) return { error: 'before_collect' };
  return { patch: { status: to, status_at: at.toISOString() } };
}

/** Stock restant : somme des portions DISPONIBLES (les portions utilisées ou jetées ne comptent plus). */
export function stashRemaining(portions: Pick<StashPortion, 'volume_ml' | 'status' | 'storage'>[]): { ml: number; count: number; byStorage: Record<StashStorage, { ml: number; count: number }> } {
  const byStorage: Record<StashStorage, { ml: number; count: number }> = { fridge: { ml: 0, count: 0 }, freezer: { ml: 0, count: 0 }, other: { ml: 0, count: 0 } };
  let ml = 0;
  let count = 0;
  for (const p of portions) {
    if (p.status !== 'available') continue;
    ml += p.volume_ml;
    count += 1;
    byStorage[p.storage].ml += p.volume_ml;
    byStorage[p.storage].count += 1;
  }
  return { ml, count, byStorage };
}

/** Portions disponibles d'abord (les plus anciennes en premier, pour les retrouver), puis l'historique récent. */
export function sortStash<T extends Pick<StashPortion, 'status' | 'collected_at' | 'status_at'>>(rows: T[]): { available: T[]; past: T[] } {
  const available = rows.filter((r) => r.status === 'available').sort((a, b) => a.collected_at.localeCompare(b.collected_at));
  const past = rows.filter((r) => r.status !== 'available').sort((a, b) => String(b.status_at ?? b.collected_at).localeCompare(String(a.status_at ?? a.collected_at)));
  return { available, past };
}

// =====================================================================================================
// Accueil : mode d'alimentation, dernière session, résumé du jour
// =====================================================================================================
export type FeedingMode = 'breastfeed' | 'pumping' | 'bottle';
export interface BreastfeedLike { id?: string; side: 'left' | 'right' | 'both'; started_at: string; ended_at: string | null; session_id?: string | null }
export interface BottleLike { id?: string; at: string; consumed_ml: number | null; prepared_ml?: number | null; milk_type: string | null }

/**
 * Mode déduit des saisies des 3 derniers jours : le plus fréquent (une tétée en plusieurs seins compte une fois) ;
 * à égalité, le plus récent ; sans saisie, la tétée. Ce n'est qu'un ordre d'affichage des boutons.
 */
export function inferFeedingMode(p: { breastfeeds: BreastfeedLike[]; pumpings: PumpingLike[]; bottles: BottleLike[] }, now: Date): FeedingMode {
  const since = now.getTime() - 3 * 86400_000;
  const recent = (iso: string) => Date.parse(iso) >= since;
  const sessions = groupSessions(p.breastfeeds.filter((b) => recent(b.started_at)));
  const counts: Record<FeedingMode, { n: number; last: number }> = {
    breastfeed: { n: sessions.length, last: Math.max(0, ...sessions.map((s) => Date.parse(s.startedAt))) },
    pumping: { n: p.pumpings.filter((x) => recent(x.at)).length, last: Math.max(0, ...p.pumpings.filter((x) => recent(x.at)).map((x) => Date.parse(x.at))) },
    bottle: { n: p.bottles.filter((x) => recent(x.at)).length, last: Math.max(0, ...p.bottles.filter((x) => recent(x.at)).map((x) => Date.parse(x.at))) },
  };
  const order: FeedingMode[] = ['breastfeed', 'pumping', 'bottle'];
  const best = [...order].sort((a, b) => counts[b].n - counts[a].n || counts[b].last - counts[a].last)[0];
  return counts[best].n ? best : 'breastfeed';
}

export interface SessionGroup {
  key: string;
  startedAt: string;
  endedAt: string | null;
  /** Temps au sein connu (somme des segments terminés), en millisecondes ; null si aucune fin n'est connue. */
  durationMs: number | null;
  sides: ('left' | 'right' | 'both')[];
  rows: BreastfeedLike[];
}

/** Regroupe les lignes d'une même tétée (même session_id) ; une ligne sans session_id est une tétée à elle seule. */
export function groupSessions(rows: BreastfeedLike[]): SessionGroup[] {
  const map = new Map<string, BreastfeedLike[]>();
  rows.forEach((r, i) => {
    const k = r.session_id ?? `row:${r.id ?? i}:${r.started_at}`;
    map.set(k, [...(map.get(k) ?? []), r]);
  });
  const out: SessionGroup[] = [];
  for (const [key, list] of map) {
    const sorted = [...list].sort((a, b) => a.started_at.localeCompare(b.started_at));
    const ends = sorted.map((r) => r.ended_at).filter((x): x is string => !!x);
    const known = sorted.filter((r) => r.ended_at);
    out.push({
      key,
      startedAt: sorted[0].started_at,
      endedAt: ends.length ? ends.sort().pop()! : null,
      durationMs: known.length ? known.reduce((n, r) => n + Math.max(0, Date.parse(r.ended_at!) - Date.parse(r.started_at)), 0) : null,
      sides: sorted.map((r) => r.side).filter((s, i, a) => a.indexOf(s) === i),
      rows: sorted,
    });
  }
  return out.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export type LastSession = { kind: 'breastfeed'; at: string; group: SessionGroup } | { kind: 'pumping'; at: string; ml: number | null } | { kind: 'bottle'; at: string; ml: number | null; milk: MilkKind };

export function lastFeedingSession(p: { breastfeeds: BreastfeedLike[]; pumpings: PumpingLike[]; bottles: BottleLike[] }): LastSession | null {
  const cands: LastSession[] = [];
  const g = groupSessions(p.breastfeeds)[0];
  if (g) cands.push({ kind: 'breastfeed', at: g.startedAt, group: g });
  const pu = [...p.pumpings].sort((a, b) => b.at.localeCompare(a.at))[0];
  if (pu) cands.push({ kind: 'pumping', at: pu.at, ml: pu.amount_ml });
  const bo = [...p.bottles].sort((a, b) => b.at.localeCompare(a.at))[0];
  if (bo) cands.push({ kind: 'bottle', at: bo.at, ml: bo.consumed_ml, milk: milkKind(bo.milk_type) });
  return cands.sort((a, b) => b.at.localeCompare(a.at))[0] ?? null;
}

/**
 * Résumé du jour (jour local de `now`) : chaque mesure est donnée séparément — on n'additionne jamais
 * une durée et un volume, ni le lait tiré et le lait bu.
 */
export function feedingDaySummary(p: { breastfeeds: BreastfeedLike[]; pumpings: PumpingLike[]; bottles: BottleLike[] }, now: Date) {
  const today = localDay(now);
  const isToday = (iso: string) => localDay(iso) === today;
  const sessions = groupSessions(p.breastfeeds.filter((b) => isToday(b.started_at)));
  const pumps = p.pumpings.filter((x) => isToday(x.at));
  const bottles = p.bottles.filter((x) => isToday(x.at));
  const known = pumps.filter((x) => typeof x.amount_ml === 'number');
  const drunk = bottles.filter((x) => typeof x.consumed_ml === 'number');
  const meals = [...sessions.map((s) => s.startedAt), ...bottles.map((b) => b.at)].sort();
  return {
    feeds: sessions.length,
    lastMealAt: meals.length ? meals[meals.length - 1] : null,
    pumpCount: pumps.length,
    pumpedMl: known.length ? known.reduce((n, x) => n + (x.amount_ml as number), 0) : null,
    bottleCount: bottles.length,
    bottleDrunkMl: drunk.length ? drunk.reduce((n, x) => n + (x.consumed_ml as number), 0) : null,
  };
}

// =====================================================================================================
// Historique unifié
// =====================================================================================================
export type MilkKind = 'breast' | 'other' | 'unknown';
const BREAST_MILK = /(lait\s+(maternel|tir[ée])|maternel|breast\s*milk|expressed|muttermilch|abgepumpt|leche\s+materna|materna|latte\s+materno|materno)/i;
/** Lait du biberon d'après le type saisi (texte libre) : maternel, autre lait, ou non précisé. */
export function milkKind(milkType: string | null | undefined): MilkKind {
  const t = (milkType ?? '').trim();
  if (!t) return 'unknown';
  return BREAST_MILK.test(t) ? 'breast' : 'other';
}

export type HistoryFilter = 'all' | 'breastfeed' | 'pumping' | 'bottle_breast' | 'bottle_other';
export const HISTORY_FILTERS: HistoryFilter[] = ['all', 'breastfeed', 'pumping', 'bottle_breast', 'bottle_other'];

export type HistoryEntry =
  | { kind: 'breastfeed'; at: string; group: SessionGroup }
  | { kind: 'pumping'; at: string; row: PumpingLike & { id?: string; side?: string | null; left_ml?: number | null; right_ml?: number | null; duration_min?: number | null; comfort?: string | null; note?: string | null } }
  | { kind: 'bottle'; at: string; milk: MilkKind; row: BottleLike & { note?: string | null } };

export function feedingHistory(p: { breastfeeds: BreastfeedLike[]; pumpings: (PumpingLike & { id?: string })[]; bottles: BottleLike[] }, filter: HistoryFilter): { day: string; entries: HistoryEntry[] }[] {
  const all: HistoryEntry[] = [
    ...groupSessions(p.breastfeeds).map((g) => ({ kind: 'breastfeed' as const, at: g.startedAt, group: g })),
    ...p.pumpings.map((row) => ({ kind: 'pumping' as const, at: row.at, row })),
    ...p.bottles.map((row) => ({ kind: 'bottle' as const, at: row.at, milk: milkKind(row.milk_type), row })),
  ];
  const keep = all.filter((e) => filter === 'all' || (filter === 'breastfeed' && e.kind === 'breastfeed') || (filter === 'pumping' && e.kind === 'pumping')
    || (filter === 'bottle_breast' && e.kind === 'bottle' && e.milk === 'breast') || (filter === 'bottle_other' && e.kind === 'bottle' && e.milk !== 'breast'));
  keep.sort((a, b) => b.at.localeCompare(a.at));
  const days: { day: string; entries: HistoryEntry[] }[] = [];
  for (const e of keep) {
    const d = localDay(e.at);
    const cur = days[days.length - 1];
    if (cur && cur.day === d) cur.entries.push(e);
    else days.push({ day: d, entries: [e] });
  }
  return days;
}
