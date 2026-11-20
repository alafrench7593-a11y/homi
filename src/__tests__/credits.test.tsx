/**
 * Crédits HOMI IA côté application (démonstration : faux magasin, aucun paiement, aucune IA) :
 *  - modèle : libellés d'historique sans contenu de question, coûts, solde ;
 *  - règles de la démonstration = règles du serveur : aucun crédit sans abonnement, 1 000 (Premium) / 1 500 (Famille)
 *    à l'achat, mensuels d'abord puis achetés, refus `insufficient_credits`, pack crédité, grand livre cohérent ;
 *  - écran « Mes crédits » : solde, packs aux prix de la grille de démonstration, achat simulé, analyse d'essai,
 *    feuille « Vous n'avez plus de crédits », historique ;
 *  - page d'abonnement : formule Famille (prix, renouvellement visible), crédits expliqués ;
 *  - offres héritées : plus aucune vente côté application ; 5 langues complètes, aucun prix dans les textes.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-router', () => {
  const r = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true };
  return { router: r, useRouter: () => r, useLocalSearchParams: () => ({}), usePathname: () => '/settings/credits', useIsFocused: () => true };
});
jest.mock('react-native-purchases', () => ({ __esModule: true, default: { configure: jest.fn(), getOfferings: jest.fn(), purchasePackage: jest.fn(), restorePurchases: jest.fn(),
  getCustomerInfo: jest.fn(), addCustomerInfoUpdateListener: jest.fn(), checkTrialOrIntroductoryPriceEligibility: jest.fn(), getProducts: jest.fn(), purchaseStoreProduct: jest.fn(),
  INTRO_ELIGIBILITY_STATUS: {}, PRODUCT_CATEGORY: { SUBSCRIPTION: 'SUBSCRIPTION', NON_SUBSCRIPTION: 'NON_SUBSCRIPTION' } } }));
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));

import React from 'react';
import { Alert } from 'react-native';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { backend } from '@/lib/backend';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/Overlays';
import CreditsScreen from '@/app/settings/credits';
import SubscriptionScreen from '@/app/settings/subscription';
import { canAfford, costOf, DEFAULT_COSTS, historyLabel, isInsufficientCredits, signedAmount, totalRemaining, type CreditHistoryRow, type CreditStatus } from '@/lib/credits/model';
import { purchasesSdk } from '@/lib/purchaseMode';
import { DICTIONARIES } from '@/i18n/dictionaries';
import { setLocale, t as tr } from '@/i18n';
import { isFreeRoute } from '@/lib/premium/access';
import { FEATURES } from '@/config/features';

const nb = (s: string) => s.replace(/[  ]/g, ' ');
function texts(node: ReactTestInstance | string): string[] {
  if (typeof node === 'string') return [node];
  return node.children.flatMap((c) => texts(c as ReactTestInstance | string));
}
const allText = (r: ReactTestRenderer) => nb(texts(r.root).join('\n'));
const flush = async (ms = 30) => { await act(async () => { await new Promise((res) => setTimeout(res, ms)); }); };
const has = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id).length > 0;
const textOf = (r: ReactTestRenderer, id: string) => { const n = r.root.findAll((x) => x.props.testID === id)[0]; return n ? nb(texts(n).join(' ')).replace(/\s+/g, ' ').trim() : ''; };
async function render(el: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  let r!: ReactTestRenderer;
  await act(async () => {
    r = create(<QueryClientProvider client={qc}><AuthProvider><ThemeProvider><ToastProvider>{el}</ToastProvider></ThemeProvider></AuthProvider></QueryClientProvider>);
  });
  await flush(150);
  return r;
}
async function tap(r: ReactTestRenderer, id: string) {
  const el = r.root.findAll((n) => n.props.testID === id && typeof n.props.onPress === 'function')[0];
  if (!el) throw new Error(`Élément introuvable : ${id}\n${allText(r)}`);
  await act(async () => { await el.props.onPress(); });
  await flush(200);
}
const status = () => backend.rpc<CreditStatus>('credits_status');
const history = () => backend.rpc<CreditHistoryRow[]>('credits_history', { p_limit: 100 });

describe('modèle', () => {
  it('libellés d’historique lisibles, jamais le contenu d’une question', () => {
    setLocale('fr');
    const l = (row: Partial<CreditHistoryRow>) => { const x = historyLabel({ kind: 'debit', action: null, product_id: null, ...row } as CreditHistoryRow); return tr(x.key, x.params); };
    expect(l({ kind: 'monthly_grant' })).toBe('Crédits mensuels');
    expect(nb(l({ kind: 'purchase', product_id: 'homi_credits_800' }))).toBe('Pack de 800 crédits');
    expect(l({ kind: 'debit', action: 'assistant_question' })).toBe('Question à l’assistant');
    expect(l({ kind: 'debit', action: 'inconnue' })).toBe('Action HOMI IA');
    expect(l({ kind: 'expire' })).toBe('Crédits mensuels non utilisés (expirés)');
    expect(l({ kind: 'refund' })).toBe('Remboursement d’un pack');
  });
  it('coût lu dans la configuration du serveur, repli sur les valeurs initiales ; solde et refus', () => {
    expect(costOf('assistant_question', null)).toBe(1);
    expect(costOf('tool_analysis', { ai_enabled: true, costs: { tool_analysis: 7 }, packs: {}, grants: { premium: 1, family: 1 }, purchase_requires_subscription: true })).toBe(7);
    const s = { monthly_remaining: 1, purchased_remaining: 2 } as CreditStatus;
    expect(totalRemaining(s)).toBe(3);
    expect(canAfford(s, 3)).toBe(true);
    expect(canAfford(s, 4)).toBe(false);
    expect(isInsufficientCredits({ code: 'insufficient_credits' })).toBe(true);
    expect(signedAmount(-3, String)).toBe('−3');
    expect(signedAmount(300, String)).toBe('+300');
  });
  it('5 langues : mêmes clés, volumes et prix passés en paramètres (aucun prix écrit dans un texte)', () => {
    const keys = Object.keys(DICTIONARIES.fr).filter((k) => k.startsWith('cr.') || k.startsWith('fam.'));
    expect(keys.length).toBeGreaterThan(80);
    for (const lang of ['en', 'es', 'de', 'it']) for (const k of keys) expect([lang, k, k in DICTIONARIES[lang]]).toEqual([lang, k, true]);
    for (const lang of ['fr', 'en', 'es', 'de', 'it']) {
      for (const k of keys) expect([lang, k, /\d+[.,]\d\d|€|\$|1[  ]?000|1[  ]?500/.test(JSON.stringify(DICTIONARIES[lang][k]))]).toEqual([lang, k, false]);
    }
  });
  it('« Mes crédits » reste ouvert sans abonnement (il explique qu’il n’y a pas de crédits)', () => {
    expect(isFreeRoute('/settings/credits')).toBe(true);
  });
});

describe('démonstration : mêmes règles que le serveur', () => {
  beforeAll(async () => {
    setLocale('fr');
    await backend.auth.signUp('credits.demo@exemple.test', 'MotDePasse!2026');
  });

  it('sans abonnement : aucun crédit, aucune dépense, aucun pack', async () => {
    await backend.rpc('set_demo_subscription', { active: false });
    const s = await status();
    expect([s.subscribed, totalRemaining(s)]).toEqual([false, 0]);
    await expect(backend.rpc('demo_credit_spend', { action: 'assistant_question' })).rejects.toMatchObject({ code: 'premium_required' });
    await expect(backend.rpc('demo_credit_purchase', { product_id: 'homi_credits_300' })).rejects.toMatchObject({ code: 'premium_required' });
  });

  it('Premium : 1 000 crédits, mensuels d’abord, puis achetés, refus clair quand tout est épuisé', async () => {
    await backend.rpc('set_demo_subscription', { active: true, period: 'monthly', trial: false });
    let s = await status();
    expect([s.subscribed, s.tier, s.monthly_remaining, s.purchased_remaining, s.monthly_allowance]).toEqual([true, 'premium', 1000, 0, 1000]);
    expect(Date.parse(s.next_renewal!)).toBeGreaterThan(Date.now() + 25 * 86_400_000);
    await backend.rpc('demo_credit_spend', { action: 'tool_analysis' });
    s = await status();
    expect([s.monthly_remaining, s.used_this_period]).toEqual([1000 - DEFAULT_COSTS.tool_analysis, DEFAULT_COSTS.tool_analysis]);
    await backend.rpc('demo_credit_adjust', { monthly: 1 });
    await backend.rpc('demo_credit_purchase', { product_id: 'homi_credits_300', transaction_id: 'tx-demo-1' });
    await backend.rpc('demo_credit_purchase', { product_id: 'homi_credits_300', transaction_id: 'tx-demo-1' }); // même transaction : une fois
    await backend.rpc('demo_credit_spend', { action: 'tool_analysis' }); // 1 mensuel + 2 achetés
    s = await status();
    expect([s.monthly_remaining, s.purchased_remaining]).toEqual([0, 298]);
    await backend.rpc('demo_credit_adjust', { monthly: 0, purchased: 0 });
    const err = await backend.rpc('demo_credit_spend', { action: 'assistant_question' }).catch((e: unknown) => e);
    expect(isInsufficientCredits(err)).toBe(true);
    const h = await history();
    expect(h.map((x) => x.kind)).toEqual(expect.arrayContaining(['monthly_grant', 'purchase', 'debit', 'adjust']));
    expect(h.filter((x) => x.kind === 'purchase')).toHaveLength(1);
    expect(h.every((x) => !('content' in x) && !('message' in x))).toBe(true);
  });

  it('renouvellement : les mensuels restants expirent, les achetés restent', async () => {
    await backend.rpc('demo_credit_adjust', { monthly: 40, purchased: 120 });
    await backend.rpc('set_demo_subscription', { active: true, period: 'monthly', trial: false });
    const s = await status();
    expect([s.monthly_remaining, s.purchased_remaining]).toEqual([1000, 120]);
    expect((await history()).some((x) => x.kind === 'expire' && x.amount === -40)).toBe(true);
  });

  it('Famille : 1 500 crédits mensuels ; essai : 50', async () => {
    await backend.rpc('set_demo_subscription', { active: true, period: 'monthly', product_id: 'homi_family_monthly', trial: false });
    let s = await status();
    expect([s.tier, s.monthly_remaining, s.monthly_allowance]).toEqual(['family', 1500, 1500]);
    expect((await backend.rpc<{ tier?: string }>('my_access'))?.premium).toBe(true);
    await backend.rpc('set_demo_subscription', { active: false });
    await backend.rpc('set_demo_subscription', { active: true, period: 'monthly', trial: true, trial_days: 3 });
    s = await status();
    expect(s.monthly_remaining).toBe(50);
  });

  it('offres héritées : aucune vente possible côté application', async () => {
    await expect(purchasesSdk().purchaseOffer('aufildenous_ai_monthly', 'ASSISTANT_IA', 'subscription')).rejects.toThrow(tr('cr.legacy.noSale'));
    await expect(purchasesSdk().purchaseOffer('aufildenous_tool_custody', 'TOOL_CUSTODY', 'lifetime')).rejects.toThrow();
  });
});

describe('écrans (démonstration)', () => {
  beforeAll(async () => {
    setLocale('fr');
    await backend.auth.signUp('credits.ecran@exemple.test', 'MotDePasse!2026');
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => { void buttons?.[1]?.onPress?.(); });
  });

  it('Mes crédits sans abonnement : explication, aucun pack, renvoi vers les abonnements', async () => {
    await backend.rpc('set_demo_subscription', { active: false });
    const r = await render(<CreditsScreen />);
    expect(has(r, 'credits-nosub')).toBe(true);
    expect(textOf(r, 'credits-nosub')).toContain('1 000 crédits par mois');
    expect(has(r, 'credits-packs')).toBe(false);
    r.unmount();
  });

  it('Mes crédits : solde, packs (grille de démonstration), achat simulé, analyse d’essai, historique', async () => {
    await backend.rpc('set_demo_subscription', { active: true, period: 'monthly', trial: false });
    const r = await render(<CreditsScreen />);
    expect(textOf(r, 'credits-total')).toBe('1 000 crédits disponibles');
    expect(textOf(r, 'credits-monthly')).toContain('1 000');
    expect(textOf(r, 'credits-renewal')).toMatch(/Prochain renouvellement .*1 000 crédits mensuels/);
    const txt = allText(r);
    for (const p of ['2,99 €', '5,99 €', '11,99 €']) expect(txt).toContain(p);
    expect(has(r, 'credits-packs-demo')).toBe(true);
    await tap(r, 'pack-buy-homi_credits_800');
    expect((await status()).purchased_remaining).toBe(800);
    expect(textOf(r, 'credits-purchased')).toContain('800');
    expect(textOf(r, 'credits-demo-analyze-button')).toContain('Analyser avec HOMI IA — 3 crédits');
    await tap(r, 'credits-demo-analyze-button');
    expect((await status()).monthly_remaining).toBe(997);
    expect(has(r, 'credits-hist-debit') && has(r, 'credits-hist-purchase') && has(r, 'credits-hist-monthly_grant')).toBe(true);
    expect(textOf(r, 'credits-history')).toContain('Pack de 800 crédits');
    r.unmount();
  });

  it('solde épuisé : la feuille « Vous n’avez plus de crédits » s’ouvre avec le renouvellement et les packs', async () => {
    await backend.rpc('demo_credit_adjust', { monthly: 0, purchased: 0 });
    const r = await render(<CreditsScreen />);
    expect(textOf(r, 'credits-total')).toBe('0 crédit disponible');
    await tap(r, 'credits-demo-analyze-button');
    expect(has(r, 'credits-out-sheet')).toBe(true);
    expect(textOf(r, 'credits-out-cost')).toBe('Cette action demande 3 crédits. Il vous en reste 0.');
    expect(textOf(r, 'credits-out-renewal')).toMatch(/Vos 1 000 crédits mensuels reviennent le \d+ \S+\./);
    r.unmount();
  });

  it('page d’abonnement : Famille au prix de la grille, renouvellement visible, crédits expliqués, achat simulé', async () => {
    await backend.rpc('set_demo_subscription', { active: false });
    FEATURES.aiAssistantOnline = false; // état réel de l'application : l'IA n'est pas encore ouverte
    const r = await render(<SubscriptionScreen />);
    FEATURES.aiAssistantOnline = true;
    expect(textOf(r, 'family-price')).toBe('19,99 € par mois');
    expect(textOf(r, 'family-offer')).toContain('1 500 crédits HOMI IA par mois en commun');
    expect(textOf(r, 'family-renewal')).toContain('renouvelé automatiquement');
    expect(textOf(r, 'credits-info')).toContain('Premium : 1 000 crédits par mois');
    expect(textOf(r, 'credits-info')).toContain('pas encore ouverte');
    expect(allText(r)).not.toMatch(/Assistant IA.*7,99|à vie/);
    await tap(r, 'family-buy');
    expect((await status()).tier).toBe('family');
    expect((await status()).monthly_remaining).toBe(1500);
    r.unmount();
  });
});
