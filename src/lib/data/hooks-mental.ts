/**
 * Données de la charge mentale (07/11/2026) — tables créées par 20261107000300_charge_mentale.sql.
 */
import { useMutation } from '@tanstack/react-query';
import { backend, eq, gte } from '../backend';
import { useUserId } from '../auth';
import { useHouseholdId, useInvalidate, useRows } from './hooks';
import { resync } from './hooks-settings';
import type { DomainKey, PaperKind } from '../domain/mentalLoad';
import type { Reminder } from '../types';

export interface FamilyDomain { household_id: string; key: DomainKey; owner_id: string | null; note: string | null; updated_at: string }
export interface FamilyPrep { id: string; household_id: string; key: string; occurs_on: string; status: 'prepared' | 'skipped' }
export interface OffDuty { id: string; household_id: string; user_id: string; starts_at: string; ends_at: string; relay_to: string | null }
export type NoteSection = 'codes' | 'contacts' | 'kids' | 'habits' | 'home' | 'health' | 'school' | 'other';
export interface HouseNote { id: string; household_id: string; child_id: string | null; section: NoteSection; title: string; body: string | null; position: number; updated_at: string }
export interface CoupleCheckin { id: string; household_id: string; week_of: string; heavy: string | null; decisions: string | null; thanks: string | null; updated_at: string }
export interface ExhaustionCheckin { id: string; user_id: string; answers: number[]; note: string | null; created_at: string }
export interface FamilyPaper { id: string; household_id: string; child_id: string | null; kind: PaperKind; label: string | null; document_id: string | null; expires_on: string | null; note: string | null; updated_at: string }

const hh = (table: string, hid: string | null, extra: Record<string, unknown> = {}) =>
  hid ? ({ table, filters: [eq('household_id', hid)], ...extra }) : null;

export function useDomains() {
  const hid = useHouseholdId();
  return useRows<FamilyDomain>(['family_domains', hid ?? ''], hh('family_domains', hid));
}
export function useSetDomain() {
  const inv = useInvalidate();
  const hid = useHouseholdId();
  return useMutation({
    mutationFn: async (a: { key: DomainKey; owner_id: string | null }) => {
      if (!hid) return;
      const cur = await backend.select<FamilyDomain>({ table: 'family_domains', filters: [eq('household_id', hid), eq('key', a.key)] });
      if (cur.length) await backend.update('family_domains', { owner_id: a.owner_id }, [eq('household_id', hid), eq('key', a.key)]);
      else await backend.insert('family_domains', { household_id: hid, key: a.key, owner_id: a.owner_id });
    },
    onSuccess: () => inv('family_domains'),
  });
}

export function usePrepDone() {
  const hid = useHouseholdId();
  return useRows<FamilyPrep>(['family_prep', hid ?? ''], hh('family_prep', hid));
}

export function useOffDuty() {
  const hid = useHouseholdId();
  return useRows<OffDuty>(['offduty_periods', hid ?? ''], hid ? { table: 'offduty_periods', filters: [eq('household_id', hid), gte('ends_at', new Date(Date.now() - 3600_000).toISOString())], order: [{ col: 'ends_at', asc: false }] } : null, { staleTime: 15_000 });
}

/**
 * « Je décroche » : la période est enregistrée, le relais est prévenu (demande « besoin de repos »), et MES rappels
 * non médicaux et non partagés sont mis en pause jusqu'à la fin (ils reprennent seuls ensuite). Jamais un médicament.
 */
export function useStartOffDuty() {
  const inv = useInvalidate();
  const hid = useHouseholdId();
  const uid = useUserId();
  return useMutation({
    mutationFn: async (a: { hours: number; relayTo: string | null; message: string }) => {
      if (!hid || !uid) return;
      const ends = new Date(Date.now() + a.hours * 3600_000).toISOString();
      await backend.insert('offduty_periods', { household_id: hid, user_id: uid, ends_at: ends, relay_to: a.relayTo });
      await backend.insert('care_requests', { household_id: hid, kind: 'rest', to_user: a.relayTo, message: a.message.slice(0, 300), starts_at: new Date().toISOString(), ends_at: ends });
      const mine = await backend.select<Reminder>({ table: 'reminders', filters: [eq('user_id', uid), eq('enabled', true)] });
      for (const r of mine.filter((x) => x.category !== 'medication' && !x.shared)) {
        await backend.update('reminders', { snoozed_until: ends }, [eq('id', r.id)]);
      }
      await resync(uid);
    },
    onSuccess: () => inv('offduty_periods', 'care_requests', 'reminders'),
  });
}
export function useStopOffDuty() {
  const inv = useInvalidate();
  const uid = useUserId();
  return useMutation({
    mutationFn: async (id: string) => {
      await backend.update('offduty_periods', { ends_at: new Date(Date.now() + 1000).toISOString() }, [eq('id', id)]);
      if (uid) {
        const mine = await backend.select<Reminder>({ table: 'reminders', filters: [eq('user_id', uid)] });
        for (const r of mine.filter((x) => x.snoozed_until && Date.parse(x.snoozed_until) > Date.now() && x.category !== 'medication')) {
          await backend.update('reminders', { snoozed_until: null }, [eq('id', r.id)]);
        }
        await resync(uid);
      }
    },
    onSuccess: () => inv('offduty_periods', 'reminders'),
  });
}

export function useHouseNotes() {
  const hid = useHouseholdId();
  return useRows<HouseNote>(['house_notes', hid ?? ''], hh('house_notes', hid, { order: [{ col: 'section' }, { col: 'position' }, { col: 'created_at' }] }));
}
export function useCoupleCheckins() {
  const hid = useHouseholdId();
  return useRows<CoupleCheckin>(['couple_checkins', hid ?? ''], hh('couple_checkins', hid, { order: [{ col: 'week_of', asc: false }], limit: 12 }));
}
export function useExhaustionCheckins() {
  const uid = useUserId();
  return useRows<ExhaustionCheckin>(['exhaustion_checkins', uid ?? ''], uid ? { table: 'exhaustion_checkins', filters: [eq('user_id', uid)], order: [{ col: 'created_at', asc: false }], limit: 12 } : null);
}
export function useFamilyPapers() {
  const hid = useHouseholdId();
  return useRows<FamilyPaper>(['family_papers', hid ?? ''], hh('family_papers', hid, { order: [{ col: 'kind' }] }));
}
