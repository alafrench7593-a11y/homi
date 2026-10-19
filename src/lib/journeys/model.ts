/**
 * Parcours (table user_journeys) : logique PURE, testée (src/__tests__/journeys.test.ts).
 *
 * Règles :
 *  - un seul parcours « corps » actif : éviter une grossesse, projet bébé, cycle ou grossesse ;
 *  - un post-partum actif au plus ; un parcours bébé ou enfant par enfant ;
 *  - changer de parcours = fermer l'ancien (archivé par défaut, ou supprimé si la personne le demande) puis en créer un propre ;
 *  - le terme d'une nouvelle grossesse est calculé UNIQUEMENT à partir des informations de cette grossesse ;
 *  - une grossesse terminée n'affiche plus de semaine d'aménorrhée (sa ligne n'est plus « active »).
 * Les opérations produites sont exécutées par src/lib/journeys/manager.ts.
 */
import { addDays, daysBetween } from '@/lib/domain/dates';
import { DAYS_LMP_TO_DUE_FR } from '@/lib/domain/pregnancy';
import type { Journey } from '@/lib/types';

export const JOURNEY_TYPES = ['avoid', 'ttc', 'cycle', 'pregnancy', 'postpartum', 'baby', 'child'] as const;
export type JourneyType = (typeof JOURNEY_TYPES)[number];
export const BODY_TYPES: JourneyType[] = ['avoid', 'ttc', 'cycle', 'pregnancy'];
export const isBody = (t: JourneyType) => BODY_TYPES.includes(t);

export interface JourneyRow {
  id: string; user_id: string; household_id: string | null; type: JourneyType; status: 'active' | 'archived';
  started_on: string; ended_on: string | null; end_reason: string | null; pregnancy_id: string | null; child_id: string | null; created_at?: string;
}

/** Bébé jusqu'à 2 ans (biberons, couches, diversification), enfant ensuite. */
export const BABY_MAX_DAYS = 730;
export const childJourneyType = (birthDate: string, today: string): 'baby' | 'child' => (daysBetween(birthDate, today) < BABY_MAX_DAYS ? 'baby' : 'child');

export const activeOf = (rows: JourneyRow[], userId?: string | null) => rows.filter((r) => r.status === 'active' && (!userId || r.user_id === userId));
export const bodyJourney = (rows: JourneyRow[], userId?: string | null) => activeOf(rows, userId).find((r) => isBody(r.type)) ?? null;

/** Grossesses rattachées à un parcours « grossesse » actif (les miennes ou celles du foyer). */
export const activePregnancyIds = (rows: JourneyRow[]) => rows.filter((r) => r.status === 'active' && r.type === 'pregnancy' && r.pregnancy_id).map((r) => r.pregnancy_id!);
/**
 * Grossesse affichée : une grossesse « active » qui n'est rattachée à aucun parcours actif (ancienne grossesse,
 * passage en projet bébé) n'est JAMAIS affichée — c'est ce qui empêchait « 26 SA » d'apparaître en projet bébé.
 */
export function visiblePregnancy<P extends { id: string; status: string }>(pregnancies: P[] | undefined, rows: JourneyRow[]): P | null {
  const ids = activePregnancyIds(rows);
  return pregnancies?.find((p) => p.status === 'active' && ids.includes(p.id)) ?? null;
}

/** Valeur historique profiles.journeys calculée à partir des parcours actifs (identique au déclencheur SQL). */
export function legacyJourneys(rows: JourneyRow[], userId: string): Journey[] {
  const act = activeOf(rows, userId);
  const out = new Set<Journey>();
  for (const r of act) out.add(r.type === 'pregnancy' ? 'pregnant' : r.type === 'postpartum' || r.type === 'baby' ? 'newborn' : (r.type as Journey));
  if (act.filter((r) => r.type === 'baby' || r.type === 'child').length >= 2) out.add('family');
  return [...out];
}

// ---------------------------------------------------------------- opérations
export type Op =
  | { kind: 'insert'; table: string; row: Record<string, unknown> }
  | { kind: 'update'; table: string; id: string; patch: Record<string, unknown> }
  | { kind: 'delete'; table: string; id: string }
  | { kind: 'deleteWhere'; table: string; col: string; value: string }
  | { kind: 'rpc'; name: string; args?: Record<string, unknown> };

export type CloseMode = 'archive' | 'delete';

/** Ferme un parcours : archivage (données conservées) ou suppression définitive de ses données. */
export function closeOps(j: JourneyRow, mode: CloseMode, reason: string, today: string, pregnancyActive = true): Op[] {
  if (mode === 'archive') {
    const ops: Op[] = [{ kind: 'update', table: 'user_journeys', id: j.id, patch: { status: 'archived', ended_on: today < j.started_on ? j.started_on : today, end_reason: reason } }];
    // Quitter une grossesse en cours (retour volontaire à un autre parcours) : elle n'est plus active, avec un motif neutre
    if (j.type === 'pregnancy' && j.pregnancy_id && pregnancyActive && reason !== 'born') {
      ops.push({ kind: 'update', table: 'pregnancies', id: j.pregnancy_id, patch: { status: 'ended', end_reason: reason === 'ended' ? 'ended' : 'unspecified', ended_on: today } });
    }
    return ops;
  }
  return deleteOps(j);
}

/**
 * Suppression définitive (demandée explicitement) : RPC delete_journey, qui n'efface que les données datées
 * de la période de CE parcours (jamais celles d'un parcours encore actif). Grossesse : tout ce qui lui appartient.
 */
export function deleteOps(j: JourneyRow): Op[] {
  return [{ kind: 'rpc', name: 'delete_journey', args: { p_id: j.id } }];
}

export interface ChangeTarget { type: Exclude<JourneyType, 'pregnancy'>; childId?: string | null; householdId?: string | null }

/**
 * Passer à un parcours (hors grossesse, qui a son propre formulaire) : l'ancien parcours incompatible est d'abord
 * ARCHIVÉ, le nouveau est créé, et seulement ensuite (si la personne l'a demandé) l'ancien est supprimé :
 * un échec en cours de route ne laisse jamais la personne sans parcours ni ses données effacées.
 */
export function planChange(rows: JourneyRow[], userId: string, target: ChangeTarget, mode: CloseMode, today: string, activePregnancyIds: string[] = []): Op[] {
  const act = activeOf(rows, userId);
  const ops: Op[] = [];
  const after: Op[] = [];
  if (isBody(target.type)) {
    const cur = act.find((r) => isBody(r.type));
    if (cur?.type === target.type) return [];
    if (cur) {
      ops.push(...closeOps(cur, 'archive', 'changed', today, !!cur.pregnancy_id && activePregnancyIds.includes(cur.pregnancy_id)));
      if (mode === 'delete') after.push(...deleteOps(cur));
    }
  }
  if (target.type === 'postpartum' && act.some((r) => r.type === 'postpartum')) return [...ops, ...after];
  if ((target.type === 'baby' || target.type === 'child') && target.childId) {
    const cur = act.find((r) => (r.type === 'baby' || r.type === 'child') && r.child_id === target.childId);
    if (cur?.type === target.type) return [...ops, ...after];
    if (cur) ops.push(...closeOps(cur, 'archive', 'grew_up', today));
  }
  ops.push({ kind: 'insert', table: 'user_journeys', row: { user_id: userId, type: target.type, household_id: target.householdId ?? null, child_id: target.childId ?? null, started_on: today } });
  return [...ops, ...after];
}

// ---------------------------------------------------------------- nouvelle grossesse
export interface PregnancyStart {
  lmp?: string | null; conception?: string | null; positiveTest?: string | null; due?: string | null;
  multiplicity: 'single' | 'twins' | 'triplets' | 'unknown'; nicknames: string[];
}
export interface DueResult { due: string; lmp: string; source: 'due_date' | 'lmp' | 'conception' | 'positive_test'; estimated: boolean }

/**
 * Terme d'après les SEULES informations de la nouvelle grossesse (conventions françaises : terme = DDR + 287 jours) :
 *  date prévue connue → retenue telle quelle ; DDR → +287 j ; conception (≈ DDR + 14 j) → +273 j ;
 *  test positif seul (≈ 4 SA) → estimation, signalée comme telle.
 */
export function computeDue(s: PregnancyStart): DueResult | null {
  if (s.due) return { due: s.due, lmp: addDays(s.due, -DAYS_LMP_TO_DUE_FR), source: 'due_date', estimated: false };
  if (s.lmp) return { due: addDays(s.lmp, DAYS_LMP_TO_DUE_FR), lmp: s.lmp, source: 'lmp', estimated: false };
  if (s.conception) return { due: addDays(s.conception, DAYS_LMP_TO_DUE_FR - 14), lmp: addDays(s.conception, -14), source: 'conception', estimated: true };
  if (s.positiveTest) return { due: addDays(s.positiveTest, DAYS_LMP_TO_DUE_FR - 28), lmp: addDays(s.positiveTest, -28), source: 'positive_test', estimated: true };
  return null;
}
/** Terme estimé (calculé à partir de la conception ou du test positif, sans date de règles ni terme connu). */
export const isEstimatedDue = (p: { due_date_source?: string | null }) => p.due_date_source === 'conception' || p.due_date_source === 'positive_test';
export const babiesFor = (m: PregnancyStart['multiplicity']) => (m === 'twins' ? 2 : m === 'triplets' ? 3 : 1);

export function planStartPregnancy(rows: JourneyRow[], userId: string, householdId: string, s: PregnancyStart, mode: CloseMode, today: string, ids: { pregnancy: string }): Op[] {
  const due = computeDue(s);
  if (!due) throw new Error('missing_dates');
  const cur = bodyJourney(rows, userId);
  if (cur?.type === 'pregnancy') throw new Error('already_pregnant');
  const ops: Op[] = [];
  // 1. La grossesse et ses bébés attendus d'abord (si cela échoue, rien d'autre n'a changé)
  ops.push({
    kind: 'insert', table: 'pregnancies', row: {
      id: ids.pregnancy, household_id: householdId, carrier_user_id: userId, status: 'active', due_date: due.due,
      lmp_date: due.source === 'due_date' ? null : due.lmp, due_date_source: due.source, conception_date: s.conception ?? null, positive_test_date: s.positiveTest ?? null,
      multiplicity: s.multiplicity, topics: [],
    },
  });
  ops.push({ kind: 'insert', table: 'expected_babies', row: { __many: Array.from({ length: babiesFor(s.multiplicity) }, (_, i) => ({ pregnancy_id: ids.pregnancy, household_id: householdId, position: i + 1, nickname: s.nicknames[i]?.trim() || null })) } });
  // 2. Le suivi du cycle précédent est archivé, puis le parcours grossesse est créé
  if (cur) ops.push(...closeOps(cur, 'archive', 'pregnancy', today));
  ops.push({ kind: 'insert', table: 'user_journeys', row: { user_id: userId, household_id: householdId, type: 'pregnancy', pregnancy_id: ids.pregnancy, started_on: due.lmp < today ? due.lmp : today } });
  // 3. Suppression de l'ancien suivi seulement si demandée, une fois tout le reste réussi
  if (cur && mode === 'delete') ops.push(...deleteOps(cur));
  return ops;
}

// ---------------------------------------------------------------- fin de grossesse
export interface Birth { first_name: string; birth_date: string; birth_time?: string | null; weight_g?: number | null; length_cm?: number | null; term_weeks?: number | null; sex?: string | null }
export type PregnancyOutcome = 'born' | 'ended' | 'unspecified';

export function planEndPregnancy(rows: JourneyRow[], userId: string, pregnancyId: string, householdId: string, outcome: PregnancyOutcome, births: Birth[], today: string, ids: { children: string[]; group: string | null }): Op[] {
  const j = activeOf(rows, userId).find((r) => r.type === 'pregnancy' && r.pregnancy_id === pregnancyId);
  const endDate = outcome === 'born' && births[0]?.birth_date ? births[0].birth_date : today;
  const ops: Op[] = [];
  // 1. Profils des bébés D'ABORD : si l'un est refusé (limite de l'offre, données invalides), la grossesse reste intacte
  if (outcome === 'born') {
    births.forEach((b, i) => {
      ops.push({
        kind: 'insert', table: 'children', row: {
          id: ids.children[i], household_id: householdId, first_name: b.first_name.trim(), birth_date: b.birth_date, birth_time: b.birth_time ?? null,
          birth_weight_g: b.weight_g ?? null, birth_length_cm: b.length_cm ?? null, birth_term_weeks: b.term_weeks ?? null, sex: b.sex ?? null,
          from_pregnancy_id: pregnancyId, multiple_group: births.length > 1 ? ids.group : null,
        },
      });
    });
  }
  // 2. Grossesse terminée et parcours archivé (plus de semaine d'aménorrhée, rappels de grossesse arrêtés)
  ops.push({ kind: 'update', table: 'pregnancies', id: pregnancyId, patch: { status: outcome === 'born' ? 'born' : 'ended', end_reason: outcome, ended_on: endDate } });
  if (j) ops.push({ kind: 'update', table: 'user_journeys', id: j.id, patch: { status: 'archived', ended_on: endDate < j.started_on ? j.started_on : endDate, end_reason: outcome } });
  if (outcome !== 'born') return ops;
  // 3. Post-partum et un parcours bébé par enfant
  if (!activeOf(rows, userId).some((r) => r.type === 'postpartum')) {
    ops.push({ kind: 'insert', table: 'user_journeys', row: { user_id: userId, type: 'postpartum', started_on: endDate } });
  }
  births.forEach((_, i) => ops.push({ kind: 'insert', table: 'user_journeys', row: { user_id: userId, household_id: householdId, type: 'baby', child_id: ids.children[i], started_on: endDate } }));
  return ops;
}
