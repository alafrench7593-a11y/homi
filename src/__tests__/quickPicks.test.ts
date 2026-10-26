import { deck, frequentValues, progressOf, withFrequentFirst } from '@/lib/domain/quickPicks';

const now = new Date('2026-10-26T12:00:00Z');
const at = (d: number) => new Date(now.getTime() - d * 86_400_000).toISOString();

describe('raccourcis personnels', () => {
  it('classe par fréquence, puis par récence ; ignore les saisies trop anciennes', () => {
    const items = [
      { value: 'nausea', at: at(1) }, { value: 'fatigue', at: at(2) }, { value: 'nausea', at: at(3) },
      { value: 'back', at: at(0) }, { value: 'old', at: at(200) }, { value: 'old', at: at(201) },
    ];
    expect(frequentValues(items, 3, 60, now)).toEqual(['nausea', 'back', 'fatigue']);
  });
  it('options : les fréquentes en tête, rien de retiré ni d’ajouté', () => {
    expect(withFrequentFirst(['a', 'b', 'c', 'd'], ['c', 'z', 'a'])).toEqual(['c', 'a', 'b', 'd']);
  });
  it('avancement d’une liste', () => {
    expect(progressOf([{ done: true }, { done: false }, { done: true }, { done: true }])).toEqual({ done: 3, total: 4, pct: 75 });
    expect(progressOf([])).toEqual({ done: 0, total: 0, pct: 0 });
  });
  it('pile de cartes : écarte les votés et les déjà vus', () => {
    const names = ['Léa', 'Noé', 'Inès', 'Tom'];
    expect(deck(names, (x) => x, new Set(['Noé']), new Set(['Léa']))).toEqual(['Inès', 'Tom']);
  });
});
