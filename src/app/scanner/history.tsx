/**
 * Historique des analyses du scanner (surface MATE, liste virtualisée) : filtre par type (sélecteur à indicateur qui
 * glisse), favoris, profil (Premium), suppression d'une analyse ou de tout l'historique. Ouvrir une ligne agrandit sa
 * surface vers la fiche (morph `scan-<id>`) ; au retour, la surface revient vers la même ligne.
 * États : chargement, erreur (réessayer), vide, aucun favori.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useToast } from '@/components/Overlays';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { EmptyState, ErrorView, Skeleton, VirtualList } from '@/components/States';
import { Chip, Row, Text } from '@/components/ui';
import { ChoiceGroup, IconOrb, SecondaryButton, SensitiveButton } from '@/components/controls';
import { confirm } from '@/components/Overlays';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useDeleteAllScans, useDeleteScan, useScanFavorites, useScanHistory, useToggleScanFavorite } from '@/lib/data/hooks-scanner';
import { usePremiumAccess } from '@/lib/data/hooks-premium';
import { ScanListRow } from '@/features/scanner/components';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

type Filter = 'all' | 'product' | 'food';

export default function ScanHistoryScreen() {
  const params = useLocalSearchParams<{ filter?: string }>();
  // Type d'analyse (3 options : lisibles sans césure dès 320 px) ; « Favoris » se combine à part
  const FILTERS: { value: Filter; label: string; testID: string }[] = [
    { value: 'all', label: tr('u8.history.all'), testID: 'scan-filter-all' }, { value: 'product', label: tr('u8.history.products'), testID: 'scan-filter-product' },
    { value: 'food', label: tr('u8.history.foods'), testID: 'scan-filter-food' },
  ];
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>('all');
  const [favOnly, setFavOnly] = useState(params.filter === 'favorites');
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
  const rows = (data ?? []).filter((s) => (filter === 'all' || s.kind === filter) && (!favOnly || favorites.has(s.id)))
    .filter((s) => !profile || (PROFILES.find((p) => p.key === profile)?.value ?? []).includes(String((s as { target_profile?: string }).target_profile ?? '')));

  async function removeOne(id: string) {
    if (delOne.isPending) return;
    if (!(await confirm(tr('u8.history.delOneQ'), tr('u8.history.delOneBody'), tr('u8.history.delete')))) return;
    delOne.mutate(id, { onSuccess: () => toast(tr('u8.history.delOneDone')), onError: (e) => toast(friendlyError(e), 'error') });
  }
  async function removeAll() {
    await delAll.mutateAsync();
    toast(tr('u8.history.delAllDone'), 'success');
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
          <ScanListRow s={s} favorite={favorites.has(s.id)} trailing={(
            <View style={{ flexDirection: 'row' }}>
              <IconOrb icon="star" size="sm" selected={favorites.has(s.id)} label={favorites.has(s.id) ? tr('u8.history.unfav') : tr('u8.history.fav')} onPress={() => toggleFavorite(s.id)} testID={`scan-fav-${s.id}`} />
              <IconOrb icon="trash-2" size="sm" label={tr('u8.history.delLabel')} onPress={() => void removeOne(s.id)} testID={`scan-del-${s.id}`} />
            </View>
          )} />
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
            <ChoiceGroup label={tr('scn.filter')} value={filter} onChange={setFilter} options={FILTERS} testID="scan-filter" />
            <View testID="scan-profile-filter"><Row wrap>
              <Chip icon="star" label={tr('u8.history.favorites')} selected={favOnly} onPress={() => setFavOnly(!favOnly)} testID="scan-filter-favorites" />
              {PROFILES.map((p) => <Chip key={p.key} icon={profAccess.premium ? undefined : 'star'} label={p.label} selected={profile === p.key}
              onPress={() => { if (profile === p.key) { setProfile(null); return; } if (profAccess.require(<Text variant="small">{tr('u8.history.profCount', { count: (data ?? []).filter((x) => p.value.includes(String((x as { target_profile?: string }).target_profile ?? ''))).length, profile: p.label })}</Text>)) setProfile(p.key); }} />)}</Row></View>
            {isLoading ? <Skeleton kind="card" rows={3} /> : failed ? <ErrorView error={error} onRetry={() => void refetch()} /> : null}
          </View>
        )}
        ListEmptyComponent={isLoading || failed ? null : favOnly && data?.length ? (
          <EmptyState icon="star" title={tr('u8.history.noFav')} body={tr('u8.history.noFavBody')} action={{ label: tr('u8.history.seeAll'), icon: 'list', onPress: () => { setFilter('all'); setFavOnly(false); } }} />
        ) : data?.length ? (
          <EmptyState icon="filter" title={tr('scn.noMatch')} action={{ label: tr('u8.history.seeAll'), icon: 'list', onPress: () => { setFilter('all'); setProfile(null); } }} />
        ) : (
          <EmptyState icon="maximize" title={tr('u8.history.none')} action={{ label: tr('u8.history.scanProduct'), icon: 'camera', onPress: () => router.push('/scanner/product') }} />
        )}
        ListFooterComponent={(
          <View style={{ gap: spacing.md, marginTop: spacing.xxs }}>
            {data?.length ? <SecondaryButton label={tr('u8.history.compare')} icon="columns" onPress={() => router.push('/scanner/compare')} testID="scan-history-compare" /> : null}
            {data?.length ? <SensitiveButton label={tr('u8.history.delAllBtn')} icon="trash-2" onPress={removeAll}
              confirmTitle={tr('u8.history.delAllQ')} confirmMessage={tr('u8.history.delAllBody')} confirmLabel={tr('u8.history.delAllBtn')} /> : null}
            <Text variant="caption" muted>{tr('u8.history.footer')}</Text>
          </View>
        )}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.sm }}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}
