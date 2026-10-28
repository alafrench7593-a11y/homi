/**
 * « Sorties près de chez moi », solution gratuite (logique pure, testée) : lieux PUBLICS trouvés dans OpenStreetMap
 * (API Overpass, sans clé), montrés sur un fond de carte OpenStreetMap, photos libres de Wikimedia Commons quand le
 * lieu en a une. Données contributives : présentées comme « non vérifiées par Au fil de nous ». Aucun lieu inventé.
 *
 * Mêmes catégories que la recherche Google (cafés, restaurants, parcs, activités, et en filtre secondaire PMI et
 * accompagnement). Comme pour Google, les cafés et restaurants ne sont retenus que s'ils sont RENSEIGNÉS comme
 * accueillant les enfants (espace enfants, table à langer, chaise haute) ; les salons de thé sont retenus.
 */
import type { FamilyCategory } from '../../../supabase/functions/_shared/google-places';

export const OSM_CONFIG = {
  overpassUrls: ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter'],
  tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '© contributeurs OpenStreetMap',
  attributionUrl: 'https://www.openstreetmap.org/copyright',
};

const KIDS = ['["kids_area"="yes"]', '["changing_table"="yes"]', '["highchair"="yes"]'];
const NOT_PRIVATE = '["access"!~"^(private|no)$"]';

/** Filtres Overpass par catégorie (balises OpenStreetMap documentées sur le wiki OSM). */
export const OSM_FILTERS: Record<FamilyCategory, string[]> = {
  cafes: [...KIDS.map((k) => `["amenity"="cafe"]${k}["name"]`), '["amenity"="cafe"]["cuisine"~"tea"]["name"]', '["shop"="tea"]["amenity"="cafe"]["name"]'],
  restaurants: KIDS.map((k) => `["amenity"="restaurant"]${k}["name"]`),
  parks: [`["leisure"="park"]["name"]${NOT_PRIVATE}`, `["leisure"="playground"]${NOT_PRIVATE}`, `["leisure"="garden"]["name"]${NOT_PRIVATE}["garden:type"!="residential"]`, '["leisure"="picnic_site"]["name"]', '["tourism"="picnic_site"]["name"]'],
  activities: ['["amenity"~"^(library|toy_library|arts_centre)$"]["name"]', '["tourism"~"^(museum|zoo|aquarium|theme_park)$"]["name"]', '["leisure"~"^(water_park|indoor_play)$"]["name"]'],
  support: ['["name"~"PMI|Protection maternelle|LAEP|Lieu d.accueil enfants|Maison des parents|Maison des familles|Relais petite enfance",i]', '["amenity"="social_facility"]["social_facility:for"~"family|child"]["name"]'],
};

export function overpassFamilyQuery(category: FamilyCategory | 'all', lat: number, lon: number, radiusM: number): string {
  const r = Math.round(Math.min(Math.max(radiusM, 500), 20000));
  const cats: FamilyCategory[] = category === 'all' ? ['cafes', 'restaurants', 'parks', 'activities'] : [category];
  const parts = cats.flatMap((c) => OSM_FILTERS[c]).map((f) => `nwr${f}(around:${r},${lat.toFixed(4)},${lon.toFixed(4)});`);
  return `[out:json][timeout:25];(${parts.join('')});out center tags 150;`;
}

type Tags = Record<string, string>;
const yes = (v?: string) => v === 'yes';
export const osmKids = (t: Tags) => yes(t.kids_area) || yes(t.changing_table) || yes(t.highchair);

/** Catégorie d'un élément d'après ses balises (null : hors des catégories proposées). */
export function osmCategory(t: Tags, searched: FamilyCategory | 'all'): FamilyCategory | null {
  if (t.access === 'private' || t.access === 'no') return null; // jamais un lieu privé
  if (searched === 'support') return 'support';
  if (t.leisure === 'park' || t.leisure === 'playground' || t.leisure === 'garden' || t.leisure === 'picnic_site' || t.tourism === 'picnic_site') return 'parks';
  if (['library', 'toy_library', 'arts_centre'].includes(t.amenity) || ['museum', 'zoo', 'aquarium', 'theme_park'].includes(t.tourism) || ['water_park', 'indoor_play'].includes(t.leisure)) return 'activities';
  if (t.amenity === 'restaurant' && osmKids(t)) return 'restaurants';
  if (t.amenity === 'cafe' && (osmKids(t) || /tea/.test(t.cuisine ?? '') || t.shop === 'tea')) return 'cafes';
  return null;
}

/** Libellé du type de lieu, en français. */
export function osmTypeLabel(t: Tags): string | null {
  if (t.leisure === 'playground') return t.indoor === 'yes' ? 'Aire de jeux couverte' : 'Aire de jeux';
  if (t.leisure === 'park') return 'Parc';
  if (t.leisure === 'garden') return 'Jardin';
  if (t.leisure === 'picnic_site' || t.tourism === 'picnic_site') return 'Aire de pique-nique';
  if (t.leisure === 'water_park') return 'Parc aquatique';
  if (t.leisure === 'indoor_play') return 'Parc de jeux couvert';
  if (t.amenity === 'cafe') return /tea/.test(t.cuisine ?? '') || t.shop === 'tea' ? 'Salon de thé' : 'Café';
  if (t.amenity === 'restaurant') return 'Restaurant';
  if (t.amenity === 'library') return 'Bibliothèque';
  if (t.amenity === 'toy_library') return 'Ludothèque';
  if (t.amenity === 'arts_centre') return 'Centre culturel';
  if (t.amenity === 'social_facility') return 'Accompagnement des familles';
  const tour: Record<string, string> = { museum: 'Musée', zoo: 'Zoo', aquarium: 'Aquarium', theme_park: 'Parc de loisirs' };
  return tour[t.tourism] ?? null;
}

/** Horaires OpenStreetMap (« Mo-Fr 09:00-18:00; Sa 10:00-12:00 ») rendus lisibles, une ligne par règle. */
export function osmHours(v?: string): string[] {
  if (!v || v.length > 300) return [];
  if (v.trim() === '24/7') return ['Ouvert 24 h/24'];
  const days: Record<string, string> = { Mo: 'lun.', Tu: 'mar.', We: 'mer.', Th: 'jeu.', Fr: 'ven.', Sa: 'sam.', Su: 'dim.', PH: 'jours fériés' };
  return v.split(';').map((s) => s.trim()).filter(Boolean).slice(0, 8).map((s) =>
    s.replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su|PH)\b/g, (d) => days[d]).replace(/-(?=[a-zé])/g, ' – ').replace(/\boff\b|\bclosed\b/gi, 'fermé').replace(/(\d\d):(\d\d)/g, '$1 h $2').replace(/ h 00/g, ' h'));
}

/** Fichier Commons d'une balise « wikimedia_commons » ou « image » (File:… seulement, jamais une catégorie). */
export function commonsFile(t: Tags): string | null {
  for (const raw of [t.wikimedia_commons, t.image]) {
    if (!raw) continue;
    const v = raw.trim().replace(/^https?:\/\/commons\.wikimedia\.org\/wiki\//i, '');
    let f: string;
    try { f = decodeURIComponent(v).replace(/_/g, ' '); } catch { continue; }
    if (/^File:[^|#<>[\]{}]{3,200}\.(jpe?g|png|webp)$/i.test(f)) return f;
  }
  return null;
}
export const commonsApiUrl = (file: string, width = 800) =>
  `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&prop=imageinfo&iiprop=url%7Cextmetadata&iiurlwidth=${width}&titles=${encodeURIComponent(file)}`;
const stripHtml = (s: unknown) => (typeof s === 'string' ? s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : '');
export interface CommonsImage { url: string; author: string; license: string; pageUrl: string }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseCommons(json: any): CommonsImage | null {
  const page = Object.values(json?.query?.pages ?? {})[0] as { imageinfo?: { thumburl?: string; url?: string; descriptionurl?: string; extmetadata?: Record<string, { value?: string }> }[] } | undefined;
  const ii = page?.imageinfo?.[0];
  const url = ii?.thumburl ?? ii?.url;
  if (!ii || !url || !/^https:\/\/upload\.wikimedia\.org\//.test(url)) return null;
  const m = ii.extmetadata ?? {};
  const license = stripHtml(m.LicenseShortName?.value);
  if (!license) return null; // sans licence lisible, pas de photo
  return { url, author: stripHtml(m.Artist?.value).slice(0, 80) || 'Auteur sur Wikimedia Commons', license, pageUrl: ii.descriptionurl ?? 'https://commons.wikimedia.org' };
}

const safeUrl = (u?: string) => (u && /^https?:\/\/[^\s]+$/i.test(u) ? u.replace(/^http:/i, 'https:').slice(0, 300) : null);
type OsmEl = { type: 'node' | 'way' | 'relation'; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Tags };

export interface OsmPlace {
  id: string; name: string; category: FamilyCategory; primaryType: string | null; typeLabel: string | null;
  address: string | null; lat: number; lon: number; hours: string[]; phone: string | null; website: string | null;
  mapsUri: string | null; goodForChildren: boolean | null; menuForChildren: boolean | null; photo: null;
  source: 'osm'; commons: string | null;
}

export function parseOsmPlaces(json: { elements?: OsmEl[] } | null, searched: FamilyCategory | 'all'): OsmPlace[] {
  const out: OsmPlace[] = [];
  const seen = new Set<string>();
  for (const e of json?.elements ?? []) {
    const t = e.tags ?? {};
    const lat = e.lat ?? e.center?.lat, lon = e.lon ?? e.center?.lon;
    const category = osmCategory(t, searched);
    if (lat == null || lon == null || !Number.isFinite(lat) || !Number.isFinite(lon) || !category) continue;
    if (searched !== 'all' && category !== searched) continue;
    const typeLabel = osmTypeLabel(t);
    // Une aire de jeux sans nom reste utile : elle prend le nom de son type ; tout autre lieu doit avoir un nom
    const name = (t.name ?? (t.leisure === 'playground' ? typeLabel : null))?.trim().slice(0, 160);
    if (!name || !['node', 'way', 'relation'].includes(e.type) || !Number.isInteger(e.id)) continue;
    const id = `osm:${e.type}/${e.id}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const street = [t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' ');
    const city = [t['addr:postcode'], t['addr:city']].filter(Boolean).join(' ');
    const primaryType = t.leisure === 'playground' ? (t.indoor === 'yes' ? 'indoor_playground' : 'playground') : t.leisure ?? t.amenity ?? t.tourism ?? null;
    out.push({
      id, name, category, primaryType, typeLabel,
      address: [street, city].filter(Boolean).join(', ') || null,
      lat, lon, hours: osmHours(t.opening_hours),
      phone: (t.phone ?? t['contact:phone'] ?? '').slice(0, 40) || null,
      website: safeUrl(t.website ?? t['contact:website']),
      mapsUri: `https://www.openstreetmap.org/${e.type}/${e.id}`,
      goodForChildren: osmKids(t) ? true : null, // jamais « non » : l'absence de balise ne dit rien
      menuForChildren: null, photo: null, source: 'osm', commons: commonsFile(t),
    });
  }
  return out;
}
