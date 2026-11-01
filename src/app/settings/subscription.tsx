/**
 * Abonnement Premium : bénéfices, comparaison claire Gratuit / Premium, formules mensuelle et annuelle (annuelle mise en
 * valeur), essai éventuel, prix total réellement facturé, date de renouvellement, conditions d'annulation, restauration
 * des achats, lien de gestion. Aucun compte à rebours, aucun prix barré, aucun bouton caché.
 * Les droits sont confirmés par le serveur (has_premium), jamais par l'application seule.
 */
import React, { useState } from 'react';
import { Linking, Platform, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '@/components/Screen';
import { Banner, Button, Card, Divider, Icon, Loading, Row, SectionTitle, Text } from '@/components/ui';
import { confirm, useToast } from '@/components/Overlays';
import { BRAND } from '@/config/brand';
import { useInvalidate } from '@/lib/data/hooks';
import { useEntitlement } from '@/lib/data/hooks-premium';
import { LegalLink } from '@/features/auth';
import { friendlyError, usePlanLimits } from '@/lib/data/hooks-settings';
import { ALWAYS_FREE, FEATURES, featureTitle, type PremiumFeature } from '@/lib/premium/features';
import { billingDates, getPlans, MANAGE_URLS, manageSubscription, purchase, purchaseMode, restore, type Plan } from '@/lib/purchases';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { t as tr, formatDate } from '@/i18n';

const PREMIUM = `${BRAND.shortName} Premium`;
const storeLabel = (store: string) => (store === 'test' ? tr('u1.sub.storeTest') : store === 'promotional' ? tr('u1.sub.storePromo') : store === 'app_store' ? 'App Store' : store === 'play_store' ? 'Google Play' : store);
const day = (d: Date | string) => formatDate(d, { day: 'numeric', month: 'long', year: 'numeric' });

interface Row3 { label: string; free: string | boolean; plus: string | boolean }

function Cell({ v }: { v: string | boolean }) {
  const t = useTheme();
  if (v === true) return <View style={{ flex: 1, alignItems: 'center' }}><Icon name="check" size={18} color={t.colors.success} /></View>;
  if (v === false) return <View style={{ flex: 1, alignItems: 'center' }}><Text variant="small" muted accessibilityLabel={tr('u1.sub.notIncluded')}>—</Text></View>;
  return <Text variant="small" center style={{ flex: 1 }}>{v}</Text>;
}

const BENEFITS: PremiumFeature[] = ['sleep_insights', 'coparent_invite', 'summaries', 'weekly_menu', 'community_groups', 'voice_entry', 'assistant_more', 'scanner_compare', 'cycle_insights'];

export default function SubscriptionScreen() {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const params = useLocalSearchParams<{ feature?: string }>();
  const ent = useEntitlement();
  const premium = ent.premium;
  const sub = ent.sub;
  const { data: limits } = usePlanLimits();
  const plans = useQuery({ queryKey: ['plans', purchaseMode], queryFn: getPlans, staleTime: 600_000, retry: false, enabled: purchaseMode !== 'unavailable' });
  const [busy, setBusy] = useState<string | null>(null);
  const tried = params.feature && params.feature in FEATURES ? (params.feature as PremiumFeature) : null;

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

  async function buy(plan: Plan) {
    setBusy(plan.id);
    try {
      const ok = await purchase(plan);
      inv('subscriptions');
      toast(ok ? tr('u1.sub.welcome', { name: PREMIUM }) : tr('u1.sub.purchaseSaved'), ok ? 'success' : 'info');
    } catch (e) {
      const msg = friendlyError(e);
      if (!/cancel|annul/i.test(msg)) toast(msg, 'error');
    } finally {
      setBusy(null);
    }
  }

  async function doRestore() {
    setBusy('restore');
    try {
      const ok = await restore();
      inv('subscriptions');
      toast(ok ? tr('u1.sub.restored') : tr('u1.sub.noneFound'), ok ? 'success' : 'info');
    } catch (e) {
      toast(friendlyError(e), 'error');
    } finally {
      setBusy(null);
    }
  }

  async function manage() {
    if (purchaseMode === 'test') {
      if (!(await confirm(tr('u1.sub.stopDemoTitle'), tr('u1.sub.stopDemoBody'), tr('u1.sub.stop')))) return;
    }
    setBusy('manage');
    try {
      await manageSubscription();
      inv('subscriptions');
      if (purchaseMode === 'test') toast(tr('u1.sub.backToFree'));
    } catch (e) {
      toast(friendlyError(e), 'error');
    } finally {
      setBusy(null);
    }
  }

  const sorted = [...(plans.data ?? [])].sort((a, b) => (a.period === 'annual' ? -1 : b.period === 'annual' ? 1 : 0));

  return (
    <Screen back title={tr('u1.sub.title')} subtitle={tr('u1.sub.subtitle', { name: PREMIUM })}>
      {tried && !premium ? (
        <Card tone="gold">
          <View testID="sub-tried">
            <Row><Icon name={FEATURES[tried].icon as never} size={18} /><Text weight="bold" style={{ flex: 1 }}>{featureTitle(tried)}</Text></Row>
            <Text variant="small" style={{ marginTop: 4 }}>{FEATURES[tried].benefit}</Text>
          </View>
        </Card>
      ) : null}

      {/* État actuel, expliqué : essai, renouvellement, fin, grâce, paiement refusé, expiré */}
      <View testID="sub-status">
        <Card tone={premium ? 'gold' : 'soft'}>
          <Row>
            <Icon name={premium ? 'star' : 'heart'} size={20} />
            <Text weight="bold" style={{ flex: 1 }}>{premium ? tr('u1.sub.active', { name: PREMIUM }) : tr('u1.sub.freeVersion')}</Text>
          </Row>
          <Text variant="small" style={{ marginTop: 6 }} testID="sub-message">{premium && (!sub || sub.status === 'none') ? tr('u1.sub.sharedAccess') : ent.message}</Text>
          {sub && sub.status !== 'none' ? (
            <View style={{ marginTop: 4, gap: 2 }}>
              {sub.period_type ? <Text variant="small" muted>{tr('u1.sub.planLine', { kind: sub.period_type === 'annual' ? tr('u1.sub.annual') : sub.period_type === 'monthly' ? tr('u1.sub.monthly') : sub.period_type === 'trial' ? tr('u1.sub.trial') : sub.period_type })}</Text> : null}
              {sub.store ? <Text variant="small" muted>{tr('u1.sub.storeLine', { store: storeLabel(sub.store) })}</Text> : null}
            </View>
          ) : null}
          {ent.state === 'billing_issue' || ent.state === 'grace' ? <Banner tone="warning">{tr('u1.sub.updatePayment')}</Banner> : null}
        </Card>
      </View>

      {!premium ? (
        <>
          <SectionTitle title={tr('u1.sub.benefitsTitle')} />
          <Card>
            {BENEFITS.map((f, i) => (
              <Row key={f} style={{ alignItems: 'flex-start', paddingVertical: 6, borderTopWidth: i ? 0.5 : 0, borderColor: t.colors.border }}>
                <Icon name={FEATURES[f].icon as never} size={18} color={t.colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text weight="bold">{featureTitle(f)}</Text>
                  <Text variant="small" muted>{FEATURES[f].benefit}</Text>
                </View>
              </Row>
            ))}
          </Card>

          <SectionTitle title={tr('u1.sub.choose', { name: PREMIUM })} />
          {purchaseMode === 'unavailable' ? (
            <Banner tone="info" title={tr('u1.sub.soonTitle')}>{tr('u1.sub.soonBody')}</Banner>
          ) : plans.isLoading ? <Loading label={tr('u1.sub.loadingOffers')} /> : plans.isError ? (
            <>
              <Banner tone="warning" title={tr('u1.sub.offersDown')}>{friendlyError(plans.error, tr('u1.sub.storeUnreachable'))}</Banner>
              <Button label={tr('u1.sub.retry')} icon="refresh-cw" variant="secondary" onPress={() => void plans.refetch()} testID="plans-retry" />
            </>
          ) : (
            sorted.map((p) => {
              const dates = billingDates(p);
              const annual = p.period === 'annual';
              return (
                <View key={p.id} testID={`plan-${p.period}`}>
                  <Card tone={annual ? 'lavender' : 'surface'} style={annual ? { borderWidth: 2, borderColor: t.colors.primary } : undefined}>
                    {annual ? <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: t.colors.primary, marginBottom: 6 }}><Text variant="caption" weight="bold" color="#FFFFFF">{tr('u1.sub.bestValue')}</Text></View> : null}
                    <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1 }}>
                        <Text weight="bold">{p.title}</Text>
                        <Text variant="small" muted>{p.detail}</Text>
                      </View>
                      <Text variant="heading">{p.price}</Text>
                    </Row>
                    <View style={{ marginTop: 6, gap: 2 }} testID={`plan-terms-${p.period}`}>
                      <Text variant="small" weight="bold">{p.billed}</Text>
                      {p.trialDays ? <Text variant="small">{tr('u1.sub.trialThenCharge', { days: p.trialDays, date: day(dates.firstCharge) })}</Text> : <Text variant="small">{tr('u1.sub.chargeToday')}</Text>}
                      <Text variant="small" muted>{tr('u1.sub.autoRenew', { date: day(dates.renewal) })}</Text>
                    </View>
                    <Button label={p.trialDays ? tr('u1.sub.startTrial', { days: p.trialDays }) : tr('u1.sub.choosePlan', { plan: p.title.toLowerCase() })} style={{ marginTop: spacing.sm }} loading={busy === p.id} disabled={!!busy && busy !== p.id} onPress={() => buy(p)} testID={`plan-buy-${p.period}`} />
                  </Card>
                </View>
              );
            })
          )}
          {purchaseMode === 'test' ? <Banner tone="demo" title={tr('u1.sub.demoTitle')}>{tr('u1.sub.demoBody')}</Banner> : null}
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

      <View style={{ gap: spacing.xs }}>
        {purchaseMode !== 'unavailable' ? <Button label={tr('u1.sub.restore')} variant="secondary" icon="refresh-cw" loading={busy === 'restore'} onPress={doRestore} testID="sub-restore" /> : null}
        {premium && sub && sub.status !== 'none' && purchaseMode !== 'unavailable' ? (
          <Button label={purchaseMode === 'test' ? tr('u1.sub.stopDemoTitle') : tr('u1.sub.manage')} variant="ghost" loading={busy === 'manage'} onPress={manage} testID="sub-manage" />
        ) : null}
        <Button label={Platform.OS === 'android' ? tr('u1.sub.manageAndroid') : tr('u1.sub.manageIos')} variant="ghost" icon="external-link" size="sm"
          onPress={() => void Linking.openURL(Platform.OS === 'android' ? MANAGE_URLS.android : MANAGE_URLS.ios)} testID="sub-manage-link" />
      </View>
      <Text variant="caption" muted testID="sub-terms">
        {tr('u1.sub.terms')}
      </Text>
      {/* Liens exigés par l'App Store (règle 3.1.2) : conditions d'utilisation et confidentialité */}
      <Row wrap testID="sub-legal-links">
        <LegalLink doc="terms">{tr('u1.sub.termsLink')}</LegalLink>
        <LegalLink doc="privacy">{tr('u1.sub.privacyLink')}</LegalLink>
      </Row>
    </Screen>
  );
}
