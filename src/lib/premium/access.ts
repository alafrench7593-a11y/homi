/**
 * Verrouillage strict du Premium (08/11/2026) — logique pure, testée par Jest.
 *
 * Sans Premium (abonnement personnel ou partagé par le co-parent abonné), un compte garde :
 *  - l'inscription, la connexion, l'introduction, l'onboarding, le choix des parcours et des profils ;
 *  - son profil et ses réglages (compte, confidentialité avec export et suppression des données, langue,
 *    notifications, foyer, synchronisation, abonnement) ;
 *  - les numéros et pages d'urgence, les sources, les mentions légales, « Donner mon avis ».
 * L'offre « Assistant IA » (5 €/mois) ouvre l'assistant ; un outil acheté à vie avant le 08/11/2026 reste ouvert.
 * Tout le reste affiche l'écran Premium. Le serveur applique la même règle aux nouvelles saisies
 * (migration 20261108000300_premium_strict.sql) : l'application n'accorde jamais un droit seule.
 */
import type { AccessInfo, PaidTool } from './offers';

const FREE: RegExp[] = [
  /^\/welcome\/?$/, /^\/intro\/?$/, /^\/cinematic\/?$/, /^\/auth\//, /^\/legal\//, /^\/onboarding\/?$/,
  /^\/journeys(\/.*)?$/, /^\/profiles\/new\/?$/,
  /^\/(profile|moi)\/?$/,
  /^\/settings\/?$/, /^\/settings\/(account|privacy|language|notifications|subscription|family|sync)\/?$/,
  /^\/premium\/?$/, /^\/feedback\/?$/, /^\/sources\/?$/, /^\/admin(\/.*)?$/,
  // Urgences et sécurité : jamais derrière un abonnement
  /^\/emergency\/?$/, /^\/cycle\/emergency\/?$/, /^\/contraception\/emergency\/?$/, /^\/postpartum\/support\/?$/, /^\/family\/(sos|urgent)\/?$/,
  // Alertes officielles de rappel de produits : information de sécurité
  /^\/scanner\/recalls\/?$/,
];

const AI_ROUTES: RegExp[] = [/^\/ask\/?$/, /^\/assistant(\/.*)?$/];

/** Écrans d'un outil vendu à vie (ancienne offre) : restent ouverts à qui l'a acheté. */
const TOOL_ROUTES: Record<PaidTool, RegExp[]> = {
  pma_tracker: [/^\/fertility\/pma\/?$/],
  custody: [/^\/family\/custody\/?$/],
  kid_routines: [/^\/family\/kid-routines?(\/.*)?$/],
  bottle_scoops: [/^\/bottle\/scoops\/?$/],
  contraception_journal: [/^\/contraception\/journal\/?$/],
  kid_steps: [/^\/child\/[^/]+\/steps\/?$/],
  cycle_kit: [/^\/cycle\/kit\/?$/],
  cycle_stats: [/^\/cycle\/stats\/?$/],
  meal_rankings: [/^\/meals\/rankings\/?$/],
  family_review: [/^\/family\/review\/?$/],
  family_domains: [/^\/family\/domains\/?$/],
  family_prep: [/^\/family\/prep\/?$/],
};

const clean = (path: string) => (path.split(/[?#]/)[0] || '/').replace(/\/+$/, '') || '/';

export const isFreeRoute = (path: string) => FREE.some((r) => r.test(clean(path)));

export type GateDecision = 'open' | 'checking' | 'locked';

/**
 * Décision d'affichage pour l'écran `path`.
 *  - premium : réponse de has_premium (undefined tant qu'elle n'est pas connue) ;
 *  - access : réponse de my_access (offre IA, outils achetés), facultative.
 * Un droit inconnu n'ouvre jamais un écran réservé (« vérification » puis écran Premium).
 */
export function gateFor(path: string, premium: boolean | undefined, access?: AccessInfo | null): GateDecision {
  const p = clean(path);
  if (isFreeRoute(p)) return 'open';
  if (premium === true) return 'open';
  if (access?.strict === false) return 'open';
  if (access?.ai && AI_ROUTES.some((r) => r.test(p))) return 'open';
  if (access) {
    for (const t of access.tools) {
      if (t.owned && TOOL_ROUTES[t.key as PaidTool]?.some((r) => r.test(p))) return 'open';
    }
  }
  return premium === undefined ? 'checking' : 'locked';
}

/** Tables de suivi réservées au Premium (miroir exact de la migration 20261108000300_premium_strict.sql). */
export const STRICT_TABLES: readonly string[] = [
  'bottles', 'bottle_timers', 'breastfeeds', 'pumpings', 'diapers', 'sleeps', 'sleep_feedback', 'bedtime_routines',
  'child_measurements', 'child_milestones', 'child_steps', 'child_observations', 'child_wellbeing', 'child_photos',
  'child_needs', 'child_need_entries', 'child_treatments', 'treatment_logs', 'child_vaccinations',
  'child_vaccine_postponements', 'child_health_trackers', 'child_health_items', 'child_health_entries',
  'child_food_settings', 'food_introductions', 'food_tastings', 'album_photos', 'album_shares', 'kid_products',
  'pregnancy_symptom_logs', 'maternal_weights', 'period_entries', 'symptom_logs', 'bleeding_logs', 'discharge_logs',
  'ovulation_tests', 'pregnancy_tests', 'fertility_observations', 'intercourse_logs', 'cycle_journal',
  'cycle_custom_items', 'cycle_insight_feedback', 'cycle_shares', 'contraception_methods', 'contraception_logs',
  'consultation_questions', 'postpartum_checkins', 'postpartum_actions', 'postpartum_shared_status',
  'support_circle', 'mood_checkins', 'parent_sleep_logs', 'exhaustion_checkins', 'daily_checks', 'my_treatments',
  'my_treatment_logs', 'couple_checkins', 'offduty_periods', 'care_requests', 'care_shifts', 'house_notes', 'notes',
  'family_tasks', 'family_task_events', 'family_events', 'family_papers', 'family_domains', 'family_prep',
  'routines', 'appointments', 'calendar_feeds', 'checklists', 'checklist_items', 'documents', 'name_votes',
  'name_favorites', 'meals', 'meal_plans', 'meal_plan_items', 'shopping_lists', 'shopping_items', 'recipe_favorites',
  'recipe_dislikes', 'recipe_reviews', 'product_scans', 'scan_results', 'scan_favorites', 'avoid_products',
  'favorites', 'place_favorites', 'place_reports', 'place_suggestions', 'posts', 'comments', 'post_photos',
  'post_likes', 'post_polls', 'poll_options', 'poll_votes', 'saved_posts', 'saved_folders', 'member_follows',
  'forum_subscriptions', 'group_members', 'group_invitations', 'community_groups', 'community_albums',
  'community_meetups', 'meetup_participants', 'event_registrations',
];
/** Tables de l'assistant : ouvertes aussi par l'offre « Assistant IA ». */
export const AI_TABLES: readonly string[] = ['assistant_conversations', 'assistant_messages', 'assistant_feedback'];
