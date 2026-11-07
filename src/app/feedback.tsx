/**
 * « Donner mon avis » (07/11/2026) : signaler un problème, proposer une amélioration ou demander un ajout.
 * L'équipe lit chaque avis ; la maman voit le suivi (reçu, lu, prévu, fait, pas retenu) et peut supprimer les siens.
 */
import React, { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { confirm, useToast } from '@/components/Overlays';
import { Banner, Button, Card, Chip, Field, haptic, IconButton, Row, SectionTitle, Text } from '@/components/ui';
import { ToggleRow } from '@/features/recipes/ToggleRow';
import { FEEDBACK_KINDS, useDeleteFeedback, useMyFeedback, useSendFeedback, type FeedbackKind } from '@/lib/data/hooks-feedback';
import { friendlyError } from '@/lib/data/hooks-settings';
import { spacing } from '@/theme/tokens';
import { formatDate, t as tr, type TKey } from '@/i18n';

export default function Feedback() {
  const params = useLocalSearchParams<{ from?: string; kind?: string }>();
  const toast = useToast();
  const [kind, setKind] = useState<FeedbackKind>((FEEDBACK_KINDS as readonly string[]).includes(params.kind ?? '') ? (params.kind as FeedbackKind) : 'improve');
  const [body, setBody] = useState('');
  const [contact, setContact] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const send = useSendFeedback();
  const mine = useMyFeedback().data ?? [];
  const remove = useDeleteFeedback();

  async function submit() {
    if (body.trim().length < 3) { setError(tr('fb.errShort')); return; }
    setError(null);
    try {
      await send.mutateAsync({ kind, body, screen: params.from ?? null, contact_ok: contact });
      haptic('success');
      setBody(''); setContact(false);
      toast(tr('fb.thanks'), 'success');
    } catch (e) { setError(friendlyError(e)); }
  }

  return (
    <Screen back title={tr('fb.title')} subtitle={tr('fb.subtitle')}>
      <Text variant="label">{tr('fb.kindLabel')}</Text>
      <Row wrap style={{ gap: 6 }}>
        {FEEDBACK_KINDS.map((k) => <Chip key={k} label={tr(`fb.kind.${k}` as TKey)} selected={kind === k} onPress={() => setKind(k)} testID={`fb-kind-${k}`} />)}
      </Row>
      <Field label={tr(`fb.q.${kind}` as TKey)} value={body} onChangeText={setBody} multiline maxLength={2000} placeholder={tr(`fb.ph.${kind}` as TKey)} error={error ?? undefined} testID="fb-body" />
      <Text variant="caption" muted>{tr('fb.privacy')}</Text>
      <ToggleRow label={tr('fb.contact')} value={contact} onChange={setContact} />
      <Button label={tr('fb.send')} icon="send" loading={send.isPending} onPress={() => void submit()} full testID="fb-send" />
      {kind === 'bug' ? <Banner tone="info">{tr('fb.urgent')}</Banner> : null}

      {mine.length ? (
        <>
          <SectionTitle title={tr('fb.mine')} />
          {mine.map((f) => (
            <Card key={f.id} testID={`fb-item-${f.id}`}>
              <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm }}>
                <Text variant="caption" weight="bold" muted style={{ flex: 1 }}>{tr(`fb.kind.${f.kind}` as TKey)} · {formatDate(f.created_at, { day: 'numeric', month: 'short' })}</Text>
                <Text variant="caption" weight="bold" testID={`fb-status-${f.id}`}>{tr(`fb.st.${f.status}` as TKey)}</Text>
              </Row>
              <Text variant="small" style={{ marginTop: 4 }}>{f.body}</Text>
              <Row style={{ justifyContent: 'flex-end' }}>
                <IconButton icon="trash-2" label={tr('fb.delete')} onPress={async () => {
                  if (!(await confirm(tr('fb.deleteT'), f.body.slice(0, 80), tr('common.delete')))) return;
                  try { await remove.mutateAsync(f.id); } catch (e) { toast(friendlyError(e), 'error'); }
                }} />
              </Row>
            </Card>
          ))}
        </>
      ) : null}
    </Screen>
  );
}
