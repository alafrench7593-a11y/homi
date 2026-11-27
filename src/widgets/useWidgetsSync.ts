/**
 * Alimente les six widgets iOS (27/11/2026, App Review 4.4) avec les données que l'app a déjà en cache :
 * aucune requête dédiée aux widgets, aucun appel IA. Monté une fois dans les onglets (compte connecté).
 * Le cache se rafraîchit au retour au premier plan (focusManager) et après chaque saisie (invalidation) :
 * la frise du widget suit sans délai, y compris les saisies du coparent dès qu'elles sont chargées.
 */
import { useEffect, useMemo, useState } from 'react';
import { BRAND } from '@/config/brand';
import { t as tr, type TKey } from '@/i18n';
import { useAuth } from '@/lib/auth';
import { useActivePregnancy, useActiveSubject, useAppointments, useLogs, usePeriods, useTrackedChildren } from '@/lib/data/hooks';
import { useLastBottle, useBottleTimer } from '@/lib/data/hooks-bottle';
import { useCyclePreferences } from '@/lib/data/hooks-cycle';
import { useContraceptionLogs } from '@/lib/data/hooks-cycle3';
import { useContraceptionMethods } from '@/lib/data/hooks-fertility';
import { useFamilyTasks } from '@/lib/data/hooks-family-load';
import { estimateCycle } from '@/lib/domain/cycle';
import { cycleDayOn } from '@/lib/domain/cycleV2';
import { feedMinutes, lastFeed } from '@/lib/domain/breastSession';
import { pregnancyProgress } from '@/lib/domain/pregnancy';
import { nextAppt } from '@/lib/domain/pregTrack';
import { todayISO } from '@/lib/domain/dates';
import { useUiStore } from '@/lib/store';
import { useBackendMode } from '@/lib/demoMode';
import type { Breastfeed, Sleep } from '@/lib/types';
import { babyEntries, cycleEntries, planningEntries, pregnancyEntries, sleepEntries, tasksEntries } from './model';
import { pushWidget, registerWidgets, subscribeRefresh } from './push';

const url = (path: string) => `${BRAND.scheme}://${path.replace(/^\//, '')}`;
const dayLetter = (d: Date) => {
  try { return d.toLocaleDateString(undefined, { weekday: 'short' }).replace('.', ''); } catch { return String(d.getDay()); }
};

export function useWidgetsSync(): void {
  const { session } = useAuth();
  const me = session?.userId ?? null;
  // Confidentialité (réglages propres à l'appareil) : prénoms / intitulés ; cycle et grossesse détaillés
  const discreet = useUiStore((s) => s.widgetsPrivate);
  const detailed = useUiStore((s) => s.cycleWidgetDetailed);
  const homeChildId = useUiStore((s) => s.homeChildId);
  // « Découvrir sans compte » : données d'exemple de l'appareil, signalées « Démo » sur chaque widget
  const { isDemo } = useBackendMode();

  // ---------- enfant suivi : celui de l'accueil, sinon le profil actif, sinon le premier enfant suivi
  const { data: children } = useTrackedChildren();
  const { subject } = useActiveSubject();
  const child = useMemo(() => {
    const list = children ?? [];
    return list.find((c) => c.id === homeChildId) ?? list.find((c) => subject?.type === 'child' && c.id === subject.id) ?? list[0] ?? null;
  }, [children, homeChildId, subject]);
  const cid = child?.id ?? null;
  const others = Math.max(0, (children?.length ?? 0) - 1);

  const lastBottle = useLastBottle(cid);
  const bottles = useLogs<{ at: string; consumed_ml: number | null; prepared_ml: number | null; in_progress?: boolean | null }>('bottle', cid, 7, { includePending: true });
  const timer = useBottleTimer(cid);
  const feeds = useLogs<Breastfeed>('breastfeed', cid, 2, { includePending: true });
  const sleeps = useLogs<Sleep>('sleep', cid, 8, { includePending: true });
  const periods = usePeriods();
  const { prefs: cyclePrefs } = useCyclePreferences();
  const methods = useContraceptionMethods();
  const contraLogs = useContraceptionLogs(60);
  const pregnancy = useActivePregnancy();
  const appts = useAppointments({ upcomingOnly: true });
  const tasks = useFamilyTasks();

  const nowMin = Math.floor(Date.now() / 60_000); // recalcul au plus une fois par minute de rendu
  const base = (title: TKey, msg: TKey, path: string) => ({ title: isDemo ? `${tr(title)} · ${tr('wg.demo')}` : tr(title), msg: tr(msg), url: url(path) });

  // ---------- Bébé
  const baby = useMemo(() => {
    const now = new Date();
    const lf = cid && feeds.data ? lastFeed(feeds.data as never, cid, now) : null;
    const input = cid ? {
      childName: child?.first_name ?? null, otherChildren: others,
      bottles: bottles.data ?? [], lastBottle: lastBottle ?? null,
      nextBottleAt: timer.active?.due_at ?? null,
      lastFeed: lf ? { startedAt: lf.feed.started_at, ongoing: lf.ongoing, side: (lf.feed as Breastfeed).side ?? null, minutes: feedMinutes(lf.feed, now).total } : null,
    } : null;
    return babyEntries(input, base('wg.baby.title', cid ? 'wg.baby.empty' : 'wg.baby.noChild', cid ? `/bottle/${cid}` : '/'), {
      now, discreet, dayLetter, fallbackName: tr('wg.baby.name'), more: (n) => tr('wg.more', { count: n }),
      side: (s) => tr(s === 'left' ? 'wg.left' : s === 'right' ? 'wg.right' : 'wg.both'),
    }, {
      lastBottle: tr('wg.baby.lastBottle'), lastFeed: tr('wg.baby.lastFeed'), today: tr('wg.today'), next: tr('wg.baby.next'), ml: 'ml', min: 'min',
      feeds: tr('wg.baby.feeds'), week: tr('wg.baby.week'), avg: tr('wg.avg'), ongoing: tr('wg.baby.ongoing'), none: tr('wg.none'),
    });
  }, [cid, child?.first_name, others, bottles.data, lastBottle, timer.active?.due_at, feeds.data, discreet, nowMin, isDemo]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- Sommeil
  const sleep = useMemo(() => {
    const now = new Date();
    return sleepEntries(cid ? { childName: child?.first_name ?? null, otherChildren: others, sleeps: (sleeps.data ?? []) as never } : null,
      base('wg.sleep.title', cid ? 'wg.sleep.empty' : 'wg.baby.noChild', cid ? `/sleep/${cid}` : '/'),
      { now, discreet, dayLetter, fallbackName: tr('wg.baby.name'), more: (n) => tr('wg.more', { count: n }) },
      { asleep: tr('wg.sleep.asleep'), awake: tr('wg.sleep.awake'), today: tr('wg.today'), naps: tr('wg.sleep.naps'), last: tr('wg.sleep.last'), week: tr('wg.sleep.week'), avg: tr('wg.avg'), h: tr('wg.h'), none: tr('wg.none') });
  }, [cid, child?.first_name, others, sleeps.data, discreet, nowMin, isDemo]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- Cycle (discret par défaut ; « protégé » si masqué ou verrouillé dans l'app)
  const cycle = useMemo(() => {
    const now = new Date();
    const list = (periods.data ?? []).map((p) => ({ ...p }));
    const today = todayISO(now);
    const est = list.length ? estimateCycle(list, today) : null;
    const pillMethod = (methods.data ?? []).find((m) => m.active && m.method === 'pill');
    const taken = (contraLogs.data ?? []).some((x) => x.kind === 'pill_taken' && x.logged_on === today);
    const input = est ? {
      periods: list, nextPeriod: est.nextPeriod, averageLength: est.averageLength, fertileWindow: est.fertileWindow,
      cycleDayOn: (iso: string) => cycleDayOn(list as never, iso), pill: pillMethod ? { active: true, takenToday: taken } : null,
      hidden: !!cyclePrefs.hide_on_home || cyclePrefs.lock_mode === 'cycle',
    } : null;
    const d = detailed;
    return cycleEntries(input, base(d ? 'wg.cycle.title' : 'wg.cycle.titleD', d ? 'wg.cycle.empty' : 'wg.cycle.emptyD', '/cycle'), { now, detailed: d }, {
      day: tr('wg.cycle.day'), next: tr('wg.cycle.next'), nextDiscreet: tr('wg.cycle.nextD'), days: tr('wg.days'), today: tr('wg.today'),
      fertile: tr('wg.cycle.fertile'), fertileSoon: tr('wg.cycle.fertileSoon'), pill: tr(d ? 'wg.cycle.pill' : 'wg.cycle.pillD'),
      pillDone: tr(d ? 'wg.cycle.pillDone' : 'wg.cycle.pillDoneD'), pillTodo: tr(d ? 'wg.cycle.pillTodo' : 'wg.cycle.pillTodoD'), none: tr('wg.none'),
    }).map((e) => (e.props.s === 'locked' ? { ...e, props: { ...e.props, msg: tr('wg.cycle.locked') } } : e));
  }, [periods.data, methods.data, contraLogs.data, cyclePrefs.hide_on_home, cyclePrefs.lock_mode, detailed, nowMin, isDemo]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- Grossesse (discrète par défaut)
  const preg = useMemo(() => {
    const now = new Date();
    const due = pregnancy?.due_date ?? null;
    const appt = pregnancy ? nextAppt((appts.data ?? []).filter((a) => a.pregnancy_id === pregnancy.id), now) : null;
    const d = detailed;
    return pregnancyEntries(due ? {
      dueDate: due, progressOn: (iso) => pregnancyProgress(due, iso), nextAppt: appt ? { at: appt.starts_at, title: appt.title } : null,
    } : null, base(d ? 'wg.preg.title' : 'wg.preg.titleD', d ? 'wg.preg.empty' : 'wg.preg.emptyD', '/pregnancy'), { now, detailed: d }, {
      week: tr('wg.preg.week'), weekDiscreet: tr('wg.preg.weekD'), tri: tr('wg.preg.tri'), toDue: tr('wg.preg.toDue'), toDueDiscreet: tr('wg.preg.toDueD'),
      appt: tr('wg.appt'), apptDiscreet: tr('wg.appt'), none: tr('wg.none'), days: tr('wg.days'),
    });
  }, [pregnancy?.id, pregnancy?.due_date, appts.data, detailed, nowMin, isDemo]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- Tâches de la famille (lecture seule)
  const fam = useMemo(() => tasksEntries(tasks.data ?? null, base('wg.tasks.title', 'wg.tasks.empty', '/family'), { now: new Date(), me, discreet, dayLetter }, {
    open: tr('wg.tasks.open'), done: tr('wg.tasks.done'), mine: tr('wg.tasks.mine'), late: tr('wg.tasks.late'), week: tr('wg.tasks.week'),
    none: tr('wg.none'), noDue: tr('wg.tasks.noDue'), hidden: tr('wg.tasks.hidden'),
  }), [tasks.data, me, discreet, nowMin, isDemo]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- Planning (prochains rendez-vous du foyer visibles par ce compte)
  const plan = useMemo(() => planningEntries(appts.data ?? null, base('wg.plan.title', 'wg.plan.empty', '/calendar'), { now: new Date(), discreet }, {
    next: tr('wg.appt'), week: tr('wg.plan.week'), today: tr('wg.today'), none: tr('wg.none'), hidden: tr('wg.plan.hidden'), in: tr('wg.plan.in'),
  }), [appts.data, discreet, nowMin, isDemo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Raccourcis d'ajout (moyen et grand formats) : ouvrent la saisie dans l'app (synchronisée avec le coparent)
  const withActions = <T extends { props: object }>(list: T[], actions: { t: string; u: string }[]) => list.map((e) => ({ ...e, props: { ...e.props, actions } }));
  const asleep = (sleep[0]?.props as { asleep?: boolean } | undefined)?.asleep;
  const babyA = cid ? [{ t: tr('wg.act.bottle'), u: url(`/track/bottle?child=${cid}`) }, { t: tr('wg.act.feed'), u: url(`/track/breastfeed?child=${cid}`) }] : [];
  const sleepA = cid ? [asleep ? { t: tr('wg.act.wake'), u: url(`/sleep/${cid}`) } : { t: tr('wg.act.nap'), u: url(`/track/sleep?child=${cid}`) }] : [];
  const cycleA = [{ t: tr(detailed ? 'wg.act.cycle' : 'wg.act.note'), u: url('/cycle') }];
  const pregA = [{ t: tr(detailed ? 'wg.act.preg' : 'wg.act.note'), u: url('/pregnancy') }];
  const taskA = [{ t: tr('wg.act.task'), u: url('/family/missions/new') }];
  const planA = [{ t: tr('wg.act.appt'), u: url('/calendar?new=1') }];

  // Envoi uniquement une fois les données chargées (jamais un faux « vide » pendant le chargement)
  const [tick, setTick] = useState(0);
  useEffect(() => { registerWidgets(); }, []);
  // Filet : si une donnée tarde (réseau lent, requête refusée), le widget reçoit quand même un contenu après 6 s
  const [late, setLate] = useState(false);
  useEffect(() => { const t = setTimeout(() => setLate(true), 6000); return () => clearTimeout(t); }, []);
  useEffect(() => subscribeRefresh(() => setTick((n) => n + 1)), []);
  const ready = !!me;
  useEffect(() => { if (ready && (late || !cid || (bottles.data && feeds.data))) pushWidget('BabyWidget', withActions(baby, babyA)); }, [ready, baby, tick, late]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (ready && (late || !cid || sleeps.data)) pushWidget('SleepWidget', withActions(sleep, sleepA)); }, [ready, sleep, tick, late]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (ready && (late || periods.data)) pushWidget('CycleWidget', withActions(cycle, cycleA)); }, [ready, cycle, tick, late]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (ready && (late || appts.data)) pushWidget('PregnancyWidget', withActions(preg, pregA)); }, [ready, preg, tick, late]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (ready && (late || tasks.data)) pushWidget('TasksWidget', withActions(fam, taskA)); }, [ready, fam, tick, late]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (ready && (late || appts.data)) pushWidget('PlanningWidget', withActions(plan, planA)); }, [ready, plan, tick, late]); // eslint-disable-line react-hooks/exhaustive-deps
}
