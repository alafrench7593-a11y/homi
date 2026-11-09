/**
 * Écran Premium (verrouillage strict du 08/11/2026).
 *  - Logo, puis un fil doré qui se dessine et relie les étapes de vie (projet bébé → grossesse → post-partum → bébé
 *    → enfant) ; « Réduire les animations » : tout est affiché directement.
 *  - Cartes des fonctions RÉELLES ouvertes par Premium (aucune fonction inventée).
 *  - Les 3 formules aux prix de la boutique (RevenueCat) ; badges et économies calculés depuis ces prix réels.
 *  - Bouton adaptatif : « Commencer mes 3 jours d'essai gratuit » si la boutique propose vraiment un essai pour la
 *    formule choisie à cette personne, sinon « Continuer avec Premium ».
 *  - Restaurer les achats, liens CGU / confidentialité, et (écran verrouillé) accès au compte, aux données, aux urgences.
 * Le droit Premium vient toujours du serveur (has_premium) : un achat n'ouvre rien tant qu'il n'est pas confirmé.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { aiAssistantOnline } from '@/config/features';
import { Animated, Platform, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { BrandLogo } from '@/components/BrandLogo';
import { StaggerItem } from '@/components/Motion';
import { AnimatedPath } from '@/components/MotionKit';
import { useToast } from '@/components/Overlays';
import { Banner, Button, Card, Icon, Loading, Row, Text, type IconName } from '@/components/ui';
import { LegalLink } from '@/features/auth';
import { PlanCards, PlanTerms, usePlans, WebPurchaseNotice, webWithoutPurchase } from '@/features/subscription';
import { useInvalidate } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import type { Plan, PlanPeriod } from '@/lib/premium/plans';
import { purchase } from '@/lib/purchases';
import { purchasesSdk } from '@/lib/purchaseMode';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { easing } from '@/theme/motion';
import { radius, spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';

const STAGES = ['ttc', 'pregnancy', 'postpartum', 'baby', 'child'] as const;
const FEATURES: { key: 'track' | 'body' | 'family' | 'assistant' | 'community'; icon: IconName }[] = [
  { key: 'track', icon: 'activity' },
  { key: 'body', icon: 'heart' },
  { key: 'family', icon: 'users' },
  { key: 'assistant', icon: 'message-circle' },
  { key: 'community', icon: 'message-square' },
];

/** Fil doré qui se dessine d'une étape à l'autre (SVG, largeur fixe mise à l'échelle). */
function GoldenThread() {
  const th = useTheme();
  const reduce = useReduceMotion();
  const draw = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) { draw.setValue(1); return; }
    Animated.timing(draw, { toValue: 1, duration: 1600, delay: 250, easing: easing.decelerate, useNativeDriver: false }).start();
  }, [draw, reduce]);
  const W = 300, H = 44, len = 360;
  const d = `M8 26 C 46 4, 74 4, 79 22 S 120 42, 150 22 S 196 2, 221 22 S 262 42, 292 22`;
  const gold = th.colors.gold;
  return (
    <View accessible accessibilityLabel={STAGES.map((s) => tr(`pw.stage.${s}` as TKey)).join(', ')} testID="pw-thread">
      <View style={{ width: '100%', aspectRatio: W / H }}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
          <Path d={d} stroke={gold} strokeOpacity={0.18} strokeWidth={3} fill="none" strokeLinecap="round" />
          <AnimatedPath d={d} stroke={gold} strokeWidth={3} fill="none" strokeLinecap="round" strokeDasharray={`${len} ${len}`}
            strokeDashoffset={draw.interpolate({ inputRange: [0, 1], outputRange: [len, 0] })} />
        </Svg>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
        {STAGES.map((s, i) => (
          <StaggerItem key={s} index={i + 2}>
            <View style={{ alignItems: 'center', width: 62 }}>
              <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: gold, marginBottom: 4 }} />
              <Text variant="caption" center weight="medium">{tr(`pw.stage.${s}` as TKey)}</Text>
            </View>
          </StaggerItem>
        ))}
      </View>
    </View>
  );
}

function FeatureCards() {
  const th = useTheme();
  return (
    <View style={{ gap: spacing.sm }} testID="pw-features">
      {FEATURES.map((f, i) => (
        <StaggerItem key={f.key} index={i}>
          <Row style={{ alignItems: 'flex-start', gap: spacing.sm, padding: spacing.sm, borderRadius: radius.lg, backgroundColor: th.colors.surfaceAlt }}>
            <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: th.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={f.icon} size={17} color={th.colors.primary} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text weight="bold">{tr(`pw.feat.${f.key}.title` as TKey)}</Text>
              <Text variant="small" muted>{tr((f.key === 'assistant' && !aiAssistantOnline() ? 'pw.feat.assistantSoon.text' : `pw.feat.${f.key}.text`) as TKey)}</Text>
            </View>
          </Row>
        </StaggerItem>
      ))}
    </View>
  );
}

/** Texte du bouton d'achat : essai seulement s'il est réellement proposé par la boutique pour cette formule. */
export function paywallCta(plan: Pick<Plan, 'trialDays'> | undefined): string {
  if (plan?.trialDays) return tr('pw.cta.trial', { count: plan.trialDays });
  return tr('pw.cta.premium');
}

export function Paywall({ locked = false, embedded = false }: { locked?: boolean; embedded?: boolean }) {
  const th = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const plans = usePlans();
  const list = useMemo(() => plans.data ?? [], [plans.data]);
  // Par défaut : la formule mensuelle (seule à proposer l'essai), sinon la première disponible
  const [selected, setSelected] = useState<PlanPeriod | null>(null);
  useEffect(() => {
    if (selected || !list.length) return;
    setSelected((list.find((p) => p.trialDays > 0) ?? list.find((p) => p.period === 'annual') ?? list[0]).period);
  }, [list, selected]);
  const chosen = list.find((p) => p.period === selected);
  const [busy, setBusy] = useState<'buy' | 'restore' | null>(null);

  async function buy() {
    if (!chosen) return;
    setBusy('buy');
    try {
      const out = await purchase(chosen);
      inv('subscriptions'); inv('access');
      if (out === 'confirmed') toast(tr('pw.welcome'), 'success');
      else if (out === 'pending') toast(tr('sub2.page.pending'), 'info');
    } catch (e) {
      const msg = friendlyError(e);
      if (!/cancel|annul/i.test(msg)) toast(msg, 'error');
    } finally { setBusy(null); }
  }
  async function doRestore() {
    setBusy('restore');
    try {
      const ok = await purchasesSdk().restore();
      inv('subscriptions'); inv('access');
      toast(ok ? tr('u1.sub.restored') : tr('u1.sub.noneFound'), ok ? 'success' : 'info');
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(null); }
  }

  const body = (
    <View style={{ gap: spacing.md, paddingBottom: spacing.xl }} testID={locked ? 'paywall-locked' : 'paywall'}>
      <StaggerItem index={0}>
        <View style={{ alignItems: 'center', gap: spacing.xs, paddingTop: spacing.md }}>
          <BrandLogo size={64} />
          <Text variant="caption" weight="bold" color={th.colors.gold} style={{ letterSpacing: 1.6 }} accessibilityRole="header">{tr('pw.title').toUpperCase()}</Text>
          <Text variant="heading" center>{locked ? tr('pw.locked') : tr('pw.tagline')}</Text>
          {locked ? <Text variant="small" muted center>{tr('pw.lockedBody')}</Text> : null}
        </View>
      </StaggerItem>
      <GoldenThread />

      <Text variant="label">{tr('pw.featTitle')}</Text>
      <FeatureCards />

      <Text variant="label">{tr('pw.plansTitle')}</Text>
      {webWithoutPurchase(plans.mode) ? <WebPurchaseNotice /> : plans.mode === 'unavailable' ? (
        <Banner tone="info">{tr('pw.web')}</Banner>
      ) : plans.isLoading ? <Loading label={tr('u1.sub.loadingOffers')} /> : plans.isError || !list.length ? (
        <>
          <Banner tone="warning">{plans.isError ? friendlyError(plans.error, tr('pw.noPlans')) : tr('pw.noPlans')}</Banner>
          <Button label={tr('pw.retry')} icon="refresh-cw" variant="secondary" onPress={() => void plans.refetch()} testID="pw-retry" />
        </>
      ) : (
        <>
          <PlanCards plans={list} selected={selected} onSelect={setSelected} compact />
          {chosen ? <Card tone="soft"><PlanTerms plan={chosen} /></Card> : null}
          {chosen ? (
            <Button label={paywallCta(chosen)} icon="star" size="lg" full loading={busy === 'buy'} disabled={!!busy} onPress={() => void buy()} testID="pw-buy" />
          ) : null}
          {plans.mode === 'test' ? <Text variant="caption" muted>{tr('u1.sub.demoBody')}</Text> : null}
        </>
      )}
      {plans.mode !== 'unavailable' ? <Button label={tr('pw.restore')} variant="ghost" icon="refresh-cw" loading={busy === 'restore'} disabled={!!busy} onPress={() => void doRestore()} testID="pw-restore" /> : null}
      <Text variant="caption" muted center>{tr('pw.dataSafe')}</Text>
      <Row wrap style={{ justifyContent: 'center' }} testID="pw-legal">
        <LegalLink doc="terms">{tr('sub2.my.terms')}</LegalLink>
        <LegalLink doc="privacy">{tr('sub2.my.privacy')}</LegalLink>
      </Row>
      <View style={{ gap: spacing.xs }}>
        <Button label={tr('pw.details')} variant="secondary" icon="list" onPress={() => router.push('/settings/subscription')} testID="pw-details" />
        {locked ? (
          <>
            <Button label={tr('pw.account')} variant="ghost" icon="settings" onPress={() => router.push('/settings')} testID="pw-account" />
            <Button label={tr('pw.myData')} variant="ghost" icon="download" onPress={() => router.push('/settings/privacy')} testID="pw-data" />
            <Button label={tr('pw.emergency')} variant="ghost" icon="life-buoy" onPress={() => router.push('/emergency')} testID="pw-emergency" />
          </>
        ) : null}
      </View>
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
