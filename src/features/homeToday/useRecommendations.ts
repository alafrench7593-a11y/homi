/**
 * Faits de profil RÉELS (src/lib/personalization/facts.ts) assemblés depuis les données chargées par l'application,
 * puis recommandations du moteur déterministe : « Pour toi aujourd'hui » et « Ton enfant ».
 * Recalcul automatique : chaque changement de données (grossesse, naissance, âge, aliments notés, nounou, réponses du
 * parcours, épinglés / masqués) recalcule la liste. Seuls MES parcours et les données partagées du foyer sont lus.
 */
import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { eq } from '@/lib/backend';
import { useActivePregnancy, useHouseholdId, useHouseholdMembers, useJourneyState, useMemberships, useMyMembership, useProfile, useRows, useTrackedChildren } from '@/lib/data/hooks';
import { useScope } from '@/lib/data/hooks-scope';
import { isCaregiverOnly } from '@/lib/domain/nounou';
import { pregnancyProgress } from '@/lib/domain/pregnancy';
import { buildFacts, childRecommendations, forYouCount, recommend, type ProfileFacts, type Recommendation } from '@/lib/personalization';
import { useRecentTools } from '@/features/hubs/recentTools';
import { useUserId } from '@/lib/auth';
import { useUiStore } from '@/lib/store';

export function useProfileFacts(): ProfileFacts {
  const me = useUserId();
  const profile = useProfile().data;
  const membership = useMyMembership();
  const memberships = useMemberships().data;
  const js = useJourneyState();
  const pregnancy = useActivePregnancy();
  const { data: children } = useTrackedChildren();
  const { data: members } = useHouseholdMembers();
  const hid = useHouseholdId();
  const scope = useScope();
  // aliments déjà notés (diversification réellement commencée), par enfant ; une erreur (accès) = aucun
  const foods = useRows<{ child_id: string }>(['food_introductions', 'household', hid ?? ''], hid ? { table: 'food_introductions', filters: [eq('household_id', hid)], limit: 500 } : null);
  return useMemo(() => buildFacts({
    answers: profile?.onboarding_answers ?? null,
    role: membership?.role ?? null,
    caregiverOnly: isCaregiverOnly(memberships),
    myJourneys: js.active.map((r) => r.type),
    pregnancy: pregnancy ? {
      id: pregnancy.id,
      mine: js.active.some((r) => r.type === 'pregnancy' && r.pregnancy_id === pregnancy.id && r.user_id === me),
      weeks: pregnancy.due_date ? pregnancyProgress(pregnancy.due_date).weeksSA : null,
    } : null,
    children: (children ?? []).map((c) => ({ id: c.id, first_name: c.first_name, birth_date: c.birth_date })),
    foodsStarted: [...new Set((foods.data ?? []).map((x) => x.child_id))],
    caregiverLinked: (members ?? []).some((m) => m.role === 'caregiver'),
    activeChildId: scope.childId ?? null,
  }), [profile?.onboarding_answers, membership?.role, memberships, js.active, pregnancy, me, children, foods.data, members, scope.childId]);
}

export function useRecommendations(): { facts: ProfileFacts; forYou: Recommendation[]; count: number } {
  const facts = useProfileFacts();
  const { height } = useWindowDimensions();
  const favorites = useUiStore((s) => s.toolFavorites);
  const pinned = useUiStore((s) => s.toolPinned);
  const hidden = useUiStore((s) => s.toolHidden);
  const recents = useRecentTools((s) => s.recentTools);
  const count = forYouCount(height);
  // les favoris et les récents ont leurs propres sections : « Pour toi » propose autre chose (sauf épinglés)
  const forYou = useMemo(() => recommend(facts, { favorites, recents, pinned, hidden, exclude: [...favorites, ...recents.slice(0, 4)] }, { max: count }), [facts, favorites, recents, pinned, hidden, count]);
  return { facts, forYou, count };
}

export function useChildRecommendations(childId: string | null): Recommendation[] {
  const facts = useProfileFacts();
  const hidden = useUiStore((s) => s.toolHidden);
  return useMemo(() => (childId ? childRecommendations(facts, childId, { hidden }, 6) : []), [facts, childId, hidden]);
}
