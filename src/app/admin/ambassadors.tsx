/**
 * Administration HOMI Ambassadors : candidatures (support : valider, refuser, suspendre) et versements manuels
 * (finance : solde disponible ≥ seuil → virement fait hors de l'app, puis « Marquer comme versé » avec la référence).
 * Le serveur revérifie chaque rôle (has_role) et journalise toute action.
 */
import React, { useMemo, useState } from 'react';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { useToast } from '@/components/Overlays';
import { Button, Card, Chip, Field, Row, Text } from '@/components/ui';
import { AFFILIATE_STATUSES, availableByAffiliate, formatMinor, PROGRAM, useAffiliateLedger, useAllAffiliates, useRecordPayout, useSetAffiliateStatus, type AffiliateRow, type AffiliateStatus } from '@/lib/data/hooks-ambassadors';
import { friendlyError, useMyRoles } from '@/lib/data/hooks-settings';
import { spacing } from '@/theme/tokens';
import { formatDate, t as tr, type TKey } from '@/i18n';

export default function AdminAmbassadors() {
  const { isSupport, isFinance, isLoading: rolesLoading } = useMyRoles();
  const staff = isSupport || isFinance;
  const q = useAllAffiliates(staff);
  const ledger = useAffiliateLedger(isFinance);
  const setStatus = useSetAffiliateStatus();
  const payout = useRecordPayout();
  const toast = useToast();
  const [filter, setFilter] = useState<AffiliateStatus>('pending');
  const [refs, setRefs] = useState<Record<string, string>>({});
  const balances = useMemo(() => availableByAffiliate(ledger.data ?? []), [ledger.data]);
  const rows = (q.data ?? []).filter((a) => a.status === filter);

  if (!rolesLoading && !staff) return <Screen back title={tr('amb.admin.title')}><EmptyState icon="lock" title={tr('amb.admin.denied')} /></Screen>;

  const act = (a: AffiliateRow, status: Exclude<AffiliateStatus, 'pending'>) =>
    setStatus.mutate({ id: a.id, status }, { onError: (e) => toast(friendlyError(e), 'error') });

  return (
    <Screen back title={tr('amb.admin.title')}>
      <Row wrap style={{ gap: 6 }}>
        {AFFILIATE_STATUSES.map((s) => <Chip key={s} label={tr(`amb.status.${s}` as TKey)} selected={filter === s} onPress={() => setFilter(s)} testID={`amb-admin-f-${s}`} />)}
      </Row>
      {q.isLoading && !q.data ? <Skeleton kind="card" rows={2} /> : q.isError && !q.data ? <ErrorView error={q.error} onRetry={() => void q.refetch()} /> : null}
      {q.data && !rows.length ? <EmptyState icon="inbox" title={tr('amb.admin.none')} /> : null}
      {rows.map((a) => {
        const bal = [...(balances.get(a.id) ?? new Map<string, number>()).entries()];
        return (
          <Card key={a.id} testID={`amb-admin-${a.code}`}>
            <Text weight="bold">{[a.code, a.first_name, a.last_name].join(' · ')}</Text>
            <Text variant="caption" muted>
              {[a.contact_email, a.country, tr(`amb.profile.${a.profile_type}` as TKey), a.audience_size != null ? String(a.audience_size) : null, formatDate(a.created_at, { day: 'numeric', month: 'short', year: 'numeric' })].filter(Boolean).join(' · ')}
            </Text>
            {a.promo_channel ? <Text variant="small" style={{ marginTop: 4 }}>{a.promo_channel}</Text> : null}
            {isSupport ? (
              <Row wrap style={{ gap: 6, marginTop: spacing.xs }}>
                {a.status !== 'active' ? <Button label={a.status === 'suspended' ? tr('amb.admin.reactivate') : tr('amb.admin.validate')} variant="secondary" onPress={() => act(a, 'active')} testID={`amb-admin-${a.code}-active`} /> : null}
                {a.status === 'pending' ? <Button label={tr('amb.admin.reject')} variant="ghost" onPress={() => act(a, 'rejected')} /> : null}
                {a.status === 'active' ? <Button label={tr('amb.admin.suspend')} variant="ghost" onPress={() => act(a, 'suspended')} /> : null}
              </Row>
            ) : null}
            {isFinance ? bal.map(([cur, minor]) => (
              <Card key={cur} tone="soft" style={{ marginTop: spacing.xs }}>
                <Text>{tr('amb.admin.available', { amount: formatMinor(minor, cur) })}</Text>
                {minor >= PROGRAM.thresholdMinor ? (
                  <>
                    <Field label={tr('amb.admin.payRef')} value={refs[a.id + cur] ?? ''} onChangeText={(v) => setRefs((r) => ({ ...r, [a.id + cur]: v }))} maxLength={80} />
                    <Button label={tr('amb.admin.pay')} variant="secondary" disabled={!(refs[a.id + cur] ?? '').trim() || payout.isPending}
                      onPress={() => payout.mutate({ id: a.id, currency: cur, reference: refs[a.id + cur] ?? '' }, {
                        onSuccess: () => { toast(tr('amb.admin.payDone'), 'success'); setRefs((r) => ({ ...r, [a.id + cur]: '' })); },
                        onError: (e) => toast(friendlyError(e), 'error'),
                      })} />
                  </>
                ) : <Text variant="small" muted>{tr('amb.admin.below')}</Text>}
              </Card>
            )) : null}
          </Card>
        );
      })}
    </Screen>
  );
}
