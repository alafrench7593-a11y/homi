/**
 * Hors ligne sans doublon et conflits d'édition (13/11/2026, 20261113000500_hors_ligne_versions.sql).
 * Stratégie complète : HOMI_SYNC_ARCHITECTURE.md.
 *
 *  - Tâches, demandes d'aide et articles de courses portent un `client_id` (uuid généré sur l'appareil),
 *    unique PAR FOYER : la file renvoie la même saisie avec « on conflict (household_id, client_id) do nothing ».
 *  - Ces tables portent une `version` (posée par le serveur, +1 à chaque modification). Une modification
 *    faite sur une copie lue plus tôt passe par `updateIfVersion` : le serveur n'écrit que si la ligne est
 *    encore à la version lue, sinon il renvoie la ligne actuelle (« conflict ») — rien n'est écrasé en silence.
 */
import { backend } from './backend';

/** Tables dont le client_id est unique par foyer (contrainte <table>_client_uniq). */
export const HOUSEHOLD_CLIENT_ID_TABLES: readonly string[] = ['family_tasks', 'care_requests', 'shopping_items', 'household_stocks'];

/** Colonne(s) d'unicité pour l'envoi idempotent d'une saisie mise en file. */
export function conflictTarget(table: string, row: Record<string, unknown>): string {
  if ('client_id' in row) return HOUSEHOLD_CLIENT_ID_TABLES.includes(table) && 'household_id' in row ? 'household_id,client_id' : 'client_id';
  return 'id';
}

export type VersionedTable = 'family_tasks' | 'care_requests' | 'shopping_items' | 'household_stocks';

export type VersionedUpdate<R> =
  | { status: 'ok'; row: R }
  | { status: 'conflict'; row: R }
  | { status: 'not_found' }
  | { status: 'forbidden' };

/** Modification conditionnelle : n'écrit que si la ligne est encore à `expectedVersion`. */
export async function updateIfVersion<R = Record<string, unknown>>(
  table: VersionedTable, id: string, expectedVersion: number, patch: Record<string, unknown>,
): Promise<VersionedUpdate<R>> {
  return backend.rpc<VersionedUpdate<R>>('update_if_version', { p_table: table, p_id: id, p_expected_version: expectedVersion, p_patch: patch });
}

/** Champs modifiés des deux côtés (pour montrer le conflit) : clé → [ma valeur, valeur du serveur]. */
export function conflictingFields(mine: Record<string, unknown>, server: Record<string, unknown>): Record<string, [unknown, unknown]> {
  const out: Record<string, [unknown, unknown]> = {};
  for (const [k, v] of Object.entries(mine)) {
    if (JSON.stringify(server[k]) !== JSON.stringify(v)) out[k] = [v, server[k]];
  }
  return out;
}
