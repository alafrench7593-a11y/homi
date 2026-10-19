/** Accès aux données de l'espace « Moi aussi » : symptômes du cycle, boîte de notifications, rappels de rendez-vous. */
import { useMutation, useQuery } from '@tanstack/react-query';
import { backend, eq, isNull } from '../backend';
import { useUserId } from '../auth';
import { useInvalidate, useRows } from './hooks';
import type { Appointment, Reminder } from '../types';

export interface SymptomLog {
  id: string; user_id: string; logged_on: string; symptoms: string[]; note: string | null; created_at: string;
  /** Cycle v2 : clés contrôlées, intensité 1–3, échelles 1–5 (facultatives). */
  symptom_keys?: string[]; intensities?: Record<string, number>; mood?: number | null; energy?: number | null; sleep?: number | null; stress?: number | null;
}

export function useSymptomLogs(limit = 60) {
  const userId = useUserId();
  return useRows<SymptomLog>(['symptom_logs'], userId ? { table: 'symptom_logs', filters: [eq('user_id', userId)], order: [{ col: 'logged_on', asc: false }], limit } : null);
}

/** Marque une notification comme lue (RLS : uniquement les siennes). */
export function useMarkNotificationRead() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => backend.update('notifications', { read_at: new Date().toISOString() }, [eq('id', id), isNull('read_at')]),
    onSuccess: () => inv('notifications'),
  });
}

export function useMarkAllNotificationsRead() {
  const inv = useInvalidate();
  const userId = useUserId();
  return useMutation({
    mutationFn: () => backend.update('notifications', { read_at: new Date().toISOString() }, [eq('user_id', userId), isNull('read_at')]),
    onSuccess: () => inv('notifications'),
  });
}

export function useDeleteNotification() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => backend.remove('notifications', [eq('id', id)]),
    onSuccess: () => inv('notifications'),
  });
}

/** Limite du plan courant (gratuit / abonnement), calculée côté serveur. */
export function usePlanLimit(key: string) {
  const userId = useUserId();
  return useQuery({ queryKey: [userId, 'plan_limits', key, 'subscriptions'], queryFn: () => backend.rpc<number>('plan_limit', { p_key: key }), enabled: !!userId, staleTime: 60_000 });
}

/** Délai du rappel avant un rendez-vous, en minutes. */
export type ReminderLead = 0 | 60 | 180 | 1440;

export function reminderAt(startsAt: string, lead: Exclude<ReminderLead, 0>): string {
  return new Date(new Date(startsAt).getTime() - lead * 60_000).toISOString();
}

/**
 * Crée, remplace ou supprime le rappel ponctuel associé à un rendez-vous.
 * La programmation sur le téléphone se fait ensuite via useReminders (syncLocalReminders).
 */
export async function setAppointmentReminder(appt: Pick<Appointment, 'id' | 'household_id' | 'title' | 'starts_at' | 'kind' | 'private_to_creator'>, lead: ReminderLead, existing: Reminder[]) {
  const mine = existing.filter((r) => r.appointment_id === appt.id);
  if (mine.length) await backend.remove('reminders', [eq('appointment_id', appt.id)]);
  if (lead === 0) return;
  const at = reminderAt(appt.starts_at, lead);
  if (Date.parse(at) <= Date.now()) return; // trop tard pour prévenir
  const when = new Date(appt.starts_at).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  await backend.insert('reminders', {
    household_id: appt.household_id,
    appointment_id: appt.id,
    category: appt.kind === 'ultrasound' ? 'ultrasound' : appt.kind === 'exam' || appt.kind === 'blood_test' ? 'exam' : appt.kind === 'postnatal' || appt.kind === 'perineal_rehab' ? 'postnatal' : 'appointment',
    // Rendez-vous privé : rien de son intitulé sur l'écran verrouillé
    title: appt.private_to_creator ? 'Rendez-vous' : appt.title.slice(0, 80),
    body: `Rendez-vous ${when}`.slice(0, 240),
    schedule: { type: 'once', at },
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris',
    enabled: true,
    deep_link: '/appointments',
  });
}

/** Retrouve le délai d'un rappel existant (pour pré-remplir la feuille d'édition). */
export function leadOf(reminder: Reminder | undefined, startsAt: string): ReminderLead {
  if (!reminder || reminder.schedule.type !== 'once') return 0;
  const diff = Math.round((Date.parse(startsAt) - Date.parse(reminder.schedule.at)) / 60_000);
  return ([60, 180, 1440] as const).find((l) => Math.abs(l - diff) < 2) ?? 60;
}
