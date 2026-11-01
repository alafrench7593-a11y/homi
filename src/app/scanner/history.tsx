/** Historique des analyses du scanner : filtres, favoris, suppression d'une analyse ou de tout l'historique. */
import React, { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { confirm, useToast } from '@/components/Overlays';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { EmptyState, ErrorView, Skeleton, VirtualList } from '@/components/States';
import { Button, Chip, IconButton, Row, Text } from '@/components/ui';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useDeleteAllScans, useDeleteScan, useScanFavorites, useScanHistory, useToggleScanFavorite } from '@/lib/data/hooks-scanner';
import { usePremiumAccess } from '@/lib/data/hooks-premium';
import { ScanListRow } from '@/features/scanner/components';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

type Filter = 'all' | 'product' | 'food' | 'favorites';

export default function ScanHistoryScreen() {
  const params = useLocalSearchParams<{ filter?: string }>();
  const FILTERS: { value: Filter; label: string }[] = [
    { value: 'all', label: tr('u8.history.all') }, { value: 'product', label: tr('u8.history.products') }, { value: 'food', label: tr('u8.history.foods') }, { value: 'favorites', label: tr('u8.history.favorites') },
  ];
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>(params.filter === 'favorites' ? 'favorites' : 'all');
  const insets = useSafeAreaInsets();
  const { data, isLoading: loadingRaw, isError, error, refetch } = useScanHistory();
  const isLoading = loadingRaw && !data;
  const failed = isError && !data;
  const { ids: favorites } = useScanFavorites();
  const toggle = useToggleScanFavorite();
  const delOne = useDeleteScan();
  const delAll = useDeleteAllScans();
  // Filtre par profil (grossesse, bébé, enfant) : Premium
  const [profile, setProfile] = useState<string | null>(null);
  const profAccess = usePremiumAccess('scanner_more');
  const PROFILES: { value: string[]; key: string; label: string }[] = [
    { key: 'pregnant', value: ['pregnant', 'breastfeeding'], label: tr('u8.history.pregnancy') }, { key: 'baby', value: ['newborn', 'baby'], label: tr('u8.history.baby') }, { key: 'child', value: ['child'], label: tr('u8.history.child') },
  ];
  const rows = (data ?? []).filter((s) => (filter === 'all' ? true : filter === 'favorites' ? favorites.has(s.id) : s.kind === filter))
    .filter((s) => !profile || (PROFILES.find((p) => p.key === profile)?.value ?? []).includes(String((s as { target_profile?: string }).target_profile ?? '')));

  async function removeOne(id: string) {
    if (!(await confirm(tr('u8.history.delOneQ'), tr('u8.history.delOneBody'), tr('u8.history.delete')))) return;
    delOne.mutate(id, { onSuccess: () => toast(tr('u8.history.delOneDone')), onError: (e) => toast(friendlyError(e), 'error') });
  }
  async function removeAll() {
    if (delAll.isPending) return;
    if (!(await confirm(tr('u8.history.delAllQ'), tr('u8.history.delAllBody'), tr('u8.history.delAllBtn')))) return;
    try {
      await delAll.mutateAsync();
      toast(tr('u8.history.delAllDone'), 'success');
    } catch (e) {
      toast(friendlyError(e), 'error');
    }
  }

  const toggleFavorite = (scanId: string) => {
    if (toggle.isPending) return;
    toggle.mutate({ scanId, favorite: !favorites.has(scanId) }, { onError: (e) => toast(friendlyError(e), 'error') });
  };

  return (
    <Screen back scroll={false} padded={false} title={tr('u8.history.title')} subtitle={tr('u8.history.subtitle')}
      action={{ label: tr('u8.history.scanProduct'), icon: 'camera', onPress: () => router.push('/scanner/product'), testID: 'scan-history-new' }}>
      <VirtualList
        data={isLoading || failed ? [] : rows}
        keyExtractor={(s) => s.id}
        renderItem={({ item: s }) => (
          <View>
            <ScanListRow s={s} favorite={favorites.has(s.id)} />
            <Row style={{ justifyContent: 'flex-end' }}>
              <IconButton icon="star" label={favorites.has(s.id) ? tr('u8.history.unfav') : tr('u8.history.fav')} onPress={() => toggleFavorite(s.id)} />
              <IconButton icon="trash-2" label={tr('u8.history.delLabel')} onPress={() => removeOne(s.id)} />
            </Row>
          </View>
        )}
        ListHeaderComponent={(
          <View style={{ gap: spacing.md, marginBottom: spacing.xxs }}>
            {data ? (
              <TodaySummary title={tr('u8.history.brief')} items={[
                { icon: 'maximize', value: String(data.filter((x) => x.kind === 'product').length), label: tr('u8.history.products') },
                { icon: 'search', value: String(data.filter((x) => x.kind === 'food').length), label: tr('u8.history.foods') },
                { icon: 'star', value: String(data.filter((x) => favorites.has(x.id)).length), label: tr('u8.history.favorites') },
              ]} />
            ) : null}
            <Row wrap>{FILTERS.map((f) => <Chip key={f.value} label={f.label} selected={filter === f.value} onPress={() => setFilter(f.value)} />)}</Row>
            <View testID="scan-profile-filter"><Row wrap>{PROFILES.map((p) => <Chip key={p.key} icon={profAccess.premium ? undefined : 'star'} label={p.label} selected={profile === p.key}
              onPress={() => { if (profile === p.key) { setProfile(null); return; } if (profAccess.require(<Text variant="small">{tr('u8.history.profCount', { count: (data ?? []).filter((x) => p.value.includes(String((x as { target_profile?: string }).target_profile ?? ''))).length, profile: p.label })}</Text>)) setProfile(p.key); }} />)}</Row></View>
            {isLoading ? <Skeleton kind="card" rows={3} /> : failed ? <ErrorView error={error} onRetry={() => void refetch()} /> : null}
          </View>
        )}
        ListEmptyComponent={isLoading || failed ? null : filter === 'favorites' && data?.length ? (
          <EmptyState icon="star" title={tr('u8.history.noFav')} body={tr('u8.history.noFavBody')} action={{ label: tr('u8.history.seeAll'), icon: 'list', onPress: () => setFilter('all') }} />
        ) : (
          <EmptyState icon="maximize" title={tr('u8.history.none')} action={{ label: tr('u8.history.scanProduct'), icon: 'camera', onPress: () => router.push('/scanner/product') }} />
        )}
        ListFooterComponent={(
          <View style={{ gap: spacing.md, marginTop: spacing.xxs }}>
            {data?.length ? <Button label={tr('u8.history.compare')} icon="columns" variant="secondary" onPress={() => router.push('/scanner/compare')} /> : null}
            {data?.length ? <Button label={tr('u8.history.delAllBtn')} icon="trash-2" variant="danger" loading={delAll.isPending} onPress={removeAll} /> : null}
            <Text variant="caption" muted>{tr('u8.history.footer')}</Text>
          </View>
        )}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.sm }}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}
