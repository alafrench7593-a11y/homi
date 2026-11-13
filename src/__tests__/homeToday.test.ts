/**
 * « Aujourd'hui dans le foyer » (Accueil) : tri (ce qui m'attend d'abord), droits de terminer (jamais la mission de
 * quelqu'un d'autre), journée (retard, fait aujourd'hui, refusée / annulée exclues), état vide, agenda, relais,
 * garde alternée, et jeu de démonstration (missions et tâches du jour, terminer depuis l'accueil).
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import {
  awaitsMyAnswer, canCompleteTask, custodyToday, emphasisId, isEmptyToday, isToday, todayAgenda, todayCounts, todayShifts, todayTasks, type TaskLike,
} from '@/features/homeToday/todayModel';
import type { CareShift } from '@/lib/domain/familyLoad';
import type { FamilyEvent } from '@/lib/domain/calendar';
import { createDemoBackend } from '@/lib/backend/demo';
import { DEMO_PARTNER_ID } from '@/lib/backend/demoMissions';
import { DICTIONARIES } from '@/i18n/dictionaries';

const NOW = new Date(2026, 10, 14, 12, 0, 0); // 14/11/2026 12:00, heure locale
const at = (h: number, m = 0, day = 14) => new Date(2026, 10, day, h, m, 0, 0).toISOString();
const ME = 'me';
const SAM = 'sam';

let n = 0;
function task(r: Partial<TaskLike>): TaskLike {
  n += 1;
  return {
    id: r.id ?? `t${n}`, household_id: 'h', title: r.title ?? `Tâche ${n}`, category: 'other', due_at: null, assignee_id: null, priority: 'normal', essential: false,
    recurrence: null, status: 'todo', done_at: null, done_by: null, notes: null, routine_id: null, created_by: ME, created_at: at(8, n % 60), mission_state: null, ...r,
  } as TaskLike;
}
const mission = (r: Partial<TaskLike>) => task({ mission_state: 'pending', all_day: false, version: 1, ...r });

describe('aujourd’hui : la journée', () => {
  it('garde les tâches du jour, sans date, en retard et faites aujourd’hui ; exclut annulées, refusées, demain, faites hier', () => {
    expect(isToday(task({ due_at: at(18) }), NOW)).toBe(true);
    expect(isToday(task({ due_at: null }), NOW)).toBe(true);
    expect(isToday(task({ due_at: at(18, 0, 12) }), NOW)).toBe(true); // en retard
    expect(isToday(task({ due_at: at(9, 0, 15) }), NOW)).toBe(false); // demain
    expect(isToday(task({ status: 'cancelled', due_at: at(18) }), NOW)).toBe(false);
    expect(isToday(mission({ mission_state: 'declined', due_at: at(18) }), NOW)).toBe(false);
    expect(isToday(task({ status: 'done', done_at: at(9) }), NOW)).toBe(true);
    expect(isToday(task({ status: 'done', done_at: at(9, 0, 13) }), NOW)).toBe(false);
  });
});

describe('aujourd’hui : droits de terminer (le serveur tranche ; l’accueil ne propose que le possible)', () => {
  it('mission : seulement son destinataire (ou à prendre) ; jamais l’autrice ni un tiers', () => {
    expect(canCompleteTask(mission({ assignee_id: ME, created_by: SAM }), ME, true)).toBe(true);
    expect(canCompleteTask(mission({ assignee_id: SAM, created_by: ME, mission_state: 'accepted' }), ME, true)).toBe(false); // ma demande, faite par Sam
    expect(canCompleteTask(mission({ assignee_id: SAM, created_by: 'autre' }), ME, true)).toBe(false); // la mission de quelqu'un d'autre
    expect(canCompleteTask(mission({ assignee_id: null, created_by: SAM }), ME, true)).toBe(true); // à prendre
    expect(canCompleteTask(mission({ assignee_id: null, created_by: ME }), ME, true)).toBe(false); // à prendre, mais c'est la mienne
    expect(canCompleteTask(mission({ assignee_id: ME, created_by: SAM, mission_state: 'done', status: 'done' }), ME, true)).toBe(false);
    // le droit d'écrire des listes ne concerne pas les missions (réponse serveur)
    expect(canCompleteTask(mission({ assignee_id: ME, created_by: SAM }), ME, false)).toBe(true);
  });
  it('tâche simple : la mienne ou à prendre, avec le droit d’écrire ; jamais celle d’un autre', () => {
    expect(canCompleteTask(task({ assignee_id: ME }), ME, true)).toBe(true);
    expect(canCompleteTask(task({ assignee_id: null }), ME, true)).toBe(true);
    expect(canCompleteTask(task({ assignee_id: SAM }), ME, true)).toBe(false);
    expect(canCompleteTask(task({ assignee_id: ME }), ME, false)).toBe(false); // lecture seule
    expect(canCompleteTask(task({ assignee_id: ME }), null, true)).toBe(false);
  });
  it('attend ma réponse : à accepter / reportée, dont je suis destinataire', () => {
    expect(awaitsMyAnswer(mission({ assignee_id: ME, created_by: SAM }), ME)).toBe(true);
    expect(awaitsMyAnswer(mission({ assignee_id: ME, created_by: SAM, mission_state: 'postponed' }), ME)).toBe(true);
    expect(awaitsMyAnswer(mission({ assignee_id: ME, created_by: SAM, mission_state: 'accepted' }), ME)).toBe(false);
    expect(awaitsMyAnswer(mission({ assignee_id: SAM, created_by: ME }), ME)).toBe(false);
    expect(awaitsMyAnswer(task({ assignee_id: ME }), ME)).toBe(false);
  });
});

describe('aujourd’hui : tri', () => {
  it('ce qui attend ma réponse, puis le mien, puis le foyer, puis le fait ; en retard puis à l’heure puis sans heure', () => {
    const list = todayTasks([
      task({ id: 'done', status: 'done', done_at: at(9), assignee_id: SAM }),
      task({ id: 'samLater', assignee_id: SAM, due_at: at(16) }),
      task({ id: 'mineNoTime', assignee_id: ME }),
      task({ id: 'mine19', assignee_id: ME, due_at: at(19) }),
      task({ id: 'mineLate', assignee_id: ME, due_at: at(19, 0, 13) }),
      mission({ id: 'await', assignee_id: ME, created_by: SAM, due_at: at(18) }),
      mission({ id: 'samMission', assignee_id: SAM, created_by: ME, mission_state: 'accepted', due_at: at(17, 30) }),
    ], ME, NOW, { canEdit: true });
    expect(list.map((x) => x.id)).toEqual(['await', 'mineLate', 'mine19', 'mineNoTime', 'samLater', 'samMission', 'done']);
    expect(list[0]).toMatchObject({ awaitsMe: true, canAccept: true, canComplete: true, status: 'pending', kind: 'mission' });
    expect(list.find((x) => x.id === 'mineLate')).toMatchObject({ late: true, status: 'todo' });
    expect(list.find((x) => x.id === 'samMission')).toMatchObject({ canComplete: false, canAccept: false });
    expect(list.find((x) => x.id === 'done')).toMatchObject({ done: true, canComplete: false, status: 'done' });
    expect(emphasisId(list)).toBe('await');
    expect(todayCounts(list)).toEqual({ todo: 6, done: 1, awaiting: 1 });
  });
  it('mise en avant : seulement pour ce qui me revient (rien si seul le foyer a des tâches)', () => {
    expect(emphasisId(todayTasks([task({ assignee_id: SAM, due_at: at(16) })], ME, NOW, { canEdit: true }))).toBeNull();
    expect(emphasisId(todayTasks([task({ id: 'x', assignee_id: null })], ME, NOW, { canEdit: true }))).toBe('x');
    expect(emphasisId([])).toBeNull();
  });
  it('statut : à faire / à prendre / état fin de la mission', () => {
    const [a, b] = todayTasks([task({ id: 'a', assignee_id: ME, due_at: at(13) }), task({ id: 'b', assignee_id: null, due_at: at(14) })], ME, NOW, { canEdit: true });
    expect(a.status).toBe('todo');
    expect(b.status).toBe('open');
  });
});

describe('aujourd’hui : agenda, relais, garde, état vide', () => {
  const ev = (r: Partial<FamilyEvent>): FamilyEvent => ({ id: r.id ?? 'e', household_id: 'h', child_id: null, kind: 'activity', title: 'Événement', starts_at: at(15), ends_at: at(16), all_day: false,
    location_label: null, notes: null, recurrence: null, timezone: 'Europe/Paris', created_by: ME, created_at: at(8), ...r });
  it('agenda : à venir ou en cours aujourd’hui (pas ce qui est fini, ni demain)', () => {
    const a = todayAgenda({ events: [ev({ id: 'past', starts_at: at(9), ends_at: at(10) }), ev({ id: 'now', starts_at: at(11, 30), ends_at: at(12, 30) }), ev({ id: 'later' }), ev({ id: 'tomorrow', starts_at: at(10, 0, 15), ends_at: at(11, 0, 15) })],
      appointments: [{ id: 'rdv', title: 'Pédiatre', starts_at: at(17), location_label: null, kind: 'pediatric' }] }, NOW);
    expect(a.map((i) => i.refId)).toEqual(['now', 'later', 'rdv']);
  });
  it('relais : la nuit qui commence ce soir et le temps pour soi du jour ; jamais un relais annulé', () => {
    const sh = (r: Partial<CareShift>): CareShift => ({ id: 's', household_id: 'h', kind: 'night', user_id: SAM, starts_at: at(22), ends_at: at(6, 0, 15), status: 'planned', note: null, created_by: ME, created_at: at(8), ...r });
    const list = todayShifts([sh({ id: 'tonight' }), sh({ id: 'lastNight', starts_at: at(22, 0, 13), ends_at: at(6) }), sh({ id: 'cancelled', status: 'cancelled' }), sh({ id: 'me', kind: 'me_time', user_id: ME, starts_at: at(14), ends_at: at(15) })], NOW);
    expect(list.map((s) => s.id)).toEqual(['me', 'tonight']);
  });
  it('garde alternée : chez qui aujourd’hui et passage de garde du jour', () => {
    // une semaine sur deux à partir du lundi 9/11 : A du 9 au 15, B à partir du 16
    const plan = { id: 'p', child_id: 'c', label_a: 'Chez Camille', label_b: 'Chez Sam', cycle: 'AAAAAAABBBBBBB', anchor_on: '2026-11-09', handover_time: '18:00:00', handover_place: 'École', active: true };
    expect(custodyToday([plan], [], NOW)[0]).toMatchObject({ where: 'Chez Camille', handover: false, time: null });
    const monday = new Date(2026, 10, 16, 9);
    expect(custodyToday([plan], [], monday)[0]).toMatchObject({ where: 'Chez Sam', from: 'Chez Camille', handover: true, time: '18:00', place: 'École' });
    expect(custodyToday([{ ...plan, active: false }], [], NOW)).toEqual([]);
  });
  it('état vide : rien de prévu', () => {
    expect(isEmptyToday({ tasks: [], agenda: [], shifts: [], custody: [] })).toBe(true);
    expect(isEmptyToday({ tasks: todayTasks([task({})], ME, NOW, { canEdit: true }), agenda: [], shifts: [], custody: [] })).toBe(false);
    expect(todayTasks([], ME, NOW, { canEdit: true })).toEqual([]);
  });
});

describe('aujourd’hui : i18n', () => {
  it('les 5 langues ont toutes les clés ht.*', () => {
    const keys = Object.keys(DICTIONARIES.fr).filter((k) => k.startsWith('ht.'));
    expect(keys.length).toBeGreaterThan(40);
    for (const l of ['en', 'es', 'de', 'it']) for (const k of keys) expect(DICTIONARIES[l][k]).toBeTruthy();
  });
});

describe('aujourd’hui : démonstration (famille d’exemple)', () => {
  it('contient des missions et tâches du jour réalistes ; je termine la mienne, pas celle de Sam', async () => {
    const b = createDemoBackend({ strictPremium: false });
    await b.auth.signUp('camille@exemple.test', 'MotDePasse!2026');
    await b.auth.signIn('camille@exemple.test', 'MotDePasse!2026');
    const me = (await b.auth.getSession())!.userId;
    await b.rpc('ensure_my_account');
    await b.rpc('load_sample_family');
    await b.rpc('load_sample_family'); // rejouée : aucun doublon
    const rows = await b.select<TaskLike>({ table: 'family_tasks' });
    const list = todayTasks(rows, me, new Date(), { canEdit: true });
    expect(list.filter((x) => x.kind === 'mission')).toHaveLength(2);
    expect(list.length).toBeGreaterThanOrEqual(5);
    const first = list[0];
    expect(first).toMatchObject({ awaitsMe: true, kind: 'mission', ownerId: me, canComplete: true });
    const sams = list.find((x) => x.kind === 'mission' && x.ownerId === DEMO_PARTNER_ID)!;
    expect(sams.canComplete).toBe(false);
    await expect(b.rpc('mission_respond', { p_task: sams.id, p_action: 'complete' })).rejects.toBeTruthy();
    await b.rpc('mission_respond', { p_task: first.id, p_action: 'complete', p_expected_version: first.version });
    const simple = list.find((x) => x.kind === 'task' && x.ownerId === me && !x.done)!;
    await b.update('family_tasks', { status: 'done' }, [{ col: 'id', op: 'eq', value: simple.id }]);
    const after = todayTasks(await b.select<TaskLike>({ table: 'family_tasks' }), me, new Date(), { canEdit: true });
    expect(after.find((x) => x.id === first.id)).toMatchObject({ done: true, status: 'done' });
    expect(after.find((x) => x.id === simple.id)).toMatchObject({ done: true, status: 'done' });
    const members = await b.select<{ user_id: string }>({ table: 'household_members' });
    expect(members.map((m) => m.user_id)).toEqual(expect.arrayContaining([me, DEMO_PARTNER_ID]));
    const shifts = await b.select<CareShift>({ table: 'care_shifts' });
    expect(todayShifts(shifts, new Date()).some((s) => s.kind === 'night' && s.user_id === DEMO_PARTNER_ID)).toBe(true);
  });
});
