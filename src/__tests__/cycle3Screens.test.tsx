/**
 * Rendu réel (React Native, moteur local, backend de démonstration) de « Suivre mon cycle » : accueil du cycle
 * (calendrier, favoris, carte intelligente, prochain rappel), « Ajouter aujourd'hui » jusqu'à l'enregistrement,
 * fiche d'un jour, écran de contraception d'urgence. Lancé avec le préréglage iOS et avec jest.android.config.js.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-router', () => {
  const r = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true, setParams: jest.fn() };
  const state = { params: {} as Record<string, string> };
  return { router: r, useRouter: () => r, useLocalSearchParams: () => state.params, useIsFocused: () => true, usePathname: () => '/', __state: state };
});
jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));
jest.mock('expo-image-picker', () => ({ requestMediaLibraryPermissionsAsync: jest.fn(), launchImageLibraryAsync: jest.fn() }));
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
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/Overlays';
import { CycleHome } from '@/features/cycle3/CycleHome';
import CycleEmergency from '@/app/cycle/emergency';
import { addDays, todayISO } from '@/lib/domain/dates';

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
  await flush(120);
  return r;
}
const pressable = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id && typeof n.props.onPress === 'function')[0];
async function press(r: ReactTestRenderer, id: string, wait = 120) {
  const el = pressable(r, id);
  if (!el) throw new Error(`testID introuvable : ${id}`);
  await act(async () => { await el.props.onPress(); });
  await flush(wait);
}
const has = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id).length > 0;

describe(`« Suivre mon cycle » (${Platform.OS})`, () => {
  const today = todayISO();
  beforeAll(async () => {
    await backend.auth.signUp(`cycle3.${Platform.OS}@exemple.test`, 'MotDePasse!2026');
    for (let k = 0; k < 4; k++) await backend.insert('period_entries', { start_date: addDays(today, -26 - 28 * k), end_date: addDays(today, -22 - 28 * k), flow: 'medium' });
  });

  it('accueil : calendrier, état du cycle, question des favoris, carte intelligente, prochain rappel', async () => {
    const r = await render(<CycleHome goal="cycle" />);
    expect(has(r, 'cycle-calendar')).toBe(true);
    expect(has(r, `c3-day-${today}`)).toBe(true);
    const txt = allText(r);
    expect(txt).toContain('Jour 27 du cycle');
    expect(txt).toContain('Règles estimées dans 2 jours');
    expect(txt).toContain('Que souhaites-tu suivre régulièrement ?');
    expect(has(r, 'c3-insight')).toBe(true);
    expect(txt).toContain('Aucun rappel programmé');
    // Favoris : enregistrés, puis 5 raccourcis sur l'accueil
    await press(r, 'c3-fav-save', 300);
    expect(new Set(r.root.findAll((n) => typeof n.props.testID === 'string' && n.props.testID.startsWith('c3-home-fav-')).map((n) => n.props.testID)).size).toBe(5);
    // Mois suivant
    await press(r, 'c3-next');
    expect(has(r, `c3-day-${today}`)).toBe(today.slice(0, 7) === addDays(today, 31).slice(0, 7));
    await act(async () => { r.unmount(); });
  });

  it('« Ajouter aujourd’hui » : pastilles, intensité, enregistrement et résumé du jour', async () => {
    const r = await render(<CycleHome goal="cycle" />);
    await press(r, 'c3-add-today', 200);
    await press(r, 'c3-fav-pain');
    await press(r, 'pill-cramps');
    const two = r.root.findAll((n) => n.props.accessibilityLabel === 'Intensité de la douleur 2' && typeof n.props.onPress === 'function')[0];
    await act(async () => { two.props.onPress(); });
    await press(r, 'c3-fav-sleep');
    await press(r, 'pill-difficult');
    await press(r, 'c3-save', 400);
    expect(allText(r)).toContain('Aujourd’hui, tu as noté : crampes légères et sommeil difficile.');
    const rows = await backend.select<{ logged_on: string; symptom_keys: string[]; pain_intensity: number }>({ table: 'symptom_logs' });
    expect(rows.find((x) => x.logged_on === today)).toMatchObject({ symptom_keys: ['cramps'], pain_intensity: 2 });
    await press(r, 'c3-done', 200);
    // Fiche du jour
    await press(r, `c3-day-${today}`, 200);
    expect(allText(r)).toContain('Tu as noté : crampes légères et sommeil difficile.');
    await act(async () => { r.unmount(); });
  });

  it('contraception d’urgence : délais, sources datées, gratuites', async () => {
    const r = await render(<CycleEmergency />);
    const txt = allText(r);
    expect(txt).toContain('jusqu’à 72 heures');
    expect(txt).toContain('jusqu’à 120 heures');
    expect(txt).toContain('Sources officielles');
    expect(txt).toMatch(/publié le .*vérifié le/);
    expect(txt).not.toMatch(/aucun risque|sans danger|grossesse impossible/i);
    await act(async () => { r.unmount(); });
  });
});
