/**
 * Écriture d'une correction de saisie du suivi quotidien — LE chemin du formulaire manuel (`/track/[kind]`) :
 *  · la file hors connexion ne sait envoyer que des ajouts : une modification exige le réseau ;
 *  · F-05 : la mise à jour ne passe que si l'entrée n'a pas changé depuis son ouverture (gardes sur chaque champ
 *    simple de l'original) ; sinon `'changed'` et la liste est relue ;
 *  · l'enfant et le foyer d'une entrée ne changent jamais lors d'une modification.
 * Le formulaire complet et les fiches de correction rapide (biberons, couches) appellent tous `guardedLogUpdate`.
 */
import { useCallback } from 'react';
import { backend, eq, type Filter } from '../backend';
import { BackendError } from '../backend/types';
import { useOfflineStore } from '../offline';
import { LOG_TABLE, type LogKind } from '../types';
import { t as tr } from '@/i18n';
import { useInvalidate } from './hooks';
import { editGuards } from '../domain/quickTrack';

export { editGuards };

export class OfflineEditError extends Error {
  constructor() { super(tr('u7.track.offlineEdit')); this.name = 'OfflineEditError'; }
}

export async function guardedLogUpdate(kind: LogKind, id: string, patch: Record<string, unknown>, original: Record<string, unknown>): Promise<'ok' | 'changed'> {
  if (backend.mode !== 'demo' && !useOfflineStore.getState().online) throw new OfflineEditError();
  const { household_id: _h, child_id: _c, ...rest } = patch; // eslint-disable-line @typescript-eslint/no-unused-vars
  try {
    const updated = await backend.update(LOG_TABLE[kind], rest, [eq('id', id), ...(editGuards(rest, original) as Filter[])]);
    return Array.isArray(updated) && updated.length === 0 ? 'changed' : 'ok';
  } catch (e) {
    if (e instanceof BackendError && e.isNetwork) throw new OfflineEditError();
    throw e;
  }
}

/** Correction d'une saisie + relecture des listes qui la montrent (mini-app, catégorie, accueil). */
export function useEditLog(kind: LogKind) {
  const inv = useInvalidate();
  return useCallback(async (id: string, patch: Record<string, unknown>, original: Record<string, unknown>) => {
    const res = await guardedLogUpdate(kind, id, patch, original);
    inv(LOG_TABLE[kind]);
    return res;
  }, [kind, inv]);
}
