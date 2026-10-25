/**
 * « Sorties près de chez moi », solution gratuite : lieux OpenStreetMap (Overpass), carte à tuiles OpenStreetMap,
 * photos Wikimedia Commons. Les réponses d'Overpass et de Commons sont simulées au format réel de ces API
 * (relevé le 25/10/2026 autour de Chelles) : ce test ne prouve pas que ces services répondent en ce moment.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-router', () => {
  const r = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true, setParams: jest.fn() };
  return { router: r, useRouter: () => r, useLocalSearchParams: () => ({}), useIsFocused: () => true, usePathname: () => '/', useNavigation: () => ({ setOptions: jest.fn(), addListener: () => () => undefined }), Redirect: () => null };
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
jest.mock('react-native-maps', () => ({ __esModule: true, default: () => { throw new Error('carte Google utilisée'); }, Marker: () => null, Circle: () => null, PROVIDER_GOOGLE: 'google' }));

import React from 'react';
import { Platform } from 'react-native';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { backend } from '@/lib/backend';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/Overlays';
import Outings from '@/app/outings';
import { OutingsHomeCard } from '@/features/outings/OutingsHomeCard';
import { fitZoom } from '@/features/outings/OsmMap';
import { placesProvider } from '@/lib/data/hooks-outings';
import { useUiStore } from '@/lib/store';
import { hasKidsSpace, kidsInfo } from '@/lib/domain/familyPlaces';
import { commonsFile, osmHours, overpassFamilyQuery, parseCommons, parseOsmPlaces } from '@/lib/domain/osmPlaces';

jest.setTimeout(60000);

const OVERPASS = { elements: [
  { type: 'node', id: 101, lat: 48.8872, lon: 2.6012, tags: { leisure: 'playground' } },
  { type: 'way', id: 202, center: { lat: 48.8840, lon: 2.6050 }, tags: { leisure: 'park', name: 'Parc du Souvenir Émile Fouchard', opening_hours: 'Mo-Su 08:00-19:00' } },
  { type: 'node', id: 303, lat: 48.8880, lon: 2.5990, tags: { amenity: 'cafe', name: 'Le Petit Nid', kids_area: 'yes', changing_table: 'yes', 'addr:housenumber': '4', 'addr:street': 'Rue Louis Eterlet', 'addr:postcode': '77500', 'addr:city': 'Chelles', wikimedia_commons: 'File:Le_Petit_Nid.jpg' } },
  { type: 'node', id: 304, lat: 48.8862, lon: 2.6001, tags: { amenity: 'cafe', name: 'Le Balto' } },
  { type: 'node', id: 305, lat: 48.8863, lon: 2.6002, tags: { amenity: 'restaurant', name: 'Pizza Le Kiosque' } },
  { type: 'node', id: 306, lat: 48.8900, lon: 2.5950, tags: { amenity: 'library', name: 'Médiathèque Jean-Pierre Vernant', opening_hours: 'Tu,Th 14:00-18:00; We,Sa 10:00-18:00; Mo off' } },
  { type: 'node', id: 307, lat: 48.8790, lon: 2.6100, tags: { amenity: 'cafe', cuisine: 'tea', name: 'Salon de thé Camomille' } },
  { type: 'node', id: 308, lat: 48.8850, lon: 2.6020, tags: { leisure: 'garden', name: 'Jardin privé', access: 'private' } },
  { type: 'node', id: 101, lat: 48.8872, lon: 2.6012, tags: { leisure: 'playground' } }, // doublon
] };
const COMMONS = { query: { pages: { 1: { imageinfo: [{ thumburl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Le_Petit_Nid.jpg/800px-Le_Petit_Nid.jpg', descriptionurl: 'https://commons.wikimedia.org/wiki/File:Le_Petit_Nid.jpg', extmetadata: { Artist: { value: '<a href="x">Camille R.</a>' }, LicenseShortName: { value: 'CC BY-SA 4.0' } } }] } } } };

let overpassMode: 'ok' | 'down' | 'busy' = 'ok';
const sent: string[] = [];
function texts(node: ReactTestInstance | string): string[] {
  if (typeof node === 'string') return [node];
  return node.children.flatMap((c) => texts(c as ReactTestInstance | string));
}
const allText = (r: ReactTestRenderer) => texts(r.root).join('\n');
const flush = async (ms = 40) => { await act(async () => { await new Promise((res) => setTimeout(res, ms)); }); };
const has = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id).length > 0;
const ids = (r: ReactTestRenderer, prefix: string) => [...new Set(r.root.findAll((n) => typeof n.props.testID === 'string' && n.props.testID.startsWith(prefix) && typeof n.props.onPress === 'function').map((n) => n.props.testID as string))];
async function press(r: ReactTestRenderer, id: string, ms = 300) {
  const n = r.root.findAll((x) => x.props.testID === id && typeof x.props.onPress === 'function')[0];
  if (!n) throw new Error(`introuvable : ${id}`);
  await act(async () => { n.props.onPress(); });
  await flush(ms);
}
async function render(el: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  let r!: ReactTestRenderer;
  await act(async () => { r = create(<QueryClientProvider client={qc}><AuthProvider><ThemeProvider><ToastProvider>{el}</ToastProvider></ThemeProvider></AuthProvider></QueryClientProvider>); });
  await flush(300);
  return r;
}
async function until(cond: () => boolean, ms = 6000) {
  const end = Date.now() + ms;
  while (!cond() && Date.now() < end) await flush(100);
}

describe('OpenStreetMap (logique pure)', () => {
  it('requête Overpass : catégories, rayon borné, position arrondie, pas de restaurant ni café sans accueil enfants', () => {
    const q = overpassFamilyQuery('all', 48.886463, 2.600366, 2000);
    expect(q).toContain('around:2000,48.8865,2.6004');
    expect(q).toContain('"leisure"="playground"');
    expect(q).toContain('["amenity"="cafe"]["kids_area"="yes"]');
    expect(q).not.toMatch(/\["amenity"="restaurant"\]\["name"\]/);
    expect(q).not.toMatch(/PMI/); // filtre secondaire seulement sur demande
    expect(overpassFamilyQuery('support', 48.88, 2.6, 999999)).toMatch(/PMI.*around:20000/);
  });
  it('lecture : aire de jeux sans nom gardée, cafés sans accueil enfants et lieux privés écartés, doublons retirés', () => {
    const p = parseOsmPlaces(OVERPASS as never, 'all');
    expect(p.map((x) => x.id).sort()).toEqual(['osm:node/101', 'osm:node/303', 'osm:node/306', 'osm:node/307', 'osm:way/202']);
    const nid = p.find((x) => x.id === 'osm:node/303')!;
    expect(nid).toMatchObject({ category: 'cafes', typeLabel: 'Café', address: '4 Rue Louis Eterlet, 77500 Chelles', goodForChildren: true, commons: 'File:Le Petit Nid.jpg', mapsUri: 'https://www.openstreetmap.org/node/303', source: 'osm' });
    expect(p.find((x) => x.id === 'osm:node/101')).toMatchObject({ name: 'Aire de jeux', category: 'parks', primaryType: 'playground' });
    expect(p.find((x) => x.id === 'osm:node/307')).toMatchObject({ typeLabel: 'Salon de thé', goodForChildren: null });
    expect(parseOsmPlaces(OVERPASS as never, 'parks').every((x) => x.category === 'parks')).toBe(true);
    // jamais « non adapté » déduit d'une balise absente
    expect(kidsInfo({ ...p.find((x) => x.id === 'osm:node/307')!, fetchedOn: '' } as never)).toBe('unknown');
    expect(hasKidsSpace(p.find((x) => x.id === 'osm:node/101')! as never)).toBe(true);
  });
  it('horaires lisibles, photo Commons seulement avec une licence, fichier valide', () => {
    expect(osmHours('Tu,Th 14:00-18:00; We,Sa 10:00-18:00; Mo off')).toEqual(['mar.,jeu. 14 h-18 h', 'mer.,sam. 10 h-18 h', 'lun. fermé']);
    expect(osmHours('24/7')).toEqual(['Ouvert 24 h/24']);
    expect(osmHours(undefined)).toEqual([]);
    expect(commonsFile({ wikimedia_commons: 'Category:Chelles' })).toBeNull();
    expect(commonsFile({ image: 'https://commons.wikimedia.org/wiki/File:Parc%20X.jpg' })).toBe('File:Parc X.jpg');
    expect(parseCommons(COMMONS)).toMatchObject({ author: 'Camille R.', license: 'CC BY-SA 4.0' });
    const noLicense = JSON.parse(JSON.stringify(COMMONS));
    delete noLicense.query.pages[1].imageinfo[0].extmetadata.LicenseShortName;
    expect(parseCommons(noLicense)).toBeNull();
  });
  it('zoom ajusté pour montrer les lieux proches', () => {
    const c = { lat: 48.886, lon: 2.6 };
    expect(fitZoom(c, [], 340, 230)).toBe(16);
    expect(fitZoom(c, [{ lat: 48.90, lon: 2.62 }], 340, 230)).toBeLessThan(16);
  });
});

describe(`écran gratuit « Sorties près de chez moi » (${Platform.OS})`, () => {
  beforeAll(async () => {
    expect(placesProvider()).toBe('osm'); // sans configuration Google : solution gratuite
    (globalThis as unknown as { fetch: unknown }).fetch = jest.fn(async (url: string, init?: { body?: string }) => {
      sent.push(`${url} ${init?.body ?? ''}`);
      if (url.includes('/api/interpreter')) {
        if (overpassMode === 'down') throw new Error('network');
        if (overpassMode === 'busy') return { ok: false, status: 429, json: async () => ({}) };
        return { ok: true, status: 200, json: async () => OVERPASS };
      }
      if (url.startsWith('https://commons.wikimedia.org/w/api.php')) return { ok: true, status: 200, json: async () => COMMONS };
      if (url.startsWith('https://data.geopf.fr/geocodage/search')) return { ok: true, json: async () => ({ features: [{ properties: { label: 'Chelles', city: 'Chelles', postcode: '77500' }, geometry: { coordinates: [2.600366, 48.88646] } }] }) };
      return { ok: false, status: 404, json: async () => ({}) };
    });
    await backend.auth.signUp(`osm.${Platform.OS}@exemple.test`, 'MotDePasse!2026');
  });
  beforeEach(() => { overpassMode = 'ok'; sent.length = 0; useUiStore.getState().setNearbyTown({ label: 'Chelles 77500', lat: 48.88646, lon: 2.600366 }); });

  it('carte OpenStreetMap : tuiles, repères du plus proche, attribution ; fiche avec photo libre et source', async () => {
    const r = await render(<Outings />);
    await until(() => has(r, 'out-marker-osm:node/101'));
    expect(has(r, 'out-map-tile')).toBe(true);
    const tile = r.root.findAll((n) => n.props.testID === 'out-map-tile')[0];
    expect(tile.props.source.uri).toMatch(/^https:\/\/tile\.openstreetmap\.org\/\d+\/\d+\/\d+\.png$/);
    expect(allText(r)).toContain('© contributeurs OpenStreetMap');
    const q = decodeURIComponent(sent.find((s) => s.includes('/api/interpreter'))!);
    expect(q).toContain('around:2000,48.8900,2.6000'); // position arrondie (~1 km), jamais l'adresse
    expect(ids(r, 'out-marker-')).not.toContain('out-marker-osm:node/304');
    await press(r, 'out-marker-osm:node/303', 600);
    await until(() => has(r, 'out-photo-osm:node/303'));
    const sheet = allText(r);
    expect(sheet).toContain('4 Rue Louis Eterlet, 77500 Chelles');
    expect(sheet).toContain('Photo : Camille R. · CC BY-SA 4.0 · Wikimedia Commons');
    expect(sheet).toMatch(/Source : OpenStreetMap · consulté le/);
    expect(sheet).toContain('Accueil des enfants renseigné');
    expect(sheet).not.toContain('Google Maps');
    expect(has(r, 'out-directions')).toBe(true);
    expect(has(r, 'out-open-osm')).toBe(true);
    r.unmount();
  });

  it('liste, filtres type et espace enfant ; zoom et recentrage', async () => {
    const r = await render(<Outings />);
    await until(() => has(r, 'out-marker-osm:node/101'));
    const before = r.root.findAll((n) => n.props.testID === 'out-map-tile')[0].props.source.uri;
    const zoomIn = r.root.findAll((n) => n.props.accessibilityLabel === 'Zoomer' && typeof n.props.onPress === 'function')[0];
    await act(async () => { zoomIn.props.onPress(); });
    await flush(100);
    expect(r.root.findAll((n) => n.props.testID === 'out-map-tile')[0].props.source.uri).not.toBe(before);
    expect(r.root.findAll((n) => n.props.accessibilityLabel === 'Recentrer la carte').length).toBeGreaterThan(0);
    await press(r, 'out-view-list', 400);
    await until(() => has(r, 'out-list'));
    expect(has(r, 'out-osm-mark')).toBe(true);
    await press(r, 'out-kids-space', 300);
    expect(ids(r, 'out-place-osm').sort()).toEqual(['out-place-osm:node/101', 'out-place-osm:node/303']);
    await press(r, 'out-cat-cafes', 800);
    expect(has(r, 'out-osm-note')).toBe(true);
    r.unmount();
  });

  it('Overpass indisponible ou saturé : message clair, réessayer, jamais de faux lieux', async () => {
    for (const [m, text] of [['down', 'Impossible de joindre la recherche de lieux'], ['busy', 'réessayez dans un instant']] as const) {
      overpassMode = m;
      const r = await render(<Outings />);
      await until(() => allText(r).includes(text));
      expect(allText(r)).toContain(text);
      expect(ids(r, 'out-marker-')).toHaveLength(0);
      overpassMode = 'ok';
      await press(r, 'out-retry', 800);
      await until(() => has(r, 'out-marker-osm:node/101'));
      expect(has(r, 'out-marker-osm:node/101')).toBe(true);
      r.unmount();
    }
  });

  it('accueil : carte gratuite visible directement avec les lieux proches', async () => {
    const r = await render(<OutingsHomeCard />);
    await until(() => has(r, 'home-outings-list'));
    expect(has(r, 'out-map')).toBe(true);
    expect(has(r, 'out-map-tile')).toBe(true);
    expect(has(r, 'out-map-unavailable')).toBe(false);
    expect(allText(r)).toContain('Aire de jeux');
    r.unmount();
  });
});
