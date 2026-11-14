/**
 * « Découvrir HOMI » — modèle PUR (aucun React, aucune donnée du foyer) : chapitres, démo de chaque outil,
 * lien vers sa vraie destination, conditions d'accès. Testé par `src/__tests__/discoverHomi.test.tsx`.
 *
 * Une démo = UN geste et SON résultat. Pour couvrir tout le catalogue (`TOOLS`, src/lib/journeys/tools.ts) sans une
 * animation écrite à la main par outil, chaque outil reçoit un TYPE d'aperçu (saisie, mesure, minuteur, tâches,
 * journal, scanner, lecture, agenda, rappel, question, aide, réglage) paramétré (valeurs d'exemple, unité, jeu
 * d'exemples) ; les outils phares ont une démo sur mesure (`custom`). Toutes les valeurs sont des CONSTANTES : rien
 * n'est lu ni écrit dans les données du foyer ni dans la démonstration du foyer.
 */
import type { IconName } from '@/components/ui';
import type { ToolTheme } from '@/lib/domain/toolCatalog';
import { HUB_ROUTE, hubOf } from '@/features/hubs/hubMap';
import { SCOPES, TOOL_BY_ID, TOOLS, type Scope, type ScopeCtx, type ToolDef } from '@/lib/journeys/tools';
import { CAREGIVER_ROUTES, gateFor, isFreeRoute } from '@/lib/premium/access';
import { isPaidTool } from '@/lib/premium/offers';

// ------------------------------------------------------------------ chapitres
export type ChapterKey = 'cycle' | 'pregnancy' | 'baby' | 'child' | 'health' | 'family' | 'community' | 'more';

export interface Chapter {
  key: ChapterKey;
  icon: IconName;
  /** Outils mis en avant (démos jouées dans le chapitre), dans l'ordre. */
  featured: string[];
}

export const CHAPTERS: Chapter[] = [
  { key: 'cycle', icon: 'refresh-cw', featured: ['cycle_home', 'cycle_symptoms', 'ttc_temperature'] },
  { key: 'pregnancy', icon: 'heart', featured: ['preg_evolution', 'preg_moves', 'preg_lists'] },
  { key: 'baby', icon: 'droplet', featured: ['baby_bottle', 'kid_sleep', 'baby_breastfeed'] },
  { key: 'child', icon: 'smile', featured: ['kid_growth', 'kid_mood', 'kid_routines'] },
  { key: 'health', icon: 'activity', featured: ['appointments', 'mood', 'kid_health'] },
  { key: 'family', icon: 'home', featured: ['family_missions', 'family_stocks', 'family_shopping', 'family_calendar'] },
  { key: 'community', icon: 'users', featured: ['community', 'nearby', 'solo_parent'] },
  { key: 'more', icon: 'compass', featured: ['scan_product', 'ask', 'reminders'] },
];
export const CHAPTER_KEYS = CHAPTERS.map((c) => c.key);

// ------------------------------------------------------------------ démos
export type Unit = 'ml' | 'kg' | 'cm' | 'degC' | 'min' | 'h' | 'pct' | 'days' | 'moves' | 'changes' | 'teeth' | 'scoops';
export type TaskSet = 'home' | 'routine' | 'consult' | 'kit' | 'birthbag' | 'recovery' | 'care' | 'papers' | 'domains' | 'self';
export type JournalSet = 'mood' | 'body' | 'test' | 'mucus' | 'intimacy' | 'pill' | 'names' | 'day' | 'food' | 'note' | 'doc' | 'energy' | 'dump' | 'house' | 'couple' | 'avoid';
export type PlanSet = 'cycle' | 'pma' | 'pregnancy' | 'nap' | 'meal' | 'appointment' | 'vaccine' | 'family' | 'night' | 'metime' | 'prep' | 'custody';
export type AskSet = 'assistant' | 'articles' | 'night' | 'community';
export type CustomDemo = 'missions' | 'bottle' | 'sleep' | 'mood' | 'scanner' | 'cycle' | 'pregnancy' | 'shopping' | 'stocks';

export type DemoSpec =
  | { kind: 'entry'; from: number; to: number; unit: Unit; chip?: { value: number; unit: Unit }; decimals?: number }
  | { kind: 'measure'; series: number[]; next: number; unit: Unit; decimals?: number }
  | { kind: 'timer'; minutes: number }
  | { kind: 'tasks'; set: TaskSet }
  | { kind: 'journal'; set: JournalSet }
  | { kind: 'scan'; set: 'product' | 'food' | 'compare'; verdict: 'ok' | 'watch' }
  | { kind: 'read'; video?: boolean }
  | { kind: 'plan'; set: PlanSet; time: string; inDays: number }
  | { kind: 'remind'; time: string }
  | { kind: 'ask'; set: AskSet }
  | { kind: 'help' }
  | { kind: 'setting'; set?: 'date' }
  | { kind: 'custom'; demo: CustomDemo };
export type DemoKind = DemoSpec['kind'];
export const GENERIC_KINDS: Exclude<DemoKind, 'custom'>[] = ['entry', 'measure', 'timer', 'tasks', 'journal', 'scan', 'read', 'plan', 'remind', 'ask', 'help', 'setting'];
export const CUSTOM_DEMOS: CustomDemo[] = ['missions', 'bottle', 'sleep', 'mood', 'scanner', 'cycle', 'pregnancy', 'shopping', 'stocks'];

const custom = (demo: CustomDemo): DemoSpec => ({ kind: 'custom', demo });
const read: DemoSpec = { kind: 'read' };

/** Chapitre et démo de CHAQUE outil du registre central (garde-fou : test de couverture). */
export const TOOL_DEMOS: Record<string, { chapter: ChapterKey; demo: DemoSpec }> = {
  // ---------------------------------------------------------------- cycle (éviter, projet bébé, suivre)
  avoid_cycle: { chapter: 'cycle', demo: custom('cycle') },
  avoid_contraception: { chapter: 'cycle', demo: { kind: 'remind', time: '21:00' } },
  avoid_methods: { chapter: 'cycle', demo: read },
  avoid_emergency: { chapter: 'cycle', demo: { kind: 'help' } },
  avoid_fertile: { chapter: 'cycle', demo: { kind: 'plan', set: 'cycle', time: '08:00', inDays: 3 } },
  cycle_symptoms: { chapter: 'cycle', demo: { kind: 'journal', set: 'body' } },
  avoid_reminders: { chapter: 'cycle', demo: { kind: 'remind', time: '21:00' } },
  avoid_consult: { chapter: 'cycle', demo: { kind: 'tasks', set: 'consult' } },
  ttc_cycle: { chapter: 'cycle', demo: custom('cycle') },
  ttc_calendar: { chapter: 'cycle', demo: { kind: 'plan', set: 'cycle', time: '08:00', inDays: 2 } },
  ttc_periods: { chapter: 'cycle', demo: custom('cycle') },
  ttc_tests: { chapter: 'cycle', demo: { kind: 'journal', set: 'test' } },
  ttc_mucus: { chapter: 'cycle', demo: { kind: 'journal', set: 'mucus' } },
  ttc_temperature: { chapter: 'cycle', demo: { kind: 'measure', series: [36.4, 36.5, 36.4, 36.6], next: 36.8, unit: 'degC', decimals: 1 } },
  ttc_intimacy: { chapter: 'cycle', demo: { kind: 'journal', set: 'intimacy' } },
  ttc_exams: { chapter: 'cycle', demo: { kind: 'tasks', set: 'consult' } },
  ttc_understand: { chapter: 'cycle', demo: read },
  ttc_consult: { chapter: 'cycle', demo: { kind: 'tasks', set: 'consult' } },
  ttc_reminders: { chapter: 'cycle', demo: { kind: 'remind', time: '07:30' } },
  ttc_articles: { chapter: 'cycle', demo: read },
  cycle_home: { chapter: 'cycle', demo: custom('cycle') },
  cycle_calendar: { chapter: 'cycle', demo: { kind: 'plan', set: 'cycle', time: '08:00', inDays: 4 } },
  cycle_journal: { chapter: 'cycle', demo: { kind: 'journal', set: 'body' } },
  cycle_stats: { chapter: 'cycle', demo: { kind: 'measure', series: [29, 27, 30, 28], next: 28, unit: 'days' } },
  cycle_guides: { chapter: 'cycle', demo: read },
  guide_pma: { chapter: 'cycle', demo: read },
  pma_tracker: { chapter: 'cycle', demo: { kind: 'plan', set: 'pma', time: '07:45', inDays: 2 } },
  contraception_journal: { chapter: 'cycle', demo: { kind: 'journal', set: 'pill' } },
  cycle_kit: { chapter: 'cycle', demo: { kind: 'tasks', set: 'kit' } },

  // ---------------------------------------------------------------- grossesse et post-partum
  ttc_start_pregnancy: { chapter: 'pregnancy', demo: custom('pregnancy') },
  preg_evolution: { chapter: 'pregnancy', demo: custom('pregnancy') },
  preg_weight: { chapter: 'pregnancy', demo: { kind: 'measure', series: [62.1, 62.8, 63.4, 64.0], next: 64.5, unit: 'kg', decimals: 1 } },
  preg_eat: { chapter: 'pregnancy', demo: { kind: 'scan', set: 'food', verdict: 'watch' } },
  preg_feel: { chapter: 'pregnancy', demo: { kind: 'journal', set: 'body' } },
  preg_calendar: { chapter: 'pregnancy', demo: { kind: 'plan', set: 'pregnancy', time: '10:30', inDays: 5 } },
  preg_birth_prep: { chapter: 'pregnancy', demo: read },
  preg_articles: { chapter: 'pregnancy', demo: { kind: 'read', video: true } },
  preg_intimacy: { chapter: 'pregnancy', demo: read },
  preg_names: { chapter: 'pregnancy', demo: { kind: 'journal', set: 'names' } },
  preg_lists: { chapter: 'pregnancy', demo: { kind: 'tasks', set: 'birthbag' } },
  preg_edit: { chapter: 'pregnancy', demo: { kind: 'setting', set: 'date' } },
  preg_end: { chapter: 'pregnancy', demo: { kind: 'setting' } },
  preg_moves: { chapter: 'pregnancy', demo: { kind: 'entry', from: 9, to: 10, unit: 'moves' } },
  pp_recovery: { chapter: 'pregnancy', demo: { kind: 'tasks', set: 'recovery' } },
  pp_checkin: { chapter: 'pregnancy', demo: { kind: 'journal', set: 'mood' } },
  pp_body: { chapter: 'pregnancy', demo: { kind: 'journal', set: 'body' } },
  pp_mental: { chapter: 'pregnancy', demo: read },
  pp_support: { chapter: 'pregnancy', demo: { kind: 'help' } },
  pp_partner: { chapter: 'pregnancy', demo: { kind: 'tasks', set: 'home' } },
  guide_loss: { chapter: 'pregnancy', demo: read },

  // ---------------------------------------------------------------- bébé
  pp_feeding: { chapter: 'baby', demo: { kind: 'timer', minutes: 14 } },
  pp_bottle: { chapter: 'baby', demo: custom('bottle') },
  baby_breastfeed: { chapter: 'baby', demo: { kind: 'timer', minutes: 14 } },
  baby_bottle_timer: { chapter: 'baby', demo: custom('bottle') },
  baby_bottle: { chapter: 'baby', demo: custom('bottle') },
  baby_bottle_history: { chapter: 'baby', demo: { kind: 'measure', series: [540, 600, 570, 620], next: 600, unit: 'ml' } },
  bottle_scoops: { chapter: 'baby', demo: { kind: 'entry', from: 4, to: 6, unit: 'scoops', chip: { value: 180, unit: 'ml' } } },
  baby_diaper: { chapter: 'baby', demo: { kind: 'entry', from: 5, to: 6, unit: 'changes' } },
  baby_daily: { chapter: 'baby', demo: { kind: 'journal', set: 'day' } },
  baby_night_help: { chapter: 'baby', demo: { kind: 'ask', set: 'night' } },
  kid_sleep: { chapter: 'baby', demo: custom('sleep') },
  kid_sleep_rhythm: { chapter: 'baby', demo: { kind: 'plan', set: 'nap', time: '13:15', inDays: 0 } },
  baby_foods: { chapter: 'baby', demo: { kind: 'journal', set: 'food' } },
  guide_neonat: { chapter: 'baby', demo: read },
  family_nights: { chapter: 'baby', demo: { kind: 'plan', set: 'night', time: '22:00', inDays: 0 } },

  // ---------------------------------------------------------------- enfant
  kid_profile: { chapter: 'child', demo: read },
  kid_growth: { chapter: 'child', demo: { kind: 'measure', series: [68, 71, 73.5, 75], next: 76.5, unit: 'cm', decimals: 1 } },
  kid_grow: { chapter: 'child', demo: { kind: 'journal', set: 'note' } },
  kid_milestones: { chapter: 'child', demo: { kind: 'journal', set: 'note' } },
  kid_teeth: { chapter: 'child', demo: { kind: 'entry', from: 5, to: 6, unit: 'teeth' } },
  kid_mood: { chapter: 'child', demo: custom('mood') },
  kid_routines: { chapter: 'child', demo: { kind: 'tasks', set: 'routine' } },
  meals: { chapter: 'child', demo: { kind: 'plan', set: 'meal', time: '19:00', inDays: 1 } },
  meal_rankings: { chapter: 'child', demo: { kind: 'journal', set: 'food' } },
  kid_products: { chapter: 'child', demo: { kind: 'scan', set: 'product', verdict: 'ok' } },
  summary: { chapter: 'child', demo: read },
  guide_hygiene: { chapter: 'child', demo: read },
  guide_sport: { chapter: 'child', demo: read },
  guide_activities: { chapter: 'child', demo: read },
  guide_kidsleep: { chapter: 'child', demo: read },
  guide_kidfood: { chapter: 'child', demo: read },
  guide_behaviour: { chapter: 'child', demo: read },
  guide_school: { chapter: 'child', demo: read },
  guide_toddler: { chapter: 'child', demo: read },

  // ---------------------------------------------------------------- santé et bien-être
  appointments: { chapter: 'health', demo: { kind: 'plan', set: 'appointment', time: '09:30', inDays: 3 } },
  documents: { chapter: 'health', demo: { kind: 'journal', set: 'doc' } },
  emergency: { chapter: 'health', demo: { kind: 'help' } },
  kid_vaccines: { chapter: 'health', demo: { kind: 'plan', set: 'vaccine', time: '11:00', inDays: 12 } },
  kid_health: { chapter: 'health', demo: { kind: 'measure', series: [37.2, 38.4, 38.1, 37.7], next: 37.3, unit: 'degC', decimals: 1 } },
  kid_needs: { chapter: 'health', demo: { kind: 'tasks', set: 'care' } },
  kid_treatments: { chapter: 'health', demo: { kind: 'remind', time: '08:00' } },
  kid_card: { chapter: 'health', demo: read },
  kid_steps: { chapter: 'health', demo: { kind: 'tasks', set: 'papers' } },
  guide_illnesses: { chapter: 'health', demo: read },
  guide_firstaid: { chapter: 'health', demo: read },
  consult_questions: { chapter: 'health', demo: { kind: 'tasks', set: 'consult' } },
  mood: { chapter: 'health', demo: custom('mood') },
  sleep: { chapter: 'health', demo: { kind: 'measure', series: [5.5, 6, 4.5, 6.5], next: 7, unit: 'h', decimals: 1 } },
  exhaustion_check: { chapter: 'health', demo: { kind: 'journal', set: 'energy' } },

  // ---------------------------------------------------------------- organisation familiale
  family_missions: { chapter: 'family', demo: custom('missions') },
  family_responsibilities: { chapter: 'family', demo: { kind: 'tasks', set: 'domains' } },
  family_shopping: { chapter: 'family', demo: custom('shopping') },
  family_stocks: { chapter: 'family', demo: custom('stocks') },
  family_tasks: { chapter: 'family', demo: { kind: 'tasks', set: 'home' } },
  family_routines: { chapter: 'family', demo: { kind: 'tasks', set: 'routine' } },
  family_history: { chapter: 'family', demo: { kind: 'tasks', set: 'home' } },
  family_summary: { chapter: 'family', demo: read },
  family_calendar: { chapter: 'family', demo: { kind: 'plan', set: 'family', time: '10:00', inDays: 2 } },
  family_metime: { chapter: 'family', demo: { kind: 'plan', set: 'metime', time: '18:30', inDays: 1 } },
  family_difficult: { chapter: 'family', demo: { kind: 'tasks', set: 'self' } },
  family_urgent: { chapter: 'family', demo: { kind: 'help' } },
  family_review: { chapter: 'family', demo: { kind: 'measure', series: [38, 44, 47, 49], next: 50, unit: 'pct' } },
  family_sos: { chapter: 'family', demo: { kind: 'help' } },
  brain_dump: { chapter: 'family', demo: { kind: 'journal', set: 'dump' } },
  family_domains: { chapter: 'family', demo: { kind: 'tasks', set: 'domains' } },
  mental_load: { chapter: 'family', demo: { kind: 'measure', series: [64, 60, 57, 54], next: 51, unit: 'pct' } },
  family_prep: { chapter: 'family', demo: { kind: 'plan', set: 'prep', time: '17:00', inDays: 6 } },
  offduty: { chapter: 'family', demo: { kind: 'setting' } },
  house_notebook: { chapter: 'family', demo: { kind: 'journal', set: 'house' } },
  couple_week: { chapter: 'family', demo: { kind: 'journal', set: 'couple' } },
  custody: { chapter: 'family', demo: { kind: 'plan', set: 'custody', time: '18:00', inDays: 4 } },
  family_papers: { chapter: 'family', demo: { kind: 'tasks', set: 'papers' } },
  guide_couple: { chapter: 'family', demo: read },

  // ---------------------------------------------------------------- communauté
  community: { chapter: 'community', demo: { kind: 'ask', set: 'community' } },
  nearby: { chapter: 'community', demo: read },
  solo_parent: { chapter: 'community', demo: read },
  guide_work: { chapter: 'community', demo: read },

  // ---------------------------------------------------------------- autres espaces : scanner, assistant, lectures, rappels, réglages
  scan_product: { chapter: 'more', demo: custom('scanner') },
  scan_food: { chapter: 'more', demo: { kind: 'scan', set: 'food', verdict: 'ok' } },
  scan_history: { chapter: 'more', demo: { kind: 'journal', set: 'avoid' } },
  scan_compare: { chapter: 'more', demo: { kind: 'scan', set: 'compare', verdict: 'ok' } },
  scan_avoid: { chapter: 'more', demo: { kind: 'journal', set: 'avoid' } },
  recall_alerts: { chapter: 'more', demo: { kind: 'remind', time: '09:00' } },
  ask: { chapter: 'more', demo: { kind: 'ask', set: 'assistant' } },
  local_ai: { chapter: 'more', demo: { kind: 'ask', set: 'articles' } },
  library: { chapter: 'more', demo: read },
  sources: { chapter: 'more', demo: read },
  video_tutos: { chapter: 'more', demo: { kind: 'read', video: true } },
  official_videos: { chapter: 'more', demo: { kind: 'read', video: true } },
  reminders: { chapter: 'more', demo: { kind: 'remind', time: '20:00' } },
  notifications: { chapter: 'more', demo: { kind: 'remind', time: '20:00' } },
  home_settings: { chapter: 'more', demo: { kind: 'setting' } },
  settings: { chapter: 'more', demo: { kind: 'setting' } },
  journeys: { chapter: 'more', demo: { kind: 'setting' } },
};

// ------------------------------------------------------------------ outils présentés
export interface DiscoverTool {
  key: string;
  theme: ToolTheme;
  icon: IconName;
  chapter: ChapterKey;
  demo: DemoSpec;
  urgent: boolean;
}

/** Tous les outils du registre, rangés par chapitre (ordre des chapitres, puis ordre du registre). */
export const DISCOVER_TOOLS: DiscoverTool[] = CHAPTER_KEYS.flatMap((ch) =>
  TOOLS.filter((d) => TOOL_DEMOS[d.id]?.chapter === ch).map((d) => ({ key: d.id, theme: d.theme, icon: d.icon, chapter: ch, demo: TOOL_DEMOS[d.id].demo, urgent: !!d.urgent })),
);
export const DISCOVER_BY_KEY = Object.fromEntries(DISCOVER_TOOLS.map((x) => [x.key, x])) as Record<string, DiscoverTool>;
export const toolsOfChapter = (ch: ChapterKey) => DISCOVER_TOOLS.filter((x) => x.chapter === ch);

/** Outil précédent / suivant dans l'ordre du catalogue (boucle). */
export function neighbourTool(key: string, dir: 1 | -1): string {
  const i = DISCOVER_TOOLS.findIndex((x) => x.key === key);
  const n = DISCOVER_TOOLS.length;
  return DISCOVER_TOOLS[((i < 0 ? 0 : i) + dir + n) % n].key;
}

/** Démo sur mesure ou type générique (CSV, rapport). */
export const demoLabel = (d: DemoSpec) => (d.kind === 'custom' ? `sur mesure:${d.demo}` : `type:${d.kind}`);

// ------------------------------------------------------------------ liens vers la vraie destination
/** Portées dans l'ordre où l'on cherche une adresse « générique » (sans identifiant d'enfant ni de grossesse). */
const SAMPLE: Record<Scope, ScopeCtx> = {
  avoid: { scope: 'avoid' }, ttc: { scope: 'ttc' }, cycle: { scope: 'cycle' }, none: { scope: 'none' },
  pregnancy: { scope: 'pregnancy' }, postpartum: { scope: 'postpartum', postpartum: true }, baby: { scope: 'baby', postpartum: true },
  child: { scope: 'child' }, family: { scope: 'family' },
};

function firstHref(def: ToolDef, extra: Partial<ScopeCtx> = {}): string | null {
  for (const s of def.scopes) {
    const ctx = { ...SAMPLE[s], ...extra };
    if (def.when && !def.when(ctx)) continue;
    const h = def.href(ctx);
    if (h) return h;
  }
  return null;
}

/** Onglet hub d'un outil (repli quand l'outil a besoin d'un profil que le foyer n'a pas encore). */
export function hubRouteOf(key: string): string {
  const d = TOOL_BY_ID[key];
  return `/${HUB_ROUTE[hubOf({ theme: d.theme, key })]}`;
}

/**
 * Lien de la démo : adresse réelle du foyer si l'outil y est disponible (`realHref`, lue par l'écran, jamais
 * écrite), sinon l'adresse générique de l'outil, sinon l'onglet hub où il vit (outil propre à un enfant, une
 * grossesse… que le foyer ne suit pas encore). `fallback` = le lien mène à l'espace, pas à l'outil lui-même.
 */
export function toolLink(key: string, realHref?: string | null): { href: string; fallback: boolean } {
  if (realHref) return { href: realHref, fallback: false };
  const d = TOOL_BY_ID[key];
  const h = d ? firstHref(d) : null;
  if (h) return { href: h, fallback: false };
  return { href: hubRouteOf(key), fallback: true };
}

/** Adresse représentative (identifiants fictifs) : sert seulement à calculer les conditions d'accès. */
export function accessPath(key: string): string {
  const d = TOOL_BY_ID[key];
  const h = (d && firstHref(d, { childId: 'enfant', babyId: 'enfant', pregnancyId: 'grossesse' })) ?? hubRouteOf(key);
  // adresse telle que la voit le garde Premium (`usePathname`) : sans le groupe « (tabs) »
  return h.replace('/(tabs)', '') || '/';
}

/** Une adresse correspond-elle à une route de l'application ? (« /(tabs) », paramètres dynamiques, requête) */
export function routeExists(href: string, routes: readonly string[]): boolean {
  const path = (href.split(/[?#]/)[0] || '/').replace('/(tabs)', '').replace(/\/+$/, '') || '/';
  const parts = path.split('/');
  return routes.some((r) => {
    const rp = r.split('/');
    return rp.length === parts.length && rp.every((seg, i) => /^\[.+\]$/.test(seg) || seg === parts[i]);
  });
}

// ------------------------------------------------------------------ conditions d'accès (src/lib/premium/access.ts)
export interface ToolAccessInfo {
  /** Ouvert sans abonnement (urgences, sécurité, réglages…). */
  free: boolean;
  /** Ouvert aussi par l'offre « Assistant IA ». */
  ai: boolean;
  /** Ouvert à la nounou du foyer sans abonnement (la famille paie). */
  caregiver: boolean;
  /** Outil autrefois vendu à vie : reste ouvert à qui l'a acheté. */
  legacy: boolean;
  /** Parcours où l'outil apparaît. */
  scopes: Scope[];
}

export function toolAccessInfo(key: string): ToolAccessInfo {
  const path = accessPath(key);
  const free = isFreeRoute(path);
  const base = { premium: false, trial_until: null, strict: true, tools: [] };
  const ai = !free && gateFor(path, false, { ...base, ai: true }) === 'open';
  const caregiver = !free && CAREGIVER_ROUTES.some((r) => r.test(path.split(/[?#]/)[0] || '/'));
  const d = TOOL_BY_ID[key];
  return { free, ai, caregiver, legacy: !free && isPaidTool(key), scopes: d ? SCOPES.filter((s) => d.scopes.includes(s)) : [] };
}
