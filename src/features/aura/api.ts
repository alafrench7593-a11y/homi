/**
 * HOMI Aura — appel du serveur (fonction « assistant », `mode: 'aura'`) et lecture des erreurs. En démonstration
 * sans serveur, le même appel passe par le double local (src/lib/backend/demoAura.ts : même déroulé, modèle simulé).
 */
import { backend, BackendError } from '@/lib/backend';
import { isInsufficientCredits } from '@/lib/credits/model';
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

export function askAura(body: Record<string, unknown>): Promise<AuraServerReply> {
  return backend.invoke<AuraServerReply>('assistant', { mode: 'aura', ...body });
}

export type AuraErrorKind = 'credits' | 'premium' | 'off' | 'network' | 'duplicate' | 'consent' | 'unavailable';

/** Classe une erreur pour l'écran (jamais de détail technique affiché). */
export function classifyAuraError(e: unknown, online = true): AuraErrorKind {
  const code = (e as { code?: string } | null)?.code;
  const status = (e as { status?: number } | null)?.status;
  if (isInsufficientCredits(e)) return 'credits';
  if (isServerOff(code)) return 'off';
  if (code === 'premium_required' || (e instanceof BackendError && e.isPremiumRequired)) return 'premium';
  if (code === 'duplicate_request' || status === 409) return 'duplicate';
  if (code === 'consent_required' || code === 'data_consent_required') return 'consent';
  if (!online || code === 'network' || code === 'timeout' || (code === 'function_error' && !status)) return 'network';
  return 'unavailable';
}
