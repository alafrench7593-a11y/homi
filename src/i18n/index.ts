/**
 * Traductions. Le français est la langue de référence ; l'anglais est préparé.
 * Ajouter une langue : créer un dictionnaire du même type et l'ajouter à `dictionaries`.
 */
import { getLocales } from 'expo-localization';
import { fr, type Dictionary } from './fr';
import { en } from './en';

const dictionaries: Record<string, Partial<Dictionary>> = { fr, en };

let current: string = (() => {
  try {
    const code = getLocales()[0]?.languageCode ?? 'fr';
    return code in dictionaries ? code : 'fr';
  } catch {
    return 'fr';
  }
})();

// Le français est imposé tant que les autres langues ne sont pas complètes et relues.
current = 'fr';

export function setLocale(code: string) {
  if (code in dictionaries) current = code;
}

export type TKey = keyof Dictionary;

export function t(key: TKey, params?: Record<string, string | number>): string {
  const raw = (dictionaries[current]?.[key] ?? fr[key] ?? key) as string;
  return params ? raw.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? '')) : raw;
}
