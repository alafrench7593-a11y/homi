/**
 * Internationalisation : traduction (clés `domaine.ecran.element`), pluriels (Intl.PluralRules),
 * variables {nom}, dates, heures, nombres et unités (Intl) dans la langue choisie.
 *  - Langue d'affichage ≠ pays de résidence (src/i18n/locales.ts) : on ne déduit jamais l'un de l'autre.
 *  - Première ouverture : la langue du téléphone est PROPOSÉE si elle est disponible, jamais imposée.
 *  - Clé absente d'une langue → repli sur le français (source), signalé en développement ;
 *    une clé technique n'est jamais affichée telle quelle (repli lisible).
 *  - Changement de langue sans perte de données (préférence de l'appareil + profil).
 */
import { getLocales } from 'expo-localization';
import { DICTIONARIES, FR } from './dictionaries';
import { availableLocales, localeInfo, proposeLocale, SOURCE_LOCALE } from './locales';
import type { Msg, Plural } from './types';
import type * as FrModules from './fr';

type Union<T> = T[keyof T];
type KeysOf<M> = M extends Record<string, unknown> ? keyof M : never;
/** Toutes les clés connues (vérifiées à la compilation). */
export type TKey = Extract<KeysOf<Union<typeof FrModules>>, string> | keyof typeof FrModules.legacy;

export function deviceLanguages(): string[] {
  try { return getLocales().map((l) => l.languageTag || l.languageCode || '').filter(Boolean); } catch { return []; }
}
export function deviceRegion(): string | null {
  try { return getLocales()[0]?.regionCode ?? null; } catch { return null; }
}

let current: string = SOURCE_LOCALE;
const listeners = new Set<(code: string) => void>();
const missing = new Set<string>();

export function getLocale() { return current; }
/** Étiquette BCP 47 pour Intl (dates, nombres) : « fr-FR », « en-GB »… */
export function localeTag() { return localeInfo(current).tag; }
export function isRTL() { return localeInfo(current).dir === 'rtl'; }

/** Applique une langue disponible (sinon ignorée). Notifie l'interface (re-rendu). */
export function setLocale(code: string) {
  if (!availableLocales().some((l) => l.code === code) || code === current) return;
  current = code;
  syncDocumentLang();
  listeners.forEach((l) => l(code));
}

/**
 * Web : la page déclare la langue affichée (<html lang>) — lecteurs d'écran, césure des mots (D-16, QA 02/11/2026).
 * Sans effet sur iOS/Android.
 */
export function syncDocumentLang() {
  if (typeof document !== 'undefined' && document.documentElement) document.documentElement.lang = localeTag();
}
export function onLocaleChange(cb: (code: string) => void) { listeners.add(cb); return () => { listeners.delete(cb); }; }
/** Langue initiale : choix enregistré, sinon proposition d'après le téléphone. */
export function initialLocale(saved: string | null | undefined) {
  return saved && availableLocales().some((l) => l.code === saved) ? saved : proposeLocale(deviceLanguages());
}

const pluralCache = new Map<string, Intl.PluralRules>();
function pluralForm(m: Plural, count: number) {
  const tag = localeTag();
  let pr = pluralCache.get(tag);
  if (!pr) { pr = new Intl.PluralRules(tag); pluralCache.set(tag, pr); }
  if (count === 0 && m.zero != null) return m.zero;
  const cat = pr.select(count) as keyof Plural;
  return (m[cat] as string | undefined) ?? m.other;
}

function resolve(key: string): Msg | undefined {
  const own = DICTIONARIES[current]?.[key];
  if (own != null) return own;
  if (current !== SOURCE_LOCALE && !missing.has(key)) {
    missing.add(key);
    if (typeof __DEV__ !== 'undefined' && __DEV__) console.warn(`[i18n] clé absente en « ${current} » : ${key}`);
  }
  return FR[key];
}

/** Traduit une clé ; `params.count` choisit la forme plurielle ; {nom} est remplacé par params.nom. */
export function t(key: TKey, params?: Record<string, string | number>): string {
  const m = resolve(key);
  let raw: string;
  if (m == null) raw = humanize(key);
  else if (typeof m === 'string') raw = m;
  else raw = pluralForm(m, Number(params?.count ?? 0));
  if (!params) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, k) => (params[k] == null ? '' : typeof params[k] === 'number' ? formatNumber(params[k] as number) : String(params[k])));
}

/** Texte facultatif : null si la clé n'existe pas (ex. précision d'un outil), au lieu d'un repli lisible. */
export function tMaybe(key: string, params?: Record<string, string | number>): string | null {
  return resolve(key) == null ? null : t(key as TKey, params);
}

/** Jamais de clé technique à l'écran : dernier segment rendu lisible. */
function humanize(key: string) {
  const last = key.split('.').pop() ?? key;
  return last.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
}

/** Clés absentes rencontrées dans la langue courante (outils de vérification, tests). */
export function missingKeys() { return [...missing]; }

// ------------------------------------------------------------------ formats (Intl, langue courante, fuseau de l'appareil)
export function formatNumber(n: number, opts?: Intl.NumberFormatOptions) { return new Intl.NumberFormat(localeTag(), opts).format(n); }
export function formatDate(d: Date | string | number, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }) {
  return new Date(d).toLocaleDateString(localeTag(), opts);
}
export function formatTime(d: Date | string | number, opts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }) {
  return new Date(d).toLocaleTimeString(localeTag(), opts);
}
/** Unité localisée (« 3,2 kg », « 120 mL ») via Intl. */
export function formatUnit(n: number, unit: 'kilogram' | 'gram' | 'centimeter' | 'milliliter' | 'celsius' | 'minute' | 'hour' | 'day' | 'week', digits = 1) {
  return new Intl.NumberFormat(localeTag(), { style: 'unit', unit, unitDisplay: 'short', maximumFractionDigits: digits }).format(n);
}
/** Durée relative (« il y a 3 heures », « in 2 days ») via Intl.RelativeTimeFormat. */
export function formatRelative(value: number, unit: Intl.RelativeTimeFormatUnit) {
  return new Intl.RelativeTimeFormat(localeTag(), { numeric: 'auto' }).format(value, unit);
}
export function formatList(items: string[]) {
  return new Intl.ListFormat(localeTag(), { style: 'long', type: 'conjunction' }).format(items);
}
