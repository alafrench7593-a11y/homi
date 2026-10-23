/**
 * Ajouts du 23 octobre : rappel « vérifier s'il est réveillé » (seulement à la demande, sans doublon, reportable,
 * annulable), filtres équipements et âge de « Près de chez moi », élargissement de la recherche, temps de lecture,
 * nouveaux articles sourcés. Lancé avec le préréglage iOS et avec jest.android.config.js.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-router', () => {
  const r = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true, setParams: jest.fn() };
  return { router: r, useRouter: () => r, useLocalSearchParams: () => ({}), useIsFocused: () => true, usePathname: () => '/' };
});
jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));
const scheduled: { id: string; date: Date }[] = [];
jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DATE: 'date', DAILY: 'daily', WEEKLY: 'weekly', TIME_INTERVAL: 'timeInterval' }, AndroidImportance: { HIGH: 4, DEFAULT: 3 },
  scheduleNotificationAsync: jest.fn(async () => 'n'), cancelScheduledNotificationAsync: jest.fn(async () => undefined), getAllScheduledNotificationsAsync: jest.fn(async () => []),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => undefined),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })), setNotificationHandler: jest.fn(), setNotificationChannelAsync: jest.fn(async () => null),
  setNotificationCategoryAsync: jest.fn(async () => null), getPermissionsAsync: jest.fn(async () => ({ granted: true })), requestPermissionsAsync: jest.fn(async () => ({ granted: true })), getLastNotificationResponse: jest.fn(() => null),
}));
jest.mock('expo-device', () => ({ isDevice: false, modelName: 'test' }));
jest.mock('expo-linking', () => ({ createURL: (p: string) => `toietmoi://${p.replace(/^\//, '')}` }));
void scheduled;

import React from 'react';
import { Platform } from 'react-native';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { backend } from '@/lib/backend';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/Overlays';
import { WakeCheckReminder, wakeCheckBody, wakeCheckLink } from '@/features/sleepWakeCheck';
import { readingMinutes } from '@/features/cocoon/Cocoon';
import { hasEquipment, parseOverpass, suitsAge, widerRadius } from '@/lib/domain/nearby';
import { LIBRARY_ARTICLES } from '@/content/articles/library';
import { addDays, todayISO } from '@/lib/domain/dates';
import type { Child, Reminder } from '@/lib/types';

jest.setTimeout(30000);
function texts(node: ReactTestInstance | string): string[] {
  if (typeof node === 'string') return [node];
  return node.children.flatMap((c) => texts(c as ReactTestInstance | string));
}
const flush = async (ms = 40) => { await act(async () => { await new Promise((res) => setTimeout(res, ms)); }); };
async function render(el: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } } });
  let r!: ReactTestRenderer;
  await act(async () => { r = create(<QueryClientProvider client={qc}><AuthProvider><ThemeProvider><ToastProvider>{el}</ToastProvider></ThemeProvider></AuthProvider></QueryClientProvider>); });
  await flush(300);
  return r;
}
async function press(r: ReactTestRenderer, id: string, wait = 500) {
  const el = r.root.findAll((n) => n.props.testID === id && typeof n.props.onPress === 'function')[0];
  if (!el) throw new Error(`testID introuvable : ${id}`);
  await act(async () => { await el.props.onPress(); });
  await flush(wait);
}

describe(`rappel « vérifier s'il est réveillé » (${Platform.OS})`, () => {
  let lina: Child; let noe: Child;
  beforeAll(async () => {
    await backend.auth.signUp(`reveil.${Platform.OS}@exemple.test`, 'MotDePasse!2026');
    const [m] = await backend.select<{ household_id: string }>({ table: 'household_members' });
    const hid = m?.household_id ?? await backend.rpc<string>('create_household', { p_name: 'Test' });
    [lina] = await backend.insert<Child>('children', { household_id: hid, first_name: 'Lina', sex: 'female', birth_date: addDays(todayISO(), -245), enabled_tracking: ['sleep'] });
    [noe] = await backend.insert<Child>('children', { household_id: hid, first_name: 'Noé', sex: 'male', birth_date: addDays(todayISO(), -400), enabled_tracking: ['sleep'] });
  });
  const mine = async (c: Child) => (await backend.select<Reminder>({ table: 'reminders' })).filter((r) => r.deep_link === wakeCheckLink(c.id));

  it('texte : rappel programmé par le parent, jamais un ordre de réveiller', () => {
    expect(wakeCheckBody(lina)).toBe('Rappel que vous avez programmé : vérifier si Lina est réveillée.');
    expect(wakeCheckBody(noe)).toBe('Rappel que vous avez programmé : vérifier si Noé est réveillé.');
    expect(wakeCheckBody(lina)).not.toMatch(/réveillez|il faut le réveiller/i);
  });
  it('aucun rappel par défaut ; programmé à la demande, un seul par enfant, reportable et annulable', async () => {
    const r = await render(<WakeCheckReminder child={lina} />);
    expect(await mine(lina)).toHaveLength(0);
    await press(r, 'wake-check-45');
    let list = await mine(lina);
    expect(list).toHaveLength(1);
    const at = new Date((list[0].schedule as { at: string }).at).getTime();
    expect(Math.round((at - Date.now()) / 60000)).toBeGreaterThanOrEqual(44);
    expect(list[0]).toMatchObject({ child_id: lina.id, category: 'tracking', body: wakeCheckBody(lina) });
    expect(texts(r.root).join(' ')).toMatch(/Rappel de vérification programmé à/);
    await press(r, 'wake-check-snooze');
    list = await mine(lina);
    expect(list).toHaveLength(1); // remplacé, jamais doublé
    expect(new Date((list[0].schedule as { at: string }).at).getTime()).toBeGreaterThan(at + 14 * 60000);
    expect(await mine(noe)).toHaveLength(0); // Noé n'est pas concerné
    await press(r, 'wake-check-cancel');
    expect(await mine(lina)).toHaveLength(0);
    r.unmount();
  });
});

describe('Près de chez moi : équipements confirmés, âge, élargir', () => {
  const [cafe, park, bare] = parseOverpass({ elements: [
    { type: 'node', id: 1, lat: 45.7, lon: 4.8, tags: { amenity: 'cafe', name: 'Café', highchair: 'yes', changing_table: 'yes', wheelchair: 'limited' } },
    { type: 'node', id: 2, lat: 45.7, lon: 4.8, tags: { leisure: 'playground', name: 'Aire 2-8 ans', min_age: '2', max_age: '8' } },
    { type: 'node', id: 3, lat: 45.7, lon: 4.8, tags: { leisure: 'park', name: 'Parc' } },
  ] }, '2026-10-23');
  it('un équipement ne passe le filtre que s’il est renseigné « oui »', () => {
    expect(cafe).toMatchObject({ highchair: true, changingTable: true });
    expect(hasEquipment(cafe, 'highchair')).toBe(true);
    expect(hasEquipment(cafe, 'wheelchair')).toBe(false); // « partiel » n'est pas « oui »
    expect(hasEquipment(bare, 'changing_table')).toBe(false); // jamais supposé
  });
  it('âge : seuls les âges renseignés qui ne conviennent pas écartent un lieu', () => {
    expect(park).toMatchObject({ minAge: 2, maxAge: 8 });
    expect(suitsAge(park, 1)).toBe(false);
    expect(suitsAge(park, 4)).toBe(true);
    expect(suitsAge(park, 9)).toBe(false);
    expect(suitsAge(bare, 1)).toBe(true);
    expect(suitsAge(park, null)).toBe(true);
  });
  it('élargir la recherche jusqu’à 10 km, puis plus rien à élargir', () => {
    expect([1000, 2000, 5000, 10000].map(widerRadius)).toEqual([2000, 5000, 10000, null]);
  });
});

describe('articles', () => {
  const NEW = ['regurgitations-et-reflux-du-nourrisson', 'constipation-bebe-et-enfant', 'peau-de-bebe-et-fesses-rouges', 'accouchement-voie-basse-deroulement', 'arrivee-d-un-nouvel-enfant-et-l-aine', 'regles-douloureuses-quand-consulter'];
  it('nouveaux articles : sourcés, datés, « à vérifier », sans formule rassurante abusive', () => {
    for (const slug of NEW) {
      const a = LIBRARY_ARTICLES.find((x) => x.slug === slug)!;
      expect(a).toBeTruthy();
      expect(a.status).toBe('to_review');
      expect(a.sources.length).toBeGreaterThan(0);
      for (const s of a.sources) { expect(s.url).toMatch(/^https:\/\/(www\.)?(ameli\.fr|sante\.fr|has-sante\.fr)\//); expect(s.consulted_on).toBe('2026-10-23'); }
      expect(a.body_md).not.toMatch(/c[’']est normal|aucun danger|pas besoin de consulter|inutile de consulter|validé par un professionnel/i);
    }
    expect(new Set(LIBRARY_ARTICLES.map((a) => a.slug)).size).toBe(LIBRARY_ARTICLES.length);
  });
  it('sécurité : les signes d’urgence renvoient au 15', () => {
    for (const slug of ['regurgitations-et-reflux-du-nourrisson', 'constipation-bebe-et-enfant', 'regles-douloureuses-quand-consulter']) {
      expect(LIBRARY_ARTICLES.find((x) => x.slug === slug)!.body_md).toMatch(/15/);
    }
  });
  it('temps de lecture : environ 200 mots par minute, jamais zéro', () => {
    expect(readingMinutes('mot '.repeat(1000))).toBe(5);
    expect(readingMinutes('court')).toBe(1);
  });
});
