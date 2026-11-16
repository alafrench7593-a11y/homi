/**
 * Journée v5 « Lumière corail » (16/11/2026) : accueil (prochain événement, demandes urgentes, reste de la journée),
 * résumé du soir (lignes horodatées → chronologie à horaires alignés), contrastes des capsules de statut et des
 * heures, chronologie sans pulsation (aucune animation ambiante).
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));
jest.mock('expo-router', () => ({ router: { push: jest.fn() }, useIsFocused: () => true }));

import React from 'react';
import { AccessibilityInfo } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { themes } from '@/theme/tokens';
import { contrastRatio, over, parseColor } from '@/theme/contrast';
import { useUiStore } from '@/lib/store';
import { todayTasks, todayTimeline, type TaskLike, type TodayModel } from '@/features/homeToday/todayModel';
import { entryStates, isUrgent, nextEntry } from '@/features/homeToday/HomeToday';
import { DayTimeline, pillFill, toneColor, type PillTone } from '@/features/day5/DayParts';
import { byClock, splitTimed } from '@/features/day5/summaryLines';

const NOW = new Date(2026, 10, 16, 20, 0, 0);
const iso = (h: number, m = 0) => new Date(2026, 10, 16, h, m).toISOString();
const base = { household_id: 'h', category: 'other', priority: 'normal', essential: false, recurrence: null, status: 'todo', done_at: null, done_by: null, notes: null, routine_id: null, created_at: iso(8), mission_state: null } as const;
const tasks = todayTasks([
  { ...base, id: 'milk', title: 'Acheter du lait', due_at: iso(18), assignee_id: 'me', created_by: 'sam', mission_state: 'pending', all_day: false, version: 1 },
  { ...base, id: 'bath', title: 'Donner le bain', due_at: iso(19), assignee_id: 'me', created_by: 'me' },
  { ...base, id: 'pick', title: 'Récupérer Lina', due_at: iso(17, 30), assignee_id: 'sam', created_by: 'me', mission_state: 'accepted', all_day: false, version: 2 },
  { ...base, id: 'later', title: 'Ranger', due_at: iso(22), assignee_id: 'me', created_by: 'me' },
] as TaskLike[], 'me', NOW, { canEdit: true });
const ev = (id: string, h: number, h2: number) => ({ key: `event:${id}`, source: 'event' as const, refId: id, title: id, starts: iso(h), ends: iso(h2), allDay: false });
const model: TodayModel = { tasks, agenda: [ev('swim', 21, 22), ev('dinner', 19, 21)], shifts: [], custody: [] };
const sod = new Date(2026, 10, 16).getTime();

describe('Accueil v5 : demandes urgentes, prochain événement, états de la chronologie', () => {
  it('urgent = attend ma réponse, ou à moi et en retard ; jamais la mission d’un autre', () => {
    const by = (id: string) => tasks.find((x) => x.id === id)!;
    expect(isUrgent(by('milk'), NOW.getTime())).toBe(true);
    expect(isUrgent(by('bath'), NOW.getTime())).toBe(true); // 19:00 passé, à moi
    expect(isUrgent(by('pick'), NOW.getTime())).toBe(false); // mission de Sam
    expect(isUrgent(by('later'), NOW.getTime())).toBe(false); // 22:00, pas encore
  });

  it('prochain événement : celui en cours (dîner 19 h – 21 h), sinon le premier à venir', () => {
    const all = todayTimeline(model, { now: NOW });
    expect(nextEntry(all, NOW.getTime(), sod)?.key).toBe('event:dinner');
    const after = new Date(2026, 10, 16, 21, 30);
    expect(nextEntry(todayTimeline({ ...model, agenda: [ev('swim', 22, 23)] }, { now: after }), after.getTime(), sod)?.key).toBe('event:swim');
  });

  it('états : en retard (tâche dépassée), en cours, ensuite (un seul), plus tard', () => {
    const all = todayTimeline(model, { now: NOW });
    const st = entryStates(all, NOW.getTime(), sod);
    expect(st.get('task:pick')).toBe('late');
    expect(st.get('event:dinner')).toBe('now');
    expect(st.get('event:swim')).toBe('next');
    expect(st.get('task:later')).toBe('later');
    expect([...st.values()].filter((s) => s === 'next')).toHaveLength(1);
  });
});

describe('Résumé du soir v5 : horaires alignés', () => {
  it('« Biberon 08:30 · 120 ml bus » → heure + texte ; une date longue reste du texte', () => {
    expect(splitTimed('Biberon 08:30 · 120 ml bus')).toEqual({ time: '08:30', text: 'Biberon · 120 ml bus' });
    expect(splitTimed('12:15 · Purée de carottes')).toEqual({ time: '12:15', text: 'Purée de carottes' });
    expect(splitTimed('mercredi 16 décembre à 10:30 · Échographie')).toBeNull();
    expect(splitTimed('3 biberons · 360 ml bus')).toBeNull();
    expect(['14:10', '8:05', '09:30'].sort(byClock)).toEqual(['8:05', '09:30', '14:10']);
  });
});

describe('Contrastes v5 : capsules de statut et heures ≥ 4,5:1', () => {
  const tones: PillTone[] = ['late', 'accent', 'done', 'muted', 'danger', 'info'];
  for (const name of ['light', 'dark'] as const) {
    it(`${name} : texte de la capsule sur sa teinte, heure sur la surface`, () => {
      const t = themes[name];
      const surface = parseColor(t.colors.surface).rgb;
      for (const tone of tones) {
        const c = toneColor(t, tone);
        expect(contrastRatio(c, over(pillFill(t, c), surface))).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(c, surface)).toBeGreaterThanOrEqual(4.5);
      }
      // Indicateur de date choisie (aplat de l'action) et son texte
      expect(contrastRatio(t.tokens.action.text, t.tokens.action.fill)).toBeGreaterThanOrEqual(4.5);
    });
  }
});

describe('Chronologie v5 : stable pendant la lecture', () => {
  const mounted: ReactTestRenderer[] = [];
  beforeEach(() => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    act(() => { useUiStore.setState({ nightMode: false, themePreference: 'light', cinematicSeen: true, hapticsEnabled: false }); });
  });
  afterEach(async () => { await act(async () => { while (mounted.length) mounted.pop()!.unmount(); }); });

  it('heures dans une colonne de largeur fixe, capsule d’état, aucune animation en boucle', async () => {
    const loop = jest.spyOn(require('react-native').Animated, 'loop');
    let r!: ReactTestRenderer;
    await act(async () => {
      r = create(<ThemeProvider><DayTimeline testID="tl" rows={[
        { key: 'a', time: '17:30', state: 'late', title: 'Récupérer Lina' },
        { key: 'b', time: '21:00', timeSub: '21:45', state: 'next', title: 'Bébés nageurs' },
        { key: 'c', time: '22:00', state: 'later', title: 'Relais de nuit' },
      ]} /></ThemeProvider>);
    });
    mounted.push(r);
    const texts = r.root.findAll((n) => typeof n.type === 'string' && n.type.toLowerCase().includes('text')).map((n) => n.children.join(''));
    expect(texts).toEqual(expect.arrayContaining(['17:30', '21:00', '21:45', 'En retard', 'Ensuite', 'Relais de nuit']));
    expect(texts).not.toContain('Plus tard'); // l'heure suffit : pas de capsule « plus tard »
    expect(loop).not.toHaveBeenCalled();
  });
});
