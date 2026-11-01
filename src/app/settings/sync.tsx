/**
 * Synchronisation : saisies faites hors ligne, en attente d'envoi, et saisies refusées par le serveur
 * (jamais supprimées en silence : à réessayer ou à retirer explicitement).
 */
import React, { useState } from 'react';
import { Screen } from '@/components/Screen';
import { confirm, useToast } from '@/components/Overlays';
import { EmptyState } from '@/components/States';
import { Banner, Button, Card, IconButton, ListRow, Row, SectionTitle, Text } from '@/components/ui';
import { discardConflict, flushQueue, retryConflict, useOfflineStore, type PendingOp } from '@/lib/offline';
import { friendlyError } from '@/lib/data/hooks-settings';
import { spacing } from '@/theme/tokens';
import { t as tr, formatDate, type TKey } from '@/i18n';

const TABLE_KEYS = new Set(['bottles','breastfeeds','pumpings','diapers','sleeps','meals','child_observations','period_entries','symptom_logs','ovulation_tests','pregnancy_tests','fertility_observations','intercourse_logs','mood_checkins','maternal_weights','child_measurements','child_milestones','food_introductions','child_health_items']);
const tableLabel = (table: string) => (TABLE_KEYS.has(table) ? tr(`u1.sync.t.${table}` as TKey) : tr('u1.sync.entry'));

const when = (iso: string) => formatDate(iso, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function SyncScreen() {
  const toast = useToast();
  const { online, pending, conflicts, syncing } = useOfflineStore();
  const [busy, setBusy] = useState(false);

  async function syncNow() {
    setBusy(true);
    try {
      const n = await flushQueue();
      toast(n ? tr('u1.sync.sent', { count: n }) : online ? tr('u1.sync.nothing') : tr('u1.sync.stillOffline'));
    } catch (e) {
      toast(friendlyError(e), 'error');
    } finally {
      setBusy(false);
    }
  }

  const row = (op: PendingOp, conflict: boolean) => (
    <ListRow
      key={op.id}
      icon={conflict ? 'alert-circle' : 'clock'}
      title={tableLabel(op.table)}
      subtitle={`${tr('u1.sync.noted', { date: when(op.queuedAt) })}${op.error ? ` · ${op.error}` : ''}`}
      right={conflict ? (
        <Row gap={0}>
          <IconButton icon="refresh-cw" label={tr('u1.sync.retry')} onPress={() => retryConflict(op.id).catch((e) => toast(friendlyError(e), 'error'))} />
          <IconButton icon="trash-2" label={tr('u1.sync.remove')} onPress={async () => {
            if (await confirm(tr('u1.sync.removeTitle'), tr('u1.sync.removeBody'), tr('u1.sync.removeBtn'))) await discardConflict(op.id).catch((e) => toast(friendlyError(e), 'error'));
          }} />
        </Row>
      ) : undefined}
    />
  );

  return (
    <Screen back title={tr('u1.sync.title')} subtitle={tr('u1.sync.subtitle')}>
      <Banner tone={online ? 'success' : 'warning'} title={online ? tr('u1.sync.online') : tr('u1.sync.offline')}>
        {online ? tr('u1.sync.onlineBody') : tr('u1.sync.offlineBody')}
      </Banner>
      <Button label={tr('u1.sync.now')} icon="refresh-cw" loading={busy || syncing} disabled={!pending.length} onPress={syncNow} />

      <SectionTitle title={tr('u1.sync.pending', { count: pending.length })} />
      {pending.length ? <Card>{pending.map((op) => row(op, false))}</Card> : <EmptyState icon="check-circle" title={tr('u1.sync.allSent')} body={tr('u1.sync.allSentBody')} />}

      {conflicts.length ? (
        <>
          <SectionTitle title={tr('u1.sync.review', { count: conflicts.length })} />
          <Text variant="small" muted>{tr('u1.sync.refused')}</Text>
          <Card style={{ marginTop: spacing.xs }}>{conflicts.map((op) => row(op, true))}</Card>
        </>
      ) : null}
    </Screen>
  );
}
