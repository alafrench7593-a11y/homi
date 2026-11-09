/**
 * Hooks du scanner (produits et aliments). Les droits et le quota sont vérifiés côté serveur
 * (RLS, déclencheur de quota) ; ici on ne fait que refléter l'état.
 */
import { inLang, localized } from '@/i18n/localized';
import { t as tr } from '@/i18n';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';
import { backend, BackendError, eq, isDemo } from '../backend';
import { useAuth, useUserId } from '../auth';
import { childAge } from '../domain/child';
import type { ScanProfile } from '../domain/scanCommon';
import { buildExplainPayload, type ScanAnalysis } from '../domain/scanExplain';
import type {
  CiqualFood, CosingIngredient, ExplainResponse, FoodRef, LookupResponse, ProductSnapshot, QuotaStatus, ScanFavoriteRow, ScanKind, ScanMethod,
  ScanResultRow, ScanRow, SearchResponse,
} from '../types-scanner';
import { useActivePregnancy, useChildren, useInvalidate, useRows } from './hooks';

// ---------------------------------------------------------------- profils proposés
export interface ProfileOption { key: string; label: string; sub?: string; profile: ScanProfile }

const MY_PREGNANCY = { fr: 'Ma grossesse', en: 'My pregnancy', es: 'Mi embarazo', de: 'Meine Schwangerschaft', it: 'La mia gravidanza' };
const PREGNANT_PERSON = { fr: 'Personne enceinte', en: 'Pregnant person', es: 'Persona embarazada', de: 'Schwangere Person', it: 'Persona in gravidanza' };

/** Profils pré-remplis : grossesse en cours, enfants du foyer (âge exact, allergies déclarées), puis profils génériques. */
export function useScanProfileOptions(): ProfileOption[] {
  const pregnancy = useActivePregnancy();
  const { data: children } = useChildren();
  return useMemo(() => {
    const out: ProfileOption[] = [];
    if (pregnancy) out.push({ key: 'pregnancy', label: inLang(MY_PREGNANCY), sub: inLang(PREGNANT_PERSON), profile: { kind: 'pregnant' } });
    for (const c of children ?? []) {
      const months = childAge(c.birth_date).months;
      const kind = months < 1 ? 'newborn' : months < 36 ? 'baby' : 'child';
      out.push({
        key: `child:${c.id}`, label: c.first_name, sub: kind === 'newborn' ? tr('l3.scanner.newborn') : kind === 'baby' ? tr('l3.scanner.baby_months', { months }) : tr('l3.scanner.child_years', { years: Math.floor(months / 12) }),
        profile: { kind, ageMonths: months, allergies: c.allergies_declared ?? [] },
      });
    }
    return out;
  }, [pregnancy, children]);
}

/** Profils génériques (sans lien avec un membre du foyer). L'âge exact est demandé pour bébé et enfant. */
const GENERIC_PROFILES_FR: { key: string; label: string; kind: ScanProfile['kind']; needsAge: boolean }[] = [
  { key: 'g:pregnant', label: 'Personne enceinte', kind: 'pregnant', needsAge: false },
  { key: 'g:breastfeeding', label: 'Personne qui allaite', kind: 'breastfeeding', needsAge: false },
  { key: 'g:newborn', label: 'Nouveau-né (moins d’un mois)', kind: 'newborn', needsAge: false },
  { key: 'g:baby', label: 'Bébé (moins de 3 ans)', kind: 'baby', needsAge: true },
  { key: 'g:child', label: 'Enfant (3 ans et plus)', kind: 'child', needsAge: true },
  { key: 'g:adult', label: 'Adulte', kind: 'adult', needsAge: false },
];
const GENERIC_PROFILES_EN: { key: string; label: string; kind: ScanProfile['kind']; needsAge: boolean }[] = [
  { key: 'g:pregnant', label: 'Pregnant person', kind: 'pregnant', needsAge: false },
  { key: 'g:breastfeeding', label: 'Breastfeeding person', kind: 'breastfeeding', needsAge: false },
  { key: 'g:newborn', label: 'Newborn (under 1 month)', kind: 'newborn', needsAge: false },
  { key: 'g:baby', label: 'Baby (under 3 years)', kind: 'baby', needsAge: true },
  { key: 'g:child', label: 'Child (3 years and over)', kind: 'child', needsAge: true },
  { key: 'g:adult', label: 'Adult', kind: 'adult', needsAge: false },
];
const GENERIC_PROFILES_ES: { key: string; label: string; kind: ScanProfile['kind']; needsAge: boolean }[] = [
  { key: 'g:pregnant', label: 'Persona embarazada', kind: 'pregnant', needsAge: false },
  { key: 'g:breastfeeding', label: 'Persona que da el pecho', kind: 'breastfeeding', needsAge: false },
  { key: 'g:newborn', label: 'Recién nacido (menos de un mes)', kind: 'newborn', needsAge: false },
  { key: 'g:baby', label: 'Bebé (menos de 3 años)', kind: 'baby', needsAge: true },
  { key: 'g:child', label: 'Niño o niña (3 años o más)', kind: 'child', needsAge: true },
  { key: 'g:adult', label: 'Adulto', kind: 'adult', needsAge: false },
];
const GENERIC_PROFILES_DE: { key: string; label: string; kind: ScanProfile['kind']; needsAge: boolean }[] = [
  { key: 'g:pregnant', label: 'Schwangere Person', kind: 'pregnant', needsAge: false },
  { key: 'g:breastfeeding', label: 'Stillende Person', kind: 'breastfeeding', needsAge: false },
  { key: 'g:newborn', label: 'Neugeborenes (unter einem Monat)', kind: 'newborn', needsAge: false },
  { key: 'g:baby', label: 'Baby (unter 3 Jahren)', kind: 'baby', needsAge: true },
  { key: 'g:child', label: 'Kind (ab 3 Jahren)', kind: 'child', needsAge: true },
  { key: 'g:adult', label: 'Erwachsene Person', kind: 'adult', needsAge: false },
];
const GENERIC_PROFILES_IT: { key: string; label: string; kind: ScanProfile['kind']; needsAge: boolean }[] = [
  { key: 'g:pregnant', label: 'Persona in gravidanza', kind: 'pregnant', needsAge: false },
  { key: 'g:breastfeeding', label: 'Persona che allatta', kind: 'breastfeeding', needsAge: false },
  { key: 'g:newborn', label: 'Neonato (meno di un mese)', kind: 'newborn', needsAge: false },
  { key: 'g:baby', label: 'Bebè (meno di 3 anni)', kind: 'baby', needsAge: true },
  { key: 'g:child', label: 'Bambino (3 anni e più)', kind: 'child', needsAge: true },
  { key: 'g:adult', label: 'Adulto', kind: 'adult', needsAge: false },
];
export const GENERIC_PROFILES: { key: string; label: string; kind: ScanProfile['kind']; needsAge: boolean }[] = localized(GENERIC_PROFILES_FR, GENERIC_PROFILES_EN, { es: GENERIC_PROFILES_ES, de: GENERIC_PROFILES_DE, it: GENERIC_PROFILES_IT });

// ---------------------------------------------------------------- historique
export function useScanHistory(kind?: ScanKind) {
  const userId = useUserId();
  const filters = userId ? [eq('user_id', userId), ...(kind ? [eq('kind', kind)] : [])] : [];
  const q = useRows<ScanRow>(['product_scans', 'history', kind ?? 'all'], userId ? { table: 'product_scans', filters, order: [{ col: 'created_at', asc: false }], limit: 200 } : null);
  // Seules les analyses terminées apparaissent dans l'historique (les simples recherches non)
  return { ...q, data: q.data?.filter((s) => s.analysed_at) };
}

export function useScan(id: string | null | undefined) {
  const q = useRows<ScanRow>(['product_scans', 'one', id ?? ''], id ? { table: 'product_scans', filters: [eq('id', id)] } : null);
  const r = useRows<ScanResultRow>(['scan_results', id ?? ''], id ? { table: 'scan_results', filters: [eq('scan_id', id)] } : null);
  return { scan: q.data?.[0] ?? null, result: r.data?.[0] ?? null, isLoading: q.isLoading || r.isLoading, error: q.error ?? r.error, refetch: () => { q.refetch(); r.refetch(); } };
}

export function useScanFavorites() {
  const userId = useUserId();
  const q = useRows<ScanFavoriteRow>(['scan_favorites'], userId ? { table: 'scan_favorites', filters: [eq('user_id', userId)], order: [{ col: 'created_at', asc: false }] } : null);
  const ids = useMemo(() => new Set((q.data ?? []).map((f) => f.scan_id)), [q.data]);
  return { ...q, ids };
}

export function useToggleScanFavorite() {
  const inv = useInvalidate();
  const userId = useUserId();
  return useMutation({
    mutationFn: async (a: { scanId: string; favorite: boolean }) => {
      if (a.favorite) await backend.insert('scan_favorites', { user_id: userId, scan_id: a.scanId }, { onConflict: 'user_id,scan_id', ignoreDuplicates: true });
      else await backend.remove('scan_favorites', [eq('user_id', userId), eq('scan_id', a.scanId)]);
    },
    onSuccess: () => inv('scan_favorites'),
  });
}

export function useDeleteScan() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => backend.remove('product_scans', [eq('id', id)]),
    onSuccess: () => inv('product_scans', 'scan_favorites', 'scan_results'),
  });
}

export function useDeleteAllScans() {
  const inv = useInvalidate();
  const userId = useUserId();
  return useMutation({
    mutationFn: () => backend.remove('product_scans', [eq('user_id', userId)]),
    onSuccess: () => inv('product_scans', 'scan_favorites', 'scan_results'),
  });
}

// ---------------------------------------------------------------- quota (rappels toujours gratuits)
export function useScanQuota() {
  const { session } = useAuth();
  return useQuery({
    queryKey: [session?.userId, 'scan_usage', 'product_scans', 'subscriptions'],
    queryFn: async () => {
      const r = await backend.rpc<QuotaStatus[] | QuotaStatus>('scan_quota_status');
      return (Array.isArray(r) ? r[0] : r) ?? { used: 0, quota: 10, remaining: 10 };
    },
    enabled: !!session,
    staleTime: 15_000,
  });
}

// ---------------------------------------------------------------- recherche, rappels
export function useLookupBarcode() {
  return useMutation({ mutationFn: (a: { barcode: string; kind: ScanKind }) => backend.invoke<LookupResponse>('product-lookup', { barcode: a.barcode, kind: a.kind }) });
}

export function useSearchProducts() {
  return useMutation({ mutationFn: (a: { query: string; kind: 'product' | 'food' }) => backend.invoke<SearchResponse>('product-lookup', { action: 'search', query: a.query, kind: a.kind }) });
}

export function useCheckRecalls() {
  return useMutation({
    mutationFn: (a: { barcode?: string | null; brand?: string | null; name?: string | null }) =>
      backend.invoke<Pick<LookupResponse, 'recalls' | 'recall_check'>>('product-lookup', { action: 'recalls', ...a }),
  });
}

/** Une fois par session : vérifie les rappels des produits de l'historique et des favoris (notifications côté serveur). */
export function useRecallWatch() {
  const { session } = useAuth();
  const inv = useInvalidate();
  const done = useRef(false);
  useEffect(() => {
    if (!session || done.current) return;
    done.current = true;
    backend.invoke('product-lookup', { action: 'recall_watch' }).then(() => inv('notifications')).catch(() => undefined);
  }, [session, inv]);
}

export async function lookupCosing(names: string[]): Promise<CosingIngredient[]> {
  if (!names.length) return [];
  try {
    return await backend.rpc<CosingIngredient[]>('cosing_lookup', { p_names: names.slice(0, 200) });
  } catch {
    return [];
  }
}

export async function searchCiqual(query: string): Promise<CiqualFood[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  try {
    return await backend.select<CiqualFood>({ table: 'ciqual_foods', filters: [{ col: 'nom', op: 'ilike', value: `%${q.replace(/[%_]/g, '')}%` }], limit: 8 });
  } catch {
    return [];
  }
}

export function useFoodsCatalog() {
  return useRows<FoodRef>(['foods'], { table: 'foods', order: [{ col: 'name' }] }, { staleTime: 3600_000 });
}

// ---------------------------------------------------------------- enregistrement d'une analyse
export interface SaveAnalysisInput {
  kind: ScanKind;
  method: ScanMethod;
  barcode: string | null;
  productId?: string | null;
  foodId?: string | null;
  snapshot: ProductSnapshot;
  analysis: ScanAnalysis;
}

export class QuotaReachedError extends Error {
  constructor() { super(tr('l3.scanner.quota')); }
}

export function useSaveAnalysis() {
  const inv = useInvalidate();
  const userId = useUserId();
  return useMutation({
    mutationFn: async (a: SaveAnalysisInput): Promise<string> => {
      const an = a.analysis;
      let rows: ScanRow[];
      try {
        rows = await backend.insert<ScanRow>('product_scans', {
          user_id: userId, kind: a.kind, method: a.method, barcode: a.barcode, product_id: a.productId ?? null, food_id: a.foodId ?? null, confirmed: true,
          product_snapshot: a.snapshot, target_profile: an.profile.kind, target_age_months: an.profile.ageMonths ?? null,
          answers: an.kind === 'food' ? an.answers : {}, verdict: an.verdict, certainty: an.certainty, sources: an.sources.map((s) => s.id),
          is_demo: an.demo, analysed_at: new Date().toISOString(),
        });
      } catch (e) {
        if (e instanceof BackendError && e.isPremiumRequired) throw new QuotaReachedError();
        throw e;
      }
      const scan = rows[0];
      await backend.insert('scan_results', { user_id: userId, scan_id: scan.id, engine_version: an.engineVersion, result: an });
      return scan.id;
    },
    onSuccess: () => inv('product_scans', 'scan_usage', 'notifications'),
  });
}

// ---------------------------------------------------------------- explication IA (Gemini, côté serveur)
export function useExplainScan() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (a: { analysis: ScanAnalysis; scanId?: string | null }): Promise<ExplainResponse> => {
      try {
        return await backend.invoke<ExplainResponse>('scan-explain', { ...buildExplainPayload(a.analysis), scan_id: a.scanId ?? null });
      } catch {
        return { ai: 'unavailable', message: tr('l3.scanner.ai_unavailable') };
      }
    },
    onSuccess: () => inv('scan_results'),
  });
}

export const scannerIsDemo = isDemo;
