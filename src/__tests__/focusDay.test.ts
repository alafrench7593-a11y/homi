import { focusDay, startTimerEnd, togglePick } from '@/lib/domain/focusDay';
import type { FamilyTask } from '@/lib/domain/familyLoad';

const day = '2026-11-23';
const at = (d: string, h: number) => new Date(`${d}T${String(h).padStart(2, '0')}:00:00`).toISOString();
let n = 0;
const task = (p: Partial<FamilyTask>): FamilyTask => ({
  id: `t${++n}`, household_id: 'h', title: `T${n}`, category: 'home' as FamilyTask['category'], due_at: at(day, 10), assignee_id: null, priority: 'normal', essential: false,
  recurrence: null as FamilyTask['recurrence'], status: 'todo', done_at: null, done_by: null, notes: null, routine_id: null, created_by: null, created_at: at(day, 1), ...p,
});

describe('3 choses aujourd’hui', () => {
  it('au plus 3 priorités, le reste à part ; exclut fait, autre personne, futur', () => {
    const hs = [1, 2, 3, 4].map((i) => task({ due_at: at(day, 8 + i) }));
    let picks = { day, ids: [] as string[] };
    for (const h of hs) picks = togglePick(picks, day, h.id); // la 4e est refusée
    expect(picks.ids).toHaveLength(3);
    const others = [task({}), task({ due_at: null }), task({ due_at: at('2026-11-20', 9) }), task({ status: 'done' }), task({ assignee_id: 'autre' }), task({ due_at: at('2026-11-25', 9) }), task({ assignee_id: 'moi' })];
    const r = focusDay([...others, ...hs], day, 'moi', picks);
    expect(r.focus.map((t) => t.id)).toEqual(hs.slice(0, 3).map((t) => t.id));
    expect(r.canAdd).toBe(false);
    expect(r.rest).toHaveLength(5); // 4e priorité + normale + sans date + en retard + assignée à moi
    expect(r.rest.some((t) => t.status === 'done' || t.assignee_id === 'autre')).toBe(false);
  });
  it('choix d’hier oubliés ; retirer un choix', () => {
    const t1 = task({});
    expect(focusDay([t1], day, null, { day: '2026-11-22', ids: [t1.id] }).focus).toHaveLength(0);
    expect(togglePick({ day, ids: [t1.id] }, day, t1.id).ids).toEqual([]);
    expect(togglePick({ day: '2026-11-22', ids: ['x', 'y', 'z'] }, day, t1.id).ids).toEqual([t1.id]);
  });
  it('rien choisi : tout est candidat', () => {
    const r = focusDay([task({})], day, null);
    expect(r.focus).toHaveLength(0); expect(r.canAdd).toBe(true); expect(r.rest).toHaveLength(1);
  });
  it('minuteur : heure de fin', () => { expect(startTimerEnd(0).getTime()).toBe(600000); });
});
