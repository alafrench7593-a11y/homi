/**
 * Contenu multilingue sans changer les écrans qui l'utilisent : `localized(FR, EN, { es, de, it })` renvoie un objet
 * (ou un tableau) qui lit, À CHAQUE ACCÈS, la version de la langue en cours. Chaque version doit avoir la même forme
 * que le français (mêmes clés, même ordre, mêmes identifiants) ; seuls les textes affichés diffèrent.
 *   export const NIGHT_BANDS = localized(NIGHT_BANDS_FR, NIGHT_BANDS_EN, { es: NIGHT_BANDS_ES, de: NIGHT_BANDS_DE, it: NIGHT_BANDS_IT });
 * Langue absente → français (langue source et de secours).
 * Pour un simple texte calculé : `inLang({ fr: '…', en: '…', es: '…', de: '…', it: '…' })`.
 */
import { getLocale } from './index';

export type MoreLangs<T> = Partial<Record<'es' | 'de' | 'it', T>>;

const pick = <T,>(fr: T, en: T, more?: MoreLangs<T>): T => {
  const l = getLocale();
  if (l === 'en') return en;
  if (l === 'es' || l === 'de' || l === 'it') return more?.[l] ?? fr;
  return fr;
};

export function localized<T extends object>(fr: T, en: T, more?: MoreLangs<T>): T {
  return new Proxy(fr, {
    get: (_t, prop) => {
      const target = pick(fr, en, more) as Record<PropertyKey, unknown>;
      const v = Reflect.get(target, prop, target);
      return typeof v === 'function' ? (v as (...a: unknown[]) => unknown).bind(target) : v;
    },
    has: (_t, prop) => Reflect.has(pick(fr, en, more), prop),
    ownKeys: () => Reflect.ownKeys(pick(fr, en, more)),
    getOwnPropertyDescriptor: (_t, prop) => {
      const d = Reflect.getOwnPropertyDescriptor(pick(fr, en, more), prop);
      return d ? { ...d, configurable: true } : undefined;
    },
  }) as T;
}

export function inLang(v: { fr: string; en: string } & MoreLangs<string>): string {
  return pick(v.fr, v.en, v);
}
