/**
 * Sélecteur de profil universel — logique pure (testée, sans dépendance d'interface) : liste des profils, profil
 * affiché, voisin au glissement, seuil du geste. Voir src/components/ProfileSwitcher.tsx.
 */
import type { ActiveSubject } from '@/lib/store';
import type { Child } from '@/lib/types';

export type ProfileKind = 'me' | 'pregnancy' | 'child' | 'family';
export interface ProfileEntry { key: string; kind: ProfileKind; subject: ActiveSubject; child?: Pick<Child, 'id' | 'first_name' | 'photo_path' | 'birth_date'> }

/**
 * Liste des profils (pure, testée) : Moi, la grossesse en cours, chaque enfant suivi, puis « Toute la famille » s'il y
 * a au moins deux profils d'enfant / grossesse. Ne reçoit que des données DÉJÀ autorisées par le serveur.
 */
export function profileEntries(o: { pregnancyId?: string | null; children?: Pick<Child, 'id' | 'first_name' | 'photo_path' | 'birth_date'>[] | null }): ProfileEntry[] {
  const out: ProfileEntry[] = [{ key: 'me', kind: 'me', subject: { type: 'me' } }];
  if (o.pregnancyId) out.push({ key: 'preg', kind: 'pregnancy', subject: { type: 'pregnancy', id: o.pregnancyId } });
  for (const c of o.children ?? []) out.push({ key: c.id, kind: 'child', subject: { type: 'child', id: c.id }, child: c });
  if ((o.children?.length ?? 0) + (o.pregnancyId ? 1 : 0) > 1) out.push({ key: 'family', kind: 'family', subject: { type: 'family' } });
  return out;
}

/** Rang du profil affiché dans la liste (0 = Moi par défaut ; « post-partum » est rangé dans le bébé ou dans Moi). */
export function activeProfileIndex(list: ProfileEntry[], subject: ActiveSubject): number {
  const i = list.findIndex((e) => (subject.type === 'child' ? e.kind === 'child' && e.key === subject.id
    : subject.type === 'pregnancy' ? e.kind === 'pregnancy' : subject.type === 'family' ? e.kind === 'family' : subject.type === 'me' ? e.kind === 'me' : false));
  return i < 0 ? 0 : i;
}

/** Profil voisin au glissement : pas de boucle (au bout de la rangée, on reste où l'on est). */
export function neighbourIndex(count: number, index: number, dir: 1 | -1): number {
  return Math.min(Math.max(index + dir, 0), Math.max(count - 1, 0));
}

/** Distance (pt) ou vitesse (pt/s) à partir de laquelle un glissement change de profil (pure, testée). */
export const SWIPE = { distance: 56, velocity: 600, edge: 28, activeX: 24, failY: 14, excludeMs: 400 } as const;
export function swipeDirection(translationX: number, velocityX: number): 1 | -1 | 0 {
  'worklet';
  const far = Math.abs(translationX) > 56 || (Math.abs(velocityX) > 600 && Math.abs(translationX) > 24);
  if (!far) return 0;
  return translationX < 0 ? 1 : -1;
}

