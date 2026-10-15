/** Primitives + états vides illustrés. */
import React from 'react';
import { View } from 'react-native';
import { spacing } from '@/theme/tokens';
import { Card, Text } from './ui';
import { EmptyIllustration } from './Illustrations';

export * from './ui';

export function EmptyStateCard({ illustration = 'moon', title, text, action }: { illustration?: 'moon' | 'leaf' | 'letter' | 'chat'; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <Card tone="soft">
      <View style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md }}>
        <EmptyIllustration kind={illustration} size={110} />
        <Text variant="heading" center>{title}</Text>
        {text ? <Text muted center style={{ maxWidth: 300 }}>{text}</Text> : null}
        {action}
      </View>
    </Card>
  );
}
