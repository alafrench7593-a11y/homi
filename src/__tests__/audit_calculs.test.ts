/**
 * Audit 06 « Outils de suivi et résultats » : chaque calcul est vérifié contre une sortie calculée À LA MAIN
 * (jeux dans ./fixtures/auditSuivi.ts). Fuseau des tests : Europe/Paris (scripts/jest-global-setup.js).
 * Les cas marqués « RÉGRESSION » échouaient avant les corrections de l'audit (docs/audit/06_suivi_resultats.md).
 */
import { BOTTLES_NOW, BOTTLES_WEEK, CYCLE_REGULAR, SLEEP_DST_AUTUMN, SLEEP_DST_SPRING, paris } from './fixtures/auditSuivi';
import { addDays, daysBetween, formatDuration } from '@/lib/domain/dates';
import { dueDateFromLmp, pregnancyProgress } from '@/lib/domain/pregnancy';
import { dailySummaries, withIntervals } from '@/lib/domain/bottleHistory';
import { bottleStats, sessionClock, sessionSeconds } from '@/lib/domain/bottleSession';
import { bottleElapsed, resumePatch } from '@/lib/domain/childCare';
import { computeDueAt, dayKey, zonedParts } from '@/lib/domain/bottleTimer';
import { nightSummary } from '@/lib/domain/night';
import { sleepDay, sleepRhythm } from '@/lib/domain/sleepEstimate';
import { drunkMl, lastDaysSeries, summarizeDay } from '@/lib/domain/daily';
import { periodStart } from '@/lib/domain/summary';
import { planningAge, weekView } from '@/lib/domain/sleepPlanner';
import { childAge } from '@/lib/domain/child';
import { ageInMonths } from '@/lib/domain/growthStandards';
import { estimateCycle } from '@/lib/domain/cycle';
import { scoopsFor } from '@/lib/domain/scoops';
import { trendSeries } from '@/lib/domain/postpartum';
import { summarizeWeek } from '@/lib/domain/parentSleep';
import { weekKey } from '@/lib/domain/moodSupport';
import { stockLevel } from '@/lib/domain/stocks';
import { addMonthsISO } from '@/lib/domain/vaccineRules';
import { cycleStats } from '@/lib/domain/cycleV2';
import type { Sleep } from '@/lib/types';
import type { ParentSleepLog } from '@/lib/types-sleep';
import type { PostpartumCheckin } from '@/lib/domain/postpartum';

const local = (y: number, m: number, d: number, h = 12, min = 0) => new Date(y, m - 1, d, h, min);

describe('dates calendaires : mois de 28/29/30/31 jours et changements d’heure', () => {
  it('écarts et additions de jours', () => {
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2); // traverse le passage à l'heure d'été
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2); // traverse le retour à l'heure d'hiver
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-04-30', 1)).toBe('2026-05-01');
    expect(addDays('2027-02-28', 1)).toBe('2027-03-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29'); // année bissextile
  });
  it('durées arrondies à la minute, jamais négatives', () => {
    expect(formatDuration(89.5)).toBe('1 h 30');
    expect(formatDuration(59.4)).toBe('59 min');
    expect(formatDuration(120)).toBe('2 h');
    expect(formatDuration(-5)).toBe('0 min');
  });
});

describe('grossesse : SA (aménorrhée) ≠ semaines de grossesse, terme à 41 SA', () => {
  it('terme du 01/01/2027, le 13/11/2026 : 34 SA pile, 32 semaines de grossesse, J-49', () => {
    // DDR = terme − 287 j = 20/03/2026 ; du 20/03 au 13/11 : 11+30+31+30+31+31+30+31+13 = 238 j = 34 × 7
    const p = pregnancyProgress('2027-01-01', '2026-11-13');
    expect([p.weeksSA, p.extraDays, p.weeksSG, p.trimester, p.daysToDue]).toEqual([34, 0, 32, 3, 49]);
    expect(p.label).toBe('34 SA');
  });
  it('jour du terme : 41 SA + 0 j, J-0 ; une année bissextile est comptée', () => {
    const p = pregnancyProgress('2027-01-01', '2027-01-01');
    expect([p.weeksSA, p.extraDays, p.daysToDue, p.progress]).toEqual([41, 0, 0, 1]);
    expect(dueDateFromLmp('2026-03-20')).toBe('2027-01-01');
    expect(dueDateFromLmp('2027-06-01')).toBe('2028-03-14'); // 29 février 2028 inclus
  });
  it('libellé avec jours : 24 SA + 3 j', () => {
    // 24 × 7 + 3 = 171 j après la DDR (20/03/2026) → 07/09/2026
    expect(pregnancyProgress('2027-01-01', '2026-09-07').label).toBe('24 SA + 3 j');
  });
});

describe('biberons : jours sans saisie, quantités non notées, fuseaux', () => {
  it('synthèse par jour (Paris) : 23 h 50 reste la veille, 0 h 10 compte le jour même', () => {
    const days = dailySummaries(BOTTLES_WEEK, 7, BOTTLES_NOW, 'Europe/Paris');
    expect(days.map((d) => d.key)).toEqual(['2026-11-15', '2026-11-14', '2026-11-13', '2026-11-12', '2026-11-11', '2026-11-10', '2026-11-09']);
    expect(days.map((d) => d.count)).toEqual([2, 1, 1, 0, 1, 0, 2]);
    expect(days.map((d) => d.consumedTotal)).toEqual([240, 100, 0, 0, 90, 0, 270]);
    expect(days[2]).toMatchObject({ consumedCount: 0, preparedTotal: 180 }); // préparé ≠ bu
  });
  it('tuiles « semaine » : total bu NOTÉ, jours sans saisie = trou (null), jamais 0', () => {
    const s = bottleStats(BOTTLES_WEEK, 'week', BOTTLES_NOW, 'Europe/Paris');
    expect([s.count, s.consumedTotal, s.consumedCount]).toEqual([7, 700, 6]);
    expect(s.countSeries).toEqual([2, null, 1, null, 1, 1, 2]);
    expect(s.consumedSeries).toEqual([270, null, 90, null, null, 100, 240]);
  });
  it('tuiles « jour » selon le fuseau : Paris, New York, Auckland (période vide → null)', () => {
    expect(bottleStats(BOTTLES_WEEK, 'day', BOTTLES_NOW, 'Europe/Paris')).toMatchObject({ count: 2, consumedTotal: 240, consumedSeries: [110, 130] });
    // New York (UTC−5) : le 15 à 14 h ; seul le biberon de 7 h à Paris (1 h à New York) est du 15
    expect(bottleStats(BOTTLES_WEEK, 'day', BOTTLES_NOW, 'America/New_York')).toMatchObject({ count: 1, consumedTotal: 130 });
    // Auckland (UTC+13) : déjà le 16 à 8 h, rien de noté → état vide explicite
    expect(bottleStats(BOTTLES_WEEK, 'day', BOTTLES_NOW, 'Pacific/Auckland')).toMatchObject({ count: null, consumedTotal: null });
    expect(dayKey(BOTTLES_WEEK[4].at, 'Pacific/Auckland')).toBe('2026-11-15');
  });
  it('intervalle entre deux biberons pendant le passage à l’heure d’été : 1 h réelle', () => {
    const list = withIntervals([
      { id: 'a', at: paris('2026-03-29T01:30:00', '+01:00'), prepared_ml: null, consumed_ml: null, milk_type: null },
      { id: 'b', at: paris('2026-03-29T03:30:00', '+02:00'), prepared_ml: null, consumed_ml: null, milk_type: null },
    ]);
    expect(list[0].interval_minutes).toBe(60);
  });
  it('rappel « + 3 h 30 » posé à 0 h 30 la nuit du changement d’heure : 5 h 00 à l’horloge (3 h 30 réelles)', () => {
    const due = computeDueAt(paris('2026-03-29T00:30:00', '+01:00'), 210);
    expect(zonedParts(due, 'Europe/Paris')).toMatchObject({ day: 29, hour: 5, minute: 0 });
    expect(zonedParts(due, 'America/New_York')).toMatchObject({ day: 28, hour: 23, minute: 0 });
  });
  it('RÉGRESSION graphique « Lait bu par jour » : une quantité seulement préparée ne compte pas', () => {
    const series = lastDaysSeries(7, BOTTLES_WEEK, (b) => b.at, drunkMl, BOTTLES_NOW);
    expect(series.map((d) => d.value)).toEqual([270, 0, 90, 0, 0, 100, 240]); // vendredi 13 : 0, pas 180
  });
});

describe('session biberon (minuteur) : démarrer, pause, reprendre, arrière-plan', () => {
  const T = (hms: string) => new Date(`2026-11-13T${hms}Z`);
  it('le temps affiché vient des horodatages, pauses déduites', () => {
    const started = { started_at: T('10:00:00').toISOString(), paused_at: null, paused_seconds: 0, ended_at: null };
    expect(sessionClock(sessionSeconds(started, T('10:04:07')))).toBe('04:07');
    // Pause à 10 h 05 : l'affichage reste figé, même 55 min plus tard (application en arrière-plan)
    const paused = { ...started, paused_at: T('10:05:00').toISOString() };
    expect(bottleElapsed(paused, T('11:00:00'))).toBe(300);
    // Reprise à 10 h 07 : 120 s de pause ajoutées ; à 10 h 10 → 10 min − 2 min = 8 min
    const resumed = { ...paused, ...resumePatch(paused, T('10:07:00')) };
    expect(resumed.paused_seconds).toBe(120);
    expect(sessionClock(bottleElapsed(resumed, T('10:10:00')))).toBe('08:00');
    expect(sessionClock(3725)).toBe('1:02:05');
  });
  it('deux sessions simultanées (deux enfants) sont indépendantes ; le fuseau de l’appareil n’y change rien', () => {
    const a = { started_at: T('10:00:00').toISOString(), paused_at: null, paused_seconds: 0, ended_at: null };
    const b = { started_at: T('10:03:00').toISOString(), paused_at: null, paused_seconds: 30, ended_at: null };
    expect([bottleElapsed(a, T('10:10:00')), bottleElapsed(b, T('10:10:00'))]).toEqual([600, 390]);
    const ended = { ...a, ended_at: T('10:20:00').toISOString() };
    expect(bottleElapsed(ended, T('23:59:59'))).toBe(1200); // arrêt : chiffre stable
  });
});

describe('sommeil de l’enfant : nuits, journées de 23 h et 25 h', () => {
  it('nuit du 28 au 29/03 : 21 h → 7 h = 9 h réelles', () => {
    const n = nightSummary('2026-03-28', { sleeps: [SLEEP_DST_SPRING[0] as unknown as Sleep], breastfeeds: [], bottles: [] }, local(2026, 3, 29, 12));
    expect([n.sleepMinutes, n.periods, n.wakings, n.longestMinutes]).toEqual([540, 1, 1, 540]);
  });
  it('RÉGRESSION journée du 29/03 (23 h) : un sommeil commencé le 30 à 0 h 30 n’est pas compté le 29', () => {
    const d = sleepDay(SLEEP_DST_SPRING, local(2026, 3, 29), local(2026, 3, 30, 12));
    expect(d).toEqual({ naps: 1, napMinutes: 90, nightMinutes: 480, nightWakeups: 2 });
  });
  it('RÉGRESSION journée du 25/10 (25 h) : la sieste de 23 h 30 appartient bien au 25', () => {
    const d = sleepDay(SLEEP_DST_AUTUMN, local(2026, 10, 25), local(2026, 10, 26, 12));
    expect(d.nightMinutes).toBe(480 + 20);
  });
  it('RÉGRESSION synthèse du jour (accueil) : part du sommeil comprise dans la journée', () => {
    // 29/03 : 0 h → 7 h (6 h réelles) + sieste 90 min + 22 h → minuit (2 h) = 570 min
    expect(summarizeDay(local(2026, 3, 29), { sleeps: SLEEP_DST_SPRING }, local(2026, 3, 30, 12)).sleepMinutes).toBe(570);
    // 25/10 : 22 h → minuit (2 h) + 20 min = 140 min
    expect(summarizeDay(local(2026, 10, 25), { sleeps: SLEEP_DST_AUTUMN }, local(2026, 10, 26, 12)).sleepMinutes).toBe(140);
  });
  it('moyennes sur 7 jours : les jours sans saisie ne comptent pas comme zéro', () => {
    const sleeps = [
      { started_at: local(2026, 11, 14, 20).toISOString(), ended_at: local(2026, 11, 15, 6).toISOString(), wakeups: 1 }, // 600
      { started_at: local(2026, 11, 12, 21).toISOString(), ended_at: local(2026, 11, 13, 5, 20).toISOString(), wakeups: 0 }, // 500
    ];
    const r = sleepRhythm(sleeps, local(2026, 11, 15, 12));
    expect([r.days, r.nightMinutes, r.wakeups]).toEqual([2, 550, 0.5]);
    expect(sleepRhythm([], local(2026, 11, 15, 12)).days).toBe(0);
  });
  it('RÉGRESSION semaine du planning : une sieste du 30/03 à 0 h 30 n’apparaît que le 30', () => {
    const nap = { child_id: 'c', kind: 'nap' as const, started_at: SLEEP_DST_SPRING[3].started_at, ended_at: SLEEP_DST_SPRING[3].ended_at };
    const v = weekView([nap], 'c', local(2026, 3, 30, 12), 2);
    expect(v.map((d) => [d.date, d.naps])).toEqual([['2026-03-29', 0], ['2026-03-30', 1]]);
  });
  it('RÉGRESSION âge pour le planning : 31 jours le 01/04 à 0 h 30 (né le 01/03), malgré l’heure perdue', () => {
    expect(planningAge('2026-03-01', null, local(2026, 4, 1, 0, 30))).toMatchObject({ months: 1, weeks: 4 });
  });
});

describe('résumé pour un rendez-vous : début de période en jours calendaires', () => {
  it('RÉGRESSION « 7 jours » qui traverse le passage à l’heure d’été : commence le 25/03 à 0 h', () => {
    const s = periodStart('week', local(2026, 3, 31, 10));
    expect([s.getDate(), s.getHours()]).toEqual([25, 0]);
  });
  it('RÉGRESSION « 7 jours » qui traverse le retour à l’heure d’hiver : commence le 21/10 à 0 h', () => {
    const s = periodStart('week', local(2026, 10, 27, 10));
    expect([s.getDate(), s.getHours()]).toEqual([21, 0]);
  });
  it('RÉGRESSION « depuis le dernier rendez-vous » : au plus 30 jours, premier jour inclus à 0 h', () => {
    const s = periodStart('appointment', local(2026, 4, 15, 10));
    expect([s.getMonth() + 1, s.getDate(), s.getHours()]).toEqual([3, 17, 0]);
  });
});

describe('âge de l’enfant et croissance : fins de mois', () => {
  it('RÉGRESSION né un 31 : le « mois » se termine le dernier jour des mois courts', () => {
    expect(childAge('2026-01-31', '2026-02-28').label).toBe('1 mois');
    expect(childAge('2026-01-31', '2026-03-02').label).toBe('1 mois et 2 jours');
    expect(childAge('2026-03-31', '2026-04-30').label).toBe('1 mois');
    expect(childAge('2026-03-31', '2026-05-01').label).toBe('1 mois et 1 jour');
    expect(childAge('2028-02-29', '2029-02-28').label).toBe('12 mois'); // avant 24 mois l'âge est dit en mois
  });
  it('âge en mois pour les repères OMS (30,4375 j par mois)', () => {
    expect(ageInMonths('2026-01-31', '2026-03-02')).toBeCloseTo(30 / 30.4375, 6);
    expect(ageInMonths('2026-03-28', '2026-03-30')).toBeCloseTo(2 / 30.4375, 6); // aucun effet du changement d'heure
  });
});

describe('cycle : des ESTIMATIONS, jamais un « jour sans risque »', () => {
  it('cycle régulier de 28 jours (février inclus)', () => {
    const e = estimateCycle(CYCLE_REGULAR, '2026-04-10');
    expect(e).toMatchObject({ cycleCount: 3, averageLength: 28, variability: 0, nextPeriod: '2026-04-23', ovulation: '2026-04-09', fertileWindow: { start: '2026-04-04', end: '2026-04-10' }, reliability: 'moderate' });
    expect(e.caveats.join(' ')).toMatch(/ne permettent pas de l’éviter/);
    expect(e.caveats.join(' ')).not.toMatch(/sans risque|aucun risque/i);
  });
  it('cycles non saisis : la prochaine date avance de 28 j en 28 j ; une seule date → fiabilité insuffisante', () => {
    expect(estimateCycle(CYCLE_REGULAR, '2026-06-01').nextPeriod).toBe('2026-06-18');
    expect(estimateCycle([{ start_date: '2026-03-26' }], '2026-04-10').reliability).toBe('insufficient');
    expect(estimateCycle([], '2026-04-10').nextPeriod).toBeNull();
  });
});

describe('autres calculs de suivi', () => {
  it('mesurettes : division exacte ou encadrement, jamais d’arrondi silencieux', () => {
    expect(scoopsFor(210, 30)).toMatchObject({ scoops: 7, exact: true });
    expect(scoopsFor(200, 30)).toMatchObject({ exact: false, lower: 6, upper: 7, lowerMl: 180, upperMl: 210 });
    expect(scoopsFor(0, 30)).toBeNull();
  });
  it('post-partum : série jour par jour avec des trous (jamais 0)', () => {
    const c = (checkin_date: string, mood: number) => ({ checkin_date, mood } as unknown as PostpartumCheckin);
    const s = trendSeries([c('2026-03-01', 3), c('2026-02-27', 4)], 'mood', '2026-03-01', 4);
    expect(s).toEqual([{ date: '2026-02-26', value: null }, { date: '2026-02-27', value: 4 }, { date: '2026-02-28', value: null }, { date: '2026-03-01', value: 3 }]);
  });
  it('mon sommeil : moyenne sur les nuits notées seulement', () => {
    const log = (log_date: string, sleep_minutes: number) => ({ log_date, sleep_minutes, naps: [], night_wakings: 0, waking_details: [], bedtime: null, wake_time: null, quality: null, fatigue: null, mood: null } as unknown as ParentSleepLog);
    const w = summarizeWeek([log('2026-11-13', 420), log('2026-11-10', 480)], '2026-11-13');
    expect([w.nightsLogged, w.avgSleepMinutes]).toEqual([2, 450]);
    expect(w.days.filter((d) => d.minutes == null)).toHaveLength(5);
  });
  it('semaine ISO de l’humeur (année à 53 semaines)', () => {
    expect(weekKey(local(2026, 12, 31))).toBe('2026-S53');
    expect(weekKey(local(2027, 1, 1))).toBe('2026-S53');
    expect(weekKey(local(2026, 3, 29))).toBe('2026-S13');
  });
  it('stocks : niveau inconnu sans quantité, épuisé à 0 avec seuil', () => {
    expect(stockLevel({ qty_estimate: null, threshold: 2 })).toBe('unknown');
    expect(stockLevel({ qty_estimate: 0, threshold: 2 })).toBe('out');
    expect(stockLevel({ qty_estimate: 2, threshold: 2 })).toBe('low');
    expect(stockLevel({ qty_estimate: 3, threshold: 2 })).toBe('ok');
  });
  it('vaccins : échéance « + n mois » en fin de mois (même convention que l’âge de l’enfant)', () => {
    expect(addMonthsISO('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonthsISO('2028-01-31', 1)).toBe('2028-02-29');
    expect(addMonthsISO('2026-08-31', 1)).toBe('2026-09-30');
    expect(addMonthsISO('2026-11-15', 2)).toBe('2027-01-15');
  });
  it('statistiques du cycle : durées inclusives, février compté, moyennes sans les jours non renseignés', () => {
    const s = cycleStats(
      [{ start_date: '2026-01-29', end_date: '2026-02-02' }, { start_date: '2026-02-26', end_date: '2026-03-01' }, { start_date: '2026-03-26', end_date: null }],
      [{ logged_on: '2026-02-01', mood: 3 }, { logged_on: '2026-02-02', mood: null }, { logged_on: '2026-02-03', mood: 5 }],
    );
    // 29/01 → 26/02 = 28 j ; 26/02 → 26/03 = 28 j ; règles du 29/01 au 02/02 = 5 j, du 26/02 au 01/03 = 4 j (2026 non bissextile)
    expect(s.cycles.map((c) => c.length)).toEqual([28, 28]);
    expect([s.averageLength, s.shortest, s.longest]).toEqual([28, 28, 28]);
    expect([s.periodDurations, s.averagePeriod]).toEqual([[5, 4], 4.5]);
    expect([s.wellbeing.mood, s.wellbeing.days]).toEqual([4, 2]);
  });
});
