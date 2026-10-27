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
    ['Quel sport faire enceinte ?', /bouger|sport|activit/i],
    ['Quel sport pour mon enfant de 7 ans ?', /sport/i],
    ['Mon enfant ne veut pas aller à l’école', /refus scolaire|[ée]cole/i],
    ['Quelle poussette choisir ?', /poussette/i],
    ['Pourquoi j’ai mal au ventre pendant mes règles ?', /r[eè]gles/i],
    ['J’ai des crampes pendant mes règles', /r[eè]gles/i],
    ['Peut-on faire du yoga enceinte ?', /yoga/i],
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

  it('règles, cycle, santé intime et contraception : le bon article', () => {
    const cases: [string, RegExp][] = [
      ['J’ai du retard dans mes règles', /^Retard de règles/],
      ['Mes règles sont très abondantes', /^Règles abondantes/],
      ['J’ai oublié ma pilule', /^Oubli de pilule/],
      ['Comment soulager le syndrome prémenstruel ?', /^Syndrome prémenstruel/],
      ['Combien de temps garder une coupe menstruelle ?', /^Coupe menstruelle/],
      ['J’ai une mycose', /^Mycose vaginale/],
      ['Ça brûle quand je fais pipi', /^Cystite/],
      ['J’ai des pertes qui sentent mauvais', /^Vaginose/],
      ['Comment se faire dépister des IST ?', /^Dépistage des IST/],
      ['Jusqu’à quand peut-on faire une IVG ?', /^IVG : tes droits/],
      ['C’est quoi l’endométriose ?', /^Endométriose : comprendre/],
      ['J’ai des bouffées de chaleur', /^Bouffées de chaleur/],
      ['Quand faire un test de grossesse ?', /test de grossesse/i],
      ['Quand mon bébé va-t-il perdre ses dents de lait ?', /^Chute des dents de lait/],
    ];
    for (const [q, re] of cases) expect([q, answer(kb, q).main?.title]).toEqual([q, expect.stringMatching(re)]);
  });
});
