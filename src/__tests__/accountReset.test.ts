/** Changement de compte sur le même téléphone (audit 23/11/2026) : clés du compte effacées, réglages de l'appareil gardés. */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
import { accountKeys, DEVICE_KEYS } from '@/lib/accountReset';
import { useUiStore } from '@/lib/store';

it('efface les clés « homi.* » du compte, garde les réglages de l’appareil et le reste', () => {
  const all = ['homi.recentTools', 'homi.relay', 'homi.childcare.outbox.v1', 'homi.understand.draft.u1', 'homi.analytics.queue.v1', 'homi.reading.v1',
    'homi.install-id', 'homi.liquidLens.v1', 'toietmoi.demo.v1', 'toietmoi.ui'];
  expect(accountKeys(all)).toEqual(['homi.recentTools', 'homi.relay', 'homi.childcare.outbox.v1', 'homi.understand.draft.u1', 'homi.analytics.queue.v1', 'homi.reading.v1']);
  for (const k of DEVICE_KEYS) expect(accountKeys([k])).toEqual([]);
});

it('état « ui » : favoris, commune, questions notées, garde-manger remis à zéro ; apparence gardée', () => {
  useUiStore.setState({ toolFavorites: ['ttc_tests'], nearbyTown: { label: 'Lyon', lat: 1, lon: 2 }, growQuestions: { k: ['q'] }, pantry: ['riz'], appearanceByUser: { u1: { theme: 'dark', palette: 'nacre' } } as never });
  useUiStore.getState().resetAccount();
  const s = useUiStore.getState();
  expect([s.toolFavorites, s.nearbyTown, s.growQuestions, s.pantry]).toEqual([[], null, null, []]);
  expect(s.appearanceByUser).toEqual({ u1: { theme: 'dark', palette: 'nacre' } });
});
