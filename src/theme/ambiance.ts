/**
 * Ambiances par ESPACE (HOMI v4, 14/11/2026) — chaque espace se reconnaît à sa COMPOSITION, sa LUMIÈRE et son ACCENT
 * SECONDAIRE, sans jamais changer le sens des statuts (succès, attention, erreur, info restent ceux du thème) ni la
 * palette choisie (qui garde les accents d'action et les reflets).
 *
 * | Espace      | Composition (scène)                          | Lumière                     | Accent secondaire |
 * |-------------|----------------------------------------------|-----------------------------|-------------------|
 * | Accueil     | « Seuil » : plateaux et maison de verre       | haut gauche, douce          | celui de la palette |
 * | Santé       | « Cairn » : galets empilés en équilibre       | haut droite, diffuse        | lilas             |
 * | Bébé        | « Nid » : dunes rondes et galets lovés        | zénith, enveloppante        | pêche             |
 * | Famille     | « Strates » : terrasses de roche en paliers   | rasante depuis la gauche    | ambre             |
 * | Communauté  | « Monolithes » : pierres dressées ensemble    | contre-jour, derrière        | bleu brume        |
 * | Réglages    | « Prisme » : cristal à facettes               | rayons fins, haut gauche    | gris minéral      |
 *
 * L'accent secondaire est DÉCORATIF (pierres, lumière, caustique de la lentille) : il n'est jamais une couleur de
 * texte. Toutes les couleurs de chaque scène sont testées comme fond de texte (contrast.test.ts, « espaces »).
 * Logique pure (testée) : `spaceOf`, `spaceScene`, `AMBIANCES`.
 */
import { sceneColors, type SceneColors, type Theme } from './tokens';

export type SpaceKey = 'home' | 'health' | 'baby' | 'family' | 'community' | 'settings';
export const SPACE_KEYS: SpaceKey[] = ['home', 'health', 'baby', 'family', 'community', 'settings'];

export type Composition = 'threshold' | 'cairn' | 'nest' | 'strata' | 'monoliths' | 'prism';

export interface Ambiance {
  composition: Composition;
  /** Origine de la lumière (0..1 dans l'écran) : halo doux en clair, faisceau directionnel en sombre */
  light: { x: number; y: number };
  /** Accent secondaire (lueur pastel) ; `null` : celui de la palette (Accueil) */
  hue: string | null;
}

export const AMBIANCES: Record<SpaceKey, Ambiance> = {
  home: { composition: 'threshold', light: { x: 0.12, y: 0.08 }, hue: null },
  health: { composition: 'cairn', light: { x: 0.92, y: 0.06 }, hue: '#B9A8F0' },
  baby: { composition: 'nest', light: { x: 0.5, y: 0 }, hue: '#F6B89C' },
  family: { composition: 'strata', light: { x: 0, y: 0.32 }, hue: '#EDB66C' },
  community: { composition: 'monoliths', light: { x: 0.55, y: 0.3 }, hue: '#97B6E0' },
  settings: { composition: 'prism', light: { x: 0.08, y: 0.04 }, hue: '#B8BFCC' },
};

/** Préfixes d'adresse → espace (le premier qui correspond gagne ; le reste : Accueil). */
const SPACE_ROUTES: [SpaceKey, string[]][] = [
  ['settings', ['/settings', '/premium', '/legal', '/feedback', '/notifications', '/profile', '/profiles', '/admin']],
  ['community', ['/community', '/moi']],
  ['health', ['/health', '/cycle', '/pregnancy', '/fertility', '/contraception', '/postpartum', '/me', '/medications', '/appointments', '/consult', '/ask', '/assistant', '/library', '/article', '/guide', '/sources', '/videos', '/journeys', '/emergency']],
  ['baby', ['/baby', '/child', '/bottle', '/sleep', '/teeth', '/track', '/scanner', '/products', '/names', '/summary', '/tutos', '/night']],
  ['family', ['/household', '/family', '/meals', '/lists', '/calendar', '/agenda', '/outings', '/documents', '/partner', '/nearby', '/journal']],
];

/** Espace d'une adresse (logique pure, testée). */
export function spaceOf(pathname: string | null | undefined): SpaceKey {
  if (!pathname) return 'home';
  for (const [space, prefixes] of SPACE_ROUTES) {
    if (prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return space;
  }
  return 'home';
}

/** Couleurs de la scène d'un espace pour le thème affiché (palette, mode, transitions comprises). */
export function spaceScene(t: Theme, space: SpaceKey): SceneColors {
  const hue = AMBIANCES[space].hue;
  if (!hue) return t.material.scene;
  const [ga, gb] = t.tokens.accent.glow;
  // Nuit : les lueurs du thème sont déjà atténuées ; on part des lueurs pour garder la même scène, tamisée
  return sceneColors(t.name, ga, gb, hue);
}
