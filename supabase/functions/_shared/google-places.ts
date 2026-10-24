/**
 * Google Places API (New) — logique pure, partagée entre la fonction serveur `places` et les tests.
 * Documentation consultée le 24/10/2026 :
 *  · Nearby Search (New) : POST https://places.googleapis.com/v1/places:searchNearby (includedTypes, maxResultCount 1–20,
 *    locationRestriction.circle { center { latitude, longitude }, radius ≤ 50000 }, languageCode, rankPreference) ;
 *  · Text Search (New) : POST https://places.googleapis.com/v1/places:searchText (textQuery, locationBias.circle,
 *    pageSize 1–20, languageCode, regionCode) ;
 *  · en-têtes X-Goog-Api-Key et X-Goog-FieldMask (liste sans espace) ;
 *  · Place Photos (New) : GET https://places.googleapis.com/v1/{name}/media?maxWidthPx=…&skipHttpRedirect=true&key=…
 *    -> { name, photoUri }.
 * Conditions (Service Specific Terms, 15/10/2026) : contenus Google jamais affichés sur une carte non Google (ils ne
 * vont que dans la liste et les fiches), mention « Google Maps » à côté, auteurs des photos crédités, lien vers la fiche
 * Google Maps, et aucun stockage (seul l'identifiant de lieu peut l'être).
 * La clé (GOOGLE_PLACES_API_KEY) n'existe que côté serveur.
 */
export const GOOGLE_PLACES_BASE = 'https://places.googleapis.com/v1';

export const GOOGLE_FIELD_MASK = [
  'places.id', 'places.displayName', 'places.formattedAddress', 'places.location', 'places.primaryType', 'places.primaryTypeDisplayName',
  'places.regularOpeningHours.weekdayDescriptions', 'places.nationalPhoneNumber', 'places.websiteUri', 'places.googleMapsUri',
  'places.goodForChildren', 'places.menuForChildren', 'places.accessibilityOptions', 'places.photos',
].join(',');

type Search = { nearby: string[]; filterChildren?: boolean } | { text: string };
/** Recherche Google par catégorie de « Sorties & rencontres » (null : pas de recherche Google pour cette catégorie). */
export const GOOGLE_SEARCH: Record<string, Search | null> = {
  parks: { nearby: ['park', 'playground'] },
  family_food: { nearby: ['cafe', 'restaurant'], filterChildren: true },
  mum_baby: { text: 'activités bébé parents' },
  workshops: { text: 'atelier parents enfants' },
  culture: { nearby: ['library', 'museum'] },
  laep: { text: 'lieu d’accueil enfants parents' },
  parents_groups: { text: 'association de parents' },
  mum_meetups: null, // rencontres proposées par les membres uniquement
  pregnancy: { text: 'préparation à la naissance' },
  big_families: { nearby: ['zoo', 'aquarium', 'amusement_park', 'park'] },
  support: { text: 'PMI protection maternelle et infantile' },
};

export interface PlacesQuery { category: string; lat: number; lon: number; radius: number }

/** Position arrondie (~1 km) : jamais de position précise envoyée à Google. */
export const coarseLatLon = (v: number) => Math.round(v * 100) / 100;

export function validQuery(b: unknown): PlacesQuery | null {
  const q = (b ?? {}) as Record<string, unknown>;
  const lat = Number(q.lat), lon = Number(q.lon), radius = Number(q.radius);
  if (typeof q.category !== 'string' || !(q.category in GOOGLE_SEARCH)) return null;
  if (!(Number.isFinite(lat) && lat >= -90 && lat <= 90 && Number.isFinite(lon) && lon >= -180 && lon <= 180)) return null;
  if (!(Number.isFinite(radius) && radius >= 200 && radius <= 20000)) return null;
  return { category: q.category, lat: coarseLatLon(lat), lon: coarseLatLon(lon), radius: Math.round(radius) };
}

export function buildSearch(q: PlacesQuery): { url: string; body: Record<string, unknown> } | null {
  const s = GOOGLE_SEARCH[q.category];
  if (!s) return null;
  const circle = { center: { latitude: q.lat, longitude: q.lon }, radius: q.radius };
  if ('nearby' in s) {
    return { url: `${GOOGLE_PLACES_BASE}/places:searchNearby`, body: { includedTypes: s.nearby, maxResultCount: 20, languageCode: 'fr', rankPreference: 'DISTANCE', locationRestriction: { circle } } };
  }
  return { url: `${GOOGLE_PLACES_BASE}/places:searchText`, body: { textQuery: s.text, pageSize: 20, languageCode: 'fr', regionCode: 'FR', locationBias: { circle } } };
}

export interface GoogleAttribution { displayName: string; uri: string | null }
export interface GooglePlace {
  id: string; // « google:<place id> »
  name: string;
  typeLabel: string | null;
  address: string | null;
  lat: number;
  lon: number;
  hours: string[];
  phone: string | null;
  website: string | null;
  mapsUri: string | null;
  goodForChildren: boolean | null;
  menuForChildren: boolean | null;
  wheelchairEntrance: boolean | null;
  photo: { name: string; attributions: GoogleAttribution[] } | null;
}

const https = (u: unknown) => (typeof u === 'string' && /^https:\/\/[^\s]+$/i.test(u) ? u : null);
const bool = (v: unknown) => (typeof v === 'boolean' ? v : null);
const str = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);

// deno-lint-ignore no-explicit-any
export function parseGooglePlaces(json: any, category: string): GooglePlace[] {
  const out: GooglePlace[] = [];
  const s = GOOGLE_SEARCH[category];
  for (const p of (json?.places ?? []) as Record<string, any>[]) { // eslint-disable-line @typescript-eslint/no-explicit-any
    const lat = Number(p?.location?.latitude), lon = Number(p?.location?.longitude);
    const name = str(p?.displayName?.text, 160);
    if (typeof p?.id !== 'string' || !/^[A-Za-z0-9_-]{10,200}$/.test(p.id) || !name || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const goodForChildren = bool(p.goodForChildren), menuForChildren = bool(p.menuForChildren);
    // Cafés et restaurants : seulement ceux que Google indique adaptés aux enfants (jamais supposé)
    if (s && 'nearby' in s && s.filterChildren && goodForChildren !== true && menuForChildren !== true) continue;
    const ph = Array.isArray(p.photos) ? p.photos[0] : null;
    const photoName = typeof ph?.name === 'string' && validPhotoName(ph.name) ? ph.name : null;
    out.push({
      id: `google:${p.id}`, name, typeLabel: str(p?.primaryTypeDisplayName?.text, 60), address: str(p.formattedAddress, 240), lat, lon,
      hours: Array.isArray(p?.regularOpeningHours?.weekdayDescriptions) ? p.regularOpeningHours.weekdayDescriptions.filter((x: unknown) => typeof x === 'string').slice(0, 7) : [],
      phone: str(p.nationalPhoneNumber, 40), website: https(p.websiteUri), mapsUri: https(p.googleMapsUri),
      goodForChildren, menuForChildren, wheelchairEntrance: bool(p?.accessibilityOptions?.wheelchairAccessibleEntrance),
      photo: photoName ? {
        name: photoName,
        attributions: (Array.isArray(ph.authorAttributions) ? ph.authorAttributions : []).flatMap((a: Record<string, unknown>) => (typeof a?.displayName === 'string' ? [{ displayName: a.displayName.slice(0, 80), uri: https(a.uri) }] : [])),
      } : null,
    });
  }
  return out;
}

export const validPhotoName = (n: unknown): n is string => typeof n === 'string' && /^places\/[A-Za-z0-9_-]{10,200}\/photos\/[A-Za-z0-9_-]{10,800}$/.test(n);
export const photoMediaUrl = (name: string, maxWidthPx: number, key: string) =>
  `${GOOGLE_PLACES_BASE}/${name}/media?maxWidthPx=${Math.min(Math.max(Math.round(maxWidthPx), 1), 1600)}&skipHttpRedirect=true&key=${encodeURIComponent(key)}`;
/** Réponse du média : seule une adresse https d'image est renvoyée à l'application (jamais la clé). */
// deno-lint-ignore no-explicit-any
export const parsePhotoMedia = (json: any): string | null => https(json?.photoUri);
