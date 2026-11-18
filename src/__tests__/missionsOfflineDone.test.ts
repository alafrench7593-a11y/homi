/**
 * Missions terminées hors ligne (19/11/2026) : « Mission terminée » sans réseau est gardé en file, UNE fois (double
 * appui : pas de doublon), puis rejoué au retour du réseau par le serveur (mission_respond, idempotent : « inchangé »).
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@react-native-community/netinfo', () => ({ addEventListener: jest.fn(() => () => undefined) }));

const mockCalls: { fn: string; args: Record<string, unknown> }[] = [];
let mockNetwork = false;
jest.mock('@/lib/backend', () => {
  class BackendError extends Error {
    code?: string;
    constructor(message: string, code?: string) { super(message); this.code = code; }
    get isNetwork() { return this.code === 'network'; }
  }
  return {
    BackendError,
    eq: (col: string, value: unknown) => ({ col, op: 'eq', value }),
    backend: {
      mode: 'supabase',
      insert: jest.fn(async () => []),
      rpc: jest.fn(async (fn: string, args: Record<string, unknown>) => {
        if (mockNetwork) throw new BackendError('Pas de connexion', 'network');
        mockCalls.push({ fn, args });
        return { status: 'ok', unchanged: mockCalls.length > 1 };
      }),
    },
  };
});

import { flushQueue, rpcOrQueue, setQueueOwner, useOfflineStore } from '@/lib/offline';
import { respondMission } from '@/lib/data/hooks-missions';

beforeEach(async () => {
  mockCalls.length = 0;
  mockNetwork = false;
  useOfflineStore.setState({ online: true, pending: [], conflicts: [], syncing: false });
  await setQueueOwner('compte-a');
});

describe('« Mission terminée » hors ligne', () => {
  it('hors ligne : mise en file une seule fois (double appui), rejouée au retour du réseau, sans version attendue', async () => {
    useOfflineStore.setState({ online: false });
    expect(await respondMission({ id: 't1', action: 'complete', version: 3 })).toEqual({ status: 'ok', queued: true });
    expect(await respondMission({ id: 't1', action: 'complete', version: 3 })).toEqual({ status: 'ok', queued: true });
    const pending = useOfflineStore.getState().pending;
    expect(pending).toHaveLength(1);
    expect(pending[0].table).toBe('rpc:mission_respond');
    expect(pending[0].row).toMatchObject({ p_task: 't1', p_action: 'complete', p_expected_version: null });
    expect(mockCalls).toHaveLength(0);
    useOfflineStore.setState({ online: true });
    expect(await flushQueue()).toBe(1);
    expect(mockCalls).toEqual([{ fn: 'mission_respond', args: expect.objectContaining({ p_task: 't1', p_action: 'complete' }) }]);
    expect(useOfflineStore.getState().pending).toHaveLength(0);
    expect(await flushQueue()).toBe(0); // rien ne repart une seconde fois
  });

  it('réseau présent mais coupé pendant l’envoi : gardée en file au lieu d’être perdue', async () => {
    mockNetwork = true;
    expect(await rpcOrQueue('mission_respond', { p_task: 't2', p_action: 'start' })).toEqual({ queued: true });
    expect(useOfflineStore.getState().pending).toHaveLength(1);
  });

  it('en ligne : envoyée tout de suite, avec la version attendue (conflit détecté par le serveur)', async () => {
    await respondMission({ id: 't3', action: 'complete', version: 4 });
    expect(mockCalls[0].args).toMatchObject({ p_task: 't3', p_expected_version: 4 });
    expect(useOfflineStore.getState().pending).toHaveLength(0);
  });

  it('les réponses non idempotentes (annuler, reporter, question) ne partent jamais en file', async () => {
    useOfflineStore.setState({ online: false });
    mockNetwork = true;
    await expect(respondMission({ id: 't4', action: 'cancel' })).rejects.toBeTruthy();
    expect(useOfflineStore.getState().pending).toHaveLength(0);
  });
});
