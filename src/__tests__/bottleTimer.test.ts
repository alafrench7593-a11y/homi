/** Minuteur biberon : logique pure (échéances absolues, report, remplacement, changement d'heure) + moteur local. */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import { createDemoBackend } from '@/lib/backend/demo';
import { eq } from '@/lib/backend/types';
import {
  activeTimerFor, atClock, bottleDraftDefaults, cancelTimer, computeDueAt, DELAY_PRESETS, elapsedMinutes, formatClock, formatHM, formatRemaining,
  lastIntervalFor, markBottleGiven, modifyInterval, newTimer, notificationContent, parseDelay, planReplacement, remainingMinutes,
  resolveReminderChoice, snoozeTimer, timerProgress, timerSentence, updateLastBottleTime, type TimerCore,
} from '@/lib/domain/bottleTimer';
import { consultationSummary, dailySummaries, withIntervals } from '@/lib/domain/bottleHistory';
import type { BottleTimer } from '@/lib/types-bottle';
import type { Child } from '@/lib/types';

const PARIS = 'Europe/Paris';
const at = (iso: string) => new Date(iso);

describe('échéance et délai de 3 h 30', () => {
  const now = at('2026-10-16T09:15:00Z'); // 11 h 15 à Paris
  const timer = { ...newTimer({ childId: 'lina', lastBottleAt: now, intervalMinutes: 210, plannedMl: 150 }, now), id: 't1' };

  it('calcule l’échéance absolue : dernier biberon + 3 h 30', () => {
    expect(timer.due_at).toBe('2026-10-16T12:45:00.000Z');
    expect(formatClock(timer.due_at, PARIS)).toBe('14 h 45');
    expect(timer.status).toBe('active');
    expect(timer.planned_ml).toBe(150);
  });

  it('formate « 3 h 30 », « 3 h 05 », « 2 h », « 45 min »', () => {
    expect(formatHM(210)).toBe('3 h 30');
    expect(formatHM(185)).toBe('3 h 05');
    expect(formatHM(120)).toBe('2 h');
    expect(formatHM(45)).toBe('45 min');
    expect(formatHM(-12)).toBe('12 min');
    expect(formatRemaining(209.2)).toBe('3 h 30'); // jamais d'annonce prématurée
    expect(DELAY_PRESETS.map((p) => p.label)).toEqual(['2 h', '2 h 30', '3 h', '3 h 30', '4 h']);
  });

  it('construit la phrase française de l’écran du minuteur', () => {
    expect(timerSentence({ childName: 'Lina', timer, now, timeZone: PARIS }))
      .toBe('Prochain rappel pour Lina dans 3 h 30, à 14 h 45. Quantité enregistrée : 150 ml.');
    const later = at('2026-10-16T13:00:00Z');
    expect(timerSentence({ childName: 'Lina', timer, now: later, timeZone: PARIS })).toBe('Le rappel pour Lina était prévu à 14 h 45 (il y a 15 min). Quantité enregistrée : 150 ml.');
    expect(timerSentence({ childName: 'Lina', timer: { ...timer, planned_ml: null }, now, timeZone: PARIS })).toBe('Prochain rappel pour Lina dans 3 h 30, à 14 h 45.');
  });

  it('temps écoulé, temps restant et avancement en temps réel', () => {
    const t1 = at('2026-10-16T10:15:00Z');
    expect(elapsedMinutes(timer, t1)).toBe(60);
    expect(remainingMinutes(timer, t1)).toBe(150);
    expect(timerProgress(timer, t1)).toBeCloseTo(60 / 210);
  });

  it('rappel le lendemain : « demain à … »', () => {
    const evening = at('2026-10-16T20:30:00Z'); // 22 h 30
    const t = newTimer({ childId: 'lina', lastBottleAt: evening, intervalMinutes: 210 }, evening);
    expect(atClock(t.due_at, evening, PARIS)).toBe('demain à 2 h 00');
  });

  it('notification : texte avec la seule quantité enregistrée, lien vers le bon enfant', () => {
    expect(notificationContent('Lina', 150)).toEqual({ title: 'Biberon de Lina', body: 'Rappel choisi pour Lina : le prochain biberon était prévu maintenant.' });
    expect(notificationContent('Lina', 150, true).body).toBe('Rappel choisi pour Lina : le prochain biberon était prévu maintenant. Quantité notée : 150 ml.');
    expect(notificationContent('Lina', null, true).body).toBe('Rappel choisi pour Lina : le prochain biberon était prévu maintenant.');
  });
});

describe('modifier, mettre à jour, reporter, annuler', () => {
  const now = at('2026-10-16T09:00:00Z');
  const base: TimerCore = { ...newTimer({ childId: 'lina', lastBottleAt: now, intervalMinutes: 180 }, now), id: 't1' };

  it('modifier le délai recalcule à partir du dernier biberon', () => {
    const p = modifyInterval(base, 210);
    expect(p).toEqual({ interval_minutes: 210, due_at: '2026-10-16T12:30:00.000Z' });
    expect(() => modifyInterval(base, 5)).toThrow(/10 minutes et 12 heures/);
    expect(() => modifyInterval(base, 13 * 60)).toThrow();
  });

  it('mettre à jour l’heure du dernier biberon déplace l’échéance', () => {
    const p = updateLastBottleTime(base, at('2026-10-16T09:30:00Z'), at('2026-10-16T10:00:00Z'));
    expect(p).toEqual({ last_bottle_at: '2026-10-16T09:30:00.000Z', due_at: '2026-10-16T12:30:00.000Z' });
    expect(() => updateLastBottleTime(base, at('2026-10-16T11:00:00Z'), at('2026-10-16T10:00:00Z'))).toThrow(/futur/);
  });

  it('reporter de 15 / 30 min ou d’une durée personnalisée', () => {
    expect(snoozeTimer(base, 15, now).due_at).toBe('2026-10-16T12:15:00.000Z');
    expect(snoozeTimer(base, 30, now).due_at).toBe('2026-10-16T12:30:00.000Z');
    expect(snoozeTimer(base, 50, now).due_at).toBe('2026-10-16T12:50:00.000Z');
    // Rappel déjà passé : le report part de maintenant
    expect(snoozeTimer(base, 15, at('2026-10-16T12:40:00Z')).due_at).toBe('2026-10-16T12:55:00.000Z');
    expect(() => snoozeTimer(base, 0, now)).toThrow();
  });

  it('annuler et marquer le biberon comme donné', () => {
    expect(cancelTimer()).toEqual({ status: 'cancelled' });
    expect(markBottleGiven()).toEqual({ status: 'done' });
    expect(timerSentence({ childName: 'Lina', timer: { ...base, ...cancelTimer() }, now })).toBe('Le rappel pour Lina a été annulé.');
  });

  it('lit les durées personnalisées', () => {
    expect(parseDelay('3h30')).toBe(210);
    expect(parseDelay('3 h 30')).toBe(210);
    expect(parseDelay('3:30')).toBe(210);
    expect(parseDelay('2h')).toBe(120);
    expect(parseDelay('45 min')).toBe(45);
    expect(parseDelay('210')).toBe(210);
    expect(parseDelay('5')).toBeNull();
    expect(parseDelay('13h')).toBeNull();
    expect(parseDelay('3h75')).toBeNull();
    expect(parseDelay('abc')).toBeNull();
  });

  it('refuse un dernier biberon dans le futur ou un délai invalide', () => {
    expect(() => newTimer({ childId: 'lina', lastBottleAt: at('2026-10-16T12:00:00Z'), intervalMinutes: 180 }, now)).toThrow(/futur/);
    expect(() => newTimer({ childId: 'lina', lastBottleAt: now, intervalMinutes: 3 }, now)).toThrow();
    expect(() => newTimer({ childId: 'lina', lastBottleAt: now, intervalMinutes: 180, plannedMl: 900 }, now)).toThrow();
  });
});

describe('plusieurs enfants, remplacement sans doublon', () => {
  const now = at('2026-10-16T09:00:00Z');
  const lina = { ...newTimer({ childId: 'lina', lastBottleAt: now, intervalMinutes: 210 }, now), id: 'a', created_at: '2026-10-16T09:00:00Z' };
  const noe = { ...newTimer({ childId: 'noe', lastBottleAt: at('2026-10-16T08:00:00Z'), intervalMinutes: 180 }, now), id: 'b', created_at: '2026-10-16T08:00:00Z' };

  it('deux enfants (jumeaux) ont chacun leur minuteur', () => {
    const timers = [lina, noe];
    expect(activeTimerFor(timers, 'lina')?.id).toBe('a');
    expect(activeTimerFor(timers, 'noe')?.id).toBe('b');
    expect(activeTimerFor(timers, 'lina')?.due_at).not.toBe(activeTimerFor(timers, 'noe')?.due_at);
    expect(formatClock(activeTimerFor(timers, 'noe')!.due_at, PARIS)).toBe('13 h 00');
  });

  it('un nouveau biberon remplace le minuteur actif (clos « donné »), sans en créer un second', () => {
    const next = newTimer({ childId: 'lina', lastBottleAt: at('2026-10-16T12:00:00Z'), intervalMinutes: 180 }, at('2026-10-16T12:00:00Z'));
    const plan = planReplacement(lina, next);
    expect(plan.close).toEqual({ id: 'a', patch: { status: 'done' } });
    expect(plan.create.status).toBe('active');
    expect(planReplacement(lina, next, 'restart').close?.patch.status).toBe('cancelled');
    expect(planReplacement(null, next).close).toBeNull();
    expect(() => planReplacement(noe, next)).toThrow(/autre enfant/);
  });

  it('« Reprendre l’intervalle précédent » : le dernier délai de CET enfant', () => {
    const old = { ...lina, id: 'old', interval_minutes: 150, status: 'done' as const, created_at: '2026-10-15T09:00:00Z' };
    expect(lastIntervalFor([old, lina, noe], 'lina')).toBe(210);
    expect(lastIntervalFor([old, lina, noe], 'noe')).toBe(180);
    expect(lastIntervalFor([], 'lina')).toBeNull();
    expect(resolveReminderChoice({ kind: 'previous', minutes: 210 })).toBe(210);
    expect(resolveReminderChoice({ kind: 'none' })).toBeNull();
  });
});

describe('changement d’heure (Europe/Paris, dernier dimanche d’octobre)', () => {
  it('3 h 30 restent 3 h 30 réellement écoulées au passage à l’heure d’hiver (25 octobre 2026)', () => {
    // 1 h 30 heure d'été (UTC+2) ; à 3 h on recule à 2 h (UTC+1)
    const last = at('2026-10-24T23:30:00Z');
    expect(formatClock(last, PARIS)).toBe('1 h 30');
    const due = computeDueAt(last, 210);
    expect(due.toISOString()).toBe('2026-10-25T03:00:00.000Z');
    expect(due.getTime() - last.getTime()).toBe(210 * 60_000);
    // L'horloge murale n'avance que de 2 h 30 : le rappel est à 4 h 00 (heure d'hiver)
    expect(formatClock(due, PARIS)).toBe('4 h 00');
    expect(timerSentence({ childName: 'Lina', timer: { due_at: due.toISOString(), planned_ml: null, status: 'active' }, now: last, timeZone: PARIS }))
      .toBe('Prochain rappel pour Lina dans 3 h 30, à 4 h 00.');
  });

  it('report à cheval sur le changement d’heure', () => {
    const t = newTimer({ childId: 'lina', lastBottleAt: at('2026-10-24T22:00:00Z'), intervalMinutes: 180 }, at('2026-10-24T22:00:00Z'));
    expect(formatClock(t.due_at, PARIS)).toBe('2 h 00'); // 2 h heure d'été (00:00 UTC)
    const snoozed = snoozeTimer(t, 90, at('2026-10-24T22:30:00Z'));
    expect(snoozed.due_at).toBe('2026-10-25T02:30:00.000Z');
    expect(formatClock(snoozed.due_at, PARIS)).toBe('3 h 30'); // heure d'hiver
  });

  it('passage à l’heure d’été (29 mars 2026) : 3 h de délai, l’horloge avance de 4 h', () => {
    const last = at('2026-03-29T00:00:00Z'); // 1 h 00 (UTC+1)
    const due = computeDueAt(last, 180);
    expect(formatClock(last, PARIS)).toBe('1 h 00');
    expect(formatClock(due, PARIS)).toBe('5 h 00');
  });
});

describe('aucune quantité ni aucun rythme suggérés', () => {
  it('le formulaire démarre sans aucune quantité ni rappel par défaut', () => {
    const d = bottleDraftDefaults();
    expect(d.prepared_ml).toBeNull();
    expect(d.consumed_ml).toBeNull();
    expect(d.planned_next_ml).toBeNull();
    expect(d.reminder).toEqual({ kind: 'none' });
  });

  it('seule la quantité que le parent a enregistrée sur le minuteur pré-remplit le formulaire', () => {
    expect(bottleDraftDefaults({ plannedMl: 150 }).prepared_ml).toBe(150);
    expect(bottleDraftDefaults({ plannedMl: null }).prepared_ml).toBeNull();
  });

  it('aucun texte n’invente de quantité', () => {
    const now = at('2026-10-16T09:00:00Z');
    const t = newTimer({ childId: 'lina', lastBottleAt: now, intervalMinutes: 180 }, now);
    expect(t.planned_ml).toBeNull();
    expect(timerSentence({ childName: 'Lina', timer: t, now })).not.toMatch(/ml/);
    expect(notificationContent('Lina', undefined).body).not.toMatch(/ml/);
  });
});

describe('historique et résumé de consultation', () => {
  const now = at('2026-10-16T18:00:00Z');
  const bottles = [
    { id: '1', at: '2026-10-16T07:00:00Z', prepared_ml: 180, consumed_ml: 150, milk_type: 'Lait 1er âge', note: null, created_by: 'me' },
    { id: '2', at: '2026-10-16T10:30:00Z', prepared_ml: 180, consumed_ml: null, milk_type: null, note: 'Rot difficile', created_by: 'co' },
    { id: '3', at: '2026-10-15T20:00:00Z', prepared_ml: 150, consumed_ml: 150, milk_type: null, note: null, created_by: 'me', planned_next_ml: 180 },
  ];

  it('intervalle depuis le biberon précédent', () => {
    const w = withIntervals(bottles);
    expect(w.map((b) => [b.id, b.interval_minutes])).toEqual([['2', 210], ['1', 660], ['3', null]]);
  });

  it('totaux journaliers descriptifs (jours vides inclus)', () => {
    const s = dailySummaries(bottles, 7, now, PARIS);
    expect(s).toHaveLength(7);
    expect(s[0]).toMatchObject({ key: '2026-10-16', count: 2, consumedTotal: 150, consumedCount: 1, preparedTotal: 360 });
    expect(s[1]).toMatchObject({ key: '2026-10-15', count: 1, consumedTotal: 150 });
    expect(s[6].count).toBe(0);
  });

  it('résumé texte des 7 derniers jours, sans jugement', () => {
    const txt = consultationSummary({ childName: 'Lina', bottles, now, timeZone: PARIS, recordedBy: (u) => (u === 'me' ? 'vous' : 'le coparent') });
    expect(txt).toContain('Biberons de Lina — 7 derniers jours (du 10/10 au 16/10)');
    expect(txt).toContain('Vendredi 16 octobre : 2 biberons · bu : 150 ml (renseigné pour 1) · préparé : 360 ml');
    expect(txt).toContain('12 h 30 : préparé 180 ml · 3 h 30 après le précédent · noté par le coparent — « Rot difficile »');
    expect(txt).toContain('prévu ensuite : 180 ml');
    expect(txt).toContain('aucun biberon enregistré');
    expect(txt).not.toMatch(/suffisant|insuffisant|normal|trop peu|recommand/i);
  });
});

describe('moteur local (démonstration) : un minuteur actif par enfant', () => {
  const db = createDemoBackend();
  let lina: Child;
  let noe: Child;
  const now = new Date();

  it('prépare un foyer avec deux enfants', async () => {
    await db.auth.signUp('minuteur@exemple.test', 'MotDePasse!2026');
    const hid = await db.rpc<string>('create_household', { p_name: 'Test' });
    [lina] = await db.insert<Child>('children', { household_id: hid, first_name: 'Lina', birth_date: '2026-09-01' });
    [noe] = await db.insert<Child>('children', { household_id: hid, first_name: 'Noé', birth_date: '2026-09-01' });
  });

  it('refuse un second minuteur actif pour le même enfant, accepte celui du jumeau', async () => {
    const t = newTimer({ childId: lina.id, lastBottleAt: now, intervalMinutes: 210, plannedMl: 150 }, now);
    const [row] = await db.insert<BottleTimer>('bottle_timers', { ...t });
    expect(row.household_id).toBe(lina.household_id);
    await expect(db.insert('bottle_timers', { ...t })).rejects.toThrow(/déjà actif/);
    await db.insert('bottle_timers', { ...newTimer({ childId: noe.id, lastBottleAt: now, intervalMinutes: 180 }, now) });
    expect(await db.select({ table: 'bottle_timers', filters: [eq('status', 'active')] })).toHaveLength(2);
  });

  it('reporter, puis remplacer : l’ancien est clos et un seul reste actif', async () => {
    const [active] = await db.select<BottleTimer>({ table: 'bottle_timers', filters: [eq('child_id', lina.id), eq('status', 'active')] });
    await db.update('bottle_timers', snoozeTimer(active, 15, now), [eq('id', active.id)]);
    const [snoozed] = await db.select<BottleTimer>({ table: 'bottle_timers', filters: [eq('id', active.id)] });
    expect(Date.parse(snoozed.due_at) - Date.parse(active.due_at)).toBe(15 * 60_000);
    const plan = planReplacement(snoozed, newTimer({ childId: lina.id, lastBottleAt: now, intervalMinutes: 180 }, now));
    await db.update('bottle_timers', plan.close!.patch, [eq('id', plan.close!.id)]);
    await db.insert('bottle_timers', { ...plan.create });
    const all = await db.select<BottleTimer>({ table: 'bottle_timers', filters: [eq('child_id', lina.id)] });
    expect(all.filter((x) => x.status === 'active')).toHaveLength(1);
    expect(all.find((x) => x.id === active.id)?.status).toBe('done');
    await expect(db.update('bottle_timers', { status: 'active' }, [eq('id', active.id)])).rejects.toThrow(/déjà actif/);
  });

  it('enregistre la quantité prévue pour le prochain biberon telle que saisie', async () => {
    await db.insert('bottles', { child_id: lina.id, at: now.toISOString(), prepared_ml: 150, consumed_ml: 120, planned_next_ml: 150 });
    const [b] = await db.select<{ planned_next_ml: number | null; created_by: string }>({ table: 'bottles', filters: [eq('child_id', lina.id)] });
    expect(b.planned_next_ml).toBe(150);
    expect(b.created_by).toBeTruthy();
  });

  it('la famille d’exemple contient un minuteur actif pour Lina', async () => {
    await db.rpc('load_sample_family');
    const kids = await db.select<Child>({ table: 'children', filters: [eq('first_name', 'Lina')] });
    const timers = await db.select<BottleTimer>({ table: 'bottle_timers', filters: [eq('status', 'active')] });
    const sample = kids.find((k) => k.id !== lina.id)!;
    const t = timers.find((x) => x.child_id === sample.id)!;
    expect(t).toBeDefined();
    expect(t.interval_minutes).toBe(210);
    expect(t.planned_ml).toBe(210);
  });
});
