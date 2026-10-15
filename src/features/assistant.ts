import { useMemo } from 'react';
import { useActivePregnancy, useChildren, useProfile } from '@/lib/data/hooks';
import { pregnancyProgress } from '@/lib/domain/pregnancy';
import { childAge } from '@/lib/domain/child';
import type { AssistantContext } from '../../supabase/functions/_shared/assistant-prompt';

/** Contexte transmis à l'assistant : parcours, semaine, âges. JAMAIS de prénom, de document ni de mesure. */
export function useAssistantContext(): AssistantContext {
  const { data: profile } = useProfile();
  const pregnancy = useActivePregnancy();
  const { data: children } = useChildren();
  return useMemo(() => {
    const ages = (children ?? []).map((c) => childAge(c.birth_date).months);
    const youngest = (children ?? []).map((c) => childAge(c.birth_date).days).sort((a, b) => a - b)[0];
    return {
      journeys: profile?.journeys ?? [],
      pregnancyWeekSA: pregnancy ? pregnancyProgress(pregnancy.due_date).weeksSA : null,
      multiplicity: pregnancy?.multiplicity ?? null,
      childrenAgesMonths: ages,
      postpartumWeeks: youngest != null && youngest < 7 * 52 ? Math.floor(youngest / 7) : null,
    };
  }, [profile, pregnancy, children]);
}

export const SUGGESTED_QUESTIONS = [
  'Que faut-il mettre dans ma valise de maternité ?',
  'Comment préparer mes enfants à l’arrivée du bébé ?',
  'Comment organiser les nuits avec des jumeaux ?',
  'Quelles informations noter avant le rendez-vous du pédiatre ?',
  'À quoi sert la rééducation du périnée ?',
  'Comment commencer la diversification ?',
  'Mon bébé régurgite, quelles informations dois-je observer ?',
];

export interface AskResponse {
  conversation_id: string | null;
  message_id?: string | null;
  answer: string;
  sources: { ref: number; title: string; slug: string; sources: { label: string; url: string }[] }[];
  safety: 'none' | 'crisis' | 'medical_urgent';
  demo?: boolean;
  quota?: { used: number; limit: number };
  stored?: boolean;
}
