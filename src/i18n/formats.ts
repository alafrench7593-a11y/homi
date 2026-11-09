/**
 * Formats régionaux simples, sans dépendre d'Intl (absent ou partiel sur certains iPhone/Hermes) — 08/11/2026.
 *  - mois et jours écrits dans les 5 langues de l'interface ;
 *  - heures : « 14h30 » en français, « 14:30 » ailleurs ;
 *  - dates longues : « 8 novembre 2026 », « 8 November 2026 », « 8 de noviembre de 2026 », « 8. November 2026 », « 8 novembre 2026 ».
 * Les dates ENREGISTRÉES ne sont jamais modifiées : seul l'affichage change.
 */
import { getLocale } from './index';

export const MONTHS: Record<string, string[]> = {
  fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  it: ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'],
};
/** Jours courts, index ISO 1 = lundi … 7 = dimanche (index 0 vide). */
export const WEEKDAYS_SHORT: Record<string, string[]> = {
  fr: ['', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'],
  en: ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  es: ['', 'lun.', 'mar.', 'mié.', 'jue.', 'vie.', 'sáb.', 'dom.'],
  de: ['', 'Mo.', 'Di.', 'Mi.', 'Do.', 'Fr.', 'Sa.', 'So.'],
  it: ['', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'],
};

const lang = (l?: string) => (l && MONTHS[l] ? l : MONTHS[getLocale()] ? getLocale() : 'fr');
const p2 = (n: number) => String(n).padStart(2, '0');

export const monthName = (m0: number, l?: string) => MONTHS[lang(l)][m0];

/** « 8 novembre 2026 » selon la langue (jour, index de mois 0-11, année facultative). */
export function longDate(day: number, m0: number, year?: number | null, l?: string): string {
  const L = lang(l); const m = MONTHS[L][m0];
  switch (L) {
    case 'es': return `${day} de ${m}${year != null ? ` de ${year}` : ''}`;
    case 'de': return `${day}. ${m}${year != null ? ` ${year}` : ''}`;
    default: return `${day} ${m}${year != null ? ` ${year}` : ''}`;
  }
}

/** « 14h30 » (fr) ou « 14:30 » (autres langues). */
export function clockHM(h: number, m: number, l?: string): string {
  return lang(l) === 'fr' ? `${p2(h)}h${p2(m)}` : `${p2(h)}:${p2(m)}`;
}
/** Heure ronde sur un axe : « 18h » (fr) ou « 18:00 ». */
export function hourTick(h: number, l?: string): string {
  return lang(l) === 'fr' ? `${h}h` : `${p2(h)}:00`;
}
/** Séparateur décimal : virgule partout sauf en anglais. */
export const decimal = (n: number | string, l?: string) => (lang(l) === 'en' ? String(n) : String(n).replace('.', ','));
