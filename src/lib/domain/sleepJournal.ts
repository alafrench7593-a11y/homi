/**
 * Historique et journal du sommeil d'UN enfant (logique pure, testée).
 *  · chronomètre : le sommeil en cours se lit dans les horodatages enregistrés (survit à la fermeture de l'app) ;
 *  · nuits et siestes séparées ; historique des nuits avec réveils datés et repas notés sur la même chronologie ;
 *  · barres 7 / 14 / 30 jours (minutes de nuit et de siestes par jour) ;
 *  · journal daté des difficultés et des changements de routine ;
 *  · résumé texte (et version imprimable) à montrer au pédiatre.
 * Uniquement des constats tirés de ce que le parent a noté : aucune note de sommeil, aucune comparaison à une norme,
 * aucune conclusion sur un lien entre repas et sommeil, aucun diagnostic.
 */
import { formatDate, t as tx, type TKey } from '@/i18n';
import { DIFFICULTIES, DIFFICULTY_LABEL, clock, ownSleeps, sleepKind, sleptMinutes, span, wakingsOf, weekView, type Difficulty, type SleepRecord } from './sleepPlanner';

const MIN = 60_000;
const ms = (iso: string) => Date.parse(iso);

export type SleepRange = 7 | 14 | 30;
export const SLEEP_RANGES: SleepRange[] = [7, 14, 30];

// ─── Chronomètre ───────────────────────────────────────────────────────────────────────────────────

export interface RunningSleep {
  id?: string;
  kind: 'nap' | 'night';
  startedAt: number;
  /** Minutes depuis l'endormissement noté */
  elapsedMinutes: number;
  /** Minutes réellement dormies (réveils nocturnes chronométrés déduits) */
  sleptMinutes: number;
  /** Réveil nocturne en cours (début), sinon null */
  wakingSince: number | null;
  /** Sommeils ouverts en trop pour cet enfant (normalement 0 : un seul enregistrement par session) */
  extraOpen: number;
}

/**
 * Sommeil en cours de CET enfant, recalculé à partir des horodatages enregistrés : rien n'est gardé en mémoire,
 * l'affichage reste juste après une fermeture de l'application ou un changement d'appareil.
 */
export function runningSleep(sleeps: SleepRecord[], childId: string, now = new Date()): RunningSleep | null {
  const N = now.getTime();
  const open = ownSleeps(sleeps, childId).filter((s) => !s.ended_at && ms(s.started_at) <= N + MIN);
  const cur = open[open.length - 1];
  if (!cur) return null;
  const last = cur.wake_events?.[cur.wake_events.length - 1];
  const waking = sleepKind(cur) === 'night' && last?.open && !last.back_at ? ms(last.at) : null;
  return {
    id: cur.id,
    kind: sleepKind(cur),
    startedAt: ms(cur.started_at),
    elapsedMinutes: Math.max(0, Math.floor((N - ms(cur.started_at)) / MIN)),
    sleptMinutes: sleptMinutes(cur, N),
    wakingSince: waking,
    extraOpen: open.length - 1,
  };
}

/** Chronomètre lisible « h:mm:ss » (ou « m:ss ») depuis un horodatage. */
export function stopwatch(startedAt: number, now = Date.now()): string {
  const s = Math.max(0, Math.floor((now - startedAt) / 1000));
  const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const sec = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
}

// ─── Nuits et siestes ──────────────────────────────────────────────────────────────────────────────

/** Siestes et nuits de CET enfant, séparées, de la plus récente à la plus ancienne. */
export function splitSleeps(sleeps: SleepRecord[], childId: string): { naps: SleepRecord[]; nights: SleepRecord[] } {
  const own = ownSleeps(sleeps, childId).reverse();
  return { naps: own.filter((s) => sleepKind(s) === 'nap'), nights: own.filter((s) => sleepKind(s) === 'night') };
}

export type FeedKind = 'bottle' | 'breastfeed' | 'meal';
export interface FeedEvent { at: string; kind: FeedKind; child_id?: string | null }

export type NightEventType = 'asleep' | 'waking' | 'back' | 'wake' | 'feed';
export interface NightEvent { at: number; type: NightEventType; feedKind?: FeedKind; minutes?: number | null }

export interface NightEntry {
  id?: string;
  start: number;
  end: number | null;
  ongoing: boolean;
  sleptMinutes: number;
  /** Du coucher au réveil du matin (ou à maintenant) */
  inBedMinutes: number;
  /** Réveils datés (heure, rendormi, durée) */
  wakings: { at: number; back: number | null; minutes: number | null }[];
  /** Réveils comptés sans heure (saisie « après coup ») */
  untimedWakings: number;
  /** Repas notés pendant la nuit (affichés pour information, sans conclusion) */
  feeds: { at: number; kind: FeedKind }[];
  /** Chronologie complète, dans l'ordre */
  events: NightEvent[];
  note: string | null;
}

export interface SleepItem {
  id?: string; kind: 'nap' | 'night'; start: number; end: number | null; ongoing: boolean; sleptMinutes: number; note: string | null;
}

/** Nuits commencées dans les `days` derniers jours, de la plus récente à la plus ancienne. */
export function nightHistory(sleeps: SleepRecord[], childId: string, feeds: FeedEvent[], now = new Date(), days: number = 30): NightEntry[] {
  const N = now.getTime();
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days + 1).getTime() - 12 * 60 * MIN;
  const own = splitSleeps(sleeps, childId).nights.filter((s) => ms(s.started_at) >= from && ms(s.started_at) <= N);
  const mine = feeds.filter((f) => f.child_id == null || f.child_id === childId);
  return own.map((s) => {
    const start = ms(s.started_at);
    const end = s.ended_at ? ms(s.ended_at) : null;
    const stop = end ?? N;
    const wakings = (s.wake_events ?? [])
      .filter((w) => !Number.isNaN(ms(w.at)))
      .map((w) => {
        const back = w.back_at ? ms(w.back_at) : w.minutes != null ? ms(w.at) + w.minutes * MIN : null;
        return { at: ms(w.at), back, minutes: back !== null ? Math.max(0, Math.round((back - ms(w.at)) / MIN)) : null };
      })
      .sort((a, b) => a.at - b.at);
    const nightFeeds = mine.map((f) => ({ at: ms(f.at), kind: f.kind })).filter((f) => !Number.isNaN(f.at) && f.at >= start && f.at <= stop).sort((a, b) => a.at - b.at);
    const events: NightEvent[] = [{ at: start, type: 'asleep' }];
    for (const w of wakings) {
      events.push({ at: w.at, type: 'waking', minutes: w.minutes });
      if (w.back !== null) events.push({ at: w.back, type: 'back' });
    }
    for (const f of nightFeeds) events.push({ at: f.at, type: 'feed', feedKind: f.kind });
    if (end !== null) events.push({ at: end, type: 'wake' });
    // À heure égale : l'ordre de la nuit (couché, réveil, repas, rendormi, réveil du matin)
    const order: Record<NightEventType, number> = { asleep: 0, waking: 1, feed: 2, back: 3, wake: 4 };
    events.sort((a, b) => a.at - b.at || order[a.type] - order[b.type]);
    return {
      id: s.id, start, end, ongoing: end === null,
      sleptMinutes: sleptMinutes(s, N),
      inBedMinutes: Math.max(0, Math.round((stop - start) / MIN)),
      wakings, untimedWakings: Math.max(0, wakingsOf(s) - wakings.length),
      feeds: nightFeeds, events, note: (s as { note?: string | null }).note ?? null,
    };
  });
}

/** Siestes commencées dans les `days` derniers jours, de la plus récente à la plus ancienne. */
export function napHistory(sleeps: SleepRecord[], childId: string, now = new Date(), days: number = 30): SleepItem[] {
  const N = now.getTime();
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days + 1).getTime();
  return splitSleeps(sleeps, childId).naps
    .filter((s) => ms(s.started_at) >= from && ms(s.started_at) <= N)
    .map((s) => ({ id: s.id, kind: 'nap' as const, start: ms(s.started_at), end: s.ended_at ? ms(s.ended_at) : null, ongoing: !s.ended_at, sleptMinutes: sleptMinutes(s, N), note: (s as { note?: string | null }).note ?? null }));
}

// ─── Barres 7 / 14 / 30 jours ──────────────────────────────────────────────────────────────────────

export interface DayBar { date: string; napMinutes: number; nightMinutes: number; totalMinutes: number; naps: number; wakings: number; hasData: boolean }

/** Une barre par jour (du plus ancien à aujourd'hui) : nuit commencée ce soir-là + siestes du jour. */
export function sleepBars(sleeps: SleepRecord[], childId: string, now = new Date(), days: SleepRange = 7): DayBar[] {
  return weekView(sleeps, childId, now, days).map((d) => ({
    date: d.date, napMinutes: d.napMinutes, nightMinutes: d.nightMinutes, totalMinutes: d.napMinutes + d.nightMinutes,
    naps: d.naps, wakings: d.wakings, hasData: d.naps > 0 || d.nightMinutes > 0,
  }));
}

export interface RangeSummary { daysWithData: number; avgTotal: number | null; avgNight: number | null; avgNap: number | null; avgWakings: number | null }

/** Moyennes sur les seuls jours notés (un jour sans saisie n'est jamais compté comme « zéro »). Aucune note. */
export function rangeSummary(bars: DayBar[]): RangeSummary {
  const days = bars.filter((b) => b.hasData);
  const nights = days.filter((b) => b.nightMinutes > 0);
  const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);
  const avg1 = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);
  return {
    daysWithData: days.length,
    avgTotal: avg(days.map((b) => b.totalMinutes)),
    avgNight: avg(nights.map((b) => b.nightMinutes)),
    avgNap: avg(days.map((b) => b.napMinutes)),
    avgWakings: avg1(nights.map((b) => b.wakings)),
  };
}

// ─── Journal : difficultés et changements de routine ──────────────────────────────────────────────

export type SleepNoteKind = 'difficulty' | 'routine_change';
export type SleepNoteTag = Difficulty | 'other';
export const NOTE_TAGS: SleepNoteTag[] = [...DIFFICULTIES, 'other'];
export interface SleepNote { id: string; child_id: string; household_id: string; kind: SleepNoteKind; noted_at: string; tags: SleepNoteTag[]; note: string | null }
export interface SleepNoteDraft { kind: SleepNoteKind; tags: SleepNoteTag[]; note: string; notedAt: Date }

/** Mêmes règles que la table sleep_notes : jamais vide, 1 000 caractères au plus, jamais dans le futur. */
export function validateNote(d: SleepNoteDraft, now = new Date()): 'empty' | 'tooLong' | 'future' | 'badTag' | null {
  if (d.tags.some((t) => !NOTE_TAGS.includes(t))) return 'badTag';
  if (!d.tags.length && !d.note.trim()) return 'empty';
  if (d.note.length > 1000) return 'tooLong';
  if (d.notedAt.getTime() > now.getTime() + 5 * MIN) return 'future';
  return null;
}

/** Notes de CET enfant dans la période, de la plus récente à la plus ancienne. */
export function notesInRange(notes: SleepNote[], childId: string, now = new Date(), days: number = 30): SleepNote[] {
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days + 1).getTime();
  return notes.filter((n) => n.child_id === childId && ms(n.noted_at) >= from && ms(n.noted_at) <= now.getTime() + 5 * MIN)
    .sort((a, b) => b.noted_at.localeCompare(a.noted_at));
}

export const tagLabel = (t: SleepNoteTag) => (t === 'other' ? tx('sj.tag.other') : DIFFICULTY_LABEL[t]);

// ─── Résumé pour le pédiatre ───────────────────────────────────────────────────────────────────────

export interface SummaryInput {
  name: string; ageLabel: string; childId: string; sleeps: SleepRecord[]; feeds: FeedEvent[]; notes: SleepNote[];
  now?: Date; days: SleepRange; question?: string;
}

const dayLabel = (n: number) => formatDate(new Date(n), { weekday: 'short', day: 'numeric', month: 'short' });

/** Texte simple, uniquement ce qui a été noté ; rien n'est envoyé automatiquement. */
export function pediatricSummary(i: SummaryInput): string {
  const now = i.now ?? new Date();
  const bars = sleepBars(i.sleeps, i.childId, now, i.days);
  const sum = rangeSummary(bars);
  const nights = nightHistory(i.sleeps, i.childId, i.feeds, now, i.days);
  const naps = napHistory(i.sleeps, i.childId, now, i.days);
  const notes = notesInRange(i.notes, i.childId, now, i.days);
  const L: string[] = [
    tx('sj.sum.title', { name: i.name, age: i.ageLabel }),
    tx('sj.sum.period', { days: i.days, date: formatDate(now, { day: 'numeric', month: 'numeric', year: 'numeric' }) }),
    tx('sj.sum.only'),
    '',
  ];
  if (!sum.daysWithData) L.push(tx('sj.sum.none'));
  else {
    L.push(tx('sj.sum.daysNoted', { n: sum.daysWithData, days: i.days }));
    if (sum.avgNight !== null) L.push(tx('sj.sum.avgNight', { span: span(sum.avgNight) }));
    if (sum.avgNap !== null) L.push(tx('sj.sum.avgNap', { span: span(sum.avgNap) }));
    if (sum.avgWakings !== null) L.push(tx('sj.sum.avgWakings', { n: String(sum.avgWakings).replace('.', tx('sj.decimal')) }));
    L.push(tx('sj.sum.napsCount', { n: naps.length }));
  }
  if (nights.length) {
    L.push('', tx('sj.sum.nights'));
    for (const n of nights) {
      const wk = n.wakings.map((w) => (w.minutes !== null ? tx('sj.sum.wakeAtFor', { time: clock(w.at), span: span(w.minutes) }) : tx('sj.sum.wakeAt', { time: clock(w.at) })));
      if (n.untimedWakings) wk.push(tx('sj.sum.untimed', { count: n.untimedWakings }));
      const feeds = n.feeds.map((f) => tx('sj.sum.feedAt', { kind: tx(`sj.feed.${f.kind}` as TKey), time: clock(f.at) }));
      L.push(`• ${tx('sj.sum.nightLine', {
        day: dayLabel(n.start), from: clock(n.start), to: n.end !== null ? clock(n.end) : tx('sj.ongoing'), slept: span(n.sleptMinutes),
        wakings: wk.length ? wk.join(', ') : tx('sj.sum.noWaking'),
      })}${feeds.length ? ` ${tx('sj.sum.feedsNoted', { list: feeds.join(', ') })}` : ''}`);
      if (n.note) L.push(`  ${tx('sj.sum.noteLine', { note: n.note })}`);
    }
  }
  const diffs = notes.filter((n) => n.kind === 'difficulty');
  const changes = notes.filter((n) => n.kind === 'routine_change');
  if (diffs.length) {
    L.push('', tx('sj.sum.diffs'));
    for (const n of diffs) L.push(`• ${tx('sj.sum.item', { day: dayLabel(ms(n.noted_at)), text: [...n.tags.map(tagLabel), n.note?.trim()].filter(Boolean).join(' — ') })}`);
  }
  if (changes.length) {
    L.push('', tx('sj.sum.changes'));
    for (const n of changes) L.push(`• ${tx('sj.sum.item', { day: dayLabel(ms(n.noted_at)), text: n.note?.trim() ?? '' })}`);
  }
  if (i.question?.trim()) L.push('', tx('sj.sum.question', { q: i.question.trim() }));
  L.push('', tx('sj.sum.footer'));
  return L.join('\n');
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Même résumé en page HTML autonome, prête à imprimer (aucune ressource externe). */
export function summaryHtml(text: string, lang: string): string {
  const [title, ...rest] = text.split('\n');
  return `<!doctype html><html lang="${esc(lang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>`
    + '<style>body{font:15px/1.5 system-ui,sans-serif;color:#222;max-width:42rem;margin:2rem auto;padding:0 1rem}h1{font-size:1.3rem}p{margin:.15rem 0;white-space:pre-wrap}@media print{body{margin:0}}</style>'
    + `</head><body><h1>${esc(title)}</h1>${rest.map((l) => (l ? `<p>${esc(l)}</p>` : '<p>&nbsp;</p>')).join('')}</body></html>`;
}

