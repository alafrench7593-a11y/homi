/**
 * Accès aux outils Premium (Premium strict depuis le 08/11/2026) : bandeau « Réservé au Premium » sur un outil réservé
 * (les données déjà notées restent consultables).
 *
 * Offres héritées (26/11/2026, docs/CREDITS_IA.md § Offres héritées) : l'abonnement « Assistant IA »
 * (aufildenous_ai_monthly) et les outils à vie (aufildenous_tool_*) sont RETIRÉS de toute interface et ne sont plus
 * vendus (purchaseOffer refuse tout achat). Les données sont conservées : un droit déjà acheté reste honoré par le
 * serveur (entitlement_grants, paid_tools, my_access) — un outil acheté à vie reste ouvert, sans être mis en avant.
 */
import React from 'react';
import { router } from 'expo-router';
import { Banner, Button, Card, Text } from '@/components/ui';
import { useToolAccess } from '@/lib/data/hooks-access';
import type { PaidTool } from '@/lib/premium/offers';
import { t as tr } from '@/i18n';
import { spacing } from '@/theme/tokens';

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
