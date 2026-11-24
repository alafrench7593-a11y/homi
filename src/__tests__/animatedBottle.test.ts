import { bottleScale } from '@/lib/domain/bottleScale';

describe('biberon gradué', () => {
  it('240 ml par défaut, graduations tous les 30 ml', () => {
    expect(bottleScale(120)).toEqual({ capacity: 240, ticks: [30, 60, 90, 120, 150, 180, 210, 240] });
    expect(bottleScale(null).capacity).toBe(240);
  });
  it('passe à 330 ml au-delà de 240 (jamais un niveau qui déborde)', () => {
    expect(bottleScale(260).capacity).toBe(330);
    expect(bottleScale(260).ticks.at(-1)).toBe(330);
  });
});
