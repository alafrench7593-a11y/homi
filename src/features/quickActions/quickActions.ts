/**
 * Action rapide centrale de la barre (refonte du 17/11/2026) — logique pure, testée (quickActions.test.ts).
 * Une feuille du bas avec 4 à 6 actions selon le profil affiché ; la personne peut choisir les siennes (par profil).
 * Chaque action mène à l'écran de saisie qui existe déjà (une seule destination par fonction) :
 *  - sieste → la SAISIE de sommeil (`/track/sleep`), plus l'écran Nuit ;
 *  - rendez-vous → `/appointments?new=quick` (création directe) ;
 *  - tâche → la feuille « Créer une tâche », disponible depuis tous les onglets.
 */
import type { IconName } from '@/components/ui';
import type { TKey } from '@/i18n';
import type { Scope } from '@/lib/journeys/tools';

export type QuickActionKey =
  | 'bottle' | 'breastfeed' | 'nap' | 'diaper' | 'meal' | 'observation' | 'task' | 'appointment'
  | 'feel' | 'weight' | 'period' | 'checkin' | 'mood' | 'mission' | 'shopping' | 'scanner' | 'timer' | 'ask';

export const QUICK_MIN = 4;
export const QUICK_MAX = 6;

export interface QuickActionDef { key: QuickActionKey; icon: IconName; label: TKey }
/** Libellés explicites (verbe + objet) et pictogrammes. */
export const QUICK_ACTIONS: Record<QuickActionKey, QuickActionDef> = {
  bottle: { key: 'bottle', icon: 'coffee', label: 'qa.bottle' },
  breastfeed: { key: 'breastfeed', icon: 'droplet', label: 'qa.breastfeed' },
  nap: { key: 'nap', icon: 'moon', label: 'qa.nap' },
  diaper: { key: 'diaper', icon: 'wind', label: 'qa.diaper' },
  meal: { key: 'meal', icon: 'feather', label: 'qa.meal' },
  observation: { key: 'observation', icon: 'thermometer', label: 'qa.observation' },
  task: { key: 'task', icon: 'check-square', label: 'qa.task' },
  appointment: { key: 'appointment', icon: 'calendar', label: 'qa.appointment' },
  feel: { key: 'feel', icon: 'activity', label: 'qa.feel' },
  weight: { key: 'weight', icon: 'trending-up', label: 'qa.weight' },
  period: { key: 'period', icon: 'droplet', label: 'qa.period' },
  checkin: { key: 'checkin', icon: 'edit-3', label: 'qa.checkin' },
  mood: { key: 'mood', icon: 'smile', label: 'qa.mood' },
  mission: { key: 'mission', icon: 'send', label: 'qa.mission' },
  shopping: { key: 'shopping', icon: 'shopping-cart', label: 'qa.shopping' },
  scanner: { key: 'scanner', icon: 'maximize', label: 'qa.scanner' },
  timer: { key: 'timer', icon: 'clock', label: 'qa.timer' },
  ask: { key: 'ask', icon: 'message-circle', label: 'qa.ask' },
};

/** Profil de l'action rapide : une liste par situation affichée. */
export type QuickProfile = 'baby' | 'child' | 'pregnancy' | 'postpartum' | 'cycle' | 'me' | 'family';

export function quickProfile(scope: Scope): QuickProfile {
  if (scope === 'baby' || scope === 'child' || scope === 'pregnancy' || scope === 'postpartum' || scope === 'family') return scope;
  return scope === 'none' ? 'me' : 'cycle';
}

const COMMON: QuickActionKey[] = ['task', 'appointment', 'mission', 'shopping', 'scanner', 'ask'];
/** Actions PERMISES par profil (jamais un biberon pour une grossesse) ; les premières sont celles par défaut. */
export const QUICK_ALLOWED: Record<QuickProfile, QuickActionKey[]> = {
  baby: ['bottle', 'breastfeed', 'nap', 'observation', 'task', 'appointment', 'diaper', 'meal', 'timer', 'mission', 'shopping', 'scanner', 'ask'],
  child: ['nap', 'meal', 'observation', 'task', 'appointment', 'mission', 'shopping', 'scanner', 'ask'],
  pregnancy: ['appointment', 'feel', 'weight', 'task', 'mood', 'mission', 'shopping', 'scanner', 'ask'],
  postpartum: ['checkin', 'mood', 'appointment', 'task', 'mission', 'shopping', 'scanner', 'ask'],
  cycle: ['period', 'mood', 'appointment', 'task', 'mission', 'shopping', 'scanner', 'ask'],
  me: ['mood', ...COMMON],
  family: COMMON,
};
const DEFAULT_COUNT: Record<QuickProfile, number> = { baby: 6, child: 5, pregnancy: 5, postpartum: 4, cycle: 4, me: 4, family: 4 };

export interface QuickCtx {
  profile: QuickProfile;
  /** Le bébé affiché a une maman en post-partum : « Mon point post-partum » devient disponible. */
  postpartum?: boolean;
  /** Module poids masqué par la personne (grossesse). */
  hideWeight?: boolean;
}

/** Toutes les actions que la personne peut choisir pour ce profil. */
export function quickAvailable(ctx: QuickCtx): QuickActionKey[] {
  let list = QUICK_ALLOWED[ctx.profile];
  if (ctx.profile === 'baby' && ctx.postpartum) list = [...list, 'checkin'];
  if (ctx.hideWeight) list = list.filter((k) => k !== 'weight');
  return list;
}

/**
 * Actions affichées : celles choisies (encore permises, dans l'ordre choisi, `QUICK_MIN` à `QUICK_MAX`), sinon celles
 * par défaut. Un choix devenu trop court (action retirée du profil) est complété par les défauts.
 */
export function quickShown(ctx: QuickCtx, chosen?: string[] | null): QuickActionKey[] {
  const available = quickAvailable(ctx);
  const defaults = available.slice(0, DEFAULT_COUNT[ctx.profile]);
  const kept = [...new Set(chosen ?? [])].filter((k): k is QuickActionKey => available.includes(k as QuickActionKey)).slice(0, QUICK_MAX);
  if (!kept.length) return defaults;
  for (const k of defaults) { if (kept.length >= QUICK_MIN) break; if (!kept.includes(k)) kept.push(k); }
  return kept;
}

/** Adresse de saisie d'une action (null : feuille locale — « tâche »). Identique à celle des hubs et des raccourcis. */
export function quickHref(key: QuickActionKey, o: { childId?: string | null; pregnancy?: boolean }): string | null {
  const child = o.childId ?? '';
  switch (key) {
    case 'bottle': case 'breastfeed': case 'diaper': case 'meal': case 'observation':
      return `/track/${key}?child=${child}`;
    // « Sieste » : la saisie de sommeil de l'enfant (début, fin, type), pas l'écran Nuit
    case 'nap': return `/track/sleep?child=${child}`;
    case 'timer': return `/bottle/${child}`;
    case 'appointment': return child ? `/appointments?new=quick&child=${child}` : o.pregnancy ? '/appointments?new=quick&concern=pregnancy' : '/appointments?new=quick';
    case 'feel': return '/pregnancy/feel';
    case 'weight': return '/pregnancy/weight';
    case 'period': return '/cycle/bleeding';
    case 'checkin': return '/postpartum/checkin';
    case 'mood': return '/me/mood';
    case 'mission': return '/family/missions/new';
    case 'shopping': return '/meals/shopping?add=1';
    case 'scanner': return '/scanner';
    case 'ask': return '/assistant/chat';
    case 'task': return null;
  }
}
