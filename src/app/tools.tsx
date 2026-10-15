/** « Tous mes outils » : les fonctions rangées par catégories, seulement celles qui concernent ce parcours. */
import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Appear } from '@/components/Appear';
import { Button, haptic, Icon, Text } from '@/components/ui';
import { useActivePregnancy, useActiveSubject, useChildren, useProfile } from '@/lib/data/hooks';
import { toolCategories } from '@/lib/domain/journeys';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

export default function Tools() {
  const t = useTheme();
  const { data: profile } = useProfile();
  const pregnancy = useActivePregnancy();
  const { data: children } = useChildren();
  const { subject } = useActiveSubject();
  const childId = subject.type === 'child' ? subject.id : children?.[0]?.id;
  const cats = useMemo(() => toolCategories({ journeys: profile?.journeys ?? [], hasPregnancy: !!pregnancy, childId, childCount: children?.length ?? 0 }), [profile, pregnancy, childId, children]);

  return (
    <Screen back title="Tous mes outils" subtitle="Rangés selon votre parcours. Vous pouvez en changer à tout moment.">
      {cats.map((c, ci) => (
        <Appear key={c.key} kind="soft" delay={0.05 + ci * 0.08} style={{ gap: spacing.xs }}>
          <Text variant="heading" accessibilityRole="header">{c.title}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            {c.items.map((it) => (
              <Pressable
                key={it.label}
                accessibilityRole="button"
                accessibilityLabel={it.sub ? `${it.label}, ${it.sub}` : it.label}
                onPress={() => { haptic('selection'); router.push(it.href as never); }}
                style={({ pressed }) => ({ width: '48.5%', minHeight: 92, padding: spacing.sm, borderRadius: radius.lg, borderWidth: 1, borderColor: t.colors.border, backgroundColor: pressed ? t.colors.surfaceAlt : t.colors.surface, gap: 6 })}
              >
                <Icon name={it.icon} size={20} color={t.colors.primary} />
                <Text weight="bold" numberOfLines={2}>{it.label}</Text>
                {it.sub ? <Text variant="caption" muted numberOfLines={1}>{it.sub}</Text> : null}
              </Pressable>
            ))}
          </View>
        </Appear>
      ))}
      <Button label="Changer ou ajouter un parcours" variant="secondary" icon="refresh-cw" onPress={() => router.push('/journeys')} full />
    </Screen>
  );
}
