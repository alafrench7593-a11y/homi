/**
 * Crédits HOMI Aura — briques d'affichage partagées par l'écran « Mes crédits », la feuille « Vous n'avez plus de
 * crédits » et la page d'abonnement : carte du solde, liste des packs aux prix de la boutique, règles.
 * Aucun prix écrit en dur (boutique, ou grille de démonstration signalée) ; jamais le contenu d'une question.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { router } from 'expo-router';
import { Banner, Button, Card, Icon, Loading, Text, type IconName } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing, radius } from '@/theme/tokens';
import { formatDate, formatNumber, t as tr } from '@/i18n';
import { aiAssistantOnline } from '@/config/features';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useCreditPacks, useRefreshCredits } from '@/lib/data/hooks-credits';
import { DEFAULT_GRANTS, totalRemaining, usageLevel, usagePercent, type CreditConfig, type CreditStatus, type UsageGroup } from '@/lib/credits/model';
import { useReduceMotion } from '@/theme/ThemeProvider';
import { getPurchaseMode, purchasesSdk, type PackChoice } from '@/lib/purchaseMode';
import { PurchaseError } from '@/lib/premium/purchaseErrors';
import { errorFeedback } from '@/features/premium/paywallModel';
import { motionHaptic } from '@/motion';

const day = (iso: string | null | undefined) => (iso ? formatDate(iso, { day: 'numeric', month: 'long' }) : null);

function Stat({ label, value, testID }: { label: string; value: string; testID: string }) {
  const th = useTheme();
  return (
    <View style={{ flexGrow: 1, flexBasis: 120, minWidth: 0, padding: spacing.sm, borderRadius: radius.md, backgroundColor: th.colors.surfaceAlt }} testID={testID}>
      <Text variant="caption" muted>{label}</Text>
      <Text weight="bold" style={{ marginTop: 2 }}>{value}</Text>
    </View>
  );
}

/** Solde : total, mensuels restants, achetés restants, utilisés ce mois-ci, prochain renouvellement. */
export function CreditBalanceCard({ status }: { status: CreditStatus }) {
  const total = totalRemaining(status);
  const renewal = day(status.next_renewal);
  const shared = status.holder_kind === 'household' ? tr('cr.balance.sharedFamily')
    : status.payer_is_me === false ? tr('cr.balance.sharedBy')
    : status.subscribed ? tr('cr.balance.sharedPremium') : null;
  return (
    <Card tone="soft" testID="credits-balance">
      <View
        accessible
        accessibilityLabel={tr('cr.balance.a11y', { total, monthly: status.monthly_remaining, purchased: status.purchased_remaining, used: status.used_this_period })}
        style={{ gap: spacing.sm }}
      >
        <Text variant="caption" weight="bold" muted>{tr('cr.balance.title')}</Text>
        <UsageBar status={status} />
        <Text variant="small" weight="medium" testID="credits-total">{tr('cr.balance.total', { count: total })}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
          <Stat label={tr('cr.balance.monthly')} value={formatNumber(status.monthly_remaining)} testID="credits-monthly" />
          <Stat label={tr('cr.balance.purchased')} value={formatNumber(status.purchased_remaining)} testID="credits-purchased" />
          <Stat label={tr('cr.balance.used')} value={formatNumber(status.used_this_period)} testID="credits-used" />
        </View>
        <View testID="credits-renewal">
          <Text variant="caption" muted>{tr('cr.balance.renewal')}</Text>
          <Text variant="small" weight="medium">
            {renewal && status.subscribed ? tr('cr.balance.renewalValue', { date: renewal, count: status.monthly_allowance }) : tr('cr.balance.noRenewal')}
          </Text>
        </View>
        {shared ? <Text variant="caption" muted>{shared}</Text> : null}
      </View>
    </Card>
  );
}

function Rule({ icon, text }: { icon: IconName; text: string }) {
  const th = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'flex-start' }} accessible accessibilityLabel={text}>
      <View style={{ paddingTop: 2 }}><Icon name={icon} size={15} color={th.colors.textMuted} /></View>
      <Text variant="small" style={{ flex: 1 }}>{text}</Text>
    </View>
  );
}

/** Règles en clair (mêmes règles que le serveur : docs/CREDITS_IA.md). */
export function CreditRules() {
  return (
    <Card testID="credits-rules">
      <View style={{ gap: spacing.xs }}>
        <Text weight="bold" accessibilityRole="header">{tr('cr.rules.title')}</Text>
        <Rule icon="calendar" text={tr('cr.rules.monthly')} />
        <Rule icon="archive" text={tr('cr.rules.purchased')} />
        <Rule icon="tag" text={tr('cr.rules.cost')} />
        <Rule icon="rotate-ccw" text={tr('cr.rules.failed')} />
        <Rule icon="life-buoy" text={tr('cr.rules.safety')} />
        <Rule icon="smartphone" text={tr('cr.rules.restore')} />
        {!aiAssistantOnline() ? <Rule icon="clock" text={tr('cr.rules.soon')} /> : null}
      </View>
    </Card>
  );
}

/** Sans abonnement : aucun crédit (Premium strict) ; renvoi vers les abonnements. */
export function NoSubscriptionCredits({ config }: { config: CreditConfig | null | undefined }) {
  return (
    <Card tone="gold" testID="credits-nosub">
      <Text weight="bold">{tr('cr.noSub.title')}</Text>
      <Text variant="small" style={{ marginTop: 4 }}>
        {tr('cr.noSub.body', { premium: config?.grants.premium ?? DEFAULT_GRANTS.premium, family: config?.grants.family ?? DEFAULT_GRANTS.family })}
      </Text>
      <Button label={tr('cr.noSub.cta')} icon="star" style={{ marginTop: spacing.sm }} onPress={() => router.push('/settings/subscription')} testID="credits-nosub-cta" />
    </Card>
  );
}

/**
 * Les 3 packs aux prix de la boutique ; achat via RevenueCat (faux magasin en démonstration). Seulement avec un
 * abonnement actif (Premium strict). Après l'achat, le solde est relu sur le serveur.
 */
export function PackList({ subscribed, onBought }: { subscribed: boolean; onBought?: (credits: number) => void }) {
  const packs = useCreditPacks();
  const refresh = useRefreshCredits();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const mode = getPurchaseMode();

  async function buy(p: PackChoice) {
    if (busy) return;
    setBusy(p.id);
    try {
      const out = await purchasesSdk().purchaseCreditPack(p);
      await refresh();
      if (out === 'confirmed') {
        motionHaptic('success');
        toast(tr('cr.packs.thanks', { count: p.credits }), 'success');
        onBought?.(p.credits);
      } else if (out === 'pending') toast(tr('cr.packs.pending'), 'info');
      else if (out === 'deferred') toast(tr('cr.packs.deferred'), 'info');
    } catch (e) {
      if (e instanceof PurchaseError) toast(errorFeedback(e.kind).text, e.kind === 'unknown' ? 'error' : 'info');
      else toast(friendlyError(e, tr('pay2.err.unknown')), 'error');
    } finally {
      setBusy(null);
    }
  }

  if (!subscribed) return <Banner tone="info" title={tr('cr.packs.needSub')} />;
  if (mode === 'unavailable') return <Banner tone="info">{tr('cr.packs.unavailable')}</Banner>;
  if (packs.isLoading) return <Loading />;
  const list = packs.data ?? [];
  if (!list.length) return <Banner tone="info">{tr('cr.packs.unavailable')}</Banner>;
  return (
    <View style={{ gap: spacing.xs }} testID="credits-packs">
      {list.map((p) => (
        <Card key={p.id} testID={`pack-${p.id}`}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}>
            <View style={{ flex: 1, minWidth: 120 }}>
              <Text weight="bold">{tr('cr.packs.item', { count: p.credits })}</Text>
            </View>
            <Button
              label={p.price}
              icon="shopping-bag"
              size="sm"
              loading={busy === p.id}
              disabled={!!busy}
              accessibilityLabel={tr('cr.packs.buyA11y', { count: p.credits, price: p.price })}
              onPress={() => void buy(p)}
              testID={`pack-buy-${p.id}`}
            />
          </View>
        </Card>
      ))}
      <Text variant="caption" muted>{tr('cr.packs.oneTime')}</Text>
      {list.some((p) => p.demo) ? <Text variant="caption" muted testID="credits-packs-demo">{tr('cr.packs.demo')}</Text> : null}
    </View>
  );
}

/**
 * Barre d'utilisation Aura (25/11/2026) : pourcentage de la capacité mensuelle utilisé, valeur du SERVEUR.
 * Animée une fois à l'ouverture (rien avec Réduire les animations).
 */
export function UsageBar({ status, compact }: { status: CreditStatus; compact?: boolean }) {
  const th = useTheme();
  const reduce = useReduceMotion();
  const pct = usagePercent(status);
  const level = usageLevel(status);
  const w = useRef(new Animated.Value(reduce ? (pct ?? 0) : 0)).current;
  useEffect(() => {
    if (pct == null) return;
    if (reduce) { w.setValue(pct); return; }
    Animated.timing(w, { toValue: pct, duration: 650, useNativeDriver: false }).start();
  }, [pct, reduce, w]);
  if (pct == null) return null;
  const fill = level === 'full' || level === 'almost' ? th.colors.danger : level === 'high' ? th.colors.warning : th.colors.primary;
  const h = compact ? 6 : 12;
  return (
    <View style={{ gap: 6 }} accessible accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: pct }}
      accessibilityLabel={tr('cr.usage.a11y', { used: pct, left: 100 - pct })} testID="credits-usage">
      {!compact ? (
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <Text variant="heading" testID="credits-usage-pct">{tr('cr.usage.used', { pct })}</Text>
          <Text variant="small" muted>{tr('cr.usage.left', { pct: 100 - pct })}</Text>
        </View>
      ) : null}
      <View style={{ height: h, borderRadius: h / 2, backgroundColor: th.colors.border, overflow: 'hidden' }}>
        <Animated.View style={{ height: h, borderRadius: h / 2, backgroundColor: fill, width: w.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }} />
      </View>
    </View>
  );
}

/** Information discrète aux seuils 75 / 90 / 100 % ; HOMI reste utilisable sans IA. */
export function UsageNotice({ status, onAdd }: { status: CreditStatus; onAdd?: () => void }) {
  const level = usageLevel(status);
  if (level === 'ok') return null;
  return (
    <View testID={`credits-notice-${level}`}>
    <Banner tone={level === 'high' ? 'info' : 'warning'}
      action={onAdd && level !== 'high' ? <Button label={tr('cr.usage.add')} size="sm" variant="secondary" onPress={onAdd} testID="credits-notice-add" /> : undefined}>
      {tr(level === 'high' ? 'cr.usage.n75' : level === 'almost' ? 'cr.usage.n90' : 'cr.usage.n100', { pct: usagePercent(status) ?? 0 })}
    </Banner>
    </View>
  );
}

const GROUP_ICON: Record<UsageGroup, IconName> = { assist: 'message-circle', analysis: 'bar-chart-2', summary: 'file-text', documents: 'camera', other: 'star' };
/** Répartition de l'utilisation (catégories lisibles, sans détails techniques). */
export function UsageBreakdown({ items }: { items: { group: UsageGroup; used: number }[] }) {
  const th = useTheme();
  if (!items.length) return null;
  const total = items.reduce((a, b) => a + b.used, 0) || 1;
  return (
    <Card testID="credits-breakdown">
      <View style={{ gap: spacing.sm }}>
        {items.map((x) => (
          <View key={x.group} style={{ gap: 4 }} accessible accessibilityLabel={`${tr(`cr.group.${x.group}` as never)} ${Math.round((x.used / total) * 100)} %`}>
            <View style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'center' }}>
              <Icon name={GROUP_ICON[x.group]} size={15} color={th.colors.textMuted} />
              <Text variant="small" style={{ flex: 1 }}>{tr(`cr.group.${x.group}` as never)}</Text>
              <Text variant="small" weight="bold">{Math.round((x.used / total) * 100)} %</Text>
            </View>
            <View style={{ height: 4, borderRadius: 2, backgroundColor: th.colors.border, overflow: 'hidden' }}>
              <View style={{ height: 4, width: `${(x.used / total) * 100}%`, backgroundColor: th.colors.primary }} />
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}
