/**
 * Outils complétés le 30/11/2026 — accès aux données. Le serveur décide de tout (RLS, migrations 20261130100100…600) :
 *  - langage, jeux, activités, devoirs : parents de l'enfant (périmètre d'enfants respecté) ;
 *  - baromètre du couple : chacun ses jauges + celles que l'autre parent a partagées ;
 *  - examens du parcours fertilité : rendez-vous (mêmes règles que les rendez-vous « pour moi »).
 * Écritures par insertOrQueue (file hors ligne, identifiant posé sur l'appareil) ; une saisie encore en file apparaît
 * tout de suite (« en attente d'envoi »). Rappels : rappels personnels du téléphone (table reminders), retirés par lien.
 */
import { useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { backend, eq } from '../backend';
import { useAuth } from '../auth';
import { insertOrQueue } from '../offline';
import { uuid } from '../uuid';
import { t as tr } from '@/i18n';
import { useHouseholdId, useInvalidate } from './hooks';
import { useRemove, useRowsWithPending, useSave } from './hooks-foyerTools';
import type { LanguageEntry } from '@/features/language/domain';
import type { GameMark } from '@/features/games/domain';
import { reminderSchedules, type ChildActivity } from '@/features/activities/domain';
import { eveReminderAt, type Homework } from '@/features/homework/domain';
import type { BarometerEntry } from '@/features/couple/barometer';
import type { Appointment } from '@/lib/types';

const tz = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris';
const byChild = (childId: string | null) => (childId ? { col: 'child_id', value: childId } : null);

// ---------------------------------------------------------------- 129 Langage
export function useLanguageEntries(childId: string | null) {
  const filter = useMemo(() => byChild(childId), [childId]);
  return useRowsWithPending<LanguageEntry>('child_language_entries', [childId ?? ''], filter, [{ col: 'said_on', asc: false }, { col: 'created_at', asc: false }]);
}
export const useSaveLanguage = () => useSave<Omit<LanguageEntry, 'id'>>('child_language_entries', []);
export const useDeleteLanguage = () => useRemove('child_language_entries');

// ---------------------------------------------------------------- 132 Jeux
export function useGameMarks(childId: string | null) {
  const filter = useMemo(() => byChild(childId), [childId]);
  return useRowsWithPending<GameMark>('child_game_marks', [childId ?? ''], filter, [{ col: 'created_at', asc: true }],
    (r) => ({ ...r, done_count: Number(r.done_count ?? 0) }));
}
export const useSaveGameMark = () => useSave<Omit<GameMark, 'id'>>('child_game_marks', []);

// ---------------------------------------------------------------- 136 Activités
export function useChildActivities(childId: string | null) {
  const filter = useMemo(() => byChild(childId), [childId]);
  return useRowsWithPending<ChildActivity>('child_activities', [childId ?? ''], filter, [{ col: 'created_at', asc: true }]);
}
/** Activités de tous les enfants du foyer (agenda familial, journée) : vide pour une nounou (la RLS ne renvoie rien). */
export function useHouseholdActivities() {
  const hid = useHouseholdId();
  const filter = useMemo(() => (hid ? { col: 'household_id', value: hid } : null), [hid]);
  return useRowsWithPending<ChildActivity>('child_activities', ['household', hid ?? ''], filter, [{ col: 'created_at', asc: true }]);
}
export const useSaveActivity = () => useSave<Omit<ChildActivity, 'id'>>('child_activities', ['reminders']);
export const useDeleteActivity = () => useRemove('child_activities', ['reminders']);

export const activityLink = (a: Pick<ChildActivity, 'id' | 'child_id'>) => `/child/${a.child_id}/activities?a=${a.id}`;
/** Rappels hebdomadaires d'une activité (un par heure de rappel) ; supprimés puis reposés à chaque enregistrement. */
export function useActivityReminder() {
  const { session } = useAuth();
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (a: { activity: Pick<ChildActivity, 'id' | 'child_id' | 'household_id' | 'name' | 'slots' | 'starts_on' | 'ends_on' | 'reminder_minutes'>; remove?: boolean }) => {
      const me = session?.userId;
      if (!me) return;
      const link = activityLink(a.activity);
      await backend.remove('reminders', [eq('deep_link', link), eq('user_id', me)]).catch(() => undefined);
      if (a.remove || !a.activity.reminder_minutes) return;
      for (const s of reminderSchedules(a.activity.slots, a.activity.reminder_minutes)) {
        await insertOrQueue('reminders', {
          id: uuid(), user_id: me, household_id: a.activity.household_id, child_id: a.activity.child_id, category: 'custom',
          title: a.activity.name.slice(0, 80), body: tr('p2.act.remBody', { minutes: a.activity.reminder_minutes }).slice(0, 240),
          schedule: { type: 'weekly', weekdays: s.weekdays, hour: s.hour, minute: s.minute, from: a.activity.starts_on, until: a.activity.ends_on },
          timezone: tz(), enabled: true, deep_link: link,
        });
      }
    },
    onSuccess: () => { void inv('reminders'); },
  });
}

// ---------------------------------------------------------------- 137 Devoirs
export function useHomework(childId: string | null) {
  const filter = useMemo(() => byChild(childId), [childId]);
  return useRowsWithPending<Homework>('child_homework', [childId ?? ''], filter, [{ col: 'due_on', asc: true }, { col: 'created_at', asc: true }]);
}
export const useSaveHomework = () => useSave<Omit<Homework, 'id' | 'done_by'>>('child_homework', ['reminders']);
export const useDeleteHomework = () => useRemove('child_homework', ['reminders']);
export const homeworkLink = (h: Pick<Homework, 'id' | 'child_id'>) => `/child/${h.child_id}/homework?h=${h.id}`;
/**
 * Correction d'un devoir existant (cocher, matière, consigne, échéance) — LE chemin de l'app Devoirs : même écriture
 * (`useSaveHomework`, file hors ligne comprise) puis même mise à jour du rappel de la veille. Utilisé par la case de
 * l'app Devoirs et par la fiche de l'écran École (23/11/2026).
 */
export function useUpdateHomework() {
  const save = useSaveHomework();
  const reminder = useHomeworkReminder();
  return async (h: Homework, patch: Partial<Pick<Homework, 'subject' | 'instructions' | 'due_on' | 'done_at' | 'remind_eve'>>, childName: string) => {
    const { done_by: _d, _pending: _p, ...rest } = h; // eslint-disable-line @typescript-eslint/no-unused-vars
    const next = { ...rest, ...patch };
    const r = await save.mutateAsync(next);
    await reminder.mutateAsync({ hw: next, childName }).catch(() => undefined);
    return r;
  };
}
/** Rappel la veille à 18 h (si le devoir n'est pas fait, que le rappel est voulu et qu'il n'est pas déjà passé). */
export function useHomeworkReminder() {
  const { session } = useAuth();
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (a: { hw: Pick<Homework, 'id' | 'child_id' | 'household_id' | 'subject' | 'due_on' | 'done_at' | 'remind_eve'>; childName: string; remove?: boolean }) => {
      const me = session?.userId;
      if (!me) return;
      const link = homeworkLink(a.hw);
      await backend.remove('reminders', [eq('deep_link', link), eq('user_id', me)]).catch(() => undefined);
      if (a.remove || a.hw.done_at || !a.hw.remind_eve) return;
      const at = eveReminderAt(a.hw.due_on, new Date());
      if (!at) return;
      await insertOrQueue('reminders', {
        id: uuid(), user_id: me, household_id: a.hw.household_id, child_id: a.hw.child_id, category: 'custom',
        title: tr('p2.hw.remTitle', { name: a.childName }).slice(0, 80), body: tr('p2.hw.remBody', { subject: a.hw.subject }).slice(0, 240),
        schedule: { type: 'once', at }, timezone: tz(), enabled: true, deep_link: link,
      });
    },
    onSuccess: () => { void inv('reminders'); },
  });
}

// ---------------------------------------------------------------- 177 Baromètre du couple
export function useBarometer() {
  const hid = useHouseholdId();
  const filter = useMemo(() => (hid ? { col: 'household_id', value: hid } : null), [hid]);
  return useRowsWithPending<BarometerEntry & { _pending?: boolean }>('couple_barometer', [hid ?? ''], filter, [{ col: 'week_of', asc: false }],
    (r) => ({ ...r, level: Number(r.level) as BarometerEntry['level'] }));
}
export const useSaveBarometer = () => useSave<Omit<BarometerEntry, 'id'>>('couple_barometer', []);
export const useDeleteBarometer = () => useRemove('couple_barometer');

// ---------------------------------------------------------------- 27 Examens du parcours fertilité (rendez-vous)
const FERTILITY = { col: 'care_track', value: 'fertility' };
/** Examens datés du parcours fertilité (les miens, et ceux que l'autre parent a partagés), y compris ceux encore en file. */
export function useFertilityExams() {
  return useRowsWithPending<Appointment & { result_note?: string | null; care_track?: string | null; _pending?: boolean }>('appointments', ['fertility'], FERTILITY, [{ col: 'starts_at', asc: true }]);
}
export interface ExamInput {
  id?: string; household_id: string; kind: 'exam' | 'blood_test' | 'ultrasound' | 'consultation'; title: string; starts_at: string;
  location_label: string | null; notes: string | null; result_note: string | null; private_to_creator: boolean; lead: 0 | 60 | 1440;
}
/** Enregistre l'examen (un rendez-vous « pour moi », parcours fertilité) puis son rappel ; tout passe par la file hors ligne. */
export function useSaveExam() {
  const { session } = useAuth();
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (x: ExamInput) => {
      const id = x.id ?? uuid();
      const row = {
        id, household_id: x.household_id, kind: x.kind, title: x.title, starts_at: x.starts_at, location_label: x.location_label, notes: x.notes,
        result_note: x.result_note, for_parent: true, pregnancy_id: null, child_id: null, care_track: 'fertility',
        private_to_creator: x.private_to_creator, shared_with_household: x.private_to_creator ? null : true,
        // nouvel examen : autrice posée tout de suite (le serveur pose la même par défaut ; la démonstration en a besoin pour un examen privé)
        ...(x.id ? {} : { questions: [], ...(session?.userId ? { created_by: session.userId } : {}) }),
      };
      const r = await insertOrQueue('appointments', row, { conflict: 'id', merge: true });
      const me = session?.userId;
      if (me) {
        await backend.remove('reminders', [eq('appointment_id', id), eq('user_id', me)]).catch(() => undefined);
        const at = x.lead ? new Date(Date.parse(x.starts_at) - x.lead * 60_000) : null;
        if (at && at.getTime() > Date.now()) {
          await insertOrQueue('reminders', {
            id: uuid(), user_id: me, household_id: x.household_id, appointment_id: id, category: x.kind === 'ultrasound' ? 'ultrasound' : 'exam',
            // examen privé : rien de son intitulé sur l'écran verrouillé
            title: (x.private_to_creator ? tr('l3.me.appt') : x.title).slice(0, 80), body: null,
            schedule: { type: 'once', at: at.toISOString() }, timezone: tz(), enabled: true, deep_link: '/fertility/exams',
          });
        }
      }
      return { id, queued: r === 'queued' };
    },
    onSuccess: () => { void inv('appointments', 'reminders'); },
  });
}
export function useDeleteExam() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => {
      await backend.remove('appointments', [eq('id', id)]);
      await backend.remove('reminders', [eq('appointment_id', id)]).catch(() => undefined);
    },
    onSuccess: () => { void inv('appointments', 'reminders'); },
  });
}
