/**
 * Présentation du Premium au moment où l'utilisatrice essaie réellement une fonction : APERÇU RÉEL du bénéfice
 * (calculé avec ses propres données), ce qui reste gratuit, puis seulement ensuite les formules.
 * Aucun compte à rebours, aucune pression : « Plus tard » ferme simplement l'aperçu.
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Sheet } from './Overlays';
import { Button, Card, Icon, Row, Text } from './ui';
import { usePremiumSheet, quotaResetLabel, usePremiumAccess } from '@/lib/data/hooks-premium';
import { FEATURES, featureTitle, type PremiumFeature } from '@/lib/premium/features';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

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
                  <Text weight="bold">{`Limite de la version gratuite atteinte : ${open.limit.quota} ${open.limit.unit}.`}</Text>
                  <Text variant="small" muted>Rien de ce que vous avez déjà enregistré n’est perdu : tout reste consultable et modifiable.</Text>
                </>
              ) : (
                <>
                  <Text weight="bold">{`Vous avez utilisé vos ${open.limit.quota} ${open.limit.unit} gratuites de ce mois.`}</Text>
                  <Text variant="small" muted>{`Elles reviennent le ${quotaResetLabel()}. Rien de ce que vous avez déjà enregistré n’est perdu.`}</Text>
                </>
              )}
            </View>
          ) : null}
          {open.preview ? (
            <View testID="premium-preview-real" style={{ borderRadius: radius.lg, borderWidth: 1, borderColor: t.colors.border, padding: spacing.md, backgroundColor: t.colors.surfaceAlt, gap: 4 }}>
              <Text variant="caption" weight="bold" muted style={{ letterSpacing: 1.2 }}>APERÇU AVEC VOS DONNÉES</Text>
              {open.preview}
            </View>
          ) : null}
          <Text>{f.benefit}</Text>
          <Card tone="soft">
            <Row style={{ alignItems: 'flex-start' }}><Icon name="check" size={16} /><Text variant="small" style={{ flex: 1 }}>{`Gratuit : ${f.free}`}</Text></Row>
            <Row style={{ alignItems: 'flex-start', marginTop: 4 }}><Icon name="star" size={16} color={t.colors.gold} /><Text variant="small" style={{ flex: 1 }}>{`Premium : ${f.premium}`}</Text></Row>
          </Card>
          <Button label="Voir les formules" icon="star" onPress={() => { hide(); router.push({ pathname: '/settings/subscription', params: { feature: open.feature } }); }} testID="premium-see-plans" full />
          <Button label="Plus tard" variant="ghost" onPress={hide} testID="premium-later" full />
          <Text variant="caption" muted center>Urgences, ressources post-partum, alertes de rappel de produits et vos données restent toujours accessibles gratuitement.</Text>
        </View>
      ) : null}
    </Sheet>
  );
}

/** Carte d'une fonction Premium dans un écran : un aperçu réel + « Découvrir ». Pour une abonnée, affiche le contenu. */
export function PremiumSection({ feature, name, preview, children, testID }: { feature: PremiumFeature; name?: string | null; preview?: React.ReactNode; children: React.ReactNode; testID?: string }) {
  const t = useTheme();
  const access = usePremiumAccess(feature, name);
  if (access.premium) return <>{children}</>;
  return (
    <View testID={testID ?? `premium-${feature}`}>
      <Card tone="gold" onPress={() => access.showPreview(preview)} accessibilityLabel={`${featureTitle(feature, name)} : aperçu Premium`}>
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
