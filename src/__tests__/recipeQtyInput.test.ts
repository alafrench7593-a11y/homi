import { parseQtyInput } from '@/features/recipes/qtyInput';

describe('parseQtyInput (saisie des quantités d’une recette personnelle)', () => {
  it('accepte la virgule et le point décimaux', () => {
    expect(parseQtyInput('0,5')).toBe(0.5);
    expect(parseQtyInput('1.25')).toBe(1.25);
    expect(parseQtyInput(' 200 ')).toBe(200);
  });
  it('frappe en cours : « 1, » vaut 1, « 0 » et « 0, » ne donnent aucune quantité', () => {
    expect(parseQtyInput('1,')).toBe(1);
    expect(parseQtyInput('0')).toBeNull();
    expect(parseQtyInput('0,')).toBeNull();
  });
  it('vide, illisible ou négatif → aucune quantité', () => {
    expect(parseQtyInput('')).toBeNull();
    expect(parseQtyInput('  ')).toBeNull();
    expect(parseQtyInput('abc')).toBeNull();
    expect(parseQtyInput('-3')).toBeNull();
  });
});
