/**
 * Campagne QA du 02/11/2026, F-01 (P0) : une saisie mise en file PENDANT un envoi de la file (flushQueue)
 * est-elle conservée ? (src/lib/offline.ts)
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@react-native-community/netinfo', () => ({ addEventListener: jest.fn(() => () => undefined) }));
const mockSent: string[] = [];
let mockRelease: (() => void) | null = null;
let mockCall = 0;
let mockMode = '';
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
      insert: jest.fn(async (_t: string, row: Record<string, unknown>) => {
        mockCall++;
        if (mockMode === 'drop') { await new Promise((r) => setTimeout(r, 30)); throw new BackendError('Pas de connexion', 'network'); }
        if (mockCall === 1) { await new Promise<void>((r) => { mockRelease = r; }); mockSent.push(String(row.client_id)); return [row]; } // réponse lente
        if (mockCall === 2) throw new BackendError('Pas de connexion', 'network');                                        // réseau instable
        mockSent.push(String(row.client_id)); return [row];
      }),
    },
  };
});
import AsyncStorage from '@react-native-async-storage/async-storage';
import { flushQueue, insertOrQueue, setQueueOwner, useOfflineStore } from '@/lib/offline';

it('une saisie mise en file pendant l’envoi de la file n’est pas perdue', async () => {
  await setQueueOwner('compte-a');
  useOfflineStore.setState({ online: false, pending: [], conflicts: [], syncing: false });
  expect(await insertOrQueue('bottles', { client_id: 'biberon-1' })).toBe('queued');   // hors ligne
  useOfflineStore.setState({ online: true });
  const flushing = flushQueue();                                                          // retour du réseau : envoi en cours
  await new Promise((r) => setTimeout(r, 10));
  expect(await insertOrQueue('bottles', { client_id: 'biberon-2' })).toBe('queued');      // nouvelle saisie, échec réseau
  expect(useOfflineStore.getState().pending.map((p) => p.id)).toEqual(['biberon-1', 'biberon-2']);
  mockRelease!();
  await flushing;
  const after = useOfflineStore.getState().pending.map((p) => p.id);
  const stored = JSON.parse((await AsyncStorage.getItem('toietmoi.offline.v1')) ?? '{}');
  expect([...mockSent, ...after]).toContain('biberon-2');
});

it('variante : le réseau tombe pendant l’envoi, la saisie faite hors ligne pendant ce temps disparaît-elle ?', async () => {
  mockMode = 'drop';
  useOfflineStore.setState({ online: false, pending: [], conflicts: [], syncing: false });
  await insertOrQueue('bottles', { client_id: 'biberon-A' });
  useOfflineStore.setState({ online: true });
  const flushing = flushQueue();                       // l'envoi part… et échouera (coupure)
  useOfflineStore.setState({ online: false });         // le téléphone repasse hors ligne
  expect(await insertOrQueue('bottles', { client_id: 'biberon-B' })).toBe('queued');
  expect(useOfflineStore.getState().pending.map((p) => p.id)).toEqual(['biberon-A', 'biberon-B']);
  await flushing;
  const after = useOfflineStore.getState().pending.map((p) => p.id);
  const stored = JSON.parse((await AsyncStorage.getItem('toietmoi.offline.v1')) ?? '{}');
  expect(after).toContain('biberon-B');
});
