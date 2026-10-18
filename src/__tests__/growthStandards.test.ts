import { WHO_GROWTH } from '@/content/whoGrowth';
import { ageInMonths, describePosition, lmsAt, normalCdf, referenceCurves, referenceValue, zScore, type GrowthIndicator, type Sex } from '@/lib/domain/growthStandards';

const INDS: GrowthIndicator[] = ['weight', 'length', 'head', 'bmi'];
const SEXES: Sex[] = ['male', 'female'];

describe('repères OMS — données', () => {
  it('8 tables complètes de 0 à 60 mois', () => {
    for (const i of INDS) for (const s of SEXES) {
      const t = WHO_GROWTH[`${i}_${s}`];
      expect(t).toHaveLength(61);
      t.forEach((r, k) => expect(r[0]).toBe(k));
    }
  });
  it('valeurs de référence connues de l’OMS (naissance, garçon)', () => {
    expect(WHO_GROWTH.weight_male[0].slice(1, 4)).toEqual([0.3487, 3.3464, 0.14602]);
    expect(lmsAt('weight', 'male', 0)?.M).toBe(3.3464);
  });
});

describe('repères OMS — calcul', () => {
  it('reproduit chaque valeur −3…+3 ET publiée par l’OMS (à l’arrondi près), pour toutes les tables', () => {
    const zs = [-3, -2, -1, 0, 1, 2, 3];
    let checked = 0;
    for (const i of INDS) for (const s of SEXES) for (const r of WHO_GROWTH[`${i}_${s}`]) {
      // à 24 mois la table debout s'applique ; on vérifie mois par mois sans interpolation
      zs.forEach((z, k) => {
        const v = referenceValue(i, s, r[0], z)!;
        expect(Math.abs(v - r[4 + k])).toBeLessThanOrEqual(0.051 + (i === 'length' ? 0.05 : 0));
        checked++;
      });
    }
    expect(checked).toBe(8 * 61 * 7);
  });
  it('médiane → z = 0 ; aller-retour valeur ↔ z', () => {
    expect(zScore('weight', 'female', 6, lmsAt('weight', 'female', 6)!.M)).toBeCloseTo(0, 6);
    for (const z of [-2.5, -1, 0.4, 2.2]) expect(zScore('length', 'male', 13.4, referenceValue('length', 'male', 13.4, z)!)).toBeCloseTo(z, 6);
  });
  it('z restreint au-delà de ±3 (méthode OMS), continu à ±3', () => {
    const sd3 = referenceValue('weight', 'male', 12, 3)!;
    expect(zScore('weight', 'male', 12, sd3)).toBeCloseTo(3, 6);
    const sd4 = referenceValue('weight', 'male', 12, 4)!;
    expect(zScore('weight', 'male', 12, sd4)).toBeCloseTo(4, 6);
    expect(sd4).toBeGreaterThan(sd3);
  });
  it('rien hors 0–60 mois, ni pour une valeur nulle', () => {
    expect(zScore('weight', 'male', 61, 18)).toBeNull();
    expect(zScore('weight', 'male', -1, 3)).toBeNull();
    expect(zScore('weight', 'male', 3, 0)).toBeNull();
    expect(referenceCurves('head', 'female', 55, 80).at(-1)!.m).toBeLessThanOrEqual(60);
  });
  it('âge en mois, loi normale', () => {
    expect(ageInMonths('2026-01-15', '2026-07-15')).toBeCloseTo(5.95, 1);
    expect(normalCdf(0)).toBeCloseTo(0.5, 7);
    expect(normalCdf(1.880794)).toBeCloseTo(0.97, 4);
  });
  it('phrases neutres, jamais de jugement ni de diagnostic', () => {
    const mid = describePosition('weight', 'female', 4, lmsAt('weight', 'female', 4)!.M)!;
    expect(mid.band).toBe('within');
    expect(mid.text).toContain('50e centile');
    const low = describePosition('weight', 'female', 4, referenceValue('weight', 'female', 4, -2.5)!)!;
    expect(low.band).toBe('below');
    for (const p of [mid, low]) expect(p.text).not.toMatch(/trop|insuffisan|anormal|retard|maladie|diagnostic/i);
  });
});
