/**
 * Accès aux données des parcours fertilité (« concevoir » / « éviter une grossesse »).
 * Les rapports, températures, glaire et méthodes de contraception sont STRICTEMENT
 * personnels : la RLS (owner only) empêche tout partage avec le foyer.
 */
import { useMutation } from '@tanstack/react-query';
import { useMemo } from 'react';
import { backend, eq } from '../backend';
import { useUserId } from '../auth';
import { useArticles, useHouseholdId, useInvalidate, usePeriods, useProfile, useRows } from './hooks';
import { avoidMargin, estimateCycle, projectFertileWindows } from '../domain/cycle';
import type { Journey } from '../types';
import type { ConsultationQuestion, ContraceptionMethod, FertilityJourney, FertilityObservation, IntercourseLog } from '../types-fertility';

// ---------------------------------------------------------------- lectures
export function useIntercourseLogs(limit = 120) {
  const userId = useUserId();
  return useRows<IntercourseLog>(['intercourse_logs'], userId ? { table: 'intercourse_logs', filters: [eq('user_id', userId)], order: [{ col: 'occurred_on', asc: false }], limit } : null);
}

export function useFertilityObservations(limit = 120) {
  const userId = useUserId();
  return useRows<FertilityObservation>(['fertility_observations'], userId ? { table: 'fertility_observations', filters: [eq('user_id', userId)], order: [{ col: 'observed_on', asc: false }], limit } : null);
}

export function useContraceptionMethods() {
  const userId = useUserId();
  return useRows<ContraceptionMethod>(['contraception_methods'], userId ? { table: 'contraception_methods', filters: [eq('user_id', userId)], order: [{ col: 'created_at', asc: false }] } : null);
}

/** Questions de la personne connectée pour un parcours (les questions partagées par d'autres ne sont pas mêlées). */
export function useConsultationQuestions(journey: FertilityJourney) {
  const userId = useUserId();
  return useRows<ConsultationQuestion>(['consultation_questions', journey], userId ? {
    table: 'consultation_questions', filters: [eq('user_id', userId), eq('journey', journey)], order: [{ col: 'position' }, { col: 'created_at' }],
  } : null);
}

/** Articles de la bibliothèque liés à un parcours. */
export function useJourneyArticles(journey: FertilityJourney) {
  const q = useArticles();
  const data = useMemo(() => (q.data ?? []).filter((a) => a.journeys.includes(journey as Journey)), [q.data, journey]);
  return { ...q, data };
}

/** Estimations du cycle prêtes à afficher (toujours des estimations). */
export function useCycleEstimates(windowsAhead = 4) {
  const periods = usePeriods();
  const entries = useMemo(() => periods.data ?? [], [periods.data]);
  const est = useMemo(() => estimateCycle(entries), [entries]);
  const windows = useMemo(() => projectFertileWindows(est, windowsAhead), [est, windowsAhead]);
  const margin = useMemo(() => avoidMargin(est), [est]);
  return { ...periods, entries, est, windows, margin };
}

/** Parcours fertilité choisi dans le profil (« concevoir » prioritaire si les deux sont cochés). */
export function useFertilityJourney(): FertilityJourney | null {
  const { data: profile } = useProfile();
  if (profile?.journeys.includes('ttc')) return 'ttc';
  if (profile?.journeys.includes('avoid')) return 'avoid';
  return null;
}

// ---------------------------------------------------------------- écritures
export function useAddIntercourse() {
  const inv = useInvalidate();
  const userId = useUserId();
  return useMutation({
    mutationFn: (r: { occurred_on: string; note?: string | null }) => backend.insert('intercourse_logs', { user_id: userId, occurred_on: r.occurred_on, note: r.note ?? null }),
    onSuccess: () => inv('intercourse_logs'),
  });
}

/** Une observation par jour : ré-enregistrer le même jour met à jour la ligne. */
export function useSaveObservation() {
  const inv = useInvalidate();
  const userId = useUserId();
  return useMutation({
    mutationFn: (r: { observed_on: string; bbt_celsius: number | null; cervical_mucus: FertilityObservation['cervical_mucus']; note: string | null }) =>
      backend.insert('fertility_observations', { user_id: userId, ...r }, { onConflict: 'user_id,observed_on' }),
    onSuccess: () => inv('fertility_observations'),
  });
}

export function useSaveContraceptionMethod() {
  const inv = useInvalidate();
  const userId = useUserId();
  return useMutation({
    mutationFn: async (a: { id?: string; row: Partial<ContraceptionMethod> }) => {
      if (a.id) return backend.update('contraception_methods', a.row, [eq('id', a.id)]);
      return backend.insert('contraception_methods', { ...a.row, user_id: userId });
    },
    onSuccess: () => inv('contraception_methods'),
  });
}

export function useAddQuestions(journey: FertilityJourney) {
  const inv = useInvalidate();
  const userId = useUserId();
  return useMutation({
    mutationFn: (a: { questions: string[]; startPosition: number }) =>
      backend.insert('consultation_questions', a.questions.map((question, i) => ({ user_id: userId, journey, question: question.slice(0, 300), position: a.startPosition + i }))),
    onSuccess: () => inv('consultation_questions'),
  });
}

/** Partage d'une question avec le foyer (domaine « santé ») — désactivé par défaut. */
export function useShareQuestion() {
  const inv = useInvalidate();
  const householdId = useHouseholdId();
  return useMutation({
    mutationFn: (a: { id: string; shared: boolean }) => {
      if (a.shared && !householdId) throw new Error('Créez ou rejoignez un foyer pour partager une question.');
      return backend.update('consultation_questions', a.shared ? { shared: true, household_id: householdId } : { shared: false }, [eq('id', a.id)]);
    },
    onSuccess: () => inv('consultation_questions'),
  });
}
