/**
 * Journaux et rendez-vous, Foyer (22/11/2026) : regroupements purs de la semaine des rendez-vous, du statut d'un
 * rendez-vous, du restant / terminé (tâches, courses) et des dégustations par aliment. Heure de Paris (jest-global-setup).
 */
import {
  apptStatus, apptsByDay, countByStatus, doneBy, firstTastingIds, firstTriedAfter, foodGroupKey, foodJournal, frDayToIso, initialDay, isoDay,
  isoToFrDay, parseIsoDay, shiftDay, splitRemaining, taskToggle, tastingsByFood, weekDays, weekRange,
} from '@/lib/domain/journalTrack';

const at = (y: number, mo: number, d: number, h: number, mi = 0) => new Date(y, mo - 1, d, h, mi).toISOString();

describe('semaine (lundi → dimanche, jours locaux)', () => {
  it('« Semaine du 20 au 26 janv. » depuis n’importe quel jour de la semaine', () => {
    for (const d of ['2025-01-20', '2025-01-23', '2025-01-26']) {
      expect(weekDays(d)).toEqual(['2025-01-20', '2025-01-21', '2025-01-22', '2025-01-23', '2025-01-24', '2025-01-25', '2025-01-26']);
    }
    expect(weekRange('2025-01-22')).toEqual({ start: '2025-01-20', end: '2025-01-26', sameMonth: true, sameYear: true });
  });
  it('semaine à cheval sur deux mois et deux années', () => {
    expect(weekRange('2025-01-30')).toMatchObject({ start: '2025-01-27', end: '2025-02-02', sameMonth: false, sameYear: true });
    expect(weekRange('2025-12-31')).toMatchObject({ start: '2025-12-29', end: '2026-01-04', sameMonth: false, sameYear: false });
  });
  it('passage à l’heure d’été : 7 jours distincts, sans saut', () => {
    const w = weekDays('2025-03-30');
    expect(w[0]).toBe('2025-03-24');
    expect(new Set(w).size).toBe(7);
    expect(shiftDay('2025-03-30', 1)).toBe('2025-03-31');
    expect(shiftDay('2025-01-22', 7)).toBe('2025-01-29');
  });
  it('jour de l’adresse : seulement une vraie date', () => {
    expect(parseIsoDay('2025-01-22')).toBe('2025-01-22');
    expect(parseIsoDay('2025-02-30')).toBeNull();
    expect(parseIsoDay('22/01/2025')).toBeNull();
    expect(parseIsoDay(undefined)).toBeNull();
    expect(parseIsoDay(['2025-01-21'])).toBe('2025-01-21');
    expect(initialDay('nimporte', new Date(2025, 0, 22, 9))).toBe('2025-01-22');
    expect(initialDay('2025-01-24', new Date(2025, 0, 22, 9))).toBe('2025-01-24');
  });
});

describe('rendez-vous : statut et jours', () => {
  const now = new Date(2025, 0, 22, 12, 0);
  const ped = { id: 'ped', starts_at: at(2025, 1, 22, 10, 30) };
  const vac = { id: 'vac', starts_at: at(2025, 1, 22, 16, 0) };
  const old = { id: 'old', starts_at: at(2025, 1, 20, 9, 0), completed_at: at(2025, 1, 20, 10, 0) };
  const late = { id: 'late', starts_at: at(2025, 1, 21, 18, 0) };
  const nextWeek = { id: 'next', starts_at: at(2025, 1, 28, 9, 0) };
  it('prévu / réalisé / à confirmer, jamais « reporté » deviné', () => {
    expect(apptStatus(vac, now)).toBe('planned');
    expect(apptStatus(ped, now)).toBe('to_confirm');           // 10 h 30, il est midi : passé de plus d'une heure
    expect(apptStatus({ id: 'x', starts_at: at(2025, 1, 22, 11, 30) }, now)).toBe('planned'); // marge d'une heure
    expect(apptStatus(old, now)).toBe('done');
    expect(apptStatus({ ...vac, completed_at: at(2025, 1, 22, 9, 0) }, now)).toBe('done');
    expect(countByStatus([ped, vac, old, late], now)).toEqual({ planned: 1, done: 1, to_confirm: 2 });
  });
  it('rendez-vous rangés par jour de la semaine, triés par heure ; jour vide = liste vide', () => {
    const by = apptsByDay([vac, nextWeek, old, ped, late], weekDays('2025-01-22'));
    expect(Object.keys(by)).toHaveLength(7);
    expect(by['2025-01-22'].map((a) => a.id)).toEqual(['ped', 'vac']);
    expect(by['2025-01-20'].map((a) => a.id)).toEqual(['old']);
    expect(by['2025-01-23']).toEqual([]);
    expect(Object.values(by).flat().some((a) => a.id === 'next')).toBe(false);
  });
  it('rendez-vous à 23 h 30 rangé sur son jour local', () => {
    const by = apptsByDay([{ id: 'nuit', starts_at: at(2025, 1, 21, 23, 30) }], weekDays('2025-01-21'));
    expect(by['2025-01-21'].map((a) => a.id)).toEqual(['nuit']);
  });
});

describe('restant / terminé', () => {
  type T = { id: string; done: boolean; at?: string | null };
  const items: T[] = [
    { id: 'lait', done: false }, { id: 'pain', done: true, at: at(2025, 1, 22, 9) }, { id: 'pommes', done: false },
    { id: 'couches', done: true, at: at(2025, 1, 22, 18) }, { id: 'vieux', done: true, at: null },
  ];
  it('ce qui reste d’abord (ordre d’origine), terminé ensuite (le plus récent d’abord, sans date à la fin)', () => {
    const r = splitRemaining(items, (x) => x.done, (x) => x.at);
    expect(r.remaining.map((x) => x.id)).toEqual(['lait', 'pommes']);
    expect(r.done.map((x) => x.id)).toEqual(['couches', 'pain', 'vieux']);
  });
  it('qui et quand seulement si la donnée existe', () => {
    expect(doneBy(null, null)).toBeNull();
    expect(doneBy('u1', null)).toEqual({ by: 'u1', at: null });
    expect(doneBy('u1', '2025-01-22T09:00:00Z')).toEqual({ by: 'u1', at: '2025-01-22T09:00:00Z' });
  });
  it('droits : tâche simple cochée et rouverte par tous ; mission terminée seulement par son destinataire et jamais rouverte', () => {
    expect(taskToggle({ status: 'todo', assignee_id: 'b' }, 'a')).toEqual({ action: 'complete', allowed: true, block: null });
    expect(taskToggle({ status: 'done', assignee_id: 'b' }, 'a')).toEqual({ action: 'reopen', allowed: true, block: null });
    expect(taskToggle({ status: 'todo', assignee_id: 'b', mission_state: 'accepted' }, 'a')).toMatchObject({ allowed: false, block: 'mission_recipient' });
    expect(taskToggle({ status: 'todo', assignee_id: 'b', mission_state: 'accepted' }, 'b')).toMatchObject({ allowed: true, action: 'complete' });
    expect(taskToggle({ status: 'done', assignee_id: 'b', mission_state: 'done' }, 'b')).toMatchObject({ allowed: false, block: 'mission_closed', action: 'reopen' });
    expect(taskToggle({ status: 'cancelled', assignee_id: null }, 'a')).toMatchObject({ allowed: false, block: 'cancelled' });
    expect(taskToggle({ status: 'todo', assignee_id: null, mission_state: 'pending' }, null)).toMatchObject({ allowed: false });
  });
});

describe('dégustations par aliment', () => {
  const tastings = [
    { id: 't1', food_key: 'pear', food_name: 'Poire', tasted_on: '2025-01-24', created_at: '2025-01-24T12:00:00Z', note: 'Quelques cuillerées, bien acceptées' },
    { id: 't2', food_key: 'carrot', food_name: 'Carotte', tasted_on: '2025-01-20', created_at: '2025-01-20T12:00:00Z', note: null },
    { id: 't3', food_key: 'pear', food_name: 'Poire', tasted_on: '2025-01-27', created_at: '2025-01-27T12:00:00Z', note: 'a fait la grimace' },
    { id: 't4', food_key: null, food_name: 'Banane', tasted_on: '2025-01-22', created_at: '2025-01-22T12:00:00Z', note: 'plaques rouges ?' },
    { id: 't5', food_key: null, food_name: 'banane ', tasted_on: '2025-01-25', created_at: '2025-01-25T12:00:00Z', note: null },
  ];
  it('un groupe par aliment (clé du catalogue, sinon nom replié), du plus récent au plus ancien', () => {
    const g = tastingsByFood(tastings);
    expect(g.map((x) => x.key)).toEqual(['pear', 'name:banane', 'carrot']);
    expect(g[0].tastings.map((x) => x.id)).toEqual(['t3', 't1']);
    expect(g[0].first.id).toBe('t1');
    expect(g[1].tastings.map((x) => x.id)).toEqual(['t5', 't4']);
    expect(foodGroupKey({ food_key: null, food_name: 'Bânane' })).toBe('name:banane');
  });
  it('« Première dégustation » : la plus ancienne de chaque aliment', () => {
    expect([...firstTastingIds(tastings)].sort()).toEqual(['t1', 't2', 't4']);
  });
  it('journal d’un aliment ; aliment jamais goûté = journal vide', () => {
    expect(foodJournal(tastings, 'pear').map((x) => x.id)).toEqual(['t3', 't1']);
    expect(foodJournal(tastings, 'apple')).toEqual([]);
  });
  it('les notes ne changent rien au regroupement (aucune déduction d’allergie)', () => {
    const g = tastingsByFood(tastings).find((x) => x.key === 'name:banane')!;
    expect(Object.keys(g).sort()).toEqual(['first', 'food_key', 'food_name', 'key', 'last', 'tastings']);
  });
  it('correction de date : première date de l’aliment recalculée', () => {
    expect(firstTriedAfter(tastings, 'pear', 't1', '2025-01-30')).toBe('2025-01-27');
    expect(firstTriedAfter(tastings, 'pear', 't3', '2025-01-10')).toBe('2025-01-10');
    expect(firstTriedAfter(tastings, 'pear', null, '2025-01-01')).toBe('2025-01-01');   // ajout
    expect(firstTriedAfter([], 'pear', null, null)).toBeNull();
  });
  it('dates saisies JJ/MM/AAAA', () => {
    expect(frDayToIso('24/01/2025')).toBe('2025-01-24');
    expect(frDayToIso('4/1/2025')).toBe('2025-01-04');
    expect(frDayToIso('31/02/2025')).toBeNull();
    expect(frDayToIso('demain')).toBeNull();
    expect(isoToFrDay('2025-01-24')).toBe('24/01/2025');
    expect(isoDay(new Date(2025, 0, 24, 23, 59))).toBe('2025-01-24');
  });
});
