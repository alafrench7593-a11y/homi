/** Allaitement : chronomètre de tétée (segments réels), tirage, réserve de lait, accueil et historique — logique pure + moteur local. */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import { createDemoBackend } from '@/lib/backend/demo';
import { eq } from '@/lib/backend/types';
import {
  canSave, clock, computedTotal, correctTimes, currentSegmentMs, currentSide, dailyPumpVolumes, durationBySide, elapsedMs, FeedError, feedingDaySummary,
  feedingHistory, finishSession, groupSessions, inferFeedingMode, lastFeedingSession, markSaved, milkKind, pauseSession, pumpRow, resumeSession, reviveSession,
  segmentClientId, sortStash, startSession, stashRemaining, stashRow, stashTransition, switchSide, toBreastfeedRows, type FeedSession, type StashPortion,
} from '@/lib/domain/lactation';
import type { Child } from '@/lib/types';

const SID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
const T0 = Date.parse('2026-11-13T03:00:00.000Z');
const s = (n: number) => n * 1000;
const min = (n: number) => n * 60_000;

describe('chronomètre de tétée', () => {
  it('démarrer : un segment ouvert, durée = temps réel écoulé (pas un compteur)', () => {
    const a = startSession({ id: SID, childId: 'c1', side: 'left', now: T0 });
    expect(a.status).toBe('running');
    expect(currentSide(a)).toBe('left');
    expect(elapsedMs(a, T0 + s(42))).toBe(s(42));
    // Même session relue 10 min plus tard : la durée suit l'horloge, sans aucun « tick »
    expect(elapsedMs(a, T0 + min(10))).toBe(min(10));
  });

  it('pause puis reprise : la pause ne compte pas', () => {
    let a = startSession({ id: SID, childId: 'c1', side: 'left', now: T0 });
    a = pauseSession(a, T0 + min(5));
    expect(a.status).toBe('paused');
    expect(elapsedMs(a, T0 + min(30))).toBe(min(5)); // 25 min de pause ignorées
    expect(currentSegmentMs(a, T0 + min(30))).toBe(0);
    a = resumeSession(a, T0 + min(8));
    expect(a.status).toBe('running');
    expect(currentSide(a)).toBe('left');
    expect(elapsedMs(a, T0 + min(10))).toBe(min(7));
    expect(() => resumeSession(a, T0 + min(11))).toThrow(FeedError);
    expect(() => pauseSession(pauseSession(a, T0 + min(11)), T0 + min(12))).toThrow(FeedError);
  });

  it('changer de sein : durée par sein, total = somme des segments', () => {
    let a = startSession({ id: SID, childId: 'c1', side: 'left', now: T0 });
    a = switchSide(a, T0 + min(6));
    expect(currentSide(a)).toBe('right');
    a = switchSide(a, T0 + min(10));
    expect(currentSide(a)).toBe('left');
    const by = durationBySide(a, T0 + min(12));
    expect(by).toEqual({ left: min(8), right: min(4) });
    expect(elapsedMs(a, T0 + min(12))).toBe(min(12));
    // En pause, changer de sein reprend sur l'autre sein
    a = pauseSession(a, T0 + min(12));
    a = switchSide(a, T0 + min(15));
    expect(a.status).toBe('running');
    expect(currentSide(a)).toBe('right');
  });

  it('fermeture de l\'app puis reprise : la session relue continue avec la vraie durée', () => {
    let a = startSession({ id: SID, childId: 'c1', side: 'right', now: T0 });
    a = pauseSession(a, T0 + min(4));
    a = resumeSession(a, T0 + min(6), 'left');
    // Sérialisation (AsyncStorage) puis relecture au retour, 20 min plus tard
    const stored = JSON.parse(JSON.stringify(a));
    const back = reviveSession(stored)!;
    expect(back).toEqual(a);
    expect(elapsedMs(back, T0 + min(26))).toBe(min(4) + min(20));
    // Données abîmées : rien n'est inventé
    expect(reviveSession({ ...stored, segments: [] })).toBeNull();
    expect(reviveSession({ ...stored, status: 'paused' })).toBeNull(); // dernier segment ouvert alors que « en pause »
    expect(reviveSession({ ...stored, segments: [{ side: 'top', startedAt: 1, endedAt: null }] })).toBeNull();
    expect(reviveSession(null)).toBeNull();
  });

  it('terminer : une ligne par segment, identifiants dérivés de la session (idempotents)', () => {
    let a = startSession({ id: SID, childId: 'c1', side: 'left', now: T0 });
    a = switchSide(a, T0 + min(7));
    a = switchSide(a, T0 + min(7) + 400); // appui accidentel : segment de 0,4 s ignoré
    a = finishSession(a, T0 + min(15));
    const rows = toBreastfeedRows(a, 'calme');
    expect(rows.map((r) => r.side)).toEqual(['left', 'left']);
    expect(rows[0]).toMatchObject({ session_id: SID, child_id: 'c1', started_at: new Date(T0).toISOString(), ended_at: new Date(T0 + min(7)).toISOString(), note: 'calme' });
    expect(rows[1].note).toBeNull();
    expect(new Set(rows.map((r) => r.client_id)).size).toBe(rows.length);
    // Même session → mêmes identifiants (renvoi = doublon ignoré)
    expect(toBreastfeedRows(a, 'calme').map((r) => r.client_id)).toEqual(rows.map((r) => r.client_id));
    expect(rows[0].client_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(segmentClientId(SID, 0)).not.toBe(segmentClientId(SID, 1));
  });

  it('double enregistrement impossible', () => {
    let a = finishSession(startSession({ id: SID, childId: 'c1', side: 'left', now: T0 }), T0 + min(9));
    expect(canSave(a)).toBe(true);
    a = markSaved(a, T0 + min(9));
    expect(canSave(a)).toBe(false);
    expect(() => markSaved(a, T0 + min(10))).toThrow(FeedError);
    expect(() => correctTimes(a, { start: T0 - min(1) }, T0 + min(10))).toThrow(FeedError);
    // Une session en cours ne s'enregistre pas
    expect(canSave(startSession({ id: SID, childId: 'c1', side: 'left', now: T0 }))).toBe(false);
  });

  it('correction de l\'heure de début et de fin avant enregistrement', () => {
    let a = startSession({ id: SID, childId: 'c1', side: 'left', now: T0 });
    a = switchSide(a, T0 + min(5));
    a = finishSession(a, T0 + min(60)); // oubli d'arrêter
    const now = T0 + min(61);
    const c = correctTimes(a, { start: T0 - min(2), end: T0 + min(14) }, now);
    expect(elapsedMs(c, now)).toBe(min(16));
    expect(durationBySide(c, now)).toEqual({ left: min(7), right: min(9) });
    expect(() => correctTimes(a, { end: T0 + min(3) }, now)).toThrow(FeedError); // fin avant le début du dernier segment
    expect(() => correctTimes(a, { start: T0 + min(70) }, now)).toThrow(FeedError);
    expect(() => correctTimes(a, { end: now + min(5) }, now)).toThrow(FeedError); // dans le futur
    expect(() => correctTimes(startSession({ id: SID, childId: 'c1', side: 'left', now: T0 }), { end: T0 + 1 }, now)).toThrow(FeedError);
  });

  it('affiche le temps en texte', () => {
    expect(clock(0)).toBe('0:00');
    expect(clock(s(65))).toBe('1:05');
    expect(clock(min(62) + s(5))).toBe('1:02:05');
  });

  it('enregistre une seule fois dans le moteur local, même si l\'envoi est rejoué', async () => {
    const db = createDemoBackend();
    await db.auth.signUp('tetee@exemple.test', 'MotDePasse!2026');
    const hid = await db.rpc<string>('create_household', { p_name: 'Test' });
    const [lina] = await db.insert<Child>('children', { household_id: hid, first_name: 'Lina', birth_date: '2026-10-01' });
    let a = startSession({ id: SID, childId: lina.id, side: 'left', now: T0 });
    a = switchSide(a, T0 + min(6));
    a = finishSession(a, T0 + min(11));
    const rows = toBreastfeedRows(a) as unknown as Record<string, unknown>[];
    await db.insert('breastfeeds', rows, { onConflict: 'client_id', ignoreDuplicates: true });
    await db.insert('breastfeeds', rows, { onConflict: 'client_id', ignoreDuplicates: true }); // double appui / file rejouée
    const saved = await db.select<{ session_id: string; side: string }>({ table: 'breastfeeds', filters: [eq('child_id', lina.id)] });
    expect(saved).toHaveLength(2);
    expect(saved.every((r) => r.session_id === SID)).toBe(true);
    expect(groupSessions(saved as never)).toHaveLength(1);
  });
});

describe('tirage', () => {
  it('total calculé (gauche + droite), modifiable, jamais inférieur aux seins saisis', () => {
    expect(computedTotal(null, null)).toBeNull();
    expect(computedTotal(60, null)).toBe(60);
    expect(pumpRow({ mode: 'both', leftMl: 60, rightMl: 45, totalMl: null, durationMin: null, comfort: null })).toEqual({ row: { side: 'both', amount_ml: 105, left_ml: 60, right_ml: 45, duration_min: null, comfort: null } });
    expect(pumpRow({ mode: 'both', leftMl: 60, rightMl: 45, totalMl: 120, durationMin: 15, comfort: 'comfortable' })).toMatchObject({ row: { amount_ml: 120, duration_min: 15, comfort: 'comfortable' } });
    expect(pumpRow({ mode: 'both', leftMl: 60, rightMl: 45, totalMl: 90, durationMin: null, comfort: null })).toEqual({ error: 'total_below_sides' });
    // Sein gauche seul : la quantité droite saisie avant le changement de mode est ignorée
    expect(pumpRow({ mode: 'left', leftMl: 70, rightMl: 30, totalMl: null, durationMin: null, comfort: null })).toMatchObject({ row: { amount_ml: 70, left_ml: 70, right_ml: null } });
    expect(pumpRow({ mode: 'right', leftMl: null, rightMl: null, totalMl: null, durationMin: null, comfort: null })).toEqual({ error: 'no_amount' });
    expect(pumpRow({ mode: 'both', leftMl: 900, rightMl: 200, totalMl: null, durationMin: null, comfort: null })).toEqual({ error: 'amount_range' });
    expect(pumpRow({ mode: 'both', leftMl: 10, rightMl: 10, totalMl: null, durationMin: 0, comfort: null })).toEqual({ error: 'duration_range' });
    // Total seul (sans détail par sein) : accepté, comme l'ancienne saisie
    expect(pumpRow({ mode: 'both', leftMl: null, rightMl: null, totalMl: 80, durationMin: null, comfort: 'painful' })).toMatchObject({ row: { amount_ml: 80, left_ml: null, right_ml: null } });
  });

  it('volumes par jour sur 7 jours : seulement les volumes saisis, jours vides à zéro', () => {
    const now = new Date(2026, 10, 13, 10, 0);
    const rows = [
      { at: new Date(2026, 10, 13, 8, 0).toISOString(), amount_ml: 90 },
      { at: new Date(2026, 10, 13, 2, 0).toISOString(), amount_ml: 60 },
      { at: new Date(2026, 10, 10, 22, 0).toISOString(), amount_ml: 120 },
      { at: new Date(2026, 10, 1, 9, 0).toISOString(), amount_ml: 500 }, // hors fenêtre
    ];
    const v = dailyPumpVolumes(rows, 7, now);
    expect(v).toHaveLength(7);
    expect(v[6]).toEqual({ day: '2026-11-13', ml: 150, count: 2 });
    expect(v[3]).toEqual({ day: '2026-11-10', ml: 120, count: 1 });
    expect(v[0]).toEqual({ day: '2026-11-07', ml: 0, count: 0 });
    expect(dailyPumpVolumes(rows, 30, now).reduce((n, x) => n + x.ml, 0)).toBe(770);
  });
});

describe('réserve de lait', () => {
  const now = new Date('2026-11-13T10:00:00.000Z');
  const portion = (o: Partial<StashPortion>): StashPortion => ({ id: 'p', volume_ml: 100, collected_at: '2026-11-12T08:00:00.000Z', storage: 'fridge', location: null, status: 'available', status_at: null, ...o });

  it('stock restant = somme des portions disponibles', () => {
    const rows = [portion({ volume_ml: 120 }), portion({ volume_ml: 80, storage: 'freezer' }), portion({ volume_ml: 60, status: 'used', status_at: now.toISOString() }), portion({ volume_ml: 40, status: 'discarded', status_at: now.toISOString() })];
    const r = stashRemaining(rows);
    expect(r.ml).toBe(200);
    expect(r.count).toBe(2);
    expect(r.byStorage.fridge).toEqual({ ml: 120, count: 1 });
    expect(r.byStorage.freezer).toEqual({ ml: 80, count: 1 });
    expect(stashRemaining([]).ml).toBe(0);
  });

  it('ajouter, utiliser, jeter : règles de saisie', () => {
    expect(stashRow({ volumeMl: 120, collectedAt: new Date('2026-11-13T07:00:00Z'), storage: 'freezer', location: ' tiroir du haut ', note: '' }, now)).toEqual({
      row: { volume_ml: 120, collected_at: '2026-11-13T07:00:00.000Z', storage: 'freezer', location: 'tiroir du haut', note: null, status: 'available', status_at: null },
    });
    expect(stashRow({ volumeMl: 0, collectedAt: now, storage: 'fridge', location: '', note: '' }, now)).toEqual({ error: 'volume_range' });
    expect(stashRow({ volumeMl: null, collectedAt: now, storage: 'fridge', location: '', note: '' }, now)).toEqual({ error: 'volume_range' });
    expect(stashRow({ volumeMl: 50, collectedAt: new Date(now.getTime() + 3600_000), storage: 'fridge', location: '', note: '' }, now)).toEqual({ error: 'future' });
    expect(stashTransition(portion({}), 'used', now)).toEqual({ patch: { status: 'used', status_at: now.toISOString() } });
    expect(stashTransition(portion({}), 'discarded', now)).toEqual({ patch: { status: 'discarded', status_at: now.toISOString() } });
    expect(stashTransition(portion({ status: 'used', status_at: now.toISOString() }), 'discarded', now)).toEqual({ error: 'not_available' });
    expect(stashTransition(portion({}), 'used', new Date('2026-11-01T00:00:00Z'))).toEqual({ error: 'before_collect' });
  });

  it('tri : disponibles d\'abord (plus anciennes en premier), puis historique récent', () => {
    const rows = [portion({ id: 'b', collected_at: '2026-11-12T09:00:00Z' }), portion({ id: 'a', collected_at: '2026-11-11T09:00:00Z' }), portion({ id: 'u', status: 'used', status_at: '2026-11-13T09:00:00Z' })];
    const { available, past } = sortStash(rows);
    expect(available.map((x) => x.id)).toEqual(['a', 'b']);
    expect(past.map((x) => x.id)).toEqual(['u']);
  });

  it('moteur local : la table est connue, contrôles identiques à la base', async () => {
    const db = createDemoBackend();
    await db.auth.signUp('reserve@exemple.test', 'MotDePasse!2026');
    const hid = await db.rpc<string>('create_household', { p_name: 'Test' });
    const [lina] = await db.insert<Child>('children', { household_id: hid, first_name: 'Lina', birth_date: '2026-10-01' });
    const [row] = await db.insert<StashPortion & { household_id: string }>('milk_stash', { child_id: lina.id, volume_ml: 90, collected_at: now.toISOString(), storage: 'fridge' });
    expect(row.household_id).toBe(hid);
    expect(row.status).toBe('available');
    await expect(db.insert('milk_stash', { child_id: lina.id, volume_ml: 0, collected_at: now.toISOString(), storage: 'fridge' })).rejects.toBeTruthy();
    await expect(db.insert('milk_stash', { child_id: lina.id, volume_ml: 50, collected_at: now.toISOString(), storage: 'cave' })).rejects.toBeTruthy();
    await expect(db.update('milk_stash', { status: 'used' }, [eq('id', row.id)])).rejects.toBeTruthy(); // statut sans date
    await db.update('milk_stash', { status: 'used', status_at: now.toISOString() }, [eq('id', row.id)]);
    const all = await db.select<StashPortion>({ table: 'milk_stash', filters: [eq('child_id', lina.id)] });
    expect(stashRemaining(all).ml).toBe(0);
    // Export : la réserve fait partie des données du foyer
    const exp = await db.rpc<{ households: ({ household: { id: string } } & Record<string, unknown>)[] }>('export_my_data');
    expect(exp.households.find((h) => h.household.id === hid)?.milk_stash).toHaveLength(1);
  });
});

describe('accueil et historique', () => {
  const now = new Date(2026, 10, 13, 12, 0);
  const iso = (h: number, m = 0, d = 13) => new Date(2026, 10, d, h, m).toISOString();
  const breastfeeds = [
    { id: 'b1', side: 'left' as const, started_at: iso(9), ended_at: iso(9, 8), session_id: 'S1' },
    { id: 'b2', side: 'right' as const, started_at: iso(9, 9), ended_at: iso(9, 15), session_id: 'S1' },
    { id: 'b3', side: 'both' as const, started_at: iso(6), ended_at: null, session_id: null },
  ];
  const pumpings = [{ id: 'p1', at: iso(10), amount_ml: 80 }, { id: 'p2', at: iso(7), amount_ml: 40 }];
  const bottles = [{ id: 'x1', at: iso(11), consumed_ml: 90, milk_type: 'Lait maternel' }, { id: 'x2', at: iso(20, 0, 12), consumed_ml: null, milk_type: 'Lait 1er âge' }];

  it('regroupe une tétée en deux seins en une seule session (temps au sein, pas de pause comptée)', () => {
    const g = groupSessions(breastfeeds);
    expect(g).toHaveLength(2);
    expect(g[0]).toMatchObject({ key: 'S1', sides: ['left', 'right'], durationMs: min(14) });
    expect(g[1].durationMs).toBeNull();
  });

  it('résumé du jour : mesures séparées, jamais additionnées entre elles', () => {
    const r = feedingDaySummary({ breastfeeds, pumpings, bottles }, now);
    expect(r).toEqual({ feeds: 2, lastMealAt: iso(11), pumpCount: 2, pumpedMl: 120, bottleCount: 1, bottleDrunkMl: 90 });
    expect(feedingDaySummary({ breastfeeds: [], pumpings: [], bottles: [] }, now)).toMatchObject({ feeds: 0, lastMealAt: null, pumpedMl: null, bottleDrunkMl: null });
  });

  it('mode déduit des saisies récentes ; tétée par défaut', () => {
    // 2 tétées, 2 tirages, 2 biberons sur 3 jours : à égalité, le plus récent (biberon de 11 h)
    expect(inferFeedingMode({ breastfeeds, pumpings, bottles }, now)).toBe('bottle');
    expect(inferFeedingMode({ breastfeeds: [...breastfeeds, { id: 'b4', side: 'left', started_at: iso(4), ended_at: iso(4, 10), session_id: null }], pumpings, bottles }, now)).toBe('breastfeed');
    expect(inferFeedingMode({ breastfeeds: [], pumpings: [], bottles: [] }, now)).toBe('breastfeed');
    expect(inferFeedingMode({ breastfeeds: [], pumpings, bottles: bottles.slice(0, 1) }, now)).toBe('pumping');
    expect(inferFeedingMode({ breastfeeds: [], pumpings: [], bottles }, now)).toBe('bottle');
  });

  it('dernière session', () => {
    expect(lastFeedingSession({ breastfeeds, pumpings, bottles })).toMatchObject({ kind: 'bottle', at: iso(11), ml: 90, milk: 'breast' });
    expect(lastFeedingSession({ breastfeeds: [], pumpings: [], bottles: [] })).toBeNull();
  });

  it('type de lait du biberon (texte libre) et filtres de l\'historique', () => {
    expect(milkKind('Lait maternel tiré')).toBe('breast');
    expect(milkKind('Muttermilch')).toBe('breast');
    expect(milkKind('Lait 2e âge')).toBe('other');
    expect(milkKind('')).toBe('unknown');
    const all = feedingHistory({ breastfeeds, pumpings, bottles }, 'all');
    expect(all.map((d) => d.day)).toEqual(['2026-11-13', '2026-11-12']);
    expect(all[0].entries.map((e) => e.kind)).toEqual(['bottle', 'pumping', 'breastfeed', 'pumping', 'breastfeed']);
    expect(feedingHistory({ breastfeeds, pumpings, bottles }, 'bottle_breast').flatMap((d) => d.entries)).toHaveLength(1);
    expect(feedingHistory({ breastfeeds, pumpings, bottles }, 'bottle_other').flatMap((d) => d.entries)).toHaveLength(1);
    expect(feedingHistory({ breastfeeds, pumpings, bottles }, 'breastfeed').flatMap((d) => d.entries)).toHaveLength(2);
  });
});
