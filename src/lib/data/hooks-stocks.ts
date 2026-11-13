/**
 * Courses et stocks du foyer (15/11/2026, phase 6) : lecture des stocks (source de vérité : household_stocks, partagée,
 * temps réel), saisie hors ligne (client_id), modifications versionnées (update_if_version), réapprovisionnement
 * (stock_restock), validation d'achat (stock_validate_purchase), fusion de doublons (merge_shopping_items) et migration
 * douce de l'ancien garde-manger local. Voir HOMI_SHOPPING_STOCKS_SPEC.md.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { t as tr } from '@/i18n';
import { backend, BackendError, eq, inList } from '../backend';
import { insertOrQueue } from '../offline';
import { updateIfVersion } from '../offlineConflicts';
import { useUiStore } from '../store';
import { uuid } from '../uuid';
import { INGREDIENTS } from '../recipes/ingredients';
import { useHouseholdId, useInvalidate, useRows } from './hooks';
import { pantryClientId, pantryKeysOf, pantryMigrationRows, sortStocks, type Stock, type StockCategory, type StockUnit } from '../domain/stocks';
import type { Mission } from '../domain/missions';

const INVALIDATE = ['household_stocks', 'household_events', 'shopping_items', 'shopping_lists', 'family_tasks', 'family_task_events', 'notifications'] as const;

export function useStocks() {
  const hid = useHouseholdId();
  const q = useRows<Stock>(['household_stocks', hid ?? ''], hid ? { table: 'household_stocks', filters: [eq('household_id', hid)], order: [{ col: 'label' }], limit: 500 } : null);
  const all = useMemo(() => sortStocks(q.data ?? []), [q.data]);
  return { ...q, all, hid };
}
export function useStock(id: string | undefined) {
  const s = useStocks();
  return { ...s, stock: s.all.find((x) => x.id === id) ?? null };
}

export interface StockInput {
  label: string; category: StockCategory; brand?: string | null; size?: string | null; qty_estimate?: number | null; unit?: StockUnit | null;
  threshold?: number | null; frequency_days?: number | null; responsible_id?: string | null; reminder?: boolean; child_id?: string | null; notes?: string | null;
}

/** Nouveau stock : client_id posé sur l'appareil → envoyé au retour du réseau, sans doublon. */
export function useAddStock() {
  const hid = useHouseholdId();
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (v: StockInput) => {
      if (!hid) throw new Error(tr('l3.familyload.need_household'));
      const client_id = uuid();
      await insertOrQueue('household_stocks', { client_id, household_id: hid, reminder: true, ...v });
      return client_id;
    },
    onSuccess: () => inv(...INVALIDATE),
  });
}

/** Modification d'un stock lue à une version : rien n'est écrasé si quelqu'un l'a changé entre-temps. */
export function useUpdateStock() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (v: { id: string; version: number; patch: Partial<StockInput> }) => {
      const out = await updateIfVersion<Stock>('household_stocks', v.id, v.version, v.patch as Record<string, unknown>);
      if (out.status === 'conflict') throw new BackendError(tr('stk.err.conflict'), 'conflict');
      if (out.status !== 'ok') throw new BackendError(tr('stk.err.notFound'), out.status);
      return out.row;
    },
    onSettled: () => inv(...INVALIDATE),
  });
}

export function useDeleteStock() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (id: string) => backend.remove('household_stocks', [eq('id', id)]), onSuccess: () => inv(...INVALIDATE) });
}

type RpcResult = { status: 'ok' | 'not_found' | 'conflict'; unchanged?: boolean; row?: Stock; task?: Mission };
const checked = (out: RpcResult) => {
  if (out?.status === 'not_found') throw new BackendError(tr('stk.err.notFound'), 'not_found');
  if (out?.status === 'conflict') throw new BackendError(tr('stk.err.conflict'), 'conflict');
  return out;
};

/** Suggestion de réapprovisionnement : « confirm » crée la mission (jamais automatiquement), « dismiss » l'écarte. */
export function useRestock() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (v: { id: string; action: 'confirm' | 'dismiss'; assignee_id?: string | null; version?: number }) =>
      checked(await backend.rpc<RpcResult>('stock_restock', { p_stock: v.id, p_action: v.action, p_assignee: v.assignee_id ?? null, p_title: null, p_due_at: null, p_expected_version: v.version ?? null })),
    onSuccess: () => inv(...INVALIDATE),
  });
}

/** Achat validé explicitement : la quantité estimée change ici, jamais au simple cochage. */
export function useValidatePurchase() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (v: { id: string; qty: number; mode: 'add' | 'set'; version?: number }) =>
      checked(await backend.rpc<RpcResult>('stock_validate_purchase', { p_stock: v.id, p_qty: v.qty, p_mode: v.mode, p_expected_version: v.version ?? null })),
    onSuccess: () => inv(...INVALIDATE),
  });
}

/** Deux articles identiques (souvent ajoutés sur deux téléphones) : un seul reste, ses liens (mission, stock) sont repris. */
export function useMergeShoppingItems() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (v: { keep: string; drop: string }) => checked(await backend.rpc<RpcResult>('merge_shopping_items', { p_keep: v.keep, p_drop: v.drop })),
    onSuccess: () => inv(...INVALIDATE),
  });
}

// ---------------------------------------------------------------- garde-manger (« Que puis-je cuisiner ? ») : serveur
const ingredientName = (k: string) => INGREDIENTS[k]?.name ?? k;

/** Ingrédients à la maison, lus dans l'inventaire du foyer (partagé) ; cocher / décocher écrit sur le serveur. */
export function usePantry() {
  const { all, hid, isLoading } = useStocks();
  const inv = useInvalidate();
  const keys = useMemo(() => pantryKeysOf(all), [all]);
  const set = useMutation({
    mutationFn: async (next: string[]) => {
      if (!hid) return;
      const now = new Set(keys);
      const want = new Set(next);
      for (const k of next) if (!now.has(k)) {
        const gone = all.find((s) => s.ingredient_key === k);
        if (gone) await backend.update('household_stocks', { qty_estimate: null }, [eq('id', gone.id)]);
        else await insertOrQueue('household_stocks', { client_id: pantryClientId(hid, k), household_id: hid, label: ingredientName(k).slice(0, 80), category: 'food', ingredient_key: k, source: 'pantry' });
      }
      const drop = all.filter((s) => s.ingredient_key && now.has(s.ingredient_key) && !want.has(s.ingredient_key));
      if (drop.length) await backend.remove('household_stocks', [inList('id', drop.map((s) => s.id))]);
    },
    onSuccess: () => inv('household_stocks'),
  });
  return { keys, setKeys: (next: string[]) => set.mutateAsync(next), loading: isLoading, pending: set.isPending };
}

/**
 * Migration douce de l'ancien garde-manger local (Zustand) vers le serveur, à la première synchronisation du foyer :
 * une ligne par ingrédient absent (client_id déterministe → aucun doublon, même depuis deux appareils ou rejouée),
 * puis la copie locale est vidée et le foyer marqué « migré ». En cas d'échec, rien n'est vidé (nouvel essai plus tard).
 */
export function usePantryMigration() {
  const hid = useHouseholdId();
  const local = useUiStore((s) => s.pantry);
  const migrated = useUiStore((s) => s.pantryMigrated);
  const q = useRows<Pick<Stock, 'id' | 'ingredient_key'>>(['household_stocks', 'pantry', hid ?? ''], hid && local.length && !migrated.includes(hid)
    ? { table: 'household_stocks', columns: 'id,ingredient_key', filters: [eq('household_id', hid)], limit: 500 } : null);
  const inv = useInvalidate();
  const running = useRef(false);
  useEffect(() => {
    if (!hid || !local.length || migrated.includes(hid) || !q.data || running.current) return;
    running.current = true;
    const rows = pantryMigrationRows(local, hid, q.data, ingredientName);
    (async () => {
      try {
        for (const r of rows) await insertOrQueue('household_stocks', { ...r });
        useUiStore.getState().setPantryMigrated(hid);
        useUiStore.getState().setPantry([]);
        inv('household_stocks');
      } catch { /* nouvel essai à la prochaine ouverture : la copie locale est gardée */ } finally { running.current = false; }
    })();
  }, [hid, local, migrated, q.data]); // eslint-disable-line react-hooks/exhaustive-deps
}
