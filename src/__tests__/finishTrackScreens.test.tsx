/**
 * Finitions du suivi (23/11/2026) — rendu réel (backend de démonstration) :
 *  · biberon chronométré : une fois arrêté, « Corriger ce biberon » mène à la fiche de la saisie à une main (même
 *    table bottles) ; la durée bue s'y corrige (début / fin recalculés) ;
 *  · mode nuit : état et durée depuis le dernier changement en grand, bouton « Lina s'endort », saisies de la nuit
 *    datées (heure en colonne fixe), une ligne ouvre sa fiche (Tray) ;
 *  · École : un devoir s'ouvre dans sa fiche (adresse « ?hw= ») et se coche par la mutation de l'app Devoirs ;
 *  · barres tactiles : le doigt choisit une barre (bulle valeur + date), un second toucher ouvre la fiche.
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
// graphique Skia de la fiche d'une sieste (non chargeable sous Jest) : remplacé par un vide
jest.mock('@/features/napLive/SkiaHost', () => ({ NapCompare: () => null }));
jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DATE: 'date', DAILY: 'daily', WEEKLY: 'weekly', TIME_INTERVAL: 'timeInterval' }, AndroidImportance: { HIGH: 4, DEFAULT: 3 },
  scheduleNotificationAsync: jest.fn(async () => 'n'), cancelScheduledNotificationAsync: jest.fn(async () => undefined), getAllScheduledNotificationsAsync: jest.fn(async () => []),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })), setNotificationHandler: jest.fn(), setNotificationChannelAsync: jest.fn(async () => null),
  setNotificationCategoryAsync: jest.fn(async () => null), getPermissionsAsync: jest.fn(async () => ({ granted: false })), getLastNotificationResponse: jest.fn(() => null),
}));
jest.mock('expo-device', () => ({ isDevice: false, modelName: 'test' }));
jest.mock('expo-linking', () => ({ createURL: (p: string) => `toietmoi://${p.replace(/^\//, '')}` }));

import React from 'react';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { backend, eq } from '@/lib/backend';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/Overlays';
import { BottleSessionCard } from '@/features/bottleSession';
import { BottleEntryTray } from '@/features/quickTrack/BottleLog';
import { SchoolTrack } from '@/features/homeTrack/SchoolTrack';
import { TouchBars } from '@/features/finishTrack/TouchBars';
import NightMode from '@/app/night';
import { mondayOf, type Homework } from '@/features/homework/domain';
import { addDays, formatTime, todayISO } from '@/lib/domain/dates';
import type { TouchBar } from '@/lib/domain/finishTrack';
import type { Child } from '@/lib/types';

jest.setTimeout(60000);
function texts(node: ReactTestInstance | string): string[] {
  if (typeof node === 'string') return [node];
  return node.children.flatMap((c) => texts(c as ReactTestInstance | string));
}
const allText = (r: ReactTestRenderer) => texts(r.root).join('\n');
const flush = async (ms = 40) => { await act(async () => { await new Promise((res) => setTimeout(res, ms)); }); };
async function until(cond: () => boolean, ms = 6000) { const end = Date.now() + ms; while (!cond() && Date.now() < end) await flush(100); }
async function render(el: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } } });
  let r!: ReactTestRenderer;
  await act(async () => { r = create(<GestureHandlerRootView><QueryClientProvider client={qc}><AuthProvider><ThemeProvider><ToastProvider>{el}</ToastProvider></ThemeProvider></AuthProvider></QueryClientProvider></GestureHandlerRootView>); });
  await flush(250);
  return r;
}
const has = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id).length > 0;
const host = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id && typeof n.type === 'string')[0];
const textOf = (r: ReactTestRenderer, id: string) => texts(host(r, id)).join('');
const pressable = (r: ReactTestRenderer, id: string) => {
  const all = r.root.findAll((n) => n.props.testID === id && typeof n.props.onPress === 'function');
  return all.find((n) => n.props.accessibilityRole === 'button') ?? all[0];
};
async function press(r: ReactTestRenderer, id: string, wait = 300) {
  const el = pressable(r, id);
  if (!el) throw new Error(`testID introuvable : ${id}`);
  await act(async () => { await el.props.onPress(); });
  await flush(wait);
}
const expoRouter = jest.requireMock('expo-router') as { router: { push: jest.Mock; setParams: jest.Mock }; __state: { params: Record<string, string> } };
const params = expoRouter.__state.params;

let lina: Child; let hid: string;
beforeAll(async () => {
  await backend.auth.signUp('finitions@exemple.test', 'MotDePasse!2026');
  const [m] = await backend.select<{ household_id: string }>({ table: 'household_members' });
  hid = m?.household_id ?? await backend.rpc<string>('create_household', { p_name: 'Test finitions' });
  [lina] = await backend.insert<Child>('children', { household_id: hid, first_name: 'Lina', sex: 'female', birth_date: addDays(todayISO(), -90), enabled_tracking: ['sleep', 'bottle', 'diaper', 'breastfeed'] });
  // parcours « bébé » actif : l'enfant est suivi (mode nuit)
  const me = (await backend.auth.getSession())!.userId;
  await backend.insert('user_journeys', { user_id: me, household_id: hid, type: 'baby', status: 'active', child_id: lina.id, started_on: lina.birth_date });
});
beforeEach(() => { for (const k of Object.keys(params)) delete params[k]; expoRouter.router.push.mockClear(); expoRouter.router.setParams.mockClear(); });

describe('biberon chronométré → même fiche de correction', () => {
  it('arrêté, « Corriger ce biberon » ouvre la fiche du biberon ; la durée bue se corrige', async () => {
    const onFix = jest.fn();
    const r = await render(<BottleSessionCard child={lina} onRecordPast={() => undefined} onFix={onFix} />);
    await press(r, 'bottle-session-primary');
    await press(r, 'bottle-session-finish');
    const consumed = r.root.findAll((n) => n.props.testID === 'bottle-recap-consumed' && typeof n.props.onChangeText === 'function')[0];
    await act(async () => { consumed.props.onChangeText('80'); });
    await press(r, 'bottle-recap-save', 400);
    const [row] = await backend.select<Record<string, unknown> & { id: string; started_at: string; ended_at: string; consumed_ml: number }>({ table: 'bottles', filters: [eq('child_id', lina.id), eq('in_progress', false)] });
    expect(row.consumed_ml).toBe(80);
    await press(r, 'bottle-session-fix');
    expect(onFix).toHaveBeenCalledWith(row.id);
    await act(async () => { r.unmount(); });

    // la fiche (celle de la saisie à une main) : durée bue affichée et corrigeable
    const t = await render(<BottleEntryTray child={lina} bottle={row as never} open onOpenChange={() => undefined} />);
    expect(has(t, 'qt-bottle-tray')).toBe(true);
    expect(allText(t)).toMatch(/Durée bue : 0 min/);
    await press(t, 'qt-bottle-tray-fix');
    expect(has(t, 'qt-bottle-edit-duration')).toBe(true);
    await press(t, 'qt-bottle-edit-dur-plus');
    await press(t, 'qt-bottle-edit-dur-plus');
    expect(textOf(t, 'qt-bottle-edit-dur')).toBe('2 min');
    // double appui verrouillé : une seule écriture
    const save = pressable(t, 'qt-bottle-edit-save');
    await act(async () => { void save.props.onPress(); void save.props.onPress(); });
    await flush(400);
    const [after] = await backend.select<{ at: string; started_at: string; ended_at: string; consumed_ml: number; paused_seconds: number | null }>({ table: 'bottles', filters: [eq('id', row.id)] });
    expect(after.started_at).toBe(after.at);
    expect(Date.parse(after.ended_at) - Date.parse(after.started_at)).toBe((120 + (after.paused_seconds ?? 0)) * 1000);
    expect(after.consumed_ml).toBe(80);
    await act(async () => { t.unmount(); });
  });
});

describe('mode nuit : patron des outils de sommeil, thème nuit gardé', () => {
  it('état et durée en grand, bouton « Lina s’endort », saisies datées qui ouvrent leur fiche', async () => {
    const now = Date.now();
    const sleepEnd = new Date(now - 90 * 60_000).toISOString();
    const [s] = await backend.insert<{ id: string }>('sleeps', { child_id: lina.id, household_id: hid, started_at: new Date(now - 5 * 3_600_000).toISOString(), ended_at: sleepEnd, kind: 'night', wakeups: 0, wake_events: [] });
    const [d] = await backend.insert<{ id: string }>('diapers', { child_id: lina.id, household_id: hid, at: new Date(now - 30 * 60_000).toISOString(), wet: true, stool: false });
    const r = await render(<NightMode />);
    await until(() => has(r, 'night-list') && has(r, `night-row-diaper-${d.id}`));
    expect(textOf(r, 'night-state')).toBe('Lina ne dort pas');
    expect(textOf(r, 'night-duration')).toMatch(/^1 h 30|^1h 30/);
    expect(textOf(r, 'night-since')).toBe(`Réveil à ${formatTime(sleepEnd)}`);
    expect(allText(r)).toContain('Lina s’endort');
    expect(allText(r)).toContain('Aucun son. La luminosité de ton téléphone n’est pas modifiée.');
    // liste datée : plus récente d'abord, heure en colonne fixe
    const rows = r.root.findAll((n) => typeof n.props.testID === 'string' && n.props.testID.startsWith('night-row-') && typeof n.props.onPress === 'function' && n.props.accessibilityRole === 'button').map((n) => n.props.testID as string);
    expect(rows.indexOf(`night-row-diaper-${d.id}`)).toBeLessThan(rows.indexOf(`night-row-sleep-${s.id}`));
    await press(r, `night-row-diaper-${d.id}`);
    expect(has(r, 'qt-diaper-tray')).toBe(true);
    await act(async () => { r.unmount(); });
  });
});

describe('École : correction directe d’un devoir', () => {
  it('« ?hw= » ouvre la fiche ; cocher « Fait » passe par la mutation de l’app Devoirs', async () => {
    const due = addDays(mondayOf(todayISO()), 2);
    const [hw] = await backend.insert<Homework>('child_homework', { household_id: hid, child_id: lina.id, subject: 'Lecture', instructions: 'Page 12', due_on: due, done_at: null, remind_eve: false });
    params.hw = hw.id;
    const r = await render(<SchoolTrack homework={[hw]} thisWeek={mondayOf(todayISO())} childName="Lina" />);
    expect(has(r, 'hm-sc-tray')).toBe(true);
    expect(allText(r)).toContain('Devoir · Lina');
    await press(r, 'hm-sc-tray-fix');
    await press(r, 'hm-sc-tray-edit-done-1');
    await press(r, 'hm-sc-tray-edit-save', 600);
    const [after] = await backend.select<Homework>({ table: 'child_homework', filters: [eq('id', hw.id)] });
    expect(after.done_at).not.toBeNull();
    expect(after.subject).toBe('Lecture');
    await act(async () => { r.unmount(); });
  });
});

describe('barres tactiles', () => {
  it('le doigt choisit une barre (bulle valeur + date) ; un second toucher sur elle ouvre sa fiche', async () => {
    const bars: TouchBar[] = [
      { id: '2026-09-01', date: '2026-09-01', value: 28, periodId: 'p1' },
      { id: '2026-09-29', date: '2026-09-29', value: 31, periodId: 'p2' },
    ];
    let selected = 1;
    const onOpen = jest.fn();
    const ui = () => <TouchBars testID="tb" title="Longueurs" bars={bars} selected={selected} onSelect={(b) => { selected = bars.indexOf(b); }}
      valueText={(b) => `${b.value} jours`} dateText={(b) => `Cycle du ${b.date}`} axisText={(b) => b.date.slice(5)} onOpen={onOpen} canOpen={(b) => !!b.periodId} />;
    const r = await render(ui());
    const plot = host(r, 'tb-plot');
    await act(async () => { plot.props.onLayout({ nativeEvent: { layout: { width: 200, height: 190 } } }); });
    expect(textOf(r, 'tb-readout')).toBe('Cycle du 2026-09-29 : 31 jours');
    expect(textOf(r, 'tb-bubble')).toBe('31 jours');
    const touch = host(r, 'tb-touch');
    // premier toucher sur la première barre : la choisit (rien ne s'ouvre)
    await act(async () => { touch.props.onResponderGrant({ nativeEvent: { locationX: 40 } }); touch.props.onResponderRelease({ nativeEvent: { locationX: 40 } }); });
    expect(selected).toBe(0);
    expect(onOpen).not.toHaveBeenCalled();
    await act(async () => { r.update(<GestureHandlerRootView><QueryClientProvider client={new QueryClient()}><AuthProvider><ThemeProvider><ToastProvider>{ui()}</ToastProvider></ThemeProvider></AuthProvider></QueryClientProvider></GestureHandlerRootView>); });
    await flush(100);
    await act(async () => { host(r, 'tb-plot').props.onLayout({ nativeEvent: { layout: { width: 200, height: 190 } } }); });
    expect(textOf(r, 'tb-bubble')).toBe('28 jours');
    // second toucher sur la barre choisie : la fiche s'ouvre
    const t2 = host(r, 'tb-touch');
    await act(async () => { t2.props.onResponderGrant({ nativeEvent: { locationX: 40 } }); t2.props.onResponderRelease({ nativeEvent: { locationX: 40 } }); });
    expect(onOpen).toHaveBeenCalledWith(bars[0]);
    await act(async () => { r.unmount(); });
  });
});
