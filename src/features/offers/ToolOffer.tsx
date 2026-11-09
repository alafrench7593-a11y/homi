/**
 * Offres annexes. Depuis le 08/11/2026 (Premium strict) : plus de mois gratuit ni de vente d'outils à l'unité.
 *  - Outil réservé : bandeau « Réservé au Premium » (les données déjà notées restent consultables) ;
 *  - outils achetés à vie avant ce changement : toujours ouverts et listés sur l'écran Abonnement ;
 *  - « Assistant IA » : abonnement mensuel séparé, qui ouvre l'assistant uniquement.
 * Prix : celui de la boutique (jamais inventé) ; démonstration : grille de démonstration signalée comme telle.
 */
import React, { useState } from 'react';
import { aiAssistantOnline } from '@/config/features';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/Overlays';
import { Banner, Button, Card, Row, Text } from '@/components/ui';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useAccess, useToolAccess } from '@/lib/data/hooks-access';
import { AI_ENTITLEMENT, AI_MONTHLY_QUESTIONS, AI_PRODUCT_ID, DEMO_OFFER_PRICES, PAID_TOOLS, type PaidTool } from '@/lib/premium/offers';
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

export function ToolAccessBanner({ tool }: { tool: PaidTool; label?: string }) {
  const a = useToolAccess(tool);
  // Depuis le 08/11/2026 : plus de mois gratuit ni de vente à l'unité ; un outil déjà acheté reste ouvert à vie
  if (!a.paid || a.loading || a.premium || a.owned || a.allowed) return null;
  return (
    <Card tone="gold" testID="tool-offer-locked">
      <Text weight="bold">{tr('pw.lock.title')}</Text>
      <Text variant="small">{tr('pw.lock.body')}</Text>
      <Button label={tr('pw.lock.cta')} icon="star" style={{ marginTop: spacing.sm }} onPress={() => router.push('/settings/subscription')} testID="tool-offer-premium" />
    </Card>
  );
}

/** Rappel affiché quand l'ajout est refusé par le serveur (essai terminé). */
export function LockedNotice() {
  return <Banner tone="info" icon="lock">{tr('pw.lock.body')}</Banner>;
}

/** Écran Abonnement : offre « Assistant IA » (≈ 5 €/mois, 250 questions ; plus de mois offert depuis le 08/11/2026). */
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
      {!aiAssistantOnline() ? <Text variant="small" weight="bold" style={{ marginTop: spacing.xs }} testID="offer-ai-soon">{tr('pw.soon.offer')}</Text>
        : a?.premium ? <Text variant="small" weight="bold" style={{ marginTop: spacing.xs }}>{tr('offer.aiInPremium')}</Text>
        : a?.ai ? <Text variant="small" weight="bold" style={{ marginTop: spacing.xs }} testID="offer-ai-active">{tr('offer.aiActive')}</Text>
          : (
            <>
              <Button label={price ? tr('pw.aiCta', { price }) : tr('offer.aiCtaNoPrice')} icon="message-circle" loading={busy} style={{ marginTop: spacing.sm }}
                onPress={() => void buy(AI_PRODUCT_ID, AI_ENTITLEMENT, 'subscription')} testID="offer-ai-buy" />
              <Text variant="caption" muted>{tr('pw.aiTerms')}</Text>
            </>
          )}
      {demo ? <Text variant="caption" muted>{tr('offer.demo')}</Text> : null}
    </Card>
  );
}

/** Écran Abonnement : les outils achetés à vie avant le 08/11/2026 (aucune vente : ils restent simplement à vous). */
export function ToolOffersCard() {
  const q = useAccess();
  const owned = (q.data?.tools ?? []).filter((t) => t.owned && (PAID_TOOLS as readonly string[]).includes(t.key));
  if (!owned.length) return null;
  return (
    <Card testID="offer-tools">
      <Text weight="bold">{tr('pw.ownedTools')}</Text>
      <Text variant="small" muted>{tr('pw.ownedToolsBody')}</Text>
      {owned.map((t) => (
        <Row key={t.key} style={{ paddingVertical: 6 }} testID={`offer-tool-${t.key}`}>
          <Text weight="medium" style={{ flex: 1 }}>{tr(`tool.${t.key}` as TKey)}</Text>
          <Text variant="caption" muted>{tr('offer.owned')}</Text>
        </Row>
      ))}
    </Card>
  );
}
