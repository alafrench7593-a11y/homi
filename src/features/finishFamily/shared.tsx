/**
 * Famille et couple — pièces communes de la fin du suivi (23/11/2026) :
 *  · `useCanEditLists` : droit de corriger (propriétaire, ou édition « listes ») ; sans ce droit, les fiches se
 *    lisent sans bouton de correction ;
 *  · `useOpenParam` : élément ouvert gardé dans l'adresse (« ?task=… », « ?domain=… ») ;
 *  · `TaskCarrierTray` : fiche d'une tâche du foyer (Tray) — qui la porte, intitulé, échéance ; valeurs provisoires,
 *    Annuler, Enregistrer verrouillé (HmFixTray), écrit par `useSaveTask` à la version lue (aucune autre écriture) ;
 *  · `DomainOwnerTray` : fiche d'un domaine — changer de porteur, écrit par `useSetDomain` (même fiche que « Domaines »).
 */
import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { HmFixTray } from '@/features/homeTrack/kit';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { useMyMembership } from '@/lib/data/hooks';
import { useSaveTask, type Person } from '@/lib/data/hooks-family-load';
import { useDomains, useSetDomain } from '@/lib/data/hooks-mental';
import { friendlyError } from '@/lib/data/hooks-settings';
import { categoryOf, type FamilyTask } from '@/lib/domain/familyLoad';
import { canEditLists, taskDraftOf, taskFixPatch, taskLocked } from '@/lib/domain/finishFamily';
import type { DomainKey } from '@/lib/domain/mentalLoad';
import { clock } from '@/lib/domain/sleepPlanner';

export function useCanEditLists(): boolean {
  return canEditLists(useMyMembership());
}

/** Paramètre d'adresse d'un élément ouvert : [valeur, ouvrir/fermer]. */
export function useOpenParam(name: string): [string | null, (v: string | null) => void] {
  const qp = useLocalSearchParams<Record<string, string>>();
  const v = typeof qp[name] === 'string' && qp[name] ? qp[name] : null;
  return [v, (x: string | null) => router.setParams({ [name]: x ?? undefined } as never)];
}

const when = (iso: string) => `${formatDate(iso, { weekday: 'short', day: 'numeric', month: 'short' })} · ${clock(new Date(iso))}`;

export function TaskCarrierTray({ task, onClose, people, labelOf, canEdit, testID = 'ff-task-tray' }: {
  task: FamilyTask | null; onClose: () => void; people: readonly Person[];
  labelOf: (id: string | null | undefined) => string; canEdit: boolean; testID?: string;
}) {
  const save = useSaveTask();
  if (!task) return null;
  const ids = people.map((p) => p.id);
  const withDue = task.status === 'todo';
  const locked = taskLocked(task as FamilyTask & { mission_state?: string | null });
  const lines = [
    task.assignee_id ? tr('ff.task.carried', { who: labelOf(task.assignee_id) }) : tr('ff.task.nobodyLine'),
    task.status === 'done' && task.done_at ? tr('ff.task.doneBy', { who: labelOf(task.done_by ?? task.assignee_id), when: when(task.done_at) }) : null,
    withDue ? (task.due_at ? tr('ff.task.dueOn', { when: when(task.due_at) }) : tr('ff.task.noDue')) : null,
    categoryOf(task.category).label,
    locked ? tr('ff.task.mission') : !canEdit ? tr('ff.readOnly') : null,
  ];
  return (
    <HmFixTray open onOpenChange={(v) => { if (!v) onClose(); }} testID={testID} readOnly={!canEdit || locked}
      title={tr('ff.task.trayTitle')} hero={task.title} lines={lines}
      editLabel={tr('ff.task.fix')} editTitle={tr('ff.task.fixTitle')}
      fields={[
        { key: 'who', label: tr('ff.task.who'), kind: 'choice', options: [...people.map((p) => p.label), tr('ff.task.nobody')] },
        { key: 'title', label: tr('ff.task.title'), kind: 'text', maxLength: 120 },
        ...(withDue ? [
          { key: 'due', label: tr('ff.task.due'), kind: 'date' as const, hint: tr('ff.task.dueHint') },
          { key: 'time', label: tr('ff.task.time'), kind: 'time' as const },
        ] : []),
      ]}
      initial={{ ...taskDraftOf(task, ids) }}
      validate={(d) => {
        const r = taskFixPatch(task, { title: d.title ?? '', who: d.who ?? '', due: d.due ?? '', time: d.time ?? '' }, ids, withDue);
        return 'error' in r ? tr(ERR[r.error]) : null;
      }}
      onSave={async (d) => {
        const r = taskFixPatch(task, { title: d.title ?? '', who: d.who ?? '', due: d.due ?? '', time: d.time ?? '' }, ids, withDue);
        if ('error' in r) return tr(ERR[r.error]);
        if (!Object.keys(r.patch).length) return 'ok';
        try { await save.mutateAsync({ id: task.id, input: r.patch, base: task }); return 'ok'; } catch (e) { return friendlyError(e); }
      }} />
  );
}
const ERR: Record<'title' | 'badDate' | 'badTime', TKey> = { title: 'ff.task.needTitle', badDate: 'hm.fix.badDate', badTime: 'hm.fix.badTime' };

export function DomainOwnerTray({ domain, onClose, people, labelOf, canEdit, testID = 'dom-tray' }: {
  domain: DomainKey | null; onClose: () => void; people: readonly Person[];
  labelOf: (id: string | null | undefined) => string; canEdit: boolean; testID?: string;
}) {
  const q = useDomains();
  const set = useSetDomain();
  if (!domain) return null;
  const row = q.data?.find((d) => d.key === domain);
  const owner = row?.owner_id ?? null;
  const idx = people.findIndex((p) => p.id === owner);
  const name = tr(`cm.domain.${domain}` as TKey);
  return (
    <HmFixTray open onOpenChange={(v) => { if (!v) onClose(); }} testID={testID} readOnly={!canEdit} title={name}
      hero={owner ? labelOf(owner) : tr('rs.dom.freeOne')}
      lines={[tr(`cm.domain.${domain}.d` as TKey), row?.updated_at ? tr('rs.dom.since', { date: formatDate(row.updated_at, { day: 'numeric', month: 'long', year: 'numeric' }) }) : null, tr('rs.dom.what'), canEdit ? null : tr('ff.readOnly')]}
      editLabel={tr('rs.dom.change')} editTitle={tr('rs.dom.fixTitle', { domain: name })}
      fields={[{ key: 'who', label: tr('rs.dom.who'), kind: 'choice', options: [...people.map((p) => p.label), tr('rs.dom.nobody')] }]}
      initial={{ who: String(idx >= 0 ? idx : people.length) }}
      onSave={async (d) => {
        const i = Number(d.who);
        const id = i >= 0 && i < people.length ? people[i].id : null;
        try { await set.mutateAsync({ key: domain, owner_id: id }); return 'ok'; } catch (e) { return friendlyError(e); }
      }} />
  );
}
