/**
 * Anciennes clés de favoris et de récents (avant le 17/11/2026) : `thème:adresse`, l'adresse étant celle de l'outil
 * sans identifiant d'enfant. Cette clé cassait dès que le thème ou la route d'un outil changeait, et un même outil
 * en avait plusieurs (« Repas » : une par profil). Les favoris portent désormais l'identifiant stable de l'outil ;
 * cette table (figée, relevée sur le catalogue d'avant la refonte pour tous les profils) sert UNIQUEMENT à migrer
 * les favoris déjà enregistrés. Les identifiants de droite sont ceux de l'époque : `canonicalToolId` les résout
 * ensuite vers l'outil actuel (outils fusionnés, sous-accès).
 */

/** Adresse d'une ancienne clé, réduite à ce qui distinguait un outil (identifiants et profil retirés). */
export function legacyPath(key: string): string {
  const i = key.indexOf(':');
  const href = i < 0 ? key : key.slice(i + 1);
  const [p0, qs = ''] = href.split('?');
  const p = (p0.replace('/(tabs)', '') || '/')
    .replace(/^\/child\/[^/]+/, '/child/:id')
    .replace(/^\/bottle\/(?!(?:scoops|history)$)[^/]+$/, '/bottle/:id')
    .replace(/^\/sleep\/(?!(?:help|difficult|tonight)(?:\/|$))[^/]+$/, '/sleep/:id');
  const kept: string[] = [];
  for (const pair of qs.split('&')) {
    const [k, v] = pair.split('=');
    if (v && ['tab', 'q', 'cat', 'journey', 'family'].includes(k)) kept.push(`${k}=${v}`);
  }
  return kept.length ? `${p}?${kept.join('&')}` : p;
}

export const LEGACY_PATHS: Record<string, string> = {
  '/meals': 'meals',
  '/me/sleep': 'sleep',
  '/appointments': 'appointments',
  '/documents': 'documents',
  '/emergency': 'emergency',
  '/consult/questions': 'consult_questions',
  '/me/mood': 'mood',
  '/guide/loss': 'guide_loss',
  '/family/exhausted': 'exhaustion_check',
  '/pregnancy/start': 'ttc_start_pregnancy',
  '/cycle': 'cycle_home',
  '/contraception': 'avoid_contraception',
  '/contraception/methods': 'avoid_methods',
  '/contraception/emergency': 'avoid_emergency',
  '/cycle/calendar': 'cycle_calendar',
  '/cycle/symptoms': 'cycle_symptoms',
  '/contraception/consultation': 'avoid_consult',
  '/cycle/stats': 'cycle_stats',
  '/contraception/journal': 'contraception_journal',
  '/scanner/product': 'scan_product',
  '/scanner/food': 'scan_food',
  '/scanner/history': 'scan_history',
  '/scanner/compare': 'scan_compare',
  '/scanner/avoid': 'scan_avoid',
  '/scanner/recalls': 'recall_alerts',
  '/calendar': 'family_calendar',
  '/family/prep': 'family_prep',
  '/family': 'family_tasks',
  '/family/routines': 'family_routines',
  '/family/brain-dump': 'brain_dump',
  '/family/focus': 'focus_day',
  '/family/domains': 'family_domains',
  '/family/missions': 'family_missions',
  '/family/missions/responsibilities': 'family_responsibilities',
  '/meals/shopping': 'family_shopping',
  '/family/stocks': 'family_stocks',
  '/family/notebook': 'house_notebook',
  '/guide/couple': 'guide_couple',
  '/family/load': 'mental_load',
  '/family/couple': 'couple_week',
  '/family/me-time': 'family_metime',
  '/family/offduty': 'offduty',
  '/family/difficult': 'family_difficult',
  '/settings/reminders': 'reminders',
  '/notifications': 'notifications',
  '/settings/home': 'home_settings',
  '/settings': 'settings',
  '/journeys': 'journeys',
  '/contraception/reminders': 'avoid_reminders',
  '/cycle/kit': 'cycle_kit',
  '/ask': 'ask',
  '/assistant/local': 'local_ai',
  '/outings': 'nearby',
  '/community': 'community',
  '/library': 'library',
  '/sources': 'sources',
  '/cycle/guides': 'cycle_guides',
  '/tutos': 'video_tutos',
  '/videos': 'official_videos',
  '/family/solo': 'solo_parent',
  '/family/papers': 'family_papers',
  '/fertility/exams': 'ttc_exams',
  '/fertility/consultation': 'ttc_consult',
  '/names': 'preg_names',
  '/fertility': 'ttc_cycle',
  '/fertility/log': 'ttc_tests',
  '/fertility/mucus': 'ttc_mucus',
  '/fertility/body': 'ttc_temperature',
  '/fertility/intimacy': 'ttc_intimacy',
  '/fertility/understand': 'ttc_understand',
  '/guide/pma': 'guide_pma',
  '/fertility/pma': 'pma_tracker',
  '/fertility/reminders': 'ttc_reminders',
  '/library?q=conception': 'ttc_articles',
  '/guide/work': 'guide_work',
  '/cycle/journal': 'cycle_journal',
  '/guide/firstaid': 'guide_firstaid',
  '/products': 'kid_products',
  '/postpartum': 'pp_recovery',
  '/postpartum/checkin': 'pp_checkin',
  '/postpartum/recovery': 'pp_body',
  '/postpartum/understand': 'pp_mental',
  '/postpartum/support': 'pp_support',
  '/pregnancy/eat': 'preg_eat',
  '/pregnancy': 'preg_evolution',
  '/pregnancy/weight': 'preg_weight',
  '/pregnancy/feel': 'preg_feel',
  '/library?q=accouchement': 'preg_birth_prep',
  '/lists': 'preg_lists',
  '/pregnancy/edit': 'preg_edit',
  '/pregnancy/end': 'preg_end',
  '/pregnancy/moves': 'preg_moves',
  '/pregnancy/calendar': 'preg_calendar',
  '/family/nights': 'family_nights',
  '/summary': 'summary',
  '/library?journey=pregnant': 'preg_articles',
  '/library?cat=sexualite': 'preg_intimacy',
  '/track/breastfeed': 'baby_breastfeed',
  '/bottle/:id': 'baby_bottle_timer',
  '/bottle/scoops': 'bottle_scoops',
  '/guide/neonat': 'guide_neonat',
  '/postpartum/partner': 'pp_partner',
  '/family/urgent': 'family_urgent',
  '/family/sos': 'family_sos',
  '/meals/rankings': 'meal_rankings',
  '/track/bottle': 'baby_bottle',
  '/bottle/history': 'baby_bottle_history',
  '/child/:id/discoveries': 'baby_foods',
  '/guide/kidfood': 'guide_kidfood',
  '/night': 'kid_sleep',
  '/sleep/:id': 'kid_sleep_rhythm',
  '/night/help': 'baby_night_help',
  '/guide/kidsleep': 'guide_kidsleep',
  '/track/diaper': 'baby_diaper',
  '/track': 'baby_daily',
  '/teeth': 'kid_teeth',
  '/child/:id': 'kid_profile',
  '/child/:id/growth': 'kid_growth',
  '/child/:id/grow': 'kid_grow',
  '/child/:id?tab=etapes': 'kid_milestones',
  '/guide/hygiene': 'guide_hygiene',
  '/guide/activities': 'guide_activities',
  '/guide/toddler': 'guide_toddler',
  '/child/:id/vaccines': 'kid_vaccines',
  '/child/:id/health-tracking': 'kid_health',
  '/child/:id/needs?tab=treatments': 'kid_treatments',
  '/guide/illnesses': 'guide_illnesses',
  '/child/:id/card': 'kid_card',
  '/child/:id/wellbeing': 'kid_mood',
  '/family/custody': 'custody',
  '/guide/school': 'guide_school',
  '/guide/sport': 'guide_sport',
  '/child/:id/needs': 'kid_needs',
  '/child/:id/steps': 'kid_steps',
  '/guide/behaviour': 'guide_behaviour',
  '/family/kid-routines': 'kid_routines',
  '/summary?family=1': 'family_summary',
  '/family/history': 'family_history',
  '/family/review': 'family_review',
};

/** Ancienne clé `thème:adresse` → identifiant d'outil de l'époque, ou null si la clé est inconnue. */
export function legacyKeyToToolId(key: string): string | null {
  if (!key.includes(':/')) return null;
  return LEGACY_PATHS[legacyPath(key)] ?? null;
}
