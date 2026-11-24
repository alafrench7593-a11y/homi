import { todaySleepMinutes } from '@/lib/domain/childDash';

const at = (d: number, h: number, m = 0) => new Date(2026, 10, d, h, m).toISOString();
const NOW = new Date(2026, 10, 24, 15, 0);

describe('sommeil d’aujourd’hui (tableau de bord)', () => {
  it('coupe à minuit une nuit commencée la veille', () => {
    expect(todaySleepMinutes([{ start: at(23, 20, 10), end: at(24, 6, 55) }], NOW)).toBe(6 * 60 + 55);
  });
  it('arrête un sommeil en cours à maintenant et additionne les siestes', () => {
    expect(todaySleepMinutes([{ start: at(24, 9, 40), end: at(24, 10, 50) }, { start: at(24, 14, 0), end: null }], NOW)).toBe(70 + 60);
  });
  it('ne compte qu’une fois deux saisies qui se chevauchent', () => {
    expect(todaySleepMinutes([{ start: at(24, 9, 0), end: at(24, 10, 0) }, { start: at(24, 9, 30), end: at(24, 10, 30) }], NOW)).toBe(90);
  });
  it('rien noté → 0', () => { expect(todaySleepMinutes([], NOW)).toBe(0); });
});
