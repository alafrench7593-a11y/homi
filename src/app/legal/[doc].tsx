/** CGU et politique de confidentialité (brouillons, à valider par un juriste). */
import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Banner, Card, Text } from '@/components/ui';
import { LEGAL_DRAFT_NOTICE, PRIVACY, TERMS } from '@/content/legal';
import { spacing } from '@/theme/tokens';

export default function LegalScreen() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const d = doc === 'privacy' ? PRIVACY : TERMS;
  return (
    <Screen back title={d.title} subtitle={`Mise à jour : ${d.updated}`}>
      <Banner tone="warning">{LEGAL_DRAFT_NOTICE}</Banner>
      {d.sections.map((s) => (
        <Card key={s.title}>
          <Text weight="bold" accessibilityRole="header">{s.title}</Text>
          <Text variant="small" style={{ marginTop: spacing.xs }}>{s.body}</Text>
        </Card>
      ))}
    </Screen>
  );
}
