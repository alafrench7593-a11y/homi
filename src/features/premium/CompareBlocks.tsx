/**
 * Comparatif de la page d'abonnement : trois cartes compactes — « Sans abonnement », « HOMI Premium » (par besoin :
 * moi, mon enfant, ma famille, mes outils), « En famille ». Le contenu vient de offerModel.ts (chaque ligne y est
 * reliée au code qui la rend vraie). Cartes et jetons existants (`Card`, `useTheme`) : passer au verre plus tard
 * revient à changer la surface de `Block`, rien d'autre.
 * Accessibilité : chaque carte a un titre (rôle « en-tête »), chaque ligne est lue d'un seul tenant.
 * Mouvement : apparition en cascade courte (Cascade : visible d'emblée avec Réduire les animations).
 */
import React from 'react';
import { View } from 'react-native';
import { Card, Icon, Text, type IconName } from '@/components/ui';
import { Cascade } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';
import { FAMILY_ITEMS, FREE_ITEMS, PREMIUM_GROUPS } from './offerModel';

function Block({ title, icon, tone, accent, testID, children }: { title: string; icon: IconName; tone: 'surface' | 'soft'; accent?: boolean; testID: string; children: React.ReactNode }) {
  const th = useTheme();
  return (
    <Card tone={tone} testID={testID}>
      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: accent ? th.colors.accentSoft : th.colors.surfaceAlt }}>
            <Icon name={icon} size={15} color={accent ? th.colors.primary : th.colors.textMuted} />
          </View>
          <Text weight="bold" style={{ flex: 1 }} accessibilityRole="header">{title}</Text>
        </View>
        {children}
      </View>
    </Card>
  );
}

function Line({ icon, text, color }: { icon: IconName; text: string; color: string }) {
  return (
    <View accessible accessibilityLabel={text} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs }}>
      <View style={{ paddingTop: 2 }}><Icon name={icon} size={15} color={color} /></View>
      <Text variant="small" style={{ flex: 1 }}>{text}</Text>
    </View>
  );
}

/** « Sans abonnement » : la liste réelle de ce qui s'ouvre sans Premium. */
export function FreeBlock() {
  const th = useTheme();
  return (
    <Block title={tr('sub3.free.title')} icon="unlock" tone="soft" testID="sub3-free">
      <View accessibilityRole="list" style={{ gap: 6 }}>
        {FREE_ITEMS.map((it) => <Line key={it.key} icon={it.icon} text={tr(it.key)} color={th.colors.textMuted} />)}
      </View>
      <Text variant="caption" muted>{tr('sub3.free.rest')}</Text>
    </Block>
  );
}

/** « HOMI Premium » : ce que l'abonnement ouvre, groupé par besoin. */
export function PremiumBlock() {
  const th = useTheme();
  return (
    <Block title={tr('sub3.prem.title')} icon="star" tone="surface" accent testID="sub3-premium">
      <View accessibilityRole="list" style={{ gap: spacing.xs }}>
        {PREMIUM_GROUPS.map((g) => (
          <View key={g.key} accessible accessibilityLabel={`${tr(g.title)}. ${tr(g.text)}`} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs }} testID={`sub3-premium-${g.key}`}>
            <View style={{ paddingTop: 2 }}><Icon name={g.icon} size={15} color={th.colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text variant="small" weight="bold">{tr(g.title)}</Text>
              <Text variant="small" muted>{tr(g.text)}</Text>
            </View>
          </View>
        ))}
      </View>
      <Text variant="caption" muted>{tr('sub3.prem.same')}</Text>
    </Block>
  );
}

/** « En famille » : le second adulte inclus sans surcoût, ce que peut faire une nounou invitée. */
export function FamilyBlock() {
  const th = useTheme();
  return (
    <Block title={tr('sub3.fam.title')} icon="users" tone="surface" accent testID="sub3-family">
      <View accessibilityRole="list" style={{ gap: 6 }}>
        {FAMILY_ITEMS.map((it) => <Line key={it.key} icon={it.icon} text={tr(it.key)} color={th.colors.primary} />)}
      </View>
    </Block>
  );
}

/** Les trois blocs, dans l'ordre : sans abonnement, Premium, en famille (`free={false}` : vue abonné). */
export function CompareBlocks({ free = true, startIndex = 1 }: { free?: boolean; startIndex?: number }) {
  const blocks = [free ? <FreeBlock key="free" /> : null, <PremiumBlock key="premium" />, <FamilyBlock key="family" />].filter(Boolean);
  return (
    <View style={{ gap: spacing.sm }} testID="sub3-compare">
      {blocks.map((b, i) => <Cascade key={i} index={startIndex + i}>{b}</Cascade>)}
    </View>
  );
}
