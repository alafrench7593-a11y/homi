/**
 * Carte des lieux (iOS / Android) : fond de carte Google (react-native-maps, PROVIDER_GOOGLE), style doux, repères
 * illustrés par type de lieu. Les lieux Google Places ne sont montrés que sur un fond de carte Google (conditions de
 * Google). Sans clé de carte configurée : état « carte indisponible », jamais de fausse carte.
 */
import React from 'react';
import { View } from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Icon } from '@/components/ui';
import { mapsConfigured, placesProvider } from '@/lib/data/hooks-outings';
import { OsmMap } from './OsmMap';
import { CATEGORY_ICON, CATEGORY_TINT, regionFor, SOFT_MAP_STYLE, type FamilyPlace } from '@/lib/domain/familyPlaces';
import { t as tr } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { MapUnavailable } from './PlaceVisuals';

export interface FamilyMapProps {
  center: { lat: number; lon: number };
  places: FamilyPlace[];
  radius: number;
  height?: number;
  onSelect: (p: FamilyPlace) => void;
  interactive?: boolean;
}

export function FamilyMap(props: FamilyMapProps) {
  // Solution gratuite pour le moment : fond OpenStreetMap ; Google seulement si ses clés sont configurées et choisies
  if (placesProvider() === 'osm') return <OsmMap {...props} />;
  return <GoogleFamilyMap {...props} />;
}

function GoogleFamilyMap({ center, places, radius, height = 320, onSelect, interactive = true }: FamilyMapProps) {
  const t = useTheme();
  if (!mapsConfigured()) return <MapUnavailable height={height} />;
  const region = regionFor(center, places.slice(0, 12), Math.min(radius, 3000));
  return (
    <View style={{ height, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: t.colors.border }} testID="out-map" accessibilityLabel={tr('out.mapA11y')}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        initialRegion={region}
        customMapStyle={SOFT_MAP_STYLE}
        showsUserLocation={false}
        showsPointsOfInterests={false}
        toolbarEnabled={false}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        <Circle center={{ latitude: center.lat, longitude: center.lon }} radius={500} fillColor="rgba(122,95,184,0.10)" strokeColor="rgba(122,95,184,0.35)" />
        {places.map((p) => (
          <Marker key={p.id} coordinate={{ latitude: p.lat, longitude: p.lon }} title={p.name} onPress={() => onSelect(p)} tracksViewChanges={false} testID={`out-marker-${p.id}`}>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: CATEGORY_TINT[p.category], alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' }}>
              <Icon name={CATEGORY_ICON[p.category] as never} size={15} color="#FFFFFF" />
            </View>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}
