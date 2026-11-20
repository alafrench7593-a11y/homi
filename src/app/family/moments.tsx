/**
 * 179 — Missions de reconnexion : de petites idées pour se retrouver à deux (bibliothèque écrite à l'avance, 5 langues,
 * sans obligation ni culpabilisation), proposées par un parent à l'autre. L'autre accepte ou décline, sans avoir à se
 * justifier ; un moment accepté se planifie (il apparaît dans l'agenda) ; l'historique garde les moments passés.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, Skeleton } from '@/components/States';
import { GlassSheet } from '@/components/glass';
import { confirm, useToast } from '@/components/Overlays';
import { Banner, Button, Card, Chip, ListGroup, ListRow, Row, Text } from '@/components/ui';
import { WhenFields, whenOf, whenToIso, type WhenValue } from '@/components/CareInputs';
import { InviteOtherParent } from '@/features/couple/CoupleKit';
import { spacing } from '@/theme/tokens';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { useHouseholdId } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { usePeople } from '@/lib/data/hooks-family-load';
import { useDeleteMoment, useMoments, useOtherParent, useProposeMoment, useRespondMoment } from '@/lib/data/hooks-calmMoments';
import { ideaOf, momentActions, splitMoments, suggestedIdeas, type Moment, type MomentAction } from '@/features/moments/domain';

const ideaTitle = (k: string) => tr(`mom.idea.${k}.title` as TKey);
const ideaSub = (k: string) => tr(`mom.idea.${k}.sub` as TKey);
const LONG = { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' } as const;

function PlanSheet({ moment, onClose }: { moment: Moment | null; onClose: () => void }) {
  const toast = useToast();
  const respond = useRespondMoment();
  const [v, setV] = useState<WhenValue>(whenOf());
  React.useEffect(() => { if (moment) setV(moment.planned_at ? whenOf(moment.planned_at) : { ...whenOf(), time: '20:30' }); }, [moment?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!moment) return null;
  async function save() {
    const at = whenToIso(v);
    if (!at) return toast(tr('mom.err.date'), 'error');
    if (Date.parse(at) < Date.now() - 3600_000) return toast(tr('mom.err.past'), 'error');
    try {
      const r = await respond.mutateAsync({ id: moment!.id, action: 'plan', plannedAt: at, duration: ideaOf(moment!.idea_key)?.minutes ?? null });
      toast(r === 'queued' ? tr('mom.savedOffline') : tr('mom.planned'), 'success');
      onClose();
    } catch (x) { toast(friendlyError(x), 'error'); }
  }
  return (
    <GlassSheet visible onClose={onClose} title={tr('mom.plan.title')}>
      <Text weight="bold">{ideaTitle(moment.idea_key)}</Text>
      <WhenFields value={v} onChange={setV} testID="mom-plan" />
      <Text variant="caption" muted>{tr('mom.plan.agenda')}</Text>
      <Button label={tr('mom.plan.save')} icon="calendar" loading={respond.isPending} onPress={() => void save()} testID="mom-plan-save" />
    </GlassSheet>
  );
}

function ProposeSheet({ visible, onClose, list, to, toName }: { visible: boolean; onClose: () => void; list: Moment[]; to: string; toName: string }) {
  const toast = useToast();
  const propose = useProposeMoment();
  const [pick, setPick] = useState<string | null>(null);
  const ideas = useMemo(() => suggestedIdeas(list), [list]);
  async function send() {
    if (!pick) return;
    try {
      const r = await propose.mutateAsync({ ideaKey: pick, to });
      toast(r === 'queued' ? tr('mom.savedOffline') : tr('mom.proposed', { name: toName }), 'success');
      setPick(null); onClose();
    } catch (x) { toast(friendlyError(x), 'error'); }
  }
  return (
    <GlassSheet visible={visible} onClose={onClose} title={tr('mom.propose.title')}>
      <Text variant="small" muted>{tr('mom.propose.intro', { name: toName })}</Text>
      <ListGroup testID="mom-ideas">
        {ideas.map((i) => (
          <ListRow key={i.key} icon={i.icon} title={ideaTitle(i.key)} subtitle={`${ideaSub(i.key)} · ${tr('mom.minutes', { count: i.minutes })}`}
            onPress={() => setPick(i.key)} right={pick === i.key ? <Chip label={tr('mom.propose.chosen')} selected /> : undefined} testID={`mom-idea-${i.key}`} />
        ))}
      </ListGroup>
      <Button label={tr('mom.propose.send', { name: toName })} icon="send" disabled={!pick} loading={propose.isPending} onPress={() => void send()} testID="mom-propose-send" />
    </GlassSheet>
  );
}

export default function CoupleMoments() {
  const toast = useToast();
  const hid = useHouseholdId();
  const other = useOtherParent();
  const { nameOf } = usePeople();
  const q = useMoments();
  const respond = useRespondMoment();
  const del = useDeleteMoment();
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState<Moment | null>(null);
  const list = q.data ?? [];
  const split = useMemo(() => splitMoments(list, q.me), [list, q.me]);

  async function act(m: Moment, a: MomentAction | 'delete') {
    if (a === 'plan') return setPlan(m);
    if (a === 'delete') {
      if (!(await confirm(tr('mom.delete'), tr('mom.deleteQ'), tr('mom.delete')))) return;
      try { await del.mutateAsync(m.id); toast(tr('mom.deleted'), 'success'); } catch (x) { toast(friendlyError(x), 'error'); }
      return;
    }
    if (a === 'cancel' && !(await confirm(tr('mom.cancel'), tr('mom.cancelQ'), tr('mom.cancel')))) return;
    try {
      const r = await respond.mutateAsync({ id: m.id, action: a });
      toast(r === 'queued' ? tr('mom.savedOffline') : tr(`mom.done.${a}` as TKey), 'success');
    } catch (x) { toast(friendlyError(x), 'error'); }
  }
  const buttons = (m: Moment, keys: (MomentAction | 'delete')[]) => (
    <Row wrap gap={spacing.xs}>
      {momentActions(m, q.me).filter((a) => keys.includes(a)).map((a) => (
        <Button key={a} label={tr(`mom.act.${a}` as TKey)} size="sm" variant={a === 'accept' || a === 'done' ? 'primary' : a === 'plan' ? 'secondary' : 'ghost'}
          onPress={() => void act(m, a)} testID={`mom-${a}-${m.idea_key}`} />
      ))}
    </Row>
  );

  if (!hid || (q.isLoading && !q.data)) return <Screen back title={tr('mom.title')} tool={false}><Skeleton rows={4} /></Screen>;
  return (
    <Screen back title={tr('mom.title')} subtitle={tr('mom.subtitle')} tool={false}
      action={other ? { label: tr('mom.propose.title'), icon: 'heart', onPress: () => setOpen(true), testID: 'mom-propose' } : undefined}>
      <Text muted>{tr('mom.intro')}</Text>
      {!other ? <><Banner tone="info" icon="users">{tr('mom.noPartner')}</Banner><InviteOtherParent testID="mom-invite" /></> : null}

      {split.toAnswer.map((m) => (
        <Card key={m.id} testID={`mom-in-${m.idea_key}`}>
          <Text variant="caption" muted>{tr('mom.fromName', { name: nameOf(m.from_user) })}</Text>
          <Text weight="bold">{ideaTitle(m.idea_key)}</Text>
          <Text variant="small" muted>{ideaSub(m.idea_key)}</Text>
          {buttons(m, ['accept', 'plan', 'decline'])}
          <Text variant="caption" muted>{tr('mom.noJustify')}</Text>
        </Card>
      ))}

      {split.upcoming.length ? (
        <View style={{ gap: spacing.sm }} testID="mom-upcoming">
          <Text variant="heading" accessibilityRole="header">{tr('mom.upcoming')}</Text>
          {split.upcoming.map((m) => (
            <Card key={m.id} testID={`mom-up-${m.idea_key}`}>
              <Text weight="bold">{ideaTitle(m.idea_key)}</Text>
              <Text variant="small" muted>{m.planned_at ? formatDate(m.planned_at, LONG) : tr('mom.toPlan')}{m._pending ? ` · ${tr('mom.pending')}` : ''}</Text>
              {buttons(m, ['plan', 'done', 'cancel'])}
            </Card>
          ))}
        </View>
      ) : null}

      {split.waiting.length ? (
        <ListGroup title={tr('mom.waiting')} testID="mom-waiting">
          {split.waiting.map((m) => (
            <ListRow key={m.id} icon={ideaOf(m.idea_key)?.icon ?? 'heart'} title={ideaTitle(m.idea_key)}
              subtitle={[tr('mom.toName', { name: nameOf(m.to_user) }), m._pending ? tr('mom.pending') : null].filter(Boolean).join(' · ')}
              right={<Button label={tr('mom.act.cancel')} size="sm" variant="ghost" onPress={() => void act(m, 'cancel')} testID={`mom-cancel-${m.idea_key}`} />} testID={`mom-wait-${m.idea_key}`} />
          ))}
        </ListGroup>
      ) : null}

      {other && !split.toAnswer.length && !split.upcoming.length && !split.waiting.length ? (
        <EmptyState icon="heart" title={tr('mom.emptyTitle')} body={tr('mom.emptyBody')} action={{ label: tr('mom.propose.title'), onPress: () => setOpen(true) }} />
      ) : null}

      {split.past.length ? (
        <ListGroup title={tr('mom.past')} testID="mom-past">
          {split.past.map((m) => (
            <ListRow key={m.id} icon={ideaOf(m.idea_key)?.icon ?? 'heart'} title={ideaTitle(m.idea_key)}
              subtitle={m.done_at ? formatDate(m.done_at, { weekday: 'long', day: 'numeric', month: 'long' }) : undefined}
              right={momentActions(m, q.me).includes('delete') ? <Button label={tr('mom.act.delete')} size="sm" variant="ghost" onPress={() => void act(m, 'delete')} testID={`mom-delete-${m.idea_key}`} /> : undefined}
              testID={`mom-past-${m.idea_key}`} />
          ))}
        </ListGroup>
      ) : null}
      {split.closed.length ? (
        <ListGroup title={tr('mom.closed')}>
          {split.closed.slice(0, 20).map((m) => (
            <ListRow key={m.id} icon={ideaOf(m.idea_key)?.icon ?? 'heart'} title={ideaTitle(m.idea_key)} subtitle={tr(m.status === 'declined' ? 'mom.state.declined' : 'mom.state.cancelled')}
              right={momentActions(m, q.me).includes('delete') ? <Button label={tr('mom.act.delete')} size="sm" variant="ghost" onPress={() => void act(m, 'delete')} /> : undefined} />
          ))}
        </ListGroup>
      ) : null}
      <Button label={tr('mom.agenda')} variant="ghost" icon="calendar" onPress={() => router.push('/calendar')} testID="mom-agenda" />
      <Text variant="caption" muted>{tr('mom.footer')}</Text>
      {other ? <ProposeSheet visible={open} onClose={() => setOpen(false)} list={list} to={other.id} toName={other.name} /> : null}
      <PlanSheet moment={plan} onClose={() => setPlan(null)} />
    </Screen>
  );
}
