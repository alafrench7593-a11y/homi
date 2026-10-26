import { countdown, threadStates } from '@/lib/domain/dayThread';

const at = (h: number, m = 0) => new Date(2026, 9, 26, h, m).toISOString();

describe('frise de la journée', () => {
  it('classe fait, en retard, en cours, suivant, à venir et sans heure', () => {
    const now = new Date(2026, 9, 26, 12, 0);
    const r = threadStates([
      { key: 'a', at: at(8), done: true, actionable: true },
      { key: 'b', at: at(9), actionable: true },
      { key: 'c', at: at(11), end: at(13) },
      { key: 'd', at: at(15) },
      { key: 'e', at: at(18), actionable: true },
      { key: 'f', at: null, actionable: true },
      { key: 'g', at: at(7), end: at(8) },
    ], now);
    const s = Object.fromEntries(r.map((x) => [x.key, x.state]));
    expect(s).toEqual({ g: 'past', a: 'done', b: 'late', c: 'now', d: 'next', e: 'todo', f: 'anytime' });
    expect(r.map((x) => x.key)).toEqual(['g', 'a', 'b', 'c', 'd', 'e', 'f']);
  });
  it('une tâche à peine dépassée (moins de 30 min) reste la suivante', () => {
    const r = threadStates([{ key: 'a', at: at(11, 45), actionable: true }], new Date(2026, 9, 26, 12, 0));
    expect(r[0].state).toBe('next');
  });
  it('compte à rebours', () => {
    const now = new Date(2026, 9, 26, 12, 0);
    expect(countdown(at(12, 20), now)).toBe('dans 20 min');
    expect(countdown(at(14, 30), now)).toBe('dans 2 h 30');
    expect(countdown(new Date(2026, 9, 27, 9).toISOString(), now)).toBe('demain');
    expect(countdown(new Date(2026, 9, 30, 9).toISOString(), now)).toBe('dans 4 jours');
    expect(countdown(at(11), now)).toBe('maintenant');
  });
});
