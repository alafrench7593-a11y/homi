/**
 * SYSTÈME CENTRAL des outils autorisés — et, depuis la refonte « centre d'outils » (17/11/2026), leur CATALOGUE :
 * un besoin = une entrée.
 *
 * Chaque outil déclare :
 *  - sa CATÉGORIE PRINCIPALE, unique (les 9 rayons du centre d'outils ; « community » pour l'espace Communauté et
 *    « account » pour les réglages, qui ne sont pas des outils), et les catégories où il est AUSSI proposé en
 *    raccourci contextuel (`also`) : un seul identifiant, un seul favori, où qu'il apparaisse ;
 *  - les « portées » où il a le droit d'apparaître. La portée vient du profil affiché (sélecteur) et du parcours actif :
 *      avoid · ttc · cycle · none      → « Moi » (selon mon parcours de cycle, ou aucun)
 *      pregnancy                        → ma grossesse en cours
 *      postpartum                       → mon post-partum
 *      baby · child                     → un enfant né suivi (bébé jusqu'à 2 ans, enfant ensuite)
 *      family                           → toute la famille (organisation, agenda : aucune saisie pour un enfant)
 *  - sa route directe (selon le profil affiché) ;
 *  - ses SOUS-ACCÈS éventuels (`subs`) : onglets ou filtres du même écran qui étaient autrefois des outils à part
 *    (filtres de la bibliothèque, onglets de la fiche enfant, guides de lecture) ;
 *  - ses anciens identifiants (`aliases`) : toujours résolus (`resolveTool`), pour ne casser ni favoris ni liens.
 *
 * Nom, description d'une phrase, mots de recherche et « problème résolu » : `th.<id>`, `th.<id>.d`, `th.<id>.k`,
 * `th.<id>.problem` (src/i18n/<langue>/toolhub.ts).
 * Statut Premium : calculé depuis src/lib/premium/access.ts (source unique), voir `toolCatalog`.
 *
 * Ce registre sert au centre d'outils, aux onglets, à l'accueil, aux actions rapides ET au garde d'accès des écrans
 * (`screenAllowed`) : un écran d'un autre parcours ne s'ouvre pas sur des données mélangées.
 */
import type { IconName } from '@/components/ui';
import type { ToolTheme } from '@/lib/domain/toolCatalog';
import type { TKey } from '@/i18n';
import { HOMI_200, H200_BY_ID, H200_VIEWS, h200Root, type H200View } from './homi200';

export type Scope = 'avoid' | 'ttc' | 'cycle' | 'none' | 'pregnancy' | 'postpartum' | 'baby' | 'child' | 'family';
export const SCOPES: Scope[] = ['avoid', 'ttc', 'cycle', 'none', 'pregnancy', 'postpartum', 'baby', 'child', 'family'];
const ME: Scope[] = ['avoid', 'ttc', 'cycle', 'none'];
const ADULT: Scope[] = [...ME, 'pregnancy', 'postpartum'];
const KID: Scope[] = ['baby', 'child'];
const ALL = SCOPES;
// Cycle menstruel toujours proposé dans « Moi » (aussi sans parcours cycle, ex. pendant une grossesse) : le rayon ne disparaît plus
const CYCLE: Scope[] = ['avoid', 'ttc', 'cycle', 'none'];
/** « À deux » (04/11/2026) : la charge mentale ne commence pas avec un enfant — tâches, agenda et relais sont ouverts à tous. */
const TOGETHER: Scope[] = [...ADULT, 'baby', 'child', 'family'];

/**
 * Les 9 catégories du centre d'outils, dans l'ordre d'affichage. Deux rangements à part, qui ne sont PAS des
 * catégories d'outils : « community » (l'espace Communauté, indépendant des 9 catégories : un bloc distinct dans
 * « Mes outils », accès principal en haut à droite) et « account » (Mon compte et réglages).
 */
export type ToolCategory = 'feeding' | 'sleep' | 'care' | 'health' | 'cycle' | 'pregnancy' | 'school' | 'couple' | 'family' | 'community' | 'account';
export type ToolShelf = Exclude<ToolCategory, 'account' | 'community'>;
export const TOOL_CATEGORIES: ToolShelf[] = ['feeding', 'sleep', 'care', 'health', 'cycle', 'pregnancy', 'school', 'couple', 'family'];
/** Anciens identifiants de catégorie (liens `/tools/<catégorie>` écrits avant le 18/11/2026) : toujours résolus. */
export const CATEGORY_ALIASES: Record<string, ToolShelf> = { growth: 'care' };
export const canonicalCategory = (c: string | null | undefined): ToolCategory | null =>
  (!c ? null : c in CATEGORY_ALIASES ? CATEGORY_ALIASES[c] : c === 'account' || c === 'community' || (TOOL_CATEGORIES as string[]).includes(c) ? (c as ToolCategory) : null);

/** Profil lisible d'un outil (les 4 parcours de cycle et « aucun » sont tous « Moi »). */
export type ToolProfile = 'me' | 'pregnancy' | 'postpartum' | 'baby' | 'child' | 'family';
export const TOOL_PROFILES: ToolProfile[] = ['me', 'pregnancy', 'postpartum', 'baby', 'child', 'family'];
export const profileOfScope = (s: Scope): ToolProfile => (s === 'avoid' || s === 'ttc' || s === 'cycle' || s === 'none' ? 'me' : s);

export interface ScopeCtx {
  scope: Scope;
  childId?: string | null;
  pregnancyId?: string | null;
  /** Un enfant de moins de 2 ans est suivi (post-partum : allaitement ou biberon seulement dans ce cas). */
  babyId?: string | null;
  /** Un post-partum est en cours : les informations de la mère (sommeil, humeur, récupération, allaitement) sont rangées dans « Mon bébé est né ». */
  postpartum?: boolean;
}

/** Sous-accès d'un outil : un onglet, un filtre ou une lecture du même écran (ancien outil à part entière). */
export interface ToolSubDef {
  /** Identifiant court ; l'identifiant complet est `<outil>.<id>` (favoris, recherche). */
  id: string;
  /** Ancien identifiant du registre : son libellé (`tool.<legacy>`) et sa précision (`tool.<legacy>.sub`) sont repris. */
  legacy: string;
  icon: IconName;
  /** Catégorie où ce sous-accès est proposé en lecture (guides) ; par défaut celle de l'outil. */
  category?: ToolCategory;
  /** Portées où il existe ; par défaut celles de l'outil. */
  scopes?: Scope[];
  href: (c: ScopeCtx) => string | null;
  /** Numéro de la liste des 200 (sous-accès nommé `h200_<n>`) : nom `h2.<n>`, phrase `h2.<n>.d`, mots `h2.<n>.k`. */
  fn?: number;
}

export interface ToolDef {
  id: string;
  category: ToolCategory;
  /** Identité visuelle (couleur et animation du glyphe, en-tête de l'écran) : inchangée par le rangement en catégories. */
  theme: ToolTheme;
  icon: IconName;
  scopes: Scope[];
  /** Outil « pour tout le monde » adapté au profil affiché. */
  universal?: boolean;
  /**
   * Catégories où l'outil est AUSSI proposé, comme raccourci contextuel (« Aussi utile ici ») : même identifiant,
   * même favori, même fiche. Un outil n'a qu'UNE catégorie principale (`category`) : c'est la seule où il est compté.
   */
  also?: ToolShelf[];
  /** Adresse selon le profil affiché ; null = pas disponible dans ce contexte. */
  href: (c: ScopeCtx) => string | null;
  /** Condition supplémentaire (ex. allaitement en post-partum seulement si un bébé est suivi). */
  when?: (c: ScopeCtx) => boolean;
  urgent?: boolean;
  /** Anciens identifiants fusionnés dans cet outil (même écran) : toujours résolus. */
  aliases?: string[];
  subs?: ToolSubDef[];
}

const kid = (c: ScopeCtx, path = '') => (c.childId ? `/child/${c.childId}${path}` : null);
const q = (base: string, c: ScopeCtx) => (c.childId ? `${base}${base.includes('?') ? '&' : '?'}child=${c.childId}` : base);
/** Bébé concerné : l'enfant affiché, sinon le bébé suivi pendant le post-partum. */
const babyOf = (c: ScopeCtx) => c.childId ?? (c.scope === 'postpartum' ? c.babyId : null) ?? null;
const pp = (c: ScopeCtx) => c.scope === 'postpartum' || !!c.postpartum;
const mealsFor = (c: ScopeCtx) => (c.childId ? `/meals?for=${c.scope}&child=${c.childId}` : `/meals?for=${c.scope}`);
const MEAL_SCOPES: Scope[] = [...ME, 'postpartum', ...KID];

/** Forum conseillé pour chaque portée (la communauté reste accessible à tout le monde). */
export const SPACE_FOR_SCOPE: Record<Scope, string | null> = {
  avoid: 'eviter-grossesse', ttc: 'projet-bebe', cycle: 'fertilite', none: null, pregnancy: 'grossesse',
  postpartum: 'post-partum', baby: 'parents-bebes', child: 'parents-enfants', family: 'familles-nombreuses',
};

/** Guide de lecture (`/guide/<sujet>`) : sous-accès de « Guides pratiques », proposé « à lire » dans sa catégorie. */
const guide = (topic: string, icon: IconName, category: ToolCategory, scopes: Scope[], href?: ToolSubDef['href']): ToolSubDef =>
  ({ id: topic, legacy: `guide_${topic}`, icon, category, scopes, href: href ?? (() => `/guide/${topic}`) });

export const TOOLS: ToolDef[] = [
  // ================================================================ 1. Alimentation et allaitement (sans les couches : voir 3)
  { id: 'baby_breastfeed', category: 'feeding', theme: 'feeding', icon: 'droplet', scopes: ['baby', 'postpartum'], aliases: ['pp_feeding'],
    when: (c) => c.scope === 'baby' || !!c.babyId, href: (c) => (c.scope === 'baby' ? q('/track/breastfeed', c) : c.babyId ? `/track/breastfeed?child=${c.babyId}` : null) },
  { id: 'baby_bottle', category: 'feeding', theme: 'feeding', icon: 'plus-circle', scopes: ['baby'], href: (c) => q('/track/bottle', c) },
  { id: 'baby_bottle_timer', category: 'feeding', theme: 'feeding', icon: 'pause-circle', scopes: ['baby', 'postpartum'], aliases: ['pp_bottle'],
    when: (c) => c.scope === 'baby' || !!c.babyId, href: (c) => (babyOf(c) ? `/bottle/${babyOf(c)}` : null) },
  { id: 'baby_bottle_history', category: 'feeding', theme: 'feeding', icon: 'bar-chart', scopes: ['baby'], href: (c) => q('/bottle/history', c) },
  { id: 'bottle_scoops', category: 'feeding', theme: 'feeding', icon: 'hash', scopes: ['baby', 'postpartum'], when: (c) => c.scope !== 'postpartum' || !!c.babyId, href: () => '/bottle/scoops' },
  { id: 'baby_foods', category: 'feeding', theme: 'feeding', icon: 'feather', scopes: KID, href: (c) => kid(c, '/discoveries') },
  { id: 'meals', category: 'feeding', theme: 'feeding', icon: 'coffee', scopes: MEAL_SCOPES, universal: true, href: mealsFor },
  { id: 'meal_menu', category: 'feeding', theme: 'feeding', icon: 'menu', scopes: [...MEAL_SCOPES, 'pregnancy', 'family'], universal: true, href: () => '/meals/menu' },
  { id: 'meal_pantry', category: 'feeding', theme: 'feeding', icon: 'archive', scopes: [...MEAL_SCOPES, 'pregnancy', 'family'], universal: true, href: () => '/meals/pantry' },
  { id: 'meal_rankings', category: 'feeding', theme: 'feeding', icon: 'award', scopes: [...KID, 'family'], universal: true, href: () => '/meals/rankings' },
  // Grossesse : « Repas » devient « Bien manger enceinte »
  { id: 'preg_eat', category: 'feeding', theme: 'feeding', icon: 'thumbs-up', scopes: ['pregnancy'], also: ['pregnancy'], href: () => '/pregnancy/eat' },
  // Scanner alimentaire : « puis-je manger ou donner cet aliment ? » selon le profil (grossesse, allaitement, bébé, allergies)
  { id: 'scan_food', category: 'feeding', theme: 'scanner', icon: 'search', scopes: ALL, universal: true, also: ['pregnancy', 'health'], href: () => '/scanner/food' },

  // ================================================================ 2. Sommeil et réveils
  { id: 'kid_sleep', category: 'sleep', theme: 'sleep', icon: 'moon', scopes: KID, universal: true, href: (c) => q('/night', c) },
  { id: 'kid_sleep_rhythm', category: 'sleep', theme: 'sleep', icon: 'sunset', scopes: KID, href: (c) => (c.childId ? `/sleep/${c.childId}` : null) },
  { id: 'sleep_help', category: 'sleep', theme: 'sleep', icon: 'navigation', scopes: KID, href: (c) => (c.childId ? `/sleep/help/${c.childId}` : null) },
  { id: 'baby_night_help', category: 'sleep', theme: 'sleep', icon: 'star', scopes: ['baby'], href: (c) => q('/night/help', c) },
  { id: 'family_nights', category: 'sleep', theme: 'relay', icon: 'repeat', scopes: ['baby', 'child', 'family', 'postpartum', 'pregnancy'], also: ['couple'], href: () => '/family/nights' },
  { id: 'sleep', category: 'sleep', theme: 'sleep', icon: 'cloud', scopes: ADULT, universal: true, href: () => '/me/sleep' },

  // ================================================================ 3. Soins, quotidien et croissance
  // Les soins et l'hygiène du bébé (couches, dents, produits de soin), ce qui est noté dans la journée, puis la
  // croissance. Les couches ne sont PAS de l'alimentation ; le suivi de la journée garde un raccourci vers elles.
  { id: 'baby_daily', category: 'care', theme: 'diapers', icon: 'layers', scopes: ['baby'], also: ['feeding', 'sleep'], href: () => '/(tabs)/track' },
  { id: 'baby_diaper', category: 'care', theme: 'diapers', icon: 'wind', scopes: ['baby'], href: (c) => q('/track/diaper', c) },
  { id: 'kid_teeth', category: 'care', theme: 'teeth', icon: 'circle', scopes: KID, href: (c) => q('/teeth', c) },
  // Scanner de produits : composition d'un cosmétique, d'un soin, de lingettes, de couches, d'une lessive ou d'un
  // produit d'entretien, lue selon le profil (grossesse, allaitement, bébé, enfant) → soins ; raccourci en santé et grossesse
  { id: 'scan_product', category: 'care', theme: 'scanner', icon: 'maximize', scopes: ALL, universal: true, also: ['health', 'pregnancy'], href: () => '/scanner/product' },
  { id: 'scan_history', category: 'care', theme: 'scanner', icon: 'rotate-ccw', scopes: ALL, universal: true, also: ['feeding'], href: () => '/scanner/history' },
  { id: 'scan_compare', category: 'care', theme: 'scanner', icon: 'columns', scopes: ALL, universal: true, also: ['feeding'], href: () => '/scanner/compare' },
  { id: 'kid_products', category: 'care', theme: 'prevention', icon: 'gift', scopes: [...KID, 'family', 'pregnancy', 'none'], universal: true, also: ['family'], href: () => '/products' },
  { id: 'journal', category: 'care', theme: 'growth', icon: 'align-left', scopes: [...KID, 'family'], href: () => '/journal' },
  // La fiche de l'enfant : la croissance et le journal en sont deux onglets (anciens outils `kid_growth`, `kid_milestones`)
  { id: 'kid_profile', category: 'care', theme: 'growth', icon: 'user', scopes: KID, href: (c) => kid(c), subs: [
    { id: 'growth', legacy: 'kid_growth', icon: 'trending-up', href: (c) => kid(c, '?tab=croissance') },
    { id: 'milestones', legacy: 'kid_milestones', icon: 'award', href: (c) => kid(c, '?tab=etapes') },
  ] },
  { id: 'kid_grow', category: 'care', theme: 'growth', icon: 'chevrons-up', scopes: KID, href: (c) => kid(c, '/grow') },
  { id: 'kid_mood', category: 'care', theme: 'mood', icon: 'sun', scopes: KID, universal: true, href: (c) => kid(c, '/wellbeing') },
  { id: 'kid_album', category: 'care', theme: 'growth', icon: 'image', scopes: KID, href: (c) => kid(c, '/album') },

  // ================================================================ 4. Santé, rendez-vous et conseils
  { id: 'appointments', category: 'health', theme: 'health', icon: 'calendar', scopes: ALL, universal: true, also: ['pregnancy'], href: (c) => (c.childId ? `/appointments?child=${c.childId}` : c.scope === 'pregnancy' ? '/appointments?for=pregnancy' : '/appointments') },
  { id: 'consult_questions', category: 'health', theme: 'health', icon: 'help-circle', scopes: ALL, universal: true, href: (c) => (c.childId ? `/consult/questions?child=${c.childId}` : c.scope === 'pregnancy' ? '/consult/questions?for=pregnancy' : '/consult/questions') },
  { id: 'documents', category: 'health', theme: 'health', icon: 'folder', scopes: ALL, universal: true, href: (c) => (c.childId ? `/documents?child=${c.childId}` : c.scope === 'pregnancy' ? '/documents?for=pregnancy' : '/documents') },
  { id: 'health_book', category: 'health', theme: 'health', icon: 'folder-plus', scopes: ALL, universal: true, href: () => '/documents/book' },
  { id: 'kid_vaccines', category: 'health', theme: 'health', icon: 'shield', scopes: KID, href: (c) => kid(c, '/vaccines') },
  { id: 'kid_health', category: 'health', theme: 'health', icon: 'thermometer', scopes: KID, href: (c) => kid(c, '/health-tracking') },
  // Même écran, deux onglets : traitements prescrits (bébé et enfant) et besoins particuliers (enfant seulement, ancien outil `kid_needs`)
  { id: 'kid_treatments', category: 'health', theme: 'health', icon: 'clipboard', scopes: KID, href: (c) => kid(c, '/needs?tab=treatments'), subs: [
    { id: 'needs', legacy: 'kid_needs', icon: 'compass', scopes: ['child'], href: (c) => kid(c, '/needs') },
  ] },
  { id: 'medications', category: 'health', theme: 'health', icon: 'plus-square', scopes: ALL, universal: true, href: () => '/medications' },
  { id: 'kid_steps', category: 'health', theme: 'health', icon: 'check-square', scopes: ['child'], href: (c) => kid(c, '/steps') },
  // Résumés (jour, semaine, avant rendez-vous) ; vue « famille » = même écran (ancien outil `family_summary`)
  { id: 'summary', category: 'health', theme: 'resources', icon: 'file-text', scopes: [...KID, 'pregnancy', 'family'], aliases: ['family_summary'], also: ['family'], href: (c) => (c.scope === 'family' ? '/summary?family=1' : '/summary') },
  { id: 'mood', category: 'health', theme: 'mood', icon: 'smile', scopes: ADULT, universal: true, href: () => '/me/mood' },
  { id: 'me_diary', category: 'health', theme: 'mood', icon: 'edit', scopes: ADULT, universal: true, href: () => '/me/diary' },
  { id: 'exhaustion_check', category: 'health', theme: 'mood', icon: 'battery', scopes: TOGETHER, also: ['couple'], href: () => '/family/exhausted' },
  // Sécurité des produits du foyer : la liste à éviter (allergies, intolérances) et les rappels officiels
  { id: 'scan_avoid', category: 'health', theme: 'scanner', icon: 'slash', scopes: ALL, universal: true, also: ['feeding', 'care'], href: () => '/scanner/avoid' },
  { id: 'recall_alerts', category: 'health', theme: 'scanner', icon: 'alert-octagon', scopes: ALL, universal: true, also: ['feeding', 'care'], href: () => '/scanner/recalls' },
  { id: 'emergency', category: 'health', theme: 'health', icon: 'life-buoy', scopes: ALL, universal: true, urgent: true, href: () => '/emergency' },
  { id: 'ask', category: 'health', theme: 'resources', icon: 'message-circle', scopes: ALL, universal: true, href: () => '/(tabs)/ask' },
  { id: 'local_ai', category: 'health', theme: 'resources', icon: 'cpu', scopes: ALL, universal: true, href: () => '/assistant/local' },
  // La bibliothèque et ses filtres par parcours (anciens outils `ttc_articles`, `preg_birth_prep`, `preg_articles`, `preg_intimacy`)
  { id: 'library', category: 'health', theme: 'resources', icon: 'book-open', scopes: ALL, universal: true, href: () => '/library', subs: [
    { id: 'conception', legacy: 'ttc_articles', icon: 'book-open', scopes: ['ttc'], href: () => '/library?q=conception' },
    { id: 'pregnancy', legacy: 'preg_articles', icon: 'book', scopes: ['pregnancy'], href: () => '/library?journey=pregnant' },
    { id: 'birth', legacy: 'preg_birth_prep', icon: 'book-open', scopes: ['pregnancy'], href: () => '/library?q=accouchement' },
    { id: 'intimacy', legacy: 'preg_intimacy', icon: 'heart', scopes: ['pregnancy'], href: () => '/library?cat=sexualite' },
  ] },
  // Guides pratiques : 15 fiches de lecture (anciens outils `guide_*`), proposées « à lire » dans leur catégorie
  { id: 'guides', category: 'health', theme: 'resources', icon: 'bookmark', scopes: ALL, universal: true, href: () => '/guide', subs: [
    guide('illnesses', 'thermometer', 'health', [...KID, 'family']),
    guide('firstaid', 'life-buoy', 'health', [...KID, 'family', 'pregnancy', 'postpartum', 'none']),
    guide('neonat', 'heart', 'health', ['baby', 'postpartum'], (c) => (c.childId || c.babyId ? `/guide/neonat?child=${c.childId ?? c.babyId}` : '/guide/neonat')),
    guide('kidfood', 'coffee', 'feeding', [...KID, 'family']),
    guide('kidsleep', 'moon', 'sleep', [...KID, 'family']),
    guide('hygiene', 'droplet', 'care', [...KID, 'family']),
    guide('activities', 'sun', 'care', [...KID, 'family']),
    guide('toddler', 'trending-up', 'care', KID),
    guide('sport', 'activity', 'care', ['child', 'family']),
    guide('behaviour', 'smile', 'care', ['child', 'family']),
    guide('school', 'book', 'school', [...KID, 'family']),
    guide('pma', 'clipboard', 'cycle', ['ttc']),
    guide('work', 'briefcase', 'pregnancy', ['pregnancy', 'postpartum', 'ttc', 'none', 'baby', 'family']),
    guide('loss', 'heart', 'pregnancy', ['pregnancy', 'postpartum', 'ttc', 'cycle', 'avoid', 'none']),
    guide('couple', 'users', 'couple', TOGETHER),
  ] },
  // Vidéos officielles et tutos : même écran, deux onglets (anciens outils `official_videos`, `video_tutos`)
  { id: 'videos', category: 'health', theme: 'resources', icon: 'play-circle', scopes: ALL, universal: true, aliases: ['official_videos'], href: () => '/videos', subs: [
    { id: 'tutos', legacy: 'video_tutos', icon: 'tool', href: () => '/tutos' },
  ] },
  { id: 'sources', category: 'health', theme: 'resources', icon: 'link', scopes: ALL, universal: true, href: () => '/sources' },

  // ================================================================ 5. Cycle et fertilité
  // « /cycle » redirige vers la contraception ou le projet bébé pour ces parcours : l'outil ouvre alors tout le suivi
  // (anciens outils `avoid_cycle`, `ttc_periods`)
  { id: 'cycle_home', category: 'cycle', theme: 'cycle', icon: 'rotate-cw', scopes: CYCLE, aliases: ['avoid_cycle', 'ttc_periods'], href: (c) => (c.scope === 'cycle' ? '/cycle' : '/cycle?all=1') },
  { id: 'cycle_calendar', category: 'cycle', theme: 'cycle', icon: 'grid', scopes: CYCLE, aliases: ['avoid_fertile', 'ttc_calendar'], href: () => '/cycle/calendar' },
  { id: 'cycle_symptoms', category: 'cycle', theme: 'cycle', icon: 'activity', scopes: CYCLE, href: () => '/cycle/symptoms' },
  { id: 'cycle_pain', category: 'cycle', theme: 'cycle', icon: 'cloud-lightning', scopes: CYCLE, href: () => '/cycle/pain' },
  { id: 'cycle_discharge', category: 'cycle', theme: 'cycle', icon: 'cloud-drizzle', scopes: CYCLE, href: () => '/cycle/discharge' },
  { id: 'cycle_bleeding', category: 'cycle', theme: 'cycle', icon: 'alert-triangle', scopes: CYCLE, href: () => '/cycle/bleeding' },
  { id: 'cycle_journal', category: 'cycle', theme: 'cycle', icon: 'edit-3', scopes: ['cycle'], href: () => '/cycle/journal' },
  { id: 'cycle_stats', category: 'cycle', theme: 'cycle', icon: 'bar-chart-2', scopes: CYCLE, href: () => '/cycle/stats' },
  // Écrans du suivi du cycle entrés au registre le 18/11/2026 (ils n'existaient que dans le menu de « Mon cycle »)
  { id: 'cycle_advice', category: 'cycle', theme: 'cycle', icon: 'compass', scopes: CYCLE, href: () => '/cycle/advice' },
  { id: 'cycle_month', category: 'cycle', theme: 'cycle', icon: 'file', scopes: CYCLE, href: () => '/cycle/month' },
  { id: 'cycle_export', category: 'cycle', theme: 'cycle', icon: 'printer', scopes: CYCLE, href: () => '/cycle/export' },
  { id: 'cycle_guides', category: 'cycle', theme: 'resources', icon: 'info', scopes: CYCLE, href: () => '/cycle/guides' },
  { id: 'cycle_kit', category: 'cycle', theme: 'reminders', icon: 'briefcase', scopes: CYCLE, href: () => '/cycle/kit' },
  { id: 'avoid_contraception', category: 'cycle', theme: 'cycle', icon: 'umbrella', scopes: ['avoid'], href: () => '/contraception' },
  { id: 'avoid_methods', category: 'cycle', theme: 'cycle', icon: 'sliders', scopes: ['avoid'], href: () => '/contraception/methods' },
  { id: 'avoid_emergency', category: 'cycle', theme: 'cycle', icon: 'alert-circle', scopes: ['avoid'], href: () => '/contraception/emergency' },
  { id: 'avoid_reminders', category: 'cycle', theme: 'reminders', icon: 'watch', scopes: ['avoid'], href: () => '/contraception/reminders' },
  { id: 'avoid_consult', category: 'cycle', theme: 'cycle', icon: 'user-check', scopes: ['avoid'], href: () => '/contraception/consultation' },
  { id: 'contraception_journal', category: 'cycle', theme: 'cycle', icon: 'pen-tool', scopes: ['avoid'], href: () => '/contraception/journal' },
  { id: 'ttc_cycle', category: 'cycle', theme: 'cycle', icon: 'target', scopes: ['ttc'], href: () => '/fertility' },
  { id: 'ttc_tests', category: 'cycle', theme: 'cycle', icon: 'check-circle', scopes: ['ttc'], href: () => '/fertility/log' },
  { id: 'ttc_mucus', category: 'cycle', theme: 'cycle', icon: 'eye', scopes: ['ttc'], href: () => '/fertility/mucus' },
  { id: 'ttc_temperature', category: 'cycle', theme: 'cycle', icon: 'sunrise', scopes: ['ttc'], href: () => '/fertility/body' },
  // Rapports : un seul suivi (même table) ; l'adresse « concevoir » garde la fenêtre fertile, les autres parcours ouvrent le module cycle
  { id: 'ttc_intimacy', category: 'cycle', theme: 'cycle', icon: 'lock', scopes: CYCLE, href: (c) => (c.scope === 'ttc' ? '/fertility/intimacy' : '/cycle/intimacy') },
  { id: 'ttc_exams', category: 'cycle', theme: 'health', icon: 'file-plus', scopes: ['ttc'], href: () => '/fertility/exams' },
  { id: 'ttc_understand', category: 'cycle', theme: 'cycle', icon: 'book', scopes: ['ttc'], href: () => '/fertility/understand' },
  { id: 'ttc_consult', category: 'cycle', theme: 'health', icon: 'user-plus', scopes: ['ttc'], href: () => '/fertility/consultation' },
  { id: 'ttc_reminders', category: 'cycle', theme: 'reminders', icon: 'clock', scopes: ['ttc'], href: () => '/fertility/reminders' },
  { id: 'pma_tracker', category: 'cycle', theme: 'cycle', icon: 'crosshair', scopes: ['ttc'], href: () => '/fertility/pma' },

  // ================================================================ 6. Grossesse et post-partum
  { id: 'ttc_start_pregnancy', category: 'pregnancy', theme: 'pregnancy', icon: 'heart', scopes: ME, href: () => '/pregnancy/start' },
  { id: 'preg_evolution', category: 'pregnancy', theme: 'pregnancy', icon: 'aperture', scopes: ['pregnancy'], href: () => '/pregnancy' },
  { id: 'preg_weight', category: 'pregnancy', theme: 'pregnancy', icon: 'trending-up', scopes: ['pregnancy'], href: () => '/pregnancy/weight' },
  { id: 'preg_feel', category: 'pregnancy', theme: 'pregnancy', icon: 'meh', scopes: ['pregnancy'], href: () => '/pregnancy/feel' },
  { id: 'preg_moves', category: 'pregnancy', theme: 'pregnancy', icon: 'radio', scopes: ['pregnancy'], href: () => '/pregnancy/moves' },
  { id: 'preg_calendar', category: 'pregnancy', theme: 'calendar', icon: 'map', scopes: ['pregnancy'], href: () => '/pregnancy/calendar' },
  { id: 'preg_names', category: 'pregnancy', theme: 'pregnancy', icon: 'tag', scopes: ['pregnancy', 'ttc'], href: () => '/names' },
  { id: 'preg_lists', category: 'pregnancy', theme: 'pregnancy', icon: 'shopping-bag', scopes: ['pregnancy'], href: () => '/lists' },
  // Post-partum de la mère : sommeil, humeur, récupération apparaissent dans le profil du bébé (et dans « Moi »)
  // tant qu'un post-partum est en cours.
  { id: 'pp_recovery', category: 'pregnancy', theme: 'mood', icon: 'battery-charging', scopes: ['postpartum', 'baby', 'none'], when: pp, href: () => '/postpartum' },
  { id: 'pp_checkin', category: 'pregnancy', theme: 'mood', icon: 'check', scopes: ['postpartum', 'baby', 'none'], when: pp, href: () => '/postpartum/checkin' },
  { id: 'pp_history', category: 'pregnancy', theme: 'mood', icon: 'git-commit', scopes: ['postpartum', 'baby', 'none'], when: pp, href: () => '/postpartum/history' },
  { id: 'pp_body', category: 'pregnancy', theme: 'mood', icon: 'move', scopes: ['postpartum', 'baby', 'none'], when: pp, href: () => '/postpartum/recovery' },
  { id: 'pp_mental', category: 'pregnancy', theme: 'mood', icon: 'cloud-rain', scopes: ['postpartum', 'baby', 'none'], when: pp, href: () => '/postpartum/understand' },
  { id: 'pp_support', category: 'pregnancy', theme: 'mood', icon: 'phone-call', scopes: ['postpartum', 'baby', 'none'], when: pp, href: () => '/postpartum/support' },
  { id: 'pp_partner', category: 'pregnancy', theme: 'mood', icon: 'share-2', scopes: ['postpartum', 'baby'], when: pp, href: () => '/postpartum/partner' },

  // ================================================================ 7. École, crèche et garde
  { id: 'kid_school', category: 'school', theme: 'growth', icon: 'type', scopes: KID, href: (c) => kid(c, '/school') },
  { id: 'kid_card', category: 'school', theme: 'health', icon: 'credit-card', scopes: KID, also: ['health'], href: (c) => kid(c, '/card') },
  { id: 'kid_routines', category: 'school', theme: 'tasks', icon: 'toggle-right', scopes: ['child', 'family'], href: () => '/family/kid-routines' },
  { id: 'custody', category: 'school', theme: 'calendar', icon: 'home', scopes: [...KID, 'family'], href: () => '/family/custody' },
  // Espace nounou (21/11/2026) : carnet de liaison, photos et messages de la garde ; ouvert sans abonnement (access.ts)
  { id: 'childcare', category: 'school', theme: 'growth', icon: 'trello', scopes: [...KID, 'family'], href: () => '/garde' },

  // ================================================================ 8. Couple et foyer
  { id: 'mental_load', category: 'couple', theme: 'relay', icon: 'pie-chart', scopes: TOGETHER, href: () => '/family/load' },
  // Qui porte quel domaine : deux vues de la même table (ancien outil `family_responsibilities`)
  { id: 'family_domains', category: 'couple', theme: 'tasks', icon: 'users', scopes: TOGETHER, href: () => '/family/domains', subs: [
    { id: 'responsibilities', legacy: 'family_responsibilities', icon: 'user-check', href: () => '/family/missions/responsibilities' },
  ] },
  { id: 'couple_week', category: 'couple', theme: 'relay', icon: 'message-square', scopes: TOGETHER, href: () => '/family/couple' },
  // « Se comprendre » (19/11/2026) : dire ce que l'on ressent à l'autre adulte du foyer, sans culpabilisation
  { id: 'couple_understand', category: 'couple', theme: 'relay', icon: 'mail', scopes: TOGETHER, href: () => '/family/understand' },
  { id: 'family_review', category: 'couple', theme: 'prevention', icon: 'percent', scopes: ['family'], href: () => '/family/review' },
  { id: 'family_metime', category: 'couple', theme: 'metime', icon: 'headphones', scopes: TOGETHER, href: () => '/family/me-time' },
  { id: 'offduty', category: 'couple', theme: 'metime', icon: 'power', scopes: TOGETHER, href: () => '/family/offduty' },
  { id: 'family_difficult', category: 'couple', theme: 'prevention', icon: 'cloud-off', scopes: TOGETHER, href: () => '/family/difficult' },
  { id: 'family_urgent', category: 'couple', theme: 'prevention', icon: 'zap', scopes: ['baby', 'child', 'family', 'postpartum'], href: () => '/family/urgent' },
  { id: 'family_sos', category: 'couple', theme: 'prevention', icon: 'pause', scopes: ['baby', 'child', 'family', 'postpartum'], urgent: true, href: () => '/family/sos' },
  { id: 'solo_parent', category: 'couple', theme: 'resources', icon: 'anchor', scopes: ALL, universal: true, href: () => '/family/solo' },

  // ================================================================ 9. Organisation familiale
  { id: 'family_calendar', category: 'family', theme: 'calendar', icon: 'table', scopes: TOGETHER, href: () => '/calendar' },
  { id: 'family_tasks', category: 'family', theme: 'tasks', icon: 'check-square', scopes: TOGETHER, href: () => '/family' },
  { id: 'family_missions', category: 'family', theme: 'tasks', icon: 'send', scopes: TOGETHER, href: () => '/family/missions', subs: [
    { id: 'done', legacy: 'family_missions_done', icon: 'check-circle', href: () => '/family/missions/done' },
  ] },
  // « Ma place dans la famille » (19/11/2026) : mes enfants, mes missions, l'organisation partagée, vus de ma place
  { id: 'family_my_place', category: 'family', theme: 'tasks', icon: 'navigation-2', scopes: TOGETHER, href: () => '/family/my-place' },
  { id: 'family_routines', category: 'family', theme: 'tasks', icon: 'list', scopes: TOGETHER, href: () => '/family/routines' },
  { id: 'family_history', category: 'family', theme: 'tasks', icon: 'rewind', scopes: ['family'], href: () => '/family/history' },
  { id: 'brain_dump', category: 'family', theme: 'tasks', icon: 'download', scopes: TOGETHER, href: () => '/family/brain-dump' },
  { id: 'family_prep', category: 'family', theme: 'calendar', icon: 'fast-forward', scopes: TOGETHER, href: () => '/family/prep' },
  { id: 'family_shopping', category: 'family', theme: 'tasks', icon: 'shopping-cart', scopes: TOGETHER, also: ['feeding'], href: () => '/meals/shopping' },
  { id: 'family_stocks', category: 'family', theme: 'tasks', icon: 'package', scopes: TOGETHER, also: ['care'], href: () => '/family/stocks' },
  { id: 'house_notebook', category: 'family', theme: 'tasks', icon: 'key', scopes: TOGETHER, href: () => '/family/notebook' },
  { id: 'family_papers', category: 'family', theme: 'resources', icon: 'paperclip', scopes: ALL, universal: true, href: () => '/family/papers' },
  { id: 'reminders', category: 'family', theme: 'reminders', icon: 'bell', scopes: ALL, universal: true, href: () => '/settings/reminders' },
  { id: 'nearby', category: 'family', theme: 'resources', icon: 'map-pin', scopes: ALL, universal: true, also: ['couple'], href: () => '/outings' },

  // ================================================================ La communauté : un ESPACE à part (pas un outil d'une catégorie)
  { id: 'community', category: 'community', theme: 'resources', icon: 'globe', scopes: ALL, universal: true, href: (c) => (SPACE_FOR_SCOPE[c.scope] ? `/(tabs)/community?space=${SPACE_FOR_SCOPE[c.scope]}` : '/(tabs)/community'), subs: [
    // Messagerie privée entre membres (19/11/2026) : un accès direct de l'espace Communauté, pas un outil d'une catégorie
    { id: 'messages', legacy: 'community_messages', icon: 'mail', href: () => '/community/messages' },
  ] },

  // ================================================================ Mon compte et réglages (PAS des outils)
  { id: 'settings', category: 'account', theme: 'reminders', icon: 'settings', scopes: ALL, universal: true, href: () => '/settings' },
  { id: 'notifications', category: 'account', theme: 'reminders', icon: 'inbox', scopes: ALL, universal: true, href: () => '/notifications' },
  { id: 'journeys', category: 'account', theme: 'reminders', icon: 'refresh-cw', scopes: ALL, universal: true, href: () => '/journeys' },
  { id: 'home_settings', category: 'account', theme: 'reminders', icon: 'layout', scopes: ALL, universal: true, href: () => '/settings/home' },
  // Compte (consigne de la propriétaire, 21/11/2026 ; App Store 5.1.1(v)) : supprimer le compte et se déconnecter se
  // trouvent aussi par la recherche (« supprimer compte », « déconnexion »)
  { id: 'account_delete', category: 'account', theme: 'reminders', icon: 'trash-2', scopes: ALL, universal: true, href: () => '/settings/account?delete=1' },
  { id: 'sign_out', category: 'account', theme: 'reminders', icon: 'log-out', scopes: ALL, universal: true, href: () => '/settings?signout=1' },
  // Ce que la famille voit de moi (rôle, partages, notifications) : un réglage du compte, pas un outil
  { id: 'my_info', category: 'account', theme: 'reminders', icon: 'smartphone', scopes: TOGETHER, universal: true, href: () => '/family/my-info' },
  { id: 'preg_edit', category: 'account', theme: 'pregnancy', icon: 'edit-2', scopes: ['pregnancy'], href: () => '/pregnancy/edit' },
  { id: 'preg_end', category: 'account', theme: 'pregnancy', icon: 'flag', scopes: ['pregnancy'], href: () => '/pregnancy/end' },
];

/** Tout ce que le centre d'outils sait ouvrir (hors « Mon compte et réglages ») : les outils ET l'espace Communauté. */
export const REAL_TOOLS: ToolDef[] = TOOLS.filter((d) => d.category !== 'account');
/** Les outils proprement dits : ceux qui sont rangés (et comptés) dans l'une des 9 catégories. */
export const CATEGORY_TOOLS: ToolDef[] = REAL_TOOLS.filter((d) => d.category !== 'community');

// ------------------------------------------------------------------ identifiants : outils, sous-accès, anciens noms
export const subRef = (toolId: string, subId: string) => `${toolId}.${subId}`;

const CANONICAL = Object.fromEntries(TOOLS.map((x) => [x.id, x])) as Record<string, ToolDef>;

// ------------------------------------------------------------------ les 200 de la liste (src/lib/journeys/homi200.ts)
/** Adresse d'une vue précise d'un outil (onglet, paramètre, saisie), selon le profil affiché ; null si l'outil est fermé ici. */
function viewHref(def: ToolDef, v: H200View | undefined, c: ScopeCtx): string | null {
  const base = def.href(c);
  if (!base || !v) return base;
  const child = c.childId ?? (c.scope === 'postpartum' ? c.babyId : null) ?? null;
  const join = (u: string, qs: string) => `${u}${u.includes('?') ? '&' : '?'}${qs}`;
  if (v.kidPath) return child ? v.kidPath.replace(':id', child) : base;
  if (v.path) return v.withChild && child ? join(v.path, `child=${child}`) : v.path;
  if (v.query) return join(base, Object.entries(v.query).map(([k, x]) => `${k}=${encodeURIComponent(x)}`).join('&'));
  return base;
}

/**
 * Fonctions d'outils exposées comme SOUS-ACCÈS NOMMÉS (`h200_<n>`) : nom de la liste de la propriétaire, une phrase,
 * pictogramme ; elles ouvrent l'outil parent sur la vue précise. Identifiant stable = `h200_<n>` (favoris, récents).
 */
export const TOOL_FNS: Record<string, ToolSubDef[]> = {};
const FN_BY_ID: Record<string, { def: ToolDef; sub: ToolSubDef }> = {};
for (const e of H200_VIEWS) {
  const def = CANONICAL[e.target!];
  if (!def) throw new Error(`HOMI_200 ${e.n} : outil inconnu ${e.target}`);
  const sub: ToolSubDef = { id: e.id, legacy: e.id, icon: e.icon ?? def.icon, category: e.category, scopes: e.scopes?.filter((s) => def.scopes.includes(s)), href: (c) => viewHref(def, e.view, c), fn: e.n };
  (TOOL_FNS[def.id] ??= []).push(sub);
  FN_BY_ID[e.id] = { def, sub };
}

/** Ancien identifiant → identifiant actuel (outil, ou sous-accès `outil.sous-accès`, ou sous-accès nommé `h200_<n>`). */
export const TOOL_ALIASES: Record<string, string> = Object.fromEntries([
  ...TOOLS.flatMap((d) => [
    ...(d.aliases ?? []).map((a) => [a, d.id] as [string, string]),
    ...(d.subs ?? []).map((s) => [s.legacy, subRef(d.id, s.id)] as [string, string]),
  ]),
  // un numéro de la liste qui EST un outil, un doublon, ou un outil partiel qui mène à un outil utilisable
  ...HOMI_200.flatMap((e) => {
    const root = H200_BY_ID[`h200_${h200Root(e.n)}`];
    if (root.kind === 'view') return root.id === e.id ? [] : [[e.id, root.id] as [string, string]];
    return root.target ? [[e.id, root.target] as [string, string]] : [];
  }),
]);

export interface ToolRef { def: ToolDef; sub?: ToolSubDef; /** Identifiant actuel et stable. */ id: string }

/** Résout un identifiant actuel OU ancien (outil fusionné, sous-accès) ; null si inconnu. */
export function resolveTool(id: string | null | undefined): ToolRef | null {
  if (!id) return null;
  const now = TOOL_ALIASES[id] ?? id;
  const direct = CANONICAL[now];
  if (direct) return { def: direct, id: now };
  const fn = FN_BY_ID[now];
  if (fn) return { def: fn.def, sub: fn.sub, id: now };
  const dot = now.indexOf('.');
  if (dot < 0) return null;
  const def = CANONICAL[now.slice(0, dot)];
  const sub = def?.subs?.find((s) => s.id === now.slice(dot + 1));
  return def && sub ? { def, sub, id: now } : null;
}

/** Identifiant actuel d'un outil (ou d'un sous-accès), ou null. */
export const canonicalToolId = (id: string | null | undefined) => resolveTool(id)?.id ?? null;

/**
 * Outil par identifiant. Les ANCIENS identifiants répondent aussi (l'outil qui les a absorbés) : un lien, un
 * raccourci d'onboarding ou une recommandation écrits avant la fusion continuent de fonctionner.
 */
export const TOOL_BY_ID: Record<string, ToolDef> = {
  ...CANONICAL,
  ...Object.fromEntries(Object.keys(TOOL_ALIASES).map((a) => [a, resolveTool(a)!.def] as [string, ToolDef])),
};

/** Clés de traduction d'un outil : nom, description d'une phrase, mots de recherche ; ancienne précision courte. */
export function toolLabelKey(id: string): TKey {
  const r = resolveTool(id);
  if (r?.sub?.fn) return `h2.${r.sub.fn}` as TKey;
  if (r?.sub) return `tool.${r.sub.legacy}` as TKey;
  return `th.${r?.id ?? id}` as TKey;
}
const fnOf = (id: string) => resolveTool(id)?.sub?.fn;
export const toolDescKey = (id: string) => (fnOf(id) ? `h2.${fnOf(id)}.d` : `th.${resolveTool(id)?.def.id ?? id}.d`) as TKey;
export const toolWordsKey = (id: string) => (fnOf(id) ? `h2.${fnOf(id)}.k` : `th.${resolveTool(id)?.def.id ?? id}.k`) as TKey;
/** « Problème résolu » de la fiche d'outil : la situation du parent, rédigée en une phrase (`th.<id>.problem`). */
export const toolProblemKey = (id: string) => `th.${resolveTool(id)?.def.id ?? id}.problem` as TKey;
/** Précision courte héritée (fragment) : encore utilisée pour les sous-accès et l'onboarding. */
export function toolSubKey(id: string): TKey {
  const r = resolveTool(id);
  if (r?.sub?.fn) return `h2.${r.sub.fn}.d` as TKey;
  return `tool.${r?.sub ? r.sub.legacy : id}.sub` as TKey;
}

/** Profils lisibles concernés par un outil, dans l'ordre d'affichage. */
export function toolProfiles(def: Pick<ToolDef, 'scopes'>): ToolProfile[] {
  const set = new Set(def.scopes.map(profileOfScope));
  return TOOL_PROFILES.filter((p) => set.has(p));
}

export interface ResolvedSub { id: string; legacy: string; icon: IconName; category: ToolCategory; href: string; /** Numéro de la liste des 200 (sous-accès nommé). */ fn?: number }
export interface ResolvedTool {
  id: string; category: ToolCategory; theme: ToolTheme; icon: IconName; href: string; universal: boolean; urgent: boolean;
  /** Catégories où l'outil est aussi proposé en raccourci (jamais sa catégorie principale). */
  also: ToolShelf[];
  subs: ResolvedSub[];
  /** Fonctions de l'outil exposées comme sous-accès nommés (`h200_<n>`), pour le profil affiché. */
  fns: ResolvedSub[];
}

function resolveSubs(d: ToolDef, c: ScopeCtx, list: ToolSubDef[] = d.subs ?? []): ResolvedSub[] {
  const out: ResolvedSub[] = [];
  for (const s of list) {
    if (!(s.scopes ?? d.scopes).includes(c.scope)) continue;
    const href = s.href(c);
    if (href) out.push({ id: s.fn ? s.id : subRef(d.id, s.id), legacy: s.legacy, icon: s.icon, category: s.category ?? d.category, href, ...(s.fn ? { fn: s.fn } : {}) });
  }
  return out;
}

/** Entrées autorisées pour le profil affiché (outils ET entrées de compte), avec leur adresse adaptée. */
export function toolsFor(c: ScopeCtx): ResolvedTool[] {
  const out: ResolvedTool[] = [];
  for (const d of TOOLS) {
    if (!d.scopes.includes(c.scope)) continue;
    if (d.when && !d.when(c)) continue;
    const href = d.href(c);
    if (!href) continue;
    out.push({ id: d.id, category: d.category, theme: d.theme, icon: d.icon, href, universal: !!d.universal, urgent: !!d.urgent, also: (d.also ?? []).filter((x) => x !== d.category), subs: resolveSubs(d, c), fns: resolveSubs(d, c, TOOL_FNS[d.id]) });
  }
  return out;
}

/**
 * Tous les identifiants autorisés pour ce profil : outils, sous-accès (`outil.sous-accès`) ET anciens identifiants
 * qui y mènent (outils fusionnés, anciens outils devenus sous-accès). Sert aux garde-fous des parcours : « la
 * préparation à l'accouchement est proposée pendant la grossesse », « aucun outil de bébé pendant la grossesse ».
 */
export function allowedToolIds(c: ScopeCtx): string[] {
  const out: string[] = [];
  for (const t of toolsFor(c)) {
    out.push(t.id, ...(CANONICAL[t.id].aliases ?? []));
    for (const s of t.subs) out.push(s.id, s.legacy);
    for (const s of t.fns) out.push(s.id);
  }
  // numéros de la liste des 200 (et doublons) qui désignent un outil ou une fonction autorisés ici
  const here = new Set(out);
  for (const [alias, to] of Object.entries(TOOL_ALIASES)) if (alias.startsWith('h200_') && here.has(to)) out.push(alias);
  return out;
}

/** Un outil (identifiant actuel ou ancien) est-il autorisé pour ce profil ? Un sous-accès l'est si son adresse existe. */
export function isToolAllowed(id: string, c: ScopeCtx): boolean {
  const r = resolveTool(id);
  if (!r) return false;
  const tool = toolsFor(c).find((x) => x.id === r.def.id);
  return !!tool && (!r.sub || tool.subs.some((s) => s.id === r.id) || tool.fns.some((s) => s.id === r.id));
}

/** Les plus utiles par profil (« Pour <profil> », 6 au plus) : choisis à la main, complétés par l'ordre du catalogue. */
export const FEATURED: Record<Scope, string[]> = {
  baby: ['baby_bottle', 'baby_breastfeed', 'kid_sleep', 'baby_diaper', 'kid_profile', 'family_nights'],
  child: ['kid_profile', 'kid_sleep', 'meals', 'kid_routines', 'kid_vaccines', 'appointments'],
  pregnancy: ['preg_evolution', 'preg_calendar', 'preg_feel', 'preg_weight', 'preg_eat', 'preg_lists'],
  postpartum: ['pp_recovery', 'pp_checkin', 'baby_breastfeed', 'baby_bottle_timer', 'sleep', 'pp_support'],
  ttc: ['ttc_cycle', 'cycle_calendar', 'ttc_tests', 'ttc_temperature', 'cycle_symptoms', 'appointments'],
  avoid: ['avoid_contraception', 'cycle_calendar', 'avoid_reminders', 'cycle_symptoms', 'avoid_methods', 'appointments'],
  cycle: ['cycle_home', 'cycle_calendar', 'cycle_symptoms', 'cycle_stats', 'mood', 'sleep'],
  none: ['mood', 'sleep', 'appointments', 'family_tasks', 'meals', 'ask'],
  family: ['family_calendar', 'family_missions', 'family_shopping', 'family_tasks', 'family_stocks', 'summary'],
};

/**
 * Garde d'accès des écrans propres à un parcours : un écran n'est autorisé que si l'une des portées
 * actives (tous mes profils suivis) le permet. Les écrans non listés restent libres.
 */
const SCREEN_RULES: { prefix: string; scopes: Scope[]; subOnly?: boolean }[] = [
  { prefix: '/pregnancy/start', scopes: SCOPES },
  { prefix: '/postpartum/partner', scopes: SCOPES },
  // Personnes de confiance : ouvertes depuis « Journée difficile » et « Je craque » (outils de toutes les portées)
  { prefix: '/postpartum/support', scopes: SCOPES },
  { prefix: '/cycle', scopes: ['avoid', 'ttc', 'cycle', 'none'] },
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
