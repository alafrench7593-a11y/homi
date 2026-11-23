/**
 * Données de « Aujourd'hui dans le foyer » : uniquement les requêtes existantes (mêmes clés de cache que
 * l'organisation familiale, l'agenda et les missions : aucune requête en double), assemblées par todayModel.
 * Terminer : mission → mission_respond (« complete », version attendue) ; tâche simple → useSaveTask (status done),
 * le mécanisme existant de la liste familiale.
 */
import { useMemo } from 'react';
import { useUserId } from '@/lib/auth';
import { useAppointments, useMyMembership } from '@/lib/data/hooks';
import { useCareShifts, useFamilyEvents, useFamilyTasks, usePeople, useSaveTask } from '@/lib/data/hooks-family-load';
import { useRespondMission } from '@/lib/data/hooks-missions';
import { useCustodyExceptions, useCustodyPlans } from '@/lib/data/hooks-tools6';
import { todayISO } from '@/lib/domain/dates';
import { useHouseholdActivities } from '@/lib/data/hooks-partiels2';
import { sessionsBetween } from '@/features/activities/domain';
import { addDays, atLocal } from '@/lib/domain/calendar';
import { t as tr } from '@/i18n';
import { activityForProfile, appointmentForProfile, custodyForProfile, custodyToday, emphasisId, eventForProfile, shiftForProfile, taskForProfile, todayAgenda, todayShifts, todayTasks, type TaskLike, type TodayModel, type TodayProfile, type TodayTask } from './todayModel';
import type { RespondResultStatus } from '@/lib/data/hooks-missions';

export interface TodayPerson { id: string | null; name: string; initial: string; avatarPath: string | null; isMe: boolean }

const ALL: TodayProfile = { kind: 'all' };
const profileKey = (p: TodayProfile) => (p.kind === 'child' ? `c:${p.childId}` : p.kind === 'pregnancy' ? `p:${p.pregnancyId}` : p.kind === 'me' ? `m:${p.userId ?? ''}` : 'all');

/** `profile` : la journée est celle du profil affiché (agenda, relais, garde ; tâches du foyer). Défaut : tout le foyer. */
export function useHomeToday(now: Date = new Date(), profile: TodayProfile = ALL) {
  const me = useUserId();
  const membership = useMyMembership();
  const canEdit = !!membership && (membership.role === 'owner' || (membership.can_edit ?? []).includes('lists'));
  const tasksQ = useFamilyTasks();
  const eventsQ = useFamilyEvents();
  const apptQ = useAppointments();
  const shiftsQ = useCareShifts();
  const activitiesQ = useHouseholdActivities();
  const plansQ = useCustodyPlans();
  const plan = (plansQ.data ?? []).find((p) => p.active) ?? null;
  const day = todayISO(now);
  const exQ = useCustodyExceptions(plan?.id, day);
  const { personOf } = usePeople();
  const minute = Math.floor(now.getTime() / 60_000);

  const model = useMemo<TodayModel>(() => {
    const at = new Date(minute * 60_000);
    return {
      tasks: todayTasks((tasksQ.data ?? []) as TaskLike[], me, at, { canEdit }).filter((x) => taskForProfile(x, profile)),
      agenda: todayAgenda({ events: (eventsQ.data ?? []).filter((e) => eventForProfile(e, profile)), appointments: (apptQ.data ?? []).filter((a) => appointmentForProfile(a, profile)),
        activities: (activitiesQ.data ?? []).flatMap((a) => sessionsBetween(a, atLocal(day), atLocal(addDays(day, 1)))
          .map((s) => ({ id: `${a.id}:${s.starts}`, activityId: a.id, childId: a.child_id, title: a.name, starts: s.starts, ends: s.ends, location: a.place }))).filter((x) => activityForProfile(x, profile)) }, at),
      shifts: todayShifts(shiftsQ.data ?? [], at).filter((x) => shiftForProfile(x, profile, me)),
      custody: (plan ? custodyToday([plan], exQ.data ?? [], at) : []).filter((c) => custodyForProfile(c, profile)),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasksQ.data, eventsQ.data, apptQ.data, activitiesQ.data, day, shiftsQ.data, plan, exQ.data, me, canEdit, minute, profileKey(profile)]);

  /**
   * Prénom et photo de la personne (household_member_names : prénom affiché + avatar des membres actifs, rien
   * d'autre du profil). Le rôle (« Coparent ») ne sert plus qu'en dernier recours, si aucun prénom n'est visible.
   */
  const person = (id: string | null | undefined): TodayPerson => {
    if (!id) return { id: null, name: tr('ht.nobody'), initial: '', avatarPath: null, isMe: false };
    const p = personOf(id);
    const name = p?.name ?? tr('u7.people.former');
    return { id, name, initial: (name.trim()[0] ?? '?').toUpperCase(), avatarPath: p?.avatarPath ?? null, isMe: id === me };
  };

  const loading = tasksQ.isLoading && !tasksQ.data;
  // Une source indispensable qui n'a pas pu se charger : on le dit plutôt que d'afficher « rien de prévu »
  const error = tasksQ.isError && !tasksQ.data ? tasksQ.error : null;
  const retry = () => { void tasksQ.refetch(); void eventsQ.refetch(); void shiftsQ.refetch(); };
  return { me, canEdit, model, emphasis: emphasisId(model.tasks), person, loading, error, retry, hasHousehold: !!membership };
}

/**
 * Terminer / accepter une ligne depuis l'accueil (le serveur revérifie les droits). Le résultat RENVOYÉ est celui du
 * serveur : « ok » (fait maintenant), « unchanged » (c'était déjà fait : rejeu, double appui) ; « conflict » devient
 * une erreur lisible. L'écran confirme seulement après ce résultat.
 */
export function useCompleteToday() {
  const respond = useRespondMission();
  const save = useSaveTask();
  const complete = async (x: TodayTask): Promise<RespondResultStatus> => {
    if (x.kind === 'mission') {
      const out = await respond.mutateAsync({ id: x.id, action: 'complete', version: x.version });
      if (out?.status === 'conflict') throw new Error(tr('ht.conflict'));
      return out?.unchanged ? 'unchanged' : 'ok';
    }
    await save.mutateAsync({ id: x.id, input: { status: 'done' } });
    return 'ok';
  };
  const accept = async (x: TodayTask): Promise<RespondResultStatus> => {
    const out = await respond.mutateAsync({ id: x.id, action: 'accept', version: x.version });
    if (out?.status === 'conflict') throw new Error(tr('ht.conflict'));
    return out?.unchanged ? 'unchanged' : 'ok';
  };
  return { complete, accept };
}
