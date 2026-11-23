/**
 * Suivi Soins / Santé / Sommeil de la mère (vague 3) : fonctions pures de src/lib/domain/careTrack.ts.
 * « Rien de noté » vaut null (jamais 0), on ne compte que des saisies de même nature, aucune valeur inventée.
 */
import {
  answersComplete, checkDate, countByKey, countOn, countsByDay, countsByMonth, dayOfStamp, entriesOn, journalPeriod, lastDays,
  monthOf, nightFix, nightsByDay, nightsKnown, periodBounds, shiftMonth, stepsProgress, teethByDate, teethFacts, urlDay, urlMonth,
  type NightLike,
} from '@/lib/domain/careTrack';

const local = (y: number, mo: number, d: number, h = 12, mi = 0) => new Date(y, mo - 1, d, h, mi).toISOString();

describe('jours', () => {
  it('7 derniers jours, du plus ancien au plus récent', () => {
    expect(lastDays('2026-11-22', 3)).toEqual(['2026-11-20', '2026-11-21', '2026-11-22']);
    expect(lastDays('2026-03-01', 2)).toEqual(['2026-02-28', '2026-03-01']);
  });
  it('jour sans saisie = null, jamais 0 ; hors période ignoré', () => {
    const items = [{ at: local(2026, 11, 22, 8) }, { at: local(2026, 11, 22, 20) }, { at: local(2026, 11, 10) }];
    const c = countsByDay(items, (x) => dayOfStamp(x.at), ['2026-11-21', '2026-11-22']);
    expect(c).toEqual({ '2026-11-21': null, '2026-11-22': 2 });
    expect(countOn(items, (x) => dayOfStamp(x.at), '2026-11-21')).toBeNull();
    expect(countOn(items, (x) => dayOfStamp(x.at), '2026-11-22')).toBe(2);
  });
  it('saisies d’un jour, de la plus tardive à la plus ancienne', () => {
    const items = [{ id: 'a', at: local(2026, 11, 22, 8) }, { id: 'b', at: local(2026, 11, 22, 20) }, { id: 'c', at: local(2026, 11, 21, 9) }];
    expect(entriesOn(items, (x) => dayOfStamp(x.at), (x) => x.at, '2026-11-22').map((x) => x.id)).toEqual(['b', 'a']);
  });
  it('jour de l’adresse : valide et jamais dans le futur', () => {
    expect(urlDay('2026-11-20', '2026-11-22')).toBe('2026-11-20');
    expect(urlDay('2026-11-23', '2026-11-22')).toBe('2026-11-22');
    expect(urlDay('pas-un-jour', '2026-11-22')).toBe('2026-11-22');
    expect(urlDay(undefined, '2026-11-22')).toBe('2026-11-22');
  });
});

describe('dates saisies', () => {
  it('format, futur, avant la naissance, facultative ou obligatoire', () => {
    expect(checkDate('', '2026-11-22')).toEqual({ ok: true, iso: null });
    expect(checkDate('', '2026-11-22', { required: true })).toEqual({ ok: false, reason: 'format' });
    expect(checkDate('31/02/2026x', '2026-11-22')).toEqual({ ok: false, reason: 'format' });
    expect(checkDate('23/11/2026', '2026-11-22')).toEqual({ ok: false, reason: 'future' });
    expect(checkDate('01/01/2020', '2026-11-22', { min: '2024-05-01' })).toEqual({ ok: false, reason: 'before' });
    expect(checkDate('03/11/2026', '2026-11-22', { min: '2024-05-01' })).toEqual({ ok: true, iso: '2026-11-03' });
  });
});

describe('dents', () => {
  const t = [
    { id: '1', title: 'Incisive centrale inférieure gauche', happened_on: '2026-03-02' },
    { id: '2', title: 'Incisive centrale inférieure droite', happened_on: '2026-04-10' },
    { id: '3', title: 'Incisive latérale', happened_on: null },
  ];
  it('nombre noté, première et dernière dates connues ; aucune dent = 0 dent et aucune date', () => {
    expect(teethFacts(t)).toEqual({ count: 3, dated: 2, first: '2026-03-02', last: '2026-04-10' });
    expect(teethFacts([])).toEqual({ count: 0, dated: 0, first: null, last: null });
  });
  it('de la plus récente à la plus ancienne, sans date à la fin', () => {
    expect(teethByDate(t).map((x) => x.id)).toEqual(['2', '1', '3']);
  });
});

describe('sommeil de la mère', () => {
  const night = (log_date: string, bed: string | null, wake: string | null, extra: Partial<NightLike> = {}): NightLike => ({
    id: log_date, log_date, bedtime: bed, wake_time: wake, sleep_minutes: null, waking_details: [], night_wakings: 0, ...extra,
  });
  const logs = [
    night('2026-11-22', local(2026, 11, 21, 23, 0), local(2026, 11, 22, 6, 30), { night_wakings: 2, waking_details: [{ at: '03:00', minutes: 20 }] }),
    night('2026-11-20', null, null, { night_wakings: 1 }),
  ];
  it('une colonne par nuit ; nuit non notée ou sans durée = null (jamais 0 h)', () => {
    const d = nightsByDay(logs, ['2026-11-20', '2026-11-21', '2026-11-22']);
    expect(d.map((x) => x.minutes)).toEqual([null, null, 430]);
    expect(d[0].log?.id).toBe('2026-11-20');
    expect(d[1].log).toBeNull();
  });
  it('nuits avec durée connue et réveils notés (réveils avec réveils)', () => {
    expect(nightsKnown(nightsByDay(logs, ['2026-11-20', '2026-11-21', '2026-11-22']))).toEqual({ known: 1, wakings: 3 });
    expect(nightsKnown(nightsByDay([], ['2026-11-22']))).toEqual({ known: 0, wakings: null });
  });
  it('correction : heures replacées sur la nuit, durée recalculée, saisie manuelle abandonnée', () => {
    const r = nightFix(logs[0], { bed: '22:30', wake: '06:30', wakings: '2' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.patch.bedtime).toBe(local(2026, 11, 21, 22, 30));
    expect(r.patch.wake_time).toBe(local(2026, 11, 22, 6, 30));
    expect(r.patch.sleep_minutes).toBe(460); // 8 h − 20 min d'éveil noté
    expect(r.patch.duration_edited).toBe(false);
    expect('night_wakings' in r.patch).toBe(false);
  });
  it('correction : rien ne change → patch vide ; réveils jamais sous le détail noté', () => {
    const same = nightFix(logs[0], { bed: '23:00', wake: '06:30', wakings: '2' });
    expect(same).toEqual({ ok: true, patch: {} });
    const low = nightFix(logs[0], { bed: '23:00', wake: '06:30', wakings: '0' });
    expect(low.ok && low.patch.night_wakings).toBe(1);
  });
  it('correction refusée : heure illisible, heures égales, réveils hors bornes', () => {
    expect(nightFix(logs[0], { bed: '25:00', wake: '06:30', wakings: '1' })).toEqual({ ok: false, reason: 'time' });
    expect(nightFix(logs[0], { bed: '06:30', wake: '06:30', wakings: '1' })).toEqual({ ok: false, reason: 'same' });
    expect(nightFix(logs[0], { bed: '23:00', wake: '06:30', wakings: '-1' })).toEqual({ ok: false, reason: 'wakings' });
    expect(nightFix(logs[0], { bed: '23:00', wake: '06:30', wakings: '1.5' })).toEqual({ ok: false, reason: 'wakings' });
  });
  it('nuit sans heures : seules les réveils peuvent changer', () => {
    expect(nightFix(logs[1], { bed: '', wake: '', wakings: '3' })).toEqual({ ok: true, patch: { night_wakings: 3 } });
  });
});

describe('démarches et bilans', () => {
  it('« 3 / 10 » ; liste vide = null', () => {
    expect(stepsProgress([{ done: true }, { done: false }, { done: true }])).toEqual({ done: 2, total: 3 });
    expect(stepsProgress([])).toBeNull();
  });
  it('6 réponses entières de 0 à 3', () => {
    expect(answersComplete([0, 1, 2, 3, 0, 1])).toBe(true);
    expect(answersComplete([0, 1, 2, 3, 0, null])).toBe(false);
    expect(answersComplete([0, 1, 2, 4, 0, 1])).toBe(false);
    expect(answersComplete([0, 1, 2, 3, 0])).toBe(false);
  });
});

describe('mois (documents, album)', () => {
  it('mois de l’adresse borné au mois en cours ; décalage', () => {
    expect(urlMonth('2026-10', '2026-11-22')).toBe('2026-10');
    expect(urlMonth('2026-12', '2026-11-22')).toBe('2026-11');
    expect(urlMonth('2026-13', '2026-11-22')).toBe('2026-11');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(monthOf('2026-11-22')).toBe('2026-11');
  });
  it('compte par mois : mois vide = null', () => {
    const docs = [{ d: '2026-11-02' }, { d: '2026-11-20' }, { d: '2026-09-01' }, { d: null }];
    expect(countsByMonth(docs, (x) => x.d, '2026-11', 3)).toEqual([{ month: '2026-09', count: 1 }, { month: '2026-10', count: null }, { month: '2026-11', count: 2 }]);
  });
});

describe('journal', () => {
  it('période de l’adresse (semaine par défaut) et bornes', () => {
    expect(journalPeriod('day')).toBe('day');
    expect(journalPeriod('n’importe')).toBe('week');
    expect(periodBounds('day', '2026-11-22')).toEqual({ from: '2026-11-22', to: '2026-11-23' });
    expect(periodBounds('week', '2026-11-22')).toEqual({ from: '2026-11-16', to: '2026-11-23' }); // dimanche → semaine du lundi 16
    expect(periodBounds('month', '2026-12-05')).toEqual({ from: '2026-12-01', to: '2027-01-01' });
  });
  it('comptes par nature, les plus nombreux d’abord', () => {
    expect(countByKey([{ c: 'sleep' }, { c: 'feeding' }, { c: 'sleep' }], (x) => x.c)).toEqual([{ key: 'sleep', count: 2 }, { key: 'feeding', count: 1 }]);
  });
});
