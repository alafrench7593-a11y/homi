import { comparePeriods } from '@/lib/domain/periodCompare';

describe('comparePeriods (moyenne des jours notés, jamais de zéro inventé)', () => {
  it('hausse, baisse, stable', () => {
    expect(comparePeriods([800, 900, 1000], [700, 800, 900])).toMatchObject({ avg: 900, prevAvg: 800, deltaPct: 13, trend: 'up' });
    expect(comparePeriods([600, 600, 600], [800, 800, 800])).toMatchObject({ deltaPct: -25, trend: 'down' });
    expect(comparePeriods([802, 798, 800], [800, 800, 800])).toMatchObject({ trend: 'same' });
  });
  it('jours sans saisie ignorés ; trop peu de jours notés → rien', () => {
    expect(comparePeriods([900, null, null, 900, 900], [900, 900, 900, null])).toMatchObject({ avg: 900, deltaPct: 0, trend: 'same' });
    expect(comparePeriods([900, 900], [900, 900, 900])).toBeNull();
    expect(comparePeriods([900, 900, 900], [null, null, null])).toBeNull();
  });
});
