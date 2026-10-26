import { backdropPlan, seeded } from '@/lib/domain/backdropPlan';

describe('fond vidéo qui change', () => {
  it('même graine → même suite ; graines différentes → ordres différents', () => {
    expect(backdropPlan(2, 0.42)).toEqual(backdropPlan(2, 0.42));
    const firsts = new Set([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8].map((s) => backdropPlan(2, s)[0].clip));
    expect(firsts.size).toBe(2);
  });
  it('ne rejoue jamais deux fois de suite la même vidéo quand il y en a plusieurs', () => {
    for (const seed of [0.01, 0.33, 0.77, 0.99]) {
      const p = backdropPlan(3, seed, 40);
      for (let i = 1; i < p.length; i++) expect(p[i].clip).not.toBe(p[i - 1].clip);
    }
  });
  it('varie le miroir et la vitesse (0,8 à 1)', () => {
    const p = backdropPlan(2, 0.5, 30);
    expect(new Set(p.map((x) => x.mirror)).size).toBe(2);
    for (const x of p) { expect(x.rate).toBeGreaterThanOrEqual(0.8); expect(x.rate).toBeLessThanOrEqual(1); }
    expect(new Set(p.map((x) => x.rate)).size).toBeGreaterThan(5);
  });
  it('une seule vidéo : le miroir alterne pour varier quand même ; aucune vidéo : rien', () => {
    const p = backdropPlan(1, 0.3, 6);
    for (let i = 1; i < p.length; i++) expect(p[i].mirror).toBe(!p[i - 1].mirror);
    expect(backdropPlan(0, 0.3)).toEqual([]);
  });
  it('générateur borné entre 0 et 1', () => {
    const r = seeded(0.123);
    for (let i = 0; i < 100; i++) { const v = r(); expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThan(1); }
  });
});
