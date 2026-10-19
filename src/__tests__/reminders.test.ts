import { planReminder } from '@/lib/domain/reminders';

describe('rappels bornés par des dates (traitement prescrit)', () => {
  const now = new Date(2026, 9, 19, 12, 0);
  it('n’envoie rien après la date de fin, prises datées une à une', () => {
    const t = planReminder({ type: 'daily', hour: 8, minute: 0, from: '2026-10-18', until: '2026-10-22' }, now);
    expect(t.every((x) => x.kind === 'date')).toBe(true);
    expect(t).toHaveLength(3); // 20, 21 et 22 octobre (le 19 à 8 h est passé)
    expect(planReminder({ type: 'daily', hour: 8, minute: 0, until: '2026-10-18' }, now)).toEqual([]);
  });
  it('commence à la date de début ; sans date de fin, rappel répété classique', () => {
    const t = planReminder({ type: 'weekly', weekdays: [1], hour: 9, minute: 0, from: '2026-11-01' }, now);
    expect(t[0]).toEqual({ kind: 'date', date: new Date(2026, 10, 2, 9, 0) });
    expect(planReminder({ type: 'daily', hour: 8, minute: 0, from: '2026-10-01', until: null }, now)).toEqual([{ kind: 'daily', hour: 8, minute: 0 }]);
  });
});
