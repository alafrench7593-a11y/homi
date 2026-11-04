/**
 * Page Premium et feuille Premium sur iPhone quand les formules ne sont PAS encore disponibles (cas réel du
 * 05/11/2026 : produits pas encore créés dans App Store Connect / RevenueCat), puis quand elles le deviennent.
 * Rendu réel (React Native, préréglage iOS), mode d'achat « boutique » simulé : SDK RevenueCat simulé, données lues dans
 * le moteur local. Vérifie : jamais d'écran vide, jamais de prix inventé, jamais de bouton d'achat sans formule de la
 * boutique, jamais de Premium accordé par l'application, « Premium activé » seulement quand le serveur le confirme,
 * retour à la fonction d'origine, refus serveur de réactiver un rappel personnel au-delà de la limite gratuite.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-router', () => {
  const r = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true, setParams: jest.fn() };
  const state = { params: {} as Record<string, string> };
  return { router: r, useRouter: () => r, useLocalSearchParams: () => state.params, useIsFocused: () => true, usePathname: () => '/settings/subscription', __state: state };
});
jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: ({ children }: { children: unknown }) => children }));
jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DATE: 'date', DAILY: 'daily', WEEKLY: 'weekly', TIME_INTERVAL: 'timeInterval' }, AndroidImportance: { HIGH: 4, DEFAULT: 3 },
  scheduleNotificationAsync: jest.fn(async () => 'n'), cancelScheduledNotificationAsync: jest.fn(async () => undefined), getAllScheduledNotificationsAsync: jest.fn(async () => []),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })), setNotificationHandler: jest.fn(), setNotificationChannelAsync: jest.fn(async () => null),
  setNotificationCategoryAsync: jest.fn(async () => null), getPermissionsAsync: jest.fn(async () => ({ granted: false })), getLastNotificationResponse: jest.fn(() => null),
}));
jest.mock('expo-device', () => ({ isDevice: false, modelName: 'test' }));

const mockSdk = {
  configure: jest.fn(), logIn: jest.fn(async () => ({ created: false })), logOut: jest.fn(async () => undefined),
  getOfferings: jest.fn(), purchasePackage: jest.fn(async () => ({})), restorePurchases: jest.fn(async () => ({})),
  showManageSubscriptions: jest.fn(async () => undefined), getCustomerInfo: jest.fn(async () => ({ entitlements: { all: {}, active: {} } })), addCustomerInfoUpdateListener: jest.fn(),
  checkTrialOrIntroductoryPriceEligibility: jest.fn(async () => ({})),
  INTRO_ELIGIBILITY_STATUS: { INTRO_ELIGIBILITY_STATUS_UNKNOWN: 0, INTRO_ELIGIBILITY_STATUS_INELIGIBLE: 1, INTRO_ELIGIBILITY_STATUS_ELIGIBLE: 2, INTRO_ELIGIBILITY_STATUS_NO_INTRO_OFFER_EXISTS: 3 },
};
jest.mock('react-native-purchases', () => ({ __esModule: true, get default() { return mockSdk; } }));
// Mode d'achat imposé par le test (« store » = application iPhone compilée avec la clé publique RevenueCat)
const mockMode = { value: 'store' as 'store' | 'test' | 'unavailable' };
jest.mock('@/lib/purchaseMode', () => {
  const actual = jest.requireActual('@/lib/purchaseMode');
  return {
    ...actual,
    getPurchaseMode: () => mockMode.value,
    loadPlans: () => (mockMode.value === 'store' ? require('@/lib/purchases').getPlans() : Promise.resolve(mockMode.value === 'test' ? require('@/lib/premium/plans').demoPlans('fr-FR') : [])),
  };
});

import React from 'react';
import { Platform } from 'react-native';
import * as ExpoRouter from 'expo-router';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { backend, BackendError, eq } from '@/lib/backend';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/Overlays';
import SubscriptionScreen from '@/app/settings/subscription';
import { PremiumPreviewHost } from '@/components/Premium';
import { usePremiumSheet } from '@/lib/data/hooks-premium';
import { plansAvailability, plansErrorKind } from '@/lib/premium/plans';
import { purchase } from '@/lib/purchases';

const routerState = (ExpoRouter as unknown as { __state: { params: Record<string, string> } }).__state;
const mockRouter = (ExpoRouter as unknown as { router: { back: jest.Mock; push: jest.Mock } }).router;

function texts(node: ReactTestInstance | string): string[] {
  if (typeof node === 'string') return [node];
  return node.children.flatMap((c) => texts(c as ReactTestInstance | string));
}
const allText = (r: ReactTestRenderer) => texts(r.root).join('\n').replace(/[  ]/g, ' ');
const flush = async (ms = 60) => { await act(async () => { await new Promise((res) => setTimeout(res, ms)); }); };
let qc: QueryClient;
async function render(el: React.ReactElement) {
  qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } } });
  let r!: ReactTestRenderer;
  await act(async () => { r = create(<QueryClientProvider client={qc}><AuthProvider><ThemeProvider><ToastProvider>{el}</ToastProvider></ThemeProvider></AuthProvider></QueryClientProvider>); });
  await flush(150);
  return r;
}
const has = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id).length > 0;
async function pressId(r: ReactTestRenderer, id: string) {
  const el = r.root.findAll((n) => n.props.testID === id && typeof n.props.onPress === 'function')[0];
  if (!el) throw new Error(`testID introuvable : ${id}`);
  await act(async () => { await el.props.onPress(); });
  await flush(150);
}
const MONEY = /\d+,\d\d\s?€/;

type Pkg = Record<string, unknown>;
const pkg = (packageType: string, identifier: string, price: number, priceString: string, extra: Record<string, unknown> = {}): Pkg => ({
  identifier: `$rc_${packageType.toLowerCase()}`, packageType, offeringIdentifier: 'default',
  product: { identifier, price, priceString, currencyCode: 'EUR', subscriptionPeriod: null, introPrice: null, defaultOption: null, ...extra },
});
const storePkgs = () => [
  pkg('MONTHLY', 'aufildenous_premium_monthly', 10.99, '10,99 €', { subscriptionPeriod: 'P1M', introPrice: { price: 0, periodUnit: 'DAY', periodNumberOfUnits: 3 } }),
  pkg('SIX_MONTH', 'aufildenous_premium_6months', 54.99, '54,99 €', { subscriptionPeriod: 'P6M' }),
  pkg('ANNUAL', 'aufildenous_premium_annual', 99.99, '99,99 €', { subscriptionPeriod: 'P1Y' }),
];
const rcError = (code: string, readable: string, message: string) => Object.assign(new Error(message), { code, readableErrorCode: readable, userInfo: { readableErrorCode: readable }, underlyingErrorMessage: '', userCancelled: false });

beforeAll(async () => {
  await backend.auth.signUp(`abonnement.iphone.${Platform.OS}@exemple.test`, 'MotDePasse!2026');
});
beforeEach(async () => {
  jest.clearAllMocks();
  // Utilisatrice sans abonnement (le moteur local tient lieu de serveur ; aucune ligne d'un test précédent)
  await backend.remove('subscriptions', []).catch(() => undefined);
  mockMode.value = 'store';
  routerState.params = {};
  usePremiumSheet.getState().hide();
});
afterAll(async () => { await flush(300); });

// ================================================================ logique pure
describe('disponibilité des formules (logique pure)', () => {
  it('erreurs RevenueCat : configuration / produit absent → « pas encore en ligne » ; réseau → hors ligne ; autre → boutique injoignable', () => {
    expect(plansErrorKind(rcError('23', 'CONFIGURATION_ERROR', 'There is an issue with your configuration.'))).toBe('not_ready');
    expect(plansErrorKind(rcError('5', 'PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR', 'The product is not available for purchase.'))).toBe('not_ready');
    expect(plansErrorKind({ message: 'None of the products registered in the RevenueCat dashboard could be fetched from App Store Connect. More information: https://rev.cat/why-are-offerings-empty' })).toBe('not_ready');
    expect(plansErrorKind(rcError('10', 'NETWORK_ERROR', 'Error performing request.'))).toBe('offline');
    expect(plansErrorKind(rcError('35', 'OFFLINE_CONNECTION_ERROR', 'offline'))).toBe('offline');
    expect(plansErrorKind(rcError('2', 'STORE_PROBLEM_ERROR', 'There was a problem with the App Store.'))).toBe('store_error');
    expect(plansErrorKind(undefined)).toBe('store_error');
  });

  it('état affiché selon le mode, la plateforme et la réponse de la boutique', () => {
    expect(plansAvailability({ mode: 'unavailable', os: 'web', count: 0 })).toBe('web');
    expect(plansAvailability({ mode: 'store', os: 'web', count: 3 })).toBe('web');
    expect(plansAvailability({ mode: 'test', os: 'web', count: 3 })).toBe('ready');
    expect(plansAvailability({ mode: 'unavailable', os: 'ios', count: 0 })).toBe('unconfigured');
    expect(plansAvailability({ mode: 'store', os: 'ios', isLoading: true, count: 0 })).toBe('loading');
    expect(plansAvailability({ mode: 'store', os: 'ios', count: 0 })).toBe('not_ready');
    expect(plansAvailability({ mode: 'store', os: 'ios', isError: true, error: rcError('23', 'CONFIGURATION_ERROR', 'x'), count: 0 })).toBe('not_ready');
    expect(plansAvailability({ mode: 'store', os: 'android', count: 3 })).toBe('ready');
  });

  it('sans boutique : aucun achat possible, aucune RPC de démonstration, aucun droit accordé', async () => {
    mockMode.value = 'unavailable';
    const plan = { id: 'aufildenous_premium_annual', period: 'annual' as const, months: 12, price: '99,99 €', amount: 99.99, currency: 'EUR', perMonth: null, savingsPct: null, trialDays: 0, demo: true };
    await expect(purchase(plan)).rejects.toThrow();
    mockMode.value = 'store'; // boutique, mais formule sans package de la boutique (ex. grille de démonstration)
    await expect(purchase(plan)).rejects.toThrow();
    expect(mockSdk.purchasePackage).not.toHaveBeenCalled();
    expect(await backend.rpc<boolean>('has_premium')).toBe(false);
    expect((await backend.select<{ status: string }>({ table: 'subscriptions' })).filter((s) => s.status !== 'none')).toHaveLength(0);
  });
});

// ================================================================ page Premium (iPhone, mode boutique)
describe(`page Premium sur iPhone sans formule disponible (${Platform.OS})`, () => {
  it('offre courante vide (produits pas encore créés) : message clair, « Réessayer », aucun prix, aucun bouton d’achat', async () => {
    mockSdk.getOfferings.mockResolvedValue({ current: null, all: {} });
    const r = await render(<SubscriptionScreen />);
    const t = allText(r);
    expect(has(r, 'plans-unavailable-not_ready')).toBe(true);
    expect(t).toContain('Formules momentanément indisponibles');
    expect(t).toContain('rien ne vous est facturé');
    expect(t).toContain('toutes les fonctions gratuites restent accessibles');
    expect(has(r, 'plans-retry')).toBe(true);
    expect(has(r, 'plan-buy')).toBe(false);
    expect(has(r, 'premium-plans')).toBe(false);
    expect(t).not.toMatch(MONEY);
    expect(t).not.toContain('Montants de démonstration');
    // État « Mon abonnement » : gratuit, restauration toujours proposée (mode boutique)
    expect(has(r, 'my-subscription')).toBe(true);
    expect(t).toContain('Gratuit');
    expect(has(r, 'sub-restore')).toBe(true);
    // Les formules arrivent (produits créés) : « Réessayer » affiche les PRIX DE LA BOUTIQUE
    mockSdk.getOfferings.mockResolvedValue({ current: { availablePackages: storePkgs() } });
    await pressId(r, 'plans-retry');
    await flush(200);
    const t2 = allText(r);
    expect(has(r, 'premium-plans')).toBe(true);
    expect(t2).toContain('99,99 €');
    expect(t2).toContain('54,99 €');
    expect(t2).toContain('10,99 €');
    expect(t2).not.toContain('Montants de démonstration');
    expect(has(r, 'plan-buy')).toBe(true);
    r.unmount();
  });

  it('erreur de configuration RevenueCat : même message honnête, jamais le texte technique', async () => {
    mockSdk.getOfferings.mockRejectedValue(rcError('23', 'CONFIGURATION_ERROR', 'There is an issue with your configuration. Check the underlying error for more details.'));
    const r = await render(<SubscriptionScreen />);
    const t = allText(r);
    expect(has(r, 'plans-unavailable-not_ready')).toBe(true);
    expect(t).not.toMatch(/configuration|underlying|RevenueCat/i);
    expect(has(r, 'plan-buy')).toBe(false);
    r.unmount();
  });

  it('pas de réseau : « Pas de connexion » et « Réessayer »', async () => {
    mockSdk.getOfferings.mockRejectedValue(rcError('10', 'NETWORK_ERROR', 'Error performing request.'));
    const r = await render(<SubscriptionScreen />);
    expect(has(r, 'plans-unavailable-offline')).toBe(true);
    expect(allText(r)).toContain('Pas de connexion');
    expect(has(r, 'plans-retry')).toBe(true);
    r.unmount();
  });

  it('application compilée sans clé RevenueCat : formules indisponibles, ni « Réessayer » ni « Restaurer », aucun appel à la boutique', async () => {
    mockMode.value = 'unavailable';
    const r = await render(<SubscriptionScreen />);
    const t = allText(r);
    expect(has(r, 'plans-unavailable-unconfigured')).toBe(true);
    expect(t).toContain('pas encore ouverts dans cette version');
    expect(has(r, 'plans-retry')).toBe(false);
    expect(has(r, 'sub-restore')).toBe(false);
    expect(has(r, 'plan-buy')).toBe(false);
    expect(t).not.toMatch(MONEY);
    expect(mockSdk.getOfferings).not.toHaveBeenCalled();
    r.unmount();
  });
});

// ================================================================ feuille Premium (déclenchée par une fonction Premium)
describe('feuille Premium ouverte par une fonction Premium', () => {
  it('formules indisponibles : la feuille le dit, « En savoir plus » mène à la page, « Plus tard » ferme', async () => {
    mockSdk.getOfferings.mockResolvedValue({ current: null, all: {} });
    const r = await render(<PremiumPreviewHost />);
    await act(async () => { usePremiumSheet.getState().show({ feature: 'weekly_menu' }); });
    await flush(200);
    const t = allText(r);
    expect(has(r, 'premium-preview')).toBe(true);
    expect(t).toContain('Préparez les menus de toute la semaine');
    expect(has(r, 'premium-sheet-unavailable')).toBe(true);
    expect(t).toContain('En savoir plus sur Premium');
    expect(t).not.toMatch(MONEY);
    await pressId(r, 'premium-see-plans');
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/settings/subscription', params: { feature: 'weekly_menu' } });
    expect(usePremiumSheet.getState().open).toBeNull();
    await act(async () => { usePremiumSheet.getState().show({ feature: 'weekly_menu' }); });
    await flush();
    await pressId(r, 'premium-later');
    expect(usePremiumSheet.getState().open).toBeNull();
    r.unmount();
  });

  it('formules disponibles : 3 formules aux prix de la boutique, la formule choisie est transmise à la page', async () => {
    mockSdk.getOfferings.mockResolvedValue({ current: { availablePackages: storePkgs() } });
    const r = await render(<PremiumPreviewHost />);
    await act(async () => { usePremiumSheet.getState().show({ feature: 'weekly_menu' }); });
    await flush(250);
    const t = allText(r);
    expect(t).toContain('Les 3 formules Premium');
    expect(t).toContain('99,99 €');
    const six = r.root.findAll((n) => n.props.accessibilityRole === 'radio' && typeof n.props.onPress === 'function' && String(n.props.accessibilityLabel).startsWith('Formule 6 mois'))[0];
    await act(async () => { six.props.onPress(); });
    await flush();
    expect(allText(r)).toContain('Continuer avec la formule 6 mois');
    await pressId(r, 'premium-see-plans');
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/settings/subscription', params: { feature: 'weekly_menu', plan: 'six_months' } });
    r.unmount();
  });
});

// ================================================================ confirmation et retour
describe('confirmation seulement par le serveur, puis retour à la fonction', () => {
  it('profil 5 : achat annulé ou refusé par la boutique → rien d’accordé, aucune confirmation', async () => {
    mockSdk.getOfferings.mockResolvedValue({ current: { availablePackages: storePkgs() } });
    routerState.params = { feature: 'weekly_menu', plan: 'annual' };
    const r = await render(<SubscriptionScreen />);
    expect(allText(r)).toContain('S’abonner — 99,99 €');
    // L'utilisatrice ferme la feuille de paiement Apple
    mockSdk.purchasePackage.mockRejectedValueOnce(Object.assign(new Error('Purchase was cancelled.'), { code: '1', userCancelled: true }));
    await pressId(r, 'plan-buy');
    expect(mockSdk.purchasePackage).toHaveBeenCalledTimes(1);
    expect((mockSdk.purchasePackage.mock.calls[0] as unknown[])[0]).toMatchObject({ product: { identifier: 'aufildenous_premium_annual' } });
    expect(has(r, 'premium-activated')).toBe(false);
    expect(allText(r)).not.toContain('Bienvenue');
    // Paiement refusé par la boutique
    mockSdk.purchasePackage.mockRejectedValueOnce(Object.assign(new Error('Le paiement a été refusé par la boutique.'), { code: '6', userCancelled: false }));
    await pressId(r, 'plan-buy');
    expect(has(r, 'premium-activated')).toBe(false);
    expect(await backend.rpc<boolean>('has_premium')).toBe(false);
    r.unmount();
  });

  it('aucun « Premium activé » tant que le serveur n’a rien confirmé ; confirmation serveur → « Premium activé » + retour à la fonction', async () => {
    mockSdk.getOfferings.mockResolvedValue({ current: { availablePackages: storePkgs() } });
    routerState.params = { feature: 'weekly_menu', plan: 'annual' };
    const r = await render(<SubscriptionScreen />);
    expect(has(r, 'sub-tried')).toBe(true);
    expect(has(r, 'premium-activated')).toBe(false);
    expect(await backend.rpc<boolean>('has_premium')).toBe(false);
    // Le serveur confirme (webhook RevenueCat → ligne subscriptions) : simulé dans le moteur local
    await backend.rpc('set_demo_subscription', { state: 'active', period: 'annual', expires_in_days: 365 });
    await act(async () => { await qc.invalidateQueries(); });
    await flush(250);
    expect(has(r, 'premium-activated')).toBe(true);
    expect(allText(r)).toContain('Reprendre où j’en étais');
    await pressId(r, 'premium-activated-back');
    expect(mockRouter.back).toHaveBeenCalled();
    // Profil 6 (déjà abonnée) : formule actuelle signalée, bouton « C’est votre formule actuelle » désactivé
    const t = allText(r);
    expect(t).toContain('Changer de formule');
    expect(t).toContain('Votre formule actuelle');
    r.unmount();
  });
});

// ================================================================ limite gratuite : rappels personnels (même règle que la base)
describe('rappels personnels : la limite gratuite ne se contourne pas par une modification (moteur local = base)', () => {
  it('désactiver → créer → réactiver : refusé ; modifier un rappel actif : accepté', async () => {
    const me = (await backend.auth.getSession())!.userId;
    const sched = { type: 'daily', hour: 9, minute: 0 };
    for (let i = 1; i <= 5; i++) await backend.insert('reminders', { user_id: me, category: 'custom', title: `Q${i}`, schedule: sched, journey_type: 'self' });
    await backend.update('reminders', { enabled: false }, [eq('title', 'Q1')]);
    await backend.insert('reminders', { user_id: me, category: 'custom', title: 'Q6', schedule: sched, journey_type: 'self' });
    const err = await backend.update('reminders', { enabled: true }, [eq('title', 'Q1')]).catch((e) => e);
    expect(err).toBeInstanceOf(BackendError);
    expect((err as BackendError).isPremiumRequired).toBe(true);
    await backend.update('reminders', { title: 'Q2 bis', enabled: true }, [eq('title', 'Q2')]);
    expect((await backend.select<{ title: string }>({ table: 'reminders', filters: [eq('title', 'Q2 bis')] }))).toHaveLength(1);
  });
});
