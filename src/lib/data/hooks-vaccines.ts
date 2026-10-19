/**
 * Vaccins d'un enfant : doses notées (registre), rendez-vous de vaccination (prévu, fait), rappels.
 * Les échéances sont calculées par src/lib/domain/vaccines.ts à partir de la date de naissance (dates indicatives).
 */
import { useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { backend, eq } from '../backend';
import { useUserId } from '../auth';
import { useInvalidate, useRows } from './hooks';
import { addMonthsISO, vaccineSchedule, type ScheduledDose } from '../domain/vaccines';
import { todayISO } from '../domain/dates';
import type { Appointment, Child } from '../types';

export interface Vaccination { id: string; child_id: string; vaccine: string; given_on: string; dose_label: string | null; lot: string | null; given_by: string | null; source: 'parent' | 'carnet' | 'professional'; note: string | null; calendar_key: string | null }
export type VaccineAppointment = Appointment & { completed_at?: string | null; calendar_keys?: string[] };

export function useVaccinations(childId: string | null | undefined) {
  return useRows<Vaccination>(['child_vaccinations', childId ?? ''], childId ? { table: 'child_vaccinations', filters: [eq('child_id', childId)], order: [{ col: 'given_on', asc: false }] } : null);
}
export function useVaccineAppointments(childId: string | null | undefined) {
  return useRows<VaccineAppointment>(['appointments', 'vaccination', childId ?? ''], childId ? { table: 'appointments', filters: [eq('child_id', childId), eq('kind', 'vaccination')], order: [{ col: 'starts_at' }] } : null);
}

/** Échéances indicatives de l'enfant, avec ce qui est déjà noté ou prévu. */
export function useVaccineSchedule(child: Child | null | undefined) {
  const v = useVaccinations(child?.id);
  const a = useVaccineAppointments(child?.id);
  const schedule = useMemo<ScheduledDose[] | null>(() => {
    if (!child) return null;
    const done: Record<string, string | null> = {};
    for (const x of v.data ?? []) if (x.calendar_key) done[x.calendar_key] = x.given_on;
    const planned = (a.data ?? []).filter((x) => !x.completed_at).flatMap((x) => x.calendar_keys ?? []);
    return vaccineSchedule(child.birth_date, todayISO(), done, planned);
  }, [child, v.data, a.data]);
  return { schedule, vaccinations: v.data ?? [], appointments: a.data ?? [], loading: v.isLoading || a.isLoading };
}

export function useVaccineActions(child: Child | null | undefined) {
  const inv = useInvalidate();
  const userId = useUserId();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris';
  /** Noter une dose comme faite (saisie du parent, à recopier du carnet). */
  const markDone = useMutation({
    mutationFn: async (v: { doses: ScheduledDose[]; givenOn: string }) => {
      if (!child) return;
      for (const d of v.doses) {
        await backend.insert('child_vaccinations', { child_id: child.id, household_id: child.household_id, vaccine: d.label.slice(0, 120), dose_label: d.dose.slice(0, 60), given_on: v.givenOn, source: 'parent', calendar_key: d.key });
      }
    },
    onSuccess: () => inv('child_vaccinations'),
  });
  /** Annuler une dose notée depuis le calendrier. */
  const undo = useMutation({
    mutationFn: async (key: string) => { if (child) await backend.remove('child_vaccinations', [eq('child_id', child.id), eq('calendar_key', key)]); },
    onSuccess: () => inv('child_vaccinations'),
  });
  /** Rappel une semaine avant la date indicative (ou demain si elle est proche), à 9 h. */
  const remind = useMutation({
    mutationFn: async (v: { title: string; body: string; date: string }) => {
      if (!child) return;
      const at = new Date(`${v.date}T09:00:00`);
      at.setDate(at.getDate() - 7);
      const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(9, 0, 0, 0);
      const when = at.getTime() < Date.now() ? tomorrow : at;
      await backend.insert('reminders', {
        user_id: userId, household_id: child.household_id, child_id: child.id, category: 'appointment', title: v.title.slice(0, 80), body: v.body.slice(0, 240),
        schedule: { type: 'once', at: when.toISOString() }, timezone: tz, enabled: true, deep_link: `/child/${child.id}/vaccines`,
      });
      return when.toISOString();
    },
    onSuccess: () => inv('reminders'),
  });
  /** Prévoir un rendez-vous de vaccination pour une visite (doses du calendrier rattachées). */
  const plan = useMutation({
    mutationFn: async (v: { title: string; startsAt: string; keys: string[]; questions?: string[] }) => {
      if (!child) return;
      await backend.insert('appointments', { household_id: child.household_id, child_id: child.id, kind: 'vaccination', title: v.title.slice(0, 120), starts_at: v.startsAt, calendar_keys: v.keys, questions: v.questions ?? [] });
    },
    onSuccess: () => inv('appointments'),
  });
  /** Rendez-vous fait : marqué « fait » et, si la personne le confirme, les doses prévues sont notées (saisie du parent). */
  const complete = useMutation({
    mutationFn: async (v: { appt: VaccineAppointment; doses: ScheduledDose[] }) => {
      if (!child) return;
      await backend.update('appointments', { completed_at: new Date().toISOString() }, [eq('id', v.appt.id)]);
      const day = v.appt.starts_at.slice(0, 10) <= todayISO() ? v.appt.starts_at.slice(0, 10) : todayISO();
      for (const d of v.doses) {
        await backend.insert('child_vaccinations', { child_id: child.id, household_id: child.household_id, vaccine: d.label.slice(0, 120), dose_label: d.dose.slice(0, 60), given_on: day, source: 'parent', calendar_key: d.key });
      }
    },
    onSuccess: () => inv('appointments', 'child_vaccinations'),
  });
  const saveQuestions = useMutation({
    mutationFn: async (v: { apptId: string; questions: string[] }) => backend.update('appointments', { questions: v.questions }, [eq('id', v.apptId)]),
    onSuccess: () => inv('appointments'),
  });
  return { markDone, undo, remind, plan, complete, saveQuestions };
}

/** Date et heure proposées pour un rendez-vous : la date indicative à 10 h (ou dans 7 jours si elle est passée). */
export function suggestedStart(date: string): string {
  const d = new Date(`${date}T10:00:00`);
  if (d.getTime() < Date.now()) { const n = new Date(); n.setDate(n.getDate() + 7); n.setHours(10, 0, 0, 0); return n.toISOString(); }
  return d.toISOString();
}
export { addMonthsISO };
