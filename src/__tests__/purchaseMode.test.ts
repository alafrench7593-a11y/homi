/**
 * Mode d'achat : relu à chaque appel. Sur une version configurée avec Supabase, la démonstration est activée APRÈS le
 * chargement du module (reprise à l'ouverture, « Découvrir sans compte ») : elle doit passer en achats simulés (« test »),
 * jamais rester sur « Achats bientôt disponibles » ni sur la vraie boutique pour un compte de démonstration.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: { configure: jest.fn(), logIn: jest.fn(), logOut: jest.fn(), getOfferings: jest.fn(), purchasePackage: jest.fn(), restorePurchases: jest.fn(), showManageSubscriptions: jest.fn(), addCustomerInfoUpdateListener: jest.fn(), getCustomerInfo: jest.fn() },
}));
const mockBackend: { mode: string; rpc: jest.Mock } = { mode: 'supabase', rpc: jest.fn() };
// Getter : les jest.mock sont remontés au-dessus de la déclaration de mockBackend
jest.mock('@/lib/backend', () => ({ get backend() { return mockBackend; } }));

import { getPlans, getPurchaseMode, purchase, purchaseModeFor } from '@/lib/purchases';

beforeEach(() => { mockBackend.mode = 'supabase'; mockBackend.rpc.mockReset(); });

test('règle : démonstration → test ; vrai serveur avec clé → boutique ; sans clé → indisponible', () => {
  expect(purchaseModeFor('demo', undefined)).toBe('test');
  expect(purchaseModeFor('demo', 'appl_xxx')).toBe('test');
  expect(purchaseModeFor('supabase', 'appl_xxx')).toBe('store');
  expect(purchaseModeFor('supabase', undefined)).toBe('unavailable');
});

test('la démonstration activée après le chargement passe en achats simulés', async () => {
  expect(getPurchaseMode()).toBe('unavailable'); // vrai serveur, pas de clé RevenueCat (web)
  mockBackend.mode = 'demo'; // « Découvrir sans compte » ou reprise de la démo
  expect(getPurchaseMode()).toBe('test');
  const plans = await getPlans();
  expect(plans.map((p) => p.period)).toEqual(['annual', 'six_months', 'monthly']);
  expect(plans.every((p) => p.demo)).toBe(true);
  mockBackend.rpc.mockResolvedValue(null);
  await expect(purchase(plans[0])).resolves.toBe('confirmed');
  expect(mockBackend.rpc).toHaveBeenCalledWith('set_demo_subscription', expect.objectContaining({ active: true }));
});

test('retour au vrai serveur : plus d’achat simulé', async () => {
  mockBackend.mode = 'demo';
  expect(getPurchaseMode()).toBe('test');
  const [plans0] = await getPlans();
  mockBackend.mode = 'supabase';
  expect(getPurchaseMode()).toBe('unavailable');
  // Hors démonstration et sans clé : aucune grille de prix (jamais de prix inventé), aucun achat
  expect(await getPlans()).toEqual([]);
  await expect(purchase(plans0)).rejects.toThrow();
  expect(mockBackend.rpc).not.toHaveBeenCalled();
});
