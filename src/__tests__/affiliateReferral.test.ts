/** Code ambassadeur en attente : validation, 30 jours, dernier code gagne, rattaché une fois puis effacé. */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
import AsyncStorage from '@react-native-async-storage/async-storage';
import { attachPendingAffiliate, normalizeCode, pendingAffiliateCode, recordAffiliateClick, rememberAffiliateCode } from '@/lib/affiliateReferral';

const DAY = 24 * 3600 * 1000;
beforeEach(() => AsyncStorage.clear());

it('refuse les codes invalides et normalise la casse', () => {
  expect(normalizeCode(' Sarah ')).toBe('sarah');
  for (const bad of ['ab', '-abc', 'a b c', 'x'.repeat(30), '<script>', null]) expect(normalizeCode(bad)).toBeNull();
});

it('dernier code gagne ; expiré après 30 jours', async () => {
  await rememberAffiliateCode('claire', 'link', 'tiktok', 'sommeil', 0);
  await rememberAffiliateCode('sarah', 'code', 'bad campaign!', undefined, 1);
  expect(await pendingAffiliateCode(2)).toEqual({ code: 'sarah', source: 'code', campaign: '', feature: '', at: 1 });
  expect(await pendingAffiliateCode(31 * DAY)).toBeNull();
  expect(await AsyncStorage.getItem('homi.affiliate.pending.v1')).toBeNull();
});

it('rattache une fois puis efface ; erreur réseau → gardé pour réessayer', async () => {
  await rememberAffiliateCode('sarah', 'link', 'tiktok', 'sommeil');
  const failing = jest.fn().mockRejectedValue(new Error('offline'));
  expect(await attachPendingAffiliate(failing)).toBeNull();
  expect(await pendingAffiliateCode()).not.toBeNull();
  const rpc = jest.fn().mockResolvedValue('ok');
  expect(await attachPendingAffiliate(rpc)).toBe('ok');
  expect(rpc).toHaveBeenCalledWith('affiliate_attach', { p_code: 'sarah', p_source: 'link', p_campaign: 'tiktok', p_feature: 'sommeil' });
  expect(await attachPendingAffiliate(rpc)).toBeNull();
  expect(rpc).toHaveBeenCalledTimes(1);
});

it('clic : échec silencieux, étiquettes nettoyées', async () => {
  const rpc = jest.fn().mockRejectedValue(new Error('x'));
  await expect(recordAffiliateClick(rpc, 'sarah', 'Insta', '../x')).resolves.toBeUndefined();
  expect(rpc).toHaveBeenCalledWith('affiliate_record_click', { p_code: 'sarah', p_campaign: 'insta', p_feature: '' });
});

it('simulateur partagé (site + app) : même arrondi que la base — 10,62 € net → 3,19 €, 6 mois → 19,14 €', () => {
  const { simulate, PROGRAM } = require('@/lib/affiliateProgram') as typeof import('@/lib/affiliateProgram');
  const r = simulate(1062, 1, 6);
  expect(r.perSubscriberMinor).toBe(319);
  expect(r.byMonth).toEqual([319, 319, 319, 319, 319, 319].map((v, i) => v * Math.min(i + 1, PROGRAM.months)));
  // un abonné recruté au mois 1, suivi seul : 6 mois × 3,19 €
  expect(Array.from({ length: 12 }, (_, m) => (m < PROGRAM.months ? r.perSubscriberMinor : 0)).reduce((a, b) => a + b, 0)).toBe(1914);
});
