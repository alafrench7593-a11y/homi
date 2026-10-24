/**
 * Google Places API (New) — logique pure, partagée entre la fonction serveur `places` et les tests.
 * Documentation consultée le 24/10/2026 :
 *  · Nearby Search (New) : POST https://places.googleapis.com/v1/places:searchNearby (includedTypes du tableau A,
 *    maxResultCount 1–20, locationRestriction.circle { center { latitude, longitude }, radius ≤ 50000 }, languageCode,
 *    rankPreference DISTANCE | POPULARITY) ;
 *  · Text Search (New) : POST https://places.googleapis.com/v1/places:searchText (textQuery, locationBias.circle,
 *    pageSize 1–20, languageCode, regionCode) ;
 *  · en-têtes X-Goog-Api-Key et X-Goog-FieldMask (liste sans espace) ;
 *  · Place Photos (New) : GET https://places.googleapis.com/v1/{name}/media?maxWidthPx=…&skipHttpRedirect=true&key=…
 *    -> { name, photoUri }.
 * Conditions (Service Specific Terms, 15/10/2026) : contenus Google affichés seulement avec un fond de carte Google,
 * auteurs des photos crédités, lien vers la fiche Google Maps, aucun stockage (sauf l'identifiant du lieu).
 * La clé (GOOGLE_PLACES_API_KEY) n'existe que côté serveur.
 */
export const GOOGLE_PLACES_BASE = 'https://places.googleapis.com/v1';

export const GOOGLE_FIELD_MASK = [
  'places.id', 'places.displayName', 'places.formattedAddress', 'places.location', 'places.primaryType', 'places.primaryTypeDisplayName', 'places.types',
  'places.regularOpeningHours.weekdayDescriptions', 'places.nationalPhoneNumber', 'places.websiteUri', 'places.googleMapsUri',
  'places.goodForChildren', 'places.menuForChildren', 'places.photos',
].join(',');

/** Types de lieux (tableau A de Google, vérifiés le 24/10/2026) par catégorie de « Sorties près de chez moi ». */
export const FAMILY_TYPES = {
  cafes: ['cafe', 'coffee_shop', 'tea_house'],
  restaurants: ['restaurant', 'family_restaurant'],
  parks: ['park', 'playground', 'garden', 'botanical_garden', 'picnic_ground'],
  activities: ['library', 'museum', 'zoo', 'aquarium', 'amusement_park', 'indoor_playground', 'cultural_center'],
} as const;
export type FamilyCategory = keyof typeof FAMILY_TYPES | 'support';
export const FAMILY_CATEGORIES: FamilyCategory[] = ['cafes', 'restaurants', 'parks', 'activities', 'support'];
/** Filtre secondaire « Soutien » : recherche textuelle (PMI, accueil enfants-parents). */
export const SUPPORT_QUERY = 'PMI protection maternelle et infantile lieu d’accueil enfants parents';

export interface PlacesQuery { category: FamilyCategory | 'all'; lat: number; lon: number; radius: number }

/** Position arrondie (~1 km) : jamais de position précise envoyée à Google. */
export const coarseLatLon = (v: number) => Math.round(v * 100) / 100;

export function validQuery(b: unknown): PlacesQuery | null {
  const q = (b ?? {}) as Record<string, unknown>;
  const lat = Number(q.lat), lon = Number(q.lon), radius = Number(q.radius);
  const category = q.category;
  if (category !== 'all' && !(FAMILY_CATEGORIES as unknown[]).includes(category)) return null;
  if (!(Number.isFinite(lat) && lat >= -90 && lat <= 90 && Number.isFinite(lon) && lon >= -180 && lon <= 180)) return null;
  if (!(Number.isFinite(radius) && radius >= 500 && radius <= 20000)) return null;
  return { category: category as PlacesQuery['category'], lat: coarseLatLon(lat), lon: coarseLatLon(lon), radius: Math.round(radius) };
}

export function buildSearch(q: PlacesQuery): { url: string; body: Record<string, unknown> } {
  const circle = { center: { latitude: q.lat, longitude: q.lon }, radius: q.radius };
  if (q.category === 'support') {
    return { url: `${GOOGLE_PLACES_BASE}/places:searchText`, body: { textQuery: SUPPORT_QUERY, pageSize: 20, languageCode: 'fr', regionCode: 'FR', locationBias: { circle } } };
  }
  const types = q.category === 'all' ? [...FAMILY_TYPES.cafes, ...FAMILY_TYPES.restaurants, ...FAMILY_TYPES.parks, ...FAMILY_TYPES.activities] : [...FAMILY_TYPES[q.category]];
  return { url: `${GOOGLE_PLACES_BASE}/places:searchNearby`, body: { includedTypes: types, maxResultCount: 20, languageCode: 'fr', rankPreference: 'DISTANCE', locationRestriction: { circle } } };
}

/** Catégorie d'un résultat d'après ses types Google (null : hors des catégories proposées). */
export function categoryOfTypes(primary: string | null, types: string[], searched: FamilyCategory | 'all'): FamilyCategory | null {
  if (searched === 'support') return 'support';
  const all = [primary, ...types].filter(Boolean) as string[];
  for (const c of ['parks', 'activities', 'restaurants', 'cafes'] as const) if (all.some((t) => (FAMILY_TYPES[c] as readonly string[]).includes(t))) return c;
  return null;
}

export interface GoogleAttribution { displayName: string; uri: string | null }
export interface GooglePlace {
  id: string; // « google:<place id> »
  name: string;
  category: FamilyCategory;
  primaryType: string | null;
  typeLabel: string | null;
  address: string | null;
  lat: number;
  lon: number;
  hours: string[];
  phone: string | null;
  website: string | null;
  mapsUri: string | null;
  /** « adapté aux enfants » selon Google : true, false, ou null (non renseigné) */
  goodForChildren: boolean | null;
  menuForChildren: boolean | null;
  photo: { name: string; attributions: GoogleAttribution[] } | null;
}

const https = (u: unknown) => (typeof u === 'string' && /^https:\/\/[^\s]+$/i.test(u) ? u : null);
const bool = (v: unknown) => (typeof v === 'boolean' ? v : null);
const str = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);

// deno-lint-ignore no-explicit-any
export function parseGooglePlaces(json: any, searched: FamilyCategory | 'all'): GooglePlace[] {
  const out: GooglePlace[] = [];
  for (const p of (json?.places ?? []) as Record<string, any>[]) { // eslint-disable-line @typescript-eslint/no-explicit-any
    const lat = Number(p?.location?.latitude), lon = Number(p?.location?.longitude);
    const name = str(p?.displayName?.text, 160);
    if (typeof p?.id !== 'string' || !/^[A-Za-z0-9_-]{10,200}$/.test(p.id) || !name || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const primary = typeof p.primaryType === 'string' ? p.primaryType : null;
    const types = Array.isArray(p.types) ? p.types.filter((t: unknown) => typeof t === 'string') : [];
    const category = categoryOfTypes(primary, types, searched);
    if (!category) continue;
    const goodForChildren = bool(p.goodForChildren), menuForChildren = bool(p.menuForChildren);
    // Cafés et restaurants : seulement ceux que Google indique adaptés aux enfants (jamais supposé)
    if ((category === 'cafes' || category === 'restaurants') && goodForChildren !== true && menuForChildren !== true) continue;
    const ph = Array.isArray(p.photos) ? p.photos[0] : null;
    const photoName = typeof ph?.name === 'string' && validPhotoName(ph.name) ? ph.name : null;
    out.push({
      id: `google:${p.id}`, name, category, primaryType: primary, typeLabel: str(p?.primaryTypeDisplayName?.text, 60), address: str(p.formattedAddress, 240), lat, lon,
      hours: Array.isArray(p?.regularOpeningHours?.weekdayDescriptions) ? p.regularOpeningHours.weekdayDescriptions.filter((x: unknown) => typeof x === 'string').slice(0, 7) : [],
      phone: str(p.nationalPhoneNumber, 40), website: https(p.websiteUri), mapsUri: https(p.googleMapsUri),
      goodForChildren, menuForChildren,
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
/** Erreur Google -> état honnête pour l'application (aucun détail technique, aucune clé). */
export const googleErrorState = (status: number): 'invalid_key' | 'quota' | 'unavailable' =>
  status === 400 || status === 401 || status === 403 ? 'invalid_key' : status === 429 ? 'quota' : 'unavailable';
