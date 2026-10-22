/**
 * Rendu réel (backend de démonstration) des écrans de grossesse : « Comment je me sens aujourd'hui ? »
 * (enregistrer, carte adaptée, sécurité, modifier, supprimer), calendrier de grossesse (trois fenêtres datées,
 * ajout du véritable rendez-vous, rappels), « Bien manger enceinte » (recettes, filtres, repères, sources).
 * Lancé avec le préréglage iOS et avec jest.android.config.js.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-router', () => {
  const r = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true, setParams: jest.fn() };
  const state = { params: {} as Record<string, string> };
  return { router: r, useRouter: () => r, useLocalSearchParams: () => state.params, useIsFocused: () => true, usePathname: () => '/', useNavigation: () => ({ setOptions: jest.fn(), addListener: () => () => undefined }), __state: state };
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
import { Alert, Platform } from 'react-native';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { backend } from '@/lib/backend';
import { eq } from '@/lib/backend/types';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/Overlays';
import Feel from '@/app/pregnancy/feel';
import Calendar from '@/app/pregnancy/calendar';
import Eat from '@/app/pregnancy/eat';
import { addDays, todayISO } from '@/lib/domain/dates';
import { ultrasoundWindows } from '@/lib/domain/pregnancyCare';
import { dueDateFromLmp } from '@/lib/domain/pregnancy';

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
  await flush(250);
  return r;
}
const ids = (r: ReactTestRenderer, prefix: string) => [...new Set(r.root.findAll((n) => typeof n.props.testID === 'string' && n.props.testID.startsWith(prefix)).map((n) => n.props.testID as string))];
const pressable = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id && typeof n.props.onPress === 'function')[0];
async function press(r: ReactTestRenderer, id: string, wait = 250) {
  const el = pressable(r, id);
  if (!el) throw new Error(`testID introuvable : ${id}`);
  await act(async () => { await el.props.onPress(); });
  await flush(wait);
}
async function type(r: ReactTestRenderer, id: string, v: string) {
  const el = r.root.findAll((n) => n.props.testID === id && typeof n.props.onChangeText === 'function')[0];
  if (!el) throw new Error(`champ introuvable : ${id}`);
  await act(async () => { el.props.onChangeText(v); });
}
const fr = (iso: string) => iso.split('-').reverse().join('/');

jest.setTimeout(30000);

describe(`grossesse (${Platform.OS})`, () => {
  const today = todayISO();
  const lmp = addDays(today, -9 * 7); // 9 SA
  let due = '';
  let pid = '';
  beforeAll(async () => {
    await backend.auth.signUp(`grossesse.${Platform.OS}@exemple.test`, 'MotDePasse!2026');
    const me = (await backend.auth.getSession())!.userId;
    const [m] = await backend.select<{ household_id: string }>({ table: 'household_members' });
    const hid = m?.household_id ?? await backend.rpc<string>('create_household', { p_name: 'Test' });
    due = dueDateFromLmp(lmp); // terme français : 41 SA
    const [p] = await backend.insert<{ id: string }>('pregnancies', { household_id: hid, carrier_user_id: me, status: 'active', due_date: due, lmp_date: lmp, due_date_source: 'lmp', multiplicity: 'single', topics: [] });
    pid = p.id;
    await backend.insert('user_journeys', { user_id: me, household_id: hid, type: 'pregnancy', status: 'active', pregnancy_id: pid, started_on: lmp });
  });

  it('« Comment je me sens » : enregistrer, carte adaptée à la semaine, sécurité, modifier, supprimer', async () => {
    const r = await render(<Feel />);
    expect(ids(r, 'feel-sym-')).toContain('feel-sym-nausea');
    expect(ids(r, 'feel-sym-')).not.toContain('feel-sym-movements'); // 9 SA
    await press(r, 'feel-sym-nausea');
    await press(r, 'feel-intensity-1');
    await type(r, 'feel-time', '07:30');
    await press(r, 'feel-freq-several');
    await type(r, 'feel-note', 'Le matin surtout');
    await press(r, 'feel-save', 400);
    expect(ids(r, 'feel-card-')).toContain('feel-card-nausea');
    let t = allText(r);
    for (const x of ['Fréquent à ce stade ?', 'Ce qui peut parfois aider', 'Quand demander conseil']) expect(t).toContain(x);
    expect(t).toContain('Ce symptôme peut être fréquent à ce stade, mais d’autres causes sont possibles.');
    expect(t).not.toMatch(/c[’']est normal|aucun danger|inutile de consulter|sans risque/i);
    const logs = await backend.select<{ id: string; symptom: string; intensity: number; note: string; week_sa: number }>({ table: 'pregnancy_symptom_logs' });
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ symptom: 'nausea', intensity: 1, note: 'Le matin surtout', week_sa: 9 });
    expect(t).toContain('Le matin surtout');
    // saignement important : informations de sécurité et contacts
    await press(r, 'feel-another');
    await press(r, 'feel-sym-bleeding');
    await press(r, 'feel-intensity-3');
    await press(r, 'feel-save', 400);
    t = allText(r);
    expect(ids(r, 'feel-safety-')).toEqual(['feel-safety-emergency']);
    expect(t).toMatch(/15|112/);
    // modifier puis supprimer
    const id = logs[0].id;
    await press(r, `feel-edit-${id}`);
    await press(r, 'feel-intensity-2');
    await press(r, 'feel-save', 400);
    const [edited] = await backend.select<{ intensity: number }>({ table: 'pregnancy_symptom_logs', filters: [eq('id', id)] });
    expect(edited.intensity).toBe(2);
    // suppression : confirmation demandée (boîte native), puis acceptée
    const alert = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => { buttons?.[buttons.length - 1]?.onPress?.(); });
    await press(r, `feel-delete-${id}`, 400);
    expect(alert).toHaveBeenCalledTimes(1);
    alert.mockRestore();
    expect(await backend.select({ table: 'pregnancy_symptom_logs', filters: [eq('id', id)] })).toHaveLength(0);
    r.unmount();
  });

  it('calendrier : trois périodes indicatives datées, véritable rendez-vous ajouté sans heure ni lieu inventés, rappels', async () => {
    const r = await render(<Calendar />);
    const t = allText(r);
    expect(ids(r, 'echo-echo_')).toEqual(expect.arrayContaining(['echo-echo_1', 'echo-echo_2', 'echo-echo_3']));
    expect(t).toContain('Période indicative');
    expect(t).toContain('À confirmer avec votre sage-femme ou votre médecin');
    expect(t).toContain('Ajouter mon véritable rendez-vous');
    expect(t).toMatch(/9 SA/);
    const [w1] = ultrasoundWindows(due);
    await press(r, 'echo-add-echo_1');
    expect(ids(r, 'care-appt-sheet')).toHaveLength(1);
    const day = addDays(w1.from, 3);
    await type(r, 'care-appt-day', fr(day));
    await press(r, 'care-appt-save', 400);
    const appts = await backend.select<{ starts_at: string; time_set: boolean; location: string | null; calendar_keys: string[]; pregnancy_id: string }>({ table: 'appointments', filters: [eq('pregnancy_id', pid)] });
    expect(appts).toHaveLength(1);
    expect(appts[0]).toMatchObject({ time_set: false, calendar_keys: ['echo_1'] });
    expect(appts[0].location ?? null).toBeNull();
    expect(ids(r, 'echo-appt-echo_1')).toHaveLength(1);
    // rappels de la 2e échographie : un mois, deux semaines, une semaine avant — toujours gratuits, même après
    // la limite de 5 rappels personnels de la version gratuite
    const me = (await backend.auth.getSession())!.userId;
    for (let i = 0; i < 5; i++) await backend.insert('reminders', { user_id: me, category: 'custom', title: `Perso ${i}`, schedule: { type: 'daily', hour: 9, minute: 0 }, enabled: true, journey_type: 'pregnancy' });
    await expect(backend.insert('reminders', { user_id: me, category: 'custom', title: 'Perso 6', schedule: { type: 'daily', hour: 9, minute: 0 }, enabled: true, journey_type: 'pregnancy' })).rejects.toThrow(/Limite/);
    await press(r, 'echo-remind-echo_2');
    await press(r, 'care-rem-month'); await press(r, 'care-rem-week');
    await press(r, 'care-rem-save', 400);
    const rems = await backend.select<{ deep_link: string; schedule: { type: string; at?: string } }>({ table: 'reminders' });
    const mine = rems.filter((x) => x.deep_link?.startsWith('/pregnancy/calendar'));
    expect(mine.length).toBeGreaterThanOrEqual(1);
    for (const m of mine) expect(new Date(m.schedule.at ?? 0).getTime()).toBeGreaterThan(Date.now());
    r.unmount();
  });

  it('« Bien manger enceinte » : recettes compatibles, filtres, repères, aucun complément recommandé', async () => {
    const r = await render(<Eat />);
    await flush(400);
    const t = allText(r);
    expect(t).toContain('Bien manger enceinte');
    expect(t).toMatch(/ne recommande aucun complément/);
    for (const x of ['Fer', 'Calcium', 'Protéines', 'Fibres', 'B9']) expect(t).toContain(x);
    expect(ids(r, 'eat-list').length + ids(r, 'eat-empty').length).toBe(1);
    await press(r, 'eat-need-nausea');
    await press(r, 'eat-section-avoid');
    expect(allText(r)).toMatch(/Alcool/);
    expect(allText(r)).toMatch(/ameli|sante\.fr|Santé/i);
    r.unmount();
  });
});
