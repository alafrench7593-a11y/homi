/** Accueil du scanner : produit ou aliment, historique récent, favoris, comparaison. */
import React from 'react';
import { Image, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Banner, Button, Card, Icon, ListRow, Row, SectionTitle, Text } from '@/components/ui';
import { GlassSurface } from '@/components/Glass';
import { frDate } from '@/lib/domain/scanSources';
import { isDemo } from '@/lib/backend';
import { useRecallWatch, useScanFavorites, useScanHistory, useScanQuota } from '@/lib/data/hooks-scanner';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { ScanListRow, VerdictBadge } from '@/features/scanner/components';
import { t as tr } from '@/i18n';

export default function ScannerHub() {
  const t = useTheme();
  useRecallWatch();
  const historyQ = useScanHistory();
  const { data: history } = historyQ;
  const { ids: favIds } = useScanFavorites();
  const { data: quota } = useScanQuota();
  const last = (history ?? [])[0];
  const recent = (history ?? []).slice(1, 5);
  const favorites = (history ?? []).filter((s) => favIds.has(s.id)).slice(0, 4);

  return (
    <Screen back title={tr('u8.hub.title')} subtitle={tr('u8.hub.subtitle')}
      action={{ label: tr('u8.hub.newScan'), icon: 'camera', onPress: () => router.push('/scanner/product'), testID: 'scanner-new' }}>
      {isDemo ? <Banner tone="demo" title={tr('u8.hub.demoTitle')}>{tr('u8.hub.demoBody')}</Banner> : null}
      <TodaySummary title={tr('u8.hub.mine')} items={[
        { icon: 'clock', value: history ? String(history.length) : '—', label: tr('u8.hub.analyses') },
        { icon: 'star', value: history ? String((history ?? []).filter((x) => favIds.has(x.id)).length) : '—', label: tr('u8.hub.favorites') },
        { icon: 'zap', value: quota ? String(quota.remaining) : '—', label: tr('u8.hub.remaining') },
      ]} />
      {last ? (
        // Dernier scan en grand : le résultat d'un coup d'œil, et le même type de scan relancé en un geste
        <GlassSurface fill={t.colors.surface} depth={2} radius={26}>
          <View style={{ padding: spacing.lg, gap: spacing.sm }} testID="scanner-last">
            <Text variant="caption" muted style={{ letterSpacing: 1.1, textTransform: 'uppercase' }}>{tr('u8.hub.lastScan')}</Text>
            <Row style={{ alignItems: 'center' }}>
              {last.product_snapshot?.image_url ? (
                <Image source={{ uri: last.product_snapshot.image_url }} style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: t.colors.surfaceAlt }} accessibilityIgnoresInvertColors />
              ) : (
                <View style={{ width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.surfaceAlt }}>
                  <Icon name={last.kind === 'food' ? 'search' : 'maximize'} size={26} color={t.colors.primary} />
                </View>
              )}
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="heading" numberOfLines={2}>{`${last.product_snapshot?.name ?? tr('u8.hub.noName')}${favIds.has(last.id) ? ' ★' : ''}`}</Text>
                <Text variant="caption" muted>{[last.kind === 'food' ? tr('u8.hub.food') : tr('u8.hub.product'), last.product_snapshot?.brand, last.analysed_at ? frDate(last.analysed_at) : null].filter(Boolean).join(' · ')}</Text>
                {last.verdict ? <VerdictBadge verdict={last.verdict} /> : null}
              </View>
            </Row>
            <Row wrap>
              <Button label={tr('u8.hub.viewResult')} icon="eye" size="sm" variant="secondary" onPress={() => router.push(`/scanner/result/${last.id}`)} testID="scanner-last-open" style={{ flexGrow: 1 }} />
              <Button label={last.kind === 'food' ? tr('u8.hub.otherFood') : tr('u8.hub.otherProduct')} icon="camera" size="sm" onPress={() => router.push(last.kind === 'food' ? '/scanner/food' : '/scanner/product')} testID="scanner-last-again" style={{ flexGrow: 1 }} />
            </Row>
          </View>
        </GlassSurface>
      ) : null}
      <Row style={{ alignItems: 'stretch' }}>
        {([
          { to: '/scanner/product', icon: 'maximize', title: tr('u8.hub.scanProduct'), sub: tr('u8.hub.scanProductSub') },
          { to: '/scanner/food', icon: 'search', title: tr('u8.hub.scanFood'), sub: tr('u8.hub.scanFoodSub') },
        ] as const).map((c) => (
          <View key={c.to} style={{ flex: 1 }}>
            <Card onPress={() => router.push(c.to)} accessibilityLabel={c.title} style={{ flex: 1 }}>
              <View style={{ gap: spacing.xs }}>
                <View style={{ width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.surfaceAlt }}>
                  <Icon name={c.icon} size={26} color={t.colors.primary} />
                </View>
                <Text weight="bold">{c.title}</Text>
                <Text variant="caption" muted>{c.sub}</Text>
              </View>
            </Card>
          </View>
        ))}
      </Row>
      {quota ? <Text variant="caption" muted>{tr('u8.hub.quotaLine', { remaining: quota.remaining, quota: quota.quota })}</Text> : null}

      <SectionTitle title={last ? tr('u8.hub.before') : tr('u8.hub.recent')} action={history?.length ? tr('u8.hub.seeAll') : undefined} onAction={() => router.push('/scanner/history')} />
      {historyQ.isLoading && !history ? <Skeleton kind="card" rows={2} /> : historyQ.isError && !history ? (
        <ErrorView error={historyQ.error} onRetry={() => void historyQ.refetch()} title={tr('u8.hub.listErr')} />
      ) : recent.length ? recent.map((s) => <ScanListRow key={s.id} s={s} favorite={favIds.has(s.id)} />) : last ? null : (
        <EmptyState icon="maximize" title={tr('u8.hub.none')} body={tr('u8.hub.noneBody')} action={{ label: tr('u8.hub.firstScan'), icon: 'camera', onPress: () => router.push('/scanner/product') }} />
      )}

      {favorites.length ? (
        <>
          <SectionTitle title={tr('u8.hub.favorites')} action={tr('u8.hub.seeAll')} onAction={() => router.push({ pathname: '/scanner/history', params: { filter: 'favorites' } })} />
          {favorites.map((s) => <ScanListRow key={s.id} s={s} favorite />)}
        </>
      ) : null}

      <SectionTitle title={tr('u8.hub.tools')} />
      <Card padded={false}>
        <ListRow icon="clock" title={tr('u8.hub.histFav')} subtitle={tr('u8.hub.histFavSub')} onPress={() => router.push('/scanner/history')} />
        <ListRow icon="columns" title={tr('u8.hub.compare')} subtitle={tr('u8.hub.compareSub')} onPress={() => router.push('/scanner/compare')} />
        <ListRow icon="slash" title={tr('u8.hub.avoid')} subtitle={tr('u8.hub.avoidSub')} onPress={() => router.push('/scanner/avoid')} />
      </Card>

      <Card tone="soft">
        <Text weight="medium">{tr('u8.hub.how')}</Text>
        <View style={{ gap: 6, marginTop: spacing.xs }} accessibilityLabel={tr('u8.hub.stepsA11y')}>
          {([
            ['camera', tr('u8.hub.step1')],
            ['check', tr('u8.hub.step2')],
            ['database', tr('u8.hub.step3')],
            ['book-open', tr('u8.hub.step4')],
            ['message-circle', tr('u8.hub.step5')],
          ] as const).map(([icon, label], i) => (
            <Row key={label} style={{ alignItems: 'flex-start' }}>
              <Icon name={icon} size={16} color={t.colors.primary} />
              <Text variant="small" style={{ flex: 1 }}>{`${i + 1}. ${label}`}</Text>
            </Row>
          ))}
        </View>
        <Text variant="caption" muted style={{ marginTop: spacing.xs }}>{tr('u8.hub.noScore')}</Text>
      </Card>
    </Screen>
  );
}
