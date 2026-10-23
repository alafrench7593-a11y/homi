/**
 * « Près de chez moi » : lieux publics et organismes accueillants pour les familles.
 * Pas de messagerie, pas de rendez-vous entre membres, aucune position de membre affichée ni enregistrée :
 * la recherche part d'une ville ou d'un code postal saisi, ou (facultatif) de la position du moment, arrondie à
 * environ 1 km et gardée seulement en mémoire. Carte simple avec la même liste accessible juste en dessous.
 * Aucun lieu fictif : données OpenStreetMap (non vérifiées par Toi & Moi, date de récupération affichée) et
 * annuaires officiels ; chaque lieu peut être signalé s'il est incorrect.
 */
import React, { useMemo, useState } from 'react';
import { Image, Linking, Platform, ScrollView, View } from 'react-native';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/Screen';
import { Skeleton } from '@/components/States';
import { GlassSurface } from '@/components/Glass';
import { Sheet, useToast } from '@/components/Overlays';
import { Banner, Button, Chip, Field, Icon, IconButton, Row, SectionTitle, Text, haptic } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useNearbyPlaces, usePlaceFavorites, useReportPlace, useTogglePlaceFavorite, useTownSearch, type PlaceFavorite, type ReportReason } from '@/lib/data/hooks-discoveries';
import {
  approxDistance, coarse, DIRECTORIES, directionsUrl, directoryUrl, distanceM, hasEquipment, mapView, NEARBY_CONFIG, OSM_KINDS, PLACE_KINDS, suitsAge, validTownQuery, widerRadius,
  type Directory, type Equipment, type Place, type PlaceKind,
} from '@/lib/domain/nearby';
import { useUiStore } from '@/lib/store';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

const REASONS: ReportReason[] = ['closed', 'hours', 'address', 'contact', 'accessibility', 'not_family', 'other'];
const KIND_ICON: Record<PlaceKind, string> = { park: 'sun', library: 'book-open', family_cafe: 'coffee', parents_assoc: 'users', social_centre: 'home', parent_child: 'heart', breastfeeding: 'droplet', isolated_support: 'phone', public_service: 'flag' };
const KIND_TINT: Record<PlaceKind, string> = { park: '#5E9E3A', library: '#7A5FB8', family_cafe: '#C9822B', parents_assoc: '#B4507A', social_centre: '#3E7FA6', parent_child: '#D9617A', breastfeeding: '#8C6BC9', isolated_support: '#B4507A', public_service: '#5A6B7D' };
const RADII = [1000, 2000, 5000, 10000];
const EQUIPMENTS: Equipment[] = ['changing_table', 'highchair', 'wheelchair'];
const AGES: { key: string; years: number }[] = [{ key: 'baby', years: 1 }, { key: 'small', years: 4 }, { key: 'school', years: 8 }];

export default function Nearby() {
  const t = useTheme();
  const toast = useToast();
  const town = useUiStore((s) => s.nearbyTown);
  const setTown = useUiStore((s) => s.setNearbyTown);
  const [q, setQ] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [here, setHere] = useState<{ lat: number; lon: number } | null>(null);
  const [kinds, setKinds] = useState<PlaceKind[]>(['park', 'library', 'family_cafe', 'social_centre', 'public_service']);
  const [radius, setRadius] = useState(2000);
  const [equip, setEquip] = useState<Equipment[]>([]);
  const [age, setAge] = useState<number | null>(null);
  const [view, setView] = useState<'map' | 'list'>('list');
  const [open, setOpen] = useState<Place | null>(null);
  const [locating, setLocating] = useState(false);
  const towns = useTownSearch(submitted);
  const center = here ?? (town ? { lat: town.lat, lon: town.lon } : null);
  const osmKinds = kinds.filter((k) => OSM_KINDS.includes(k));
  const placesQ = useNearbyPlaces(center, osmKinds, radius);
  const favs = usePlaceFavorites();
  const places = useMemo(() => (placesQ.data ?? []).filter((p) => kinds.includes(p.kind) && equip.every((e) => hasEquipment(p, e)) && suitsAge(p, age))
    .map((p) => ({ p, d: center ? distanceM(center, p) : 0 })).sort((a, b) => a.d - b.d), [placesQ.data, kinds, center, equip, age]);
  const directories = DIRECTORIES.filter((d) => kinds.includes(d.kind) || !OSM_KINDS.includes(d.kind));

  function search() {
    if (!validTownQuery(q)) return toast(tr('nb.invalidTown'), 'info');
    setHere(null);
    setSubmitted(q.trim());
  }
  async function useMyPosition() {
    setLocating(true);
    try {
      let pos: { lat: number; lon: number } | null = null;
      if (Platform.OS === 'web') {
        pos = await new Promise((res) => {
          if (!('geolocation' in navigator)) return res(null);
          navigator.geolocation.getCurrentPosition((g) => res({ lat: g.coords.latitude, lon: g.coords.longitude }), () => res(null), { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 });
        });
      } else {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.granted) { const g = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }); pos = { lat: g.coords.latitude, lon: g.coords.longitude }; }
      }
      if (!pos) return toast(tr('nb.locationRefused'), 'info');
      setHere(coarse(pos)); // arrondie à ~1 km, jamais enregistrée
    } finally { setLocating(false); }
  }

  return (
    <Screen back title={tr('nb.title')} subtitle={tr('nb.subtitle')}>
      <View testID="nearby" />
      <LinearGradient pointerEvents="none" colors={t.isDark ? ['rgba(255,214,190,0.05)', 'rgba(201,184,255,0.06)'] : ['#FFF7EE', '#F3EEFB', '#FDEBE0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', top: 0, left: -spacing.md, right: -spacing.md, height: 2600, borderRadius: 32 }} />
      <Banner tone="info" icon="shield" title={tr('nb.privacyTitle')}>{tr('nb.privacy')}</Banner>

      <GlassSurface fill={t.isDark ? 'rgba(40,32,70,0.55)' : 'rgba(255,255,255,0.62)'} depth={2} radius={24} padded={spacing.md}>
        <View style={{ gap: spacing.sm }}>
          <Field label={tr('nb.where')} value={q} onChangeText={setQ} placeholder={tr('nb.wherePh')} returnKeyType="search" onSubmitEditing={search} testID="nb-town" />
          <Row wrap>
            <Button label={tr('nb.search')} icon="search" size="sm" onPress={search} testID="nb-search" />
            <Button label={tr('nb.useLocation')} icon="navigation" size="sm" variant="ghost" loading={locating} onPress={useMyPosition} testID="nb-locate" />
          </Row>
          <Text variant="caption" muted>{tr('nb.locationHint')}</Text>
          {submitted && towns.isFetching ? <Text variant="small" muted>{tr('nb.loading')}</Text> : null}
          {submitted && towns.isError ? <Text variant="small" muted testID="nb-town-error">{tr('nb.serviceError')}</Text> : null}
          {submitted && towns.data && !here ? (
            towns.data.length ? (
              <Row wrap testID="nb-towns">
                {towns.data.map((x) => <Chip key={`${x.label}-${x.lat}`} label={x.postcode ? `${x.city} (${x.postcode})` : x.label} selected={town?.label === x.label} onPress={() => { setTown({ label: x.label, lat: x.lat, lon: x.lon }); setSubmitted(''); }} testID={`nb-townpick-${x.postcode ?? x.city}`} />)}
              </Row>
            ) : <Text variant="small" muted>{tr('nb.townNotFound')}</Text>
          ) : null}
          {center ? <Text variant="small" testID="nb-center">{here ? tr('nb.aroundHere') : tr('nb.around', { town: town!.label })}</Text> : null}
        </View>
      </GlassSurface>

      <Text variant="label">{tr('nb.kinds')}</Text>
      <Row wrap>
        {PLACE_KINDS.map((k) => <Chip key={k} label={tr(`nb.kind.${k}` as TKey)} icon={KIND_ICON[k] as never} selected={kinds.includes(k)} onPress={() => setKinds(kinds.includes(k) ? kinds.filter((x) => x !== k) : [...kinds, k])} testID={`nb-kind-${k}`} />)}
      </Row>
      <Text variant="label">{tr('nb.equipments')}</Text>
      <Row wrap>
        {EQUIPMENTS.map((e) => <Chip key={e} label={tr(`nb.equip.${e}` as TKey)} selected={equip.includes(e)} onPress={() => setEquip(equip.includes(e) ? equip.filter((x) => x !== e) : [...equip, e])} testID={`nb-equip-${e}`} />)}
      </Row>
      {equip.length ? <Text variant="caption" muted>{tr('nb.equipNote')}</Text> : null}
      <Text variant="label">{tr('nb.childAge')}</Text>
      <Row wrap>
        <Chip label={tr('nb.age.any')} selected={age == null} onPress={() => setAge(null)} testID="nb-age-any" />
        {AGES.map((a) => <Chip key={a.key} label={tr(`nb.age.${a.key}` as TKey)} selected={age === a.years} onPress={() => setAge(a.years)} testID={`nb-age-${a.key}`} />)}
      </Row>
      {age != null ? <Text variant="caption" muted>{tr('nb.ageNote')}</Text> : null}
      <Row wrap>
        {RADII.map((r) => <Chip key={r} label={tr('nb.radius', { km: r / 1000 })} selected={radius === r} onPress={() => setRadius(r)} testID={`nb-radius-${r}`} />)}
        <View style={{ flex: 1 }} />
        <Chip label={tr('nb.view.list')} icon="list" selected={view === 'list'} onPress={() => setView('list')} testID="nb-view-list" />
        <Chip label={tr('nb.view.map')} icon="map" selected={view === 'map'} onPress={() => setView('map')} testID="nb-view-map" />
      </Row>

      {!center ? <Text muted variant="small" testID="nb-start">{tr('nb.start')}</Text> : osmKinds.length ? (
        placesQ.isLoading ? <Skeleton kind="list" rows={3} /> : placesQ.isError ? (
          <Banner tone="warning" icon="wifi-off" title={tr('nb.serviceError')}>{tr('nb.serviceErrorHint')}</Banner>
        ) : (
          <>
            {view === 'map' ? <MiniMap center={center} places={places.map((x) => x.p)} onOpen={setOpen} /> : null}
            <SectionTitle title={tr('nb.places', { count: places.length })} />
            {places.length ? (
              <View style={{ gap: spacing.sm }} testID="nb-list">
                {places.map(({ p, d }) => <PlaceRow key={p.id} p={p} dist={approxDistance(d)} fav={!!favs.data?.some((f) => f.place_id === p.id)} onPress={() => setOpen(p)} />)}
              </View>
            ) : (
              <View style={{ gap: spacing.xs }} testID="nb-none">
                <Text muted variant="small">{tr('nb.none')}</Text>
                {widerRadius(radius) ? <Button label={tr('nb.widen', { km: widerRadius(radius)! / 1000 })} icon="maximize-2" size="sm" variant="secondary" onPress={() => setRadius(widerRadius(radius)!)} style={{ alignSelf: 'flex-start' }} testID="nb-widen" /> : null}
                {equip.length || age != null ? <Button label={tr('nb.clearFilters')} size="sm" variant="ghost" onPress={() => { setEquip([]); setAge(null); }} style={{ alignSelf: 'flex-start' }} testID="nb-clear" /> : null}
              </View>
            )}
            {placesQ.data ? <Text variant="caption" muted>{tr('nb.osmNote', { date: formatDate(`${placesQ.data[0]?.fetchedOn ?? new Date().toISOString().slice(0, 10)}T12:00:00`, { day: 'numeric', month: 'long', year: 'numeric' }) })}</Text> : null}
          </>
        )
      ) : null}

      <SectionTitle title={tr('nb.directories')} />
      <View style={{ gap: spacing.sm }} testID="nb-directories">
        {directories.map((d) => <DirectoryCard key={`${d.kind}-${d.title}`} d={d} town={town?.label.replace(/\s*\d{5}.*$/, '') ?? null} />)}
      </View>

      <SectionTitle title={tr('nb.favorites')} />
      {favs.data?.length ? (
        <View style={{ gap: spacing.sm }} testID="nb-favorites">
          {favs.data.map((f) => <FavoriteRow key={f.id} f={f} onOpen={() => setOpen(favToPlace(f))} />)}
        </View>
      ) : <Text muted variant="small">{tr('nb.favoritesNone')}</Text>}

      <PlaceSheet place={open} fav={favs.data?.find((f) => f.place_id === open?.id) ?? null} dist={open && center ? approxDistance(distanceM(center, open)) : null} onClose={() => setOpen(null)} />
    </Screen>
  );
}

const favToPlace = (f: PlaceFavorite): Place => ({ id: f.place_id, name: f.name, kind: f.kind, lat: f.lat ?? 0, lon: f.lon ?? 0, address: f.address, hours: null, website: null, phone: null, wheelchair: null, changingTable: null, highchair: null, minAge: null, maxAge: null, source: 'OpenStreetMap', fetchedOn: f.created_at.slice(0, 10) });

function PlaceRow({ p, dist, fav, onPress }: { p: Place; dist: string; fav: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Tappable accessibilityRole="button" onPress={onPress} testID={`nb-place-${p.id}`} accessibilityLabel={`${p.name}, ${tr(`nb.kind.${p.kind}` as TKey)}, ${dist}`}>
      <GlassSurface fill={t.isDark ? 'rgba(40,32,70,0.5)' : 'rgba(255,255,255,0.6)'} depth={1} radius={20} padded={spacing.sm + 4}>
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: `${KIND_TINT[p.kind]}22` }}>
            <Icon name={KIND_ICON[p.kind] as never} size={18} color={KIND_TINT[p.kind]} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text weight="bold" numberOfLines={2}>{p.name}</Text>
            <Text variant="caption" muted numberOfLines={2}>{tr(`nb.kind.${p.kind}` as TKey)} · {dist}{p.address ? ` · ${p.address}` : ''}</Text>
          </View>
          {fav ? <Icon name="heart" size={16} color="#E5525F" /> : null}
        </View>
      </GlassSurface>
    </Tappable>
  );
}

function FavoriteRow({ f, onOpen }: { f: PlaceFavorite; onOpen: () => void }) {
  return (
    <Tappable accessibilityRole="button" onPress={onOpen} testID={`nb-fav-${f.place_id}`} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48 }}>
      <Icon name="heart" size={16} color="#E5525F" />
      <View style={{ flex: 1 }}><Text weight="bold">{f.name}</Text>{f.address ? <Text variant="caption" muted>{f.address}</Text> : null}</View>
    </Tappable>
  );
}

function DirectoryCard({ d, town }: { d: Directory; town: string | null }) {
  const t = useTheme();
  const url = directoryUrl(d, town);
  return (
    <GlassSurface fill={t.isDark ? 'rgba(40,32,70,0.5)' : 'rgba(255,255,255,0.6)'} depth={1} radius={20} padded={spacing.md}>
      <View style={{ gap: 4 }} testID={`nb-dir-${d.kind}`}>
        <Row style={{ alignItems: 'center' }}><Icon name={KIND_ICON[d.kind] as never} size={16} color={KIND_TINT[d.kind]} /><Text weight="bold" style={{ flex: 1 }}>{d.title}</Text></Row>
        <Text variant="small">{d.body}</Text>
        {d.hours ? <Text variant="caption" muted>{d.hours}</Text> : null}
        <Text variant="caption" muted>{tr('nb.dirSource', { source: d.source, date: formatDate(`${d.checkedOn}T12:00:00`, { day: 'numeric', month: 'long', year: 'numeric' }) })}</Text>
        <Row wrap>
          {url ? <Button label={d.annuaire && town ? tr('nb.openIn', { town }) : tr('nb.open')} icon="external-link" size="sm" variant="secondary" onPress={() => void Linking.openURL(url)} testID={`nb-dir-open-${d.kind}`} /> : null}
          {d.phone ? <Button label={tr('nb.call', { phone: d.phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3') })} icon="phone" size="sm" variant="secondary" onPress={() => void Linking.openURL(`tel:${d.phone}`)} /> : null}
        </Row>
      </View>
    </GlassSurface>
  );
}

/** Carte simple à tuiles (zoom +/−), repères des lieux ; l'attribution OpenStreetMap reste visible. */
function MiniMap({ center, places, onOpen }: { center: { lat: number; lon: number }; places: Place[]; onOpen: (p: Place) => void }) {
  const t = useTheme();
  const [z, setZ] = useState(14);
  const [w, setW] = useState(340);
  const h = 260;
  const v = mapView(center, z, w, h);
  return (
    <View onLayout={(e) => setW(Math.round(e.nativeEvent.layout.width))} testID="nb-map" accessibilityLabel={tr('nb.mapA11y')}
      style={{ height: h, borderRadius: 24, overflow: 'hidden', backgroundColor: t.isDark ? '#2A2440' : '#F3EEE6', borderWidth: 1, borderColor: t.colors.border }}>
      {v.tiles.map((tile) => <Image key={tile.key} source={{ uri: tile.url }} style={{ position: 'absolute', left: tile.left, top: tile.top, width: 256, height: 256, opacity: t.isDark ? 0.75 : 0.92 }} accessibilityIgnoresInvertColors />)}
      <View pointerEvents="none" style={{ position: 'absolute', left: v.point(center).x - 7, top: v.point(center).y - 7, width: 14, height: 14, borderRadius: 7, borderWidth: 3, borderColor: '#FFFFFF', backgroundColor: '#7A5FB8' }} />
      {places.map((p) => { const pt = v.point(p); if (pt.x < -10 || pt.y < -10 || pt.x > w + 10 || pt.y > h + 10) return null; return (
        <Tappable key={p.id} accessibilityRole="button" accessibilityLabel={p.name} onPress={() => onOpen(p)} style={{ position: 'absolute', left: pt.x - 15, top: pt.y - 30, width: 30, height: 34, alignItems: 'center' }}>
          <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: KIND_TINT[p.kind], alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' }}>
            <Icon name={KIND_ICON[p.kind] as never} size={13} color="#FFFFFF" />
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

function PlaceSheet({ place, fav, dist, onClose }: { place: Place | null; fav: PlaceFavorite | null; dist: string | null; onClose: () => void }) {
  const t = useTheme();
  const toast = useToast();
  const toggle = useTogglePlaceFavorite();
  const report = useReportPlace();
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [comment, setComment] = useState('');
  if (!place) return <Sheet visible={false} onClose={onClose} title=""><View /></Sheet>;
  const p = place;
  async function sendReport() {
    if (!reason) return toast(tr('nb.reportPick'), 'info');
    try { await report.mutateAsync({ placeId: p.id, placeName: p.name, reason, comment: comment.trim() || null }); toast(tr('nb.reportThanks'), 'success'); setReporting(false); setReason(null); setComment(''); }
    catch (e) { toast(friendlyError(e), 'error'); }
  }
  return (
    <Sheet visible onClose={() => { setReporting(false); onClose(); }} title={p.name}>
      <View style={{ gap: spacing.sm }} testID="nb-sheet">
        <Text variant="small" muted>{tr(`nb.kind.${p.kind}` as TKey)}{dist ? ` · ${dist}` : ''}</Text>
        <Info icon="map-pin" text={p.address ?? tr('nb.addressNone')} />
        {p.hours ? <Info icon="clock" text={tr('nb.hours', { hours: p.hours })} /> : <Info icon="clock" text={tr('nb.hoursNone')} />}
        {p.phone ? <Info icon="phone" text={p.phone} /> : null}
        <Info icon="info" text={p.wheelchair ? tr(`nb.wheelchair.${p.wheelchair}` as TKey) : tr('nb.accessUnknown')} />
        {p.changingTable ? <Info icon="check" text={tr('nb.changingTable')} /> : null}
        {p.highchair ? <Info icon="check" text={tr('nb.highchair')} /> : null}
        {p.minAge != null || p.maxAge != null ? <Info icon="users" text={tr('nb.ages', { min: p.minAge ?? 0, max: p.maxAge ?? '…' })} /> : null}
        <Text variant="caption" muted testID="nb-source">{tr('nb.source', { date: formatDate(`${p.fetchedOn}T12:00:00`, { day: 'numeric', month: 'long', year: 'numeric' }) })}</Text>
        <Row wrap>
          <Button label={tr('nb.directions')} icon="navigation" size="sm" onPress={() => void Linking.openURL(directionsUrl(p, Platform.OS))} testID="nb-directions" />
          {p.website ? <Button label={tr('nb.website')} icon="external-link" size="sm" variant="secondary" onPress={() => void Linking.openURL(p.website!)} /> : null}
          {p.phone ? <Button label={tr('nb.callShort')} icon="phone" size="sm" variant="secondary" onPress={() => void Linking.openURL(`tel:${p.phone!.replace(/\s/g, '')}`)} /> : null}
          <Button label={fav ? tr('nb.unfavorite') : tr('nb.favorite')} icon="heart" size="sm" variant="ghost" loading={toggle.isPending}
            onPress={() => toggle.mutate({ place: p, existing: fav }, { onSuccess: () => { haptic('selection'); toast(fav ? tr('nb.unfavorited') : tr('nb.favorited')); }, onError: (e) => toast(friendlyError(e), 'error') })} testID="nb-fav" />
        </Row>
        {reporting ? (
          <View style={{ gap: spacing.sm }} testID="nb-report">
            <Text variant="label">{tr('nb.reportWhat')}</Text>
            <Row wrap>{REASONS.map((r) => <Chip key={r} label={tr(`nb.reason.${r}` as TKey)} selected={reason === r} onPress={() => setReason(r)} testID={`nb-reason-${r}`} />)}</Row>
            <Field label={tr('nb.reportComment')} optional value={comment} onChangeText={setComment} multiline maxLength={1000} hint={tr('nb.reportHint')} testID="nb-report-comment" />
            <Button label={tr('nb.reportSend')} full loading={report.isPending} onPress={sendReport} testID="nb-report-send" />
          </View>
        ) : <Button label={tr('nb.report')} icon="flag" size="sm" variant="ghost" onPress={() => setReporting(true)} testID="nb-report-open" />}
        <Text variant="caption" color={t.colors.textMuted}>{tr('nb.notVerified')}</Text>
      </View>
    </Sheet>
  );
}

function Info({ icon, text }: { icon: string; text: string }) {
  const t = useTheme();
  return <Row style={{ alignItems: 'flex-start' }}><Icon name={icon as never} size={16} color={t.colors.textMuted} /><Text variant="small" style={{ flex: 1 }}>{text}</Text></Row>;
}
