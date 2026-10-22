/**
 * Cartes de suivi (logique pure, testée) : quelles actions montrer en priorité selon le profil affiché,
 * et la phrase « dernière information » de chaque carte.
 *  · Grossesse : sommeil de la mère, humeur, repas, rendez-vous (poids facultatif dans « Voir tous les suivis »).
 *    Jamais de biberon, de tétée ni de couche.
 *  · Nouveau-né : biberon, tétée, couche, sommeil.
 *  · Bébé en diversification : repas, sommeil, biberon, couche.
 *  · Enfant plus grand : repas, sommeil, médicaments prescrits, rendez-vous.
 */
import { formatDate, t as tr, type TKey } from '@/i18n';
import { BOTTLE_MAX_MONTHS } from './bottleTimer';

export type TrackKey =
  | 'bottle' | 'breastfeed' | 'diaper' | 'sleep' | 'meal' | 'pumping' | 'observation' | 'growth'
  | 'medication' | 'appointment' | 'mother_sleep' | 'mood' | 'weight';
export type TrackProfile = 'pregnancy' | 'newborn' | 'diversification' | 'child';

const TRACK_KEYS: TrackKey[] = [
  'bottle', 'breastfeed', 'diaper', 'sleep', 'meal', 'pumping', 'observation', 'growth',
  'medication', 'appointment', 'mother_sleep', 'mood', 'weight',
];
/** Libellés des cartes, traduits à la lecture (langue courante). */
export const TRACK_LABEL: Record<TrackKey, string> = {} as Record<TrackKey, string>;
for (const k of TRACK_KEYS) {
  Object.defineProperty(TRACK_LABEL, k, { enumerable: true, get: () => tr(`dom.track.label.${k}` as TKey) });
}

/** Ces suivis n'ont aucun sens pendant une grossesse : jamais proposés dans ce profil. */
export const NEVER_IN_PREGNANCY: TrackKey[] = ['bottle', 'breastfeed', 'diaper', 'pumping'];

/** Profil de suivi d'un enfant d'après son âge, le parcours et les suivis activés. */
export function childTrackProfile(ageMonths: number, opts: { journey?: 'baby' | 'child' | null; mealsEnabled: boolean }): TrackProfile {
  if (opts.journey === 'child' || ageMonths >= 24) return 'child';
  if (ageMonths >= 4 && opts.mealsEnabled) return 'diversification';
  return 'newborn';
}

const ORDER: Record<TrackProfile, { primary: TrackKey[]; more: TrackKey[] }> = {
  pregnancy: { primary: ['mother_sleep', 'mood', 'meal', 'appointment'], more: ['weight'] },
  newborn: { primary: ['bottle', 'breastfeed', 'diaper', 'sleep'], more: ['pumping', 'observation', 'growth', 'meal', 'appointment', 'medication'] },
  diversification: { primary: ['meal', 'sleep', 'bottle', 'diaper'], more: ['breastfeed', 'pumping', 'observation', 'growth', 'appointment', 'medication'] },
  child: { primary: ['meal', 'sleep', 'medication', 'appointment'], more: ['observation', 'growth', 'diaper', 'bottle'] },
};

/** Suivi activé pour l'enfant (les clés de enabled_tracking) — les autres cartes ne sont pas proposées. */
const TRACKING_OF: Partial<Record<TrackKey, string>> = { bottle: 'bottle', breastfeed: 'breastfeed', pumping: 'breastfeed', diaper: 'diaper', sleep: 'sleep', meal: 'meal' };

export interface TrackContext {
  profile: TrackProfile;
  /** enabled_tracking de l'enfant (ignoré pour la grossesse) */
  enabled?: readonly string[];
  ageMonths?: number;
  hideWeight?: boolean;
}

/** 4 actions prioritaires, les autres dans « Voir tous les suivis ». */
export function trackActions(ctx: TrackContext): { primary: TrackKey[]; more: TrackKey[] } {
  const base = ORDER[ctx.profile];
  const allowed = (k: TrackKey) => {
    if (ctx.profile === 'pregnancy') return !NEVER_IN_PREGNANCY.includes(k) && !(k === 'weight' && ctx.hideWeight);
    if (['mother_sleep', 'mood', 'weight'].includes(k)) return false;
    if (k === 'bottle' && (ctx.ageMonths ?? 0) >= BOTTLE_MAX_MONTHS) return false;
    const tracking = TRACKING_OF[k];
    return !tracking || !ctx.enabled || ctx.enabled.includes(tracking);
  };
  const all = [...base.primary, ...base.more].filter(allowed);
  return { primary: all.slice(0, 4), more: all.slice(4) };
}

// ─── « Dernière information » ──────────────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, '0');
export const hm = (d: Date) => (d.getMinutes()
  ? tr('dom.time.hm', { h: String(d.getHours()), m: pad(d.getMinutes()) })
  : tr('dom.time.h', { h: String(d.getHours()) }));
/** « 18 oct. » dans la langue courante */
const shortDate = (d: Date, weekday = false) => formatDate(d, weekday ? { weekday: 'short', day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short' });
/** « à 13 h 10 », « hier à 22 h 05 », « le 18 oct. à 9 h » */
export function whenLabel(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(now) - day(d)) / 86_400_000);
  if (diff === 0) return tr('dom.time.at', { time: hm(d) });
  if (diff === 1) return tr('dom.time.yesterdayAt', { time: hm(d) });
  return tr('dom.time.onDateAt', { date: shortDate(d), time: hm(d) });
}
export function span(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return tr('dom.span.min', { m: String(m) });
  const h = Math.floor(m / 60); const r = m % 60;
  return r ? tr('dom.span.hm', { h: String(h), m: pad(r) }) : tr('dom.span.h', { h: String(h) });
}

export interface LastData {
  bottle?: { at: string; consumed_ml: number | null; prepared_ml: number | null } | null;
  breastfeed?: { started_at: string; ended_at: string | null; side: 'left' | 'right' | 'both' } | null;
  diaper?: { at: string } | null;
  sleep?: { started_at: string; ended_at: string | null } | null;
  meal?: { at: string } | null;
  pumping?: { at: string; amount_ml: number } | null;
  observation?: { at: string } | null;
  growth?: { measured_on: string } | null;
  medication?: { name: string; nextAt: string | null } | null;
  appointment?: { starts_at: string; title: string } | null;
  mother_sleep?: { log_date: string; sleep_minutes: number | null } | null;
  mood?: { checked_at: string } | null;
  weight?: { measured_on: string } | null;
}

const side = (s: 'left' | 'right' | 'both') => tr(`dom.track.side.${s}` as TKey);
const agreed = <T>(sex: string | null | undefined, m: T, f: T, n: T) => (sex === 'female' ? f : sex === 'male' ? m : n);
const measured = (iso: string) => tr('dom.track.measure.last', { date: shortDate(new Date(`${iso}T12:00:00`)) });

/** Phrase courte et utile pour chaque carte (jamais de jugement, jamais de norme). */
export function lastInfo(key: TrackKey, data: LastData, ctx: { name?: string; sex?: string | null; now?: Date } = {}): string {
  const now = ctx.now ?? new Date();
  const name = ctx.name ?? tr('dom.track.yourChild');
  const when = (iso: string) => whenLabel(iso, now);
  const since = (iso: string) => span((now.getTime() - Date.parse(iso)) / 60_000);
  switch (key) {
    case 'bottle': {
      const b = data.bottle; if (!b) return tr('dom.track.bottle.none');
      const ml = b.consumed_ml ?? b.prepared_ml;
      return ml != null ? tr('dom.track.bottle.lastMl', { when: when(b.at), ml: String(ml) }) : tr('dom.track.bottle.last', { when: when(b.at) });
    }
    case 'breastfeed': {
      const f = data.breastfeed; if (!f) return tr('dom.track.breastfeed.none');
      if (!f.ended_at) return tr('dom.track.breastfeed.ongoing', { side: side(f.side), duration: since(f.started_at) });
      return tr('dom.track.breastfeed.last', { side: side(f.side), duration: span((Date.parse(f.ended_at) - Date.parse(f.started_at)) / 60_000) });
    }
    case 'diaper': return data.diaper ? tr('dom.track.diaper.last', { when: when(data.diaper.at) }) : tr('dom.track.diaper.none');
    case 'sleep': {
      const s = data.sleep; if (!s) return tr('dom.track.sleep.none');
      if (!s.ended_at) return tr('dom.track.sleep.ongoing', { name, duration: since(s.started_at) });
      return tr(agreed<TKey>(ctx.sex, 'dom.track.sleep.wokeM', 'dom.track.sleep.wokeF', 'dom.track.sleep.wokeN'), { when: when(s.ended_at) });
    }
    case 'meal': return data.meal ? tr('dom.track.meal.last', { when: when(data.meal.at) }) : tr('dom.track.meal.none');
    case 'pumping': return data.pumping ? tr('dom.track.pumping.last', { when: when(data.pumping.at), ml: String(data.pumping.amount_ml) }) : tr('dom.track.pumping.none');
    case 'observation': return data.observation ? tr('dom.track.observation.last', { when: when(data.observation.at) }) : tr('dom.track.observation.none');
    case 'growth': return data.growth ? measured(data.growth.measured_on) : tr('dom.track.growth.none');
    case 'medication': {
      const m = data.medication; if (!m) return tr('dom.track.medication.none');
      return m.nextAt ? tr('dom.track.medication.next', { name: m.name, when: when(m.nextAt) }) : tr('dom.track.medication.asPrescribed', { name: m.name });
    }
    case 'appointment': {
      const a = data.appointment; if (!a) return tr('dom.track.appointment.none');
      const d = new Date(a.starts_at);
      return tr('dom.track.appointment.next', { title: a.title, date: shortDate(d, true), time: hm(d) });
    }
    case 'mother_sleep': {
      const s = data.mother_sleep; if (!s) return tr('dom.track.motherSleep.none');
      return s.sleep_minutes != null ? tr('dom.track.motherSleep.last', { duration: span(s.sleep_minutes) }) : tr('dom.track.motherSleep.noted');
    }
    case 'mood': {
      const m = data.mood; if (!m) return tr('dom.track.mood.none');
      return new Date(m.checked_at).toDateString() === now.toDateString() ? tr('dom.track.mood.today') : tr('dom.track.mood.last', { when: when(m.checked_at) });
    }
    case 'weight': return data.weight ? measured(data.weight.measured_on) : tr('dom.track.weight.none');
  }
}

/** Prochaine prise d'un traitement prescrit (heures recopiées de l'ordonnance), aujourd'hui ou demain. */
export function nextDose(times: readonly string[], now = new Date()): string | null {
  const mins = times.map((t) => { const [h, m] = t.split(':').map(Number); return h * 60 + (m || 0); }).filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!mins.length) return null;
  const cur = now.getHours() * 60 + now.getMinutes();
  const next = mins.find((m) => m > cur);
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (next == null ? 1 : 0), 0, next ?? mins[0]);
  return d.toISOString();
}
