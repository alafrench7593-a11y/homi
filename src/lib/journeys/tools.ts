/**
 * SYSTÈME CENTRAL des outils autorisés.
 *
 * Chaque outil déclare les « portées » où il a le droit d'apparaître. La portée vient du profil affiché
 * (sélecteur) et du parcours actif :
 *   avoid · ttc · cycle · none      → « Moi » (selon mon parcours de cycle, ou aucun)
 *   pregnancy                        → ma grossesse en cours
 *   postpartum                       → mon post-partum
 *   baby · child                     → un enfant né suivi (bébé jusqu'à 2 ans, enfant ensuite)
 *   family                           → toute la famille (organisation, agenda : aucune saisie pour un enfant)
 *
 * Ce registre sert à « Tous mes outils », à l'accueil, aux actions rapides ET au garde d'accès des écrans
 * (`toolAllowed`) : un écran d'un autre parcours ne s'ouvre pas sur des données mélangées.
 * Les outils « pour tout le monde » (scanner, assistant, humeur, sommeil, repas, rendez-vous, documents,
 * communauté) existent dans toutes les portées mais pointent vers le profil affiché.
 */
import type { IconName } from '@/components/ui';
import type { ToolTheme } from '@/lib/domain/toolCatalog';
import type { TKey } from '@/i18n';

export type Scope = 'avoid' | 'ttc' | 'cycle' | 'none' | 'pregnancy' | 'postpartum' | 'baby' | 'child' | 'family';
export const SCOPES: Scope[] = ['avoid', 'ttc', 'cycle', 'none', 'pregnancy', 'postpartum', 'baby', 'child', 'family'];
const ME: Scope[] = ['avoid', 'ttc', 'cycle', 'none'];
const ADULT: Scope[] = [...ME, 'pregnancy', 'postpartum'];
const KID: Scope[] = ['baby', 'child'];
const ALL = SCOPES;
/** Portées où l'organisation familiale a du sens (enfants, grossesse, post-partum, vue famille). */
const HOME_LIFE: Scope[] = ['none', 'child', 'family'];
/** « À deux » (04/11/2026) : la charge mentale ne commence pas avec un enfant — tâches, agenda et relais sont ouverts à tous. */
const TOGETHER: Scope[] = [...ADULT, 'baby', 'child', 'family'];

export interface ScopeCtx {
  scope: Scope;
  childId?: string | null;
  pregnancyId?: string | null;
  /** Un enfant de moins de 2 ans est suivi (post-partum : allaitement ou biberon seulement dans ce cas). */
  babyId?: string | null;
  /** Un post-partum est en cours : les informations de la mère (sommeil, humeur, récupération, allaitement) sont rangées dans « Mon bébé est né ». */
  postpartum?: boolean;
}

export interface ToolDef {
  id: string;
  theme: ToolTheme;
  icon: IconName;
  scopes: Scope[];
  /** Outil « pour tout le monde » adapté au profil affiché. */
  universal?: boolean;
  /** Adresse selon le profil affiché ; null = pas disponible dans ce contexte. */
  href: (c: ScopeCtx) => string | null;
  /** Condition supplémentaire (ex. allaitement en post-partum seulement si un bébé est suivi). */
  when?: (c: ScopeCtx) => boolean;
  urgent?: boolean;
}

const kid = (c: ScopeCtx, path = '') => (c.childId ? `/child/${c.childId}${path}` : null);
const q = (base: string, c: ScopeCtx) => (c.childId ? `${base}${base.includes('?') ? '&' : '?'}child=${c.childId}` : base);

/** Forum conseillé pour chaque portée (la communauté reste accessible à tout le monde). */
export const SPACE_FOR_SCOPE: Record<Scope, string | null> = {
  avoid: 'eviter-grossesse', ttc: 'projet-bebe', cycle: 'fertilite', none: null, pregnancy: 'grossesse',
  postpartum: 'post-partum', baby: 'parents-bebes', child: 'parents-enfants', family: 'familles-nombreuses',
};

export const TOOLS: ToolDef[] = [
  // ---------------------------------------------------------------- pour tout le monde (adaptés au profil)
  { id: 'scan_product', theme: 'scanner', icon: 'maximize', scopes: ALL, universal: true, href: () => '/scanner/product' },
  { id: 'scan_food', theme: 'scanner', icon: 'search', scopes: ALL, universal: true, href: () => '/scanner/food' },
  { id: 'scan_history', theme: 'scanner', icon: 'clock', scopes: ALL, universal: true, href: () => '/scanner/history' },
  { id: 'scan_compare', theme: 'scanner', icon: 'columns', scopes: ALL, universal: true, href: () => '/scanner/compare' },
  { id: 'scan_avoid', theme: 'scanner', icon: 'slash', scopes: ALL, universal: true, href: () => '/scanner/avoid' },
  { id: 'ask', theme: 'resources', icon: 'message-circle', scopes: ALL, universal: true, href: () => '/(tabs)/ask' },
  { id: 'local_ai', theme: 'resources', icon: 'cpu', scopes: ALL, universal: true, href: () => '/assistant/local' },
  { id: 'nearby', theme: 'resources', icon: 'map-pin', scopes: ALL, universal: true, href: () => '/outings' },
  { id: 'mood', theme: 'mood', icon: 'smile', scopes: ADULT, universal: true, href: () => '/me/mood' },
  { id: 'kid_mood', theme: 'mood', icon: 'sun', scopes: KID, universal: true, href: (c) => kid(c, '/wellbeing') },
  { id: 'sleep', theme: 'sleep', icon: 'cloud', scopes: ADULT, universal: true, href: () => '/me/sleep' },
  { id: 'kid_sleep', theme: 'sleep', icon: 'moon', scopes: KID, universal: true, href: (c) => q('/night', c) },
  { id: 'kid_sleep_rhythm', theme: 'sleep', icon: 'trending-up', scopes: KID, href: (c) => (c.childId ? `/sleep/${c.childId}` : null) },
  { id: 'summary', theme: 'resources', icon: 'file-text', scopes: [...KID, 'pregnancy'], href: () => '/summary' },
  { id: 'family_summary', theme: 'tasks', icon: 'home', scopes: ['family'], href: () => '/summary?family=1' },
  { id: 'meals', theme: 'feeding', icon: 'coffee', scopes: [...ADULT.filter((x) => x !== 'pregnancy'), ...KID], universal: true, href: (c) => (c.childId ? `/meals?for=${c.scope}&child=${c.childId}` : `/meals?for=${c.scope}`) },
  { id: 'appointments', theme: 'health', icon: 'calendar', scopes: ALL, universal: true, href: (c) => (c.childId ? `/appointments?child=${c.childId}` : c.scope === 'pregnancy' ? '/appointments?for=pregnancy' : '/appointments') },
  { id: 'documents', theme: 'health', icon: 'folder', scopes: ALL, universal: true, href: (c) => (c.childId ? `/documents?child=${c.childId}` : c.scope === 'pregnancy' ? '/documents?for=pregnancy' : '/documents') },
  { id: 'community', theme: 'resources', icon: 'users', scopes: ALL, universal: true, href: (c) => (SPACE_FOR_SCOPE[c.scope] ? `/(tabs)/community?space=${SPACE_FOR_SCOPE[c.scope]}` : '/(tabs)/community') },
  { id: 'library', theme: 'resources', icon: 'book-open', scopes: ALL, universal: true, href: () => '/library' },
  { id: 'sources', theme: 'resources', icon: 'link', scopes: ALL, universal: true, href: () => '/sources' },
  { id: 'kid_products', theme: 'prevention', icon: 'shopping-bag', scopes: [...KID, 'family', 'pregnancy', 'none'], universal: true, href: () => '/products' },
  { id: 'meal_rankings', theme: 'feeding', icon: 'award', scopes: [...KID, 'family'], universal: true, href: () => '/meals/rankings' },
  { id: 'emergency', theme: 'health', icon: 'life-buoy', scopes: ALL, universal: true, urgent: true, href: () => '/emergency' },
  { id: 'reminders', theme: 'reminders', icon: 'bell', scopes: ALL, universal: true, href: () => '/settings/reminders' },
  { id: 'notifications', theme: 'reminders', icon: 'inbox', scopes: ALL, universal: true, href: () => '/notifications' },
  { id: 'home_settings', theme: 'reminders', icon: 'layout', scopes: ALL, universal: true, href: () => '/settings/home' },
  { id: 'settings', theme: 'reminders', icon: 'settings', scopes: ALL, universal: true, href: () => '/settings' },
  { id: 'journeys', theme: 'reminders', icon: 'refresh-cw', scopes: ALL, universal: true, href: () => '/journeys' },

  // ---------------------------------------------------------------- éviter une grossesse
  { id: 'avoid_cycle', theme: 'cycle', icon: 'calendar', scopes: ['avoid'], href: () => '/cycle' },
  { id: 'avoid_contraception', theme: 'cycle', icon: 'shield', scopes: ['avoid'], href: () => '/contraception' },
  { id: 'avoid_methods', theme: 'cycle', icon: 'list', scopes: ['avoid'], href: () => '/contraception/methods' },
  { id: 'avoid_emergency', theme: 'cycle', icon: 'alert-circle', scopes: ['avoid'], href: () => '/contraception/emergency' },
  { id: 'avoid_fertile', theme: 'cycle', icon: 'sunrise', scopes: ['avoid'], href: () => '/cycle/calendar' },
  { id: 'cycle_symptoms', theme: 'cycle', icon: 'activity', scopes: ['avoid', 'ttc', 'cycle'], href: () => '/cycle/symptoms' },
  { id: 'avoid_reminders', theme: 'reminders', icon: 'bell', scopes: ['avoid'], href: () => '/contraception/reminders' },
  { id: 'avoid_consult', theme: 'cycle', icon: 'clipboard', scopes: ['avoid'], href: () => '/contraception/consultation' },

  // ---------------------------------------------------------------- projet bébé
  { id: 'ttc_start_pregnancy', theme: 'pregnancy', icon: 'heart', scopes: ['ttc', 'avoid', 'cycle', 'none'], href: () => '/pregnancy/start' },
  { id: 'ttc_cycle', theme: 'cycle', icon: 'calendar', scopes: ['ttc'], href: () => '/fertility' },
  { id: 'ttc_calendar', theme: 'cycle', icon: 'grid', scopes: ['ttc'], href: () => '/cycle/calendar' },
  { id: 'ttc_periods', theme: 'cycle', icon: 'droplet', scopes: ['ttc'], href: () => '/cycle' },
  { id: 'ttc_tests', theme: 'cycle', icon: 'check-circle', scopes: ['ttc'], href: () => '/fertility/log' },
  { id: 'ttc_mucus', theme: 'cycle', icon: 'search', scopes: ['ttc'], href: () => '/fertility/mucus' },
  { id: 'ttc_temperature', theme: 'cycle', icon: 'thermometer', scopes: ['ttc'], href: () => '/fertility/body' },
  { id: 'ttc_intimacy', theme: 'cycle', icon: 'lock', scopes: ['ttc'], href: () => '/fertility/intimacy' },
  { id: 'ttc_exams', theme: 'health', icon: 'clipboard', scopes: ['ttc'], href: () => '/fertility/exams' },
  { id: 'ttc_understand', theme: 'cycle', icon: 'book', scopes: ['ttc'], href: () => '/fertility/understand' },
  { id: 'ttc_consult', theme: 'health', icon: 'file-text', scopes: ['ttc'], href: () => '/fertility/consultation' },
  { id: 'ttc_reminders', theme: 'reminders', icon: 'bell', scopes: ['ttc'], href: () => '/fertility/reminders' },
  { id: 'ttc_articles', theme: 'resources', icon: 'book-open', scopes: ['ttc'], href: () => '/library?q=conception' },

  // ---------------------------------------------------------------- suivre mon cycle
  { id: 'cycle_home', theme: 'cycle', icon: 'calendar', scopes: ['cycle'], href: () => '/cycle' },
  { id: 'cycle_calendar', theme: 'cycle', icon: 'grid', scopes: ['cycle'], href: () => '/cycle/calendar' },
  { id: 'cycle_journal', theme: 'cycle', icon: 'edit-3', scopes: ['cycle'], href: () => '/cycle/journal' },
  { id: 'cycle_stats', theme: 'cycle', icon: 'bar-chart-2', scopes: ['cycle', 'avoid', 'ttc'], href: () => '/cycle/stats' },
  { id: 'cycle_guides', theme: 'resources', icon: 'book', scopes: ['cycle', 'avoid', 'ttc'], href: () => '/cycle/guides' },

  // ---------------------------------------------------------------- grossesse
  { id: 'preg_evolution', theme: 'pregnancy', icon: 'moon', scopes: ['pregnancy'], href: () => '/pregnancy' },
  { id: 'preg_weight', theme: 'pregnancy', icon: 'trending-up', scopes: ['pregnancy'], href: () => '/pregnancy/weight' },
  // Grossesse : « Repas » devient « Bien manger enceinte » ; symptômes du jour ; calendrier des échographies
  { id: 'preg_eat', theme: 'feeding', icon: 'coffee', scopes: ['pregnancy'], href: () => '/pregnancy/eat' },
  { id: 'preg_feel', theme: 'pregnancy', icon: 'feather', scopes: ['pregnancy'], href: () => '/pregnancy/feel' },
  { id: 'preg_calendar', theme: 'calendar', icon: 'calendar', scopes: ['pregnancy'], href: () => '/pregnancy/calendar' },
  { id: 'preg_birth_prep', theme: 'pregnancy', icon: 'book-open', scopes: ['pregnancy'], href: () => '/library?q=accouchement' },
  { id: 'preg_articles', theme: 'resources', icon: 'book', scopes: ['pregnancy'], href: () => '/library?journey=pregnant' },
  { id: 'preg_intimacy', theme: 'resources', icon: 'heart', scopes: ['pregnancy'], href: () => '/library?cat=sexualite' },
  { id: 'preg_names', theme: 'pregnancy', icon: 'star', scopes: ['pregnancy', 'ttc'], href: () => '/names' },
  { id: 'preg_lists', theme: 'pregnancy', icon: 'check-square', scopes: ['pregnancy'], href: () => '/lists' },
  { id: 'preg_edit', theme: 'pregnancy', icon: 'edit-2', scopes: ['pregnancy'], href: () => '/pregnancy/edit' },
  { id: 'preg_end', theme: 'pregnancy', icon: 'flag', scopes: ['pregnancy'], href: () => '/pregnancy/end' },

  // ---------------------------------------------------------------- post-partum de la mère (rangé dans « Mon bébé est né »)
  // Plus de catégorie « Post-partum » indépendante : sommeil, humeur, récupération et allaitement de la mère apparaissent
  // dans le profil du bébé (et dans « Moi ») tant qu'un post-partum est en cours.
  { id: 'pp_recovery', theme: 'mood', icon: 'heart', scopes: ['postpartum', 'baby', 'none'], when: (c) => c.scope === 'postpartum' || !!c.postpartum, href: () => '/postpartum' },
  { id: 'pp_checkin', theme: 'mood', icon: 'edit-3', scopes: ['postpartum', 'baby', 'none'], when: (c) => c.scope === 'postpartum' || !!c.postpartum, href: () => '/postpartum/checkin' },
  { id: 'pp_body', theme: 'mood', icon: 'feather', scopes: ['postpartum', 'baby', 'none'], when: (c) => c.scope === 'postpartum' || !!c.postpartum, href: () => '/postpartum/recovery' },
  { id: 'pp_mental', theme: 'mood', icon: 'cloud-drizzle', scopes: ['postpartum', 'baby', 'none'], when: (c) => c.scope === 'postpartum' || !!c.postpartum, href: () => '/postpartum/understand' },
  { id: 'pp_support', theme: 'mood', icon: 'life-buoy', scopes: ['postpartum', 'baby', 'none'], when: (c) => c.scope === 'postpartum' || !!c.postpartum, href: () => '/postpartum/support' },
  { id: 'pp_partner', theme: 'mood', icon: 'users', scopes: ['postpartum', 'baby'], when: (c) => c.scope === 'postpartum' || !!c.postpartum, href: () => '/postpartum/partner' },
  { id: 'pp_feeding', theme: 'feeding', icon: 'droplet', scopes: ['postpartum'], when: (c) => !!c.babyId, href: (c) => (c.babyId ? `/track/breastfeed?child=${c.babyId}` : null) },
  { id: 'pp_bottle', theme: 'feeding', icon: 'coffee', scopes: ['postpartum'], when: (c) => !!c.babyId, href: (c) => (c.babyId ? `/bottle/${c.babyId}` : null) },

  // ---------------------------------------------------------------- bébé (enfant né, moins de 2 ans)
  { id: 'baby_breastfeed', theme: 'feeding', icon: 'droplet', scopes: ['baby'], href: (c) => q('/track/breastfeed', c) },
  { id: 'baby_bottle_timer', theme: 'feeding', icon: 'clock', scopes: ['baby'], href: (c) => (c.childId ? `/bottle/${c.childId}` : null) },
  { id: 'baby_bottle', theme: 'feeding', icon: 'coffee', scopes: ['baby'], href: (c) => q('/track/bottle', c) },
  { id: 'baby_bottle_history', theme: 'feeding', icon: 'bar-chart-2', scopes: ['baby'], href: (c) => q('/bottle/history', c) },
  { id: 'baby_diaper', theme: 'diapers', icon: 'wind', scopes: ['baby'], href: (c) => q('/track/diaper', c) },
  { id: 'baby_daily', theme: 'diapers', icon: 'activity', scopes: ['baby'], href: () => '/(tabs)/track' },
  { id: 'baby_foods', theme: 'feeding', icon: 'feather', scopes: KID, href: (c) => kid(c, '/discoveries') },
  { id: 'baby_night_help', theme: 'sleep', icon: 'star', scopes: ['baby'], href: (c) => q('/night/help', c) },

  // ---------------------------------------------------------------- bébé et enfant
  { id: 'kid_profile', theme: 'growth', icon: 'smile', scopes: KID, href: (c) => kid(c) },
  { id: 'kid_growth', theme: 'growth', icon: 'trending-up', scopes: KID, href: (c) => kid(c, '/growth') },
  { id: 'kid_grow', theme: 'growth', icon: 'star', scopes: KID, href: (c) => kid(c, '/grow') },
  { id: 'kid_milestones', theme: 'growth', icon: 'award', scopes: KID, href: (c) => kid(c, '?tab=etapes') },
  { id: 'kid_vaccines', theme: 'health', icon: 'shield', scopes: KID, href: (c) => kid(c, '/vaccines') },
  { id: 'kid_teeth', theme: 'teeth', icon: 'circle', scopes: KID, href: (c) => q('/teeth', c) },
  { id: 'kid_health', theme: 'health', icon: 'thermometer', scopes: KID, href: (c) => kid(c, '/health-tracking') },
  { id: 'kid_needs', theme: 'health', icon: 'compass', scopes: ['child'], href: (c) => kid(c, '/needs') },
  { id: 'kid_treatments', theme: 'health', icon: 'clipboard', scopes: KID, href: (c) => kid(c, '/needs?tab=treatments') },

  // ---------------------------------------------------------------- organisation familiale
  { id: 'family_tasks', theme: 'tasks', icon: 'check-square', scopes: TOGETHER, href: () => '/family' },
  { id: 'family_routines', theme: 'tasks', icon: 'list', scopes: TOGETHER, href: () => '/family/routines' },
  { id: 'family_history', theme: 'tasks', icon: 'clock', scopes: ['family'], href: () => '/family/history' },
  { id: 'family_calendar', theme: 'calendar', icon: 'calendar', scopes: TOGETHER, href: () => '/calendar' },
  { id: 'family_nights', theme: 'relay', icon: 'moon', scopes: ['baby', 'child', 'family', 'postpartum', 'pregnancy'], href: () => '/family/nights' },
  { id: 'family_metime', theme: 'metime', icon: 'sun', scopes: TOGETHER, href: () => '/family/me-time' },
  { id: 'family_difficult', theme: 'prevention', icon: 'wind', scopes: TOGETHER, href: () => '/family/difficult' },
  { id: 'family_urgent', theme: 'prevention', icon: 'zap', scopes: ['baby', 'child', 'family', 'postpartum'], href: () => '/family/urgent' },
  { id: 'family_review', theme: 'prevention', icon: 'bar-chart-2', scopes: ['family'], href: () => '/family/review' },
  { id: 'family_sos', theme: 'prevention', icon: 'life-buoy', scopes: ['baby', 'child', 'family', 'postpartum'], urgent: true, href: () => '/family/sos' },

  // ---------------------------------------------------------------- guides thématiques (04/11/2026) : les fiches rangées par besoin
  { id: 'guide_illnesses', theme: 'health', icon: 'thermometer', scopes: [...KID, 'family'], href: () => '/guide/illnesses' },
  { id: 'guide_firstaid', theme: 'health', icon: 'life-buoy', scopes: [...KID, 'family', 'pregnancy', 'postpartum', 'none'], href: () => '/guide/firstaid' },
  { id: 'guide_hygiene', theme: 'growth', icon: 'droplet', scopes: [...KID, 'family'], href: () => '/guide/hygiene' },
  { id: 'guide_sport', theme: 'growth', icon: 'activity', scopes: ['child', 'family'], href: () => '/guide/sport' },
  { id: 'guide_activities', theme: 'growth', icon: 'sun', scopes: [...KID, 'family'], href: () => '/guide/activities' },
  { id: 'guide_kidsleep', theme: 'sleep', icon: 'moon', scopes: [...KID, 'family'], href: () => '/guide/kidsleep' },
  { id: 'guide_kidfood', theme: 'feeding', icon: 'coffee', scopes: [...KID, 'family'], href: () => '/guide/kidfood' },
  { id: 'guide_behaviour', theme: 'mood', icon: 'smile', scopes: ['child', 'family'], href: () => '/guide/behaviour' },
  { id: 'guide_school', theme: 'tasks', icon: 'book', scopes: [...KID, 'family'], href: () => '/guide/school' },
  { id: 'guide_toddler', theme: 'growth', icon: 'trending-up', scopes: KID, href: () => '/guide/toddler' },
  { id: 'guide_work', theme: 'resources', icon: 'briefcase', scopes: ['pregnancy', 'postpartum', 'ttc', 'none', 'baby', 'family'], href: () => '/guide/work' },
  { id: 'guide_loss', theme: 'mood', icon: 'heart', scopes: ['pregnancy', 'postpartum', 'ttc', 'cycle', 'avoid', 'none'], href: () => '/guide/loss' },
  { id: 'guide_pma', theme: 'cycle', icon: 'clipboard', scopes: ['ttc'], href: () => '/guide/pma' },
  { id: 'guide_couple', theme: 'relay', icon: 'users', scopes: TOGETHER, href: () => '/guide/couple' },
  { id: 'guide_neonat', theme: 'health', icon: 'heart', scopes: ['baby', 'postpartum'], href: (c) => (c.childId || c.babyId ? `/guide/neonat?child=${c.childId ?? c.babyId}` : '/guide/neonat') },

  // ---------------------------------------------------------------- nouveaux outils issus des scripts (04/11/2026)
  { id: 'consult_questions', theme: 'health', icon: 'help-circle', scopes: ALL, universal: true, href: (c) => (c.childId ? `/consult/questions?child=${c.childId}` : c.scope === 'pregnancy' ? '/consult/questions?for=pregnancy' : '/consult/questions') },
  { id: 'preg_moves', theme: 'pregnancy', icon: 'activity', scopes: ['pregnancy'], href: () => '/pregnancy/moves' },
  { id: 'contraception_journal', theme: 'cycle', icon: 'edit-3', scopes: ['avoid'], href: () => '/contraception/journal' },
  { id: 'cycle_kit', theme: 'reminders', icon: 'briefcase', scopes: ['avoid', 'ttc', 'cycle'], href: () => '/cycle/kit' },
  { id: 'kid_card', theme: 'health', icon: 'file-text', scopes: KID, href: (c) => kid(c, '/card') },
  { id: 'kid_steps', theme: 'health', icon: 'check-square', scopes: ['child'], href: (c) => kid(c, '/steps') },
];

export const TOOL_BY_ID = Object.fromEntries(TOOLS.map((x) => [x.id, x])) as Record<string, ToolDef>;

/** Clés de traduction (libellé et précision) d'un outil. */
export const toolLabelKey = (id: string) => `tool.${id}` as TKey;
export const toolSubKey = (id: string) => `tool.${id}.sub` as TKey;

export interface ResolvedTool { id: string; theme: ToolTheme; icon: IconName; href: string; universal: boolean; urgent: boolean }

/** Outils autorisés pour le profil affiché, avec leur adresse adaptée. */
export function toolsFor(c: ScopeCtx): ResolvedTool[] {
  const out: ResolvedTool[] = [];
  for (const d of TOOLS) {
    if (!d.scopes.includes(c.scope)) continue;
    if (d.when && !d.when(c)) continue;
    const href = d.href(c);
    if (!href) continue;
    out.push({ id: d.id, theme: d.theme, icon: d.icon, href, universal: !!d.universal, urgent: !!d.urgent });
  }
  return out;
}

export const isToolAllowed = (id: string, c: ScopeCtx) => toolsFor(c).some((x) => x.id === id);

/**
 * Garde d'accès des écrans propres à un parcours : un écran n'est autorisé que si l'une des portées
 * actives (tous mes profils suivis) le permet. Les écrans non listés restent libres.
 */
const SCREEN_RULES: { prefix: string; scopes: Scope[]; subOnly?: boolean }[] = [
  { prefix: '/pregnancy/start', scopes: SCOPES },
  { prefix: '/postpartum/partner', scopes: SCOPES },
  { prefix: '/cycle', scopes: ['avoid', 'ttc', 'cycle'] },
  { prefix: '/pregnancy', scopes: ['pregnancy'] },
  { prefix: '/bottle', scopes: ['baby', 'postpartum'] },
  // « /track » seul est l'onglet Suivi (pour tous) ; « /track/biberon… » est une saisie pour un enfant né
  { prefix: '/track', scopes: ['baby', 'child', 'postpartum'], subOnly: true },
  { prefix: '/fertility', scopes: ['ttc'] },
  // Rappels de pilule, patch, anneau, traitement prescrit ou rendez-vous : utiles quel que soit l'objectif du cycle
  { prefix: '/contraception/reminders', scopes: ['avoid', 'ttc', 'cycle'] },
  { prefix: '/contraception', scopes: ['avoid'] },
  { prefix: '/postpartum', scopes: ['postpartum'] },
  { prefix: '/night/help', scopes: ['baby', 'child'] },
];
export function screenAllowed(path: string, activeScopes: Scope[]): boolean {
  const rule = SCREEN_RULES.find((r) => (!r.subOnly && (path === r.prefix || path.startsWith(`${r.prefix}?`))) || path.startsWith(`${r.prefix}/`));
  return !rule || rule.scopes.some((s) => activeScopes.includes(s));
}

// ---------------------------------------------------------------- actions rapides (3 ou 4, profil affiché)
export type QuickKey = 'cyclecal' | 'nighthelp' | 'bottle' | 'breastfeed' | 'diaper' | 'sleep' | 'meal' | 'question' | 'mood' | 'weight' | 'period' | 'test' | 'pill' | 'mysleep' | 'appointment' | 'growth' | 'treatment' | 'checkin' | 'calendar' | 'symptom' | 'observation' | 'scan' | 'tasks' | 'agenda' | 'journal' | 'relay' | 'postpartum';

export function quickFor(c: ScopeCtx): QuickKey[] {
  switch (c.scope) {
    case 'baby': return ['bottle', 'breastfeed', 'diaper', 'sleep'];
    case 'child': return ['meal', 'sleep', 'growth', 'treatment'];
    case 'pregnancy': return ['weight', 'mood', 'mysleep', 'appointment'];
    case 'postpartum': return ['checkin', 'mood', 'mysleep', 'appointment'];
    case 'ttc': return ['cyclecal', 'period', 'test', 'symptom'];
    case 'avoid': return ['cyclecal', 'period', 'symptom', 'pill'];
    case 'cycle': return ['period', 'symptom', 'mood', 'mysleep'];
    case 'family': return ['calendar', 'appointment', 'question'];
    default: return ['mood', 'mysleep', 'appointment'];
  }
}

/** Les actions rapides liées à un enfant n'existent que si un enfant né est affiché. */
export const CHILD_QUICK: QuickKey[] = ['bottle', 'breastfeed', 'diaper', 'sleep', 'meal', 'growth', 'treatment'];

/** Un raccourci personnalisé n'apparaît que s'il est autorisé pour le profil affiché (jamais un biberon pendant la grossesse). */
export function quickAllowed(k: string, c: ScopeCtx): boolean {
  const kid = c.scope === 'baby' || c.scope === 'child';
  switch (k) {
    case 'bottle': case 'breastfeed': case 'diaper': return c.scope === 'baby' || (c.scope === 'postpartum' && !!c.babyId && k !== 'diaper');
    case 'sleep': case 'meal': case 'observation': case 'growth': case 'treatment': return kid;
    case 'weight': return c.scope === 'pregnancy';
    case 'period': case 'symptom': case 'cyclecal': return ['avoid', 'ttc', 'cycle'].includes(c.scope);
    case 'nighthelp': return c.scope === 'baby';
    case 'journal': return false; // catégorie « Journal et souvenirs » retirée
    case 'test': return c.scope === 'ttc';
    case 'pill': return c.scope === 'avoid';
    case 'checkin': case 'postpartum': return c.scope === 'postpartum' || (c.scope === 'baby' && !!c.postpartum);
    case 'relay': return ['postpartum', 'baby', 'child', 'family'].includes(c.scope);
    default: return true; // humeur, sommeil de la mère, rendez-vous, question, scanner, agenda, tâches, journal
  }
}
