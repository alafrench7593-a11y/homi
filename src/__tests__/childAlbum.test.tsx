/**
 * Album photo par enfant : règles pures (chemin, légende, date, compression, chronologie) puis rendu réel
 * avec le backend de démonstration : ajout depuis l'appareil photo (simulé), date, légende, visibilité,
 * chronologie par mois, modification, suppression du fichier et de la ligne, albums de deux enfants séparés.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-router', () => {
  const r = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true, setParams: jest.fn() };
  const state = { params: {} as Record<string, string> };
  return { router: r, useRouter: () => r, useLocalSearchParams: () => state.params, useIsFocused: () => true, usePathname: () => '/', useNavigation: () => ({ setOptions: jest.fn(), addListener: () => () => undefined }), __state: state };
});
jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(async () => ({ granted: true })),
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ granted: true })),
  launchCameraAsync: jest.fn(async () => ({ canceled: false, assets: [{ uri: 'file:///tmp/prise.jpg' }] })),
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true, assets: [] })),
}));
jest.mock('expo-image-manipulator', () => ({
  SaveFormat: { JPEG: 'jpeg' },
  manipulateAsync: jest.fn(async (uri: string, actions: { resize?: { width: number } }[]) => (actions.length
    ? { uri: 'file:///tmp/compressee.jpg', width: actions[0].resize!.width, height: Math.round(actions[0].resize!.width * 2 / 3) }
    : { uri: 'file:///tmp/sonde.jpg', width: 4032, height: 2688 })),
}));
jest.mock('expo-file-system', () => ({
  Paths: { cache: '/tmp' },
  File: class { uri: string; constructor(uri: string) { this.uri = uri; } get exists() { return true; } get size() { return 420_000; } delete() { (globalThis as { __deleted?: string[] }).__deleted?.push(this.uri); } },
}));
jest.mock('expo-local-authentication', () => ({ hasHardwareAsync: jest.fn(async () => false), isEnrolledAsync: jest.fn(async () => false), authenticateAsync: jest.fn(async () => ({ success: true })) }));
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
import { eq } from '@/lib/backend/types';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/Overlays';
import ChildAlbum from '@/app/child/[id]/album';
import { removeChildPhotoFiles } from '@/lib/data/hooks-photos';
import { addDays, todayISO } from '@/lib/domain/dates';
import {
  ageInMonthsOn, childPhotoPath, cleanCaption, fitWithin, groupByMonth, validTakenOn, CAPTION_MAX, CHILD_PHOTO_BUCKET,
  type ChildPhoto,
} from '@/lib/domain/childPhotos';
import type { Child } from '@/lib/types';

jest.setTimeout(40000);

const H = '0e0f0000-0000-4000-8000-000000000001';
const K = '0e0f0000-0000-4000-8000-000000000002';
const P = '0e0f0000-0000-4000-8000-000000000003';

describe('album : règles', () => {
  it('chemin privé <foyer>/<enfant>/<photo>.jpg, identifiants vérifiés', () => {
    expect(childPhotoPath(H, K, P)).toBe(`${H}/${K}/${P}.jpg`);
    expect(() => childPhotoPath('../autre', K, P)).toThrow();
    expect(() => childPhotoPath(H, K, 'x/y')).toThrow();
  });
  it('légende : espaces nettoyés, vide → aucune, 500 caractères au plus', () => {
    expect(cleanCaption('  Premier   sourire ')).toEqual({ ok: true, value: 'Premier sourire' });
    expect(cleanCaption('   ')).toEqual({ ok: true, value: null });
    expect(cleanCaption('x'.repeat(CAPTION_MAX + 1))).toEqual({ ok: false, error: 'too_long' });
  });
  it('date : jamais dans le futur, pas plus d’un an avant la naissance', () => {
    expect(validTakenOn('2026-10-01', '2026-03-01', '2026-10-28')).toBe(true);
    expect(validTakenOn('2026-10-29', '2026-03-01', '2026-10-28')).toBe(false);
    expect(validTakenOn('2025-01-01', '2026-03-01', '2026-10-28')).toBe(false);
    expect(validTakenOn('2025-12-01', '2026-03-01', '2026-10-28')).toBe(true); // échographie, grossesse
    expect(validTakenOn('2026-02-31', '2026-01-01', '2026-10-28')).toBe(false);
    expect(validTakenOn('01/10/2026', '2026-01-01', '2026-10-28')).toBe(false);
  });
  it('compression : le plus long côté ramené à 1 600 px, jamais agrandi', () => {
    expect(fitWithin(4032, 3024)).toEqual({ width: 1600, height: 1200 });
    expect(fitWithin(3024, 4032)).toEqual({ width: 1200, height: 1600 });
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
  });
  it('chronologie : mois du plus récent au plus ancien', () => {
    const p = (taken_on: string, created_at = '2026-10-01T00:00:00Z') => ({ taken_on, created_at });
    const g = groupByMonth([p('2026-08-03'), p('2026-10-02'), p('2026-10-20'), p('2026-08-30')]);
    expect(g.map((x) => x.key)).toEqual(['2026-10', '2026-08']);
    expect(g[0].items.map((x) => x.taken_on)).toEqual(['2026-10-20', '2026-10-02']);
  });
  it('âge sur la photo en mois révolus', () => {
    expect(ageInMonthsOn('2026-01-15', '2026-04-14')).toBe(2);
    expect(ageInMonthsOn('2026-01-15', '2026-04-15')).toBe(3);
    expect(ageInMonthsOn('2026-01-15', '2025-12-01')).toBeNull();
  });
});

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
async function until(cond: () => boolean, ms = 5000) {
  const end = Date.now() + ms;
  while (!cond() && Date.now() < end) await flush(100);
}
const has = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id).length > 0;
async function press(r: ReactTestRenderer, id: string, wait = 400) {
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
const params = (jest.requireMock('expo-router') as { __state: { params: Record<string, string> } }).__state.params;

describe(`album : écran (${Platform.OS})`, () => {
  let lou: Child; let sacha: Child;
  beforeAll(async () => {
    (globalThis as { __deleted?: string[] }).__deleted = [];
    await backend.auth.signUp(`album.${Platform.OS}@exemple.test`, 'MotDePasse!2026');
    const [m] = await backend.select<{ household_id: string }>({ table: 'household_members' });
    const hid = m?.household_id ?? await backend.rpc<string>('create_household', { p_name: 'Test' });
    [lou] = await backend.insert<Child>('children', { household_id: hid, first_name: 'Lou', sex: 'female', birth_date: addDays(todayISO(), -300), enabled_tracking: ['meal'] });
    [sacha] = await backend.insert<Child>('children', { household_id: hid, first_name: 'Sacha', sex: 'male', birth_date: addDays(todayISO(), -1500), enabled_tracking: ['meal'] });
  });

  it('album vide : message clair et boutons d’ajout', async () => {
    params.id = lou.id;
    const r = await render(<ChildAlbum />);
    await until(() => allText(r).includes('Aucune photo pour l’instant'));
    expect(allText(r)).toContain('Aucune photo pour l’instant');
    expect(allText(r)).toContain('jamais publiées');
    expect(has(r, 'album-camera')).toBe(true);
  });

  it('ajout : photo compressée, date, légende, visibilité, enregistrée pour cet enfant seulement', async () => {
    params.id = lou.id;
    const r = await render(<ChildAlbum />);
    await until(() => has(r, 'album-camera'));
    await press(r, 'album-camera');
    await until(() => has(r, 'album-save'));
    await type(r, 'album-date', 'pas une date');
    await press(r, 'album-save');
    expect(allText(r)).toContain('Date invalide');
    const day = addDays(todayISO(), -3);
    const [y, mo, d] = day.split('-');
    await type(r, 'album-date', `${d}/${mo}/${y}`);
    await type(r, 'album-caption', '  Premier   sourire ');
    await press(r, 'album-save', 800);
    const rows = await backend.select<ChildPhoto>({ table: 'child_photos', filters: [eq('child_id', lou.id)] });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ taken_on: day, caption: 'Premier sourire', visibility: 'household', width: 1600, height: 1067 });
    expect(rows[0].storage_path).toBe(`${lou.household_id}/${lou.id}/${rows[0].id}.jpg`);
    expect(await backend.storage.signedUrl(CHILD_PHOTO_BUCKET, rows[0].storage_path, 60)).toBe('file:///tmp/compressee.jpg');
    // fichiers temporaires du téléphone effacés après l'envoi
    expect((globalThis as { __deleted?: string[] }).__deleted).toEqual(expect.arrayContaining(['file:///tmp/sonde.jpg', 'file:///tmp/compressee.jpg', 'file:///tmp/prise.jpg']));
    await until(() => has(r, `album-month-${day.slice(0, 7)}`));
    expect(has(r, `album-month-${day.slice(0, 7)}`)).toBe(true);
    expect(await backend.select({ table: 'child_photos', filters: [eq('child_id', sacha.id)] })).toHaveLength(0);
  });

  it('l’album de Sacha ne montre pas les photos de Lou', async () => {
    params.id = sacha.id;
    const r = await render(<ChildAlbum />);
    await until(() => allText(r).includes('Aucune photo pour l’instant'));
    expect(allText(r)).toContain('Aucune photo pour l’instant');
  });

  it('modification (photo privée signalée) puis suppression du profil : fichiers de l’album effacés', async () => {
    const [photo] = await backend.select<ChildPhoto>({ table: 'child_photos', filters: [eq('child_id', lou.id)] });
    await backend.update('child_photos', { caption: 'Au parc', visibility: 'private' }, [eq('id', photo.id)]);
    const [after] = await backend.select<ChildPhoto>({ table: 'child_photos', filters: [eq('id', photo.id)] });
    expect(after).toMatchObject({ caption: 'Au parc', visibility: 'private' });
    params.id = lou.id;
    const r = await render(<ChildAlbum />);
    await until(() => allText(r).includes('Moi seulement'));
    expect(allText(r)).toContain('Moi seulement');
    await removeChildPhotoFiles(lou.id);
    expect(await backend.storage.signedUrl(CHILD_PHOTO_BUCKET, photo.storage_path, 60)).toBe('');
  });
});
