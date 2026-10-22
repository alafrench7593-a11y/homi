/**
 * Cycle partagé avec moi : uniquement ce que la personne a choisi de partager, en lecture seule. Les estimations
 * sont recalculées sur ce téléphone à partir des seules dates partagées. Possibilité de ne plus recevoir le partage.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { confirm, useToast } from '@/components/Overlays';
import { EmptyState, Skeleton } from '@/components/States';
import { Button, Card, Chip, Icon, Row, Text } from '@/components/ui';
import { useUserId } from '@/lib/auth';
import { useCycleSharedWithMe, usePartnerCycle, useRevokeCycleShare, type SharedWithMe } from '@/lib/data/hooks-cycle3';
import { friendlyError } from '@/lib/data/hooks-settings';
import { estimateCycle } from '@/lib/domain/cycle';
import { daysBetween, todayISO } from '@/lib/domain/dates';
import { periodOn } from '@/lib/domain/cycleDaily';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

const fmt = (iso: string) => formatDate(`${iso}T12:00:00`, { day: 'numeric', month: 'short' });

export default function PartnerCycle() {
  const list = useCycleSharedWithMe();
  const [owner, setOwner] = useState<string | null>(null);
  const shares = list.data ?? [];
  const current = shares.find((s) => s.owner_id === owner) ?? shares[0] ?? null;
  return (
    <Screen back title={tr('c3.partner.title')}>
      {list.isLoading && !list.data ? <Skeleton kind="card" rows={2} /> : !shares.length ? <EmptyState icon="users" title={tr('c3.partner.none')} /> : (
        <>
          {shares.length > 1 ? <Row wrap>{shares.map((s) => <Chip key={s.owner_id} label={s.display_name} selected={s.owner_id === current?.owner_id} onPress={() => setOwner(s.owner_id)} />)}</Row> : null}
          {current ? <SharedView share={current} /> : null}
        </>
      )}
    </Screen>
  );
}

function SharedView({ share }: { share: SharedWithMe }) {
  const t = useTheme();
  const toast = useToast();
  const me = useUserId();
  const q = usePartnerCycle(share.owner_id);
  const leave = useRevokeCycleShare();
  const today = todayISO();
  const d = q.data;
  const est = useMemo(() => estimateCycle((d?.periods ?? []).map((p) => ({ start_date: p.start_date, end_date: p.end_date })), today), [d, today]);
  async function stop() {
    if (!me || !(await confirm(tr('c3.partner.leave'), tr('c3.partner.leaveConfirm'), tr('c3.partner.leave')))) return;
    try { await leave.mutateAsync({ owner: share.owner_id, partner: me }); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  if (q.isLoading && !d) return <Skeleton kind="card" rows={3} />;
  const facts: string[] = [];
  if (d && !d.paused && d.share_period) {
    const cur = periodOn((d.periods ?? []).map((p, i) => ({ ...p, id: String(i) })) as never, today);
    const until = est.nextPeriod ? daysBetween(today, est.nextPeriod) : null;
    if (cur) facts.push(tr('c3.home.inPeriod', { day: daysBetween(cur.start_date, today) + 1 }));
    else if (until != null) facts.push(until > 0 ? tr('c3.home.nextPeriod', { count: until }) : until === 0 ? tr('c3.home.nextPeriodToday') : tr('c3.home.periodLate', { count: -until }));
  }
  if (d && !d.paused && d.share_fertile && est.fertileWindow && est.fertileWindow.end >= today) {
    facts.push(est.fertileWindow.start <= today ? tr('c3.home.fertileNow') : tr('c3.home.fertile', { from: fmt(est.fertileWindow.start), to: fmt(est.fertileWindow.end) }));
  }
  return (
    <View testID="partner-cycle" style={{ gap: spacing.sm }}>
      <Text variant="heading">{tr('c3.partner.sharedBy', { name: share.display_name })}</Text>
      {!d || d.paused ? <Card tone="soft"><Text>{tr('c3.partner.paused')}</Text></Card> : (
        <>
          {facts.length ? (
            <Card>
              {facts.map((f) => <Row key={f} gap={8}><Icon name="calendar" size={15} color={t.colors.textMuted} /><Text style={{ flex: 1 }} testID="partner-fact">{f}</Text></Row>)}
              <Text variant="caption" muted style={{ marginTop: 4 }}>{tr('c3.partner.estimate')}</Text>
            </Card>
          ) : null}
          {d.share_mood ? (
            <Card>
              <Text weight="bold">{tr('c3.partner.moods')}</Text>
              {(d.moods ?? []).length ? (d.moods ?? []).slice(-5).reverse().map((m) => <Text key={m.date} variant="small">{`${fmt(m.date)} · ${m.moods.map((x) => tr(`c3.p.${x}` as TKey)).join(', ')}`}</Text>) : <Text variant="small" muted>{tr('c3.partner.nothing')}</Text>}
            </Card>
          ) : null}
          {d.share_symptoms ? (
            <Card>
              <Text weight="bold">{tr('c3.partner.symptoms')}</Text>
              {(d.symptoms ?? []).filter((s) => s.keys.length).length ? (d.symptoms ?? []).filter((s) => s.keys.length).slice(-5).reverse().map((s) => <Text key={s.date} variant="small">{`${fmt(s.date)} · ${s.keys.map((x) => tr(`cy.sym.${x}` as TKey)).join(', ')}`}</Text>) : <Text variant="small" muted>{tr('c3.partner.nothing')}</Text>}
            </Card>
          ) : null}
          <Card tone="lavender"><Text variant="small">{tr('c3.partner.help')}</Text></Card>
        </>
      )}
      <Button label={tr('c3.partner.leave')} variant="ghost" icon="x-circle" onPress={stop} testID="partner-leave" />
    </View>
  );
}
