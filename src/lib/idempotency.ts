/**
 * Clés d'idempotence des saisies envoyées DIRECTEMENT (sans la file hors ligne) : rendez-vous, demandes d'aide,
 * traitements, listes de courses (audit 08, fiabilité).
 *
 * Problème corrigé : l'identifiant (id ou client_id) était tiré au hasard à CHAQUE essai. Quand le serveur avait écrit
 * mais que la réponse s'était perdue (coupure, délai dépassé), « Réessayer » créait une seconde ligne ; une double
 * pression aussi.
 *
 * Règle : tant qu'une saisie au MÊME contenu n'a pas abouti, elle garde le MÊME identifiant ; l'envoi se fait avec
 * « on conflict … do nothing », donc un rejeu ne crée jamais de doublon. Dès que l'envoi a abouti, la clé est oubliée :
 * une saisie identique faite plus tard est bien une nouvelle ligne. Contenu modifié = nouvelle saisie = nouvelle clé.
 */
import { uuid } from './uuid';

const TTL_MS = 30 * 60_000;
const keys = new Map<string, { id: string; at: number }>();

/** JSON à clés triées : deux objets égaux donnent la même chaîne, quel que soit l'ordre de leurs champs. */
export function stableStringify(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(',')}]`;
  if (v && typeof v === 'object') {
    return `{${Object.keys(v as Record<string, unknown>).sort().filter((k) => (v as Record<string, unknown>)[k] !== undefined)
      .map((k) => `${JSON.stringify(k)}:${stableStringify((v as Record<string, unknown>)[k])}`).join(',')}}`;
  }
  return JSON.stringify(v ?? null);
}

const keyOf = (scope: string, payload: unknown) => `${scope}|${stableStringify(payload)}`;

/** Identifiant stable d'une saisie (même portée + même contenu → même identifiant, tant qu'elle n'a pas abouti). */
export function idempotentId(scope: string, payload: unknown, now = Date.now()): string {
  for (const [k, v] of keys) if (now - v.at > TTL_MS) keys.delete(k);
  const k = keyOf(scope, payload);
  const hit = keys.get(k);
  if (hit) return hit.id;
  const id = uuid();
  keys.set(k, { id, at: now });
  return id;
}

/** Saisie aboutie : la prochaine saisie identique sera une nouvelle ligne. */
export function settleIdempotentId(scope: string, payload: unknown) {
  keys.delete(keyOf(scope, payload));
}

/**
 * Exécute un envoi avec un identifiant stable. En cas d'échec, l'identifiant est GARDÉ (le nouvel essai repart
 * avec lui) ; en cas de succès, il est oublié.
 */
export async function withIdempotentId<T>(scope: string, payload: unknown, send: (id: string) => Promise<T>): Promise<T> {
  const id = idempotentId(scope, payload);
  const out = await send(id);
  settleIdempotentId(scope, payload);
  return out;
}

/** Identifiant déterministe de la n-ième ligne d'un lot (uuid valide : préfixe de l'identifiant du lot + position). */
export function derivedId(baseId: string, position: number): string {
  return `${baseId.slice(0, 24)}${position.toString(16).padStart(12, '0')}`;
}

/** Pour les tests. */
export function resetIdempotency() {
  keys.clear();
}
