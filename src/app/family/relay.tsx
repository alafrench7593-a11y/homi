/**
 * Relais parent — brouillon de transmission (storyboard état 8). Événements PARTAGEABLES de l'enfant depuis la dernière
 * transmission (ou minuit), lus dans les mêmes tables que les mini-apps : une sieste corrigée y apparaît corrigée.
 * Le parent retire ce qu'il ne veut pas transmettre, relit le message composé par le code, puis confirme : le partage
 * du système s'ouvre ; la transmission est datée et son statut reste visible.
 */
import React, { useMemo, useState } from 'react';
import { Platform, Share, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Glass, GlassButton } from '@/components/glass';
import { useToast } from '@/components/Overlays';
import { EmptyState, Skeleton } from '@/components/States';
import { Tappable } from '@/components/Tappable';
import { haptic, Icon, Text } from '@/components/ui';
import { formatDate, t as tr } from '@/i18n';
import { eq } from '@/lib/backend';
import { useActiveSubject, useChildren, useRows } from '@/lib/data/hooks';
import { useSleepPlan } from '@/lib/data/hooks-sleepPlanner';
import { relayItems, relaySince, type BottleLike, type RelayItem } from '@/lib/domain/relayDraft';
import { clock, span } from '@/lib/domain/sleepPlanner';
import type { Child, Sleep } from '@/lib/types';
import { useRelayStore } from '@/features/relay/relayStore';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, MIN_TOUCH, radius, spacing } from '@/theme/tokens';

const TABULAR = { fontVariant: ['tabular-nums' as const] };

export default function RelayScreen() {
  const p = useLocalSearchParams<{ child?: string }>();
  const { subject } = useActiveSubject();
  const { data: children, isLoading } = useChildren();
  const id = typeof p.child === 'string' ? p.child : subject?.type === 'child' ? subject.id : null;
  const child = (children ?? []).find((c) => c.id === id) ?? null;
  if (!child) {
    return (
      <Screen back title={tr('nn.relay.title')}>
        {isLoading ? <Skeleton rows={3} /> : <EmptyState icon="users" title={tr('nn.relay.pickChild')} body="" />}
      </Screen>
    );
  }
  return <Draft key={child.id} child={child} />;
}

function line(i: RelayItem): string {
  if (i.kind === 'sleep') return `${tr('nn.relay.sleep')} · ${clock(new Date(i.start))} – ${i.end ? clock(new Date(i.end)) : '…'} · ${span(i.minutes)}${i.note ? ` · ${i.note}` : ''}`;
  return `${tr('nn.relay.bottle')} · ${clock(new Date(i.at))}${i.ml != null ? ` · ${i.ml} ml` : ''}`;
}

function Draft({ child }: { child: Child }) {
  const t = useTheme();
  const toast = useToast();
  const { sleeps, now: planNow } = useSleepPlan(child);
  // Heure réelle (et non la minute mise en cache du planificateur) : un relais envoyé à l'instant borne bien le suivant
  const now = new Date(Math.max(planNow.getTime(), Date.now()));
  const last = useRelayStore((s) => s.byChild[child.id] ?? null);
  const markSent = useRelayStore((s) => s.markSent);
  const since = relaySince(last?.at, now);
  const bottlesQ = useRows<BottleLike>(['bottles', child.id, 'relay'], { table: 'bottles', filters: [eq('child_id', child.id)], order: [{ col: 'at', asc: false }], limit: 60 });
  const items = useMemo(() => relayItems({ childId: child.id, since, now, sleeps: (sleeps ?? []) as Sleep[], bottles: bottlesQ.data ?? [] }), [child.id, since, now, sleeps, bottlesQ.data]);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const kept = items.filter((i) => !removed.has(i.id));
  const fromMidnight = since.getHours() === 0 && since.getMinutes() === 0;
  const sinceText = fromMidnight ? tr('nn.relay.midnight') : clock(since);
  const message = [tr('nn.relay.msgHead', { name: child.first_name, time: sinceText }), ...kept.map((i) => `• ${line(i)}`)].join('\n');
  async function confirm() {
    if (busy || !kept.length) return;
    setBusy(true);
    try {
      if (Platform.OS === 'web' && !(globalThis as { navigator?: { share?: unknown } }).navigator?.share) {
        // Aperçu web sans partage système : le message est copié (même contenu que sur téléphone)
        await (globalThis as { navigator?: { clipboard?: { writeText: (s: string) => Promise<void> } } }).navigator?.clipboard?.writeText(message).catch(() => undefined);
      } else {
        const r = await Share.share({ message });
        if (r.action === Share.dismissedAction) { setBusy(false); return; }
      }
      markSent(child.id, kept.length);
      haptic('success');
      toast(tr('nn.relay.sent', { count: kept.length }), 'success');
      setReview(false); setRemoved(new Set());
    } finally { setBusy(false); }
  }
  return (
    <Screen back tool={false} title={tr('nn.relay.title')} subtitle={tr('nn.relay.since', { name: child.first_name, time: sinceText })}>
      {last ? (
        <Glass variant="card" radius={radius.lg} contentStyle={{ padding: spacing.sm, flexDirection: 'row', gap: spacing.xs, alignItems: 'center' }} testID="relay-last">
          <Icon name="check-circle" size={16} color={t.colors.text} />
          <Text variant="small" style={{ flex: 1 }}>{tr('nn.relay.lastSent', { date: formatDate(last.at, { weekday: 'long', day: 'numeric', month: 'long' }), time: clock(new Date(last.at)), count: last.count })}</Text>
        </Glass>
      ) : null}
      {!items.length ? <EmptyState icon="inbox" title={tr('nn.relay.empty')} body={tr('nn.relay.emptyBody')} /> : !review ? (
        <>
          <Text variant="small" muted>{tr('nn.relay.pickHint')}</Text>
          <View style={{ gap: spacing.xs }} testID="relay-items">
            {items.map((i) => {
              const on = !removed.has(i.id);
              return (
                <Tappable key={i.id} accessibilityRole="checkbox" accessibilityState={{ checked: on }} testID={`relay-item-${i.kind}`}
                  onPress={() => setRemoved((s) => { const n = new Set(s); if (n.has(i.id)) n.delete(i.id); else n.add(i.id); return n; })}>
                  <Glass variant="card" radius={radius.lg} contentStyle={{ padding: spacing.sm, minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, opacity: on ? 1 : 0.5 }}>
                    <Icon name={on ? 'check-square' : 'square'} size={20} color={t.colors.text} />
                    <Text style={[{ minWidth: 64 }, TABULAR]} weight="bold" numberOfLines={1}>{clock(new Date(i.at))}</Text>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text weight="medium">{i.kind === 'sleep' ? tr('nn.relay.sleepEnd') : tr('nn.relay.bottle')}</Text>
                      <Text variant="small" muted style={TABULAR} testID={`relay-item-detail-${i.kind}`}>
                        {i.kind === 'sleep' ? `${clock(new Date(i.start))} – ${i.end ? clock(new Date(i.end)) : '…'} · ${span(i.minutes)}` : i.ml != null ? `${i.ml} ml` : tr('nn.relay.noQty')}
                      </Text>
                      {i.kind === 'sleep' && i.note ? <Text variant="small" muted>{i.note}</Text> : null}
                    </View>
                  </Glass>
                </Tappable>
              );
            })}
          </View>
          <GlassButton variant="primary" full icon="eye" label={tr('nn.relay.review', { count: kept.length })} disabled={!kept.length} testID="relay-review" onPress={() => setReview(true)} />
        </>
      ) : (
        <>
          <Text variant="label">{tr('nn.relay.preview')}</Text>
          <Glass variant="card" radius={radius.lg} contentStyle={{ padding: spacing.md }} testID="relay-preview">
            <Text style={[{ fontFamily: fonts.body }, TABULAR]}>{message}</Text>
          </Glass>
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            <View style={{ flex: 1 }}><GlassButton variant="tertiary" full label={tr('nn.relay.back')} testID="relay-back" onPress={() => setReview(false)} /></View>
            <View style={{ flex: 1 }}><GlassButton variant="primary" full icon="send" label={tr('nn.relay.confirm')} disabled={busy} testID="relay-confirm" onPress={confirm} /></View>
          </View>
        </>
      )}
      <GlassButton variant="tertiary" icon="moon" label={tr('nn.home.open')} testID="relay-open-sleep" onPress={() => router.push({ pathname: '/sleep/[childId]', params: { childId: child.id } } as never)} />
    </Screen>
  );
}
