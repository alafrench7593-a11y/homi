/**
 * Médicaments et changement d'heure (09/11/2026) : une prise à 08:00 reste à 08:00 heure locale,
 * le jour du passage à l'heure d'hiver comme à l'heure d'été (fuseau Europe/Paris forcé pour ce fichier).
 * Aucune dose n'est calculée : seules les HEURES saisies sont planifiées.
 */
const previousTZ = process.env.TZ;
process.env.TZ = 'Europe/Paris';
afterAll(() => { process.env.TZ = previousTZ; });

import { planReminder } from '@/lib/domain/reminders';
import { DEFAULT_AUTO_PREFS, planAutoNotifications, type AutoTexts } from '@/lib/domain/autoNotifs';

const tx: AutoTexts = {
  apptEve: (t, h) => ({ title: t, body: h }), apptSoon: (t, h) => ({ title: t, body: h }), apptPrivate: 'RDV',
  task: (t) => ({ title: t, body: '' }), prep: (t) => ({ title: t, body: '' }), paper: (t) => ({ title: t, body: '' }),
  dose: (h) => ({ title: 'Prise à noter', body: `prévue à ${h}` }),
};
const H = 3600_000;

describe('changement d’heure (Europe/Paris)', () => {
  it('le fuseau du test est bien appliqué (25/10/2026 : passage à l’heure d’hiver)', () => {
    expect(new Date(2026, 9, 24, 8).toISOString()).toBe('2026-10-24T06:00:00.000Z');
    expect(new Date(2026, 9, 25, 8).toISOString()).toBe('2026-10-25T07:00:00.000Z');
  });

  it('traitement sans date de fin : déclencheur « tous les jours à 08:00 » (heure murale, suivie par le système)', () => {
    expect(planReminder({ type: 'daily', hour: 8, minute: 0 }, new Date(2026, 9, 24, 12))).toEqual([{ kind: 'daily', hour: 8, minute: 0 }]);
  });

  it('traitement daté qui traverse le passage à l’heure d’hiver : chaque prise à 08:00 locale (25 h d’écart ce jour-là)', () => {
    const plans = planReminder({ type: 'daily', hour: 8, minute: 0, from: '2026-10-23', until: '2026-10-27' }, new Date(2026, 9, 22, 12));
    const dates = plans.map((p) => (p.kind === 'date' ? p.date : null)!);
    expect(dates).toHaveLength(5);
    expect(dates.every((d) => d.getHours() === 8 && d.getMinutes() === 0)).toBe(true);
    expect(dates[2].getTime() - dates[1].getTime()).toBe(25 * H); // 24/10 08:00 → 25/10 08:00
    expect(dates[3].getTime() - dates[2].getTime()).toBe(24 * H);
  });

  it('passage à l’heure d’été (29/03/2026) : 08:00 locale, 23 h d’écart', () => {
    const plans = planReminder({ type: 'daily', hour: 8, minute: 0, from: '2026-03-28', until: '2026-03-30' }, new Date(2026, 2, 27, 12));
    const dates = plans.map((p) => (p.kind === 'date' ? p.date : null)!);
    expect(dates.map((d) => d.getHours())).toEqual([8, 8, 8]);
    expect(dates[1].getTime() - dates[0].getTime()).toBe(23 * H);
  });

  it('relance de la prise de 08:00 le jour du changement d’heure : 08:30 locale, 30 min réelles après', () => {
    const planned = new Date(2026, 9, 25, 8, 0);
    const plans = planAutoNotifications({
      now: new Date(2026, 9, 25, 1, 30), me: 'me', appointments: [], appointmentsWithReminder: new Set(), tasks: [], prep: [], papers: [],
      doses: [{ treatmentId: 't1', source: 'my_treatment', scheduledFor: planned.toISOString(), url: '/medications', handled: false }],
    }, DEFAULT_AUTO_PREFS, tx);
    expect(plans).toHaveLength(1);
    expect(plans[0].at.getHours()).toBe(8);
    expect(plans[0].at.getMinutes()).toBe(30);
    expect(plans[0].at.getTime() - planned.getTime()).toBe(30 * 60_000);
    expect(plans[0].body).toBe('prévue à 08:00');
    expect(plans[0].data).toMatchObject({ scheduledFor: '2026-10-25T07:00:00.000Z', dose: '08:00' });
  });

  it('prise de 02:30 le jour du passage à l’heure d’été (heure qui n’existe pas) : décalée à 03:30, jamais perdue', () => {
    const plans = planReminder({ type: 'daily', hour: 2, minute: 30, from: '2026-03-29', until: '2026-03-29' }, new Date(2026, 2, 28, 12));
    expect(plans).toHaveLength(1);
    const d = (plans[0] as { date: Date }).date;
    expect(d.getDate()).toBe(29);
    expect(d.getHours()).toBe(3);
  });
});
