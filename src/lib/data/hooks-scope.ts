/**
 * Portée affichée (profil du sélecteur + parcours actif) : la seule entrée du registre central des outils
 * (src/lib/journeys/tools.ts). Changer de profil ou de parcours recalcule immédiatement outils, accueil et actions.
 */
import { useMemo } from 'react';
import { useActivePregnancy, useActiveSubject, useJourneyState, useTrackedChildren } from './hooks';
import type { Scope, ScopeCtx } from '@/lib/journeys/tools';
import type { Child } from '@/lib/types';

export interface ScopeState extends ScopeCtx {
  /** Toutes les portées de mes profils suivis (garde d'accès des écrans). */
  activeScopes: Scope[];
  child: Child | null;
  loaded: boolean;
}

export function useScope(): ScopeState {
  const { subject } = useActiveSubject();
  const js = useJourneyState();
  const pregnancy = useActivePregnancy();
  const { data: children } = useTrackedChildren();
  return useMemo(() => {
    const bodyType = js.body?.type;
    const meScope: Scope = bodyType === 'avoid' || bodyType === 'ttc' || bodyType === 'cycle' ? bodyType : 'none';
    const babyId = children?.find((c) => js.childType(c.id) === 'baby')?.id ?? null;
    let scope: Scope = meScope;
    let childId: string | null = null;
    if (subject.type === 'pregnancy' && pregnancy) scope = 'pregnancy';
    else if (subject.type === 'postpartum' && js.postpartum) scope = 'postpartum';
    else if (subject.type === 'family') scope = 'family';
    else if (subject.type === 'child') {
      const t = js.childType(subject.id);
      if (t) { scope = t; childId = subject.id; }
    }
    const activeScopes = new Set<Scope>([meScope]);
    if (pregnancy) activeScopes.add('pregnancy');
    if (js.postpartum) activeScopes.add('postpartum');
    for (const c of children ?? []) { const t = js.childType(c.id); if (t) activeScopes.add(t); }
    if ((children?.length ?? 0) + (pregnancy ? 1 : 0) > 1) activeScopes.add('family');
    return {
      scope, childId, babyId, pregnancyId: pregnancy?.id ?? null,
      activeScopes: [...activeScopes],
      child: (childId && children?.find((c) => c.id === childId)) || null,
      loaded: js.loaded,
    };
  }, [subject, js, pregnancy, children]);
}
