/**
 * Langues de l'application. Une langue n'est proposée (`available`) que si TOUS ses textes sont
 * présents et relus ; les autres sont listées comme « en préparation » et jamais présentées comme finies.
 * Ajouter une langue : créer src/i18n/<code>/*.ts (mêmes clés que le français), l'enregistrer dans
 * dictionaries.ts, puis passer `status` à 'available' après relecture par une personne de langue maternelle.
 */
export type LocaleStatus = 'available' | 'planned';
export interface LocaleInfo { code: string; native: string; dir: 'ltr' | 'rtl'; status: LocaleStatus; /** étiquette BCP 47 pour Intl (dates, nombres) */ tag: string }

export const LOCALES: LocaleInfo[] = [
  { code: 'fr', native: 'Français', dir: 'ltr', status: 'available', tag: 'fr-FR' },
  { code: 'en', native: 'English', dir: 'ltr', status: 'available', tag: 'en-GB' },
  { code: 'es', native: 'Español', dir: 'ltr', status: 'planned', tag: 'es-ES' },
  { code: 'it', native: 'Italiano', dir: 'ltr', status: 'planned', tag: 'it-IT' },
  { code: 'pt', native: 'Português', dir: 'ltr', status: 'planned', tag: 'pt-PT' },
  { code: 'de', native: 'Deutsch', dir: 'ltr', status: 'planned', tag: 'de-DE' },
  { code: 'nl', native: 'Nederlands', dir: 'ltr', status: 'planned', tag: 'nl-NL' },
  { code: 'ar', native: 'العربية', dir: 'rtl', status: 'planned', tag: 'ar' },
  { code: 'he', native: 'עברית', dir: 'rtl', status: 'planned', tag: 'he-IL' },
  { code: 'tr', native: 'Türkçe', dir: 'ltr', status: 'planned', tag: 'tr-TR' },
  { code: 'pl', native: 'Polski', dir: 'ltr', status: 'planned', tag: 'pl-PL' },
  { code: 'ro', native: 'Română', dir: 'ltr', status: 'planned', tag: 'ro-RO' },
  { code: 'el', native: 'Ελληνικά', dir: 'ltr', status: 'planned', tag: 'el-GR' },
  { code: 'sv', native: 'Svenska', dir: 'ltr', status: 'planned', tag: 'sv-SE' },
  { code: 'da', native: 'Dansk', dir: 'ltr', status: 'planned', tag: 'da-DK' },
  { code: 'nb', native: 'Norsk', dir: 'ltr', status: 'planned', tag: 'nb-NO' },
  { code: 'fi', native: 'Suomi', dir: 'ltr', status: 'planned', tag: 'fi-FI' },
  { code: 'cs', native: 'Čeština', dir: 'ltr', status: 'planned', tag: 'cs-CZ' },
  { code: 'hu', native: 'Magyar', dir: 'ltr', status: 'planned', tag: 'hu-HU' },
  { code: 'uk', native: 'Українська', dir: 'ltr', status: 'planned', tag: 'uk-UA' },
  { code: 'ru', native: 'Русский', dir: 'ltr', status: 'planned', tag: 'ru-RU' },
  { code: 'ja', native: '日本語', dir: 'ltr', status: 'planned', tag: 'ja-JP' },
  { code: 'ko', native: '한국어', dir: 'ltr', status: 'planned', tag: 'ko-KR' },
  { code: 'zh-Hans', native: '简体中文', dir: 'ltr', status: 'planned', tag: 'zh-Hans' },
  { code: 'zh-Hant', native: '繁體中文', dir: 'ltr', status: 'planned', tag: 'zh-Hant' },
  { code: 'hi', native: 'हिन्दी', dir: 'ltr', status: 'planned', tag: 'hi-IN' },
  { code: 'id', native: 'Bahasa Indonesia', dir: 'ltr', status: 'planned', tag: 'id-ID' },
  { code: 'th', native: 'ไทย', dir: 'ltr', status: 'planned', tag: 'th-TH' },
  { code: 'vi', native: 'Tiếng Việt', dir: 'ltr', status: 'planned', tag: 'vi-VN' },
  { code: 'bg', native: 'Български', dir: 'ltr', status: 'planned', tag: 'bg-BG' },
  { code: 'hr', native: 'Hrvatski', dir: 'ltr', status: 'planned', tag: 'hr-HR' },
  { code: 'sk', native: 'Slovenčina', dir: 'ltr', status: 'planned', tag: 'sk-SK' },
  { code: 'sl', native: 'Slovenščina', dir: 'ltr', status: 'planned', tag: 'sl-SI' },
  { code: 'sr', native: 'Srpski', dir: 'ltr', status: 'planned', tag: 'sr-Latn' },
  { code: 'lt', native: 'Lietuvių', dir: 'ltr', status: 'planned', tag: 'lt-LT' },
  { code: 'lv', native: 'Latviešu', dir: 'ltr', status: 'planned', tag: 'lv-LV' },
  { code: 'et', native: 'Eesti', dir: 'ltr', status: 'planned', tag: 'et-EE' },
  { code: 'fa', native: 'فارسی', dir: 'rtl', status: 'planned', tag: 'fa-IR' },
];

export const SOURCE_LOCALE = 'fr';
export const availableLocales = () => LOCALES.filter((l) => l.status === 'available');
export const localeInfo = (code: string) => LOCALES.find((l) => l.code === code) ?? LOCALES[0];

/** Langue proposée à la première ouverture : celle du téléphone si elle est disponible, sinon l'anglais (international), le français pour la francophonie. */
export function proposeLocale(deviceLanguages: string[]): string {
  for (const raw of deviceLanguages) {
    const code = raw.toLowerCase();
    const hit = availableLocales().find((l) => l.code === code || code.startsWith(`${l.code}-`));
    if (hit) return hit.code;
  }
  return 'en';
}

/** Pays de résidence (distinct de la langue) : pour adapter urgences et contenus de santé. */
export const REGIONS: { code: string; fr: string; en: string; emergency: string }[] = [
  { code: 'FR', fr: 'France', en: 'France', emergency: '15 · 112 · 3114' },
  { code: 'BE', fr: 'Belgique', en: 'Belgium', emergency: '112' },
  { code: 'CH', fr: 'Suisse', en: 'Switzerland', emergency: '144 · 112' },
  { code: 'LU', fr: 'Luxembourg', en: 'Luxembourg', emergency: '112' },
  { code: 'CA', fr: 'Canada', en: 'Canada', emergency: '911' },
  { code: 'GB', fr: 'Royaume-Uni', en: 'United Kingdom', emergency: '999 · 112' },
  { code: 'IE', fr: 'Irlande', en: 'Ireland', emergency: '112 · 999' },
  { code: 'US', fr: 'États-Unis', en: 'United States', emergency: '911' },
  { code: 'ES', fr: 'Espagne', en: 'Spain', emergency: '112' },
  { code: 'IT', fr: 'Italie', en: 'Italy', emergency: '112' },
  { code: 'DE', fr: 'Allemagne', en: 'Germany', emergency: '112' },
  { code: 'PT', fr: 'Portugal', en: 'Portugal', emergency: '112' },
  { code: 'AE', fr: 'Émirats arabes unis', en: 'United Arab Emirates', emergency: '999 · 998' },
  { code: 'MA', fr: 'Maroc', en: 'Morocco', emergency: '15 · 19 · 112' },
  { code: 'OTHER', fr: 'Autre pays', en: 'Another country', emergency: '112' },
];

/** Pays proposé tant que la personne n'a rien choisi : la RÉGION du téléphone (jamais déduite de la langue). */
export function defaultRegion(deviceRegionCode: string | null | undefined): string {
  const c = (deviceRegionCode ?? '').toUpperCase();
  return REGIONS.some((r) => r.code === c) ? c : c ? 'OTHER' : 'FR';
}
