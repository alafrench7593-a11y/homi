/**
 * Communauté › « Sorties & rencontres ».
 *  · Lieux : recherche par ville ou code postal (ou position du moment, facultative, arrondie à ~1 km et jamais
 *    enregistrée), 11 catégories, vues Carte et Liste, filtres équipements / âge / rayon, fiches sourcées et datées,
 *    proposition de lieu (modérée), signalement d'erreur, favoris, annuaires officiels (PMI, Caf, LAEP…).
 *  · Rencontres : rencontres DE GROUPE dans un lieu public choisi parmi les résultats ; « Je participe » / annuler ;
 *    signaler une annonce ou un membre, bloquer. Ni adresse personnelle, ni position des membres, ni messagerie.
 * Sources : OpenStreetMap (seule source sur la carte), Google Places côté serveur si la clé est configurée (liste et
 * fiches seulement, mention « Google Maps »), lieux proposés validés, annuaires officiels. Jamais de lieu inventé.
 */
import React, { useMemo, useState } from 'react';
import { Linking, Platform, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/Screen';
import { Skeleton } from '@/components/States';
import { GlassSurface } from '@/components/Glass';
import { useToast } from '@/components/Overlays';
import { Banner, Button, Chip, Field, Icon, Row, SectionTitle, Segmented, Text } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { ReportSheet } from '@/features/community';
import { CATEGORY_TINT, catLabel, longDate, MeetupCard, OutingMap, PlaceCard } from '@/features/outings/OutingsUi';
import { MeetupFormSheet, MeetupSheet, PlaceDetailSheet, SuggestPlaceSheet } from '@/features/outings/OutingsSheets';
import { useCommunityProfile } from '@/lib/data/hooks';
import { usePlaceFavorites, useTownSearch, type PlaceFavorite } from '@/lib/data/hooks-discoveries';
import { useGoogleOutings, useMeetups, useMyParticipations, useOrganizers, useOsmOutings, usePlaceSuggestions } from '@/lib/data/hooks-outings';
import { useUserId } from '@/lib/auth';
import { coarse, DIRECTORIES, directoryUrl, distanceM, validTownQuery, widerRadius, type Directory } from '@/lib/domain/nearby';
import {
  CATEGORY_ICON, directoriesFor, fromSuggestion, hasOutingEquipment, meetupInCategory, mergeOutings, OUTING_CATEGORIES, OUTING_EQUIPMENT, osmCategories, suitsChildAge,
  type Meetup, type OutingCategory, type OutingEquipment, type OutingPlace,
} from '@/lib/domain/outings';
import { useUiStore } from '@/lib/store';
import { t as tr, type TKey } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

const RADII = [1000, 2000, 5000, 10000];
const AGES: { key: string; years: number }[] = [{ key: 'baby', years: 1 }, { key: 'small', years: 4 }, { key: 'school', years: 8 }];
/** « Tout » : les catégories ayant des données ouvertes (les autres s'affichent une par une, avec leurs annuaires). */
const ALL_OSM = osmCategories(OUTING_CATEGORIES);
const OLD_KIND: Record<string, OutingCategory> = { park: 'parks', library: 'culture', family_cafe: 'family_food', social_centre: 'parents_groups', public_service: 'support', parents_assoc: 'parents_groups', parent_child: 'laep', breastfeeding: 'support', isolated_support: 'support' };
const favCategory = (k: string): OutingCategory => ((OUTING_CATEGORIES as string[]).includes(k) ? k as OutingCategory : OLD_KIND[k] ?? 'parks');

export default function Outings() {
  const t = useTheme();
  const toast = useToast();
  const params = useLocalSearchParams<{ tab?: string }>();
  const me = useUserId();
  const profile = useCommunityProfile();
  const town = useUiStore((s) => s.nearbyTown);
  const setTown = useUiStore((s) => s.setNearbyTown);
  const [tab, setTab] = useState<'places' | 'meetups'>(params.tab === 'meetups' ? 'meetups' : 'places');
  const [q, setQ] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [here, setHere] = useState<{ lat: number; lon: number } | null>(null);
  const [cat, setCat] = useState<OutingCategory | null>(null);
  const [radius, setRadius] = useState(2000);
  const [equip, setEquip] = useState<OutingEquipment[]>([]);
  const [age, setAge] = useState<number | null>(null);
  const [view, setView] = useState<'map' | 'list'>('list');
  const [open, setOpen] = useState<OutingPlace | null>(null);
  const [openMeetup, setOpenMeetup] = useState<Meetup | null>(null);
  const [memberHandle, setMemberHandle] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [proposing, setProposing] = useState<{ place: OutingPlace | null } | null>(null);
  const [mtFilter, setMtFilter] = useState<'all' | 'pregnant' | 'near'>('all');
  const [locating, setLocating] = useState(false);

  const towns = useTownSearch(submitted);
  const center = here ?? (town ? { lat: town.lat, lon: town.lon } : null);
  const cityLabel = here ? null : town?.label.replace(/\s*\d{5}.*$/, '') ?? null;
  const cats = cat ? [cat] : ALL_OSM;
  const osmQ = useOsmOutings(center, cats, radius);
  const googleQ = useGoogleOutings(center, cat, radius);
  const sugg = usePlaceSuggestions();
  const favs = usePlaceFavorites();
  const meetupsQ = useMeetups();
  const parts = useMyParticipations();
  const joinedIds = useMemo(() => new Set((parts.data ?? []).map((p) => p.meetup_id)), [parts.data]);

  const memberPlaces = useMemo(() => (sugg.data ?? []).filter((s) => s.status === 'approved').map(fromSuggestion).filter((p) => !cat || p.category === cat), [sugg.data, cat]);
  const places = useMemo(() => {
    if (!center) return [];
    const merged = mergeOutings([osmQ.data ?? [], memberPlaces, googleQ.data?.places ?? []], center, radius);
    return merged.filter((p) => equip.every((e) => hasOutingEquipment(p, e)) && suitsChildAge(p, age));
  }, [center, osmQ.data, memberPlaces, googleQ.data, radius, equip, age]);
  const directories: Directory[] = cat ? directoriesFor(cat) : DIRECTORIES;
  const upcoming = useMemo(() => (meetupsQ.data ?? []).filter((m) => m.status === 'visible' && new Date(m.starts_at).getTime() > Date.now() && m.organizer_id !== me), [meetupsQ.data, me]);
  const mine = useMemo(() => (meetupsQ.data ?? []).filter((m) => (m.organizer_id === me || joinedIds.has(m.id)) && new Date(m.starts_at).getTime() > Date.now() - 86400_000 && m.status !== 'removed'), [meetupsQ.data, me, joinedIds]);
  const shown = upcoming.filter((m) => !joinedIds.has(m.id) && (mtFilter === 'all' || (mtFilter === 'pregnant' && m.for_pregnant) || (mtFilter === 'near' && center && distanceM(center, m) <= 15000)));
  const organizers = useOrganizers((meetupsQ.data ?? []).map((m) => m.organizer_id));
  const orgOf = (id: string) => organizers.data?.find((o) => o.user_id === id) ?? null;
  const osmLoading = osmQ.isLoading && osmCategories(cats).length > 0;

  function search() {
    if (!validTownQuery(q)) return toast(tr('nb.invalidTown'), 'info');
    setHere(null);
    setSubmitted(q.trim());
  }
  async function locate() {
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
      setHere(coarse(pos)); // arrondie à ~1 km, gardée en mémoire seulement
    } finally { setLocating(false); }
  }
  const propose = (place: OutingPlace | null) => {
    if (!profile.data) { toast(tr('mt.needProfile'), 'info'); router.push('/community/profile'); return; }
    setOpen(null);
    setProposing({ place });
  };
  const favToPlace = (f: PlaceFavorite): OutingPlace => ({
    id: f.place_id, source: f.place_id.startsWith('sugg:') ? 'member' : 'osm', name: f.name, typeLabel: null, category: favCategory(f.kind), lat: f.lat ?? 0, lon: f.lon ?? 0,
    address: f.address, hours: null, hoursLines: [], phone: null, website: null, mapsUri: null, equipment: {}, equipmentSource: 'osm', minAge: null, maxAge: null, activities: null, photo: null, fetchedOn: f.created_at.slice(0, 10),
  });

  return (
    <Screen back title={tr('out.title')} subtitle={tr('out.subtitle')}>
      <View testID="outings" />
      <LinearGradient pointerEvents="none" colors={t.isDark ? ['rgba(255,214,190,0.05)', 'rgba(201,184,255,0.06)'] : ['#FFF7EE', '#F3EEFB', '#FDEBE0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', top: 0, left: -spacing.md, right: -spacing.md, height: 3200, borderRadius: 32 }} />
      <Segmented label={tr('out.tabs')} value={tab} onChange={setTab} options={[{ value: 'places', label: tr('out.tab.places'), testID: 'out-tab-places' }, { value: 'meetups', label: tr('out.tab.meetups'), testID: 'out-tab-meetups' }]} />
      <Banner tone="info" icon="shield" title={tr('out.privacyTitle')}>{tr('out.privacy')}</Banner>

      <GlassSurface fill={t.isDark ? 'rgba(40,32,70,0.55)' : 'rgba(255,255,255,0.62)'} depth={2} radius={24} padded={spacing.md}>
        <View style={{ gap: spacing.sm }}>
          <Field label={tr('nb.where')} value={q} onChangeText={setQ} placeholder={tr('nb.wherePh')} returnKeyType="search" onSubmitEditing={search} testID="out-town" />
          <Row wrap>
            <Button label={tr('nb.search')} icon="search" size="sm" onPress={search} testID="out-search" />
            <Button label={tr('nb.useLocation')} icon="navigation" size="sm" variant="ghost" loading={locating} onPress={locate} testID="out-locate" />
          </Row>
          <Text variant="caption" muted>{tr('nb.locationHint')}</Text>
          {submitted && towns.isFetching ? <Text variant="small" muted>{tr('nb.loading')}</Text> : null}
          {submitted && towns.isError ? <Text variant="small" muted testID="out-town-error">{tr('nb.serviceError')}</Text> : null}
          {submitted && towns.data && !here ? (
            towns.data.length ? (
              <Row wrap testID="out-towns">
                {towns.data.map((x) => <Chip key={`${x.label}-${x.lat}`} label={x.postcode ? `${x.city} (${x.postcode})` : x.label} selected={town?.label === x.label} onPress={() => { setTown({ label: x.label, lat: x.lat, lon: x.lon }); setSubmitted(''); }} testID={`out-townpick-${x.postcode ?? x.city}`} />)}
              </Row>
            ) : <Text variant="small" muted>{tr('nb.townNotFound')}</Text>
          ) : null}
          {center ? <Text variant="small" testID="out-center">{here ? tr('nb.aroundHere') : tr('nb.around', { town: town!.label })}</Text> : null}
        </View>
      </GlassSurface>

      {tab === 'places' ? (
        <>
          <Text variant="label">{tr('out.categories')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} testID="out-categories" style={{ marginHorizontal: -spacing.md }} contentContainerStyle={{ gap: spacing.xs, paddingHorizontal: spacing.md }}>
            <Chip label={tr('out.catAll')} icon="grid" selected={cat == null} onPress={() => setCat(null)} testID="out-cat-all" />
            {OUTING_CATEGORIES.map((c) => <Chip key={c} label={catLabel(c)} icon={CATEGORY_ICON[c] as never} selected={cat === c} onPress={() => setCat(c)} testID={`out-cat-${c}`} />)}
          </ScrollView>
          {cat === 'mum_meetups' ? (
            <Banner tone="info" icon="smile" action={<Button label={tr('out.seeMeetups')} size="sm" variant="secondary" style={{ alignSelf: 'flex-start', marginTop: 6 }} onPress={() => setTab('meetups')} testID="out-see-meetups" />}>{tr('out.meetupsCategory')}</Banner>
          ) : (
            <>
              <Text variant="label">{tr('out.equipments')}</Text>
              <Row wrap>{OUTING_EQUIPMENT.map((e) => <Chip key={e} label={tr(`out.equip.${e}` as TKey)} selected={equip.includes(e)} onPress={() => setEquip(equip.includes(e) ? equip.filter((x) => x !== e) : [...equip, e])} testID={`out-equip-${e}`} />)}</Row>
              {equip.length ? <Text variant="caption" muted>{tr('nb.equipNote')}</Text> : null}
              <Text variant="label">{tr('nb.childAge')}</Text>
              <Row wrap>
                <Chip label={tr('nb.age.any')} selected={age == null} onPress={() => setAge(null)} testID="out-age-any" />
                {AGES.map((a) => <Chip key={a.key} label={tr(`nb.age.${a.key}` as TKey)} selected={age === a.years} onPress={() => setAge(a.years)} testID={`out-age-${a.key}`} />)}
              </Row>
              <Row wrap>
                {RADII.map((r) => <Chip key={r} label={tr('nb.radius', { km: r / 1000 })} selected={radius === r} onPress={() => setRadius(r)} testID={`out-radius-${r}`} />)}
                <View style={{ flex: 1 }} />
                <Chip label={tr('nb.view.list')} icon="list" selected={view === 'list'} onPress={() => setView('list')} testID="out-view-list" />
                <Chip label={tr('nb.view.map')} icon="map" selected={view === 'map'} onPress={() => setView('map')} testID="out-view-map" />
              </Row>

              {!center ? <Text muted variant="small" testID="out-start">{tr('nb.start')}</Text> : (
                <>
                  {cat && osmCategories([cat]).length === 0 ? <Text variant="caption" muted testID="out-no-open-data">{tr('out.noOpenData')}</Text> : null}
                  {osmLoading ? <Skeleton kind="list" rows={3} /> : osmQ.isError ? <Banner tone="warning" icon="wifi-off" title={tr('nb.serviceError')}>{tr('nb.serviceErrorHint')}</Banner> : null}
                  {view === 'map' && !osmLoading ? (
                    <>
                      <OutingMap center={center} places={places} onOpen={setOpen} />
                      <Text variant="caption" muted>{tr('out.mapNote')}</Text>
                    </>
                  ) : null}
                  {!osmLoading ? (
                    <>
                      <SectionTitle title={tr('nb.places', { count: places.length })} />
                      {places.length ? (
                        <View style={{ gap: spacing.sm }} testID="out-list">
                          {places.map((p) => <PlaceCard key={p.id} p={p} dist={p.distance} fav={!!favs.data?.some((f) => f.place_id === p.id)} onPress={() => setOpen(p)} />)}
                        </View>
                      ) : (
                        <View style={{ gap: spacing.xs }} testID="out-none">
                          <Text muted variant="small">{tr('out.none')}</Text>
                          {widerRadius(radius) ? <Button label={tr('nb.widen', { km: widerRadius(radius)! / 1000 })} icon="maximize-2" size="sm" variant="secondary" onPress={() => setRadius(widerRadius(radius)!)} style={{ alignSelf: 'flex-start' }} testID="out-widen" /> : null}
                          {equip.length || age != null ? <Button label={tr('nb.clearFilters')} size="sm" variant="ghost" onPress={() => { setEquip([]); setAge(null); }} style={{ alignSelf: 'flex-start' }} testID="out-clear" /> : null}
                        </View>
                      )}
                      {osmQ.data ? <Text variant="caption" muted testID="out-osm-note">{tr('out.verified', { source: 'OpenStreetMap', date: longDate(osmQ.data[0]?.fetchedOn ?? new Date().toISOString()) })} · {tr('out.osmNote')}</Text> : null}
                      {cat && googleQ.data?.state === 'not_configured' ? <Text variant="caption" muted testID="out-google-off">{tr('out.googleOff')}</Text> : null}
                      {cat && googleQ.data?.state === 'unavailable' ? <Text variant="caption" muted testID="out-google-unavailable">{tr('out.googleUnavailable')}</Text> : null}
                    </>
                  ) : null}
                </>
              )}
              <Button label={tr('out.suggest')} icon="plus-circle" size="sm" variant="secondary" onPress={() => setSuggesting(true)} style={{ alignSelf: 'flex-start' }} testID="out-suggest-open" />

              {directories.length ? (
                <>
                  <SectionTitle title={tr('nb.directories')} />
                  <View style={{ gap: spacing.sm }} testID="out-directories">
                    {directories.map((d) => <DirectoryCard key={`${d.kind}-${d.title}`} d={d} town={cityLabel} />)}
                  </View>
                </>
              ) : null}

              {(sugg.data ?? []).some((s) => s.user_id === me) ? (
                <>
                  <SectionTitle title={tr('out.suggestions')} />
                  <View style={{ gap: 4 }} testID="out-my-suggestions">
                    {(sugg.data ?? []).filter((s) => s.user_id === me).map((s) => (
                      <Row key={s.id} style={{ alignItems: 'center' }}><Icon name="map-pin" size={14} color={t.colors.textMuted} />
                        <Text variant="small" style={{ flex: 1 }}>{s.name}</Text>
                        <Text variant="caption" muted testID={`out-sg-status-${s.id}`}>{tr(`out.sg.${s.status}` as TKey)}</Text>
                      </Row>
                    ))}
                  </View>
                </>
              ) : null}

              <SectionTitle title={tr('out.favorites')} />
              {favs.data?.length ? (
                <View style={{ gap: spacing.xs }} testID="out-favorites">
                  {favs.data.map((f) => (
                    <Tappable key={f.id} accessibilityRole="button" onPress={() => setOpen(favToPlace(f))} testID={`out-fav-${f.place_id}`} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48 }}>
                      <Icon name="heart" size={16} color="#E5525F" />
                      <View style={{ flex: 1 }}><Text weight="bold">{f.name}</Text>{f.address ? <Text variant="caption" muted>{f.address}</Text> : null}</View>
                    </Tappable>
                  ))}
                </View>
              ) : <Text muted variant="small">{tr('nb.favoritesNone')}</Text>}
            </>
          )}
        </>
      ) : (
        <>
          <Banner tone="info" icon="users" title={tr('mt.rulesTitle')}>{tr('mt.rules')}</Banner>
          {me && profile.isFetched && !profile.data ? (
            <Banner tone="info" action={<Button label={tr('mt.createProfile')} size="sm" variant="secondary" style={{ alignSelf: 'flex-start', marginTop: 6 }} onPress={() => router.push('/community/profile')} testID="mt-create-profile" />}>{tr('mt.needProfile')}</Banner>
          ) : null}
          <Button label={tr('mt.propose')} icon="plus" onPress={() => propose(null)} testID="mt-propose" />
          {mine.length ? (
            <>
              <SectionTitle title={tr('mt.mine')} />
              <View style={{ gap: spacing.sm }} testID="mt-mine">
                {mine.map((m) => <MeetupCard key={m.id} m={m} organizer={orgOf(m.organizer_id)?.pseudonym ?? null} mine={m.organizer_id === me} joined={joinedIds.has(m.id)} onPress={() => setOpenMeetup(m)} />)}
              </View>
            </>
          ) : null}
          <SectionTitle title={tr('mt.upcoming')} />
          <Row wrap>
            {(['all', 'pregnant', 'near'] as const).map((f) => (f === 'near' && !center ? null : <Chip key={f} label={tr(`mt.filter.${f}` as TKey)} selected={mtFilter === f} onPress={() => setMtFilter(f)} testID={`mt-filter-${f}`} />))}
          </Row>
          {meetupsQ.isLoading ? <Skeleton kind="list" rows={2} /> : shown.length ? (
            <View style={{ gap: spacing.sm }} testID="mt-list">
              {shown.filter((m) => meetupInCategory(m, null)).map((m) => <MeetupCard key={m.id} m={m} organizer={orgOf(m.organizer_id)?.pseudonym ?? null} mine={false} joined={false} onPress={() => setOpenMeetup(m)} />)}
            </View>
          ) : <Text muted variant="small" testID="mt-none">{tr('mt.none')}</Text>}
        </>
      )}

      <PlaceDetailSheet place={open} dist={open && center ? distanceM(center, open) : null} fav={favs.data?.find((f) => f.place_id === open?.id) ?? null}
        meetups={(meetupsQ.data ?? []).filter((m) => m.place_ref === open?.id && m.status === 'visible' && new Date(m.starts_at).getTime() > Date.now())}
        onClose={() => setOpen(null)} onPropose={(p) => propose(p)} onOpenMeetup={(m) => { setOpen(null); setTab('meetups'); setOpenMeetup(m); }} />
      <SuggestPlaceSheet visible={suggesting} onClose={() => setSuggesting(false)} defaultCategory={cat} town={cityLabel} />
      {proposing ? <MeetupFormSheet visible onClose={() => setProposing(null)} candidates={places} initialPlace={proposing.place} cityLabel={cityLabel} /> : null}
      <MeetupSheet m={openMeetup ? (meetupsQ.data ?? []).find((x) => x.id === openMeetup.id) ?? openMeetup : null} organizer={openMeetup ? orgOf(openMeetup.organizer_id)?.pseudonym ?? null : null}
        organizerHandle={openMeetup ? orgOf(openMeetup.organizer_id)?.handle ?? null : null} mine={openMeetup?.organizer_id === me} joined={!!openMeetup && joinedIds.has(openMeetup.id)}
        onClose={() => setOpenMeetup(null)} onMemberActions={(h) => { setOpenMeetup(null); setMemberHandle(h); }} />
      {memberHandle ? <ReportSheet visible onClose={() => setMemberHandle(null)} handle={memberHandle} /> : null}
    </Screen>
  );
}

function DirectoryCard({ d, town }: { d: Directory; town: string | null }) {
  const t = useTheme();
  const url = directoryUrl(d, town);
  return (
    <GlassSurface fill={t.isDark ? 'rgba(40,32,70,0.5)' : 'rgba(255,255,255,0.6)'} depth={1} radius={20} padded={spacing.md}>
      <View style={{ gap: 4 }} testID={`out-dir-${d.kind}`}>
        <Row style={{ alignItems: 'center' }}><Icon name="book" size={16} color={CATEGORY_TINT.support} /><Text weight="bold" style={{ flex: 1 }}>{d.title}</Text></Row>
        <Text variant="small">{d.body}</Text>
        {d.hours ? <Text variant="caption" muted>{d.hours}</Text> : null}
        <Text variant="caption" muted>{tr('nb.dirSource', { source: d.source, date: longDate(d.checkedOn) })}</Text>
        <Row wrap>
          {url ? <Button label={d.annuaire && town ? tr('nb.openIn', { town }) : tr('nb.open')} icon="external-link" size="sm" variant="secondary" onPress={() => void Linking.openURL(url)} /> : null}
          {d.phone ? <Button label={tr('nb.call', { phone: d.phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3') })} icon="phone" size="sm" variant="secondary" onPress={() => void Linking.openURL(`tel:${d.phone}`)} /> : null}
        </Row>
      </View>
    </GlassSurface>
  );
}
