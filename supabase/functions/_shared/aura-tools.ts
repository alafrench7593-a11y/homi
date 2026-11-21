/**
 * HOMI Aura — fonctions proposées au modèle (« function calling ») et validation de ses demandes. Module PUR, partagé
 * par la fonction « assistant » (Deno), l'application (double validation avant affichage) et les tests Jest.
 *
 * LISTE BLANCHE, rien d'autre :
 *  - search_tools            : recherche dans le catalogue d'outils FOURNI PAR L'APPLICATION (profil affiché) ;
 *                              exécutée par le serveur, sans base de données ;
 *  - propose_open_tool       : proposer d'ouvrir un outil du catalogue (identifiant connu, sinon ignoré) ;
 *  - propose_calendar_event  : proposer un événement d'agenda ;
 *  - propose_mission         : proposer une mission du foyer ;
 *  - propose_plan            : proposer un plan d'organisation (étapes) ;
 *  - request_journal         : demander à la personne de CHOISIR des entrées d'un journal à partager.
 * Les propositions reviennent à l'application comme des CARTES D'ACTION : rien n'est écrit côté serveur, rien n'est
 * écrit sans la confirmation de la personne (feuille de confirmation dans l'application). Le serveur n'a aucun outil
 * de lecture des données : un journal n'arrive que s'il est envoyé par l'application après consentement.
 */
import type { GeminiFunctionDeclaration } from './gemini.ts';

export const AURA_MAX_ACTIONS = 3;
export const AURA_MAX_CATALOG = 300;

export const MISSION_CATEGORIES = [
  'feeding', 'diapers', 'sleep', 'shopping', 'packing', 'appointments', 'housework', 'admin', 'organization', 'parent_rest', 'other', 'pets', 'childcare', 'health',
] as const;
export type MissionCategory = (typeof MISSION_CATEGORIES)[number];

/** Journaux qu'Aura peut demander à la personne de choisir (sélecteur de l'application). */
export const AURA_JOURNALS = ['mood', 'diary'] as const;
export type AuraJournal = (typeof AURA_JOURNALS)[number];

export const AURA_FUNCTIONS: GeminiFunctionDeclaration[] = [
  {
    name: 'search_tools',
    description: 'Search the HOMI tools available to this person (their current profile). Returns up to 5 tools with id, name and what each one does. Always call this before propose_open_tool.',
    parameters: { type: 'OBJECT', properties: { query: { type: 'STRING', description: 'The need, in the person’s words (e.g. "breastfeeding timer", "share chores").' } }, required: ['query'] },
  },
  {
    name: 'propose_open_tool',
    description: 'Suggest opening one HOMI tool. Only an id returned by search_tools. The person decides whether to open it.',
    parameters: { type: 'OBJECT', properties: { tool_id: { type: 'STRING' }, reason: { type: 'STRING', description: 'One short sentence: why this tool helps.' } }, required: ['tool_id'] },
  },
  {
    name: 'propose_calendar_event',
    description: 'Suggest a calendar event. NOT saved: the person reviews, edits and confirms it in the app.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING' },
        date: { type: 'STRING', description: 'YYYY-MM-DD' },
        time: { type: 'STRING', description: 'HH:MM (24 h), optional' },
        duration_minutes: { type: 'INTEGER' },
        notes: { type: 'STRING' },
      },
      required: ['title', 'date'],
    },
  },
  {
    name: 'propose_mission',
    description: 'Suggest a household mission (task). NOT created: the person reviews and confirms it in the app.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING' },
        category: { type: 'STRING', enum: [...MISSION_CATEGORIES] },
        due_date: { type: 'STRING', description: 'YYYY-MM-DD, optional' },
        notes: { type: 'STRING' },
      },
      required: ['title', 'category'],
    },
  },
  {
    name: 'propose_plan',
    description: 'Suggest an organisation plan of 2 to 7 short steps. Nothing is created; each step can become a mission only if the person confirms it.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING' },
        steps: { type: 'ARRAY', items: { type: 'OBJECT', properties: { title: { type: 'STRING' }, when: { type: 'STRING', description: 'e.g. "Monday evening", optional' } }, required: ['title'] } },
      },
      required: ['title', 'steps'],
    },
  },
  {
    name: 'request_journal',
    description: 'Ask the person to CHOOSE entries from one of their journals to share for a summary. You never see a journal unless the person sends chosen entries.',
    parameters: { type: 'OBJECT', properties: { journal: { type: 'STRING', enum: [...AURA_JOURNALS] } }, required: ['journal'] },
  },
];
export const AURA_FUNCTION_NAMES = AURA_FUNCTIONS.map((f) => f.name);

// ---------------------------------------------------------------- catalogue fourni par l'application

export interface AuraCatalogEntry { id: string; name: string; blurb: string; words: string; route: string }

const ID_RE = /^[a-z0-9_]{2,48}$/;
/** Route interne de l'application : chemin simple, sans schéma ni hôte, sans « .. ». */
export function isSafeRoute(r: unknown): r is string {
  return typeof r === 'string' && r.length <= 200 && /^\/[A-Za-z0-9_\-/[\]()?=&.%]*$/.test(r) && !r.includes('//') && !r.includes('..');
}
const clip = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/[<>\u0000-\u001F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : '');

export function sanitizeCatalog(raw: unknown): AuraCatalogEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: AuraCatalogEntry[] = [];
  const seen = new Set<string>();
  for (const x of raw.slice(0, AURA_MAX_CATALOG)) {
    const e = (x && typeof x === 'object' ? x : {}) as Record<string, unknown>;
    if (typeof e.id !== 'string' || !ID_RE.test(e.id) || seen.has(e.id) || !isSafeRoute(e.route)) continue;
    const name = clip(e.name, 80);
    if (!name) continue;
    seen.add(e.id);
    out.push({ id: e.id, name, blurb: clip(e.blurb, 160), words: clip(e.words, 300), route: e.route });
  }
  return out;
}

// ---------------------------------------------------------------- recherche (portage léger du moteur local)

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/ß/g, 'ss').replace(/œ/g, 'oe').replace(/[^a-z0-9]+/g, ' ').trim();
const STOP = new Set(('le la les un une des de du d l et ou a au aux en pour par sur dans avec mon ma mes ton ta tes son sa ses notre nos votre vos je tu il elle on nous vous ils elles ' +
  'the a an and or of to for in on with my your our is are i you we it ' +
  'der die das ein eine und oder zu fur mit mein meine ich du wir ist ' +
  'el la los las un una y o de para con mi mis yo es ' +
  'il lo gli le un una e o di per con mio mia io e').split(' '));
const stem = (w: string) => (w.length > 4 && w.endsWith('es') ? w.slice(0, -2) : w.length > 3 && (w.endsWith('s') || w.endsWith('x')) ? w.slice(0, -1) : w);
const tokens = (s: string) => fold(s).split(' ').filter((w) => w.length >= 3 && !STOP.has(w)).map(stem);
function match(q: string, words: string[]): number {
  let m = 0;
  for (const w of words) {
    if (w === q) return 1;
    if (q.length >= 4 && w.length >= 4 && (w.startsWith(q) || q.startsWith(w))) m = Math.max(m, 0.7);
  }
  return m;
}

/** Recherche honnête : seulement les outils dont un mot utile correspond ; au plus `max` résultats. */
export function searchAuraCatalog(catalog: AuraCatalogEntry[], query: string, max = 5): { id: string; name: string; does: string }[] {
  const q = tokens(query).slice(0, 12);
  if (!q.length) return [];
  const scored = catalog.map((e) => {
    const name = tokens(e.name), words = tokens(e.words), blurb = tokens(e.blurb);
    let score = 0, hit = 0;
    for (const t of q) {
      const s = Math.max(match(t, name) * 3, match(t, words) * 2, match(t, blurb));
      if (s > 0) { score += s; hit++; }
    }
    return { e, score, hit };
  }).filter((x) => x.hit > 0 && x.hit >= Math.min(2, q.length) * 0.5);
  // un outil qui couvre PLUS de mots de la demande passe devant (« Où noter sa sieste ? » : la sieste l'emporte sur un
  // verbe générique comme « noter », présent dans beaucoup de noms d'outils) ; à égalité, le score décide
  scored.sort((a, b) => (b.hit - a.hit) || (b.score - a.score));
  return scored.slice(0, max).map(({ e }) => ({ id: e.id, name: e.name, does: e.blurb }));
}

// ---------------------------------------------------------------- propositions (cartes d'action)

export type AuraAction =
  | { type: 'open_tool'; id: string; label: string; reason: string | null }
  | { type: 'calendar_event'; title: string; date: string; time: string | null; duration_minutes: number | null; notes: string | null }
  | { type: 'mission'; title: string; category: MissionCategory; due_date: string | null; notes: string | null }
  | { type: 'plan'; title: string; steps: { title: string; when: string | null }[] }
  | { type: 'choose_journal'; journal: AuraJournal };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DAY = 86_400_000;
/** Date raisonnable : d'hier à un an. */
export function isPlausibleDate(d: unknown, today: string): d is string {
  if (typeof d !== 'string' || !DATE_RE.test(d)) return false;
  const t = Date.parse(`${d}T12:00:00Z`), now = Date.parse(`${today}T12:00:00Z`);
  return Number.isFinite(t) && Number.isFinite(now) && t >= now - DAY && t <= now + 366 * DAY;
}
/** Titre court, sans lien ni balise. */
const title = (v: unknown) => clip(v, 80).replace(/https?:\/\/\S+/gi, '').trim();

/**
 * Valide UNE demande de fonction du modèle et la transforme en carte d'action (ou null : ignorée).
 * `catalog` : outils connus (l'identifiant DOIT y être).
 */
export function toAction(name: string, args: Record<string, unknown>, catalog: AuraCatalogEntry[], today: string): AuraAction | null {
  switch (name) {
    case 'propose_open_tool': {
      const e = catalog.find((x) => x.id === args.tool_id);
      return e ? { type: 'open_tool', id: e.id, label: e.name, reason: clip(args.reason, 160) || null } : null;
    }
    case 'propose_calendar_event': {
      const t = title(args.title);
      if (!t || !isPlausibleDate(args.date, today)) return null;
      const dur = typeof args.duration_minutes === 'number' && Number.isFinite(args.duration_minutes) ? Math.round(args.duration_minutes) : null;
      return { type: 'calendar_event', title: t, date: args.date, time: typeof args.time === 'string' && TIME_RE.test(args.time) ? args.time : null, duration_minutes: dur && dur >= 5 && dur <= 720 ? dur : null, notes: clip(args.notes, 300) || null };
    }
    case 'propose_mission': {
      const t = title(args.title);
      const cat = (MISSION_CATEGORIES as readonly string[]).includes(args.category as string) ? (args.category as MissionCategory) : 'other';
      if (!t) return null;
      return { type: 'mission', title: t, category: cat, due_date: isPlausibleDate(args.due_date, today) ? args.due_date : null, notes: clip(args.notes, 300) || null };
    }
    case 'propose_plan': {
      const t = title(args.title);
      const steps = (Array.isArray(args.steps) ? args.steps : []).slice(0, 7).map((s) => {
        const o = (s && typeof s === 'object' ? s : {}) as Record<string, unknown>;
        return { title: title(o.title), when: clip(o.when, 40) || null };
      }).filter((s) => s.title);
      return t && steps.length >= 2 ? { type: 'plan', title: t, steps } : null;
    }
    case 'request_journal':
      return (AURA_JOURNALS as readonly string[]).includes(args.journal as string) ? { type: 'choose_journal', journal: args.journal as AuraJournal } : null;
    default:
      return null;
  }
}

/** Double validation côté application : une carte reçue est re-vérifiée avant affichage (catalogue local). */
export function sanitizeActions(raw: unknown, catalogIds: ReadonlySet<string>, today: string): AuraAction[] {
  if (!Array.isArray(raw)) return [];
  const out: AuraAction[] = [];
  for (const a of raw) {
    const o = (a && typeof a === 'object' ? a : {}) as Record<string, unknown>;
    let v: AuraAction | null = null;
    if (o.type === 'open_tool' && typeof o.id === 'string' && catalogIds.has(o.id)) v = { type: 'open_tool', id: o.id, label: clip(o.label, 80), reason: clip(o.reason, 160) || null };
    else if (o.type === 'calendar_event') v = toAction('propose_calendar_event', o, [], today);
    else if (o.type === 'mission') v = toAction('propose_mission', o, [], today);
    else if (o.type === 'plan') v = toAction('propose_plan', o, [], today);
    else if (o.type === 'choose_journal') v = toAction('request_journal', o, [], today);
    if (v) out.push(v);
    if (out.length >= AURA_MAX_ACTIONS) break;
  }
  return out;
}
