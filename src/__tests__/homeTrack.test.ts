import {
  atMinutes, canSeeEvent, checkinFilled, countByDay, daysUntil, householdHome, hmText, kidProgress, minutesLeft, mondayOfDay,
  nextExpiry, offDutyEnd, parseHm, parseQty, shareOfWeek, shiftEdit, stepDiff, stepQty, weekMinutes,
} from '@/lib/domain/homeTrack';

describe('homeTrack — jours et heures', () => {
  it('compte par jour : un jour sans saisie vaut null, jamais 0', () => {
    const m = countByDay([{ d: '2026-11-20' }, { d: '2026-11-20' }, { d: '2026-11-25' }], ['2026-11-20', '2026-11-21'], (x) => x.d);
    expect(m).toEqual({ '2026-11-20': 2, '2026-11-21': null });
  });
  it('lundi de la semaine', () => {
    expect(mondayOfDay('2026-11-22')).toBe('2026-11-16'); // dimanche
    expect(mondayOfDay('2026-11-16')).toBe('2026-11-16');
  });
  it('lit les heures françaises', () => {
    expect(parseHm('18h30')).toBe(1110);
    expect(parseHm('18:30')).toBe(1110);
    expect(parseHm('7h')).toBe(420);
    expect(parseHm('9')).toBe(540);
    expect(parseHm('25h')).toBeNull();
    expect(parseHm('18h3')).toBeNull();
    expect(parseHm('abc')).toBeNull();
    expect(hmText(1110)).toBe('18:30');
  });
  it('change l’heure sans changer le jour local', () => {
    const iso = new Date(2026, 10, 22, 14, 0).toISOString();
    const out = new Date(atMinutes(iso, 15 * 60 + 30));
    expect([out.getDate(), out.getHours(), out.getMinutes()]).toEqual([22, 15, 30]);
  });
});

describe('homeTrack — routines de l’enfant', () => {
  const routines = [{ id: 'r1', steps: [1, 2, 3] }, { id: 'r2', steps: [1, 2] }, { id: 'off', steps: [1], active: false }];
  it('fait / reste / dernière coche, doublons et étapes hors routine ignorés', () => {
    const p = kidProgress(routines, [
      { routine_id: 'r1', step: 0, on_date: '2026-11-22', done_by: 'a', created_at: '2026-11-22T07:00:00Z' },
      { routine_id: 'r1', step: 0, on_date: '2026-11-22', done_by: 'a', created_at: '2026-11-22T07:01:00Z' },
      { routine_id: 'r2', step: 1, on_date: '2026-11-22', done_by: 'b', created_at: '2026-11-22T08:00:00Z' },
      { routine_id: 'r2', step: 9, on_date: '2026-11-22', done_by: 'b', created_at: '2026-11-22T09:00:00Z' },
      { routine_id: 'r1', step: 1, on_date: '2026-11-21', done_by: 'b', created_at: '2026-11-21T08:00:00Z' },
    ], '2026-11-22')!;
    expect([p.total, p.done, p.remaining]).toEqual([5, 2, 3]);
    expect(p.last).toEqual({ by: 'b', at: '2026-11-22T08:00:00Z' });
    expect(p.perRoutine.r1).toEqual({ total: 3, done: 1 });
  });
  it('aucune routine → null (rien de noté)', () => expect(kidProgress([], [], '2026-11-22')).toBeNull());
  it('diff des coches', () => expect(stepDiff([0, 2], [2, 3, 1])).toEqual({ add: [1, 3], remove: [0] }));
});

describe('homeTrack — stocks', () => {
  it('pas ± sans négatif ; inconnu + pas = pas', () => {
    expect(stepQty(2, -1)).toBe(1);
    expect(stepQty('0', -1)).toBe(0);
    expect(stepQty(null, 1)).toBe(1);
    expect(stepQty(null, -1)).toBeNull();
    expect(stepQty('1.5', 0.5)).toBe(2);
  });
  it('lit une quantité', () => {
    expect(parseQty('2,5')).toBe(2.5);
    expect(parseQty('')).toBeNull();
    expect(parseQty('-1')).toBe('bad');
    expect(parseQty('x')).toBe('bad');
  });
});

describe('homeTrack — papiers', () => {
  it('jours restants et prochaine échéance', () => {
    expect(daysUntil('2026-11-22', '2026-12-01')).toBe(9);
    const p = [{ id: 'a', expires_on: '2027-01-01' }, { id: 'b', expires_on: '2026-12-01' }, { id: 'c', expires_on: null }, { id: 'd', expires_on: '2026-01-01' }];
    expect(nextExpiry(p, '2026-11-22')).toEqual({ paper: p[1], days: 9 });
    expect(nextExpiry([p[3]], '2026-11-22')?.days).toBeLessThan(0);
    expect(nextExpiry([p[2]], '2026-11-22')).toBeNull();
  });
});

describe('homeTrack — créneaux', () => {
  const at = (d: number, h: number, m = 0) => new Date(2026, 10, d, h, m).toISOString();
  it('minutes de la semaine, annulés exclus, rien → null', () => {
    const shifts = [
      { user_id: 'me', kind: 'me_time', starts_at: at(17, 14), ends_at: at(17, 15, 30), status: 'planned' },
      { user_id: 'me', kind: 'me_time', starts_at: at(18, 9), ends_at: at(18, 10), status: 'cancelled' },
      { user_id: 'me', kind: 'night', starts_at: at(18, 22), ends_at: at(19, 6), status: 'planned' },
      { user_id: 'me', kind: 'me_time', starts_at: at(24, 9), ends_at: at(24, 10), status: 'planned' },
    ];
    expect(weekMinutes(shifts, '2026-11-16', (s) => s.kind === 'me_time' && s.user_id === 'me')).toBe(90);
    expect(weekMinutes(shifts, '2026-11-30', () => true)).toBeNull();
  });
  it('correction d’un créneau', () => {
    expect(shiftEdit(at(17, 14), '15h', '14h')).toEqual({ error: 'order' });
    expect(shiftEdit(at(17, 14), 'x', '14h')).toEqual({ error: 'badTime' });
    const ok = shiftEdit(at(17, 14), '14:30', '16h') as { starts_at: string; ends_at: string };
    expect(new Date(ok.ends_at).getHours()).toBe(16);
  });
});

describe('homeTrack — couple et pause', () => {
  it('point de couple : questions remplies ou rien de noté', () => {
    expect(checkinFilled(null)).toBeNull();
    expect(checkinFilled({ week_of: 'w', heavy: ' ', decisions: null, thanks: null })).toBeNull();
    expect(checkinFilled({ week_of: 'w', heavy: 'a', decisions: 'b', thanks: null })).toBe(2);
  });
  it('fin de pause', () => {
    const now = new Date(2026, 10, 22, 15, 0);
    expect(minutesLeft(new Date(2026, 10, 22, 16, 30).toISOString(), now)).toBe(90);
    expect(minutesLeft(new Date(2026, 10, 22, 14, 0).toISOString(), now)).toBe(0);
    const tomorrow = offDutyEnd('9h', now) as { ends_at: string };
    expect(new Date(tomorrow.ends_at).getDate()).toBe(23);
    expect(offDutyEnd('x', now)).toEqual({ error: 'badTime' });
  });
});

describe('homeTrack — charge du foyer et accueil', () => {
  const tasks = [
    { id: '1', status: 'done' as const, assignee_id: 'a', done_by: 'b', done_at: new Date(2026, 10, 18, 9).toISOString(), due_at: null },
    { id: '2', status: 'done' as const, assignee_id: 'a', done_by: null, done_at: new Date(2026, 10, 19, 9).toISOString(), due_at: null },
    { id: '3', status: 'todo' as const, assignee_id: 'a', done_by: null, done_at: null, due_at: null },
    { id: '4', status: 'todo' as const, assignee_id: null, done_by: null, done_at: null, due_at: null },
    { id: '5', status: 'done' as const, assignee_id: 'a', done_by: 'a', done_at: new Date(2026, 10, 10, 9).toISOString(), due_at: null },
  ];
  it('faites par personne sur la semaine (qui a fait, sinon à qui c’était)', () => {
    const s = shareOfWeek(tasks, '2026-11-16', ['a', 'b']);
    expect(s.total).toBe(2);
    expect(s.rows).toEqual([{ id: 'a', done: 1, open: 1 }, { id: 'b', done: 1, open: 0 }]);
    expect(s.unassigned).toBe(1);
    expect(shareOfWeek(tasks, '2026-11-30', ['a']).total).toBeNull();
  });
  it('droits de l’agenda', () => {
    expect(canSeeEvent(null, {})).toBe(false);
    expect(canSeeEvent({ role: 'owner' }, {})).toBe(true);
    expect(canSeeEvent({ role: 'caregiver', can_view: ['daily'] }, {})).toBe(false);
    expect(canSeeEvent({ role: 'coparent', can_view: ['lists'], child_scope: ['k1'] }, { child_id: 'k2' })).toBe(false);
  });
  it('relais à consulter, tâches ouvertes, prochain événement visible', () => {
    const now = new Date(2026, 10, 22, 12);
    const out = householdHome({
      me: 'a', now, member: { role: 'coparent', can_view: ['lists'], child_scope: ['k1'] }, tasks,
      requests: [
        { id: 'r1', from_user: 'b', to_user: 'a', status: 'open', kind: 'relay', created_at: '' },
        { id: 'r2', from_user: 'b', to_user: null, status: 'open', kind: 'rest', created_at: '' },
        { id: 'r3', from_user: 'a', to_user: 'b', status: 'open', kind: 'relay', created_at: '' },
        { id: 'r4', from_user: 'b', to_user: 'a', status: 'done', kind: 'relay', created_at: '' },
      ],
      events: [
        { id: 'e0', title: 'passé', starts_at: new Date(2026, 10, 21).toISOString() },
        { id: 'e1', title: 'hors périmètre', starts_at: new Date(2026, 10, 23).toISOString(), child_id: 'k2' },
        { id: 'e2', title: 'ok', starts_at: new Date(2026, 10, 24).toISOString(), child_id: 'k1' },
      ],
    });
    expect(out.relays).toBe(2);
    expect([out.open, out.mine]).toEqual([2, 1]);
    expect(out.next?.id).toBe('e2');
  });
});
