/**
 * Essai gratuit : affiché seulement si la boutique le propose réellement à cette personne (jamais un compteur local).
 * iOS : éligibilité confirmée par Apple. Android : phase gratuite de l'option appliquée à l'achat (defaultOption).
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
const mockCheck = jest.fn();
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(), logIn: jest.fn(), logOut: jest.fn(), getOfferings: jest.fn(), purchasePackage: jest.fn(),
    restorePurchases: jest.fn(), showManageSubscriptions: jest.fn(), addCustomerInfoUpdateListener: jest.fn(), getCustomerInfo: jest.fn(),
    checkTrialOrIntroductoryPriceEligibility: (...a: unknown[]) => mockCheck(...a),
    INTRO_ELIGIBILITY_STATUS: { INTRO_ELIGIBILITY_STATUS_UNKNOWN: 0, INTRO_ELIGIBILITY_STATUS_INELIGIBLE: 1, INTRO_ELIGIBILITY_STATUS_ELIGIBLE: 2, INTRO_ELIGIBILITY_STATUS_NO_INTRO_OFFER_EXISTS: 3 },
  },
}));

import { applyTrialEligibility, billingDates } from '@/lib/purchases';
import { trialDaysOf, type Plan } from '@/lib/premium/plans';

const plan = (period: Plan['period'], id: string, trialDays: number): Plan => ({ id, period, months: period === 'annual' ? 12 : period === 'six_months' ? 6 : 1, price: 'x', amount: 1, currency: 'EUR', perMonth: null, savingsPct: null, trialDays, demo: false });
const monthly = plan('monthly', 'aufildenous_premium_monthly', 3);
const annual = plan('annual', 'aufildenous_premium_annual', 0);

beforeEach(() => mockCheck.mockReset());

test('iOS éligible : l’essai de 3 jours du mensuel reste affiché ; seule la formule avec essai est vérifiée', async () => {
  mockCheck.mockResolvedValue({ aufildenous_premium_monthly: { status: 2 } });
  const out = await applyTrialEligibility([monthly, annual], 'ios');
  expect(out.map((p) => p.trialDays)).toEqual([3, 0]);
  expect(mockCheck).toHaveBeenCalledWith(['aufildenous_premium_monthly']);
});

test('iOS non éligible ou statut inconnu : prix normal, aucun essai promis', async () => {
  mockCheck.mockResolvedValue({ aufildenous_premium_monthly: { status: 1 } });
  expect((await applyTrialEligibility([monthly], 'ios'))[0].trialDays).toBe(0);
  mockCheck.mockResolvedValue({ aufildenous_premium_monthly: { status: 0 } });
  expect((await applyTrialEligibility([monthly], 'ios'))[0].trialDays).toBe(0);
  mockCheck.mockResolvedValue({});
  expect((await applyTrialEligibility([monthly], 'ios'))[0].trialDays).toBe(0);
});

test('iOS : erreur de la boutique → aucun essai promis', async () => {
  mockCheck.mockRejectedValue(new Error('réseau'));
  expect((await applyTrialEligibility([monthly], 'ios'))[0].trialDays).toBe(0);
});

test('Android : pas de vérification RevenueCat (non disponible) ; l’essai vient de l’option réellement appliquée', async () => {
  const out = await applyTrialEligibility([monthly], 'android');
  expect(out[0].trialDays).toBe(3);
  expect(mockCheck).not.toHaveBeenCalled();
  const free = { billingPeriod: { unit: 'DAY', value: 3, iso8601: 'P3D' } };
  expect(trialDaysOf({ introPrice: null, defaultOption: { freePhase: free } } as never, 'android')).toBe(3);
  // Offre « nouveaux clients » déjà utilisée : Google Play ne la renvoie plus → option de base, sans phase gratuite
  expect(trialDaysOf({ introPrice: null, defaultOption: { freePhase: null } } as never, 'android')).toBe(0);
  expect(trialDaysOf({ introPrice: null, defaultOption: null } as never, 'android')).toBe(0);
});

test('iOS : introPrice gratuit de 3 jours → 3 ; prix d’introduction payant → pas un essai', () => {
  expect(trialDaysOf({ introPrice: { price: 0, periodUnit: 'DAY', periodNumberOfUnits: 3 }, defaultOption: null } as never, 'ios')).toBe(3);
  expect(trialDaysOf({ introPrice: { price: 1.99, periodUnit: 'MONTH', periodNumberOfUnits: 1 }, defaultOption: null } as never, 'ios')).toBe(0);
});

test('date du premier prélèvement : 3 jours après le début de l’essai ; renouvellement selon la durée', () => {
  const from = new Date('2026-11-02T10:00:00Z');
  const m = billingDates({ period: 'monthly', trialDays: 3 }, from);
  expect(m.firstCharge.toISOString()).toBe('2026-11-05T10:00:00.000Z');
  expect(m.renewal.toISOString().slice(0, 10)).toBe('2026-12-05');
  expect(billingDates({ period: 'six_months', trialDays: 0 }, from).renewal.toISOString().slice(0, 10)).toBe('2027-05-02');
  expect(billingDates({ period: 'annual', trialDays: 0 }, from).renewal.toISOString().slice(0, 10)).toBe('2027-11-02');
});
