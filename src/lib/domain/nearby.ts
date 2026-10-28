/**
 * « Près de chez moi » (logique pure, testée) : lieux PUBLICS et organismes accueillants pour les familles.
 * Jamais de position d'un membre, de rendez-vous entre personnes ni de partage d'adresse : la recherche part d'une
 * ville ou d'un code postal saisi (ou, si la personne le choisit, de sa position du moment, jamais enregistrée ni
 * transmise à quelqu'un d'autre que le service de recherche de lieux).
 *
 * Sources :
 *  · recherche de commune : API de géocodage de la Géoplateforme (IGN), accès ouvert, sans clé ;
 *  · lieux (parcs, bibliothèques, cafés équipés pour les familles, centres sociaux, mairies) : OpenStreetMap via
 *    l'API Overpass (données contributives : affichées comme « non vérifiées par Au fil de nous ») ;
 *  · lieux sans données ouvertes fiables (lieux d'accueil enfants-parents, associations, soutien à l'allaitement,
 *    écoute) : annuaires officiels ou associatifs reconnus, jamais de lieu inventé.
 * Les adresses des services sont réglables (NEARBY_CONFIG) : en production, utiliser un fournisseur de tuiles et un
 * serveur Overpass adaptés au trafic (politiques d'usage d'OpenStreetMap).
 */
export const NEARBY_CONFIG = {
  geocodeUrl: 'https://data.geopf.fr/geocodage/search',
  overpassUrl: 'https://overpass-api.de/api/interpreter',
  tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '© contributeurs OpenStreetMap',
  attributionUrl: 'https://www.openstreetmap.org/copyright',
  appId: 'ToiEtMoi/1.0 (application familiale)',
};

export type PlaceKind = 'park' | 'library' | 'family_cafe' | 'parents_assoc' | 'social_centre' | 'parent_child' | 'breastfeeding' | 'isolated_support' | 'public_service';
export const PLACE_KINDS: PlaceKind[] = ['park', 'library', 'family_cafe', 'parents_assoc', 'social_centre', 'parent_child', 'breastfeeding', 'isolated_support', 'public_service'];
/** Types de lieux trouvés dans OpenStreetMap ; les autres renvoient vers des annuaires officiels. */
export const OSM_KINDS: PlaceKind[] = ['park', 'library', 'family_cafe', 'social_centre', 'public_service'];

/** Filtres Overpass par type (balises OpenStreetMap documentées). */
const OSM_FILTERS: Record<string, string[]> = {
  park: ['["leisure"="park"]["name"]', '["leisure"="playground"]["name"]'],
  library: ['["amenity"="library"]["name"]', '["amenity"="toy_library"]["name"]'],
  family_cafe: ['["amenity"~"^(cafe|restaurant)$"]["changing_table"="yes"]["name"]', '["amenity"~"^(cafe|restaurant)$"]["highchair"="yes"]["name"]', '["amenity"~"^(cafe|restaurant)$"]["kids_area"="yes"]["name"]'],
  social_centre: ['["amenity"="social_centre"]["name"]', '["amenity"="community_centre"]["name"]', '["social_facility:for"~"family|child"]["name"]'],
  public_service: ['["amenity"="townhall"]["name"]', '["office"="government"]["government"~"social_security|social_services|family"]["name"]'],
};

export function overpassQuery(kinds: PlaceKind[], lat: number, lon: number, radiusM: number): string {
  const r = Math.round(Math.min(Math.max(radiusM, 200), 10000));
  const parts = kinds.flatMap((k) => OSM_FILTERS[k] ?? []).map((f) => `nwr${f}(around:${r},${lat.toFixed(5)},${lon.toFixed(5)});`);
  return `[out:json][timeout:20];(${parts.join('')});out center tags 120;`;
}

export interface Place {
  id: string;
  name: string;
  kind: PlaceKind;
  lat: number;
  lon: number;
  address: string | null;
  hours: string | null;
  website: string | null;
  phone: string | null;
  /** accès en fauteuil roulant tel que renseigné dans OpenStreetMap (jamais extrapolé à la poussette) */
  wheelchair: 'yes' | 'limited' | 'no' | null;
  changingTable: boolean | null;
  /** chaise haute (renseignée dans OpenStreetMap) */
  highchair: boolean | null;
  /** âges indiqués par le lieu (aires de jeux surtout), en années ; null = non renseigné */
  minAge: number | null;
  maxAge: number | null;
  source: 'OpenStreetMap';
  fetchedOn: string;
}

type OsmEl = { type: 'node' | 'way' | 'relation'; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> };

function kindOf(t: Record<string, string>): PlaceKind | null {
  if (t.leisure === 'park' || t.leisure === 'playground') return 'park';
  if (t.amenity === 'library' || t.amenity === 'toy_library') return 'library';
  if ((t.amenity === 'cafe' || t.amenity === 'restaurant') && (t.changing_table === 'yes' || t.highchair === 'yes' || t.kids_area === 'yes')) return 'family_cafe';
  if (t.amenity === 'social_centre' || t.amenity === 'community_centre' || /family|child/.test(t['social_facility:for'] ?? '')) return 'social_centre';
  if (t.amenity === 'townhall' || t.office === 'government') return 'public_service';
  return null;
}

const safeUrl = (u?: string) => (u && /^https?:\/\/[^\s]+$/i.test(u) ? u.replace(/^http:/i, 'https:') : null);

export function parseOverpass(json: { elements?: OsmEl[] }, fetchedOn: string): Place[] {
  const out: Place[] = [];
  const seen = new Set<string>();
  for (const e of json.elements ?? []) {
    const t = e.tags ?? {};
    const lat = e.lat ?? e.center?.lat;
    const lon = e.lon ?? e.center?.lon;
    const kind = kindOf(t);
    if (!t.name || lat == null || lon == null || !kind) continue;
    const id = `osm:${e.type}/${e.id}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const street = [t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' ');
    const city = [t['addr:postcode'], t['addr:city']].filter(Boolean).join(' ');
    out.push({
      id, name: t.name.slice(0, 160), kind, lat, lon,
      address: [street, city].filter(Boolean).join(', ') || null,
      hours: t.opening_hours ?? null,
      website: safeUrl(t.website ?? t['contact:website']),
      phone: t.phone ?? t['contact:phone'] ?? null,
      wheelchair: t.wheelchair === 'yes' || t.wheelchair === 'limited' || t.wheelchair === 'no' ? t.wheelchair : null,
      changingTable: t.changing_table === 'yes' ? true : t.changing_table === 'no' ? false : null,
      highchair: t.highchair === 'yes' ? true : t.highchair === 'no' ? false : null,
      minAge: /^\d{1,2}$/.test(t.min_age ?? '') ? Number(t.min_age) : null,
      maxAge: /^\d{1,2}$/.test(t.max_age ?? '') ? Number(t.max_age) : null,
      source: 'OpenStreetMap', fetchedOn,
    });
  }
  return out;
}

export interface Town { label: string; city: string; postcode: string | null; lat: number; lon: number }
/** Réponse GeoJSON du géocodage (properties.label/city/postcode, geometry.coordinates [lon, lat]). */
export function parseGeocode(json: { features?: { properties?: Record<string, unknown>; geometry?: { coordinates?: number[] } }[] }): Town[] {
  return (json.features ?? []).flatMap((f) => {
    const p = f.properties ?? {};
    const c = f.geometry?.coordinates;
    if (!c || c.length < 2 || typeof p.label !== 'string') return [];
    return [{ label: p.label, city: String(p.city ?? p.name ?? p.label), postcode: typeof p.postcode === 'string' ? p.postcode : null, lon: c[0], lat: c[1] }];
  });
}
export const geocodeUrl = (q: string) => `${NEARBY_CONFIG.geocodeUrl}?q=${encodeURIComponent(q.trim())}&type=municipality&limit=5`;
/** Ville ou code postal : 2 à 60 caractères, sans numéro de rue (on ne cherche jamais une adresse personnelle). */
export function validTownQuery(q: string): boolean {
  const v = q.trim();
  return /^\d{5}$/.test(v) || (v.length >= 2 && v.length <= 60 && !/^\d+\s*(bis|ter)?\s+(rue|avenue|bd|boulevard|allée|chemin|impasse|place)\b/i.test(v));
}

/** Distance (m) à vol d'oiseau. */
export function distanceM(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
/** Distance approximative : arrondie (100 m près, puis 0,5 km), jamais au mètre. */
export function approxDistance(m: number): string {
  if (m < 950) return `environ ${Math.max(100, Math.round(m / 100) * 100)} m`;
  const km = Math.round(m / 500) / 2;
  return `environ ${String(km).replace('.', ',')} km`;
}

/** Centre de recherche tiré d'une position : arrondi à ~1 km (0,01°) pour ne jamais envoyer une position précise. */
export const coarse = (p: { lat: number; lon: number }) => ({ lat: Math.round(p.lat * 100) / 100, lon: Math.round(p.lon * 100) / 100 });

/** Équipements confirmés (jamais supposés) : seuls les lieux où l'information est renseignée « oui » passent le filtre. */
export type Equipment = 'changing_table' | 'highchair' | 'wheelchair';
export function hasEquipment(p: Pick<Place, 'changingTable' | 'highchair' | 'wheelchair'>, e: Equipment): boolean {
  if (e === 'changing_table') return p.changingTable === true;
  if (e === 'highchair') return p.highchair === true;
  return p.wheelchair === 'yes';
}
/** Âge de l'enfant (années) : on n'écarte un lieu que si ses âges RENSEIGNÉS l'excluent ; sinon il reste, « âge non renseigné ». */
export function suitsAge(p: Pick<Place, 'minAge' | 'maxAge'>, years: number | null): boolean {
  if (years == null) return true;
  if (p.minAge != null && years < p.minAge) return false;
  if (p.maxAge != null && years > p.maxAge) return false;
  return true;
}
/** Rayon suivant pour « élargir la recherche » (null : déjà au maximum). */
export const widerRadius = (r: number): number | null => (r < 2000 ? 2000 : r < 5000 ? 5000 : r < 10000 ? 10000 : null);

// ---------------------------------------------------------------- carte (tuiles « slippy map » standard)
export const lon2x = (lon: number, z: number) => ((lon + 180) / 360) * 2 ** z;
export const lat2y = (lat: number, z: number) => { const r = (lat * Math.PI) / 180; return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z; };
export const tileUrl = (z: number, x: number, y: number) => NEARBY_CONFIG.tileUrl.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y));
/** Tuiles nécessaires pour une vue (w×h px) centrée, et position en pixels d'un point. */
export function mapView(center: { lat: number; lon: number }, z: number, w: number, h: number) {
  const cx = lon2x(center.lon, z) * 256, cy = lat2y(center.lat, z) * 256;
  const left = cx - w / 2, top = cy - h / 2;
  const tiles: { key: string; url: string; left: number; top: number }[] = [];
  const max = 2 ** z;
  for (let tx = Math.floor(left / 256); tx <= Math.floor((left + w) / 256); tx++) {
    for (let ty = Math.floor(top / 256); ty <= Math.floor((top + h) / 256); ty++) {
      if (ty < 0 || ty >= max) continue;
      const wx = ((tx % max) + max) % max;
      tiles.push({ key: `${z}/${wx}/${ty}`, url: tileUrl(z, wx, ty), left: tx * 256 - left, top: ty * 256 - top });
    }
  }
  const point = (p: { lat: number; lon: number }) => ({ x: lon2x(p.lon, z) * 256 - left, y: lat2y(p.lat, z) * 256 - top });
  return { tiles, point };
}

/** Itinéraire dans l'application de cartes du téléphone (liens documentés par Apple et Google), jamais de position de départ envoyée. */
export function directionsUrl(p: { lat: number; lon: number; name?: string }, os: string): string {
  const ll = `${p.lat.toFixed(6)},${p.lon.toFixed(6)}`;
  if (os === 'ios') return `https://maps.apple.com/?daddr=${ll}${p.name ? `&q=${encodeURIComponent(p.name)}` : ''}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${ll}`;
}

// ---------------------------------------------------------------- annuaires (types sans données ouvertes fiables)
export interface Directory { kind: PlaceKind; title: string; body: string; url: string | null; phone?: string; hours?: string; source: string; checkedOn: string; /** recherche de l'annuaire officiel : la commune saisie est ajoutée */ annuaire?: string }
/** Annuaire de l'administration (Service-public.fr), avec la commune saisie (jamais une adresse personnelle). */
export const annuaireUrl = (what: string, town?: string | null) => `https://lannuaire.service-public.fr/recherche?whoWhat=${encodeURIComponent(what).replace(/%20/g, '+')}&where=${encodeURIComponent(town ?? '').replace(/%20/g, '+')}`;
export const directoryUrl = (d: Directory, town?: string | null) => (d.annuaire ? annuaireUrl(d.annuaire, town) : d.url);
export const DIRECTORIES: Directory[] = [
  { kind: 'parent_child', title: 'Lieux d’accueil enfants-parents (LAEP)', body: 'Des lieux gratuits, sans inscription, pour partager un moment avec votre enfant et rencontrer d’autres parents. Recherche par commune sur le site de la Caf.', url: 'https://www.monenfant.fr/que-recherchez-vous/lieu-d-accompagnement-et-information-des-familles', source: 'monenfant.fr (Caf), cité par 1000 premiers jours', checkedOn: '2026-10-22' },
  { kind: 'parents_assoc', title: 'Accompagnement et information des familles', body: 'Relais petite enfance, lieux d’information et actions de soutien à la parentalité près de chez vous, recensés par la Caf.', url: 'https://www.monenfant.fr/que-recherchez-vous/lieu-d-accompagnement-et-information-des-familles', source: 'monenfant.fr (Caf)', checkedOn: '2026-10-22' },
  { kind: 'breastfeeding', title: 'Réunions de soutien à l’allaitement', body: 'Animatrices bénévoles et réunions (en présentiel ou à distance) de La Leche League France, par département.', url: 'https://www.lllfrance.org/reunions/trouver-une-reunion', source: 'La Leche League France', checkedOn: '2026-10-22' },
  { kind: 'isolated_support', title: 'Allô Parents Bébé', body: 'Écoute gratuite pour les parents de jeunes enfants (0–3 ans), par des professionnels de la petite enfance.', url: null, phone: '0800003456', hours: 'Du lundi au vendredi, 10 h–13 h et 14 h–18 h', source: 'Ville de Paris — L’accompagnement des familles', checkedOn: '2026-10-22' },
  { kind: 'isolated_support', title: 'Aide à domicile et soutien près de chez vous', body: 'PMI, sage-femme, technicienne de l’intervention sociale et familiale : qui peut venir vous aider à la maison, et comment la demander.', url: 'https://www.sante.fr/laccompagnement-domicile-pour-les-parents', source: 'Santé.fr (1000 premiers jours)', checkedOn: '2026-10-22' },
  { kind: 'social_centre', title: 'Centres de PMI de votre commune', body: 'Consultations pour les enfants de moins de 6 ans et soutien aux parents, gérés par le département : l’annuaire officiel de l’administration les liste par commune.', url: null, annuaire: 'Centre de protection maternelle et infantile PMI', source: 'Annuaire de l’administration (Service-public.fr), conseillé par 1000 premiers jours', checkedOn: '2026-10-22' },
  { kind: 'public_service', title: 'Caisse d’allocations familiales (Caf)', body: 'Accueils et points de contact de la Caf : l’annuaire officiel de l’administration, par commune.', url: null, annuaire: 'Caisse d\'allocations familiales', source: 'Annuaire de l’administration (Service-public.fr)', checkedOn: '2026-10-22' },
];
