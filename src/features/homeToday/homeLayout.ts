/**
 * Tableau de bord « Aujourd'hui » : modules et configurations par défaut DÉCLARATIVES (17/11/2026) — logique pure,
 * testée (homeLayout.test.ts). Un tableau par situation à la place des `if` de l'écran d'accueil.
 *
 * Ordre de référence : (1) bonjour + date + profil — fixe, hors modules ; (2) prochaine action ; (3) actions rapides ;
 * (4) résumé du profil ; (5) agenda du jour ; (6) recommandation ; (7) articles compacts ; puis les modules facultatifs.
 * La personne peut réordonner, masquer ou afficher chaque module, sur place (« Personnaliser ») ou dans Réglages ›
 * Mon accueil ; son choix est gardé PAR SITUATION, sur l'appareil.
 */
import type { TKey } from '@/i18n';
import type { Scope } from '@/lib/journeys/tools';

export type HomeModuleKey =
  | 'next' | 'quick' | 'main' | 'agenda' | 'recommendation' | 'articles'
  | 'familyTasks' | 'childInfo' | 'tools'
  | 'upcoming' | 'assistant' | 'community' | 'outings' | 'videos' | 'library' | 'solo' | 'story' | 'recipe' | 'article';

export const HOME_MODULES: { key: HomeModuleKey; label: TKey; detail?: TKey }[] = [
  { key: 'next', label: 'hm.next', detail: 'hm.next_d' },
  { key: 'quick', label: 'u5.home.hc_quick', detail: 'u5.home.hc_quick_d' },
  { key: 'main', label: 'hm.main', detail: 'hm.main_d' },
  { key: 'agenda', label: 'hm.agenda', detail: 'hm.agenda_d' },
  { key: 'recommendation', label: 'u5.home.hc_recommendation', detail: 'u5.home.hc_recommendation_d' },
  { key: 'articles', label: 'hm.articles', detail: 'hm.articles_d' },
  { key: 'familyTasks', label: 'hm.familyTasks', detail: 'hm.familyTasks_d' },
  { key: 'childInfo', label: 'hm.childInfo', detail: 'hm.childInfo_d' },
  { key: 'tools', label: 'hm.tools', detail: 'hm.tools_d' },
  { key: 'upcoming', label: 'u5.home.hc_upcoming' },
  { key: 'assistant', label: 'u5.home.hc_assistant', detail: 'u5.home.hc_assistant_d' },
  { key: 'community', label: 'u5.home.hc_community', detail: 'u5.home.hc_community_d' },
  { key: 'outings', label: 'u5.home.hc_outings', detail: 'u5.home.hc_outings_d' },
  { key: 'videos', label: 'vid.title', detail: 'vid.homeDetail' },
  { key: 'library', label: 'lib.home.title', detail: 'lib.home.byTheme' },
  { key: 'solo', label: 'tool.solo_parent', detail: 'sol.home.detail' },
  { key: 'story', label: 'hm.story', detail: 'u5.home.hc_story_d' },
  { key: 'recipe', label: 'u5.home.hc_recipe', detail: 'u5.home.hc_recipe_d' },
  { key: 'article', label: 'u5.home.hc_article' },
];
export const HOME_MODULE_KEYS = HOME_MODULES.map((m) => m.key);

/** Situation du foyer telle qu'elle est affichée : choisit la configuration par défaut. */
export type HomeSituation = 'pregnancy' | 'newborn' | 'child' | 'couple' | 'family' | 'cycle' | 'me';
export const HOME_SITUATIONS: HomeSituation[] = ['pregnancy', 'newborn', 'child', 'couple', 'family', 'cycle', 'me'];

/**
 * Situation (pure) : le profil affiché d'abord (grossesse, nouveau-né, enfant, famille) ; pour « Moi », un foyer de
 * DEUX adultes sans enfant ni grossesse est un « couple » (dérivé de la composition du foyer : aucun type de profil
 * n'est créé côté serveur) ; sinon suivi du cycle, ou « moi ».
 */
export function homeSituation(o: { scope: Scope; adults: number; children: number; pregnancy: boolean }): HomeSituation {
  if (o.scope === 'pregnancy') return 'pregnancy';
  if (o.scope === 'baby' || o.scope === 'postpartum') return 'newborn';
  if (o.scope === 'child') return 'child';
  if (o.scope === 'family') return 'family';
  if (o.adults === 2 && o.children === 0 && !o.pregnancy) return 'couple';
  return o.scope === 'none' ? 'me' : 'cycle';
}

const REF: HomeModuleKey[] = ['next', 'quick', 'main', 'agenda', 'recommendation', 'articles'];
/**
 * Modules AFFICHÉS par défaut, dans l'ordre, pour chaque situation. Tout module absent d'une liste reste disponible,
 * masqué, dans « Personnaliser ».
 *  - nouveau-né / enfant : le résumé de l'enfant porte déjà sa lecture conseillée → pas de « recommandation » en double ;
 *  - cycle : la carte du cycle porte déjà ses raccourcis → pas d'« actions rapides » en double ;
 *  - couple : les tâches du foyer sont affichées (l'agenda de « Moi » ne montre que les miennes) ; famille : l'agenda
 *    du jour montre déjà les tâches de tout le foyer.
 */
export const HOME_PRESETS: Record<HomeSituation, HomeModuleKey[]> = {
  pregnancy: [...REF.slice(0, 4), 'upcoming', 'recommendation', 'articles', 'assistant'],
  newborn: ['next', 'quick', 'main', 'agenda', 'articles'],
  child: ['next', 'quick', 'main', 'agenda', 'articles'],
  couple: ['next', 'quick', 'main', 'agenda', 'familyTasks', 'recommendation', 'articles', 'assistant'],
  family: ['next', 'quick', 'main', 'agenda', 'recommendation', 'articles'],
  cycle: ['next', 'main', 'agenda', 'assistant', 'articles'],
  me: [...REF, 'upcoming', 'assistant', 'community'],
};

export interface HomeLayout { order: HomeModuleKey[]; hidden: HomeModuleKey[] }

/** Configuration par défaut complète d'une situation : les modules affichés, puis tous les autres, masqués. */
export function defaultHomeLayout(situation: HomeSituation): HomeLayout {
  const shown = HOME_PRESETS[situation];
  const rest = HOME_MODULE_KEYS.filter((k) => !shown.includes(k));
  return { order: [...shown, ...rest], hidden: rest };
}

/**
 * Configuration effective : celle enregistrée pour la situation, nettoyée (modules inconnus retirés) et complétée
 * (un module ajouté depuis prend sa place par défaut, avec sa visibilité par défaut) ; sinon celle par défaut.
 */
export function resolveHomeLayout(situation: HomeSituation, saved?: { order: string[]; hidden: string[] } | null): HomeLayout {
  const def = defaultHomeLayout(situation);
  if (!saved || !saved.order.length) return def;
  const known = (k: string): k is HomeModuleKey => (HOME_MODULE_KEYS as string[]).includes(k);
  const order = [...new Set(saved.order)].filter(known);
  const hidden = new Set(saved.hidden.filter(known));
  for (const k of def.order) {
    if (order.includes(k)) continue;
    order.splice(Math.min(def.order.indexOf(k), order.length), 0, k);
    if (def.hidden.includes(k)) hidden.add(k);
  }
  return { order, hidden: order.filter((k) => hidden.has(k)) };
}

export const shownModules = (l: HomeLayout): HomeModuleKey[] => l.order.filter((k) => !l.hidden.includes(k));

/** Déplace un module d'un cran (pure) ; aux extrémités, rien ne change. */
export function moveModule(l: HomeLayout, key: HomeModuleKey, d: -1 | 1): HomeLayout {
  const i = l.order.indexOf(key);
  const j = i + d;
  if (i < 0 || j < 0 || j >= l.order.length) return l;
  const order = [...l.order];
  [order[i], order[j]] = [order[j], order[i]];
  return { ...l, order };
}

export function setModuleVisible(l: HomeLayout, key: HomeModuleKey, visible: boolean): HomeLayout {
  const hidden = new Set(l.hidden);
  if (visible) hidden.delete(key); else hidden.add(key);
  // toujours dans l'ordre des modules : deux configurations identiques s'écrivent de la même façon
  return { ...l, hidden: l.order.filter((k) => hidden.has(k)) };
}
