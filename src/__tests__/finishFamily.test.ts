/**
 * Famille et couple, fin du suivi (23/11/2026) — fonctions pures : droits, fiche d'une tâche (qui la porte), bilan
 * d'une semaine, pauses « Je décroche », « noté par moi », « ce qui m'attend », agenda (comptes, fiche d'événement).
 */
import {
  calendarCounts, canEditLists, eventDraftOf, eventFixPatch, myOpenTasks, notedByMe, offDutyEditable, offDutyEndEdit,
  offDutyWeek, reviewOfWeek, snoozedBy, taskDraftOf, taskFixPatch, taskLocked, type TaskFixable,
} from '@/lib/domain/finishFamily';

const at = (y: number, mo: number, d: number, h = 12, mi = 0) => new Date(y, mo - 1, d, h, mi).toISOString();

describe('droits', () => {
  it('propriétaire ou édition « listes » seulement', () => {
    expect(canEditLists(null)).toBe(false);
    expect(canEditLists({ role: 'owner', can_edit: [] })).toBe(true);
    expect(canEditLists({ role: 'coparent', can_edit: ['lists'] })).toBe(true);
    expect(canEditLists({ role: 'coparent', can_edit: ['daily'] })).toBe(false);
    expect(canEditLists({ role: 'caregiver', can_edit: null })).toBe(false);
  });
});

describe('fiche d’une tâche', () => {
  const people = ['me', 'other'];
  const task: TaskFixable = { id: 't', title: 'Vaccins', assignee_id: 'me', due_at: at(2026, 11, 25, 9, 30), status: 'todo' };
  it('valeurs de départ : porteur = indice, « personne » = dernier choix', () => {
    expect(taskDraftOf(task, people)).toEqual({ title: 'Vaccins', who: '0', due: '25/11/2026', time: '09:30' });
    expect(taskDraftOf({ ...task, assignee_id: null, due_at: null }, people)).toEqual({ title: 'Vaccins', who: '2', due: '', time: '' });
  });
  it('seuls les champs modifiés partent', () => {
    const d = taskDraftOf(task, people);
    expect(taskFixPatch(task, d, people, true)).toEqual({ patch: {} });
    expect(taskFixPatch(task, { ...d, who: '1' }, people, true)).toEqual({ patch: { assignee_id: 'other' } });
    expect(taskFixPatch(task, { ...d, who: '2' }, people, true)).toEqual({ patch: { assignee_id: null } });
    expect(taskFixPatch(task, { ...d, title: '  Vaccins Lina ' }, people, true)).toEqual({ patch: { title: 'Vaccins Lina' } });
  });
  it('échéance : date seule (18 h), vidée, refusée si illisible ; ignorée pour une tâche faite', () => {
    const d = taskDraftOf({ ...task, due_at: null }, people);
    expect(taskFixPatch({ ...task, due_at: null }, { ...d, due: '26/11/2026' }, people, true)).toEqual({ patch: { due_at: at(2026, 11, 26, 18, 0) } });
    expect(taskFixPatch(task, { ...taskDraftOf(task, people), due: '', time: '' }, people, true)).toEqual({ patch: { due_at: null } });
    expect(taskFixPatch(task, { ...taskDraftOf(task, people), due: '31/02/2026' }, people, true)).toEqual({ error: 'badDate' });
    expect(taskFixPatch(task, { ...taskDraftOf(task, people), time: '25:00' }, people, true)).toEqual({ error: 'badTime' });
    expect(taskFixPatch(task, { ...taskDraftOf(task, people), due: 'x' }, people, false)).toEqual({ patch: {} });
    expect(taskFixPatch(task, { ...taskDraftOf(task, people), title: '  ' }, people, true)).toEqual({ error: 'title' });
  });
  it('une mission ou une tâche annulée ne se corrige pas ici', () => {
    expect(taskLocked({ status: 'todo', mission_state: 'accepted' })).toBe(true);
    expect(taskLocked({ status: 'cancelled' })).toBe(true);
    expect(taskLocked({ status: 'done' })).toBe(false);
  });
});

describe('bilan d’une semaine', () => {
  const monday = '2026-11-16';
  it('tâches faites de la semaine triées, compteurs séparés, rien = null', () => {
    const tasks = [
      { id: 'a', status: 'done' as const, done_at: at(2026, 11, 18, 20) },
      { id: 'b', status: 'done' as const, done_at: at(2026, 11, 17, 8) },
      { id: 'c', status: 'done' as const, done_at: at(2026, 11, 23, 8) }, // semaine suivante
      { id: 'd', status: 'todo' as const, done_at: null },
    ];
    const r = reviewOfWeek({ tasks, monday, requests: [{ created_at: at(2026, 11, 20) }, { created_at: at(2026, 11, 10) }],
      shifts: [{ kind: 'night', status: 'planned', starts_at: at(2026, 11, 19, 22) }, { kind: 'me_time', status: 'cancelled', starts_at: at(2026, 11, 19) }, { kind: 'me_time', status: 'confirmed', starts_at: at(2026, 11, 22) }] });
    expect(r.done.map((t) => t.id)).toEqual(['b', 'a']);
    expect(r).toMatchObject({ doneCount: 2, requests: 1, nights: 1, rest: 1 });
    expect(reviewOfWeek({ tasks: [], requests: [], shifts: [], monday }).doneCount).toBeNull();
  });
});

describe('je décroche', () => {
  const now = new Date(2026, 10, 18, 15, 0);
  const periods = [
    { id: 'p1', user_id: 'me', starts_at: at(2026, 11, 18, 14), ends_at: at(2026, 11, 18, 17) }, // en cours
    { id: 'p2', user_id: 'me', starts_at: at(2026, 11, 16, 10), ends_at: at(2026, 11, 16, 12) },
    { id: 'p3', user_id: 'other', starts_at: at(2026, 11, 17, 9), ends_at: at(2026, 11, 17, 11) },
    { id: 'p4', user_id: 'me', starts_at: at(2026, 11, 10, 9), ends_at: at(2026, 11, 10, 11) },
  ];
  it('semaine : les plus récentes d’abord, mes minutes (pause en cours comptée jusqu’à maintenant)', () => {
    const w = offDutyWeek(periods, '2026-11-16', 'me', now);
    expect(w.list.map((p) => p.id)).toEqual(['p1', 'p3', 'p2']);
    expect(w.mine).toBe(2);
    expect(w.minutes).toBe(60 + 120);
    expect(offDutyWeek(periods, '2026-11-23', 'me', now).minutes).toBeNull();
  });
  it('seule MA pause en cours se corrige ; jamais plus de 24 h après son début', () => {
    expect(offDutyEditable(periods[0], 'me', now)).toBe(true);
    expect(offDutyEditable(periods[1], 'me', now)).toBe(false);
    expect(offDutyEditable(periods[2], 'me', now)).toBe(false);
    expect(offDutyEndEdit(periods[0], '18:30', now)).toEqual({ ends_at: at(2026, 11, 18, 18, 30) });
    expect(offDutyEndEdit(periods[0], '14:30', now)).toEqual({ error: 'tooLong' }); // demain 14 h 30 > début + 24 h
    expect(offDutyEndEdit(periods[0], 'x', now)).toEqual({ error: 'badTime' });
  });
  it('rappels mis en pause par cette pause (jamais un médicament)', () => {
    const end = at(2026, 11, 18, 17);
    const r = [{ id: 1, snoozed_until: end, category: 'custom' }, { id: 2, snoozed_until: end, category: 'medication' }, { id: 3, snoozed_until: null, category: 'custom' }, { id: 4, snoozed_until: at(2026, 11, 19), category: 'custom' }];
    expect(snoozedBy(r, end).map((x) => x.id)).toEqual([1]);
  });
});

describe('noté par moi, ce qui m’attend', () => {
  it('tâches créées par moi hors routines, celles du jour triées par heure', () => {
    const tasks = [
      { id: 'a', created_by: 'me', created_at: at(2026, 11, 18, 21), routine_id: null },
      { id: 'b', created_by: 'me', created_at: at(2026, 11, 18, 7), routine_id: null },
      { id: 'c', created_by: 'other', created_at: at(2026, 11, 18, 9), routine_id: null },
      { id: 'd', created_by: 'me', created_at: at(2026, 11, 18, 9), routine_id: 'r' },
    ];
    const r = notedByMe(tasks, 'me', '2026-11-18');
    expect(r.mine.map((t) => t.id)).toEqual(['a', 'b']);
    expect(r.ofDay.map((t) => t.id)).toEqual(['b', 'a']);
    expect(notedByMe(tasks, null, '2026-11-18').mine).toEqual([]);
  });
  it('mes tâches ouvertes hors missions : en retard, cette semaine, sans échéance à la fin', () => {
    const now = new Date(2026, 10, 18, 12);
    const tasks = [
      { id: 'late', status: 'todo' as const, assignee_id: 'me', due_at: at(2026, 11, 17) },
      { id: 'week', status: 'todo' as const, assignee_id: 'me', due_at: at(2026, 11, 21) },
      { id: 'later', status: 'todo' as const, assignee_id: 'me', due_at: at(2026, 11, 30) },
      { id: 'none', status: 'todo' as const, assignee_id: 'me', due_at: null },
      { id: 'mission', status: 'todo' as const, assignee_id: 'me', due_at: at(2026, 11, 19), mission_state: 'accepted' },
      { id: 'other', status: 'todo' as const, assignee_id: 'other', due_at: at(2026, 11, 19) },
      { id: 'done', status: 'done' as const, assignee_id: 'me', due_at: at(2026, 11, 19) },
    ];
    const r = myOpenTasks(tasks, 'me', now);
    expect(r.list.map((t) => t.id)).toEqual(['late', 'week', 'later', 'none']);
    expect(r).toMatchObject({ total: 4, late: 1, week: 1 });
    expect(myOpenTasks([], 'me', now).total).toBeNull();
  });
});

describe('agenda', () => {
  it('comptes par nature, rien = null', () => {
    expect(calendarCounts([{ source: 'appointment' }, { source: 'task' }, { source: 'event' }, { source: 'event' }, { source: 'night' }])).toEqual({ total: 5, appointments: 1, tasks: 1, events: 2 });
    expect(calendarCounts([]).total).toBeNull();
  });
  it('fiche d’un événement : seuls les champs modifiés, même jour, fin après début', () => {
    const e = { title: 'Piscine', starts_at: at(2026, 11, 18, 10), ends_at: at(2026, 11, 18, 11), all_day: false, location_label: null };
    const d = eventDraftOf(e);
    expect(d).toEqual({ title: 'Piscine', from: '10:00', to: '11:00', place: '' });
    expect(eventFixPatch(e, d)).toEqual({ patch: {} });
    expect(eventFixPatch(e, { ...d, from: '10:30', to: '11:30' })).toEqual({ patch: { starts_at: at(2026, 11, 18, 10, 30), ends_at: at(2026, 11, 18, 11, 30) } });
    expect(eventFixPatch(e, { ...d, to: '' })).toEqual({ patch: { ends_at: null } });
    expect(eventFixPatch(e, { ...d, to: '09:00' })).toEqual({ error: 'order' });
    expect(eventFixPatch(e, { ...d, from: 'midi' })).toEqual({ error: 'badTime' });
    expect(eventFixPatch(e, { ...d, place: ' Stade ' })).toEqual({ patch: { location_label: 'Stade' } });
    expect(eventFixPatch(e, { ...d, title: '' })).toEqual({ error: 'title' });
    // événement sur plusieurs jours : fin inchangée tant que les heures ne bougent pas
    const multi = { ...e, ends_at: at(2026, 11, 19, 11) };
    expect(eventFixPatch(multi, { ...eventDraftOf(multi), title: 'Stage' })).toEqual({ patch: { title: 'Stage' } });
    // toute la journée : pas d'heures
    expect(eventDraftOf({ ...e, all_day: true })).toMatchObject({ from: '', to: '' });
  });
});
