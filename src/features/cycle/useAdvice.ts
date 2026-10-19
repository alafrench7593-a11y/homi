/**
 * Conseils du cycle calculés SUR L'APPAREIL à partir des données enregistrées (aucun envoi externe, aucune IA).
 * Recalculés à chaque changement de données : une saisie supprimée ou modifiée met à jour ses conseils.
 * Conseils désactivés dans la confidentialité : seules les situations pressantes (avis rapide, urgence) restent affichées.
 */
import { useMemo } from 'react';
import { useActivePregnancy, usePeriods } from '@/lib/data/hooks';
import { useCyclePreferences } from '@/lib/data/hooks-cycle';
import { useAllSymptomLogs, useBleedingLogs, useDischargeLogs } from '@/lib/data/hooks-cycle2';
import { useFertilityJourney, useIntercourseLogs } from '@/lib/data/hooks-fertility';
import { todayISO } from '@/lib/domain/dates';
import { evaluateAdvice, type AdviceInput } from '@/lib/advice/engine';
import { rank, type Advice } from '@/lib/advice/types';
import { useUiStore } from '@/lib/store';

export function useAdvice() {
  const { prefs } = useCyclePreferences();
  const periods = usePeriods();
  const symptoms = useAllSymptomLogs();
  const discharge = useDischargeLogs(200);
  const bleeding = useBleedingLogs();
  const sex = useIntercourseLogs(120);
  const journey = useFertilityJourney();
  const pregnancy = useActivePregnancy();
  const seen = useUiStore((s) => s.adviceSeen);
  const enabled = prefs.advice_enabled !== false;

  const input = useMemo<AdviceInput>(() => ({
    now: new Date(), today: todayISO(), journey: journey === 'ttc' || journey === 'avoid' ? journey : 'cycle', pregnant: !!pregnancy,
    periods: periods.data ?? [],
    pain: (symptoms.data ?? []).filter((s) => s.pain_intensity != null),
    sex: prefs.track_intercourse ? sex.data ?? [] : [],
    discharge: discharge.data ?? [], bleeding: bleeding.data ?? [],
  }), [periods.data, symptoms.data, discharge.data, bleeding.data, sex.data, journey, pregnancy, prefs.track_intercourse]);
  const keep = (list: Advice[]) => (enabled ? list : list.filter((a) => rank(a.priority) >= rank('prompt')));
  const all = useMemo<Advice[]>(() => keep(evaluateAdvice(input)), [input, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Aperçu en direct pendant une saisie (avant l'enregistrement) : seule la saisie en cours est évaluée. */
  function preview(type: 'discharge' | 'bleeding', event: AdviceInput['discharge'][number] | AdviceInput['bleeding'][number]): Advice[] {
    const only = { ...input, pain: [], sex: [], discharge: type === 'discharge' ? [event as AdviceInput['discharge'][number]] : [], bleeding: type === 'bleeding' ? [event as AdviceInput['bleeding'][number]] : [] };
    return keep(evaluateAdvice(only)).filter((a) => a.event.type === type);
  }

  const isNew = (a: Advice) => !seen.includes(a.signature);
  const loading = [periods, symptoms, discharge, bleeding].some((q) => q.isLoading && !q.data);
  return { all, enabled, isNew, fresh: all.filter(isNew), loading, preview };
}
