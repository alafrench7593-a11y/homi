/**
 * Carte des lieux (web) : Maps JavaScript API de Google, chargée avec une clé de navigateur restreinte au site
 * (EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY, publique par conception chez Google ; la clé Places reste sur le serveur).
 * Style doux, repères illustrés. Sans clé ou si le chargement échoue : état « carte indisponible ».
 */
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { mapsConfigured, placesProvider } from '@/lib/data/hooks-outings';
import { OsmMap } from './OsmMap';
import { CATEGORY_TINT, regionFor, SOFT_MAP_STYLE, type FamilyPlace } from '@/lib/domain/familyPlaces';
import { t as tr } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { MapUnavailable } from './PlaceVisuals';
import type { FamilyMapProps } from './FamilyMap';

type G = any; // eslint-disable-line @typescript-eslint/no-explicit-any
let loading: Promise<G> | null = null;
function loadGoogleMaps(key: string): Promise<G> {
  const w = window as unknown as { google?: G; __toietmoiMaps?: () => void };
  if (w.google?.maps) return Promise.resolve(w.google);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    w.__toietmoiMaps = () => resolve(w.google);
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&loading=async&callback=__toietmoiMaps&language=fr&region=FR`;
    s.async = true;
    s.onerror = () => { loading = null; reject(new Error('maps_load')); };
    document.head.appendChild(s);
    setTimeout(() => reject(new Error('maps_timeout')), 15000);
  });
  return loading;
}

const pin = (color: string) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34"><circle cx="17" cy="17" r="14" fill="${color}" stroke="#fff" stroke-width="3"/><circle cx="17" cy="17" r="4.5" fill="#fff"/></svg>`)}`;

export function FamilyMap(props: FamilyMapProps) {
  if (placesProvider() === 'osm') return <OsmMap {...props} />;
  return <GoogleFamilyMap {...props} />;
}

function GoogleFamilyMap({ center, places, radius, height = 320, onSelect, interactive = true }: FamilyMapProps) {
  const t = useTheme();
  const ref = useRef<View>(null);
  const map = useRef<G>(null);
  const markers = useRef<G[]>([]);
  const [failed, setFailed] = useState(false);
  const ok = mapsConfigured();
  const select = useRef(onSelect);
  select.current = onSelect;

  useEffect(() => {
    if (!ok) return;
    let alive = true;
    loadGoogleMaps(process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY!).then((google) => {
      if (!alive || !ref.current) return;
      const r = regionFor(center, places.slice(0, 12), Math.min(radius, 3000));
      if (!map.current) {
        map.current = new google.maps.Map(ref.current as unknown as HTMLElement, {
          center: { lat: r.latitude, lng: r.longitude }, zoom: 14, styles: SOFT_MAP_STYLE, disableDefaultUI: true, zoomControl: interactive,
          gestureHandling: interactive ? 'greedy' : 'none', clickableIcons: false,
        });
        new google.maps.Circle({ map: map.current, center: { lat: center.lat, lng: center.lon }, radius: 500, fillColor: '#7A5FB8', fillOpacity: 0.1, strokeColor: '#7A5FB8', strokeOpacity: 0.35, strokeWeight: 1 });
      }
      markers.current.forEach((m) => m.setMap(null));
      markers.current = places.map((p: FamilyPlace) => {
        const m = new google.maps.Marker({ map: map.current, position: { lat: p.lat, lng: p.lon }, title: p.name, icon: { url: pin(CATEGORY_TINT[p.category]), scaledSize: new google.maps.Size(30, 30) } });
        m.addListener('click', () => select.current(p));
        return m;
      });
      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: center.lat, lng: center.lon });
      places.slice(0, 12).forEach((p) => bounds.extend({ lat: p.lat, lng: p.lon }));
      if (places.length) map.current.fitBounds(bounds, 40); else map.current.setCenter({ lat: center.lat, lng: center.lon });
    }).catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, [ok, center.lat, center.lon, places, radius, interactive]);

  if (!ok || failed) return <MapUnavailable height={height} />;
  return <View ref={ref} testID="out-map" accessibilityLabel={tr('out.mapA11y')} style={{ height, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: t.colors.border, backgroundColor: '#F7F1EA' }} />;
}
