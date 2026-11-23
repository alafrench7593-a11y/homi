/**
 * Moteur de recommandation DÉTERMINISTE et EXPLICABLE (sans IA) — « HOMI détermine automatiquement les outils
 * pertinents et évolue avec la famille ».
 *
 * Entrées : faits de profil (facts.ts), préférences (favoris, récents, épinglés, masqués).
 * Sortie : liste ordonnée d'outils, chacun avec sa RAISON lisible (rules.ts) et, s'il concerne un enfant, l'enfant.
 * Garanties (testées, personalization.test.ts) :
 *  - un outil n'est proposé que s'il est réellement ouvrable pour ce foyer (registre : portée, enfant, grossesse) et
 *    disponible (`isAvailable` : jamais l'assistant éteint ni un numéro absent de la liste des 200) ;
 *  - épinglé = toujours en tête ; masqué = jamais recommandé ; aucune donnée n'est supprimée ;
 *  - données sensibles (cycle, contraception, fertilité, santé mentale) : seulement via un choix de la personne ;
 *  - compte nounou : seulement les outils de la garde ;
 *  - aucune donnée de l'autre adulte : les faits ne contiennent que mes parcours et les données partagées du foyer.
 */
import { canonicalToolId, isToolAllowed, resolveTool, type ScopeCtx, type ToolCategory } from '@/lib/journeys/tools';
import { factContexts, type ChildFact, type ProfileFacts } from './facts';
import { CAREGIVER_TOOLS, CHILD_RULES, FEEDING_TOOLS, PROFILE_RULES, type Reason } from './rules';
import { toolMeta } from './toolMeta';

export interface Recommendation {
  /** Identifiant stable (outil, sous-accès `outil.x`, ou fonction nommée `h200_<n>`). */
  id: string;
  score: number;
  reason: Reason;
  /** Règle qui a fourni la raison (diagnostic, matrice). */
  rule: string;
  /** Enfant concerné (l'outil s'ouvre sur son profil). */
  childId?: string;
  pinned?: boolean;
}

export interface Prefs { favorites?: string[]; recents?: string[]; pinned?: string[]; hidden?: string[]; exclude?: string[] }
export interface RecommendOptions { max?: number; perCategory?: number }

const norm = (ids?: string[]) => new Set((ids ?? []).map((x) => canonicalToolId(x) ?? x));
const categoryOf = (id: string): ToolCategory | null => { const r = resolveTool(id); return r ? (r.sub?.category ?? r.def.category) : null; };

/** Donnée sensible : proposée seulement si la personne a elle-même choisi ce suivi. */
function optedIn(f: ProfileFacts, id: string): boolean {
  const s = toolMeta(id)?.sensitive;
  if (!s) return true;
  if (s === 'fertility') return f.body === 'ttc';
  if (s === 'cycle' || s === 'contraception') return f.body != null;
  return false; // santé mentale : jamais poussée par le moteur (reste dans les favoris, les récents et le catalogue)
}

function usable(id: string): boolean {
  const m = toolMeta(id);
  return !!m && m.isAvailable;
}

interface Hit { id: string; score: number; best: number; reason: Reason; rule: string; childId?: string }

function collect(f: ProfileFacts, onlyChild?: string): Map<string, Hit> {
  const hits = new Map<string, Hit>();
  const ctxs = factContexts(f);
  const childCtx = (id: string) => ctxs.find((c) => c.childId === id);
  const add = (raw: string, weight: number, reason: Reason, rule: string, ctx?: ScopeCtx, child?: ChildFact) => {
    const id = canonicalToolId(raw);
    if (!id || !usable(id) || !optedIn(f, id)) return;
    const where = ctx ? (isToolAllowed(id, ctx) ? ctx : null) : ctxs.find((c) => isToolAllowed(id, c)) ?? null;
    if (!where) return;
    const range = child ? toolMeta(id)?.ageRange : undefined;
    if (child && range && (child.months < range[0] || child.months >= range[1])) return;
    const bonus = where.childId && where.childId === f.activeChildId ? 2 : 0;
    const w = weight + bonus;
    const prev = hits.get(id);
    if (!prev) { hits.set(id, { id, score: w, best: w, reason, rule, childId: where.childId ?? undefined }); return; }
    prev.score += w * 0.5;
    if (w > prev.best) Object.assign(prev, { best: w, reason, rule, childId: where.childId ?? prev.childId });
  };

  if (f.role === 'caregiver' || f.caregiverOnly) {
    const name = f.children[0]?.name;
    for (const [id, w] of CAREGIVER_TOOLS) {
      const cid = canonicalToolId(id);
      if (cid && usable(cid)) hits.set(cid, { id: cid, score: w, best: w, reason: { key: 'pz.r.caregiver', name }, rule: 'caregiver' });
    }
    return hits;
  }

  if (!onlyChild) {
    for (const r of PROFILE_RULES) {
      if (!r.when(f)) continue;
      const tools = typeof r.tools === 'function' ? r.tools(f) : r.tools;
      for (const [id, w] of tools) add(id, w, r.reason(f), r.id);
    }
  }
  for (const c of f.children) {
    if (onlyChild && c.id !== onlyChild) continue;
    const ctx = childCtx(c.id);
    if (!ctx) continue;
    for (const r of CHILD_RULES) {
      if (!r.when(c, f)) continue;
      const tools = typeof r.tools === 'function' ? r.tools(c, f) : r.tools;
      for (const [id, w] of tools) add(id, w, r.reason(c, f), r.id, ctx, c);
    }
  }
  // alimentation déclarée : le plus jeune enfant de moins de 2 ans
  const young = f.children.find((c) => c.months < 24);
  if (f.feeding && young && (!onlyChild || onlyChild === young.id)) {
    const ctx = childCtx(young.id);
    for (const [id, w] of FEEDING_TOOLS[f.feeding]) add(id, w, { key: `pz.r.feed.${f.feeding}`, name: young.name }, `feeding-${f.feeding}`, ctx, young);
  }
  return hits;
}

function order(hits: Map<string, Hit>, prefs: Prefs, max: number, perCategory: number): Recommendation[] {
  const hidden = norm(prefs.hidden);
  const excluded = norm(prefs.exclude);
  const pinned = [...norm(prefs.pinned)].filter((id) => !hidden.has(id) && resolveTool(id) && usable(id));
  const ranked = [...hits.values()].filter((h) => !hidden.has(h.id) && !excluded.has(h.id) && !pinned.includes(h.id))
    .sort((a, b) => b.score - a.score || b.best - a.best || a.id.localeCompare(b.id));
  const out: Recommendation[] = pinned.map((id) => {
    const h = hits.get(id);
    return { id, score: Infinity, reason: { key: 'pz.r.pinned' }, rule: 'pinned', pinned: true, ...(h?.childId ? { childId: h.childId } : {}) };
  });
  // diversité : au plus `perCategory` outils d'une même catégorie avant que les autres catégories soient servies
  const perCat = new Map<string, number>();
  const later: Hit[] = [];
  for (const h of ranked) {
    const cat = categoryOf(h.id) ?? 'other';
    const n = perCat.get(cat) ?? 0;
    if (n >= perCategory) { later.push(h); continue; }
    perCat.set(cat, n + 1);
    out.push({ id: h.id, score: h.score, reason: h.reason, rule: h.rule, ...(h.childId ? { childId: h.childId } : {}) });
  }
  for (const h of later) out.push({ id: h.id, score: h.score, reason: h.reason, rule: h.rule, ...(h.childId ? { childId: h.childId } : {}) });
  return out.slice(0, max);
}

/** « Pour toi aujourd'hui » : outils recommandés pour la personne, dans l'ordre, avec leur raison. */
export function recommend(f: ProfileFacts, prefs: Prefs = {}, opts: RecommendOptions = {}): Recommendation[] {
  return order(collect(f), prefs, opts.max ?? 10, opts.perCategory ?? 4);
}

/** « Ton enfant » : outils de l'enfant sélectionné (âge exact, alimentation, diversification, nounou). */
export function childRecommendations(f: ProfileFacts, childId: string, prefs: Prefs = {}, max = 8): Recommendation[] {
  if (f.role === 'caregiver' || f.caregiverOnly) return [];
  return order(collect(f, childId), { hidden: prefs.hidden }, max, 4);
}

/** Nombre de recommandations affichées selon la hauteur d'écran (6 à 10). */
export const forYouCount = (height: number) => (height < 640 ? 6 : height < 760 ? 8 : 10);
