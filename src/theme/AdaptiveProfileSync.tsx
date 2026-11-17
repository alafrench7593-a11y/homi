/**
 * Mode Adaptatif : relie le profil AFFICHÉ (sélecteur de profil : moi, grossesse, enfant, post-partum, famille) au thème.
 *
 * Le fournisseur de thème reste pur (il ne lit que le store) : ce composant, monté une fois sous les fournisseurs de
 * session et de données, recopie le type du profil résolu (`useActiveSubject`, la même source que `useScope()`) dans
 * `adaptiveProfile`. La palette suit alors `ADAPTIVE_PALETTE` (src/theme/tokens.ts) — uniquement si l'utilisatrice a
 * choisi « Adaptatif » ; avec une palette fixe, cette valeur est simplement ignorée. Sans session : profil « moi ».
 */
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useActiveSubject } from '@/lib/data/hooks';
import { useUiStore } from '@/lib/store';

export function AdaptiveProfileSync() {
  const { session } = useAuth();
  const { subject } = useActiveSubject();
  const setAdaptiveProfile = useUiStore((s) => s.setAdaptiveProfile);
  const kind = session ? subject.type : 'me';
  useEffect(() => { setAdaptiveProfile(kind); }, [kind, setAdaptiveProfile]);
  return null;
}
