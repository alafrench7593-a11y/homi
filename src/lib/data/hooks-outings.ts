/**
 * « Sorties & rencontres » : lieux (OpenStreetMap, Google Places via le serveur, lieux proposés validés), photos
 * (Google ou Wikimedia Commons), rencontres de groupe et inscriptions.
 * Les résultats Google ne sont jamais enregistrés sur l'appareil (clés « google_places » / « google_photo » exclues
 * du cache persistant) ; la position envoyée est celle de la commune choisie, arrondie à ~1 km.
 */
import { useMutation, useQuery } from '@tanstack/react-query';
import { Platform } from 'react-native';
import { backend, eq, inList } from '../backend';
import { useUserId } from '../auth';
import { useInvalidate, useRows } from './hooks';
import { todayISO } from '../domain/dates';
import { coarse, NEARBY_CONFIG } from '../domain/nearby';
import {
  commonsApiUrl, fromGoogle, outingsOverpassQuery, parseCommons, parseOutingsOverpass, osmCategories,
  type CommonsImage, type GooglePlaceDto, type Meetup, type OutingCategory, type OutingPlace, type PlaceSuggestion,
} from '../domain/outings';
import type { ReportReason } from '../types';

const headers = (): Record<string, string> => (Platform.OS === 'web' ? {} : { 'User-Agent': NEARBY_CONFIG.appId });
const keyOf = (c: { lat: number; lon: number } | null) => (c ? `${c.lat.toFixed(3)},${c.lon.toFixed(3)}` : '');

/** Lieux OpenStreetMap des catégories choisies (seule source dessinée sur la carte). */
export function useOsmOutings(center: { lat: number; lon: number } | null, cats: OutingCategory[], radiusM: number) {
  const osm = osmCategories(cats);
  return useQuery({
    queryKey: ['outings', 'osm', keyOf(center), [...osm].sort().join(','), radiusM],
    enabled: !!center && osm.length > 0,
    staleTime: 86400_000,
    gcTime: 86400_000,
    retry: false,
    queryFn: async (): Promise<OutingPlace[]> => {
      const res = await fetch(NEARBY_CONFIG.overpassUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...headers() },
        body: `data=${encodeURIComponent(outingsOverpassQuery(osm, center!.lat, center!.lon, radiusM))}`,
      });
      if (!res.ok) throw new Error(`overpass ${res.status}`);
      return parseOutingsOverpass(await res.json(), osm, todayISO());
    },
  });
}

export type GoogleState = 'ok' | 'not_configured' | 'unavailable';
/** Établissements Google (facultatif) : liste et fiches seulement, jamais sur la carte OpenStreetMap. */
export function useGoogleOutings(center: { lat: number; lon: number } | null, cat: OutingCategory | null, radiusM: number) {
  return useQuery({
    queryKey: ['google_places', keyOf(center), cat ?? '', radiusM],
    enabled: !!center && !!cat && cat !== 'mum_meetups',
    staleTime: 15 * 60_000,
    gcTime: 30 * 60_000,
    retry: false,
    queryFn: async (): Promise<{ state: GoogleState; places: OutingPlace[] }> => {
      const c = coarse(center!);
      try {
        const out = await backend.invoke<{ google: GoogleState; places?: GooglePlaceDto[] }>('places', { category: cat, lat: c.lat, lon: c.lon, radius: radiusM });
        if (out?.google !== 'ok') return { state: out?.google === 'not_configured' ? 'not_configured' : 'unavailable', places: [] };
        return { state: 'ok', places: (out.places ?? []).map((g) => fromGoogle(g, cat!, todayISO())) };
      } catch {
        return { state: 'unavailable', places: [] };
      }
    },
  });
}

/** Adresse d'affichage d'une photo Google (demandée au serveur, jamais mise en cache sur l'appareil). */
export function useGooglePhoto(name: string | null) {
  return useQuery({
    queryKey: ['google_photo', name ?? ''],
    enabled: !!name,
    staleTime: 15 * 60_000,
    gcTime: 30 * 60_000,
    retry: false,
    queryFn: async () => {
      const out = await backend.invoke<{ google: GoogleState; photoUri?: string }>('places', { photo: name, maxWidthPx: 800 });
      return out?.google === 'ok' && out.photoUri ? out.photoUri : null;
    },
  });
}

/** Photo libre de Wikimedia Commons (auteur et licence lus dans les métadonnées). */
export function useCommonsPhoto(file: string | null) {
  return useQuery({
    queryKey: ['outings', 'commons', file ?? ''],
    enabled: !!file,
    staleTime: 7 * 86400_000,
    retry: false,
    queryFn: async (): Promise<CommonsImage | null> => {
      const res = await fetch(commonsApiUrl(file!), { headers: headers() });
      if (!res.ok) throw new Error(`commons ${res.status}`);
      return parseCommons(await res.json());
    },
  });
}

// ─── Lieux proposés par les membres ────────────────────────────────────────────────────────────

export function usePlaceSuggestions() {
  const uid = useUserId();
  return useRows<PlaceSuggestion>(['place_suggestions'], uid ? { table: 'place_suggestions', order: [{ col: 'created_at', asc: false }] } : null);
}
export interface SuggestionInput { name: string; category: OutingCategory; address_public: string; city: string | null; lat: number; lon: number; min_age: number | null; max_age: number | null; equipment: string[]; activities: string | null; hours_text: string | null; website: string | null }
export function useSuggestPlace() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (s: SuggestionInput) => backend.insert('place_suggestions', { ...s }), onSuccess: () => inv('place_suggestions') });
}
export function useModerateSuggestion() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (v: { id: string; status: 'approved' | 'rejected' }) => backend.update('place_suggestions', { status: v.status }, [eq('id', v.id)]), onSuccess: () => inv('place_suggestions') });
}

// ─── Rencontres ────────────────────────────────────────────────────────────────────────────────

export function useMeetups() {
  const uid = useUserId();
  return useRows<Meetup>(['community_meetups'], uid ? { table: 'community_meetups', order: [{ col: 'starts_at', asc: true }] } : null, { staleTime: 30_000 });
}
/** Mes inscriptions (la liste des participantes n'est jamais lisible). */
export function useMyParticipations() {
  const uid = useUserId();
  return useRows<{ meetup_id: string; user_id: string }>(['meetup_participants', uid ?? ''], uid ? { table: 'meetup_participants', filters: [eq('user_id', uid)] } : null);
}
/** Pseudonymes publics des organisatrices (jamais d'autre donnée). */
export function useOrganizers(ids: string[]) {
  const key = [...new Set(ids)].sort();
  return useRows<{ user_id: string; pseudonym: string; handle: string | null }>(['community_profiles', 'organizers', key.join(',')],
    key.length ? { table: 'community_profiles', columns: 'user_id,pseudonym,handle', filters: [inList('user_id', key)] } : null);
}
export interface MeetupInput { title: string; activity: string; place: OutingPlace; startsAt: Date; capacity: number; ageMin: number; ageMax: number; forPregnant: boolean; durationMin: number; cityLabel: string | null }
export function useCreateMeetup() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (m: MeetupInput) => backend.insert<Meetup>('community_meetups', {
      title: m.title.trim(), activity: m.activity.trim(), place_ref: m.place.id, place_name: m.place.name, place_address: m.place.address,
      // lieu public : sa position est celle de l'établissement, jamais celle de la personne
      lat: m.place.lat, lon: m.place.lon, city_label: m.cityLabel, starts_at: m.startsAt.toISOString(), duration_min: m.durationMin,
      child_age_min: m.ageMin, child_age_max: m.ageMax, for_pregnant: m.forPregnant, capacity: m.capacity,
    }),
    onSuccess: () => inv('community_meetups', 'meetup_participants'),
  });
}
export function useJoinMeetup() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (id: string) => backend.insert('meetup_participants', { meetup_id: id }, { returning: 'meetup_id' }), onSuccess: () => inv('community_meetups', 'meetup_participants') });
}
export function useLeaveMeetup() {
  const inv = useInvalidate();
  const uid = useUserId();
  return useMutation({ mutationFn: (id: string) => backend.remove('meetup_participants', [eq('meetup_id', id), eq('user_id', uid)]), onSuccess: () => inv('community_meetups', 'meetup_participants') });
}
export function useCancelMeetup() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (id: string) => backend.update('community_meetups', { status: 'cancelled' }, [eq('id', id)]), onSuccess: () => inv('community_meetups') });
}
export function useReportOuting() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (r: { meetupId?: string; suggestionId?: string; reason: ReportReason; details?: string | null }) =>
      backend.insert('reports', { meetup_id: r.meetupId ?? null, place_suggestion_id: r.suggestionId ?? null, reason: r.reason, details: r.details ?? null }, { returning: 'id' }),
    onSuccess: () => inv('community_meetups', 'moderation_queue'),
  });
}
