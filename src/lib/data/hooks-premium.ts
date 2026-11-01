/**
 * Accès Premium côté application : état de l'abonnement expliqué, quotas mensuels (lus et consommés CÔTÉ SERVEUR),
 * et ouverture de l'aperçu Premium au moment où l'utilisatrice essaie réellement une fonction.
 */
import { localeTag } from '@/i18n';
import type React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { create } from 'zustand';
import { backend } from '../backend';
import { useAuth } from '../auth';
import { usePremium, useSubscription } from './hooks';
import { entitlement } from '../premium/entitlement';
import type { PremiumFeature } from '../premium/features';
import type { SubRow } from '../premium/entitlement';

export interface PremiumSheetState {
  feature: PremiumFeature;
  name?: string | null;
  /** Aperçu RÉEL du bénéfice, construit avec les données de l'utilisatrice */
  preview?: React.ReactNode;
  /** Limite gratuite atteinte */
  limit?: { used: number; quota: number; unit: string; monthly?: boolean } | null;
}
export const usePremiumSheet = create<{ open: PremiumSheetState | null; show: (s: PremiumSheetState) => void; hide: () => void }>((set) => ({
  open: null,
  show: (s) => set({ open: s }),
  hide: () => set({ open: null }),
}));

export function useEntitlement() {
  const sub = useSubscription();
  const premium = usePremium();
  const e = entitlement(sub as SubRow | null);
  // has_premium (serveur) fait foi : il couvre aussi le coparent d'un foyer abonné
  return { ...e, premium, sub };
}

/**
 * Fonction réservée : `require(preview)` renvoie true si l'abonnement est actif ; sinon ouvre l'aperçu et renvoie false.
 */
export function usePremiumAccess(feature: PremiumFeature, name?: string | null) {
  const premium = usePremium();
  const show = usePremiumSheet((s) => s.show);
  return {
    premium,
    require: (preview?: React.ReactNode) => {
      if (premium) return true;
      show({ feature, name, preview });
      return false;
    },
    showPreview: (preview?: React.ReactNode, limit?: PremiumSheetState['limit']) => show({ feature, name, preview, limit }),
  };
}

export interface QuotaStatus { used: number; quota: number; remaining: number }
const STATUS_RPC: Record<string, string> = {
  assistant_questions_per_month: 'assistant_quota_status',
  product_scans_per_month: 'scan_quota_status',
};

/** Quota mensuel lu côté serveur. */
export function useQuota(key: string) {
  const { session } = useAuth();
  const q = useQuery({
    queryKey: [session?.userId, 'quota', key],
    queryFn: async () => {
      const rows = STATUS_RPC[key] ? await backend.rpc<QuotaStatus[]>(STATUS_RPC[key]) : await backend.rpc<QuotaStatus[]>('feature_quota_status', { p_key: key });
      return (Array.isArray(rows) ? rows[0] : rows) as QuotaStatus;
    },
    enabled: !!session,
    staleTime: 30_000,
  });
  return { ...q, status: q.data ?? null };
}

/** Consomme une utilisation (côté serveur). Renvoie l'état ; allowed = false quand la limite gratuite est atteinte. */
export function useConsumeQuota(key: string) {
  const qc = useQueryClient();
  const { session } = useAuth();
  return async (): Promise<{ allowed: boolean; used: number; quota: number }> => {
    const rows = await backend.rpc<{ allowed: boolean; used: number; quota: number }[]>('consume_feature_quota', { p_key: key });
    const r = Array.isArray(rows) ? rows[0] : (rows as unknown as { allowed: boolean; used: number; quota: number });
    void qc.invalidateQueries({ queryKey: [session?.userId, 'quota', key] });
    return r;
  };
}

/** Date de remise à zéro des quotas mensuels (1er du mois suivant). */
export function quotaResetLabel(now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return d.toLocaleDateString(localeTag(), { day: 'numeric', month: 'long' });
}
