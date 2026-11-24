/** Grand livre des crédits (RPC service_role) : réserve → débit si livré, restitution sinon. Partagé par les fonctions IA. */
import type { CreditsGate, ReserveResult } from './credits.ts';

// deno-lint-ignore no-explicit-any
export function creditsGate(admin: { rpc: (fn: string, args: Record<string, unknown>) => any }, userId: string): CreditsGate {
  return {
    reserve: async (action, key) => {
      const { data, error } = await admin.rpc('credits_reserve', { p_user: userId, p_action: action, p_idempotency_key: key });
      return (error || !data ? { ok: false, error: 'server_error' } : data) as ReserveResult;
    },
    commit: async (id) => {
      const { data, error } = await admin.rpc('credits_commit', { p_user: userId, p_reservation: id });
      return !error && (data as { ok?: boolean } | null)?.ok === true;
    },
    release: async (id, reason) => {
      const { data, error } = await admin.rpc('credits_release', { p_user: userId, p_reservation: id, p_reason: reason });
      return !error && (data as { ok?: boolean } | null)?.ok === true;
    },
  };
}
