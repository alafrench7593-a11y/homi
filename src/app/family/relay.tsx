/**
 * Relais parent — brouillon de transmission (storyboard état 8). Événements PARTAGEABLES de l'enfant depuis la dernière
 * transmission (ou minuit), lus dans les mêmes tables que les mini-apps : une sieste corrigée y apparaît corrigée.
 * Le parent retire ce qu'il ne veut pas transmettre, relit le message composé par le code, puis confirme : le partage
 * du système s'ouvre ; la transmission est datée et son statut reste visible.
 *
 * Audit du 23/11/2026 : le parent peut ajouter un mot (gardé sur l'appareil, effacé après l'envoi). La relecture FIGE le
 * message : ce qui est relu est exactement ce qui part. Si une saisie arrive ou change entre-temps, un bandeau le dit et
 * « Actualiser le brouillon » recompose le message en gardant le mot du parent.
 */
import React, { useMemo, useState } from 'react';
import { Platform, Share, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Glass, GlassButton } from '@/components/glass';
import { useToast } from '@/components/Overlays';
import { EmptyState, Skeleton } from '@/components/States';
import { Tappable } from '@/components/Tappable';
import { Field, haptic, Icon, Text } from '@/components/ui';
import { formatDate, t as tr } from '@/i18n';
import { eq } from '@/lib/backend';
import { useActiveSubject, useChildren, useRows } from '@/lib/data/hooks';
import { useSleepPlan } from '@/lib/data/hooks-sleepPlanner';
import { relayItems, relaySince, type BottleLike, type BreastfeedLike, type DiaperLike, type RelayItem } from '@/lib/domain/relayDraft';
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

const SIDE: Record<'left' | 'right' | 'both', 'nn.relay.left' | 'nn.relay.right' | 'nn.relay.both'> = { left: 'nn.relay.left', right: 'nn.relay.right', both: 'nn.relay.both' };
function title(i: RelayItem): string {
  return tr(i.kind === 'sleep' ? 'nn.relay.sleepEnd' : i.kind === 'bottle' ? 'nn.relay.bottle' : i.kind === 'diaper' ? 'nn.relay.diaper' : 'nn.relay.feed');
}
function detail(i: RelayItem): string {
  if (i.kind === 'sleep' || i.kind === 'breastfeed') return `${clock(new Date(i.start))} – ${i.end ? clock(new Date(i.end)) : '…'} · ${span(i.minutes)}${i.kind === 'breastfeed' ? ` · ${tr(SIDE[i.side])}` : ''}`;
  if (i.kind === 'bottle') return i.ml != null ? `${i.ml} ml` : tr('nn.relay.noQty');
  return [i.wet ? tr('nn.relay.wet') : null, i.stool ? tr('nn.relay.stool') : null].filter(Boolean).join(' · ') || tr('nn.relay.dry');
}
function line(i: RelayItem): string {
  return `${title(i)} · ${i.kind === 'bottle' || i.kind === 'diaper' ? `${clock(new Date(i.at))} · ` : ''}${detail(i)}${i.kind === 'sleep' && i.note ? ` · ${i.note}` : ''}`;
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
  const diapersQ = useRows<DiaperLike>(['diapers', child.id, 'relay'], { table: 'diapers', filters: [eq('child_id', child.id)], order: [{ col: 'at', asc: false }], limit: 60 });
  const feedsQ = useRows<BreastfeedLike>(['breastfeeds', child.id, 'relay'], { table: 'breastfeeds', filters: [eq('child_id', child.id)], order: [{ col: 'started_at', asc: false }], limit: 60 });
  const items = useMemo(() => relayItems({ childId: child.id, since, now, sleeps: (sleeps ?? []) as Sleep[], bottles: bottlesQ.data ?? [], diapers: diapersQ.data ?? [], breastfeeds: feedsQ.data ?? [] }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [child.id, since.getTime(), Math.floor(now.getTime() / 60_000), sleeps, bottlesQ.data, diapersQ.data, feedsQ.data]);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  // Relecture figée : éléments relus + signature du brouillon à ce moment-là
  const [snap, setSnap] = useState<{ items: RelayItem[]; sig: string } | null>(null);
  const review = snap != null;
  const [busy, setBusy] = useState(false);
  const note = useRelayStore((s) => s.notes?.[child.id] ?? '');
  const setNote = useRelayStore((s) => s.setNote);
  const kept = items.filter((i) => !removed.has(i.id));
  const sig = kept.map(line).join('\n');
  const stale = !!snap && snap.sig !== sig;
  const fromMidnight = since.getHours() === 0 && since.getMinutes() === 0;
  const sinceText = fromMidnight ? tr('nn.relay.midnight') : clock(since);
  const shown = snap ? snap.items : kept;
  const message = [tr('nn.relay.msgHead', { name: child.first_name, time: sinceText }), ...shown.map((i) => `• ${line(i)}`), ...(note.trim() ? ['', tr('nn.relay.noteLine', { note: note.trim() })] : [])].join('\n');
  const setReview = (on: boolean) => setSnap(on ? { items: kept, sig } : null);
  async function confirm() {
    if (busy || !shown.length) return;
    setBusy(true);
    try {
      if (Platform.OS === 'web' && !(globalThis as { navigator?: { share?: unknown } }).navigator?.share) {
        // Aperçu web sans partage système : le message est copié (même contenu que sur téléphone)
        await (globalThis as { navigator?: { clipboard?: { writeText: (s: string) => Promise<void> } } }).navigator?.clipboard?.writeText(message).catch(() => undefined);
      } else {
        const r = await Share.share({ message });
        if (r.action === Share.dismissedAction) { setBusy(false); return; }
      }
      markSent(child.id, shown.length);
      haptic('success');
      toast(tr('nn.relay.sent', { count: shown.length }), 'success');
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
                      <Text weight="medium">{title(i)}</Text>
                      <Text variant="small" muted style={TABULAR} testID={`relay-item-detail-${i.kind}`}>{detail(i)}</Text>
                      {i.kind === 'sleep' && i.note ? <Text variant="small" muted>{i.note}</Text> : null}
                    </View>
                  </Glass>
                </Tappable>
              );
            })}
          </View>
          <Field label={tr('nn.relay.note')} optional value={note} onChangeText={(v) => setNote(child.id, v)} placeholder={tr('nn.relay.notePh')}
            multiline maxLength={300} testID="relay-note" />
          <GlassButton variant="primary" full icon="eye" label={tr('nn.relay.review', { count: kept.length })} disabled={!kept.length} testID="relay-review" onPress={() => setReview(true)} />
        </>
      ) : (
        <>
          {stale ? (
            <Glass variant="card" radius={radius.lg} contentStyle={{ padding: spacing.sm, gap: spacing.xs }} testID="relay-stale">
              <Text variant="small">{tr('nn.relay.changed')}</Text>
              <GlassButton variant="secondary" icon="refresh-cw" label={tr('nn.relay.refresh')} testID="relay-refresh" onPress={() => setReview(true)} />
            </Glass>
          ) : null}
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
      <GlassButton variant="tertiary" icon="repeat" label={tr('nn.relay.nights')} testID="relay-open-nights" onPress={() => router.push('/family/nights' as never)} />
      <GlassButton variant="tertiary" icon="moon" label={tr('nn.home.open')} testID="relay-open-sleep" onPress={() => router.push({ pathname: '/sleep/[childId]', params: { childId: child.id } } as never)} />
    </Screen>
  );
}
