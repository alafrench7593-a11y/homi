/**
 * « Se comprendre » → « Nos messages » (19/11/2026) : fil simple entre les deux adultes du couple uniquement
 * (couple_messages : autrice + destinataire explicite ; un adulte retiré du foyer perd l'accès ; suppression par
 * l'autrice). Réception : « Message de votre partenaire » ; réponses proposées ou réponse libre, envoyées après
 * confirmation. Une DEMANDE de coup de main s'accepte ou se refuse ici (mission « À accepter », cycle des missions).
 * Le destinataire peut aussi proposer de prendre une responsabilité. Aucun « vu », aucun compteur, aucune relance.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Button, Chip, Field, IconButton, ListRow, Row, Text } from '@/components/ui';
import { StaggerList } from '@/motion';
import { ConfirmSend } from '@/features/couple/CoupleKit';
import { StateLabel } from '@/features/missions/MissionCard';
import { useUserId } from '@/lib/auth';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useCoupleMessages, useCoupleSend, useDeleteCoupleMessage, usePartner, useSeenAt, type CoupleMessage } from '@/lib/data/hooks-couple';
import { useMissions, useRespondMission } from '@/lib/data/hooks-missions';
import { useSetDomain } from '@/lib/data/hooks-mental';
import { OFFER_DOMAINS, REPLIES } from '@/lib/domain/understand';
import { missionHref } from '@/lib/domain/missions';
import { uuid } from '@/lib/uuid';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { formatDate, t as tr, type TKey } from '@/i18n';

export default function Inbox() {
  const t = useTheme();
  const toast = useToast();
  const me = useUserId() ?? '';
  const partner = usePartner();
  const q = useCoupleMessages();
  const send = useCoupleSend();
  const del = useDeleteCoupleMessage();
  const missions = useMissions();
  const respond = useRespondMission();
  const setDomain = useSetDomain();
  const { mark } = useSeenAt();
  const [reply, setReply] = useState('');
  const [confirming, setConfirming] = useState<null | { kind: 'reply' | 'offer'; text: string; domain?: string }>(null);
  const [offerOpen, setOfferOpen] = useState(false);
  const [clientId, setClientId] = useState(uuid);
  const list = useMemo(() => q.data ?? [], [q.data]);
  const lastReceived = [...list].reverse().find((m) => m.author_id !== me) ?? null;
  // ouvrir la conversation la marque comme lue SUR CE TÉLÉPHONE (rien n'est envoyé à l'autre)
  useEffect(() => { if (q.data) mark(); }, [q.data?.length]); // eslint-disable-line react-hooks/exhaustive-deps

  async function doSend() {
    if (!partner || !confirming) return;
    try {
      if (confirming.kind === 'offer' && confirming.domain) await setDomain.mutateAsync({ key: confirming.domain as never, owner_id: me });
      await send.mutateAsync({ recipient: partner.id, kind: confirming.kind, body: confirming.text, reply_to: lastReceived?.id ?? null, client_id: clientId });
      setConfirming(null); setReply(''); setClientId(uuid());
      toast(confirming.kind === 'offer' ? tr('und.offer.done') : tr('und.sent', { name: partner.name }));
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  async function remove(m: CoupleMessage) {
    if (!(await confirm(tr('und.inbox.deleteQ'), tr('und.inbox.deleteB', { name: partner?.name ?? '' }), tr('common.delete')))) return;
    try { await del.mutateAsync(m.id); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  return (
    <Screen back title={tr('und.inbox.title')} subtitle={tr('und.inbox.private')}>
      {q.isLoading && !q.data ? <Skeleton kind="card" rows={2} /> : q.isError && !q.data ? <ErrorView error={q.error} onRetry={() => void q.refetch()} /> : !list.length ? (
        <EmptyState icon="message-circle" title={tr('und.inbox.empty')} body={tr('und.inbox.emptyB')} />
      ) : (
        <StaggerList gap={spacing.sm} testID="und-thread">
          {list.map((m) => {
            const mine = m.author_id === me;
            const mission = m.task_id ? missions.all.find((x) => x.id === m.task_id) ?? null : null;
            return (
              <View key={m.id} testID={`und-msg-${m.id}`} accessibilityLabel={`${mine ? tr('und.inbox.mine') : tr('und.inbox.from')}. ${m.body}`}
                style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '92%', borderRadius: radius.lg, padding: spacing.sm, gap: 6,
                  backgroundColor: mine ? t.material.lines.controlFill : t.colors.surface, borderWidth: 1, borderColor: t.colors.border }}>
                <Row gap={spacing.xs} style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text variant="caption" weight="bold" muted style={{ flexShrink: 1 }}>
                    {mine ? tr('und.inbox.mine') : tr('und.inbox.from')} · {formatDate(m.created_at, { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  {mine ? <IconButton icon="trash-2" label={tr('und.inbox.delete')} size={16} onPress={() => void remove(m)} testID={`und-del-${m.id}`} /> : null}
                </Row>
                {m.kind === 'request' ? <Text variant="caption" weight="bold">{tr('und.req.state')}</Text> : null}
                <Text testID={`und-body-${m.id}`}>{m.body}</Text>
                {m.kind === 'request' && mission ? (
                  <View style={{ gap: spacing.xs }}>
                    <StateLabel state={mission.mission_state} testID={`und-req-state-${m.id}`} />
                    {!mine && mission.mission_state === 'pending' ? (
                      <Row gap={spacing.xs} wrap>
                        <Button size="sm" label={tr('und.req.accept')} icon="check" testID={`und-req-accept-${m.id}`}
                          onPress={() => void respond.mutateAsync({ id: mission.id, action: 'accept', version: mission.version }).catch((e) => toast(friendlyError(e), 'error'))} />
                        <Button size="sm" variant="ghost" label={tr('und.req.decline')} testID={`und-req-decline-${m.id}`}
                          onPress={() => void respond.mutateAsync({ id: mission.id, action: 'decline', version: mission.version }).catch((e) => toast(friendlyError(e), 'error'))} />
                      </Row>
                    ) : (
                      <Button size="sm" variant="ghost" label={tr('und.req.open')} icon="chevron-right" onPress={() => router.push(missionHref(mission.id) as never)} />
                    )}
                  </View>
                ) : null}
              </View>
            );
          })}
        </StaggerList>
      )}

      {partner && lastReceived ? (
        <View style={{ gap: spacing.xs }} testID="und-reply">
          <Text variant="label">{tr('und.reply.title')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            {REPLIES.map((k, i) => <Chip key={k} label={tr(k)} onPress={() => setReply((r) => (r.trim() ? `${r.trim()} ${tr(k)}` : tr(k)))} testID={`und-reply-${i + 1}`} />)}
          </View>
          <Field label={tr('und.reply.ph')} value={reply} onChangeText={setReply} maxLength={2000} multiline style={{ minHeight: 96 }} testID="und-reply-text" />
          <Button label={tr('und.reply.send', { name: partner.name })} icon="send" full disabled={!reply.trim()} testID="und-reply-send"
            onPress={() => setConfirming({ kind: 'reply', text: reply.trim() })} />
          <Button label={tr('und.offer.title')} icon="user-check" variant="secondary" full testID="und-offer" onPress={() => setOfferOpen(true)} />
        </View>
      ) : null}
      {partner ? <ListRow icon="edit-3" title={tr('und.title')} subtitle={tr('und.entrySub')} onPress={() => router.push('/family/understand')} /> : null}

      <Sheet visible={offerOpen} onClose={() => setOfferOpen(false)} title={tr('und.offer.title')}>
        <Text variant="small" muted>{tr('und.offer.body')}</Text>
        {OFFER_DOMAINS.map((d) => (
          <ListRow key={d} icon="check-square" title={tr(`cm.domain.${d}` as TKey)} testID={`und-offer-${d}`}
            onPress={() => { setOfferOpen(false); setConfirming({ kind: 'offer', domain: d, text: tr('und.offer.text', { domain: tr(`cm.domain.${d}` as TKey) }) }); }} />
        ))}
      </Sheet>
      {partner && confirming ? (
        <ConfirmSend visible name={partner.name} text={confirming.text} busy={send.isPending} onConfirm={() => void doSend()} onClose={() => setConfirming(null)} />
      ) : null}
    </Screen>
  );
}
