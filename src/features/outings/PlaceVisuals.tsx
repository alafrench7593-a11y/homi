/**
 * « Sorties près de chez moi » : illustration par type de lieu (jamais présentée comme une photo), photo Google avec
 * le nom de son auteur (ou photo libre Wikimedia Commons pour les lieux OpenStreetMap), mention de la source,
 * carte de lieu et fiche simple.
 */
import React, { useState } from 'react';
import { Image, Linking, Platform, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Rect, Stop } from 'react-native-svg';
import { GlassSurface } from '@/components/Glass';
import { Sheet } from '@/components/Overlays';
import { Button, Icon, Row, Text } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { useCommonsPhoto, useGooglePhoto } from '@/lib/data/hooks-outings';
import { OSM_CONFIG } from '@/lib/domain/osmPlaces';
import { approxDistance, directionsUrl } from '@/lib/domain/nearby';
import { CATEGORY_ICON, CATEGORY_TINT, isOsm, kidsInfo, type FamilyCategory, type FamilyPlace } from '@/lib/domain/familyPlaces';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

export const catLabel = (c: FamilyCategory) => tr(`out.cat.${c}` as TKey);
const GOOGLE_MAPS = 'Google Maps';
const longDate = (iso: string) => formatDate(`${iso.slice(0, 10)}T12:00:00`, { day: 'numeric', month: 'long', year: 'numeric' });

/** Illustration douce du type de lieu, annoncée comme illustration aux lecteurs d'écran. */
export function PlaceArt({ category, height = 120 }: { category: FamilyCategory; height?: number }) {
  const t = useTheme();
  const tint = CATEGORY_TINT[category];
  const id = `g-${category}`;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={tr('out.illustration')} style={{ height, borderRadius: 18, overflow: 'hidden' }} testID={`out-art-${category}`}>
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
      </Svg>
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: t.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.78)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={CATEGORY_ICON[category] as never} size={24} color={tint} />
        </View>
      </View>
    </View>
  );
}

/** Mention « Google Maps » exigée par Google à côté de ses contenus (jamais traduite). */
export function GoogleMapsMark() {
  const t = useTheme();
  return <Text accessibilityLabel={GOOGLE_MAPS} style={{ fontFamily: Platform.OS === 'web' ? 'Roboto, Arial, sans-serif' : undefined, fontWeight: '400', fontSize: 12, color: t.isDark ? '#E3E3E3' : '#5E5E5E' }} testID="out-google-mark">{GOOGLE_MAPS}</Text>;
}

/** Mention de la source à côté du contenu : « Google Maps » ou « © contributeurs OpenStreetMap ». */
export function SourceMark({ place }: { place: Pick<FamilyPlace, 'source'> }) {
  const t = useTheme();
  if (!isOsm(place)) return <GoogleMapsMark />;
  return (
    <Tappable accessibilityRole="link" onPress={() => void Linking.openURL(OSM_CONFIG.attributionUrl)} testID="out-osm-mark">
      <Text style={{ fontSize: 12, color: t.isDark ? '#E3E3E3' : '#5E5E5E' }}>{OSM_CONFIG.attribution}</Text>
    </Tappable>
  );
}

/** Photo libre Wikimedia Commons (auteur et licence) d'un lieu OpenStreetMap ; sinon l'illustration. */
function CommonsPhoto({ place, height }: { place: FamilyPlace; height: number }) {
  const t = useTheme();
  const q = useCommonsPhoto(place.commons ?? null);
  const [failed, setFailed] = useState(false);
  if (!q.data || failed) return <PlaceArt category={place.category} height={height} />;
  const c = q.data;
  return (
    <View testID={`out-photo-${place.id}`}>
      <Image source={{ uri: c.url }} onError={() => setFailed(true)} accessibilityLabel={place.name} style={{ height, borderRadius: 18, backgroundColor: t.colors.surfaceAlt }} resizeMode="cover" />
      <Tappable accessibilityRole="link" onPress={() => void Linking.openURL(c.pageUrl)} style={{ paddingTop: 2 }} testID="out-photo-credit">
        <Text variant="caption" muted numberOfLines={2}>{tr('out.photoCommons', { author: c.author, license: c.license })}</Text>
      </Tappable>
    </View>
  );
}

/** Photo du lieu avec son auteur (Google, ou Wikimedia Commons pour OpenStreetMap) ; sinon l'illustration du type de lieu. */
export function PlacePhoto({ place, height = 120 }: { place: FamilyPlace; height?: number }) {
  if (isOsm(place)) return <CommonsPhoto place={place} height={height} />;
  return <GooglePhoto place={place} height={height} />;
}

function GooglePhoto({ place, height }: { place: FamilyPlace; height: number }) {
  const t = useTheme();
  const q = useGooglePhoto(place.photo?.name ?? null);
  const [failed, setFailed] = useState(false);
  if (!q.data || failed) return <PlaceArt category={place.category} height={height} />;
  const author = place.photo?.attributions.map((a) => a.displayName).join(', ');
  const url = place.photo?.attributions[0]?.uri ?? null;
  return (
    <View testID={`out-photo-${place.id}`}>
      <Image source={{ uri: q.data }} onError={() => setFailed(true)} accessibilityLabel={place.name} style={{ height, borderRadius: 18, backgroundColor: t.colors.surfaceAlt }} resizeMode="cover" />
      {author ? (
        <Tappable accessibilityRole="link" disabled={!url} onPress={() => url && void Linking.openURL(url)} style={{ paddingTop: 2 }} testID="out-photo-credit">
          <Text variant="caption" muted numberOfLines={1}>{tr('out.photoBy', { author })}</Text>
        </Tappable>
      ) : null}
    </View>
  );
}

export function PlaceCard({ p, onPress }: { p: FamilyPlace & { distance: number }; onPress: () => void }) {
  const t = useTheme();
  const type = p.typeLabel ?? catLabel(p.category);
  return (
    <Tappable accessibilityRole="button" onPress={onPress} testID={`out-place-${p.id}`} accessibilityLabel={`${p.name}, ${type}, ${approxDistance(p.distance)}`}>
      <GlassSurface fill={t.isDark ? 'rgba(40,32,70,0.5)' : 'rgba(255,255,255,0.68)'} depth={1} radius={22} padded={spacing.sm + 2}>
        <View style={{ gap: spacing.xs }}>
          <PlacePhoto place={p} height={120} />
          <Text weight="bold" numberOfLines={2}>{p.name}</Text>
          <Text variant="caption" muted numberOfLines={2}>{`${type} · ${approxDistance(p.distance)}`}</Text>
          {p.address ? <Text variant="caption" muted numberOfLines={2}>{p.address}</Text> : null}
          <SourceMark place={p} />
        </View>
      </GlassSurface>
    </Tappable>
  );
}

function Info({ icon, text, testID }: { icon: string; text: string; testID?: string }) {
  const t = useTheme();
  return <Row style={{ alignItems: 'flex-start' }} testID={testID}><Icon name={icon as never} size={16} color={t.colors.textMuted} /><Text variant="small" style={{ flex: 1 }}>{text}</Text></Row>;
}

/** Fiche simple d'un lieu : nom, type, photo, adresse, distance approximative, horaires, itinéraire. */
export function PlaceSheet({ place, distance, onClose }: { place: FamilyPlace | null; distance: number | null; onClose: () => void }) {
  const t = useTheme();
  if (!place) return <Sheet visible={false} onClose={onClose} title=""><View /></Sheet>;
  const p = place;
  const kids = kidsInfo(p);
  const osm = isOsm(p);
  return (
    <Sheet visible onClose={onClose} title={p.name}>
      <View style={{ gap: spacing.sm }} testID="out-sheet">
        <PlacePhoto place={p} height={180} />
        <Text variant="small" muted>{[p.typeLabel ?? catLabel(p.category), distance != null ? approxDistance(distance) : null].filter(Boolean).join(' · ')}</Text>
        <Info icon="map-pin" text={p.address ?? tr('out.addressNone')} />
        {p.hours.length ? (
          <View style={{ gap: 2 }} testID="out-hours">
            <Info icon="clock" text={tr('out.hours')} />
            {p.hours.map((l) => <Text key={l} variant="caption" muted style={{ marginLeft: 24 }}>{l}</Text>)}
          </View>
        ) : <Info icon="clock" text={tr('out.hoursNone')} testID="out-hours-none" />}
        <Info icon="smile" text={tr(`out.kids.${kids === 'yes' && osm ? 'yesOsm' : kids}` as TKey)} testID="out-kids" />
        {p.phone ? <Info icon="phone" text={p.phone} /> : null}
        <Row wrap>
          <Button label={tr('out.directions')} icon="navigation" size="sm" onPress={() => void Linking.openURL(directionsUrl(p, Platform.OS))} testID="out-directions" />
          {p.mapsUri ? <Button label={tr(osm ? 'out.openOsm' : 'out.openGoogle')} icon="external-link" size="sm" variant="secondary" onPress={() => void Linking.openURL(p.mapsUri!)} testID={osm ? 'out-open-osm' : 'out-open-google'} /> : null}
          {p.phone ? <Button label={tr('out.call')} icon="phone" size="sm" variant="ghost" onPress={() => void Linking.openURL(`tel:${p.phone!.replace(/\s/g, '')}`)} /> : null}
          {p.website ? <Button label={tr('out.website')} icon="globe" size="sm" variant="ghost" onPress={() => void Linking.openURL(p.website!)} /> : null}
        </Row>
        <Text variant="caption" muted testID="out-source">{tr(osm ? 'out.sourceOsm' : 'out.source', { date: longDate(p.fetchedOn) })}</Text>
        <SourceMark place={p} />
        <Text variant="caption" color={t.colors.textMuted}>{tr(osm ? 'out.notVerifiedOsm' : 'out.notVerified')}</Text>
      </View>
    </Sheet>
  );
}

/** Carte non disponible (clé de carte absente ou erreur) : état doux, jamais de fausse carte. */
export function MapUnavailable({ height = 220 }: { height?: number }) {
  const t = useTheme();
  return (
    <View style={{ height, borderRadius: 24, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', padding: spacing.md, backgroundColor: t.isDark ? '#2A2440' : '#F6EFE6', borderWidth: 1, borderColor: t.colors.border, gap: 6 }} testID="out-map-unavailable">
      <Icon name="map" size={26} color={t.colors.lavender} />
      <Text weight="bold" center>{tr('out.mapUnavailable')}</Text>
      <Text variant="caption" muted center>{tr('out.mapUnavailableBody')}</Text>
    </View>
  );
}

/** Ligne compacte (sous la carte, accueil). */
export function MiniRow({ p, onPress }: { p: FamilyPlace & { distance: number }; onPress: () => void }) {
  const t = useTheme();
  return (
    <Tappable accessibilityRole="button" onPress={onPress} testID={`out-place-${p.id}`} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48 }}>
      <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: `${CATEGORY_TINT[p.category]}22`, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={CATEGORY_ICON[p.category] as never} size={16} color={CATEGORY_TINT[p.category]} />
      </View>
      <View style={{ flex: 1 }}>
        <Text weight="bold" numberOfLines={1}>{p.name}</Text>
        <Text variant="caption" muted numberOfLines={1}>{`${p.typeLabel ?? catLabel(p.category)} · ${approxDistance(p.distance)}`}</Text>
      </View>
      <Icon name="chevron-right" size={16} color={t.colors.textMuted} />
    </Tappable>
  );
}

