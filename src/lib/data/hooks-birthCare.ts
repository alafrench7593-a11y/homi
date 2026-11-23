/**
 * 39 contractions · 44 projet de naissance · 48 préparation du coparent · 58/60 rééducation et cicatrisation —
 * accès aux données (20261127000200_naissance_postpartum_allaitement.sql). Données PERSONNELLES (la personne seule),
 * sauf la liste du coparent (listes de préparation du foyer, privée tant que son autrice ne la partage pas).
 * Écritures par insertOrQueue (identifiant posé sur l'appareil : envoi répété sans doublon, file hors connexion).
 */
import { useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { backend, eq } from '../backend';
import { useUserId } from '../auth';
import { insertOrQueue, useOfflineStore, type PendingOp } from '../offline';
import { uuid } from '../uuid';
import { ensureHousehold, useHouseholdId, useInvalidate, useRows } from './hooks';
import { resync } from './hooks-settings';
import { decodeForScan, encodeJpeg } from '../documents/io';
import type { Contraction } from '@/features/birth/contractions';
import type { PlanAnswers } from '@/features/birth/birthPlan';
import { templateRows } from '@/features/birth/partnerPrep';
import type { CareLog } from '@/features/postpartumCare/domain';
import type { Checklist, ChecklistItem } from '../types';

/** Lignes encore en file hors connexion pour une table (affichées tout de suite, marquées « en attente »). */
export function withPending<T extends { id: string }>(rows: T[] | undefined, pending: PendingOp[], table: string, keep: (row: Record<string, unknown>) => boolean): (T & { _pending?: boolean })[] | undefined {
  if (!rows) return undefined;
  const byId = new Map<string, T & { _pending?: boolean }>(rows.map((r) => [r.id, r]));
  for (const p of pending) {
    if (p.table !== table || !keep(p.row)) continue;
    const id = String(p.row.id);
    byId.set(id, { ...(byId.get(id) ?? {}), ...(p.row as unknown as T), _pending: true });
  }
  return [...byId.values()];
}

// ---------------------------------------------------------------- 39 contractions
export function useContractions() {
  const me = useUserId();
  const pending = useOfflineStore((s) => s.pending);
  const q = useRows<Contraction>(['contractions', me ?? ''], me ? { table: 'contractions', filters: [eq('user_id', me)], order: [{ col: 'started_at', asc: false }], limit: 500 } : null, { staleTime: 5_000 });
  const data = useMemo(() => withPending(q.data, pending, 'contractions', () => true), [q.data, pending]);
  return { ...q, data };
}
/** Début ou fin d'une contraction : la MÊME ligne (identifiant posé sur l'appareil), remplacée. */
export function useSaveContraction() {
  const inv = useInvalidate();
  const me = useUserId();
  return useMutation({
    mutationFn: async (c: { id?: string; session_id: string; started_at: string; ended_at: string | null; pregnancy_id?: string | null }) => {
      const row = { id: c.id ?? uuid(), user_id: me, session_id: c.session_id, started_at: c.started_at, ended_at: c.ended_at, pregnancy_id: c.pregnancy_id ?? null };
      const r = await insertOrQueue('contractions', row, { conflict: 'id', merge: true });
      return { id: row.id, queued: r === 'queued' };
    },
    onSuccess: () => { void inv('contractions'); },
  });
}
export function useDeleteContraction() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => { await backend.remove('contractions', [eq('id', id)]); },
    onSuccess: () => { void inv('contractions'); },
  });
}

// ---------------------------------------------------------------- 44 projet de naissance
export interface BirthPlanRow { id: string; user_id: string; pregnancy_id: string; answers: PlanAnswers; created_at: string; updated_at: string }
export function useBirthPlan(pregnancyId: string | null) {
  const me = useUserId();
  const pending = useOfflineStore((s) => s.pending);
  const q = useRows<BirthPlanRow>(['birth_plans', pregnancyId ?? ''], me && pregnancyId ? { table: 'birth_plans', filters: [eq('user_id', me), eq('pregnancy_id', pregnancyId)] } : null);
  const queued = [...pending].reverse().find((p) => p.table === 'birth_plans' && p.row.pregnancy_id === pregnancyId);
  const plan = queued ? ({ ...(q.data?.[0] ?? {}), ...(queued.row as object), _pending: true } as BirthPlanRow & { _pending?: boolean }) : q.data?.[0] ?? null;
  return { ...q, plan };
}
export function useSaveBirthPlan() {
  const inv = useInvalidate();
  const me = useUserId();
  return useMutation({
    mutationFn: async (a: { pregnancyId: string; answers: PlanAnswers }) =>
      insertOrQueue('birth_plans', { user_id: me, pregnancy_id: a.pregnancyId, answers: a.answers }, { conflict: 'user_id,pregnancy_id', merge: true }),
    onSuccess: () => { void inv('birth_plans'); },
  });
}
export function useDeleteBirthPlan() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => { await backend.remove('birth_plans', [eq('id', id)]); },
    onSuccess: () => { void inv('birth_plans'); },
  });
}

// ---------------------------------------------------------------- 48 préparation du coparent (listes de préparation)
export type PrepChecklist = Checklist & { created_by?: string | null; private_to_creator?: boolean };
export function usePartnerPrepLists() {
  const hid = useHouseholdId();
  const q = useRows<PrepChecklist>(['checklists', 'coparent', hid ?? ''], hid ? { table: 'checklists', filters: [eq('household_id', hid), eq('kind', 'coparent')], order: [{ col: 'created_at', asc: true }] } : null);
  return q;
}
export function usePrepItems(listId: string | null) {
  const pending = useOfflineStore((s) => s.pending);
  const q = useRows<ChecklistItem>(['checklist_items', listId ?? ''], listId ? { table: 'checklist_items', filters: [eq('checklist_id', listId)], order: [{ col: 'position' }] } : null);
  const data = useMemo(() => withPending(q.data, pending, 'checklist_items', (r) => r.checklist_id === listId)?.sort((a, b) => a.position - b.position), [q.data, pending, listId]);
  return { ...q, data };
}
/** Création de la liste (privée) avec le modèle : identifiants posés sur l'appareil, hors connexion compris. */
export function useCreatePartnerPrep() {
  const inv = useInvalidate();
  const me = useUserId();
  return useMutation({
    mutationFn: async (a: { title: string }) => {
      const hid = await ensureHousehold();
      const id = uuid();
      const r = await insertOrQueue('checklists', { id, household_id: hid, pregnancy_id: null, kind: 'coparent', title: a.title.slice(0, 80), created_by: me, private_to_creator: true }, { conflict: 'id' });
      for (const row of templateRows()) {
        await insertOrQueue('checklist_items', { id: uuid(), checklist_id: id, household_id: hid, label: row.label.slice(0, 160), position: row.position, done: false, note: null }, { conflict: 'id' });
      }
      return { id, queued: r === 'queued' };
    },
    onSuccess: () => { void inv('checklists', 'checklist_items'); },
  });
}
export function useSavePrepItem() {
  const inv = useInvalidate();
  const me = useUserId();
  return useMutation({
    mutationFn: async (it: Partial<ChecklistItem> & { checklist_id: string; household_id: string; label: string; position: number }) => {
      const row: Record<string, unknown> = { done: false, note: null, ...it, id: it.id ?? uuid() };
      if (row.done) row.done_by = me; else row.done_by = null;
      return insertOrQueue('checklist_items', row, { conflict: 'id', merge: true });
    },
    onSuccess: () => { void inv('checklist_items'); },
  });
}
export function useDeletePrepItem() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => { await backend.remove('checklist_items', [eq('id', id)]); },
    onSuccess: () => { void inv('checklist_items'); },
  });
}
export function useSharePartnerPrep() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (a: { id: string; shared: boolean }) => { await backend.update('checklists', { private_to_creator: !a.shared }, [eq('id', a.id)]); },
    onSuccess: () => { void inv('checklists', 'checklist_items'); },
  });
}
export function useDeletePartnerPrep() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => { await backend.remove('checklists', [eq('id', id)]); },
    onSuccess: () => { void inv('checklists', 'checklist_items'); },
  });
}

// ---------------------------------------------------------------- 58 / 60 rééducation périnéale et cicatrisation
export function useCareLogs(kind: CareLog['kind']) {
  const me = useUserId();
  const pending = useOfflineStore((s) => s.pending);
  const q = useRows<CareLog>(['postpartum_care_logs', kind, me ?? ''], me ? { table: 'postpartum_care_logs', filters: [eq('user_id', me), eq('kind', kind)], order: [{ col: 'at', asc: false }], limit: 300 } : null);
  const data = useMemo(() => withPending(q.data, pending, 'postpartum_care_logs', (r) => r.kind === kind), [q.data, pending, kind]);
  return { ...q, data };
}

/**
 * Enregistrement (création ou modification, même ligne). Rappel d'une séance (58) : un rappel ponctuel de la personne
 * (table reminders, notifications locales existantes), remplacé si l'heure change, retiré si la séance n'est plus
 * prévue. Le rappel demande le réseau ; la séance, elle, part en file hors connexion.
 */
export function useSaveCareLog() {
  const inv = useInvalidate();
  const me = useUserId();
  const hid = useHouseholdId();
  return useMutation({
    mutationFn: async (a: { row: Partial<CareLog> & { kind: CareLog['kind']; at: string }; reminder?: { at: string | null; title: string; link: string } }) => {
      const id = a.row.id ?? uuid();
      let reminderId: string | null = a.row.reminder_id ?? null;
      if (a.reminder && useOfflineStore.getState().online) {
        if (reminderId) { await backend.remove('reminders', [eq('id', reminderId)]).catch(() => undefined); reminderId = null; }
        if (a.reminder.at) {
          reminderId = uuid();
          await backend.insert('reminders', {
            id: reminderId, user_id: me, household_id: hid, category: 'postnatal', title: a.reminder.title, body: null,
            schedule: { type: 'once', at: a.reminder.at }, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris', enabled: true, deep_link: a.reminder.link,
          });
        }
        if (me) void resync(me);
      }
      const row: Record<string, unknown> = { ...a.row, id, user_id: me, reminder_id: reminderId };
      delete row._pending; delete row.created_at; delete row.updated_at;
      const r = await insertOrQueue('postpartum_care_logs', row, { conflict: 'id', merge: true });
      return { id, queued: r === 'queued' };
    },
    onSuccess: () => { void inv('postpartum_care_logs', 'reminders'); },
  });
}
export function useDeleteCareLog() {
  const inv = useInvalidate();
  const me = useUserId();
  return useMutation({
    mutationFn: async (log: Pick<CareLog, 'id' | 'reminder_id' | 'document_id'>) => {
      await backend.remove('postpartum_care_logs', [eq('id', log.id)]);
      if (log.reminder_id) { await backend.remove('reminders', [eq('id', log.reminder_id)]).catch(() => undefined); if (me) void resync(me); }
    },
    onSuccess: () => { void inv('postpartum_care_logs', 'reminders'); },
  });
}

/**
 * Photo facultative du journal de cicatrisation : réencodée sur l'appareil (aucune métadonnée, ni lieu ni appareil),
 * déposée dans le coffre de documents existant comme document PRIVÉ (private_to_uploader : la personne seule), catégorie
 * « post-natal ». Aucune analyse n'en est faite. Renvoie l'identifiant du document.
 */
export function useUploadPrivatePhoto() {
  const inv = useInvalidate();
  const me = useUserId();
  return useMutation({
    mutationFn: async (a: { uri: string; title: string; category?: 'postnatal' | 'prenatal' | 'ultrasound' | 'photo' }) => {
      const hid = await ensureHousehold();
      const bytes = encodeJpeg(await decodeForScan(a.uri, 1600), 82);
      const path = `${hid}/${uuid()}.jpg`;
      await backend.storage.upload('documents', path, { uri: '', bytes, mimeType: 'image/jpeg', size: bytes.length, name: path.split('/')[1] });
      const id = uuid();
      await backend.insert('documents', { id, household_id: hid, uploaded_by: me, category: a.category ?? 'postnatal', title: a.title.slice(0, 120), storage_path: path, mime_type: 'image/jpeg', size_bytes: bytes.length, page_count: 1, private_to_uploader: true });
      return id;
    },
    onSuccess: () => { void inv('documents'); },
  });
}
