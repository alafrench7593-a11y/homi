/**
 * Planificateur de sommeil : lecture des relevés d'UN enfant, calcul du planning (recalculé à chaque relevé et
 * chaque minute), actions d'enregistrement (endormissement, réveil, réveil de nuit, rendormissement, modification
 * d'horaire, suppression), profil de sommeil et avis sur les estimations. Rien n'est mélangé entre enfants.
 */
import { useEffect, useMemo, useState } from 'react';
import { backend, eq, gte } from '../backend';
import { useInvalidate, useLogs, usePremium, useRows } from './hooks';
import { DEFAULT_NOTIFY, notifyPrefs, openNightWaking, planDay, planSleepNotifications, sleepKind, type NotifyPrefs, type SleepFeedback, type SleepPlan, type SleepProfile, type SleepRecord } from '../domain/sleepPlanner';
import { syncSleepNotifications } from '../notifications';
import type { Breastfeed, Bottle, Child, Sleep } from '../types';

export interface SleepProfileRow extends SleepProfile { id: string; household_id: string; updated_at?: string }
export interface SleepFeedbackRow extends SleepFeedback { id: string; household_id: string }

/** Heure courante, rafraîchie régulièrement (le planning suit l'horloge). */
export function useNow(everyMs = 30_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), everyMs); return () => clearInterval(id); }, [everyMs]);
  return now;
}

export function useSleepProfile(childId: string | null | undefined) {
  const q = useRows<SleepProfileRow>(['sleep_profiles', childId ?? ''], childId ? { table: 'sleep_profiles', filters: [eq('child_id', childId)], limit: 1 } : null);
  return { profile: q.data?.[0] ?? null, loading: q.isLoading };
}

export function useSleepFeedback(childId: string | null | undefined) {
  const since = useMemo(() => new Date(Date.now() - 30 * 86_400_000).toISOString(), []);
  const q = useRows<SleepFeedbackRow>(['sleep_feedback', childId ?? ''], childId ? { table: 'sleep_feedback', filters: [eq('child_id', childId), gte('created_at', since)], order: [{ col: 'created_at', asc: false }], limit: 100 } : null);
  return q.data ?? [];
}

/** Planning du jour d'un enfant + données utilisées. */
export function useSleepPlan(child: Child | null | undefined, everyMs = 30_000) {
  const now = useNow(everyMs);
  const id = child?.id ?? null;
  const sleepsQ = useLogs<Sleep>('sleep', id, 16);
  const { profile, loading: profileLoading } = useSleepProfile(id);
  const feedback = useSleepFeedback(id);
  const sleeps = (sleepsQ.data ?? []) as SleepRecord[];
  const plan: SleepPlan | null = useMemo(
    () => (child ? planDay({ childId: child.id, birthDate: child.birth_date, profile, sleeps, feedback, now }) : null),
    [child, profile, sleeps, feedback, now],
  );
  return { plan, sleeps, profile, feedback, now, loading: sleepsQ.isLoading || profileLoading };
}

/** Repas de nuit notés (tétées et biberons) d'un enfant, pour l'aide de nuit. */
export function useNightFeeds(childId: string | null | undefined) {
  const b = useLogs<Bottle>('bottle', childId, 2);
  const f = useLogs<Breastfeed>('breastfeed', childId, 2);
  return useMemo(() => [...(b.data ?? []).map((x) => ({ at: x.at })), ...(f.data ?? []).map((x) => ({ at: x.started_at }))], [b.data, f.data]);
}

/**
 * Programme (ou annule) les notifications du planning de cet enfant sur l'appareil. Uniquement avec Premium et si le
 * parent les a activées ; recalculé à chaque changement du planning.
 */
export function useSleepNotificationSync(child: Child | null | undefined, plan: SleepPlan | null, profile: SleepProfile | null) {
  const premium = usePremium();
  const prefs: NotifyPrefs = profile ? notifyPrefs(profile) : DEFAULT_NOTIFY;
  const list = useMemo(
    () => (child && plan && premium ? planSleepNotifications(plan, prefs, child.first_name, child.sex, new Date()) : []),
    // la liste ne dépend que des heures estimées et des préférences, pas de la minute courante
    [child?.id, premium, JSON.stringify(prefs), plan?.state, plan?.nextNap?.at, plan?.bedtime?.at, plan?.since], // eslint-disable-line react-hooks/exhaustive-deps
  );
  useEffect(() => {
    if (!child) return;
    syncSleepNotifications(child.id, list).catch(() => undefined);
  }, [child?.id, JSON.stringify(list)]); // eslint-disable-line react-hooks/exhaustive-deps
  return list;
}

const MIN = 60_000;
export class SleepError extends Error {}

/** Actions d'enregistrement. Toutes les heures sont vérifiées : jamais dans le futur, jamais avant le début. */
export function useSleepActions(child: Child | null | undefined) {
  const inv = useInvalidate();
  const done = () => inv('sleeps');
  const childId = child?.id;

  async function current(): Promise<{ open: Sleep | null; last: Sleep | null }> {
    if (!childId) throw new SleepError('Enfant introuvable.');
    const rows = await backend.select<Sleep>({ table: 'sleeps', filters: [eq('child_id', childId)], order: [{ col: 'started_at', asc: false }], limit: 5 });
    return { open: rows.find((r) => !r.ended_at) ?? null, last: rows.find((r) => !!r.ended_at) ?? null };
  }
  const checkPast = (at: Date) => { if (at.getTime() > Date.now() + MIN) throw new SleepError('L’heure choisie est dans le futur.'); };

  return {
    /** « Mon enfant s'endort » (heure modifiable) ; sieste ou nuit selon le planning ou le choix du parent. */
    async asleep(at: Date, kind: 'nap' | 'night') {
      checkPast(at);
      const { open, last } = await current();
      if (open) throw new SleepError('Un sommeil est déjà en cours : notez d’abord le réveil.');
      if (last?.ended_at && Date.parse(last.ended_at) > at.getTime()) throw new SleepError(`Cette heure est avant la fin du dernier sommeil noté (${new Date(last.ended_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}).`);
      await backend.insert('sleeps', { child_id: childId, household_id: child!.household_id, started_at: at.toISOString(), kind, wakeups: 0, wake_events: [] });
      done();
    },
    /** « Mon enfant se réveille » : fin de la sieste ou de la nuit (réveil du matin). */
    async awake(at: Date) {
      checkPast(at);
      const { open } = await current();
      if (!open) throw new SleepError('Aucun sommeil en cours.');
      const waking = openNightWaking(open);
      // Réveil du matin pendant un réveil nocturne en cours : la nuit s'arrête au début de ce réveil
      const end = waking ? new Date(Math.min(at.getTime(), Date.parse(waking.at))) : at;
      if (end.getTime() < Date.parse(open.started_at)) throw new SleepError('Le réveil ne peut pas précéder l’endormissement.');
      const patch: Record<string, unknown> = { ended_at: end.toISOString() };
      if (waking) { patch.wake_events = (open.wake_events ?? []).slice(0, -1); patch.wakeups = Math.max(0, (open.wakeups ?? 1) - 1); }
      await backend.update('sleeps', patch, [eq('id', open.id)]);
      done();
    },
    /** Réveil pendant la nuit (la nuit continue). */
    async nightWaking(at: Date) {
      checkPast(at);
      const { open } = await current();
      if (!open || sleepKind(open) !== 'night') throw new SleepError('Aucune nuit en cours.');
      if (openNightWaking(open)) throw new SleepError('Un réveil de nuit est déjà en cours.');
      if (at.getTime() < Date.parse(open.started_at)) throw new SleepError('Ce réveil est avant le coucher noté.');
      await backend.update('sleeps', { wakeups: (open.wakeups ?? 0) + 1, wake_events: [...(open.wake_events ?? []), { at: at.toISOString(), open: true }].slice(-50) }, [eq('id', open.id)]);
      done();
    },
    /** Rendormi après un réveil de nuit. */
    async backToSleep(at: Date) {
      checkPast(at);
      const { open } = await current();
      const waking = open ? openNightWaking(open) : null;
      if (!open || !waking) throw new SleepError('Aucun réveil de nuit en cours.');
      if (at.getTime() < Date.parse(waking.at)) throw new SleepError('L’heure choisie est avant le réveil.');
      const events = [...(open.wake_events ?? [])];
      events[events.length - 1] = { at: waking.at, back_at: at.toISOString(), minutes: Math.round((at.getTime() - Date.parse(waking.at)) / MIN) };
      await backend.update('sleeps', { wake_events: events }, [eq('id', open.id)]);
      done();
    },
    /** Modifier les horaires d'un sommeil (le planning est recalculé aussitôt). */
    async edit(sleep: Sleep, patch: { started_at: Date; ended_at: Date | null; kind: 'nap' | 'night' }, all: Sleep[]) {
      checkPast(patch.started_at);
      if (patch.ended_at) { checkPast(patch.ended_at); if (patch.ended_at <= patch.started_at) throw new SleepError('La fin doit être après le début.'); }
      if (patch.ended_at && patch.ended_at.getTime() - patch.started_at.getTime() > 16 * 60 * MIN) throw new SleepError('Durée supérieure à 16 h : vérifiez les heures.');
      const a = patch.started_at.getTime(); const b = patch.ended_at?.getTime() ?? Date.now();
      const overlap = all.find((s) => s.id !== sleep.id && Date.parse(s.started_at) < b && (s.ended_at ? Date.parse(s.ended_at) : Date.now()) > a);
      if (overlap) throw new SleepError('Ces horaires chevauchent un autre sommeil noté.');
      await backend.update('sleeps', { started_at: patch.started_at.toISOString(), ended_at: patch.ended_at?.toISOString() ?? null, kind: patch.kind }, [eq('id', sleep.id)]);
      done();
    },
    async remove(sleep: Sleep) {
      await backend.remove('sleeps', [eq('id', sleep.id)]);
      done();
    },
  };
}

export async function saveSleepProfile(child: Child, existing: SleepProfileRow | null, patch: Partial<SleepProfile>) {
  const row = { ...patch, updated_at: new Date().toISOString() };
  if (existing) await backend.update('sleep_profiles', row, [eq('id', existing.id)]);
  else await backend.insert('sleep_profiles', { ...row, child_id: child.id, household_id: child.household_id });
}

export async function addSleepFeedback(child: Child, target: 'nap' | 'bedtime', verdict: 'right' | 'early' | 'late', estimatedFor: number) {
  await backend.insert('sleep_feedback', { child_id: child.id, household_id: child.household_id, target, verdict, estimated_for: new Date(estimatedFor).toISOString() });
}
