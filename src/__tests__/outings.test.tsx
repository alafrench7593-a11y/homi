/**
 * « Sorties & rencontres » : catégories et sources réelles (OpenStreetMap, Google Places côté serveur, Wikimedia
 * Commons), équipements jamais supposés, conditions Google (pas sur la carte non Google, mention et crédits, aucun
 * stockage), rencontres de groupe dans un lieu public, inscriptions privées, blocages, signalements, lieux proposés
 * modérés. Réponses des services simulées au format documenté : aucun appel réseau en test.
 * Lancé avec le préréglage iOS et avec jest.android.config.js.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-router', () => {
  const r = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true, setParams: jest.fn() };
  const state = { params: {} as Record<string, string> };
  return { router: r, useRouter: () => r, useLocalSearchParams: () => state.params, useIsFocused: () => true, usePathname: () => '/', useNavigation: () => ({ setOptions: jest.fn(), addListener: () => () => undefined }), Redirect: () => null, __state: state };
});
jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));
jest.mock('expo-location', () => ({ requestForegroundPermissionsAsync: jest.fn(async () => ({ granted: false })), getCurrentPositionAsync: jest.fn(), Accuracy: { Low: 2 } }));
jest.mock('expo-image-picker', () => ({ requestMediaLibraryPermissionsAsync: jest.fn(), launchImageLibraryAsync: jest.fn() }));
jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DATE: 'date', DAILY: 'daily', WEEKLY: 'weekly', TIME_INTERVAL: 'timeInterval' }, AndroidImportance: { HIGH: 4, DEFAULT: 3 },
  scheduleNotificationAsync: jest.fn(async () => 'n'), cancelScheduledNotificationAsync: jest.fn(async () => undefined), getAllScheduledNotificationsAsync: jest.fn(async () => []),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })), setNotificationHandler: jest.fn(), setNotificationChannelAsync: jest.fn(async () => null),
  setNotificationCategoryAsync: jest.fn(async () => null), getPermissionsAsync: jest.fn(async () => ({ granted: false })), getLastNotificationResponse: jest.fn(() => null),
}));
jest.mock('expo-device', () => ({ isDevice: false, modelName: 'test' }));
jest.mock('expo-linking', () => ({ createURL: (p: string) => `toietmoi://${p.replace(/^\//, '')}` }));

import React from 'react';
import { Platform } from 'react-native';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { backend } from '@/lib/backend';
import { createDemoBackend } from '@/lib/backend/demo';
import { eq } from '@/lib/backend/types';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/Overlays';
import Outings from '@/app/outings';
import { OutingMap, PlaceCard, PlacePhoto } from '@/features/outings/OutingsUi';
import { useUiStore } from '@/lib/store';
import {
  categoryOf, commonsFile, containsPersonalData, directoriesFor, fromGoogle, hasOutingEquipment, isPublicPlaceRef, mergeOutings, OSM_OUTING_FILTERS, OUTING_CATEGORIES,
  outingsOverpassQuery, parseCommons, parseOutingsOverpass, suitsChildAge, validateMeetup, type Meetup, type OutingPlace,
} from '@/lib/domain/outings';
import { buildSearch, coarseLatLon, GOOGLE_FIELD_MASK, GOOGLE_SEARCH, parseGooglePlaces, parsePhotoMedia, photoMediaUrl, validPhotoName, validQuery } from '../../supabase/functions/_shared/google-places';
import { serviceStatus } from '../../supabase/functions/_shared/service-status';

jest.setTimeout(60000);

function texts(node: ReactTestInstance | string): string[] {
  if (typeof node === 'string') return [node];
  return node.children.flatMap((c) => texts(c as ReactTestInstance | string));
}
const allText = (r: ReactTestRenderer) => texts(r.root).join('\n');
const flush = async (ms = 40) => { await act(async () => { await new Promise((res) => setTimeout(res, ms)); }); };
async function render(el: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } } });
  let r!: ReactTestRenderer;
  await act(async () => { r = create(<QueryClientProvider client={qc}><AuthProvider><ThemeProvider><ToastProvider>{el}</ToastProvider></ThemeProvider></AuthProvider></QueryClientProvider>); });
  await flush(300);
  return r;
}
async function until(cond: () => boolean, ms = 6000) {
  const end = Date.now() + ms;
  while (!cond() && Date.now() < end) await flush(100);
}
const has = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id).length > 0;
const ids = (r: ReactTestRenderer, prefix: string) => [...new Set(r.root.findAll((n) => typeof n.props.testID === 'string' && n.props.testID.startsWith(prefix)).map((n) => n.props.testID as string))];
async function press(r: ReactTestRenderer, id: string, wait = 300) {
  const el = r.root.findAll((n) => n.props.testID === id && typeof n.props.onPress === 'function')[0];
  if (!el) throw new Error(`testID introuvable : ${id}`);
  await act(async () => { await el.props.onPress(); });
  await flush(wait);
}
async function type(r: ReactTestRenderer, id: string, v: string) {
  const el = r.root.findAll((n) => n.props.testID === id && typeof n.props.onChangeText === 'function')[0];
  if (!el) throw new Error(`champ introuvable : ${id}`);
  await act(async () => { el.props.onChangeText(v); });
}

const OSM = { elements: [
  { type: 'node', id: 1, lat: 45.7641, lon: 4.8358, tags: { leisure: 'playground', min_age: '1', max_age: '6', wikimedia_commons: 'File:Aire de jeux Lyon.jpg' } },
  { type: 'way', id: 2, center: { lat: 45.7660, lon: 4.8370 }, tags: { amenity: 'cafe', name: 'Café des Familles', highchair: 'yes', changing_table: 'no', stroller: 'yes', wheelchair: 'limited', opening_hours: 'Mo-Fr 08:00-18:00' } },
  { type: 'node', id: 3, lat: 45.7700, lon: 4.8400, tags: { amenity: 'library', name: 'Médiathèque' } },
  { type: 'node', id: 4, lat: 45.7650, lon: 4.8350, tags: { amenity: 'cafe', name: 'Café sans info' } }, // aucun équipement famille : écarté
  { type: 'node', id: 5, lat: 45.7655, lon: 4.8355, tags: { amenity: 'social_facility', name: 'Centre de PMI Bellecour' } },
  { type: 'node', id: 6, lat: 45.7656, lon: 4.8356, tags: { name: 'LAEP Les Petits Pas', amenity: 'social_facility' } },
] } as const;
const GOOGLE_RAW = { places: [
  { id: 'ChIJgoogle000001', displayName: { text: 'Crêperie Familiale' }, formattedAddress: '2 rue X, Lyon', location: { latitude: 45.7646, longitude: 4.8361 }, goodForChildren: true,
    regularOpeningHours: { weekdayDescriptions: ['lundi: 10:00–18:00'] }, googleMapsUri: 'https://maps.google.com/?cid=1', accessibilityOptions: { wheelchairAccessibleEntrance: true },
    photos: [{ name: 'places/ChIJgoogle000001/photos/AbCdEfGhIjKlMn', authorAttributions: [{ displayName: 'Marie D.', uri: 'https://maps.google.com/maps/contrib/1' }] }] },
  { id: 'ChIJgoogle000002', displayName: { text: 'Bar sans enfants' }, location: { latitude: 45.7647, longitude: 4.8362 } }, // café sans indication enfants : écarté
  { id: 'court', displayName: { text: 'Identifiant invalide' }, location: { latitude: 45.7, longitude: 4.8 } },
] };

describe('Sorties & rencontres : catégories et sources', () => {
  it('11 catégories, dont une catégorie distincte PMI / associations / soutien ; rencontres entre mamans sans données OpenStreetMap', () => {
    expect(OUTING_CATEGORIES).toHaveLength(11);
    expect(OUTING_CATEGORIES).toContain('support');
    expect(OSM_OUTING_FILTERS.mum_meetups).toEqual([]);
    expect(directoriesFor('support').map((d) => d.title).join(' ')).toMatch(/PMI/);
    expect(directoriesFor('big_families')[0].url).toMatch(/^https:\/\/www\.service-public\.fr\//);
    expect(directoriesFor('pregnancy')[0].url).toMatch(/^https:\/\/www\.sante\.fr\//);
  });
  it('OpenStreetMap : catégorie par balises, équipements seulement s’ils sont renseignés, photo Commons repérée', () => {
    const q = outingsOverpassQuery(['parks', 'family_food'], 45.764, 4.8357, 2000);
    expect(q).toContain('nwr["leisure"="playground"](around:2000,45.76400,4.83570);');
    const all = parseOutingsOverpass(OSM as never, OUTING_CATEGORIES, '2026-10-24');
    const by = (id: string) => all.find((p) => p.id === id)!;
    expect(all.map((p) => p.id)).not.toContain('osm:node/4');
    expect(by('osm:node/1')).toMatchObject({ category: 'parks', name: '', minAge: 1, maxAge: 6, photo: { kind: 'commons', ref: 'File:Aire de jeux Lyon.jpg' } });
    expect(by('osm:way/2')).toMatchObject({ category: 'family_food', equipment: { highchair: true, changing_table: false, stroller: true } });
    expect(by('osm:way/2').equipment.wheelchair).toBeUndefined(); // accès « partiel » : ni oui ni non
    expect(hasOutingEquipment(by('osm:way/2'), 'highchair')).toBe(true);
    expect(hasOutingEquipment(by('osm:way/2'), 'changing_table')).toBe(false);
    expect(hasOutingEquipment(by('osm:node/3'), 'stroller')).toBe(false); // jamais supposé
    expect(by('osm:node/5').category).toBe('support');
    expect(by('osm:node/6').category).toBe('laep');
    expect(categoryOf({ leisure: 'park', name: 'Parc', fee: 'no' }, ['big_families'])).toBe('big_families');
    expect(suitsChildAge(by('osm:node/1'), 8)).toBe(false);
    expect(suitsChildAge(by('osm:node/3'), 8)).toBe(true);
  });
  it('Wikimedia Commons : fichier seulement (jamais une catégorie), photo affichée seulement avec auteur et licence', () => {
    expect(commonsFile('Category:Parcs de Lyon')).toBeNull();
    expect(commonsFile('https://commons.wikimedia.org/wiki/File:Parc%20Lyon.jpg')).toBe('File:Parc Lyon.jpg');
    const ok = { query: { pages: { 1: { imageinfo: [{ thumburl: 'https://upload.wikimedia.org/a.jpg', descriptionurl: 'https://commons.wikimedia.org/wiki/File:a.jpg', extmetadata: { Artist: { value: '<a href="x">Jean Dupont</a>' }, LicenseShortName: { value: 'CC BY-SA 4.0' } } }] } } } };
    expect(parseCommons(ok)).toEqual({ url: 'https://upload.wikimedia.org/a.jpg', author: 'Jean Dupont', license: 'CC BY-SA 4.0', pageUrl: 'https://commons.wikimedia.org/wiki/File:a.jpg' });
    expect(parseCommons({ query: { pages: { 1: { imageinfo: [{ thumburl: 'https://upload.wikimedia.org/a.jpg', extmetadata: {} }] } } } })).toBeNull();
    expect(parseCommons({ query: { pages: { 1: { imageinfo: [{ thumburl: 'https://exemple.com/a.jpg', extmetadata: { LicenseShortName: { value: 'CC0' } } }] } } } })).toBeNull();
  });
  it('Google Places (serveur) : requêtes documentées, position arrondie, filtre « adapté aux enfants », photo par nom, clé jamais renvoyée', () => {
    expect(validQuery({ category: 'parks', lat: 45.76412, lon: 4.83571, radius: 2000 })).toEqual({ category: 'parks', lat: 45.76, lon: 4.84, radius: 2000 });
    expect(validQuery({ category: 'inventee', lat: 45, lon: 4, radius: 2000 })).toBeNull();
    expect(validQuery({ category: 'parks', lat: 45, lon: 4, radius: 100000 })).toBeNull();
    expect(coarseLatLon(45.76789)).toBe(45.77);
    expect(GOOGLE_FIELD_MASK).not.toMatch(/\s/);
    const nearby = buildSearch({ category: 'family_food', lat: 45.76, lon: 4.84, radius: 2000 })!;
    expect(nearby.url).toBe('https://places.googleapis.com/v1/places:searchNearby');
    expect(nearby.body).toMatchObject({ includedTypes: ['cafe', 'restaurant'], maxResultCount: 20, languageCode: 'fr', locationRestriction: { circle: { center: { latitude: 45.76, longitude: 4.84 }, radius: 2000 } } });
    const text = buildSearch({ category: 'laep', lat: 45.76, lon: 4.84, radius: 2000 })!;
    expect(text.url).toBe('https://places.googleapis.com/v1/places:searchText');
    expect(text.body).toMatchObject({ pageSize: 20, regionCode: 'FR', locationBias: { circle: { radius: 2000 } } });
    expect(GOOGLE_SEARCH.mum_meetups).toBeNull();
    const parsed = parseGooglePlaces(GOOGLE_RAW, 'family_food');
    expect(parsed.map((p) => p.id)).toEqual(['google:ChIJgoogle000001']);
    expect(parsed[0].photo).toEqual({ name: 'places/ChIJgoogle000001/photos/AbCdEfGhIjKlMn', attributions: [{ displayName: 'Marie D.', uri: 'https://maps.google.com/maps/contrib/1' }] });
    expect(validPhotoName('places/ChIJgoogle000001/photos/../../secret')).toBe(false);
    expect(photoMediaUrl('places/ChIJgoogle000001/photos/AbCdEfGhIjKlMn', 99999, 'K')).toBe('https://places.googleapis.com/v1/places/ChIJgoogle000001/photos/AbCdEfGhIjKlMn/media?maxWidthPx=1600&skipHttpRedirect=true&key=K');
    expect(parsePhotoMedia({ name: 'x', photoUri: 'https://lh3.googleusercontent.com/p/abc' })).toBe('https://lh3.googleusercontent.com/p/abc');
    expect(parsePhotoMedia({ photoUri: 'javascript:alert(1)' })).toBeNull();
    expect(serviceStatus((k) => (k === 'GOOGLE_PLACES_API_KEY' ? 'clé' : undefined)).google_places).toBe(true);
    expect(JSON.stringify(serviceStatus(() => 'secret'))).not.toContain('secret');
  });
  it('fusion des sources : distance, rayon, doublon Google/OpenStreetMap retiré, aucune donnée Google recopiée', () => {
    const osm = parseOutingsOverpass(OSM as never, OUTING_CATEGORIES, '2026-10-24');
    const g = parseGooglePlaces({ places: [{ ...GOOGLE_RAW.places[0], displayName: { text: 'Café des Familles' }, location: { latitude: 45.76601, longitude: 4.83701 } }] }, 'parks').map((x) => fromGoogle(x, 'parks', '2026-10-24'));
    const merged = mergeOutings([osm, g], { lat: 45.764, lon: 4.8357 }, 1000);
    expect(merged.filter((p) => p.name === 'Café des Familles').map((p) => p.source)).toEqual(['osm']);
    expect(merged.map((p) => p.distance)).toEqual([...merged.map((p) => p.distance)].sort((a, b) => a - b));
    expect(merged.find((p) => p.id === 'osm:way/2')!.hoursLines).toEqual([]);
  });
  it('rencontre : lieu public des résultats seulement, groupe de 3 à 20, date encadrée, coordonnées personnelles repérées', () => {
    const place = parseOutingsOverpass(OSM as never, OUTING_CATEGORIES, '2026-10-24')[1];
    const base = { title: 'Pique-nique', activity: 'Jeux et goûter', place, startsAt: new Date(Date.now() + 2 * 86400_000), capacity: 6, ageMin: 0, ageMax: 3, forPregnant: false };
    expect(validateMeetup(base)).toBeNull();
    expect(validateMeetup({ ...base, place: null })).toBe('mt.err.place');
    expect(validateMeetup({ ...base, place: { ...place, id: 'domicile:12 rue X' } })).toBe('mt.err.place');
    expect(validateMeetup({ ...base, capacity: 2 })).toBe('mt.err.capacity');
    expect(validateMeetup({ ...base, startsAt: new Date(Date.now() - 1000) })).toBe('mt.err.date');
    expect(validateMeetup({ ...base, startsAt: new Date(Date.now() + 61 * 86400_000) })).toBe('mt.err.date');
    expect(isPublicPlaceRef('google:ChIJgoogle000001')).toBe(true);
    expect(isPublicPlaceRef('sugg:not-a-uuid')).toBe(false);
    for (const s of ['Appelez-moi au 06 12 34 56 78', 'ecrivez a moi@exemple.fr', 'rdv au 12 rue des Lilas']) expect(containsPersonalData(s)).toBe(true);
    expect(containsPersonalData('Rendez-vous près du toboggan')).toBe(false);
  });
});

describe('moteur local : rencontres, inscriptions, blocages, signalements, lieux proposés', () => {
  const db = createDemoBackend();
  const PW = 'MotDePasse!2026';
  const me = async () => (await db.auth.getSession())!.userId;
  const as = async (email: string) => { await db.auth.signOut(); await db.auth.signIn(email, PW); };
  const users: Record<string, string> = {};
  const inDays = (d: number) => new Date(Date.now() + d * 86400_000).toISOString();
  const meetup = (over: Record<string, unknown> = {}) => ({ title: 'Pique-nique au parc', activity: 'Jeux sur l’aire de jeux', place_ref: 'osm:way/123456', place_name: 'Parc de la Tête d’Or', lat: 45.777, lon: 4.855, starts_at: inDays(3), capacity: 3, ...over });
  let r1 = '';

  it('profils, organisation : lieu public, groupe, date ; l’organisatrice participe d’office', async () => {
    for (const [name, pseudo] of [['ana', 'Maman Ana'], ['bea', 'Maman Bea'], ['cleo', 'Maman Cleo'], ['dora', 'Maman Dora'], ['elsa', 'Maman Elsa']]) {
      await db.auth.signUp(`${name}.sorties@exemple.test`, PW);
      users[name] = await me();
      await db.insert('community_profiles', { user_id: users[name], pseudonym: pseudo });
    }
    await db.auth.signUp('sansprofil.sorties@exemple.test', PW);
    await expect(db.insert('community_meetups', meetup())).rejects.toThrow(/profil communautaire/);
    await as('ana.sorties@exemple.test');
    await expect(db.insert('community_meetups', meetup({ capacity: 2 }))).rejects.toThrow(/3 à 20 places/);
    await expect(db.insert('community_meetups', meetup({ place_ref: 'domicile:12 rue des Lilas' }))).rejects.toThrow(/lieu public/);
    await expect(db.insert('community_meetups', meetup({ starts_at: inDays(-1) }))).rejects.toThrow(/1 heure et 60 jours/);
    await expect(db.insert('community_meetups', meetup({ starts_at: inDays(90) }))).rejects.toThrow(/1 heure et 60 jours/);
    await expect(db.insert('community_meetups', meetup({ place_ref: 'sugg:00000000-0000-4000-8000-000000000000' }))).rejects.toThrow(/lieu public validé/);
    await expect(db.insert('community_meetups', meetup({ organizer_id: users.bea }))).rejects.toThrow(/non autorisée/);
    const [m] = await db.insert<Meetup>('community_meetups', meetup());
    r1 = m.id;
    expect(m).toMatchObject({ status: 'visible', participants_count: 1, organizer_id: users.ana });
    const [m2] = await db.insert<Meetup>('community_meetups', meetup({ activity: 'Appelez-moi au 06 12 34 56 78', place_ref: 'osm:node/42' }));
    expect(m2.status).toBe('pending_review');
    await db.update('community_meetups', { status: 'visible' }, [eq('id', m2.id)]);
    expect((await db.select<Meetup>({ table: 'community_meetups', filters: [eq('id', m2.id)] }))[0].status).toBe('pending_review');
  });

  it('je participe / annuler : places comptées, complet, liste des participantes jamais visible', async () => {
    await as('bea.sorties@exemple.test');
    expect((await db.select<Meetup>({ table: 'community_meetups' })).map((m) => m.id)).toEqual([r1]); // annonce à relire invisible
    await db.insert('meetup_participants', { meetup_id: r1 });
    await expect(db.insert('meetup_participants', { meetup_id: r1 })).rejects.toThrow(/déjà/);
    await expect(db.insert('meetup_participants', { meetup_id: r1, user_id: users.cleo })).rejects.toThrow(/non autorisée/);
    await db.update('community_meetups', { title: 'Détournée', participants_count: 0 }, [eq('id', r1)]);
    expect((await db.select<Meetup>({ table: 'community_meetups', filters: [eq('id', r1)] }))[0]).toMatchObject({ title: 'Pique-nique au parc', participants_count: 2 });
    await as('cleo.sorties@exemple.test');
    await db.insert('meetup_participants', { meetup_id: r1 });
    expect(await db.select({ table: 'meetup_participants' })).toHaveLength(1); // seulement la mienne
    await as('dora.sorties@exemple.test');
    await expect(db.insert('meetup_participants', { meetup_id: r1 })).rejects.toThrow(/complète/);
    await as('cleo.sorties@exemple.test');
    await db.remove('meetup_participants', [eq('meetup_id', r1), eq('user_id', users.cleo)]);
    expect((await db.select<Meetup>({ table: 'community_meetups', filters: [eq('id', r1)] }))[0].participants_count).toBe(2);
  });

  it('blocage : l’annonce disparaît et l’inscription est refusée, dans les deux sens', async () => {
    await as('ana.sorties@exemple.test');
    await expect(db.update('community_meetups', { capacity: 1 }, [eq('id', r1)])).rejects.toThrow(/Modification impossible/);
    await expect(db.update('community_meetups', { place_ref: 'osm:node/9' }, [eq('id', r1)])).rejects.toThrow(/Modification impossible/);
    await db.insert('user_blocks', { blocked_id: users.dora });
    await as('dora.sorties@exemple.test');
    expect((await db.select<Meetup>({ table: 'community_meetups' })).some((m) => m.id === r1)).toBe(false);
    await expect(db.insert('meetup_participants', { meetup_id: r1 })).rejects.toThrow(/Inscription impossible/);
  });

  it('signalements : une fois par personne, 3 signalements mettent l’annonce de côté ; retirée, elle ne revient pas', async () => {
    for (const u of ['bea', 'cleo', 'elsa']) {
      await as(`${u}.sorties@exemple.test`);
      await db.insert('reports', { meetup_id: r1, reason: 'inappropriate', details: null });
      if (u === 'bea') await expect(db.insert('reports', { meetup_id: r1, reason: 'spam' })).rejects.toThrow(/déjà/);
    }
    await as('elsa.sorties@exemple.test');
    expect((await db.select<Meetup>({ table: 'community_meetups' })).some((m) => m.id === r1)).toBe(false);
    await as('ana.sorties@exemple.test');
    expect((await db.select<Meetup>({ table: 'community_meetups', filters: [eq('id', r1)] }))[0].status).toBe('pending_review');
    await db.update('community_meetups', { status: 'cancelled' }, [eq('id', r1)]);
    expect((await db.select<Meetup>({ table: 'community_meetups', filters: [eq('id', r1)] }))[0].status).toBe('cancelled');
  });

  it('lieux proposés : toujours en attente, invisibles avant validation, validés par la modération seulement', async () => {
    await as('bea.sorties@exemple.test');
    const [s] = await db.insert<{ id: string; status: string }>('place_suggestions', { name: 'Café des petits', category: 'family_food', address_public: '3 place Bellecour, Lyon', lat: 45.757, lon: 4.832, equipment: ['highchair'], status: 'approved' });
    expect(s.status).toBe('pending');
    await expect(db.insert('place_suggestions', { name: 'Lieu', category: 'parks', address_public: '1 rue X, Lyon', lat: 45, lon: 4, equipment: ['piscine'] })).rejects.toThrow(/Équipement/);
    await expect(db.insert('place_suggestions', { name: 'Lieu', category: 'parks', address_public: '1 rue X, Lyon', lat: 45, lon: 4, website: 'javascript:alert(1)' })).rejects.toThrow(/https/);
    await db.update('place_suggestions', { status: 'approved' }, [eq('id', s.id)]);
    await as('cleo.sorties@exemple.test');
    expect(await db.select({ table: 'place_suggestions' })).toHaveLength(0);
    await expect(db.insert('community_meetups', meetup({ place_ref: `sugg:${s.id}` }))).rejects.toThrow(/lieu public validé/);
    // modération
    await db.auth.signUp('modo.sorties@exemple.test', PW);
    const modo = await me();
    await db.insert('user_roles', { user_id: modo, role: 'moderator' });
    await db.update('place_suggestions', { status: 'approved' }, [eq('id', s.id)]);
    await as('cleo.sorties@exemple.test');
    expect(await db.select<{ status: string }>({ table: 'place_suggestions' })).toEqual([expect.objectContaining({ status: 'approved' })]);
    const [m] = await db.insert<Meetup>('community_meetups', meetup({ place_ref: `sugg:${s.id}`, place_name: 'Café des petits' }));
    expect(m.status).toBe('visible');
    await db.insert('reports', { place_suggestion_id: s.id, reason: 'other', details: 'Fermé' });
    const exp = await db.rpc<Record<string, unknown[]>>('export_my_data');
    expect(exp.community_meetups).toHaveLength(1);
    expect(exp.meetup_participations).toHaveLength(1);
  });
});

describe(`écran « Sorties & rencontres » (${Platform.OS})`, () => {
  const geo = { features: [{ properties: { label: 'Lyon', city: 'Lyon', postcode: '69001' }, geometry: { coordinates: [4.8357, 45.764] } }] };
  const commons = { query: { pages: { 1: { imageinfo: [{ thumburl: 'https://upload.wikimedia.org/aire.jpg', descriptionurl: 'https://commons.wikimedia.org/wiki/File:Aire.jpg', extmetadata: { Artist: { value: 'Jean Dupont' }, LicenseShortName: { value: 'CC BY-SA 4.0' } } }] } } } };
  let sent: string[] = [];
  beforeAll(async () => {
    (globalThis as unknown as { fetch: unknown }).fetch = jest.fn(async (url: string, init?: { body?: string }) => {
      sent.push(`${url} ${init?.body ?? ''}`);
      if (url.startsWith('https://data.geopf.fr/geocodage/search')) return { ok: true, json: async () => geo };
      if (url.startsWith('https://overpass-api.de/api/interpreter')) return { ok: true, json: async () => OSM };
      if (url.startsWith('https://commons.wikimedia.org/w/api.php')) return { ok: true, json: async () => commons };
      return { ok: false, status: 404, json: async () => ({}) };
    });
    await backend.auth.signUp(`sorties.${Platform.OS}@exemple.test`, 'MotDePasse!2026');
    await backend.insert('community_profiles', { user_id: (await backend.auth.getSession())!.userId, pseudonym: `Sortie ${Platform.OS === 'ios' ? 'Ios' : 'Andro'}` });
    useUiStore.getState().setNearbyTown(null);
  });

  it('rubrique : ville, catégories, liste par distance, carte OpenStreetMap, Google non configuré annoncé honnêtement', async () => {
    sent = [];
    const r = await render(<Outings />);
    expect(allText(r)).toContain('Sorties & rencontres');
    await type(r, 'out-town', 'Lyon');
    await press(r, 'out-search', 500);
    await press(r, 'out-townpick-69001', 800);
    await until(() => has(r, 'out-list'));
    expect(sent.some((s) => s.includes('overpass-api.de') && decodeURIComponent(s).includes('"leisure"="playground"'))).toBe(true);
    expect(ids(r, 'out-place-osm')).toEqual(['out-place-osm:node/1', 'out-place-osm:node/5', 'out-place-osm:node/6', 'out-place-osm:way/2', 'out-place-osm:node/3']);
    expect(allText(r)).toContain('Aire de jeux'); // aire sans nom : nommée par son type
    await until(() => has(r, 'out-photo-osm:node/1'));
    expect(allText(r)).toContain('Photo : Jean Dupont · CC BY-SA 4.0 · Wikimedia Commons');
    expect(has(r, 'out-art-culture')).toBe(true); // pas de photo : illustration
    await press(r, 'out-cat-family_food', 800);
    await until(() => has(r, 'out-google-off'));
    expect(allText(r)).toContain('Photos et fiches Google non activées');
    expect(ids(r, 'out-place-')).toEqual(['out-place-osm:way/2']);
    await press(r, 'out-equip-changing_table', 400);
    expect(has(r, 'out-none')).toBe(true); // « non » renseigné : jamais présenté comme disponible
    expect(has(r, 'out-widen')).toBe(true);
    await press(r, 'out-equip-changing_table', 300);
    await press(r, 'out-view-map', 400);
    expect(has(r, 'out-map')).toBe(true);
    expect(allText(r)).toContain('© contributeurs OpenStreetMap');
    await press(r, 'out-place-osm:way/2');
    expect(allText(r)).toContain('Chaise haute : oui, selon OpenStreetMap');
    expect(allText(r)).toContain('Table à langer : non, selon OpenStreetMap');
    expect(allText(r)).toContain('Horaires indiqués (OpenStreetMap) : Mo-Fr 08:00-18:00');
    expect(allText(r)).toMatch(/Source : OpenStreetMap · consulté le/);
    await press(r, 'out-cat-mum_meetups', 300);
    expect(has(r, 'out-see-meetups')).toBe(true);
    await press(r, 'out-cat-support', 300);
    expect(has(r, 'out-directories')).toBe(true);
    expect(allText(r)).toMatch(/PMI/);
    r.unmount();
  });

  it('carte : un établissement Google n’y figure jamais ; sa fiche porte la mention « Google Maps »', async () => {
    const g = fromGoogle(parseGooglePlaces(GOOGLE_RAW, 'family_food')[0], 'family_food', '2026-10-24');
    const osm = parseOutingsOverpass(OSM as never, OUTING_CATEGORIES, '2026-10-24')[1];
    const m = await render(<OutingMap center={{ lat: 45.764, lon: 4.8357 }} places={[g, osm]} onOpen={() => undefined} />);
    expect(ids(m, 'out-marker-')).toEqual(['out-marker-osm:way/2']);
    m.unmount();
    const c = await render(<PlaceCard p={g} dist={120} fav={false} onPress={() => undefined} />);
    expect(has(c, 'out-google-mark')).toBe(true);
    expect(allText(c)).toContain('Google Maps');
    c.unmount();
    // photo Google indisponible (service non configuré) : illustration, jamais d'image d'une autre source
    const p = await render(<PlacePhoto place={g as OutingPlace} />);
    expect(has(p, 'out-art-family_food')).toBe(true);
    p.unmount();
  });

  it('proposer une rencontre : lieu choisi dans les résultats, publication, visible dans « Mes rencontres » ; coordonnées refusées', async () => {
    useUiStore.getState().setNearbyTown({ label: 'Lyon 69001', lat: 45.764, lon: 4.8357 });
    const r = await render(<Outings />);
    await until(() => has(r, 'out-list'));
    await press(r, 'out-place-osm:way/2');
    await press(r, 'out-propose-here', 500);
    expect(has(r, 'mt-form')).toBe(true);
    expect(has(r, 'mt-form-place-osm:way/2')).toBe(true);
    // aucun champ d'adresse : le lieu se choisit dans la liste
    expect(r.root.findAll((n) => typeof n.props.testID === 'string' && /mt-form-(address|adresse)/.test(n.props.testID))).toHaveLength(0);
    await type(r, 'mt-form-title', 'Goûter au café');
    await type(r, 'mt-form-activity', 'Écrivez-moi : moi@exemple.fr');
    await press(r, 'mt-form-publish', 500);
    expect(await backend.select({ table: 'community_meetups' })).toHaveLength(0);
    await type(r, 'mt-form-activity', 'Goûter et jeux, retrouvons-nous près du comptoir.');
    await press(r, 'mt-form-day-2');
    await press(r, 'mt-form-time-15:30');
    await press(r, 'mt-form-publish', 800);
    const rows = await backend.select<Meetup>({ table: 'community_meetups' });
    expect(rows).toEqual([expect.objectContaining({ place_ref: 'osm:way/2', place_name: 'Café des Familles', capacity: 6, status: 'visible', participants_count: 1, lat: 45.766, lon: 4.837 })]);
    expect(new Date(rows[0].starts_at).getHours()).toBe(15);
    await press(r, 'out-tab-meetups', 500);
    await until(() => has(r, `mt-card-${rows[0].id}`));
    expect(has(r, 'mt-mine')).toBe(true);
    expect(allText(r)).toContain('Vous organisez');
    await press(r, `mt-card-${rows[0].id}`);
    expect(has(r, 'mt-join')).toBe(false); // l'organisatrice est déjà inscrite
    expect(has(r, 'mt-cancel')).toBe(true);
    r.unmount();
  });
});
