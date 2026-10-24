/**
 * Éléments visuels de « Sorties & rencontres » : illustration par type de lieu (jamais présentée comme une photo),
 * photo autorisée avec ses crédits (Google Maps ou Wikimedia Commons), carte OpenStreetMap à tuiles, fiches.
 */
import React, { useState } from 'react';
import { Image, Linking, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Rect, Stop } from 'react-native-svg';
import { GlassSurface } from '@/components/Glass';
import { Icon, IconButton, Row, Text } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { useCommonsPhoto, useGooglePhoto } from '@/lib/data/hooks-outings';
import { approxDistance, mapView, NEARBY_CONFIG } from '@/lib/domain/nearby';
import { CATEGORY_ICON, placesLeft, type Meetup, type OutingCategory, type OutingPlace } from '@/lib/domain/outings';
import { formatDate, formatTime, t as tr, type TKey } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

export const CATEGORY_TINT: Record<OutingCategory, string> = {
  parks: '#5E9E3A', family_food: '#C9822B', mum_baby: '#D9617A', workshops: '#C45FA0', culture: '#7A5FB8', laep: '#E07A5F',
  parents_groups: '#B4507A', mum_meetups: '#E5527A', pregnancy: '#9C6BD1', big_families: '#3E8E8A', support: '#3E7FA6',
};
export const catLabel = (c: OutingCategory) => tr(`out.cat.${c}` as TKey);
export const placeName = (p: Pick<OutingPlace, 'name'>) => p.name || tr('out.playground');
export const sourceLabel = (p: Pick<OutingPlace, 'source'>) => tr(`out.src.${p.source}` as TKey);
export const longDate = (iso: string) => formatDate(`${iso.slice(0, 10)}T12:00:00`, { day: 'numeric', month: 'long', year: 'numeric' });

/** Illustration douce du type de lieu (formes et pictogramme), annoncée comme illustration aux lecteurs d'écran. */
export function OutingArt({ category, height = 120, radius = 18 }: { category: OutingCategory; height?: number; radius?: number }) {
  const t = useTheme();
  const tint = CATEGORY_TINT[category];
  const id = `g-${category}`;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={tr('out.illustration')} style={{ height, borderRadius: radius, overflow: 'hidden' }} testID={`out-art-${category}`}>
      <Svg width="100%" height="100%" viewBox="0 0 320 120" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <SvgGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={tint} stopOpacity={t.isDark ? 0.42 : 0.26} />
            <Stop offset="1" stopColor={t.isDark ? '#2A2440' : '#FFF7EE'} stopOpacity={1} />
          </SvgGradient>
        </Defs>
        <Rect x="0" y="0" width="320" height="120" fill={`url(#${id})`} />
        <Circle cx="268" cy="22" r="46" fill={tint} opacity={0.14} />
        <Circle cx="40" cy="110" r="60" fill={tint} opacity={0.1} />
        <Path d="M0 92 C 60 70, 110 108, 170 88 S 270 70, 320 90 L320 120 L0 120 Z" fill={tint} opacity={0.16} />
        <Path d="M0 104 C 70 92, 140 118, 210 100 S 290 96, 320 104 L320 120 L0 120 Z" fill={tint} opacity={0.12} />
      </Svg>
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: t.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.75)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={CATEGORY_ICON[category] as never} size={26} color={tint} />
        </View>
      </View>
    </View>
  );
}

/** Photo autorisée du lieu, avec ses crédits ; sinon l'illustration du type de lieu. */
export function PlacePhoto({ place, height = 120 }: { place: OutingPlace; height?: number }) {
  const t = useTheme();
  const g = useGooglePhoto(place.photo?.kind === 'google' ? place.photo.ref : null);
  const c = useCommonsPhoto(place.photo?.kind === 'commons' ? place.photo.ref : null);
  const [failed, setFailed] = useState(false);
  const uri = place.photo?.kind === 'google' ? g.data : place.photo?.kind === 'commons' ? c.data?.url : null;
  if (!uri || failed) return <OutingArt category={place.category} height={height} />;
  const credit = place.photo?.kind === 'google'
    ? place.photo.credits.map((a) => a.name).join(', ')
    : c.data ? tr('out.photoCommons', { author: c.data.author, license: c.data.license }) : '';
  const creditUrl = place.photo?.kind === 'google' ? place.photo.credits[0]?.url ?? null : c.data?.pageUrl ?? null;
  return (
    <View testID={`out-photo-${place.id}`}>
      <Image source={{ uri }} onError={() => setFailed(true)} accessibilityLabel={placeName(place)} style={{ height, borderRadius: 18, backgroundColor: t.colors.surfaceAlt }} resizeMode="cover" />
      {credit ? (
        <Tappable accessibilityRole="link" disabled={!creditUrl} onPress={() => creditUrl && void Linking.openURL(creditUrl)} style={{ paddingTop: 2 }} testID="out-photo-credit">
          <Text variant="caption" muted numberOfLines={2}>{place.photo?.kind === 'google' ? tr('out.photoGoogle', { author: credit }) : credit}</Text>
        </Tappable>
      ) : null}
    </View>
  );
}

/** Mention « Google Maps » exigée par Google, à côté du contenu (jamais traduite). */
const GOOGLE_MAPS = 'Google Maps';
export function GoogleMapsMark() {
  const t = useTheme();
  return <Text accessibilityLabel={GOOGLE_MAPS} style={{ fontFamily: 'Roboto', fontWeight: '400', fontSize: 12, color: t.isDark ? '#E3E3E3' : '#5E5E5E' }} testID="out-google-mark">{GOOGLE_MAPS}</Text>;
}

export function SourceBadge({ place }: { place: OutingPlace }) {
  const t = useTheme();
  if (place.source === 'google') return <GoogleMapsMark />;
  const member = place.source === 'member';
  return (
    <View style={{ alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: member ? `${t.colors.lavender}33` : t.colors.surfaceAlt }} testID={`out-src-${place.source}`}>
      <Text variant="caption" weight="medium">{sourceLabel(place)}</Text>
    </View>
  );
}

export function PlaceCard({ p, dist, fav, onPress }: { p: OutingPlace; dist: number | null; fav: boolean; onPress: () => void }) {
  const t = useTheme();
  const d = dist != null ? approxDistance(dist) : null;
  return (
    <Tappable accessibilityRole="button" onPress={onPress} testID={`out-place-${p.id}`}
      accessibilityLabel={[placeName(p), catLabel(p.category), d, sourceLabel(p)].filter(Boolean).join(', ')}>
      <GlassSurface fill={t.isDark ? 'rgba(40,32,70,0.5)' : 'rgba(255,255,255,0.66)'} depth={1} radius={22} padded={spacing.sm + 2}>
        <View style={{ gap: spacing.xs }}>
          <PlacePhoto place={p} height={110} />
          <Row style={{ alignItems: 'flex-start' }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text weight="bold" numberOfLines={2}>{placeName(p)}</Text>
              <Text variant="caption" muted numberOfLines={2}>{[p.typeLabel ?? catLabel(p.category), d].filter(Boolean).join(' · ')}</Text>
              {p.address ? <Text variant="caption" muted numberOfLines={2}>{p.address}</Text> : null}
            </View>
            {fav ? <Icon name="heart" size={16} color="#E5525F" /> : null}
          </Row>
          <SourceBadge place={p} />
        </View>
      </GlassSurface>
    </Tappable>
  );
}

/** Carte simple à tuiles OpenStreetMap ; seuls les lieux OpenStreetMap et les lieux proposés validés y figurent. */
export function OutingMap({ center, places, onOpen }: { center: { lat: number; lon: number }; places: OutingPlace[]; onOpen: (p: OutingPlace) => void }) {
  const t = useTheme();
  const [z, setZ] = useState(14);
  const [w, setW] = useState(340);
  const h = 280;
  const v = mapView(center, z, w, h);
  const onMap = places.filter((p) => p.source !== 'google');
  return (
    <View onLayout={(e) => setW(Math.round(e.nativeEvent.layout.width))} testID="out-map" accessibilityLabel={tr('nb.mapA11y')}
      style={{ height: h, borderRadius: 24, overflow: 'hidden', backgroundColor: t.isDark ? '#2A2440' : '#F3EEE6', borderWidth: 1, borderColor: t.colors.border }}>
      {v.tiles.map((tile) => <Image key={tile.key} source={{ uri: tile.url }} style={{ position: 'absolute', left: tile.left, top: tile.top, width: 256, height: 256, opacity: t.isDark ? 0.75 : 0.92 }} accessibilityIgnoresInvertColors />)}
      <View pointerEvents="none" style={{ position: 'absolute', left: v.point(center).x - 7, top: v.point(center).y - 7, width: 14, height: 14, borderRadius: 7, borderWidth: 3, borderColor: '#FFFFFF', backgroundColor: '#7A5FB8' }} />
      {onMap.map((p) => { const pt = v.point(p); if (pt.x < -10 || pt.y < -10 || pt.x > w + 10 || pt.y > h + 10) return null; return (
        <Tappable key={p.id} accessibilityRole="button" accessibilityLabel={placeName(p)} onPress={() => onOpen(p)} testID={`out-marker-${p.id}`}
          style={{ position: 'absolute', left: pt.x - 16, top: pt.y - 32, width: 32, height: 36, alignItems: 'center' }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: CATEGORY_TINT[p.category], alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: p.source === 'member' ? '#FFE08A' : '#FFFFFF' }}>
            <Icon name={CATEGORY_ICON[p.category] as never} size={14} color="#FFFFFF" />
          </View>
        </Tappable>
      ); })}
      <View style={{ position: 'absolute', right: 8, top: 8, gap: 6 }}>
        <IconButton icon="plus" label={tr('nb.zoomIn')} tone="filled" onPress={() => setZ(Math.min(17, z + 1))} />
        <IconButton icon="minus" label={tr('nb.zoomOut')} tone="filled" onPress={() => setZ(Math.max(11, z - 1))} />
      </View>
      <Tappable accessibilityRole="link" onPress={() => void Linking.openURL(NEARBY_CONFIG.attributionUrl)} style={{ position: 'absolute', right: 0, bottom: 0, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: 'rgba(255,255,255,0.85)' }}>
        <Text variant="caption" color="#333">{NEARBY_CONFIG.attribution}</Text>
      </Tappable>
    </View>
  );
}

export const meetupAges = (m: Pick<Meetup, 'child_age_min' | 'child_age_max'>) =>
  m.child_age_max === 0 ? tr('mt.agesBaby') : tr('mt.ages', { min: m.child_age_min, max: m.child_age_max });
export const meetupWhen = (iso: string) => tr('mt.when', { date: formatDate(iso, { weekday: 'long', day: 'numeric', month: 'long' }), time: formatTime(iso) });

export function MeetupCard({ m, organizer, mine, joined, onPress }: { m: Meetup; organizer: string | null; mine: boolean; joined: boolean; onPress: () => void }) {
  const t = useTheme();
  const left = placesLeft(m);
  const status = m.status === 'cancelled' ? tr('mt.cancelled') : m.status === 'pending_review' ? tr('mt.pending') : m.status === 'removed' ? tr('mt.removed') : null;
  return (
    <Tappable accessibilityRole="button" onPress={onPress} testID={`mt-card-${m.id}`} accessibilityLabel={`${m.title}, ${meetupWhen(m.starts_at)}, ${m.place_name}, ${tr('mt.left', { count: left })}`}>
      <GlassSurface fill={t.isDark ? 'rgba(40,32,70,0.5)' : 'rgba(255,255,255,0.66)'} depth={1} radius={22} padded={spacing.md}>
        <View style={{ gap: 4, opacity: m.status === 'cancelled' ? 0.6 : 1 }}>
          <Row style={{ alignItems: 'center' }}>
            <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: `${CATEGORY_TINT.mum_meetups}22`, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={m.for_pregnant ? 'gift' : 'smile'} size={18} color={CATEGORY_TINT[m.for_pregnant ? 'pregnancy' : 'mum_meetups']} />
            </View>
            <View style={{ flex: 1 }}>
              <Text weight="bold" numberOfLines={2}>{m.title}</Text>
              <Text variant="caption" muted>{meetupWhen(m.starts_at)}</Text>
            </View>
          </Row>
          <Row style={{ alignItems: 'center' }}><Icon name="map-pin" size={14} color={t.colors.textMuted} /><Text variant="small" style={{ flex: 1 }} numberOfLines={2}>{m.place_name}{m.city_label ? ` · ${m.city_label}` : ''}</Text></Row>
          <Text variant="caption" muted>{[meetupAges(m), m.for_pregnant ? tr('mt.pregnant') : null, tr('mt.left', { count: left })].filter(Boolean).join(' · ')}</Text>
          <Text variant="caption" muted>{mine ? tr('mt.byYou') : organizer ? tr('mt.by', { name: organizer }) : ''}{joined && !mine ? ` · ${tr('mt.joined')}` : ''}</Text>
          {status ? <Text variant="caption" weight="bold" color={m.status === 'pending_review' ? t.colors.lavender : t.colors.textMuted} testID={`mt-status-${m.id}`}>{status}</Text> : null}
        </View>
      </GlassSurface>
    </Tappable>
  );
}
