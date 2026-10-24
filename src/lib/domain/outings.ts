/**
 * « Sorties & rencontres » (logique pure, testée).
 *
 * Sources, toujours affichées avec leur date de consultation :
 *  · OpenStreetMap (API Overpass) : lieux publics, seule source dessinée sur la carte ; données contributives,
 *    équipements et horaires présentés « selon OpenStreetMap », jamais comme confirmés ;
 *  · Google Places (facultatif, clé serveur) : uniquement dans la liste et les fiches, avec la mention
 *    « Google Maps », les auteurs des photos et le lien vers la fiche Google (conditions de Google) ;
 *  · lieux proposés par des membres : seulement après validation par la modération, marqués « proposé par un membre » ;
 *  · annuaires officiels (PMI, Caf, LAEP, allaitement, écoute) pour ce qui n'a pas de données ouvertes fiables.
 * Photos : Google (si configuré), sinon Wikimedia Commons (balise OpenStreetMap « wikimedia_commons », auteur et
 * licence affichés), sinon une illustration du type de lieu. Jamais d'image copiée depuis un moteur de recherche.
 * Rencontres : en groupe (3 places au moins), dans un lieu public choisi dans les résultats ; ni adresse personnelle,
 * ni position d'un membre, ni messagerie.
 */
import { distanceM, NEARBY_CONFIG, type Place, type Directory, DIRECTORIES } from './nearby';

export type OutingCategory =
  | 'parks' | 'family_food' | 'mum_baby' | 'workshops' | 'culture' | 'laep' | 'parents_groups'
  | 'mum_meetups' | 'pregnancy' | 'big_families' | 'support';
export const OUTING_CATEGORIES: OutingCategory[] = ['parks', 'family_food', 'mum_baby', 'workshops', 'culture', 'laep', 'parents_groups', 'mum_meetups', 'pregnancy', 'big_families', 'support'];

export const CATEGORY_ICON: Record<OutingCategory, string> = {
  parks: 'sun', family_food: 'coffee', mum_baby: 'heart', workshops: 'scissors', culture: 'book-open', laep: 'home',
  parents_groups: 'users', mum_meetups: 'smile', pregnancy: 'gift', big_families: 'truck', support: 'life-buoy',
};

/** Filtres Overpass par catégorie (balises documentées sur le wiki OpenStreetMap). Vide : pas de données ouvertes fiables. */
export const OSM_OUTING_FILTERS: Record<OutingCategory, string[]> = {
  parks: ['["leisure"="playground"]', '["leisure"="park"]["name"]'],
  family_food: ['["amenity"~"^(cafe|restaurant)$"]["changing_table"="yes"]["name"]', '["amenity"~"^(cafe|restaurant)$"]["highchair"="yes"]["name"]', '["amenity"~"^(cafe|restaurant)$"]["kids_area"="yes"]["name"]'],
  mum_baby: ['["amenity"="toy_library"]["name"]', '["leisure"="indoor_play"]["name"]'],
  workshops: ['["amenity"="arts_centre"]["name"]', '["leisure"="indoor_play"]["name"]', '["tourism"="zoo"]["name"]'],
  culture: ['["amenity"="library"]["name"]', '["amenity"="toy_library"]["name"]', '["tourism"="museum"]["name"]'],
  laep: ['["name"~"LAEP|accueil enfants.parents",i]'],
  parents_groups: ['["amenity"="social_centre"]["name"]', '["amenity"="community_centre"]["name"]', '["social_facility:for"~"family|child"]["name"]'],
  mum_meetups: [],
  pregnancy: ['["name"~"maternit[eé]|pr[eé]paration [aà] la naissance",i]["amenity"~"^(hospital|clinic|doctors)$"]'],
  big_families: ['["tourism"="picnic_site"]["name"]', '["tourism"="zoo"]["name"]', '["leisure"="park"]["name"]["fee"="no"]', '["tourism"="museum"]["fee"="no"]["name"]'],
  support: ['["name"~"PMI|protection maternelle",i]', '["amenity"="townhall"]["name"]', '["office"="government"]["government"~"social_security|social_services|family"]["name"]'],
};
export const osmCategories = (cats: OutingCategory[]) => cats.filter((c) => OSM_OUTING_FILTERS[c].length > 0);

export function outingsOverpassQuery(cats: OutingCategory[], lat: number, lon: number, radiusM: number): string {
  const r = Math.round(Math.min(Math.max(radiusM, 200), 10000));
  const filters = [...new Set(cats.flatMap((c) => OSM_OUTING_FILTERS[c]))];
  const parts = filters.map((f) => `nwr${f}(around:${r},${lat.toFixed(5)},${lon.toFixed(5)});`);
  return `[out:json][timeout:25];(${parts.join('')});out center tags 150;`;
}

/** Catégorie d'un élément OpenStreetMap parmi celles demandées (première qui correspond, dans l'ordre affiché). */
export function categoryOf(t: Record<string, string>, wanted: OutingCategory[]): OutingCategory | null {
  const name = t.name ?? '';
  const test: Record<OutingCategory, () => boolean> = {
    parks: () => t.leisure === 'playground' || t.leisure === 'park',
    family_food: () => (t.amenity === 'cafe' || t.amenity === 'restaurant') && (t.changing_table === 'yes' || t.highchair === 'yes' || t.kids_area === 'yes'),
    mum_baby: () => t.amenity === 'toy_library' || t.leisure === 'indoor_play',
    workshops: () => t.amenity === 'arts_centre' || t.leisure === 'indoor_play' || t.tourism === 'zoo',
    culture: () => t.amenity === 'library' || t.amenity === 'toy_library' || t.tourism === 'museum',
    laep: () => /LAEP|accueil enfants.parents/i.test(name),
    parents_groups: () => t.amenity === 'social_centre' || t.amenity === 'community_centre' || /family|child/.test(t['social_facility:for'] ?? ''),
    mum_meetups: () => false,
    pregnancy: () => /maternit[eé]|pr[eé]paration [aà] la naissance/i.test(name) && /^(hospital|clinic|doctors)$/.test(t.amenity ?? ''),
    big_families: () => t.tourism === 'picnic_site' || t.tourism === 'zoo' || ((t.leisure === 'park' || t.tourism === 'museum') && t.fee === 'no'),
    support: () => /PMI|protection maternelle/i.test(name) || t.amenity === 'townhall' || t.office === 'government',
  };
  return wanted.find((c) => test[c]()) ?? null;
}

export type OutingEquipment = 'stroller' | 'highchair' | 'changing_table' | 'baby_area' | 'wheelchair';
export const OUTING_EQUIPMENT: OutingEquipment[] = ['stroller', 'highchair', 'changing_table', 'baby_area', 'wheelchair'];
/** Ce qu'un membre peut déclarer en proposant un lieu (même liste que la base). */
export const MEMBER_EQUIPMENT: OutingEquipment[] = ['stroller', 'highchair', 'changing_table', 'baby_area'];
export type EquipmentSource = 'osm' | 'google' | 'member';
export type OutingSource = 'osm' | 'google' | 'member';

export interface OutingPhoto {
  kind: 'google' | 'commons';
  /** Google : nom de la photo (l'adresse est demandée au serveur au moment de l'affichage) ; Commons : nom du fichier */
  ref: string;
  /** auteurs (Google : authorAttributions ; Commons : rempli après lecture des métadonnées) */
  credits: { name: string; url: string | null }[];
}

export interface OutingPlace {
  id: string;
  source: OutingSource;
  name: string;
  typeLabel: string | null;
  category: OutingCategory;
  lat: number;
  lon: number;
  address: string | null;
  hours: string | null;
  hoursLines: string[];
  phone: string | null;
  website: string | null;
  mapsUri: string | null;
  /** équipements : true = renseigné « oui » par la source ; false = « non » ; absent = inconnu (jamais supposé) */
  equipment: Partial<Record<OutingEquipment, boolean>>;
  equipmentSource: EquipmentSource;
  minAge: number | null;
  maxAge: number | null;
  activities: string | null;
  photo: OutingPhoto | null;
  fetchedOn: string;
  /** date de validation (lieu proposé par un membre) */
  moderatedOn?: string | null;
  goodForChildren?: boolean | null;
}

type OsmEl = { type: 'node' | 'way' | 'relation'; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> };
const yesNo = (v?: string) => (v === 'yes' ? true : v === 'no' ? false : undefined);
const safeHttps = (u?: string) => (u && /^https?:\/\/[^\s]+$/i.test(u) ? u.replace(/^http:/i, 'https:') : null);
/** Fichier Commons d'une balise OpenStreetMap « wikimedia_commons » (File:… seulement, jamais une catégorie). */
export function commonsFile(tag?: string): string | null {
  if (!tag) return null;
  const v = tag.trim().replace(/^https?:\/\/commons\.wikimedia\.org\/wiki\//i, '');
  return /^File:[^|#<>[\]{}]{3,200}\.(jpe?g|png|webp)$/i.test(v) ? decodeURIComponent(v) : null;
}

export function parseOutingsOverpass(json: { elements?: OsmEl[] }, wanted: OutingCategory[], fetchedOn: string): OutingPlace[] {
  const out: OutingPlace[] = [];
  const seen = new Set<string>();
  for (const e of json.elements ?? []) {
    const t = e.tags ?? {};
    const lat = e.lat ?? e.center?.lat, lon = e.lon ?? e.center?.lon;
    const category = categoryOf(t, wanted);
    if (lat == null || lon == null || !category) continue;
    // aire de jeux sans nom : gardée (lieu public), nommée par son type
    const name = (t.name ?? (t.leisure === 'playground' ? '' : null));
    if (name == null) continue;
    const id = `osm:${e.type}/${e.id}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const street = [t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' ');
    const city = [t['addr:postcode'], t['addr:city']].filter(Boolean).join(' ');
    const equipment: Partial<Record<OutingEquipment, boolean>> = {};
    const st = yesNo(t.stroller); if (st != null) equipment.stroller = st;
    const hc = yesNo(t.highchair); if (hc != null) equipment.highchair = hc;
    const ct = yesNo(t.changing_table); if (ct != null) equipment.changing_table = ct;
    const ka = yesNo(t.kids_area ?? t.baby_feeding); if (ka != null) equipment.baby_area = ka;
    // « limited » (accès partiel) n'est ni un oui ni un non : laissé inconnu
    const wc = yesNo(t.wheelchair); if (wc != null) equipment.wheelchair = wc;
    const file = commonsFile(t.wikimedia_commons);
    out.push({
      id, source: 'osm', name: name.slice(0, 160), typeLabel: null, category, lat, lon,
      address: [street, city].filter(Boolean).join(', ') || null,
      hours: t.opening_hours ?? null, hoursLines: [],
      phone: t.phone ?? t['contact:phone'] ?? null, website: safeHttps(t.website ?? t['contact:website']), mapsUri: null,
      equipment, equipmentSource: 'osm',
      minAge: /^\d{1,2}$/.test(t.min_age ?? '') ? Number(t.min_age) : null,
      maxAge: /^\d{1,2}$/.test(t.max_age ?? '') ? Number(t.max_age) : null,
      activities: t.description ? t.description.slice(0, 300) : null,
      photo: file ? { kind: 'commons', ref: file, credits: [] } : null,
      fetchedOn,
    });
  }
  return out;
}

/** Établissements Google (réponse de la fonction serveur `places`). */
export interface GooglePlaceDto {
  id: string; name: string; typeLabel: string | null; address: string | null; lat: number; lon: number; hours: string[];
  phone: string | null; website: string | null; mapsUri: string | null; goodForChildren: boolean | null; menuForChildren: boolean | null;
  wheelchairEntrance: boolean | null; photo: { name: string; attributions: { displayName: string; uri: string | null }[] } | null;
}
export function fromGoogle(g: GooglePlaceDto, category: OutingCategory, fetchedOn: string): OutingPlace {
  return {
    id: g.id, source: 'google', name: g.name, typeLabel: g.typeLabel, category, lat: g.lat, lon: g.lon, address: g.address,
    hours: null, hoursLines: g.hours ?? [], phone: g.phone, website: g.website, mapsUri: g.mapsUri,
    equipment: g.wheelchairEntrance != null ? { wheelchair: g.wheelchairEntrance } : {}, equipmentSource: 'google', minAge: null, maxAge: null, activities: null, goodForChildren: g.goodForChildren ?? g.menuForChildren ?? null,
    photo: g.photo ? { kind: 'google', ref: g.photo.name, credits: g.photo.attributions.map((a) => ({ name: a.displayName, url: a.uri })) } : null,
    fetchedOn,
  };
}

export interface PlaceSuggestion {
  id: string; user_id: string; name: string; category: string; address_public: string; city: string | null; lat: number; lon: number;
  min_age: number | null; max_age: number | null; equipment: string[]; activities: string | null; hours_text: string | null; website: string | null;
  status: 'pending' | 'approved' | 'rejected'; moderated_at: string | null; created_at: string;
}
export function fromSuggestion(s: PlaceSuggestion): OutingPlace {
  const equipment: Partial<Record<OutingEquipment, boolean>> = {};
  for (const e of s.equipment ?? []) if ((MEMBER_EQUIPMENT as string[]).includes(e)) equipment[e as OutingEquipment] = true;
  return {
    id: `sugg:${s.id}`, source: 'member', name: s.name, typeLabel: null, category: (OUTING_CATEGORIES as string[]).includes(s.category) ? s.category as OutingCategory : 'parks',
    lat: s.lat, lon: s.lon, address: s.address_public, hours: s.hours_text, hoursLines: [], phone: null, website: s.website, mapsUri: null,
    equipment, equipmentSource: 'member', minAge: s.min_age, maxAge: s.max_age, activities: s.activities, photo: null,
    fetchedOn: (s.moderated_at ?? s.created_at).slice(0, 10), moderatedOn: s.moderated_at?.slice(0, 10) ?? null,
  };
}

/** Un ancien « Place » de « Près de chez moi » (favoris) vers le format des sorties. */
export const fromNearbyPlace = (p: Place, category: OutingCategory): OutingPlace => ({
  id: p.id, source: 'osm', name: p.name, typeLabel: null, category, lat: p.lat, lon: p.lon, address: p.address, hours: p.hours, hoursLines: [],
  phone: p.phone, website: p.website, mapsUri: null,
  equipment: { ...(p.highchair != null ? { highchair: p.highchair } : {}), ...(p.changingTable != null ? { changing_table: p.changingTable } : {}) },
  equipmentSource: 'osm', minAge: p.minAge, maxAge: p.maxAge, activities: null, photo: null, fetchedOn: p.fetchedOn,
});

/** Filtre « équipement » : seulement les lieux où la source l'indique « oui » (jamais supposé). */
export const hasOutingEquipment = (p: OutingPlace, e: OutingEquipment) => p.equipment[e] === true;
export function suitsChildAge(p: Pick<OutingPlace, 'minAge' | 'maxAge'>, years: number | null): boolean {
  if (years == null) return true;
  if (p.minAge != null && years < p.minAge) return false;
  if (p.maxAge != null && years > p.maxAge) return false;
  return true;
}

/**
 * Fusion des sources : un établissement Google à moins de 40 m d'un lieu OpenStreetMap de même nom n'est pas affiché
 * en double ; les lieux restent séparés (aucune donnée Google n'est recopiée dans un lieu OpenStreetMap).
 */
export function mergeOutings(lists: OutingPlace[][], center: { lat: number; lon: number }, radiusM: number): (OutingPlace & { distance: number })[] {
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
  const out: (OutingPlace & { distance: number })[] = [];
  for (const list of lists) {
    for (const p of list) {
      const d = distanceM(center, p);
      if (d > radiusM * 1.15) continue;
      if (out.some((o) => o.id === p.id || (o.source !== p.source && p.name && norm(o.name) === norm(p.name) && distanceM(o, p) < 40))) continue;
      out.push({ ...p, distance: d });
    }
  }
  return out.sort((a, b) => a.distance - b.distance);
}

/** Annuaires officiels proposés par catégorie (lieux sans données ouvertes fiables). */
export const FAMILLE_NOMBREUSE: Directory = {
  kind: 'public_service', title: 'Carte famille nombreuse', body: 'Pour les familles d’au moins 3 enfants : réductions sur les trains et chez des partenaires. Conditions et demande sur le site officiel de l’administration.',
  url: 'https://www.service-public.fr/particuliers/vosdroits/F15292', source: 'Service-public.fr (fiche « Carte famille nombreuse »)', checkedOn: '2026-10-24',
};
export const PREPARATION_NAISSANCE: Directory = {
  kind: 'public_service', title: 'Séances de préparation à la naissance', body: 'Sept séances prises en charge par l’Assurance Maladie, animées par une sage-femme ou un médecin : demandez-les lors de l’entretien prénatal précoce.',
  url: 'https://www.sante.fr/les-seances-de-preparation-la-naissance-et-la-parentalite', source: 'Santé.fr', checkedOn: '2026-10-24',
};
export function directoriesFor(cat: OutingCategory | null): Directory[] {
  const by = (k: string) => DIRECTORIES.filter((d) => d.kind === k);
  switch (cat) {
    case 'laep': return by('parent_child');
    case 'parents_groups': return [...by('parents_assoc'), ...by('breastfeeding')];
    case 'mum_baby': return [...by('parent_child'), ...by('breastfeeding')];
    case 'pregnancy': return [PREPARATION_NAISSANCE];
    case 'big_families': return [FAMILLE_NOMBREUSE];
    case 'support': return [...by('social_centre'), ...by('isolated_support'), ...by('breastfeeding'), ...by('public_service')];
    default: return [];
  }
}

// ---------------------------------------------------------------- Wikimedia Commons (photo libre, auteur et licence)
export const commonsApiUrl = (file: string, width = 640) =>
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
  // Sans licence lisible, on n'affiche pas la photo
  if (!license) return null;
  return { url, author: stripHtml(m.Artist?.value).slice(0, 80) || 'Auteur sur Wikimedia Commons', license, pageUrl: ii.descriptionurl ?? 'https://commons.wikimedia.org' };
}

/** Géocodage de l'adresse PUBLIQUE d'un lieu proposé (Géoplateforme IGN, sans clé). */
export const addressGeocodeUrl = (q: string) => `${NEARBY_CONFIG.geocodeUrl}?q=${encodeURIComponent(q.trim())}&limit=1`;

// ---------------------------------------------------------------- rencontres
export interface Meetup {
  id: string; organizer_id: string; title: string; activity: string; place_ref: string; place_name: string; place_address: string | null;
  lat: number; lon: number; city_label: string | null; starts_at: string; duration_min: number; child_age_min: number; child_age_max: number;
  for_pregnant: boolean; capacity: number; participants_count: number; status: 'visible' | 'pending_review' | 'cancelled' | 'removed'; created_at: string;
}
export const MEETUP_LIMITS = { minCapacity: 3, maxCapacity: 20, maxDaysAhead: 60, minHoursAhead: 1 };
/** Référence de lieu acceptée pour une rencontre : un lieu public trouvé dans les résultats (jamais une adresse saisie). */
export const isPublicPlaceRef = (ref: string) => /^(osm:(node|way|relation)\/[0-9]{1,15}|google:[A-Za-z0-9_-]{10,200}|sugg:[0-9a-f-]{36})$/.test(ref);
const PERSONAL = /(\+33|0)[1-9]([ .-]?[0-9]{2}){4}|[\w.%+-]+@[\w.-]+\.[a-z]{2,}|\b\d{1,4}\s*(bis|ter)?\s*,?\s*(rue|avenue|av\.|bd|boulevard|allée|chemin|impasse|place|quai|route)\b/i;
export const containsPersonalData = (s: string) => PERSONAL.test(s);
export interface MeetupDraft { title: string; activity: string; place: OutingPlace | null; startsAt: Date; capacity: number; ageMin: number; ageMax: number; forPregnant: boolean }
/** Contrôles avant envoi (les mêmes règles sont appliquées par la base). Renvoie une clé de message, ou null. */
export function validateMeetup(d: MeetupDraft, now = new Date()): string | null {
  if (!d.place || !isPublicPlaceRef(d.place.id)) return 'mt.err.place';
  if (d.title.trim().length < 3 || d.title.trim().length > 80) return 'mt.err.title';
  if (d.activity.trim().length < 3 || d.activity.trim().length > 500) return 'mt.err.activity';
  const ms = d.startsAt.getTime() - now.getTime();
  if (!(ms >= MEETUP_LIMITS.minHoursAhead * 3_600_000 && ms <= MEETUP_LIMITS.maxDaysAhead * 86_400_000)) return 'mt.err.date';
  if (!Number.isInteger(d.capacity) || d.capacity < MEETUP_LIMITS.minCapacity || d.capacity > MEETUP_LIMITS.maxCapacity) return 'mt.err.capacity';
  if (d.ageMax < d.ageMin) return 'mt.err.ages';
  return null;
}
export const placesLeft = (m: Pick<Meetup, 'capacity' | 'participants_count'>) => Math.max(0, m.capacity - m.participants_count);
export const meetupUpcoming = (m: Pick<Meetup, 'starts_at' | 'status'>, now = Date.now()) => m.status === 'visible' && new Date(m.starts_at).getTime() > now;
/** Une rencontre « appartient » à une catégorie : rencontres entre mamans (toutes), activités femmes enceintes (celles prévues pour elles). */
export const meetupInCategory = (m: Pick<Meetup, 'for_pregnant'>, cat: OutingCategory | null) => cat == null || cat === 'mum_meetups' || (cat === 'pregnancy' && m.for_pregnant) || cat === 'mum_baby';
