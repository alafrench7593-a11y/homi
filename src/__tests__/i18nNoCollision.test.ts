/**
 * Collisions de clés entre modules d'une même langue (09/11/2026).
 * Les dictionnaires sont assemblés par Object.assign : si deux modules définissent la même clé avec des valeurs
 * différentes, le dernier écrase l'autre et un écran affiche le texte d'un autre écran
 * (ex. « pr.title » du parcours post-partum remplacé par « Produits pour enfants »).
 * Une clé répétée avec la MÊME valeur est tolérée (sans effet à l'écran).
 */
import * as fr from '@/i18n/fr';
import * as en from '@/i18n/en';
import * as es from '@/i18n/es';
import * as de from '@/i18n/de';
import * as itMods from '@/i18n/it';

const LANGS: Record<string, Record<string, Record<string, unknown>>> = {
  fr: fr as never, en: en as never, es: es as never, de: de as never, it: itMods as never,
};

function collisions(mods: Record<string, Record<string, unknown>>): string[] {
  const seen = new Map<string, { mod: string; value: string }>();
  const out: string[] = [];
  for (const [mod, dict] of Object.entries(mods)) {
    if (!dict || typeof dict !== 'object') continue;
    for (const [key, v] of Object.entries(dict)) {
      const value = JSON.stringify(v);
      const prev = seen.get(key);
      if (prev && prev.value !== value) out.push(`${key} : « ${prev.mod} » ≠ « ${mod} »`);
      else if (!prev) seen.set(key, { mod, value });
    }
  }
  return out;
}

describe('dictionnaires : aucune clé définie deux fois avec des textes différents', () => {
  for (const [lang, mods] of Object.entries(LANGS)) {
    it(`${lang} : aucune collision de clé entre modules`, () => {
      expect(Object.keys(mods).length).toBeGreaterThan(10);
      expect(collisions(mods)).toEqual([]);
    });
  }

  it('le détecteur repère bien une collision', () => {
    expect(collisions({ a: { 'x.y': 'un' }, b: { 'x.y': 'deux' } })).toEqual(['x.y : « a » ≠ « b »']);
    expect(collisions({ a: { 'x.y': 'un' }, b: { 'x.y': 'un' } })).toEqual([]);
  });
});
