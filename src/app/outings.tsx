/**
 * « Sorties près de chez moi » : découvrir des lieux PUBLICS pour sortir en famille (cafés et salons de thé,
 * restaurants familles, parcs et aires de jeux, activités parents-enfants ; PMI et accompagnement en filtre
 * secondaire). Lieux et photos Google Places (fonction serveur `places`), montrés sur un fond de carte Google.
 * Vues Carte et Liste ; filtres : type de lieu, espace bébé ou enfant. Aucun lieu inventé, aucune rencontre entre
 * membres, aucune position de membre ; la position du moment est facultative, arrondie et jamais enregistrée.
 */
import React, { useMemo, useState } from 'react';
import { Linking, Platform, ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/Screen';
import { Skeleton } from '@/components/States';
import { GlassSurface } from '@/components/Glass';
import { Banner, Button, Chip, Icon, Row, SectionTitle, Segmented, Text } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { FamilyMap } from '@/features/outings/FamilyMap';
import { catLabel, MiniRow, PlaceCard, PlaceSheet } from '@/features/outings/PlaceVisuals';
import { TownPicker } from '@/features/outings/TownPicker';
import { usePlaceFavorites } from '@/lib/data/hooks-discoveries';
import { placesProvider, useFamilyPlaces } from '@/lib/data/hooks-outings';
import { directionsUrl, directoryUrl, distanceM, type Directory } from '@/lib/domain/nearby';
import { applyFilters, CATEGORY_ICON, MAIN_CATEGORIES, nextRadius, SECONDARY_CATEGORY, supportDirectories, withDistance, type FamilyCategory, type FamilyPlace } from '@/lib/domain/familyPlaces';
import { useUiStore } from '@/lib/store';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

export default function Outings() {
  const t = useTheme();
  const params = useLocalSearchParams<{ view?: string }>();
  const town = useUiStore((s) => s.nearbyTown);
  const [here, setHere] = useState<{ lat: number; lon: number } | null>(null);
  const [view, setView] = useState<'map' | 'list'>(params.view === 'list' ? 'list' : 'map');
  const [cat, setCat] = useState<FamilyCategory | 'all'>('all');
  const [kidsSpace, setKidsSpace] = useState(false);
  const [radius, setRadius] = useState(2000);
  const [open, setOpen] = useState<FamilyPlace | null>(null);
  const center = here ?? (town ? { lat: town.lat, lon: town.lon } : null);
  const cityLabel = here ? null : town?.label.replace(/\s*\d{5}.*$/, '') ?? null;
  const q = useFamilyPlaces(center, cat, radius);
  const osm = placesProvider() === 'osm';
  const favs = usePlaceFavorites();
  const places = useMemo(() => (center && q.data ? applyFilters(withDistance(q.data.places, center, radius), { category: cat, kidsSpace }) : []), [center, q.data, radius, cat, kidsSpace]);
  const state = q.data?.state;
  const wider = nextRadius(radius);

  return (
    <Screen back title={tr('out.title')} subtitle={tr('out.subtitle')}>
      <View testID="outings" />
      <LinearGradient pointerEvents="none" colors={t.isDark ? ['rgba(255,214,190,0.05)', 'rgba(201,184,255,0.06)'] : ['#FFF7EE', '#F3EEFB', '#FDEBE0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', top: 0, left: -spacing.md, right: -spacing.md, height: 3000, borderRadius: 32 }} />
      <Text variant="small" muted testID="out-privacy">{tr('out.privacy')}</Text>

      <GlassSurface fill={t.isDark ? 'rgba(40,32,70,0.55)' : 'rgba(255,255,255,0.62)'} depth={2} radius={24} padded={spacing.md}>
        <TownPicker onHere={setHere} />
        {center ? <Text variant="small" style={{ marginTop: spacing.xs }} testID="out-center">{here ? tr('nb.aroundHere') : tr('nb.around', { town: town!.label })}</Text> : null}
      </GlassSurface>

      <Text variant="label">{tr('out.types')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} testID="out-categories" style={{ marginHorizontal: -spacing.md }} contentContainerStyle={{ gap: spacing.xs, paddingHorizontal: spacing.md }}>
        <Chip label={tr('out.cat.all')} icon="grid" selected={cat === 'all'} onPress={() => setCat('all')} testID="out-cat-all" />
        {MAIN_CATEGORIES.map((c) => <Chip key={c} label={catLabel(c)} icon={CATEGORY_ICON[c] as never} selected={cat === c} onPress={() => setCat(c)} testID={`out-cat-${c}`} />)}
      </ScrollView>
      <Row wrap style={{ alignItems: 'center' }}>
        <Chip label={tr('out.kidsSpace')} icon="smile" selected={kidsSpace} onPress={() => setKidsSpace(!kidsSpace)} testID="out-kids-space" />
        <Text variant="caption" muted>{tr('out.also')}</Text>
        <Chip label={catLabel(SECONDARY_CATEGORY)} icon={CATEGORY_ICON.support as never} selected={cat === 'support'} onPress={() => setCat(cat === 'support' ? 'all' : 'support')} testID="out-cat-support" />
      </Row>
      {kidsSpace ? <Text variant="caption" muted>{tr('out.kidsSpaceNote')}</Text> : null}
      {osm && (cat === 'cafes' || cat === 'restaurants') ? <Text variant="caption" muted testID="out-osm-note">{tr('out.osmCafesNote')}</Text> : null}
      <Segmented label={tr('out.views')} value={view} onChange={setView} options={[{ value: 'map', label: tr('out.view.map'), testID: 'out-view-map' }, { value: 'list', label: tr('out.view.list'), testID: 'out-view-list' }]} />

      {!center ? <Text muted variant="small" testID="out-start">{tr('out.start')}</Text> : q.isLoading ? (
        <View style={{ gap: spacing.xs }} testID="out-loading"><Text variant="caption" muted>{tr('out.loadingSlow')}</Text><Skeleton kind="list" rows={3} /></View>
      ) : state && state !== 'ok' ? (
        <Banner tone="warning" icon="wifi-off" title={tr(`out.state.${state}` as TKey)} action={<Button label={tr('out.retry')} size="sm" variant="secondary" style={{ alignSelf: 'flex-start', marginTop: 6 }} onPress={() => void q.refetch()} testID="out-retry" />}>
          {null}
        </Banner>
      ) : (
        <>
          {view === 'map' ? <FamilyMap center={center} places={places} radius={radius} height={360} onSelect={setOpen} /> : null}
          <SectionTitle title={tr('out.count', { count: places.length })} />
          {places.length ? (
            view === 'list' ? (
              <View style={{ gap: spacing.sm }} testID="out-list">
                {places.map((p) => <PlaceCard key={p.id} p={p} onPress={() => setOpen(p)} />)}
              </View>
            ) : (
              <View style={{ gap: spacing.xs }} testID="out-map-list">
                {places.slice(0, 6).map((p) => <MiniRow key={p.id} p={p} onPress={() => setOpen(p)} />)}
                {places.length > 6 ? <Button label={tr('out.seeList')} size="sm" variant="ghost" onPress={() => setView('list')} style={{ alignSelf: 'flex-start' }} /> : null}
              </View>
            )
          ) : (
            <View style={{ gap: spacing.xs }} testID="out-none">
              <Text muted variant="small">{tr('out.none', { km: radius / 1000 })}</Text>
              {wider ? <Button label={tr('out.widen', { km: wider / 1000 })} icon="maximize-2" size="sm" variant="secondary" onPress={() => setRadius(wider)} style={{ alignSelf: 'flex-start' }} testID="out-widen" /> : null}
              {kidsSpace || cat !== 'all' ? <Button label={tr('out.clear')} size="sm" variant="ghost" onPress={() => { setKidsSpace(false); setCat('all'); }} style={{ alignSelf: 'flex-start' }} testID="out-clear" /> : null}
            </View>
          )}
        </>
      )}

      {cat === 'support' ? (
        <>
          <SectionTitle title={tr('out.directories')} />
          <View style={{ gap: spacing.sm }} testID="out-directories">
            {supportDirectories().map((d) => <DirectoryCard key={`${d.kind}-${d.title}`} d={d} town={cityLabel} />)}
          </View>
        </>
      ) : null}

      {favs.data?.length ? (
        <>
          <SectionTitle title={tr('out.favorites')} />
          <View style={{ gap: spacing.xs }} testID="out-favorites">
            {favs.data.map((f) => (
              <Tappable key={f.id} accessibilityRole="link" disabled={f.lat == null} onPress={() => f.lat != null && f.lon != null && void Linking.openURL(directionsUrl({ lat: f.lat, lon: f.lon, name: f.name }, Platform.OS))} testID={`out-fav-${f.place_id}`} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48 }}>
                <Icon name="heart" size={16} color="#E5525F" />
                <View style={{ flex: 1 }}><Text weight="bold">{f.name}</Text>{f.address ? <Text variant="caption" muted>{f.address}</Text> : null}</View>
                <Icon name="navigation" size={16} color={t.colors.textMuted} />
              </Tappable>
            ))}
          </View>
        </>
      ) : null}

      <PlaceSheet place={open} distance={open && center ? distanceM(center, open) : null} onClose={() => setOpen(null)} />
    </Screen>
  );
}

function DirectoryCard({ d, town }: { d: Directory; town: string | null }) {
  const t = useTheme();
  const url = directoryUrl(d, town);
  return (
    <GlassSurface fill={t.isDark ? 'rgba(40,32,70,0.5)' : 'rgba(255,255,255,0.6)'} depth={1} radius={20} padded={spacing.md}>
      <View style={{ gap: 4 }} testID={`out-dir-${d.kind}`}>
        <Text weight="bold">{d.title}</Text>
        <Text variant="small">{d.body}</Text>
        {d.hours ? <Text variant="caption" muted>{d.hours}</Text> : null}
        <Text variant="caption" muted>{tr('nb.dirSource', { source: d.source, date: formatDate(`${d.checkedOn}T12:00:00`, { day: 'numeric', month: 'long', year: 'numeric' }) })}</Text>
        <Row wrap>
          {url ? <Button label={d.annuaire && town ? tr('nb.openIn', { town }) : tr('nb.open')} icon="external-link" size="sm" variant="secondary" onPress={() => void Linking.openURL(url)} /> : null}
          {d.phone ? <Button label={tr('nb.call', { phone: d.phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3') })} icon="phone" size="sm" variant="secondary" onPress={() => void Linking.openURL(`tel:${d.phone}`)} /> : null}
        </Row>
      </View>
    </GlassSurface>
  );
}
