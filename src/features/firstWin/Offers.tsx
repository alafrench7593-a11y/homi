/**
 * Écran réel du paywall de conclusion (/start/offers) : données, achat, restauration, mesure.
 *  - Abonné·e (droits confirmés par le serveur) : jamais ce parcours (retour à l'accueil, accès intacts).
 *  - Pas de compte : le choix de la formule est gardé, puis inscription / connexion ; au retour, la même formule est
 *    présélectionnée (« Ton compte est prêt ») et l'achat part avec le compte (RevenueCat logIn fait).
 *  - Issues : annulé, en attente d'approbation, en attente de confirmation du serveur, échec, confirmé ; restauration.
 *    Premium n'est ouvert que sur droits confirmés par le serveur (purchase() → « confirmed »).
 *  - Web : pas d'achat intégré ; la version web de démonstration utilise le faux magasin (grille signalée).
 */
import React, { useEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { aiAssistantOnline } from '@/config/features';
import { useAuth } from '@/lib/auth';
import { enterDemoMode, isDemo } from '@/lib/backend';
import { useInvalidate } from '@/lib/data/hooks';
import { track } from '@/lib/analytics/events';
import { PurchaseError } from '@/lib/premium/purchaseErrors';
import type { Plan } from '@/lib/premium/plans';
import { purchasesSdk } from '@/lib/purchaseMode';
import { motionHaptic } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { useOfferCatalog, usePremiumState, useTitleVariant } from './hooks';
import { DEMO_OF, loadProgress, saveProgress, TOOL_ROUTE, type FirstWinProgress } from './model';
import { defaultOfferKey, type PurchasePhase } from './offer';
import { type Direction } from './PaywallView';
import { PaywallWhite } from './PaywallWhite';

/** Direction retenue après la critique des trois maquettes (docs/PAYWALL_ONBOARDING.md § 5). */
export const INTEGRATED_DIRECTION: Direction = 'W';

export function FirstWinOffers() {
  const th = useTheme();
  const { resume } = useLocalSearchParams<{ resume?: string }>();
  const { session, ready } = useAuth();
  const premium = usePremiumState();
  const inv = useInvalidate();
  const variant = useTitleVariant();
  const [demoReady, setDemoReady] = useState(Platform.OS !== 'web' || isDemo);
  // Version web : pas d'achat intégré ; la démonstration (faux magasin, grille signalée) remplace la boutique
  useEffect(() => { if (!demoReady) void enterDemoMode().then(() => setDemoReady(true)); }, [demoReady]);
  const { cards, catalog, refetch } = useOfferCatalog();
  const [p, setP] = useState<FirstWinProgress | null | undefined>(undefined);
  useEffect(() => { void loadProgress().then(setP); }, []);
  const [selected, setSelected] = useState<string | null>(null);
  const [phase, setPhase] = useState<PurchasePhase>('idle');
  const viewed = useRef(false);
  const now = useRef(new Date()).current;

  const wanted = p?.plan ? `${p.plan.tier}:${p.plan.period}` : null;
  // Présélection une fois le catalogue Premium chargé (jamais sur un catalogue partiel : Famille arrive parfois avant)
  useEffect(() => {
    if (catalog !== 'ready' || p === undefined) return;
    if (!selected || !cards.some((c) => c.key === selected)) setSelected(defaultOfferKey(cards, wanted));
  }, [catalog, cards, wanted, selected, p]);
  const card = cards.find((c) => c.key === selected) ?? null;
  const props = { stage: p?.stage ?? null, need: p?.need ?? null, variant, direction: INTEGRATED_DIRECTION.toLowerCase() };

  useEffect(() => {
    if (viewed.current || catalog !== 'ready' || !variant || p === undefined) return;
    viewed.current = true;
    void track('paywall_viewed', props);
  }, [catalog, variant, p]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready || p === undefined || !variant || !demoReady) return <View style={{ flex: 1, backgroundColor: th.colors.background }} />;
  // Abonné·e : jamais le parcours de vente (sauf l'achat qui vient d'être confirmé, géré par /start/done)
  if (session && premium === true && phase !== 'confirmed') return <Redirect href="/(tabs)" />;

  function select(key: string) {
    setSelected(key);
    setPhase('idle');
    const c = cards.find((x) => x.key === key);
    if (c) {
      void track('plan_selected', { ...props, tier: c.tier, period: c.period, trial: c.trialDays > 0 });
      void saveProgress({ plan: { tier: c.tier, period: c.period } }).then(setP);
    }
  }

  async function needAccount(to: '/auth/sign-up' | '/auth/sign-in') {
    if (card) setP(await saveProgress({ plan: { tier: card.tier, period: card.period }, awaitingAccount: true }));
    void track('account_required', { ...props, tier: card?.tier, period: card?.period });
    router.push(to);
  }

  async function buy() {
    if (!card || phase === 'buying') return;
    if (!session) return needAccount('/auth/sign-up');
    setPhase('buying');
    void track('purchase_started', { ...props, tier: card.tier, period: card.period, trial: card.trialDays > 0 });
    try {
      const out = await purchasesSdk().purchase(card.plan as Plan);
      inv('subscriptions'); inv('access'); inv('premium');
      void track('purchase_outcome', { ...props, tier: card.tier, period: card.period, outcome: out, trial: card.trialDays > 0 });
      if (out !== 'confirmed') return setPhase(out);
      motionHaptic('success');
      setPhase('confirmed');
      if (card.trialDays > 0) void track('trial_confirmed', { ...props, tier: card.tier, period: card.period });
      const demo = p?.need ? DEMO_OF[p.need] : null;
      await saveProgress({ awaitingAccount: false, plan: { tier: card.tier, period: card.period }, openAfter: demo ? TOOL_ROUTE[demo] : null });
      router.replace('/start/done');
    } catch (e) {
      if (e instanceof PurchaseError && e.kind === 'account_required') { setPhase('idle'); return needAccount('/auth/sign-in'); }
      void track('purchase_outcome', { ...props, outcome: e instanceof PurchaseError ? e.kind : 'unknown' });
      setPhase('failed');
    }
  }

  async function restore() {
    if (phase === 'buying' || phase === 'restoring') return;
    if (!session) return needAccount('/auth/sign-in');
    setPhase('restoring');
    try {
      const ok = await purchasesSdk().restore();
      inv('subscriptions'); inv('access'); inv('premium');
      if (!ok) return setPhase('restore_none');
      setPhase('restored');
      await saveProgress({ awaitingAccount: false });
      router.replace('/start/done');
    } catch {
      setPhase('restore_failed');
    }
  }

  function close() {
    void track('paywall_closed', { ...props, tier: card?.tier, period: card?.period });
    // Retour à la démo, résultat gardé (la démo est l'écran d'avant : retour natif ; sinon rouverte à l'étape démo)
    if (p?.demoDone) { if (router.canGoBack()) router.back(); else router.replace('/start?step=demo'); }
    else if (router.canGoBack()) router.back();
    else router.replace(session ? '/(tabs)' : '/welcome');
  }

  return (
    <PaywallWhite direction={INTEGRATED_DIRECTION} variant={variant} need={p?.need ?? null} result={p?.result ?? null} cards={cards} selectedKey={selected}
      onSelect={select} catalog={catalog} phase={phase} aiOnline={aiAssistantOnline()} now={now} reminder={Platform.OS === 'ios' || Platform.OS === 'android'} resume={resume === '1' && !!session}
      needsAccount={!session} onBuy={() => void buy()} onRetry={refetch} onRestore={() => void restore()} onClose={close}
      onLegal={(doc) => router.push(`/legal/${doc}`)}
      onHelp={() => void track('aura_help_opened', props)} onStory={() => void track('story_opened', props)} />
  );
}
