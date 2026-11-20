/**
 * HOMI_200 — table de référence des 200 outils de la liste de la propriétaire (docs/200/liste_200.md, 18/11/2026),
 * numéro par numéro, établie à partir de la correspondance auditée (docs/200/correspondance_200.csv) et vérifiée sur
 * les écrans (onglet, filtre ou paramètre réellement lus par l'écran).
 *
 * Chaque numéro 1–200 a un identifiant STABLE `h200_<n>` et une nature :
 *  - `tool`    : le numéro EST un outil (ou un sous-accès) du registre `TOOLS` : `h200_<n>` est un ancien nom de cet
 *                outil (même entrée, même favori) ; le nom de la liste devient un mot de recherche de l'outil ;
 *  - `view`    : FONCTION d'un outil existant, exposée comme SOUS-ACCÈS NOMMÉ du catalogue (nom de la liste, une
 *                phrase, pictogramme) ; elle ouvre l'outil parent sur la vue précise (onglet, paramètre, saisie) ;
 *  - `dup`     : doublon de la liste (13 = 3, 16 = 1, 22 = 11, 35 = 13, 187 = 163) : même entrée que l'autre numéro ;
 *  - `partial` : l'outil existe en partie (`missing` dit ce qui manque, texte interne) : AUCUNE entrée propre dans
 *                l'interface (`isAvailable: false`) ; s'il correspond à un outil utilisable (`target`), son nom mène
 *                à cet outil (recherche, liens) — jamais de bouton mort ni d'écran « bientôt » ;
 *  - `absent`  : rien n'existe (`isAvailable: false`, invisible) tant que ce n'est pas construit.
 *
 * Données pures (aucun texte affiché ici : noms, phrases et mots de recherche sont `h2.<n>`, `h2.<n>.d`, `h2.<n>.k`
 * dans src/i18n/<langue>/homi200.ts). Le registre (`tools.ts`) en dérive les sous-accès et les anciens noms.
 */
import type { IconName } from '@/components/ui';
import type { Scope, ToolShelf } from './tools';

export type H200Kind = 'tool' | 'view' | 'dup' | 'partial' | 'absent';
/** Usage de l'IA : `none` = fonctionne entièrement sans IA (le cas de tout ce qui est faisable sans). */
export type AiMode = 'none' | 'optional' | 'central';
export type H200Group = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M';

/** Vue précise ouverte par un sous-accès (vérifiée sur l'écran). */
export interface H200View {
  /** Adresse fixe à la place de celle du parent (`?child=<id>` ajouté si un enfant est affiché et `withChild`). */
  path?: string;
  /** Adresse propre à l'enfant affiché (`:id` remplacé) ; sans enfant, l'adresse du parent. */
  kidPath?: string;
  /** Paramètres ajoutés à l'adresse du parent (onglet, filtre). */
  query?: Record<string, string>;
  withChild?: boolean;
}

export interface H200Entry {
  n: number;
  id: string;
  group: H200Group;
  kind: H200Kind;
  /** Outil (`id` ou `outil.sous-accès`) qui réalise ce numéro (tool, view) ou auquel il mène (partial). */
  target?: string;
  view?: H200View;
  icon?: IconName;
  /** Portées où le sous-accès existe (par défaut : celles de l'outil parent). */
  scopes?: Scope[];
  /** Catégorie d'affichage du sous-accès (par défaut : celle du parent). */
  category?: ToolShelf;
  /** Doublon : numéro de l'entrée identique. */
  same?: number;
  /** Ce qui manque (texte interne, jamais affiché). */
  missing?: string;
  ai: AiMode;
  /** Visible et utilisable dans l'interface (outil, sous-accès, ou doublon d'une entrée visible). */
  isAvailable: boolean;
}

const KID: Scope[] = ['baby', 'child'];
const GROUP_START: [number, H200Group][] = [[1, 'A'], [16, 'B'], [31, 'C'], [51, 'D'], [66, 'E'], [86, 'F'], [111, 'G'], [126, 'H'], [141, 'I'], [161, 'J'], [181, 'K'], [191, 'L'], [196, 'M']];
const groupOf = (n: number): H200Group => [...GROUP_START].reverse().find(([s]) => n >= s)![1];

type Row = Omit<H200Entry, 'id' | 'group' | 'isAvailable' | 'ai'> & { ai?: AiMode };
const T = (n: number, target: string): Row => ({ n, kind: 'tool', target });
const V = (n: number, target: string, icon: IconName, view?: H200View, extra?: Partial<Row>): Row => ({ n, kind: 'view', target, icon, view, ...extra });
const D = (n: number, same: number): Row => ({ n, kind: 'dup', same });
const P = (n: number, target: string | null, missing: string, ai?: AiMode): Row => ({ n, kind: 'partial', ...(target ? { target } : {}), missing, ai });
const A = (n: number, missing: string, ai?: AiMode): Row => ({ n, kind: 'absent', missing, ai });

const ROWS: Row[] = [
  // ---------------------------------------------------------------- A. Cycle et contraception (1–15)
  T(1, 'cycle_calendar'),
  V(2, 'cycle_home', 'sunrise'),
  T(3, 'cycle_symptoms'),
  T(4, 'cycle_pain'),
  T(5, 'mood'),
  T(6, 'cycle_discharge'),
  V(7, 'cycle_calendar', 'droplet'),
  T(8, 'avoid_reminders'),
  V(9, 'avoid_contraception', 'circle'),
  V(10, 'avoid_contraception', 'shield'),
  V(11, 'cycle_stats', 'rewind'),
  T(12, 'cycle_stats'),
  D(13, 3),
  T(14, 'avoid_consult'),
  T(15, 'cycle_export'),
  // ---------------------------------------------------------------- B. Fertilité (16–30)
  D(16, 1),
  V(17, 'cycle_calendar', 'target', undefined, { scopes: ['ttc', 'cycle'] }),
  T(18, 'ttc_tests'),
  T(19, 'ttc_temperature'),
  T(20, 'ttc_mucus'),
  T(21, 'ttc_intimacy'),
  D(22, 11),
  V(23, 'ttc_reminders', 'bell'),
  V(24, 'appointments', 'calendar', undefined, { scopes: ['ttc'], category: 'cycle' }),
  T(25, 'pma_tracker'),
  V(26, 'pma_tracker', 'clipboard'),
  P(27, 'appointments', 'Pas de calendrier d’examens : ttc_exams est un guide, les dates passent par les rendez-vous.'),
  T(28, 'ttc_consult'),
  P(29, 'ttc_understand', 'Guide statique ; aucune assistance personnalisée au parcours.', 'optional'),
  T(30, 'ttc_cycle'),
  // ---------------------------------------------------------------- C. Grossesse (31–50)
  T(31, 'preg_calendar'),
  T(32, 'preg_evolution'),
  V(33, 'preg_evolution', 'clock'),
  T(34, 'preg_weight'),
  D(35, 13),
  V(36, 'preg_feel', 'frown'),
  V(37, 'preg_feel', 'battery'),
  T(38, 'preg_moves'),
  V(39, 'preg_evolution', 'clock', { path: '/pregnancy/contractions' }),
  V(40, 'preg_calendar', 'aperture'),
  V(41, 'appointments', 'bell', { path: '/appointments?for=pregnancy' }, { scopes: ['pregnancy'], category: 'pregnancy' }),
  P(42, 'documents', 'Les analyses sont des documents ; aucun suivi des valeurs.', 'optional'),
  V(43, 'documents', 'lock', { path: '/documents?for=pregnancy' }, { scopes: ['pregnancy'], category: 'pregnancy' }),
  V(44, 'preg_lists', 'file-text', { path: '/pregnancy/birth-plan' }),
  V(45, 'preg_lists', 'briefcase'),
  V(46, 'preg_lists', 'shopping-bag'),
  T(47, 'preg_names'),
  V(48, 'preg_lists', 'check-square', { path: '/family/birth-partner' }),
  P(49, 'local_ai', 'L’assistant en ligne est coupé (config/features.ts) ; reste la recherche locale.', 'optional'),
  P(50, 'me_diary', 'Pas de souvenirs de grossesse (photos, échographies) dans le journal.'),
  // ---------------------------------------------------------------- D. Post-partum (51–65)
  P(51, 'pp_recovery', 'Pas de calendrier propre de récupération.'),
  V(52, 'pp_checkin', 'clipboard'),
  P(53, 'pp_checkin', 'Pas de champs dédiés cicatrice ou périnée dans le journal.'),
  T(54, 'sleep'),
  V(55, 'mood', 'smile', undefined, { scopes: ['postpartum', 'baby'], category: 'pregnancy' }),
  T(56, 'pp_checkin'),
  P(57, 'consult_questions', 'Pas de liste de questions propre au postnatal.'),
  V(58, 'pp_body', 'activity', { path: '/postpartum/pelvic' }, { scopes: ['postpartum', 'baby'] }),
  V(59, 'pp_checkin', 'activity'),
  V(60, 'pp_recovery', 'feather', { path: '/postpartum/healing' }, { scopes: ['postpartum', 'baby'] }),
  V(61, 'family_nights', 'moon', undefined, { scopes: ['postpartum', 'baby'], category: 'pregnancy' }),
  V(62, 'family_missions', 'users', undefined, { scopes: ['postpartum', 'baby', 'pregnancy'] }),
  T(63, 'me_diary'),
  P(64, 'pp_mental', 'Lecture et recherche dans les articles ; pas d’assistant dédié.', 'optional'),
  T(65, 'pp_recovery'),
  // ---------------------------------------------------------------- E. Allaitement et biberons (66–85)
  T(66, 'baby_breastfeed'),
  V(67, 'baby_breastfeed', 'columns'),
  V(68, 'baby_breastfeed', 'list'),
  T(69, 'baby_bottle'),
  V(70, 'baby_bottle_history', 'percent'),
  V(71, 'baby_breastfeed', 'droplet', { path: '/track/pumping', withChild: true }),
  P(72, 'baby_breastfeed', 'Volume tiré enregistré, mais pas de lots ni de contenants.'),
  V(73, 'baby_breastfeed', 'archive', { path: '/feeding/milk-stock' }),
  V(74, 'baby_breastfeed', 'bell', { path: '/feeding/milk-stock' }),
  P(75, 'baby_breastfeed', 'Pas de vue mixte tétées + biberons ni de ratio.'),
  V(76, 'baby_breastfeed', 'help-circle', { path: '/feeding/difficulties' }),
  V(77, 'baby_breastfeed', 'frown', { path: '/feeding/difficulties' }),
  V(78, 'kid_treatments', 'plus-square', undefined, { scopes: ['baby'], category: 'feeding' }),
  V(79, 'baby_bottle', 'package', { path: '/feeding/formula' }),
  P(80, 'family_nights', 'Relais de nuit oui, relais de biberons non.'),
  P(81, 'consult_questions', 'Parcours de questions générique ; pas de thème lactation.'),
  P(82, 'guides', 'Pas d’assistant dédié à l’allaitement.', 'optional'),
  P(83, 'baby_bottle_history', 'Pas d’analyse mixte tétées + biberons.', 'optional'),
  P(84, 'summary', 'Pas d’export du journal alimentaire (CSV/PDF).'),
  T(85, 'baby_daily'),
  // ---------------------------------------------------------------- F. Sommeil, croissance et santé (86–110)
  T(86, 'kid_sleep'),
  V(87, 'kid_sleep', 'sun'),
  V(88, 'kid_sleep', 'alert-circle'),
  T(89, 'kid_sleep_rhythm'),
  V(90, 'kid_sleep_rhythm', 'bar-chart-2', { query: { tab: 'trends' } }),
  T(91, 'kid_sleep_rhythm'),
  V(92, 'kid_profile', 'trending-up', { query: { tab: 'croissance' } }),
  V(93, 'kid_profile', 'maximize-2', { query: { tab: 'croissance' } }),
  V(94, 'kid_profile', 'circle', { query: { tab: 'croissance' } }),
  V(95, 'kid_profile', 'activity', { query: { tab: 'croissance' } }),
  T(96, 'kid_profile.growth'),
  T(97, 'kid_vaccines'),
  V(98, 'kid_vaccines', 'bell'),
  V(99, 'kid_vaccines', 'book'),
  V(100, 'appointments', 'calendar', undefined, { scopes: KID }),
  T(101, 'health_book'),
  V(102, 'kid_health', 'thermometer', { path: '/track/observation?obs=temperature', withChild: true }),
  T(103, 'kid_health'),
  T(104, 'kid_treatments'),
  V(105, 'medications', 'bell'),
  V(106, 'medications', 'list'),
  T(107, 'kid_teeth'),
  T(108, 'baby_diaper'),
  V(109, 'consult_questions', 'help-circle', undefined, { scopes: KID }),
  P(110, 'guides', 'Lecture ; pas d’assistant santé dédié.', 'optional'),
  // ---------------------------------------------------------------- G. Diversification (111–125)
  V(111, 'baby_foods', 'calendar'),
  T(112, 'baby_foods'),
  V(113, 'baby_foods', 'alert-triangle'),
  V(114, 'baby_foods', 'shield'),
  V(115, 'meals', 'clock', { path: '/track/meal', withChild: true }, { scopes: KID }),
  V(116, 'meal_menu', 'menu', undefined, { scopes: KID }),
  T(117, 'meals'),
  V(118, 'meals', 'star', undefined, { scopes: KID }),
  V(119, 'meals', 'layers', { path: '/track/meal', withChild: true }, { scopes: KID }),
  P(120, 'baby_foods', 'Pas de journal de diversification menée par l’enfant ; seule la texture « morceaux ».'),
  V(121, 'family_shopping', 'shopping-cart', undefined, { scopes: KID, category: 'feeding' }),
  V(122, 'baby_foods', 'grid', { path: '/meals/portions' }, { category: 'feeding' }),
  P(123, 'meals', 'Pas de champ « refus » structuré.'),
  P(124, 'baby_foods', 'Pas d’assistant dédié.', 'optional'),
  T(125, 'scan_food'),
  // ---------------------------------------------------------------- H. Développement et éducation (126–140)
  T(126, 'kid_grow'),
  T(127, 'journal'),
  V(128, 'kid_grow', 'move'),
  P(129, 'kid_grow', 'Pas de journal de langage (vocabulaire, phrases).'),
  T(130, 'guides.activities'),
  V(131, 'kid_grow', 'sun'),
  P(132, 'kid_grow', 'Pas de catalogue de jeux.'),
  V(133, 'kid_grow', 'book', { path: '/reading', withChild: true }),
  V(134, 'kid_grow', 'book-open', { path: '/reading/stories', withChild: true }),
  A(135, 'Aucun créateur d’histoires.', 'central'),
  P(136, 'family_calendar', 'Pas d’objet « activité » rattaché à l’enfant avec rappels.'),
  P(137, 'kid_routines', 'Pas de suivi des devoirs (matière, échéance).'),
  T(138, 'kid_routines'),
  V(139, 'kid_routines', 'check-square'),
  P(140, 'guides', 'Pas d’assistant d’idées éducatives.', 'optional'),
  // ---------------------------------------------------------------- I. Nounou et garde (141–160)
  // « Avant la garde » (lot garde, 20/11/2026) : écrans livrés sous /garde/prep/* et la catégorie « Garde » des documents
  V(141, 'childcare', 'compass', { path: '/garde/prep/modes' }, { category: 'school' }),
  V(142, 'childcare', 'columns', { path: '/garde/prep/candidats' }, { category: 'school' }),
  V(143, 'childcare', 'file-text', { path: '/garde/prep/fiche' }, { category: 'school' }),
  V(144, 'childcare', 'help-circle', { path: '/garde/prep/entretien' }, { category: 'school' }),
  V(145, 'childcare', 'check-square', { path: '/garde/prep/visite' }, { category: 'school' }),
  V(146, 'childcare', 'bar-chart-2', { path: '/garde/prep/budget' }, { category: 'school' }),
  V(147, 'childcare', 'percent', { path: '/garde/prep/budget' }, { category: 'school' }),
  V(148, 'childcare', 'calendar', { path: '/garde/prep/planning' }, { category: 'school' }),
  V(149, 'childcare', 'clock', { path: '/garde/prep/heures' }, { category: 'school' }),
  V(150, 'childcare', 'user-x', { path: '/garde/prep/absences' }, { category: 'school' }),
  V(151, 'documents', 'lock', { path: '/documents?cat=childcare' }, { category: 'school' }),
  V(152, 'childcare', 'key', { kidPath: '/garde/:id/acces' }),
  V(153, 'childcare', 'book-open', { kidPath: '/garde/:id/journee' }),
  V(154, 'childcare', 'coffee', { kidPath: '/garde/:id/journee' }),
  V(155, 'childcare', 'moon', { kidPath: '/garde/:id/journee' }),
  V(156, 'childcare', 'edit-3', { kidPath: '/garde/:id/journee' }),
  V(157, 'childcare', 'camera', { kidPath: '/garde/:id/photo' }),
  V(158, 'childcare', 'image', { kidPath: '/garde/:id/photos' }),
  V(159, 'childcare', 'message-square', { kidPath: '/garde/:id/messages' }),
  T(160, 'childcare'),
  // ---------------------------------------------------------------- J. Couple et coparentalité (161–180)
  T(161, 'family_my_place'),
  V(162, 'family_my_place', 'user-plus', { path: '/settings/family' }),
  T(163, 'family_calendar'),
  T(164, 'family_missions'),
  V(165, 'family_missions', 'send', { path: '/family/missions/new' }),
  T(166, 'family_missions.done'),
  T(167, 'family_domains'),
  T(168, 'family_nights'),
  T(169, 'family_metime'),
  T(170, 'family_shopping'),
  T(171, 'family_stocks'),
  V(172, 'couple_understand', 'check-circle', { path: '/family/calm' }),
  T(173, 'couple_understand'),
  P(174, 'couple_understand', 'Pas de reformulation automatique d’un message.', 'optional'),
  P(175, 'couple_understand', 'Pas d’outil dédié hors projet bébé et grossesse.'),
  V(176, 'couple_understand', 'share-2'),
  P(177, 'couple_week', 'Point hebdomadaire oui ; pas de baromètre (jauge).'),
  P(178, 'couple_week', 'Pas de planificateur de moments à deux.'),
  V(179, 'couple_week', 'heart', { path: '/family/moments' }),
  V(180, 'couple_understand', 'message-circle'),
  // ---------------------------------------------------------------- K. Maison (181–190)
  T(181, 'family_tasks'),
  T(182, 'family_routines'),
  V(183, 'family_stocks', 'archive'),
  V(184, 'family_stocks', 'alert-triangle'),
  T(185, 'meal_menu'),
  V(186, 'mental_load', 'dollar-sign', { path: '/family/expenses' }),
  D(187, 163),
  T(188, 'family_papers'),
  V(189, 'house_notebook', 'smile', { path: '/family/pets' }),
  P(190, 'brain_dump', 'Pas d’assistant de planification.', 'optional'),
  // ---------------------------------------------------------------- L. Communauté (191–195)
  T(191, 'community'),
  V(192, 'community', 'users'),
  V(193, 'community', 'eye-off', { path: '/community/new' }),
  V(194, 'community', 'search'),
  T(195, 'community'),
  // ---------------------------------------------------------------- M. Assistant et recherche (196–200)
  P(196, null, 'Recherche par mots-clés, synonymes et intentions (locale) ; pas de compréhension libre.', 'optional'),
  P(197, 'local_ai', 'Assistant en ligne éteint ; version locale sans conversation.', 'central'),
  T(198, 'library'),
  P(199, 'library', 'Recommandations d’outils par le moteur déterministe ; pas de recommandation d’articles par profil fin.'),
  P(200, null, 'Visite guidée existante ; pas d’assistant de découverte contextuel.', 'optional'),
];

const BY_N = new Map(ROWS.map((r) => [r.n, r]));
/** Numéro final d'un doublon (suit la chaîne : 35 → 13 → 3). */
export function h200Root(n: number): number {
  let r = BY_N.get(n);
  const seen = new Set<number>();
  while (r && r.kind === 'dup' && r.same && !seen.has(r.n)) { seen.add(r.n); r = BY_N.get(r.same); }
  return r?.n ?? n;
}

export const HOMI_200: H200Entry[] = ROWS.map((r) => {
  const root = BY_N.get(h200Root(r.n))!;
  const isAvailable = root.kind === 'tool' || root.kind === 'view';
  return { ...r, id: `h200_${r.n}`, group: groupOf(r.n), ai: r.ai ?? 'none', isAvailable };
});
export const H200_BY_ID: Record<string, H200Entry> = Object.fromEntries(HOMI_200.map((e) => [e.id, e]));
export const H200_BY_N: Record<number, H200Entry> = Object.fromEntries(HOMI_200.map((e) => [e.n, e]));
export const isH200Id = (id: string) => /^h200_\d{1,3}$/.test(id) && id in H200_BY_ID;

/** Sous-accès nommés (fonctions d'outils) : les seules entrées NOUVELLES du catalogue. */
export const H200_VIEWS: H200Entry[] = HOMI_200.filter((e) => e.kind === 'view');
