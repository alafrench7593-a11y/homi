import { answer, buildIndex, stem, tokenize } from '@/lib/localAI/engine';
import { LIBRARY_ARTICLES } from '@/content/articles/library';
import { NEURO_LIBRARY } from '@/content/articles/rows';
import { GUIDE_ARTICLES } from '@/content/articles/guide';

const kb = buildIndex([...LIBRARY_ARTICLES, ...NEURO_LIBRARY, ...GUIDE_ARTICLES]);

describe('assistant local de la bibliothèque', () => {
  it('texte : racines et synonymes (TDAH, autisme, bébé)', () => {
    expect(stem('vaccinations')).toBe(stem('vaccination'));
    expect(tokenize('mon enfant est hyperactif')).toEqual(expect.arrayContaining(tokenize('TDAH')));
    expect(tokenize('trouble du spectre de l’autisme')).toEqual(expect.arrayContaining(tokenize('TSA')));
  });
  it.each([
    ['Mon fils a peut-être un TDAH, que faire ?', /tdah/i],
    ['Comment savoir si mon enfant est autiste ?', /autis|tsa/i],
    ['Puis-je manger du fromage au lait cru enceinte ?', /listeri|aliment|fromage/i],
    ['Quand faire un test de grossesse ?', /test/i],
    ['Mon bébé a de la fièvre', /fi[eè]vre/i],
  ])('répond à « %s » avec un article pertinent', (q, re) => {
    const a = answer(kb, q);
    expect(a.kind).toBe('answer');
    expect(`${a.main!.title} ${a.main!.slug}`).toMatch(re);
    expect(a.answer!.length).toBeGreaterThan(40);
    expect(a.main!.sources.length).toBeGreaterThan(0);
  });
  it('urgence : orientation immédiate, avant toute recherche', () => {
    const a = answer(kb, 'j’ai envie de me suicider');
    expect(a.kind).toBe('urgent');
    expect(a.urgent!.map((u) => u.number).join(' ')).toMatch(/3114/);
  });
  it('hors sujet : le dit au lieu d’inventer', () => {
    expect(answer(kb, 'quelle est la capitale de l’Australie').kind).toBe('none');
  });
});
