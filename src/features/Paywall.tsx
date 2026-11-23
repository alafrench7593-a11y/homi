/**
 * Écran Premium v2 (15/11/2026) — utilisé par /premium (plein écran) et par PremiumGate (écran réservé, `locked`).
 *  - En tête (v5) : l'illustration `famille` sur le halo corail (compacte), titre court ; puis les formules et le bouton principal,
 *    visibles sans défiler à 390 × 844 ; ensuite la frise d'essai, les avantages (compacts), mentions et liens.
 *  - Avantages RÉELS de Premium (verrouillage strict, src/lib/premium/access.ts : suivi des enfants, cycle / grossesse /
 *    post-partum, organisation du foyer, partage avec UN co-parent, communauté), en phrases courtes.
 *  - 3 formules aux prix de la boutique (RevenueCat ; démonstration : DEMO_GRID signalée), l'annuelle en tête avec un
 *    badge sobre ; aucune urgence, aucun compte à rebours, aucun témoignage.
 *  - Essai : chronologie (Aujourd'hui → Pendant N jours → Le <date réelle>) seulement si la boutique propose l'essai
 *    pour cette formule ET qu'Apple confirme l'éligibilité (applyTrialEligibility). Aucune promesse de rappel.
 *  - Bouton principal au libellé exact (« Commencer l'essai de 3 jours » / « S'abonner — 119,99 € / an ») ; juste
 *    dessous, visibles avec lui sans défiler : ce qui est prélevé et quand, et le renouvellement automatique en clair
 *    (bloc `PurchaseCta`, partagé avec la page d'abonnement : mêmes textes, mêmes calculs — paywallModel.ts) ;
 *    comment annuler, « Restaurer les achats », conditions et confidentialité.
 *  - Abonné·e (has_premium, serveur) : formule actuelle et « Gérer l'abonnement », jamais l'offre de nouveau client.
 *  - Issues d'achat : annulé, en attente d'approbation (Ask to Buy), réseau, achats bloqués, boutique indisponible ;
 *    « confirmé » seulement quand le serveur voit le droit (jamais de faux succès).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { HeroArt } from '@/features/entry/HeroArt';
import { DrawCheck } from '@/components/MotionKit';
import { confirm } from '@/components/Overlays';
import { Banner, Button, Icon, Loading, Text, type IconName } from '@/components/ui';
import { usePlans, WebPurchaseNotice, webWithoutPurchase } from '@/features/subscription';
import { useInvalidate } from '@/lib/data/hooks';
import { useEntitlement, usePremiumShare } from '@/lib/data/hooks-premium';
import { friendlyError } from '@/lib/data/hooks-settings';
import type { PlanPeriod } from '@/lib/premium/plans';
import { PurchaseError } from '@/lib/premium/purchaseErrors';
import { purchasesSdk } from '@/lib/purchaseMode';
import { Cascade, motionHaptic } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';
import { PlanPicker } from './premium/PlanPicker';
import { TrialTimeline } from './premium/TrialTimeline';
import { PurchaseCta, PurchaseFinePrint } from './premium/PurchaseCta';
import { defaultPeriod, errorFeedback, outcomeFeedback, planName, subscriberSummary, type Feedback } from './premium/paywallModel';

export { ctaLabel as paywallCta } from './premium/paywallModel';

/** Avantages réels (voir l'en-tête) ; l'assistant IA n'y figure pas : offre distincte, pas encore ouverte. */
const BENEFITS: { key: 'track' | 'body' | 'home' | 'share' | 'community'; icon: IconName }[] = [
  { key: 'track', icon: 'activity' },
  { key: 'body', icon: 'heart' },
  { key: 'home', icon: 'calendar' },
  { key: 'share', icon: 'users' },
  { key: 'community', icon: 'message-square' },
];

const BANNER_TONE = { success: 'success', info: 'info', warning: 'warning', error: 'danger' } as const;

function Benefits() {
  const th = useTheme();
  return (
    <View testID="pw2-benefits" style={{ gap: spacing.xs }}>
      <Text variant="label" accessibilityRole="header">{tr('pay2.benTitle')}</Text>
      <View accessibilityRole="list" style={{ gap: 6 }}>
        {BENEFITS.map((b) => (
          <View key={b.key} accessible accessibilityLabel={tr(`pay2.ben.${b.key}`)} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
            <Icon name={b.icon} size={16} color={th.colors.primary} />
            <Text variant="small" style={{ flex: 1 }}>{tr(`pay2.ben.${b.key}`)}</Text>
          </View>
        ))}
      </View>
      <Text variant="caption" muted>{tr('pw.dataSafe')}</Text>
    </View>
  );
}

function LegalLinks() {
  const th = useTheme();
  const link = (doc: 'terms' | 'privacy', key: 'pay2.terms' | 'pay2.privacy') => (
    <Pressable accessibilityRole="link" onPress={() => router.push(`/legal/${doc}`)} hitSlop={6} testID={`pw2-legal-${doc}`}
      style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.xs }}>
      <Text variant="small" weight="bold" color={th.colors.primary}>{tr(key)}</Text>
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: spacing.sm }} testID="pw2-legal">
      {link('terms', 'pay2.terms')}
      {link('privacy', 'pay2.privacy')}
    </View>
  );
}

function FeedbackBanner({ fb }: { fb: Feedback | null }) {
  if (!fb) return null;
  return (
    <View accessibilityLiveRegion="polite" testID={`pw2-feedback-${fb.tone}`}>
      <Banner tone={BANNER_TONE[fb.tone]}>{fb.text}</Banner>
    </View>
  );
}

/** Abonné·e : formule actuelle, état, « Gérer l'abonnement » (jamais l'offre de nouveau client). */
function SubscriberPanel({ justActivated, onContinue }: { justActivated: boolean; onContinue?: () => void }) {
  const th = useTheme();
  const inv = useInvalidate();
  const ent = useEntitlement();
  const share = usePremiumShare();
  const mode = usePlans().mode;
  const [busy, setBusy] = useState(false);
  const [fb, setFb] = useState<Feedback | null>(null);
  // Même résumé que la page d'abonnement : achat personnel (formule, échéance) ou Premium partagé par l'autre adulte
  const summary = subscriberSummary(ent, share.data?.shared_by);
  const own = summary?.origin === 'own';
  const period = summary?.period ?? null;

  async function manage() {
    if (mode === 'test' && !(await confirm(tr('u1.sub.stopDemoTitle'), tr('u1.sub.stopDemoBody'), tr('u1.sub.stop')))) return;
    setBusy(true);
    try {
      const url = await purchasesSdk().manageSubscription();
      if (url) await Linking.openURL(url);
      inv('subscriptions'); inv('access');
    } catch (e) {
      setFb({ tone: 'error', text: friendlyError(e) });
    } finally { setBusy(false); }
  }

  return (
    <View style={{ gap: spacing.md }} testID="pw2-subscriber">
      <View style={{ borderRadius: radius.lg, borderWidth: 1, borderColor: th.colors.border, backgroundColor: th.colors.surface, padding: spacing.md, gap: spacing.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          {justActivated ? <DrawCheck size={40} color={th.colors.success} /> : <Icon name="check-circle" size={24} color={th.colors.success} />}
          <Text variant="heading" style={{ flex: 1 }} accessibilityRole="header">{tr('pay2.sub.title')}</Text>
        </View>
        {own && period ? <Text weight="bold" testID="pw2-sub-plan">{tr('pay2.sub.plan', { plan: planName(period) })}</Text> : null}
        <Text variant="small" testID="pw2-sub-message">{summary?.message ?? ent.message}</Text>
        {summary ? <Text variant="caption" muted testID="pw2-sub-origin">{summary.originText}</Text> : null}
      </View>
      <FeedbackBanner fb={fb} />
      {onContinue ? <Button label={tr('pay2.sub.continue')} size="lg" full onPress={onContinue} testID="pw2-continue" /> : null}
      {own && mode !== 'unavailable' ? (
        <Button label={mode === 'test' ? tr('sub2.my.stopDemo') : tr('pay2.sub.manage')} variant="secondary" icon="settings" full loading={busy} onPress={() => void manage()} testID="pw2-manage" />
      ) : null}
      {own ? <Text variant="caption" muted center>{tr('pay2.sub.manageHint')}</Text> : null}
    </View>
  );
}

export interface PaywallProps {
  /** Écran réservé (PremiumGate) : liens vers le compte, les données et les urgences ; logo fixe. */
  locked?: boolean;
  /** Déjà dans une zone qui défile (aucun ScrollView ajouté). */
  embedded?: boolean;
  /** Abonné·e : « Continuer » (ex. retour à l'accueil après l'onboarding). */
  onContinue?: () => void;
  /** Achat confirmé par le serveur. */
  onPurchased?: () => void;
  /** « Plus tard » (arrivée depuis l'onboarding). */
  onLater?: () => void;
  /** Date de référence (tests) */
  now?: Date;
}

export function Paywall({ locked = false, embedded = false, onContinue, onPurchased, onLater, now }: PaywallProps) {
  const go = (path: '/settings/subscription' | '/settings' | '/settings/privacy' | '/emergency') => (locked ? router.replace(path) : router.push(path));
  const th = useTheme();
  const inv = useInvalidate();
  const ent = useEntitlement();
  const plans = usePlans();
  const list = useMemo(() => plans.data ?? [], [plans.data]);
  const [selected, setSelected] = useState<PlanPeriod | null>(null);
  useEffect(() => { if (!selected && list.length) setSelected(defaultPeriod(list)); }, [list, selected]);
  const chosen = list.find((p) => p.period === selected);
  const [busy, setBusy] = useState<'buy' | 'restore' | null>(null);
  const [fb, setFb] = useState<Feedback | null>(null);
  const [activated, setActivated] = useState(false);

  async function buy() {
    if (!chosen || busy) return;
    setBusy('buy'); setFb(null);
    try {
      const out = await purchasesSdk().purchase(chosen);
      inv('subscriptions'); inv('access');
      setFb(outcomeFeedback(out));
      if (out === 'confirmed') {
        motionHaptic('success');
        setActivated(true);
        onPurchased?.();
      }
    } catch (e) {
      setFb(e instanceof PurchaseError ? errorFeedback(e.kind) : plans.mode === 'unavailable' ? errorFeedback('unavailable') : { tone: 'error', text: friendlyError(e, tr('pay2.err.unknown')) });
    } finally { setBusy(null); }
  }
  async function doRestore() {
    if (busy) return;
    setBusy('restore'); setFb(null);
    try {
      const ok = await purchasesSdk().restore();
      inv('subscriptions'); inv('access');
      setFb(ok ? { tone: 'success', text: tr('u1.sub.restored') } : { tone: 'info', text: tr('u1.sub.noneFound') });
      if (ok) { motionHaptic('success'); setActivated(true); }
    } catch (e) {
      setFb(e instanceof PurchaseError ? errorFeedback(e.kind) : { tone: 'error', text: friendlyError(e) });
    } finally { setBusy(null); }
  }

  const compactHero = useWindowDimensions().height < 700;
  const subscriber = ent.premium === true && !locked;
  const trial = !!chosen && chosen.trialDays > 0;
  const purchasable = !webWithoutPurchase(plans.mode) && plans.mode !== 'unavailable';

  const hero = (
    <Cascade index={0}>
      <View style={{ alignItems: 'center', gap: 4 }}>
        {/* v5 : l'illustration `famille` sur le halo corail, en tête compacte (formules et bouton restent au premier écran) */}
        <HeroArt name="famille" size={compactHero ? 88 : 116} reveal={!locked} testID="pw2-art" />
        <Text variant="label" weight="bold" color={th.colors.primary} testID="pw2-eyebrow">{tr('pay2.eyebrow')}</Text>
        <Text variant="title" center accessibilityRole="header" testID="pw2-title">{locked ? tr('pw.locked') : tr('pay2.title')}</Text>
        {!subscriber ? (
          <Text variant="small" muted center testID="pw2-lead">{trial ? tr('pay2.lead.trial', { count: chosen!.trialDays }) : tr('pay2.lead')}</Text>
        ) : null}
        {locked ? <Text variant="small" muted center>{tr('pw.lockedBody')}</Text> : null}
      </View>
    </Cascade>
  );

  // Ordre (19/11/2026) : formules + bouton principal visibles sans défiler (390 × 844), puis frise d'essai, avantages
  // compacts, mentions, restauration et liens.
  const offer = (
    <>
      <Cascade index={1}>
        <View style={{ gap: spacing.sm }}>
          <Text variant="label" accessibilityRole="header">{tr('pay2.plansTitle')}</Text>
          {webWithoutPurchase(plans.mode) ? <WebPurchaseNotice /> : plans.mode === 'unavailable' ? (
            <Banner tone="info">{tr('pay2.err.unavailable')}</Banner>
          ) : plans.isLoading ? <Loading label={tr('u1.sub.loadingOffers')} /> : plans.isError || !list.length ? (
            <>
              <Banner tone="warning">{plans.isError ? friendlyError(plans.error, tr('pw.noPlans')) : tr('pw.noPlans')}</Banner>
              <Button label={tr('pw.retry')} icon="refresh-cw" variant="secondary" onPress={() => void plans.refetch()} testID="pw2-retry" />
            </>
          ) : (
            <PlanPicker plans={list} selected={selected} onSelect={(p) => { setSelected(p); setFb(null); }} />
          )}
        </View>
      </Cascade>
      {chosen && purchasable ? (
        <Cascade index={2}>
          <View style={{ gap: spacing.md }}>
            {/* Bouton + ce qui est prélevé + renouvellement automatique : même bloc que la page d'abonnement */}
            <PurchaseCta plan={chosen} loading={busy === 'buy'} disabled={!!busy} onPress={() => void buy()} now={now} />
            <FeedbackBanner fb={fb} />
            {trial ? <TrialTimeline plan={chosen} from={now} /> : null}
            <Benefits />
            <PurchaseFinePrint plan={chosen} now={now} />
          </View>
        </Cascade>
      ) : (
        <>
          <FeedbackBanner fb={fb} />
          <Cascade index={2}><Benefits /></Cascade>
        </>
      )}
      {purchasable ? (
        <Button label={tr('pay2.restore')} variant="ghost" icon="refresh-cw" loading={busy === 'restore'} disabled={!!busy} onPress={() => void doRestore()} testID="pw2-restore" />
      ) : null}
    </>
  );

  const body = (
    <View style={{ gap: spacing.md, paddingBottom: spacing.xl }} testID={locked ? 'paywall-locked' : 'paywall'}>
      {hero}
      {subscriber ? <SubscriberPanel justActivated={activated} onContinue={onContinue} /> : offer}
      {onLater && !subscriber ? <Button label={tr('pay2.later')} variant="ghost" onPress={onLater} testID="pw2-later" /> : null}
      <LegalLinks />
      {locked ? (
        <View style={{ gap: spacing.xs }}>
          <Button label={tr('pw.details')} variant="secondary" icon="list" onPress={() => go('/settings/subscription')} testID="pw-details" />
          <Button label={tr('pw.account')} variant="ghost" icon="settings" onPress={() => go('/settings')} testID="pw-account" />
          <Button label={tr('pw.myData')} variant="ghost" icon="download" onPress={() => go('/settings/privacy')} testID="pw-data" />
          <Button label={tr('pw.emergency')} variant="ghost" icon="life-buoy" onPress={() => go('/emergency')} testID="pw-emergency" />
        </View>
      ) : null}
    </View>
  );
  if (embedded) return body;
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, maxWidth: 560, width: '100%', alignSelf: 'center' }} keyboardShouldPersistTaps="handled"
      style={{ flex: 1 }} showsVerticalScrollIndicator={Platform.OS === 'web'}>
      {body}
    </ScrollView>
  );
}
