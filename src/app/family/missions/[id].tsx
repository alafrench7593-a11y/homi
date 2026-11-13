/**
 * Détail d'une mission : état, qui demande / pour qui, échéance, produit et liste de courses, historique horodaté
 * (ajout seul, écrit par le serveur) et réponses rapides. Seul le destinataire répond ; seule la personne qui a
 * demandé annule, propose à quelqu'un d'autre ou envoie un rappel (1 par 24 h). Refus sans justification obligatoire.
 * Jamais de « vu à… » : une mission attend une réponse explicite.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { confirm, useToast } from '@/components/Overlays';
import { EmptyState, Skeleton } from '@/components/States';
import { Banner, Button, Card, Chip, Field, haptic, Icon, Text } from '@/components/ui';
import { tint } from '@/components/ToolGlyph';
import { Cascade, DetailEnter } from '@/motion';
import { DemoPerson } from '@/features/missions/DemoPerson';
import { missionWhen, StatePill } from '@/features/missions/MissionCard';
import { fmtWhen, parseFrDateTime, splitLocal } from '@/features/familyLoad';
import { useChildren } from '@/lib/data/hooks';
import { useDocument } from '@/lib/data/hooks-documents';
import { usePeople } from '@/lib/data/hooks-family-load';
import { useMission, useMissionHistory, useRespondMission, useShoppingItem } from '@/lib/data/hooks-missions';
import { friendlyError } from '@/lib/data/hooks-settings';
import { categoryOf } from '@/lib/domain/familyLoad';
import { creatorActionsFor, isPurchase, isTerminal, quickRepliesFor, viewerOf, type MissionAction } from '@/lib/domain/missions';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { formatDate, t as tr, type TKey } from '@/i18n';

type Panel = null | 'decline' | 'postpone' | 'ask' | 'reassign';
const TOAST: Record<MissionAction, TKey> = {
  accept: 'mis.toast.accept', start: 'mis.toast.start', complete: 'mis.toast.complete', decline: 'mis.toast.decline', postpone: 'mis.toast.postpone',
  ask: 'mis.toast.ask', cancel: 'mis.toast.cancel', remind: 'mis.toast.remind', reassign: 'mis.toast.reassign',
};
const EV_ICON: Record<string, 'send' | 'check' | 'x' | 'play' | 'check-circle' | 'clock' | 'help-circle' | 'slash' | 'user' | 'bell' | 'edit-3' | 'rotate-ccw'> = {
  created: 'send', accepted: 'check', declined: 'x', started: 'play', done: 'check-circle', postponed: 'clock', question: 'help-circle',
  cancelled: 'slash', assigned: 'user', unassigned: 'user', reminded: 'bell', updated: 'edit-3', reopened: 'rotate-ccw',
};

export default function MissionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  const toast = useToast();
  const q = useMission(id);
  const m = q.mission;
  const history = useMissionHistory(id);
  const respond = useRespondMission();
  const { labelOf, people, me } = usePeople();
  const { data: children } = useChildren();
  const item = useShoppingItem(m?.shopping_item_id);
  const doc = useDocument(m?.document_id ?? null);
  const [panel, setPanel] = useState<Panel>(null);
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [error, setError] = useState<string | undefined>();

  if (!m) {
    return (
      <Screen back title={tr('mis.detail.title')}>
        {q.isLoading ? <Skeleton kind="detail" /> : <EmptyState icon="search" title={tr('mis.detail.notFound')} body={tr('mis.detail.notFoundB')} action={{ label: tr('mis.title'), onPress: () => router.replace('/family/missions') }} />}
      </Screen>
    );
  }

  const viewer = viewerOf(m, me);
  const replies = quickRepliesFor(m, me);
  const creatorActions = creatorActionsFor(m, me);
  const cat = categoryOf(m.category);
  const child = children?.find((c) => c.id === m.child_id);
  const busy = respond.isPending;

  async function act(action: MissionAction, extra: { note?: string | null; due_at?: string | null; assignee_id?: string | null } = {}) {
    try {
      await respond.mutateAsync({ id: m!.id, action, version: m!.version, ...extra });
      haptic(action === 'complete' || action === 'accept' ? 'success' : 'light');
      toast(tr(TOAST[action]));
      setPanel(null); setNote(''); setError(undefined);
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  function open(p: Panel) {
    setError(undefined); setNote('');
    if (p === 'postpone') { const w = splitLocal(m!.due_at ?? new Date(Date.now() + 3600_000).toISOString()); setDate(w.date); setTime(w.time); }
    setPanel(panel === p ? null : p);
  }
  async function onReply(action: MissionAction) {
    if (action === 'decline') return open('decline');
    if (action === 'postpone') return open('postpone');
    if (action === 'ask') return open('ask');
    return act(action);
  }

  const status = isTerminal(m.mission_state) ? null : viewer === 'recipient' || viewer === 'open' ? tr('mis.detail.yourTurn') : tr('mis.detail.waiting');

  return (
    <Screen back title={tr('mis.detail.title')} subtitle={cat.label}>
      <DemoPerson />
      <DetailEnter>
        <Card style={{ gap: spacing.sm }} testID="mission-detail">
          <StatePill state={m.mission_state} testID={`mission-state-${m.mission_state}`} />
          <Text variant="title" accessibilityRole="header">{m.title}</Text>
          {m.notes ? <Text>{m.notes}</Text> : null}
          <View style={{ gap: 6 }}>
            <Meta icon="user" text={m.assignee_id ? tr('mis.to', { person: labelOf(m.assignee_id) }) : tr('mis.open')} />
            <Meta icon="send" text={tr('mis.from', { person: labelOf(m.created_by) })} />
            <Meta icon="calendar" text={m.due_at ? `${missionWhen(m)} · ${tr('mis.detail.agenda')}` : missionWhen(m)} />
            {child ? <Meta icon="smile" text={tr('mis.detail.child', { name: child.first_name })} /> : null}
            {m.domain_key ? <Meta icon="grid" text={tr('mis.detail.domain', { domain: tr(`cm.domain.${m.domain_key}` as TKey) })} /> : null}
            {doc.data?.[0] ? <Meta icon="paperclip" text={tr('mis.detail.doc', { title: doc.data[0].title })} /> : null}
          </View>
          {isPurchase(m) ? (
            <View testID="mission-shopping" style={{ gap: spacing.xs, padding: spacing.sm, borderRadius: radius.md,
              backgroundColor: tint(item?.checked ? t.colors.success : t.colors.primary, t.isDark ? 0.18 : 0.08) }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Icon name={item?.checked ? 'check-circle' : 'shopping-cart'} size={20} color={item?.checked ? t.colors.success : t.colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text weight="bold">{tr('mis.detail.product', { label: item?.label ?? m.product_label ?? m.title })}</Text>
                  <Text variant="small" muted testID="mission-shopping-state">{item ? (item.checked ? tr('mis.detail.bought') : tr('mis.detail.inList')) : tr('mis.detail.willAdd')}</Text>
                </View>
              </View>
              {item ? <Button label={tr('mis.detail.openList')} icon="shopping-cart" size="sm" variant="ghost" style={{ alignSelf: 'flex-start' }} onPress={() => router.push('/meals/shopping')} testID="mission-open-list" /> : null}
            </View>
          ) : null}
          {status ? <Text variant="small" muted>{status}</Text> : null}
        </Card>
      </DetailEnter>

      {replies.length ? (
        <Cascade index={1} style={{ gap: spacing.xs }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            {replies.map((r) => (
              <Button key={r.action} label={tr(r.label)} icon={r.icon} size="sm" variant={r.tone} loading={busy && respond.variables?.action === r.action}
                onPress={() => void onReply(r.action)} testID={`mission-reply-${r.action}`} />
            ))}
          </View>
        </Cascade>
      ) : null}

      {panel === 'decline' ? (
        <Card style={{ gap: spacing.sm }} testID="mission-panel-decline">
          <Field label={tr('mis.sheet.declineNote')} optional value={note} onChangeText={setNote} maxLength={300} hint={tr('mis.sheet.declineHint')} />
          <Button label={tr('mis.reply.decline')} icon="x" variant="secondary" loading={busy} onPress={() => void act('decline', { note: note.trim() || null })} testID="mission-decline-confirm" />
        </Card>
      ) : null}
      {panel === 'postpone' ? (
        <Card style={{ gap: spacing.sm }} testID="mission-panel-postpone">
          <Text variant="label">{tr('mis.sheet.postpone')}</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 3 }}><Field label={tr('mis.form.date')} value={date} onChangeText={setDate} error={error} keyboardType="numbers-and-punctuation" /></View>
            <View style={{ flex: 2 }}><Field label={tr('mis.form.time')} value={time} onChangeText={setTime} keyboardType="numbers-and-punctuation" /></View>
          </View>
          <Button label={tr('mis.sheet.send')} icon="clock" loading={busy} testID="mission-postpone-confirm"
            onPress={() => { const due = parseFrDateTime(date, time); if (!due) { setError(tr('mis.form.dateInvalid')); return; } void act('postpone', { due_at: due }); }} />
        </Card>
      ) : null}
      {panel === 'ask' ? (
        <Card style={{ gap: spacing.sm }} testID="mission-panel-ask">
          <Field label={tr('mis.sheet.ask')} value={note} onChangeText={setNote} maxLength={300} placeholder={tr('mis.sheet.askPh')} />
          <Button label={tr('mis.sheet.send')} icon="help-circle" loading={busy} onPress={() => void act('ask', { note: note.trim() || null })} />
        </Card>
      ) : null}

      {creatorActions.length || (m.created_by === me && m.assignee_id && !isTerminal(m.mission_state)) ? (
        <Cascade index={2} style={{ gap: spacing.xs }}>
          {creatorActions.includes('remind') ? <Button label={tr('mis.act.remind')} icon="bell" variant="secondary" onPress={() => void act('remind')} testID="mission-remind" /> : null}
          {m.created_by === me && m.assignee_id && !creatorActions.includes('remind') && !isTerminal(m.mission_state) && m.mission_state !== 'declined'
            ? <Text variant="caption" muted>{tr('mis.act.remindLimit')}</Text> : null}
          {creatorActions.includes('reassign') ? <Button label={tr('mis.act.reassign')} icon="users" variant="secondary" onPress={() => open('reassign')} testID="mission-reassign" /> : null}
          {panel === 'reassign' ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {people.filter((p) => p.id !== me && p.id !== m.assignee_id).map((p) => <Chip key={p.id} label={p.label} onPress={() => void act('reassign', { assignee_id: p.id })} />)}
            </View>
          ) : null}
          {creatorActions.includes('cancel') ? (
            <Button label={tr('mis.act.cancel')} icon="slash" variant="ghost" testID="mission-cancel"
              onPress={async () => { if (await confirm(tr('mis.act.cancel'), m.title, tr('mis.act.cancel'))) void act('cancel'); }} />
          ) : null}
        </Cascade>
      ) : null}

      <Banner tone="info" icon="eye-off">{tr('mis.detail.noRead')}</Banner>

      <Cascade index={3} style={{ gap: spacing.xs }}>
        <Text variant="heading" accessibilityRole="header">{tr('mis.detail.history')}</Text>
        <View testID="mission-history" style={{ gap: 0 }}>
          {(history.data ?? []).map((e, i, all) => {
            const to = (e.detail as { to?: string }).to;
            const label = tr(`mis.ev.${e.kind}` as TKey, { person: labelOf(to), when: to && e.kind === 'postponed' ? fmtWhen(to) : '' });
            const n = (e.detail as { note?: string }).note;
            return (
              <View key={e.id} style={{ flexDirection: 'row', gap: spacing.sm }}>
                <View style={{ alignItems: 'center', width: 28 }}>
                  <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: tint(t.colors.primary, t.isDark ? 0.22 : 0.1) }}>
                    <Icon name={EV_ICON[e.kind] ?? 'circle'} size={14} color={t.colors.primary} />
                  </View>
                  {i < all.length - 1 ? <View style={{ flex: 1, width: 2, minHeight: 12, backgroundColor: tint(t.colors.primary, 0.2) }} /> : null}
                </View>
                <View style={{ flex: 1, paddingBottom: spacing.sm }}>
                  <Text weight="medium">{label}</Text>
                  {n ? <Text variant="small">« {n} »</Text> : null}
                  <Text variant="caption" muted>{tr('mis.ev.by', { person: labelOf(e.actor_id), when: formatDate(e.created_at, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) })}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </Cascade>
    </Screen>
  );
}

function Meta({ icon, text }: { icon: 'user' | 'send' | 'calendar' | 'smile' | 'grid' | 'paperclip'; text: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
      <Icon name={icon} size={16} color={t.colors.textMuted} />
      <Text variant="small" style={{ flex: 1 }}>{text}</Text>
    </View>
  );
}
