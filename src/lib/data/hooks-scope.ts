/**
 * Portée affichée (profil du sélecteur + parcours actif) : la seule entrée du registre central des outils
 * (src/lib/journeys/tools.ts). Changer de profil ou de parcours recalcule immédiatement outils, accueil et actions.
 */
import { useMemo } from 'react';
import { useActivePregnancy, useActiveSubject, useJourneyState, useNotificationsInbox, useTrackedChildren } from './hooks';
import { notificationRelevant, type RelevanceCtx } from '@/lib/journeys/relevance';
import type { Scope, ScopeCtx } from '@/lib/journeys/tools';
import type { Child } from '@/lib/types';
import { pregnancyProgress } from '@/lib/domain/pregnancy';

export interface ScopeState extends ScopeCtx {
  /** Toutes les portées de mes profils suivis (garde d'accès des écrans). */
  activeScopes: Scope[];
  child: Child | null;
  loaded: boolean;
  /** Requête des parcours (pour afficher une erreur au lieu d'un chargement sans fin). */
  query: ReturnType<typeof useJourneyState>['query'];
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
    // « Mon post-partum » n'est plus une catégorie à part : il est rangé dans le profil du bébé
    else if (subject.type === 'postpartum' && js.postpartum) { scope = babyId ? 'baby' : meScope; childId = babyId; }
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
      scope, childId, babyId, pregnancyId: pregnancy?.id ?? null, postpartum: !!js.postpartum,
      activeScopes: [...activeScopes],
      child: (childId && children?.find((c) => c.id === childId)) || null,
      loaded: js.loaded,
      query: js.query,
    };
  }, [subject, js, pregnancy, children]);
}

/** Contexte de pertinence (rendez-vous, rappels, notifications) du profil affiché. */
export function useRelevanceCtx(): RelevanceCtx {
  const s = useScope();
  const pregnancy = useActivePregnancy();
  const { data: children } = useTrackedChildren();
  return useMemo(() => ({
    scope: s.scope, childId: s.childId, pregnancyId: s.pregnancyId, activeScopes: s.activeScopes,
    trackedChildIds: (children ?? []).map((c) => c.id), postpartum: s.postpartum,
    pregnancyWeek: pregnancy ? pregnancyProgress(pregnancy.due_date).weeksSA : null,
  }), [s, children, pregnancy]);
}

/** Boîte de réception sans les notifications d'un parcours terminé ou changé. */
export function useRelevantNotifications() {
  const q = useNotificationsInbox();
  const ctx = useRelevanceCtx();
  const data = useMemo(() => (q.data ? q.data.filter((n) => notificationRelevant(n, ctx)) : q.data), [q.data, ctx]);
  return { ...q, data };
}
