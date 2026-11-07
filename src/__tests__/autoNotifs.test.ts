import { DEFAULT_AUTO_PREFS, afterQuiet, inQuiet, planAutoNotifications, type AutoInputs, type AutoTexts } from '@/lib/domain/autoNotifs';

const tx: AutoTexts = {
  apptEve: (t, h) => ({ title: `Demain : ${t}`, body: h }), apptSoon: (t, h) => ({ title: `Dans 1 h : ${t}`, body: h }), apptPrivate: 'Rendez-vous',
  task: (t) => ({ title: t, body: 'à faire' }), prep: (t) => ({ title: t, body: 'à préparer' }), paper: (t, d) => ({ title: t, body: `${d} j` }),
};
const NOW = new Date(2026, 10, 7, 10, 0); // samedi 7 nov. 2026, 10 h
const base = (x: Partial<AutoInputs> = {}): AutoInputs => ({ now: NOW, me: 'me', appointments: [], appointmentsWithReminder: new Set(), tasks: [], prep: [], papers: [], ...x });
const local = (y: number, m: number, d: number, h: number, mi = 0) => new Date(y, m - 1, d, h, mi).toISOString();

describe('notifications automatiques', () => {
  it('heures calmes 22 h – 7 h, y compris après minuit', () => {
    expect(inQuiet(new Date(2026, 10, 7, 23), DEFAULT_AUTO_PREFS)).toBe(true);
    expect(inQuiet(new Date(2026, 10, 7, 6, 59), DEFAULT_AUTO_PREFS)).toBe(true);
    expect(inQuiet(new Date(2026, 10, 7, 7), DEFAULT_AUTO_PREFS)).toBe(false);
    expect(afterQuiet(new Date(2026, 10, 7, 23, 30), DEFAULT_AUTO_PREFS)).toEqual(new Date(2026, 10, 8, 7));
    expect(afterQuiet(new Date(2026, 10, 8, 3), DEFAULT_AUTO_PREFS)).toEqual(new Date(2026, 10, 8, 7));
    expect(afterQuiet(new Date(2026, 10, 7, 12), { ...DEFAULT_AUTO_PREFS, quiet: false })).toEqual(new Date(2026, 10, 7, 12));
  });
  it('rendez-vous : la veille à 19 h et 1 h avant, sauf rappel déjà choisi', () => {
    const plans = planAutoNotifications(base({ appointments: [{ id: 'a', title: 'Pédiatre', starts_at: local(2026, 11, 10, 9, 30) }, { id: 'b', title: 'Écho', starts_at: local(2026, 11, 12, 14) }], appointmentsWithReminder: new Set(['b']) }), DEFAULT_AUTO_PREFS, tx);
    expect(plans.map((p) => p.id)).toEqual(['appt-eve-a', 'appt-1h-a', 'appt-eve-b']);
    expect(plans[0].at).toEqual(new Date(2026, 10, 9, 19));
    expect(plans[1].at).toEqual(new Date(2026, 10, 10, 8, 30));
    expect(plans[0].body).toBe('09:30');
  });
  it('rendez-vous privé d’une autre personne : rien ; le mien : intitulé masqué', () => {
    const plans = planAutoNotifications(base({ appointments: [
      { id: 'x', title: 'Gynéco', starts_at: local(2026, 11, 10, 9), private_to_creator: true, created_by: 'autre' },
      { id: 'y', title: 'Gynéco', starts_at: local(2026, 11, 11, 9), private_to_creator: true, created_by: 'me' },
    ] }), DEFAULT_AUTO_PREFS, tx);
    expect(plans.every((p) => p.id.endsWith('-y'))).toBe(true);
    expect(plans[0].title).toBe('Demain : Rendez-vous');
  });
  it('tâches : à moi ou sans personne, à l’heure ou à 9 h, jamais dans le passé, validables', () => {
    const plans = planAutoNotifications(base({ tasks: [
      { id: 't1', title: 'Courses', due_at: '2026-11-08', status: 'todo', assignee_id: null },
      { id: 't2', title: 'Appeler la crèche', due_at: local(2026, 11, 7, 23, 15), status: 'todo', assignee_id: 'me' },
      { id: 't3', title: 'Pas à moi', due_at: '2026-11-08', status: 'todo', assignee_id: 'autre' },
      { id: 't4', title: 'Déjà fait', due_at: '2026-11-08', status: 'done', assignee_id: null },
      { id: 't5', title: 'Hier', due_at: '2026-11-06', status: 'todo', assignee_id: null },
    ] }), DEFAULT_AUTO_PREFS, tx);
    expect(plans.map((p) => p.id)).toEqual(['task-t2', 'task-t1']);
    expect(plans[0].at).toEqual(new Date(2026, 10, 8, 7)); // 23 h 15 → heures calmes → 7 h
    expect(plans[1].at).toEqual(new Date(2026, 10, 8, 9));
    expect(plans[0].taskId).toBe('t2');
  });
  it('échéances et papiers ; types désactivables ; 30 au plus', () => {
    const inp = base({ prep: [{ key: 'school', title: 'Rentrée', notifyOn: '2026-11-20' }], papers: [{ id: 'p', title: 'Passeport', expires_on: '2027-02-01' }] });
    expect(planAutoNotifications(inp, DEFAULT_AUTO_PREFS, tx).map((p) => p.id)).toEqual(['prep-school', 'paper-p-60', 'paper-p-15']);
    expect(planAutoNotifications(inp, { ...DEFAULT_AUTO_PREFS, prep: false, papers: false }, tx)).toEqual([]);
    const many = base({ tasks: Array.from({ length: 50 }, (_, k) => ({ id: `t${k}`, title: 't', due_at: '2026-11-09', status: 'todo', assignee_id: null })) });
    expect(planAutoNotifications(many, DEFAULT_AUTO_PREFS, tx)).toHaveLength(30);
  });
});
