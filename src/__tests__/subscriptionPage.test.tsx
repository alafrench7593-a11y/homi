/**
 * Page d'abonnement finalisée (17/11/2026) — ce que la page affirme est vrai, et les calculs viennent des prix réels :
 *  - économie, équivalent mensuel et formule conseillée CALCULÉS depuis des prix de boutique quelconques ;
 *  - essai : date exacte de fin, date et montant du premier prélèvement ; non éligible : aucune mention d'essai ;
 *  - comparatif : chaque ligne « Sans abonnement » cite des écrans réellement ouverts, les outils gratuits annoncés
 *    sont exactement ceux du registre, les outils Premium cités sont tous réservés, les écrans de la nounou s'ouvrent ;
 *  - abonné·e : achat personnel (formule, changement) ou Premium partagé par l'autre adulte du foyer (rien à gérer) ;
 *  - aucun prix ni durée d'essai écrits en dur dans les textes d'abonnement des 5 langues ;
 *  - rendu réel de la page en démonstration : non abonné éligible, non éligible, abonné, abonné partagé.
 * StoreKit réel : non testable ici (ABONNEMENT.md § 5).
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-router', () => {
  const r = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true };
  const state = { params: {} as Record<string, string> };
  return { router: r, useRouter: () => r, useLocalSearchParams: () => state.params, usePathname: () => '/settings/subscription', useIsFocused: () => true, __state: state };
});
jest.mock('react-native-purchases', () => ({ __esModule: true, default: { configure: jest.fn(), getOfferings: jest.fn(), purchasePackage: jest.fn(), restorePurchases: jest.fn(),
  getCustomerInfo: jest.fn(), addCustomerInfoUpdateListener: jest.fn(), checkTrialOrIntroductoryPriceEligibility: jest.fn(), INTRO_ELIGIBILITY_STATUS: {} } }));
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));

import React from 'react';
import * as ExpoRouter from 'expo-router';
import type { PurchasesPackage } from 'react-native-purchases';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { backend, eq } from '@/lib/backend';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/Overlays';
import SubscriptionScreen from '@/app/settings/subscription';
import { FAMILY_ITEMS, FREE_ITEMS, NANNY_ROUTES, PREMIUM_GROUPS } from '@/features/premium/offerModel';
import { chargeDate, ctaHint, ctaLabel, defaultPeriod, ownActive, planA11yLabel, purchaseTerms, recommendedPeriod, renewLine, subscriberSummary, trialTimeline } from '@/features/premium/paywallModel';
import { TOOLS } from '@/lib/journeys/tools';
import { gateFor, isFreeRoute } from '@/lib/premium/access';
import type { AccessInfo } from '@/lib/premium/offers';
import { buildPlans, demoPlans, type Plan } from '@/lib/premium/plans';
import { DICTIONARIES } from '@/i18n/dictionaries';
import { setLocale, t as tr } from '@/i18n';

const mockRouter = (ExpoRouter as unknown as { router: { replace: jest.Mock; push: jest.Mock; back: jest.Mock } }).router;
const nb = (s: string) => s.replace(/[\u00a0\u202f]/g, ' ');
const LANGS = ['fr', 'en', 'de', 'es', 'it'] as const;

/** Paquet RevenueCat minimal (prix d'une boutique quelconque, pas la grille de démonstration). */
function pkg(type: 'MONTHLY' | 'SIX_MONTH' | 'ANNUAL', id: string, price: number, currency = 'USD', trial = true): PurchasesPackage {
  return { identifier: id, packageType: type, product: { identifier: id, price, priceString: `$${price.toFixed(2)}`, currencyCode: currency, subscriptionPeriod: null,
    introPrice: trial ? { price: 0, periodNumberOfUnits: 3, periodUnit: 'DAY' } : null } } as unknown as PurchasesPackage;
}

// ================================================================ calculs depuis les prix réels
describe('économie, équivalent mensuel et formule conseillée (calculés, jamais écrits)', () => {
  it('prix de boutique quelconques : équivalent mensuel et économie dérivés du mensuel réel', () => {
    const plans = buildPlans([pkg('MONTHLY', 'm', 9.99), pkg('SIX_MONTH', 's', 47.99), pkg('ANNUAL', 'a', 71.99)], 'ios', 'en-US');
    expect(plans.map((p) => [p.period, p.perMonth, p.savingsPct])).toEqual([['annual', '$6.00', 39], ['six_months', '$8.00', 19], ['monthly', null, null]]);
    expect(recommendedPeriod(plans)).toBe('annual');
    expect(defaultPeriod(plans)).toBe('annual');
  });

  it('la formule conseillée suit les prix, pas la durée : un 6 mois plus avantageux que l’annuel est conseillé', () => {
    const plans = buildPlans([pkg('MONTHLY', 'm', 10), pkg('SIX_MONTH', 's', 30), pkg('ANNUAL', 'a', 100)], 'ios', 'en-US');
    expect(plans.map((p) => p.savingsPct)).toEqual([16, 50, null]);
    expect(recommendedPeriod(plans)).toBe('six_months');
  });

  it('aucune économie calculable : aucune formule signalée, aucun pourcentage affiché', () => {
    // formules longues sans avantage, puis devises différentes, puis mensuel absent
    const flat = buildPlans([pkg('MONTHLY', 'm', 10), pkg('SIX_MONTH', 's', 60), pkg('ANNUAL', 'a', 125)], 'ios', 'en-US');
    expect(flat.map((p) => p.savingsPct)).toEqual([null, null, null]);
    expect(recommendedPeriod(flat)).toBeNull();
    const mixed = buildPlans([pkg('MONTHLY', 'm', 10, 'USD'), pkg('ANNUAL', 'a', 60, 'EUR')], 'ios', 'en-US');
    expect(mixed.find((p) => p.period === 'annual')!.savingsPct).toBeNull();
    const noMonthly = buildPlans([pkg('SIX_MONTH', 's', 30), pkg('ANNUAL', 'a', 50)], 'ios', 'en-US');
    expect(recommendedPeriod(noMonthly)).toBeNull();
    expect(defaultPeriod(noMonthly)).toBe('annual');
  });

  it('grille de démonstration : mêmes fonctions, 22 et 33 % obtenus par le calcul', () => {
    const plans = demoPlans('fr-FR');
    expect(plans.map((p) => [p.period, p.savingsPct, p.perMonth && nb(p.perMonth)])).toEqual([['annual', 33, '10,00 €'], ['six_months', 22, '11,67 €'], ['monthly', null, null]]);
    expect(recommendedPeriod(plans)).toBe('annual');
  });
});

// ================================================================ essai : dates et non-éligibilité
describe('essai gratuit : dates exactes ; non éligible : aucune mention', () => {
  afterAll(() => setLocale('fr'));
  const annual = (trialDays: number): Plan => ({ ...demoPlans('fr-FR')[0], trialDays });

  it('date de fin de l’essai = date du premier prélèvement = aujourd’hui + durée de l’essai, avec le montant de la formule', () => {
    setLocale('fr');
    const from = new Date(2026, 10, 17, 10, 0);
    expect(chargeDate(annual(3), from)).toBe('20 novembre');
    const tl = trialTimeline(annual(3), from).map((s) => nb(`${s.title} — ${s.body}`));
    expect(tl[1]).toBe('Pendant 3 jours — L’essai se termine le 20 novembre. Vous pouvez annuler avant, à tout moment, sans frais.');
    expect(tl[2]).toBe('Le 20 novembre — Premier prélèvement : 119,99 € pour la formule 12 mois, sauf résiliation au moins 24 h avant.');
    // essai de 7 jours configuré en boutique : tout suit, rien n'est écrit pour « 3 jours »
    expect(chargeDate(annual(7), from)).toBe('24 novembre');
    expect(ctaLabel(annual(7))).toBe('Commencer l’essai de 7 jours');
    // changement d'année : l'année est précisée
    expect(chargeDate(annual(3), new Date(2026, 11, 30, 10, 0))).toBe('2 janvier 2027');
  });

  it('conditions tarifaires : prélèvement, renouvellement automatique (montant et période), annulation, origine du prix', () => {
    setLocale('fr');
    const from = new Date(2026, 10, 17, 10, 0);
    const terms = purchaseTerms(annual(3), 'ios', from).map((l) => [l.key, nb(l.text)]);
    expect(terms).toEqual([
      ['charge', 'Gratuit pendant 3 jours, puis 119,99 € par an à partir du 20 novembre.'],
      ['renew', 'Renouvellement automatique : 119,99 € par an, jusqu’à résiliation.'],
      ['cancel', 'Pour annuler : Réglages iOS › votre identifiant Apple › Abonnements, au moins 24 h avant l’échéance.'],
      ['source', 'Démonstration : montants de la grille prévue, aucun paiement, données fictives.'],
    ]);
    expect(nb(purchaseTerms({ ...annual(3), demo: false }, 'android', from)[2].text)).toContain('Google Play');
    expect(nb(purchaseTerms({ ...annual(3), demo: false }, 'ios', from)[3].text)).toBe('Prix de votre boutique, taxes comprises, confirmé avant tout paiement.');
  });

  it.each(LANGS)('non éligible (%s) : ni chronologie, ni bouton d’essai, ni mot « essai » dans les conditions ou la lecture d’écran', (lang) => {
    setLocale(lang);
    const p = annual(0);
    expect(trialTimeline(p)).toEqual([]);
    const texts = [ctaLabel(p), ctaHint(p), renewLine(p), planA11yLabel(p, true), ...purchaseTerms({ ...p, demo: false }, 'ios').map((l) => l.text)].join(' | ');
    expect(texts).not.toMatch(/essai|trial|Test|prueba|prova|gratuit|free|gratis|kostenlos/i);
    expect(nb(ctaLabel(p))).toContain(nb(p.price));
  });
});

// ================================================================ le comparatif dit vrai
describe('comparatif : chaque affirmation est vraie dans le code', () => {
  const freeTools = () => {
    const out: string[] = [];
    for (const t of TOOLS) {
      if (t.category === 'account') continue;
      const hrefs = new Set<string>();
      for (const scope of t.scopes) {
        const h = t.href({ scope, childId: 'c1', pregnancyId: 'p1', babyId: 'c1' });
        if (h) hrefs.add((h.replace('/(tabs)', '') || '/').split('?')[0]);
      }
      if ([...hrefs].some((h) => isFreeRoute(h))) out.push(t.id);
    }
    return out.sort();
  };

  it('« Sans abonnement » : tous les écrans cités s’ouvrent sans Premium', () => {
    for (const item of FREE_ITEMS) {
      for (const route of item.routes) expect([route, gateFor(route, false, null)]).toEqual([route, 'open']);
    }
  });

  it('les outils gratuits annoncés sont EXACTEMENT ceux du registre qui s’ouvrent sans Premium (7 outils)', () => {
    const announced = FREE_ITEMS.flatMap((i) => i.tools ?? []).sort();
    expect(announced).toEqual(freeTools());
    expect(announced).toEqual(['avoid_emergency', 'emergency', 'family_sos', 'family_urgent', 'pp_support', 'recall_alerts', 'sources']);
  });

  it('ce que la page ne promet PAS sans abonnement reste bien réservé (apparence, suivi, communauté)', () => {
    for (const route of ['/settings/appearance', '/track', '/bottle', '/community', '/cycle', '/family/tasks']) expect(gateFor(route, false, null)).toBe('locked');
  });

  it('« HOMI Premium » : 4 besoins, chaque outil cité existe dans le registre et est réservé à Premium', () => {
    expect(PREMIUM_GROUPS.map((g) => g.key)).toEqual(['me', 'child', 'family', 'tools']);
    const free = freeTools();
    const ids = new Set(TOOLS.map((t) => t.id));
    for (const g of PREMIUM_GROUPS) {
      expect(g.tools.length).toBeGreaterThan(0);
      for (const id of g.tools) {
        expect([id, ids.has(id)]).toEqual([id, true]);
        expect(free).not.toContain(id);
      }
    }
    // l'assistant IA n'est pas ouvert (« bientôt disponible ») : jamais annoncé
    expect(PREMIUM_GROUPS.flatMap((g) => g.tools)).not.toEqual(expect.arrayContaining(['ask']));
    for (const lang of LANGS) {
      const all = PREMIUM_GROUPS.map((g) => String(DICTIONARIES[lang][g.text])).join(' ');
      expect(all).not.toMatch(/assistant|\bIA\b|\bAI\b|\bKI\b/i);
    }
  });

  it('« En famille » : une nounou sans Premium ouvre les écrans de garde cités, pas ses propres outils ; sans rôle nounou, ils sont réservés', () => {
    const nanny: AccessInfo = { premium: false, ai: false, trial_until: null, strict: true, caregiver: true, tools: [] };
    for (const route of NANNY_ROUTES) {
      expect([route, gateFor(route, false, nanny)]).toEqual([route, 'open']);
      expect([route, gateFor(route, false, { ...nanny, caregiver: false })]).toEqual([route, 'locked']);
    }
    for (const route of ['/cycle', '/community', '/meals']) expect(gateFor(route, false, nanny)).toBe('locked');
    expect(FAMILY_ITEMS.map((i) => i.key)).toEqual(['sub3.fam.adult', 'sub3.fam.one', 'sub3.fam.nanny']);
  });

  it('aucune formule « Familiale » payante ni supplément annoncé, dans aucune langue', () => {
    for (const lang of LANGS) {
      const fam = FAMILY_ITEMS.map((i) => String(DICTIONARIES[lang][i.key])).join(' ');
      expect(fam).not.toMatch(/\+\s*\d|[€$£]/);
    }
    expect(tr('sub3.fam.adult')).toMatch(/sans supplément/);
  });
});

// ================================================================ abonné·e : origine
describe('vue abonné : achat personnel ou Premium partagé', () => {
  beforeAll(() => setLocale('fr'));
  it('achat personnel : formule, échéance, gérable', () => {
    const s = subscriberSummary({ premium: true, message: 'Renouvellement automatique le 17 décembre 2026.', sub: { status: 'active', period_type: 'annual', product_id: 'homi_premium_annual' } });
    expect(s).toEqual({ origin: 'own', originText: 'Achat personnel', period: 'annual', message: 'Renouvellement automatique le 17 décembre 2026.', manageable: true });
    // résilié mais encore ouvert : toujours un abonnement personnel (fin d'accès annoncée par le message)
    expect(subscriberSummary({ premium: true, message: 'x', sub: { status: 'cancelled', period_type: 'monthly' } })?.origin).toBe('own');
  });

  it('abonné partagé : aucun abonnement personnel en cours → origine « Partagé par … », formule inconnue, non gérable', () => {
    const none = subscriberSummary({ premium: true, message: 'Version gratuite', sub: null }, { display_name: 'Camille' });
    expect(none).toEqual({ origin: 'shared', originText: 'Partagé par Camille', period: null, message: 'Premium vous est offert par Camille, dans votre foyer.', manageable: false });
    // ancien abonnement personnel expiré + Premium du foyer : c'est bien un partage, pas « terminé »
    const expired = subscriberSummary({ premium: true, message: 'Terminé le 1 novembre 2026', sub: { status: 'expired', period_type: 'monthly' } }, { display_name: null });
    expect(expired).toMatchObject({ origin: 'shared', originText: 'Partagé par l’autre adulte de votre foyer', manageable: false });
    expect(ownActive({ status: 'expired' }, true)).toBe(false);
  });

  it('sans Premium : aucun résumé', () => {
    expect(subscriberSummary({ premium: false, message: 'Version gratuite', sub: null })).toBeNull();
    expect(subscriberSummary({ premium: false, message: 'x', sub: { status: 'active' } })).toBeNull();
  });
});

// ================================================================ aucun prix en dur
describe('textes d’abonnement : aucun prix ni durée d’essai écrits en dur (5 langues)', () => {
  const PREFIXES = ['sub2.', 'sub3.', 'pay2.', 'pw.', 'u1.sub.'];
  it.each(LANGS)('%s', (lang) => {
    const dict = DICTIONARIES[lang];
    const keys = Object.keys(dict).filter((k) => PREFIXES.some((p) => k.startsWith(p)));
    expect(keys.length).toBeGreaterThan(150);
    for (const k of keys) {
      const m = dict[k];
      const forms = typeof m === 'string' ? [m] : Object.values(m as Record<string, string>);
      for (const text of forms) {
        // ni symbole monétaire, ni code de devise, ni montant décimal, ni pourcentage chiffré
        expect([k, /[€$£]|\b(EUR|USD|GBP|CHF)\b|\d+[.,]\d{2}\b|\d+\s?%/.test(text)]).toEqual([k, false]);
        // ni durée d'essai chiffrée : elle vient de la boutique ({count})
        expect([k, /\b\d+\s*(jours?|days?|Tagen?|días?|giorn[oi])\b/i.test(text)]).toEqual([k, false]);
      }
    }
  });

  it('les montants et la durée passent par des paramètres', () => {
    for (const lang of LANGS) {
      expect(String(DICTIONARIES[lang]['pay2.fine.renew'])).toMatch(/\{price\}.*\{per\}/);
      expect(String(DICTIONARIES[lang]['pay2.tl.chargeBody'])).toMatch(/\{price\}/);
      expect(String(DICTIONARIES[lang]['pay2.tl.duringBody'])).toMatch(/\{date\}/);
      expect(JSON.stringify(DICTIONARIES[lang]['pay2.cta.trial'])).toMatch(/\{count\}/);
    }
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
/** Texte du premier nœud portant ce testID (le même identifiant est recopié sur les nœuds hôtes). */
const textOf = (r: ReactTestRenderer, id: string) => { const n = r.root.findAll((x) => x.props.testID === id)[0]; return n ? nb(texts(n).join(' ')).replace(/\s+/g, ' ').trim() : ''; };
async function render(el: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  let r!: ReactTestRenderer;
  await act(async () => {
    r = create(<QueryClientProvider client={qc}><AuthProvider><ThemeProvider><ToastProvider>{el}</ToastProvider></ThemeProvider></AuthProvider></QueryClientProvider>);
  });
  await flush(120);
  return r;
}
async function tap(r: ReactTestRenderer, id: string) {
  const el = r.root.findAll((n) => n.props.testID === id && typeof n.props.onPress === 'function')[0];
  if (!el) throw new Error(`Élément introuvable : ${id}\n${allText(r)}`);
  await act(async () => { await el.props.onPress(); });
  await flush(150);
}
const label = (r: ReactTestRenderer, id: string) => nb(r.root.findAll((n) => n.props.testID === id && typeof n.props.label === 'string')[0]?.props.label ?? '');
const a11y = (r: ReactTestRenderer, id: string) => nb(r.root.findAll((n) => n.props.testID === id && typeof n.props.accessibilityLabel === 'string')[0]?.props.accessibilityLabel ?? '');

describe('page d’abonnement (démonstration)', () => {
  beforeAll(async () => {
    setLocale('fr');
    await backend.auth.signUp('abonnement.page@exemple.test', 'MotDePasse!2026');
  });
  beforeEach(() => { mockRouter.back.mockClear(); });

  it('non abonné·e éligible : promesse, 3 blocs, 3 formules calculées, essai daté, renouvellement à côté du bouton, restaurer, gérer, CGU, continuer sans s’abonner', async () => {
    const r = await render(<SubscriptionScreen />);
    const txt = allText(r);
    expect(textOf(r, 'sub3-promise')).toBe(tr('sub3.promise'));
    expect(has(r, 'sub3-free') && has(r, 'sub3-premium') && has(r, 'sub3-family')).toBe(true);
    for (const k of ['me', 'child', 'family', 'tools']) expect(has(r, `sub3-premium-${k}`)).toBe(true);
    for (const s of ['119,99 €', '69,99 €', '14,99 €', 'économie de 33 %', 'économie de 22 %', '10,00 € / mois', '11,67 € / mois']) expect(txt).toContain(s);
    expect(has(r, 'pw2-badge') && has(r, 'pw2-recommended-why')).toBe(true);
    // lecture d'écran : nom, prix, période, équivalent mensuel, économie, essai, formule conseillée
    expect(a11y(r, 'pw2-plan-annual')).toBe('12 mois, 119,99 € par an, soit 10,00 € par mois, 33 % d’économie par rapport au mensuel, 3 jours d’essai gratuit, le plus avantageux');
    expect(a11y(r, 'pw2-plan-monthly')).toBe('Mensuel, 14,99 € par mois, 3 jours d’essai gratuit');
    // essai : durée, fin, premier prélèvement et montant, comment annuler
    const date = nb(chargeDate({ period: 'annual', trialDays: 3 }));
    const tl = textOf(r, 'pw2-timeline');
    expect(tl).toContain('Pendant 3 jours');
    expect(tl).toContain(`L’essai se termine le ${date}`);
    expect(tl).toContain(`Le ${date}`);
    expect(tl).toContain('Premier prélèvement : 119,99 € pour la formule 12 mois');
    expect(tl).toContain('Réglages iOS › votre identifiant Apple › Abonnements');
    // bouton et, dans le même bloc, prélèvement + renouvellement automatique
    expect(label(r, 'plan-buy')).toBe('Commencer l’essai de 3 jours');
    expect(textOf(r, 'pw2-cta-terms')).toContain(`Gratuit pendant 3 jours, puis 119,99 € par an à partir du ${date}.`);
    expect(textOf(r, 'pw2-cta-terms')).toContain('Renouvellement automatique : 119,99 € par an, jusqu’à résiliation.');
    expect(has(r, 'sub-restore') && has(r, 'sub-manage-link') && has(r, 'sub-legal-links') && has(r, 'sub3-continue-free')).toBe(true);
    expect(txt).not.toMatch(/offre limitée|plus que \d|expire dans|\d+:\d\d:\d\d|Familiale|\+ ?5/i);
    // changer de formule : bouton et conditions suivent
    await tap(r, 'pw2-plan-monthly');
    expect(textOf(r, 'pw2-cta-terms')).toContain('Renouvellement automatique : 14,99 € par mois, jusqu’à résiliation.');
    expect(textOf(r, 'pw2-timeline')).toContain('Premier prélèvement : 14,99 € pour la formule Mensuel');
    await tap(r, 'sub3-continue-free');
    expect(mockRouter.back).toHaveBeenCalled();
    expect(await backend.rpc<boolean>('has_premium')).toBe(false);
    r.unmount();
  });

  it('abonné·e (achat personnel) : formule en cours, échéance, origine, changer de formule, gérer, restaurer — plus aucun essai', async () => {
    const r = await render(<SubscriptionScreen />);
    await tap(r, 'plan-buy');
    await flush(200);
    expect(await backend.rpc<boolean>('has_premium')).toBe(true);
    expect(has(r, 'premium-activated')).toBe(true);
    expect(has(r, 'sub3-promise')).toBe(false);
    expect(textOf(r, 'my-sub-plan')).toContain('12 mois');
    expect(textOf(r, 'my-sub-origin')).toContain('Achat personnel');
    expect(has(r, 'my-sub-next')).toBe(true);
    expect(textOf(r, 'my-sub-next')).toMatch(/Premier prélèvement/);
    expect(has(r, 'sub-manage') && has(r, 'sub-restore')).toBe(true);
    // changement de formule : la formule actuelle est marquée, le bouton dit ce qui se passe, aucun essai
    expect(has(r, 'pw2-current-annual')).toBe(true);
    expect(a11y(r, 'pw2-plan-annual')).toContain('votre formule actuelle');
    expect(label(r, 'plan-buy')).toBe('Passer à la formule 6 mois');
    expect(has(r, 'pw2-timeline')).toBe(false);
    expect(textOf(r, 'sub3-offer')).not.toMatch(/essai|offert/i);
    expect(textOf(r, 'pw2-cta-terms')).toContain('Renouvellement automatique : 69,99 € pour 6 mois, jusqu’à résiliation.');
    expect(has(r, 'sub3-free')).toBe(false);
    expect(has(r, 'sub3-premium') && has(r, 'sub3-family')).toBe(true);
    r.unmount();
  });

  it('résilié : fin d’accès annoncée, puis non éligible à l’essai : aucune mention d’essai nulle part dans l’offre', async () => {
    await backend.rpc('set_demo_subscription', { state: 'cancelled', expires_in_days: 12 });
    const cancelled = await render(<SubscriptionScreen />);
    expect(textOf(cancelled, 'my-sub-status')).toContain('Annulé');
    expect(textOf(cancelled, 'my-sub-next')).toMatch(/Fin des droits/);
    cancelled.unmount();

    // abonnement terminé : l'essai a déjà été utilisé (une fois par groupe d'abonnements)
    await backend.rpc('set_demo_subscription', { active: false });
    expect(await backend.rpc<boolean>('demo_trial_used')).toBe(true);
    const r = await render(<SubscriptionScreen />);
    expect(has(r, 'sub3-promise') && has(r, 'pw2-plans')).toBe(true);
    expect(has(r, 'pw2-timeline')).toBe(false);
    for (const p of ['annual', 'six_months', 'monthly']) expect(has(r, `pw2-trial-${p}`)).toBe(false);
    expect(label(r, 'plan-buy')).toBe('S’abonner — 119,99 € / an');
    expect(textOf(r, 'pw2-cta-terms')).toBe('119,99 € par an, prélevés à la confirmation de l’achat. Renouvellement automatique : 119,99 € par an, jusqu’à résiliation.');
    expect(textOf(r, 'sub3-offer')).not.toMatch(/essai|offert|gratuit/i);
    expect(a11y(r, 'pw2-plan-annual')).not.toMatch(/essai/i);
    r.unmount();
  });

  it('abonné partagé : Premium ouvert par l’autre adulte du foyer (règle du serveur rejouée) — origine, rien à payer, ni formules ni gestion', async () => {
    const me = (await backend.auth.getSession())!.userId;
    // Camille crée le foyer et s'abonne ; la personne de la page le rejoint comme co-parent (premier arrivé)
    await backend.auth.signUp('camille.abonnee@exemple.test', 'MotDePasse!2026');
    const camille = (await backend.auth.getSession())!.userId;
    await backend.update('profiles', { display_name: 'Camille' }, [eq('id', camille)]);
    const household = await backend.rpc<string>('create_household', { p_name: 'Foyer' });
    await backend.rpc('set_demo_subscription', { active: true, period: 'annual', trial: false });
    await backend.insert('household_members', { household_id: household, user_id: me, role: 'coparent', joined_at: new Date().toISOString() });
    expect(await backend.rpc('my_premium_share')).toEqual({ shared_with: { user_id: me, display_name: null }, shared_by: null });
    await backend.auth.signIn('abonnement.page@exemple.test', 'MotDePasse!2026');
    // côté co-parent : Premium par partage (son propre abonnement est terminé)
    expect(await backend.rpc<boolean>('has_premium')).toBe(true);
    expect(await backend.rpc('my_premium_share')).toEqual({ shared_with: null, shared_by: { user_id: camille, display_name: 'Camille' } });

    const r = await render(<SubscriptionScreen />);
    await flush(150);
    expect(textOf(r, 'sub-message')).toBe('Premium vous est offert par Camille, dans votre foyer.');
    expect(textOf(r, 'my-sub-origin')).toContain('Partagé par Camille');
    expect(textOf(r, 'my-sub-shared-note')).toContain('Vous n’avez rien à payer.');
    expect(has(r, 'pw2-plans') || has(r, 'plan-buy') || has(r, 'sub-manage') || has(r, 'sub-manage-link')).toBe(false);
    expect(has(r, 'sub-restore')).toBe(true);
    expect(has(r, 'sub3-premium') && has(r, 'sub3-family')).toBe(true);
    r.unmount();

    // une nounou du même foyer ne reçoit PAS le Premium ; un second co-parent non plus (un seul autre adulte)
    await backend.auth.signUp('nounou.foyer@exemple.test', 'MotDePasse!2026');
    const nanny = (await backend.auth.getSession())!.userId;
    await backend.insert('household_members', { household_id: household, user_id: nanny, role: 'caregiver', joined_at: new Date().toISOString() });
    expect(await backend.rpc<boolean>('has_premium')).toBe(false);
    expect((await backend.rpc<{ caregiver?: boolean }>('my_access')).caregiver).toBe(true);
    await backend.auth.signUp('second.coparent@exemple.test', 'MotDePasse!2026');
    const second = (await backend.auth.getSession())!.userId;
    await backend.insert('household_members', { household_id: household, user_id: second, role: 'coparent', joined_at: new Date(Date.now() + 60_000).toISOString() });
    expect(await backend.rpc<boolean>('has_premium')).toBe(false);
  });
});
