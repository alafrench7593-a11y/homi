/**
 * iPhone (Hermes) : Intl.PluralRules, Intl.RelativeTimeFormat et Intl.ListFormat peuvent manquer.
 * Avant la correction, `new Intl.ListFormat(...)` levait « undefined cannot be used as a constructor » et faisait
 * tomber Réglages, Profil et Outils. Ces tests retirent ces outils, comme sur iPhone, et vérifient les textes.
 */
import { listFormat, numberFormat, pluralCategory, relativeFormat, unitFormat } from '@/i18n/intlSafe';

const G = globalThis as unknown as { Intl: Record<string, unknown> };
const saved: Record<string, unknown> = {};
const MISSING = ['PluralRules', 'RelativeTimeFormat', 'ListFormat'];

describe('formats sans Intl complet (comme sur iPhone)', () => {
  beforeAll(() => {
    for (const k of MISSING) { saved[k] = G.Intl[k]; delete G.Intl[k]; }
    saved.NumberFormat = G.Intl.NumberFormat;
    // NumberFormat présent mais qui refuse le style « unit » (cas Hermes)
    const Real = saved.NumberFormat as new (t: string, o?: Intl.NumberFormatOptions) => Intl.NumberFormat;
    G.Intl.NumberFormat = function NF(tag: string, o?: Intl.NumberFormatOptions) {
      if (o?.style === 'unit') throw new RangeError('unit not supported');
      return new Real(tag, o);
    };
  });
  afterAll(() => { for (const [k, v] of Object.entries(saved)) G.Intl[k] = v; });

  it('les outils sont bien absents pendant le test', () => {
    expect(typeof G.Intl.ListFormat).toBe('undefined');
    expect(() => new (G.Intl.ListFormat as unknown as new () => unknown)()).toThrow(TypeError);
  });

  it('pluriels français et anglais', () => {
    expect(pluralCategory('fr-FR', 0)).toBe('one');
    expect(pluralCategory('fr-FR', 1)).toBe('one');
    expect(pluralCategory('fr-FR', 2)).toBe('other');
    expect(pluralCategory('en-GB', 1)).toBe('one');
    expect(pluralCategory('en-GB', 0)).toBe('other');
  });

  it('listes', () => {
    expect(listFormat('fr-FR', [])).toBe('');
    expect(listFormat('fr-FR', ['Léa'])).toBe('Léa');
    expect(listFormat('fr-FR', ['Léa', 'Tom'])).toBe('Léa et Tom');
    expect(listFormat('fr-FR', ['Léa', 'Tom', 'Zoé'])).toBe('Léa, Tom et Zoé');
    expect(listFormat('en-GB', ['A', 'B', 'C'])).toBe('A, B, and C');
  });

  it('durées relatives', () => {
    expect(relativeFormat('fr-FR', -3, 'hour')).toBe('il y a 3 heures');
    expect(relativeFormat('fr-FR', -1, 'minute')).toBe('il y a 1 minute');
    expect(relativeFormat('fr-FR', -1, 'day')).toBe('hier');
    expect(relativeFormat('fr-FR', 2, 'day')).toBe('dans 2 jours');
    expect(relativeFormat('fr-FR', 0, 'second')).toBe('maintenant');
    expect(relativeFormat('en-GB', -2, 'week')).toBe('2 weeks ago');
  });

  it('unités et nombres', () => {
    expect(unitFormat('fr-FR', 3.25, 'kilogram', 1)).toMatch(/^3,3\s?kg$|^3,2\s?kg$/);
    expect(unitFormat('fr-FR', 28, 'day', 0)).toMatch(/^28\s?j$/);
    expect(numberFormat('fr-FR', 1234.5)).toMatch(/1\s?234,5/);
  });

  it('la traduction avec pluriel et formatList fonctionnent sans ces outils', () => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const i18n = require('@/i18n') as typeof import('@/i18n');
      expect(() => i18n.formatList(['A', 'B'])).not.toThrow();
      expect(() => i18n.formatRelative(-5, 'minute')).not.toThrow();
      expect(() => i18n.formatUnit(120, 'milliliter', 0)).not.toThrow();
    });
  });
});

describe('formats avec Intl complet (web, Android)', () => {
  it('donne le même résultat qu’Intl', () => {
    expect(listFormat('fr-FR', ['Léa', 'Tom', 'Zoé'])).toBe(new Intl.ListFormat('fr-FR', { style: 'long', type: 'conjunction' }).format(['Léa', 'Tom', 'Zoé']));
    expect(relativeFormat('fr-FR', -3, 'hour')).toBe(new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto' }).format(-3, 'hour'));
  });
});
