/**
 * Journal d'activité (Premium) : chronologie de mes publications, réponses, réactions et enregistrements, filtrable.
 * Les listes « Publications », « Réponses », « Aimées » et « Enregistrées » de mon profil restent complètes et gratuites.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, Skeleton } from '@/components/States';
import { Chip, Icon, type IconName, Row, Text } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { PremiumSection } from '@/components/Premium';
import { usePremium } from '@/lib/data/hooks';
import { useActivity } from '@/lib/data/hooks-social';
import { timeAgo } from '@/lib/domain/dates';
import type { ActivityItem } from '@/lib/types';
import { t as tr, type TKey } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, spacing } from '@/theme/tokens';

/** Libellés : clés traduites au rendu (la langue peut changer). */
const KIND: Record<ActivityItem['kind'], { icon: IconName; label: TKey }> = {
  post: { icon: 'edit-3', label: 'cm3.activity.kind.post' }, comment: { icon: 'message-circle', label: 'cm3.activity.kind.comment' }, like: { icon: 'heart', label: 'cm3.activity.kind.like' }, save: { icon: 'bookmark', label: 'cm3.activity.kind.save' },
};

export default function Activity() {
  const t = useTheme();
  const premium = usePremium();
  const q = useActivity(premium);
  const [kind, setKind] = useState<ActivityItem['kind'] | null>(null);
  const list = useMemo(() => (q.data ?? []).filter((x) => !kind || x.kind === kind), [q.data, kind]);
  return (
    <Screen back title={tr('cm3.activity.title')}>
      <PremiumSection feature="community_history" preview={<Text variant="small">{tr('cm3.activity.preview')}</Text>}>
        <Row wrap gap={6}>
          <Chip label={tr('cm3.activity.all')} selected={!kind} onPress={() => setKind(null)} />
          {(Object.keys(KIND) as ActivityItem['kind'][]).map((k) => <Chip key={k} label={tr(KIND[k].label)} icon={KIND[k].icon} selected={kind === k} onPress={() => setKind(kind === k ? null : k)} />)}
        </Row>
        {q.isLoading && !q.data ? <Skeleton kind="list" rows={4} /> : list.length ? (
          <View testID="activity-list">
            {list.map((a, i) => (
              <Tappable key={`${a.kind}-${a.post_id}-${i}`} accessibilityRole="button" accessibilityLabel={tr('cm3.activity.itemA11y', { kind: tr(KIND[a.kind].label), label: a.label })} onPress={() => router.push(`/community/post/${a.post_id}`)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: MIN_TOUCH, borderBottomWidth: 1, borderBottomColor: t.colors.border, paddingVertical: 6 }}>
                <Icon name={KIND[a.kind].icon} size={16} color={t.colors.primary} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={2} intentionalTruncation>{a.label}</Text>
                  <Text variant="caption" muted>{tr('cm3.activity.itemMeta', { kind: tr(KIND[a.kind].label), ago: timeAgo(a.at) })}</Text>
                </View>
              </Tappable>
            ))}
          </View>
        ) : <EmptyState icon="clock" title={tr('cm3.activity.empty')} />}
      </PremiumSection>
      <Text variant="caption" muted>{tr('cm3.activity.freeNote')}</Text>
    </Screen>
  );
}
