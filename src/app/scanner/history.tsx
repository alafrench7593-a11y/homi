/** Historique des analyses du scanner : filtres, favoris, suppression d'une analyse ou de tout l'historique. */
import React, { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { confirm, useToast } from '@/components/Overlays';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton, VirtualList } from '@/components/States';
import { Button, Chip, IconButton, Row, Text } from '@/components/ui';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useDeleteAllScans, useDeleteScan, useScanFavorites, useScanHistory, useToggleScanFavorite } from '@/lib/data/hooks-scanner';
import { ScanListRow } from '@/features/scanner/components';
import { spacing } from '@/theme/tokens';

type Filter = 'all' | 'product' | 'food' | 'favorites';
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Tout' }, { value: 'product', label: 'Produits' }, { value: 'food', label: 'Aliments' }, { value: 'favorites', label: 'Favoris' },
];

export default function ScanHistoryScreen() {
  const params = useLocalSearchParams<{ filter?: string }>();
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
  const rows = (data ?? []).filter((s) => (filter === 'all' ? true : filter === 'favorites' ? favorites.has(s.id) : s.kind === filter));

  async function removeOne(id: string) {
    if (!(await confirm('Supprimer cette analyse ?', 'Elle sera retirée de l’historique et des favoris.', 'Supprimer'))) return;
    delOne.mutate(id, { onSuccess: () => toast('Analyse supprimée.'), onError: (e) => toast(friendlyError(e), 'error') });
  }
  async function removeAll() {
    if (delAll.isPending) return;
    if (!(await confirm('Supprimer tout l’historique ?', 'Toutes vos analyses, résultats et favoris du scanner seront effacés. Le quota du mois n’est pas modifié.', 'Tout supprimer'))) return;
    try {
      await delAll.mutateAsync();
      toast('Historique du scanner supprimé.', 'success');
    } catch (e) {
      toast(friendlyError(e), 'error');
    }
  }

  const toggleFavorite = (scanId: string) => {
    if (toggle.isPending) return;
    toggle.mutate({ scanId, favorite: !favorites.has(scanId) }, { onError: (e) => toast(friendlyError(e), 'error') });
  };

  return (
    <Screen back scroll={false} padded={false} title="Historique du scanner" subtitle="Vos analyses restent privées : elles ne sont pas partagées avec le foyer.">
      <VirtualList
        data={isLoading || failed ? [] : rows}
        keyExtractor={(s) => s.id}
        renderItem={({ item: s }) => (
          <View>
            <ScanListRow s={s} favorite={favorites.has(s.id)} />
            <Row style={{ justifyContent: 'flex-end' }}>
              <IconButton icon="star" label={favorites.has(s.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'} onPress={() => toggleFavorite(s.id)} />
              <IconButton icon="trash-2" label="Supprimer cette analyse" onPress={() => removeOne(s.id)} />
            </Row>
          </View>
        )}
        ListHeaderComponent={(
          <View style={{ gap: spacing.md, marginBottom: spacing.xxs }}>
            <Row wrap>{FILTERS.map((f) => <Chip key={f.value} label={f.label} selected={filter === f.value} onPress={() => setFilter(f.value)} />)}</Row>
            {isLoading ? <Skeleton kind="card" rows={3} /> : failed ? <ErrorView error={error} onRetry={() => void refetch()} /> : null}
          </View>
        )}
        ListEmptyComponent={isLoading || failed ? null : filter === 'favorites' && data?.length ? (
          <EmptyState icon="star" title="Aucun favori pour le moment." body="Touchez l’étoile d’une analyse pour la retrouver ici." action={{ label: 'Voir toutes les analyses', icon: 'list', onPress: () => setFilter('all') }} />
        ) : (
          <EmptyState icon="maximize" title="Aucune analyse pour le moment." action={{ label: 'Scanner un produit', icon: 'camera', onPress: () => router.push('/scanner/product') }} />
        )}
        ListFooterComponent={(
          <View style={{ gap: spacing.md, marginTop: spacing.xxs }}>
            {data?.length ? <Button label="Comparer deux produits" icon="columns" variant="secondary" onPress={() => router.push('/scanner/compare')} /> : null}
            {data?.length ? <Button label="Tout supprimer" icon="trash-2" variant="danger" loading={delAll.isPending} onPress={removeAll} /> : null}
            <Text variant="caption" muted>Supprimer l’historique ne rend pas d’analyse au quota du mois. Les alertes de rappel ne concernent que les produits encore présents dans l’historique ou les favoris.</Text>
          </View>
        )}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.sm }}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}
