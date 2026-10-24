/**
 * Contexte de l'assistant IA « sommeil » pour l'enfant choisi : âge et résumé chiffré du sommeil (bilan des 7 derniers
 * jours, estimations du jour, routine, difficultés signalées). Aucun prénom ni texte libre ; transmis seulement si le
 * parent laisse « Utiliser les données de sommeil » activé.
 */
import { useMemo } from 'react';
import { useSleepPlan } from '@/lib/data/hooks-sleepPlanner';
import { childAge } from '@/lib/domain/child';
import { sleepContextFor, sleepReview } from '@/lib/domain/nightsHelp';
import type { AssistantContext } from '../../supabase/functions/_shared/assistant-prompt';
import type { Child } from '@/lib/types';

export const SLEEP_QUESTIONS = [
  'À quelle heure proposer la prochaine sieste ?',
  'Comment organiser le coucher ce soir ?',
  'Pourquoi les nuits ont-elles changé cette semaine ?',
  'Comment créer une routine qui nous convient ?',
  'Que puis-je essayer après plusieurs réveils ?',
];

export function useSleepAssistantContext(child: Child | null): AssistantContext | null {
  const { plan, sleeps, profile } = useSleepPlan(child, 60_000);
  return useMemo(() => {
    if (!child || !plan) return null;
    const age = childAge(child.birth_date).months;
    const review = sleepReview(sleeps, child.id);
    return { childrenAgesMonths: [age], sleep: sleepContextFor(age, plan.age.corrected ? plan.age.months : null, review, plan, profile) };
  }, [child, plan, sleeps, profile]);
}
