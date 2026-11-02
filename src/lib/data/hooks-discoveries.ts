/**
 * Données de « Ses découvertes » (fiche de chaque aliment + historique), de « Je grandis » (étapes observées) et de
 * « Près de chez moi » (lieux publics, favoris personnels, signalements). Chaque requête est filtrée par enfant :
 * les données de Lina et de Noé ne se mélangent jamais.
 */
import { useMutation, useQuery } from '@tanstack/react-query';
import { Platform } from 'react-native';
import { backend, eq } from '../backend';
import { useUserId } from '../auth';
import { useInvalidate, useRows } from './hooks';
import { todayISO } from '../domain/dates';
import type { ChildStep, FoodEntry, FoodStatus, Tasting, Texture } from '../domain/discoveries';
import { NEARBY_CONFIG, geocodeUrl, overpassQuery, parseGeocode, parseOverpass, type Place, type PlaceKind, type Town } from '../domain/nearby';
import type { StepStatus } from '@/content/discoveries/steps';
import { FOOD_BY_KEY, foodNameKey, matchFoodKey } from '@/content/discoveries/foods';

// ─── Aliments ───────────────────────────────────────────────────────────────────────────────────

export function useFoodEntries(childId: string | null | undefined) {
  return useRows<FoodEntry>(['food_introductions', childId ?? ''], childId ? { table: 'food_introductions', filters: [eq('child_id', childId)], order: [{ col: 'food_name' }] } : null);
}
export function useTastings(childId: string | null | undefined) {
  return useRows<Tasting>(['food_tastings', childId ?? ''], childId ? { table: 'food_tastings', filters: [eq('child_id', childId)], order: [{ col: 'tasted_on', asc: false }] } : null);
}

export interface FoodSave {
  child: { id: string; household_id: string };
  food: { key: string | null; name: string };
  existing?: FoodEntry | null;
  status: FoodStatus;
  date: string | null;
  texture: Texture | null;
  preparation: string | null;
  note: string | null;
  reaction: boolean;
  reactionNote: string | null;
  favorite?: boolean;
  /** ajouter une ligne d'historique (une nouvelle proposition) */
  log: boolean;
}

/** Enregistre la fiche (création ou mise à jour) et, si demandé, une ligne d'historique. */
export function useSaveFood() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (v: FoodSave) => {
      const first = v.status === 'not_yet' ? (v.existing?.first_tried_on ?? null)
        : (v.existing?.first_tried_on && v.date && v.existing.first_tried_on < v.date ? v.existing.first_tried_on : v.date);
      const row = {
        status: v.status, first_tried_on: first, texture: v.texture, preparation: v.preparation, note: v.note,
        reaction: v.reaction || !!v.existing?.reaction, reaction_note: v.reactionNote ?? v.existing?.reaction_note ?? null,
        ...(v.favorite != null ? { favorite: v.favorite } : {}),
      };
      // F-02 : une fiche venue d'un repas (sans clé) est reliée au catalogue au lieu d'être recréée en double
      if (v.existing) await backend.update('food_introductions', { ...row, food_key: v.food.key }, [eq('id', v.existing.id)]);
      else await backend.insert('food_introductions', { child_id: v.child.id, household_id: v.child.household_id, food_key: v.food.key, food_name: v.food.name, favorite: v.favorite ?? false, ...row });
      if (v.log && v.status !== 'not_yet' && v.date) {
        await backend.insert('food_tastings', {
          child_id: v.child.id, household_id: v.child.household_id, food_key: v.food.key, food_name: v.food.name, tasted_on: v.date,
          status: v.status, reaction: v.reaction, reaction_note: v.reactionNote, texture: v.texture, preparation: v.preparation, note: v.note,
        });
      }
    },
    onSuccess: () => inv('food_introductions', 'food_tastings'),
  });
}

export function useToggleFoodFavorite() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (v: { child: { id: string; household_id: string }; food: { key: string; name: string }; existing?: FoodEntry | null }) => {
      if (v.existing) await backend.update('food_introductions', { favorite: !v.existing.favorite }, [eq('id', v.existing.id)]);
      else await backend.insert('food_introductions', { child_id: v.child.id, household_id: v.child.household_id, food_key: v.food.key, food_name: v.food.name, status: 'not_yet', favorite: true });
    },
    onSuccess: () => inv('food_introductions'),
  });
}

export function useDeleteFood() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (v: { entry: FoodEntry; withHistory: boolean }) => {
      await backend.remove('food_introductions', [eq('id', v.entry.id)]);
      if (v.withHistory) await backend.remove('food_tastings', [eq('child_id', v.entry.child_id), eq(v.entry.food_key ? 'food_key' : 'food_name', v.entry.food_key ?? v.entry.food_name)]);
    },
    onSuccess: () => inv('food_introductions', 'food_tastings'),
  });
}
export function useDeleteTasting() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (id: string) => backend.remove('food_tastings', [eq('id', id)]), onSuccess: () => inv('food_tastings') });
}

// ─── Étapes ─────────────────────────────────────────────────────────────────────────────────────

export function useChildSteps(childId: string | null | undefined) {
  return useRows<ChildStep>(['child_steps', childId ?? ''], childId ? { table: 'child_steps', filters: [eq('child_id', childId)], order: [{ col: 'updated_at', asc: false }] } : null);
}
export function useSaveStep() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (v: { child: { id: string; household_id: string }; key: string; existing?: ChildStep | null; status: StepStatus; date: string | null; note: string | null }) => {
      const row = { status: v.status, observed_on: v.status === 'observed' ? (v.date ?? todayISO()) : v.date, note: v.note, updated_at: new Date().toISOString() };
      if (v.existing) await backend.update('child_steps', row, [eq('id', v.existing.id)]);
      else await backend.insert('child_steps', { child_id: v.child.id, household_id: v.child.household_id, step_key: v.key, ...row });
    },
    onSuccess: () => inv('child_steps'),
  });
}
export function useDeleteStep() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (id: string) => backend.remove('child_steps', [eq('id', id)]), onSuccess: () => inv('child_steps') });
}

// ─── Près de chez moi ───────────────────────────────────────────────────────────────────────────

const headers = (): Record<string, string> => (Platform.OS === 'web' ? {} : { 'User-Agent': NEARBY_CONFIG.appId });

/** Recherche de commune (ville ou code postal). */
export function useTownSearch(q: string) {
  const v = q.trim();
  return useQuery({
    queryKey: ['nearby', 'town', v.toLowerCase()],
    enabled: v.length >= 2,
    staleTime: 7 * 86400_000,
    retry: false,
    queryFn: async (): Promise<Town[]> => {
      const res = await fetch(geocodeUrl(v), { headers: headers() });
      if (!res.ok) throw new Error(`geocode ${res.status}`);
      return parseGeocode(await res.json());
    },
  });
}

/** Lieux publics autour d'un point (commune choisie), mis en cache une journée pour respecter les politiques d'usage. */
export function useNearbyPlaces(center: { lat: number; lon: number } | null, kinds: PlaceKind[], radiusM: number) {
  const k = [...kinds].sort().join(',');
  return useQuery({
    queryKey: ['nearby', 'places', center ? `${center.lat.toFixed(3)},${center.lon.toFixed(3)}` : '', k, radiusM],
    enabled: !!center && kinds.length > 0,
    staleTime: 86400_000,
    gcTime: 86400_000,
    retry: false,
    queryFn: async (): Promise<Place[]> => {
      const res = await fetch(NEARBY_CONFIG.overpassUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...headers() },
        body: `data=${encodeURIComponent(overpassQuery(kinds, center!.lat, center!.lon, radiusM))}`,
      });
      if (!res.ok) throw new Error(`overpass ${res.status}`);
      return parseOverpass(await res.json(), todayISO());
    },
  });
}

export interface PlaceFavorite { id: string; user_id: string; place_id: string; name: string; kind: PlaceKind; address: string | null; lat: number | null; lon: number | null; source: string | null; created_at: string }
export function usePlaceFavorites() {
  const uid = useUserId();
  return useRows<PlaceFavorite>(['place_favorites', uid ?? ''], uid ? { table: 'place_favorites', filters: [eq('user_id', uid)], order: [{ col: 'created_at', asc: false }] } : null);
}
export function useTogglePlaceFavorite() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (v: { place: Pick<Place, 'id' | 'name' | 'address' | 'lat' | 'lon'> & { kind: string; source: string }; existing?: PlaceFavorite | null }) => {
      if (v.existing) await backend.remove('place_favorites', [eq('id', v.existing.id)]);
      else await backend.insert('place_favorites', { place_id: v.place.id, name: v.place.name, kind: v.place.kind, address: v.place.address, lat: v.place.lat, lon: v.place.lon, source: v.place.source });
    },
    onSuccess: () => inv('place_favorites'),
  });
}
export type ReportReason = 'closed' | 'hours' | 'address' | 'contact' | 'accessibility' | 'not_family' | 'other';
export function useReportPlace() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (v: { placeId: string; placeName: string; reason: ReportReason; comment: string | null }) =>
      backend.insert('place_reports', { place_id: v.placeId, place_name: v.placeName, reason: v.reason, comment: v.comment }),
    onSuccess: () => inv('place_reports'),
  });
}

/**
 * Premiers aliments notés dans un repas (QA 02/11/2026, F-02) : reliés au catalogue quand c'est possible,
 * jamais en double (même aliment déjà présent par sa clé OU par son nom), un aliment refusé n'empêche pas les autres.
 */
export async function recordMealFoods(child: { id: string; household_id: string }, names: string[], date: string, reactionNote: string | null): Promise<number> {
  const existing = await backend.select<{ food_key: string | null; food_name: string }>({ table: 'food_introductions', columns: 'food_key,food_name', filters: [eq('child_id', child.id)] });
  const keys = new Set(existing.map((e) => e.food_key ?? matchFoodKey(e.food_name)).filter(Boolean) as string[]);
  const nameKeys = new Set(existing.map((e) => foodNameKey(e.food_name)));
  let added = 0;
  for (const raw of names) {
    const name = raw.trim();
    if (!name) continue;
    const key = matchFoodKey(name);
    const def = key ? FOOD_BY_KEY[key] : null;
    const label = def?.name ?? name;
    if ((key && keys.has(key)) || nameKeys.has(foodNameKey(label)) || nameKeys.has(foodNameKey(name))) continue;
    try {
      await backend.insert('food_introductions', { child_id: child.id, household_id: child.household_id, food_name: label, food_key: key, first_tried_on: date, reaction_note: reactionNote });
      added++;
      if (key) keys.add(key);
      nameKeys.add(foodNameKey(label));
    } catch { /* limite gratuite ou doublon : les autres aliments sont quand même enregistrés */ }
  }
  return added;
}
