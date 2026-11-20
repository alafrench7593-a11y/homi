/**
 * Crédits HOMI Aura — briques d'affichage partagées par l'écran « Mes crédits », la feuille « Vous n'avez plus de
 * crédits » et la page d'abonnement : carte du solde, liste des packs aux prix de la boutique, règles.
 * Aucun prix écrit en dur (boutique, ou grille de démonstration signalée) ; jamais le contenu d'une question.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Banner, Button, Card, Icon, Loading, Text, type IconName } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing, radius } from '@/theme/tokens';
import { formatDate, formatNumber, t as tr } from '@/i18n';
import { aiAssistantOnline } from '@/config/features';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useCreditPacks, useRefreshCredits } from '@/lib/data/hooks-credits';
import { DEFAULT_GRANTS, totalRemaining, type CreditConfig, type CreditStatus } from '@/lib/credits/model';
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
        <Text variant="heading" testID="credits-total">{tr('cr.balance.total', { count: total })}</Text>
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
