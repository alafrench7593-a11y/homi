/** « Mon sommeil » : calculs purs (durées, résumé 7 jours, signaux de soutien, repères) + moteur local. */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import { createDemoBackend } from '@/lib/backend/demo';
import { BackendError, eq } from '@/lib/backend/types';
import { addDays } from '@/lib/domain/dates';
import {
  durationInput, estimateSleepMinutes, fatigueStreak, formatHHMM, napMinutes, nightLabel, nightMinutes, parseDuration, parseHHMM,
  resolveNight, sleepContext, sleepTips, spanMinutes, summarizeWeek, supportSignal, timeOfIso, totalNapMinutes, validateSleepForm, wakingMinutes,
} from '@/lib/domain/parentSleep';
import type { ParentSleepLog } from '@/lib/types-sleep';

const TODAY = '2026-10-15';

function log(p: Partial<ParentSleepLog> & { log_date: string }): ParentSleepLog {
  return {
    id: p.log_date, user_id: 'u', bedtime: null, wake_time: null, night_wakings: 0, waking_details: [], sleep_minutes: null, duration_edited: false,
    naps: [], quality: null, fatigue: null, mood: null, note: null, created_at: '2026-10-01T00:00:00Z', ...p,
  };
}

describe('heures et durées', () => {
  it('lit les heures en saisie libre', () => {
    expect(parseHHMM('22:30')).toBe(1350);
    expect(parseHHMM('7h05')).toBe(425);
    expect(parseHHMM('22h')).toBe(1320);
    expect(parseHHMM('7')).toBe(420);
    expect(parseHHMM('24:00')).toBeNull();
    expect(parseHHMM('7:75')).toBeNull();
    expect(parseHHMM('abc')).toBeNull();
    expect(formatHHMM(425)).toBe('07:05');
    expect(formatHHMM(-30)).toBe('23:30');
  });

  it('lit les durées et les reformate', () => {
    expect(parseDuration('7h30')).toBe(450);
    expect(parseDuration('7 h 05')).toBe(425);
    expect(parseDuration('7:30')).toBe(450);
    expect(parseDuration('7')).toBe(420);
    expect(parseDuration('6,5')).toBe(390);
    expect(parseDuration('45 min')).toBe(45);
    expect(parseDuration('450min')).toBe(450);
    expect(parseDuration('25h')).toBeNull();
    expect(parseDuration('7h75')).toBeNull();
    expect(durationInput(450)).toBe('7h30');
    expect(durationInput(null)).toBe('');
  });

  it('place le coucher la veille ou le jour même', () => {
    const n = resolveNight(TODAY, '22:30', '07:00')!;
    expect(spanMinutes(n.bedtime, n.wake)).toBe(510);
    expect(n.bedtime.getDate()).toBe(14);
    expect(n.wake.getDate()).toBe(15);
    expect(timeOfIso(n.bedtime.toISOString())).toBe('22:30');
    const late = resolveNight(TODAY, '01:15', '07:00')!;
    expect(spanMinutes(late.bedtime, late.wake)).toBe(345);
    expect(late.bedtime.getDate()).toBe(15);
    expect(resolveNight(TODAY, '07:00', '07:00')).toBeNull();
    expect(resolveNight(TODAY, 'x', '07:00')).toBeNull();
  });

  it('estime la durée en retirant les éveils renseignés', () => {
    const n = resolveNight(TODAY, '23:00', '07:00')!;
    const details = [{ at: '02:00', minutes: 30 }, { at: '04:00', minutes: null }, { at: null, minutes: 15 }];
    expect(wakingMinutes(details)).toBe(45);
    expect(estimateSleepMinutes(n.bedtime, n.wake, details)).toBe(435);
    expect(estimateSleepMinutes(n.bedtime, n.wake, [{ at: null, minutes: 9999 }])).toBe(0);
    expect(estimateSleepMinutes(null, n.wake, [])).toBeNull();
  });

  it('privilégie la durée corrigée par la personne', () => {
    const n = resolveNight(TODAY, '23:00', '07:00')!;
    const base = { bedtime: n.bedtime.toISOString(), wake_time: n.wake.toISOString(), waking_details: [{ at: null, minutes: 60 }] };
    expect(nightMinutes({ ...base, sleep_minutes: null })).toBe(420);
    expect(nightMinutes({ ...base, sleep_minutes: 300 })).toBe(300);
    expect(nightMinutes({ bedtime: null, wake_time: null, waking_details: [], sleep_minutes: null })).toBeNull();
  });

  it('additionne les siestes valides', () => {
    expect(napMinutes({ start: '14:00', end: '14:45' })).toBe(45);
    expect(napMinutes({ start: '15:00', end: '14:00' })).toBe(0);
    expect(napMinutes({ start: '', end: '14:00' })).toBe(0);
    expect(totalNapMinutes([{ start: '13:00', end: '13:30' }, { start: '16:00', end: '16:20' }])).toBe(50);
  });

  it('intitule la nuit', () => {
    expect(nightLabel('2026-10-15')).toBe('Nuit du 14 au 15 octobre');
    expect(nightLabel('2026-11-01')).toBe('Nuit du 31 octobre au 1er novembre');
    expect(nightLabel('2026-10-02')).toBe('Nuit du 1er au 2 octobre');
  });
});

describe('validation du formulaire', () => {
  const base = { logDate: TODAY, bed: '22:30', wake: '07:00', wakings: '2', details: [], duration: '', durationEdited: false, naps: [] };
  it('accepte une saisie complète', () => {
    expect(validateSleepForm({ ...base, details: [{ at: '03:00', minutes: '20' }], naps: [{ start: '14:00', end: '14:30' }] }, TODAY)).toEqual({});
  });
  it('signale les erreurs de saisie', () => {
    const e = validateSleepForm({ ...base, logDate: addDays(TODAY, 1), bed: '25:00', wakings: '-1', details: [{ at: 'zz', minutes: '' }], duration: 'beaucoup', naps: [{ start: '15:00', end: '14:00' }] }, TODAY);
    expect(Object.keys(e).sort()).toEqual(['bed', 'detail0', 'duration', 'logDate', 'nap0', 'wakings']);
  });
  it('refuse un réveil identique au coucher', () => {
    expect(validateSleepForm({ ...base, bed: '07:00', wake: '07:00' }, TODAY).wake).toBeDefined();
  });
});

describe('résumé des 7 derniers jours (descriptif)', () => {
  const logs = [
    log({ log_date: TODAY, sleep_minutes: 420, night_wakings: 2, quality: 3, fatigue: 4, mood: 3, naps: [{ start: '14:00', end: '14:40' }] }),
    log({ log_date: addDays(TODAY, -1), sleep_minutes: 360, night_wakings: 3, quality: 2, fatigue: 5, naps: [{ start: '13:00', end: '13:20' }, { start: 'x', end: '' }] }),
    log({ log_date: addDays(TODAY, -3), sleep_minutes: null, night_wakings: 1, quality: 4 }),
    log({ log_date: addDays(TODAY, -9), sleep_minutes: 100, night_wakings: 9, quality: 1 }), // hors fenêtre
  ];

  it('produit 7 jours, du plus ancien à aujourd’hui', () => {
    const s = summarizeWeek(logs, TODAY);
    expect(s.days).toHaveLength(7);
    expect(s.days[0].date).toBe(addDays(TODAY, -6));
    expect(s.days[6]).toEqual({ date: TODAY, label: 'jeu', minutes: 420 });
    expect(s.days[5].minutes).toBe(360);
    expect(s.days[3].minutes).toBeNull();
  });

  it('calcule moyennes et totaux sans la nuit hors fenêtre', () => {
    const s = summarizeWeek(logs, TODAY);
    expect(s.nightsLogged).toBe(2);
    expect(s.avgSleepMinutes).toBe(390);
    expect(s.napsCount).toBe(2);
    expect(s.napMinutes).toBe(60);
    expect(s.totalWakings).toBe(6);
    expect(s.avgQuality).toBe(3);
    expect(s.avgFatigue).toBe(4.5);
    expect(s.avgMood).toBe(3);
  });

  it('reste neutre sans données', () => {
    const s = summarizeWeek([], TODAY);
    expect(s.avgSleepMinutes).toBeNull();
    expect(s.avgQuality).toBeNull();
    expect(s.nightsLogged).toBe(0);
  });
});

describe('signaux de soutien (jamais un diagnostic)', () => {
  it('fatigue très élevée trois jours d’affilée', () => {
    const logs = [0, 1, 2].map((d) => log({ log_date: addDays(TODAY, -d), fatigue: 5 }));
    expect(fatigueStreak(logs, TODAY)).toBe(3);
    expect(supportSignal(logs, TODAY)).toEqual({ show: true, fatigue: true, lowMood: false });
  });

  it('pas de signal pour deux jours, ni pour des jours non consécutifs', () => {
    const two = [0, 1].map((d) => log({ log_date: addDays(TODAY, -d), fatigue: 5 }));
    expect(supportSignal(two, TODAY).show).toBe(false);
    const gaps = [0, 2, 4].map((d) => log({ log_date: addDays(TODAY, -d), fatigue: 5 }));
    expect(fatigueStreak(gaps, TODAY)).toBe(1);
    expect(supportSignal(gaps, TODAY).show).toBe(false);
    const four = [0, 1, 2].map((d) => log({ log_date: addDays(TODAY, -d), fatigue: 4 }));
    expect(supportSignal(four, TODAY).show).toBe(false);
  });

  it('ignore les épisodes anciens', () => {
    const old = [10, 11, 12].map((d) => log({ log_date: addDays(TODAY, -d), fatigue: 5, mood: 1 }));
    expect(supportSignal(old, TODAY).show).toBe(false);
  });

  it('humeur très basse récente', () => {
    expect(supportSignal([log({ log_date: addDays(TODAY, -2), mood: 1 })], TODAY)).toEqual({ show: true, fatigue: false, lowMood: true });
    expect(supportSignal([log({ log_date: TODAY, mood: 2 })], TODAY).show).toBe(false);
  });
});

describe('contexte et repères', () => {
  it('détecte la grossesse, la fin de grossesse et le post-partum', () => {
    expect(sleepContext({ journeys: [], activePregnancyWeeksSA: 30, childBirthDates: [], today: TODAY })).toEqual({ pregnant: true, latePregnancy: true, postpartum: false });
    expect(sleepContext({ journeys: ['pregnant'], activePregnancyWeeksSA: null, childBirthDates: [], today: TODAY })).toEqual({ pregnant: true, latePregnancy: false, postpartum: false });
    expect(sleepContext({ journeys: [], activePregnancyWeeksSA: null, childBirthDates: [addDays(TODAY, -100)], today: TODAY }).postpartum).toBe(true);
    expect(sleepContext({ journeys: [], activePregnancyWeeksSA: null, childBirthDates: [addDays(TODAY, -400)], today: TODAY }).postpartum).toBe(false);
    expect(sleepContext({ journeys: ['newborn'], activePregnancyWeeksSA: null, childBirthDates: [], today: TODAY }).postpartum).toBe(true);
  });

  it('adapte les repères au contexte', () => {
    const keys = (c: Parameters<typeof sleepTips>[0]) => sleepTips(c).map((t) => t.key);
    expect(keys({ pregnant: false, latePregnancy: false, postpartum: true })).toEqual(expect.arrayContaining(['sieste-bebe', 'relais', 'ecrans']));
    expect(keys({ pregnant: false, latePregnancy: false, postpartum: true })).not.toContain('cote');
    const late = sleepTips({ pregnant: true, latePregnancy: true, postpartum: false });
    expect(late.find((t) => t.key === 'cote')?.title).toBe('Dormir sur le côté');
    expect(keys({ pregnant: false, latePregnancy: false, postpartum: false })).toEqual(['ecrans', 'rituel', 'cafeine']);
  });

  it('ne contient ni objectif chiffré ni vocabulaire de diagnostic', () => {
    const all = sleepTips({ pregnant: true, latePregnancy: true, postpartum: true }).map((t) => `${t.title} ${t.text}`).join(' ');
    expect(all).not.toMatch(/insomnie|apnée|trouble du sommeil|\d+\s*h(eures)? (de sommeil|par nuit)|normal/i);
  });
});

describe('moteur local : carnet privé', () => {
  const db = createDemoBackend();
  beforeAll(async () => {
    await db.auth.signUp('sommeil@exemple.test', 'MotDePasse!2026');
  });

  it('ajoute, modifie, refuse les doublons du jour et supprime', async () => {
    const [row] = await db.insert<ParentSleepLog>('parent_sleep_logs', { log_date: TODAY, sleep_minutes: 400, naps: [], waking_details: [], night_wakings: 1, duration_edited: true });
    expect(row.user_id).toBe((await db.auth.getSession())!.userId);
    const dup = await db.insert('parent_sleep_logs', { log_date: TODAY }).catch((e) => e);
    expect(dup).toBeInstanceOf(BackendError);
    await db.update('parent_sleep_logs', { fatigue: 5 }, [eq('id', row.id)]);
    expect((await db.select<ParentSleepLog>({ table: 'parent_sleep_logs' }))[0].fatigue).toBe(5);
    const bad = await db.insert('parent_sleep_logs', { log_date: addDays(TODAY, -1), bedtime: '2026-10-14T08:00:00Z', wake_time: '2026-10-14T07:00:00Z' }).catch((e) => e);
    expect(bad).toBeInstanceOf(BackendError);
    await db.remove('parent_sleep_logs', [eq('id', row.id)]);
    expect(await db.select({ table: 'parent_sleep_logs' })).toHaveLength(0);
  });

  it('la famille d’exemple contient quelques nuits, privées au compte', async () => {
    await db.rpc('load_sample_family');
    const rows = await db.select<ParentSleepLog>({ table: 'parent_sleep_logs' });
    expect(rows.length).toBeGreaterThanOrEqual(4);
    expect(rows.every((r) => nightMinutes(r) != null && nightMinutes(r)! > 0)).toBe(true);
    await db.auth.signOut();
    await db.auth.signUp('autre@exemple.test', 'MotDePasse!2026');
    expect(await db.select({ table: 'parent_sleep_logs' })).toHaveLength(0);
  });
});
