/**
 * Neurodéveloppement et besoins particuliers d'un enfant : catégories, suivi (rendez-vous, bilans,
 * professionnels, observations, progrès, émotions, sommeil, routines, école) et traitements prescrits.
 * Règle absolue : l'application ne calcule jamais une dose, ne modifie jamais un traitement et ne pose
 * aucun diagnostic. Le parent recopie l'ordonnance ; les rappels reprennent ce texte tel quel.
 */
import { useMutation } from '@tanstack/react-query';
import { backend, eq, gte, inList, type Filter } from '../backend';
import { useHouseholdId, useInvalidate, useRows } from './hooks';
import { cancelDoseFollowUp, syncLocalReminders } from '../notifications';
import { loadDeviceReminders } from './deviceReminders';
import { useUserId } from '../auth';
import type { Reminder } from '../types';

export const NEED_KINDS = ['adhd', 'asd', 'dys', 'language', 'dcd', 'tics', 'sensory', 'assessment', 'other', 'questions'] as const;
/** Choix proposés d'emblée ; les autres (TDC, tics, diagnostic en cours) restent accessibles via « Plus de catégories ». */
export const MAIN_NEED_KINDS = ['adhd', 'asd', 'dys', 'language', 'sensory', 'other', 'questions'] as const;
export const ADVANCED_NEED_KINDS = ['dcd', 'tics', 'assessment'] as const;
export type NeedKind = (typeof NEED_KINDS)[number];
export const ENTRY_KINDS = ['appointment', 'assessment', 'professional', 'observation', 'progress', 'emotion', 'sleep', 'routine', 'school'] as const;
export type EntryKind = (typeof ENTRY_KINDS)[number];

export interface ChildNeeds { id: string; household_id: string; child_id: string; kinds: NeedKind[]; other_label: string | null; notes: string | null; updated_at?: string }
export interface NeedEntry { id: string; household_id: string; child_id: string; kind: EntryKind; title: string; body: string | null; occurred_on: string; created_at: string }
export interface Treatment {
  id: string; household_id: string; child_id: string; name: string; dose_text: string; times: string[];
  frequency: 'daily' | 'weekly' | 'as_prescribed'; weekdays: number[]; start_date: string; end_date: string | null;
  instructions: string | null; prescriber: string | null; active: boolean; created_at?: string;
}
export interface TreatmentLog { id: string; household_id: string; treatment_id: string; scheduled_for: string; status: 'taken' | 'snoozed' | 'skipped'; note: string | null; logged_at?: string }

export function useChildNeeds(childId: string | null | undefined) {
  const q = useRows<ChildNeeds>(['child_needs', childId ?? ''], childId ? { table: 'child_needs', filters: [eq('child_id', childId)], limit: 1 } : null);
  return { ...q, data: q.data?.[0] ?? null };
}
export function useNeedEntries(childId: string | null | undefined, kind?: EntryKind | null) {
  const filters: Filter[] = childId ? [eq('child_id', childId)] : [];
  if (kind) filters.push(eq('kind', kind));
  return useRows<NeedEntry>(['child_need_entries', childId ?? '', kind ?? ''], childId ? { table: 'child_need_entries', filters, order: [{ col: 'occurred_on', asc: false }] } : null);
}
export function useTreatments(childId: string | null | undefined) {
  return useRows<Treatment>(['child_treatments', childId ?? ''], childId ? { table: 'child_treatments', filters: [eq('child_id', childId)], order: [{ col: 'created_at', asc: true }] } : null);
}
export function useTreatmentLogs(treatmentIds: string[], sinceISO: string) {
  return useRows<TreatmentLog>(['treatment_logs', treatmentIds.join(','), sinceISO], treatmentIds.length ? { table: 'treatment_logs', filters: [inList('treatment_id', treatmentIds), gte('scheduled_for', sinceISO)], order: [{ col: 'scheduled_for', asc: true }] } : null);
}

export function useSaveNeeds() {
  const hid = useHouseholdId();
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (v: { id?: string | null; child_id: string; kinds: NeedKind[]; other_label?: string | null; notes?: string | null }) => {
      const row = { kinds: v.kinds, other_label: v.other_label ?? null, notes: v.notes ?? null };
      if (v.id) await backend.update('child_needs', row, [eq('id', v.id)]);
      else await backend.insert('child_needs', { ...row, child_id: v.child_id, household_id: hid });
    },
    onSuccess: () => inv('child_needs'),
  });
}
export function useAddNeedEntry() {
  const hid = useHouseholdId();
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (v: { child_id: string; kind: EntryKind; title: string; body?: string | null; occurred_on: string }) => backend.insert('child_need_entries', { ...v, household_id: hid }),
    onSuccess: () => inv('child_need_entries'),
  });
}
export function useDeleteNeedEntry() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (id: string) => backend.remove('child_need_entries', [eq('id', id)]), onSuccess: () => inv('child_need_entries') });
}

/** Planifie les rappels d'un traitement : un rappel par heure de prise, texte = ce qu'a saisi le parent. */
export function treatmentReminderRows(t: Treatment, childName: string, userId: string) {
  // « Selon l'ordonnance » : aucune heure fixe, donc aucun rappel automatique
  if (t.frequency === 'as_prescribed') return [];
  return t.times.map((hm) => {
    const [hour, minute] = hm.split(':').map(Number);
    const schedule = t.frequency === 'weekly' && t.weekdays.length
      ? { type: 'weekly' as const, weekdays: t.weekdays, hour, minute, from: t.start_date, until: t.end_date }
      : { type: 'daily' as const, hour, minute, from: t.start_date, until: t.end_date };
    return {
      user_id: userId, household_id: t.household_id, child_id: t.child_id, treatment_id: t.id, journey_type: null,
      category: 'medication', title: `${childName} · ${t.name}`, body: t.dose_text,
      schedule, enabled: t.active, deep_link: `/child/${t.child_id}/needs?tab=treatments&dose=${encodeURIComponent(hm)}`,
    };
  });
}

export function useSaveTreatment() {
  const hid = useHouseholdId();
  const userId = useUserId();
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (v: { id?: string | null; childName: string; reminders: boolean; row: Omit<Treatment, 'id' | 'household_id' | 'created_at'> }) => {
      let saved: Treatment;
      if (v.id) saved = (await backend.update<Treatment>('child_treatments', v.row as unknown as Record<string, unknown>, [eq('id', v.id)]))[0];
      else saved = (await backend.insert<Treatment>('child_treatments', { ...v.row, household_id: hid }))[0];
      // Rappels : remplacés à chaque modification (jamais deux rappels pour une même prise)
      await backend.remove('reminders', [eq('treatment_id', saved.id)]);
      const rem = v.reminders && saved.active && userId ? treatmentReminderRows(saved, v.childName, userId) : [];
      if (rem.length) await backend.insert('reminders', rem);
      if (userId) {
        const rows = await loadDeviceReminders(userId);
        await syncLocalReminders(rows).catch(() => undefined);
      }
      return saved;
    },
    onSuccess: () => inv('child_treatments', 'reminders'),
  });
}
export function useDeleteTreatment() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (id: string) => backend.remove('child_treatments', [eq('id', id)]), onSuccess: () => inv('child_treatments', 'treatment_logs', 'reminders') });
}

/** Réponse à une prise prévue : Pris, Reporter, Ignorer (avec note facultative). Une seule réponse par prise. */
export function useLogDose() {
  const hid = useHouseholdId();
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (v: { treatment_id: string; scheduled_for: string; status: TreatmentLog['status']; note?: string | null; existingId?: string | null }) => {
      const row = { status: v.status, note: v.note ?? null };
      if (v.existingId) await backend.update('treatment_logs', row, [eq('id', v.existingId)]);
      else await backend.insert('treatment_logs', { ...row, treatment_id: v.treatment_id, scheduled_for: v.scheduled_for, household_id: hid });
      if (v.status !== 'snoozed') await cancelDoseFollowUp(v.treatment_id, v.scheduled_for).catch(() => undefined);
    },
    onSuccess: () => inv('treatment_logs'),
  });
}
