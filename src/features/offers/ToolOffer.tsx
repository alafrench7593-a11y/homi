/**
 * Outils « à vie » (offres du 07/11/2026) : bandeau affiché en haut des 10 outils payants.
 *  - pendant le mois gratuit : discret, « encore N jours, puis {prix} à vie » ;
 *  - après, sans achat : les données restent consultables, l'ajout est réservé → bouton d'achat à vie et lien Premium.
 * Prix : celui de la boutique (jamais inventé) ; démonstration : grille de démonstration signalée comme telle.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/Overlays';
import { Banner, Button, Card, Row, Text } from '@/components/ui';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useAccess, useToolAccess } from '@/lib/data/hooks-access';
import { AI_ENTITLEMENT, AI_MONTHLY_QUESTIONS, AI_PRODUCT_ID, DEMO_OFFER_PRICES, PAID_TOOLS, toolEntitlement, toolProductId, type PaidTool } from '@/lib/premium/offers';
import { getPurchaseMode, purchasesSdk } from '@/lib/purchaseMode';
import { formatNumber, t as tr, type TKey } from '@/i18n';
import { spacing } from '@/theme/tokens';

/** Prix réel d'un produit de la boutique ; démonstration : grille de démonstration ; sinon null (aucun prix inventé). */
export function useOfferPrice(productId: string, demoAmount: number): { price: string | null; demo: boolean } {
  const mode = getPurchaseMode();
  const q = useQuery({
    queryKey: ['offer-price', productId, mode],
    queryFn: async () => (mode === 'store' ? (await purchasesSdk().getOfferPrices([productId]))[productId] ?? null : null),
    enabled: mode === 'store',
    staleTime: 3600_000,
  });
  if (mode === 'test') return { price: formatNumber(demoAmount, { style: 'currency', currency: 'EUR' }), demo: true };
  return { price: q.data ?? null, demo: false };
}

export function useBuyOffer() {
  const toast = useToast();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  async function buy(productId: string, entitlement: string, kind: 'subscription' | 'lifetime') {
    if (getPurchaseMode() === 'unavailable') return toast(tr('offer.webOnly'), 'info');
    setBusy(true);
    try {
      const r = await purchasesSdk().purchaseOffer(productId, entitlement, kind);
      await qc.invalidateQueries({ predicate: (q) => q.queryKey.includes('access') || q.queryKey.includes('plan_limits') || q.queryKey.includes('assistant_usage') });
      if (r === 'confirmed') toast(kind === 'subscription' ? tr('offer.aiThanks') : tr('offer.toolThanks'));
      else if (r === 'pending') toast(tr('offer.pending'), 'info');
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(false); }
  }
  return { buy, busy };
}

export function ToolAccessBanner({ tool, label }: { tool: PaidTool; label?: string }) {
  const a = useToolAccess(tool);
  const { price, demo } = useOfferPrice(toolProductId(tool), DEMO_OFFER_PRICES.tool);
  const { buy, busy } = useBuyOffer();
  if (!a.paid || a.loading || a.premium || a.owned) return null;
  const name = label ?? tr(`tool.${tool}` as TKey);
  const buyLabel = price ? tr('offer.keepFor', { price }) : tr('offer.keep');
  if (a.allowed && a.inTrial) {
    return (
      <Card tone="soft" testID="tool-offer-trial">
        <Text variant="small">{tr('offer.trialLeft', { count: a.trialDaysLeft, price: price ?? tr('offer.smallPrice') })}</Text>
        <Row style={{ marginTop: spacing.xs }}>
          <Button label={buyLabel} size="sm" variant="secondary" loading={busy} onPress={() => void buy(toolProductId(tool), toolEntitlement(tool), 'lifetime')} testID="tool-offer-buy" />
        </Row>
        {demo ? <Text variant="caption" muted>{tr('offer.demo')}</Text> : null}
      </Card>
    );
  }
  if (a.allowed) return null;
  return (
    <Card tone="gold" testID="tool-offer-locked">
      <Text weight="bold">{tr('offer.lockedTitle', { name })}</Text>
      <Text variant="small">{tr('offer.lockedBody')}</Text>
      <Button label={buyLabel} icon="unlock" loading={busy} style={{ marginTop: spacing.sm }} onPress={() => void buy(toolProductId(tool), toolEntitlement(tool), 'lifetime')} testID="tool-offer-buy" />
      <Button label={tr('offer.orPremium')} size="sm" variant="ghost" onPress={() => router.push('/settings/subscription')} />
      {demo ? <Text variant="caption" muted>{tr('offer.demo')}</Text> : null}
    </Card>
  );
}

/** Rappel affiché quand l'ajout est refusé par le serveur (essai terminé). */
export function LockedNotice() {
  return <Banner tone="info" icon="lock">{tr('offer.lockedBody')}</Banner>;
}

/** Écran Abonnement : offre « Assistant IA » (5 €/mois, 250 questions, mois offert par la boutique). */
export function AiOfferCard() {
  const q = useAccess();
  const { price, demo } = useOfferPrice(AI_PRODUCT_ID, DEMO_OFFER_PRICES.ai);
  const { buy, busy } = useBuyOffer();
  const a = q.data;
  return (
    <Card tone="lavender" testID="offer-ai">
      <Text weight="bold">{tr('offer.aiTitle')}</Text>
      <Text variant="small">{tr('offer.aiBody', { count: AI_MONTHLY_QUESTIONS })}</Text>
      <Text variant="small" muted style={{ marginTop: 4 }}>{tr('offer.aiLocalFree')}</Text>
      {a?.premium ? <Text variant="small" weight="bold" style={{ marginTop: spacing.xs }}>{tr('offer.aiInPremium')}</Text>
        : a?.ai ? <Text variant="small" weight="bold" style={{ marginTop: spacing.xs }} testID="offer-ai-active">{tr('offer.aiActive')}</Text>
          : (
            <>
              <Button label={price ? tr('offer.aiCta', { price }) : tr('offer.aiCtaNoPrice')} icon="message-circle" loading={busy} style={{ marginTop: spacing.sm }}
                onPress={() => void buy(AI_PRODUCT_ID, AI_ENTITLEMENT, 'subscription')} testID="offer-ai-buy" />
              <Text variant="caption" muted>{tr('offer.aiTerms')}</Text>
            </>
          )}
      {demo ? <Text variant="caption" muted>{tr('offer.demo')}</Text> : null}
    </Card>
  );
}

function ToolRow({ tool, owned, allowed }: { tool: PaidTool; owned: boolean; allowed: boolean }) {
  const { price } = useOfferPrice(toolProductId(tool), DEMO_OFFER_PRICES.tool);
  const { buy, busy } = useBuyOffer();
  return (
    <Row style={{ paddingVertical: 6 }} testID={`offer-tool-${tool}`}>
      <View style={{ flex: 1 }}>
        <Text weight="medium">{tr(`tool.${tool}` as TKey)}</Text>
        <Text variant="caption" muted>{owned ? tr('offer.owned') : allowed ? tr('offer.openNow') : tr('offer.readOnly')}</Text>
      </View>
      {owned ? null : <Button label={price ?? tr('offer.keep')} size="sm" variant="secondary" loading={busy} onPress={() => void buy(toolProductId(tool), toolEntitlement(tool), 'lifetime')} testID={`offer-tool-buy-${tool}`} />}
    </Row>
  );
}

/** Écran Abonnement : les 10 outils à vie, avec l'état de chacun. */
export function ToolOffersCard() {
  const q = useAccess();
  const a = q.data;
  if (a?.premium) return <Card tone="soft"><Text variant="small">{tr('offer.toolsInPremium')}</Text></Card>;
  const until = a?.trial_until ? Date.parse(a.trial_until) : NaN;
  const left = Number.isFinite(until) ? Math.max(0, Math.ceil((until - Date.now()) / 86_400_000)) : 0;
  return (
    <Card testID="offer-tools">
      <Text variant="small">{left > 0 ? tr('offer.toolsTrial', { count: left }) : tr('offer.toolsAfter')}</Text>
      {PAID_TOOLS.map((k) => {
        const x = a?.tools.find((t) => t.key === k);
        return <ToolRow key={k} tool={k} owned={!!x?.owned} allowed={x ? x.allowed : true} />;
      })}
    </Card>
  );
}
