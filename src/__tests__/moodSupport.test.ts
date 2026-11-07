import { moodSupport, nextWeeklyMood, weekKey } from '@/lib/domain/moodSupport';

const NOW = new Date(2026, 10, 7, 10, 0); // samedi 7 nov. 2026
const m = (daysAgo: number, mood: number, x: { feelings?: string[]; safety?: boolean; hour?: number } = {}) => {
  const d = new Date(NOW); d.setDate(d.getDate() - daysAgo); d.setHours(x.hour ?? 9, 0, 0, 0);
  return { checked_at: d.toISOString(), mood, feelings: x.feelings ?? [], safety_concern: x.safety ?? false };
};

describe('soutien selon le bilan d’humeur (sans score ni diagnostic)', () => {
  it('rien à proposer sans bilan ou avec des jours plutôt bons', () => {
    expect(moodSupport([], NOW)).toBeNull();
    expect(moodSupport([m(0, 4), m(1, 3), m(2, 2)], NOW)).toBeNull();
  });
  it('3 jours différents d’humeur basse sur 7 jours → « low »', () => {
    expect(moodSupport([m(0, 2), m(2, 1), m(5, 2)], NOW)).toBe('low');
  });
  it('plusieurs bilans bas le même jour ne comptent qu’une fois', () => {
    expect(moodSupport([m(0, 1, { hour: 8 }), m(0, 2, { hour: 20 }), m(1, 2)], NOW)).toBeNull();
  });
  it('au-delà de 7 jours, on ne regarde plus', () => {
    expect(moodSupport([m(0, 2), m(8, 1), m(9, 1)], NOW)).toBeNull();
  });
  it('« pensées pour ma sécurité » ou « Désespoir » → « urgent », même une seule fois', () => {
    expect(moodSupport([m(3, 3, { safety: true })], NOW)).toBe('urgent');
    expect(moodSupport([m(1, 3, { feelings: ['Désespoir'] })], NOW)).toBe('urgent');
  });
  it('semaine ISO et prochain dimanche 18 h', () => {
    expect(weekKey(NOW)).toBe('2026-S45');
    expect(nextWeeklyMood(NOW).toString()).toBe(new Date(2026, 10, 8, 18, 0).toString());
    expect(nextWeeklyMood(new Date(2026, 10, 8, 19, 0)).toString()).toBe(new Date(2026, 10, 15, 18, 0).toString());
    expect(nextWeeklyMood(new Date(2026, 10, 8, 17, 0)).toString()).toBe(new Date(2026, 10, 8, 18, 0).toString());
  });
});
