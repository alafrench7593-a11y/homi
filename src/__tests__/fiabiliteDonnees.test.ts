/**
 * Audit 08 « Fiabilité et données » : régressions des défauts corrigés.
 *  F1  délai dépassé : une requête de données sans réponse finit en erreur claire et passagère (jamais un bouton bloqué) ;
 *  F2  serveur en erreur (500) alors que le réseau est là : la file hors ligne réessaie seule, une seule fois par saisie ;
 *  F3  modification concurrente d'une tâche : jamais d'écrasement silencieux (update_if_version, report des champs non touchés) ;
 *  F4  réponse perdue / double pression sur un envoi direct : même identifiant au nouvel essai (aucun doublon) ;
 *  F5  achat validé dont la réponse s'est perdue : reconnu comme fait (pas de faux « conflit »), jamais compté deux fois ;
 *  F6  liste de courses générée : articles à client_id déterministe (reprise sans doublon après échec partiel).
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
const mockNet: { cb?: (s: { isConnected: boolean; isInternetReachable: boolean }) => void } = {};
jest.mock('@react-native-community/netinfo', () => ({ addEventListener: jest.fn((cb) => { mockNet.cb = cb; return () => undefined; }), fetch: jest.fn(async () => ({ isConnected: true })) }));
jest.mock('expo/fetch', () => ({ fetch: jest.fn() }));

const mockRpc = jest.fn();
const mockSelect = jest.fn();
const mockInsert = jest.fn();
jest.mock('@/lib/backend', () => {
  class BackendError extends Error {
    code?: string; hint?: string; status?: number;
    constructor(message: string, code?: string, hint?: string, status?: number) { super(message); this.code = code; this.hint = hint; this.status = status; }
    get isNetwork() { return this.code === 'network'; }
  }
  return {
    BackendError,
    eq: (col: string, value: unknown) => ({ col, op: 'eq', value }),
    backend: {
      mode: 'supabase',
      rpc: (...a: unknown[]) => mockRpc(...a),
      select: (...a: unknown[]) => mockSelect(...a),
      insert: (...a: unknown[]) => mockInsert(...a),
    },
  };
});

import { BackendError } from '@/lib/backend';
import { idempotentId, resetIdempotency, settleIdempotentId, stableStringify, withIdempotentId } from '@/lib/idempotency';
import { changedFields, mergeUpdate, rebase, sameValue, type EditConflict } from '@/lib/offlineConflicts';
import { flushQueue, insertOrQueue, RETRY_DELAYS_MS, setQueueOwner, startOfflineSync, useOfflineStore } from '@/lib/offline';
import { isOwnReplayedPurchase } from '@/lib/data/hooks-stocks';
import { listItemClientId } from '@/lib/data/hooks-recipes';
import { timedFetch, wrap } from '@/lib/backend/supabase';

const MSG = { conflict: 'conflit', notFound: 'introuvable' };
const task = { id: 't1', title: 'Courses', notes: null, status: 'todo', assignee_id: 'a', due_at: '2026-11-20T10:00:00+00:00', version: 3 };

beforeEach(() => {
  mockRpc.mockReset(); mockSelect.mockReset(); mockInsert.mockReset();
  resetIdempotency();
});

describe('F4 — clé d’idempotence des envois directs', () => {
  it('même contenu → même identifiant tant que l’envoi n’a pas abouti, quel que soit l’ordre des champs', () => {
    const a = idempotentId('appointments', { title: 'Écho', at: '2026-12-01' });
    expect(idempotentId('appointments', { at: '2026-12-01', title: 'Écho' })).toBe(a);
    expect(idempotentId('appointments', { title: 'Écho 2', at: '2026-12-01' })).not.toBe(a);
    expect(idempotentId('care_requests', { title: 'Écho', at: '2026-12-01' })).not.toBe(a);
    settleIdempotentId('appointments', { title: 'Écho', at: '2026-12-01' });
    expect(idempotentId('appointments', { title: 'Écho', at: '2026-12-01' })).not.toBe(a); // nouvelle saisie identique, plus tard
  });

  it('échec (réponse perdue) puis « Réessayer » : le second essai repart avec le MÊME identifiant ; succès → oublié', async () => {
    const seen: string[] = [];
    const send = jest.fn(async (id: string) => { seen.push(id); if (seen.length === 1) throw new BackendError('Pas de connexion', 'network'); return id; });
    await expect(withIdempotentId('care_requests', { kind: 'relay' }, send)).rejects.toThrow();
    await withIdempotentId('care_requests', { kind: 'relay' }, send);
    expect(seen[0]).toBe(seen[1]);
    await withIdempotentId('care_requests', { kind: 'relay' }, send);
    expect(seen[2]).not.toBe(seen[1]);
  });

  it('double pression (deux envois simultanés) : un seul identifiant', async () => {
    const ids: string[] = [];
    const send = (id: string) => new Promise<string>((r) => setTimeout(() => { ids.push(id); r(id); }, 5));
    await Promise.all([withIdempotentId('appointments', { t: 1 }, send), withIdempotentId('appointments', { t: 1 }, send)]);
    expect(new Set(ids).size).toBe(1);
  });

  it('JSON stable : clés triées, champs absents ignorés', () => {
    expect(stableStringify({ b: 1, a: [{ d: 2, c: undefined }] })).toBe('{"a":[{"d":2}],"b":1}');
  });
});

describe('F3 — modifications concurrentes (update_if_version, report à trois versions)', () => {
  it('égalité utile : instants égaux quel que soit le format, null ≈ absent', () => {
    expect(sameValue('2026-11-20T10:00:00+00:00', '2026-11-20T10:00:00.000Z')).toBe(true);
    expect(sameValue(null, undefined)).toBe(true);
    expect(sameValue({ type: 'weekly' }, { type: 'weekly' })).toBe(true);
    expect(sameValue('a', 'b')).toBe(false);
  });

  it('un formulaire renvoie tous ses champs : seuls les champs réellement changés partent', () => {
    expect(changedFields(task, { title: 'Courses', notes: null, due_at: '2026-11-20T10:00:00.000Z', status: 'done' })).toEqual({ status: 'done' });
  });

  it('rien de changé → aucun appel serveur', async () => {
    await expect(mergeUpdate('family_tasks', 't1', task, { title: 'Courses' }, MSG)).resolves.toEqual({ status: 'unchanged' });
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('pas de conflit : écrit à la version lue', async () => {
    mockRpc.mockResolvedValueOnce({ status: 'ok', row: { ...task, status: 'done', version: 4 } });
    const out = await mergeUpdate('family_tasks', 't1', task, { status: 'done' }, MSG);
    expect(out.status).toBe('ok');
    expect(mockRpc).toHaveBeenCalledWith('update_if_version', { p_table: 'family_tasks', p_id: 't1', p_expected_version: 3, p_patch: { status: 'done' } });
  });

  it('l’autre a changé le TITRE, moi le STATUT : mon changement est reporté sur sa version, rien n’est écrasé', async () => {
    mockRpc.mockResolvedValueOnce({ status: 'conflict', row: { ...task, title: 'Courses bio', version: 4 } })
      .mockResolvedValueOnce({ status: 'ok', row: { ...task, title: 'Courses bio', status: 'done', version: 5 } });
    const out = await mergeUpdate('family_tasks', 't1', task, { title: 'Courses', status: 'done' }, MSG);
    expect(out).toMatchObject({ status: 'ok', row: { title: 'Courses bio', status: 'done' } });
    expect(mockRpc.mock.calls[1][1]).toMatchObject({ p_expected_version: 4, p_patch: { status: 'done' } }); // jamais le titre
  });

  it('les deux ont changé le MÊME champ différemment : conflit signalé, rien n’est écrit', async () => {
    mockRpc.mockResolvedValueOnce({ status: 'conflict', row: { ...task, title: 'Pharmacie', version: 4 } });
    const err = (await mergeUpdate('family_tasks', 't1', task, { title: 'Courses du samedi' }, MSG).catch((e) => e)) as EditConflict;
    expect(err).toBeInstanceOf(BackendError);
    expect(err.code).toBe('conflict');
    expect(err.message).toBe('conflit');
    expect(err.fields).toEqual({ title: ['Courses du samedi', 'Pharmacie'] });
    expect(mockRpc).toHaveBeenCalledTimes(1);
  });

  it('les deux ont coché « fait » : même sens → pas d’erreur, pas de seconde écriture', async () => {
    mockRpc.mockResolvedValueOnce({ status: 'conflict', row: { ...task, status: 'done', version: 4 } });
    await expect(mergeUpdate('family_tasks', 't1', task, { status: 'done' }, MSG)).resolves.toMatchObject({ status: 'unchanged' });
    expect(mockRpc).toHaveBeenCalledTimes(1);
  });

  it('cache ancien format (ligne lue avant la colonne version) : la ligne est relue avant d’écrire', async () => {
    const old = { ...task } as Record<string, unknown>;
    delete old.version;
    mockSelect.mockResolvedValueOnce([{ ...task, version: 7 }]);
    mockRpc.mockResolvedValueOnce({ status: 'ok', row: { ...task, status: 'done', version: 8 } });
    await mergeUpdate('family_tasks', 't1', old, { status: 'done' }, MSG);
    expect(mockRpc.mock.calls[0][1]).toMatchObject({ p_expected_version: 7 });
  });

  it('tâche supprimée ou devenue invisible : message lisible « introuvable »', async () => {
    mockRpc.mockResolvedValueOnce({ status: 'not_found' });
    await expect(mergeUpdate('family_tasks', 't1', task, { status: 'done' }, MSG)).rejects.toMatchObject({ code: 'not_found', message: 'introuvable' });
  });

  it('rebase : champ inchangé côté serveur → reporté ; déjà à ma valeur → ignoré ; changé autrement → conflit', () => {
    expect(rebase({ a: 1, b: 1, c: 1 }, { a: 2, b: 2, c: 2 }, { a: 1, b: 2, c: 3 })).toEqual({ rest: { a: 2 }, clash: { c: [2, 3] } });
  });
});

describe('F2 — nouvel essai automatique quand le serveur répond 500 (réseau présent)', () => {
  let stop: () => void;
  beforeEach(async () => {
    jest.useFakeTimers();
    useOfflineStore.setState({ online: true, pending: [], conflicts: [], syncing: false });
    await setQueueOwner('compte-a');
    stop = startOfflineSync();
  });
  afterEach(() => { stop(); jest.useRealTimers(); });

  it('500 à l’envoi → gardée en file → renvoyée seule après le délai → une seule ligne', async () => {
    const server: Record<string, unknown>[] = [];
    mockInsert.mockImplementation(async (_t: string, row: Record<string, unknown>, opts: { onConflict: string; ignoreDuplicates: boolean }) => {
      if (mockInsert.mock.calls.length === 1) throw new BackendError('Erreur serveur', '500', undefined, 500);
      if (opts.ignoreDuplicates && server.some((r) => r.client_id === row.client_id)) return [];
      server.push(row); return [row];
    });
    expect(await insertOrQueue('bottles', { client_id: 'c-500', prepared_ml: 120 })).toBe('queued');
    expect(useOfflineStore.getState().pending).toHaveLength(1);
    await jest.advanceTimersByTimeAsync(RETRY_DELAYS_MS[0] + 10);
    expect(server).toHaveLength(1);
    expect(useOfflineStore.getState().pending).toHaveLength(0);
    // Plus aucun essai programmé : rien ne repart
    await jest.advanceTimersByTimeAsync(RETRY_DELAYS_MS[5] * 2);
    expect(mockInsert).toHaveBeenCalledTimes(2);
  });

  it('serveur toujours indisponible : essais espacés (5 s, 15 s…), jamais de perte', async () => {
    mockInsert.mockRejectedValue(new BackendError('Erreur serveur', '503', undefined, 503));
    await insertOrQueue('diapers', { client_id: 'c-503', kind: 'wet' });
    await jest.advanceTimersByTimeAsync(RETRY_DELAYS_MS[0] + 10);
    expect(mockInsert).toHaveBeenCalledTimes(2);
    await jest.advanceTimersByTimeAsync(RETRY_DELAYS_MS[1] - 1000);
    expect(mockInsert).toHaveBeenCalledTimes(2); // pas d'avalanche
    await jest.advanceTimersByTimeAsync(2000);
    expect(mockInsert).toHaveBeenCalledTimes(3);
    expect(useOfflineStore.getState().pending).toHaveLength(1);
    expect(useOfflineStore.getState().conflicts).toHaveLength(0);
  });

  it('réponse perdue après écriture réussie (délai dépassé) : le renvoi utilise le même client_id → aucun doublon', async () => {
    const server: Record<string, unknown>[] = [];
    mockInsert.mockImplementation(async (_t: string, row: Record<string, unknown>, opts: { ignoreDuplicates: boolean }) => {
      if (!(opts.ignoreDuplicates && server.some((r) => r.client_id === row.client_id))) server.push(row);
      if (mockInsert.mock.calls.length === 1) throw new BackendError('La réponse prend trop de temps. Réessayez.', 'timeout', undefined, 0);
      return [row];
    });
    await insertOrQueue('sleeps', { client_id: 'c-lost', started_at: '2026-11-13T20:00:00Z' });
    await jest.advanceTimersByTimeAsync(RETRY_DELAYS_MS[0] + 10);
    expect(mockInsert).toHaveBeenCalledTimes(2);
    expect(server).toHaveLength(1);
  });
});

describe('F1 — délai maximal des requêtes de données', () => {
  it('requête PostgREST sans réponse : interrompue après le délai', async () => {
    jest.useFakeTimers();
    let aborted = false;
    const hang = jest.fn((_u: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_r, reject) => {
      init?.signal?.addEventListener('abort', () => { aborted = true; reject(Object.assign(new Error('The user aborted a request.'), { name: 'AbortError' })); });
    }));
    const f = timedFetch(1000, hang as unknown as typeof fetch);
    const p = f('http://sb.fake.test/rest/v1/bottles', { method: 'POST' }).catch((e: Error) => e.name);
    await jest.advanceTimersByTimeAsync(1001);
    expect(await p).toBe('AbortError');
    expect(aborted).toBe(true);
    jest.useRealTimers();
  });

  it('fichiers et fonctions : pas de délai imposé ici (ils ont les leurs)', async () => {
    const base = jest.fn(async () => new Response('{}'));
    await timedFetch(1, base as unknown as typeof fetch)('http://sb.fake.test/storage/v1/object/x', {});
    expect((base.mock.calls[0] as unknown[])[1]).toEqual({});
  });

  it('l’erreur d’interruption devient « délai dépassé » : message clair et erreur passagère (mise en file)', () => {
    let err: unknown;
    try { wrap({ message: 'AbortError: The user aborted a request.', code: '', hint: 'Request was aborted (timeout or manual cancellation)' }, 0); } catch (e) { err = e; }
    expect(err).toMatchObject({ code: 'timeout' });
    expect((err as Error).message).toMatch(/trop de temps/);
  });
});

describe('F5 — achat validé, réponse perdue, nouvel essai', () => {
  const v = { qty: 2, mode: 'add' as const, version: 5, before: 3 };
  it('une seule modification depuis la lecture, faite par moi, quantité attendue → c’était mon achat (affiché comme fait)', () => {
    expect(isOwnReplayedPurchase({ version: 6, last_validated_by: 'moi', qty_estimate: 5 }, v, 'moi')).toBe(true);
    expect(isOwnReplayedPurchase({ version: 6, last_validated_by: 'moi', qty_estimate: '5' }, v, 'moi')).toBe(true);
  });
  it('quelqu’un d’autre, ou plusieurs changements, ou une autre quantité → vrai conflit', () => {
    expect(isOwnReplayedPurchase({ version: 6, last_validated_by: 'autre', qty_estimate: 5 }, v, 'moi')).toBe(false);
    expect(isOwnReplayedPurchase({ version: 7, last_validated_by: 'moi', qty_estimate: 5 }, v, 'moi')).toBe(false);
    expect(isOwnReplayedPurchase({ version: 6, last_validated_by: 'moi', qty_estimate: 7 }, v, 'moi')).toBe(false);
    expect(isOwnReplayedPurchase({ version: 6, last_validated_by: 'moi', qty_estimate: 5 }, { ...v, before: undefined }, 'moi')).toBe(false);
  });
});

describe('F6 — articles d’une liste générée', () => {
  it('client_id déterministe, uuid valide, distinct par position', () => {
    const list = '3f2b6c1e-8a4d-4c2b-9e7f-0123456789ab';
    const a = listItemClientId(list, 0);
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(listItemClientId(list, 0)).toBe(a);
    expect(listItemClientId(list, 11)).not.toBe(a);
    expect(listItemClientId(list, 11).endsWith('00000000000b')).toBe(true);
  });
});

describe('Reprise et déconnexion (déjà en place, verrouillé ici)', () => {
  it('file d’un autre compte : jamais envoyée sous le nouveau compte, effacée du téléphone', async () => {
    useOfflineStore.setState({ online: true, pending: [{ id: 'x', table: 'bottles', row: { client_id: 'x' }, queuedAt: '2026-11-13T08:00:00Z', owner: 'compte-a' }], conflicts: [], syncing: false });
    await setQueueOwner(null); // déconnexion
    expect(await flushQueue()).toBe(0);
    expect(useOfflineStore.getState().pending).toHaveLength(1); // gardée pour le même compte
    await setQueueOwner('compte-b');
    expect(mockInsert).not.toHaveBeenCalled();
    expect(useOfflineStore.getState().pending).toHaveLength(0);
  });
});
