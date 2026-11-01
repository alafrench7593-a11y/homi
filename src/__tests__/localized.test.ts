import { setLocale } from '@/i18n';
import { inLang, localized } from '@/i18n/localized';

describe('contenu bilingue', () => {
  afterEach(() => setLocale('fr'));
  it('objets et tableaux suivent la langue en cours, à chaque accès', () => {
    const L = localized({ a: 'Bonjour', list: ['un', 'deux'] }, { a: 'Hello', list: ['one', 'two'] });
    const A = localized([{ id: 'x', label: 'Nuit' }], [{ id: 'x', label: 'Night' }]);
    expect(L.a).toBe('Bonjour');
    expect(A.map((x) => x.label)).toEqual(['Nuit']);
    setLocale('en');
    expect(L.a).toBe('Hello');
    expect(L.list.join(',')).toBe('one,two');
    expect(A.map((x) => x.label)).toEqual(['Night']);
    expect(A.find((x) => x.id === 'x')?.label).toBe('Night');
    expect(Object.keys(L)).toEqual(['a', 'list']);
    expect({ ...L }.a).toBe('Hello');
    expect(A.length).toBe(1);
    expect(inLang({ fr: 'oui', en: 'yes' })).toBe('yes');
  });
});

describe('textes fixes des contenus', () => {
  afterEach(() => setLocale('fr'));
  it('suivent le changement de langue (lecture de la valeur à jour)', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fertility = require('@/content/fertility');
    const fr = fertility.TTC_DISCLAIMER as string;
    setLocale('en');
    expect(fertility.TTC_DISCLAIMER).not.toBe(fr);
    setLocale('fr');
    expect(fertility.TTC_DISCLAIMER).toBe(fr);
  });
});
