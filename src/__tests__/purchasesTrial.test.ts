/** Essai gratuit : affiché seulement si Apple confirme l'éligibilité (jamais un compteur local). */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
const mockCheck = jest.fn();
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(), logIn: jest.fn(), logOut: jest.fn(), getOfferings: jest.fn(), purchasePackage: jest.fn(),
    restorePurchases: jest.fn(), showManageSubscriptions: jest.fn(),
    checkTrialOrIntroductoryPriceEligibility: (...a: unknown[]) => mockCheck(...a),
    INTRO_ELIGIBILITY_STATUS: { INTRO_ELIGIBILITY_STATUS_UNKNOWN: 0, INTRO_ELIGIBILITY_STATUS_INELIGIBLE: 1, INTRO_ELIGIBILITY_STATUS_ELIGIBLE: 2, INTRO_ELIGIBILITY_STATUS_NO_INTRO_OFFER_EXISTS: 3 },
  },
}));

import { applyTrialEligibility, billingDates, type Plan } from '@/lib/purchases';

const monthly: Plan = { id: 'toietmoi_premium_monthly', period: 'monthly', title: 'Mensuel', price: '5,99 €', detail: '', trialLabel: '3 jours offerts', trialDays: 3, billed: '5,99 € facturés chaque mois' };
const annual: Plan = { id: 'toietmoi_premium_annual', period: 'annual', title: 'Annuel', price: '39,99 €', detail: '', trialLabel: '7 jours offerts', trialDays: 7, billed: '' };

beforeEach(() => mockCheck.mockReset());

test('iOS éligible : l’essai de 3 jours reste affiché', async () => {
  mockCheck.mockResolvedValue({ toietmoi_premium_monthly: { status: 2 }, toietmoi_premium_annual: { status: 2 } });
  const out = await applyTrialEligibility([monthly, annual], 'ios');
  expect(out[0].trialDays).toBe(3);
  expect(out[0].trialLabel).toBe('3 jours offerts');
});

test('iOS non éligible ou statut inconnu : prix normal, aucun essai promis', async () => {
  mockCheck.mockResolvedValue({ toietmoi_premium_monthly: { status: 1 }, toietmoi_premium_annual: { status: 0 } });
  const out = await applyTrialEligibility([monthly, annual], 'ios');
  expect(out.map((p) => p.trialDays)).toEqual([0, 0]);
  expect(out.every((p) => p.trialLabel === undefined)).toBe(true);
});

test('iOS : erreur de la boutique → aucun essai promis', async () => {
  mockCheck.mockRejectedValue(new Error('réseau'));
  const out = await applyTrialEligibility([monthly], 'ios');
  expect(out[0].trialDays).toBe(0);
});

test('Android : Google Play décide lui-même, la liste est inchangée', async () => {
  const out = await applyTrialEligibility([monthly], 'android');
  expect(out[0].trialDays).toBe(3);
  expect(mockCheck).not.toHaveBeenCalled();
});

test('date du premier prélèvement : 3 jours après le début de l’essai', () => {
  const from = new Date('2026-11-02T10:00:00Z');
  const { firstCharge, renewal } = billingDates({ period: 'monthly', trialDays: 3 }, from);
  expect(firstCharge.toISOString()).toBe('2026-11-05T10:00:00.000Z');
  expect(renewal.toISOString().slice(0, 10)).toBe('2026-12-05');
});
