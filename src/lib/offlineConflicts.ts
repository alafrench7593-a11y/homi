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
import { backend, BackendError, eq } from './backend';
import { t as tr } from '@/i18n';
import { stableStringify } from './idempotency';

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

// ---------------------------------------------------------------- modification « à trois versions » (audit 08)
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
/** Même valeur pour l'utilisateur : null ≈ absent ; deux écritures d'un même instant (« …Z » / « …+00:00 ») sont égales. */
export function sameValue(a: unknown, b: unknown): boolean {
  const x = a === undefined ? null : a;
  const y = b === undefined ? null : b;
  if (typeof x === 'string' && typeof y === 'string' && ISO_INSTANT.test(x) && ISO_INSTANT.test(y)) {
    const dx = Date.parse(x);
    const dy = Date.parse(y);
    if (!Number.isNaN(dx) && !Number.isNaN(dy)) return dx === dy;
  }
  return stableStringify(x) === stableStringify(y);
}

/** Champs que la saisie change réellement par rapport à la copie lue (un formulaire renvoie souvent tous ses champs). */
export function changedFields(base: Record<string, unknown>, input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) if (v !== undefined && !sameValue(v, base[k])) out[k] = v;
  return out;
}

/**
 * Report de MES modifications sur la ligne actuelle du serveur :
 *  - champ déjà à ma valeur côté serveur → rien à faire (même sens : « fait » des deux côtés) ;
 *  - champ que l'autre n'a pas touché (serveur = copie lue) → je peux l'écrire sans rien écraser ;
 *  - champ modifié des deux côtés, différemment → VRAI conflit : on n'écrit pas, on le signale.
 */
export function rebase(base: Record<string, unknown>, mine: Record<string, unknown>, server: Record<string, unknown>) {
  const rest: Record<string, unknown> = {};
  const clash: Record<string, [unknown, unknown]> = {};
  for (const [k, v] of Object.entries(mine)) {
    if (sameValue(server[k], v)) continue;
    if (sameValue(server[k], base[k])) rest[k] = v;
    else clash[k] = [v, server[k]];
  }
  return { rest, clash };
}

/** Erreur « conflit d'édition » (code « conflict ») : champs en conflit [ma valeur, valeur du serveur] et ligne actuelle. Rien n'a été écrit. */
export type EditConflict = BackendError & { fields: Record<string, [unknown, unknown]>; row: Record<string, unknown> };
export function editConflict(message: string, fields: Record<string, [unknown, unknown]>, row: Record<string, unknown>): EditConflict {
  return Object.assign(new BackendError(message, 'conflict'), { fields, row });
}

export type MergeResult<R> = { status: 'ok'; row: R } | { status: 'unchanged'; row?: R };

/**
 * Modification sûre d'une ligne versionnée lue plus tôt (`base`, avec sa `version`) :
 * n'envoie que les champs réellement modifiés, via update_if_version ; si la ligne a changé entre-temps,
 * reporte les modifications qui ne touchent pas aux changements de l'autre, et refuse (conflit) sinon.
 * Copie d'avant la colonne `version` (cache ancien format) : la ligne est relue avant d'écrire.
 */
export async function mergeUpdate<R = Record<string, unknown>>(
  table: VersionedTable, id: string, base: Record<string, unknown>, input: Record<string, unknown>,
  messages: { conflict: string; notFound: string },
): Promise<MergeResult<R>> {
  let mine = changedFields(base, input);
  if (!Object.keys(mine).length) return { status: 'unchanged' };
  let version = typeof base.version === 'number' ? base.version : null;
  if (version == null) {
    const [cur] = await backend.select<Record<string, unknown>>({ table, filters: [eq('id', id)], limit: 1 });
    if (!cur) throw new BackendError(messages.notFound, 'not_found');
    const r = rebase(base, mine, cur);
    if (Object.keys(r.clash).length) throw editConflict(messages.conflict, r.clash, cur);
    if (!Object.keys(r.rest).length) return { status: 'unchanged', row: cur as R };
    mine = r.rest;
    version = Number(cur.version ?? 1);
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    const out = await updateIfVersion<R>(table, id, version, mine);
    if (out.status === 'ok') return out;
    if (out.status === 'not_found') throw new BackendError(messages.notFound, 'not_found');
    if (out.status === 'forbidden') throw new BackendError(tr('l2.sb.forbidden'), '42501');
    const server = out.row as Record<string, unknown>;
    const r = rebase(base, mine, server);
    if (Object.keys(r.clash).length) throw editConflict(messages.conflict, r.clash, server);
    if (!Object.keys(r.rest).length) return { status: 'unchanged', row: out.row };
    mine = r.rest;
    version = Number(server.version);
  }
  throw new BackendError(messages.conflict, 'conflict');
}
