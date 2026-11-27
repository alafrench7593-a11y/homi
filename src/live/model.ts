/**
 * Live Activities HOMI (27/11/2026) : calcul PUR des sessions en cours et des décisions start / update / end.
 *
 * - Données réelles seulement : une session n'existe que si une ligne réelle est ouverte (tétée sans fin, biberon
 *   `in_progress`, sommeil sans réveil, contraction de la séance en cours, chrono de tire-lait lancé par le parent,
 *   créneau de relais de nuit en cours). Rien n'est simulé : le chrono avance seul dans la vue native.
 * - Au plus une activité par session (clé stable = identifiant de la ligne ou de la séance).
 * - Une activité n'est terminée que si son type est « chargé » pour son périmètre (jamais pendant un chargement).
 * - Une activité fermée par le parent (glissée sur l'écran verrouillé) n'est pas relancée pour la même session.
 * - Confidentialité : prénoms masqués en mode discret ; contractions (grossesse) discrètes sauf réglage détaillé et
 *   marquées sensibles (masquées iPhone verrouillé).
 */
import { t as tr, formatTime } from '@/i18n';
import { currentSide, isOngoing, OPEN_FEED_MAX_MIN, type FeedLike } from '@/lib/domain/breastSession';
import { fmtSec, running, timed, type Contraction } from '@/features/birth/contractions';
import type { LiveKind, LiveProps, LiveSession } from './types';

const MIN = 60_000;
const H = 60 * MIN;
/** Sommeil ouvert depuis plus de 18 h : oubli de fin, pas une session en cours (même règle que les widgets). */
export const SLEEP_OPEN_MAX_MS = 18 * H;
/** Biberon resté « en cours » plus de 4 h : oubli, pas une session. */
export const BOTTLE_OPEN_MAX_MS = 4 * H;
/** Séance de contractions : terminée 60 min après la fin de la dernière contraction ; contraction ouverte > 30 min = oubli. */
export const CONTRACTION_IDLE_MS = 60 * MIN;
export const CONTRACTION_OPEN_MAX_MS = 30 * MIN;
/** Chrono de tire-lait oublié au-delà de 3 h. */
export const PUMP_OPEN_MAX_MS = 3 * H;

export interface LiveCtx {
  now: Date;
  /** Masquer les prénoms (réglage des widgets « discret »). */
  discreet: boolean;
  /** Contenus de grossesse détaillés (sinon discrets, comme les widgets). */
  detailed: boolean;
  logo: string;
  url: (path: string) => string;
}

const ms = (iso: string | null | undefined) => (iso ? Date.parse(iso) : NaN);
const at = (t: number) => { try { return formatTime(t); } catch { return ''; } };
function props(kind: LiveKind, ctx: LiveCtx, p: Partial<LiveProps> & Pick<LiveProps, 'title' | 'state' | 'from'>): LiveProps {
  return { k: kind, who: '', sub: '', short: '', end: 0, pause: 0, sens: false, logo: ctx.logo, l: { stale: tr('lv.stale'), done: tr('lv.relay.done') }, ...p };
}
const nameOf = (child: { first_name?: string | null } | null | undefined, ctx: LiveCtx) => (ctx.discreet ? '' : child?.first_name?.trim() || '');

// ---------------------------------------------------------------- Allaitement
export function breastLive(feed: (FeedLike & { id?: string; client_id?: string | null }) | null | undefined, child: { id: string; first_name?: string | null }, ctx: LiveCtx): LiveSession | null {
  if (!feed || !isOngoing(feed, ctx.now)) return null;
  const from = ms(feed.started_at);
  if (!Number.isFinite(from)) return null;
  const side = currentSide(feed, ctx.now);
  return {
    kind: 'breast', key: `breast:${feed.id ?? feed.client_id ?? feed.started_at}`, scope: child.id,
    url: ctx.url(`/track/breastfeed?child=${child.id}`), staleAt: from + OPEN_FEED_MAX_MIN * MIN,
    props: props('breast', ctx, {
      title: tr('lv.breast.title'), who: nameOf(child, ctx), from,
      state: side ? tr(side === 'left' ? 'lv.breast.left' : 'lv.breast.right') : tr('lv.breast.ongoing'),
      short: side ? tr(side === 'left' ? 'lv.short.left' : 'lv.short.right') : '',
      sub: tr('lv.startedAt', { time: at(from) }),
    }),
  };
}

// ---------------------------------------------------------------- Biberon en cours (pauses comprises)
export interface RunningBottleLike { id: string; started_at: string; paused_at: string | null; paused_seconds: number | null; ended_at?: string | null; prepared_ml: number | null }
export function bottleLive(b: RunningBottleLike | null | undefined, child: { id: string; first_name?: string | null }, ctx: LiveCtx): LiveSession | null {
  if (!b || b.ended_at) return null;
  const start = ms(b.started_at);
  const t = ctx.now.getTime();
  if (!Number.isFinite(start) || start > t + MIN || t - start > BOTTLE_OPEN_MAX_MS) return null;
  // Chrono = temps réellement passé à boire : début décalé des pauses terminées ; en pause, figé à l'heure de la pause
  const from = start + Math.max(0, b.paused_seconds ?? 0) * 1000;
  const pause = b.paused_at ? Math.max(from, ms(b.paused_at)) : 0;
  return {
    kind: 'bottle', key: `bottle:${b.id}`, scope: child.id, url: ctx.url(`/bottle/${child.id}`), staleAt: start + BOTTLE_OPEN_MAX_MS,
    props: props('bottle', ctx, {
      title: tr('lv.bottle.title'), who: nameOf(child, ctx), from, pause: Number.isFinite(pause) ? pause : 0,
      state: tr(b.paused_at ? 'lv.bottle.paused' : 'lv.bottle.running'),
      sub: b.prepared_ml ? tr('lv.bottle.prepared', { ml: b.prepared_ml }) : tr('lv.startedAt', { time: at(start) }),
    }),
  };
}

// ---------------------------------------------------------------- Sieste / nuit
export interface SleepLike { id?: string; client_id?: string | null; started_at: string; ended_at: string | null; kind?: 'nap' | 'night' | null }
export function sleepLive(sleeps: readonly SleepLike[] | null | undefined, child: { id: string; first_name?: string | null }, ctx: LiveCtx): LiveSession | null {
  const t = ctx.now.getTime();
  const open = (sleeps ?? []).filter((s) => !s.ended_at && Number.isFinite(ms(s.started_at)) && ms(s.started_at) <= t + MIN && t - ms(s.started_at) < SLEEP_OPEN_MAX_MS)
    .sort((a, b) => ms(b.started_at) - ms(a.started_at))[0];
  if (!open) return null;
  const from = ms(open.started_at);
  return {
    kind: 'sleep', key: `sleep:${open.id ?? open.client_id ?? open.started_at}`, scope: child.id, url: ctx.url(`/sleep/${child.id}`), staleAt: from + SLEEP_OPEN_MAX_MS,
    props: props('sleep', ctx, {
      title: tr(open.kind === 'night' ? 'lv.sleep.night' : 'lv.sleep.nap'), who: nameOf(child, ctx), from,
      state: tr('lv.sleep.asleep'), sub: tr('lv.sleep.since', { time: at(from) }),
    }),
  };
}

// ---------------------------------------------------------------- Contractions (séance en cours)
export function contractionsLive(list: readonly Contraction[] | null | undefined, ctx: LiveCtx): LiveSession | null {
  const all = [...(list ?? [])].filter((c) => Number.isFinite(ms(c.started_at)));
  if (!all.length) return null;
  const t = ctx.now.getTime();
  const open = running(all);
  const live = open && t - ms(open.started_at) < CONTRACTION_OPEN_MAX_MS && ms(open.started_at) <= t + MIN ? open : null;
  const latest = [...all].sort((a, b) => b.started_at.localeCompare(a.started_at))[0];
  const lastEnded = all.filter((c) => c.ended_at).sort((a, b) => (b.ended_at as string).localeCompare(a.ended_at as string))[0] ?? null;
  const ref = live ?? (latest.ended_at ? latest : lastEnded);
  if (!ref) return null;
  if (!live && (!ref.ended_at || t - ms(ref.ended_at) > CONTRACTION_IDLE_MS)) return null;
  const session = timed(all.filter((c) => c.session_id === ref.session_id));
  const lastInterval = [...session].reverse().find((c) => c.intervalSec != null)?.intervalSec ?? null;
  const d = ctx.detailed;
  const from = ms(ref.started_at);
  return {
    kind: 'contractions', key: `contractions:${ref.session_id}`, scope: 'me', url: ctx.url('/pregnancy/contractions'),
    staleAt: live ? from + CONTRACTION_OPEN_MAX_MS : ms(ref.ended_at) + CONTRACTION_IDLE_MS,
    props: props('contractions', ctx, {
      title: tr(d ? 'lv.ctr.title' : 'lv.ctr.titleD'), from, sens: true,
      state: tr(live ? (d ? 'lv.ctr.running' : 'lv.ctr.runningD') : (d ? 'lv.ctr.since' : 'lv.ctr.sinceD')),
      sub: lastInterval != null ? tr(d ? 'lv.ctr.interval' : 'lv.ctr.intervalD', { d: fmtSec(lastInterval) }) : '',
    }),
  };
}

// ---------------------------------------------------------------- Tire-lait (chrono lancé par le parent, sur cet appareil)
export interface PumpRun { childId: string; since: number }
export function pumpLive(run: PumpRun | null | undefined, child: { id: string; first_name?: string | null } | null, ctx: LiveCtx): LiveSession | null {
  if (!run || !child || run.childId !== child.id) return null;
  const t = ctx.now.getTime();
  if (!Number.isFinite(run.since) || run.since > t + MIN || t - run.since > PUMP_OPEN_MAX_MS) return null;
  return {
    kind: 'pump', key: `pump:${run.since}`, scope: 'device', url: ctx.url(`/track/pumping?child=${child.id}`), staleAt: run.since + PUMP_OPEN_MAX_MS,
    props: props('pump', ctx, { title: tr('lv.pump.title'), from: run.since, state: tr('lv.pump.running'), sub: tr('lv.startedAt', { time: at(run.since) }) }),
  };
}

// ---------------------------------------------------------------- Relais de nuit (care_shifts)
export interface ShiftLike { id: string; kind: string; user_id: string; starts_at: string; ends_at: string }
export function relayLive(shifts: readonly ShiftLike[] | null | undefined, who: (userId: string) => { isMe: boolean; name: string }, ctx: LiveCtx): LiveSession | null {
  const t = ctx.now.getTime();
  const cur = (shifts ?? []).filter((s) => s.kind === 'night' && ms(s.starts_at) <= t && ms(s.ends_at) > t)
    .sort((a, b) => ms(b.starts_at) - ms(a.starts_at))[0];
  if (!cur) return null;
  const p = who(cur.user_id);
  const from = ms(cur.starts_at); const end = ms(cur.ends_at);
  const state = p.isMe ? tr('lv.relay.me') : ctx.discreet || !p.name ? tr('lv.relay.otherD') : tr('lv.relay.other', { name: p.name });
  return {
    kind: 'relay', key: `relay:${cur.id}`, scope: 'household', url: ctx.url('/family/nights'), staleAt: end,
    props: props('relay', ctx, { title: tr('lv.relay.title'), from, end, state, sub: tr('lv.relay.until', { time: at(end) }) }),
  };
}

// ---------------------------------------------------------------- Décisions
/** Activité affichée par iOS, avec ce que l'app en sait (clé et contenu envoyés), si elle l'a lancée. */
export interface Tracked { id: string; kind: LiveKind; key: string | null; scope: string | null; sig: string | null }
export interface LivePlan {
  start: LiveSession[];
  update: { id: string; session: LiveSession }[];
  /** Activités à garder telles quelles mais à rattacher à une session (orphelines adoptées comprises). */
  keep: { id: string; session: LiveSession }[];
  end: string[];
}
/** Signature du contenu envoyé : une mise à jour seulement si elle change. */
export const sigOf = (s: LiveSession) => JSON.stringify([s.props, s.staleAt, s.url]);

/**
 * @param ready périmètres dont les données sont chargées, sous la forme `type:périmètre` (ex. « sleep:<enfant> »)
 * @param dismissed sessions (`clé`) dont l'activité a été fermée par le parent : jamais relancées
 */
export function planLive(desired: readonly LiveSession[], current: readonly Tracked[], opts: { enabled: boolean; ready: ReadonlySet<string>; dismissed: ReadonlySet<string> }): LivePlan {
  const out: LivePlan = { start: [], update: [], keep: [], end: [] };
  if (!opts.enabled) { out.end = current.map((c) => c.id); return out; }
  const want = new Map<string, LiveSession>();
  for (const s of desired) if (!want.has(s.key)) want.set(s.key, s);
  const matched = new Set<string>();
  const kindReady = (k: LiveKind) => [...opts.ready].some((r) => r.startsWith(`${k}:`));
  // 1) activités connues : gardées (mises à jour si le contenu change) ou terminées si leur session est finie
  for (const c of current.filter((x) => x.key)) {
    const s = want.get(c.key as string);
    if (s && !matched.has(s.key)) {
      matched.add(s.key);
      if (c.sig !== sigOf(s)) out.update.push({ id: c.id, session: s }); else out.keep.push({ id: c.id, session: s });
    } else if (s || opts.ready.has(`${c.kind}:${c.scope}`) || (c.scope == null && kindReady(c.kind))) {
      out.end.push(c.id); // doublon de la même session, ou session terminée (ailleurs aussi : coparent)
    }
  }
  // 2) activités inconnues (mémoire effacée) : adoptées par une session du même type, sinon terminées
  for (const c of current.filter((x) => !x.key)) {
    const s = [...want.values()].find((w) => w.kind === c.kind && !matched.has(w.key));
    if (s) { matched.add(s.key); out.update.push({ id: c.id, session: s }); }
    else if (kindReady(c.kind)) out.end.push(c.id);
  }
  // 3) sessions sans activité : démarrées (sauf fermées par le parent)
  for (const s of want.values()) if (!matched.has(s.key) && !opts.dismissed.has(s.key)) out.start.push(s);
  return out;
}

/** Sessions dont l'activité a disparu alors que la session continue : fermée par le parent (ou par iOS après 8 h). */
export function detectDismissed(remembered: readonly { id: string; key: string }[], liveIds: ReadonlySet<string>, desiredKeys: ReadonlySet<string>): string[] {
  return remembered.filter((r) => !liveIds.has(r.id) && desiredKeys.has(r.key)).map((r) => r.key);
}
