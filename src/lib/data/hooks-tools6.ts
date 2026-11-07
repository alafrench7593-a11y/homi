/**
 * Données des six outils du 07/11/2026 : suivi PMA, routines en pictogrammes, garde alternée, alertes de
 * produits rappelés (préférence foyer). Tables créées par supabase/migrations/20261107000100_six_outils.sql.
 */
import { useMutation } from '@tanstack/react-query';
import { backend, eq, gte } from '../backend';
import { useUserId } from '../auth';
import { useHouseholdId, useInvalidate, useRows } from './hooks';
import { resync } from './hooks-settings';
import type { CustodyPattern, Side } from '../domain/custody';
import type { Reminder } from '../types';

// ---------------------------------------------------------------- PMA
export type PmaKind = 'iiu' | 'fiv' | 'icsi' | 'tec' | 'stimulation' | 'other';
export type PmaRoute = 'injection' | 'oral' | 'vaginal' | 'patch' | 'nasal' | 'other';
export type PmaLogKind = 'dose' | 'monitoring' | 'ultrasound' | 'blood' | 'trigger' | 'retrieval' | 'transfer' | 'test' | 'note';
export interface PmaProtocol { id: string; user_id: string; kind: PmaKind; label: string; started_on: string; ended_on: string | null; center: string | null; center_phone: string | null; notes: string | null; created_at: string }
export interface PmaMed { id: string; user_id: string; protocol_id: string; name: string; route: PmaRoute; dose_text: string | null; take_time: string | null; start_on: string | null; end_on: string | null; active: boolean; created_at: string }
export interface PmaLog { id: string; user_id: string; protocol_id: string; med_id: string | null; kind: PmaLogKind; happened_at: string; note: string | null; created_at: string }

export const PMA_LINK = '/fertility/pma';
/** Lien unique d'un rappel de traitement : permet de le retrouver et de le remplacer sans doublon. */
export const pmaMedLink = (medId: string) => `${PMA_LINK}?med=${medId}`;

export function usePmaProtocols() {
  const uid = useUserId();
  return useRows<PmaProtocol>(['pma_protocols', uid ?? ''], uid ? { table: 'pma_protocols', filters: [eq('user_id', uid)], order: [{ col: 'started_on', asc: false }] } : null);
}
export function usePmaMeds(protocolId: string | null | undefined) {
  return useRows<PmaMed>(['pma_meds', protocolId ?? ''], protocolId ? { table: 'pma_meds', filters: [eq('protocol_id', protocolId)], order: [{ col: 'created_at' }] } : null);
}
export function usePmaLogs(protocolId: string | null | undefined) {
  return useRows<PmaLog>(['pma_logs', protocolId ?? ''], protocolId ? { table: 'pma_logs', filters: [eq('protocol_id', protocolId)], order: [{ col: 'happened_at', asc: false }], limit: 400 } : null);
}

/** Rappel quotidien d'un traitement, à l'heure indiquée par le centre ; remplacé à chaque modification. */
export async function syncPmaMedReminder(userId: string, med: PmaMed, today: string) {
  await backend.remove('reminders', [eq('user_id', userId), eq('deep_link', pmaMedLink(med.id))]);
  const ended = !!med.end_on && med.end_on < today;
  if (med.active && !ended && med.take_time) {
    const [hour, minute] = med.take_time.split(':').map(Number);
    await backend.insert('reminders', {
      user_id: userId, category: 'medication', title: med.name.slice(0, 80),
      body: med.dose_text ? med.dose_text.slice(0, 240) : null,
      schedule: { type: 'daily', hour, minute }, enabled: true, deep_link: pmaMedLink(med.id),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris',
    });
  }
  await resync(userId);
}

export function useSavePmaMed() {
  const inv = useInvalidate();
  const uid = useUserId();
  return useMutation({
    mutationFn: async (a: { id?: string; row: Omit<PmaMed, 'id' | 'user_id' | 'created_at'>; today: string; reminder: boolean }) => {
      const row = a.row;
      const saved = a.id
        ? (await backend.update<PmaMed>('pma_meds', row, [eq('id', a.id)]))[0]
        : (await backend.insert<PmaMed>('pma_meds', { ...row, user_id: uid }))[0];
      if (uid && saved) await syncPmaMedReminder(uid, a.reminder ? saved : { ...saved, take_time: null }, a.today);
      return saved;
    },
    onSuccess: () => inv('pma_meds', 'reminders'),
  });
}

export function useDeletePmaMed() {
  const inv = useInvalidate();
  const uid = useUserId();
  return useMutation({
    mutationFn: async (id: string) => {
      if (uid) await backend.remove('reminders', [eq('user_id', uid), eq('deep_link', pmaMedLink(id))]);
      await backend.remove('pma_meds', [eq('id', id)]);
      if (uid) await resync(uid);
    },
    onSuccess: () => inv('pma_meds', 'pma_logs', 'reminders'),
  });
}

// ---------------------------------------------------------------- routines en pictogrammes
export type KidMoment = 'morning' | 'evening' | 'afterschool' | 'weekend' | 'custom';
export interface KidStep { icon: string; label: string }
export interface KidRoutine { id: string; household_id: string; child_id: string | null; title: string; moment: KidMoment; steps: KidStep[]; position: number; active: boolean; created_at: string }
export interface KidCheck { id: string; household_id: string; routine_id: string; on_date: string; step: number; done_by: string | null; created_at: string }

export function useKidRoutines() {
  const hid = useHouseholdId();
  return useRows<KidRoutine>(['kid_routines', hid ?? ''], hid ? { table: 'kid_routines', filters: [eq('household_id', hid)], order: [{ col: 'position' }, { col: 'created_at' }] } : null);
}
export function useKidChecks(day: string) {
  const hid = useHouseholdId();
  return useRows<KidCheck>(['kid_routine_checks', hid ?? '', day], hid ? { table: 'kid_routine_checks', filters: [eq('household_id', hid), eq('on_date', day)] } : null, { staleTime: 5_000 });
}
export function useToggleKidStep() {
  const inv = useInvalidate();
  const hid = useHouseholdId();
  return useMutation({
    mutationFn: async (a: { routineId: string; day: string; step: number; done: boolean }) => {
      if (!hid) return;
      if (a.done) await backend.insert('kid_routine_checks', { household_id: hid, routine_id: a.routineId, on_date: a.day, step: a.step });
      else await backend.remove('kid_routine_checks', [eq('routine_id', a.routineId), eq('on_date', a.day), eq('step', a.step)]);
    },
    onSuccess: () => inv('kid_routine_checks'),
  });
}

// ---------------------------------------------------------------- garde alternée
export interface CustodyPlan { id: string; household_id: string; child_id: string | null; label_a: string; label_b: string; pattern: CustodyPattern; cycle: string; anchor_on: string; handover_time: string | null; handover_place: string | null; notes: string | null; active: boolean; created_at: string; updated_at: string }
export interface CustodyExceptionRow { id: string; household_id: string; plan_id: string; from_on: string; to_on: string; side: Side; note: string | null; created_at: string }

export function useCustodyPlans() {
  const hid = useHouseholdId();
  return useRows<CustodyPlan>(['custody_plans', hid ?? ''], hid ? { table: 'custody_plans', filters: [eq('household_id', hid)], order: [{ col: 'created_at' }] } : null);
}
export function useCustodyExceptions(planId: string | null | undefined, sinceDay: string) {
  return useRows<CustodyExceptionRow>(['custody_exceptions', planId ?? '', sinceDay], planId ? { table: 'custody_exceptions', filters: [eq('plan_id', planId), gte('to_on', sinceDay)], order: [{ col: 'created_at' }] } : null);
}

// ---------------------------------------------------------------- rappels de produits
export interface RecallPrefs { user_id: string; share_household: boolean; updated_at: string }
export function useRecallPrefs() {
  const uid = useUserId();
  return useRows<RecallPrefs>(['recall_watch_prefs', uid ?? ''], uid ? { table: 'recall_watch_prefs', filters: [eq('user_id', uid)] } : null);
}
export function useSetRecallShare() {
  const inv = useInvalidate();
  const uid = useUserId();
  return useMutation({
    mutationFn: async (share: boolean) => {
      if (!uid) return;
      const rows = await backend.select<RecallPrefs>({ table: 'recall_watch_prefs', filters: [eq('user_id', uid)] });
      if (rows.length) await backend.update('recall_watch_prefs', { share_household: share, updated_at: new Date().toISOString() }, [eq('user_id', uid)]);
      else await backend.insert('recall_watch_prefs', { user_id: uid, share_household: share });
    },
    onSuccess: () => inv('recall_watch_prefs'),
  });
}

// ---------------------------------------------------------------- rappels partagés par le foyer
/** Rappels que les autres membres du foyer ont choisi de partager (lecture seule). */
export function useHouseholdSharedReminders() {
  const hid = useHouseholdId();
  const uid = useUserId();
  return useRows<Reminder>(['reminders', 'shared', hid ?? ''], hid && uid ? { table: 'reminders', filters: [eq('household_id', hid), eq('shared', true)], order: [{ col: 'created_at' }] } : null);
}
