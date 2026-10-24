/**
 * « Sorties près de chez moi » : lieux familiaux Google Places (logique serveur exécutée sur des réponses au format
 * de l'API), filtres type / espace bébé ou enfant, carte Google (react-native-maps simulé), fiche simple, états
 * honnêtes (service non configuré, clé refusée, quota, réseau), plus aucune rencontre entre membres.
 * Les réponses de Google sont simulées : ce test ne prouve pas que la vraie clé fonctionne.
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
jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DATE: 'date', DAILY: 'daily', WEEKLY: 'weekly', TIME_INTERVAL: 'timeInterval' }, AndroidImportance: { HIGH: 4, DEFAULT: 3 },
  scheduleNotificationAsync: jest.fn(async () => 'n'), cancelScheduledNotificationAsync: jest.fn(async () => undefined), getAllScheduledNotificationsAsync: jest.fn(async () => []),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })), setNotificationHandler: jest.fn(), setNotificationChannelAsync: jest.fn(async () => null),
  setNotificationCategoryAsync: jest.fn(async () => null), getPermissionsAsync: jest.fn(async () => ({ granted: false })), getLastNotificationResponse: jest.fn(() => null),
}));
jest.mock('expo-device', () => ({ isDevice: false, modelName: 'test' }));
jest.mock('expo-linking', () => ({ createURL: (p: string) => `toietmoi://${p.replace(/^\//, '')}` }));
const mapsFlag = { on: true };
jest.mock('expo-constants', () => ({ __esModule: true, default: { get expoConfig() { return { extra: { googleMapsNative: { ios: mapsFlag.on, android: mapsFlag.on } } }; } } }));
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View, Pressable } = require('react-native');
  const MapView = ({ children, provider, customMapStyle }: { children: React.ReactNode; provider: string; customMapStyle: unknown[] }) => React.createElement(View, { testID: 'rn-mapview', provider, styleCount: customMapStyle?.length ?? 0 }, children);
  const Marker = ({ children, onPress, testID }: { children: React.ReactNode; onPress: () => void; testID: string }) => React.createElement(Pressable, { onPress, testID }, children);
  return { __esModule: true, default: MapView, Marker, Circle: () => null, PROVIDER_GOOGLE: 'google' };
});
// Le backend de démonstration répond à la place de la fonction serveur `places` : même logique (validation,
// requête, lecture de la réponse Google), seul l'appel HTTP à Google est remplacé par une réponse enregistrée.
jest.mock('@/lib/backend/demo', () => {
  const actual = jest.requireActual('@/lib/backend/demo');
  return { ...actual, createDemoBackend: (...a: unknown[]) => {
    const b = actual.createDemoBackend(...a);
    const inv = b.invoke.bind(b);
    b.invoke = (fn: string, body: unknown) => (fn === 'places' && (globalThis as { __places?: (x: unknown) => unknown }).__places ? Promise.resolve((globalThis as unknown as { __places: (x: unknown) => unknown }).__places(body)) : inv(fn, body));
    return b;
  } };
});

import React from 'react';
import { Platform } from 'react-native';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { backend } from '@/lib/backend';
import { createDemoBackend } from '@/lib/backend/demo';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/Overlays';
import Outings from '@/app/outings';
import { OutingsHomeCard } from '@/features/outings/OutingsHomeCard';
import { useUiStore } from '@/lib/store';
import { applyFilters, hasKidsSpace, kidsInfo, nextRadius, withDistance, type FamilyPlace } from '@/lib/domain/familyPlaces';
import { buildSearch, coarseLatLon, FAMILY_TYPES, GOOGLE_FIELD_MASK, googleErrorState, parseGooglePlaces, parsePhotoMedia, photoMediaUrl, validPhotoName, validQuery } from '../../supabase/functions/_shared/google-places';
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

/** Réponses au format de Places API (New), une par zone : centre-ville de Lyon et de Chelles. */
const place = (id: string, name: string, lat: number, lon: number, primaryType: string, extra: Record<string, unknown> = {}) => ({
  id, displayName: { text: name }, formattedAddress: `${name}, adresse publique`, location: { latitude: lat, longitude: lon }, primaryType, types: [primaryType, 'point_of_interest'],
  primaryTypeDisplayName: { text: primaryType }, googleMapsUri: `https://maps.google.com/?cid=${id}`, ...extra,
});
const RAW: Record<string, { places: unknown[] }> = {
  '45.76,4.84': { places: [
    place('ChIJlyonCafe0001', 'Café des Familles', 45.7612, 4.8402, 'cafe', { goodForChildren: true, regularOpeningHours: { weekdayDescriptions: ['lundi: 08:00–18:00'] },
      photos: [{ name: 'places/ChIJlyonCafe0001/photos/AbCdEfGhIjKlMn', authorAttributions: [{ displayName: 'Marie D.', uri: 'https://maps.google.com/maps/contrib/1' }] }] }),
    place('ChIJlyonCafe0002', 'Bar sans info enfants', 45.7605, 4.8395, 'cafe'),
    place('ChIJlyonPark0001', 'Square des Petits', 45.7620, 4.8410, 'playground'),
    place('ChIJlyonPark0002', 'Parc de la Tête d’Or', 45.7770, 4.8550, 'park', { goodForChildren: true }),
    place('ChIJlyonResto001', 'Bouchon familial', 45.7630, 4.8380, 'restaurant', { menuForChildren: true, goodForChildren: false }),
    place('ChIJlyonMuse0001', 'Musée des Confluences', 45.7330, 4.8180, 'museum'),
    place('ChIJlyonShop0001', 'Magasin hors sujet', 45.7610, 4.8400, 'clothing_store'),
  ] },
  '48.89,2.6': { places: [place('ChIJchellesPark1', 'Parc du Souvenir', 48.8868, 2.6010, 'park')] },
};
const calls: Record<string, unknown>[] = [];
let mode: 'ok' | 'not_configured' | '403' | '429' | 'empty' = 'ok';
function fakePlacesFunction(body: unknown): unknown {
  const b = body as Record<string, unknown>;
  calls.push(b);
  if (mode === 'not_configured') return { google: 'not_configured' };
  if (typeof b.photo === 'string') return validPhotoName(b.photo) ? { google: 'ok', photoUri: parsePhotoMedia({ photoUri: 'https://lh3.googleusercontent.com/p/photo-test' }) } : { google: 'unavailable' };
  const q = validQuery(b);
  if (!q) return { error: 'bad_request' };
  if (mode === '403') return { google: googleErrorState(403) };
  if (mode === '429') return { google: googleErrorState(429) };
  buildSearch(q); // même requête que le serveur
  const raw = mode === 'empty' ? { places: [] } : RAW[`${q.lat},${q.lon}`] ?? { places: [] };
  return { google: 'ok', places: parseGooglePlaces(raw, q.category) };
}

describe('Google Places (logique du serveur)', () => {
  it('requêtes : types du tableau A, rayon, langue, position arrondie ; masque de champs sans espace', () => {
    expect(validQuery({ category: 'all', lat: 45.76412, lon: 4.83571, radius: 2000 })).toEqual({ category: 'all', lat: 45.76, lon: 4.84, radius: 2000 });
    expect(validQuery({ category: 'rencontres', lat: 45, lon: 4, radius: 2000 })).toBeNull();
    expect(validQuery({ category: 'parks', lat: 45, lon: 4, radius: 100000 })).toBeNull();
    expect(coarseLatLon(48.88646)).toBe(48.89);
    expect(GOOGLE_FIELD_MASK).not.toMatch(/\s/);
    const all = buildSearch({ category: 'all', lat: 45.76, lon: 4.84, radius: 2000 });
    expect(all.url).toBe('https://places.googleapis.com/v1/places:searchNearby');
    expect(all.body).toMatchObject({ maxResultCount: 20, languageCode: 'fr', rankPreference: 'DISTANCE', locationRestriction: { circle: { center: { latitude: 45.76, longitude: 4.84 }, radius: 2000 } } });
    expect(all.body.includedTypes).toEqual(expect.arrayContaining(['cafe', 'tea_house', 'restaurant', 'family_restaurant', 'park', 'playground', 'library', 'museum']));
    expect(FAMILY_TYPES.parks).toContain('playground');
    const support = buildSearch({ category: 'support', lat: 45.76, lon: 4.84, radius: 5000 });
    expect(support.url).toBe('https://places.googleapis.com/v1/places:searchText');
    expect(support.body).toMatchObject({ regionCode: 'FR', locationBias: { circle: { radius: 5000 } } });
  });
  it('résultats : cafés et restaurants seulement s’ils sont indiqués adaptés aux enfants, hors-sujet écartés, photo par nom et auteur', () => {
    const parsed = parseGooglePlaces(RAW['45.76,4.84'], 'all');
    expect(parsed.map((p) => p.id)).toEqual(['google:ChIJlyonCafe0001', 'google:ChIJlyonPark0001', 'google:ChIJlyonPark0002', 'google:ChIJlyonResto001', 'google:ChIJlyonMuse0001']);
    expect(parsed.find((p) => p.id === 'google:ChIJlyonCafe0001')).toMatchObject({ category: 'cafes', hours: ['lundi: 08:00–18:00'], photo: { name: 'places/ChIJlyonCafe0001/photos/AbCdEfGhIjKlMn', attributions: [{ displayName: 'Marie D.', uri: 'https://maps.google.com/maps/contrib/1' }] } });
    expect(parsed.find((p) => p.id === 'google:ChIJlyonMuse0001')!.category).toBe('activities');
    expect(validPhotoName('places/ChIJx/photos/../../secret')).toBe(false);
    expect(photoMediaUrl('places/ChIJlyonCafe0001/photos/AbCdEfGhIjKlMn', 99999, 'K')).toBe('https://places.googleapis.com/v1/places/ChIJlyonCafe0001/photos/AbCdEfGhIjKlMn/media?maxWidthPx=1600&skipHttpRedirect=true&key=K');
    expect(parsePhotoMedia({ photoUri: 'javascript:alert(1)' })).toBeNull();
    expect([400, 403, 429, 500].map(googleErrorState)).toEqual(['invalid_key', 'invalid_key', 'quota', 'unavailable']);
    expect(serviceStatus((k) => (k === 'GOOGLE_PLACES_API_KEY' ? 'clé' : undefined)).google_places).toBe(true);
    expect(JSON.stringify(serviceStatus(() => 'secret'))).not.toContain('secret');
  });
  it('filtres : type, espace bébé ou enfant jamais supposé ; distance et élargissement', () => {
    const list = withDistance(parseGooglePlaces(RAW['45.76,4.84'], 'all').map((p) => ({ ...p, fetchedOn: '2026-10-24' })), { lat: 45.7615, lon: 4.8400 }, 2000);
    expect(list.map((p) => p.id)).not.toContain('google:ChIJlyonMuse0001'); // hors rayon
    expect(list.map((p) => p.distance)).toEqual([...list.map((p) => p.distance)].sort((a, b) => a - b));
    expect(applyFilters(list, { category: 'parks', kidsSpace: false }).map((p) => p.id)).toEqual(['google:ChIJlyonPark0001', 'google:ChIJlyonPark0002'].filter((id) => list.some((p) => p.id === id)));
    expect(applyFilters(list, { category: 'all', kidsSpace: true }).every((p) => hasKidsSpace(p))).toBe(true);
    const resto = list.find((p) => p.id === 'google:ChIJlyonResto001') as FamilyPlace;
    expect(hasKidsSpace(resto)).toBe(false); // menu enfants ≠ espace enfants
    expect(kidsInfo(resto)).toBe('yes');
    expect(kidsInfo({ primaryType: 'park', goodForChildren: null, menuForChildren: null })).toBe('unknown');
    expect([2000, 5000, 10000, 20000].map(nextRadius)).toEqual([5000, 10000, 20000, null]);
  });
});

describe('plus aucune rencontre entre membres', () => {
  it('moteur local : création d’une rencontre et inscription refusées', async () => {
    const db = createDemoBackend();
    await db.auth.signUp('sorties.regle@exemple.test', 'MotDePasse!2026');
    const me = (await db.auth.getSession())!.userId;
    await db.insert('community_profiles', { user_id: me, pseudonym: 'Maman Regle' });
    await expect(db.insert('community_meetups', { title: 'Pique-nique', activity: 'Jeux', place_ref: 'osm:way/1', place_name: 'Parc', lat: 45, lon: 4, starts_at: new Date(Date.now() + 86400_000 * 2).toISOString(), capacity: 4 })).rejects.toThrow(/ne sont pas proposées/);
    await expect(db.insert('meetup_participants', { meetup_id: '00000000-0000-4000-8000-000000000000' })).rejects.toThrow(/ne sont pas proposées/);
  });
});

describe(`écran « Sorties près de chez moi » (${Platform.OS})`, () => {
  beforeAll(async () => {
    (globalThis as { __places?: unknown }).__places = fakePlacesFunction;
    (globalThis as unknown as { fetch: unknown }).fetch = jest.fn(async (url: string) => {
      if (url.startsWith('https://data.geopf.fr/geocodage/search')) {
        const chelles = url.includes('Chelles');
        return { ok: true, json: async () => ({ features: [{ properties: chelles ? { label: 'Chelles', city: 'Chelles', postcode: '77500' } : { label: 'Lyon', city: 'Lyon', postcode: '69001' }, geometry: { coordinates: chelles ? [2.600366, 48.88646] : [4.8357, 45.764] } }] }) };
      }
      return { ok: false, status: 404, json: async () => ({}) };
    });
    await backend.auth.signUp(`sorties.${Platform.OS}@exemple.test`, 'MotDePasse!2026');
  });
  beforeEach(() => { mode = 'ok'; mapsFlag.on = true; calls.length = 0; useUiStore.getState().setNearbyTown(null); });

  it('ville ou code postal : carte Google avec repères, liste, fiche simple ; aucune adresse personnelle recherchée', async () => {
    const r = await render(<Outings />);
    expect(allText(r)).toContain('Sorties près de chez moi');
    expect(allText(r)).not.toMatch(/rencontre|Je participe/i);
    const input = r.root.findAll((n) => n.props.testID === 'out-town' && typeof n.props.onChangeText === 'function')[0];
    await act(async () => { input.props.onChangeText('8 bis allée des Tilleuls'); });
    await press(r, 'out-search');
    expect(calls).toHaveLength(0);
    await act(async () => { input.props.onChangeText('Lyon'); });
    await press(r, 'out-search', 500);
    await press(r, 'out-townpick-69001', 800);
    await until(() => has(r, 'rn-mapview'));
    expect(calls[0]).toMatchObject({ category: 'all', lat: 45.76, lon: 4.84, radius: 2000 }); // position arrondie
    const map = r.root.findAll((n) => n.props.testID === 'rn-mapview')[0];
    expect(map.props.provider).toBe('google');
    expect(map.props.styleCount).toBeGreaterThan(3);
    expect(ids(r, 'out-marker-')).toEqual(['out-marker-google:ChIJlyonResto001', 'out-marker-google:ChIJlyonPark0001', 'out-marker-google:ChIJlyonCafe0001', 'out-marker-google:ChIJlyonPark0002']); // du plus proche au plus loin
    expect(ids(r, 'out-marker-')).not.toContain('out-marker-google:ChIJlyonCafe0002'); // café sans indication enfants
    await press(r, 'out-marker-google:ChIJlyonCafe0001', 600);
    await until(() => has(r, 'out-photo-google:ChIJlyonCafe0001'));
    const sheet = allText(r);
    expect(sheet).toContain('Café des Familles, adresse publique');
    expect(sheet).toContain('lundi: 08:00–18:00');
    expect(sheet).toContain('Photo : Marie D.');
    expect(sheet).toMatch(/Source : Google Maps · consulté le/);
    expect(sheet).toContain('Adapté aux enfants, selon Google Maps');
    expect(has(r, 'out-directions')).toBe(true);
    expect(calls.some((c) => c.photo === 'places/ChIJlyonCafe0001/photos/AbCdEfGhIjKlMn')).toBe(true);
    r.unmount();
  });

  it('liste : photos ou illustration, mention Google Maps ; filtres type et espace enfant ; horaires « non renseignés »', async () => {
    useUiStore.getState().setNearbyTown({ label: 'Lyon 69001', lat: 45.764, lon: 4.8357 });
    const r = await render(<Outings />);
    await until(() => has(r, 'rn-mapview'));
    await press(r, 'out-view-list', 500);
    await until(() => has(r, 'out-list'));
    expect(has(r, 'out-google-mark')).toBe(true);
    expect(has(r, 'out-art-parks')).toBe(true); // sans photo : illustration annoncée comme telle
    await press(r, 'out-cat-parks', 800);
    await until(() => calls.some((c) => c.category === 'parks'));
    expect(ids(r, 'out-place-google').every((id) => /Park/.test(id))).toBe(true);
    await press(r, 'out-cat-all', 600);
    await press(r, 'out-kids-space', 400);
    expect(ids(r, 'out-place-google')).not.toContain('out-place-google:ChIJlyonResto001');
    await press(r, 'out-place-google:ChIJlyonPark0001', 500);
    expect(allText(r)).toContain('Horaires : non renseignés');
    expect(allText(r)).toContain('Aire de jeux');
    r.unmount();
  });

  it('autre ville (Chelles) : les lieux viennent bien de la zone choisie ; filtre secondaire PMI avec annuaires', async () => {
    const r = await render(<Outings />);
    const input = r.root.findAll((n) => n.props.testID === 'out-town' && typeof n.props.onChangeText === 'function')[0];
    await act(async () => { input.props.onChangeText('77500'); });
    await act(async () => { input.props.onChangeText('Chelles'); });
    await press(r, 'out-search', 500);
    await press(r, 'out-townpick-77500', 800);
    await until(() => has(r, 'rn-mapview'));
    expect(calls[calls.length - 1]).toMatchObject({ lat: 48.89, lon: 2.6 });
    expect(ids(r, 'out-marker-')).toEqual(['out-marker-google:ChIJchellesPark1']);
    await press(r, 'out-cat-support', 800);
    expect(has(r, 'out-directories')).toBe(true);
    expect(allText(r)).toMatch(/PMI/);
    r.unmount();
  });

  it('aucun résultat : explication et élargissement ; service non configuré, clé refusée, quota : jamais de faux lieux', async () => {
    useUiStore.getState().setNearbyTown({ label: 'Lyon 69001', lat: 45.764, lon: 4.8357 });
    mode = 'empty';
    let r = await render(<Outings />);
    await until(() => has(r, 'out-none'));
    expect(allText(r)).toContain('Aucun lieu trouvé dans un rayon de 2 km');
    await press(r, 'out-widen', 800);
    await until(() => calls.some((c) => c.radius === 5000));
    r.unmount();
    for (const [m, text] of [['not_configured', 'La recherche de lieux n’est pas encore disponible.'], ['403', 'momentanément indisponible'], ['429', 'réessayez dans un instant']] as const) {
      mode = m;
      r = await render(<Outings />);
      await until(() => allText(r).includes(text));
      expect(allText(r)).toContain(text);
      expect(ids(r, 'out-marker-')).toHaveLength(0);
      expect(ids(r, 'out-place-')).toHaveLength(0);
      expect(allText(r)).not.toMatch(/GOOGLE_PLACES_API_KEY|403|429/);
      r.unmount();
    }
  });

  it('accueil : carte visible directement, lieux proches, accès à la liste ; sans clé de carte, état clair', async () => {
    useUiStore.getState().setNearbyTown({ label: 'Lyon 69001', lat: 45.764, lon: 4.8357 });
    let r = await render(<OutingsHomeCard />);
    await until(() => has(r, 'rn-mapview'));
    expect(has(r, 'home-outings-list')).toBe(true);
    expect(has(r, 'home-outings-list-btn')).toBe(true);
    r.unmount();
    mapsFlag.on = false;
    r = await render(<OutingsHomeCard />);
    await until(() => has(r, 'out-map-unavailable'));
    expect(has(r, 'rn-mapview')).toBe(false);
    expect(has(r, 'home-outings-list')).toBe(true);
    r.unmount();
    useUiStore.getState().setNearbyTown(null);
    r = await render(<OutingsHomeCard />);
    expect(has(r, 'out-town')).toBe(true); // choix de la ville sur place
    r.unmount();
  });
});
