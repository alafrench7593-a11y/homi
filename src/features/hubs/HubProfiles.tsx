/**
 * Sélecteur de profil des onglets hub (v5) : une rangée de CAPSULES (filtres) — Moi, Ma grossesse, chaque enfant,
 * Toute la famille — choix en un geste, profil affiché en aplat de l'action (coche implicite + gras, pas la
 * couleur seule : rôle « case à cocher » cochée). « + » (Ajouter un profil) ouvre les parcours. Les capsules passent à la ligne
 * (aucun profil caché dans un défilement horizontal), cibles ≥ 48 px (Chip).
 * Même liste et même ordre que `ProfileSwitcher` (components/Family), qui reste utilisé à l'accueil.
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Chip, haptic, Icon, Text } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { useTheme } from '@/theme/ThemeProvider';
import { useActivePregnancy, useActiveSubject, useTrackedChildren } from '@/lib/data/hooks';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

export function HubProfiles({ hub }: { hub: string }) {
  const t = useTheme();
  const { subject, setSubject } = useActiveSubject();
  const pregnancy = useActivePregnancy();
  const { data: children } = useTrackedChildren();
  const items: { key: string; label: string; active: boolean; onPress: () => void }[] = [
    { key: 'me', label: tr('pj.subject.me'), active: subject.type === 'me', onPress: () => setSubject({ type: 'me' }) },
  ];
  if (pregnancy) items.push({ key: 'preg', label: tr('pj.subject.pregnancy'), active: subject.type === 'pregnancy', onPress: () => setSubject({ type: 'pregnancy', id: pregnancy.id }) });
  for (const c of children ?? []) items.push({ key: c.id, label: c.first_name, active: subject.type === 'child' && subject.id === c.id, onPress: () => setSubject({ type: 'child', id: c.id }) });
  if ((children?.length ?? 0) + (pregnancy ? 1 : 0) > 1) items.push({ key: 'family', label: tr('pj.subject.family'), active: subject.type === 'family', onPress: () => setSubject({ type: 'family' }) });
  if (!items.some((i) => i.active)) items[0].active = true;

  return (
    <View style={{ gap: spacing.xs }} accessibilityLabel={tr('pj.tools.scopeA11y')} testID={`hub-${hub}-profiles`}>
      <Text variant="label" muted style={{ paddingHorizontal: spacing.xxs }}>{tr('h5.hub.for')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
        {items.map((it) => (
          <Chip key={it.key} label={it.label} selected={it.active} testID={`hub-subject-${it.key}`}
            accessibilityLabel={tr('h5.hub.profileA11y', { name: it.label })} onPress={() => { if (!it.active) it.onPress(); }} />
        ))}
        {/* « Ajouter un profil » : bouton compact (44 × 44, contour) pour rester sur la ligne des capsules */}
        <Tappable accessibilityRole="button" accessibilityLabel={tr('pj.switcher.add')} testID={`hub-${hub}-add-profile`} onPress={() => { haptic('selection'); router.push('/journeys'); }}
          hitSlop={2} style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: t.colors.border,
            backgroundColor: pressed ? t.colors.surfaceAlt : 'transparent' })}>
          <Icon name="plus" size={18} color={t.colors.primary} />
        </Tappable>
      </View>
    </View>
  );
}
