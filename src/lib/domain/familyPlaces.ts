/**
 * « Sorties près de chez moi » (logique pure, testée) : lieux PUBLICS pour sortir en famille, trouvés par Google
 * Places (fonction serveur `places`, clé jamais dans l'application) et montrés sur un fond de carte Google.
 * Aucun lieu inventé, aucune rencontre entre membres, aucune position de membre : la recherche part de la ville ou
 * du code postal choisi, ou (facultatif) de la position du moment arrondie à ~1 km et jamais enregistrée.
 */
import { DIRECTORIES, distanceM, type Directory } from './nearby';
import type { FamilyCategory, GooglePlace } from '../../../supabase/functions/_shared/google-places';

export type { FamilyCategory } from '../../../supabase/functions/_shared/google-places';
/** Lieux proposés en priorité (cafés, restaurants, parcs et aires de jeux, activités). */
export const MAIN_CATEGORIES: FamilyCategory[] = ['cafes', 'restaurants', 'parks', 'activities'];
/** Filtre secondaire : PMI, accueil enfants-parents, accompagnement. */
export const SECONDARY_CATEGORY: FamilyCategory = 'support';
export const CATEGORY_ICON: Record<FamilyCategory, string> = { cafes: 'coffee', restaurants: 'shopping-bag', parks: 'sun', activities: 'star', support: 'life-buoy' };
export const CATEGORY_TINT: Record<FamilyCategory, string> = { cafes: '#C9822B', restaurants: '#D9617A', parks: '#5E9E3A', activities: '#7A5FB8', support: '#3E7FA6' };

export interface FamilyPlace extends GooglePlace { fetchedOn: string }
export type PlacesState = 'ok' | 'not_configured' | 'invalid_key' | 'quota' | 'unavailable';

/** « Espace bébé ou enfant » : aire de jeux, ou lieu que Google indique adapté aux enfants. Jamais supposé. */
export const KIDS_SPACE_TYPES = ['playground', 'indoor_playground'];
export function hasKidsSpace(p: Pick<FamilyPlace, 'primaryType' | 'goodForChildren'>): boolean {
  return KIDS_SPACE_TYPES.includes(p.primaryType ?? '') || p.goodForChildren === true;
}
/** Texte de l'accueil des enfants : jamais « oui » sans l'information de Google. */
export function kidsInfo(p: Pick<FamilyPlace, 'primaryType' | 'goodForChildren' | 'menuForChildren'>): 'playground' | 'yes' | 'no' | 'unknown' {
  if (KIDS_SPACE_TYPES.includes(p.primaryType ?? '')) return 'playground';
  if (p.goodForChildren === true || p.menuForChildren === true) return 'yes';
  if (p.goodForChildren === false) return 'no';
  return 'unknown';
}

/** Tri par distance, dans le rayon choisi (un peu de marge pour les grands parcs). */
export function withDistance(places: FamilyPlace[], center: { lat: number; lon: number }, radiusM: number) {
  return places
    .map((p) => ({ ...p, distance: distanceM(center, p) }))
    .filter((p) => p.distance <= radiusM * 1.15)
    .sort((a, b) => a.distance - b.distance);
}
export function applyFilters<T extends FamilyPlace>(places: T[], f: { category: FamilyCategory | 'all'; kidsSpace: boolean }): T[] {
  return places.filter((p) => (f.category === 'all' ? p.category !== 'support' : p.category === f.category) && (!f.kidsSpace || hasKidsSpace(p)));
}
/** Rayon suivant pour « élargir la recherche » (null : déjà au maximum). */
export const RADIUS_STEPS = [2000, 5000, 10000, 20000];
export const nextRadius = (r: number): number | null => RADIUS_STEPS.find((x) => x > r) ?? null;

/** Annuaires officiels montrés avec le filtre secondaire « PMI et accompagnement ». */
export const supportDirectories = (): Directory[] => DIRECTORIES.filter((d) => ['parent_child', 'social_centre', 'parents_assoc', 'isolated_support', 'breastfeeding'].includes(d.kind));

/** Région de carte englobant le centre et les lieux (deltas en degrés, avec un minimum lisible). */
export function regionFor(center: { lat: number; lon: number }, places: { lat: number; lon: number }[], radiusM: number) {
  const pts = [center, ...places];
  const lats = pts.map((p) => p.lat), lons = pts.map((p) => p.lon);
  const minD = (radiusM / 111_000) * 1.2;
  return {
    latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
    longitude: (Math.min(...lons) + Math.max(...lons)) / 2,
    latitudeDelta: Math.max(minD, (Math.max(...lats) - Math.min(...lats)) * 1.3),
    longitudeDelta: Math.max(minD, (Math.max(...lons) - Math.min(...lons)) * 1.3),
  };
}

/** Style doux du fond de carte Google (couleurs pastel, points d'intérêt Google masqués pour laisser voir nos repères). */
export const SOFT_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#F7F1EA' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#7A6B74' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#FFFDF9' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ visibility: 'on' }, { color: '#DCEBCF' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#FBEFE6' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#F6DCCB' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#D8E6F3' }] },
];
