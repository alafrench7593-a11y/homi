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
import type { GooglePlace } from '../../../supabase/functions/_shared/google-places';

const keyOf = (c: { lat: number; lon: number } | null) => (c ? `${c.lat.toFixed(2)},${c.lon.toFixed(2)}` : '');

/** Lieux autour d'un point. category « all » = cafés, restaurants, parcs et activités. */
export function useFamilyPlaces(center: { lat: number; lon: number } | null, category: FamilyCategory | 'all', radiusM: number) {
  return useQuery({
    queryKey: ['google_places', keyOf(center), category, radiusM],
    enabled: !!center,
    staleTime: 15 * 60_000,
    gcTime: 30 * 60_000,
    retry: false,
    queryFn: async (): Promise<{ state: PlacesState; places: FamilyPlace[] }> => {
      const c = coarse(center!);
      try {
        const out = await backend.invoke<{ google: PlacesState; places?: GooglePlace[] }>('places', { category, lat: c.lat, lon: c.lon, radius: radiusM });
        if (out?.google !== 'ok') return { state: (['not_configured', 'invalid_key', 'quota'] as const).find((s) => s === out?.google) ?? 'unavailable', places: [] };
        const day = todayISO();
        return { state: 'ok', places: (out.places ?? []).map((p) => ({ ...p, fetchedOn: day })) };
      } catch {
        return { state: 'unavailable', places: [] };
      }
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
