/**
 * Choix de l'enfant affiché par les widgets iOS (réglage de CET appareil, effacé au changement de compte).
 * « Comme l'accueil » = comportement par défaut (enfant de l'accueil, sinon profil actif, sinon le premier).
 * À placer dans Réglages › Notifications › Widgets ; n'apparaît que s'il y a au moins deux enfants suivis.
 */
import React from 'react';
import { View } from 'react-native';
import { Chip, Text } from '@/components/ui';
import { t as tr } from '@/i18n';
import { useTrackedChildren } from '@/lib/data/hooks';
import { useUiStore } from '@/lib/store';
import { spacing } from '@/theme/tokens';
import { refreshWidgets } from './push';

export function WidgetChildPicker() {
  const { data: children } = useTrackedChildren();
  const value = useUiStore((s) => s.widgetChildId);
  const setValue = useUiStore((s) => s.setWidgetChildId);
  const list = children ?? [];
  if (list.length < 2) return null;
  const pick = (id: string | null) => { setValue(id); refreshWidgets(); };
  return (
    <View style={{ gap: spacing.xs }} testID="widget-child-picker">
      <Text variant="small" weight="bold">{tr('wg.set.child')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
        <Chip label={tr('wg.set.childAuto')} selected={!value} onPress={() => pick(null)} testID="widget-child-auto" />
        {list.map((c) => <Chip key={c.id} label={c.first_name} selected={value === c.id} onPress={() => pick(c.id)} testID={`widget-child-${c.id}`} />)}
      </View>
    </View>
  );
}
