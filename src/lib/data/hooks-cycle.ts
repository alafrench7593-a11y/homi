/**
 * « Comprendre mon cycle et mes tests » : données strictement personnelles (RLS propriétaire uniquement).
 */
import { useMutation } from '@tanstack/react-query';
import { useMemo } from 'react';
import { backend, eq } from '../backend';
import { useUserId } from '../auth';
import { useInvalidate, usePeriods, useRows } from './hooks';
import { useSymptomLogs } from './hooks-me';
import { useFertilityObservations, useIntercourseLogs } from './hooks-fertility';
import { deleteEncryptedPhoto, discardLocalImage, keepEncryptedPhoto } from '../cycleAnalysis/privacy';
import { saveMucus, saveTest, testTable, type MucusSave, type PhotoDeps, type TestSave } from '../cycleAnalysis/session';
import type { TestKind } from '../cycleAnalysis/brands';
import type { PhotoSuggestionResult } from '../cycleAnalysis/mucus';
import type { CyclePreferences, CycleTest } from '../types-fertility';

export function useCyclePreferences() {
  const userId = useUserId();
  const q = useRows<CyclePreferences>(['cycle_preferences'], userId ? { table: 'cycle_preferences', filters: [eq('user_id', userId)], limit: 1 } : null);
  return { ...q, prefs: q.data?.[0] ?? { user_id: userId ?? '', track_intercourse: false } };
}

export function useSaveCyclePreferences() {
  const inv = useInvalidate();
  const userId = useUserId();
  return useMutation({
    mutationFn: (p: Partial<CyclePreferences>) => backend.insert('cycle_preferences', { user_id: userId, ...p }, { onConflict: 'user_id' }),
    onSuccess: () => inv('cycle_preferences'),
  });
}

export function useCycleTests(kind: TestKind, limit = 120) {
  const userId = useUserId();
  const table = testTable(kind);
  return useRows<CycleTest>([table], userId ? { table, filters: [eq('user_id', userId)], order: [{ col: 'tested_at', asc: false }], limit } : null);
}

/** Dépendances réelles : base de données, coffre chiffré, suppression locale. Rien d'autre. */
export const photoDeps: PhotoDeps = {
  insert: (table, row, onConflict) => backend.insert(table, row, onConflict ? { onConflict } : undefined),
  keepPhoto: keepEncryptedPhoto,
  discard: discardLocalImage,
};

export function useSaveTest() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (s: TestSave) => saveTest(s, photoDeps),
    onSuccess: (_r, s) => inv(testTable(s.kind)),
  });
}

export function useSaveMucus() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (s: MucusSave) => saveMucus(s, photoDeps),
    onSuccess: () => inv('fertility_observations'),
  });
}

/** Suppression d'un test : la photo chiffrée éventuelle est effacée d'abord, puis la ligne. */
export function useDeleteTest() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (a: { kind: TestKind; id: string; photoPath?: string | null }) => {
      await deleteEncryptedPhoto(a.photoPath);
      await backend.remove(testTable(a.kind), [eq('id', a.id)]);
    },
    onSuccess: (_r, a) => inv(testTable(a.kind)),
  });
}

/** Suppression immédiate d'une photo gardée, en conservant le résultat. */
export function useDeletePhoto() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (a: { table: 'ovulation_tests' | 'pregnancy_tests' | 'fertility_observations'; id: string; photoPath: string }) => {
      await deleteEncryptedPhoto(a.photoPath);
      await backend.update(a.table, { photo_path: null }, [eq('id', a.id)]);
    },
    onSuccess: (_r, a) => inv(a.table),
  });
}

/** Analyse d'une photo de glaire sur le serveur — UNIQUEMENT après consentement explicite. */
export async function requestMucusSuggestion(imageBase64: string): Promise<PhotoSuggestionResult> {
  const r = await backend.invoke<{ status: string; suggestion: PhotoSuggestionResult }>('cycle-photo', { image_base64: imageBase64, mime_type: 'image/jpeg', consent: true });
  return r.suggestion;
}

/** Toutes les données du calendrier privé. Les rapports ne sont chargés que si l'option est activée. */
export function useCycleHistoryData() {
  const { prefs } = useCyclePreferences();
  const periods = usePeriods();
  const obs = useFertilityObservations(400);
  const ovu = useCycleTests('ovulation', 400);
  const preg = useCycleTests('pregnancy', 200);
  const sym = useSymptomLogs(400);
  const inter = useIntercourseLogs(400);
  return useMemo(() => ({
    trackIntercourse: prefs.track_intercourse,
    input: {
      periods: periods.data ?? [],
      observations: obs.data ?? [],
      ovulationTests: ovu.data ?? [],
      pregnancyTests: preg.data ?? [],
      symptoms: sym.data ?? [],
      intercourse: prefs.track_intercourse ? inter.data ?? [] : null,
    },
    loading: periods.isLoading || obs.isLoading || ovu.isLoading,
  }), [prefs.track_intercourse, periods.data, obs.data, ovu.data, preg.data, sym.data, inter.data, periods.isLoading, obs.isLoading, ovu.isLoading]);
}
