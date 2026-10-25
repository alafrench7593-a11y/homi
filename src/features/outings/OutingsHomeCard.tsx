/**
 * Accueil › « Sorties près de chez moi » : la carte des lieux réels autour de la ville choisie, directement sur
 * l'accueil (pour le moment fond OpenStreetMap et lieux OpenStreetMap, gratuits ; Google en réserve), les plus proches en dessous, et l'accès à la vue Liste.
 * Sans ville : choix de la ville ou du code postal sur place. Aucun lieu inventé.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Icon, Row, Text } from '@/components/ui';
import { Skeleton } from '@/components/States';
import { useFamilyPlaces } from '@/lib/data/hooks-outings';
import { distanceM } from '@/lib/domain/nearby';
import { applyFilters, withDistance, type FamilyPlace } from '@/lib/domain/familyPlaces';
import { useUiStore } from '@/lib/store';
import { t as tr, type TKey } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { FamilyMap } from './FamilyMap';
import { MiniRow, PlaceSheet } from './PlaceVisuals';
import { TownPicker } from './TownPicker';

const RADIUS = 2000;

export function OutingsHomeCard() {
  const t = useTheme();
  const town = useUiStore((s) => s.nearbyTown);
  const [here, setHere] = useState<{ lat: number; lon: number } | null>(null);
  const [open, setOpen] = useState<FamilyPlace | null>(null);
  const center = here ?? (town ? { lat: town.lat, lon: town.lon } : null);
  const q = useFamilyPlaces(center, 'all', RADIUS);
  const places = useMemo(() => (center && q.data ? applyFilters(withDistance(q.data.places, center, RADIUS), { category: 'all', kidsSpace: false }) : []), [center, q.data]);
  const state = q.data?.state;
  const area = here ? tr('nb.aroundHere') : town ? town.label.replace(/\s*\d{5}.*$/, '') : null;
  return (
    <View style={{ borderRadius: 26, overflow: 'hidden', borderWidth: 1, borderColor: t.colors.border }} testID="home-outings">
      <LinearGradient colors={t.isDark ? ['#2A2440', '#231E36'] : ['#FFF7EE', '#F3EEFB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: spacing.md, gap: spacing.sm }}>
        <Row style={{ alignItems: 'center' }}>
          <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: `${t.colors.lavender}33`, alignItems: 'center', justifyContent: 'center' }}><Icon name="map-pin" size={18} color={t.colors.lavender} /></View>
          <View style={{ flex: 1 }}>
            <Text weight="bold">{tr('out.title')}</Text>
            <Text variant="caption" muted>{area ? tr('out.homeIntro', { town: area }) : tr('out.homeNoTown')}</Text>
          </View>
        </Row>
        {!center ? <TownPicker onHere={setHere} compact /> : q.isLoading ? (
          <View style={{ gap: 6 }}><Text variant="caption" muted>{tr('out.loadingSlow')}</Text><Skeleton kind="card" rows={2} /></View>
        ) : state && state !== 'ok' ? (
          <View style={{ gap: 6 }}>
            <Text variant="small" muted testID="home-outings-state">{tr(`out.state.${state}` as TKey)}</Text>
            <Button label={tr('out.retry')} icon="refresh-cw" size="sm" variant="secondary" style={{ alignSelf: 'flex-start' }} onPress={() => void q.refetch()} testID="home-outings-retry" />
          </View>
        ) : (
          <>
            <FamilyMap center={center} places={places} radius={RADIUS} height={230} onSelect={setOpen} />
            {places.length ? (
              <View testID="home-outings-list">{places.slice(0, 3).map((p) => <MiniRow key={p.id} p={p} onPress={() => setOpen(p)} />)}</View>
            ) : <Text variant="small" muted>{tr('out.none', { km: RADIUS / 1000 })}</Text>}
          </>
        )}
        {center ? (
          <Row wrap>
            <Button label={tr('out.seeList')} icon="list" size="sm" variant="secondary" onPress={() => router.push({ pathname: '/outings' as never, params: { view: 'list' } })} testID="home-outings-list-btn" />
            <Button label={tr('out.openFull')} icon="map" size="sm" variant="ghost" onPress={() => router.push('/outings' as never)} testID="home-nearby" />
          </Row>
        ) : null}
      </LinearGradient>
      <PlaceSheet place={open} distance={open && center ? distanceM(center, open) : null} onClose={() => setOpen(null)} />
    </View>
  );
}
