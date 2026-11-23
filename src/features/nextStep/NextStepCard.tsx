/**
 * Carte « Prochaine étape » de l'Accueil (règles locales, voir `lib/aura/nextStep.ts`). Un appui ouvre l'outil ; « Plus
 * tard » la retire pour de bon. Fonctionne sans IA.
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Glass, GlassButton } from '@/components/glass';
import { Text } from '@/components/ui';
import { t as tr } from '@/i18n';
import { useLogs, useTrackedChildren } from '@/lib/data/hooks';
import { nextStep } from '@/lib/aura/nextStep';
import { useUiStore } from '@/lib/store';
import type { Child, Sleep } from '@/lib/types';
import { radius, spacing } from '@/theme/tokens';

export function NextStepCard({ child }: { child: Child }) {
  const { data: tracked } = useTrackedChildren();
  const sleepsQ = useLogs<Sleep>('sleep', child.id, 30);
  const seen = useUiStore((s) => s.adviceSeen);
  const markSeen = useUiStore((s) => s.markAdviceSeen);
  const step = nextStep({
    child, severalChildren: (tracked ?? []).length > 1, sleeps: sleepsQ.isLoading ? null : ((sleepsQ.data ?? []) as never), now: new Date(), seen,
  });
  if (!step) return null;
  const label = tr(step.kind === 'first_sleep' ? 'next.firstSleep' : 'next.napDay');
  const title = tr(step.kind === 'first_sleep' ? 'next.firstSleep.why' : 'next.napDay.why');
  return (
    <Glass variant="card" radius={radius.xl} contentStyle={{ padding: spacing.md, gap: spacing.sm }} testID={`next-step-${step.kind}`}>
      <Text variant="small" muted>{step.childName ? tr('next.for', { name: step.childName }) : tr('next.title')}</Text>
      <Text weight="bold">{title}</Text>
      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
        <View style={{ flex: 1 }}><GlassButton variant="tertiary" full label={tr('next.later')} testID="next-step-later" onPress={() => markSeen([step.signature])} /></View>
        <View style={{ flex: 2 }}><GlassButton variant="primary" full label={step.childName ? `${label} · ${step.childName}` : label} testID="next-step-go"
          onPress={() => { markSeen([step.signature]); router.push(step.href as never); }} /></View>
      </View>
    </Glass>
  );
}
