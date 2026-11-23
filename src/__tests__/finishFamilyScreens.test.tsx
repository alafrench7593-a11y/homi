/**
 * Famille et couple, fin du suivi (23/11/2026) — rendu réel avec le backend de démonstration :
 *  · charge mentale : la tâche ouverte dans l'adresse s'ouvre dans sa fiche ; « Changer qui la porte » : valeur
 *    provisoire, Annuler restitue, Enregistrer écrit (une seule fois malgré le double appui) ;
 *  · le domaine ouvert dans l'adresse se corrige dans la même fiche que « Domaines » ;
 *  · je décroche : la fin de MA pause en cours se corrige, mes rappels en pause suivent ;
 *  · un membre sans droit d'édition lit la fiche, sans bouton de correction.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-router', () => {
  const r = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true, setParams: jest.fn() };
  const state = { params: {} as Record<string, string> };
  return { router: r, useRouter: () => r, useLocalSearchParams: () => state.params, useIsFocused: () => true, usePathname: () => '/', useNavigation: () => ({ setOptions: jest.fn(), addListener: () => () => undefined }), __state: state };
});
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DATE: 'date', DAILY: 'daily', WEEKLY: 'weekly', TIME_INTERVAL: 'timeInterval' }, AndroidImportance: { HIGH: 4, DEFAULT: 3 },
  scheduleNotificationAsync: jest.fn(async () => 'n'), cancelScheduledNotificationAsync: jest.fn(async () => undefined), getAllScheduledNotificationsAsync: jest.fn(async () => []),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })), setNotificationHandler: jest.fn(), setNotificationChannelAsync: jest.fn(async () => null),
  setNotificationCategoryAsync: jest.fn(async () => null), getPermissionsAsync: jest.fn(async () => ({ granted: false })), requestPermissionsAsync: jest.fn(async () => ({ granted: false })), getLastNotificationResponse: jest.fn(() => null),
}));
jest.mock('expo-device', () => ({ isDevice: false, modelName: 'test' }));
jest.mock('expo-linking', () => ({ createURL: (p: string) => `toietmoi://${p.replace(/^\//, '')}` }));

import React from 'react';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { backend } from '@/lib/backend';
import { eq } from '@/lib/backend/types';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/Overlays';
import MentalLoad from '@/app/family/load';
import OffDuty from '@/app/family/offduty';
import { TaskCarrierTray } from '@/features/finishFamily/shared';
import { hmText, minutesOf } from '@/lib/domain/homeTrack';
import type { FamilyTask } from '@/lib/domain/familyLoad';

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
  await act(async () => { r = create(<GestureHandlerRootView><QueryClientProvider client={qc}><AuthProvider><ThemeProvider><ToastProvider>{el}</ToastProvider></ThemeProvider></AuthProvider></QueryClientProvider></GestureHandlerRootView>); });
  await flush(300);
  return r;
}
async function until(r: ReactTestRenderer, cond: () => boolean, ms = 6000) { const end = Date.now() + ms; while (!cond() && Date.now() < end) await flush(100); }
const has = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id).length > 0;
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
const params = (jest.requireMock('expo-router') as { __state: { params: Record<string, string> } }).__state.params;
const setParams = (jest.requireMock('expo-router') as { router: { setParams: jest.Mock } }).router.setParams;

describe('famille et couple : fiches de correction', () => {
  let hid = ''; let me = ''; let task!: FamilyTask;
  beforeAll(async () => {
    await backend.auth.signUp('famille.fin@exemple.test', 'MotDePasse!2026');
    me = (await backend.auth.getSession())!.userId;
    const [m] = await backend.select<{ household_id: string }>({ table: 'household_members' });
    hid = m?.household_id ?? await backend.rpc<string>('create_household', { p_name: 'Test famille' });
    [task] = await backend.insert<FamilyTask>('family_tasks', { household_id: hid, title: 'Prendre rendez-vous pédiatre', category: 'health', assignee_id: me, status: 'todo', priority: 'normal', essential: false, recurrence: null, notes: null, due_at: null });
  });
  beforeEach(() => { for (const k of Object.keys(params)) delete params[k]; setParams.mockClear(); });

  it('charge mentale : tâche ouverte dans l’adresse, porteur changé dans la fiche (Annuler, puis Enregistrer une fois)', async () => {
    params.task = task.id;
    const r = await render(<MentalLoad />);
    await until(r, () => has(r, 'ff-load-tray'));
    expect(has(r, `ff-load-task-${task.id}`)).toBe(true);
    expect(allText(r)).toContain('Prendre rendez-vous pédiatre');
    await press(r, 'ff-load-tray-fix');
    // seul adulte du foyer : choix 0 = moi, 1 = « Personne »
    await press(r, 'ff-load-tray-edit-who-1');
    expect(has(r, 'ff-load-tray-edit-provisional')).toBe(true);
    await press(r, 'ff-load-tray-edit-cancel');
    expect(has(r, 'ff-load-tray-edit-provisional')).toBe(false);
    let [row] = await backend.select<FamilyTask>({ table: 'family_tasks', filters: [eq('id', task.id)] });
    expect(row.assignee_id).toBe(me); // Annuler n'écrit rien
    await press(r, 'ff-load-tray-fix');
    await press(r, 'ff-load-tray-edit-who-1');
    const save = pressable(r, 'ff-load-tray-edit-save');
    // double appui : le second est absorbé (une seule écriture, la version n'avance que d'un cran)
    await act(async () => { save.props.onPress(); save.props.onPress(); });
    await flush(150);
    expect(r.root.findAll((n) => n.props.testID === 'ff-load-tray-edit-save' && n.props.disabled === true).length).toBeGreaterThan(0);
    await flush(600);
    [row] = await backend.select<FamilyTask>({ table: 'family_tasks', filters: [eq('id', task.id)] });
    expect(row.assignee_id).toBeNull();
    if (typeof task.version === 'number') expect(row.version).toBe(task.version + 1);
    act(() => r.unmount());
    await flush(200);
  });

  it('charge mentale : le domaine ouvert dans l’adresse change de porteur dans sa fiche', async () => {
    params.domain = 'health';
    const r = await render(<MentalLoad />);
    await until(r, () => has(r, 'ff-load-dom-tray'));
    await press(r, 'ff-load-dom-tray-fix');
    await press(r, 'ff-load-dom-tray-edit-who-0');
    await press(r, 'ff-load-dom-tray-edit-save', 600);
    const [d] = await backend.select<{ owner_id: string | null }>({ table: 'family_domains', filters: [eq('household_id', hid), eq('key', 'health')] });
    expect(d.owner_id).toBe(me);
    act(() => r.unmount());
    await flush(200);
  });

  it('sans droit d’édition : la fiche se lit, aucun bouton de correction', async () => {
    const r = await render(<TaskCarrierTray task={task} onClose={() => undefined} people={[]} labelOf={() => 'Vous'} canEdit={false} testID="ro-tray" />);
    await until(r, () => has(r, 'ro-tray'));
    expect(has(r, 'ro-tray-hero')).toBe(true);
    expect(has(r, 'ro-tray-fix')).toBe(false);
    expect(allText(r)).toContain('Lecture seule');
    act(() => r.unmount());
    await flush(200);
  });

  it('je décroche : la fin de ma pause en cours se corrige ; mes rappels en pause suivent', async () => {
    const ends = new Date(Date.now() + 2 * 3600_000).toISOString();
    const [p] = await backend.insert<{ id: string; ends_at: string }>('offduty_periods', { household_id: hid, user_id: me, starts_at: new Date(Date.now() - 60_000).toISOString(), ends_at: ends, relay_to: null });
    const [rem] = await backend.insert<{ id: string }>('reminders', { user_id: me, category: 'custom', title: 'Arroser', body: null, schedule: { type: 'daily', time: '09:00' }, timezone: 'Europe/Paris', enabled: true, snoozed_until: ends, deep_link: null });
    params.pause = p.id;
    const r = await render(<OffDuty />);
    await until(r, () => has(r, 'ff-off-tray'));
    expect(has(r, `ff-off-row-${p.id}`)).toBe(true);
    const next = hmText(minutesOf(new Date(Date.now() + 3 * 3600_000).toISOString()));
    await press(r, 'ff-off-tray-fix');
    await type(r, 'ff-off-tray-edit-end', next);
    await press(r, 'ff-off-tray-edit-save', 800);
    const [after] = await backend.select<{ ends_at: string }>({ table: 'offduty_periods', filters: [eq('id', p.id)] });
    expect(hmText(minutesOf(after.ends_at))).toBe(next);
    const [r2] = await backend.select<{ snoozed_until: string }>({ table: 'reminders', filters: [eq('id', rem.id)] });
    expect(r2.snoozed_until).toBe(after.ends_at);
    act(() => r.unmount());
    await flush(200);
  });
});
