/**
 * Abonnement « Au fil de nous Premium » — éléments d'interface partagés par la page Premium, la feuille Premium et la
 * rubrique « Mon abonnement » du profil : formules (1 mois, 6 mois, 12 mois), conditions, avantages, état.
 * Prix : ceux de la boutique (ou la grille de démonstration, signalée comme telle). Aucun compte à rebours, aucun prix
 * barré, aucun bouton caché. Les droits restent décidés par le serveur (has_premium).
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Linking, Platform, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { Banner, Button, Card, Icon, Row, SectionTitle, Text, type IconName } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { confirm, useToast } from '@/components/Overlays';
import { LegalLink } from '@/features/auth';
import { useInvalidate } from '@/lib/data/hooks';
import { useEntitlement, usePremiumShare } from '@/lib/data/hooks-premium';
import { friendlyError } from '@/lib/data/hooks-settings';
import type { EntitlementState } from '@/lib/premium/entitlement';
import { billingDates, formatMoney, periodOfProduct, PLAN_BADGE, plansAvailability, type Plan, type PlanPeriod, type PlansAvailability } from '@/lib/premium/plans';
import { getPurchaseMode, loadPlans, purchasesSdk } from '@/lib/purchaseMode';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { NACRE, radius, spacing } from '@/theme/tokens';
import { springTo } from '@/theme/motion';
import { DrawCheck } from '@/components/MotionKit';
import { Appear } from '@/components/Appear';
import { StaggerItem } from '@/components/Motion';
import { formatDate, localeTag, t as tr, type TKey } from '@/i18n';

export const planTitle = (p: PlanPeriod) => tr(`sub2.plan.${p}.title` as TKey);
export const planPer = (p: PlanPeriod) => tr(`sub2.plan.${p}.per` as TKey);
const day = (d: Date | string) => formatDate(d, { day: 'numeric', month: 'long', year: 'numeric' });

/** Formules de l'offre courante (ou de la démonstration), partagées par la page et la feuille. */
export function usePlans() {
  const mode = getPurchaseMode();
  // Liste vide (formules pas encore en ligne) : jamais gardée en cache, relue à la prochaine ouverture
  const q = useQuery({ queryKey: ['plans', mode, localeTag()], queryFn: loadPlans, staleTime: (s) => (s.state.data?.length ? 600_000 : 0), retry: false, enabled: mode !== 'unavailable' });
  const availability: PlansAvailability = plansAvailability({ mode, os: Platform.OS, isLoading: q.isLoading, isError: q.isError, error: q.error, count: q.data?.length ?? 0 });
  return { mode, availability, ...q };
}

const AVAIL_TEXT: Partial<Record<PlansAvailability, { title: TKey; body: TKey; tone: 'info' | 'warning'; retry: boolean }>> = {
  unconfigured: { title: 'sub2.avail.unconfigured.title', body: 'sub2.avail.unconfigured.body', tone: 'info', retry: false },
  not_ready: { title: 'sub2.avail.notReady.title', body: 'sub2.avail.notReady.body', tone: 'info', retry: true },
  offline: { title: 'sub2.avail.offline.title', body: 'sub2.avail.offline.body', tone: 'warning', retry: true },
  store_error: { title: 'sub2.avail.storeError.title', body: 'sub2.avail.storeError.body', tone: 'warning', retry: true },
};

/**
 * À la place des formules quand la boutique n'en propose pas (cas des produits pas encore créés, clé absente, réseau) :
 * explication honnête, « Réessayer » quand c'est utile, rappel que le gratuit reste accessible. Aucun prix, aucun
 * bouton d'achat, aucun droit accordé.
 */
export function PlansUnavailable({ availability, onRetry, retrying }: { availability: PlansAvailability; onRetry?: () => void; retrying?: boolean }) {
  const txt = AVAIL_TEXT[availability];
  if (!txt) return null;
  return (
    <View style={{ gap: spacing.sm }} testID={`plans-unavailable-${availability}`}>
      <Banner tone={txt.tone} title={tr(txt.title)}>{`${tr(txt.body)} ${tr('sub2.avail.free')}`}</Banner>
      {txt.retry && onRetry ? <Button label={tr('u1.sub.retry')} icon="refresh-cw" variant="secondary" loading={retrying} onPress={onRetry} testID="plans-retry" /> : null}
    </View>
  );
}

/** Sur le web, pas d'achat intégré (hors démonstration) : l'abonnement se prend dans l'application mobile. */
export const webWithoutPurchase = (mode: string) => Platform.OS === 'web' && mode !== 'test';

// ---------------------------------------------------------------- en-tête
export function PremiumHero() {
  return (
    <LinearGradient colors={NACRE} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: radius.xl, padding: spacing.lg, gap: spacing.xs }}>
      <View testID="premium-hero">
        <Row>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="star" size={18} color="#FFFFFF" />
          </View>
          <Text variant="caption" weight="bold" color="#FFFFFF" style={{ letterSpacing: 1.6, flex: 1 }} accessibilityRole="header">{tr('sub2.page.title')}</Text>
        </Row>
        <Text variant="heading" color="#FFFFFF" style={{ marginTop: spacing.sm }}>{tr('sub2.page.subtitle')}</Text>
        <Text variant="small" color="#FFFFFF" style={{ marginTop: spacing.xs, opacity: 0.92 }}>{tr('sub2.page.oneAccess')}</Text>
      </View>
    </LinearGradient>
  );
}

// ---------------------------------------------------------------- activation confirmée
/**
 * Confirmation « Premium activé » : affichée UNIQUEMENT quand le droit Premium confirmé par le serveur (has_premium)
 * passe de faux à vrai pendant que l'écran est ouvert — jamais sur la seule réponse de la boutique. Coche dessinée,
 * carte qui apparaît en douceur ; « Réduire les animations » : carte affichée directement.
 */
export function PremiumActivated({ premium, onBack }: { premium: boolean; onBack?: (() => void) | null }) {
  const t = useTheme();
  const prev = useRef(premium);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (premium && !prev.current) setShown(true);
    prev.current = premium;
  }, [premium]);
  if (!shown || !premium) return null;
  return (
    <Appear kind="pop" delay={0} duration={0.6}>
      <Card tone="gold">
        <View accessibilityLiveRegion="polite">
          <Row testID="premium-activated">
            <DrawCheck size={44} color={t.colors.success} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text weight="bold" accessibilityRole="header">{tr('sub2.activated.title')}</Text>
              <Text variant="small" muted>{tr('sub2.activated.body')}</Text>
            </View>
          </Row>
          {/* Ouverte depuis une fonction Premium : retour direct à cette fonction, désormais débloquée */}
          {onBack ? <Button label={tr('sub2.activated.back')} icon="arrow-left" variant="secondary" size="sm" onPress={onBack} testID="premium-activated-back" style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }} /> : null}
        </View>
      </Card>
    </Appear>
  );
}

// ---------------------------------------------------------------- avantages
const THEMES: { key: 'links' | 'share' | 'discover' | 'community'; icon: IconName }[] = [
  { key: 'links', icon: 'users' },
  { key: 'share', icon: 'share-2' },
  { key: 'discover', icon: 'compass' },
  { key: 'community', icon: 'message-circle' },
];

export function BenefitCards() {
  const t = useTheme();
  return (
    <View testID="premium-benefits" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
      {THEMES.map((b) => (
        <View key={b.key} style={{ flexGrow: 1, flexBasis: 150, minWidth: 140 }}>
          <Card tone="soft" style={{ height: '100%' }}>
            <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: t.colors.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs }}>
              <Icon name={b.icon} size={17} color={t.colors.primary} />
            </View>
            <Text weight="bold">{tr(`sub2.ben.${b.key}.title` as TKey)}</Text>
            <Text variant="small" muted style={{ marginTop: 2 }}>{tr(`sub2.ben.${b.key}.text` as TKey)}</Text>
          </Card>
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------- formules
function Badge({ kind }: { kind: 'best' | 'save' | 'flex' }) {
  const t = useTheme();
  const bg = kind === 'best' ? t.colors.primary : kind === 'save' ? t.colors.accent : 'transparent';
  const fg = kind === 'best' ? t.colors.primaryText : t.colors.text;
  return (
    <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: bg, borderWidth: kind === 'flex' ? 1 : 0, borderColor: t.colors.textMuted }}>
      <Text variant="caption" weight="bold" color={fg} style={{ letterSpacing: 0.8 }}>{tr(`sub2.plan.badge.${kind}` as TKey)}</Text>
    </View>
  );
}

function PlanCard({ plan, selected, current, onSelect, compact }: { plan: Plan; selected: boolean; current: boolean; onSelect: () => void; compact?: boolean }) {
  const t = useTheme();
  const reduce = useReduceMotion();
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => { springTo(scale, selected ? 1.015 : 1, 'pop', reduce).start(); }, [selected, reduce, scale]);
  const title = planTitle(plan.period);
  return (
    <Animated.View style={{ transform: [{ scale }] }} testID={`plan-${plan.period}`}>
      <Tappable onPress={onSelect} pressScale={0.99} accessibilityRole="radio" accessibilityState={{ selected, checked: selected }}
        accessibilityLabel={tr('sub2.plan.a11y', { title, price: plan.price, per: planPer(plan.period) })}
        style={{ borderRadius: radius.lg, borderWidth: selected ? 2 : 1, borderColor: selected ? t.colors.primary : t.colors.border, backgroundColor: selected ? t.colors.surface : t.colors.surfaceAlt, padding: compact ? spacing.sm : spacing.md }}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Badge kind={PLAN_BADGE[plan.period]} />
            <Text weight="bold" style={{ marginTop: 2 }}>{title}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text variant={compact ? 'body' : 'heading'} weight="bold" testID={`plan-price-${plan.period}`}>{plan.price}</Text>
            <Text variant="caption" muted>{planPer(plan.period)}</Text>
          </View>
          <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: selected ? t.colors.primary : t.colors.textMuted, backgroundColor: selected ? t.colors.primary : 'transparent', alignItems: 'center', justifyContent: 'center', marginLeft: spacing.xs }}>
            {selected ? <Icon name="check" size={13} color={t.colors.primaryText} /> : null}
          </View>
        </Row>
        {!compact || plan.savingsPct || plan.trialDays ? (
          <View style={{ marginTop: 6, gap: 2 }}>
            {plan.perMonth ? <Text variant="small" muted testID={`plan-permonth-${plan.period}`}>{tr('sub2.plan.perMonth', { price: plan.perMonth })}</Text> : null}
            {plan.savingsPct ? <Text variant="small" weight="bold" color={t.colors.success} testID={`plan-savings-${plan.period}`}>{tr('sub2.plan.savings', { pct: plan.savingsPct })}</Text> : null}
            {plan.trialDays ? <Text variant="small" weight="bold" color={t.colors.primary} testID={`plan-trial-${plan.period}`}>{tr('sub2.plan.trial', { count: plan.trialDays })}</Text> : null}
            {current ? <Text variant="small" weight="bold" testID={`plan-current-${plan.period}`}>{tr('sub2.plan.current')}</Text> : null}
          </View>
        ) : null}
      </Tappable>
    </Animated.View>
  );
}

export function PlanCards({ plans, selected, onSelect, currentPeriod, compact }: { plans: Plan[]; selected: PlanPeriod | null; onSelect: (p: PlanPeriod) => void; currentPeriod?: PlanPeriod | null; compact?: boolean }) {
  return (
    <View style={{ gap: spacing.sm }} accessibilityRole="radiogroup" testID="premium-plans">
      {/* Les offres arrivent en cascade courte (45 ms d'écart) ; la formule choisie est mise en avant par un ressort */}
      {plans.map((p, i) => <StaggerItem key={p.period} index={i}><PlanCard plan={p} selected={selected === p.period} current={currentPeriod === p.period} onSelect={() => onSelect(p.period)} compact={compact} /></StaggerItem>)}
      {plans.some((p) => p.demo) ? <Text variant="caption" muted testID="plans-demo-note">{tr('sub2.plan.demo')}</Text> : null}
    </View>
  );
}

/** Conditions de la formule choisie : montant facturé, essai, renouvellement automatique, résiliation. */
export function PlanTerms({ plan }: { plan: Plan }) {
  const dates = billingDates(plan);
  return (
    <View style={{ gap: 4 }} testID="plan-terms">
      <Text variant="small" weight="bold">{tr(`sub2.terms.billed.${plan.period}` as TKey, { price: plan.price })}</Text>
      {plan.trialDays ? (
        <>
          <Text variant="small">{tr('sub2.terms.trial', { count: plan.trialDays, price: plan.price, date: day(dates.firstCharge) })}</Text>
          <Text variant="small">{tr('sub2.terms.trialCancel')}</Text>
        </>
      ) : <Text variant="small">{tr('sub2.terms.today')}</Text>}
      <Text variant="small" muted>{tr('sub2.terms.renew', { date: day(dates.renewal) })}</Text>
      <Text variant="small" muted>{tr('sub2.terms.cancel')}</Text>
      <Text variant="caption" muted>{plan.demo ? tr('sub2.terms.demo') : tr('sub2.terms.store')}</Text>
    </View>
  );
}

// ---------------------------------------------------------------- état : « Mon abonnement »
const STATUS_TONE: Record<EntitlementState, 'ok' | 'warn' | 'bad' | 'muted'> = {
  free: 'muted', trial: 'ok', active: 'ok', cancelled: 'warn', grace: 'warn', paused: 'warn', billing_issue: 'bad', refunded: 'bad', expired: 'muted',
};

export function StatusPill({ state }: { state: EntitlementState }) {
  const t = useTheme();
  const tone = STATUS_TONE[state];
  const color = tone === 'ok' ? t.colors.success : tone === 'warn' ? t.colors.gold : tone === 'bad' ? t.colors.danger : t.colors.textMuted;
  return (
    <View testID="sub-status-pill" style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill, borderWidth: 1, borderColor: color }}>
      <Text variant="caption" weight="bold" color={color}>{tr(`sub2.status.${state}` as TKey)}</Text>
    </View>
  );
}

function Line({ label, value, testID }: { label: string; value: string; testID?: string }) {
  return (
    <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 3 }} testID={testID}>
      <Text variant="small" muted style={{ flexShrink: 0 }}>{label}</Text>
      <Text variant="small" weight="bold" style={{ flex: 1, textAlign: 'right' }}>{value}</Text>
    </Row>
  );
}

const storeName = (store: string | null | undefined) => (store === 'app_store' ? 'App Store' : store === 'play_store' ? 'Google Play' : store === 'test' ? tr('sub2.my.storeDemo') : store === 'promotional' ? tr('sub2.my.storePromo') : null);

/** Carte « Mon abonnement » : formule, statut, dates, prix, partage, gestion officielle, restauration, documents. */
export function MySubscriptionCard({ showDiscover = true }: { showDiscover?: boolean }) {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const ent = useEntitlement();
  const share = usePremiumShare();
  const mode = getPurchaseMode();
  const [busy, setBusy] = useState<'restore' | 'manage' | null>(null);
  const sub = ent.sub;
  const own = !!sub && sub.status !== 'none';
  const state: EntitlementState = own ? ent.state : 'free';
  const period = (sub?.period_type && sub.period_type !== 'trial' && sub.period_type !== 'lifetime' ? sub.period_type : periodOfProduct(sub?.product_id)) as PlanPeriod | null;
  const amount = sub?.price != null ? Number(sub.price) : null;
  const store = storeName(sub?.store);
  const sharedBy = share.data?.shared_by;
  const sharedWith = share.data?.shared_with;

  async function doRestore() {
    setBusy('restore');
    try {
      const ok = await purchasesSdk().restore();
      inv('subscriptions');
      toast(ok ? tr('u1.sub.restored') : tr('u1.sub.noneFound'), ok ? 'success' : 'info');
    } catch (e) {
      toast(friendlyError(e), 'error');
    } finally { setBusy(null); }
  }
  async function doManage() {
    if (mode === 'test' && !(await confirm(tr('u1.sub.stopDemoTitle'), tr('u1.sub.stopDemoBody'), tr('u1.sub.stop')))) return;
    setBusy('manage');
    try {
      const url = await purchasesSdk().manageSubscription();
      if (url) await Linking.openURL(url);
      inv('subscriptions');
      if (mode === 'test') toast(tr('u1.sub.backToFree'));
    } catch (e) {
      toast(friendlyError(e), 'error');
    } finally { setBusy(null); }
  }

  const dateRows: { label: string; value: string; id: string }[] = [];
  if (own && sub) {
    if (sub.started_at) dateRows.push({ label: tr('sub2.my.started'), value: day(sub.started_at), id: 'my-sub-started' });
    if (sub.trial_ends_at && state === 'trial') dateRows.push({ label: tr('sub2.my.trialEnds'), value: day(sub.trial_ends_at), id: 'my-sub-trial-end' });
    if (sub.expires_at) {
      const label = ent.premium ? (state === 'trial' ? tr('sub2.my.firstCharge') : ent.renews ? tr('sub2.my.renews') : tr('sub2.my.ends')) : tr('sub2.my.ended');
      dateRows.push({ label, value: day(sub.expires_at), id: 'my-sub-next' });
    } else if (ent.premium) dateRows.push({ label: tr('sub2.my.ends'), value: tr('sub2.my.lifetime'), id: 'my-sub-next' });
    if (sub.resumes_at && state === 'paused') dateRows.push({ label: tr('sub2.my.resumes'), value: day(sub.resumes_at), id: 'my-sub-resumes' });
  }

  return (
    <Card tone={ent.premium ? 'gold' : 'surface'} testID="my-subscription">
      <Row style={{ alignItems: 'flex-start' }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={ent.premium ? 'star' : 'heart'} size={18} color={t.colors.primary} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text weight="bold">{ent.premium ? tr('sub2.my.premium') : tr('sub2.my.free')}</Text>
          <StatusPill state={ent.premium && !own ? 'active' : state} />
        </View>
      </Row>
      {ent.premium || own ? (
        <Text variant="small" style={{ marginTop: spacing.xs }} testID="sub-message">
          {ent.premium && !own ? (sharedBy?.display_name ? tr('sub2.page.sharedBy', { name: sharedBy.display_name }) : tr('sub2.page.sharedAnon')) : ent.message}
        </Text>
      ) : null}
      {own ? (
        <View style={{ marginTop: spacing.xs }}>
          {period ? <Line label={tr('sub2.my.plan')} value={planTitle(period)} testID="my-sub-plan" /> : null}
          <Line label={tr('sub2.my.status')} value={tr(`sub2.status.${state}` as TKey)} testID="my-sub-status" />
          {dateRows.map((r) => <Line key={r.id} label={r.label} value={r.value} testID={r.id} />)}
          {amount != null && amount > 0 && sub?.currency ? (
            <Line label={tr('sub2.my.price')} value={tr('sub2.my.priceValue', { price: formatMoney(amount, sub.currency, localeTag()), per: period ? planPer(period) : '' }).trim()} testID="my-sub-price" />
          ) : null}
          {store ? <Line label={tr('sub2.my.store')} value={sub?.environment === 'sandbox' ? tr('sub2.my.sandbox', { store }) : store} testID="my-sub-store" /> : null}
        </View>
      ) : null}
      {sharedWith && ent.premium ? <Text variant="small" style={{ marginTop: spacing.xs }} testID="my-sub-shared-with">{tr('sub2.my.sharedWith', { name: sharedWith.display_name || tr('sub2.my.someone') })}</Text> : null}
      {ent.premium ? <Text variant="caption" muted style={{ marginTop: 2 }}>{tr('sub2.my.shareRule')}</Text> : null}
      {ent.state === 'billing_issue' || ent.state === 'grace' ? <View style={{ marginTop: spacing.xs }}><Banner tone="warning">{tr('u1.sub.updatePayment')}</Banner></View> : null}

      <View style={{ gap: spacing.xs, marginTop: spacing.sm }}>
        {!ent.premium && showDiscover ? <Button label={tr('sub2.my.discover')} icon="star" onPress={() => router.push('/settings/subscription')} testID="my-sub-discover" full /> : null}
        {own && mode !== 'unavailable' ? (
          <Button label={mode === 'test' ? tr('sub2.my.stopDemo') : tr('sub2.my.manage')} variant="secondary" icon="settings" loading={busy === 'manage'} onPress={doManage} testID="sub-manage" full />
        ) : null}
        {mode === 'unavailable' && own ? (
          <Button label={tr('sub2.my.manage')} variant="secondary" icon="external-link" onPress={() => void purchasesSdk().manageSubscription().then((url) => url && Linking.openURL(url))} testID="sub-manage-link" full />
        ) : null}
        {mode !== 'unavailable' ? <Button label={tr('sub2.my.restore')} variant="ghost" icon="refresh-cw" loading={busy === 'restore'} onPress={doRestore} testID="sub-restore" full /> : null}
        {own ? <Text variant="caption" muted>{tr('sub2.my.manageHint')}</Text> : null}
      </View>
      <Row wrap style={{ marginTop: spacing.xs }} testID="sub-legal-links">
        <LegalLink doc="terms">{tr('sub2.my.terms')}</LegalLink>
        <LegalLink doc="privacy">{tr('sub2.my.privacy')}</LegalLink>
      </Row>
    </Card>
  );
}

/** Rubrique « MON ABONNEMENT » du profil. */
export function MySubscriptionSection() {
  return (
    <View testID="my-subscription-section" style={{ gap: spacing.sm }}>
      <SectionTitle title={tr('sub2.my.title')} />
      <MySubscriptionCard />
    </View>
  );
}

/** Bandeau du web : pas d'achat intégré sur le web. */
export function WebPurchaseNotice() {
  return <Banner tone="info" icon="smartphone" title={tr('sub2.web.title')}>{tr('sub2.web.body')}</Banner>;
}

