import { dayStreak, frequentSymptoms, lastValue, lastWeek, toggleKey } from '@/lib/domain/cycleQuick';

const OPTS = ['cramps', 'headache', 'bloating', 'acne', 'tender_breasts', 'fatigue', 'nausea'];

describe('cycle en un geste', () => {
  it('symptômes fréquents : d’après les saisies de la personne, les récentes comptent plus', () => {
    const logs = [
      { logged_on: '2026-10-25', symptom_keys: ['fatigue'] },
      { logged_on: '2026-10-20', symptom_keys: ['fatigue', 'headache'] },
      { logged_on: '2026-08-01', symptom_keys: ['acne'] },
      { logged_on: '2026-08-02', symptom_keys: ['acne'] },
    ];
    const r = frequentSymptoms(logs, OPTS, '2026-10-26', 4);
    expect(r[0]).toBe('fatigue');
    expect(r.slice(0, 3)).toEqual(['fatigue', 'headache', 'acne']);
    expect(r).toHaveLength(4);
  });
  it('sans historique : l’ordre habituel ; saisies trop anciennes ou futures ignorées', () => {
    expect(frequentSymptoms([], OPTS, '2026-10-26', 3)).toEqual(['cramps', 'headache', 'bloating']);
    expect(frequentSymptoms([{ logged_on: '2025-01-01', symptom_keys: ['nausea'] }, { logged_on: '2026-12-01', symptom_keys: ['acne'] }], OPTS, '2026-10-26', 2)).toEqual(['cramps', 'headache']);
  });
  it('ancien format « symptoms » pris en compte, clés inconnues ignorées', () => {
    expect(frequentSymptoms([{ logged_on: '2026-10-25', symptoms: ['nausea', 'xyz'] }], OPTS, '2026-10-26', 1)).toEqual(['nausea']);
  });
  it('toggleKey ajoute puis retire', () => {
    expect(toggleKey(['a'], 'b')).toEqual(['a', 'b']);
    expect(toggleKey(['a', 'b'], 'a')).toEqual(['b']);
  });
  it('série : continue jusqu’à aujourd’hui, ou hier si aujourd’hui pas encore coché', () => {
    expect(dayStreak(['2026-10-26', '2026-10-25', '2026-10-24', '2026-10-22'], '2026-10-26')).toBe(3);
    expect(dayStreak(['2026-10-25', '2026-10-24'], '2026-10-26')).toBe(2);
    expect(dayStreak(['2026-10-23'], '2026-10-26')).toBe(0);
  });
  it('7 derniers jours, du plus ancien à aujourd’hui', () => {
    const w = lastWeek(['2026-10-26', '2026-10-20'], '2026-10-26');
    expect(w).toHaveLength(7);
    expect(w[0]).toEqual({ date: '2026-10-20', done: true });
    expect(w[6]).toEqual({ date: '2026-10-26', done: true });
    expect(w[3].done).toBe(false);
  });
  it('dernière valeur notée', () => {
    const rows = [{ d: '2026-10-20', t: 36.5 }, { d: '2026-10-24', t: 36.7 }, { d: '2026-10-25', t: null }];
    expect(lastValue(rows, 't', 'd')).toBe(36.7);
    expect(lastValue([] as { d: string; t: number | null }[], 't', 'd')).toBeNull();
  });
});
