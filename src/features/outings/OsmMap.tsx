/**
 * Carte gratuite (iOS, Android et web) : tuiles OpenStreetMap assemblées en mosaïque, déplacement au doigt ou à la
 * souris, zoom +/−, recentrage, repères illustrés par type de lieu. Aucune clé, aucun service payant. Mention
 * « © contributeurs OpenStreetMap » exigée par la licence, toujours visible et cliquable.
 * Tant que les tuiles chargent, un fond doux est visible ; si elles ne chargent pas, les repères et la liste restent.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Linking, PanResponder, View } from 'react-native';
import { Icon, IconButton, Text } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { lat2y, lon2x } from '@/lib/domain/nearby';
import { OSM_CONFIG } from '@/lib/domain/osmPlaces';
import { CATEGORY_ICON, CATEGORY_TINT, type FamilyPlace } from '@/lib/domain/familyPlaces';
import { t as tr } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

const TILE = 256;
const MIN_Z = 11, MAX_Z = 18;
const x2lon = (x: number, z: number) => (x / 2 ** z) * 360 - 180;
const y2lat = (y: number, z: number) => { const n = Math.PI - (2 * Math.PI * y) / 2 ** z; return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))); };
const tileUrl = (z: number, x: number, y: number) => OSM_CONFIG.tileUrl.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y));

/** Zoom le plus proche qui montre le centre et les lieux les plus proches (au moins le rayon de 500 m). */
export function fitZoom(center: { lat: number; lon: number }, places: { lat: number; lon: number }[], w: number, h: number): number {
  const pts = [center, ...places.slice(0, 10)];
  for (let z = 16; z > MIN_Z; z--) {
    const cx = lon2x(center.lon, z) * TILE, cy = lat2y(center.lat, z) * TILE;
    if (pts.every((p) => Math.abs(lon2x(p.lon, z) * TILE - cx) < w / 2 - 24 && Math.abs(lat2y(p.lat, z) * TILE - cy) < h / 2 - 30)) return z;
  }
  return MIN_Z;
}

export interface OsmMapProps {
  center: { lat: number; lon: number };
  places: FamilyPlace[];
  height?: number;
  onSelect: (p: FamilyPlace) => void;
  interactive?: boolean;
}

export function OsmMap({ center, places, height = 320, onSelect, interactive = true }: OsmMapProps) {
  const t = useTheme();
  const [w, setW] = useState(340);
  const fit = useMemo(() => fitZoom(center, places, w, height), [center, places, w, height]);
  const [zoom, setZoom] = useState<number | null>(null);
  const [view, setView] = useState<{ lat: number; lon: number } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const z = zoom ?? fit;
  const c = view ?? center;
  // Le centre suit la recherche (nouvelle ville) tant que la personne n'a pas déplacé la carte
  useEffect(() => { setView(null); setZoom(null); }, [center.lat, center.lon]);

  const cx = lon2x(c.lon, z) * TILE, cy = lat2y(c.lat, z) * TILE;
  const left = cx - w / 2, top = cy - height / 2;
  const point = (p: { lat: number; lon: number }) => ({ x: lon2x(p.lon, z) * TILE - left, y: lat2y(p.lat, z) * TILE - top });
  const tiles: { key: string; url: string; left: number; top: number }[] = [];
  const max = 2 ** z;
  for (let tx = Math.floor(left / TILE); tx <= Math.floor((left + w) / TILE); tx++) {
    for (let ty = Math.floor(top / TILE); ty <= Math.floor((top + height) / TILE); ty++) {
      if (ty < 0 || ty >= max) continue;
      const wx = ((tx % max) + max) % max;
      tiles.push({ key: `${z}/${wx}/${ty}`, url: tileUrl(z, wx, ty), left: tx * TILE - left, top: ty * TILE - top });
    }
  }

  const drag = useRef<{ x: number; y: number } | null>(null);
  const state = useRef({ cx, cy, z });
  state.current = { cx, cy, z };
  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_e, g) => interactive && Math.abs(g.dx) + Math.abs(g.dy) > 6,
    onMoveShouldSetPanResponderCapture: (_e, g) => interactive && Math.abs(g.dx) + Math.abs(g.dy) > 6,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: () => { drag.current = { x: state.current.cx, y: state.current.cy }; },
    onPanResponderMove: (_e, g) => {
      if (!drag.current) return;
      const { z: zz } = state.current;
      setView({ lat: y2lat((drag.current.y - g.dy) / TILE, zz), lon: x2lon((drag.current.x - g.dx) / TILE, zz) });
    },
    onPanResponderRelease: () => { drag.current = null; },
  }), [interactive]);

  const me = point(center);
  const moved = !!view || zoom != null;
  return (
    <View onLayout={(e) => setW(Math.max(200, Math.round(e.nativeEvent.layout.width)))} testID="out-map" accessibilityLabel={tr('out.mapA11y')}
      style={{ height, borderRadius: 24, overflow: 'hidden', backgroundColor: t.isDark ? '#2A2440' : '#F4EEE6', borderWidth: 1, borderColor: t.colors.border }}
      {...pan.panHandlers}>
      {tiles.map((tile) => (
        <Image key={tile.key} source={{ uri: tile.url }} accessibilityIgnoresInvertColors testID="out-map-tile"
          style={{ position: 'absolute', left: tile.left, top: tile.top, width: TILE, height: TILE, opacity: t.isDark ? 0.62 : 0.9 }} />
      ))}
      {/* voile doux pour adoucir les couleurs du fond de carte */}
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: t.isDark ? 'rgba(35,30,54,0.25)' : 'rgba(255,247,238,0.18)' }} />
      <View pointerEvents="none" style={{ position: 'absolute', left: me.x - 7, top: me.y - 7, width: 14, height: 14, borderRadius: 7, borderWidth: 3, borderColor: '#FFFFFF', backgroundColor: '#7A5FB8' }} />
      {places.map((p) => {
        const pt = point(p);
        if (pt.x < -16 || pt.y < -4 || pt.x > w + 16 || pt.y > height + 36) return null;
        const on = selected === p.id;
        return (
          <Tappable key={p.id} accessibilityRole="button" accessibilityLabel={p.name} onPress={() => { setSelected(p.id); onSelect(p); }} testID={`out-marker-${p.id}`}
            style={{ position: 'absolute', left: pt.x - 18, top: pt.y - 38, width: 36, height: 42, alignItems: 'center', zIndex: on ? 2 : 1 }}>
            <View style={{ width: on ? 34 : 30, height: on ? 34 : 30, borderRadius: 17, backgroundColor: CATEGORY_TINT[p.category], alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 3 }}>
              <Icon name={CATEGORY_ICON[p.category] as never} size={on ? 16 : 14} color="#FFFFFF" />
            </View>
            <View style={{ width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 7, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: CATEGORY_TINT[p.category] }} />
          </Tappable>
        );
      })}
      {interactive ? (
        <View style={{ position: 'absolute', right: 8, top: 8, gap: 6 }}>
          <IconButton icon="plus" label={tr('nb.zoomIn')} tone="filled" onPress={() => setZoom(Math.min(MAX_Z, z + 1))} />
          <IconButton icon="minus" label={tr('nb.zoomOut')} tone="filled" onPress={() => setZoom(Math.max(MIN_Z, z - 1))} />
          {moved ? <IconButton icon="crosshair" label={tr('out.recenter')} tone="filled" onPress={() => { setView(null); setZoom(null); }} /> : null}
        </View>
      ) : null}
      <Tappable bare accessibilityRole="link" onPress={() => void Linking.openURL(OSM_CONFIG.attributionUrl)} testID="out-osm-attribution"
        style={{ position: 'absolute', right: 0, bottom: 0, paddingHorizontal: 6, paddingVertical: 2, borderTopLeftRadius: 8, backgroundColor: 'rgba(255,255,255,0.88)' }}>
        <Text variant="caption" color="#333">{OSM_CONFIG.attribution}</Text>
      </Tappable>
    </View>
  );
}
