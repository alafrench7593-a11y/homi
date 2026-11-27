/** Widgets iOS (27/11/2026, App Review 4.4) : contenu calculé à partir de vraies saisies, confidentialité, frises. */
declare const __dirname: string;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs') as { readFileSync(p: string, e: 'utf8'): string };
const ROOT = __dirname + '/../..';
import { babyEntries, cycleEntries, planningEntries, pregnancyEntries, signedOut, sleepEntries, tasksEntries, WIDGET_NAMES } from '@/widgets/model';

const NOW = new Date(2026, 10, 27, 14, 0, 0); // 27/11/2026 14:00 locale
const at = (d: number, h: number, m = 0) => new Date(2026, 10, d, h, m, 0).toISOString();
const base = { title: 'T', msg: 'M', url: 'homi://x' };
const letter = (d: Date) => ['D', 'L', 'Ma', 'Me', 'J', 'V', 'S'][d.getDay()];

describe('widget Bébé', () => {
  const l = { lastBottle: 'b', lastFeed: 'f', today: 't', next: 'n', ml: 'ml', min: 'min', feeds: 'x', week: 'w', avg: 'a', ongoing: 'o', none: '-' };
  const ctx = { now: NOW, discreet: false, dayLetter: letter, side: (s: string) => s, more: (n: number) => `+${n}`, fallbackName: 'Bébé' };
  it('sans enfant ni saisie : état vide, aucune donnée inventée', () => {
    expect(babyEntries(null, base, ctx, l)[0].props.s).toBe('empty');
    const e = babyEntries({ childName: 'Lina', otherChildren: 0, bottles: [], lastBottle: null, nextBottleAt: null, lastFeed: null }, base, ctx, l);
    expect(e[0].props).toMatchObject({ s: 'empty', bottleAt: 0, todayCount: 0, week: [] });
  });
  it('dernier biberon, totaux du jour, graphique 7 jours et remise à zéro à minuit', () => {
    const bottles = [{ at: at(27, 11), consumed_ml: 120, prepared_ml: 150 }, { at: at(27, 7), consumed_ml: null, prepared_ml: 90 }, { at: at(26, 20), consumed_ml: 100, prepared_ml: 100 }, { at: at(27, 13), consumed_ml: null, prepared_ml: 150, in_progress: true }];
    const e = babyEntries({ childName: 'Lina', otherChildren: 1, bottles, lastBottle: bottles[0], nextBottleAt: at(27, 17), lastFeed: { startedAt: at(27, 9), ongoing: false, side: 'left', minutes: 14 } }, base, ctx, l);
    const p = e[0].props;
    expect(p).toMatchObject({ s: 'ok', name: 'Lina', more: '+1', bottleMl: 120, todayCount: 2, todayMl: 210, feedSide: 'left', feedMin: 14, avgMl: 100 });
    expect(p.week).toHaveLength(7);
    expect(p.week[6].y).toBe(210);
    expect(p.nextAt).toBe(Date.parse(at(27, 17)));
    expect(e[1].date.getHours()).toBe(0);
    expect(e[1].props).toMatchObject({ todayCount: 0, todayMl: 0 });
  });
  it('mode discret : pas de prénom', () => {
    const e = babyEntries({ childName: 'Lina', otherChildren: 0, bottles: [], lastBottle: { at: at(27, 11), consumed_ml: 120, prepared_ml: 120 }, nextBottleAt: null, lastFeed: null }, base, { ...ctx, discreet: true }, l);
    expect(e[0].props.name).toBe('Bébé');
    expect(JSON.stringify(e)).not.toContain('Lina');
  });
});

describe('widget Sommeil', () => {
  const l = { asleep: 'a', awake: 'w', today: 't', naps: 'n', last: 'l', week: 'wk', avg: 'av', h: 'h', none: '-' };
  const ctx = { now: NOW, discreet: false, dayLetter: letter, more: (n: number) => `+${n}`, fallbackName: 'Bébé' };
  it('sieste en cours : chrono depuis le début, temps du jour compté jusqu’à maintenant', () => {
    const e = sleepEntries({ childName: 'Noé', otherChildren: 0, sleeps: [{ started_at: at(27, 13), ended_at: null, kind: 'nap' }, { started_at: at(27, 9), ended_at: at(27, 10, 30), kind: 'nap' }] }, base, ctx, l);
    expect(e[0].props).toMatchObject({ s: 'ok', asleep: true, since: Date.parse(at(27, 13)), todayMin: 150, naps: 2, lastMin: 90 });
  });
  it('un sommeil oublié ouvert depuis plus de 18 h n’est pas « en cours »', () => {
    const e = sleepEntries({ childName: 'Noé', otherChildren: 0, sleeps: [{ started_at: at(26, 13), ended_at: null }, { started_at: at(27, 9), ended_at: at(27, 10) }] }, base, ctx, l);
    expect(e[0].props.asleep).toBe(false);
    expect(e[0].props.since).toBe(Date.parse(at(27, 10)));
  });
  it('aucune saisie : vide', () => {
    expect(sleepEntries({ childName: 'Noé', otherChildren: 0, sleeps: [] }, base, ctx, l)[0].props.s).toBe('empty');
  });
});

describe('widget Cycle', () => {
  const l = { day: 'Jour', next: 'Règles dans', nextDiscreet: 'Repère', days: 'j', today: 'auj', fertile: 'F', fertileSoon: 'FS', pill: 'P', pillDone: 'ok', pillTodo: 'todo', none: '-' };
  const input = { periods: [{ start_date: '2026-11-15' }], nextPeriod: '2026-12-13', averageLength: 28, fertileWindow: { start: '2026-11-25', end: '2026-11-30' },
    cycleDayOn: (iso: string) => Math.round((Date.parse(iso) - Date.parse('2026-11-15')) / 86400000) + 1, pill: { active: true, takenToday: true }, hidden: false };
  it('une entrée par jour : le jour du cycle avance seul, la prise du jour repart à faire le lendemain', () => {
    const e = cycleEntries(input, base, { now: NOW, detailed: true }, l);
    expect(e.length).toBe(10);
    expect(e[0].props).toMatchObject({ s: 'ok', day: 13, until: 16, fertile: true, pill: 'done' });
    expect(e[1].props).toMatchObject({ day: 14, until: 15, pill: 'todo' });
    expect(e[1].date.getHours()).toBe(0);
  });
  it('cycle masqué ou verrouillé dans l’app : widget protégé, aucune donnée', () => {
    const e = cycleEntries({ ...input, hidden: true }, base, { now: NOW, detailed: true }, l);
    expect(e[0].props.s).toBe('locked');
    expect(e[0].props.day).toBe(0);
  });
  it('sans règles notées : vide', () => {
    expect(cycleEntries(null, base, { now: NOW, detailed: false }, l)[0].props.s).toBe('empty');
  });
});

describe('widget Grossesse', () => {
  const l = { week: 'S', weekDiscreet: 'S', tri: 'T', toDue: 'Terme', toDueDiscreet: 'Éch', appt: 'RDV', apptDiscreet: 'RDV', none: '-', days: 'j' };
  const progressOn = (iso: string) => { const d = Math.round((Date.parse(iso) - Date.parse('2026-06-01')) / 86400000); return { weeksSA: Math.floor(d / 7), extraDays: d % 7, trimester: 2 as const, daysToDue: 280 - d, progress: d / 280 }; };
  it('semaine qui avance seule, rendez-vous retiré après son heure, intitulé caché en discret', () => {
    const e = pregnancyEntries({ dueDate: '2027-03-08', progressOn, nextAppt: { at: at(28, 9), title: 'Échographie T3' } }, base, { now: NOW, detailed: false }, l);
    expect(e.length).toBe(8);
    expect(e[0].props).toMatchObject({ s: 'ok', apptAt: Date.parse(at(28, 9)), apptTitle: '' });
    expect(e[2].props.apptAt).toBe(0);
    expect(e[1].props.week * 7 + e[1].props.extra).toBe(e[0].props.week * 7 + e[0].props.extra + 1);
    expect(JSON.stringify(e)).not.toContain('Échographie');
  });
});

describe('widget Tâches', () => {
  const l = { open: 'o', done: 'd', mine: 'm', late: 'l', week: 'w', none: '-', noDue: 'nd', hidden: 'Tâche' };
  const tasks = [
    { id: '1', title: 'Payer la cantine', status: 'todo' as const, due_at: at(26, 18), done_at: null, assignee_id: 'me' },
    { id: '2', title: 'Acheter des couches', status: 'todo' as const, due_at: at(28, 10), done_at: null, assignee_id: 'other' },
    { id: '3', title: 'Vaccin', status: 'done' as const, due_at: null, done_at: at(27, 9), assignee_id: 'me' },
    { id: '4', title: 'Annulée', status: 'cancelled' as const, due_at: null, done_at: null, assignee_id: null },
  ];
  it('compteurs, retard, progression et passage en retard à l’échéance', () => {
    const e = tasksEntries(tasks, base, { now: NOW, me: 'me', discreet: false, dayLetter: letter }, l);
    expect(e[0].props).toMatchObject({ s: 'ok', open: 2, doneWeek: 1, mine: 1, late: 1 });
    expect(e[0].props.pct).toBeCloseTo(1 / 3);
    expect(e[0].props.rows[0]).toMatchObject({ t: 'Payer la cantine', late: true, mine: true });
    expect(e[1].props.rows[1].late).toBe(true);
  });
  it('mode discret : aucun intitulé', () => {
    const e = tasksEntries(tasks, base, { now: NOW, me: 'me', discreet: true, dayLetter: letter }, l);
    expect(JSON.stringify(e)).not.toMatch(/cantine|couches/);
  });
});

describe('widget Planning', () => {
  const l = { next: 'n', week: 'w', today: 't', none: '-', hidden: 'Rendez-vous', in: 'dans' };
  const list = [
    { id: 'a', title: 'Pédiatre', starts_at: at(27, 16), location_label: 'Cabinet', completed_at: null },
    { id: 'b', title: 'Crèche', starts_at: at(29, 9), location_label: null },
    { id: 'c', title: 'Passé', starts_at: at(27, 10), location_label: null },
    { id: 'd', title: 'Fait', starts_at: at(28, 9), location_label: null, completed_at: at(27, 12) },
  ];
  it('prochains rendez-vous seulement, disparition à l’heure, mode discret', () => {
    const e = planningEntries(list, base, { now: NOW, discreet: false }, l);
    expect(e[0].props.rows.map((r) => r.t)).toEqual(['Pédiatre', 'Crèche']);
    expect(e[0].props).toMatchObject({ todayN: 1, week: 2 });
    expect(e[1].props.rows.map((r) => r.t)).toEqual(['Crèche']);
    const d = planningEntries(list, base, { now: NOW, discreet: true }, l);
    expect(JSON.stringify(d)).not.toMatch(/Pédiatre|Cabinet/);
  });
});

describe('déconnexion et vues', () => {
  it('état « déconnecté » sans aucune donnée', () => {
    expect(signedOut(base, NOW)[0].props).toEqual({ ...base, s: 'out' });
  });
  it('chaque vue est une fonction de widget autonome déclarée dans app.config', () => {
    const cfg = fs.readFileSync(ROOT + '/app.config.ts', 'utf8');
    for (const name of WIDGET_NAMES) {
      const src = fs.readFileSync(`${ROOT}/src/widgets/${name}.tsx`, 'utf8');
      expect(src).toContain("'widget';");
      expect(src).toContain(`createWidget('${name}'`);
      expect(src).toContain('containerBackground(');
      expect(src).not.toMatch(/onPress|Button\b/); // aucune écriture depuis le widget : les raccourcis ouvrent l'app (Link)
      expect(cfg).toContain(`name: '${name}'`);
    }
  });
});
