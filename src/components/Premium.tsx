/**
 * Présentation du Premium au moment où l'utilisatrice essaie réellement une fonction : APERÇU RÉEL du bénéfice
 * (calculé avec ses propres données), ce qui reste gratuit, puis les 3 formules (prix de la boutique) et un accès
 * direct à la souscription (page Premium, formule déjà choisie, conditions complètes avant tout achat).
 * Aucun compte à rebours, aucune pression : « Plus tard » ferme simplement l'aperçu.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Sheet } from './Overlays';
import { Button, Card, Icon, Row, Text } from './ui';
import { usePremiumSheet, quotaResetLabel, usePremiumAccess } from '@/lib/data/hooks-premium';
import { FEATURES, featureTitle, type PremiumFeature } from '@/lib/premium/features';
import type { PlanPeriod } from '@/lib/premium/plans';
import { PlanCards, planTitle, usePlans, webWithoutPurchase } from '@/features/subscription';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

export function PremiumPreviewHost() {
  const t = useTheme();
  const open = usePremiumSheet((s) => s.open);
  const hide = usePremiumSheet((s) => s.hide);
  const f = open ? FEATURES[open.feature] : null;
  return (
    <Sheet visible={!!open} onClose={hide} title={open ? featureTitle(open.feature, open.name) : ''}>
      {open && f ? (
        <View style={{ gap: spacing.sm }} testID="premium-preview">
          {open.limit ? (
            <View testID="premium-limit">
              {open.limit.monthly === false ? (
                <>
                  <Text weight="bold">{tr('u1.pr.limitReached', { quota: open.limit.quota, unit: open.limit.unit })}</Text>
                  <Text variant="small" muted>{tr('u1.pr.nothingLostEditable')}</Text>
                </>
              ) : (
                <>
                  <Text weight="bold">{tr('u1.pr.usedMonth', { quota: open.limit.quota, unit: open.limit.unit })}</Text>
                  <Text variant="small" muted>{tr('u1.pr.backOn', { date: quotaResetLabel() })}</Text>
                </>
              )}
            </View>
          ) : null}
          {open.preview ? (
            <View testID="premium-preview-real" style={{ borderRadius: radius.lg, borderWidth: 1, borderColor: t.colors.border, padding: spacing.md, backgroundColor: t.colors.surfaceAlt, gap: 4 }}>
              <Text variant="caption" weight="bold" muted style={{ letterSpacing: 1.2 }}>{tr('u1.pr.previewHeader')}</Text>
              {open.preview}
            </View>
          ) : null}
          <Text>{f.benefit}</Text>
          <Card tone="soft">
            <Row style={{ alignItems: 'flex-start' }}><Icon name="check" size={16} /><Text variant="small" style={{ flex: 1 }}>{tr('u1.pr.free', { text: f.free })}</Text></Row>
            <Row style={{ alignItems: 'flex-start', marginTop: 4 }}><Icon name="star" size={16} color={t.colors.gold} /><Text variant="small" style={{ flex: 1 }}>{tr('u1.pr.premium', { text: f.premium })}</Text></Row>
          </Card>
          <SheetPlans feature={open.feature} onGo={hide} />
          <Button label={tr('u1.pr.later')} variant="ghost" onPress={hide} testID="premium-later" full />
          <Text variant="caption" muted center>{tr('u1.pr.alwaysFree')}</Text>
        </View>
      ) : null}
    </Sheet>
  );
}

/** Les 3 formules dans la feuille : choix rapide, puis la page Premium (conditions complètes) avec la formule choisie. */
function SheetPlans({ feature, onGo }: { feature: PremiumFeature; onGo: () => void }) {
  const plans = usePlans();
  const [selected, setSelected] = useState<PlanPeriod | null>(null);
  const list = plans.data ?? [];
  const pick = selected ?? list[0]?.period ?? null;
  const showPlans = !webWithoutPurchase(plans.mode) && list.length > 0;
  const go = () => { onGo(); router.push({ pathname: '/settings/subscription', params: pick && showPlans ? { feature, plan: pick } : { feature } }); };
  return (
    <View style={{ gap: spacing.sm }} testID="premium-sheet-plans">
      {showPlans ? (
        <>
          <Text variant="caption" weight="bold" muted style={{ letterSpacing: 1.2 }}>{tr('sub2.sheet.plans')}</Text>
          <PlanCards plans={list} selected={pick} onSelect={setSelected} compact />
        </>
      ) : webWithoutPurchase(plans.mode) ? <Text variant="small" muted>{tr('sub2.sheet.web')}</Text> : null}
      <Button label={showPlans && pick ? tr('sub2.sheet.continue', { plan: planTitle(pick) }) : tr('u1.pr.seePlans')} icon="star" onPress={go} testID="premium-see-plans" full />
    </View>
  );
}

/** Carte d'une fonction Premium dans un écran : un aperçu réel + « Découvrir ». Pour une abonnée, affiche le contenu. */
export function PremiumSection({ feature, name, preview, children, testID }: { feature: PremiumFeature; name?: string | null; preview?: React.ReactNode; children: React.ReactNode; testID?: string }) {
  const t = useTheme();
  const access = usePremiumAccess(feature, name);
  if (access.premium) return <>{children}</>;
  return (
    <View testID={testID ?? `premium-${feature}`}>
      <Card tone="gold" onPress={() => access.showPreview(preview)} accessibilityLabel={tr('u1.pr.a11y', { title: featureTitle(feature, name) })}>
        <Row>
          <Icon name="star" size={18} color={t.colors.gold} />
          <Text weight="bold" style={{ flex: 1 }}>{featureTitle(feature, name)}</Text>
          <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
        </Row>
        {preview ? <View style={{ marginTop: 6 }}>{preview}</View> : <Text variant="small" muted style={{ marginTop: 6 }}>{FEATURES[feature].benefit}</Text>}
      </Card>
    </View>
  );
}
