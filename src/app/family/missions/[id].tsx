/**
 * Détail d'une mission (refonte 16/11/2026).
 *  - Arrivée : transition de scène (`DetailScene`, réponse à la ligne touchée : `CardSource`) ; retour : même ligne,
 *    même position dans la liste ou sur l'accueil.
 *  - Panneau de détail en verre fumé (`SmokedSurface`) : état, titre, POUR qui et DEMANDÉE PAR qui (prénom + avatar,
 *    household_member_names), échéance, enfant, domaine, pièce jointe, liste de courses liée.
 *  - Point focal = la réponse attendue (`OpticalSurface`) : pour le destinataire, UNE action pleine (« J'accepte » ou
 *    « C'est terminé »), les autres réponses en retrait ; refus sans justification obligatoire. Pour l'autrice : où en
 *    est la mission, rappel (1 par 24 h), proposer à quelqu'un d'autre, annuler (rouge, confirmation).
 *  - Confirmation selon le résultat RÉEL du serveur : « ok » → message de l'action ; « unchanged » (rejeu) → « déjà
 *    fait » ; « conflict » → la mission a changé, l'écran se recharge ; erreur → message, rien n'est annoncé.
 *  - Historique sobre (surface mate), ajout seul, écrit par le serveur. Jamais de « vu à… ».
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { confirm, useToast } from '@/components/Overlays';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Button, Field, haptic, Icon, Text, type IconName } from '@/components/ui';
import { UserAvatar } from '@/components/UserAvatar';
import { Cascade } from '@/motion';
import { DetailScene, MatteSurface, MemberSelector, OpticalSurface, SmokedSurface } from '@/features/scene';
import { DemoPerson } from '@/features/missions/DemoPerson';
import { missionWhen, StatePill } from '@/features/missions/MissionCard';
import { fmtWhen, parseFrDateTime, splitLocal } from '@/features/familyLoad';
import { useChildren } from '@/lib/data/hooks';
import { useDocument } from '@/lib/data/hooks-documents';
import { usePeople, type Person } from '@/lib/data/hooks-family-load';
import { useMission, useMissionHistory, useRespondMission, useShoppingItem } from '@/lib/data/hooks-missions';
import { friendlyError } from '@/lib/data/hooks-settings';
import { categoryOf } from '@/lib/domain/familyLoad';
import { creatorActionsFor, isPurchase, isTerminal, quickRepliesFor, viewerOf, type MissionAction } from '@/lib/domain/missions';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { formatDate, t as tr, type TKey } from '@/i18n';

type Panel = null | 'decline' | 'postpone' | 'ask' | 'reassign';
const TOAST: Record<MissionAction, TKey> = {
  accept: 'mis.toast.accept', start: 'mis.toast.start', complete: 'mis.toast.complete', decline: 'mis.toast.decline', postpone: 'mis.toast.postpone',
  ask: 'mis.toast.ask', cancel: 'mis.toast.cancel', remind: 'mis.toast.remind', reassign: 'mis.toast.reassign',
};
const EV_ICON: Record<string, IconName> = {
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
  const { people, me, personOf, nameOf } = usePeople();
  const { data: children } = useChildren();
  const item = useShoppingItem(m?.shopping_item_id);
  const doc = useDocument(m?.document_id ?? null);
  const [panel, setPanel] = useState<Panel>(null);
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [reassignTo, setReassignTo] = useState<string>('');

  if (!m) {
    return (
      <Screen back title={tr('mis.detail.title')}>
        {q.isLoading ? <Skeleton kind="detail" />
          : q.isError ? <ErrorView error={q.error} onRetry={() => void q.refetch()} />
            : <EmptyState icon="search" title={tr('mis.detail.notFound')} body={tr('mis.detail.notFoundB')} action={{ label: tr('mis.title'), onPress: () => router.replace('/family/missions') }} />}
      </Screen>
    );
  }

  const viewer = viewerOf(m, me ?? '');
  const replies = quickRepliesFor(m, me ?? '');
  const creatorActions = creatorActionsFor(m, me ?? '');
  const cat = categoryOf(m.category);
  const child = children?.find((c) => c.id === m.child_id);
  const busy = respond.isPending;
  const assignee = personOf(m.assignee_id);
  const creator = personOf(m.created_by);
  const [primary, ...others] = replies;

  async function act(action: MissionAction, extra: { note?: string | null; due_at?: string | null; assignee_id?: string | null } = {}) {
    try {
      const out = await respond.mutateAsync({ id: m!.id, action, version: m!.version, ...extra });
      // Confirmation = résultat réel du serveur
      if (out?.status === 'conflict') { toast(tr('ht.conflict'), 'error'); void q.refetch(); return; }
      haptic(action === 'complete' || action === 'accept' ? 'success' : 'light');
      toast(out?.unchanged ? tr('mis.toast.unchanged') : tr(TOAST[action]));
      setPanel(null); setNote(''); setError(undefined); setReassignTo('');
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

  const answerer = viewer === 'recipient' || viewer === 'open';
  const isCreator = m.created_by === me;
  const reassignable = people.filter((p) => p.id !== me && p.id !== m.assignee_id);

  return (
    <Screen back title={tr('mis.detail.title')} subtitle={cat.label}>
      <DemoPerson />
      <DetailScene testID="mission-detail-scene" style={{ gap: spacing.md }}>
        {/* Panneau de détail : verre fumé */}
        <SmokedSurface testID="mission-detail" style={{ gap: spacing.sm }}>
          <StatePill state={m.mission_state} testID={`mission-state-${m.mission_state}`} />
          <Text variant="title" accessibilityRole="header">{m.title}</Text>
          {m.notes ? <Text>{m.notes}</Text> : null}
          <View style={{ gap: spacing.xs }}>
            <PersonMeta label={m.assignee_id ? (m.assignee_id === me ? tr('mis.toYou') : tr('mis.to', { person: assignee?.name ?? nameOf(m.assignee_id) })) : tr('mis.open')}
              person={assignee} icon="user" testID="mission-to" />
            <PersonMeta label={isCreator ? tr('mis.fromYou') : tr('mis.from', { person: creator?.name ?? nameOf(m.created_by) })} person={creator} icon="send" testID="mission-from" />
            <Meta icon="calendar" text={m.due_at ? `${missionWhen(m)} · ${tr('mis.detail.agenda')}` : missionWhen(m)} />
          </View>
        </SmokedSurface>

        {/* Point focal : la réponse attendue (destinataire) */}
        {answerer && primary ? (
          <OpticalSurface testID="mission-answer">
            <Text variant="caption" weight="bold" color={t.colors.primary} accessibilityRole="header">{tr('mis.detail.expected')}</Text>
            <Text variant="small" muted>{creator && !isCreator ? tr('mis.detail.askedBy', { person: creator.name }) : tr('mis.detail.yourTurn')}</Text>
            <Button label={tr(primary.label)} icon={primary.icon} full loading={busy && respond.variables?.action === primary.action} disabled={busy}
              onPress={() => void onReply(primary.action)} testID={`mission-reply-${primary.action}`} />
            {others.length ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                {others.map((r) => (
                  <Button key={r.action} label={tr(r.label)} icon={r.icon} size="sm" variant={r.tone === 'primary' ? 'secondary' : r.tone} disabled={busy}
                    loading={busy && respond.variables?.action === r.action} onPress={() => void onReply(r.action)} testID={`mission-reply-${r.action}`} />
                ))}
              </View>
            ) : null}
            {panel === 'decline' ? (
              <View style={{ gap: spacing.sm }} testID="mission-panel-decline">
                <Field label={tr('mis.sheet.declineNote')} optional value={note} onChangeText={setNote} maxLength={300} hint={tr('mis.sheet.declineHint')} />
                <Button label={tr('mis.reply.decline')} icon="x" variant="secondary" loading={busy} onPress={() => void act('decline', { note: note.trim() || null })} testID="mission-decline-confirm" />
              </View>
            ) : null}
            {panel === 'postpone' ? (
              <View style={{ gap: spacing.sm }} testID="mission-panel-postpone">
                <Text variant="label">{tr('mis.sheet.postpone')}</Text>
                <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
                  <View style={{ flex: 3, minWidth: 140 }}><Field label={tr('mis.form.date')} value={date} onChangeText={setDate} error={error} keyboardType="numbers-and-punctuation" /></View>
                  <View style={{ flex: 2, minWidth: 100 }}><Field label={tr('mis.form.time')} value={time} onChangeText={setTime} keyboardType="numbers-and-punctuation" /></View>
                </View>
                <Button label={tr('mis.sheet.send')} icon="clock" loading={busy} testID="mission-postpone-confirm"
                  onPress={() => { const due = parseFrDateTime(date, time); if (!due) { setError(tr('mis.form.dateInvalid')); return; } void act('postpone', { due_at: due }); }} />
              </View>
            ) : null}
            {panel === 'ask' ? (
              <View style={{ gap: spacing.sm }} testID="mission-panel-ask">
                <Field label={tr('mis.sheet.ask')} value={note} onChangeText={setNote} maxLength={300} placeholder={tr('mis.sheet.askPh')} />
                <Button label={tr('mis.sheet.send')} icon="help-circle" loading={busy} onPress={() => void act('ask', { note: note.trim() || null })} />
              </View>
            ) : null}
          </OpticalSurface>
        ) : null}

        {/* Autrice : suivi, rappel, proposer à quelqu'un d'autre, annuler */}
        {isCreator && (creatorActions.length || !isTerminal(m.mission_state)) ? (
          <SmokedSurface testID="mission-follow" style={{ gap: spacing.sm }}>
            <Text variant="caption" weight="bold" muted accessibilityRole="header">{tr('mis.detail.follow')}</Text>
            {!isTerminal(m.mission_state) ? (
              <Text variant="small">{m.mission_state === 'declined' ? tr('mis.detail.declinedNext')
                : m.assignee_id ? tr('mis.detail.waitingFor', { person: assignee?.name ?? nameOf(m.assignee_id) }) : tr('mis.detail.waiting')}</Text>
            ) : null}
            {creatorActions.includes('remind') ? <Button label={tr('mis.act.remind')} icon="bell" variant="secondary" disabled={busy} onPress={() => void act('remind')} testID="mission-remind" /> : null}
            {m.assignee_id && !creatorActions.includes('remind') && !isTerminal(m.mission_state) && m.mission_state !== 'declined'
              ? <Text variant="caption" muted>{tr('mis.act.remindLimit')}</Text> : null}
            {creatorActions.includes('reassign') && reassignable.length ? (
              <>
                <Button label={tr('mis.act.reassign')} icon="users" variant="secondary" onPress={() => open('reassign')} testID="mission-reassign" />
                {panel === 'reassign' ? (
                  <View style={{ gap: spacing.xs }}>
                    <MemberSelector label={tr('mis.act.reassign')} value={reassignTo} onChange={setReassignTo}
                      options={reassignable.map((p) => ({ value: p.id, label: p.name, avatarPath: p.avatarPath, initial: p.initial, testID: `mission-reassign-${p.role}` }))} />
                    <Button label={tr('mis.act.reassignSend')} icon="send" disabled={!reassignTo || busy} loading={busy} onPress={() => void act('reassign', { assignee_id: reassignTo })} testID="mission-reassign-confirm" />
                  </View>
                ) : null}
              </>
            ) : null}
            {creatorActions.includes('cancel') ? (
              <Button label={tr('mis.act.cancelExplicit')} icon="slash" variant="danger" testID="mission-cancel" disabled={busy}
                onPress={async () => { if (await confirm(tr('mis.act.cancelConfirm'), m.title, tr('mis.act.cancel'))) void act('cancel'); }} />
            ) : null}
          </SmokedSurface>
        ) : null}

        {/* Précisions (enfant, domaine, pièce jointe, courses liées) : après la réponse attendue */}
        {child || m.domain_key || doc.data?.[0] || isPurchase(m) ? (
          <SmokedSurface testID="mission-extras" style={{ gap: spacing.sm }}>
            <View style={{ gap: spacing.xs }}>
              {child ? <Meta icon="smile" text={tr('mis.detail.child', { name: child.first_name })} /> : null}
              {m.domain_key ? <Meta icon="grid" text={tr('mis.detail.domain', { domain: tr(`cm.domain.${m.domain_key}` as TKey) })} /> : null}
              {doc.data?.[0] ? <Meta icon="paperclip" text={tr('mis.detail.doc', { title: doc.data[0].title })} /> : null}
            </View>
            {isPurchase(m) ? (
              <View testID="mission-shopping" style={{ gap: spacing.xs, padding: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: t.colors.border, backgroundColor: t.material.lines.controlFill }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <Icon name={item?.checked ? 'check-circle' : 'shopping-cart'} size={20} color={item?.checked ? t.colors.success : t.colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text weight="bold">{tr('mis.detail.product', { label: item?.label ?? m.product_label ?? m.title })}</Text>
                    <Text variant="small" muted testID="mission-shopping-state">{item ? (item.checked ? tr('mis.detail.bought') : tr('mis.detail.inList')) : tr('mis.detail.willAdd')}</Text>
                  </View>
                </View>
                {item?.checked && m.mission_state !== 'done' && viewer === 'recipient' && item.checked_by && item.checked_by !== me ? (
                  <Text variant="small" testID="mission-item-checked-other">{tr('stk.mission.checkedByOther', { person: nameOf(item.checked_by) })}</Text>
                ) : null}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                  {m.stock_id ? <Button label={tr('stk.mission.openStock')} icon="package" size="sm" variant="ghost" onPress={() => router.push(`/family/stocks/${m.stock_id}` as never)} testID="mission-open-stock" /> : null}
                  {item ? <Button label={tr('mis.detail.openList')} icon="shopping-cart" size="sm" variant="ghost" onPress={() => router.push('/meals/shopping')} testID="mission-open-list" /> : null}
                </View>
              </View>
            ) : null}
          </SmokedSurface>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <Icon name="eye-off" size={14} color={t.colors.textMuted} />
          <Text variant="caption" muted style={{ flex: 1 }}>{tr('mis.detail.noRead')}</Text>
        </View>
      </DetailScene>

      {/* Historique sobre : surface mate, une ligne par fait */}
      <Cascade index={3} style={{ gap: spacing.xs }}>
        <Text variant="heading" accessibilityRole="header">{tr('mis.detail.history')}</Text>
        <MatteSurface testID="mission-history" padded={spacing.sm} style={{ gap: 0 }}>
          {history.isLoading && !history.data ? <Skeleton kind="card" rows={1} /> : (history.data ?? []).map((e) => {
            const to = (e.detail as { to?: string }).to;
            const label = tr(`mis.ev.${e.kind}` as TKey, { person: nameOf(to), when: to && e.kind === 'postponed' ? fmtWhen(to) : '' });
            const n = (e.detail as { note?: string }).note;
            return (
              <View key={e.id} style={{ flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.xs, minHeight: MIN_TOUCH, alignItems: 'flex-start' }}>
                <View style={{ width: 24, alignItems: 'center', paddingTop: 2 }}><Icon name={EV_ICON[e.kind] ?? 'circle'} size={16} color={t.colors.textMuted} /></View>
                <View style={{ flex: 1 }}>
                  <Text weight="medium">{label}</Text>
                  {n ? <Text variant="small">« {n} »</Text> : null}
                  <Text variant="caption" muted>{tr('mis.ev.by', { person: e.actor_id === me ? tr('u7.people.you') : nameOf(e.actor_id), when: formatDate(e.created_at, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) })}</Text>
                </View>
              </View>
            );
          })}
        </MatteSurface>
      </Cascade>
    </Screen>
  );
}

function Meta({ icon, text }: { icon: IconName; text: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
      <View style={{ width: 24, alignItems: 'center' }}><Icon name={icon} size={16} color={t.colors.textMuted} /></View>
      <Text variant="small" style={{ flex: 1 }}>{text}</Text>
    </View>
  );
}

/** Pour / demandée par : avatar + prénom (icône si personne). */
function PersonMeta({ label, person, icon, testID }: { label: string; person: Person | null; icon: IconName; testID?: string }) {
  const t = useTheme();
  return (
    <View testID={testID} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
      <View style={{ width: 24, alignItems: 'center' }}>
        {person ? <UserAvatar path={person.avatarPath} initial={person.initial} size={24} /> : <Icon name={icon} size={16} color={t.colors.textMuted} />}
      </View>
      <Text variant="small" weight="medium" style={{ flex: 1 }}>{label}</Text>
    </View>
  );
}
