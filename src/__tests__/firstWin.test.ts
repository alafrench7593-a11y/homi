/**
 * Parcours « première réussite » et paywall de conclusion (03/12/2026) : logique pure.
 * Frise, dates, montants, éligibilité à l'essai, libellé du bouton, conditions, états du catalogue et de l'achat,
 * progression gardée à travers l'inscription, assignation A/B, rappel avant le premier paiement, analytics,
 * première facturation côté serveur.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DICTIONARIES } from '@/i18n/dictionaries';
import { demoFamilyPlans, demoPlans, DEMO_GRID } from '@/lib/premium/plans';
import {
  assignVariant, DEMO_OF, emptyProgress, fnv1a, MAX_NEEDS_PER_STAGE, NEEDS, paywallTitleKey, parseProgress, PROGRESS_KEY,
  PROGRESS_TTL_MS, resumeRoute, saveProgress, loadProgress, stepFor, STAGES, TOOL_ROUTE,
} from '@/features/firstWin/model';
import {
  benefitsFor, canBuy, cardDetail, catalogState, confirmedChargeDate, ctaFor, DEFAULT_OFFER, defaultOfferKey, offerCards, phaseView,
  savingVsMonthly, splitOffers, termsFor, timelineFor, type OfferPlan,
} from '@/features/firstWin/offer';
import { reminderAt, reminderContent } from '@/features/firstWin/trialReminder';
import { __analyticsReset, __readQueue, configureAnalytics, sanitize, track, trimQueue, type QueuedEvent } from '@/lib/analytics/events';
import { firstBillingOf } from '../../supabase/functions/_shared/conversion';
import { isPublicRoute } from '@/lib/publicRoutes';
import { isFreeRoute } from '@/lib/premium/access';

const NOW = new Date('2026-12-03T10:30:00');
const prem = () => demoPlans('fr-FR');
const fam = () => demoFamilyPlans('fr-FR');
const nb = (s: string) => s.replace(/[  ]/g, ' ');

describe('parcours : étapes, besoins, outils réels', () => {
  it('trois étapes de vie, au plus 4 besoins chacune, chaque besoin mène à une démo et à un outil réel', () => {
    expect(STAGES).toEqual(['pregnancy', 'baby', 'child']);
    for (const s of STAGES) {
      expect(NEEDS[s].length).toBeLessThanOrEqual(MAX_NEEDS_PER_STAGE);
      expect(NEEDS[s]).toContain('relay');
      for (const n of NEEDS[s]) expect(TOOL_ROUTE[DEMO_OF[n]]).toMatch(/^\//);
    }
    expect(NEEDS.pregnancy[0]).toBe('prepare_birth');
    expect(NEEDS.baby[0]).toBe('feed_sleep');
    expect(NEEDS.child[0]).toBe('mornings');
  });
  it('les outils ouverts après l’achat existent dans l’application', () => {
    const routes = require('@/lib/routes.generated').APP_ROUTES as string[];
    for (const r of Object.values(TOOL_ROUTE)) expect(routes).toContain(r);
    expect(routes).toEqual(expect.arrayContaining(['/start', '/start/offers', '/start/done', '/dev/paywall']));
  });
  it('/start est public et hors verrou Premium ; l’outil essayé reste réservé', () => {
    for (const p of ['/start', '/start/offers', '/start/done']) { expect(isPublicRoute(p)).toBe(true); expect(isFreeRoute(p)).toBe(true); }
    expect(isFreeRoute('/lists')).toBe(false);
    expect(isFreeRoute('/family/kid-routines')).toBe(false);
  });
  it('titre du paywall : générique (A) ou repris du besoin (B), textes demandés', () => {
    const fr = DICTIONARIES.fr as Record<string, string>;
    expect(fr[paywallTitleKey('feed_sleep', 'generic')]).toBe('Tout HOMI, pour toi et ta famille');
    expect(fr[paywallTitleKey('prepare_birth', 'need')]).toBe('Prépare l’arrivée de bébé étape par étape');
    expect(fr[paywallTitleKey('feed_sleep', 'need')]).toBe('Repas et siestes, au même endroit');
    expect(fr[paywallTitleKey('mornings', 'need')]).toBe('Des matins où chacun sait quoi faire');
    expect(fr[paywallTitleKey('relay', 'need')]).toBe('Relayez-vous sans vous répéter');
    expect(fr[paywallTitleKey(null, 'need')]).toBe('Tout HOMI, pour toi et ta famille');
  });
  it('« Aura » partout dans le parcours, jamais « HOMI Aura »', () => {
    for (const lang of ['fr', 'en', 'de', 'es', 'it']) {
      const vals = Object.entries(DICTIONARIES[lang]).filter(([k]) => k.startsWith('fw.')).flatMap(([, v]) => (typeof v === 'string' ? [v] : Object.values(v)));
      expect(vals.some((v) => /HOMI Aura/.test(v))).toBe(false);
      expect(vals.some((v) => /\bAura\b/.test(v))).toBe(true);
    }
  });
});

describe('A/B : assignation stable par installation', () => {
  it('même identifiant → même variante ; répartition proche de 50/50', () => {
    expect(assignVariant('abc')).toBe(assignVariant('abc'));
    let need = 0;
    for (let i = 0; i < 2000; i++) if (assignVariant(`install-${i}`) === 'need') need++;
    expect(need).toBeGreaterThan(900);
    expect(need).toBeLessThan(1100);
    expect(fnv1a('')).toBe(0x811c9dc5);
  });
});

describe('progression gardée à travers l’inscription', () => {
  beforeEach(() => AsyncStorage.clear());
  it('besoin, résultat de démo et formule survivent ; reprise au paywall après le compte', async () => {
    await saveProgress({ stage: 'baby', need: 'feed_sleep', demoDone: true, result: { kind: 'sleepLog', itemKey: 'nap', at: NOW.toISOString() } });
    await saveProgress({ plan: { tier: 'premium', period: 'annual' }, awaitingAccount: true });
    const p = await loadProgress();
    expect(p).toMatchObject({ stage: 'baby', need: 'feed_sleep', demoDone: true, plan: { tier: 'premium', period: 'annual' }, awaitingAccount: true });
    expect(stepFor(p)).toBe('result');
    expect(resumeRoute(p, { signedIn: true, premium: false })).toBe('/start/offers?resume=1');
  });
  it('abonné·e ou droits inconnus : jamais renvoyé·e vers le parcours de vente', () => {
    const p = { ...emptyProgress(), plan: { tier: 'premium' as const, period: 'monthly' as const }, awaitingAccount: true };
    expect(resumeRoute(p, { signedIn: true, premium: true })).toBeNull();
    expect(resumeRoute(p, { signedIn: true, premium: undefined })).toBeNull();
    expect(resumeRoute(p, { signedIn: false, premium: false })).toBeNull();
  });
  it('données illisibles, d’une autre version ou expirées : ignorées', () => {
    expect(parseProgress('{oops')).toBeNull();
    expect(parseProgress(JSON.stringify({ ...emptyProgress(0), v: 2 }), 1)).toBeNull();
    expect(parseProgress(JSON.stringify(emptyProgress(0)), PROGRESS_TTL_MS + 1)).toBeNull();
    const bad = parseProgress(JSON.stringify({ ...emptyProgress(0), stage: 'teen', need: 'x', openAfter: 'https://evil', plan: { tier: 'gold', period: 'monthly' } }), 1);
    expect(bad).toMatchObject({ stage: null, need: null, openAfter: null, plan: null });
  });
  it('étape de reprise après fermeture et réouverture', () => {
    expect(stepFor(null)).toBe('stage');
    expect(stepFor({ ...emptyProgress(), stage: 'child' })).toBe('need');
    expect(stepFor({ ...emptyProgress(), stage: 'child', need: 'mornings' })).toBe('demo');
  });
  it('clé de stockage du même type que les autres « pending »', () => expect(PROGRESS_KEY).toMatch(/^homi\.pending-/));
});

describe('cartes : montant total facturé, équivalent mensuel, économie avec sa base', () => {
  const cards = offerCards(prem(), fam(), 'fr-FR');
  it('annuel puis mensuel (formules de tête), puis 6 mois et Famille ; accès inclus gardé pour VoiceOver', () => {
    expect(cards.map((c) => c.key)).toEqual(['premium:annual', 'premium:monthly', 'premium:six_months', 'family:monthly']);
    expect(cards[0].access).toBe('Pour toi et ton ou ta co-parent');
    expect(nb(cards[3].access)).toBe('Tous les adultes du foyer + 1 500 crédits Aura partagés');
    expect(cards[3].name).toBe('Famille');
  });
  it('annuel : montant débité en évidence, équivalent mensuel en complément, économie vs 12 × mensuel', () => {
    const a = cards[0];
    expect(nb(a.billed)).toBe('119,99 €/an');
    expect(nb(a.monthly!)).toBe('soit 10,00 € par mois');
    expect(nb(a.saving!)).toBe('33 % de moins que 12 × 14,99 €');
    expect(nb(cards[2].saving!)).toBe('22 % de moins que 6 × 14,99 €');
    expect(cards[1].monthly).toBeNull();
    expect(cards[1].saving).toBeNull();
    expect(cards[3].saving).toBeNull();
  });
  it('carte : deux lignes au plus, rien de répété d’une carte à l’autre ; Famille dit qu’elle n’a pas d’essai', () => {
    const d = cards.map((c) => cardDetail(c, { othersHaveTrial: true }));
    expect(nb(d[0].per!)).toBe('10,00 €/mois');
    expect(nb(d[0].saving!)).toBe('−33 % vs mensuel');
    expect(d[1]).toEqual({ per: null, saving: null, note: null });
    expect(nb(d[3].note!)).toBe('Tous les adultes + 1 500 crédits Aura · sans essai');
    const lines = d.flatMap((x) => [x.per, x.saving, x.note]).filter(Boolean);
    expect(new Set(lines).size).toBe(lines.length);
    // un essai Famille confirmé un jour : crédits annoncés au premier paiement (0 pendant l'essai), pas de « sans essai »
    expect(nb(cardDetail({ ...cards[3], trialDays: 3 }, { othersHaveTrial: true }).note!)).toBe('Tous les adultes + 1 500 crédits Aura, à partir du premier paiement');
  });
  it('formules de tête (annuel, mensuel) et « Autres formules » (6 mois, Famille)', () => {
    const { lead, more } = splitOffers(cards);
    expect(lead.map((c) => c.key)).toEqual(['premium:annual', 'premium:monthly']);
    expect(more.map((c) => c.key)).toEqual(['premium:six_months', 'family:monthly']);
    expect(splitOffers(cards.filter((c) => c.tier === 'family')).lead).toHaveLength(1);
  });
  it('aucune économie sans base (mensuel absent ou autre devise)', () => {
    const p = { amount: 100, currency: 'EUR', period: 'annual' } as const;
    expect(savingVsMonthly(p, null)).toBeNull();
    expect(savingVsMonthly(p, { amount: 14.99, currency: 'USD' })).toBeNull();
    expect(savingVsMonthly({ ...p, amount: 200 }, { amount: 14.99, currency: 'EUR' })).toBeNull();
  });
  it('formule présélectionnée : celle choisie avant l’inscription, sinon l’annuel Premium, sinon le mensuel', () => {
    expect(DEFAULT_OFFER).toBe('premium:annual');
    expect(defaultOfferKey(cards, 'premium:monthly')).toBe('premium:monthly');
    expect(defaultOfferKey(cards, 'family:annual')).toBe('premium:annual');
    expect(defaultOfferKey(cards.filter((c) => c.key !== 'premium:annual'), null)).toBe('premium:monthly');
    expect(defaultOfferKey([], null)).toBeNull();
  });
  it('la grille de démonstration correspond aux tarifs de référence (France)', () => {
    expect(DEMO_GRID.monthly.amount).toBe(14.99);
    expect(DEMO_GRID.six_months.amount).toBe(69.99);
    expect(DEMO_GRID.annual.amount).toBe(119.99);
    expect(fam()[0].amount).toBe(19.99);
    expect(cards.every((c) => c.demo)).toBe(true);
  });
});

describe('bénéfices : au plus 3, réellement disponibles dans la formule choisie', () => {
  it('Premium : le partage avec le co-parent est inclus ; Famille : tous les adultes', () => {
    const p = benefitsFor('premium', 'relay', { aiOnline: false, trial: true });
    expect(p).toHaveLength(3);
    expect(p[1]).toBe('Partagé avec ton ou ta co-parent, sans supplément');
    const f = benefitsFor('family', 'relay', { aiOnline: false, trial: false });
    expect(f[1]).toBe('Ouvert à tous les adultes du foyer');
  });
  it('crédits Aura : 0 pendant l’essai (annoncés au premier paiement), mention tant qu’Aura est fermée', () => {
    expect(nb(benefitsFor('premium', null, { aiOnline: false, trial: true })[2])).toBe('1 000 crédits Aura par mois, à partir du premier paiement (Aura ouvre bientôt)');
    expect(nb(benefitsFor('family', null, { aiOnline: true, trial: false })[2])).toBe('1 500 crédits Aura par mois, partagés');
  });
});

describe('frise, bouton et conditions', () => {
  const [annual, , monthly] = prem();
  it('essai confirmé : bouton « Commencer l’essai gratuit », ligne légale du gabarit, frise jusqu’au 6 décembre', () => {
    expect(ctaFor(monthly)).toBe('Commencer l’essai gratuit');
    expect(nb(termsFor(monthly))).toBe('3 jours gratuits, puis 14,99 €/mois. Renouvellement automatique, annulable à tout moment.');
    expect(nb(termsFor(monthly)).split(/\s+/).length).toBeLessThanOrEqual(20);
    const tl = timelineFor(monthly, { now: NOW });
    expect(tl.steps.map((s) => s.key)).toEqual(['today', 'charge']);
    expect(tl.steps[1].title).toBe('6 décembre');
    expect(nb(tl.steps[1].body)).toBe('14,99 €');
    expect(tl.steps[0].body).toBe('Gratuit');
    expect(tl.caption).toBe('Dates calculées pour un démarrage aujourd’hui.');
    expect(tl.confirmed).toBe(false);
  });
  it('rappel : étape « la veille » seulement si l’appareil peut le programmer, jamais dans le passé', () => {
    const tl = timelineFor(annual, { now: NOW, reminder: true });
    expect(tl.steps.map((s) => s.key)).toEqual(['today', 'remind', 'charge']);
    expect(tl.steps[1].title).toBe('5 décembre');
    expect(tl.steps[1].body).toBe('Rappel, si tu l’actives');
    expect(timelineFor({ ...annual, trialDays: 0 }, { now: NOW, reminder: true }).steps.map((s) => s.key)).toEqual(['today', 'renew']);
    expect(timelineFor(annual, { now: NOW, reminder: true, confirmedFirstCharge: new Date(NOW.getTime() + 3_600_000) }).steps.map((s) => s.key)).toEqual(['today', 'charge']);
  });
  it('sans essai confirmé : aucun mot sur l’essai, bouton qui dit la durée, montant dans la ligne légale', () => {
    const m = { ...monthly, trialDays: 0 };
    expect(nb(ctaFor(m))).toBe('M’abonner au mois');
    expect(nb(termsFor(m))).toBe('14,99 €/mois, débité aujourd’hui. Renouvellement automatique, annulable à tout moment.');
    const tl = timelineFor(m, { now: NOW });
    expect(tl.steps.map((s) => s.key)).toEqual(['today', 'renew']);
    expect(tl.steps[1].title).toBe('3 janvier 2027');
    expect(tl.steps.map((s) => s.body).join(' ')).not.toMatch(/essai|gratuit/i);
    expect(nb(ctaFor({ ...annual, trialDays: 0 }))).toBe('M’abonner pour un an');
  });
  it('changement de formule : montant et périodicité de la frise suivent la formule', () => {
    expect(nb(timelineFor(annual, { now: NOW }).steps[1].body)).toBe('119,99 €');
    expect(nb(timelineFor(fam()[0], { now: NOW }).steps[0].body)).toBe('Paiement : 19,99 €');
    expect(nb(timelineFor(fam()[0], { now: NOW }).steps[1].body)).toBe('Renouvellement : 19,99 € par mois.');
  });
  it('après l’achat : date confirmée par le serveur', () => {
    const d = confirmedChargeDate({ status: 'trial', trial_ends_at: '2026-12-06T09:00:00Z', expires_at: '2026-12-06T09:00:00Z' });
    expect(d?.toISOString()).toBe('2026-12-06T09:00:00.000Z');
    const tl = timelineFor(monthly, { now: NOW, confirmedFirstCharge: d });
    expect(tl.confirmed).toBe(true);
    expect(tl.caption).toBe('Date confirmée par la boutique.');
    expect(confirmedChargeDate({ status: 'active', expires_at: 'n/a' })).toBeNull();
    expect(confirmedChargeDate(null)).toBeNull();
  });
  it('prix et montants ne viennent que du Plan : un prix de boutique différent est repris tel quel', () => {
    const store: OfferPlan = { id: 'homi_premium_monthly', period: 'monthly', price: '15,99 €', amount: 15.99, currency: 'EUR', trialDays: 0, demo: false };
    expect(nb(termsFor(store))).toBe('15,99 €/mois, débité aujourd’hui. Renouvellement automatique, annulable à tout moment.');
  });
});

describe('états du catalogue et de l’achat', () => {
  it('chargement, hors ligne, prix indisponible, web sans magasin : achat désactivé', () => {
    const base = { mode: 'store', online: true, isLoading: false, isError: false, count: 3 };
    expect(catalogState(base)).toBe('ready');
    expect(catalogState({ ...base, isLoading: true })).toBe('loading');
    expect(catalogState({ ...base, online: false, count: 0 })).toBe('offline');
    expect(catalogState({ ...base, isError: true, count: 0 })).toBe('error');
    expect(catalogState({ ...base, isError: true, count: 0, networkError: true })).toBe('offline');
    expect(catalogState({ ...base, count: 0 })).toBe('empty');
    expect(catalogState({ ...base, mode: 'unavailable' })).toBe('unavailable');
    expect(catalogState({ ...base, mode: 'store', web: true })).toBe('unavailable');
    expect(catalogState({ ...base, mode: 'test', web: true })).toBe('ready');
    for (const c of ['loading', 'offline', 'error', 'empty', 'unavailable'] as const) expect(canBuy(c, 'idle', true)).toBe(false);
    expect(canBuy('ready', 'idle', true)).toBe(true);
    expect(canBuy('ready', 'buying', true)).toBe(false);
    expect(canBuy('ready', 'confirmed', true)).toBe(false);
    expect(canBuy('ready', 'cancelled', true)).toBe(true);
  });
  it('chaque issue a son message ; jamais de succès avant confirmation', () => {
    expect(phaseView('idle')).toBeNull();
    expect(phaseView('cancelled')?.tone).toBe('info');
    expect(phaseView('pending')?.tone).toBe('info');
    expect(phaseView('deferred')?.tone).toBe('info');
    expect(phaseView('failed')?.tone).toBe('danger');
    expect(phaseView('confirmed')?.tone).toBe('success');
    expect(phaseView('buying')?.busy).toBe(true);
  });
});

describe('rappel avant le premier paiement', () => {
  it('24 h avant la fin de l’essai ; sinon 2 h avant ; sinon trop tard', () => {
    const end = new Date('2026-12-06T10:30:00');
    expect(reminderAt(end, NOW)?.toISOString()).toBe(new Date('2026-12-05T10:30:00').toISOString());
    expect(reminderAt(end, new Date('2026-12-05T20:00:00'))?.toISOString()).toBe(new Date('2026-12-06T08:30:00').toISOString());
    expect(reminderAt(end, new Date('2026-12-06T08:10:00'))).toBeNull();
  });
  it('texte neutre sur l’écran verrouillé (ni montant ni donnée personnelle)', () => {
    const c = reminderContent();
    expect(`${c.title} ${c.body}`).not.toMatch(/€|\d|essai|paiement|bébé|enfant/i);
  });
});

describe('analytics : liste blanche, consentement', () => {
  beforeEach(async () => { await AsyncStorage.clear(); __analyticsReset(); });
  it('retire toute propriété hors liste blanche et toute valeur libre', () => {
    expect(sanitize({ stage: 'baby', need: 'feed_sleep', variant: 'need', child_name: 'Lou', journal: 'texte', period: 'Annual plan!', trial: true } as never))
      .toEqual({ stage: 'baby', need: 'feed_sleep', variant: 'need', trial: true });
  });
  it('sans compte : gardé sur l’appareil ; refus : rien n’est gardé ; accord : envoyé puis vidé', async () => {
    await track('paywall_viewed', { variant: 'need' });
    expect((await __readQueue()).map((e) => e.name)).toEqual(['paywall_viewed']);
    configureAnalytics({ consent: async () => false, send: async () => true });
    await track('plan_selected', { tier: 'premium' });
    expect(await __readQueue()).toEqual([]);
    const sent: QueuedEvent[][] = [];
    configureAnalytics({ consent: async () => true, send: async (rows) => { sent.push(rows); return true; } });
    await track('demo_completed', { stage: 'baby' });
    expect(sent[0].map((e) => e.name)).toEqual(['demo_completed']);
    expect(await __readQueue()).toEqual([]);
  });
  it('file bornée (200, 30 jours)', () => {
    const now = Date.parse('2026-12-03T00:00:00Z');
    const q = Array.from({ length: 250 }, (_, i) => ({ name: 'paywall_viewed' as const, props: {}, install_id: 'x', at: new Date(now - i * 60_000).toISOString() }));
    expect(trimQueue(q, now)).toHaveLength(200);
    expect(trimQueue([{ ...q[0], at: '2026-10-01T00:00:00Z' }], now)).toHaveLength(0);
  });
});

describe('first_billing_confirmed (serveur) : après l’essai ou payé tout de suite, par transaction', () => {
  it('RENEWAL de conversion d’essai', () => {
    expect(firstBillingOf({ type: 'RENEWAL', transaction_id: 't1', is_trial_conversion: true, product_id: 'homi_premium_monthly', purchased_at_ms: 1_800_000_000_000 }, 'trial'))
      .toMatchObject({ kind: 'first_billing_confirmed', transaction_id: 't1', after_trial: true });
    expect(firstBillingOf({ type: 'RENEWAL', transaction_id: 't2' }, 'trial')?.after_trial).toBe(true);
  });
  it('renouvellement ordinaire, essai qui démarre, annulation : rien', () => {
    expect(firstBillingOf({ type: 'RENEWAL', transaction_id: 't3', is_trial_conversion: false }, 'active')).toBeNull();
    expect(firstBillingOf({ type: 'RENEWAL', transaction_id: 't4' }, 'active')).toBeNull();
    expect(firstBillingOf({ type: 'INITIAL_PURCHASE', transaction_id: 't5', period_type: 'TRIAL' }, null)).toBeNull();
    expect(firstBillingOf({ type: 'CANCELLATION', transaction_id: 't6' }, 'trial')).toBeNull();
    expect(firstBillingOf({ type: 'RENEWAL', is_trial_conversion: true }, 'trial')).toBeNull();
  });
  it('achat payé tout de suite (sans essai)', () => {
    expect(firstBillingOf({ type: 'INITIAL_PURCHASE', transaction_id: 't7', period_type: 'NORMAL' }, null)?.after_trial).toBe(false);
  });
});
