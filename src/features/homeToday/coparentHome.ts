/**
 * Accueil d'un adulte qui n'a PAS créé le foyer (co-parent), 19/11/2026 — situation déclarative ajoutée à homeLayout.ts
 * par un seul import. Pure, testée (coparentHome.test.ts).
 * Le co-parent voit d'abord ce qui le concerne : la prochaine action, l'agenda, les tâches du foyer, l'enfant ; pas de
 * carte d'outil de cycle ni de grossesse (ce sont les données de l'autre adulte, ouvertes seulement si elle partage).
 *
 * BRANCHEMENT (à faire dans src/app/(tabs)/index.tsx, hors périmètre de cette tâche) :
 *   const situation = coparentSituation(homeSituation({...}), membership?.role) ;
 * La situation « coparent » s'applique quand l'écran affiché est « Moi » ou « couple » (le profil d'un enfant ou de la
 * famille garde sa propre configuration).
 */
import type { HomeModuleKey } from './homeLayout';

export const COPARENT_PRESET: HomeModuleKey[] = ['next', 'quick', 'main', 'agenda', 'familyTasks', 'childInfo', 'recommendation', 'articles'];

/**
 * « Moi » / « couple » d'un co-parent → « coparent » ; sinon la situation reste celle du profil affiché (un co-parent qui
 * suit SON cycle garde l'accueil du cycle : ce sont ses données).
 */
export function coparentSituation<S extends string>(situation: S, role: string | null | undefined): S | 'coparent' {
  return role === 'coparent' && (situation === 'me' || situation === 'couple') ? 'coparent' : situation;
}
