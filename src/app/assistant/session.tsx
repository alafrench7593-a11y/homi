/**
 * Aura dans le contexte d'UNE session de sommeil (ouverte depuis la feuille de la session, écran Sommeil).
 * Ce qu'Aura reçoit est montré avant l'envoi (heure, durée, durées des siestes comparables : jamais le prénom, la note
 * ni un identifiant). Le retour ramène à l'écran Sommeil, où la même session reste sélectionnée (« ?nap= »).
 */
import React from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Glass, GlassButton } from '@/components/glass';
import { EmptyState, Skeleton } from '@/components/States';
import { Text } from '@/components/ui';
import { AuraAnalysis } from '@/features/aura/AuraAnalysis';
import { AuraAvatar } from '@/features/aura/AuraMark';
import { napPayload } from '@/features/aura/analysis';
import { sessionFacts } from '@/features/napLive/NapSessionTray';
import { NapCompare } from '@/features/napLive/SkiaHost';
import { useChild } from '@/lib/data/hooks';
import { useSleepPlan } from '@/lib/data/hooks-sleepPlanner';
import { childAge } from '@/lib/domain/child';
import { clock, span } from '@/lib/domain/sleepPlanner';
import type { Child, Sleep } from '@/lib/types';
import { t as tr } from '@/i18n';
import { radius, spacing } from '@/theme/tokens';

export default function AuraNapSession() {
  const p = useLocalSearchParams<{ child?: string; sleep?: string }>();
  const child = useChild(typeof p.child === 'string' ? p.child : undefined);
  if (!child) return <Screen back title={tr('nn.ses.title')}><Skeleton rows={3} /></Screen>;
  return <Body child={child} sleepId={typeof p.sleep === 'string' ? p.sleep : ''} />;
}

function Body({ child, sleepId }: { child: Child; sleepId: string }) {
  const { sleeps, loading, now } = useSleepPlan(child);
  const all = (sleeps ?? []) as Sleep[];
  const s = all.find((x) => x.id === sleepId) ?? null;
  if (loading && !s) return <Screen back title={tr('nn.ses.title')}><Skeleton rows={3} /></Screen>;
  if (!s) return <Screen back title={tr('nn.ses.title')}><EmptyState icon="moon" title={tr('nn.ses.notFound')} body="" /></Screen>;
  const f = sessionFacts(child, all, s);
  const range = tr('nn.tray.range', { from: clock(new Date(s.started_at)), to: s.ended_at ? clock(new Date(s.ended_at)) : '…' });
  return (
    <Screen back title={tr('nn.ses.title')}>
      <Glass variant="card" radius={radius.xl} testID="aura-session-context" contentStyle={{ padding: spacing.md, gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <AuraAvatar size={40} />
          <Text weight="bold" style={{ flex: 1, fontVariant: ['tabular-nums'] }}>{tr('nn.ses.context', { name: child.first_name, range, dur: span(f.minutes) })}</Text>
        </View>
        {s.note ? <Text variant="small" muted testID="aura-session-note">{`« ${s.note} »`}</Text> : null}
        {f.w.samples.length ? <NapCompare samples={f.w.samples} current={{ started_at: s.started_at, minutes: f.minutes, label: tr('nn.tray.this'), id: s.id }} low={f.w.low} high={f.w.high} height={130}
          onOpen={(id) => router.push({ pathname: '/sleep/[childId]', params: { childId: child.id, nap: id } } as never)} /> : null}
      </Glass>
      <AuraAnalysis kind="nap" testID="aura-analysis-nap"
        data={napPayload({ startedAt: s.started_at, now: s.ended_at ? new Date(s.ended_at) : now, ongoing: !s.ended_at, ageMonths: childAge(child.birth_date).months ?? null, samples: f.w.samples })}
        followUps={<>
          <GlassButton size="sm" variant="secondary" icon="moon" label={tr('nn.home.open')} testID="aura-session-back" onPress={() => router.back()} />
          <GlassButton size="sm" variant="tertiary" icon="message-circle" label={tr('nn.ses.ask')} testID="aura-session-ask"
            onPress={() => router.push({ pathname: '/assistant', params: { tool: 'kid_sleep', q: tr('nn.ses.q', { name: child.first_name }) } } as never)} />
        </>} />
    </Screen>
  );
}
