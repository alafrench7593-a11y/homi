/**
 * Corrections des mini-apps de suivi Soins et Santé (vague 3, 22/11/2026) — même garde que le formulaire manuel
 * (F-05, `editGuards`) : la mise à jour ne passe que si la ligne n'a pas changé depuis l'ouverture de sa fiche, sinon
 * `'changed'` et tout ce qui montre la ligne est relu. Une correction exige le réseau (la file hors connexion ne sait
 * envoyer que des ajouts). Aucune nouvelle table : ce sont les lignes des écrans existants.
 */
import { useCallback } from 'react';
import { backend, eq, type Filter } from '../backend';
import { BackendError } from '../backend/types';
import { useOfflineStore } from '../offline';
import { editGuards } from '../domain/quickTrack';
import { useInvalidate } from './hooks';
import { OfflineEditError } from './hooks-quickTrack';

export type CareEditTable = 'child_milestones' | 'child_photos' | 'documents' | 'checklist_items' | 'mood_checkins' | 'exhaustion_checkins' | 'parent_sleep_logs'
  /** Vaccins (registre) et repas d'un menu enregistré : même garde (23/11/2026) */
  | 'child_vaccinations' | 'meal_plan_items';

/** Colonnes d'appartenance : jamais modifiées par une correction. */
const OWNERSHIP = ['id', 'household_id', 'child_id', 'user_id', 'checklist_id', 'uploaded_by', 'created_at', 'plan_id', 'recipe_slug', 'calendar_key'];

export async function guardedCareUpdate(table: CareEditTable, id: string, patch: Record<string, unknown>, original: Record<string, unknown>): Promise<'ok' | 'changed'> {
  if (backend.mode !== 'demo' && !useOfflineStore.getState().online) throw new OfflineEditError();
  const rest = Object.fromEntries(Object.entries(patch).filter(([k]) => !OWNERSHIP.includes(k)));
  if (!Object.keys(rest).length) return 'ok';
  try {
    const updated = await backend.update(table, rest, [eq('id', id), ...(editGuards(rest, original) as Filter[])]);
    return Array.isArray(updated) && updated.length === 0 ? 'changed' : 'ok';
  } catch (e) {
    if (e instanceof BackendError && e.isNetwork) throw new OfflineEditError();
    throw e;
  }
}

/** Correction + relecture de tout ce qui montre la ligne (mini-app, catégorie, accueil). */
export function useCareEdit(table: CareEditTable) {
  const inv = useInvalidate();
  return useCallback(async (id: string, patch: Record<string, unknown>, original: Record<string, unknown>) => {
    const res = await guardedCareUpdate(table, id, patch, original);
    inv(table);
    return res;
  }, [table, inv]);
}
