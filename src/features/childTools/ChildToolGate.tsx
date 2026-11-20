/**
 * Outils d'un enfant réservés à ses parents (langage, jeux, activités, devoirs — 30/11/2026) : l'enfant de l'adresse,
 * le chargement, « introuvable » et « réservé aux parents » (une nounou n'y a pas accès : la RLS ne renvoie rien).
 */
import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, Skeleton } from '@/components/States';
import { useChild, useChildrenLoading, useMemberships } from '@/lib/data/hooks';
import { t as tr } from '@/i18n';
import type { Child } from '@/lib/types';

export function useParentChild(): { child: Child | null; loading: boolean; isParent: boolean } {
  const { id } = useLocalSearchParams<{ id: string }>();
  const child = useChild(id);
  const loading = useChildrenLoading();
  const memberships = useMemberships();
  const role = child ? (memberships.data ?? []).find((m) => m.household_id === child.household_id)?.role : null;
  return { child, loading, isParent: role === 'owner' || role === 'coparent' };
}

/** Écran d'attente / d'erreur commun ; `null` quand l'outil peut s'afficher. */
export function ChildToolGate({ title, state }: { title: string; state: { child: Child | null; loading: boolean; isParent: boolean } }) {
  if (state.loading && !state.child) return <Screen back title={title}><Skeleton rows={4} /></Screen>;
  if (!state.child) {
    return (
      <Screen back title={title}>
        <EmptyState icon="user-x" title={tr('alb.notFound')} body={tr('cm2.member.notFoundBody')}
          action={{ label: tr('pj.blocked.home'), icon: 'home', onPress: () => router.replace('/(tabs)') }} />
      </Screen>
    );
  }
  if (!state.isParent) return <Screen back title={title}><EmptyState icon="lock" title={title} body={tr('p2.parentsOnly')} /></Screen>;
  return null;
}
