/**
 * Historique des analyses du scanner : filtre par type (sélecteur à indicateur qui glisse), favoris, profil (Premium),
 * suppression de tout l'historique (une analyse se supprime depuis sa fiche).
 * 22/11/2026 : journal horodaté (src/features/readTrack/ScanJournal.tsx) — jour par jour, heure en colonne fixe,
 * résultat tel qu'il a été lu, étoile, chevron ; UNE donnée en grand (analyses enregistrées), jamais « 0 ».
 * États : chargement, erreur (réessayer), vide, aucun favori.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useToast } from '@/components/Overlays';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Chip, Row, Text } from '@/components/ui';
import { ChoiceGroup, SecondaryButton, SensitiveButton } from '@/components/controls';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useDeleteAllScans, useScanFavorites, useScanHistory, useToggleScanFavorite } from '@/lib/data/hooks-scanner';
import { usePremiumAccess } from '@/lib/data/hooks-premium';
import { HmHero } from '@/features/homeTrack/kit';
import { ScanJournal } from '@/features/readTrack/ScanJournal';
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
  const { data, isLoading: loadingRaw, isError, error, refetch } = useScanHistory();
  const isLoading = loadingRaw && !data;
  const failed = isError && !data;
  const { ids: favorites } = useScanFavorites();
  const toggle = useToggleScanFavorite();
  const delAll = useDeleteAllScans();
  // Filtre par profil (grossesse, bébé, enfant) : Premium
  const [profile, setProfile] = useState<string | null>(null);
  const profAccess = usePremiumAccess('scanner_more');
  const PROFILES: { value: string[]; key: string; label: string }[] = [
    { key: 'pregnant', value: ['pregnant', 'breastfeeding'], label: tr('u8.history.pregnancy') }, { key: 'baby', value: ['newborn', 'baby'], label: tr('u8.history.baby') }, { key: 'child', value: ['child'], label: tr('u8.history.child') },
  ];
  const rows = (data ?? []).filter((s) => (filter === 'all' || s.kind === filter) && (!favOnly || favorites.has(s.id)))
    .filter((s) => !profile || (PROFILES.find((p) => p.key === profile)?.value ?? []).includes(String((s as { target_profile?: string }).target_profile ?? '')));

  async function removeAll() {
    await delAll.mutateAsync();
    toast(tr('u8.history.delAllDone'), 'success');
  }
  const toggleFavorite = (scanId: string) => {
    if (toggle.isPending) return;
    toggle.mutate({ scanId, favorite: !favorites.has(scanId) }, { onError: (e) => toast(friendlyError(e), 'error') });
  };

  const total = data?.length ?? 0;
  return (
    <Screen back title={tr('u8.history.title')} subtitle={tr('u8.history.subtitle')}
      action={{ label: tr('u8.history.scanProduct'), icon: 'camera', onPress: () => router.push('/scanner/product'), testID: 'scan-history-new' }}>
      {/* UNE donnée : les analyses enregistrées (jamais « 0 » : « Rien de noté » tant qu'aucune analyse) */}
      <HmHero testID="scan-hero" value={total ? String(total) : null} unit={total ? tr('rt.scan.unit', { count: total }) : null} emptyLabel={tr('u8.history.none')}
        split={total && data ? [
          { label: tr('u8.history.products'), value: String(data.filter((x) => x.kind === 'product').length), testID: 'scan-hero-products' },
          { label: tr('u8.history.foods'), value: String(data.filter((x) => x.kind === 'food').length), testID: 'scan-hero-foods' },
          { label: tr('u8.history.favorites'), value: String(data.filter((x) => favorites.has(x.id)).length), testID: 'scan-hero-favs' },
        ] : undefined} />
      <ChoiceGroup label={tr('scn.filter')} value={filter} onChange={setFilter} options={FILTERS} testID="scan-filter" />
      <View testID="scan-profile-filter"><Row wrap>
        <Chip icon="star" label={tr('u8.history.favorites')} selected={favOnly} onPress={() => setFavOnly(!favOnly)} testID="scan-filter-favorites" />
        {PROFILES.map((p) => <Chip key={p.key} icon={profAccess.premium ? undefined : 'star'} label={p.label} selected={profile === p.key}
          onPress={() => { if (profile === p.key) { setProfile(null); return; } if (profAccess.require(<Text variant="small">{tr('u8.history.profCount', { count: (data ?? []).filter((x) => p.value.includes(String((x as { target_profile?: string }).target_profile ?? ''))).length, profile: p.label })}</Text>)) setProfile(p.key); }} />)}
      </Row></View>
      {isLoading ? <Skeleton kind="card" rows={3} /> : failed ? <ErrorView error={error} onRetry={() => void refetch()} /> : rows.length ? (
        <ScanJournal rows={rows} favorites={favorites} onToggleFavorite={toggleFavorite} />
      ) : favOnly && data?.length ? (
        <EmptyState icon="star" title={tr('u8.history.noFav')} body={tr('u8.history.noFavBody')} action={{ label: tr('u8.history.seeAll'), icon: 'list', onPress: () => { setFilter('all'); setFavOnly(false); } }} />
      ) : data?.length ? (
        <EmptyState icon="filter" title={tr('scn.noMatch')} action={{ label: tr('u8.history.seeAll'), icon: 'list', onPress: () => { setFilter('all'); setProfile(null); } }} />
      ) : null}
      {data?.length ? <SecondaryButton label={tr('u8.history.compare')} icon="columns" onPress={() => router.push('/scanner/compare')} testID="scan-history-compare" /> : null}
      {data?.length ? <SensitiveButton label={tr('u8.history.delAllBtn')} icon="trash-2" onPress={removeAll}
        confirmTitle={tr('u8.history.delAllQ')} confirmMessage={tr('u8.history.delAllBody')} confirmLabel={tr('u8.history.delAllBtn')} /> : null}
      <Text variant="caption" muted>{tr('u8.history.footer')}</Text>
    </Screen>
  );
}
