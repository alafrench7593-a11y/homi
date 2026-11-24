import { addDays, monthGrid, parseFr, shiftMonth, ymdToFr, yearRange } from '@/lib/domain/calendarGrid';

describe('calendrier des champs date', () => {
  it('lit et écrit JJ/MM/AAAA ; refuse une date inexistante', () => {
    expect(parseFr('3/2/2024')).toEqual({ y: 2024, m: 1, d: 3 });
    expect(parseFr('29/02/2024')).not.toBeNull();
    expect(parseFr('29/02/2025')).toBeNull();
    expect(parseFr('')).toBeNull();
    expect(ymdToFr({ y: 2026, m: 10, d: 5 })).toBe('05/11/2026');
  });
  it('grille du mois : lundi en premier, toutes les cases', () => {
    const g = monthGrid(2026, 10); // novembre 2026 : commence un dimanche
    expect(g[0]).toEqual([null, null, null, null, null, null, 1]);
    expect(g.flat().filter(Boolean)).toHaveLength(30);
    expect(g.every((w) => w.length === 7)).toBe(true);
  });
  it('navigation : mois, années, hier au passage de l’an', () => {
    expect(shiftMonth(2026, 0, -1)).toEqual({ y: 2025, m: 11 });
    expect(shiftMonth(2026, 11, 1)).toEqual({ y: 2027, m: 0 });
    expect(addDays({ y: 2026, m: 0, d: 1 }, -1)).toEqual({ y: 2025, m: 11, d: 31 });
    expect(yearRange(2024, 2026)).toEqual([2026, 2025, 2024]);
  });
});
