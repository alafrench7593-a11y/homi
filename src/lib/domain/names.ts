/**
 * Base de prénoms : Fichier des prénoms de l'INSEE (état civil, Licence Ouverte Etalab), via le paquet R
 * « prenoms » (ThinkR, MIT) — src/content/firstnames.json — complétée par la liste éditoriale (origine,
 * signification) de la table baby_names. Aucun site n'est aspiré.
 * Popularité = nombre de naissances en France de 2012 à 2021 (source INSEE) ; mixte = ni l'un ni l'autre sexe
 * ne dépasse 90 % des naissances. Les suggestions (fratrie, jumeaux) sont des rapprochements simples
 * (initiale, sonorité finale, longueur, fréquence), présentés comme tels.
 */
export type Gender = 'f' | 'm' | 'x';
export type Pop = 'very' | 'common' | 'uncommon' | 'rare' | 'old';
export type Len = 'short' | 'medium' | 'long';
export interface NameEntry { name: string; gender: Gender; recent: number; total: number; origin?: string | null; meaning?: string | null; key: string }

export const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, '').trim();

export function popOf(recent: number): Pop {
  if (recent === 0) return 'old';
  if (recent >= 10000) return 'very';
  if (recent >= 1000) return 'common';
  if (recent >= 100) return 'uncommon';
  return 'rare';
}
export function lenOf(name: string): Len {
  const n = [...name.replace(/[-\s]/g, '')].length;
  return n <= 4 ? 'short' : n <= 7 ? 'medium' : 'long';
}

interface Raw { names: [string, Gender, number, number][] }
interface Curated { name: string; usage: ('feminine' | 'masculine' | 'mixed')[]; origin: string | null; meaning: string | null }

/** Fusion INSEE + liste éditoriale (un prénom de la liste absent de l'INSEE est ajouté, sans popularité). */
export function buildNames(raw: Raw, curated: Curated[]): NameEntry[] {
  const byKey = new Map<string, NameEntry>();
  for (const [name, gender, recent, total] of raw.names) byKey.set(fold(name), { name, gender, recent, total, key: fold(name) });
  for (const c of curated) {
    const k = fold(c.name);
    const g: Gender = c.usage.includes('mixed') || c.usage.length > 1 ? 'x' : c.usage[0] === 'feminine' ? 'f' : 'm';
    const cur = byKey.get(k);
    if (cur) { cur.origin = c.origin; cur.meaning = c.meaning; }
    else byKey.set(k, { name: c.name, gender: g, recent: 0, total: 0, origin: c.origin, meaning: c.meaning, key: k });
  }
  return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

export interface NameFilter { q?: string; letter?: string | null; gender?: Gender | null; len?: Len | null; pop?: Pop | null; origin?: string | null; withMeaning?: boolean; sort?: 'az' | 'pop' }

export function filterNames(all: NameEntry[], f: NameFilter): NameEntry[] {
  const q = fold(f.q ?? '');
  let out = all.filter((n) =>
    (!f.letter || n.key.startsWith(fold(f.letter)))
    && (!f.gender || n.gender === f.gender)
    && (!f.len || lenOf(n.name) === f.len)
    && (!f.pop || popOf(n.recent) === f.pop)
    && (!f.origin || fold(n.origin ?? '').includes(fold(f.origin)))
    && (!f.withMeaning || !!n.meaning)
    && (!q || n.key.includes(q) || fold(n.origin ?? '').includes(q) || fold(n.meaning ?? '').includes(q)));
  if (q) out = out.sort((a, b) => Number(!b.key.startsWith(q)) - Number(!a.key.startsWith(q)) || b.recent - a.recent);
  else if (f.sort === 'pop') out = [...out].sort((a, b) => b.recent - a.recent || a.name.localeCompare(b.name, 'fr'));
  return out;
}

export const originsOf = (all: NameEntry[]) => [...new Set(all.map((n) => n.origin).filter((x): x is string => !!x))].sort((a, b) => a.localeCompare(b, 'fr'));

const ending = (k: string) => k.slice(-2);
const popRank: Record<Pop, number> = { very: 4, common: 3, uncommon: 2, rare: 1, old: 0 };

/**
 * Suggestions pour une fratrie : prénoms de fréquence et de longueur proches de ceux des aînés,
 * mais d'une autre initiale et d'une autre fin (pour éviter les confusions). Classés par fréquence récente.
 */
export function siblingSuggestions(all: NameEntry[], siblings: string[], gender: Gender | null, n = 12): NameEntry[] {
  const sib = siblings.map((s) => all.find((x) => x.key === fold(s))).filter((x): x is NameEntry => !!x);
  if (!sib.length) return [];
  const pops = new Set(sib.map((s) => popOf(s.recent)));
  const lens = new Set(sib.map((s) => lenOf(s.name)));
  const initials = new Set(sib.map((s) => s.key[0]));
  const ends = new Set(sib.map((s) => ending(s.key)));
  return all.filter((x) => x.recent > 0 && (!gender || x.gender === gender) && !sib.some((s) => s.key === x.key)
    && pops.has(popOf(x.recent)) && lens.has(lenOf(x.name)) && !initials.has(x.key[0]) && !ends.has(ending(x.key)))
    .sort((a, b) => b.recent - a.recent).slice(0, n);
}

/** Suggestions pour jumeaux ou triplés à partir d'un prénom choisi : même initiale, ou même sonorité finale. */
export function twinSuggestions(all: NameEntry[], base: string, gender: Gender | null, n = 8): { sameInitial: NameEntry[]; sameEnding: NameEntry[] } {
  const b = all.find((x) => x.key === fold(base));
  if (!b) return { sameInitial: [], sameEnding: [] };
  const near = (x: NameEntry) => x.key !== b.key && x.recent > 0 && (!gender || x.gender === gender) && Math.abs(popRank[popOf(x.recent)] - popRank[popOf(b.recent)]) <= 1 && lenOf(x.name) === lenOf(b.name);
  const byPop = (a: NameEntry, c: NameEntry) => c.recent - a.recent;
  return {
    sameInitial: all.filter((x) => near(x) && x.key[0] === b.key[0]).sort(byPop).slice(0, n),
    sameEnding: all.filter((x) => near(x) && ending(x.key) === ending(b.key) && x.key[0] !== b.key[0]).sort(byPop).slice(0, n),
  };
}

export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
