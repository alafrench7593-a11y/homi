/**
 * « Qui y pense » : sur les 30 derniers jours, qui a noté les choses à faire (penser), qui les a faites, à qui elles
 * sont confiées, et qui porte quels domaines. Présenté sans jugement, pour en parler à deux.
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/States';
import { Banner, Button, Card, Text } from '@/components/ui';
import { useFamilyTasks, usePeople } from '@/lib/data/hooks-family-load';
import { useDomains } from '@/lib/data/hooks-mental';
import { mentalLoad, shares, type LoadRow } from '@/lib/domain/mentalLoad';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';

const MEASURES: (keyof Omit<LoadRow, 'person'>)[] = ['thought', 'done', 'assigned', 'domains'];

export default function MentalLoad() {
  const t = useTheme();
  const { people, labelOf } = usePeople();
  const tasks = useFamilyTasks().data ?? [];
  const domains = useDomains().data ?? [];
  const rows = mentalLoad(tasks, domains, people.map((p) => p.id));
  const colors = [t.colors.primary, t.colors.lavender, t.colors.gold, t.colors.success];
  const any = rows.some((r) => r.thought + r.done + r.assigned + r.domains > 0);
  return (
    <Screen back title={tr('tool.mental_load')} subtitle={tr('tool.mental_load.sub')}>
      <Text muted>{tr('cm.load.intro')}</Text>
      {!any ? <EmptyState icon="pie-chart" title={tr('cm.load.none')} body={tr('cm.load.noneD')} action={{ label: tr('tool.brain_dump'), onPress: () => router.push('/family/brain-dump') }} /> : MEASURES.map((m) => {
        const s = shares(rows, m);
        return (
          <Card key={m} testID={`load-${m}`}>
            <Text weight="bold">{tr(`cm.load.${m}` as TKey)}</Text>
            <Text variant="caption" muted>{tr(`cm.load.${m}.d` as TKey)}</Text>
            {s ? (
              <>
                <View style={{ flexDirection: 'row', height: 14, borderRadius: radius.sm, overflow: 'hidden', marginTop: spacing.xs }}>
                  {rows.map((r, i) => <View key={r.person} style={{ flex: Math.max(s[r.person], 0.0001), backgroundColor: colors[i % colors.length] }} />)}
                </View>
                {rows.map((r, i) => (
                  <View key={r.person} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors[i % colors.length] }} />
                    <Text variant="small">{labelOf(r.person)} · {s[r.person]} % ({r[m]})</Text>
                  </View>
                ))}
              </>
            ) : <Text variant="small" muted>{tr('cm.load.nothing')}</Text>}
          </Card>
        );
      })}
      <Banner tone="info" icon="heart">{tr('cm.load.talk')}</Banner>
      <Button label={tr('tool.couple_week')} icon="coffee" variant="secondary" onPress={() => router.push('/family/couple')} />
    </Screen>
  );
}
