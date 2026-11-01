/** Règles de la communauté : bienveillance, sécurité des enfants, confidentialité, témoignages (pas de conseils médicaux). */
import React from 'react';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Banner, Button, Card, Text } from '@/components/ui';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

const rules = (): { title: string; body: string }[] => [
  { title: tr('u5.rules.r1_t'), body: tr('u5.rules.r1_b') },
  { title: tr('u5.rules.r2_t'), body: tr('u5.rules.r2_b') },
  { title: tr('u5.rules.r3_t'), body: tr('u5.rules.r3_b') },
  { title: tr('u5.rules.r4_t'), body: tr('u5.rules.r4_b') },
  { title: tr('u5.rules.r5_t'), body: tr('u5.rules.r5_b') },
  { title: tr('u5.rules.r6_t'), body: tr('u5.rules.r6_b') },
  { title: tr('u5.rules.r7_t'), body: tr('u5.rules.r7_b') },
  { title: tr('u5.rules.r8_t'), body: tr('u5.rules.r8_b') },
];

export default function Rules() {
  return (
    <Screen back title={tr('u5.rules.title')}>
      {rules().map((r, i) => (
        <Card key={r.title}>
          <Text weight="bold">{`${i + 1}. ${r.title}`}</Text>
          <Text variant="small" style={{ marginTop: 4 }}>{r.body}</Text>
        </Card>
      ))}
      <Banner tone="danger" title={tr('u5.rules.urgent')}>{tr('u5.rules.urgent_b')}</Banner>
      <Button label={tr('u5.rules.numbers')} variant="secondary" icon="life-buoy" onPress={() => router.push('/emergency')} style={{ marginBottom: spacing.lg }} />
    </Screen>
  );
}
