/**
 * HOMI Ambassadors (24/11/2026) : candidature, tableau de bord (agrégats seulement), administration.
 * Toute règle (30 %, 6 mois, délai, seuil, droits) est appliquée par le serveur ; ici, affichage et appels.
 * Un ambassadeur ne reçoit jamais d'identifiant, d'e-mail ni de donnée familiale d'un client.
 */
import { Platform } from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { backend } from '../backend';
import { useUserId } from '../auth';
import { useInvalidate, useRows } from './hooks';
import { formatNumber } from '@/i18n';

export const AFFILIATE_TERMS_VERSION = 'v1-2026-11';
export const PROFILE_TYPES = ['maman', 'papa', 'createur', 'influenceur', 'ugc', 'blogueur', 'communaute', 'accompagnant', 'media', 'partenaire', 'autre'] as const;
export type ProfileType = (typeof PROFILE_TYPES)[number];
export const AFFILIATE_STATUSES = ['pending', 'active', 'suspended', 'rejected'] as const;
export type AffiliateStatus = (typeof AFFILIATE_STATUSES)[number];

import { PROGRAM, simulate } from '../affiliateProgram';
export { PROGRAM, simulate };

export interface CurrencyTotals { currency: string; pending_minor: number | null; available_minor: number | null; paid_minor: number | null; month_minor: number | null }
export interface AffiliateSummary {
  code: string; status: AffiliateStatus; tier: string; clicks_30d: number; signups: number; paying: number;
  by_currency: CurrencyTotals[]; links: { campaign: string; feature: string; disabled: boolean }[];
}
export interface AffiliateRow {
  id: string; user_id: string; code: string; status: AffiliateStatus; first_name: string; last_name: string; contact_email: string;
  country: string; language: string; profile_type: ProfileType; audience_size: number | null; promo_channel: string | null; created_at: string;
}
export interface LedgerRow { affiliate_id: string; status: string; kind: string; amount_minor: number; currency: string }

/** Montant en unités mineures → texte localisé (jamais de calcul en virgule flottante côté serveur). */
export function formatMinor(minor: number | null | undefined, currency: string): string {
  const v = minor ?? 0;
  const digits = ['JPY', 'KRW'].includes(currency) ? 0 : 2;
  return formatNumber(v / 10 ** digits, { style: 'currency', currency, minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/** Adresse publique de partage : site actuel sur le web, sinon EXPO_PUBLIC_SITE_URL, sinon le domaine officiel homifamille.com. */
export function affiliateLink(code: string, campaign?: string): string | null {
  const base = Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : (process.env.EXPO_PUBLIC_SITE_URL || 'https://homifamille.com');
  if (!base) return null;
  return `${base.replace(/\/$/, '')}/r/${code}${campaign ? `?c=${encodeURIComponent(campaign)}` : ''}`;
}

export function useAffiliateSummary() {
  const uid = useUserId();
  return useQuery({
    queryKey: ['affiliate_summary', uid ?? ''],
    enabled: !!uid,
    queryFn: async () => (await backend.rpc('affiliate_my_summary')) as AffiliateSummary | null,
  });
}

export function useApplyAffiliate() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (v: { code: string; firstName: string; lastName: string; email: string; country: string; language: string; profile: ProfileType; audience?: number | null; channel?: string }) =>
      backend.rpc('affiliate_apply', {
        p_code: v.code.trim().toLowerCase(), p_first_name: v.firstName.trim(), p_last_name: v.lastName.trim(), p_contact_email: v.email.trim(),
        p_country: v.country.trim().toUpperCase(), p_language: v.language, p_profile_type: v.profile, p_terms_version: AFFILIATE_TERMS_VERSION,
        p_audience_size: v.audience ?? null, p_promo_channel: v.channel?.trim() || null,
      }),
    onSuccess: () => inv('affiliate_summary'),
  });
}

export function useCreateAffiliateLink() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (campaign: string) => backend.rpc('affiliate_create_link', { p_campaign: campaign.trim().toLowerCase(), p_feature: '' }),
    onSuccess: () => inv('affiliate_summary'),
  });
}

// ---------------------------------------------------------------- administration (support / finance)
export function useAllAffiliates(enabled: boolean) {
  return useRows<AffiliateRow>(['affiliates'], enabled ? { table: 'affiliates', order: [{ col: 'created_at', asc: false }] } : null, { enabled });
}
export function useAffiliateLedger(enabled: boolean) {
  return useRows<LedgerRow>(['affiliate_ledger'], enabled ? { table: 'affiliate_ledger' } : null, { enabled });
}
/** Solde disponible par ambassadeur et par devise (seules les écritures « disponibles » comptent). */
export function availableByAffiliate(rows: LedgerRow[]): Map<string, Map<string, number>> {
  const out = new Map<string, Map<string, number>>();
  for (const r of rows) {
    if (r.status !== 'available') continue;
    const m = out.get(r.affiliate_id) ?? new Map<string, number>();
    m.set(r.currency, (m.get(r.currency) ?? 0) + Number(r.amount_minor));
    out.set(r.affiliate_id, m);
  }
  return out;
}
export function useSetAffiliateStatus() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (v: { id: string; status: Exclude<AffiliateStatus, 'pending'>; note?: string }) => backend.rpc('affiliate_set_status', { p_affiliate: v.id, p_status: v.status, p_note: v.note ?? null }),
    onSuccess: () => inv('affiliates'),
  });
}
export function useRecordPayout() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (v: { id: string; currency: string; reference: string }) => backend.rpc('affiliate_record_payout', { p_affiliate: v.id, p_currency: v.currency, p_reference: v.reference.trim() }),
    onSuccess: () => inv('affiliate_ledger'),
  });
}
