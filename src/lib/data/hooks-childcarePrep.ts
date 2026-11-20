/**
 * Avant la garde — accès aux données (20261125000100_avant_garde.sql). Le serveur décide de tout (RLS) :
 *  - candidates, questions, réponses : parents du foyer seulement ;
 *  - planning : parents (écriture), nounou confirmée de l'enfant (lecture) ;
 *  - absences : parents ; la nounou confirmée lit l'absence de l'enfant et SES congés, et saisit ses congés ;
 *  - heures : arrivées / départs du carnet de liaison (childcare_events), aucune seconde saisie.
 * Écritures par insertOrQueue (file hors ligne, identifiant posé sur l'appareil, envoi répété sans doublon).
 */
import { useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { backend, eq, gte, inList, lte } from '../backend';
import { useAuth } from '../auth';
import { insertOrQueue, useOfflineStore } from '../offline';
import { uuid } from '../uuid';
import { useChildren, useInvalidate, useMemberships, useRows } from './hooks';
import { useMyChildcare } from './hooks-nounou';
import {
  templateOf, type Absence, type Candidate, type PrepAnswer, type PrepItem, type PrepKind, type PunchEvent, type Schedule,
} from '@/features/childcarePrep/domain';

// ---------------------------------------------------------------- rôle et enfants
/** Foyer où la personne est parent (propriétaire ou co-parent) : celui des candidates. Null pour une nounou. */
export function useParentHousehold(): { householdId: string | null; loading: boolean } {
  const m = useMemberships();
  return useMemo(() => {
    const mine = (m.data ?? []).filter((x) => x.role !== 'caregiver');
    return { householdId: mine[0]?.household_id ?? null, loading: m.isLoading && !m.data };
  }, [m.data, m.isLoading]);
}

export interface PrepChild { id: string; first_name: string; household_id: string; role: 'parent' | 'caregiver' }
/** Enfants concernés : ceux des foyers où l'on est parent, puis ceux confiés (nounou confirmée). */
export function usePrepChildren(): { children: PrepChild[]; loading: boolean } {
  const memberships = useMemberships();
  const kids = useChildren();
  const mine = useMyChildcare();
  return useMemo(() => {
    const parentHouseholds = new Set((memberships.data ?? []).filter((m) => m.role !== 'caregiver').map((m) => m.household_id));
    const out: PrepChild[] = (kids.data ?? []).filter((k) => parentHouseholds.has(k.household_id))
      .map((k) => ({ id: k.id, first_name: k.first_name, household_id: k.household_id, role: 'parent' as const }));
    for (const l of mine.data ?? []) {
      if (l.status === 'active' && l.child && !out.some((c) => c.id === l.child!.id)) out.push({ ...l.child, role: 'caregiver' });
    }
    const loading = (memberships.isLoading && !memberships.data) || (kids.isLoading && !kids.data) || (mine.isLoading && !mine.data);
    return { children: out, loading };
  }, [memberships.data, memberships.isLoading, kids.data, kids.isLoading, mine.data, mine.isLoading]);
}

// ---------------------------------------------------------------- candidates
export function useCandidates(householdId: string | null) {
  const { session } = useAuth();
  return useQuery({
    queryKey: [session?.userId, 'childcare_candidates', householdId ?? ''],
    enabled: !!householdId,
    staleTime: 30_000,
    queryFn: async () => (await backend.select<Candidate>({ table: 'childcare_candidates', filters: [eq('household_id', householdId)], order: [{ col: 'created_at', asc: true }] })).map(normalizeCandidate),
  });
}

const NUMERIC = ['hourly_rate', 'hours_per_week', 'weeks_per_year', 'days_per_week', 'monthly_fee', 'meal_fee_per_day', 'upkeep_fee_per_day', 'other_monthly'] as const;
/** Nombres renvoyés en texte par PostgREST (numeric) → nombres. */
export function normalizeCandidate(r: Candidate): Candidate {
  const out = { ...r } as Record<string, unknown>;
  for (const k of NUMERIC) if (out[k] != null) out[k] = Number(out[k]);
  return out as unknown as Candidate;
}

/** Création ou modification (même ligne, identifiant posé sur l'appareil) ; hors ligne : en file. */
export function useSaveCandidate() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (row: Partial<Candidate> & { household_id: string }) => {
      const id = row.id ?? uuid();
      const payload = { ...row, id };
      delete (payload as Record<string, unknown>).created_by;
      delete (payload as Record<string, unknown>).created_at;
      delete (payload as Record<string, unknown>).updated_at;
      const r = await insertOrQueue('childcare_candidates', payload, { conflict: 'id', merge: true });
      return { id, queued: r === 'queued' };
    },
    onSuccess: () => { void inv('childcare_candidates'); },
  });
}

export function useDeleteCandidate() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => { await backend.remove('childcare_candidates', [eq('id', id)]); },
    onSuccess: () => { void inv('childcare_candidates', 'childcare_prep_answers'); },
  });
}

// ---------------------------------------------------------------- questions d'entretien, checklist de visite
export function usePrepItems(householdId: string | null) {
  return useRows<PrepItem>(['childcare_prep_items', householdId ?? ''], householdId ? { table: 'childcare_prep_items', filters: [eq('household_id', householdId)], order: [{ col: 'position', asc: true }] } : null);
}

/** Modèle fourni : posé une fois par foyer (une ligne par clé ; un envoi répété ne crée pas de doublon). */
export async function seedTemplate(householdId: string, kind: PrepKind, existing: PrepItem[]): Promise<void> {
  const have = new Set(existing.filter((i) => i.kind === kind && i.template_key).map((i) => i.template_key));
  const keys = templateOf(kind).filter((k) => !have.has(k));
  let pos = 0;
  for (const key of keys) {
    pos = templateOf(kind).indexOf(key) * 10;
    await insertOrQueue('childcare_prep_items', { id: uuid(), household_id: householdId, kind, template_key: key, position: pos, archived: false },
      { conflict: 'household_id,kind,template_key' });
  }
}

export function useSavePrepItem() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (row: Partial<PrepItem> & { household_id: string; kind: PrepKind }) => {
      const payload: Record<string, unknown> = { ...row, id: row.id ?? uuid() };
      delete payload.created_at;
      await insertOrQueue('childcare_prep_items', payload, { conflict: 'id', merge: true });
    },
    onSuccess: () => { void inv('childcare_prep_items'); },
  });
}

export function usePrepAnswers(householdId: string | null) {
  return useRows<PrepAnswer>(['childcare_prep_answers', householdId ?? ''], householdId ? { table: 'childcare_prep_answers', filters: [eq('household_id', householdId)] } : null);
}

/** Réponse notée ou point coché : une ligne par candidate et par question (remplacée, jamais dupliquée). */
export function useSaveAnswer() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (a: { household_id: string; candidate_id: string; item_id: string; answer?: string | null; checked?: boolean }) => {
      await insertOrQueue('childcare_prep_answers', { answer: null, checked: false, ...a }, { conflict: 'candidate_id,item_id', merge: true });
    },
    onSuccess: () => { void inv('childcare_prep_answers'); },
  });
}

// ---------------------------------------------------------------- planning
export function useSchedules(childId: string | null) {
  const q = useRows<Schedule>(['childcare_schedules', childId ?? ''], childId ? { table: 'childcare_schedules', filters: [eq('child_id', childId)], order: [{ col: 'starts_on', asc: false }] } : null);
  return q;
}
export function useSaveSchedule() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (row: Partial<Schedule> & { household_id: string; child_id: string }) => {
      const payload: Record<string, unknown> = { ...row, id: row.id ?? uuid() };
      await insertOrQueue('childcare_schedules', payload, { conflict: 'id', merge: true });
    },
    onSuccess: () => { void inv('childcare_schedules'); },
  });
}
export function useDeleteSchedule() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => { await backend.remove('childcare_schedules', [eq('id', id)]); },
    onSuccess: () => { void inv('childcare_schedules'); },
  });
}

// ---------------------------------------------------------------- absences et congés
export function useAbsences(childId: string | null) {
  const { session } = useAuth();
  const pending = useOfflineStore((s) => s.pending);
  const q = useQuery({
    queryKey: [session?.userId, 'childcare_absences', childId ?? ''],
    enabled: !!childId,
    staleTime: 30_000,
    queryFn: () => backend.select<Absence>({ table: 'childcare_absences', filters: [eq('child_id', childId)], order: [{ col: 'from_on', asc: true }] }),
  });
  const data = useMemo(() => {
    if (!q.data) return undefined;
    const queued = pending.filter((p) => p.table === 'childcare_absences' && p.row.child_id === childId && !q.data!.some((a) => a.id === p.row.id))
      .map((p) => ({ ...(p.row as unknown as Absence), _pending: true }));
    return [...q.data, ...queued].sort((a, b) => a.from_on.localeCompare(b.from_on));
  }, [q.data, pending, childId]);
  return { ...q, data };
}
export function useAddAbsence() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (row: Omit<Absence, 'id' | '_pending'> & { id?: string }) => insertOrQueue('childcare_absences', { ...row, id: row.id ?? uuid() }, { conflict: 'id', merge: true }),
    onSuccess: () => { void inv('childcare_absences'); },
  });
}
export function useDeleteAbsence() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => { await backend.remove('childcare_absences', [eq('id', id)]); },
    onSuccess: () => { void inv('childcare_absences'); },
  });
}

// ---------------------------------------------------------------- heures : arrivées / départs du carnet de liaison
/** Pointages d'une période (bornes incluses, dates locales), y compris ceux encore en file hors ligne. */
export function usePunches(childId: string | null, from: string, to: string) {
  const { session } = useAuth();
  const pending = useOfflineStore((s) => s.pending);
  const fromIso = new Date(`${from}T00:00:00`).toISOString();
  const toIso = new Date(`${to}T23:59:59.999`).toISOString();
  const q = useQuery({
    queryKey: [session?.userId, 'childcare_events', 'care_day', childId ?? '', from, to],
    enabled: !!childId,
    staleTime: 15_000,
    queryFn: () => backend.select<PunchEvent>({ table: 'childcare_events', filters: [eq('child_id', childId), inList('kind', ['arrival', 'departure']), gte('at', fromIso), lte('at', toIso)], order: [{ col: 'at', asc: true }] }),
  });
  const data = useMemo(() => {
    if (!q.data) return undefined;
    const queued = pending.filter((p) => p.table === 'childcare_events' && p.row.child_id === childId && (p.row.kind === 'arrival' || p.row.kind === 'departure')
      && String(p.row.at) >= fromIso && String(p.row.at) <= toIso && !q.data!.some((e) => e.id === p.row.id))
      .map((p) => ({ ...(p.row as unknown as PunchEvent), id: String(p.row.id ?? p.row.client_id), _pending: true }));
    return [...q.data, ...queued];
  }, [q.data, pending, childId, fromIso, toIso]);
  return { ...q, data };
}

/** Pointage : une ligne du carnet (arrivée ou départ), visible aussi dans le carnet du jour. */
export function useAddPunch() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (v: { child_id: string; household_id: string; kind: 'arrival' | 'departure'; at: string }) =>
      insertOrQueue('childcare_events', { id: uuid(), client_id: uuid(), ...v }),
    onSuccess: () => { void inv('childcare_events', 'care_day'); },
  });
}
export function useUpdatePunch() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (v: { id: string; at: string }) => { await backend.update('childcare_events', { at: v.at }, [eq('id', v.id)]); },
    onSuccess: () => { void inv('childcare_events', 'care_day'); },
  });
}
export function useDeletePunch() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => { await backend.remove('childcare_events', [eq('id', id)]); },
    onSuccess: () => { void inv('childcare_events', 'care_day'); },
  });
}
