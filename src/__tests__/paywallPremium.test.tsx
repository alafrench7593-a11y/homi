/**
 * Écran Premium v2 (15/11/2026) :
 *  - identifiants propres à HOMI (droit HOMI_PREMIUM, produits homi_premium_*), aucune trace d'« Au fil de nous » ;
 *  - grille de démonstration 14,99 / 69,99 / 119,99 €, essai 3 jours sur les 3 formules, économies 22 / 33 % ;
 *  - libellés exacts du bouton, chronologie de l'essai avec la vraie date J+3 selon la langue, lecture accessible ;
 *  - issues d'achat en mode boutique simulé : Ask to Buy, annulation, réseau → jamais de faux succès ;
 *  - rendu réel en démonstration : prix, sélection, achat simulé, abonné·e sans offre de nouveau client, retour à
 *    l'accueil depuis l'onboarding.
 * StoreKit réel : non testable ici (voir ABONNEMENT.md, tests sandbox sur iPhone).
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-router', () => {
  const r = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true };
  const state = { params: {} as Record<string, string> };
  return { router: r, useRouter: () => r, useLocalSearchParams: () => state.params, usePathname: () => '/premium', useIsFocused: () => true, __state: state };
});
// SDK natif d'achat : jamais appelé en démonstration (achat simulé côté données locales), simulé ici pour être chargeable
jest.mock('react-native-purchases', () => ({ __esModule: true, default: { configure: jest.fn(), getOfferings: jest.fn(), purchasePackage: jest.fn(), restorePurchases: jest.fn(),
  getCustomerInfo: jest.fn(), addCustomerInfoUpdateListener: jest.fn(), checkTrialOrIntroductoryPriceEligibility: jest.fn(), INTRO_ELIGIBILITY_STATUS: {} } }));
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));

import React from 'react';
import * as ExpoRouter from 'expo-router';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { backend } from '@/lib/backend';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/Overlays';
import PremiumScreen from '@/app/premium';
import { Paywall } from '@/features/Paywall';
import { chargeDate, ctaHint, ctaLabel, defaultPeriod, errorFeedback, outcomeFeedback, planA11yLabel, trialTimeline } from '@/features/premium/paywallModel';
import { demoPlans, DEMO_GRID, PREMIUM_ENTITLEMENT, PRODUCT_IDS } from '@/lib/premium/plans';
import { purchaseErrorKind } from '@/lib/premium/purchaseErrors';
import { setLocale } from '@/i18n';
import { DEFAULT_ENTITLEMENT, PRODUCT_IDS as SERVER_PRODUCT_IDS } from '../../supabase/functions/_shared/revenuecat';

const mockRouter = (ExpoRouter as unknown as { router: { replace: jest.Mock; push: jest.Mock } }).router;
const routerState = (ExpoRouter as unknown as { __state: { params: Record<string, string> } }).__state;
const nb = (s: string) => s.replace(/[  ]/g, ' ');

describe('identifiants HOMI Premium (isolement d’« Au fil de nous »)', () => {
  it('droit et produits identiques côté application et côté serveur', () => {
    expect(PREMIUM_ENTITLEMENT).toBe('HOMI_PREMIUM');
    expect(DEFAULT_ENTITLEMENT).toBe('HOMI_PREMIUM');
    expect(PRODUCT_IDS).toEqual({ monthly: 'homi_premium_monthly', six_months: 'homi_premium_6months', annual: 'homi_premium_annual' });
    expect(SERVER_PRODUCT_IDS).toEqual(PRODUCT_IDS);
    expect(JSON.stringify([PRODUCT_IDS, PREMIUM_ENTITLEMENT, DEFAULT_ENTITLEMENT])).not.toMatch(/fil|aufildenous/i);
  });
});

describe('grille de démonstration et calculs', () => {
  it('14,99 / 69,99 / 119,99 €, essai de 3 jours partout, économies 22 et 33 % calculées depuis les prix', () => {
    expect(DEMO_GRID).toEqual({ monthly: { amount: 14.99, trialDays: 3 }, six_months: { amount: 69.99, trialDays: 3 }, annual: { amount: 119.99, trialDays: 3 } });
    const plans = demoPlans('fr-FR');
    expect(plans.map((p) => [p.period, nb(p.price), p.perMonth && nb(p.perMonth), p.savingsPct, p.trialDays])).toEqual([
      ['annual', '119,99 €', '10,00 €', 33, 3], ['six_months', '69,99 €', '11,67 €', 22, 3], ['monthly', '14,99 €', null, null, 3],
    ]);
    expect(defaultPeriod(plans)).toBe('annual');
    expect(defaultPeriod(plans.filter((p) => p.period !== 'annual'))).toBe('six_months');
  });
});

describe('textes de l’écran (logique pure)', () => {
  const from = new Date('2026-11-15T10:00:00');
  afterEach(() => setLocale('fr'));
  it('bouton : essai si proposé, sinon prix et période exacts', () => {
    const [annual, , monthly] = demoPlans('fr-FR');
    expect(ctaLabel(annual)).toBe('Commencer l’essai de 3 jours');
    expect(nb(ctaLabel({ ...annual, trialDays: 0 }))).toBe('S’abonner — 119,99 € / an');
    expect(nb(ctaLabel({ ...monthly, trialDays: 0 }))).toBe('S’abonner — 14,99 € / mois');
    expect(nb(ctaHint(annual, from))).toBe('Gratuit pendant 3 jours, puis 119,99 € par an à partir du 18 novembre.');
    expect(nb(ctaHint({ ...monthly, trialDays: 0 }, from))).toBe('14,99 € par mois, prélevés à la confirmation de l’achat.');
  });
  it('chronologie : Aujourd’hui → Pendant 3 jours → Le <J+3> : début de l’abonnement au prix réel ; rien sans essai', () => {
    const [, six] = demoPlans('fr-FR');
    const steps = trialTimeline(six, from);
    expect(steps.map((s) => nb(s.title))).toEqual(['Aujourd’hui', 'Pendant 3 jours', 'Le 18 novembre']);
    expect(nb(steps[2].body)).toBe('Premier prélèvement : 69,99 € pour la formule 6 mois, sauf résiliation au moins 24 h avant.');
    expect(steps.some((s) => /prévien|rappel/i.test(s.body))).toBe(false); // aucune promesse de rappel
    expect(trialTimeline({ ...six, trialDays: 0 }, from)).toEqual([]);
    // Fin d'année : l'année est ajoutée
    expect(chargeDate(six, new Date('2026-12-30T10:00:00'))).toBe('2 janvier 2027');
  });
  it('date formatée selon la langue', () => {
    setLocale('en');
    const [annual] = demoPlans('en-GB');
    expect(trialTimeline(annual, from)[2].title).toMatch(/^On (18 November|November 18)$/);
    setLocale('de');
    expect(trialTimeline(annual, from)[2].title).toBe('Am 18. November');
  });
  it('lecteur d’écran : nom, prix et période, prix mensuel, économie, essai', () => {
    const [annual] = demoPlans('fr-FR');
    expect(nb(planA11yLabel(annual, true))).toBe('12 mois, 119,99 € par an, soit 10,00 € par mois, 33 % d’économie par rapport au mensuel, 3 jours d’essai gratuit, le plus avantageux');
  });
  it('issues d’achat : succès seulement quand le serveur confirme', () => {
    expect(outcomeFeedback('confirmed').tone).toBe('success');
    for (const o of ['pending', 'deferred', 'cancelled'] as const) expect(outcomeFeedback(o).tone).not.toBe('success');
    expect(outcomeFeedback('deferred').text).toMatch(/approbation/);
    expect(errorFeedback('network').text).toMatch(/réseau/);
    expect(errorFeedback('unavailable').text).toMatch(/iPhone/);
  });
});

describe('erreurs RevenueCat → catégorie', () => {
  it('codes de react-native-purchases 10', () => {
    expect(purchaseErrorKind({ userCancelled: true, code: '1' })).toBe('cancelled');
    expect(purchaseErrorKind({ code: '20' })).toBe('deferred');
    expect(purchaseErrorKind({ code: '10' })).toBe('network');
    expect(purchaseErrorKind({ code: '35' })).toBe('network');
    expect(purchaseErrorKind({ code: '3' })).toBe('not_allowed');
    expect(purchaseErrorKind({ code: '2' })).toBe('store');
    expect(purchaseErrorKind(new TypeError('Failed to fetch'))).toBe('network');
    expect(purchaseErrorKind(new Error('???'))).toBe('unknown');
    expect(purchaseErrorKind(null)).toBe('unknown');
  });
});

// ================================================================ rendu réel (démonstration)
function texts(node: ReactTestInstance | string): string[] {
  if (typeof node === 'string') return [node];
  return node.children.flatMap((c) => texts(c as ReactTestInstance | string));
}
const allText = (r: ReactTestRenderer) => nb(texts(r.root).join('\n'));
const flush = async (ms = 30) => { await act(async () => { await new Promise((res) => setTimeout(res, ms)); }); };
const has = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id).length > 0;
async function render(el: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  let r!: ReactTestRenderer;
  await act(async () => {
    r = create(<QueryClientProvider client={qc}><AuthProvider><ThemeProvider><ToastProvider>{el}</ToastProvider></ThemeProvider></AuthProvider></QueryClientProvider>);
  });
  await flush(80);
  return r;
}
async function tap(r: ReactTestRenderer, id: string) {
  const el = r.root.findAll((n) => n.props.testID === id && typeof n.props.onPress === 'function')[0];
  if (!el) throw new Error(`Élément introuvable : ${id}\n${allText(r)}`);
  await act(async () => { await el.props.onPress(); });
  await flush(120);
}
const buyLabel = (r: ReactTestRenderer) => nb(r.root.findAll((n) => n.props.testID === 'pw2-buy' && typeof n.props.label === 'string')[0]?.props.label ?? '');

describe('écran Premium (démonstration)', () => {
  beforeAll(async () => {
    await backend.auth.signUp('premium.v2@exemple.test', 'MotDePasse!2026');
  });
  beforeEach(() => { routerState.params = {}; mockRouter.replace.mockClear(); });

  it('nouveau client : avantages, 3 formules aux prix démo, annuelle choisie, chronologie avec la vraie date, puis achat simulé depuis l’onboarding → accueil', async () => {
    routerState.params = { from: 'onboarding' };
    const r = await render(<PremiumScreen />);
    const txt = allText(r);
    for (const s of ['119,99 €', '69,99 €', '14,99 €', 'économie de 33 %', 'économie de 22 %', '10,00 € / mois', '11,67 € / mois', 'Le plus avantageux']) expect(txt).toContain(s);
    expect(has(r, 'pw2-benefits')).toBe(true);
    expect(buyLabel(r)).toBe('Commencer l’essai de 3 jours');
    const expected = chargeDate({ period: 'annual', trialDays: 3 });
    expect(txt).toContain(`Le ${nb(expected)}`);
    expect(txt).toContain('Premier prélèvement : 119,99 € pour la formule 12 mois');
    expect(txt).toContain(`L’essai se termine le ${nb(expected)}`);
    // renouvellement automatique écrit en clair, dans le même bloc que le bouton
    expect(txt).toContain('Renouvellement automatique : 119,99 € par an, jusqu’à résiliation.');
    expect(txt).toMatch(/Réglages iOS › ton identifiant Apple › Abonnements/);
    expect(has(r, 'pw2-legal-terms') && has(r, 'pw2-legal-privacy') && has(r, 'pw2-restore') && has(r, 'pw2-close')).toBe(true);
    // Sélection : 6 mois → le bouton suit, la chronologie aussi
    await tap(r, 'pw2-plan-six_months');
    expect(allText(r)).toContain('Premier prélèvement : 69,99 € pour la formule 6 mois');
    // Achat simulé (démonstration) → retour à l'accueil
    await tap(r, 'pw2-buy');
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
    expect(await backend.rpc<boolean>('has_premium')).toBe(true);
    r.unmount();
  });

  it('abonné·e : formule actuelle et « Gérer l’abonnement », plus d’offre de nouveau client', async () => {
    const r = await render(<Paywall embedded />);
    await flush(120);
    expect(has(r, 'pw2-subscriber')).toBe(true);
    expect(has(r, 'pw2-plans')).toBe(false);
    expect(has(r, 'pw2-buy')).toBe(false);
    expect(allText(r)).toContain('Formule actuelle : 6 mois');
    expect(has(r, 'pw2-manage')).toBe(true);
    r.unmount();
  });

  it('restauration : achat fait ailleurs (même compte) retrouvé → état abonné·e ; sinon « aucun abonnement »', async () => {
    await backend.rpc('set_demo_subscription', { active: false });
    const r = await render(<Paywall embedded />);
    expect(has(r, 'pw2-plans')).toBe(true);
    await tap(r, 'pw2-restore');
    expect(allText(r)).toContain('Aucun abonnement actif trouvé');
    expect(has(r, 'pw2-plans')).toBe(true);
    // Abonnement présent côté serveur (autre appareil) sans que l'écran le sache encore
    await backend.rpc('set_demo_subscription', { active: true, period: 'annual', trial: false });
    await tap(r, 'pw2-restore');
    await flush(120);
    expect(has(r, 'pw2-subscriber')).toBe(true);
    expect(allText(r)).toContain('Formule actuelle : 12 mois');
    r.unmount();
  });

  it('« Plus tard » depuis l’onboarding : accueil, sans achat', async () => {
    await backend.rpc('set_demo_subscription', { active: false });
    routerState.params = { from: 'onboarding' };
    const r = await render(<PremiumScreen />);
    expect(has(r, 'pw2-plans')).toBe(true);
    await tap(r, 'pw2-later');
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
    r.unmount();
  });
});
