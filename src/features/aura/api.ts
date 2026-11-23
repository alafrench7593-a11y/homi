/**
 * HOMI Aura — appel du serveur (fonction « assistant », `mode: 'aura'`) et lecture des erreurs. En démonstration
 * sans serveur, le même appel passe par le double local (src/lib/backend/demoAura.ts : même déroulé, modèle simulé).
 */
import { backend, BackendError } from '@/lib/backend';
import { isInsufficientCredits } from '@/lib/credits/model';
import { t as tr } from '@/i18n';
import type { UrgentContact } from '../../../supabase/functions/_shared/safety';
import { isServerOff } from './model';

export interface AuraServerReply {
  kind?: string;
  safety?: 'none' | 'medical_urgent' | 'crisis';
  answer?: string;
  actions?: unknown;
  options?: string[];
  footer?: string;
  urgent_contacts?: UrgentContact[];
  replaced?: boolean;
  refused?: boolean;
  demo?: boolean;
  prompt_version?: string;
  credits?: { action?: string; cost?: number; charged?: boolean; monthly_remaining?: number | null; purchased_remaining?: number | null };
}

/** Délai maximal d'une réponse d'Aura : au-delà, la conversation n'attend plus (« Réessayer » réutilise la même clé). */
export const AURA_TIMEOUT_MS = 45_000;

/**
 * Appel d'Aura avec un DÉLAI : sans lui, une réponse qui ne revient jamais laissait « Aura prépare une réponse »
 * affiché et l'envoi bloqué pour toute la session (ticket 5). L'erreur `timeout` est classée « réseau » : rien n'est
 * débité tant que le serveur n'a pas livré, et la même clé de demande évite tout double débit au nouvel essai.
 */
export function askAura(body: Record<string, unknown>, opts: { timeoutMs?: number; invoke?: typeof backend.invoke } = {}): Promise<AuraServerReply> {
  const ms = opts.timeoutMs ?? AURA_TIMEOUT_MS;
  const invoke = opts.invoke ?? ((fn: string, b: unknown) => backend.invoke<AuraServerReply>(fn, b));
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new BackendError(tr('aura.err.network'), 'timeout')), ms);
  });
  return Promise.race([invoke('assistant', { mode: 'aura', ...body }) as Promise<AuraServerReply>, timeout]).finally(() => clearTimeout(timer));
}

export type AuraErrorKind = 'credits' | 'premium' | 'off' | 'network' | 'duplicate' | 'consent' | 'unavailable';

/**
 * Action utile proposée pour chaque erreur (ticket 5) : jamais une impasse silencieuse.
 *  premium → l'offre existante ; credits → la feuille des packs ; consent → l'accord ; network / unavailable → réessayer ;
 *  duplicate → rien à refaire (déjà traité) ; off → repli local automatique. « Chercher sans IA » reste toujours proposé.
 */
export function auraErrorAction(kind: AuraErrorKind): 'offer' | 'credits' | 'consent' | 'retry' | null {
  switch (kind) {
    case 'premium': return 'offer';
    case 'credits': return 'credits';
    case 'consent': return 'consent';
    case 'network': case 'unavailable': return 'retry';
    default: return null;
  }
}

/** Classe une erreur pour l'écran (jamais de détail technique affiché). */
export function classifyAuraError(e: unknown, online = true): AuraErrorKind {
  const code = (e as { code?: string } | null)?.code;
  const status = (e as { status?: number } | null)?.status;
  if (isInsufficientCredits(e)) return 'credits';
  if (isServerOff(code)) return 'off';
  if (code === 'premium_required' || (e instanceof BackendError && e.isPremiumRequired) || (status === 402 && !code)) return 'premium';
  if (code === 'duplicate_request' || status === 409) return 'duplicate';
  if (code === 'consent_required' || code === 'data_consent_required') return 'consent';
  if (!online || code === 'network' || code === 'timeout' || (code === 'function_error' && !status)) return 'network';
  return 'unavailable';
}
