/**
 * Étape 2 — hors ligne : les saisies sont mises en file, envoyées au retour du réseau,
 * sans perte, sans doublon, et jamais supprimées en silence.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@react-native-community/netinfo', () => ({ addEventListener: jest.fn(() => () => undefined) }));

const mockSent: { table: string; row: Record<string, unknown>; opts: unknown }[] = [];
let mockMode: 'ok' | 'network' | 'refuse' = 'ok';
jest.mock('@/lib/backend', () => {
  class BackendError extends Error {
    code?: string;
    constructor(message: string, code?: string) { super(message); this.code = code; }
    get isNetwork() { return this.code === 'network'; }
  }
  return {
    BackendError,
    backend: {
      mode: 'supabase',
      insert: jest.fn(async (table: string, row: Record<string, unknown>, opts: unknown) => {
        if (mockMode === 'network') throw new BackendError('Pas de connexion', 'network');
        if (mockMode === 'refuse') throw new BackendError('Vous n’avez pas l’autorisation de faire cette action.', '42501');
        mockSent.push({ table, row, opts });
        return [row];
      }),
    },
  };
});

import { flushQueue, insertOrQueue, retryConflict, useOfflineStore, discardConflict } from '@/lib/offline';

beforeEach(() => {
  mockSent.length = 0;
  mockMode = 'ok';
  useOfflineStore.setState({ online: true, pending: [], conflicts: [], syncing: false });
});

describe('file hors ligne', () => {
  it('hors ligne : la saisie (règles) est gardée en file avec un id généré, puis envoyée au retour du réseau', async () => {
    useOfflineStore.setState({ online: false });
    expect(await insertOrQueue('period_entries', { user_id: 'u', start_date: '2026-10-18' })).toBe('queued');
    const op = useOfflineStore.getState().pending[0];
    expect(op.table).toBe('period_entries');
    expect(typeof op.row.id).toBe('string');
    expect(mockSent).toHaveLength(0);
    useOfflineStore.setState({ online: true });
    expect(await flushQueue()).toBe(1);
    expect(mockSent[0]).toMatchObject({ table: 'period_entries', opts: { onConflict: 'id', ignoreDuplicates: true } });
    expect(mockSent[0].row.id).toBe(op.row.id); // même id : un renvoi ne crée pas de doublon
    expect(useOfflineStore.getState().pending).toHaveLength(0);
  });

  it('coupure pendant l’envoi : rien n’est perdu', async () => {
    mockMode = 'network';
    expect(await insertOrQueue('bottles', { client_id: 'c1', prepared_ml: 120 })).toBe('queued');
    expect(await flushQueue()).toBe(0);
    expect(useOfflineStore.getState().pending).toHaveLength(1);
    mockMode = 'ok';
    expect(await flushQueue()).toBe(1);
    expect(mockSent[0].opts).toEqual({ onConflict: 'client_id', ignoreDuplicates: true });
  });

  it('une observation par jour : envoi en remplacement (merge)', async () => {
    await insertOrQueue('fertility_observations', { user_id: 'u', observed_on: '2026-10-18', bbt_celsius: 36.5 }, { conflict: 'user_id,observed_on', merge: true });
    expect(mockSent[0].opts).toEqual({ onConflict: 'user_id,observed_on', ignoreDuplicates: false });
  });

  it('refus du serveur : la saisie passe « à vérifier », jamais supprimée en silence', async () => {
    useOfflineStore.setState({ online: false });
    await insertOrQueue('mood_checkins', { user_id: 'u', mood: 3 });
    useOfflineStore.setState({ online: true });
    mockMode = 'refuse';
    await flushQueue();
    const { pending, conflicts } = useOfflineStore.getState();
    expect(pending).toHaveLength(0);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].error).toMatch(/autorisation/);
    mockMode = 'ok';
    await retryConflict(conflicts[0].id);
    expect(useOfflineStore.getState().conflicts).toHaveLength(0);
    expect(mockSent).toHaveLength(1);
  });

  it('retirer une saisie refusée se fait seulement sur demande', async () => {
    useOfflineStore.setState({ conflicts: [{ id: 'x', table: 'symptom_logs', row: { id: 'x' }, queuedAt: new Date().toISOString(), error: 'refus' }] });
    await discardConflict('x');
    expect(useOfflineStore.getState().conflicts).toHaveLength(0);
  });
});
