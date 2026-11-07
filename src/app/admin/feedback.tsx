/**
 * Avis des mamans (équipe, 07/11/2026) : tous les avis, filtrés par type et par statut ; changement de statut.
 * Réservé aux rôles moderator / admin : la sécurité du serveur revérifie (has_role) ; personne d'autre ne les lit.
 */
import React, { useMemo, useState } from 'react';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { useToast } from '@/components/Overlays';
import { Card, Chip, Row, SectionTitle, Text } from '@/components/ui';
import { FEEDBACK_KINDS, FEEDBACK_STATUSES, useAllFeedback, useSetFeedbackStatus, type FeedbackKind, type FeedbackStatus } from '@/lib/data/hooks-feedback';
import { friendlyError, useMyRoles } from '@/lib/data/hooks-settings';
import { spacing } from '@/theme/tokens';
import { formatDate, t as tr, type TKey } from '@/i18n';

export default function AdminFeedback() {
  const { isModerator, isLoading: rolesLoading } = useMyRoles();
  const q = useAllFeedback(isModerator);
  const setStatus = useSetFeedbackStatus();
  const toast = useToast();
  const [kind, setKind] = useState<FeedbackKind | 'all'>('all');
  const [status, setStatusF] = useState<FeedbackStatus | 'open'>('open');
  const rows = useMemo(() => (q.data ?? []).filter((f) => (kind === 'all' || f.kind === kind) && (status === 'open' ? ['new', 'seen', 'planned'].includes(f.status) : f.status === status)), [q.data, kind, status]);
  if (!rolesLoading && !isModerator) return <Screen back title={tr('fb.admin.title')}><EmptyState icon="lock" title={tr('fb.admin.denied')} /></Screen>;
  return (
    <Screen back title={tr('fb.admin.title')} subtitle={tr('fb.admin.count', { count: q.data?.length ?? 0 })}>
      <Row wrap style={{ gap: 6 }}>
        <Chip label={tr('fb.admin.allKinds')} selected={kind === 'all'} onPress={() => setKind('all')} />
        {FEEDBACK_KINDS.map((k) => <Chip key={k} label={tr(`fb.kind.${k}` as TKey)} selected={kind === k} onPress={() => setKind(k)} />)}
      </Row>
      <Row wrap style={{ gap: 6 }}>
        <Chip label={tr('fb.admin.open')} selected={status === 'open'} onPress={() => setStatusF('open')} />
        {FEEDBACK_STATUSES.map((s) => <Chip key={s} label={tr(`fb.st.${s}` as TKey)} selected={status === s} onPress={() => setStatusF(s)} />)}
      </Row>
      <SectionTitle title={tr('fb.admin.list', { count: rows.length })} />
      {q.isLoading && !q.data ? <Skeleton kind="card" rows={2} /> : q.isError && !q.data ? <ErrorView error={q.error} onRetry={() => void q.refetch()} /> : null}
      {q.data && !rows.length ? <EmptyState icon="inbox" title={tr('fb.admin.none')} /> : null}
      {rows.map((f) => (
        <Card key={f.id} testID={`fba-${f.id}`}>
          <Text variant="caption" weight="bold" muted>
            {[tr(`fb.kind.${f.kind}` as TKey), formatDate(f.created_at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }), f.screen, f.platform, f.app_version, f.contact_ok ? tr('fb.admin.contactOk') : null].filter(Boolean).join(' · ')}
          </Text>
          <Text style={{ marginTop: 4 }}>{f.body}</Text>
          <Row wrap style={{ gap: 6, marginTop: spacing.xs }}>
            {FEEDBACK_STATUSES.map((s) => (
              <Chip key={s} label={tr(`fb.st.${s}` as TKey)} selected={f.status === s} testID={`fba-${f.id}-${s}`}
                onPress={() => setStatus.mutate({ id: f.id, status: s }, { onError: (e) => toast(friendlyError(e), 'error') })} />
            ))}
          </Row>
        </Card>
      ))}
    </Screen>
  );
}
