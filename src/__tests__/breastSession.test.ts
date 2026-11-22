/**
 * Allaitement et tire-lait (22/11/2026) : une tétée = une ligne ; changer de côté ne crée jamais une seconde tétée ;
 * durée de CHAQUE côté retrouvée ; tétée qui traverse minuit ; réouverture pendant une tétée (état tiré de la donnée) ;
 * totaux du jour en minutes, « rien de noté » ≠ 0 ; corrections de la fin et d'un côté.
 */
import {
  currentSide, feedMinutes, feedSeconds, feedsByDay, finishPatch, isOngoing, lastFeed, proposedFeedEnd, sidesUsed, startRow,
  stopwatch, switchPatch, withEnd, withSideMinutes, type FeedLike,
} from '@/lib/domain/breastSession';
import { lastPump, parsePumpMl, pumpsByDay, type PumpLike } from '@/lib/domain/pumpSession';

const at = (day: number, h: number, m: number, s = 0) => new Date(2026, 10, day, h, m, s);
const iso = (day: number, h: number, m: number, s = 0) => at(day, h, m, s).toISOString();
const feed = (o: Partial<FeedLike>): FeedLike => ({ id: 'f', child_id: 'lea', side: 'left', started_at: iso(22, 14, 26), ended_at: null, note: null, ...o });
const apply = (f: FeedLike, patch: object | null): FeedLike => ({ ...f, ...(patch ?? {}) });

describe('une tétée, deux côtés, une seule ligne', () => {
  it('démarrer → changer de côté → terminer : même id, durée de chaque côté', () => {
    let f: FeedLike = { id: 'f1', child_id: 'lea', note: null, ...startRow('left', at(22, 14, 26)) };
    expect(isOngoing(f, at(22, 14, 30))).toBe(true);
    expect(currentSide(f, at(22, 14, 30))).toBe('left');
    f = apply(f, switchPatch(f, at(22, 14, 38)));
    expect(f.id).toBe('f1');
    expect(f.side).toBe('both');
    expect(currentSide(f, at(22, 14, 40))).toBe('right');
    expect(feedSeconds(f, at(22, 14, 40, 30))).toEqual({ total: 14 * 60 + 30, left: 12 * 60, right: 2 * 60 + 30 });
    f = apply(f, finishPatch(f, at(22, 14, 47)));
    expect(isOngoing(f, at(22, 15, 0))).toBe(false);
    expect(feedMinutes(f, at(22, 16, 0))).toEqual({ total: 21, left: 12, right: 9 });
    expect(sidesUsed(f)).toEqual(['left', 'right']);
  });
  it('appui manqué (moins de 5 s) : le côté est remplacé, pas de segment minuscule', () => {
    let f: FeedLike = { id: 'f', child_id: 'lea', ...startRow('left', at(22, 14, 26)) };
    f = apply(f, switchPatch(f, at(22, 14, 26, 2)));
    expect(f.segments).toHaveLength(1);
    expect(currentSide(f, at(22, 14, 27))).toBe('right');
    expect(f.side).toBe('right');
  });
  it('revenir au premier côté : trois passages, durées additionnées par côté', () => {
    let f: FeedLike = { id: 'f', child_id: 'lea', ...startRow('left', at(22, 10, 0)) };
    f = apply(f, switchPatch(f, at(22, 10, 5)));
    f = apply(f, switchPatch(f, at(22, 10, 12)));
    f = apply(f, finishPatch(f, at(22, 10, 15)));
    expect(f.segments).toHaveLength(3);
    expect(feedMinutes(f, at(22, 11, 0))).toEqual({ total: 15, left: 8, right: 7 });
  });
  it('tétée terminée : pas de changement de côté possible', () => {
    expect(switchPatch(feed({ ended_at: iso(22, 14, 40) }), at(22, 15, 0))).toBeNull();
  });
});

describe('réouverture de l\'app et anciennes saisies', () => {
  it('l\'état vient de la donnée : dernier segment ouvert = en cours, quelle que soit l\'heure', () => {
    const f = feed({ segments: [{ side: 'left', from: iso(22, 9, 0), to: null }], started_at: iso(22, 9, 0) });
    expect(isOngoing(f, at(22, 13, 0))).toBe(true);
    expect(stopwatch(feedSeconds(f, at(22, 9, 8, 42)).total!)).toBe('08:42');
  });
  it('sans segments : côté unique sur toute la tétée ; sans fin depuis plus de 3 h → durée non notée (null, pas 0)', () => {
    const old = feed({ started_at: iso(22, 8, 0) });
    expect(isOngoing(old, at(22, 12, 0))).toBe(false);
    expect(feedMinutes(old, at(22, 12, 0))).toEqual({ total: null, left: null, right: null });
    const right = feed({ side: 'right', started_at: iso(22, 11, 7), ended_at: iso(22, 11, 24) });
    expect(feedMinutes(right, at(22, 12, 0))).toEqual({ total: 17, left: 0, right: 17 });
  });
  it('« les deux » sans répartition : total connu, côtés inconnus (null)', () => {
    const both = feed({ side: 'both', started_at: iso(22, 7, 0), ended_at: iso(22, 7, 20) });
    expect(feedMinutes(both, at(22, 12, 0))).toEqual({ total: 20, left: null, right: null });
  });
  it('chronomètre : minutes et secondes à largeur fixe, heures au-delà', () => {
    expect(stopwatch(0)).toBe('00:00');
    expect(stopwatch(522)).toBe('08:42');
    expect(stopwatch(3600 + 8 * 60 + 42)).toBe('1:08:42');
  });
});

describe('totaux du jour (minutes) et minuit', () => {
  const feeds: FeedLike[] = [
    feed({ id: 'nuit', side: 'both', started_at: iso(21, 23, 50), ended_at: iso(22, 0, 20), segments: [{ side: 'left', from: iso(21, 23, 50), to: iso(22, 0, 5) }, { side: 'right', from: iso(22, 0, 5), to: iso(22, 0, 20) }] }),
    feed({ id: 'matin', side: 'right', started_at: iso(22, 11, 7), ended_at: iso(22, 11, 24) }),
    feed({ id: 'deux', side: 'both', started_at: iso(22, 13, 0), ended_at: iso(22, 13, 10) }),
    feed({ id: 'noe', child_id: 'noe', started_at: iso(22, 12, 0), ended_at: iso(22, 12, 30) }),
  ];
  const NOW = at(22, 14, 30);
  it('la tétée de 23 h 50 est répartie : 10 min la veille, 20 min aujourd\'hui', () => {
    const [y, d] = feedsByDay(feeds, 'lea', NOW, 2);
    expect(y).toMatchObject({ count: 1, minutes: 10, left: 10, right: 0 });
    expect(d.count).toBe(3);
    expect(d.minutes).toBe(20 + 17 + 10);
    expect(d.left).toBe(5);
    expect(d.right).toBe(15 + 17);
    expect(d.noSplit).toBe(1);
  });
  it('jour sans tétée : null (« rien de noté »), jamais 0 ; l\'autre enfant n\'est jamais compté', () => {
    const days = feedsByDay(feeds, 'lea', NOW, 4);
    expect(days[0]).toMatchObject({ count: 0, minutes: null, left: null, right: null });
    expect(days[3].sessions.map((s) => s.id)).not.toContain('noe');
  });
  it('tétée en cours comptée jusqu\'à maintenant ; dernière tétée = celle en cours', () => {
    const live = [...feeds, feed({ id: 'live', started_at: iso(22, 14, 26), segments: [{ side: 'left', from: iso(22, 14, 26), to: null }] })];
    expect(feedsByDay(live, 'lea', NOW, 1)[0].minutes).toBe(47 + 4);
    expect(lastFeed(live, 'lea', NOW)).toEqual({ feed: expect.objectContaining({ id: 'live' }), ongoing: true });
    expect(lastFeed(feeds, 'lea', NOW)?.feed.id).toBe('deux');
    expect(lastFeed([], 'lea', NOW)).toBeNull();
  });
  it('tétée sans durée notée : comptée comme tétée, pas dans les minutes', () => {
    const d = feedsByDay([feed({ id: 'x', started_at: iso(22, 6, 0) })], 'lea', NOW, 1)[0];
    expect(d).toMatchObject({ count: 1, minutes: null, noDuration: 1 });
  });
});

describe('corrections', () => {
  const done = feed({ side: 'both', started_at: iso(22, 11, 0), ended_at: iso(22, 11, 20), segments: [{ side: 'left', from: iso(22, 11, 0), to: iso(22, 11, 12) }, { side: 'right', from: iso(22, 11, 12), to: iso(22, 11, 20) }] });
  const NOW = at(22, 15, 0);
  it('fin corrigée : le dernier côté se raccourcit, le début reste ancré', () => {
    const end = proposedFeedEnd(done, '11:17')!;
    const f = apply(done, withEnd(done, end));
    expect(f.started_at).toBe(iso(22, 11, 0));
    expect(feedMinutes(f, NOW)).toEqual({ total: 17, left: 12, right: 5 });
  });
  it('fin avant la reprise de l\'autre côté : ce côté disparaît', () => {
    const f = apply(done, withEnd(done, at(22, 11, 10)));
    expect(feedMinutes(f, NOW)).toEqual({ total: 10, left: 10, right: 0 });
    expect(f.segments).toHaveLength(1);
  });
  it('fin de nuit : 0:20 après 23:50 → le lendemain', () => {
    const n = feed({ started_at: iso(21, 23, 50), ended_at: iso(22, 0, 10) });
    expect(proposedFeedEnd(n, '0:20')!.toISOString()).toBe(iso(22, 0, 20));
    expect(withEnd(n, at(21, 23, 0))).toBeNull();
  });
  it('côté gauche 12 → 15 min : la suite est décalée, la fin suit (11 h 23)', () => {
    const p = withSideMinutes(done, 'left', 15, NOW)!;
    const f = apply(done, p);
    expect(feedMinutes(f, NOW)).toEqual({ total: 23, left: 15, right: 8 });
    expect(p.ended_at).toBe(iso(22, 11, 23));
  });
  it('côté droit 8 → 3 min ; côté mis à 0 : il disparaît, une seule ligne reste', () => {
    expect(feedMinutes(apply(done, withSideMinutes(done, 'right', 3, NOW)), NOW)).toEqual({ total: 15, left: 12, right: 3 });
    const zero = apply(done, withSideMinutes(done, 'left', 0, NOW));
    expect(feedMinutes(zero, NOW)).toEqual({ total: 8, left: 0, right: 8 });
    expect(zero.started_at).toBe(iso(22, 11, 0));
    expect(zero.side).toBe('right');
  });
  it('« les deux » sans répartition : le côté corrigé d\'abord, l\'autre pour le reste', () => {
    const both = feed({ side: 'both', started_at: iso(22, 7, 0), ended_at: iso(22, 7, 20) });
    expect(feedMinutes(apply(both, withSideMinutes(both, 'left', 12, NOW)), NOW)).toEqual({ total: 20, left: 12, right: 8 });
  });
  it('ajouter un côté jamais pris ; refus pendant une tétée en cours ou valeur invalide', () => {
    const r = feed({ side: 'right', started_at: iso(22, 9, 0), ended_at: iso(22, 9, 10) });
    expect(feedMinutes(apply(r, withSideMinutes(r, 'left', 4, NOW)), NOW)).toEqual({ total: 14, left: 4, right: 10 });
    expect(withSideMinutes(feed({ started_at: iso(22, 14, 50) }), 'left', 3, NOW)).toBeNull();
    expect(withSideMinutes(done, 'left', -1, NOW)).toBeNull();
    expect(withSideMinutes(done, 'left', 2.5, NOW)).toBeNull();
  });
});

describe('tire-lait : ml avec ml, rien de noté ≠ 0', () => {
  const p = (id: string, day: number, h: number, ml: number, child = 'lea'): PumpLike => ({ id, child_id: child, at: iso(day, h, 0), amount_ml: ml, side: 'both' });
  const all = [p('a', 22, 8, 120), p('b', 22, 13, 0), p('c', 21, 9, 90), p('n', 22, 9, 300, 'noe')];
  it('totaux par jour ; un vrai 0 ml noté compte comme séance', () => {
    const days = pumpsByDay(all, 'lea', at(22, 15, 0), 3);
    expect(days.map((d) => d.ml)).toEqual([null, 90, 120]);
    expect(days[2].count).toBe(2);
    expect(lastPump(all, 'lea')?.id).toBe('b');
  });
  it('quantité saisie', () => {
    expect(parsePumpMl('120')).toBe(120);
    expect(parsePumpMl(' 80 ml')).toBe(80);
    expect(parsePumpMl('0')).toBe(0);
    expect(parsePumpMl('1200')).toBeNull();
    expect(parsePumpMl('abc')).toBeNull();
  });
});
