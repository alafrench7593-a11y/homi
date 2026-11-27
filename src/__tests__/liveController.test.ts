/**
 * Live Activities : logique du contrôleur (sessions réelles → décisions start / update / end, réconciliation).
 * Le pont natif est remplacé par une fausse liste d'activités iOS ; tout le reste est le code de production.
 */
import { bottleLive, breastLive, contractionsLive, detectDismissed, planLive, pumpLive, relayLive, sigOf, sleepLive, type LiveCtx, type Tracked } from '@/live/model';
import type { LiveKind, LiveProps, LiveSession } from '@/live/types';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock')); // eslint-disable-line @typescript-eslint/no-require-imports

type Fake = { id: string; kind: LiveKind; props: LiveProps; staleAt: number; url: string; ended: boolean };
const mockShown: Fake[] = [];
let mockSeq = 0;
jest.mock('@/live/native', () => ({
  registerLiveLayouts: () => undefined,
  liveLogo: () => '',
  liveInstances: () => mockShown.filter((f) => !f.ended).map((f) => ({
    id: f.id, kind: f.kind,
    update: async (p: LiveProps, staleAt: number) => { f.props = p; f.staleAt = staleAt; },
    end: async () => { f.ended = true; },
  })),
  liveStart: (kind: LiveKind, props: LiveProps, url: string, staleAt: number) => { const id = `a${++mockSeq}`; mockShown.push({ id, kind, props, url, staleAt, ended: false }); return id; },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ctl = require('@/live/controller') as typeof import('@/live/controller');

const NOW = new Date(2026, 10, 27, 14, 0, 0);
const T = NOW.getTime();
const iso = (minAgo: number) => new Date(T - minAgo * 60_000).toISOString();
const ctx = (o: Partial<LiveCtx> = {}): LiveCtx => ({ now: NOW, discreet: false, detailed: false, logo: '', url: (p) => `homi://${p.replace(/^\//, '')}`, ...o });
const child = { id: 'c1', first_name: 'Lina' };
const feed = (o: Record<string, unknown> = {}) => ({ id: 'f1', child_id: 'c1', started_at: iso(9), ended_at: null, side: 'left', segments: [{ side: 'left', from: iso(9), to: null }], ...o });

describe('sessions calculées depuis les données réelles', () => {
  it('allaitement : côté en cours, prénom, lien vers l’écran ; rien si la tétée est finie', () => {
    const s = breastLive(feed() as never, child, ctx())!;
    expect(s.key).toBe('breast:f1');
    expect(s.props.state).toBe('Sein gauche');
    expect(s.props.short).toBe('G');
    expect(s.props.who).toBe('Lina');
    expect(s.props.from).toBe(T - 9 * 60_000);
    expect(s.url).toBe('homi://track/breastfeed?child=c1');
    expect(breastLive(feed({ ended_at: iso(1), segments: [{ side: 'left', from: iso(9), to: iso(1) }] }) as never, child, ctx())).toBeNull();
    // Mode discret : prénom masqué
    expect(breastLive(feed() as never, child, ctx({ discreet: true }))!.props.who).toBe('');
  });

  it('biberon : chrono décalé des pauses, figé pendant une pause ; oubli de plus de 4 h ignoré', () => {
    const run = bottleLive({ id: 'b1', started_at: iso(10), paused_at: null, paused_seconds: 60, prepared_ml: 120 }, child, ctx())!;
    expect(run.props.from).toBe(T - 10 * 60_000 + 60_000);
    expect(run.props.pause).toBe(0);
    expect(run.props.sub).toBe('Préparé : 120 ml');
    const paused = bottleLive({ id: 'b1', started_at: iso(10), paused_at: iso(2), paused_seconds: 0, prepared_ml: null }, child, ctx())!;
    expect(paused.props.pause).toBe(T - 2 * 60_000);
    expect(paused.props.state).toBe('En pause');
    expect(bottleLive({ id: 'b1', started_at: iso(300), paused_at: null, paused_seconds: 0, prepared_ml: null }, child, ctx())).toBeNull();
  });

  it('sieste : sommeil ouvert le plus récent ; oubli de fin (> 18 h) ignoré', () => {
    const s = sleepLive([{ id: 's1', started_at: iso(40), ended_at: null, kind: 'nap' }, { id: 's0', started_at: iso(300), ended_at: iso(200) }], child, ctx())!;
    expect(s.key).toBe('sleep:s1');
    expect(s.props.title).toBe('Sieste');
    expect(sleepLive([{ id: 'n', started_at: iso(19 * 60), ended_at: null }], child, ctx())).toBeNull();
    expect(sleepLive([{ id: 's0', started_at: iso(300), ended_at: iso(200) }], child, ctx())).toBeNull();
  });

  it('contractions : en cours ou depuis la dernière, dernier intervalle, discret par défaut et sensible ; fin après 60 min', () => {
    const list = [
      { id: 'a', session_id: 'S', started_at: iso(12), ended_at: iso(11) },
      { id: 'b', session_id: 'S', started_at: iso(7), ended_at: iso(6) },
      { id: 'c', session_id: 'S', started_at: iso(1), ended_at: null },
    ];
    const live = contractionsLive(list, ctx({ detailed: true }))!;
    expect(live.key).toBe('contractions:S');
    expect(live.props.state).toBe('Contraction en cours');
    expect(live.props.from).toBe(T - 60_000);
    expect(live.props.sub).toBe('Dernier intervalle 6 min 00 s');
    expect(live.props.sens).toBe(true);
    const discreet = contractionsLive(list, ctx())!;
    expect(discreet.props.title).toBe('Chrono');
    expect(discreet.props.state).not.toMatch(/ontraction/);
    const since = contractionsLive(list.slice(0, 2), ctx({ detailed: true }))!;
    expect(since.props.state).toBe('Depuis la dernière');
    expect(since.props.from).toBe(T - 7 * 60_000);
    expect(contractionsLive([{ id: 'a', session_id: 'S', started_at: iso(90), ended_at: iso(89) }], ctx())).toBeNull();
  });

  it('tire-lait : chrono lancé sur cet appareil pour cet enfant seulement', () => {
    expect(pumpLive({ childId: 'c1', since: T - 5 * 60_000 }, child, ctx())!.props.from).toBe(T - 5 * 60_000);
    expect(pumpLive({ childId: 'c2', since: T - 5 * 60_000 }, child, ctx())).toBeNull();
    expect(pumpLive(null, child, ctx())).toBeNull();
  });

  it('relais : parent de garde et compte à rebours jusqu’à la fin du créneau de nuit en cours', () => {
    const shifts = [
      { id: 'old', kind: 'night', user_id: 'u1', starts_at: iso(26 * 60), ends_at: iso(18 * 60) },
      { id: 'r', kind: 'night', user_id: 'u2', starts_at: iso(60), ends_at: new Date(T + 3 * 3600_000).toISOString() },
      { id: 'me', kind: 'me_time', user_id: 'u2', starts_at: iso(10), ends_at: new Date(T + 600_000).toISOString() },
    ];
    const s = relayLive(shifts, (id) => ({ isMe: id === 'u1', name: id === 'u2' ? 'Sam' : 'Moi' }), ctx())!;
    expect(s.key).toBe('relay:r');
    expect(s.props.state).toBe('Sam est de garde');
    expect(s.props.end).toBe(T + 3 * 3600_000);
    expect(s.staleAt).toBe(s.props.end);
    expect(relayLive(shifts, () => ({ isMe: false, name: 'Sam' }), ctx({ discreet: true }))!.props.state).toBe('L’autre parent est de garde');
    expect(relayLive(shifts.slice(0, 1), () => ({ isMe: false, name: '' }), ctx())).toBeNull();
  });
});

describe('décisions (pures)', () => {
  const sess = (key: string, kind: LiveKind = 'sleep', scope = 'c1', state = 'x'): LiveSession => ({ kind, key, scope, url: 'homi://', staleAt: 1, props: { k: kind, title: 't', who: '', state, sub: '', short: '', from: 1, end: 0, pause: 0, sens: false, logo: '', l: { stale: '', done: '' } } });
  const tr = (id: string, s: LiveSession | null, kind: LiveKind = 'sleep', scope: string | null = 'c1'): Tracked => ({ id, kind, key: s?.key ?? null, scope: s ? s.scope : scope, sig: s ? sigOf(s) : null });
  const ready = new Set(['sleep:c1', 'breast:c1']);
  const none = new Set<string>();

  it('session ouverte sans activité → start ; même contenu → rien ; contenu changé → update', () => {
    const a = sess('sleep:1');
    expect(planLive([a], [], { enabled: true, ready, dismissed: none }).start).toEqual([a]);
    const same = planLive([a], [tr('x', a)], { enabled: true, ready, dismissed: none });
    expect(same.start).toEqual([]); expect(same.update).toEqual([]); expect(same.end).toEqual([]);
    const b = sess('sleep:1', 'sleep', 'c1', 'autre');
    expect(planLive([b], [tr('x', a)], { enabled: true, ready, dismissed: none }).update).toEqual([{ id: 'x', session: b }]);
  });

  it('session terminée (ailleurs aussi) → end ; jamais pendant un chargement ni pour un autre enfant', () => {
    const a = sess('sleep:1');
    expect(planLive([], [tr('x', a)], { enabled: true, ready, dismissed: none }).end).toEqual(['x']);
    expect(planLive([], [tr('x', a)], { enabled: true, ready: none, dismissed: none }).end).toEqual([]);
    const other = sess('sleep:2', 'sleep', 'c2');
    expect(planLive([], [tr('y', other)], { enabled: true, ready, dismissed: none }).end).toEqual([]);
  });

  it('au plus une activité par session : doublon terminé', () => {
    const a = sess('sleep:1');
    const p = planLive([a], [tr('x', a), tr('y', a)], { enabled: true, ready, dismissed: none });
    expect(p.end).toEqual(['y']);
    expect(p.start).toEqual([]);
  });

  it('activité inconnue (mémoire perdue) : adoptée par la session du même type, sinon terminée', () => {
    const a = sess('sleep:1');
    expect(planLive([a], [tr('o', null)], { enabled: true, ready, dismissed: none }).update).toEqual([{ id: 'o', session: a }]);
    expect(planLive([], [tr('o', null)], { enabled: true, ready, dismissed: none }).end).toEqual(['o']);
  });

  it('activité fermée par le parent : pas relancée ; réglage désactivé : tout est terminé', () => {
    const a = sess('sleep:1');
    expect(planLive([a], [], { enabled: true, ready, dismissed: new Set(['sleep:1']) }).start).toEqual([]);
    expect(planLive([a], [tr('x', a)], { enabled: false, ready, dismissed: none })).toEqual({ start: [], update: [], keep: [], end: ['x'] });
    expect(detectDismissed([{ id: 'x', key: 'sleep:1' }, { id: 'y', key: 'sleep:2' }], new Set(['y']), new Set(['sleep:1']))).toEqual(['sleep:1']);
  });
});

describe('contrôleur (réconciliation avec iOS)', () => {
  beforeEach(async () => { await ctl.endAllLive(); mockShown.length = 0; ctl.__resetLiveMemory(); });
  const ready = new Set(['breast:c1', 'sleep:c1', 'pump:device']);

  it('start idempotent, update sur changement, end quand la session se termine (coparent)', async () => {
    const s1 = breastLive(feed() as never, child, ctx())!;
    await ctl.reconcileLive([s1], { enabled: true, ready });
    await ctl.reconcileLive([s1], { enabled: true, ready });
    expect(mockShown.filter((f) => !f.ended)).toHaveLength(1);
    const switched = breastLive(feed({ side: 'both', segments: [{ side: 'left', from: iso(9), to: iso(3) }, { side: 'right', from: iso(3), to: null }] }) as never, child, ctx())!;
    await ctl.reconcileLive([switched], { enabled: true, ready });
    expect(mockShown[0].props.state).toBe('Sein droit');
    expect(mockShown.filter((f) => !f.ended)).toHaveLength(1);
    await ctl.reconcileLive([], { enabled: true, ready });
    expect(mockShown.every((f) => f.ended)).toBe(true);
  });

  it('activité fermée par le parent : pas relancée au retour au premier plan', async () => {
    const s = sleepLive([{ id: 's1', started_at: iso(40), ended_at: null }], child, ctx())!;
    await ctl.reconcileLive([s], { enabled: true, ready });
    mockShown[0].ended = true; // glissée sur l'écran verrouillé
    await ctl.reconcileLive([s], { enabled: true, ready });
    expect(mockShown).toHaveLength(1);
  });

  it('point d’arrêt explicite : fin immédiate, pas de relance avec le cache encore ouvert', async () => {
    const s = sleepLive([{ id: 's1', started_at: iso(40), ended_at: null }], child, ctx())!;
    await ctl.reconcileLive([s], { enabled: true, ready });
    await ctl.endLiveFor('sleep:s1');
    expect(mockShown[0].ended).toBe(true);
    await ctl.reconcileLive([s], { enabled: true, ready });
    expect(mockShown.filter((f) => !f.ended)).toHaveLength(0);
  });

  it('déconnexion / changement de compte : toutes les activités se terminent', async () => {
    await ctl.reconcileLive([breastLive(feed() as never, child, ctx())!, pumpLive({ childId: 'c1', since: T - 60_000 }, child, ctx())!], { enabled: true, ready });
    expect(mockShown.filter((f) => !f.ended)).toHaveLength(2);
    await ctl.endAllLive();
    expect(mockShown.every((f) => f.ended)).toBe(true);
  });

  it('une session par activité, même lancée deux fois en parallèle', async () => {
    const s = sleepLive([{ id: 's1', started_at: iso(40), ended_at: null }], child, ctx())!;
    await Promise.all([ctl.reconcileLive([s], { enabled: true, ready }), ctl.reconcileLive([s], { enabled: true, ready })]);
    expect(mockShown).toHaveLength(1);
  });
});
