/**
 * Recherche d'un outil « par besoin » — locale, sans réseau, sans IA, et honnête.
 *
 * Chaque outil a un petit index de besoins dans la langue active : son nom, ses mots-clés, synonymes et tournures
 * courantes (`th.<outil>.k`, séparés par « ; »), sa description. La requête est normalisée (casse, accents,
 * apostrophes, ponctuation, mots vides) puis chaque mot utile est comparé aux mots de l'index (égalité, pluriel,
 * début de mot, faute d'une lettre sur un mot long). Un score classe les outils :
 *   - un mot rare pèse plus qu'un mot fréquent (« mesurette » plus que « bébé ») ;
 *   - le nom compte plus que les mots-clés, qui comptent plus que la description ;
 *   - une tournure entière retrouvée dans la requête (« se réveille la nuit », « je n'en peux plus ») compte double.
 * Honnêteté : un outil n'est proposé que si les mots reconnus couvrent au moins la moitié du « poids » de la
 * requête, et seulement s'il n'est pas très loin du meilleur résultat. Si rien ne correspond vraiment, la recherche
 * renvoie une liste VIDE (`understood: false`) : l'écran dit « Aucun outil ne correspond » et propose les catégories.
 * Jamais de résultat au hasard.
 */
import { getLocale, tMaybe } from '@/i18n';
import { HOMI_200 } from '@/lib/journeys/homi200';
import { canonicalToolId, toolWordsKey } from '@/lib/journeys/tools';
import { subAsTool, type CatalogTool } from './toolCatalog';
import { SEARCH_INTENTS } from './searchIntents';

type Lang = 'fr' | 'en' | 'es' | 'de' | 'it';

/** Mots vides : articles, pronoms, auxiliaires et verbes de demande (« comment », « noter », « trouver »…). */
const STOP: Record<Lang, string> = {
  fr: 'a ai as au aux avec avoir ce ces cet cette chaque comment c d dans de des dois du elle en est et etre faire fais fait faut il ils j je l la le les leur lui m ma me mes mon n ne nos notre nous on ou par pas peu peut peux plus pour puis qu quand que quel quelle quelles quels qui quoi s sa sans se ses si son sont suis sur t ta te tes toi ton tous tout toute toutes tres trop tu un une veux voudrais vos votre vous y besoin noter suivre voir gerer trouver chercher cherche outil outils savoir vais va aller ete meme aussi donc alors bien fois deux trois quatre cinq six dix depuis encore toujours jamais deja chez vers entre',
  en: 'a an and are as at be been by can do does for from has have how i in is it its me my need of on or our she so that the their them there they this to up was we what when where which who why will with would you your want find track log tool tools get keep every all some any too very not no he his her am times two three four five six ten since still always never already',
  es: 'a al como con cual cuando de del donde el ella en es esta este esto la las le lo los me mi mis muy necesito no nos o para por que quien quiero se ser si sin su sus te tu tus un una uno unas unos y ya yo todo toda todos todas cada mas hacer hago puedo herramienta herramientas buscar encontrar anotar ver he ha hay son soy',
  de: 'aber als am an auch auf aus bei bin bis das dass dem den der des die du ein eine einem einen einer es fur hat habe ich ihr im in ist ja kann man mein meine meinem meinen mich mir mit nach nicht noch oder sein seine sich sie sind so um und uns unser unsere von was wann wie wir wo zu zum zur jede jeden jeder alle sehr mochte brauche finden suchen werkzeug werkzeuge wird werden wer',
  it: 'a ad al alla alle allo anche che chi ci come con cosa cui da dal dalla dei del della delle di dove e ed gli ha ho i il in io la le lo ma mi mia mie miei mio ne nei nel nella no non o ogni per piu quando quale quanto questa questo se si sono su sua sue suo suoi te ti tra tu tua tuo tutte tutti tutto tutta un una uno vorrei voglio devo posso fare trovare cercare strumento strumenti segnare vedere molto troppo sto',
};
const STOP_SETS = Object.fromEntries(Object.entries(STOP).map(([l, s]) => [l, new Set(s.split(' '))])) as Record<Lang, Set<string>>;

/** Casse, accents, apostrophes, traits d'union et ponctuation retirés ; espaces simples. */
export function foldText(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/ß/g, 'ss').replace(/œ/g, 'oe').replace(/æ/g, 'ae')
    .replace(/[^a-z0-9]+/g, ' ').trim();
}
const words = (s: string) => (s ? s.split(' ') : []);
/** Forme réduite : pluriels courants retirés (biberons → biberon, journaux → journau, nuits → nuit). */
const stem = (w: string) => (w.length > 4 && w.endsWith('es') ? w.slice(0, -2) : w.length > 3 && (w.endsWith('s') || w.endsWith('x')) ? w.slice(0, -1) : w);

function editOne(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1) || (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2));
  const [long, short] = a.length > b.length ? [a, b] : [b, a];
  return long.slice(i + 1) === short.slice(i);
}

/** Proximité de deux mots normalisés : 1 identiques, puis pluriel, début de mot, mot composé, faute d'une lettre ; 0 sinon. */
export function wordMatch(q: string, w: string): number {
  if (q === w) return 1;
  const a = stem(q), b = stem(w);
  if (a === b) return 0.95;
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  if (short.length >= 4 && long.startsWith(short) && long.length - short.length <= 3) return 0.8;
  if (short.length >= 5 && long.includes(short)) return 0.55;
  if (short.length >= 5 && editOne(a, b)) return 0.6;
  if (short.length >= 7 && editTwo(a, b)) return 0.45;
  return 0;
}

/** Distance d'édition ≤ 2 (fautes de frappe sur un mot long : « allaitemnet », « diversificaton »). */
function editTwo(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 2) return false;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (cur[j] < rowMin) rowMin = cur[j];
    }
    if (rowMin > 2) return false;
    prev = cur;
  }
  return prev[b.length] <= 2;
}

/** Mots utiles d'une requête, dans la langue donnée (mots vides et mots d'une lettre retirés). */
export function queryTokens(q: string, lang: string = getLocale()): string[] {
  const stop = STOP_SETS[(lang in STOP_SETS ? lang : 'fr') as Lang];
  return [...new Set(words(foldText(q)).filter((w) => (w.length > 1 || /\d/.test(w)) && !stop.has(w)))];
}

const W_NAME = 3;
const W_KEY = 2;
const W_DESC = 0.5;
/** Part minimale du poids de la requête que les mots reconnus doivent couvrir. */
const MIN_COVERAGE = 0.5;
/** Un résultat trop loin du meilleur n'est pas affiché. */
const MIN_RELATIVE = 0.45;
export const SEARCH_MAX = 12;

interface Entry {
  tool: CatalogTool;
  name: string[];
  keys: string[];
  desc: string[];
  /** Tournures entières (texte normalisé, entouré d'espaces) : nom et mots-clés de plusieurs mots. */
  phrases: string[];
}
interface Index { lang: string; entries: Entry[]; absent: Set<string>; absentNames: string[] }

const CACHE = new WeakMap<readonly CatalogTool[], Index>();

function entryOf(tool: CatalogTool, lang: string, extraKeys = ''): Entry {
  const stop = STOP_SETS[(lang in STOP_SETS ? lang : 'fr') as Lang];
  const useful = (s: string) => words(foldText(s)).filter((w) => !stop.has(w) && w.length > 1);
  const raw = `${tMaybe(toolWordsKey(tool.id)) || ''};${extraKeys}`.split(';').map((p) => foldText(p)).filter(Boolean);
  const name = foldText(tool.label);
  return {
    tool,
    name: useful(tool.label),
    keys: [...new Set(raw.flatMap((p) => words(p)).filter((w) => !stop.has(w) && w.length > 1))],
    desc: useful(tool.sub ?? ''),
    phrases: [name, ...raw].filter((p) => p.includes(' ')).map((p) => ` ${p} `),
  };
}

/**
 * Noms et mots de recherche de la liste des 200 qui DÉSIGNENT un outil (numéro qui est cet outil, doublon, ou outil
 * partiel qui mène à un outil utilisable) : ils deviennent des mots-clés de cet outil. Les numéros absents ne sont
 * pas indexés (rien à ouvrir).
 */
function h200Words(): Map<string, string> {
  const out = new Map<string, string>();
  for (const e of HOMI_200) {
    if (e.kind === 'view' || e.kind === 'absent') continue;
    const target = canonicalToolId(e.id);
    if (!target) continue;
    const tool = target.startsWith('h200_') ? target : target.split('.')[0];
    out.set(tool, `${out.get(tool) ?? ''};${tMaybe(`h2.${e.n}` as never) || ''};${tMaybe(`h2.${e.n}.k` as never) || ''}`);
  }
  return out;
}

function indexOf(tools: readonly CatalogTool[]): Index {
  const lang = getLocale();
  const hit = CACHE.get(tools);
  if (hit && hit.lang === lang) return hit;
  const entries: Entry[] = [];
  const extra = h200Words();
  for (const tool of tools) {
    // les sous-accès restent trouvables par leur nom (« Croissance », « Sommeil de l'enfant ») : mots-clés de l'outil
    entries.push(entryOf(tool, lang, [...tool.subs.map((s) => `${s.label};${s.hint ?? ''}`), extra.get(tool.id) ?? ''].join(';')));
    // fonctions nommées (liste des 200) : des entrées à part entière, avec leurs propres mots
    for (const f of tool.fns ?? []) entries.push(entryOf(subAsTool(tool, f), lang, extra.get(f.id) ?? ''));
  }
  // vocabulaire des outils de la liste des 200 qui N'EXISTENT PAS encore (« contractions ») : jamais un résultat voisin
  const known = new Set(entries.flatMap((e) => [...e.name, ...e.keys]));
  const absent = new Set<string>();
  const absentNames: string[] = [];
  for (const e of HOMI_200) {
    if (e.kind !== 'absent') continue;
    absentNames.push(` ${foldText(tMaybe(`h2.${e.n}` as never) || '')} `);
    for (const w of words(foldText(`${tMaybe(`h2.${e.n}` as never) || ''} ${(tMaybe(`h2.${e.n}.k` as never) || '').replace(/;/g, ' ')}`))) if (w.length > 4 && !known.has(w) && !known.has(stem(w))) absent.add(stem(w));
  }
  const idx = { lang, entries, absent, absentNames };
  CACHE.set(tools, idx);
  return idx;
}

const best = (q: string, list: string[]) => { let m = 0; for (const w of list) { const v = wordMatch(q, w); if (v > m) m = v; if (m === 1) break; } return m; };

export interface SearchHit { tool: CatalogTool; score: number }
export interface SearchOutcome {
  results: SearchHit[];
  /** Faux : aucun outil ne correspond vraiment (l'écran le dit et propose les catégories). */
  understood: boolean;
  /** Mots utiles retenus (diagnostic, tests). */
  tokens: string[];
}

/** Recherche par besoin dans une liste d'outils (profil affiché, ou tous les profils du foyer). */
export function searchCatalog(tools: readonly CatalogTool[], query: string, max = SEARCH_MAX): SearchOutcome {
  const { lang, entries, absent, absentNames } = indexOf(tools);
  const folded = ` ${foldText(query)} `;
  const tokens = queryTokens(query, lang);
  if (folded.trim().length < 2) return { results: [], understood: false, tokens };

  // poids de chaque mot : rare dans les noms et mots-clés = important ; inconnu partout = très important (et non couvert)
  const n = Math.max(entries.length, 1);
  const strong = tokens.map((t) => entries.map((e) => Math.max(best(t, e.name) * W_NAME, best(t, e.keys) * W_KEY)));
  const idf = tokens.map((_, i) => Math.log(1 + n / (1 + strong[i].filter((v) => v > 0).length)));
  const total = idf.reduce((a, b) => a + b, 0);

  const hits: SearchHit[] = [];
  entries.forEach((e, ei) => {
    let score = 0;
    let covered = 0;
    tokens.forEach((t, ti) => {
      const s = strong[ti][ei];
      if (s > 0) { score += idf[ti] * s; covered += idf[ti]; } else score += idf[ti] * best(t, e.desc) * W_DESC;
    });
    // tournure entière présente dans la requête (mots vides compris : « je n'en peux plus »)
    let phrase = 0;
    for (const p of e.phrases) if (folded.includes(p)) phrase = Math.max(phrase, words(p.trim()).length);
    if (phrase) score += 2 * phrase * Math.log(1 + n);
    const coverage = total > 0 ? covered / total : 0;
    if (phrase || (covered > 0 && coverage >= MIN_COVERAGE)) hits.push({ tool: e.tool, score });
  });
  // un mot qui ne désigne qu'un outil absent de HOMI (« contractions ») : on le dit au lieu d'un résultat voisin
  if (absentNames.some((n) => n.trim() && folded.includes(n))) return { results: [], understood: false, tokens };
  if (tokens.some((t, i) => absent.has(stem(t)) && !strong[i].some((v) => v >= W_KEY * 0.95))) return { results: [], understood: false, tokens };
  // intentions prédéfinies (« il tète », « 39 de fièvre », « baby wont sleep ») : l'outil visé passe en tête
  const intents = SEARCH_INTENTS.filter((i) => i.re.test(folded)).flatMap((i) => i.ids);
  if (intents.length) {
    const top = Math.max(1, ...hits.map((h) => h.score));
    const byId = new Map(entries.map((e) => [e.tool.id, e.tool]));
    intents.forEach((id, rank) => {
      const tool = byId.get(id);
      if (!tool) return;
      const boost = top * 2 + (intents.length - rank);
      const prev = hits.find((h) => h.tool.id === id);
      if (prev) prev.score = Math.max(prev.score, boost); else hits.push({ tool, score: boost });
    });
  }
  // nom EXACT d'un outil (« Mon poids pendant la grossesse ») : il passe devant les intentions et les voisins (audit du
  // 23/11/2026 : 4 outils sur 127 en français, 6 en anglais n'étaient pas retrouvés par leur propre nom)
  const exact = entries.filter((e) => ` ${foldText(e.tool.label)} ` === folded);
  if (exact.length) {
    const top = Math.max(1, ...hits.map((h) => h.score));
    for (const e of exact) {
      const prev = hits.find((h) => h.tool.id === e.tool.id);
      if (prev) prev.score = top * 3; else hits.push({ tool: e.tool, score: top * 3 });
    }
  }
  if (!hits.length) return { results: [], understood: false, tokens };
  // une fonction nommée peut être indexée deux fois (entrée à plat ET fonction de son outil) : une seule ligne
  const unique = new Map<string, SearchHit>();
  for (const h of hits) { const prev = unique.get(h.tool.id); if (!prev || h.score > prev.score) unique.set(h.tool.id, h); }
  hits.length = 0; hits.push(...unique.values());
  hits.sort((a, b) => b.score - a.score);
  const top = hits[0].score;
  const results = hits.filter((h) => h.score >= top * MIN_RELATIVE || intents.includes(h.tool.id)).slice(0, max);
  return { results, understood: true, tokens };
}
