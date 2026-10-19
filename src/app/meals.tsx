/**
 * Repas et recettes, adaptés au profil affiché : grossesse (aliments à éviter, idées), bébé (diversification
 * selon l'âge), enfant (repas adaptés à l'âge), adulte. Le prénom de l'enfant est affiché clairement.
 */
import React from 'react';
import { Linking, Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Banner, Button, Card, Text } from '@/components/ui';
import { ADULT_MEALS, BABY_RULES, BABY_SOURCES, BABY_STAGES, babyStageFor, CHILD_MEALS, PREGNANCY_MEALS, type MealIdea, type MealSection, type MealSource } from '@/content/meals';
import { useChild } from '@/lib/data/hooks';
import { useScope } from '@/lib/data/hooks-scope';
import { childAge } from '@/lib/domain/child';
import { t as tr } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

function Sources({ list }: { list: MealSource[] }) {
  const t = useTheme();
  return (
    <View style={{ gap: 2 }}>
      {list.map((s) => (
        <Pressable key={s.url} accessibilityRole="link" onPress={() => void Linking.openURL(s.url)} style={{ minHeight: 32, justifyContent: 'center' }}>
          <Text variant="caption" color={t.colors.primary}>{tr('ml.source', { label: s.label })}</Text>
        </Pressable>
      ))}
    </View>
  );
}
const Ideas = ({ ideas }: { ideas: MealIdea[] }) => (
  <Card>
    {ideas.map((i) => (
      <View key={i.title} style={{ paddingVertical: 6 }}>
        <Text weight="bold">{i.title}</Text>
        <Text variant="small" muted>{i.detail}</Text>
      </View>
    ))}
  </Card>
);
function Section({ s }: { s: MealSection }) {
  return (
    <>
      {s.rules ? <Card tone="soft">{s.rules.map((r) => <Text key={r} variant="small" style={{ paddingVertical: 3 }}>• {r}</Text>)}</Card> : null}
      <Text variant="heading" accessibilityRole="header">{tr('ml.ideas')}</Text>
      <Ideas ideas={s.ideas} />
      <Sources list={s.sources} />
    </>
  );
}

export default function Meals() {
  const params = useLocalSearchParams<{ for?: string; child?: string }>();
  const scope = useScope();
  const child = useChild(params.child ?? scope.childId ?? undefined);
  const kind = params.for ?? scope.scope;
  const months = child ? childAge(child.birth_date).months : null;
  const isBaby = kind === 'baby' && months != null;
  const stage = isBaby && months != null ? babyStageFor(months) : null;

  return (
    <Screen back title={tr('tool.meals')} subtitle={child && (kind === 'baby' || kind === 'child') ? tr('ml.for', { name: child.first_name, age: childAge(child.birth_date).label }) : kind === 'pregnancy' ? tr('pj.subject.pregnancy') : undefined}>
      {kind === 'pregnancy' ? <Section s={PREGNANCY_MEALS} /> : isBaby ? (
        <>
          {months != null && months < 4 ? <Banner tone="info">{tr('ml.milkOnly')}</Banner> : null}
          <Card tone="soft">{BABY_RULES.map((r) => <Text key={r} variant="small" style={{ paddingVertical: 3 }}>• {r}</Text>)}</Card>
          {(stage ? [stage, ...BABY_STAGES.filter((s) => s.from > stage.from)] : BABY_STAGES).map((s) => (
            <View key={s.id} style={{ gap: spacing.xs }} testID={`stage-${s.id}`}>
              <Text variant="heading" accessibilityRole="header">{s.title}{stage?.id === s.id ? ` · ${tr('ml.now')}` : ''}</Text>
              <Text variant="small" muted>{s.textures}</Text>
              <Ideas ideas={s.ideas} />
            </View>
          ))}
          <Sources list={BABY_SOURCES} />
          {child ? <Button label={tr('tool.baby_foods')} icon="feather" variant="secondary" onPress={() => router.push(`/child/${child.id}/foods`)} /> : null}
        </>
      ) : kind === 'child' || kind === 'baby' ? <Section s={CHILD_MEALS} /> : <Section s={ADULT_MEALS} />}
      <Button label={tr('tool.scan_food')} icon="search" variant="ghost" onPress={() => router.push('/scanner/food')} />
      <Text variant="caption" muted>{tr('ml.note')}</Text>
    </Screen>
  );
}
