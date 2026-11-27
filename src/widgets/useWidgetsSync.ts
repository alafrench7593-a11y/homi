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
import { useCareShifts, usePeople } from '@/lib/data/hooks-family-load';
import { useVaccineSchedule } from '@/lib/data/hooks-vaccines';
import { nextDoses } from '@/lib/domain/vaccineRules';
import { useTreatmentLogs, useTreatments } from '@/lib/data/hooks-needs';
import { useMyTreatmentLogs, useMyTreatments } from '@/lib/data/hooks-myTreatments';
import { useChildPhotos } from '@/lib/data/hooks-photos';
import { useMilestones } from '@/lib/data/hooks-family';
import { useLanguageEntries } from '@/lib/data/hooks-partiels2';
import { buildStory } from '@/lib/domain/childStory';
import { childAge } from '@/lib/domain/child';
import { CHILD_PHOTO_BUCKET } from '@/lib/domain/childPhotos';
import { backend } from '@/lib/backend';
import { dosesFor } from '@/features/needs';
import { useRelayStore } from '@/features/relay/relayStore';
import { useRecommendations } from '@/features/homeToday/useRecommendations';
import { useAllToolEntries } from '@/features/hubs/ToolSearch';
import { findEntry } from '@/lib/domain/toolCatalog';
import { reasonText } from '@/lib/personalization';
import { nextStep } from '@/lib/aura/nextStep';
import { defaultThemeFor, themeSuggestions } from '@/features/aura/model';
import { auraEntries, babyEntries, cycleEntries, healthEntries, pickWidgetChild, planningEntries, pregnancyEntries, relayEntries, sleepEntries, storyEntries, tasksEntries } from './model';
import { pushWidget, purgeStoryPhotos, registerWidgets, storyPhotoFile, subscribeRefresh } from './push';

/** Rendez-vous de santé (hors « autre ») : consultations, examens, pédiatre, vaccination, rééducation… */
const HEALTH_KINDS = new Set(['consultation', 'ultrasound', 'exam', 'blood_test', 'pediatric', 'postnatal', 'vaccination', 'perineal_rehab']);

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
  // Enfant choisi pour les widgets (réglage de l'appareil), sinon le comportement de l'accueil
  const widgetChildId = useUiStore((s) => s.widgetChildId);
  const setWidgetChildId = useUiStore((s) => s.setWidgetChildId);
  // « Découvrir sans compte » : données d'exemple de l'appareil, signalées « Démo » sur chaque widget
  const { isDemo } = useBackendMode();

  // ---------- enfant suivi : celui choisi pour les widgets, sinon celui de l'accueil, sinon le profil actif, sinon le premier
  const { data: children } = useTrackedChildren();
  const { subject } = useActiveSubject();
  const child = useMemo(() => pickWidgetChild(children, { widgetChildId, homeChildId, subjectChildId: subject?.type === 'child' ? subject.id : null }),
    [children, widgetChildId, homeChildId, subject]);
  // Choix devenu invalide (enfant retiré, accès perdu, autre compte) : retour au comportement par défaut
  useEffect(() => { if (widgetChildId && children && !children.some((c) => c.id === widgetChildId)) setWidgetChildId(null); }, [widgetChildId, children, setWidgetChildId]);
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
  // Nouveaux widgets : mêmes requêtes (mêmes clés de cache) que les écrans qui les affichent
  const sleeps30 = useLogs<Sleep>('sleep', cid, 30);
  const adviceSeen = useUiStore((s) => s.adviceSeen);
  const { forYou } = useRecommendations();
  const { entries: toolEntries } = useAllToolEntries();
  const shifts = useCareShifts('night');
  const { people } = usePeople();
  const relaySent = useRelayStore((s) => (cid ? s.byChild[cid] ?? null : null));
  const vacc = useVaccineSchedule(child);
  const treatments = useTreatments(cid);
  const myTreatments = useMyTreatments();
  const dayKey = todayISO();
  const dayStartISO = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString(); }, [dayKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const tIds = useMemo(() => (treatments.data ?? []).filter((x) => x.active).map((x) => x.id), [treatments.data]);
  const myIds = useMemo(() => (myTreatments.data ?? []).filter((x) => x.active).map((x) => x.id), [myTreatments.data]);
  const tLogs = useTreatmentLogs(tIds, dayStartISO);
  const myLogs = useMyTreatmentLogs(myIds, dayStartISO);
  const photos = useChildPhotos(cid);
  const milestones = useMilestones(cid);
  const words = useLanguageEntries(cid);

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

  // ---------- Aura : prochaine étape (règles locales), question du thème, priorités du jour — AUCUN appel IA ni crédit
  const aura = useMemo(() => {
    const now = new Date();
    const step = child ? nextStep({ child, severalChildren: (children ?? []).length > 1, sleeps: sleeps30.isLoading ? null : ((sleeps30.data ?? []) as never), now, seen: adviceSeen }) : null;
    const months = child?.birth_date ? childAge(child.birth_date, todayISO(now)).months : null;
    const theme = defaultThemeFor(subject, { childMonths: months });
    const qs = themeSuggestions(theme);
    const q = tr(qs[Math.floor(now.getTime() / 86_400_000) % qs.length]);
    const today = todayISO(now);
    const open = (tasks.data ?? []).filter((x) => x.status === 'todo');
    const lateN = open.filter((x) => x.due_at && Date.parse(x.due_at) < now.getTime()).length;
    const todayN = open.filter((x) => x.due_at && todayISO(new Date(x.due_at)) === today && Date.parse(x.due_at) >= now.getTime()).length;
    const allTools = toolEntries.map((e) => e.tool);
    const tools = forYou.map((r) => {
      const tool = findEntry(allTools, r.id);
      return tool ? { label: tool.label, why: reasonText(r.reason), href: url(tool.href) } : null;
    }).filter((x): x is { label: string; why: string; href: string } => !!x).slice(0, 4);
    return auraEntries({
      step: step ? { title: tr(step.kind === 'first_sleep' ? 'next.firstSleep.why' : 'next.napDay.why'), cta: tr(step.kind === 'first_sleep' ? 'next.firstSleep' : 'next.napDay'), href: url(step.href) } : null,
      // La question s'ouvre PRÉ-REMPLIE dans Aura (draft), jamais envoyée automatiquement : aucun crédit consommé
      question: { text: q, href: url(`/assistant?theme=${theme}&draft=${encodeURIComponent(q)}`) },
      tasks: open.length ? { late: lateN, today: todayN, href: url('/family') } : null,
      appts: (appts.data ?? []).map((a) => ({ title: a.title, at: a.starts_at, href: url('/calendar') })),
      tools,
    }, base('wg.aura.title', 'wg.aura.empty', '/assistant'), {
      now, discreet, askCta: tr('wg.aura.askCta'),
      lateN: (n) => tr('wg.aura.late', { count: n }), todayN: (n) => tr('wg.aura.todayTasks', { count: n }),
    }, { step: tr('wg.aura.step'), ask: tr('wg.aura.ask'), prio: tr('wg.aura.prio'), late: '', today: tr('wg.today'), appt: tr('wg.plan.hidden'), none: tr('wg.none') });
  }, [child, children, sleeps30.data, sleeps30.isLoading, adviceSeen, subject, tasks.data, appts.data, forYou, toolEntries, discreet, nowMin, isDemo]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- Relais : gardes de nuit du foyer + dernier relais transmis depuis cet appareil
  const relay = useMemo(() => relayEntries(me ? {
    shifts: shifts.data ?? [], me, nameOf: (id) => people.find((p) => p.id === id)?.name ?? tr('wg.coparent'), lastSent: relaySent, childName: child?.first_name ?? null,
  } : null, base('wg.relay.title', 'wg.relay.empty', '/family/nights'), { now: new Date(), discreet, you: tr('wg.you'), coparent: tr('wg.coparent'), fallbackName: tr('wg.baby.name') }, {
    now: tr('wg.relay.now'), nobody: tr('wg.relay.nobody'), next: tr('wg.relay.next'), until: tr('wg.relay.until'), sent: tr('wg.relay.sent'),
    events: tr('wg.relay.events'), week: tr('wg.relay.week'), mine: tr('wg.relay.mine'), other: tr('wg.relay.other'), none: tr('wg.none'),
  }), [me, shifts.data, people.map((p) => p.id + p.name).join(), relaySent, child?.first_name, discreet, nowMin, isDemo]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- Santé (discrète par défaut) : jamais le nom d'un médicament, seulement l'heure des prises
  const health = useMemo(() => {
    const now = new Date();
    const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
    const tr1 = treatments.data ?? []; const tr2 = myTreatments.data ?? [];
    const done = (log: { status: string } | null) => !!log && log.status !== 'snoozed';
    const doses = [now, tomorrow].flatMap((d) => [
      ...dosesFor(d, tr1, tLogs.data ?? []).map((x) => ({ at: x.scheduledFor, done: done(x.log) })),
      ...dosesFor(d, tr2, myLogs.data ?? []).map((x) => ({ at: x.scheduledFor, done: done(x.log) })),
    ]);
    const nv = vacc.schedule ? nextDoses(vacc.schedule, 1)[0] ?? null : null;
    const healthAppts = (appts.data ?? []).filter((a) => HEALTH_KINDS.has(a.kind) && (!a.child_id || a.child_id === cid));
    const has = !!cid || tr2.length > 0 || healthAppts.length > 0;
    return healthEntries(has ? {
      childName: child?.first_name ?? null,
      vaccine: nv ? { date: nv.date, label: nv.label, due: nv.state === 'due' } : null,
      appts: healthAppts.map((a) => ({ at: a.starts_at, title: a.title })),
      doses,
    } : null, base('wg.health.title', 'wg.health.empty', cid ? `/child/${cid}/health-tracking` : '/medications'), { now, discreet, detailed, fallbackName: tr('wg.baby.name') }, {
      vaccine: tr('wg.health.vaccine'), due: tr('wg.health.due'), appt: tr('wg.health.appt'), dose: tr('wg.health.dose'), doses: tr('wg.health.doses'), none: tr('wg.none'), allDone: tr('wg.health.allDone'),
    });
  }, [cid, child?.first_name, treatments.data, myTreatments.data, tLogs.data, myLogs.data, vacc.schedule, appts.data, discreet, detailed, nowMin, isDemo]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- Mon histoire : photo souvenir (petite copie locale), âge exact, souvenir de la semaine
  const lastPhoto = useMemo(() => (photos.data ?? []).filter((p) => p.visibility !== 'private')[0] ?? null, [photos.data]);
  const [photoFile, setPhotoFile] = useState<{ id: string; uri: string } | null>(null);
  useEffect(() => {
    // Mode discret ou plus de photo : aucune copie gardée dans le dossier partagé
    if (discreet || (photos.data && !lastPhoto)) { purgeStoryPhotos(); setPhotoFile(null); return; }
    if (!me || !lastPhoto || photoFile?.id === lastPhoto.id) return;
    let alive = true;
    // Le lien signé (5 min) n'est demandé que si la petite copie de CETTE photo manque : aucun téléchargement répété
    void storyPhotoFile(lastPhoto, () => backend.storage.signedUrl(CHILD_PHOTO_BUCKET, lastPhoto.storage_path, 300))
      .then((uri) => { if (alive) setPhotoFile(uri ? { id: lastPhoto.id, uri } : null); });
    return () => { alive = false; };
  }, [me, discreet, lastPhoto?.id, !!photos.data]); // eslint-disable-line react-hooks/exhaustive-deps
  const story = useMemo(() => {
    const now = new Date();
    const birth = child?.birth_date ?? '';
    const pages = birth ? buildStory({ birth, today: todayISO(now), photos: photos.data ?? [], milestones: milestones.data ?? [], words: words.data ?? [], ageLabel: () => '' })
      .flatMap((c) => c.pages).map((p) => ({ date: p.date, title: p.title, text: p.text })) : [];
    const file = lastPhoto && photoFile?.id === lastPhoto.id ? photoFile.uri : '';
    return storyEntries(cid && birth ? {
      childName: child?.first_name ?? null, birth,
      photo: file && lastPhoto ? { file, taken_on: lastPhoto.taken_on, caption: lastPhoto.caption } : null, pages,
    } : null, base('wg.story.title', cid ? 'wg.story.empty' : 'wg.story.noChild', cid ? `/child/${cid}/story` : '/'), {
      now, discreet, ageText: (b, d) => childAge(b, d).label, yearsAgo: (n) => tr('wg.story.yearsAgo', { count: n }), fallbackName: tr('wg.baby.name'),
    }, { age: tr('wg.story.age'), memory: tr('wg.story.memory'), thisWeek: tr('wg.story.thisWeek'), yearsAgo: '', memories: tr('wg.story.memories', { count: pages.length }), none: tr('wg.none'), photo: '' });
  }, [cid, child?.first_name, child?.birth_date, photos.data, milestones.data, words.data, lastPhoto, photoFile, discreet, nowMin, isDemo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Raccourcis d'ajout (moyen et grand formats) : ouvrent la saisie dans l'app (synchronisée avec le coparent)
  const withActions = <T extends { props: object }>(list: T[], actions: { t: string; u: string }[]) => list.map((e) => ({ ...e, props: { ...e.props, actions } }));
  const asleep = (sleep[0]?.props as { asleep?: boolean } | undefined)?.asleep;
  const babyA = cid ? [{ t: tr('wg.act.bottle'), u: url(`/track/bottle?child=${cid}`) }, { t: tr('wg.act.feed'), u: url(`/track/breastfeed?child=${cid}`) }] : [];
  const sleepA = cid ? [asleep ? { t: tr('wg.act.wake'), u: url(`/sleep/${cid}`) } : { t: tr('wg.act.nap'), u: url(`/track/sleep?child=${cid}`) }] : [];
  const cycleA = [{ t: tr(detailed ? 'wg.act.cycle' : 'wg.act.note'), u: url('/cycle') }];
  const pregA = [{ t: tr(detailed ? 'wg.act.preg' : 'wg.act.note'), u: url('/pregnancy') }];
  const taskA = [{ t: tr('wg.act.task'), u: url('/family/missions/new') }];
  const planA = [{ t: tr('wg.act.appt'), u: url('/calendar?new=1') }];
  const auraA = [{ t: tr('wg.act.aura'), u: url('/assistant') }];
  const relayA = [{ t: tr('wg.act.relay'), u: url('/family/relay') }, { t: tr('wg.act.nights'), u: url('/family/nights') }];
  const healthA = [{ t: tr('wg.act.dose'), u: url('/medications') }, ...(cid ? [{ t: tr('wg.act.vaccines'), u: url(`/child/${cid}/vaccines`) }] : [])];
  const storyA = cid ? [{ t: tr('wg.act.photo'), u: url(`/child/${cid}/album`) }] : [];

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
  useEffect(() => { if (ready && (late || (tasks.data && appts.data))) pushWidget('AuraWidget', withActions(aura, auraA)); }, [ready, aura, tick, late]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (ready && (late || shifts.data)) pushWidget('RelayWidget', withActions(relay, relayA)); }, [ready, relay, tick, late]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (ready && (late || (appts.data && myTreatments.data && (!cid || (treatments.data && !vacc.loading))))) pushWidget('HealthWidget', withActions(health, healthA)); }, [ready, health, tick, late]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (ready && (late || !cid || (photos.data && milestones.data))) pushWidget('StoryWidget', withActions(story, storyA)); }, [ready, story, tick, late]); // eslint-disable-line react-hooks/exhaustive-deps
}
