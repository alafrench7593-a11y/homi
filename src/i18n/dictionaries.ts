/**
 * Dictionnaires par langue, assemblés par domaine. Le français est la SOURCE : chaque autre langue
 * est typée `Messages<…>` et doit fournir exactement les mêmes clés (sinon la compilation échoue).
 */
import * as fr from './fr';
import * as en from './en';
import type { Msg } from './types';

const flat = (mods: Record<string, Record<string, Msg>>) => Object.assign({}, ...Object.values(mods)) as Record<string, Msg>;

export const FR = flat(fr as unknown as Record<string, Record<string, Msg>>);
export const DICTIONARIES: Record<string, Record<string, Msg>> = {
  fr: FR,
  en: flat(en as unknown as Record<string, Record<string, Msg>>),
};
export type SourceDict = typeof fr;
