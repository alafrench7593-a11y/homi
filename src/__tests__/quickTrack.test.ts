/**
 * Journaux rapides (biberons, couches) et résumés des catégories Alimentation / Soins : une seule donnée source, jours
 * sans saisie « inconnus » (null) jamais 0, unités jamais mélangées, corrections d'heure et de quantité.
 */
import {
  bottleEditError, bottlesByDay, clampMl, dayKeys, diaperPatch, diapersByDay, diaperType, feedMinutes, feedsByDay, foodsByDay, hhmm,
  editGuards, knownTotal, lastBottle, lastConsumedMl, lastDiaper, lastFeeding, minutesSince, parseMlText, proposedTime,
  type BottleLike, type DiaperLike, type FeedLike, type FoodLike,
} from '@/lib/domain/quickTrack';

const iso = (day: number, h: number, m = 0) => new Date(2026, 10, day, h, m).toISOString();
const NOW = new Date(2026, 10, 23, 15, 20);
const b = (id: string, day: number, h: number, m: number, ml: number | null, extra: Partial<BottleLike> = {}): BottleLike =>
  ({ id, child_id: 'lina', at: iso(day, h, m), consumed_ml: ml, prepared_ml: null, ...extra });
const bottles: BottleLike[] = [
  b('b1', 23, 7, 0, 150), b('b2', 23, 10, 30, 120), b('b3', 23, 14, 5, null),
  b('y1', 22, 8, 0, 180), b('y2', 22, 12, 0, 160),
  b('q1', 20, 9, 0, null), // biberon noté sans quantité
  b('live', 23, 15, 0, null, { in_progress: true }),
  { id: 'noe', child_id: 'noe', at: iso(23, 9, 0), consumed_ml: 200 },
];

describe('biberons : millilitres par jour', () => {
  it('somme du jour = quantités bues notées ; le biberon en direct et Noé ne comptent pas', () => {
    const d = bottlesByDay(bottles, 'lina', NOW, 7);
    expect(d.map((x) => x.day)).toEqual(dayKeys(NOW, 7));
    expect(d[6]).toMatchObject({ ml: 270, count: 3, withQuantity: 2 });
    expect(d[6].entries.map((x) => x.id)).toEqual(['b1', 'b2', 'b3']);
    expect(d[5]).toMatchObject({ ml: 340, count: 2 });
  });
  it('jour sans saisie → null (« rien de noté »), jamais 0 ; jour avec biberons sans quantité → null aussi', () => {
    const d = bottlesByDay(bottles, 'lina', NOW, 7);
    expect(d[0]).toMatchObject({ ml: null, count: 0 });
    expect(d[3]).toMatchObject({ ml: null, count: 1, withQuantity: 0 });
    expect(knownTotal(d.map((x) => x.ml))).toEqual({ total: 610, knownDays: 2 });
    expect(knownTotal(bottlesByDay([], 'lina', NOW, 7).map((x) => x.ml))).toEqual({ total: null, knownDays: 0 });
  });
  it('période « Jour » = un seul jour, aujourd’hui', () => {
    expect(bottlesByDay(bottles, 'lina', NOW, 1)).toHaveLength(1);
    expect(bottlesByDay(bottles, 'lina', NOW, 1)[0].ml).toBe(270);
  });
  it('un vrai 0 ml bu reste 0 (noté), distinct de « rien de noté »', () => {
    const d = bottlesByDay([b('z', 23, 9, 0, 0)], 'lina', NOW, 1);
    expect(d[0].ml).toBe(0);
  });
});

describe('dernière prise et quantité reprise', () => {
  it('dernier biberon terminé (jamais celui en direct ni un autre enfant)', () => {
    expect(lastBottle(bottles, 'lina', NOW)?.id).toBe('b3');
  });
  it('quantité proposée = dernière quantité BUE notée (reprise, pas une suggestion) ; aucune → null', () => {
    expect(lastConsumedMl(bottles, 'lina')).toBe(120);
    expect(lastConsumedMl([b('x', 23, 9, 0, null)], 'lina')).toBeNull();
    expect(lastConsumedMl(bottles, 'noe')).toBe(200);
  });
  it('dernière prise d’alimentation : la plus récente entre biberon et tétée', () => {
    const feeds: FeedLike[] = [{ id: 'f1', child_id: 'lina', started_at: iso(23, 14, 40), ended_at: iso(23, 14, 55), side: 'left' }];
    expect(lastFeeding(bottles, feeds, 'lina', NOW)).toMatchObject({ kind: 'breastfeed', at: iso(23, 14, 40) });
    expect(lastFeeding(bottles, [], 'lina', NOW)).toMatchObject({ kind: 'bottle', item: { id: 'b3' } });
    expect(lastFeeding([], [], 'lina', NOW)).toBeNull();
  });
  it('« il y a » : minutes écoulées, jamais négatives', () => {
    expect(minutesSince(iso(23, 14, 5), NOW)).toBe(75);
    expect(minutesSince(iso(23, 16, 0), NOW)).toBe(0);
  });
});

describe('tétées et aliments : totaux séparés, jamais mêlés aux ml', () => {
  const feeds: FeedLike[] = [
    { id: 'f1', child_id: 'lina', started_at: iso(23, 6, 0), ended_at: iso(23, 6, 20) },
    { id: 'f2', child_id: 'lina', started_at: iso(23, 11, 0), ended_at: null }, // durée inconnue
    { id: 'f3', child_id: 'lina', started_at: iso(21, 9, 0), ended_at: null },
  ];
  it('minutes par jour : une tétée sans fin n’est pas comptée 0 ; un jour sans durée connue reste null', () => {
    expect(feedMinutes(feeds[1])).toBeNull();
    const d = feedsByDay(feeds, 'lina', NOW, 7);
    expect(d[6]).toMatchObject({ minutes: 20, count: 2 });
    expect(d[4]).toMatchObject({ minutes: null, count: 1 });
    expect(d[5]).toMatchObject({ minutes: null, count: 0 });
  });
  it('aliments découverts par jour (première fois goûtée), « pas encore » exclu', () => {
    const foods: FoodLike[] = [
      { id: 'a', child_id: 'lina', food_name: 'Carotte', status: 'tasted', first_tried_on: '2026-11-23' },
      { id: 'c', child_id: 'lina', food_name: 'Banane', status: 'liked', first_tried_on: '2026-11-23' },
      { id: 'n', child_id: 'lina', food_name: 'Kiwi', status: 'not_yet', first_tried_on: null },
      { id: 'o', child_id: 'lina', food_name: 'Poire', status: 'tasted', first_tried_on: '2026-10-01' },
    ];
    const d = foodsByDay(foods, 'lina', NOW, 7);
    expect(d[6].count).toBe(2);
    expect(d[6].entries.map((x) => x.food_name)).toEqual(['Banane', 'Carotte']);
    expect(d[0].count).toBeNull();
    expect(knownTotal(d.map((x) => x.count))).toEqual({ total: 2, knownDays: 1 });
  });
});

describe('couches par jour', () => {
  const dia = (id: string, day: number, h: number, wet: boolean, stool: boolean, child = 'lina'): DiaperLike => ({ id, child_id: child, at: iso(day, h), wet, stool });
  const all = [dia('d1', 23, 7, true, false), dia('d2', 23, 10, false, true), dia('d3', 23, 13, true, true), dia('d4', 22, 9, true, false), dia('x', 23, 8, true, false, 'noe')];
  it('nombre du jour et répartition par type ; un change compte une fois', () => {
    const d = diapersByDay(all, 'lina', NOW, 7);
    expect(d[6]).toMatchObject({ count: 3, wet: 1, stool: 1, both: 1 });
    expect(d[5]).toMatchObject({ count: 1, wet: 1 });
    expect(diaperType({ wet: true, stool: true })).toBe('both');
    expect(diaperType({ wet: false, stool: false })).toBe('none');
  });
  it('jour sans change → null (« rien de noté »), jamais 0 ; la période ne compte que les jours renseignés', () => {
    const d = diapersByDay(all, 'lina', NOW, 7);
    expect(d.slice(0, 5).every((x) => x.count === null)).toBe(true);
    expect(knownTotal(d.map((x) => x.count))).toEqual({ total: 4, knownDays: 2 });
    expect(lastDiaper(all, 'lina')?.id).toBe('d3');
  });
  it('changer le type : les détails des selles disparaissent quand il n’y a plus de selles', () => {
    expect(diaperPatch('wet')).toEqual({ wet: true, stool: false, stool_color: null, stool_consistency: null, blood_seen: false });
    expect(diaperPatch('both')).toEqual({ wet: true, stool: true });
    expect(diaperPatch('stool')).toEqual({ wet: false, stool: true });
  });
});

describe('corrections : heure et quantité', () => {
  it('nouvelle heure le même jour que l’heure d’origine ; formats acceptés ; invalide ou future → null', () => {
    const o = iso(23, 14, 5);
    expect(proposedTime(o, '13:50', NOW)?.toISOString()).toBe(iso(23, 13, 50));
    expect(proposedTime(o, '13h50', NOW)?.toISOString()).toBe(iso(23, 13, 50));
    expect(proposedTime(o, '1350', NOW)?.toISOString()).toBe(iso(23, 13, 50));
    expect(proposedTime(o, '9:05', NOW)?.toISOString()).toBe(iso(23, 9, 5));
    expect(proposedTime(o, '25:00', NOW)).toBeNull();
    expect(proposedTime(o, 'abc', NOW)).toBeNull();
    expect(proposedTime(o, '18:00', NOW)).toBeNull(); // dans le futur
    expect(proposedTime(iso(22, 23, 0), '23:30', NOW)?.toISOString()).toBe(iso(22, 23, 30));
    expect(hhmm(new Date(2026, 10, 23, 9, 5))).toBe('09:05');
  });
  it('quantité : bornes 0–500, pas plus que le préparé noté', () => {
    expect(clampMl(-10)).toBe(0);
    expect(clampMl(510)).toBe(500);
    expect(parseMlText('150')).toBe(150);
    expect(parseMlText('600')).toBeNull();
    expect(parseMlText('1,5')).toBeNull();
    expect(bottleEditError({ consumed: 200, prepared: 180 })).toBe('over');
    expect(bottleEditError({ consumed: 170, prepared: 180 })).toBeNull();
    expect(bottleEditError({ consumed: 170, prepared: null })).toBeNull();
  });
  it('correction 120 → 140 ml : le jour monte de 20 ml, les autres jours restent identiques', () => {
    const before = bottlesByDay(bottles, 'lina', NOW, 7);
    const after = bottlesByDay(bottles.map((x) => (x.id === 'b2' ? { ...x, consumed_ml: 140 } : x)), 'lina', NOW, 7);
    expect(after[6].ml! - before[6].ml!).toBe(20);
    expect(after.slice(0, 6)).toEqual(before.slice(0, 6));
  });
  it('heure déplacée la veille au soir → change de jour dans le résumé', () => {
    const moved = bottles.map((x) => (x.id === 'b1' ? { ...x, at: iso(22, 23, 30) } : x));
    const d = bottlesByDay(moved, 'lina', NOW, 7);
    expect(d[6].ml).toBe(120);
    expect(d[5].ml).toBe(490);
  });
  it('garde F-05 (même chemin que le formulaire) : seuls les champs simples déjà présents sont vérifiés', () => {
    const g = editGuards({ at: 'x', consumed_ml: 140, stool_color: null }, { id: '1', at: iso(23, 10, 30), consumed_ml: 120, note: null });
    expect(g).toEqual([{ col: 'at', op: 'eq', value: iso(23, 10, 30) }, { col: 'consumed_ml', op: 'eq', value: 120 }]);
    expect(editGuards({ consumed_ml: 140 }, { consumed_ml: null })).toEqual([{ col: 'consumed_ml', op: 'is', value: null }]);
  });
});
