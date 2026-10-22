/**
 * « Suivre mon cycle » : lecture de toutes les données d'une journée et enregistrement (plan d'opérations testé
 * dans cycleDaily.ts). Données strictement personnelles (RLS propriétaire) ; rien n'est envoyé à un service externe.
 */
import { useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { backend, eq } from '../backend';
import { useUserId } from '../auth';
import { insertOrQueue } from '../offline';
import { useInvalidate, usePeriods, usePremium, useRows, useTests } from './hooks';
import { useAllSymptomLogs } from './hooks-cycle2';
import { useFertilityObservations, useIntercourseLogs } from './hooks-fertility';
import { useCyclePreferences } from './hooks-cycle';
import { estimateCycle } from '../domain/cycle';
import { todayISO } from '../domain/dates';
import { INTIMATE_PILLS, type CalendarData, type DaySources, type Op, type SymptomRow } from '../domain/cycleDaily';
import type { LogDay } from '../domain/cycleInsights';
import type { ContraceptionLog, CycleCustomItem, CycleInsightFeedback } from '../types-fertility';

const DAY_TABLES = ['period_entries', 'symptom_logs', 'fertility_observations', 'ovulation_tests', 'pregnancy_tests', 'intercourse_logs', 'contraception_logs'];

export function useContraceptionLogs(limit = 400) {
  const userId = useUserId();
  return useRows<ContraceptionLog>(['contraception_logs'], userId ? { table: 'contraception_logs', filters: [eq('user_id', userId)], order: [{ col: 'logged_on', asc: false }], limit } : null);
}
export function useCycleCustomItems() {
  const userId = useUserId();
  return useRows<CycleCustomItem>(['cycle_custom_items'], userId ? { table: 'cycle_custom_items', filters: [eq('user_id', userId)], order: [{ col: 'created_at' }] } : null);
}
export function useInsightFeedback() {
  const userId = useUserId();
  return useRows<CycleInsightFeedback>(['cycle_insight_feedback'], userId ? { table: 'cycle_insight_feedback', filters: [eq('user_id', userId)] } : null);
}

/** Toutes les données utiles au calendrier, à la fiche d'un jour et aux conseils. */
export function useCycleData() {
  const periodsQ = usePeriods();
  const symptomsQ = useAllSymptomLogs();
  const fertQ = useFertilityObservations(400);
  const ovuQ = useTests('ovulation_tests');
  const pregQ = useTests('pregnancy_tests');
  const sexQ = useIntercourseLogs(400);
  const contraQ = useContraceptionLogs();
  const { prefs, isLoading: prefsLoading } = useCyclePreferences();
  const intimate = !!prefs.track_intercourse;
  const today = todayISO();

  return useMemo(() => {
    const periods = (periodsQ.data ?? []).map((p) => ({ ...p, flow: p.flow ?? null }));
    const est = estimateCycle(periods, today);
    const symptoms = (symptomsQ.data ?? []) as unknown as SymptomRow[];
    const sex = intimate ? sexQ.data ?? [] : [];
    const sources = (iso: string): DaySources => ({
      periods: periods as DaySources['periods'],
      symptom: symptoms.find((s) => s.logged_on === iso) ?? null,
      fertility: (fertQ.data ?? []).find((f) => f.observed_on === iso) as DaySources['fertility'] ?? null,
      ovulationTests: (ovuQ.data ?? []).map((x) => ({ id: x.id, tested_at: x.tested_at, result: x.result })),
      pregnancyTests: (pregQ.data ?? []).map((x) => ({ id: x.id, tested_at: x.tested_at, result: x.result })),
      intercourse: sex as DaySources['intercourse'],
      contraception: (contraQ.data ?? []).map((c) => ({ id: c.id, logged_on: c.logged_on, kind: c.kind, label: c.label })),
    });
    // Indicateurs du calendrier (petits points) et journées pour les conseils
    const byDay = new Map<string, Set<string>>();
    const add = (iso: string, item: string) => { const s = byDay.get(iso) ?? new Set<string>(); s.add(item); byDay.set(iso, s); };
    for (const s of symptoms) {
      for (const k of [...(s.symptom_keys ?? []), ...(s.moods ?? []), ...(s.habits ?? []), ...(s.sleep_tags ?? [])]) add(s.logged_on, k);
    }
    for (const f of fertQ.data ?? []) if (f.cervical_mucus) add(f.observed_on, `mucus_${f.cervical_mucus}`);
    for (const c of contraQ.data ?? []) add(c.logged_on, c.kind);
    for (const x of sex) {
      add(x.occurred_on, 'sex_logged');
      if (x.condom === 'no' && x.usual_contraception !== 'yes') add(x.occurred_on, 'sex_unprotected');
      if (x.condom_incident && x.condom_incident !== 'none') add(x.occurred_on, 'sex_incident');
      if (x.contraception_incident === 'missed') add(x.occurred_on, 'sex_forgot');
    }
    const painOf = new Map(symptoms.map((s) => [s.logged_on, s.pain_intensity ?? null]));
    const logs: LogDay[] = [...byDay.entries()].map(([date, items]) => ({ date, items: [...items], pain: painOf.get(date) ?? null }));
    const symptomDays: Record<string, number> = {};
    for (const [d, items] of byDay) {
      const n = [...items].filter((i) => !INTIMATE_PILLS.has(i) && !i.startsWith('pill_') && i !== 'condom').length;
      if (n) symptomDays[d] = n;
    }
    const calendar: CalendarData = {
      periods,
      symptomDays,
      intimacyDays: new Set(sex.map((x) => x.occurred_on)),
      contraceptionDays: new Set((contraQ.data ?? []).filter((c) => ['pill_taken', 'patch_changed', 'ring_inserted', 'condom', 'device_declared'].includes(c.kind)).map((c) => c.logged_on)),
    };
    return { periods, est, sources, logs, calendar, prefs, intimate, today };
  }, [periodsQ.data, symptomsQ.data, fertQ.data, ovuQ.data, pregQ.data, sexQ.data, contraQ.data, prefs, intimate, today]);
}

export function useCycleLoading() {
  const periodsQ = usePeriods();
  const { isLoading } = useCyclePreferences();
  return (periodsQ.isLoading && !periodsQ.data) || isLoading;
}

/** Exécute un plan d'opérations (insertion hors connexion possible), puis relit les données touchées. */
export function useRunCycleOps() {
  const inv = useInvalidate();
  const userId = useUserId();
  return useMutation({
    mutationFn: async (ops: Op[]) => {
      for (const o of ops) {
        if (o.op === 'insert') await insertOrQueue(o.table, { user_id: userId, ...o.values });
        else if (o.op === 'update') await backend.update(o.table, o.values, [eq('id', o.id)]);
        else await backend.remove(o.table, [eq('id', o.id)]);
      }
      return ops;
    },
    onSettled: (_r, _e, ops) => inv(...new Set((ops ?? []).map((o) => o.table))),
  });
}

/** Efface toutes les saisies d'un jour (les règles qui le couvrent sont raccourcies, jamais supprimées en entier). */
export function useDeleteDay() {
  const inv = useInvalidate();
  const userId = useUserId();
  return useMutation({
    mutationFn: async ({ iso, s }: { iso: string; s: DaySources }) => {
      if (!userId) return;
      const day = [eq('user_id', userId)];
      const start = s.periods.find((p) => p.start_date === iso);
      if (start) {
        // Règles d'un seul jour : supprimées ; sinon le début passe au lendemain
        if (!start.end_date || start.end_date === iso) await backend.remove('period_entries', [eq('id', start.id)]);
        else await backend.update('period_entries', { start_date: nextDay(iso) }, [eq('id', start.id)]);
      }
      const ending = s.periods.find((p) => p.end_date === iso && p.start_date !== iso);
      if (ending) await backend.update('period_entries', { end_date: prevDay(iso) }, [eq('id', ending.id)]);
      await backend.remove('symptom_logs', [...day, eq('logged_on', iso)]);
      await backend.remove('fertility_observations', [...day, eq('observed_on', iso)]);
      await backend.remove('intercourse_logs', [...day, eq('occurred_on', iso)]);
      await backend.remove('contraception_logs', [...day, eq('logged_on', iso)]);
      for (const t of [...s.ovulationTests.filter((x) => x.tested_at.slice(0, 10) === iso).map((x) => ['ovulation_tests', x.id]), ...s.pregnancyTests.filter((x) => x.tested_at.slice(0, 10) === iso).map((x) => ['pregnancy_tests', x.id])]) {
        await backend.remove(t[0], [eq('id', t[1])]);
      }
    },
    onSettled: () => inv(...DAY_TABLES),
  });
}
const nextDay = (iso: string) => new Date(Date.parse(`${iso}T12:00:00Z`) + 86400000).toISOString().slice(0, 10);
const prevDay = (iso: string) => new Date(Date.parse(`${iso}T12:00:00Z`) - 86400000).toISOString().slice(0, 10);

export function useInsightFeedbackSave() {
  const inv = useInvalidate();
  const userId = useUserId();
  return useMutation({
    mutationFn: (a: { key: string; helpful: boolean }) => backend.insert('cycle_insight_feedback', { user_id: userId, insight_key: a.key, helpful: a.helpful }, { onConflict: 'user_id,insight_key' }),
    onSuccess: () => inv('cycle_insight_feedback'),
  });
}

export function useDeleteIntimateData() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: () => backend.rpc('delete_my_intimate_data', {}),
    onSuccess: () => inv('intercourse_logs', 'contraception_logs', 'symptom_logs'),
  });
}

export { usePremium };

// ─── Partage avec le ou la partenaire (Premium) ─────────────────────────────────────────────────────

export interface CycleShare { owner_id: string; partner_id: string; share_period: boolean; share_fertile: boolean; share_mood: boolean; share_symptoms: boolean; updated_at: string }
export interface SharedWithMe { owner_id: string; display_name: string; share_period: boolean; share_fertile: boolean; share_mood: boolean; share_symptoms: boolean; paused: boolean }
export interface PartnerCycle {
  paused: boolean; share_period?: boolean; share_fertile?: boolean; share_mood?: boolean; share_symptoms?: boolean;
  periods?: { start_date: string; end_date: string | null }[]; moods?: { date: string; moods: string[] }[]; symptoms?: { date: string; keys: string[] }[];
}

export function useMyCycleShares() {
  const userId = useUserId();
  return useRows<CycleShare>(['cycle_shares', 'mine'], userId ? { table: 'cycle_shares', filters: [eq('owner_id', userId)] } : null);
}
export function useCycleSharedWithMe() {
  const userId = useUserId();
  return useQuery({ queryKey: [userId, 'cycle_shares', 'with-me'], queryFn: () => backend.rpc<SharedWithMe[]>('cycle_shared_with_me'), enabled: !!userId });
}
export function usePartnerCycle(owner: string | null) {
  const userId = useUserId();
  return useQuery({ queryKey: [userId, 'cycle_shares', 'partner', owner], queryFn: () => backend.rpc<PartnerCycle>('partner_cycle', { p_owner: owner }), enabled: !!userId && !!owner });
}
export function useSaveCycleShare() {
  const inv = useInvalidate();
  const userId = useUserId();
  return useMutation({
    mutationFn: async (a: { partner: string; values: Partial<CycleShare>; exists: boolean }) => {
      if (a.exists) await backend.update('cycle_shares', a.values, [eq('owner_id', userId ?? ''), eq('partner_id', a.partner)]);
      else await backend.insert('cycle_shares', { owner_id: userId, partner_id: a.partner, ...a.values });
    },
    onSuccess: () => inv('cycle_shares'),
  });
}
export function useRevokeCycleShare() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (a: { owner: string; partner: string }) => backend.remove('cycle_shares', [eq('owner_id', a.owner), eq('partner_id', a.partner)]),
    onSuccess: () => inv('cycle_shares'),
  });
}
