/**
 * « Le cocon du jour » (accueil d'un profil enfant) : logique pure, testée.
 *  · La frise : les VRAIS événements notés aujourd'hui pour CET enfant (sommeil, réveils, biberons, tétées, repas,
 *    couches, médicaments prescrits, rendez-vous, symptômes, notes), jamais ceux d'un autre profil.
 *  · Les trois informations, choisies selon l'âge, sans jamais montrer un suivi désactivé.
 *  · « À retenir aujourd'hui » : UNE seule chose, par ordre d'utilité.
 * Rien n'est inventé : une information sans donnée n'apparaît pas (ou dit simplement qu'il n'y a rien de noté).
 */
import { t as tr, type TKey } from '@/i18n';
import { BOTTLE_MAX_MONTHS } from './bottleTimer';
import { hm, type TrackProfile } from './trackingCards';
import type { Appointment, Bottle, Breastfeed, Diaper, LogKind, Meal, Observation, Sleep } from '@/lib/types';

export type RibbonKind = 'sleep' | 'wake' | 'bottle' | 'breastfeed' | 'meal' | 'diaper' | 'medication' | 'appointment' | 'symptom' | 'note';

export interface RibbonEvent {
  /** Identifiant stable de l'événement dans la frise */
  id: string;
  kind: RibbonKind;
  start: number;
  /** Fin (sommeil, tétée) ; pour un sommeil en cours, « maintenant » */
  end?: number;
  ongoing?: boolean;
  /** Ligne enregistrée correspondante (modifiable / supprimable) */
  table?: LogKind;
  rowId?: string;
  title: string;
  detail?: string;
}

export interface RibbonInput {
  now: Date;
  /** enabled_tracking de l'enfant */
  enabled: readonly string[];
  bottles?: Bottle[] | null;
  feeds?: Breastfeed[] | null;
  diapers?: Diaper[] | null;
  sleeps?: Sleep[] | null;
  meals?: Meal[] | null;
  observations?: Observation[] | null;
  /** Rendez-vous de CET enfant */
  appointments?: Appointment[] | null;
  /** Prises de traitements prescrits marquées « prises » aujourd'hui */
  doses?: { id: string; name: string; at: string }[] | null;
}

const MIN = 60_000;
export const dayBounds = (now: Date) => {
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return { from, to: from + 24 * 3600_000 };
};
const at = (iso: string) => Date.parse(iso);
const on = (enabled: readonly string[], k: string) => enabled.includes(k);
const pad = (n: number) => String(n).padStart(2, '0');
/** Heure lisible, jamais coupée en fin de ligne (« 12 h 08 » reste d'un seul tenant). */
export const clockOf = (ms: number) => hm(new Date(ms)).replace(/ /g, '\u00a0');
export function spanLabel(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  if (!h) return tr('dom.span.min', { m: String(m) });
  return m % 60 ? tr('dom.span.hm', { h: String(h), m: pad(m % 60) }) : tr('dom.span.h', { h: String(h) });
}

const DIGESTIVE: Observation['kind'][] = ['vomit', 'regurgitation', 'diarrhea', 'abdominal_pain', 'bloating', 'crying', 'temperature', 'symptom'];

/** Événements du jour (00 h – 24 h), triés. Les suivis désactivés n'apparaissent pas. */
export function buildRibbon(i: RibbonInput): RibbonEvent[] {
  const { from, to } = dayBounds(i.now);
  const N = i.now.getTime();
  const inDay = (ms: number) => ms >= from && ms < to;
  const out: RibbonEvent[] = [];

  if (on(i.enabled, 'sleep')) {
    for (const s of i.sleeps ?? []) {
      const a = at(s.started_at);
      const b = s.ended_at ? at(s.ended_at) : N;
      if (b <= from || a >= to) continue;
      const night = s.kind === 'night';
      out.push({
        id: `sleep-${s.id}`, kind: 'sleep', start: Math.max(a, from), end: Math.min(b, to), ongoing: !s.ended_at, table: 'sleep', rowId: s.id,
        title: tr(night ? 'coc.ev.night' : s.kind === 'nap' ? 'coc.ev.nap' : 'coc.ev.sleep'),
        detail: s.ended_at
          ? tr('coc.ev.sleepSpan', { from: clockOf(a), to: clockOf(b), span: spanLabel((b - a) / MIN) })
          : tr('coc.ev.sleepOngoing', { from: clockOf(a), span: spanLabel((N - a) / MIN) }),
      });
      if (s.ended_at && inDay(b)) out.push({ id: `wake-${s.id}`, kind: 'wake', start: b, table: 'sleep', rowId: s.id, title: tr('coc.ev.wake'), detail: clockOf(b) });
      for (const [k, w] of (s.wake_events ?? []).entries()) {
        const wa = at(w.at);
        if (inDay(wa) && wa <= N) out.push({ id: `wake-${s.id}-${k}`, kind: 'wake', start: wa, table: 'sleep', rowId: s.id, title: tr('coc.ev.nightWake'), detail: clockOf(wa) });
      }
    }
  }
  if (on(i.enabled, 'bottle')) {
    for (const b of i.bottles ?? []) {
      const a = at(b.at);
      if (!inDay(a)) continue;
      const ml = b.consumed_ml ?? b.prepared_ml;
      out.push({ id: `bottle-${b.id}`, kind: 'bottle', start: a, table: 'bottle', rowId: b.id, title: tr('coc.ev.bottle'), detail: ml != null ? tr('coc.ev.ml', { time: clockOf(a), ml: String(ml) }) : clockOf(a) });
    }
  }
  if (on(i.enabled, 'breastfeed')) {
    for (const f of i.feeds ?? []) {
      const a = at(f.started_at);
      if (!inDay(a)) continue;
      const e = f.ended_at ? at(f.ended_at) : undefined;
      out.push({
        id: `feed-${f.id}`, kind: 'breastfeed', start: a, end: e, table: 'breastfeed', rowId: f.id, title: tr('coc.ev.feed'),
        detail: [clockOf(a), tr(`coc.side.${f.side}` as TKey), e ? spanLabel((e - a) / MIN) : null].filter(Boolean).join(' · '),
      });
    }
  }
  if (on(i.enabled, 'meal')) {
    for (const m of i.meals ?? []) {
      const a = at(m.at);
      if (!inDay(a)) continue;
      out.push({ id: `meal-${m.id}`, kind: 'meal', start: a, table: 'meal', rowId: m.id, title: tr('coc.ev.meal'), detail: [clockOf(a), m.description || (m.foods.length ? m.foods.join(', ') : null)].filter(Boolean).join(' · ') });
    }
  }
  if (on(i.enabled, 'diaper')) {
    for (const d of i.diapers ?? []) {
      const a = at(d.at);
      if (!inDay(a)) continue;
      const what = [d.wet ? tr('coc.ev.wet') : null, d.stool ? tr('coc.ev.stool') : null].filter(Boolean).join(' + ');
      out.push({ id: `diaper-${d.id}`, kind: 'diaper', start: a, table: 'diaper', rowId: d.id, title: tr('coc.ev.diaper'), detail: [clockOf(a), what || null].filter(Boolean).join(' · ') });
    }
  }
  for (const o of i.observations ?? []) {
    const a = at(o.at);
    if (!inDay(a)) continue;
    const kind: RibbonKind = o.kind === 'medication' ? 'medication' : o.kind === 'note' ? 'note' : 'symptom';
    const label = o.kind === 'temperature' && o.value_num != null ? tr('coc.ev.temp', { v: String(o.value_num).replace('.', ',') }) : o.label;
    out.push({
      id: `obs-${o.id}`, kind, start: a, table: 'observation', rowId: o.id,
      title: tr(kind === 'medication' ? 'coc.ev.medication' : kind === 'note' ? 'coc.ev.note' : DIGESTIVE.includes(o.kind) ? `coc.obs.${o.kind}` as TKey : 'coc.ev.symptom'),
      detail: [clockOf(a), label || o.note || null].filter(Boolean).join(' · '),
    });
  }
  for (const d of i.doses ?? []) {
    const a = at(d.at);
    if (!inDay(a)) continue;
    out.push({ id: `dose-${d.id}`, kind: 'medication', start: a, title: tr('coc.ev.medication'), detail: `${clockOf(a)} · ${d.name}` });
  }
  for (const ap of i.appointments ?? []) {
    const a = at(ap.starts_at);
    if (!inDay(a)) continue;
    out.push({ id: `appt-${ap.id}`, kind: 'appointment', start: a, title: ap.title, detail: clockOf(a) });
  }
  return out.sort((x, y) => x.start - y.start || x.id.localeCompare(y.id));
}

/** Plage horaire montrée par défaut : de la première activité (ou 6 h) jusqu'à 22 h au moins, maintenant compris. */
export function ribbonRange(events: RibbonEvent[], now: Date): { from: number; to: number } {
  const { from: d0, to: d1 } = dayBounds(now);
  const H = 3600_000;
  const first = events.length ? Math.min(...events.map((e) => e.start)) : Infinity;
  const startH = Math.max(0, Math.min(6, Math.floor((Math.min(first, now.getTime()) - d0) / H)));
  const lastEnd = events.length ? Math.max(...events.map((e) => e.end ?? e.start)) : 0;
  const endH = Math.min(24, Math.max(22, Math.ceil((Math.max(lastEnd, now.getTime()) - d0) / H) + 1));
  return { from: d0 + startH * H, to: Math.min(d1, d0 + endH * H) };
}

/** Minutes de sommeil depuis minuit, sans compter deux fois des sommeils qui se chevauchent. */
export function sleepMinutesToday(sleeps: { started_at: string; ended_at: string | null }[], now: Date): number {
  const { from } = dayBounds(now);
  const N = now.getTime();
  const spans = sleeps
    .map((s) => [Math.max(at(s.started_at), from), Math.min(s.ended_at ? at(s.ended_at) : N, N)] as [number, number])
    .filter(([a, b]) => b > a)
    .sort((x, y) => x[0] - y[0]);
  let total = 0;
  let cur: [number, number] | null = null;
  for (const sp of spans) {
    if (cur && sp[0] <= cur[1]) cur[1] = Math.max(cur[1], sp[1]);
    else { if (cur) total += cur[1] - cur[0]; cur = [sp[0], sp[1]]; }
  }
  if (cur) total += cur[1] - cur[0];
  return Math.round(total / MIN);
}

// ─── Les trois informations ───────────────────────────────────────────────────────────────────────

export type InfoKey = 'feed' | 'bottle' | 'diaper' | 'meal' | 'sleep' | 'next';

const BY_PROFILE: Record<Exclude<TrackProfile, 'pregnancy'>, InfoKey[]> = {
  newborn: ['feed', 'diaper', 'sleep'],
  diversification: ['meal', 'bottle', 'sleep'],
  child: ['sleep', 'meal', 'next'],
};
const FALLBACK: InfoKey[] = ['next', 'sleep', 'meal', 'feed', 'diaper'];

/** Trois informations adaptées à l'âge ; un suivi désactivé (biberon, couche…) n'est jamais proposé. */
export function infoKeys(profile: TrackProfile, enabled: readonly string[], ageMonths: number): InfoKey[] {
  const allowed = (k: InfoKey) => {
    switch (k) {
      case 'feed': return (on(enabled, 'bottle') && ageMonths < BOTTLE_MAX_MONTHS) || on(enabled, 'breastfeed');
      case 'bottle': return on(enabled, 'bottle') && ageMonths < BOTTLE_MAX_MONTHS;
      case 'diaper': return on(enabled, 'diaper');
      case 'meal': return on(enabled, 'meal');
      case 'sleep': return on(enabled, 'sleep');
      default: return true;
    }
  };
  const base = BY_PROFILE[profile === 'pregnancy' ? 'child' : profile].filter(allowed);
  for (const k of FALLBACK) if (base.length < 3 && !base.includes(k) && allowed(k) && !(k === 'feed' && base.includes('bottle'))) base.push(k);
  return base.slice(0, 3);
}

export interface InfoValue { key: InfoKey; label: string; value: string; sub?: string }

export interface InfoInput {
  now: Date;
  enabled: readonly string[];
  bottles?: Bottle[] | null;
  feeds?: Breastfeed[] | null;
  diapers?: Diaper[] | null;
  meals?: Meal[] | null;
  sleeps?: Sleep[] | null;
  /** Prochain événement connu (rendez-vous, rappel biberon, prise de traitement) */
  next?: { title: string; at: string } | null;
}

const newest = <T,>(rows: T[] | null | undefined, time: (r: T) => string): T | null =>
  (rows ?? []).reduce<T | null>((best, r) => (!best || time(r) > time(best) ? r : best), null);

/** « 14 h 10 », « hier à 22 h 05 », « le 18 oct. » */
function whenShort(iso: string, now: Date): string {
  const d = new Date(iso);
  const { from } = dayBounds(now);
  if (d.getTime() >= from) return clockOf(d.getTime());
  if (d.getTime() >= from - 24 * 3600_000) return tr('coc.info.yesterday', { time: clockOf(d.getTime()) });
  return tr('coc.info.older');
}

export function infoValue(key: InfoKey, i: InfoInput): InfoValue {
  const { now } = i;
  switch (key) {
    case 'feed': {
      const b = on(i.enabled, 'bottle') ? newest(i.bottles, (x) => x.at) : null;
      const f = on(i.enabled, 'breastfeed') ? newest(i.feeds, (x) => x.started_at) : null;
      const useFeed = f && (!b || f.started_at > b.at);
      if (!b && !f) return { key, label: tr('coc.info.feed'), value: '—', sub: tr('coc.info.none') };
      if (useFeed) return { key, label: tr('coc.info.feed'), value: whenShort(f!.started_at, now), sub: tr('coc.ev.feed') };
      const ml = b!.consumed_ml ?? b!.prepared_ml;
      return { key, label: tr('coc.info.feed'), value: whenShort(b!.at, now), sub: ml != null ? tr('coc.info.bottleMl', { ml: String(ml) }) : tr('coc.ev.bottle') };
    }
    case 'bottle': {
      const b = newest(i.bottles, (x) => x.at);
      if (!b) return { key, label: tr('coc.info.bottle'), value: '—', sub: tr('coc.info.none') };
      const ml = b.consumed_ml ?? b.prepared_ml;
      return { key, label: tr('coc.info.bottle'), value: whenShort(b.at, now), sub: ml != null ? `${ml} ml` : undefined };
    }
    case 'diaper': {
      const d = newest(i.diapers, (x) => x.at);
      const today = (i.diapers ?? []).filter((x) => at(x.at) >= dayBounds(now).from).length;
      if (!d) return { key, label: tr('coc.info.diaper'), value: '—', sub: tr('coc.info.none') };
      return { key, label: tr('coc.info.diaper'), value: whenShort(d.at, now), sub: tr('coc.info.diapersToday', { count: today }) };
    }
    case 'meal': {
      const m = newest(i.meals, (x) => x.at);
      if (!m) return { key, label: tr('coc.info.meal'), value: '—', sub: tr('coc.info.none') };
      return { key, label: tr('coc.info.meal'), value: whenShort(m.at, now), sub: m.description || m.foods.slice(0, 2).join(', ') || undefined };
    }
    case 'sleep': {
      const total = sleepMinutesToday(i.sleeps ?? [], now);
      const naps = (i.sleeps ?? []).filter((s) => s.kind === 'nap' && at(s.started_at) >= dayBounds(now).from).length;
      return { key, label: tr('coc.info.sleep'), value: total ? spanLabel(total) : '0 min', sub: naps ? tr('coc.info.naps', { count: naps }) : undefined };
    }
    case 'next':
      return i.next
        ? { key, label: tr('coc.info.next'), value: whenNext(i.next.at, now), sub: i.next.title }
        : { key, label: tr('coc.info.next'), value: '—', sub: tr('coc.info.nothingPlanned') };
  }
}

function whenNext(iso: string, now: Date): string {
  const d = new Date(iso);
  const { to } = dayBounds(now);
  if (d.getTime() < to) return clockOf(d.getTime());
  if (d.getTime() < to + 24 * 3600_000) return tr('coc.info.tomorrow', { time: clockOf(d.getTime()) });
  return tr('coc.info.later');
}

// ─── À retenir aujourd'hui (une seule chose) ──────────────────────────────────────────────────────

export type KeepKind = 'bottle' | 'appointment' | 'nap' | 'treatment' | 'medication' | 'tip' | 'none';
export interface KeepItem { kind: KeepKind; title: string; detail?: string; source?: string }

export interface KeepInput {
  now: Date;
  name: string;
  ageMonths: number;
  bottleReminderAt?: string | null;
  appointments?: Appointment[] | null;
  /** Prochaine sieste estimée (Premium) ; null si non disponible */
  nextNapAt?: number | null;
  treatment?: { name: string; nextAt: string | null } | null;
  observations?: Observation[] | null;
  tips?: readonly string[];
  tipSource?: string;
}

export function keepInMind(i: KeepInput): KeepItem {
  const N = i.now.getTime();
  const { to } = dayBounds(i.now);
  if (i.bottleReminderAt && at(i.bottleReminderAt) > N) {
    return { kind: 'bottle', title: tr('coc.keep.bottle', { time: clockOf(at(i.bottleReminderAt)) }), detail: tr('coc.keep.bottleSub', { name: i.name }) };
  }
  const appt = (i.appointments ?? []).filter((a) => at(a.starts_at) > N && at(a.starts_at) < to).sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0];
  if (appt) return { kind: 'appointment', title: appt.title, detail: tr('coc.keep.apptAt', { time: clockOf(at(appt.starts_at)) }) };
  if (i.nextNapAt && i.nextNapAt > N && i.nextNapAt < to) return { kind: 'nap', title: tr('coc.keep.nap', { time: clockOf(i.nextNapAt) }), detail: tr('coc.keep.napSub') };
  if (i.treatment?.nextAt && at(i.treatment.nextAt) < to) return { kind: 'treatment', title: tr('coc.keep.treatment', { name: i.treatment.name, time: clockOf(at(i.treatment.nextAt)) }), detail: tr('coc.keep.treatmentSub') };
  const med = (i.observations ?? []).filter((o) => o.kind === 'medication' && at(o.at) >= dayBounds(i.now).from && at(o.at) <= N).sort((a, b) => b.at.localeCompare(a.at))[0];
  if (med) return { kind: 'medication', title: tr('coc.keep.medication', { time: clockOf(at(med.at)) }), detail: med.label || med.note || undefined };
  if (i.tips?.length && i.ageMonths < 12) {
    const day = Math.floor((N - new Date(i.now.getFullYear(), 0, 1).getTime()) / 86_400_000);
    return { kind: 'tip', title: tr('coc.keep.tipTitle'), detail: i.tips[day % i.tips.length], source: i.tipSource };
  }
  return { kind: 'none', title: tr('coc.keep.none'), detail: tr('coc.keep.noneSub') };
}

// ─── Ajout rapide ─────────────────────────────────────────────────────────────────────────────────

export const ADD_ACTIONS = ['bottle', 'breastfeed', 'meal', 'diaper', 'sleep', 'medication', 'symptom', 'note'] as const;
export type AddAction = (typeof ADD_ACTIONS)[number];

/** Actions proposées pour cet enfant (jamais un suivi désactivé, jamais de biberon après 2 ans). */
export function addActions(enabled: readonly string[], ageMonths: number): AddAction[] {
  return ADD_ACTIONS.filter((k) => {
    if (k === 'bottle') return on(enabled, 'bottle') && ageMonths < BOTTLE_MAX_MONTHS;
    if (k === 'breastfeed' || k === 'meal' || k === 'diaper' || k === 'sleep') return on(enabled, k);
    return true;
  });
}

const DEFAULT_FAV: Record<Exclude<TrackProfile, 'pregnancy'>, AddAction[]> = {
  newborn: ['bottle', 'breastfeed', 'diaper', 'sleep'],
  diversification: ['meal', 'bottle', 'sleep', 'diaper'],
  child: ['meal', 'sleep', 'medication', 'symptom'],
};

/** Les 4 favoris : ceux choisis par le parent (s'ils restent possibles), complétés par les favoris de l'âge. */
export function favoriteActions(profile: TrackProfile, available: AddAction[], chosen: readonly string[] | null | undefined): AddAction[] {
  const fav: AddAction[] = [];
  for (const k of chosen ?? []) if (available.includes(k as AddAction) && !fav.includes(k as AddAction)) fav.push(k as AddAction);
  for (const k of DEFAULT_FAV[profile === 'pregnancy' ? 'child' : profile]) if (fav.length < 4 && available.includes(k) && !fav.includes(k)) fav.push(k);
  for (const k of available) if (fav.length < 4 && !fav.includes(k)) fav.push(k);
  return fav.slice(0, 4);
}

// ─── Moment de la journée de la carte ─────────────────────────────────────────────────────────────

export type CocoonMoment = 'morning' | 'day' | 'sunset' | 'night';
export function cocoonMoment(d: Date): CocoonMoment {
  const h = d.getHours() + d.getMinutes() / 60;
  if (h >= 5.5 && h < 10) return 'morning';
  if (h >= 10 && h < 17.5) return 'day';
  if (h >= 17.5 && h < 21) return 'sunset';
  return 'night';
}
