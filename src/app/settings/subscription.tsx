/**
 * Page « AU FIL DE NOUS PREMIUM » (URL inchangée : /settings/subscription, paramètres ?feature= et ?plan=).
 * Avantages en cartes, 3 formules (12 mois « MEILLEURE OFFRE », 6 mois « ÉCONOMISEZ », mensuel « SANS ENGAGEMENT
 * LONGUE DURÉE ») aux prix de la boutique, conditions d'essai / de renouvellement / de résiliation, bouton
 * d'abonnement, « Mon abonnement », comparaison Gratuit / Premium, ce qui reste toujours gratuit, CGU et confidentialité.
 * Sur le web : pas d'achat (l'abonnement se prend dans l'application iPhone / Android).
 * Les droits sont confirmés par le serveur (has_premium), jamais par l'application seule.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Appear } from '@/components/Appear';
import { Banner, Button, Card, Divider, Icon, Loading, Row, SectionTitle, Text } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { LegalLink } from '@/features/auth';
import { useInvalidate } from '@/lib/data/hooks';
import { useEntitlement } from '@/lib/data/hooks-premium';
import { friendlyError, usePlanLimits } from '@/lib/data/hooks-settings';
import { ALWAYS_FREE, FEATURES, featureTitle, type PremiumFeature } from '@/lib/premium/features';
import { periodOfProduct, type Plan, type PlanPeriod } from '@/lib/premium/plans';
import { purchase } from '@/lib/purchases';
import { BenefitCards, MySubscriptionCard, PremiumActivated, PlanCards, PlanTerms, planTitle, PremiumHero, usePlans, WebPurchaseNotice, webWithoutPurchase } from '@/features/subscription';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

interface Row3 { label: string; free: string | boolean; plus: string | boolean }

function Cell({ v }: { v: string | boolean }) {
  const t = useTheme();
  if (v === true) return <View style={{ flex: 1, alignItems: 'center' }}><Icon name="check" size={18} color={t.colors.success} /></View>;
  if (v === false) return <View style={{ flex: 1, alignItems: 'center' }}><Text variant="small" muted accessibilityLabel={tr('u1.sub.notIncluded')}>—</Text></View>;
  return <Text variant="small" center style={{ flex: 1 }}>{v}</Text>;
}

const PERIODS: PlanPeriod[] = ['monthly', 'six_months', 'annual'];

export default function SubscriptionScreen() {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const params = useLocalSearchParams<{ feature?: string; plan?: string }>();
  const ent = useEntitlement();
  const premium = ent.premium;
  const sub = ent.sub;
  const { data: limits } = usePlanLimits();
  const plans = usePlans();
  const mode = plans.mode;
  const [busy, setBusy] = useState(false);
  const tried = params.feature && params.feature in FEATURES ? (params.feature as PremiumFeature) : null;
  const wanted = PERIODS.includes(params.plan as PlanPeriod) ? (params.plan as PlanPeriod) : null;

  // Abonnement personnel en cours (pour proposer un changement de formule plutôt qu'un second abonnement)
  const ownActive = !!sub && ent.premium && ['trial', 'active', 'grace', 'cancelled'].includes(sub.status);
  const currentPeriod = ownActive ? ((sub.period_type && ['monthly', 'six_months', 'annual'].includes(sub.period_type) ? sub.period_type : periodOfProduct(sub.product_id)) as PlanPeriod | null) : null;
  const sharedOnly = premium && !ownActive;
  const [selected, setSelected] = useState<PlanPeriod | null>(wanted);
  const list = useMemo(() => plans.data ?? [], [plans.data]);
  useEffect(() => {
    if (selected || !list.length) return;
    setSelected(list.find((p) => p.period !== currentPeriod)?.period ?? list[0].period);
  }, [list, selected, currentPeriod]);
  const chosen: Plan | undefined = list.find((p) => p.period === selected);

  const lim = (key: string, unit: string) => {
    const l = limits?.find((x) => x.key === key);
    return l ? { free: `${l.free_value}${unit}`, plus: `${l.premium_value}${unit}` } : { free: tr('u1.sub.limited'), plus: tr('u1.sub.extended') };
  };
  const q = lim('assistant_questions_per_month', tr('u1.sub.perMonth'));
  const scans = lim('product_scans_per_month', tr('u1.sub.perMonth'));
  const voice = lim('voice_entries_per_month', tr('u1.sub.perMonth'));
  const exportsL = lim('summary_exports_per_month', tr('u1.sub.perMonth'));
  const kids = lim('children_count', '');
  const docs = lim('documents_count', '');
  const lists = lim('checklists_count', '');
  const rem = lim('custom_reminders_count', '');

  const rows: Row3[] = [
    { label: tr('u1.sub.r01'), free: true, plus: true },
    { label: tr('u1.sub.r02'), free: true, plus: true },
    { label: tr('u1.sub.r03'), free: true, plus: true },
    { label: tr('u1.sub.r04'), free: true, plus: true },
    { label: tr('u1.sub.r05'), free: false, plus: true },
    { label: tr('u1.sub.r06'), free: false, plus: true },
    { label: tr('u1.sub.r07'), free: true, plus: true },
    { label: tr('u1.sub.r08'), free: false, plus: true },
    { label: tr('u1.sub.r09'), free: exportsL.free, plus: exportsL.plus },
    { label: tr('u1.sub.r10'), free: voice.free, plus: voice.plus },
    { label: tr('u1.sub.r11'), free: q.free, plus: q.plus },
    { label: tr('u1.sub.r12'), free: false, plus: true },
    { label: tr('u1.sub.r13'), free: scans.free, plus: scans.plus },
    { label: tr('u1.sub.r14'), free: false, plus: true },
    { label: tr('u1.sub.r15'), free: true, plus: true },
    { label: tr('u1.sub.r16'), free: false, plus: true },
    { label: tr('u1.sub.r17'), free: false, plus: true },
    { label: tr('u1.sub.r18'), free: false, plus: true },
    { label: tr('u1.sub.r19'), free: rem.free, plus: rem.plus },
    { label: tr('u1.sub.r20'), free: kids.free, plus: kids.plus },
    { label: tr('u1.sub.r21'), free: docs.free, plus: docs.plus },
    { label: tr('u1.sub.r22'), free: lists.free, plus: lists.plus },
    { label: tr('u1.sub.r23'), free: false, plus: true },
    { label: tr('u1.sub.r24'), free: true, plus: true },
    { label: tr('u1.sub.r25'), free: true, plus: true },
    { label: tr('u1.sub.r26'), free: true, plus: true },
    { label: tr('u1.sub.r27'), free: false, plus: true },
    { label: tr('u1.sub.r28'), free: false, plus: true },
    { label: tr('u1.sub.r29'), free: false, plus: true },
    { label: tr('u1.sub.r30'), free: false, plus: true },
    { label: tr('u1.sub.r31'), free: false, plus: true },
    { label: tr('u1.sub.r32'), free: false, plus: true },
  ];

  async function buy() {
    if (!chosen) return;
    setBusy(true);
    try {
      const out = await purchase(chosen, { currentProductId: ownActive ? sub?.product_id ?? null : null });
      inv('subscriptions');
      if (out === 'confirmed') toast(currentPeriod ? tr('sub2.page.changed') : tr('u1.sub.welcome', { name: tr('sub2.my.premium') }), 'success');
      else if (out === 'pending') toast(tr('sub2.page.pending'), 'info');
    } catch (e) {
      const msg = friendlyError(e);
      if (!/cancel|annul/i.test(msg)) toast(msg, 'error');
    } finally {
      setBusy(false);
    }
  }

  const ctaLabel = !chosen ? '' : chosen.period === currentPeriod ? tr('sub2.cta.isCurrent')
    : currentPeriod ? tr('sub2.cta.change', { plan: planTitle(chosen.period) })
    : chosen.trialDays ? tr('sub2.cta.trial', { count: chosen.trialDays })
    : tr('sub2.cta.subscribe', { price: chosen.price });

  return (
    <Screen back title={tr('sub2.page.screen')}>
      <Appear kind="soft" delay={0.04}><PremiumHero /></Appear>

      {tried && !premium ? (
        <Card tone="gold">
          <View testID="sub-tried">
            <Row><Icon name={FEATURES[tried].icon as never} size={18} /><Text weight="bold" style={{ flex: 1 }}>{featureTitle(tried)}</Text></Row>
            <Text variant="small" style={{ marginTop: 4 }}>{FEATURES[tried].benefit}</Text>
          </View>
        </Card>
      ) : null}

      {/* Activation confirmée par le serveur pendant que la page est ouverte (achat, restauration, essai) */}
      <PremiumActivated premium={premium} />

      {/* État actuel : formule, statut, dates, prix, gestion, restauration */}
      <View testID="sub-status"><MySubscriptionCard showDiscover={false} /></View>

      {!premium ? (
        <>
          <SectionTitle title={tr('sub2.ben.title')} />
          <Appear kind="soft" delay={0.1}><BenefitCards /></Appear>
        </>
      ) : null}

      {!sharedOnly ? (
        <>
          <SectionTitle title={currentPeriod ? tr('sub2.page.change') : tr('sub2.page.choose')} />
          {webWithoutPurchase(mode) ? <WebPurchaseNotice /> : mode === 'unavailable' ? (
            <Banner tone="info" title={tr('u1.sub.soonTitle')}>{tr('u1.sub.soonBody')}</Banner>
          ) : plans.isLoading ? <Loading label={tr('u1.sub.loadingOffers')} /> : plans.isError ? (
            <>
              <Banner tone="warning" title={tr('u1.sub.offersDown')}>{friendlyError(plans.error, tr('u1.sub.storeUnreachable'))}</Banner>
              <Button label={tr('u1.sub.retry')} icon="refresh-cw" variant="secondary" onPress={() => void plans.refetch()} testID="plans-retry" />
            </>
          ) : list.length ? (
            <>
              <PlanCards plans={list} selected={selected} onSelect={setSelected} currentPeriod={currentPeriod} />
              {currentPeriod ? <Text variant="caption" muted>{tr('sub2.page.changeNote')}</Text> : null}
              {chosen ? (
                <Card tone="soft"><PlanTerms plan={chosen} /></Card>
              ) : null}
              {chosen ? (
                <Appear kind="btn" delay={0.12}>
                  <Button label={ctaLabel} icon="star" loading={busy} disabled={busy || chosen.period === currentPeriod} onPress={buy} testID="plan-buy" full />
                </Appear>
              ) : null}
              {/* Liens exigés par l'App Store (règle 3.1.2) à côté du bouton d'achat */}
              <Row wrap testID="plan-legal-links">
                <LegalLink doc="terms">{tr('sub2.my.terms')}</LegalLink>
                <LegalLink doc="privacy">{tr('sub2.my.privacy')}</LegalLink>
              </Row>
              {mode === 'test' ? <Banner tone="demo" title={tr('u1.sub.demoTitle')}>{tr('u1.sub.demoBody')}</Banner> : null}
            </>
          ) : (
            <Banner tone="warning" title={tr('u1.sub.offersDown')}>{tr('u1.sub.storeUnreachable')}</Banner>
          )}
        </>
      ) : null}

      <SectionTitle title={tr('u1.sub.compare')} />
      <Card>
        <View style={{ flexDirection: 'row', paddingVertical: 6 }}>
          <Text variant="label" style={{ flex: 2.2 }}> </Text>
          <Text variant="label" center style={{ flex: 1 }}>{tr('u1.sub.colFree')}</Text>
          <Text variant="label" center style={{ flex: 1 }}>{tr('u1.sub.colPremium')}</Text>
        </View>
        <Divider />
        {rows.map((r, i) => (
          <View key={r.label} accessible accessibilityLabel={tr('u1.sub.rowA11y', { label: r.label, free: r.free === true ? tr('u1.sub.included') : r.free === false ? tr('u1.sub.notIncludedLc') : r.free, plus: r.plus === true ? tr('u1.sub.included') : r.plus === false ? tr('u1.sub.notIncludedLc') : r.plus })}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: i ? 0.5 : 0, borderColor: t.colors.border }}>
            <Text variant="small" style={{ flex: 2.2, paddingRight: 6 }}>{r.label}</Text>
            <Cell v={r.free} />
            <Cell v={r.plus} />
          </View>
        ))}
      </Card>

      <SectionTitle title={tr('u1.sub.alwaysFree')} />
      <View testID="always-free">
        <Card tone="soft">
          {ALWAYS_FREE.map((label, i) => (
            <Row key={label} style={{ paddingVertical: 6, borderTopWidth: i ? 0.5 : 0, borderColor: t.colors.border }}>
              <Icon name="shield" size={16} color={t.colors.success} />
              <Text variant="small" style={{ flex: 1 }}>{label}</Text>
            </Row>
          ))}
          <Button label={tr('u1.sub.emergency')} size="sm" variant="ghost" icon="life-buoy" style={{ alignSelf: 'flex-start', marginTop: 4 }} onPress={() => router.push('/emergency')} />
        </Card>
        <Text variant="caption" muted style={{ marginTop: spacing.xs }} testID="no-targeted-ads">
          {tr('u1.sub.noAds')}
        </Text>
      </View>

      <Text variant="caption" muted testID="sub-terms">
        {tr('u1.sub.terms')}
      </Text>
    </Screen>
  );
}
