/** Personnes bloquées : leurs contenus sont masqués dans les deux sens ; on peut débloquer à tout moment. */
import React from 'react';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { useToast } from '@/components/Overlays';
import { Button, Card, Row, Text } from '@/components/ui';
import { useMyBlocks, useUnblock } from '@/lib/data/hooks-community';
import { friendlyError } from '@/lib/data/hooks-settings';
import { MIN_TOUCH } from '@/theme/tokens';
import { t as tr } from '@/i18n';

export default function Blocked() {
  const toast = useToast();
  const q = useMyBlocks();
  const unblock = useUnblock();
  return (
    <Screen back title={tr('u5.blocked.title')} subtitle={tr('u5.blocked.subtitle')}>
      {q.isLoading && !q.data ? <Skeleton kind="list" rows={2} /> : q.isError && !q.data ? <ErrorView error={q.error} onRetry={() => void q.refetch()} /> : q.data?.length ? (
        <Card>
          {q.data.map((b) => (
            <Row key={b.userId} style={{ justifyContent: 'space-between', minHeight: MIN_TOUCH }} testID={`blocked-${b.handle ?? b.userId}`}>
              <Text style={{ flex: 1 }} onPress={() => b.handle && router.push(`/community/u/${b.handle}` as never)}>{b.handle ? `${b.pseudonym} · @${b.handle}` : b.pseudonym}</Text>
              <Button label={tr('u5.blocked.unblock')} size="sm" variant="ghost" disabled={unblock.isPending} onPress={() => unblock.mutate(b.userId, { onSuccess: () => toast(tr('u5.blocked.unblocked', { name: b.pseudonym })), onError: (e) => toast(friendlyError(e), 'error') })} />
            </Row>
          ))}
        </Card>
      ) : <EmptyState icon="slash" title={tr('u5.blocked.empty_t')} body={tr('u5.blocked.empty_b')} />}
    </Screen>
  );
}
