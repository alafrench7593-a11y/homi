/** Charge familiale : relais de nuit, temps pour soi, journée difficile, signaux, bilan — sans classement ni culpabilisation. */
import {
  addLocalDays, lightenDay, overloadSignals, planNights, routinePreview, ROUTINE_TEMPLATES, shiftConflicts, suggestFreeSlots, weeklyReview,
  type CareRequest, type CareShift, type FamilyTask,
} from '@/lib/domain/familyLoad';

const DAY = '2026-10-18';
const at = (day: string, h: number, m = 0) => { const [y, mo, d] = day.split('-').map(Number); return new Date(y, mo - 1, d, h, m).toISOString(); };
const NOW = new Date(at(DAY, 10));
let n = 0;
const task = (v: Partial<FamilyTask>): FamilyTask => ({
  id: `t${++n}`, household_id: 'h', title: `Tâche ${n}`, category: 'other', due_at: null, assignee_id: null, priority: 'normal', essential: false,
  recurrence: null, status: 'todo', done_at: null, done_by: null, notes: null, routine_id: null, created_by: 'a', created_at: at(DAY, 0), ...v,
});
const shift = (v: Partial<CareShift>): CareShift => ({ id: `s${++n}`, household_id: 'h', kind: 'night', user_id: 'a', starts_at: at(DAY, 22), ends_at: at(addLocalDays(DAY, 1), 6), status: 'planned', note: null, created_by: 'a', created_at: at(DAY, 0), ...v });

describe('relais de nuit', () => {
  it('alterné : chacun son tour, de 22 h à 6 h le lendemain', () => {
    const p = planNights({ pattern: 'alternate', people: ['a', 'b'], startDay: DAY, nights: 4 });
    expect(p.map((x) => x.user_id)).toEqual(['a', 'b', 'a', 'b']);
    expect(new Date(p[0].starts_at).getHours()).toBe(22);
    expect(new Date(p[0].ends_at).getHours()).toBe(6);
    expect(Date.parse(p[0].ends_at) - Date.parse(p[0].starts_at)).toBe(8 * 3600000);
  });
  it('famille monoparentale : une seule personne, toutes les nuits', () => {
    expect(planNights({ pattern: 'alternate', people: ['a'], startDay: DAY, nights: 3 }).every((x) => x.user_id === 'a')).toBe(true);
  });
  it('fixe et personnalisé', () => {
    expect(planNights({ pattern: 'fixed', people: ['b', 'a'], startDay: DAY, nights: 2 }).map((x) => x.user_id)).toEqual(['b', 'b']);
    expect(planNights({ pattern: 'custom', people: ['a', 'b', 'c'], startDay: DAY, nights: 3, custom: ['c', 'c', 'a'] }).map((x) => x.user_id)).toEqual(['c', 'c', 'a']);
  });
  it('conflits signalés avant d’enregistrer', () => {
    const planned = planNights({ pattern: 'fixed', people: ['a'], startDay: DAY, nights: 2 });
    expect(shiftConflicts(planned, [shift({ user_id: 'a' })])).toHaveLength(1);
    expect(shiftConflicts(planned, [shift({ user_id: 'a', status: 'cancelled' })])).toHaveLength(0);
  });
});

describe('temps pour soi', () => {
  it('propose les trous d’au moins une heure, sans les rendez-vous', () => {
    const slots = suggestFreeSlots({ day: DAY, busy: [{ starts_at: at(DAY, 9), ends_at: at(DAY, 12) }, { starts_at: at(DAY, 14), ends_at: at(DAY, 20, 30) }], now: new Date(at(DAY, 7)) });
    expect(slots.map((s) => [new Date(s.starts_at).getHours(), new Date(s.ends_at).getHours()])).toEqual([[8, 9], [12, 14]]);
  });
  it('ne propose rien dans le passé', () => {
    const slots = suggestFreeSlots({ day: DAY, busy: [], now: new Date(at(DAY, 15, 10)) });
    expect(new Date(slots[0].starts_at).getHours() * 60 + new Date(slots[0].starts_at).getMinutes()).toBe(15 * 60 + 15);
  });
});

describe('journée difficile', () => {
  it('garde l’essentiel, propose de reporter le reste au lendemain (sans rien faire tout seul)', () => {
    const tasks = [task({ title: 'Biberon 14 h', due_at: at(DAY, 14), essential: true }), task({ title: 'Lessive', due_at: at(DAY, 16) }), task({ title: 'Papiers', due_at: at(addLocalDays(DAY, -2), 9) }), task({ title: 'Demain', due_at: at(addLocalDays(DAY, 1), 9) })];
    const r = lightenDay(tasks, DAY);
    expect(r.essential.map((t) => t.title)).toEqual(['Biberon 14 h']);
    expect(r.postponable.map((t) => t.title).sort()).toEqual(['Lessive', 'Papiers']);
    const lessive = r.plan.find((p) => p.title === 'Lessive')!;
    expect(Date.parse(lessive.to) - Date.parse(lessive.from)).toBe(86400000);
  });
});

describe('signaux de surcharge', () => {
  const FORBIDDEN = /(burn-?out|d[ée]pression|vous [êe]tes|faute|mauvais|paresse|score|classement|gagn)/i;
  it('retards, journée chargée, tâches sans responsable', () => {
    const tasks = [
      ...Array.from({ length: 3 }, () => task({ due_at: at(addLocalDays(DAY, -1), 9), assignee_id: 'a' })),
      ...Array.from({ length: 8 }, (_, i) => task({ due_at: at(DAY, 11 + i % 8) })),
    ];
    const keys = overloadSignals({ tasks, requests: [], shifts: [], me: 'a', day: DAY, now: NOW }).map((s) => s.key);
    expect(keys).toEqual(expect.arrayContaining(['overdue', 'heavy_day', 'unassigned']));
  });
  it('répartition : signal neutre, sans nom ni chiffre par personne', () => {
    const tasks = Array.from({ length: 8 }, (_, i) => task({ status: 'done', done_by: i < 7 ? 'a' : 'b', done_at: at(DAY, 8) }));
    const s = overloadSignals({ tasks, requests: [], shifts: [], me: 'a', day: DAY, now: NOW }).find((x) => x.key === 'imbalance')!;
    expect(s).toBeDefined();
    expect(`${s.title} ${s.why}`).not.toMatch(/\b[ab]\b|\d+ ?%|\d+ (tâches|sur)/);
    expect(overloadSignals({ tasks, requests: [], shifts: [], me: 'b', day: DAY, now: NOW }).some((x) => x.key === 'imbalance')).toBe(false);
  });
  it('repos : seulement si la personne l’a déclaré, et pas si elle s’est déjà reposée', () => {
    const req: CareRequest = { id: 'r', household_id: 'h', from_user: 'a', to_user: null, kind: 'rest', message: null, task_id: null, shift_id: null, starts_at: null, ends_at: null, status: 'open', responded_by: null, responded_at: null, created_at: at(DAY, 8) };
    expect(overloadSignals({ tasks: [], requests: [req], shifts: [], me: 'a', day: DAY, now: NOW }).some((x) => x.key === 'rest')).toBe(true);
    expect(overloadSignals({ tasks: [], requests: [], shifts: [], me: 'a', day: DAY, now: NOW, myDeclaredFatigue: 2 })).toEqual([]);
    expect(overloadSignals({ tasks: [], requests: [], shifts: [shift({ kind: 'me_time', starts_at: at(DAY, 7), ends_at: at(DAY, 8) })], me: 'a', day: DAY, now: NOW, myDeclaredFatigue: 5 }).some((x) => x.key === 'rest')).toBe(false);
  });
  it('aucun ton culpabilisant ni diagnostic', () => {
    const tasks = [...Array.from({ length: 10 }, () => task({ due_at: at(addLocalDays(DAY, -1), 9) })), ...Array.from({ length: 9 }, () => task({ status: 'done', done_by: 'a', done_at: at(DAY, 8) }))];
    const all = overloadSignals({ tasks, requests: [], shifts: [], me: 'a', day: DAY, now: NOW, myDeclaredFatigue: 5 });
    expect(all.length).toBeGreaterThanOrEqual(3);
    expect(JSON.stringify(all)).not.toMatch(FORBIDDEN);
    for (const s of all) expect(s.suggestions.length).toBeGreaterThan(0);
  });
});

describe('bilan de la semaine', () => {
  it('neutre : par catégorie, jamais par personne', () => {
    const tasks = [task({ status: 'done', category: 'feeding', done_by: 'a', done_at: at(DAY, 8) }), task({ status: 'done', category: 'feeding', done_by: 'b', done_at: at(DAY, 9) }), task({ due_at: at(addLocalDays(DAY, 2), 9) })];
    const r = weeklyReview({ tasks, requests: [], shifts: [], now: NOW });
    expect(r.doneCount).toBe(2);
    expect(r.byCategory).toEqual([expect.objectContaining({ value: 'feeding', count: 2 })]);
    expect(r.unassignedCount).toBe(1);
    expect(JSON.stringify({ c: r.byCategory, p: r.points, q: r.requests, d: r.doneCount })).not.toMatch(/done_by|"a"|"b"/);
    expect(r.points.join(' ')).toMatch(/répartir ensemble/);
  });
});

describe('routines', () => {
  it('aperçu des tâches à valider, aucune création automatique', () => {
    const p = routinePreview({ ...ROUTINE_TEMPLATES[0], default_assignee: 'b' }, at(DAY, 18));
    expect(p).toHaveLength(ROUTINE_TEMPLATES[0].items.length);
    expect(p[0]).toEqual({ title: 'Couches et lingettes', category: 'packing', assignee_id: 'b', due_at: at(DAY, 18) });
  });
});
