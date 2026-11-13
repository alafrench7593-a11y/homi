/**
 * Ligne « biberon d'un enfant » de la liste `/bottle` (v3) : surface mate, une ligne par enfant, état réel :
 * biberon en cours (heure de début, pas de chronomètre qui défile dans une liste), sinon prochain rappel.
 * Toucher la ligne ouvre l'écran de l'enfant par la transition carte → détail (`MorphSource` → `MorphTarget`).
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Skeleton } from '@/components/States';
import { Icon, Text } from '@/components/ui';
import { eq } from '@/lib/backend';
import { useRows } from '@/lib/data/hooks';
import { useBottleTimer, useNow } from '@/lib/data/hooks-bottle';
import { atClock, formatClock, isStaleTimer, nextReminderSentence, remainingMinutes } from '@/lib/domain/bottleTimer';
import { sessionState } from '@/lib/domain/bottleSession';
import type { Child } from '@/lib/types';
import { MorphSource } from '@/motion/Morph';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';
import { childMorphId } from './bottleStats';
import type { RunningBottle } from './bottleSession';

export function BottleChildRow({ child, last }: { child: Child; last?: boolean }) {
  const t = useTheme();
  const now = useNow(30_000);
  const { active: current, isLoading } = useBottleTimer(child.id);
  const runningQ = useRows<RunningBottle>(['bottles', child.id, 'running'], { table: 'bottles', filters: [eq('child_id', child.id), eq('in_progress', true)], limit: 1 });
  const running = runningQ.data?.[0] ?? null;
  const state = sessionState(running);
  const active = isStaleTimer(current, now) ? null : current;
  if (isLoading) return <Skeleton kind="list" rows={1} />;
  const passed = !!active && remainingMinutes(active, now) <= 0;
  const status = running
    ? tr(state === 'paused' ? 'bs.list.paused' : 'bs.list.running', { time: formatClock(running.started_at) })
    : null;
  const line = active
    ? passed ? tr('u6.bottle.was_due', { name: child.first_name, when: atClock(active.due_at, now) }) : nextReminderSentence(child.first_name, active.due_at, now)
    : tr('u6.bottle.none_for', { name: child.first_name });
  const open = () => router.push({ pathname: '/bottle/[childId]', params: { childId: child.id } });
  return (
    <MorphSource id={childMorphId(child.id)} onOpen={open} radius={radius.md} accessibilityLabel={tr('u6.bottle.open_a11y', { line: [status, line].filter(Boolean).join('. ') })} testID={`bottle-row-${child.id}`}>
      <View style={{ minHeight: MIN_TOUCH + 16, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.xs,
        borderBottomWidth: last ? 0 : 1, borderColor: t.material.lines.separator }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.material.lines.iconWell, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={running ? (state === 'paused' ? 'pause' : 'activity') : active ? 'bell' : 'bell-off'} size={20} color={passed && !running ? t.colors.danger : t.colors.primary} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text weight="bold">{tr('u6.bottle.card_title', { name: child.first_name })}</Text>
          {status ? <Text variant="small" weight="medium" color={t.colors.primary}>{status}</Text> : null}
          <Text variant="small" muted={!active}>{line}</Text>
        </View>
        <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
      </View>
    </MorphSource>
  );
}
