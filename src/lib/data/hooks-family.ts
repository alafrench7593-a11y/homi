/**
 * Accès aux données « famille » : profil enfant (étapes, santé, diversification),
 * limites de la version gratuite. Complète src/lib/data/hooks.ts sans le modifier.
 */
import { useQuery } from '@tanstack/react-query';
import { backend, BackendError, eq } from '../backend';
import { useAuth } from '../auth';
import { useRows } from './hooks';

// ---------------------------------------------------------------- types (alignés sur supabase/migrations)
export type MilestoneKind = 'milestone' | 'memory' | 'tooth' | 'learning' | 'habit';
export interface Milestone { id: string; child_id: string; household_id: string; kind: MilestoneKind; title: string; happened_on: string | null; note: string | null; created_at: string }

export type HealthItemKind = 'vaccine_to_check' | 'allergy' | 'treatment' | 'contact';
export interface HealthItem { id: string; child_id: string; household_id: string; kind: HealthItemKind; label: string; details: string | null; due_on: string | null; done_on: string | null; created_at: string }

export interface FoodIntroduction { id: string; child_id: string; household_id: string; food_name: string; first_tried_on: string; reaction_note: string | null }
export interface Food { id: string; name: string; category: string; is_major_allergen: boolean; allergen_group: string | null; source: string | null }

export type PlanLimitKey = 'children_count' | 'checklists_count' | 'documents_count';

/** Valeurs gratuites par défaut (identiques à public.plan_limits), utilisées si la lecture échoue. */
export const FREE_LIMITS: Record<PlanLimitKey, number> = { children_count: 3, checklists_count: 4, documents_count: 15 };

// ---------------------------------------------------------------- enfant
export function useMilestones(childId: string | null | undefined) {
  return useRows<Milestone>(['child_milestones', childId ?? ''], childId ? { table: 'child_milestones', filters: [eq('child_id', childId)], order: [{ col: 'happened_on', asc: false }, { col: 'created_at', asc: false }] } : null);
}

export function useHealthItems(childId: string | null | undefined) {
  return useRows<HealthItem>(['child_health_items', childId ?? ''], childId ? { table: 'child_health_items', filters: [eq('child_id', childId)], order: [{ col: 'created_at' }] } : null);
}

export function useFoodIntroductions(childId: string | null | undefined) {
  return useRows<FoodIntroduction>(['food_introductions', childId ?? ''], childId ? { table: 'food_introductions', filters: [eq('child_id', childId)], order: [{ col: 'first_tried_on', asc: false }] } : null);
}

export function useFoods() {
  return useRows<Food>(['foods'], { table: 'foods', order: [{ col: 'name' }] }, { staleTime: 3600_000 });
}

// ---------------------------------------------------------------- limites
export function usePlanLimit(key: PlanLimitKey) {
  const { session } = useAuth();
  const q = useQuery({
    queryKey: [session?.userId, 'plan_limits', key],
    queryFn: () => backend.rpc<number>('plan_limit', { p_key: key }),
    enabled: !!session,
    staleTime: 60_000,
  });
  return typeof q.data === 'number' ? q.data : FREE_LIMITS[key];
}

export function isPremiumError(e: unknown): boolean {
  return e instanceof BackendError && e.isPremiumRequired;
}

export function errorMessage(e: unknown, fallback = 'Enregistrement impossible.'): string {
  return e instanceof Error && e.message ? e.message : fallback;
}
