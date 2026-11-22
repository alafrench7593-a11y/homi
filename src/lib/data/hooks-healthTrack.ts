/**
 * Corrections des mini-apps Santé et soins (22/11/2026) — même garde que le formulaire manuel (F-05, `editGuards`) :
 * la mise à jour ne passe que si la ligne n'a pas changé depuis son ouverture, sinon `'changed'` et la liste est relue.
 * Une modification exige le réseau (la file hors connexion ne sait envoyer que des ajouts).
 *  · prises de médicament : statut (prise / pas prise) et heure de prise (`logged_at`) — jamais la dose ;
 *  · humeur : niveau (1 → 5) et heure, `mood_checkins` (adulte, privé) ou `child_wellbeing` (enfant).
 */
import { useCallback } from 'react';
import { backend, eq, type Filter } from '../backend';
import { BackendError } from '../backend/types';
import { useOfflineStore } from '../offline';
import { editGuards } from '../domain/quickTrack';
import { useInvalidate } from './hooks';
import { OfflineEditError } from './hooks-quickTrack';

export type HealthEditTable = 'treatment_logs' | 'my_treatment_logs' | 'mood_checkins' | 'child_wellbeing';

export async function guardedRowUpdate(table: HealthEditTable, id: string, patch: Record<string, unknown>, original: Record<string, unknown>): Promise<'ok' | 'changed'> {
  if (backend.mode !== 'demo' && !useOfflineStore.getState().online) throw new OfflineEditError();
  // L'appartenance d'une ligne (foyer, enfant, personne, traitement) ne change jamais lors d'une correction
  const { household_id: _h, child_id: _c, user_id: _u, treatment_id: _t, ...rest } = patch; // eslint-disable-line @typescript-eslint/no-unused-vars
  try {
    const updated = await backend.update(table, rest, [eq('id', id), ...(editGuards(rest, original) as Filter[])]);
    return Array.isArray(updated) && updated.length === 0 ? 'changed' : 'ok';
  } catch (e) {
    if (e instanceof BackendError && e.isNetwork) throw new OfflineEditError();
    throw e;
  }
}

/** Correction + relecture de tout ce qui montre la ligne (mini-app, catégorie, accueil, « Ma journée »). */
export function useEditHealthRow(table: HealthEditTable) {
  const inv = useInvalidate();
  return useCallback(async (id: string, patch: Record<string, unknown>, original: Record<string, unknown>) => {
    const res = await guardedRowUpdate(table, id, patch, original);
    inv(table);
    return res;
  }, [table, inv]);
}
