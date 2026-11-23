/**
 * Finitions du suivi (23/11/2026) — logique pure : barres du cycle (période, mois, jour, lien vers la fiche des
 * règles), biberon chronométré (heure + durée corrigées ensemble), mode nuit (état, saisies de la nuit), devoir.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
import {
  bottleDurationMin, bottleTimingPatch, clampBottleMinutes, cycleBars, homeworkDraftError, homeworkPatch, keepBar, monthDayBars, nearestBar,
  nightEntries, nightState, parseCycleRange, parseMonthDay, parseMonthParam, stepBar, usefulCycleRanges,
} from '@/lib/domain/finishTrack';

describe('barres tactiles', () => {
  const bars = [
    { id: 'a', date: '2026-11-01', value: 2, periodId: null },
    { id: 'b', date: '2026-11-02', value: null, periodId: null },
    { id: 'c', date: '2026-11-03', value: 1, periodId: 'p' },
    { id: 'd', date: '2026-11-04', value: null, periodId: null },
  ];
  it('le doigt choisit la barre la plus proche ; le clavier avance d’une barre, borné', () => {
    expect(nearestBar([10, 30, 50], 34)).toBe(1);
    expect(nearestBar([10, 30, 50], -5)).toBe(0);
    expect(nearestBar([], 5)).toBe(-1);
    expect(stepBar(0, -1, 3)).toBe(0);
    expect(stepBar(1, 1, 3)).toBe(2);
    expect(stepBar(-1, 1, 3)).toBe(2);
    expect(stepBar(0, 1, 0)).toBe(-1);
  });
  it('sélection gardée depuis l’adresse ; sinon la plus récente barre NOTÉE (jamais un jour vide)', () => {
    expect(keepBar(bars, 'a')).toBe(0);
    expect(keepBar(bars, 'zz')).toBe(2);
    expect(keepBar(bars, null)).toBe(2);
    expect(keepBar([{ id: 'x', date: '2026-11-01', value: null, periodId: null }], null)).toBe(-1);
  });
});

describe('Statistiques du cycle', () => {
  it('période lue dans l’adresse, proposée seulement si elle change ce qui est montré', () => {
    expect(parseCycleRange('12')).toBe('12');
    expect(parseCycleRange(['all'])).toBe('all');
    expect(parseCycleRange('99')).toBe('6');
    expect(parseCycleRange(undefined)).toBe('6');
    expect(usefulCycleRanges(4)).toEqual([]);
    expect(usefulCycleRanges(9)).toEqual(['6', 'all']);
    expect(usefulCycleRanges(20)).toEqual(['6', '12', 'all']);
  });
  it('une barre par cycle complet, datée de son premier jour et reliée à la saisie des règles', () => {
    const periods = [{ id: 'p1', start_date: '2026-08-01' }, { id: 'p2', start_date: '2026-08-29' }, { id: 'p3', start_date: '2026-09-28' }];
    const cycles = [{ start: '2026-08-01', length: 28 }, { start: '2026-08-29', length: 30 }];
    expect(cycleBars(periods, cycles, 'all')).toEqual([
      { id: '2026-08-01', date: '2026-08-01', value: 28, periodId: 'p1' },
      { id: '2026-08-29', date: '2026-08-29', value: 30, periodId: 'p2' },
    ]);
    expect(cycleBars(periods, cycles, '6')).toHaveLength(2);
    expect(cycleBars([], cycles, 'all')[0].periodId).toBeNull();
  });
});

describe('Résumé du mois', () => {
  const today = '2026-11-23';
  it('mois et jour lus dans l’adresse, jamais dans le futur', () => {
    expect(parseMonthParam('2026-10', today)).toBe('2026-10');
    expect(parseMonthParam('2027-01', today)).toBe('2026-11');
    expect(parseMonthParam('2026-13', today)).toBe('2026-11');
    expect(parseMonthParam(undefined, today)).toBe('2026-11');
    expect(parseMonthDay('2026-11-12', '2026-11', today)).toBe('2026-11-12');
    expect(parseMonthDay('2026-11-30', '2026-11', today)).toBeNull();
    expect(parseMonthDay('2026-10-12', '2026-11', today)).toBeNull();
  });
  it('une barre par jour jusqu’à aujourd’hui : symptômes notés, règles reliées à leur saisie, jour vide = null', () => {
    const bars = monthDayBars('2026-11', {
      periods: [{ id: 'p', start_date: '2026-11-03', end_date: '2026-11-05' }],
      logs: [
        { logged_on: '2026-11-04', symptom_keys: ['cramps', 'headache', 'libido_up'], pain_intensity: 6 },
        { logged_on: '2026-11-10', symptom_keys: [], pain_intensity: null },
      ],
    }, today);
    expect(bars).toHaveLength(23);
    const by = (d: string) => bars.find((b) => b.date === d)!;
    expect(by('2026-11-01').value).toBeNull();
    expect(by('2026-11-03')).toMatchObject({ value: 0, periodId: 'p', logged: false });
    // donnée intime exclue, comme le résumé ; douleur la plus forte du jour
    expect(by('2026-11-04')).toMatchObject({ value: 2, symptoms: 2, pain: 6, periodId: 'p', logged: true });
    expect(by('2026-11-06').value).toBeNull();
    // journée notée sans symptôme : barre au ras de l'axe (pas un jour vide)
    expect(by('2026-11-10')).toMatchObject({ value: 0, logged: true, periodId: null });
  });
});

describe('biberon chronométré : la durée se corrige avec l’heure', () => {
  const timed = { at: '2026-11-23T02:00:00.000Z', started_at: '2026-11-23T02:00:00.000Z', ended_at: '2026-11-23T02:14:30.000Z', paused_seconds: 90 };
  it('durée bue = fin − début − pauses (minutes) ; saisie à une main : pas de durée', () => {
    expect(bottleDurationMin(timed)).toBe(13);
    expect(bottleDurationMin({ at: timed.at })).toBeNull();
    expect(clampBottleMinutes(0)).toBe(1);
    expect(clampBottleMinutes(500)).toBe(120);
  });
  it('heure et durée corrigées : début suit l’heure, fin = début + durée + pauses gardées', () => {
    const at = new Date('2026-11-23T01:50:00.000Z');
    expect(bottleTimingPatch(timed, at, 20)).toEqual({ at: at.toISOString(), started_at: at.toISOString(), ended_at: '2026-11-23T02:11:30.000Z' });
    expect(bottleTimingPatch({ at: timed.at }, at, null)).toEqual({ at: at.toISOString() });
  });
});

describe('mode nuit', () => {
  const now = new Date('2026-11-23T04:00:00.000Z');
  const sleeps = [
    { id: 's1', child_id: 'c', started_at: '2026-11-22T19:30:00.000Z', ended_at: '2026-11-23T01:10:00.000Z' },
    { id: 'old', child_id: 'c', started_at: '2026-11-22T10:00:00.000Z', ended_at: '2026-11-22T11:00:00.000Z' },
    { id: 'other', child_id: 'x', started_at: '2026-11-23T02:00:00.000Z', ended_at: null },
  ];
  it('éveillé depuis la fin du dernier sommeil ; endormi depuis le début du sommeil ouvert ; rien noté : pas d’heure inventée', () => {
    expect(nightState('c', sleeps, now)).toEqual({ asleep: false, since: '2026-11-23T01:10:00.000Z', minutes: 170 });
    expect(nightState('x', sleeps, now)).toEqual({ asleep: true, since: '2026-11-23T02:00:00.000Z', minutes: 120 });
    expect(nightState('z', sleeps, now)).toEqual({ asleep: false, since: null, minutes: null });
  });
  it('saisies des 12 dernières heures de CET enfant, plus récentes d’abord, biberon en direct exclu', () => {
    const list = nightEntries('c', {
      sleeps,
      feeds: [{ id: 'f', child_id: 'c', started_at: '2026-11-23T01:30:00.000Z', ended_at: '2026-11-23T01:45:00.000Z' }],
      diapers: [{ id: 'd', child_id: 'c', at: '2026-11-23T03:00:00.000Z' }, { id: 'dx', child_id: 'x', at: '2026-11-23T03:10:00.000Z' }],
      bottles: [{ id: 'b', child_id: 'c', at: '2026-11-23T02:30:00.000Z' }, { id: 'live', child_id: 'c', at: '2026-11-23T03:30:00.000Z', in_progress: true }],
    }, now);
    expect(list.map((e) => `${e.kind}:${e.id}`)).toEqual(['diaper:d', 'bottle:b', 'feed:f', 'sleep:s1']);
    expect(list[3]).toEqual({ id: 's1', kind: 'sleep', at: '2026-11-22T19:30:00.000Z', end: '2026-11-23T01:10:00.000Z' });
  });
});

describe('École : correction d’un devoir', () => {
  const h = { subject: 'Maths', instructions: 'Exercice 3', due_on: '2026-11-24', done_at: null as string | null };
  it('mêmes règles que la fiche de l’app Devoirs', () => {
    expect(homeworkDraftError({ subject: ' ', instructions: 'x' }, '2026-11-24')).toBe('p2.hw.errSubject');
    expect(homeworkDraftError({ subject: 'a', instructions: '' }, '2026-11-24')).toBe('p2.hw.errInstructions');
    expect(homeworkDraftError({ subject: 'a', instructions: 'b' }, null)).toBe('p2.hw.errDate');
    expect(homeworkDraftError({ subject: 'a', instructions: 'b' }, '2026-11-24')).toBeNull();
  });
  it('cocher prend l’heure du moment ; déjà fait : heure gardée ; décocher : null', () => {
    const now = new Date('2026-11-23T18:00:00.000Z');
    expect(homeworkPatch(h, { subject: ' Maths ', instructions: 'Ex. 4', done: '1' }, '2026-11-25', now)).toEqual({ subject: 'Maths', instructions: 'Ex. 4', due_on: '2026-11-25', done_at: now.toISOString() });
    expect(homeworkPatch({ ...h, done_at: '2026-11-22T17:00:00.000Z' }, { subject: 'Maths', instructions: 'x', done: '1' }, h.due_on, now).done_at).toBe('2026-11-22T17:00:00.000Z');
    expect(homeworkPatch({ ...h, done_at: '2026-11-22T17:00:00.000Z' }, { subject: 'Maths', instructions: 'x', done: '0' }, h.due_on, now).done_at).toBeNull();
  });
});
