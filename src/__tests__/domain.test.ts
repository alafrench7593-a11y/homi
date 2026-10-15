import { addDays, daysBetween, frToISO, timeAgo, formatDuration } from '@/lib/domain/dates';
import { countdownLabel, dueDateFromLmp, pregnancyProgress, validateDueDate } from '@/lib/domain/pregnancy';
import { childAge } from '@/lib/domain/child';
import { estimateCycle, CYCLE_CAVEATS } from '@/lib/domain/cycle';
import { describeSchedule, nextOccurrence, planReminder, toExpoWeekday, validateSchedule } from '@/lib/domain/reminders';
import { summarizeDay } from '@/lib/domain/daily';
import { weekInfo } from '@/lib/domain/fetalWeeks';

describe('dates', () => {
  it('compte les jours sans être affecté par le changement d’heure', () => {
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2); // passage à l'heure d'hiver le 25/10/2026
    expect(addDays('2026-03-28', 2)).toBe('2026-03-30'); // passage à l'heure d'été
  });
  it('convertit une saisie française', () => {
    expect(frToISO('5/11/2026')).toBe('2026-11-05');
    expect(frToISO('31/02/2026')).toBeNull();
  });
  it('formate les durées', () => {
    expect(formatDuration(95)).toBe('1 h 35');
    expect(timeAgo(new Date(Date.now() - 2 * 3600_000 - 15 * 60_000))).toBe('il y a 2 h 15');
  });
});

describe('grossesse', () => {
  it('calcule le terme français (41 SA) depuis la DDR', () => {
    expect(dueDateFromLmp('2026-01-01')).toBe('2026-10-15');
  });
  it('calcule SA, SG et trimestre', () => {
    const p = pregnancyProgress('2026-10-15', '2026-06-25'); // DDR 01/01 -> 175 jours
    expect(p.weeksSA).toBe(25);
    expect(p.extraDays).toBe(0);
    expect(p.weeksSG).toBe(23);
    expect(p.trimester).toBe(2);
    expect(p.label).toBe('25 SA');
  });
  it('affiche un compte à rebours bienveillant', () => {
    expect(countdownLabel(10)).toBe('encore 1 semaine et 3 jours');
    expect(countdownLabel(0)).toBe('c’est le jour du terme');
    expect(countdownLabel(-2)).toBe('2 jours après le terme');
  });
  it('refuse une date de terme incohérente', () => {
    expect(validateDueDate('2028-01-01', '2026-10-15')).not.toBeNull();
    expect(validateDueDate('2027-02-01', '2026-10-15')).toBeNull();
  });
  it('fournit des repères de taille croissants (illustration)', () => {
    expect(weekInfo(12).lengthCm).toBeLessThan(weekInfo(30).lengthCm);
    expect(weekInfo(19).lengthKind).toBe('tête-fesses');
    expect(weekInfo(24).compare).toBeTruthy();
  });
});

describe('âge de l’enfant', () => {
  it('donne un âge lisible', () => {
    expect(childAge('2026-10-05', '2026-10-15').label).toBe('10 jours');
    expect(childAge('2026-06-10', '2026-10-15').label).toBe('4 mois et 5 jours');
    expect(childAge('2023-04-15', '2026-10-15').label).toBe('3 ans et 6 mois');
  });
});

describe('cycle : estimations avec leurs limites', () => {
  it('signale toujours que ce sont des estimations', () => {
    const e = estimateCycle([{ start_date: '2026-09-01' }], '2026-09-10');
    expect(e.reliability).toBe('insufficient');
    expect(e.caveats).toEqual(expect.arrayContaining(CYCLE_CAVEATS));
    expect(e.caveats.join(' ')).toMatch(/ne permettent pas de l’éviter/);
  });
  it('estime la fenêtre fertile à partir de cycles réguliers', () => {
    const e = estimateCycle([{ start_date: '2026-06-01' }, { start_date: '2026-06-29' }, { start_date: '2026-07-27' }, { start_date: '2026-08-24' }], '2026-09-01');
    expect(e.averageLength).toBe(28);
    expect(e.nextPeriod).toBe('2026-09-21');
    expect(e.ovulation).toBe('2026-09-07');
    expect(e.fertileWindow).toEqual({ start: '2026-09-02', end: '2026-09-08' });
    expect(e.reliability).toBe('moderate');
  });
  it('baisse la fiabilité si les cycles sont irréguliers', () => {
    const e = estimateCycle([{ start_date: '2026-05-01' }, { start_date: '2026-05-24' }, { start_date: '2026-06-30' }, { start_date: '2026-07-24' }], '2026-08-01');
    expect(e.reliability).toBe('low');
  });
});

describe('rappels -> notifications locales', () => {
  it('convertit les jours (lundi=1) vers Expo (dimanche=1)', () => {
    expect(toExpoWeekday(1)).toBe(2);
    expect(toExpoWeekday(7)).toBe(1);
  });
  it('déploie « toutes les 3 h » en heures fixes (robuste au changement d’heure)', () => {
    const plans = planReminder({ type: 'interval', minutes: 180, from_hour: 6, to_hour: 22 });
    expect(plans.map((p) => (p.kind === 'daily' ? `${p.hour}:${p.minute}` : ''))).toEqual(['6:0', '9:0', '12:0', '15:0', '18:0', '21:0']);
  });
  it('ignore un rappel ponctuel passé et gère le report', () => {
    const now = new Date('2026-10-15T10:00:00Z');
    expect(planReminder({ type: 'once', at: '2026-10-14T10:00:00Z' }, now)).toHaveLength(0);
    const snoozed = planReminder({ type: 'daily', hour: 8, minute: 0 }, now, '2026-10-15T10:30:00Z');
    expect(snoozed[0]).toEqual({ kind: 'date', date: new Date('2026-10-15T10:30:00Z') });
    expect(snoozed).toHaveLength(2);
  });
  it('valide les planifications', () => {
    expect(validateSchedule({ type: 'weekly', weekdays: [1, 3], hour: 20, minute: 30 })).toBe(true);
    expect(validateSchedule({ type: 'interval', minutes: 5, from_hour: 6, to_hour: 22 })).toBe(false);
    expect(validateSchedule({ type: 'yearly' })).toBe(false);
  });
  it('décrit et calcule la prochaine échéance', () => {
    expect(describeSchedule({ type: 'weekly', weekdays: [5, 1], hour: 8, minute: 0 })).toBe('lun. ven. à 08h00');
    const now = new Date(2026, 9, 15, 9, 0); // jeudi 15 octobre, 9 h
    const next = nextOccurrence({ type: 'weekly', weekdays: [1], hour: 8, minute: 0 }, now)!;
    expect(next.getDay()).toBe(1);
    expect(next.getDate()).toBe(19);
  });
});

describe('synthèse du quotidien', () => {
  it('additionne biberons, couches et sommeil de la journée', () => {
    const day = new Date(2026, 9, 15);
    const at = (h: number, m = 0) => new Date(2026, 9, 15, h, m).toISOString();
    const s = summarizeDay(
      day,
      {
        bottles: [{ at: at(7), prepared_ml: 150, consumed_ml: 120 }, { at: at(11), prepared_ml: 150, consumed_ml: null }, { at: new Date(2026, 9, 14, 23).toISOString(), prepared_ml: 100 }],
        diapers: [{ at: at(8), wet: true, stool: false }, { at: at(12), wet: true, stool: true }],
        sleeps: [{ started_at: new Date(2026, 9, 14, 22).toISOString(), ended_at: at(6) }, { started_at: at(13), ended_at: at(14, 30) }],
      },
      new Date(2026, 9, 15, 18),
    );
    expect(s.bottles).toBe(2);
    expect(s.bottleMl).toBe(270);
    expect(s.diapers).toBe(2);
    expect(s.stools).toBe(1);
    expect(s.sleepMinutes).toBe(6 * 60 + 90); // seule la part de la nuit comprise dans la journée compte
  });
});
