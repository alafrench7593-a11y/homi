/**
 * Formats Intl « sûrs » pour iPhone.
 *
 * Le moteur JavaScript de l'application sur iOS (Hermes) ne fournit pas tous les outils Intl du navigateur :
 * Intl.PluralRules, Intl.RelativeTimeFormat et Intl.ListFormat peuvent être absents, et Intl.NumberFormat peut
 * refuser certaines options (style « unit »). Appeler `new Intl.ListFormat(...)` quand il manque provoque
 * « undefined cannot be used as a constructor » et fait tomber l'écran entier (Réglages, Profil, Outils…).
 *
 * Chaque fonction ci-dessous utilise Intl s'il existe et fonctionne, sinon un équivalent écrit à la main pour le
 * français et l'anglais (les deux langues de l'application). Le résultat reste le même que celui d'Intl dans les
 * cas courants.
 */
type IntlLike = Record<string, unknown>;
const intl = (): IntlLike => ((globalThis as { Intl?: IntlLike }).Intl ?? {}) as IntlLike;
const has = (name: string) => typeof intl()[name] === 'function';
const isFr = (tag: string) => tag.toLowerCase().startsWith('fr');

export type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';

const pluralCache = new Map<string, { select(n: number): string }>();
/** Catégorie de pluriel (« one » / « other »…) : Intl.PluralRules s'il existe, sinon règles françaises / anglaises. */
export function pluralCategory(tag: string, n: number): PluralCategory {
  if (has('PluralRules')) {
    try {
      let pr = pluralCache.get(tag);
      if (!pr) { pr = new (intl().PluralRules as new (t: string) => { select(n: number): string })(tag); pluralCache.set(tag, pr); }
      return pr.select(n) as PluralCategory;
    } catch { /* équivalent manuel ci-dessous */ }
  }
  const a = Math.abs(n);
  if (isFr(tag)) return a < 2 ? 'one' : 'other';
  return a === 1 ? 'one' : 'other';
}

/** « A, B et C » / « A, B, and C ». */
export function listFormat(tag: string, items: string[]): string {
  if (has('ListFormat')) {
    try {
      const LF = intl().ListFormat as new (t: string, o: object) => { format(i: string[]): string };
      return new LF(tag, { style: 'long', type: 'conjunction' }).format(items);
    } catch { /* équivalent manuel */ }
  }
  if (items.length <= 1) return items.join('');
  if (items.length === 2) return `${items[0]} ${isFr(tag) ? 'et' : 'and'} ${items[1]}`;
  const head = items.slice(0, -1).join(', ');
  return isFr(tag) ? `${head} et ${items[items.length - 1]}` : `${head}, and ${items[items.length - 1]}`;
}

export type RelUnit = 'second' | 'seconds' | 'minute' | 'minutes' | 'hour' | 'hours' | 'day' | 'days' | 'week' | 'weeks' | 'month' | 'months' | 'year' | 'years' | 'quarter' | 'quarters';
const FR_UNITS: Record<string, [string, string]> = {
  second: ['seconde', 'secondes'], minute: ['minute', 'minutes'], hour: ['heure', 'heures'], day: ['jour', 'jours'],
  week: ['semaine', 'semaines'], month: ['mois', 'mois'], year: ['an', 'ans'], quarter: ['trimestre', 'trimestres'],
};
const EN_UNITS: Record<string, [string, string]> = {
  second: ['second', 'seconds'], minute: ['minute', 'minutes'], hour: ['hour', 'hours'], day: ['day', 'days'],
  week: ['week', 'weeks'], month: ['month', 'months'], year: ['year', 'years'], quarter: ['quarter', 'quarters'],
};

/** « il y a 3 heures », « hier », « dans 2 jours » (numeric: 'auto'). */
export function relativeFormat(tag: string, value: number, unit: RelUnit): string {
  if (has('RelativeTimeFormat')) {
    try {
      const RTF = intl().RelativeTimeFormat as new (t: string, o: object) => { format(v: number, u: string): string };
      return new RTF(tag, { numeric: 'auto' }).format(value, unit);
    } catch { /* équivalent manuel */ }
  }
  const u = unit.replace(/s$/, '');
  const fr = isFr(tag);
  if (u === 'second' && value === 0) return fr ? 'maintenant' : 'now';
  if (u === 'day' && value === 0) return fr ? 'aujourd’hui' : 'today';
  if (u === 'day' && value === -1) return fr ? 'hier' : 'yesterday';
  if (u === 'day' && value === 1) return fr ? 'demain' : 'tomorrow';
  const n = Math.abs(value);
  const names = (fr ? FR_UNITS : EN_UNITS)[u] ?? [u, `${u}s`];
  const word = pluralCategory(tag, n) === 'one' ? names[0] : names[1];
  const num = numberFormat(tag, n);
  if (value < 0) return fr ? `il y a ${num} ${word}` : `${num} ${word} ago`;
  return fr ? `dans ${num} ${word}` : `in ${num} ${word}`;
}

/** Nombre localisé ; sans Intl : séparateur décimal et regroupement à la main. */
export function numberFormat(tag: string, n: number, opts?: Intl.NumberFormatOptions): string {
  if (has('NumberFormat')) {
    try {
      const NF = intl().NumberFormat as new (t: string, o?: object) => { format(n: number): string };
      return new NF(tag, opts).format(n);
    } catch { /* équivalent manuel */ }
  }
  const max = opts?.maximumFractionDigits ?? 3;
  const min = Math.min(opts?.minimumFractionDigits ?? 0, max);
  let s = n.toFixed(max);
  if (s.includes('.')) {
    s = s.replace(/0+$/, '');
    const dec = s.split('.')[1] ?? '';
    if (dec.length < min) s = s.replace(/\.?$/, '.') + '0'.repeat(min - dec.length);
    s = s.replace(/\.$/, '');
  }
  const [int, dec] = s.split('.');
  const sep = isFr(tag) ? ' ' : ',';
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  return dec ? `${grouped}${isFr(tag) ? ',' : '.'}${dec}` : grouped;
}

const UNIT_SHORT: Record<string, { fr: string; en: string }> = {
  kilogram: { fr: 'kg', en: 'kg' }, gram: { fr: 'g', en: 'g' }, centimeter: { fr: 'cm', en: 'cm' },
  milliliter: { fr: 'ml', en: 'mL' }, celsius: { fr: '°C', en: '°C' }, minute: { fr: 'min', en: 'min' },
  hour: { fr: 'h', en: 'hr' }, day: { fr: 'j', en: 'd' }, week: { fr: 'sem.', en: 'wk' },
};
/** « 3,2 kg », « 120 ml » : Intl (style unit) s'il l'accepte, sinon nombre + abréviation. */
export function unitFormat(tag: string, n: number, unit: keyof typeof UNIT_SHORT, digits: number): string {
  if (has('NumberFormat')) {
    try {
      const NF = intl().NumberFormat as new (t: string, o?: object) => { format(n: number): string };
      return new NF(tag, { style: 'unit', unit, unitDisplay: 'short', maximumFractionDigits: digits }).format(n);
    } catch { /* équivalent manuel */ }
  }
  const short = UNIT_SHORT[unit] ?? { fr: unit, en: unit };
  const value = numberFormat(tag, n, { maximumFractionDigits: digits });
  return unit === 'celsius' ? `${value}${isFr(tag) ? ' ' : ''}${short.fr}` : `${value} ${isFr(tag) ? short.fr : short.en}`;
}
