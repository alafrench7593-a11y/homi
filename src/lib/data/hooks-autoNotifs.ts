/**
 * Notifications automatiques (07/11/2026) : réglages (sur ce téléphone) et synchronisation dès que les rendez-vous,
 * les tâches, les échéances ou les papiers changent. Validation des rappels (« C'est fait ») : daily_checks.
 */
import { useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { backend, eq } from '../backend';
import { useUserId } from '../auth';
import { useAppointments, useChildren, useInvalidate, useReminders, useRows } from './hooks';
import { useFamilyTasks } from './hooks-family-load';
import { useFamilyPapers, usePrepDone } from './hooks-mental';
import { DEFAULT_AUTO_PREFS, planAutoNotifications, type AutoPrefs, type AutoTexts } from '../domain/autoNotifs';
import { upcomingPrep } from '../domain/mentalLoad';
import { remindersOn } from '../domain/myDay';
import { useDoseLogsSince } from './hooks-myTreatments';
import { useBottleTimers } from './hooks-bottle';
import { insertOrQueue } from '../offline';
import { babyWidgetContent } from '@/widgets/babyWidgetContent';
import { BRAND } from '@/config/brand';
import { syncBabyWidget } from '@/widgets/syncBabyWidget';
import { addDays, todayISO } from '../domain/dates';
import { getAutoPrefs, setAutoPrefs, syncAutoNotifications } from '../notifications';
import { formatTime, t as tr, type TKey } from '@/i18n';

export function useAutoPrefs() {
  return useQuery({ queryKey: ['auto-notif-prefs'], queryFn: getAutoPrefs, staleTime: Infinity, placeholderData: DEFAULT_AUTO_PREFS });
}
export function useSaveAutoPrefs() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: setAutoPrefs, onSuccess: (_d, p) => qc.setQueryData(['auto-notif-prefs'], p) });
}

const texts = (): AutoTexts => ({
  apptEve: (title, time) => ({ title: tr('nt.apptEveT', { title }), body: tr('nt.apptEveB', { time }) }),
  apptSoon: (title, time) => ({ title: tr('nt.apptSoonT', { title }), body: tr('nt.apptSoonB', { time }) }),
  apptPrivate: tr('l3.me.appt'),
  task: (title) => ({ title, body: tr('nt.taskB') }),
  prep: (title) => ({ title, body: tr('nt.prepB') }),
  paper: (title, days) => ({ title: tr('nt.paperT', { title }), body: tr('nt.paperB', { count: days }) }),
  dose: (time) => ({ title: tr('med.followT'), body: tr('med.followB', { time }) }),
  mood: () => ({ title: tr('ms.weeklyT'), body: tr('ms.weeklyB') }),
});

const localStart = (day: string) => { const [y, m, d] = day.split('-').map(Number); return new Date(y, m - 1, d, 0, 0, 0, 0); };
const atLocal = (day: string, hm: string) => { const [y, m, d] = day.split('-').map(Number); const [h, mi] = hm.split(':').map(Number); return new Date(y, m - 1, d, h, mi, 0, 0); };

/** À monter une fois (barre d'onglets) : reprogramme dès que quelque chose change. */
export function useAutoNotificationsSync() {
  const me = useUserId();
  const { data: prefs } = useAutoPrefs();
  const appointments = useAppointments({ upcomingOnly: true }).data;
  const reminders = useReminders().data;
  const tasks = useFamilyTasks().data;
  const papers = useFamilyPapers().data;
  const prepDone = usePrepDone().data;
  const children = useChildren().data;
  const today = todayISO();
  const doseLogs = useDoseLogsSince(localStart(today).toISOString());
  const plans = useMemo(() => {
    if (!prefs || !appointments || !tasks) return null;
    const done = new Set((prepDone ?? []).map((d) => `${d.key}|${d.occurs_on}`));
    const prep = upcomingPrep(today, children ?? [], (papers ?? []) as never)
      .filter((it) => it.kind !== 'paper' && !done.has(`${it.key}|${it.occursOn}`))
      .map((it) => {
        const lead = addDays(it.occursOn, -it.leadDays);
        return { key: `${it.key}-${it.occursOn}`, title: tr(`cm.prep.${it.kind}` as TKey, { name: it.label ?? '' }), notifyOn: lead > today ? lead : addDays(today, 1) };
      });
    // Prises prévues aujourd'hui et demain d'après MES rappels de traitement (enfant ou moi)
    const handled = new Set([...(doseLogs.child ?? []), ...(doseLogs.mine ?? [])].filter((l) => l.status !== 'snoozed').map((l) => `${l.treatment_id}|${new Date(l.scheduled_for).getTime()}`));
    const medRems = (reminders ?? []).filter((r) => (r.treatment_id || r.my_treatment_id) && (!me || r.user_id === me));
    const doses = doseLogs.loaded ? [today, addDays(today, 1)].flatMap((day) => remindersOn(medRems as never, day).filter((it) => it.time && !it.every).map((it) => {
      const r = medRems.find((x) => x.id === it.refId)!;
      const planned = atLocal(day, it.time!);
      const treatmentId = (r.treatment_id ?? r.my_treatment_id)!;
      return { treatmentId, source: (r.treatment_id ? 'treatment' : 'my_treatment') as 'treatment' | 'my_treatment', householdId: r.household_id, scheduledFor: planned.toISOString(),
        url: r.deep_link ?? '/medications', handled: handled.has(`${treatmentId}|${planned.getTime()}`) };
    })) : [];
    const paperRows = (papers ?? []).filter((p) => p.expires_on).map((p) => ({ id: p.id, title: tr(`cm.pp.k.${p.kind}` as TKey), expires_on: p.expires_on! }));
    return planAutoNotifications({
      now: new Date(), me, appointments, tasks, prep, papers: paperRows, doses,
      appointmentsWithReminder: new Set((reminders ?? []).map((r) => r.appointment_id).filter(Boolean) as string[]),
    }, prefs, texts());
  }, [prefs, appointments, reminders, tasks, papers, prepDone, children, today, me, doseLogs.child, doseLogs.mine, doseLogs.loaded]);
  const key = plans ? JSON.stringify(plans.map((p) => [p.id, p.at.toISOString(), p.title])) : null;
  useEffect(() => { if (plans) void syncAutoNotifications(plans).catch(() => undefined); }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  // Widget « Bébé » (iOS) : heures du prochain biberon et de la prochaine prise ; discret sauf choix contraire
  const timers = useBottleTimers().data;
  const widget = useMemo(() => {
    if (!prefs) return null;
    const names = new Map((children ?? []).map((c) => [c.id, c.first_name]));
    const medRems = (reminders ?? []).filter((r) => (r.treatment_id || r.my_treatment_id) && (!me || r.user_id === me));
    const doses = [today, addDays(today, 1)].flatMap((day) => remindersOn(medRems as never, day).filter((it) => it.time && !it.every).map((it) => {
      const r = medRems.find((x) => x.id === it.refId)!;
      return { at: atLocal(day, it.time!), who: r.child_id ? names.get(r.child_id) ?? '' : tr('med.me') };
    }));
    return babyWidgetContent({
      detailed: prefs.widgetDetails, now: new Date(),
      bottles: (timers ?? []).map((t) => ({ due_at: t.due_at, childName: names.get(t.child_id) ?? '' })),
      doses, fmt: (d) => formatTime(d),
    }, { appName: BRAND.name, open: tr('c3.widget.open'), bottle: (time, name) => tr('wb.bottle', { time, name }), dose: (time, who) => tr('wb.dose', { time, who }), nothing: tr('wb.nothing') });
  }, [prefs, children, reminders, timers, today, me]);
  const wkey = widget ? JSON.stringify(widget) : null;
  useEffect(() => { if (widget) void syncBabyWidget(widget); }, [wkey]); // eslint-disable-line react-hooks/exhaustive-deps
  return plans;
}

// ---------------------------------------------------------------- « C'est fait » sur un rappel
export interface DailyCheck { id: string; user_id: string; reminder_id: string; on_date: string; done_at: string; source: string }
export function useDailyChecks(day: string) {
  const uid = useUserId();
  return useRows<DailyCheck>(['daily_checks', uid ?? '', day], uid ? { table: 'daily_checks', filters: [eq('user_id', uid), eq('on_date', day)] } : null);
}
export function useToggleReminderDone() {
  const inv = useInvalidate();
  const uid = useUserId();
  return useMutation({
    mutationFn: async (v: { reminderId: string; day: string; done: boolean; checkId?: string }) => {
      // Hors connexion : la validation est gardée sur le téléphone et envoyée au retour du réseau
      if (v.done) return insertOrQueue('daily_checks', { user_id: uid, reminder_id: v.reminderId, on_date: v.day, source: 'app' }, { conflict: 'user_id,reminder_id,on_date' });
      if (v.checkId) await backend.remove('daily_checks', [eq('id', v.checkId)]);
      return 'sent' as const;
    },
    onSuccess: () => inv('daily_checks'),
  });
}
export function useToggleTaskDone() {
  const inv = useInvalidate();
  const uid = useUserId();
  return useMutation({
    mutationFn: (v: { taskId: string; done: boolean }) => backend.update('family_tasks',
      v.done ? { status: 'done', done_at: new Date().toISOString(), done_by: uid } : { status: 'todo', done_at: null, done_by: null }, [eq('id', v.taskId)]),
    onSuccess: () => inv('family_tasks'),
  });
}
