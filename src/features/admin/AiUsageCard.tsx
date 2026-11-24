/**
 * Admin : coûts IA des 30 derniers jours (Aura Vision, lot 2). Comptages par action (demandes, facturées, restituées,
 * crédits) et répartition par compte, sans aucun identifiant ni contenu. Les euros sont des ESTIMATIONS saisies par
 * la propriétaire ; une action sans estimation affiche « inconnu », jamais 0 €.
 */
import React from 'react';
import { View } from 'react-native';
import { ErrorView, Skeleton } from '@/components/States';
import { Banner, Card, Row, SectionTitle, Text } from '@/components/ui';
import { useAdminAiUsage } from '@/lib/data/hooks-settings';
import { t as tr } from '@/i18n';
import { spacing } from '@/theme/tokens';

const eur = (v: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 4 }).format(v);

export function AiUsageCard({ enabled }: { enabled: boolean }) {
  const q = useAdminAiUsage(enabled);
  const d = q.data;
  const known = d?.actions.filter((a) => a.eur_estimate != null) ?? [];
  const total = known.reduce((s, a) => s + (a.eur_estimate ?? 0), 0);
  const unknown = (d?.actions.length ?? 0) - known.length;
  return (
    <View style={{ gap: spacing.sm }} testID="admin-ai-usage">
      <SectionTitle title={tr('aura.cost.title')} action={tr('u5.admin.refresh')} onAction={() => void q.refetch()} />
      {q.isLoading && !d ? <Skeleton kind="card" rows={1} /> : q.isError && !d ? (
        <ErrorView error={q.error} onRetry={() => void q.refetch()} title={tr('aura.cost.err')} />
      ) : d ? (
        <Card>
          {!d.ai_enabled ? <Banner tone="warning" title={tr('aura.cost.off')} /> : null}
          {d.actions.length === 0 ? <Text variant="small" muted>{tr('aura.cost.empty')}</Text> : d.actions.map((a) => (
            <View key={a.action} style={{ paddingVertical: spacing.xs, gap: 2 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text variant="small" weight="bold">{a.action}</Text>
                <Text variant="small">{a.eur_estimate == null ? tr('aura.cost.unknown') : eur(a.eur_estimate)}</Text>
              </Row>
              <Text variant="caption" muted>{tr('aura.cost.line', { requests: a.requests, billed: a.billed, refunded: a.refunded, credits: a.credits, users: a.users })}</Text>
            </View>
          ))}
          <Text variant="small" weight="bold" style={{ marginTop: spacing.sm }}>
            {tr('aura.cost.total', { total: eur(total), paying: d.paying, perPaying: d.paying ? eur(total / d.paying) : '—' })}
          </Text>
          {unknown ? <Text variant="caption" muted>{tr('aura.cost.missing', { n: unknown })}</Text> : null}
          <Text variant="caption" muted>{tr('aura.cost.perUser', { p50: Math.round(d.per_user.p50), p95: Math.round(d.per_user.p95), max: Math.round(d.per_user.max) })}</Text>
          <Text variant="caption" muted style={{ marginTop: spacing.xs }}>{tr('aura.cost.note')}</Text>
        </Card>
      ) : null}
    </View>
  );
}
