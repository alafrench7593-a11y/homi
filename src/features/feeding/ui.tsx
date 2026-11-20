/**
 * Allaitement et biberons — choix de l'enfant des écrans « stock de lait », « difficultés », « laits infantiles » :
 * celui de l'adresse (?child=), sinon le profil affiché, sinon le premier enfant suivi. Mêmes puces que les autres outils.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Chip, Row, Text } from '@/components/ui';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';
import { useActiveSubject, useTrackedChildren } from '@/lib/data/hooks';
import type { Child } from '@/lib/types';

export function useFeedingChild() {
  const params = useLocalSearchParams<{ child?: string }>();
  const q = useTrackedChildren();
  const { subject } = useActiveSubject();
  const children = q.data ?? [];
  const [picked, setPicked] = useState<string | null>(typeof params.child === 'string' ? params.child : null);
  const child: Child | null = children.find((c) => c.id === picked)
    ?? (subject.type === 'child' ? children.find((c) => c.id === subject.id) : undefined) ?? children[0] ?? null;
  return { children, child, setChild: setPicked, loading: q.isLoading && !q.data };
}

export function FeedingChildPicker({ list, value, onChange }: { list: Child[]; value: string | null; onChange: (id: string) => void }) {
  if (list.length < 2) return null;
  return (
    <View style={{ gap: spacing.xs }}>
      <Text variant="label">{tr('milk.child')}</Text>
      <Row wrap>{list.map((c) => <Chip key={c.id} label={c.first_name} selected={value === c.id} onPress={() => onChange(c.id)} testID={`feed-child-${c.first_name}`} />)}</Row>
    </View>
  );
}
