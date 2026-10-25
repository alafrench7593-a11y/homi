/**
 * « Sorties près de chez moi » : lieux familiaux Google Places via la fonction serveur `places` (clé côté serveur),
 * photos Google (adresse demandée au serveur au moment de l'affichage). Les contenus Google ne sont jamais
 * enregistrés sur l'appareil (clés « google_places » / « google_photo » exclues du cache persistant) ; la position
 * envoyée est celle de la commune choisie, arrondie à ~1 km.
 */
import { useQuery } from '@tanstack/react-query';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { backend } from '../backend';
import { todayISO } from '../domain/dates';
import { coarse } from '../domain/nearby';
import type { FamilyCategory, FamilyPlace, PlacesState } from '../domain/familyPlaces';
import { commonsApiUrl, OSM_CONFIG, overpassFamilyQuery, parseCommons, parseOsmPlaces, type CommonsImage } from '../domain/osmPlaces';
import type { GooglePlace } from '../../../supabase/functions/_shared/google-places';

/**
 * Fournisseur de la carte et des lieux. Pour le moment : OpenStreetMap (gratuit, sans clé). Google (fond de carte et
 * Places, payants) n'est utilisé que si ses clés de carte sont configurées ET que EXPO_PUBLIC_PLACES_PROVIDER=google.
 */
export type PlacesProvider = 'google' | 'osm';
export function placesProvider(): PlacesProvider {
  return process.env.EXPO_PUBLIC_PLACES_PROVIDER === 'google' && mapsConfigured() ? 'google' : 'osm';
}

async function overpass(query: string, signal: AbortSignal): Promise<Response> {
  let lastRes: Response | null = null;
  let lastErr: unknown = null;
  for (const url of OSM_CONFIG.overpassUrls) {
    try {
      const res = await fetch(url, { method: 'POST', signal, headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }, body: `data=${encodeURIComponent(query)}` });
      if (res.ok || res.status === 400) return res;
      lastRes = res; // serveur saturé ou en erreur : on essaie le serveur de secours
    } catch (e) {
      if (signal.aborted) throw e;
      lastErr = e;
    }
  }
  if (lastRes) return lastRes;
  throw lastErr ?? new Error('overpass');
}

/** Lieux OpenStreetMap (Overpass) : seule la position arrondie (~1 km) de la commune est envoyée. */
async function osmPlaces(center: { lat: number; lon: number }, category: FamilyCategory | 'all', radiusM: number): Promise<{ state: PlacesState; places: FamilyPlace[] }> {
  const c = coarse(center);
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 60_000);
  try {
    const res = await overpass(overpassFamilyQuery(category, c.lat, c.lon, radiusM), ac.signal);
    if (res.status === 429) return { state: 'quota', places: [] };
    if (!res.ok) return { state: 'unavailable', places: [] };
    const day = todayISO();
    return { state: 'ok', places: parseOsmPlaces(await res.json(), category).map((p) => ({ ...p, fetchedOn: day })) };
  } catch {
    return { state: 'unavailable', places: [] };
  } finally { clearTimeout(timer); }
}

const keyOf = (c: { lat: number; lon: number } | null) => (c ? `${c.lat.toFixed(2)},${c.lon.toFixed(2)}` : '');

/** Lieux autour d'un point. category « all » = cafés, restaurants, parcs et activités. */
export function useFamilyPlaces(center: { lat: number; lon: number } | null, category: FamilyCategory | 'all', radiusM: number) {
  const osm = placesProvider() === 'osm';
  const google = useQuery({
    queryKey: ['google_places', keyOf(center), category, radiusM],
    enabled: !!center && !osm,
    staleTime: 15 * 60_000,
    gcTime: 30 * 60_000,
    retry: false,
    queryFn: async (): Promise<{ state: PlacesState; places: FamilyPlace[] }> => {
      const c = coarse(center!);
      try {
        const out = await backend.invoke<{ google: PlacesState; places?: GooglePlace[] }>('places', { category, lat: c.lat, lon: c.lon, radius: radiusM });
        if (out?.google !== 'ok') return { state: (['not_configured', 'invalid_key', 'quota'] as const).find((s) => s === out?.google) ?? 'unavailable', places: [] };
        const day = todayISO();
        return { state: 'ok', places: (out.places ?? []).map((p) => ({ ...p, fetchedOn: day, source: 'google' as const })) };
      } catch {
        return { state: 'unavailable', places: [] };
      }
    },
  });
  // Données ouvertes (licence ODbL) : peuvent rester en cache une journée, un échec n'est jamais gardé
  const free = useQuery({
    queryKey: ['osm_places', keyOf(center), category, radiusM],
    enabled: !!center && osm,
    staleTime: 24 * 3600_000,
    gcTime: 24 * 3600_000,
    retry: false,
    queryFn: async () => {
      const out = await osmPlaces(center!, category, radiusM);
      if (out.state !== 'ok') throw Object.assign(new Error(out.state), { state: out.state });
      return out;
    },
  });
  if (!osm) return google;
  const failed = free.error as (Error & { state?: PlacesState }) | null;
  return { ...free, data: failed ? { state: failed.state ?? 'unavailable', places: [] as FamilyPlace[] } : free.data } as typeof google;
}

/** Photo libre Wikimedia Commons (auteur et licence affichés). */
export function useCommonsPhoto(file: string | null | undefined) {
  return useQuery({
    queryKey: ['osm_commons', file ?? ''],
    enabled: !!file,
    staleTime: 7 * 86400_000,
    retry: false,
    queryFn: async (): Promise<CommonsImage | null> => {
      const res = await fetch(commonsApiUrl(file!));
      if (!res.ok) return null;
      return parseCommons(await res.json());
    },
  });
}

/** Adresse d'affichage d'une photo Google (jamais mise en cache sur l'appareil). */
export function useGooglePhoto(name: string | null, width = 800) {
  return useQuery({
    queryKey: ['google_photo', name ?? '', width],
    enabled: !!name,
    staleTime: 15 * 60_000,
    gcTime: 30 * 60_000,
    retry: false,
    queryFn: async () => {
      const out = await backend.invoke<{ google: PlacesState; photoUri?: string }>('places', { photo: name, maxWidthPx: width });
      return out?.google === 'ok' && out.photoUri ? out.photoUri : null;
    },
  });
}

/** Fond de carte Google : clé native déclarée à la construction (valeur jamais lue), clé web restreinte au site. */
export function mapsConfigured(): boolean {
  if (Platform.OS === 'web') return !!process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY;
  const flags = (Constants.expoConfig?.extra as { googleMapsNative?: { ios?: boolean; android?: boolean } } | undefined)?.googleMapsNative;
  return Platform.OS === 'ios' ? !!flags?.ios : !!flags?.android;
}

/** Vérification réelle de la recherche de lieux (écran développeur) : seul l'état est renvoyé. */
export function usePlacesCheck(enabled: boolean) {
  return useQuery({
    queryKey: ['google_places', 'check'],
    enabled,
    retry: 0,
    queryFn: async () => (await backend.invoke<{ google: PlacesState }>('places', { check: true }))?.google ?? 'unavailable',
  });
}
