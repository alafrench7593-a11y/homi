/**
 * Manifeste des pictogrammes d'OUTILS : identifiant stable du catalogue → nom de pictogramme `HomiIcon`.
 *
 *  - chaque outil du registre (src/lib/journeys/tools.ts), l'espace Communauté et les entrées de « Mon compte » ;
 *  - chaque sous-accès (`outil.sous-accès`) et chaque fonction nommée de la liste des 200 (`h200_<n>`) ;
 *  - les raccourcis de l'accueil (`quick.<clé>`) et les rangées de catégorie (`cat.<catégorie>`).
 *
 * Règles (garde-fou : src/__tests__/toolIcons.test.ts) : chaque entrée visible a un pictogramme ; aucun pictogramme
 * d'outil n'est orphelin ; deux outils DIFFÉRENTS montrés dans une même catégorie n'ont jamais le même pictogramme,
 * sauf partage voulu et listé dans `INTENTIONAL_SHARES`. Un outil et ses sous-accès peuvent partager le sien quand
 * c'est la même fonction (filtres de la bibliothèque, fiches des guides, vue d'un même écran).
 *
 * Un nom de pictogramme ne change jamais pour un identifiant donné : on ajoute, on ne renomme pas.
 */
import type { HomiIconName } from './paths';

/** Outils du registre, l'espace Communauté et « Mon compte ». */
export const TOOL_ICON: Record<string, HomiIconName> = {
  // 1. Alimentation et allaitement
  baby_breastfeed: 'nursing', baby_bottle: 'bottlePlus', baby_bottle_timer: 'hourglass', baby_bottle_history: 'areaChart',
  bottle_scoops: 'scoop', baby_foods: 'bowlSpoon', meals: 'plateCutlery', meal_menu: 'cloche', meal_pantry: 'fridge',
  meal_rankings: 'trophy', preg_eat: 'carrot', scan_food: 'appleScan',
  // 2. Sommeil et réveils
  kid_sleep: 'crib', kid_sleep_rhythm: 'sleepBlocks', sleep_help: 'nightLamp', baby_night_help: 'starNight', family_nights: 'relayMoon', sleep: 'pillowZ',
  // 3. Soins, quotidien et croissance
  baby_daily: 'clipboardList', baby_diaper: 'diaper', kid_teeth: 'tooth', scan_product: 'barcodeScan', scan_history: 'historyArrow',
  scan_compare: 'compareCards', kid_products: 'bagHeart', journal: 'timeline', kid_profile: 'kidCard', kid_grow: 'stairs',
  kid_mood: 'sunnyFace', kid_album: 'photos',
  // 4. Santé, rendez-vous et conseils
  appointments: 'stethoscope', consult_questions: 'bubbleQuestion', documents: 'folderCross', health_book: 'bookCross',
  kid_vaccines: 'syringe', kid_health: 'thermometer', kid_treatments: 'capsule', medications: 'pillBottle', kid_steps: 'clipboardCheck',
  summary: 'pagesStack', mood: 'smileFace', me_diary: 'bookLock', exhaustion_check: 'batteryLow', scan_avoid: 'scanBan',
  recall_alerts: 'octagonAlert', emergency: 'emergency', ask: 'bubbleSpark', local_ai: 'chip', library: 'shelf', guides: 'bookRibbon',
  videos: 'playScreen', sources: 'link',
  // 5. Cycle et fertilité
  cycle_home: 'ringDrop', cycle_calendar: 'calendarDot', cycle_symptoms: 'pulse', cycle_pain: 'bolt', cycle_discharge: 'drops',
  cycle_bleeding: 'dropAlert', cycle_journal: 'pagePen', cycle_stats: 'bars', cycle_advice: 'bulb', cycle_month: 'calendarLines',
  cycle_export: 'docArrow', cycle_guides: 'bookInfo', cycle_kit: 'pouch', avoid_contraception: 'shieldCheck', avoid_methods: 'balance',
  avoid_emergency: 'alertCircle', avoid_reminders: 'alarmClock', avoid_consult: 'medCross', contraception_journal: 'spiralNote',
  ttc_cycle: 'tulip', ttc_tests: 'testStrip', ttc_mucus: 'magnifierDrop', ttc_temperature: 'sunrise', ttc_intimacy: 'lockHeart',
  ttc_exams: 'clipboardPulse', ttc_understand: 'mortarboard', ttc_consult: 'medBag', ttc_reminders: 'calendarClock', pma_tracker: 'flask',
  // 6. Grossesse et post-partum
  ttc_start_pregnancy: 'heartPlus', preg_evolution: 'belly', preg_weight: 'scale', preg_feel: 'lotus', preg_moves: 'footprints',
  preg_calendar: 'calendarHeart', preg_names: 'tagHeart', preg_lists: 'suitcase', pp_recovery: 'bandage', pp_checkin: 'notebookHeart',
  pp_history: 'trendLine', pp_body: 'stretch', pp_mental: 'cloudRain', pp_support: 'handHeart', pp_partner: 'twoPeople',
  // 7. École, crèche et garde
  kid_school: 'backpack', kid_card: 'idCard', kid_routines: 'routineChart', custody: 'twoHouses', childcare: 'adultChild',
  // 8. Couple et foyer
  mental_load: 'pie', family_domains: 'personArrow', couple_week: 'cup', couple_understand: 'bubbleHeart', family_review: 'chartBox',
  family_metime: 'headphones', offduty: 'power', family_difficult: 'wind', family_urgent: 'siren', family_sos: 'heartPause', solo_parent: 'anchor',
  // 9. Organisation familiale
  family_calendar: 'calendarGrid', family_tasks: 'checklist', family_missions: 'plane', family_my_place: 'housePerson', family_routines: 'loop',
  family_history: 'listClock', brain_dump: 'trayDown', family_prep: 'calendarCheck', family_shopping: 'cart', family_stocks: 'box',
  house_notebook: 'key', family_papers: 'paperClip', reminders: 'bellRing', nearby: 'pin',
  // Communauté (espace à part)
  community: 'group',
  // Mon compte et réglages (pas des outils)
  settings: 'gear', notifications: 'notifications', journeys: 'signpost', home_settings: 'tools', account_delete: 'account', sign_out: 'account', my_info: 'account', preg_edit: 'pencil', preg_end: 'flag',
};

const GUIDE_TOPICS = ['illnesses', 'firstaid', 'neonat', 'kidfood', 'kidsleep', 'hygiene', 'activities', 'toddler', 'sport', 'behaviour', 'school', 'pma', 'work', 'loss', 'couple'];

/** Sous-accès (`outil.sous-accès`). Les filtres et fiches de lecture gardent le pictogramme de leur outil. */
export const SUB_ICON: Record<string, HomiIconName> = {
  'kid_profile.growth': 'ruler', 'kid_profile.milestones': 'flag', 'kid_treatments.needs': 'puzzle',
  'library.conception': 'shelf', 'library.pregnancy': 'shelf', 'library.birth': 'shelf', 'library.intimacy': 'shelf',
  ...Object.fromEntries(GUIDE_TOPICS.map((g) => [`guides.${g}`, 'bookRibbon' as HomiIconName])),
  'videos.tutos': 'playScreen', 'family_domains.responsibilities': 'personCheck', 'family_missions.done': 'doubleCheck', 'community.messages': 'envelope',
};

/**
 * Fonctions nommées de la liste des 200 (`h200_<n>`) dont le pictogramme N'EST PAS celui de leur outil : la vue a un
 * sens propre (pilule, caméra, album, messagerie…). Les autres reprennent le pictogramme de leur outil.
 */
export const VIEW_ICON: Record<string, HomiIconName> = {
  h200_9: 'capsule', h200_33: 'hourglass', h200_37: 'batteryLow', h200_41: 'bellRing', h200_46: 'cart', h200_59: 'bolt',
  h200_92: 'scale', h200_93: 'ruler', h200_95: 'trendLine', h200_105: 'bellRing',
  h200_142: 'compareCards', h200_143: 'pagesStack', h200_144: 'bubbleQuestion', h200_145: 'clipboardCheck', h200_146: 'chartBox',
  h200_147: 'chartBox', h200_148: 'calendarGrid', h200_149: 'timer', h200_150: 'calendarCheck', h200_152: 'key', h200_153: 'notebook',
  h200_154: 'bottlePlus', h200_155: 'crib', h200_156: 'timeline', h200_157: 'camera', h200_158: 'photos', h200_159: 'envelope',
  h200_193: 'bubbleQuestion', h200_194: 'magnifier',
  // outils construits le 20/11/2026 (anciens « absents » de la liste)
  h200_39: 'contractionTimer', h200_44: 'birthPlan', h200_48: 'dayList', h200_58: 'pelvicLift', h200_60: 'sprout',
  h200_73: 'milkJars', h200_74: 'milkJars', h200_76: 'milkQuestion', h200_77: 'milkQuestion', h200_79: 'formulaTin',
  h200_122: 'portionTray', h200_133: 'bookStar', h200_134: 'storyMoon', h200_172: 'bubbleCheck', h200_179: 'twoHearts',
  h200_186: 'wallet', h200_189: 'paw',
  // numéros partiels complétés puis branchés au catalogue (30/11/2026)
  h200_27: 'calendarFlask', h200_129: 'speechWords', h200_132: 'toyBlocks', h200_136: 'activityBall', h200_137: 'homework',
  h200_175: 'closeness', h200_177: 'coupleWeather', h200_199: 'bookSpark', h200_42: 'labCurve', h200_50: 'ultrasound',
  h200_51: 'calendarLeaf', h200_53: 'scarCheck', h200_72: 'pumpBottle', h200_75: 'splitDrop', h200_80: 'bottleRelay',
  h200_81: 'bubbleDrop', h200_83: 'hourGrid', h200_84: 'docArrow', h200_120: 'broccoli', h200_123: 'spoonRefuse',
  // HOMI Aura : aides thématiques (même assistante), traducteur émotionnel, découverte
  ...Object.fromEntries([29, 49, 64, 82, 110, 124, 140, 190, 197].map((n) => [`h200_${n}`, 'auraBubble' as HomiIconName])),
  h200_174: 'bubbleSwap', h200_200: 'compassSpark',
};

/** Raccourcis de l'accueil (src/features/home.tsx, `QUICK`) : le pictogramme de l'outil qu'ils ouvrent. */
export const QUICK_ICON: Record<string, HomiIconName> = {
  cyclecal: 'calendarDot', nighthelp: 'starNight', bottle: 'bottlePlus', breastfeed: 'nursing', diaper: 'diaper', sleep: 'crib',
  meal: 'plateCutlery', question: 'bubbleQuestion', mood: 'smileFace', weight: 'scale', period: 'care', test: 'testStrip', pill: 'capsule',
  mysleep: 'pillowZ', appointment: 'stethoscope', growth: 'ruler', treatment: 'capsule', checkin: 'notebookHeart', calendar: 'calendarGrid',
  symptom: 'pulse', observation: 'thermometer', scan: 'barcodeScan', tasks: 'checklist', agenda: 'calendarGrid', journal: 'timeline',
  relay: 'relayMoon', postpartum: 'bandage',
};

/**
 * Partages VOULUS entre deux outils différents d'une même catégorie (aucun aujourd'hui) : `[pictogramme, raison]`.
 * Tout autre doublon dans une catégorie fait échouer le garde-fou.
 */
export const INTENTIONAL_SHARES: Record<string, string> = {};
