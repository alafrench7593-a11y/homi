/**
 * Messages parents–nounou pour la garde d'un enfant : texte seulement (les photos passent par « Prendre une photo »),
 * historique, « Information importante » possible. Volontairement AUCUN accusé de lecture, aucun « en ligne », aucun
 * « vu à », aucune relance automatique : rien ne permet de surveiller la disponibilité de quelqu'un.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { useToast } from '@/components/Overlays';
import { Button, Card, Field, Text } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';
import { useUserId } from '@/lib/auth';
import { formatDateFr, formatTime } from '@/lib/domain/dates';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useCareChild, useCareMemberNames, useCareMessages, useSendCareMessage } from '@/lib/data/hooks-nounou';
import { ToggleRow, useAuthorLabel } from '@/features/nounou/CareUI';

export default function CareMessages() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  const me = useUserId();
  const toast = useToast();
  const { child, role, loading } = useCareChild(id);
  const msgs = useCareMessages(child ? id : null);
  const names = useCareMemberNames(child?.household_id);
  const authorOf = useAuthorLabel(names.data);
  const send = useSendCareMessage();
  const [body, setBody] = useState('');
  const [important, setImportant] = useState(false);

  if (loading) return <Screen back title={tr('nn.msg.title')} tool={false}><Skeleton rows={3} /></Screen>;
  if (!child || !role) return <Screen back title={tr('nn.msg.title')} tool={false}><EmptyState icon="lock" title={tr('nn.space.noAccess')} body={tr('nn.space.noAccessBody')} /></Screen>;

  async function submit() {
    const text = body.trim();
    if (!text) return;
    try {
      const r = await send.mutateAsync({ childId: child!.id, body: text, important });
      setBody(''); setImportant(false);
      if (r === 'queued') toast(tr('nn.savedQueued'), 'info');
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  let lastDay = '';
  return (
    <Screen back title={tr('nn.msg.title')} subtitle={child.first_name} tool={false}>
      <Text variant="small" muted>{tr('nn.msg.intro')}</Text>
      {msgs.isLoading && !msgs.data ? <Skeleton rows={3} /> : msgs.isError && !msgs.data ? (
        <ErrorView error={msgs.error} onRetry={() => void msgs.refetch()} />
      ) : !msgs.data?.length ? <EmptyState icon="message-circle" title={tr('nn.msg.empty')} body={tr('nn.msg.emptyBody')} /> : (
        <View style={{ gap: spacing.xs }}>
          {msgs.data.map((m) => {
            const mine = m.author_id === me || m._pending;
            const d = m.created_at.slice(0, 10);
            const header = d !== lastDay ? (lastDay = d) : null;
            return (
              <React.Fragment key={m.id}>
                {header ? <Text variant="caption" muted center style={{ marginTop: spacing.xs }}>{formatDateFr(d)}</Text> : null}
                <View testID="care-msg" accessible accessibilityLabel={`${m.important ? tr('nn.msg.important') + ', ' : ''}${authorOf(m.author_id, null)}, ${formatTime(m.created_at)} : ${m.body}`}
                  style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '88%', borderRadius: radius.lg, padding: spacing.sm,
                    backgroundColor: m.important ? t.colors.dangerSoft : mine ? t.colors.surfaceAlt : t.colors.surface,
                    borderWidth: m.important ? 2 : 1, borderColor: m.important ? t.colors.danger : t.colors.border }}>
                  {m.important ? <Text variant="caption" weight="bold" color={t.colors.danger}>{tr('nn.msg.important')}</Text> : null}
                  <Text selectable>{m.body}</Text>
                  <Text variant="caption" muted>{authorOf(m.author_id, null)} · {formatTime(m.created_at)}{m._pending ? ` · ${tr('nn.pending')}` : ''}</Text>
                </View>
              </React.Fragment>
            );
          })}
        </View>
      )}
      <Card>
        <Field label={tr('nn.msg.field')} value={body} onChangeText={setBody} multiline maxLength={2000} testID="care-msg-body" />
        <ToggleRow value={important} onChange={setImportant} label={tr('nn.msg.markImportant')} />
        <Button label={tr('nn.msg.send')} icon="send" disabled={!body.trim()} loading={send.isPending} style={{ alignSelf: 'flex-start', marginTop: spacing.xs }} onPress={submit} testID="care-msg-send-inline" />
      </Card>
    </Screen>
  );
}
