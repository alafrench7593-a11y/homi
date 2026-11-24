/**
 * Dictionnaires par langue, assemblés par domaine. Le français est la SOURCE : chaque autre langue
 * est typée `Messages<…>` et doit fournir exactement les mêmes clés (sinon la compilation échoue).
 */
import * as fr from './fr';
import type { Msg } from './types';

type Mods = Record<string, Record<string, Msg>>;
const flat = (mods: Mods) => Object.assign({}, ...Object.values(mods)) as Record<string, Msg>;

export const FR = flat(fr as unknown as Mods);

/*
 * Démarrage (24/11/2026) : seule la langue utilisée est préparée. Le français (source et repli) l'est toujours ; les
 * autres langues ne sont évaluées qu'au premier accès (`require` dans une fonction : Metro n'exécute un module qu'à
 * son premier appel). Chaque langue reste typée et vérifiée à la compilation dans son propre dossier.
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const LOADERS: Record<string, () => Mods> = {
  en: () => require('./en') as Mods,
  es: () => require('./es') as Mods,
  de: () => require('./de') as Mods,
  it: () => require('./it') as Mods,
};
/* eslint-enable @typescript-eslint/no-require-imports */

/** Même forme qu'avant ({ fr, en, es, de, it }), mais chaque langue autre que le français est construite à la demande. */
export const DICTIONARIES: Record<string, Record<string, Msg>> = { fr: FR };
for (const [code, load] of Object.entries(LOADERS)) {
  let cache: Record<string, Msg> | null = null;
  Object.defineProperty(DICTIONARIES, code, { enumerable: true, configurable: false, get: () => (cache ??= flat(load())) });
}
export type SourceDict = typeof fr;
