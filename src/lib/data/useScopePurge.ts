/** Monté une fois (Bootstrap) : purge le cache dès que MON périmètre se réduit (voir `lib/scopePurge.ts`). */
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useMyMembership } from '@/lib/data/hooks';
import { purgeForScope, type ScopeLike } from '@/lib/scopePurge';

const sig = (s: ScopeLike | null) => (s ? `${[...(s.child_scope ?? [])].sort().join(',')}|${s.pregnancy_access === false ? 0 : 1}` : '');

/** À monter une fois (Bootstrap) : purge dès que MON périmètre se réduit. */
export function useScopePurge() {
  const qc = useQueryClient();
  const me = useMyMembership() as (ScopeLike & { user_id?: string }) | null;
  const last = useRef<string | null>(null);
  const key = sig(me);
  useEffect(() => {
    if (!me) return;
    if (last.current !== null && last.current !== key) purgeForScope(qc, me);
    last.current = key;
  }, [qc, me, key]);
}
