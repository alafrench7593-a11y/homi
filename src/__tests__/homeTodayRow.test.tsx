/**
 * Ligne « Aujourd'hui dans le foyer » : statut annoncé (libellé, pas seulement la couleur), responsable nommé,
 * bouton « C'est terminé » seulement pour ce que je peux terminer, mise en avant, pastille « fait » remplaçable.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()), selectionAsync: jest.fn(() => Promise.resolve()), notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' }, NotificationFeedbackType: { Success: 'success' },
}));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
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
import { TodayTaskRow } from '@/features/homeToday/TodayTaskRow';
import { DoneMark, getTodayDoneComponent, setTodayDoneComponent, type DoneMarkProps } from '@/features/homeToday/DoneMark';
import { todayTasks, type TaskLike } from '@/features/homeToday/todayModel';
import type { TodayPerson } from '@/features/homeToday/useHomeToday';

const NOW = new Date(2026, 10, 14, 12, 0, 0);
const base = { household_id: 'h', category: 'other', priority: 'normal', essential: false, recurrence: null, status: 'todo', done_at: null, done_by: null, notes: null, routine_id: null, created_at: NOW.toISOString(), mission_state: null } as const;
const rows = todayTasks([
  { ...base, id: 'await', title: 'Acheter du lait avant 18 h', due_at: new Date(2026, 10, 14, 18).toISOString(), assignee_id: 'me', created_by: 'sam', mission_state: 'pending', all_day: false, version: 1 },
  { ...base, id: 'sam', title: 'Récupérer Lina à la crèche', due_at: new Date(2026, 10, 14, 17, 30).toISOString(), assignee_id: 'sam', created_by: 'me', mission_state: 'accepted', all_day: false, version: 2 },
  { ...base, id: 'bath', title: 'Donner le bain', due_at: null, assignee_id: 'me', created_by: 'me' },
] as TaskLike[], 'me', NOW, { canEdit: true });
const byId = (id: string) => rows.find((x) => x.id === id)!;
const person = (id: string | null): TodayPerson => (id === 'me' ? { id, name: 'Camille', initial: 'C', avatarPath: null, isMe: true } : { id, name: 'Co-parent', initial: 'C', avatarPath: null, isMe: false });

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

beforeEach(() => {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
  act(() => { useUiStore.setState({ nightMode: false, themePreference: 'light', cinematicSeen: true, hapticsEnabled: false }); });
});
afterEach(async () => { await act(async () => { while (mounted.length) mounted.pop()!.unmount(); }); setTodayDoneComponent(null); });

describe('TodayTaskRow', () => {
  it('mission qui m’attend : mise en avant, statut en toutes lettres, « J’accepte » et « C’est terminé »', async () => {
    const onComplete = jest.fn();
    const onAccept = jest.fn();
    const r = await render(<TodayTaskRow x={byId('await')} owner={person('me')} emphasis onComplete={onComplete} onAccept={onAccept} DoneComponent={DoneMark} />);
    expect(host(r, 'today-emphasis').length).toBeGreaterThan(0);
    const all = texts(r);
    expect(all).toContain('Attend votre réponse');
    expect(all).toContain('À accepter');
    expect(all).toContain('Camille · 18:00');
    await act(async () => { r.root.findAll((n) => n.props.testID === 'today-complete-await' && n.props.onPress)[0].props.onPress(); });
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ id: 'await' }));
    await act(async () => { r.root.findAll((n) => n.props.testID === 'today-accept-await' && n.props.onPress)[0].props.onPress(); });
    expect(onAccept).toHaveBeenCalled();
    // le libellé accessible de la ligne dit tout (titre, statut, responsable, heure)
    const open = r.root.findAll((n) => n.props.testID === 'today-open-await' && n.props.accessibilityLabel)[0];
    expect(open.props.accessibilityLabel).toMatch(/Acheter du lait avant 18 h\. À accepter\. Par Camille\. 18:00/);
    await act(async () => { open.props.onPress(); });
    expect(router.push).toHaveBeenCalledWith('/family/missions/await');
  });

  it('mission de quelqu’un d’autre : aucun bouton pour la terminer, seulement qui s’en charge', async () => {
    const r = await render(<TodayTaskRow x={byId('sam')} owner={person('sam')} onComplete={jest.fn()} onAccept={jest.fn()} DoneComponent={DoneMark} />);
    expect(host(r, 'today-complete-sam')).toHaveLength(0);
    expect(host(r, 'today-accept-sam')).toHaveLength(0);
    expect(texts(r)).toContain('Co-parent · 17:30');
    expect(texts(r)).toContain('Acceptée');
  });

  it('validation : statut « Fait » immédiat ; la pastille « fait » est remplaçable (point d’injection)', async () => {
    const Custom = jest.fn((p: DoneMarkProps) => null);
    setTodayDoneComponent(Custom as unknown as React.ComponentType<DoneMarkProps>);
    expect(getTodayDoneComponent()).toBe(Custom);
    const r = await render(<TodayTaskRow x={byId('bath')} owner={person('me')} celebrate onComplete={jest.fn()} onAccept={jest.fn()} DoneComponent={getTodayDoneComponent()} />);
    expect(texts(r)).toContain('Fait');
    expect(host(r, 'today-complete-bath')).toHaveLength(0);
    expect(Custom).toHaveBeenCalledWith(expect.objectContaining({ done: true, celebrate: true }), undefined);
    setTodayDoneComponent(null);
    expect(getTodayDoneComponent()).toBe(DoneMark);
  });
});
