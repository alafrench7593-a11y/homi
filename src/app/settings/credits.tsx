/**
 * « Mes crédits » (Réglages › Abonnement › Crédits) : solde HOMI IA lu sur le serveur (mensuels restants, achetés
 * restants, utilisés ce mois-ci, prochain renouvellement), packs aux prix de la boutique, règles en clair et
 * historique paginé (libellés lisibles, jamais le contenu d'une question). Sans abonnement : aucun crédit, renvoi vers
 * les abonnements. Démonstration : faux magasin et bouton d'essai (aucune IA appelée) pour voir le solde bouger.
 */
import React from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Banner, Button, Card, ErrorState, Loading, SectionTitle, Text } from '@/components/ui';
import { backend } from '@/lib/backend';
import { formatDate, formatNumber, t as tr } from '@/i18n';
import { spacing } from '@/theme/tokens';
import { useCreditConfig, useCreditHistory, useCreditStatus } from '@/lib/data/hooks-credits';
import { historyLabel, signedAmount, type CreditHistoryRow } from '@/lib/credits/model';
import { getPurchaseMode } from '@/lib/purchaseMode';
import { AnalyzeWithAI } from '@/features/credits/AnalyzeWithAI';
import { CreditBalanceCard, CreditRules, NoSubscriptionCredits, PackList } from '@/features/credits/CreditsParts';
import { useTheme } from '@/theme/ThemeProvider';

function HistoryRow({ row }: { row: CreditHistoryRow }) {
  const th = useTheme();
  const l = historyLabel(row);
  const label = tr(l.key, l.params);
  const amount = signedAmount(row.amount, (v) => formatNumber(v));
  const when = formatDate(row.created_at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  return (
    <View
      accessible
      accessibilityLabel={`${label}, ${amount}, ${when}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: th.colors.border }}
      testID={`credits-hist-${row.kind}`}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="small" weight="medium">{label}</Text>
        <Text variant="caption" muted>{when}{row.by_me === false ? ` · ${tr('cr.hist.byOther')}` : ''}</Text>
      </View>
      <Text variant="small" weight="bold" color={row.amount > 0 ? th.colors.success : undefined}>{amount}</Text>
    </View>
  );
}

export default function CreditsScreen() {
  const status = useCreditStatus();
  const config = useCreditConfig();
  const history = useCreditHistory();
  const s = status.data;
  const rows = (history.data?.pages ?? []).flat();
  const demo = getPurchaseMode() === 'test';

  return (
    <Screen back title={tr('cr.screen')}>
      {status.isLoading ? <Loading /> : status.isError ? <ErrorState error={status.error} onRetry={() => void status.refetch()} /> : s ? (
        <>
          {s.subscribed ? <CreditBalanceCard status={s} /> : <NoSubscriptionCredits config={config.data} />}
          {!s.subscribed && s.purchased_remaining > 0 ? <CreditBalanceCard status={s} /> : null}

          <SectionTitle title={tr('cr.packs.title')} subtitle={s.subscribed ? tr('cr.packs.subtitle') : undefined} />
          <PackList subscribed={s.subscribed} />

          {demo && s.subscribed ? (
            <Card tone="soft" testID="credits-demo">
              <Text weight="bold">{tr('cr.demo.title')}</Text>
              <Text variant="small" muted style={{ marginBottom: spacing.xs }}>{tr('cr.demo.body')}</Text>
              <AnalyzeWithAI action="tool_analysis" demo run={() => backend.rpc('demo_credit_spend', { action: 'tool_analysis' })} testID="credits-demo-analyze" />
            </Card>
          ) : null}

          <CreditRules />

          <SectionTitle title={tr('cr.hist.title')} />
          <Card testID="credits-history">
            {history.isLoading ? <Loading /> : rows.length ? rows.map((r) => <HistoryRow key={r.id} row={r} />) : (
              <Text variant="small" muted testID="credits-hist-empty">{tr('cr.hist.empty')}</Text>
            )}
            {history.hasNextPage ? (
              <Button label={tr('cr.hist.more')} variant="ghost" loading={history.isFetchingNextPage} onPress={() => void history.fetchNextPage()} testID="credits-hist-more" full />
            ) : null}
          </Card>
          {s.ai_enabled === false ? <Banner tone="info">{tr('cr.ai.off')}</Banner> : null}
        </>
      ) : null}
    </Screen>
  );
}
