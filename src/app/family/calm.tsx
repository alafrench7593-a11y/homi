/**
 * 172 — Mode embrouille. Pour les jours où parler est difficile : un interrupteur PERSONNEL (l'autre n'est pas
 * prévenu, rien n'est présenté comme un reproche) ; des demandes pratiques écrites à l'avance (modèle + date / heure +
 * enfant), envoyées comme missions, auxquelles on répond en un geste. Aucune zone de texte libre, aucune statistique,
 * aucun compteur. Le mode se coupe à la main.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, Skeleton } from '@/components/States';
import { GlassSheet } from '@/components/glass';
import { confirm, useToast } from '@/components/Overlays';
import { Banner, Button, Card, Chip, ListGroup, ListRow, Row, Text } from '@/components/ui';
import { WhenFields, whenOf, whenToIso, whenDay, type WhenValue } from '@/components/CareInputs';
import { InviteOtherParent, SwitchRow } from '@/features/couple/CoupleKit';
import { spacing } from '@/theme/tokens';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { useChildren, useHouseholdId } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { usePeople } from '@/lib/data/hooks-family-load';
import {
  useCalmMode, useCalmReply, useCalmRequests, useOtherParent, useSendCalmRequest, useSetCalmMode, useUpdateCalmRequest,
} from '@/lib/data/hooks-calmMoments';
import {
  CALM_TEMPLATES, calmTitle, draftDueAt, repliesFor, splitRequests, stateLabel, templateOf, validateDraft,
  type CalmItem, type CalmReply, type CalmTemplateKey,
} from '@/features/calm/domain';
import { MotionItem, MotionList } from '@/motion/ListMotion';

const REPLY_ICON: Record<CalmReply, 'thumbs-up' | 'x' | 'check'> = { accept: 'thumbs-up', decline: 'x', complete: 'check' };

function when(it: Pick<CalmItem, 'due_at' | 'template_key'>) {
  if (!it.due_at) return null;
  const tpl = templateOf(it.template_key);
  return formatDate(it.due_at, tpl?.time ? { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' } : { weekday: 'long', day: 'numeric', month: 'long' });
}

function NewRequestSheet({ visible, onClose, to, toName }: { visible: boolean; onClose: () => void; to: string; toName: string }) {
  const toast = useToast();
  const send = useSendCalmRequest();
  const kids = (useChildren().data ?? []).filter((k) => !k.archived);
  const [template, setTemplate] = useState<CalmTemplateKey | null>(null);
  const [whenV, setWhenV] = useState<WhenValue>(whenOf());
  const [childId, setChildId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const tpl = template ? templateOf(template) : null;

  function pick(k: CalmTemplateKey) {
    setTemplate(k); setErr(null);
    const t0 = templateOf(k)!;
    setWhenV((v) => ({ ...v, time: t0.defaultTime }));
    if (t0.child === 'none') setChildId(null);
    else if (!childId && kids.length === 1) setChildId(kids[0].id);
  }
  async function submit() {
    const day = whenDay(whenV);
    const e = validateDraft({ template, date: day ?? '', time: whenV.time.trim(), childId });
    if (e) return setErr(tr(e));
    const dueAt = draftDueAt(day!, tpl!.time ? whenV.time.trim() : null);
    const child = kids.find((k) => k.id === childId);
    try {
      const r = await send.mutateAsync({ template: template!, to, title: calmTitle(template!, { childName: child?.first_name, dueAt, withTime: tpl!.time }), dueAt, childId });
      toast(r === 'queued' ? tr('calm.sentOffline') : tr('calm.sent', { name: toName }), 'success');
      setTemplate(null); setErr(null); setWhenV(whenOf());
      onClose();
    } catch (x) { toast(friendlyError(x), 'error'); }
  }
  return (
    <GlassSheet visible={visible} onClose={onClose} title={tr('calm.new.title')}>
      <Text variant="small" muted>{tr('calm.new.intro', { name: toName })}</Text>
      <ListGroup title={tr('calm.new.what')} testID="calm-templates">
        {CALM_TEMPLATES.map((x) => (
          <ListRow key={x.key} icon={x.icon} title={tr(`calm.tpl.${x.key}.label` as TKey)} subtitle={tr(`calm.tpl.${x.key}.sub` as TKey)}
            onPress={() => pick(x.key)} right={template === x.key ? <Chip label={tr('calm.new.chosen')} selected /> : undefined} testID={`calm-tpl-${x.key}`} />
        ))}
      </ListGroup>
      {tpl ? (
        <>
          <WhenFields value={whenV} onChange={setWhenV} withTime={tpl.time} testID="calm-when" />
          {tpl.child !== 'none' && kids.length ? (
            <View style={{ gap: spacing.xs }}>
              <Text variant="label">{tpl.child === 'required' ? tr('calm.new.child') : tr('calm.new.childOpt')}</Text>
              <Row wrap>{kids.map((k) => <Chip key={k.id} label={k.first_name} selected={childId === k.id} onPress={() => setChildId(childId === k.id ? null : k.id)} testID={`calm-child-${k.first_name}`} />)}</Row>
            </View>
          ) : null}
          <Card tone="soft">
            <Text variant="caption" muted>{tr('calm.new.preview')}</Text>
            <Text weight="bold" testID="calm-preview">{calmTitle(tpl.key, { childName: kids.find((k) => k.id === childId)?.first_name, dueAt: whenToIso(whenV, tpl.time), withTime: tpl.time })}</Text>
          </Card>
        </>
      ) : null}
      {err ? <Banner tone="danger">{err}</Banner> : null}
      <Text variant="caption" muted>{tr('calm.new.noText')}</Text>
      <Button label={tr('calm.new.send', { name: toName })} icon="send" loading={send.isPending} disabled={!template} onPress={() => void submit()} testID="calm-send" />
    </GlassSheet>
  );
}

function ChangeTimeSheet({ item, onClose }: { item: CalmItem | null; onClose: () => void }) {
  const toast = useToast();
  const upd = useUpdateCalmRequest();
  const [v, setV] = useState<WhenValue>(whenOf(item?.due_at));
  const tpl = item ? templateOf(item.template_key) : null;
  React.useEffect(() => { setV(whenOf(item?.due_at)); }, [item?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!item || !tpl) return null;
  async function save() {
    const at = whenToIso(v, tpl!.time);
    if (!at) return toast(tr('calm.err.date'), 'error');
    try { await upd.mutateAsync({ id: item!.id, dueAt: at }); toast(tr('calm.timeChanged'), 'success'); onClose(); } catch (x) { toast(friendlyError(x), 'error'); }
  }
  return (
    <GlassSheet visible onClose={onClose} title={tr('calm.changeTime')}>
      <WhenFields value={v} onChange={setV} withTime={tpl.time} testID="calm-edit-when" />
      <Button label={tr('common.save')} icon="check" loading={upd.isPending} onPress={() => void save()} testID="calm-edit-save" />
    </GlassSheet>
  );
}

export default function CalmMode() {
  const toast = useToast();
  const hid = useHouseholdId();
  const mode = useCalmMode();
  const setMode = useSetCalmMode();
  const other = useOtherParent();
  const { nameOf } = usePeople();
  const kids = useChildren().data ?? [];
  const reqQ = useCalmRequests();
  const reply = useCalmReply();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CalmItem | null>(null);
  const split = useMemo(() => splitRequests(reqQ.data ?? [], reqQ.states, reqQ.me), [reqQ.data, reqQ.states, reqQ.me]);

  const titleOf = (it: CalmItem) => tr(`calm.tpl.${it.template_key}.label` as TKey);
  const subOf = (it: CalmItem) => {
    const child = it.child_id ? kids.find((k) => k.id === it.child_id)?.first_name : null;
    return [child, when(it)].filter(Boolean).join(' · ');
  };
  async function answer(it: CalmItem, r: CalmReply | 'cancel') {
    if (r === 'cancel' && !(await confirm(tr('calm.cancel'), tr('calm.cancelQ'), tr('calm.cancel')))) return;
    try {
      const res = await reply.mutateAsync({ taskId: it.task_id, action: r });
      toast(res === 'queued' ? tr('calm.replyOffline') : tr(`calm.replied.${r}` as TKey), 'success');
    } catch (x) { toast(friendlyError(x), 'error'); }
  }
  async function toggle(v: boolean) {
    try { await setMode.mutateAsync(v); toast(v ? tr('calm.onToast') : tr('calm.offToast'), 'info'); } catch (x) { toast(friendlyError(x), 'error'); }
  }

  if (!hid || reqQ.loading) return <Screen back title={tr('calm.title')} tool={false}><Skeleton rows={4} /></Screen>;
  return (
    <Screen back title={tr('calm.title')} subtitle={tr('calm.subtitle')} tool={false}
      action={other ? { label: tr('calm.new.title'), icon: 'plus', onPress: () => setOpen(true), testID: 'calm-new' } : undefined}>
      <Text muted>{tr('calm.intro')}</Text>
      <Card testID="calm-switch-card">
        <SwitchRow label={tr('calm.switch')} value={mode.active} onChange={(v) => void toggle(v)} testID="calm-toggle" />
        <Text variant="small" muted testID="calm-status">
          {mode.active ? (mode.since ? tr('calm.onSince', { date: formatDate(mode.since, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) }) : tr('calm.on')) : tr('calm.off')}
        </Text>
        <Text variant="caption" muted>{tr('calm.private')}</Text>
      </Card>
      {!other ? <><Banner tone="info" icon="users">{tr('calm.noPartner')}</Banner><InviteOtherParent testID="calm-invite" /></> : null}

      {split.received.length ? (
        <View style={{ gap: spacing.sm }} testID="calm-received">
          <Text variant="heading" accessibilityRole="header">{tr('calm.received')}</Text>
          <MotionList style={{ gap: spacing.sm }}>{split.received.map((it) => (
            <MotionItem key={it.id}><Card key={it.id} testID={`calm-in-${it.template_key}`}>
              <Text weight="bold">{titleOf(it)}</Text>
              <Text variant="small" muted>{[subOf(it), tr('calm.from', { name: nameOf(it.from_user) }), stateLabel(it.state)].filter(Boolean).join(' · ')}</Text>
              <Row wrap gap={spacing.xs}>
                {repliesFor(it.state).map((r) => (
                  <Button key={r} label={tr(`calm.reply.${r}` as TKey)} icon={REPLY_ICON[r]} size="sm" variant={r === 'decline' ? 'secondary' : 'primary'}
                    loading={reply.isPending && reply.variables?.taskId === it.task_id && reply.variables?.action === r} onPress={() => void answer(it, r)} testID={`calm-reply-${r}-${it.template_key}`} />
                ))}
              </Row>
            </Card></MotionItem>
          ))}</MotionList>
        </View>
      ) : null}

      {split.sent.length ? (
        <View style={{ gap: spacing.sm }} testID="calm-sent">
          <Text variant="heading" accessibilityRole="header">{tr('calm.sentTitle')}</Text>
          <MotionList style={{ gap: spacing.sm }}>{split.sent.map((it) => (
            <MotionItem key={it.id}><Card key={it.id} testID={`calm-out-${it.template_key}`}>
              <Text weight="bold">{titleOf(it)}</Text>
              <Text variant="small" muted>{[subOf(it), tr('calm.to', { name: nameOf(it.to_user) }), stateLabel(it.state)].filter(Boolean).join(' · ')}</Text>
              <Row wrap gap={spacing.xs}>
                <Button label={tr('calm.changeTime')} icon="clock" size="sm" variant="secondary" onPress={() => setEditing(it)} testID={`calm-time-${it.template_key}`} />
                <Button label={tr('calm.cancel')} size="sm" variant="ghost" onPress={() => void answer(it, 'cancel')} testID={`calm-cancel-${it.template_key}`} />
              </Row>
            </Card></MotionItem>
          ))}</MotionList>
        </View>
      ) : null}

      {other && !split.received.length && !split.sent.length ? (
        <EmptyState icon="feather" title={tr('calm.emptyTitle')} body={tr('calm.emptyBody', { name: other.name })} action={{ label: tr('calm.new.title'), onPress: () => setOpen(true) }} />
      ) : null}

      {split.history.length ? (
        <ListGroup title={tr('calm.history')} testID="calm-history">
          {split.history.slice(0, 40).map((it) => (
            <ListRow key={it.id} icon={templateOf(it.template_key)?.icon} title={titleOf(it)}
              subtitle={[subOf(it), it.direction === 'sent' ? tr('calm.to', { name: nameOf(it.to_user) }) : tr('calm.from', { name: nameOf(it.from_user) }), stateLabel(it.state)].filter(Boolean).join(' · ')}
              onPress={() => router.push(`/family/missions/${it.task_id}`)} />
          ))}
        </ListGroup>
      ) : null}
      <Button label={tr('calm.allMissions')} variant="ghost" icon="list" onPress={() => router.push('/family/missions')} testID="calm-missions" />
      <Text variant="caption" muted>{tr('calm.footer')}</Text>
      {other ? <NewRequestSheet visible={open} onClose={() => setOpen(false)} to={other.id} toName={other.name} /> : null}
      <ChangeTimeSheet item={editing} onClose={() => setEditing(null)} />
    </Screen>
  );
}
