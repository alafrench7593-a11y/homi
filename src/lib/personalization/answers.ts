/**
 * Réponses du parcours d'accueil en 6 étapes (onboarding v3, 20/11/2026) — modèle pur, sans texte.
 * Enregistrées dans `profiles.onboarding_answers` (objet JSON borné, colonne existante 20261119000100, version 3) et
 * relues par le moteur de recommandation (src/lib/personalization/engine.ts). Modifiables dans « Modifier mon parcours ».
 * Aucune réponse n'accorde de droit d'accès : « inviter un autre parent » ouvre seulement le lien d'invitation existant.
 */
import type { Feeding } from './toolMeta';

export const ANSWERS_VERSION = 3;

/** Étape 1 — « Pour commencer, parle-nous un peu de toi » (plusieurs réponses). */
export type ProfileTag = 'ttc' | 'pregnant' | 'new_baby' | 'kids' | 'dad' | 'discover';
export const PROFILE_TAGS: ProfileTag[] = ['ttc', 'pregnant', 'new_baby', 'kids', 'dad', 'discover'];

/** Étape 2 — « Qui fait partie de ton quotidien ? » (une situation, plus « inviter » qui peut s'y ajouter). */
export type HouseholdKind = 'partner' | 'solo' | 'separated' | 'undisclosed';
export const HOUSEHOLD_KINDS: HouseholdKind[] = ['partner', 'solo', 'separated', 'undisclosed'];

/** Étape 4 — « Comment nourris-tu actuellement ton bébé ? » */
export type FeedingAnswer = Feeding | 'undisclosed';
export const FEEDING_ANSWERS: FeedingAnswer[] = ['breast', 'pumped', 'formula', 'mixed', 'solids', 'undisclosed'];

/** Étape 5 — « Qu'aimerais-tu simplifier avec HOMI ? » (plusieurs réponses). */
export type Priority =
  | 'pregnancy' | 'meals' | 'sleep' | 'growth' | 'appointments' | 'tasks' | 'communication'
  | 'find_nanny' | 'childcare_days' | 'school' | 'activities' | 'meet_parents';
export const PRIORITIES: Priority[] = ['pregnancy', 'meals', 'sleep', 'growth', 'appointments', 'tasks', 'communication', 'find_nanny', 'childcare_days', 'school', 'activities', 'meet_parents'];

export interface JourneyAnswers {
  profile: ProfileTag[];
  household: HouseholdKind | null;
  invite: boolean;
  feeding: FeedingAnswer | null;
  priorities: Priority[];
}

export const emptyJourneyAnswers = (): JourneyAnswers => ({ profile: [], household: null, invite: false, feeding: null, priorities: [] });

/** « Je souhaite simplement découvrir HOMI » s'exclut des autres choix de l'étape 1. */
export function toggleProfileTag(list: ProfileTag[], tag: ProfileTag): ProfileTag[] {
  if (list.includes(tag)) return list.filter((x) => x !== tag);
  if (tag === 'discover') return ['discover'];
  return [...list.filter((x) => x !== 'discover'), tag];
}

export function togglePriority(list: Priority[], p: Priority): Priority[] {
  return list.includes(p) ? list.filter((x) => x !== p) : [...list, p];
}

const pick = <T extends string>(v: unknown, allowed: readonly T[]): T[] =>
  (Array.isArray(v) ? [...new Set(v.filter((x): x is T => (allowed as readonly string[]).includes(x as string)))] : []);

/**
 * Réponses nettoyées depuis `profiles.onboarding_answers` (version 3), ou DÉDUITES d'un ancien parcours (version 2 :
 * situations et besoins) pour qu'un compte existant soit personnalisé sans refaire l'onboarding.
 */
export function readJourneyAnswers(raw: unknown): JourneyAnswers | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (r.v === 3 || 'profile' in r || 'priorities' in r) {
    const household = (HOUSEHOLD_KINDS as string[]).includes(r.household as string) ? (r.household as HouseholdKind) : null;
    const feeding = (FEEDING_ANSWERS as string[]).includes(r.feeding as string) ? (r.feeding as FeedingAnswer) : null;
    return { profile: pick(r.profile, PROFILE_TAGS), household, invite: r.invite === true, feeding, priorities: pick(r.priorities, PRIORITIES) };
  }
  // version 2 : situations (ttc, pregnant, baby, kids, cycle, home) et besoins (2 au plus)
  const sit = pick(r.situations, ['ttc', 'pregnant', 'baby', 'kids', 'cycle', 'home'] as const);
  const needs = pick(r.needs, ['mental_load', 'sleep', 'health', 'appointments', 'meals', 'community'] as const);
  const profile: ProfileTag[] = [];
  if (sit.includes('ttc')) profile.push('ttc');
  if (sit.includes('pregnant')) profile.push('pregnant');
  if (sit.includes('baby')) profile.push('new_baby');
  if (sit.includes('kids')) profile.push('kids');
  const NEED: Record<string, Priority | null> = { mental_load: 'tasks', sleep: 'sleep', health: null, appointments: 'appointments', meals: 'meals', community: 'meet_parents' };
  const priorities = needs.map((n) => NEED[n]).filter((x): x is Priority => !!x);
  const household: HouseholdKind | null = r.sharing === 'couple' ? 'partner' : r.sharing === 'solo' ? 'solo' : r.sharing === 'coparenting' ? 'separated' : null;
  return { profile, household, invite: false, feeding: null, priorities };
}

/** Charge utile v3 de `profiles.onboarding_answers` (choix seulement : aucun prénom, aucune date, aucune donnée de santé détaillée). */
export function journeyAnswersPayload(a: JourneyAnswers, extra: Record<string, unknown> = {}, now: Date = new Date()) {
  const s = readJourneyAnswers({ v: 3, ...a })!;
  return { v: ANSWERS_VERSION, profile: s.profile, household: s.household, invite: s.invite, feeding: s.feeding, priorities: s.priorities, ...extra, completed_at: now.toISOString() };
}
