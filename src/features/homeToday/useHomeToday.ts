/**
 * Données de « Aujourd'hui dans le foyer » : uniquement les requêtes existantes (mêmes clés de cache que
 * l'organisation familiale, l'agenda et les missions : aucune requête en double), assemblées par todayModel.
 * Terminer : mission → mission_respond (« complete », version attendue) ; tâche simple → useSaveTask (status done),
 * le mécanisme existant de la liste familiale.
 */
import { useMemo } from 'react';
import { useUserId } from '@/lib/auth';
import { useAppointments, useMyMembership, useProfile } from '@/lib/data/hooks';
import { useCareShifts, useFamilyEvents, useFamilyTasks, usePeople, useSaveTask } from '@/lib/data/hooks-family-load';
import { useRespondMission } from '@/lib/data/hooks-missions';
import { useMemberAvatars } from '@/lib/data/hooks-profilePhoto';
import { useCustodyExceptions, useCustodyPlans } from '@/lib/data/hooks-tools6';
import { todayISO } from '@/lib/domain/dates';
import { t as tr } from '@/i18n';
import { custodyToday, emphasisId, todayAgenda, todayShifts, todayTasks, type TaskLike, type TodayModel, type TodayTask } from './todayModel';

export interface TodayPerson { id: string | null; name: string; initial: string; avatarPath: string | null; isMe: boolean }

export function useHomeToday(now: Date = new Date()) {
  const me = useUserId();
  const membership = useMyMembership();
  const canEdit = !!membership && (membership.role === 'owner' || (membership.can_edit ?? []).includes('lists'));
  const tasksQ = useFamilyTasks();
  const eventsQ = useFamilyEvents();
  const apptQ = useAppointments();
  const shiftsQ = useCareShifts();
  const plansQ = useCustodyPlans();
  const plan = (plansQ.data ?? []).find((p) => p.active) ?? null;
  const day = todayISO(now);
  const exQ = useCustodyExceptions(plan?.id, day);
  const { labelOf } = usePeople();
  const profile = useProfile().data;
  const avatars = useMemberAvatars().data;
  const minute = Math.floor(now.getTime() / 60_000);

  const model = useMemo<TodayModel>(() => {
    const at = new Date(minute * 60_000);
    return {
      tasks: todayTasks((tasksQ.data ?? []) as TaskLike[], me, at, { canEdit }),
      agenda: todayAgenda({ events: eventsQ.data ?? [], appointments: apptQ.data ?? [] }, at),
      shifts: todayShifts(shiftsQ.data ?? [], at),
      custody: plan ? custodyToday([plan], exQ.data ?? [], at) : [],
    };
  }, [tasksQ.data, eventsQ.data, apptQ.data, shiftsQ.data, plan, exQ.data, me, canEdit, minute]);

  /** Prénom de la personne : le mien vient de mon profil ; les autres membres sont nommés par leur rôle (les profils ne sont pas partagés entre membres). */
  const person = (id: string | null | undefined): TodayPerson => {
    if (!id) return { id: null, name: tr('ht.nobody'), initial: '', avatarPath: null, isMe: false };
    const isMe = id === me;
    const name = isMe ? profile?.display_name?.trim() || tr('u7.people.you') : labelOf(id);
    return { id, name, initial: (name.trim()[0] ?? '?').toUpperCase(), avatarPath: avatars?.[id] ?? null, isMe };
  };

  const loading = tasksQ.isLoading && !tasksQ.data;
  // Une source indispensable qui n'a pas pu se charger : on le dit plutôt que d'afficher « rien de prévu »
  const error = tasksQ.isError && !tasksQ.data ? tasksQ.error : null;
  const retry = () => { void tasksQ.refetch(); void eventsQ.refetch(); void shiftsQ.refetch(); };
  return { me, canEdit, model, emphasis: emphasisId(model.tasks), person, loading, error, retry, hasHousehold: !!membership };
}

/** Terminer une ligne depuis l'accueil (le serveur revérifie les droits). */
export function useCompleteToday() {
  const respond = useRespondMission();
  const save = useSaveTask();
  const complete = async (x: TodayTask) => {
    if (x.kind === 'mission') {
      const out = await respond.mutateAsync({ id: x.id, action: 'complete', version: x.version });
      if (out?.status === 'conflict') throw new Error(tr('ht.conflict'));
      return;
    }
    await save.mutateAsync({ id: x.id, input: { status: 'done' } });
  };
  const accept = async (x: TodayTask) => {
    const out = await respond.mutateAsync({ id: x.id, action: 'accept', version: x.version });
    if (out?.status === 'conflict') throw new Error(tr('ht.conflict'));
  };
  return { complete, accept };
}
