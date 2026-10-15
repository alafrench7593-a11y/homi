import { assessProduct, checkBarcode, hasValidCheckDigit, LEVEL_LABEL, scanQuota } from '@/lib/domain/products';

describe('codes-barres', () => {
  it('vérifie la clé de contrôle GS1', () => {
    expect(hasValidCheckDigit('3017620422003')).toBe(true); // EAN-13 réel
    expect(hasValidCheckDigit('3017620422004')).toBe(false);
    expect(hasValidCheckDigit('0000000000024')).toBe(true); // base de démonstration
    expect(hasValidCheckDigit('96385074')).toBe(true); // EAN-8
  });
  it('nettoie et signale une saisie douteuse sans la bloquer', () => {
    expect(checkBarcode('3 017620 422003')).toEqual({ ok: true, code: '3017620422003' });
    expect(checkBarcode('123')).toEqual({ ok: false, error: expect.any(String) });
    const r = checkBarcode('3017620422004');
    expect(r.ok && r.warning).toBeTruthy();
  });
  it('calcule le quota restant', () => {
    expect(scanQuota(3, 10)).toEqual({ remaining: 7, reached: false });
    expect(scanQuota(12, 10)).toEqual({ remaining: 0, reached: true });
  });
});

describe('évaluation produit (formulation neutre)', () => {
  it('n’emploie jamais le mot « dangereux »', () => {
    expect(Object.values(LEVEL_LABEL).join(' ')).not.toMatch(/dangereu/i);
    const a = assessProduct({ name: 'Brie', category: 'food', ingredients: ['lait cru'], declared_allergens: ['lait'], data_source: 'démo', data_retrieved_at: '2026-10-01', is_demo: true }, { pregnant: true });
    expect(a.findings.every((f) => f.source.length > 0)).toBe(true);
    expect(a.findings.map((f) => f.title).join(' ')).not.toMatch(/dangereu/i);
    expect(a.disclaimers[0]).toMatch(/FICTIVES/);
  });
});
