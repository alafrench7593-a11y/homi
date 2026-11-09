/**
 * Contexte de l'assistant IA « sommeil » pour l'enfant choisi : âge et résumé chiffré du sommeil (bilan des 7 derniers
 * jours, estimations du jour, routine, difficultés signalées). Aucun prénom ni texte libre ; transmis seulement si le
 * parent laisse « Utiliser les données de sommeil » activé.
 */
import { useMemo } from 'react';
import { localized } from '@/i18n/localized';
import { useSleepPlan } from '@/lib/data/hooks-sleepPlanner';
import { childAge } from '@/lib/domain/child';
import { sleepContextFor, sleepReview } from '@/lib/domain/nightsHelp';
import type { AssistantContext } from '../../supabase/functions/_shared/assistant-prompt';
import type { Child } from '@/lib/types';

const SLEEP_QUESTIONS_FR = [
  'À quelle heure proposer la prochaine sieste ?',
  'Comment organiser le coucher ce soir ?',
  'Pourquoi les nuits ont-elles changé cette semaine ?',
  'Comment créer une routine qui nous convient ?',
  'Que puis-je essayer après plusieurs réveils ?',
];

const SLEEP_QUESTIONS_EN = [
  'What time should I offer the next nap?',
  'How should I organise bedtime tonight?',
  'Why have the nights changed this week?',
  'How can I build a routine that suits us?',
  'What can I try after several night wakings?',
];

const SLEEP_QUESTIONS_ES = [
  '¿A qué hora proponer la próxima siesta?',
  '¿Cómo organizar la hora de acostarse esta noche?',
  '¿Por qué han cambiado las noches esta semana?',
  '¿Cómo crear una rutina que nos funcione?',
  '¿Qué puedo probar después de varios despertares?',
];

const SLEEP_QUESTIONS_DE = [
  'Wann sollte ich das nächste Schläfchen anbieten?',
  'Wie gestalte ich das Zubettgehen heute Abend?',
  'Warum haben sich die Nächte diese Woche verändert?',
  'Wie finden wir eine Routine, die zu uns passt?',
  'Was kann ich nach mehrmaligem Aufwachen ausprobieren?',
];

const SLEEP_QUESTIONS_IT = [
  'A che ora proporre il prossimo sonnellino?',
  'Come organizzare la messa a letto stasera?',
  'Perché le notti sono cambiate questa settimana?',
  'Come creare una routine che vada bene per noi?',
  'Cosa posso provare dopo diversi risvegli?',
];

export const SLEEP_QUESTIONS: string[] = localized(SLEEP_QUESTIONS_FR, SLEEP_QUESTIONS_EN, { es: SLEEP_QUESTIONS_ES, de: SLEEP_QUESTIONS_DE, it: SLEEP_QUESTIONS_IT });

export function useSleepAssistantContext(child: Child | null): AssistantContext | null {
  const { plan, sleeps, profile } = useSleepPlan(child, 60_000);
  return useMemo(() => {
    if (!child || !plan) return null;
    const age = childAge(child.birth_date).months;
    const review = sleepReview(sleeps, child.id);
    return { childrenAgesMonths: [age], sleep: sleepContextFor(age, plan.age.corrected ? plan.age.months : null, review, plan, profile) };
  }, [child, plan, sleeps, profile]);
}
