/**
 * Dessin de chaque outil (demande du 04/11/2026) : un symbole plein et parlant, choisi outil par outil, pour que
 * l'icône seule dise à quoi sert l'outil — un biberon pour les biberons, une dent pour les dents, une seringue pour
 * les vaccins, une femme enceinte pour la grossesse, une goutte pour les règles, une balance pour le poids…
 *
 * Les symboles viennent de Material Community Icons (déjà dans l'appli via @expo/vector-icons, licence MIT) :
 * aucune image téléchargée, aucune dépendance ajoutée.
 *  1. BY_ID : le symbole propre à l'outil (identifiant de src/lib/journeys/tools.ts) ;
 *  2. BY_THEME puis BY_ICON : repli pour les glyphes sans identifiant (univers de l'intro, raccourcis de l'accueil) ;
 *  3. sinon l'icône au trait d'origine.
 */
import type { IconName } from '@/components/ui';
import type { ToolTheme } from '@/lib/domain/toolCatalog';
import { TOOL_ALIASES } from '@/lib/journeys/tools';

/**
 * Outil par outil : ce que l'on doit comprendre en voyant l'icône. UN symbole par outil du registre : aucun symbole
 * n'est partagé par deux outils (garde-fou : src/__tests__/toolHub.test.ts). Les sous-accès (`outil.sous-accès`)
 * gardent le symbole de l'ancien outil dont ils viennent.
 */
export const TOOL_GLYPHS: Record<string, string> = {
  // 1. Alimentation et allaitement
  baby_breastfeed: 'mother-nurse',          // allaitement
  baby_bottle: 'baby-bottle',               // noter un biberon
  baby_bottle_timer: 'timer-sand',          // journée des biberons : sablier jusqu'au prochain
  baby_bottle_history: 'chart-areaspline',  // historique des biberons : courbe
  bottle_scoops: 'counter',                 // compteur de mesurettes
  baby_diaper: 'human-baby-changing-table', // couches : table à langer
  baby_foods: 'bowl-mix',                   // diversification : bol
  meals: 'silverware-fork-knife',           // repas et recettes : couverts
  meal_menu: 'room-service',                // menu de la semaine : cloche de service
  meal_pantry: 'fridge',                    // cuisiner avec ce que j'ai : réfrigérateur
  meal_rankings: 'trophy-variant',          // classement des recettes : trophée
  preg_eat: 'carrot',                       // bien manger enceinte
  scan_food: 'food-apple',                  // scanner un aliment : pomme
  // 2. Sommeil et réveils
  kid_sleep: 'moon-waning-crescent',        // sommeil de l'enfant : lune
  kid_sleep_rhythm: 'bed-clock',            // planning de sommeil : lit + horloge
  sleep_help: 'lightbulb-night',            // aide au sommeil : veilleuse
  baby_night_help: 'weather-night',         // bilan de la nuit : lune et étoiles
  family_nights: 'account-switch',          // relais de nuit : deux personnes qui se relaient
  sleep: 'sleep',                           // mon sommeil : Zz
  // 3. Croissance et développement
  kid_profile: 'account-child',             // fiche de l'enfant
  'kid_profile.growth': 'human-male-height',// croissance : taille
  'kid_profile.milestones': 'trophy',       // journal : grandes étapes
  kid_grow: 'stairs-up',                    // étapes du développement : marches
  kid_teeth: 'tooth',                       // dents
  kid_mood: 'emoticon-happy-outline',       // humeur et émotions de l'enfant
  kid_album: 'image-multiple',              // album photo
  baby_daily: 'clipboard-list',             // suivi de la journée : liste
  journal: 'timeline-text',                 // journal complet : chronologie
  // 4. Santé et rendez-vous
  appointments: 'stethoscope',              // rendez-vous et examens
  consult_questions: 'comment-question',    // questions pour le rendez-vous
  documents: 'folder-heart',                // documents de santé
  health_book: 'book-heart',                // carnet de santé
  kid_vaccines: 'needle',                   // vaccins : seringue
  kid_health: 'thermometer',                // suivi de santé : thermomètre
  kid_treatments: 'pill',                   // traitements de l'enfant
  'kid_treatments.needs': 'puzzle-heart',   // mon enfant a un besoin particulier
  medications: 'pill-multiple',             // médicaments : comprimés
  kid_steps: 'clipboard-check',             // démarches de l'enfant
  summary: 'file-document-multiple',        // résumés
  mood: 'emoticon-happy',                   // mon humeur
  me_diary: 'book-lock',                    // mon journal intime : carnet fermé
  exhaustion_check: 'battery-low',          // point sur ma fatigue
  emergency: 'phone-alert',                 // urgences : téléphone d'alerte
  ask: 'chat-question',                     // assistant : poser une question
  local_ai: 'robot',                        // assistant hors ligne
  library: 'bookshelf',                     // bibliothèque
  'library.conception': 'book-open-variant',
  'library.pregnancy': 'book-open-variant',
  'library.birth': 'baby-carriage',
  'library.intimacy': 'heart-flash',
  guides: 'book-open-page-variant',         // guides pratiques
  'guides.illnesses': 'thermometer-alert',
  'guides.firstaid': 'medical-bag',
  'guides.hygiene': 'hand-wash',
  'guides.sport': 'run',
  'guides.activities': 'palette',
  'guides.kidsleep': 'bed',
  'guides.kidfood': 'food-variant',
  'guides.behaviour': 'emoticon-confused',
  'guides.school': 'school',
  'guides.toddler': 'human-child',
  'guides.work': 'briefcase-variant',
  'guides.loss': 'heart-broken',
  'guides.pma': 'test-tube',
  'guides.couple': 'account-multiple-plus',
  'guides.neonat': 'baby-face-outline',
  videos: 'play-box-multiple',              // vidéos et tutos
  'videos.tutos': 'human-male-board',
  sources: 'link-variant',                  // sources et références
  // 5. Cycle et fertilité
  cycle_home: 'water',                      // mon cycle : goutte
  cycle_calendar: 'calendar-multiselect',   // calendrier du cycle
  cycle_symptoms: 'pulse',                  // symptômes du cycle
  cycle_pain: 'lightning-bolt-circle',      // douleurs
  cycle_discharge: 'water-opacity',         // pertes vaginales
  cycle_bleeding: 'water-alert',            // saignements inhabituels
  cycle_journal: 'notebook-edit',           // journal du cycle
  cycle_stats: 'chart-bar',                 // statistiques du cycle
  cycle_advice: 'lightbulb-on-outline',     // mes conseils du cycle
  cycle_month: 'calendar-text-outline',     // résumé du mois
  cycle_export: 'file-pdf-box',             // export PDF du suivi
  cycle_guides: 'book-information-variant', // guides du cycle
  cycle_kit: 'bag-personal',                // trousse de règles : petit sac
  avoid_contraception: 'shield-check',      // ma contraception : protection
  avoid_methods: 'scale-balance',           // comparer les contraceptions : balance
  avoid_emergency: 'alert-decagram',        // contraception d'urgence : alerte
  avoid_reminders: 'alarm',                 // rappels de contraception : réveil
  avoid_consult: 'hospital-box',            // préparer ma consultation de contraception
  contraception_journal: 'text-box-edit',   // journal de ma contraception
  ttc_cycle: 'flower-tulip',                // cycle et période fertile
  ttc_tests: 'test-tube',                   // tests d'ovulation et de grossesse : éprouvette
  ttc_mucus: 'magnify',                     // glaire cervicale : observation
  ttc_temperature: 'thermometer-lines',     // température au réveil
  ttc_intimacy: 'lock',                     // rapports : privé
  ttc_exams: 'clipboard-pulse',             // examens de fertilité
  ttc_understand: 'book-education',         // comprendre mon cycle
  ttc_consult: 'medical-bag',               // préparer ma consultation de fertilité
  ttc_reminders: 'calendar-clock',          // rappels du projet bébé
  pma_tracker: 'iv-bag',                    // suivi de PMA : traitements
  // 6. Grossesse et post-partum
  ttc_start_pregnancy: 'human-pregnant',    // démarrer ma grossesse
  preg_evolution: 'baby-face',              // ma grossesse semaine par semaine
  preg_weight: 'scale-bathroom',            // mon poids : pèse-personne
  preg_feel: 'spa',                         // mes symptômes de grossesse
  preg_moves: 'motion',                     // mouvements de bébé
  preg_calendar: 'calendar-heart',          // calendrier de grossesse
  preg_names: 'tag-heart',                  // idées de prénoms : étiquette
  preg_lists: 'bag-suitcase',               // listes de préparation : valise
  pp_recovery: 'heart-plus',                // ma récupération après la naissance
  pp_checkin: 'notebook-heart',             // mon point du jour
  pp_history: 'chart-timeline-variant-shimmer', // mon évolution sur deux semaines
  pp_body: 'yoga',                          // cicatrisation et rééducation
  pp_mental: 'head-heart',                  // baby blues et dépression du post-partum
  pp_support: 'hand-heart',                 // trouver de l'aide
  pp_partner: 'account-heart',              // espace du co-parent
  // 7. École, crèche et garde
  kid_school: 'town-hall',                  // école ou mode de garde : établissement
  kid_card: 'card-account-details',         // fiche à transmettre
  kid_routines: 'gesture-tap-button',       // routines en images
  custody: 'home-switch',                   // garde alternée : deux maisons
  // 8. Couple et foyer
  mental_load: 'scale-unbalanced',          // répartition de la charge mentale
  family_domains: 'account-arrow-right',    // confier un domaine
  'family_domains.responsibilities': 'account-check',
  couple_week: 'coffee',                    // point de couple
  family_review: 'chart-box',               // bilan de la semaine
  family_metime: 'meditation',              // temps pour soi
  offduty: 'power-sleep',                   // je décroche
  family_difficult: 'weather-windy',        // journée difficile
  family_urgent: 'alarm-light',             // mode urgence du foyer : gyrophare
  family_sos: 'lifebuoy',                   // je craque : bouée
  solo_parent: 'human-female-girl',         // parent solo
  community: 'account-group',               // communauté
  // 9. Organisation familiale
  family_calendar: 'calendar-month',        // agenda familial
  family_tasks: 'format-list-checks',       // tâches du foyer : liste cochée
  family_missions: 'send',                  // missions familiales : demande envoyée
  family_routines: 'repeat-variant',        // routines du foyer : répétition
  family_history: 'clipboard-text-clock',   // historique des tâches
  brain_dump: 'head-lightbulb',             // vider ma tête
  family_prep: 'calendar-check',            // échéances à préparer
  family_shopping: 'cart',                  // liste de courses
  family_stocks: 'package-variant-closed',  // stocks du foyer
  house_notebook: 'notebook',               // carnet de la maison
  family_papers: 'folder-account',          // papiers de la famille
  reminders: 'bell-ring',                   // rappels
  nearby: 'map-marker-radius',              // sorties en famille
  scan_product: 'barcode-scan',             // scanner un produit : code-barres
  scan_compare: 'compare-horizontal',       // comparer deux produits
  scan_history: 'history',                  // produits scannés
  scan_avoid: 'cancel',                     // produits à éviter : interdit
  recall_alerts: 'alert-octagram',          // alertes de rappel de produits
  kid_products: 'shopping-search',          // guide des produits pour enfants
  // Mon compte et réglages (pas des outils)
  settings: 'cog',
  notifications: 'bell-badge',
  journeys: 'map-marker-path',
  home_settings: 'view-dashboard-edit',
  preg_edit: 'calendar-edit',
  preg_end: 'flag-checkered',
  // Catégories du centre d'outils
  'cat.feeding': 'baby-bottle', 'cat.sleep': 'moon-waning-crescent', 'cat.care': 'hand-wash-outline', 'cat.health': 'stethoscope', 'cat.cycle': 'water',
  'cat.pregnancy': 'human-pregnant', 'cat.school': 'school', 'cat.couple': 'account-heart', 'cat.family': 'calendar-month', 'cat.account': 'cog',
};

/** Repli par catégorie puis icône d'origine (glyphes sans identifiant d'outil). */
const BY_THEME: Partial<Record<ToolTheme | 'urgent', Partial<Record<IconName, string>>>> = {
  feeding: { coffee: 'baby-bottle', droplet: 'mother-nurse', feather: 'bowl-mix', award: 'trophy-variant', clock: 'timer-sand', 'bar-chart-2': 'chart-areaspline' },
  sleep: { cloud: 'weather-night', moon: 'moon-waning-crescent', star: 'weather-night', 'trending-up': 'bed-clock' },
  pregnancy: { heart: 'human-pregnant', moon: 'baby-face', feather: 'spa', star: 'calendar-star', 'book-open': 'baby-carriage', 'trending-up': 'scale-bathroom' },
  cycle: { droplet: 'water', calendar: 'calendar-month', shield: 'pill', sunrise: 'weather-sunset-up', activity: 'pulse', grid: 'calendar-multiselect' },
  health: { calendar: 'stethoscope', shield: 'needle', 'life-buoy': 'phone-alert', lock: 'lock', thermometer: 'thermometer' },
  growth: { 'trending-up': 'human-male-height', smile: 'account-child', star: 'star-circle', award: 'trophy' },
  teeth: { circle: 'tooth' },
  diapers: { wind: 'human-baby-changing-table', activity: 'clipboard-list' },
  tasks: { 'check-square': 'format-list-checks', home: 'home-group', calendar: 'calendar-month' },
  calendar: { calendar: 'calendar-month' },
  relay: { moon: 'account-switch' },
  metime: { sun: 'meditation' },
  mood: { smile: 'emoticon-happy', sun: 'emoticon-happy-outline', heart: 'heart-plus' },
  scanner: { maximize: 'barcode-scan', search: 'food-apple' },
  resources: { 'message-circle': 'chat-question', users: 'account-group', 'book-open': 'bookshelf', 'map-pin': 'map-marker-radius' },
  reminders: { bell: 'bell-ring', settings: 'cog' },
  prevention: { zap: 'alarm-light', wind: 'weather-windy' },
  urgent: { 'life-buoy': 'phone-alert', zap: 'alarm-light' },
};

const BY_ICON: Partial<Record<IconName, string>> = {
  calendar: 'calendar-month', coffee: 'baby-bottle', 'trending-up': 'chart-line', star: 'star-circle', moon: 'moon-waning-crescent',
  heart: 'heart', droplet: 'water', clock: 'history', clipboard: 'clipboard-list', 'book-open': 'book-open-variant', book: 'book-education',
  bell: 'bell-ring', 'bar-chart-2': 'chart-bar', users: 'account-group', thermometer: 'thermometer', sun: 'emoticon-happy-outline',
  smile: 'emoticon-happy', shield: 'shield-check', search: 'magnify', list: 'format-list-checks', 'life-buoy': 'phone-alert',
  'file-text': 'file-document-multiple', 'edit-3': 'notebook-edit', 'check-square': 'format-list-checks', award: 'trophy', activity: 'pulse',
  zap: 'alarm-light', lock: 'lock', settings: 'cog', 'message-circle': 'chat-question', 'map-pin': 'map-marker-radius', home: 'home-group',
  folder: 'folder-heart', flag: 'flag-checkered', compass: 'compass-rose', eye: 'eye', camera: 'camera', image: 'image-multiple',
  'alert-circle': 'alert-decagram', 'check-circle': 'checkbox-marked-circle-outline', 'shopping-bag': 'shopping-search', grid: 'calendar-multiselect',
};

/** Nom du symbole plein (Material Community Icons) pour un outil, ou null pour garder l'icône au trait. */
export function toolGlyphIcon(theme: ToolTheme | 'urgent', icon: IconName, id?: string): string | null {
  return (id ? TOOL_GLYPHS[id] ?? TOOL_GLYPHS[TOOL_ALIASES[id]] : undefined) ?? BY_THEME[theme]?.[icon] ?? BY_ICON[icon] ?? null;
}
