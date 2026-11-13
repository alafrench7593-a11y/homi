/**
 * Accueil du scanner : point focal = « Nouvelle analyse » (bouton du pied). Dernier scan en surface mate (l'ouvrir
 * agrandit la surface vers sa fiche, morph `scan-<id>`), deux parcours (produit, aliment) en verre givré, analyses
 * récentes et favoris en surface mate, outils (historique, comparaison, produits à éviter, alertes de rappel
 * officielles — toujours gratuites). États : chargement, erreur (réessayer), vide.
 */
import React from 'react';
import { Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Banner, Card, Icon, ListRow, Row, SectionTitle, Text } from '@/components/ui';
import { FrostedGlass } from '@/components/surfaces';
import { usePressScale } from '@/motion';
import { isDemo } from '@/lib/backend';
import { useRecallWatch, useScanFavorites, useScanHistory, useScanQuota } from '@/lib/data/hooks-scanner';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { ScanListRow } from '@/features/scanner/components';
import type { IconName } from '@/components/ui';
import { t as tr } from '@/i18n';

function EntryCard({ to, icon, title, sub, testID }: { to: '/scanner/product' | '/scanner/food'; icon: IconName; title: string; sub: string; testID: string }) {
  const t = useTheme();
  const p = usePressScale({ scale: 0.97 });
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityHint={sub} onPress={() => router.push(to)} onPressIn={p.onPressIn} onPressOut={p.onPressOut}
      style={{ flex: 1, minWidth: 130 }} testID={testID}>
      <Animated.View style={[{ flex: 1 }, p.style]}>
        <FrostedGlass radius={radius.lg} padded={spacing.md} style={{ flex: 1 }} contentStyle={{ gap: spacing.xs }}>
          <View style={{ width: 44, height: 44, borderRadius: radius.orb, alignItems: 'center', justifyContent: 'center', backgroundColor: t.material.lines.iconWell }}>
            <Icon name={icon} size={22} color={t.colors.primary} />
          </View>
          <Text weight="bold">{title}</Text>
          <Text variant="caption" muted>{sub}</Text>
        </FrostedGlass>
      </Animated.View>
    </Pressable>
  );
}

export default function ScannerHub() {
  const t = useTheme();
  useRecallWatch();
  const historyQ = useScanHistory();
  const { data: history } = historyQ;
  const { ids: favIds } = useScanFavorites();
  const { data: quota } = useScanQuota();
  const last = (history ?? [])[0];
  const recent = (history ?? []).slice(1, 5);
  // Une analyse n'apparaît qu'une fois à l'écran (une seule surface d'origine par fiche pour le morph)
  const shown = new Set([last?.id, ...recent.map((s) => s.id)]);
  const favorites = (history ?? []).filter((s) => favIds.has(s.id) && !shown.has(s.id)).slice(0, 4);

  return (
    <Screen back title={tr('u8.hub.title')} subtitle={tr('u8.hub.subtitle')}
      action={{ label: tr('u8.hub.newScan'), icon: 'camera', onPress: () => router.push('/scanner/product'), testID: 'scanner-new' }}>
      {isDemo ? <Banner tone="demo" title={tr('u8.hub.demoTitle')}>{tr('u8.hub.demoBody')}</Banner> : null}
      <TodaySummary title={tr('u8.hub.mine')} items={[
        { icon: 'clock', value: history ? String(history.length) : '—', label: tr('u8.hub.analyses') },
        { icon: 'star', value: history ? String((history ?? []).filter((x) => favIds.has(x.id)).length) : '—', label: tr('u8.hub.favorites') },
        { icon: 'zap', value: quota ? String(quota.remaining) : '—', label: tr('u8.hub.remaining') },
      ]} />

      <Row wrap style={{ alignItems: 'stretch' }}>
        <EntryCard to="/scanner/product" icon="maximize" title={tr('u8.hub.scanProduct')} sub={tr('u8.hub.scanProductSub')} testID="scanner-entry-product" />
        <EntryCard to="/scanner/food" icon="search" title={tr('u8.hub.scanFood')} sub={tr('u8.hub.scanFoodSub')} testID="scanner-entry-food" />
      </Row>
      {quota ? <Text variant="caption" muted>{tr('u8.hub.quotaLine', { remaining: quota.remaining, quota: quota.quota })}</Text> : null}

      {last ? (
        <View style={{ gap: spacing.xs }} testID="scanner-last">
          <Text variant="caption" muted style={{ letterSpacing: 1.1, textTransform: 'uppercase' }}>{tr('u8.hub.lastScan')}</Text>
          <ScanListRow s={last} favorite={favIds.has(last.id)} testID="scanner-last-open" />
        </View>
      ) : null}

      <SectionTitle title={last ? tr('u8.hub.before') : tr('u8.hub.recent')} action={history?.length ? tr('u8.hub.seeAll') : undefined} onAction={() => router.push('/scanner/history')} />
      {historyQ.isLoading && !history ? <Skeleton kind="card" rows={2} /> : historyQ.isError && !history ? (
        <ErrorView error={historyQ.error} onRetry={() => void historyQ.refetch()} title={tr('u8.hub.listErr')} />
      ) : recent.length ? (
        <View style={{ gap: spacing.sm }}>{recent.map((s) => <ScanListRow key={s.id} s={s} favorite={favIds.has(s.id)} />)}</View>
      ) : last ? null : (
        <EmptyState icon="maximize" title={tr('u8.hub.none')} body={tr('u8.hub.noneBody')} action={{ label: tr('u8.hub.firstScan'), icon: 'camera', onPress: () => router.push('/scanner/product') }} />
      )}

      {favorites.length ? (
        <>
          <SectionTitle title={tr('u8.hub.favorites')} action={tr('u8.hub.seeAll')} onAction={() => router.push({ pathname: '/scanner/history', params: { filter: 'favorites' } })} />
          <View style={{ gap: spacing.sm }}>{favorites.map((s) => <ScanListRow key={s.id} s={s} favorite />)}</View>
        </>
      ) : null}

      <SectionTitle title={tr('u8.hub.tools')} />
      <Card padded={false}>
        <ListRow icon="clock" title={tr('u8.hub.histFav')} subtitle={tr('u8.hub.histFavSub')} onPress={() => router.push('/scanner/history')} testID="scanner-tool-history" />
        <ListRow icon="columns" title={tr('u8.hub.compare')} subtitle={tr('u8.hub.compareSub')} onPress={() => router.push('/scanner/compare')} testID="scanner-tool-compare" />
        <ListRow icon="slash" title={tr('u8.hub.avoid')} subtitle={tr('u8.hub.avoidSub')} onPress={() => router.push('/scanner/avoid')} />
        <ListRow icon="bell" title={tr('tool.recall_alerts')} subtitle={tr('scn.recallsFree')} onPress={() => router.push('/scanner/recalls')} testID="scanner-tool-recalls" />
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
