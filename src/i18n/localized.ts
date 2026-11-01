/**
 * Contenu bilingue sans changer les écrans qui l'utilisent : `localized(FR, EN)` renvoie un objet (ou un tableau)
 * qui lit, À CHAQUE ACCÈS, la version de la langue en cours. L'anglais doit avoir la même forme que le français
 * (mêmes clés, même ordre, mêmes identifiants) ; seuls les textes affichés diffèrent.
 *   export const NIGHT_BANDS = localized(NIGHT_BANDS_FR, NIGHT_BANDS_EN);
 * Pour un simple texte calculé : `inLang({ fr: '…', en: '…' })`.
 */
import { getLocale } from './index';

const pick = <T,>(fr: T, en: T): T => (getLocale() === 'en' ? en : fr);

export function localized<T extends object>(fr: T, en: T): T {
  return new Proxy(fr, {
    get: (_t, prop) => {
      const target = pick(fr, en) as Record<PropertyKey, unknown>;
      const v = Reflect.get(target, prop, target);
      return typeof v === 'function' ? (v as (...a: unknown[]) => unknown).bind(target) : v;
    },
    has: (_t, prop) => Reflect.has(pick(fr, en), prop),
    ownKeys: () => Reflect.ownKeys(pick(fr, en)),
    getOwnPropertyDescriptor: (_t, prop) => {
      const d = Reflect.getOwnPropertyDescriptor(pick(fr, en), prop);
      return d ? { ...d, configurable: true } : undefined;
    },
  }) as T;
}

export function inLang(v: { fr: string; en: string }): string {
  return pick(v.fr, v.en);
}
