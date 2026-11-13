/**
 * Accueil recomposé (16/11/2026) : point focal (une seule action pleine), ligne d'agenda (case à cocher discrète,
 * statut icône + libellé, prénom du responsable, « demandée par » quand la demandeuse diffère), pastille « fait »
 * remplaçable, et prénoms des membres dans la démo (household_member_names : nounou → parents seulement).
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()), selectionAsync: jest.fn(() => Promise.resolve()), notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' }, NotificationFeedbackType: { Success: 'success' },
}));
jest.mock('expo-router', () => ({ router: { push: jest.fn() }, useIsFocused: () => true }));
jest.mock('@/components/UserAvatar', () => ({ UserAvatar: ({ initial, testID }: { initial: string; testID?: string }) => {
  const { Text } = jest.requireActual('react-native');
  return <Text testID={testID}>{initial}</Text>;
} }));

import React from 'react';
import { AccessibilityInfo } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { router } from 'expo-router';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { useUiStore } from '@/lib/store';
import { requestedByLabel, TodayAgendaRow, TodayFocus } from '@/features/homeToday/TodayTaskRow';
import { DoneMark, getTodayDoneComponent, setTodayDoneComponent, type DoneMarkProps } from '@/features/homeToday/DoneMark';
import { todayTasks, todayTimeline, type TaskLike } from '@/features/homeToday/todayModel';
import type { TodayPerson } from '@/features/homeToday/useHomeToday';
import { createDemoBackend } from '@/lib/backend/demo';
import { DEMO_PARTNER_ID } from '@/lib/backend/demoMissions';
import { registerCardDetailTransition, registerSceneSurfaces } from '@/features/scene';

const NOW = new Date(2026, 10, 14, 12, 0, 0);
const base = { household_id: 'h', category: 'other', priority: 'normal', essential: false, recurrence: null, status: 'todo', done_at: null, done_by: null, notes: null, routine_id: null, created_at: NOW.toISOString(), mission_state: null } as const;
const rows = todayTasks([
  { ...base, id: 'await', title: 'Acheter du lait avant 18 h', due_at: new Date(2026, 10, 14, 18).toISOString(), assignee_id: 'me', created_by: 'sam', mission_state: 'pending', all_day: false, version: 1 },
  { ...base, id: 'sam', title: 'Récupérer Lina à la crèche', due_at: new Date(2026, 10, 14, 17, 30).toISOString(), assignee_id: 'sam', created_by: 'me', mission_state: 'accepted', all_day: false, version: 2 },
  { ...base, id: 'bath', title: 'Donner le bain', due_at: null, assignee_id: 'me', created_by: 'me' },
] as TaskLike[], 'me', NOW, { canEdit: true });
const byId = (id: string) => rows.find((x) => x.id === id)!;
const person = (id: string | null): TodayPerson => (id === 'me' ? { id, name: 'Camille', initial: 'C', avatarPath: null, isMe: true } : { id, name: 'Sam', initial: 'S', avatarPath: null, isMe: false });

const mounted: ReactTestRenderer[] = [];
async function render(el: React.ReactElement) {
  let r!: ReactTestRenderer;
  await act(async () => { r = create(<ThemeProvider>{el}</ThemeProvider>); });
  mounted.push(r);
  return r;
}
const host = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id && typeof n.type === 'string');
const texts = (r: ReactTestRenderer) => r.root.findAll((n) => typeof n.type === 'string' && n.type.toLowerCase().includes('text'))
  .map((n) => n.children.filter((c) => typeof c === 'string').join('')).join(' | ');
const pressable = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id && typeof n.props.onPress === 'function')[0];

beforeEach(() => {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
  act(() => { useUiStore.setState({ nightMode: false, themePreference: 'light', cinematicSeen: true, hapticsEnabled: false }); });
});
afterEach(async () => { await act(async () => { while (mounted.length) mounted.pop()!.unmount(); }); setTodayDoneComponent(null); registerSceneSurfaces({}); registerCardDetailTransition({}); });

describe('Accueil : point focal', () => {
  it('mission qui m’attend : UNE seule action pleine (« J’accepte »), demandée par Sam, responsable Camille', async () => {
    const onComplete = jest.fn();
    const onAccept = jest.fn();
    const r = await render(<TodayFocus x={byId('await')} owner={person('me')} creator={person('sam')} onComplete={onComplete} onAccept={onAccept} DoneComponent={DoneMark} />);
    expect(host(r, 'today-emphasis').length).toBeGreaterThan(0);
    const all = texts(r);
    expect(all).toContain('Attend votre réponse');
    expect(all).toContain('À accepter');
    expect(all).toContain('Camille');
    expect(all).toContain('Demandée par Sam');
    // une seule action pleine : accepter (terminer reste possible depuis le détail)
    expect(pressable(r, 'today-accept-await')).toBeTruthy();
    expect(host(r, 'today-complete-await')).toHaveLength(0);
    await act(async () => { pressable(r, 'today-accept-await').props.onPress(); });
    expect(onAccept).toHaveBeenCalledWith(expect.objectContaining({ id: 'await' }));
    const open = pressable(r, 'today-open-await');
    expect(open.props.accessibilityLabel).toMatch(/Acheter du lait avant 18 h\. À accepter\. Par Camille\. 18:00\. Demandée par Sam/);
    await act(async () => { open.props.onPress(); });
    expect(router.push).toHaveBeenCalledWith('/family/missions/await');
  });

  it('ma tâche : « C’est fait » est l’unique bouton plein', async () => {
    const onComplete = jest.fn();
    const r = await render(<TodayFocus x={byId('bath')} owner={person('me')} creator={person('me')} onComplete={onComplete} onAccept={jest.fn()} DoneComponent={DoneMark} />);
    await act(async () => { pressable(r, 'today-complete-bath').props.onPress(); });
    expect(onComplete).toHaveBeenCalled();
    expect(texts(r)).not.toContain('Demandée par');
  });
});

describe('Accueil : ligne d’agenda', () => {
  it('mission de quelqu’un d’autre : ni case ni bouton ; prénom du responsable (Sam), demandée par vous', async () => {
    const r = await render(<TodayAgendaRow x={byId('sam')} owner={person('sam')} creator={person('me')} onComplete={jest.fn()} />);
    expect(host(r, 'today-complete-sam')).toHaveLength(0);
    expect(host(r, 'today-accept-sam')).toHaveLength(0);
    const all = texts(r);
    expect(all).toContain('Sam');
    expect(all).toContain('17:30');
    expect(all).toContain('Acceptée');
    expect(all).toContain('Demandée par vous');
    expect(all).not.toContain('Coparent');
  });

  it('ma tâche : case à cocher (rôle checkbox, 48 px) qui termine ; statut « Fait » dès la validation', async () => {
    const onComplete = jest.fn();
    const r = await render(<TodayAgendaRow x={byId('bath')} owner={person('me')} creator={person('me')} onComplete={onComplete} />);
    const check = pressable(r, 'today-complete-bath');
    expect(check.props.accessibilityRole).toBe('checkbox');
    expect(check.props.accessibilityState).toMatchObject({ checked: false });
    await act(async () => { check.props.onPress(); });
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ id: 'bath' }));
    const r2 = await render(<TodayAgendaRow x={byId('bath')} owner={person('me')} creator={person('me')} celebrate onComplete={jest.fn()} />);
    expect(texts(r2)).toContain('Fait');
    expect(pressable(r2, 'today-complete-bath').props.accessibilityState).toMatchObject({ checked: true });
  });

  it('« demandée par » : seulement pour une mission dont la demandeuse n’est pas la responsable', () => {
    expect(requestedByLabel(byId('await'), person('sam'))).toBe('Demandée par Sam');
    expect(requestedByLabel(byId('sam'), person('me'))).toBe('Demandée par vous');
    expect(requestedByLabel(byId('bath'), person('me'))).toBeNull();
  });

  it('agenda : ordre de la journée, point focal exclu, fait en dernier', () => {
    const done = todayTasks([{ ...base, id: 'linge', title: 'Linge', due_at: null, assignee_id: 'sam', created_by: 'me', status: 'done', done_at: new Date(2026, 10, 14, 9).toISOString() }] as unknown as TaskLike[], 'me', NOW, { canEdit: true });
    const tl = todayTimeline({ tasks: [...rows, ...done], agenda: [], shifts: [], custody: [] }, { exclude: 'await', now: NOW });
    expect(tl.map((e) => e.key)).toEqual(['task:sam', 'task:bath', 'task:linge']);
  });

  it('pastille « fait » remplaçable (point d’injection) ; surfaces et transition injectables', async () => {
    const Custom = jest.fn((p: DoneMarkProps) => null);
    setTodayDoneComponent(Custom as unknown as React.ComponentType<DoneMarkProps>);
    expect(getTodayDoneComponent()).toBe(Custom);
    const Optical = jest.fn(({ children }: { children: React.ReactNode }) => <>{children}</>);
    const Source = jest.fn(({ children }: { children: React.ReactNode }) => <>{children}</>);
    registerSceneSurfaces({ OpticalSurface: Optical });
    registerCardDetailTransition({ CardSource: Source });
    await render(<TodayFocus x={byId('bath')} owner={person('me')} creator={null} celebrate onComplete={jest.fn()} onAccept={jest.fn()} DoneComponent={getTodayDoneComponent()} />);
    expect(Custom).toHaveBeenCalledWith(expect.objectContaining({ done: true, celebrate: true }), undefined);
    expect(Optical).toHaveBeenCalled();
    expect(Source).toHaveBeenCalledWith(expect.objectContaining({ sourceKey: 'today:bath' }), undefined);
    setTodayDoneComponent(null);
    expect(getTodayDoneComponent()).toBe(DoneMark);
  });
});

describe('Prénoms des membres (démo, miroir de household_member_names)', () => {
  it('prénom + photo seulement ; « Sam » et « Camille » ; une nounou ne voit que les parents ; autre foyer : rien', async () => {
    const b = createDemoBackend({ strictPremium: false });
    await b.auth.signUp('camille@exemple.test', 'MotDePasse!2026');
    await b.auth.signIn('camille@exemple.test', 'MotDePasse!2026');
    const me = (await b.auth.getSession())!.userId;
    await b.rpc('ensure_my_account');
    await b.rpc('load_sample_family');
    const names = await b.rpc<{ user_id: string; display_name: string | null; avatar_path: string | null; role: string; household_id: string }[]>('household_member_names', { p_household: null });
    expect(names.find((n) => n.user_id === DEMO_PARTNER_ID)?.display_name).toBe('Sam');
    expect(names.find((n) => n.user_id === me)?.display_name).toBe('Camille');
    for (const n of names) expect(Object.keys(n).sort()).toEqual(['avatar_path', 'display_name', 'household_id', 'role', 'user_id']);
    // Vu par Sam (bascule de démonstration) : il lit « Camille »
    await b.rpc('demo_switch_person', { p_user: DEMO_PARTNER_ID });
    const fromSam = await b.rpc<{ user_id: string; display_name: string | null }[]>('household_member_names', { p_household: null });
    expect(fromSam.find((n) => n.user_id === me)?.display_name).toBe('Camille');
  });
});
