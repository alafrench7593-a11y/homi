import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { backend } from '@/lib/backend';
import { useAuth } from '@/lib/auth';
import { useActivePregnancy, useChildren, useLogs, useMoods, usePeriods, useProfile } from '@/lib/data/hooks';
import { pregnancyProgress } from '@/lib/domain/pregnancy';
import { childAge } from '@/lib/domain/child';
import { cycleDayKind, estimateCycle } from '@/lib/domain/cycle';
import { daysBetween, todayISO } from '@/lib/domain/dates';
import type { Bottle, Breastfeed, Diaper, Journey, Sleep } from '@/lib/types';
import type { AssistantContext, CyclePhase } from '../../supabase/functions/_shared/assistant-prompt';
import type { StructuredAnswer } from '../../supabase/functions/_shared/assistant-format';
import type { UrgentContact } from '../../supabase/functions/_shared/safety';

export { ASSISTANT_INTRO, MAX_QUESTION_LENGTH, DEV_MODE_LABEL, parseStructuredAnswer, SECTION_TITLES } from '../../supabase/functions/_shared/assistant-format';
export type { StructuredAnswer, OfficialSource } from '../../supabase/functions/_shared/assistant-format';
export { describeContext } from '../../supabase/functions/_shared/assistant-prompt';
export { urgentContacts } from '../../supabase/functions/_shared/safety';
export type { UrgentContact } from '../../supabase/functions/_shared/safety';

/**
 * Contexte pouvant être transmis à l'assistant, UNIQUEMENT si la personne l'autorise
 * pour la conversation : parcours, phase estimée du cycle, semaine de grossesse,
 * grossesse multiple, âge des enfants, quelques données saisies (nombres).
 * JAMAIS de prénom, de document, de note libre ni de mesure de santé détaillée.
 */
export function useAssistantContext(): AssistantContext {
  const { data: profile } = useProfile();
  const pregnancy = useActivePregnancy();
  const { data: children } = useChildren();
  const { data: periods } = usePeriods();
  const { data: moods } = useMoods(14);
  const youngestChild = useMemo(() => [...(children ?? [])].sort((a, b) => (a.birth_date < b.birth_date ? 1 : -1))[0] ?? null, [children]);
  const youngestId = youngestChild && childAge(youngestChild.birth_date).months < 36 ? youngestChild.id : null;
  const { data: bottles } = useLogs<Bottle>('bottle', youngestId, 1);
  const { data: breastfeeds } = useLogs<Breastfeed>('breastfeed', youngestId, 1);
  const { data: diapers } = useLogs<Diaper>('diaper', youngestId, 1);
  const { data: sleeps } = useLogs<Sleep>('sleep', youngestId, 1);

  return useMemo(() => {
    const ages = (children ?? []).map((c) => childAge(c.birth_date).months);
    const youngest = (children ?? []).map((c) => childAge(c.birth_date).days).sort((a, b) => a - b)[0];
    const journeys = profile?.journeys ?? [];

    let cyclePhase: CyclePhase | null = null;
    if (!pregnancy && periods?.length && journeys.some((j) => j === 'avoid' || j === 'ttc')) {
      const today = todayISO();
      const est = estimateCycle(periods);
      const kind = cycleDayKind(today, periods, est);
      if (kind === 'period') cyclePhase = 'period';
      else if (kind === 'fertile_estimate' || kind === 'ovulation_estimate') cyclePhase = 'fertile_estimate';
      else if (est.ovulation) cyclePhase = daysBetween(today, est.ovulation) > 0 ? 'follicular' : 'luteal';
    }

    const since = Date.now() - 86400_000;
    const recent = <T,>(rows: T[] | undefined, col: keyof T) => (rows ?? []).filter((r) => new Date(String(r[col])).getTime() >= since);
    const sleepHours = recent(sleeps, 'started_at').reduce((acc, s) => {
      const end = s.ended_at ? new Date(s.ended_at).getTime() : Date.now();
      return acc + Math.max(0, end - new Date(s.started_at).getTime()) / 3600_000;
    }, 0);
    const moodValues = (moods ?? []).filter((m) => new Date(m.checked_at).getTime() >= Date.now() - 7 * 86400_000).map((m) => m.mood);
    const recorded = {
      feeds24h: youngestId ? recent(bottles, 'at').length + recent(breastfeeds, 'started_at').length : null,
      sleepHours24h: youngestId && sleeps?.length ? Math.round(Math.min(24, sleepHours) * 10) / 10 : null,
      diapers24h: youngestId ? recent(diapers, 'at').length : null,
      moodAvg7d: moodValues.length ? Math.round((moodValues.reduce((a, b) => a + b, 0) / moodValues.length) * 10) / 10 : null,
    };

    return {
      journeys,
      pregnancyWeekSA: pregnancy ? pregnancyProgress(pregnancy.due_date).weeksSA : null,
      multiplicity: pregnancy?.multiplicity ?? null,
      childrenAgesMonths: ages,
      postpartumWeeks: youngest != null && youngest < 7 * 52 ? Math.floor(youngest / 7) : null,
      cyclePhase,
      recorded: Object.values(recorded).some((v) => v != null && v !== 0) ? recorded : null,
    };
  }, [profile, pregnancy, children, periods, moods, youngestId, bottles, breastfeeds, diapers, sleeps]);
}

/** Questions suggérées selon le parcours (écran d'accueil de l'assistant). */
export const SUGGESTIONS_BY_JOURNEY: Record<Journey, { label: string; questions: string[] }> = {
  avoid: {
    label: 'Contraception',
    questions: [
      'Quelles sont les différentes méthodes de contraception ?',
      'Que faire en cas d’oubli de pilule ?',
      'Comment fonctionne la contraception d’urgence ?',
      'Quelle contraception est possible après un accouchement ?',
    ],
  },
  cycle: {
    label: 'Mon cycle',
    questions: [
      'Quelle est la durée habituelle d’un cycle ?',
      'Des règles irrégulières, est-ce fréquent ?',
      'Quels symptômes peuvent accompagner les règles ?',
      'Quand consulter pour des règles douloureuses ?',
    ],
  },
  ttc: {
    label: 'Projet bébé',
    questions: [
      'Quels examens faire avant de concevoir ?',
      'Pourquoi prendre de l’acide folique avant une grossesse ?',
      'Combien de temps faut-il en moyenne pour concevoir ?',
      'Quand consulter si la grossesse ne vient pas ?',
    ],
  },
  pregnant: {
    label: 'Grossesse',
    questions: [
      'Que faut-il mettre dans ma valise de maternité ?',
      'Quels aliments éviter pendant la grossesse ?',
      'Quels signes doivent me faire appeler la maternité ?',
      'Comment se passe le suivi d’une grossesse gémellaire ?',
    ],
  },
  newborn: {
    label: 'Bébé',
    questions: [
      'Comment savoir si mon bébé boit assez ?',
      'Comment coucher bébé en sécurité ?',
      'Mon bébé régurgite, quelles informations dois-je observer ?',
      'Quels sont les premiers rendez-vous de suivi du bébé ?',
    ],
  },
  child: {
    label: 'Enfant',
    questions: [
      'Comment commencer la diversification ?',
      'Combien d’heures de sommeil pour un enfant de 2 ans ?',
      'Quelles informations noter avant le rendez-vous du pédiatre ?',
      'Comment limiter les écrans chez les jeunes enfants ?',
    ],
  },
  family: {
    label: 'Famille',
    questions: [
      'Comment préparer mes enfants à l’arrivée du bébé ?',
      'Comment organiser les nuits avec des jumeaux ?',
      'Comment repérer un épuisement parental ?',
      'À quoi sert la rééducation du périnée ?',
    ],
  },
};

export const JOURNEY_ORDER: Journey[] = ['avoid', 'ttc', 'pregnant', 'newborn', 'child', 'family'];

export interface ArticleSourceRef {
  ref: number;
  title: string;
  slug: string;
  sources: { label: string; url: string }[];
}

export interface AskResponse {
  conversation_id: string | null;
  message_id?: string | null;
  answer: string;
  /** Articles de la bibliothèque de l'application cités par la réponse. */
  sources: ArticleSourceRef[];
  /** Réponse structurée (sections + sources officielles filtrées). */
  structured?: StructuredAnswer | null;
  safety: 'none' | 'crisis' | 'medical_urgent';
  reasons?: string[];
  urgent_contacts?: UrgentContact[];
  /** Vrai si le contrôle de sécurité a remplacé la réponse générée. */
  replaced?: boolean;
  refused?: boolean;
  demo?: boolean;
  dev_mode?: string;
  quota?: { used: number; limit: number; remaining?: number };
  stored?: boolean;
}

export interface QuotaStatus {
  used: number;
  quota: number;
  remaining: number;
}

/** Questions restantes ce mois-ci (vérifié côté serveur, ici pour l'affichage). */
export function useAssistantQuota() {
  const { session } = useAuth();
  return useQuery({
    queryKey: [session?.userId, 'assistant_usage', 'status'],
    queryFn: async () => {
      const rows = await backend.rpc<QuotaStatus[] | QuotaStatus>('assistant_quota_status');
      const row = Array.isArray(rows) ? rows[0] : rows;
      return row ?? null;
    },
    enabled: !!session,
    staleTime: 15_000,
  });
}
