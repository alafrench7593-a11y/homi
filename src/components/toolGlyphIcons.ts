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

/** Outil par outil : ce que l'on doit comprendre en voyant l'icône. */
const BY_ID: Record<string, string> = {
  // Scanner
  scan_product: 'barcode-scan',            // scanner un produit : code-barres
  scan_food: 'food-apple',                 // scanner un aliment : pomme
  scan_history: 'history',                 // historique et favoris : horloge qui revient
  scan_compare: 'scale-balance',           // comparer deux produits : balance à plateaux
  scan_avoid: 'cancel',                    // produits à éviter : interdit
  // Assistant et ressources
  ask: 'chat-question',                    // poser une question
  local_ai: 'robot',                       // assistant des articles (IA locale)
  nearby: 'map-marker-radius',             // sorties près de chez moi
  summary: 'file-document-multiple',       // résumés
  community: 'account-group',              // communauté
  library: 'bookshelf',                    // bibliothèque
  sources: 'link-variant',                 // sources et lectures
  // Humeur
  mood: 'emoticon-happy',                  // mon humeur
  kid_mood: 'emoticon-happy-outline',      // humeur et émotions de l'enfant
  pp_recovery: 'heart-plus',               // récupération après la naissance
  pp_checkin: 'notebook-heart',            // mon point du jour
  pp_body: 'yoga',                         // mon corps
  pp_mental: 'head-heart',                 // moral
  pp_support: 'hand-heart',                // soutien
  pp_partner: 'account-heart',             // partenaire
  // Sommeil
  sleep: 'sleep',                          // mon sommeil : Zz
  kid_sleep: 'moon-waning-crescent',       // sommeil de l'enfant : lune
  kid_sleep_rhythm: 'bed-clock',           // planning de sommeil : lit + horloge
  baby_night_help: 'weather-night',        // aide pour la nuit : lune et étoiles
  // Famille et quotidien
  family_summary: 'home-group',            // résumé familial du jour
  family_tasks: 'format-list-checks',      // tâches : liste cochée
  family_routines: 'repeat-variant',       // routines : répétition
  family_history: 'clipboard-text-clock',  // historique
  family_calendar: 'calendar-month',       // agenda familial
  family_nights: 'account-switch',         // relais de nuit : deux personnes qui se relaient
  family_metime: 'meditation',             // temps pour soi
  family_difficult: 'weather-windy',       // moments difficiles
  family_urgent: 'alarm-light',            // urgence familiale : gyrophare
  family_review: 'chart-box',              // bilan
  // Repas et alimentation
  meals: 'silverware-fork-knife',          // repas et recettes : couverts
  meal_rankings: 'trophy-variant',         // classements des recettes : trophée
  preg_eat: 'food-apple',                  // bien manger enceinte
  pp_feeding: 'mother-nurse',              // allaitement après la naissance
  baby_breastfeed: 'mother-nurse',         // allaitement
  pp_bottle: 'baby-bottle',                // biberon
  baby_bottle: 'baby-bottle',              // biberon
  baby_bottle_timer: 'timer-sand',         // minuteur du biberon : sablier
  baby_bottle_history: 'chart-areaspline', // historique des biberons : courbe
  baby_foods: 'bowl-mix',                  // diversification : bol
  // Santé
  appointments: 'stethoscope',             // rendez-vous et examens
  documents: 'folder-heart',               // documents de santé
  emergency: 'phone-alert',                // urgences : téléphone d'alerte
  kid_vaccines: 'needle',                  // vaccins : seringue
  kid_health: 'thermometer',               // santé de l'enfant : thermomètre
  kid_needs: 'puzzle-heart',              // besoins de l'enfant : pièce de puzzle avec un cœur
  kid_treatments: 'pill-multiple',         // traitements : comprimés
  ttc_exams: 'clipboard-pulse',            // examens
  ttc_consult: 'medical-bag',              // consulter
  // Enfant
  kid_profile: 'account-child',            // profil de l'enfant
  kid_growth: 'human-male-height',         // croissance : taille
  kid_grow: 'star-circle',                 // il grandit : étapes
  kid_milestones: 'trophy',                // grandes étapes : trophée
  kid_teeth: 'tooth',                      // dents
  kid_products: 'shopping-search',         // produits enfants : vérifier un achat
  // Couches et quotidien bébé
  baby_diaper: 'human-baby-changing-table',// couches : table à langer
  baby_daily: 'clipboard-list',            // journée de bébé : liste
  // Rappels et réglages
  reminders: 'bell-ring',                  // rappels
  avoid_reminders: 'bell-ring',
  ttc_reminders: 'bell-ring',
  notifications: 'bell-badge',             // notifications : cloche avec pastille
  home_settings: 'view-dashboard-edit',    // personnaliser l'accueil
  settings: 'cog',                         // réglages
  journeys: 'map-marker-path',             // modifier mon parcours : chemin
  // Cycle
  avoid_cycle: 'calendar-month',           // cycle et règles : calendrier
  cycle_home: 'water',                     // mon cycle : goutte
  cycle_calendar: 'calendar-multiselect',  // calendrier du cycle
  ttc_cycle: 'water',
  ttc_calendar: 'calendar-multiselect',
  avoid_contraception: 'pill',             // contraception : pilule
  avoid_methods: 'scale-balance',          // comparer les moyens : balance
  avoid_emergency: 'alert-decagram',       // contraception d'urgence : alerte
  avoid_fertile: 'weather-sunset-up',      // fenêtre fertile : lever de soleil
  cycle_symptoms: 'pulse',                 // symptômes
  avoid_consult: 'hospital-box',           // consulter
  ttc_periods: 'water-opacity',            // règles : goutte
  ttc_tests: 'test-tube',                  // tests : éprouvette
  ttc_mucus: 'magnify',                    // observation : loupe
  ttc_temperature: 'thermometer-lines',    // température
  ttc_intimacy: 'lock',                    // intimité : cadenas
  ttc_understand: 'book-education',        // comprendre
  ttc_articles: 'book-open-variant',       // articles
  cycle_journal: 'notebook-edit',          // journal
  cycle_stats: 'chart-bar',                // statistiques
  cycle_guides: 'book-information-variant',// guides
  ttc_start_pregnancy: 'human-pregnant',   // je suis enceinte
  // Grossesse
  preg_evolution: 'baby-face',             // évolution de bébé
  preg_weight: 'scale-bathroom',           // poids : pèse-personne
  preg_feel: 'spa',                        // comment je me sens
  preg_calendar: 'calendar-heart',         // calendrier de grossesse
  preg_birth_prep: 'baby-carriage',        // préparer la naissance : landau
  preg_articles: 'book-open-variant',
  preg_intimacy: 'heart-flash',            // intimité pendant la grossesse
  preg_names: 'calendar-star',             // prénoms : étoile
  preg_lists: 'format-list-checkbox',      // listes de grossesse
  preg_edit: 'calendar-edit',              // modifier ma grossesse
  preg_end: 'flag-checkered',              // fin de grossesse : drapeau d'arrivée
  // Guides thématiques et nouveaux outils (04/11/2026)
  guide_illnesses: 'thermometer-alert',    // maladies de l'enfance : thermomètre d'alerte
  guide_firstaid: 'medical-bag',           // urgences et premiers secours : trousse
  guide_hygiene: 'hand-wash',              // hygiène : mains lavées
  guide_sport: 'run',                      // sport : coureur
  guide_activities: 'palette',             // activités : palette
  guide_kidsleep: 'bed',                   // sommeil de l'enfant : lit
  guide_kidfood: 'food-variant',           // alimentation 1–10 ans : assiette
  guide_behaviour: 'emoticon-confused',    // émotions et comportement
  guide_school: 'school',                  // crèche, nounou, école
  guide_toddler: 'human-child',            // grandir de 1 à 3 ans
  guide_work: 'briefcase-variant',         // droits au travail : mallette
  guide_loss: 'heart-broken',              // après une perte
  guide_pma: 'test-tube',                  // parcours PMA : éprouvette
  guide_couple: 'account-multiple-plus',   // à deux
  guide_neonat: 'baby-face-outline',       // néonatologie
  consult_questions: 'comment-question',   // questions pour le rendez-vous
  preg_moves: 'motion',                    // mouvements de bébé
  contraception_journal: 'notebook-edit',  // journal de ma contraception
  kid_card: 'card-account-details',        // fiche de mon enfant
  kid_steps: 'clipboard-check',            // mes démarches
  family_sos: 'hand-heart',                // je craque
  cycle_kit: 'bag-personal',               // trousse règles : petit sac
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
  return (id ? BY_ID[id] : undefined) ?? BY_THEME[theme]?.[icon] ?? BY_ICON[icon] ?? null;
}
