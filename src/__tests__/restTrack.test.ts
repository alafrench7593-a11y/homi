import {
  carePatch, careEditSpec, daysSinceBirth, domainsBoard, lastReadCategory, mealLine, mealPatch, mealsOfDay, missionsSplit,
  NAME_KEPT, NAME_SET_ASIDE, nameFixError, namesBoard, notedDays, parseFoods, scoopProgress, weekParam,
} from '../lib/domain/restTrack';
import { scoopsFor } from '../lib/domain/scoops';
import { isoDay } from '../lib/domain/journalTrack';

const local = (y: number, mo: number, d: number, h: number, mi = 0) => new Date(y, mo - 1, d, h, mi).toISOString();

describe('repas d’un enfant', () => {
  const meals = [
    { id: 'b', at: local(2026, 11, 20, 12, 30), description: null, foods: ['carotte', 'riz'] },
    { id: 'a', at: local(2026, 11, 20, 8), description: 'Petit pot', foods: [] },
    { id: 'c', at: local(2026, 11, 21, 19), description: null, foods: null },
  ];
  it('trie les repas d’un jour local et ignore les autres jours', () => {
    expect(mealsOfDay(meals, '2026-11-20').map((m) => m.id)).toEqual(['a', 'b']);
    expect(mealsOfDay(meals, '2026-11-22')).toEqual([]);
  });
  it('montre les aliments, sinon la description, sinon rien', () => {
    expect(mealLine(meals[0])).toBe('carotte, riz');
    expect(mealLine(meals[1])).toBe('Petit pot');
    expect(mealLine(meals[2])).toBeNull();
  });
  it('lit une liste d’aliments sans doublon ni vide', () => {
    expect(parseFoods(' carotte, Pomme ,, carotte; riz ')).toEqual(['carotte', 'Pomme', 'riz']);
    expect(parseFoods('')).toEqual([]);
  });
  it('corrige l’heure, les aliments et la note avec un patch minimal', () => {
    const orig = { id: 'x', at: local(2026, 11, 20, 12, 30), description: null, foods: ['carotte', 'riz'], refused_foods: ['riz'], reaction_note: null };
    expect(mealPatch(orig, { time: '12:30', foods: 'carotte, riz', note: '' })).toEqual({});
    expect(mealPatch(orig, { time: '13:05', foods: 'carotte, riz', note: '' })).toEqual({ at: local(2026, 11, 20, 13, 5) });
    expect(mealPatch(orig, { time: '12:30', foods: 'carotte', note: ' a bien mangé ' })).toEqual({ foods: ['carotte'], refused_foods: [], reaction_note: 'a bien mangé' });
    expect(mealPatch(orig, { time: '25:00', foods: '', note: '' })).toBeNull();
  });
});

describe('mesurettes', () => {
  it('compare le compte touché au compte calculé, sans rien proposer', () => {
    expect(scoopProgress(0, null)).toEqual({ state: 'no_rule', remaining: null, extra: 0 });
    expect(scoopProgress(2, 5)).toEqual({ state: 'counting', remaining: 3, extra: 0 });
    expect(scoopProgress(5, 5)).toEqual({ state: 'done', remaining: 0, extra: 0 });
    expect(scoopProgress(6, 5)).toEqual({ state: 'over', remaining: 0, extra: 1 });
    expect(scoopProgress(-3, 4).remaining).toBe(4);
  });
  it('le compte vient de la règle de la boîte seulement (jamais d’arrondi silencieux)', () => {
    const p = scoopsFor(150, 30)!;
    expect(p.exact && p.scoops).toBe(5);
    const q = scoopsFor(100, 30)!;
    expect(q.exact).toBe(false);
    expect(scoopProgress(3, q.exact ? q.scoops : null).state).toBe('no_rule');
  });
});

describe('prénoms gardés / écartés', () => {
  const favs = [
    { id: '1', name: 'Alix', list_label: NAME_KEPT, added_by: 'me', created_at: '2026-11-01T10:00:00Z' },
    { id: '2', name: 'Léon', list_label: NAME_SET_ASIDE, added_by: 'p', created_at: '2026-11-02T10:00:00Z' },
    { id: '3', name: 'Inès', list_label: NAME_KEPT, added_by: 'p', created_at: '2026-11-03T10:00:00Z' },
  ];
  const votes = [{ favorite_id: '1', user_id: 'me', vote: 1 as const }, { favorite_id: '1', user_id: 'p', vote: -1 as const }, { favorite_id: '3', user_id: 'p', vote: 0 as const }];
  it('sépare gardés et écartés, plus récents d’abord, votes comptés sans score', () => {
    const b = namesBoard(favs, votes);
    expect(b.kept.map((r) => r.fav.name)).toEqual(['Inès', 'Alix']);
    expect(b.setAside.map((r) => r.fav.name)).toEqual(['Léon']);
    expect(b.kept[1]).toMatchObject({ pro: 1, con: 1 });
    expect(b.kept[0]).toMatchObject({ pro: 0, con: 0 });
  });
  it('refuse un nom vide, trop long ou déjà présent dans la même liste', () => {
    expect(nameFixError(' ', NAME_KEPT, '1', favs)).toBe('empty');
    expect(nameFixError('x'.repeat(41), NAME_KEPT, '1', favs)).toBe('long');
    expect(nameFixError('ines', NAME_KEPT, '1', favs)).toBe('taken');
    expect(nameFixError('Leon', NAME_KEPT, '1', favs)).toBeNull();
    expect(nameFixError('Alix', NAME_KEPT, '1', favs)).toBeNull();
  });
});

describe('post-partum', () => {
  it('compte les jours depuis la naissance, jamais négatifs', () => {
    expect(daysSinceBirth('2026-11-10', '2026-11-22')).toBe(12);
    expect(daysSinceBirth('2026-11-22', '2026-11-22')).toBe(0);
    expect(daysSinceBirth('2026-12-01', '2026-11-22')).toBeNull();
    expect(daysSinceBirth(null, '2026-11-22')).toBeNull();
    expect(daysSinceBirth('2026-03-28', '2026-03-30')).toBe(2);
  });
  it('compte les jours notés, pas une moyenne', () => {
    expect(notedDays([{ checkin_date: '2026-11-20' }, { checkin_date: '2026-11-01' }], ['2026-11-20', '2026-11-21'])).toBe(1);
  });
});

describe('semaine de grossesse dans l’adresse', () => {
  it('lit une semaine valide seulement', () => {
    expect(weekParam('24')).toBe(24);
    expect(weekParam(['12'])).toBe(12);
    expect(weekParam('3')).toBeNull();
    expect(weekParam('43')).toBeNull();
    expect(weekParam('abc')).toBeNull();
    expect(weekParam(undefined)).toBeNull();
  });
});

describe('carnet de garde', () => {
  const now = new Date(2026, 10, 22, 18, 0);
  it('sait où corriger chaque saisie, jamais une photo ni une saisie en attente', () => {
    expect(careEditSpec('meal')).toEqual({ table: 'meals', timeCol: 'at', noteCol: 'reaction_note' });
    expect(careEditSpec('sleep')?.timeCol).toBe('started_at');
    expect(careEditSpec('arrival')?.table).toBe('childcare_events');
    expect(careEditSpec('photo')).toBeNull();
    expect(careEditSpec('bottle', true)).toBeNull();
  });
  it('corrige l’heure du même jour et la note', () => {
    const spec = careEditSpec('bottle')!;
    const row = { at: local(2026, 11, 22, 10, 0), note: null };
    expect(carePatch(spec, row, { time: '10:00', note: '' }, now)).toEqual({ patch: {} });
    expect(carePatch(spec, row, { time: '10:20', note: 'a tout bu' }, now)).toEqual({ patch: { at: local(2026, 11, 22, 10, 20), note: 'a tout bu' } });
    expect(carePatch(spec, row, { time: '19:00', note: '' }, now)).toEqual({ error: 'future' });
    expect(carePatch(spec, row, { time: 'midi', note: '' }, now)).toEqual({ error: 'time' });
  });
  it('refuse un début de sieste après sa fin', () => {
    const spec = careEditSpec('sleep')!;
    const row = { started_at: local(2026, 11, 22, 13, 0), ended_at: local(2026, 11, 22, 14, 0), note: null };
    expect(carePatch(spec, row, { time: '14:30', note: '' }, now)).toEqual({ error: 'order' });
    expect(carePatch(spec, row, { time: '12:50', note: '' }, now)).toEqual({ patch: { started_at: local(2026, 11, 22, 12, 50) } });
  });
});

describe('missions et domaines', () => {
  it('sépare restant et fait, les faites d’un jour d’abord les plus récentes', () => {
    const d = isoDay(new Date(2026, 10, 20, 12));
    const all = [
      { id: 'a', mission_state: 'pending', done_at: null, done_by: null, assignee_id: 'x' },
      { id: 'b', mission_state: 'done', done_at: local(2026, 11, 20, 9), done_by: 'x', assignee_id: 'x' },
      { id: 'c', mission_state: 'done', done_at: local(2026, 11, 20, 18), done_by: 'y', assignee_id: 'y' },
      { id: 'd', mission_state: 'declined', done_at: null, done_by: null, assignee_id: 'y' },
      { id: 'e', mission_state: 'done', done_at: local(2026, 11, 19, 9), done_by: 'x', assignee_id: 'x' },
    ];
    const s = missionsSplit(all, d);
    expect(s.remaining.map((m) => m.id)).toEqual(['a']);
    expect(s.done).toHaveLength(3);
    expect(s.doneOn.map((m) => m.id)).toEqual(['c', 'b']);
  });
  it('compte les domaines portés et libres (ancien membre = libre)', () => {
    const owners = new Map<string, string | null>([['health', 'a'], ['school', 'b'], ['admin', 'gone'], ['food', null]]);
    const b = domainsBoard(['health', 'school', 'admin', 'food', 'home'], owners, [{ id: 'a' }, { id: 'b' }]);
    expect(b.per).toEqual([{ id: 'a', count: 1 }, { id: 'b', count: 1 }]);
    expect(b.free).toBe(3);
    expect(b.carried).toBe(2);
  });
});

describe('communauté', () => {
  it('retrouve la dernière catégorie lue, sinon rien', () => {
    expect(lastReadCategory([{ forum_id: 'a', last_at: '2026-11-01T00:00:00Z' }, { forum_id: 'b', last_at: '2026-11-20T00:00:00Z' }, { forum_id: 'c', last_at: null }])?.forum_id).toBe('b');
    expect(lastReadCategory([])).toBeNull();
  });
});
