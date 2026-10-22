/**
 * « Mes actions du jour » (logique pure, testée) : quatre raccourcis au maximum, propres au profil affiché,
 * personnalisables, jamais un outil sans rapport avec le profil (aucun biberon ni couche pendant la grossesse,
 * aucun outil de cycle sur le profil d'un enfant…).
 */
import { BOTTLE_MAX_MONTHS } from './bottleTimer';
import { childTrackProfile, trackActions, type TrackKey } from './trackingCards';

export type ActionKey =
  | 'period' | 'cycle_symptom' | 'mood' | 'contraception' | 'ovulation_test' | 'mucus' | 'temperature' | 'appointment'
  | 'feel' | 'mother_sleep' | 'eat' | 'weight' | 'echo' | 'checkin'
  | 'breastfeed' | 'bottle' | 'diaper' | 'sleep' | 'meal' | 'medication' | 'growth' | 'pumping' | 'observation';

export type ActionProfile = 'cycle' | 'avoid' | 'ttc' | 'pregnancy' | 'newborn' | 'diversification' | 'child' | 'postpartum' | 'none';

const BY_PROFILE: Record<Exclude<ActionProfile, 'newborn' | 'diversification' | 'child'>, { defaults: ActionKey[]; more: ActionKey[] }> = {
  cycle: { defaults: ['period', 'cycle_symptom', 'mood', 'contraception'], more: ['mother_sleep', 'appointment'] },
  avoid: { defaults: ['contraception', 'period', 'cycle_symptom', 'mood'], more: ['mother_sleep', 'appointment'] },
  ttc: { defaults: ['ovulation_test', 'mucus', 'temperature', 'appointment'], more: ['period', 'cycle_symptom', 'mood', 'mother_sleep'] },
  pregnancy: { defaults: ['feel', 'mother_sleep', 'mood', 'eat'], more: ['appointment', 'echo', 'weight'] },
  postpartum: { defaults: ['checkin', 'mood', 'mother_sleep', 'appointment'], more: [] },
  none: { defaults: ['mood', 'mother_sleep', 'appointment'], more: [] },
};

/** Actions qui n'existent que pour un enfant né : jamais proposées ailleurs. */
export const CHILD_ONLY: ActionKey[] = ['breastfeed', 'bottle', 'diaper', 'sleep', 'meal', 'medication', 'growth', 'pumping', 'observation'];
/** Actions du cycle : jamais sur un profil grossesse ou enfant. */
export const CYCLE_ONLY: ActionKey[] = ['period', 'cycle_symptom', 'contraception', 'ovulation_test', 'mucus', 'temperature'];
/** Actions de la grossesse : jamais ailleurs. */
export const PREGNANCY_ONLY: ActionKey[] = ['feel', 'eat', 'weight', 'echo'];

export interface ActionContext {
  profile: ActionProfile;
  /** enabled_tracking de l'enfant */
  enabled?: readonly string[];
  ageMonths?: number;
  hideWeight?: boolean;
  /** contraception : seulement si la personne utilise le suivi de contraception (objectif « éviter ») ou l'a demandé */
}

/** Profil d'actions d'après la portée affichée. */
export function actionProfile(scope: string, child?: { ageMonths: number; enabled: readonly string[] } | null, journey?: 'baby' | 'child' | null): ActionProfile {
  if ((scope === 'baby' || scope === 'child') && child) {
    const p = childTrackProfile(child.ageMonths, { journey, mealsEnabled: child.enabled.includes('meal') });
    return p === 'pregnancy' ? 'child' : p;
  }
  if (scope === 'cycle' || scope === 'avoid' || scope === 'ttc' || scope === 'pregnancy' || scope === 'postpartum') return scope;
  return 'none';
}

/** Toutes les actions possibles pour ce profil (dans l'ordre par défaut), sans aucune action hors sujet. */
export function availableActions(c: ActionContext): ActionKey[] {
  if (c.profile === 'newborn' || c.profile === 'diversification' || c.profile === 'child') {
    const { primary, more } = trackActions({ profile: c.profile, enabled: c.enabled, ageMonths: c.ageMonths });
    const keys = [...primary, ...more] as TrackKey[];
    return keys.filter((k): k is ActionKey & TrackKey => (CHILD_ONLY as string[]).includes(k) || k === 'appointment')
      .filter((k) => k !== 'bottle' || (c.ageMonths ?? 0) < BOTTLE_MAX_MONTHS);
  }
  const p = BY_PROFILE[c.profile];
  return [...p.defaults, ...p.more].filter((k) => !(k === 'weight' && c.hideWeight));
}

/** Les quatre raccourcis affichés : ceux choisis (s'ils restent possibles), sinon ceux du profil. */
export function shownActions(c: ActionContext, chosen?: readonly string[] | null): { shown: ActionKey[]; more: ActionKey[] } {
  const all = availableActions(c);
  const picked = (chosen ?? []).filter((k): k is ActionKey => all.includes(k as ActionKey));
  const shown = (picked.length ? picked : all).slice(0, 4);
  return { shown, more: all.filter((k) => !shown.includes(k)) };
}

/** Garde-fou : une action est-elle autorisée pour ce profil ? (utilisé aussi par les tests) */
export function actionAllowed(k: ActionKey, c: ActionContext): boolean {
  return availableActions(c).includes(k);
}
