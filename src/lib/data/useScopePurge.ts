/** Monté une fois (Bootstrap) : purge le cache dès que MON périmètre se réduit (voir `lib/scopePurge.ts`). */
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useChildren, useMyMembership } from '@/lib/data/hooks';
import { purgeForScope, type ScopeLike } from '@/lib/scopePurge';

const sig = (s: ScopeLike | null) => (s ? `${[...(s.child_scope ?? [])].sort().join(',')}|${s.pregnancy_access === false ? 0 : 1}` : '');

/** À monter une fois (Bootstrap) : purge dès que MON périmètre se réduit. */
export function useScopePurge() {
  const qc = useQueryClient();
  const me = useMyMembership() as (ScopeLike & { user_id?: string }) | null;
  const { data: children } = useChildren();
  const last = useRef<string | null>(null);
  // Tous les enfants vus pendant la session (jamais oubliés avant une purge)
  const seen = useRef<Set<string>>(new Set());
  for (const c of children ?? []) seen.current.add(c.id);
  const key = sig(me);
  useEffect(() => {
    if (!me) return;
    // À chaque nouveau périmètre ET à l'ouverture (premier chargement des droits) : le cache restauré du téléphone
    // peut dater d'avant un retrait d'accès fait pendant que l'app était fermée
    if (last.current !== key) purgeForScope(qc, me, [...seen.current]);
    last.current = key;
  }, [qc, me, key]);
}
