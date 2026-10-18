/**
 * États affichés sur les cartes « Outils » : uniquement des données réelles, lues par les mêmes
 * requêtes (mêmes clés de cache) que les outils eux-mêmes. Quand un outil enregistre quelque chose,
 * l'invalidation par table rafraîchit aussi ces cartes : aucune animation ne simule une mise à jour.
 */
import { useMemo } from 'react';
import { useUserId } from '@/lib/auth';
import { eq } from '@/lib/backend';
import { useAppointments, useLogs, useNotificationsInbox, useOpenSleep, useReminders, useRows } from './hooks';
import { useBottleTimer, useLastBottle, useNow } from './hooks-bottle';
import { useCareShifts, useFamilyTasks, usePeople } from './hooks-family-load';
import { toolStatuses, type StatusKey, type ToolStatus } from '@/lib/domain/toolCatalog';

const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export function useToolStatuses(childId: string | null | undefined): { statuses: Partial<Record<StatusKey, ToolStatus>>; loading: boolean } {
  const now = useNow(30_000);
  const me = useUserId();
  const running = useRows<{ id: string; started_at: string }>(['bottles', childId ?? '', 'running'], childId ? { table: 'bottles', filters: [eq('child_id', childId), eq('in_progress', true)], limit: 1 } : null);
  const timer = useBottleTimer(childId);
  const lastBottle = useLastBottle(childId);
  const openSleep = useOpenSleep(childId);
  const diapers = useLogs<{ at: string }>('diaper', childId, 3);
  const tasks = useFamilyTasks();
  const shifts = useCareShifts();
  const { labelOf } = usePeople();
  const appts = useAppointments({ upcomingOnly: true });
  const inbox = useNotificationsInbox();
  const reminders = useReminders();

  const statuses = useMemo(() => {
    const live = (shifts.data ?? []).filter((s) => s.status !== 'cancelled' && Date.parse(s.ends_at) > now.getTime());
    const night = live.filter((s) => s.kind === 'night').sort((a, b) => (a.starts_at < b.starts_at ? -1 : 1))[0];
    const meTime = live.filter((s) => s.kind === 'me_time' && s.user_id === me).sort((a, b) => (a.starts_at < b.starts_at ? -1 : 1))[0];
    const appt = (appts.data ?? []).filter((a) => Date.parse(a.starts_at) >= now.getTime()).sort((a, b) => (a.starts_at < b.starts_at ? -1 : 1))[0];
    return toolStatuses({
      now,
      bottleRunningSince: running.data?.[0]?.started_at ?? null,
      reminderDueAt: timer.active?.due_at ?? null,
      lastBottleAt: lastBottle?.at ?? null,
      openSleepSince: openSleep?.started_at ?? null,
      lastDiaperAt: diapers.data?.[0]?.at ?? null,
      tasksTodayLeft: tasks.data ? tasks.data.filter((x) => x.status === 'todo' && x.due_at && sameDay(new Date(x.due_at), now)).length : undefined,
      nextNight: night ? { starts_at: night.starts_at, who: labelOf(night.user_id) } : null,
      nextMeTime: meTime?.starts_at ?? null,
      nextAppointment: appt?.starts_at ?? null,
      unreadNotifications: (inbox.data ?? []).filter((n) => !n.read_at).length,
      activeReminders: reminders.data ? reminders.data.filter((r) => r.enabled).length : undefined,
    });
  }, [now, me, running.data, timer.active, lastBottle, openSleep, diapers.data, tasks.data, shifts.data, labelOf, appts.data, inbox.data, reminders.data]);

  return { statuses, loading: !!childId && (running.isLoading || diapers.isLoading) };
}
