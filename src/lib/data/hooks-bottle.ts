/** Minuteur biberon : accès aux données (TanStack Query) + synchronisation des notifications locales. */
import { t as tr } from '@/i18n';
import { useMutation } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { backend, eq, gte } from '../backend';
import { useUserId } from '../auth';
import { askNotificationPermission } from '../notificationPrompt';
import { activeTimerFor, isBottleChild, lastIntervalFor, newTimer, planReplacement, type NewTimerInput, type TimerCore } from '../domain/bottleTimer';
import {
  getBottleNotificationsEnabled, getBottleShowQuantity, getPermission, notificationsSupported, scheduledBottleIds, setBottleNotificationsEnabled, setBottleShowQuantity,
  syncBottleTimers, type PermissionState,
} from '../notifications';
import type { BottleRecord, BottleTimer } from '../types-bottle';
import { useHouseholdId, useHouseholdMembers, useInvalidate, useJourneyState, useRows, useTrackedChildren } from './hooks';

/** Minuteurs actifs de tous les enfants du foyer (vue « tous les minuteurs »). */
export function useBottleTimers() {
  const hid = useHouseholdId();
  return useRows<BottleTimer>(['bottle_timers', hid ?? '', 'active'], hid ? { table: 'bottle_timers', filters: [eq('household_id', hid), eq('status', 'active')], order: [{ col: 'due_at' }] } : null, { staleTime: 10_000 });
}

/** Minuteur actif d'un enfant + délai utilisé la dernière fois pour CET enfant. */
export function useBottleTimer(childId: string | null | undefined) {
  const q = useRows<BottleTimer>(['bottle_timers', 'child', childId ?? ''], childId ? { table: 'bottle_timers', filters: [eq('child_id', childId)], order: [{ col: 'created_at', asc: false }], limit: 20 } : null, { staleTime: 10_000 });
  const active = useMemo(() => (childId ? activeTimerFor(q.data, childId) : null), [q.data, childId]);
  const lastInterval = useMemo(() => (childId ? lastIntervalFor(q.data, childId) : null), [q.data, childId]);
  return { ...q, active, lastInterval };
}

export class TimerExistsError extends Error {
  constructor(public active: BottleTimer) {
    super(tr('l3.bottle.timer_exists'));
  }
}

export interface StartTimerInput extends NewTimerInput {
  bottleId?: string | null;
  /** Remplacer le minuteur actif : 'new_bottle' (clôturé comme « donné ») ou 'restart' (annulé). false = refuser s'il en existe un. */
  replace?: 'new_bottle' | 'restart' | false;
}

/** Démarre un minuteur (et remplace l'actif si demandé : jamais deux minuteurs actifs pour un enfant). */
export async function startBottleTimer(input: StartTimerInput): Promise<BottleTimer> {
  const next = newTimer(input);
  const [existing] = await backend.select<BottleTimer>({ table: 'bottle_timers', filters: [eq('child_id', input.childId), eq('status', 'active')], limit: 1 });
  if (existing && !input.replace) throw new TimerExistsError(existing);
  const plan = planReplacement(existing as TimerCore | undefined, next, input.replace || 'restart');
  if (plan.close) await backend.update('bottle_timers', plan.close.patch, [eq('id', plan.close.id)]);
  const [row] = await backend.insert<BottleTimer>('bottle_timers', { ...plan.create, bottle_id: input.bottleId ?? null });
  return row;
}

export function useStartBottleTimer() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: startBottleTimer,
    onSettled: () => {
      inv('bottle_timers');
      syncBottleTimers().catch(() => undefined);
    },
  });
}

/** Modifie un minuteur (heure, délai, report, annulation, « donné ») puis reprogramme la notification. */
export function useUpdateBottleTimer() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Pick<BottleTimer, 'last_bottle_at' | 'interval_minutes' | 'due_at' | 'planned_ml' | 'status'>> }) =>
      backend.update<BottleTimer>('bottle_timers', patch, [eq('id', id)]),
    onSettled: () => {
      inv('bottle_timers');
      syncBottleTimers().catch(() => undefined);
    },
  });
}

/** Biberons d'un enfant sur N jours (historique, résumé de consultation). */
export function useBottleHistory(childId: string | null | undefined, days = 8) {
  const since = useMemo(() => new Date(Date.now() - days * 86400_000).toISOString(), [days]);
  return useRows<BottleRecord>(['bottles', childId ?? '', 'history', String(days)], childId ? { table: 'bottles', filters: [eq('child_id', childId), gte('at', since)], order: [{ col: 'at', asc: false }], limit: 500 } : null);
}

/** Dernier biberon enregistré pour un enfant (point de départ proposé pour un minuteur démarré à la main). */
export function useLastBottle(childId: string | null | undefined) {
  const q = useRows<BottleRecord>(['bottles', childId ?? '', 'last'], childId ? { table: 'bottles', filters: [eq('child_id', childId)], order: [{ col: 'at', asc: false }], limit: 1 } : null);
  return q.data?.[0] ?? null;
}

/** « Enregistré par » : vous, le coparent, un proche. */
export function useRecorderLabel() {
  const me = useUserId();
  const { data: members } = useHouseholdMembers();
  return useCallback((userId: string | null | undefined): string | null => {
    if (!userId) return null;
    if (userId === me) return tr('l3.bottle.rec_you');
    const m = members?.find((x) => x.user_id === userId);
    if (!m) return tr('l3.bottle.rec_member');
    return m.role === 'owner' ? tr('l3.bottle.rec_owner') : m.role === 'coparent' ? tr('l3.bottle.rec_coparent') : tr('l3.bottle.rec_relative');
  }, [me, members]);
}

/** Heure courante rafraîchie (affichage en temps réel du minuteur). */
export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** Autorisation système + interrupteur « notifications du minuteur biberon » (propre à cet appareil). */
export function useBottleNotificationSettings() {
  const [enabled, setEnabledState] = useState(true);
  const [showQuantity, setShowQuantityState] = useState(false);
  const [permission, setPermission] = useState<PermissionState>(notificationsSupported ? 'undetermined' : 'unsupported');
  useEffect(() => {
    let alive = true;
    getBottleNotificationsEnabled().then((v) => alive && setEnabledState(v)).catch(() => undefined);
    getPermission().then((p) => alive && setPermission(p)).catch(() => undefined);
    getBottleShowQuantity().then((v) => alive && setShowQuantityState(v)).catch(() => undefined);
    return () => { alive = false; };
  }, []);
  const setEnabled = useCallback(async (v: boolean) => {
    setEnabledState(v);
    await setBottleNotificationsEnabled(v);
  }, []);
  const setShowQuantity = useCallback(async (v: boolean) => {
    setShowQuantityState(v);
    await setBottleShowQuantity(v);
  }, []);
  const request = useCallback(async () => {
    const p = await askNotificationPermission(tr('l3.bottle.notif_reason'));
    setPermission(p);
    if (p === 'granted') await syncBottleTimers().catch(() => undefined);
    return p;
  }, []);
  return { supported: notificationsSupported, enabled, setEnabled, showQuantity, setShowQuantity, permission, request };
}

/** Une notification est-elle programmée sur CET appareil pour ce minuteur ? */
export function useTimerScheduledHere(timer: Pick<BottleTimer, 'id' | 'due_at'> | null) {
  const [scheduled, setScheduled] = useState<boolean | null>(null);
  const id = timer?.id;
  const due = timer?.due_at;
  useEffect(() => {
    if (!id || !notificationsSupported) return setScheduled(null);
    let alive = true;
    // Laisse le temps à la synchronisation lancée par la dernière action de se terminer
    const t = setTimeout(() => scheduledBottleIds(id).then((ids) => alive && setScheduled(ids.length > 0)).catch(() => undefined), 600);
    return () => { alive = false; clearTimeout(t); };
  }, [id, due]);
  return scheduled;
}

/** Enfants concernés par le biberon : profil bébé (« Mon bébé est né ») ou moins de 2 ans. Jamais un enfant plus grand. */
export function useBottleChildren() {
  const q = useTrackedChildren();
  const js = useJourneyState();
  const data = useMemo(() => q.data?.filter((c) => isBottleChild(c.birth_date, js.childType(c.id))), [q.data, js]);
  return { ...q, data };
}
