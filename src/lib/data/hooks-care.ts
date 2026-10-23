/**
 * Données de suivi « grossesse et vaccins » :
 *  · symptômes de grossesse (strictement personnels) ;
 *  · rendez-vous confirmés (échographies, vaccination) : date, heure facultative, lieu, note, documents joints ;
 *  · rappels choisis (un mois, deux semaines, une semaine, la veille, quelques heures avant, personnalisé) ;
 *  · calendrier vaccinal en vigueur (versions publiées + version intégrée), doses reportées.
 */
import { useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { backend, eq } from '../backend';
import { useUserId } from '../auth';
import { useHouseholdId, useInvalidate, useRows } from './hooks';
import { resync } from './hooks-settings';
import { useUiStore } from '../store';
import { todayISO, type ISODate } from '../domain/dates';
import { BUNDLED_CALENDARS, DEFAULT_CALENDAR } from '../domain/vaccines';
import { calendarFromRow, selectCalendar, type VaccineCalendar } from '../domain/vaccineRules';
import type { Frequency, Intensity } from '../domain/pregnancyCare';
import type { Appointment, AppointmentKind, Reminder } from '../types';

// ─── Symptômes de grossesse ─────────────────────────────────────────────────────────────────────

export interface PregnancySymptomLog {
  id: string; user_id: string; pregnancy_id: string | null; symptom: string; intensity: Intensity | null; started_at: string | null;
  frequency: Frequency | null; note: string | null; week_sa: number | null; logged_at: string;
}

export function usePregnancySymptoms(limit = 60) {
  const uid = useUserId();
  return useRows<PregnancySymptomLog>(['pregnancy_symptom_logs', uid], uid ? { table: 'pregnancy_symptom_logs', filters: [eq('user_id', uid)], order: [{ col: 'logged_at', asc: false }], limit } : null);
}

export function useSaveSymptoms() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (v: { id?: string; rows: Omit<PregnancySymptomLog, 'id' | 'user_id' | 'logged_at'>[] }) => {
      if (v.id) await backend.update('pregnancy_symptom_logs', v.rows[0], [eq('id', v.id)]);
      else if (v.rows.length) await backend.insert('pregnancy_symptom_logs', v.rows);
    },
    onSuccess: () => inv('pregnancy_symptom_logs'),
  });
}
export function useDeleteSymptom() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (id: string) => backend.remove('pregnancy_symptom_logs', [eq('id', id)]), onSuccess: () => inv('pregnancy_symptom_logs') });
}

// ─── Rendez-vous confirmés ──────────────────────────────────────────────────────────────────────

export type CareAppointment = Appointment & { completed_at?: string | null; calendar_keys?: string[]; document_ids?: string[]; time_set?: boolean };

/** Rendez-vous rattachés au calendrier (échographies d'une grossesse, vaccination d'un enfant). */
export function useCalendarAppointments(f: { pregnancyId?: string | null; childId?: string | null; kind: AppointmentKind }) {
  const id = f.pregnancyId ?? f.childId ?? null;
  const col = f.pregnancyId ? 'pregnancy_id' : 'child_id';
  return useRows<CareAppointment>(['appointments', 'calendar', f.kind, id ?? ''], id ? { table: 'appointments', filters: [eq(col, id), eq('kind', f.kind)], order: [{ col: 'starts_at' }] } : null);
}

export interface AppointmentDraft {
  id?: string;
  kind: AppointmentKind;
  title: string;
  /** Jour (AAAA-MM-JJ) et heure facultative (HH:MM) choisis par la personne. */
  day: ISODate;
  time?: string | null;
  location?: string | null;
  notes?: string | null;
  calendarKeys?: string[];
  documentIds?: string[];
  pregnancyId?: string | null;
  childId?: string | null;
  householdId: string;
}

/** Heure de début : jamais inventée. Sans heure choisie, le rendez-vous est rangé à midi et marqué « heure non précisée ». */
export function startsAt(day: ISODate, time?: string | null): { starts_at: string; time_set: boolean } {
  const m = time?.match(/^(\d{1,2})[:h ]?(\d{2})?$/i);
  const ok = !!m && Number(m[1]) < 24 && Number(m[2] ?? 0) < 60;
  const [y, mo, d] = day.split('-').map(Number);
  const dt = new Date(y, mo - 1, d, ok ? Number(m![1]) : 12, ok ? Number(m![2] ?? 0) : 0, 0, 0);
  return { starts_at: dt.toISOString(), time_set: ok };
}

export function useSaveAppointment() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (a: AppointmentDraft) => {
      const when = startsAt(a.day, a.time);
      const row = {
        kind: a.kind, title: a.title.slice(0, 120), ...when, location_label: a.location?.trim() || null, notes: a.notes?.trim() || null,
        calendar_keys: a.calendarKeys ?? [], document_ids: a.documentIds ?? [],
      };
      if (a.id) { await backend.update('appointments', row, [eq('id', a.id)]); return a.id; }
      const [saved] = await backend.insert<{ id: string }>('appointments', { ...row, household_id: a.householdId, pregnancy_id: a.pregnancyId ?? null, child_id: a.childId ?? null, questions: [] });
      return saved?.id ?? null;
    },
    onSuccess: () => inv('appointments'),
  });
}

export function useDeleteAppointment() {
  const inv = useInvalidate();
  const uid = useUserId();
  return useMutation({
    mutationFn: async (id: string) => {
      await backend.remove('reminders', [eq('appointment_id', id)]).catch(() => undefined);
      await backend.remove('appointments', [eq('id', id)]);
      if (uid) await resync(uid); // les rappels du rendez-vous supprimé sont annulés sur le téléphone
    },
    onSuccess: () => inv('appointments', 'reminders'),
  });
}

export function useSetDocuments() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (v: { table: 'appointments' | 'child_vaccinations'; id: string; ids: string[] }) => backend.update(v.table, { document_ids: v.ids.slice(0, 20) }, [eq('id', v.id)]),
    onSuccess: () => inv('appointments', 'child_vaccinations'),
  });
}

// ─── Rappels ────────────────────────────────────────────────────────────────────────────────────

/** Rappels déjà programmés pour une échéance (clé de lien) : affichés, supprimables. */
export function useLinkedReminders(deepLink: string | null) {
  const uid = useUserId();
  const q = useRows<Reminder>(['reminders', uid, 'linked'], uid ? { table: 'reminders', filters: [eq('user_id', uid)], order: [{ col: 'created_at', asc: false }], limit: 300 } : null);
  return useMemo(() => (q.data ?? []).filter((r) => r.deep_link === deepLink), [q.data, deepLink]);
}

export function useScheduleReminders() {
  const inv = useInvalidate();
  const uid = useUserId();
  const hid = useHouseholdId();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris';
  return useMutation({
    mutationFn: async (v: { dates: Date[]; title: string; body: string; category: Reminder['category']; deepLink: string; childId?: string | null; pregnancyId?: string | null; appointmentId?: string | null; journeyType?: string | null }) => {
      if (!v.dates.length) return 0;
      await backend.insert('reminders', v.dates.map((d) => ({
        user_id: uid, household_id: hid, child_id: v.childId ?? null, pregnancy_id: v.pregnancyId ?? null, appointment_id: v.appointmentId ?? null,
        journey_type: v.journeyType ?? null, category: v.category, title: v.title.slice(0, 80), body: v.body.slice(0, 240),
        schedule: { type: 'once', at: d.toISOString() }, timezone: tz, enabled: true, deep_link: v.deepLink,
      })));
      if (uid) await resync(uid); // notifications locales reprogrammées aussitôt
      return v.dates.length;
    },
    onSuccess: () => inv('reminders'),
  });
}

export function useDeleteReminder() {
  const inv = useInvalidate();
  const uid = useUserId();
  return useMutation({ mutationFn: async (id: string) => { await backend.remove('reminders', [eq('id', id)]); if (uid) await resync(uid); }, onSuccess: () => inv('reminders') });
}

// ─── Calendrier vaccinal versionné ──────────────────────────────────────────────────────────────

interface CalendarRow { country: string; version: string; label: string; effective_from: string; updated_on: string; source_url: string; rules: unknown; published: boolean }

/** Calendrier en vigueur pour le pays choisi : version publiée la plus récente, sinon la version intégrée. */
export function useVaccineCalendar(): { calendar: VaccineCalendar; country: string; supported: boolean } {
  const region = useUiStore((s) => s.region) ?? 'FR';
  const q = useRows<CalendarRow>(['vaccine_calendars', region], { table: 'vaccine_calendars', filters: [eq('published', true)], limit: 50 }, { staleTime: 24 * 3600_000 });
  return useMemo(() => {
    const remote = (q.data ?? []).map((r) => calendarFromRow(r, DEFAULT_CALENDAR)).filter((c): c is VaccineCalendar => !!c);
    const all = [...BUNDLED_CALENDARS, ...remote];
    const own = selectCalendar(all, region, todayISO());
    return { calendar: own ?? selectCalendar(all, 'FR', todayISO()) ?? DEFAULT_CALENDAR, country: region, supported: !!own };
  }, [q.data, region]);
}

export interface VaccinePostponement { id: string; child_id: string; calendar_key: string; postponed_to: string | null; note: string | null }
export function useVaccinePostponements(childId: string | null | undefined) {
  return useRows<VaccinePostponement>(['child_vaccine_postponements', childId ?? ''], childId ? { table: 'child_vaccine_postponements', filters: [eq('child_id', childId)] } : null);
}
export function usePostponeVaccine() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (v: { child: { id: string; household_id: string }; keys: string[]; to: ISODate | null; note: string | null; cancel?: boolean }) => {
      for (const key of v.keys) {
        await backend.remove('child_vaccine_postponements', [eq('child_id', v.child.id), eq('calendar_key', key)]);
        if (!v.cancel) await backend.insert('child_vaccine_postponements', { household_id: v.child.household_id, child_id: v.child.id, calendar_key: key, postponed_to: v.to, note: v.note });
      }
    },
    onSuccess: () => inv('child_vaccine_postponements'),
  });
}
