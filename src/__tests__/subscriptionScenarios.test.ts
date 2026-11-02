/**
 * Abonnement v2 — les 15 scénarios (logique pure + mode boutique simulé), changement de formule, choix des
 * 3 packages, économies calculées sur les prix réels, essai seulement si éligible, aucun prix écrit en dur hors démo.
 * Le SDK RevenueCat et le serveur sont simulés : aucun achat réel n'est fait ici (voir ABONNEMENT.md pour les tests
 * sur appareil).
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

const mockSdk = {
  configure: jest.fn(), logIn: jest.fn(async () => ({ created: false })), logOut: jest.fn(async () => undefined),
  getOfferings: jest.fn(), purchasePackage: jest.fn(async () => ({})), restorePurchases: jest.fn(async () => ({})),
  showManageSubscriptions: jest.fn(async () => undefined), getCustomerInfo: jest.fn(), addCustomerInfoUpdateListener: jest.fn(),
  checkTrialOrIntroductoryPriceEligibility: jest.fn(async () => ({})),
  INTRO_ELIGIBILITY_STATUS: { INTRO_ELIGIBILITY_STATUS_UNKNOWN: 0, INTRO_ELIGIBILITY_STATUS_INELIGIBLE: 1, INTRO_ELIGIBILITY_STATUS_ELIGIBLE: 2, INTRO_ELIGIBILITY_STATUS_NO_INTRO_OFFER_EXISTS: 3 },
};
jest.mock('react-native-purchases', () => ({ __esModule: true, default: mockSdk }));
const mockBackend = { mode: 'supabase', rpc: jest.fn(), invoke: jest.fn(), select: jest.fn() };
jest.mock('@/lib/backend', () => ({ get backend() { return mockBackend; } }));

import { entitlement, grants, type SubRow } from '@/lib/premium/entitlement';
import { deviceState, needsServerSync } from '@/lib/premium/customerSync';
import { billingDates, buildPlans, demoPlans, packagePeriod, productChangeFor, savingsPct, type Plan } from '@/lib/premium/plans';
import { mapStatus, periodOf, subscriptionFromEvent, subscriptionFromSubscriber } from '../../supabase/functions/_shared/revenuecat';

const NOW = new Date('2026-11-05T10:00:00Z');
const DAY = 86_400_000;
const at = (d: number) => new Date(NOW.getTime() + d * DAY).toISOString();
const ENT = 'AU_FIL_DE_NOUS_PREMIUM';
const USER = '11111111-1111-4111-8111-111111111111';

type Pkg = Parameters<typeof buildPlans>[0][number];
const pkg = (packageType: string, identifier: string, price: number, priceString: string, extra: Record<string, unknown> = {}): Pkg => ({
  identifier: `$rc_${packageType.toLowerCase()}`, packageType, offeringIdentifier: 'default',
  product: { identifier, price, priceString, currencyCode: 'EUR', subscriptionPeriod: null, introPrice: null, defaultOption: null, ...extra },
} as unknown as Pkg);
const storePkgs = () => [
  pkg('MONTHLY', 'aufildenous_premium_monthly', 10.99, '10,99 €', { subscriptionPeriod: 'P1M', introPrice: { price: 0, periodUnit: 'DAY', periodNumberOfUnits: 3 } }),
  pkg('SIX_MONTH', 'aufildenous_premium_6months', 54.99, '54,99 €', { subscriptionPeriod: 'P6M' }),
  pkg('ANNUAL', 'aufildenous_premium_annual', 99.99, '99,99 €', { subscriptionPeriod: 'P1Y' }),
];
const entInfo = (isActive: boolean, productIdentifier = 'aufildenous_premium_monthly', expirationDate = at(30), willRenew = true) =>
  ({ entitlements: { all: { [ENT]: { isActive, productIdentifier, expirationDate, willRenew } }, active: {} }, managementURL: null });

/** Module d'achat en mode boutique (clé publique présente, vrai serveur), rechargé à neuf (= réinstallation). */
function freshStore(os: 'ios' | 'android' = 'ios') {
  process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY = 'appl_public_test';
  process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY = 'goog_public_test';
  let mod!: typeof import('@/lib/purchases');
  Object.defineProperty(require('react-native').Platform, 'OS', { get: () => os, configurable: true });
  jest.isolateModules(() => {
    const { Platform } = require('react-native');
    Object.defineProperty(Platform, 'OS', { get: () => os, configurable: true });
    mod = require('@/lib/purchases');
  });
  return mod;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockBackend.mode = 'supabase';
  mockBackend.rpc.mockResolvedValue(false);
  mockBackend.invoke.mockResolvedValue({ synced: true, premium: false });
  mockBackend.select.mockResolvedValue([]);
  mockSdk.getCustomerInfo.mockResolvedValue({ entitlements: { all: {}, active: {} }, managementURL: null });
  mockSdk.getOfferings.mockResolvedValue({ current: { availablePackages: storePkgs() } });
});
afterAll(() => {
  const { Platform } = require('react-native');
  Object.defineProperty(Platform, 'OS', { get: () => 'ios', configurable: true });
});

// ================================================================ statuts (même règle que le serveur)
describe('statuts : même règle que public._subscription_grants', () => {
  const row = (status: SubRow['status'], expires: string | null, extra: Partial<SubRow> = {}): SubRow => ({ status, expires_at: expires, store: 'app_store', period_type: 'monthly', ...extra });
  it.each([
    ['none', at(30), false, 'free'], ['trial', at(2), true, 'trial'], ['active', at(20), true, 'active'], ['cancelled', at(3), true, 'cancelled'],
    ['grace', at(2), true, 'grace'], ['billing_issue', at(2), false, 'billing_issue'], ['expired', at(-1), false, 'expired'],
    ['refunded', at(20), false, 'refunded'], ['paused', at(5), true, 'paused'], ['paused', at(-1), false, 'paused'],
  ] as const)('%s (échéance %s) → Premium %s, statut affiché %s', (status, exp, premium, state) => {
    const e = entitlement(row(status, exp), NOW);
    expect([e.premium, e.state]).toEqual([premium, state]);
    expect(grants(row(status, exp), NOW)).toBe(status === 'none' ? false : premium);
  });
  it('échéance nulle : plus de Premium sans fin, sauf octroi promotionnel ou à vie explicite', () => {
    expect(grants(row('active', null), NOW)).toBe(false);
    expect(grants(row('cancelled', null), NOW)).toBe(false);
    expect(grants(row('active', null, { store: 'promotional' }), NOW)).toBe(true);
    expect(grants(row('active', null, { period_type: 'lifetime' }), NOW)).toBe(true);
  });
});

// ================================================================ les 15 scénarios
describe('15 scénarios', () => {
  it('1. gratuit : aucune ligne, appareil sans droit → pas de Premium, pas de synchronisation', async () => {
    expect(entitlement(null, NOW)).toMatchObject({ premium: false, state: 'free' });
    expect(needsServerSync(deviceState(null), null, NOW)).toBe(false);
    const p = freshStore();
    await p.configurePurchases(USER);
    expect(mockBackend.invoke).not.toHaveBeenCalled();
  });

  it('2. éligible à l’essai : 3 jours affichés sur le mensuel seulement (Apple confirme)', async () => {
    mockSdk.checkTrialOrIntroductoryPriceEligibility.mockResolvedValue({ aufildenous_premium_monthly: { status: 2 } } as never);
    const p = freshStore();
    const plans = await p.getPlans();
    expect(plans.map((x) => [x.period, x.trialDays])).toEqual([['annual', 0], ['six_months', 0], ['monthly', 3]]);
    // Non éligible (essai déjà utilisé dans le groupe) : aucun essai promis
    mockSdk.checkTrialOrIntroductoryPriceEligibility.mockResolvedValue({ aufildenous_premium_monthly: { status: 1 } } as never);
    expect((await p.getPlans()).find((x) => x.period === 'monthly')!.trialDays).toBe(0);
  });

  it('3. pendant l’essai : Premium, fin d’essai connue, renouvellement prévu', () => {
    const r = subscriptionFromEvent({ type: 'INITIAL_PURCHASE', app_user_id: USER, period_type: 'TRIAL', store: 'APP_STORE', event_timestamp_ms: NOW.getTime() }, NOW.getTime() + 3 * DAY, 'aufildenous_premium_monthly', ENT, NOW.getTime());
    expect(r).toMatchObject({ status: 'trial', period_type: 'monthly', trial_ends_at: at(3), will_renew: true });
    expect(entitlement(r as SubRow, NOW)).toMatchObject({ premium: true, state: 'trial', renews: true });
  });

  it('4. après l’essai : sans paiement → gratuit ; avec conversion → actif', () => {
    expect(entitlement({ status: 'trial', expires_at: at(-1), will_renew: true }, NOW).premium).toBe(false);
    const conv = subscriptionFromEvent({ type: 'RENEWAL', app_user_id: USER, period_type: 'NORMAL', is_trial_conversion: true, price_in_purchased_currency: 10.99, currency: 'EUR', event_timestamp_ms: NOW.getTime() }, NOW.getTime() + 30 * DAY, 'aufildenous_premium_monthly', ENT, NOW.getTime());
    expect(conv).toMatchObject({ status: 'active', price: 10.99, currency: 'EUR' });
  });

  it.each([
    ['5. mensuel actif', 'aufildenous_premium_monthly', 'monthly', 30],
    ['6. semestriel actif', 'aufildenous_premium_6months', 'six_months', 182],
    ['7. annuel actif', 'aufildenous_premium_annual', 'annual', 365],
  ] as const)('%s : même Premium, formule reconnue', (_n, product, period, days) => {
    const body = { subscriber: { entitlements: { [ENT]: { expires_date: at(days), product_identifier: product, purchase_date: at(0) } }, subscriptions: { [product]: { expires_date: at(days), period_type: 'normal', store: 'app_store', original_purchase_date: at(0) } } } };
    const r = subscriptionFromSubscriber(body, ENT, NOW.getTime())!.row;
    expect([r.status, r.period_type, grants(r as SubRow, NOW)]).toEqual(['active', period, true]);
  });

  it('8. annulation : droits jusqu’à l’échéance, puis expiration', () => {
    expect(mapStatus('CANCELLATION', NOW.getTime() + 3 * DAY, NOW.getTime(), { cancel_reason: 'UNSUBSCRIBE' })).toBe('cancelled');
    expect(entitlement({ status: 'cancelled', expires_at: at(3), will_renew: false }, NOW)).toMatchObject({ premium: true, state: 'cancelled', renews: false });
    expect(entitlement({ status: 'cancelled', expires_at: at(-1), will_renew: false }, NOW).premium).toBe(false);
  });

  it('9. échec de paiement : période de grâce (Premium) puis problème de paiement (plus de Premium)', () => {
    expect(mapStatus('BILLING_ISSUE', NOW.getTime() + 6 * DAY, NOW.getTime())).toBe('grace');
    expect(mapStatus('EXPIRATION', NOW.getTime() - 1, NOW.getTime(), { expiration_reason: 'BILLING_ERROR' })).toBe('billing_issue');
    expect(entitlement({ status: 'billing_issue', expires_at: at(-1) }, NOW)).toMatchObject({ premium: false, state: 'billing_issue' });
  });

  it('10. restauration : la boutique restaure, le serveur relit RevenueCat, le serveur confirme', async () => {
    const p = freshStore();
    await p.configurePurchases(USER);
    mockBackend.rpc.mockResolvedValue(true); // has_premium (serveur)
    await expect(p.restore()).resolves.toBe(true);
    expect(mockSdk.restorePurchases).toHaveBeenCalled();
    expect(mockBackend.invoke).toHaveBeenCalledWith('subscription-sync', {});
  });

  it('11. changement de téléphone : même appUserID (id du compte) → mêmes achats, synchronisation si le serveur diffère', async () => {
    mockSdk.getCustomerInfo.mockResolvedValue(entInfo(true));
    mockBackend.select.mockResolvedValue([]); // le serveur ne connaît pas encore l'achat
    const p = freshStore();
    await p.configurePurchases(USER);
    expect(mockSdk.configure).toHaveBeenCalledWith({ apiKey: 'appl_public_test', appUserID: USER });
    expect(mockBackend.invoke).toHaveBeenCalledWith('subscription-sync', {});
  });

  it('12. suppression de compte puis autre compte : déconnexion RevenueCat, logIn (jamais une seconde configuration)', async () => {
    const p = freshStore();
    await p.configurePurchases(USER);
    await p.resetPurchasesUser();
    expect(mockSdk.logOut).toHaveBeenCalledTimes(1);
    await p.configurePurchases('22222222-2222-4222-8222-222222222222');
    expect(mockSdk.configure).toHaveBeenCalledTimes(1);
    expect(mockSdk.logIn).toHaveBeenCalledWith('22222222-2222-4222-8222-222222222222');
    expect(p.__purchasesState()).toEqual({ configured: true, currentUser: '22222222-2222-4222-8222-222222222222' });
  });

  it('13. réinstallation : nouvelle configuration avec le même appUserID ; état serveur déjà à jour → aucune synchronisation', async () => {
    mockSdk.getCustomerInfo.mockResolvedValue(entInfo(true, 'aufildenous_premium_annual', at(200)));
    mockBackend.select.mockResolvedValue([{ status: 'active', product_id: 'aufildenous_premium_annual', expires_at: at(200), will_renew: true, store: 'app_store', period_type: 'annual' }]);
    const p = freshStore();
    await p.configurePurchases(USER);
    expect(mockSdk.configure).toHaveBeenCalledWith({ apiKey: 'appl_public_test', appUserID: USER });
    expect(mockBackend.invoke).not.toHaveBeenCalled();
  });

  it('14. remboursement : droits retirés immédiatement, statut « Remboursé »', () => {
    const r = subscriptionFromEvent({ type: 'CANCELLATION', cancel_reason: 'CUSTOMER_SUPPORT', app_user_id: USER, event_timestamp_ms: NOW.getTime() }, NOW.getTime() + 20 * DAY, 'aufildenous_premium_annual', ENT, NOW.getTime());
    expect(r).toMatchObject({ status: 'refunded', will_renew: false, refunded_at: NOW.toISOString() });
    expect(entitlement(r as SubRow, NOW)).toMatchObject({ premium: false, state: 'refunded' });
  });

  it('15. contournement : l’achat réussi côté appareil ne donne rien tant que le serveur ne confirme pas ; jamais d’achat simulé en mode boutique', async () => {
    const p = freshStore();
    await p.configurePurchases(USER);
    const [annual] = await p.getPlans();
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
    const out = p.purchase(annual);
    await jest.advanceTimersByTimeAsync(25_000);
    await expect(out).resolves.toBe('pending'); // has_premium (serveur) reste faux
    jest.useRealTimers();
    expect(mockBackend.rpc).not.toHaveBeenCalledWith('set_demo_subscription', expect.anything());
    // L'appareil se dit Premium, le serveur non : on DEMANDE une relecture au serveur, sans accorder de droit localement
    expect(needsServerSync(deviceState(entInfo(true) as never), { status: 'expired', expires_at: at(-1) }, NOW)).toBe(true);
    expect(grants({ status: 'expired', expires_at: at(-1) }, NOW)).toBe(false);
  });
});

// ================================================================ changement de formule
describe('changement de formule (sans double abonnement)', () => {
  it('Android mensuel → annuel : remplacement immédiat au prorata ; annuel → mensuel : à l’échéance', () => {
    expect(productChangeFor('android', 'aufildenous_premium_monthly', 'monthly', { id: 'aufildenous_premium_annual', period: 'annual' }))
      .toEqual({ oldProductIdentifier: 'aufildenous_premium_monthly', replacementMode: 'WITH_TIME_PRORATION' });
    expect(productChangeFor('android', 'aufildenous_premium_annual', 'annual', { id: 'aufildenous_premium_monthly', period: 'monthly' }))
      .toEqual({ oldProductIdentifier: 'aufildenous_premium_annual', replacementMode: 'DEFERRED' });
    // 1 abonnement Google à 3 offres de base : l'identifiant attendu est celui de l'abonnement
    expect(productChangeFor('android', 'aufildenous_premium:monthly', 'monthly', { id: 'aufildenous_premium:annual', period: 'annual' })?.oldProductIdentifier).toBe('aufildenous_premium');
  });
  it('iOS (même groupe d’abonnements) et premier achat : rien à transmettre, Apple gère', () => {
    expect(productChangeFor('ios', 'aufildenous_premium_monthly', 'monthly', { id: 'aufildenous_premium_annual', period: 'annual' })).toBeNull();
    expect(productChangeFor('android', null, null, { id: 'aufildenous_premium_annual', period: 'annual' })).toBeNull();
  });
  it('Android : l’achat d’une autre formule transmet l’abonnement en cours à Google Play', async () => {
    mockSdk.getCustomerInfo.mockResolvedValue(entInfo(true, 'aufildenous_premium_monthly'));
    mockBackend.rpc.mockResolvedValue(true);
    const p = freshStore('android');
    await p.configurePurchases(USER);
    const plans = await p.getPlans();
    await expect(p.purchase(plans.find((x) => x.period === 'annual')!)).resolves.toBe('confirmed');
    expect(mockSdk.purchasePackage).toHaveBeenCalledWith(expect.anything(), null, { oldProductIdentifier: 'aufildenous_premium_monthly', replacementMode: 'WITH_TIME_PRORATION' });
  });
  it('serveur : mensuel → annuel (PRODUCT_CHANGE puis RENEWAL) → formule annuelle', () => {
    expect(periodOf('aufildenous_premium_annual')).toBe('annual');
    expect(periodOf('aufildenous_premium_6months')).toBe('six_months');
    expect(periodOf('aufildenous_premium:six-months')).toBe('six_months');
    const r = subscriptionFromEvent({ type: 'RENEWAL', app_user_id: USER, event_timestamp_ms: NOW.getTime() }, NOW.getTime() + 365 * DAY, 'aufildenous_premium_annual', ENT, NOW.getTime());
    expect(r.period_type).toBe('annual');
  });
});

// ================================================================ packages, économies, prix
describe('3 packages, économies, prix', () => {
  it('choix des 3 packages : un par durée, dans l’ordre 12 mois / 6 mois / mensuel ; les autres ignorés', () => {
    const extra = [pkg('WEEKLY', 'x_week', 2.99, '2,99 €'), pkg('MONTHLY', 'doublon_mensuel', 1, '1,00 €'), pkg('CUSTOM', 'custom_six', 50, '50,00 €', { subscriptionPeriod: 'P6M' })];
    const plans = buildPlans([...storePkgs(), ...extra], 'ios', 'fr-FR');
    expect(plans.map((p) => [p.period, p.id])).toEqual([['annual', 'aufildenous_premium_annual'], ['six_months', 'aufildenous_premium_6months'], ['monthly', 'aufildenous_premium_monthly']]);
    expect(packagePeriod(pkg('CUSTOM', 'y', 1, '1', { subscriptionPeriod: 'P1Y' }) as never)).toBe('annual');
    expect(packagePeriod(pkg('LIFETIME', 'z', 1, '1') as never)).toBeNull();
  });
  it('économies calculées sur les prix réels (arrondies vers le bas) et prix par mois', () => {
    expect(savingsPct(54.99, 6, 10.99)).toBe(16);
    expect(savingsPct(99.99, 12, 10.99)).toBe(24);
    expect(savingsPct(10.99, 1, 10.99)).toBeNull();
    expect(savingsPct(70, 6, 10.99)).toBeNull(); // plus cher que 6 mensualités : aucune économie annoncée
    const plans = buildPlans(storePkgs(), 'ios', 'fr-FR');
    expect(plans.map((p) => p.savingsPct)).toEqual([24, 16, null]);
    expect(plans[0].perMonth?.replace(/\s/g, ' ')).toBe('8,33 €');
    expect(plans[1].perMonth?.replace(/\s/g, ' ')).toBe('9,17 €');
  });
  it('autres prix de la boutique (autre pays, promotion) : affichés et calculés tels quels', () => {
    const plans = buildPlans([
      pkg('MONTHLY', 'aufildenous_premium_monthly', 11.49, 'CHF 11.49'), pkg('SIX_MONTH', 'aufildenous_premium_6months', 59, 'CHF 59.00'), pkg('ANNUAL', 'aufildenous_premium_annual', 104, 'CHF 104.00'),
    ].map((p) => ({ ...p, product: { ...p.product, currencyCode: 'CHF' } })) as never, 'ios', 'fr-CH');
    expect(plans.map((p) => p.price)).toEqual(['CHF 104.00', 'CHF 59.00', 'CHF 11.49']);
    expect(plans.map((p) => p.savingsPct)).toEqual([savingsPct(104, 12, 11.49), savingsPct(59, 6, 11.49), null]);
    expect(plans.every((p) => !p.demo)).toBe(true);
  });
  it('démonstration : grille 10,99 / 54,99 / 99,99, signalée, essai de 3 jours sur le mensuel seulement', () => {
    const plans = demoPlans('fr-FR');
    expect(plans.map((p) => [p.period, p.price.replace(/\s/g, ' '), p.trialDays, p.demo])).toEqual([
      ['annual', '99,99 €', 0, true], ['six_months', '54,99 €', 0, true], ['monthly', '10,99 €', 3, true],
    ]);
    expect(plans.map((p) => p.savingsPct)).toEqual([24, 16, null]);
  });
  it('dates : premier prélèvement après l’essai, renouvellement selon la durée', () => {
    const p: Pick<Plan, 'period' | 'trialDays'> = { period: 'monthly', trialDays: 3 };
    expect(billingDates(p, NOW).firstCharge.toISOString()).toBe(at(3));
  });
  it('aucun prix écrit en dur dans le code de l’application, hors grille de démonstration et CGU', () => {
    type Dirent = { name: string; isDirectory(): boolean };
    const fs = require('fs') as { readdirSync(p: string, o: { withFileTypes: true }): Dirent[]; readFileSync(p: string, e: 'utf8'): string };
    const path = require('path') as { join(...p: string[]): string; resolve(p: string): string; relative(a: string, b: string): string };
    const root = path.resolve('src');
    const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
      const p = path.join(d, e.name);
      return e.isDirectory() ? (e.name === '__tests__' ? [] : walk(p)) : /\.(tsx?|json)$/.test(e.name) ? [p] : [];
    });
    const PRICE = /(?<![\d.,])(10[.,]99|54[.,]99|99[.,]99|5[.,]99|39[.,]99|3[.,]33)(?![\d])/;
    const allowed = new Set(['lib/premium/plans.ts', 'content/legal.ts']);
    const offenders = walk(root).filter((f) => !allowed.has(path.relative(root, f).replace(/\\/g, '/')) && !/content\/(articles|foods|recipes|firstnames|who)/.test(f))
      .filter((f) => PRICE.test(fs.readFileSync(f, 'utf8')));
    expect(offenders.map((f) => path.relative(root, f))).toEqual([]);
  });
});
