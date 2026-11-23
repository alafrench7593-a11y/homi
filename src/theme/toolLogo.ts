/**
 * Logos d'outils HOMI — « verre dépoli + lumière par public » (21/11/2026, docs/DA_LIQUID_GLASS.md § 3 bis).
 *
 * Les 134 icônes viennent de la propriétaire : une PLAQUE de verre dépoli lavande (une par catégorie) et un SYMBOLE
 * blanc nacré au trait (src/brand/toolGlass). HOMI y ajoute une LUMIÈRE colorée au centre, derrière le dessin, dont la
 * couleur dit À QUI SERT l'outil — on comprend d'un coup d'œil à quoi il correspond :
 *   femme (cycle, contraception, désir d'enfant, grossesse, post-partum, « moi ») → rose ;  bébé → bleu ;
 *   enfant → vert menthe ;  couple → pêche-corail ;  foyer / toute la famille → ambre doux ;
 *   communauté, compte, réglages → lavande neutre ;  urgence → rouge ;  Aura → son bleu nuit.
 * Barre d'onglets : lumière JAUNE douce derrière chaque icône (plus vive sur l'onglet actif) et derrière « + ».
 *
 * Couleurs SÉMANTIQUES (identiques dans les cinq palettes) : seule leur intensité suit l'apparence (nuit : atténuée).
 * Garde-fou : src/__tests__/toolLogos.test.tsx — la lumière ne rend jamais le symbole MOINS lisible que sur la plaque
 * nue (contraste nacre / centre de la plaque éclairée ≥ contraste nacre / plaque nue), publics tous distincts.
 */
import { contrastRatio } from './contrast';
import type { Theme } from './tokens';

/** Mélange linéaire #RRGGBB (copie locale de tokens.mixHex : ce module reste chargeable hors React Native). */
export function mixHex(a: string, b: string, k: number): string {
  const A = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const B = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${A.map((x, i) => Math.round(x + (B[i] - x) * k).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

/** Catégorie (rangement du catalogue) : choisit la PLAQUE de verre. */
export type LogoCategory = 'feeding' | 'sleep' | 'care' | 'health' | 'cycle' | 'pregnancy' | 'school' | 'couple' | 'family' | 'community' | 'account' | 'aura' | 'urgent';
export const LOGO_CATEGORIES: LogoCategory[] = ['feeding', 'sleep', 'care', 'health', 'cycle', 'pregnancy', 'school', 'couple', 'family', 'community', 'account', 'aura', 'urgent'];

/** Public (à qui sert l'outil) : choisit la LUMIÈRE. */
export type LogoPublic = 'woman' | 'baby' | 'child' | 'couple' | 'family' | 'neutral' | 'urgent' | 'aura';
export const LOGO_PUBLICS: LogoPublic[] = ['woman', 'baby', 'child', 'couple', 'family', 'neutral', 'urgent', 'aura'];

/** Lumière colorée de chaque public (centre du halo, derrière le symbole). */
export const PUBLIC_LIGHT: Record<LogoPublic, string> = {
  // 23/11/2026 (décision de la propriétaire) : noir et gris uniquement ; chaque public garde une nuance DISTINCTE,
  // seule l'urgence reste rouge (alerte reconnaissable d'un coup d'œil)
  woman: '#5C5C62', // gris ardoise : outils de la femme
  baby: '#3F3F45', // graphite : bébé
  child: '#7A7A80', // gris moyen : enfant
  couple: '#4D4D53', // anthracite : couple
  family: '#6B6B71', // gris fumé : foyer, toute la famille
  neutral: '#8C8C92', // gris clair : communauté, compte, réglages
  urgent: '#E0303C', // rouge : urgence
  aura: '#2A2A2E', // noir doux d'Aura
};

/** Barre d'onglets : lumière jaune douce derrière les icônes (opacité au centre : onglet actif / inactif). */
export const TAB_LIGHT = { color: '#A8A8AE', active: 0.95, idle: 0.22 } as const;

/** Symbole nacré (valeurs du fichier fourni) : dégradé, ombre portée, filet de lumière. */
/**
 * Lumière DANS le symbole (référence 04 de la propriétaire, 21/11/2026) : le trait s'allume de la couleur du public.
 * `bloom` = halos superposés autour du trait (largeur relative au trait, opacité) ; `tint` = part de couleur dans le
 * bas du dégradé nacré (le haut reste blanc lumineux).
 */
export const SYMBOL_GLOW = {
  bloom: [[3.4, 0.14], [2.3, 0.26], [1.55, 0.46]] as const,
  tint: { light: 0.42, dark: 0.42, night: 0.3 },
} as const;

export const PEARL = {
  top: '#FFFDFD',
  bottom: '#EEEBF8',
  shadow: '#574966',
  shadowOpacity: 0.25,
  highlight: '#FFFFFF',
  highlightOpacity: 0.44,
} as const;

/** Centre moyen des plaques de verre fournies (mesuré sur les 11 plaques, carré central de 100 px sur 512). */
export const GLASS_CENTER = '#9F96AD';

/** Intensité de la lumière : opacité au centre du dégradé radial (repos), surcroît à l'appui / l'ouverture, rayon. */
export const LOGO_LIGHT = {
  opacity: { light: 0.32, dark: 0.36, night: 0.22 },
  /** surcroît d'opacité au sommet de l'impulsion (appui, ouverture) */
  pulse: 0.15,
  /** rayon du halo intérieur (fraction de la plaque) : détaillé / compact */
  radius: { detailed: 0.36, compact: 0.34 },
} as const;

export type LogoMode = 'light' | 'dark' | 'night';

/** Apparence d'un thème pour les logos. */
export const logoMode = (t: Pick<Theme, 'name' | 'isDark'>): LogoMode => (t.name === 'night' ? 'night' : t.isDark ? 'dark' : 'light');

/** Couleur du centre éclairé de la plaque (lumière posée sur le verre, à son opacité de repos). */
export function litCenter(pub: LogoPublic, mode: LogoMode): string {
  return mixHex(GLASS_CENTER, PUBLIC_LIGHT[pub], LOGO_LIGHT.opacity[mode]);
}

/** Contraste du symbole (bas du dégradé nacré, son point le plus sombre) sur le centre éclairé de la plaque. */
export const lightContrast = (pub: LogoPublic, mode: LogoMode) => contrastRatio(PEARL.bottom, litCenter(pub, mode));
/** Même mesure sur la plaque nue (référence : la lumière ne doit jamais faire moins bien). */
export const bareContrast = () => contrastRatio(PEARL.bottom, GLASS_CENTER);

const hexA = (hex: string, a: number) => `rgba(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(',')},${+a.toFixed(3)})`;

/**
 * Ombre de la plaque (CSS / RN boxShadow), proportionnelle à sa taille : rendu détaillé (en-têtes, raccourcis) =
 * ombre douce + reflet de la lumière du public sous la plaque ; compact (listes, recherche) : ombre de contact seule.
 */
export function logoShadow(pub: LogoPublic, size: number, variant: 'detailed' | 'compact', mode: LogoMode): string | undefined {
  const px = (v: number) => `${+v.toFixed(1)}px`;
  if (mode === 'night') return undefined;
  const contact = `0px ${px(size * 0.03)} ${px(size * 0.07)} ${hexA(PEARL.shadow, mode === 'dark' ? 0.45 : 0.22)}`;
  if (variant === 'compact') return contact;
  return `${contact}, 0px ${px(size * 0.08)} ${px(size * 0.3)} ${hexA(PUBLIC_LIGHT[pub], mode === 'dark' ? 0.32 : 0.24)}`;
}

/**
 * Aura (assistante IA) : signature propre — un noyau de lumière dans une lentille, trois teintes qui tournent
 * lentement (corail, ambre, lagon) sur un bleu de nuit. Couleurs sémantiques de la marque d'Aura, identiques dans les cinq palettes.
 */
export const AURA = {
  core: '#FFFFFF',
  hues: ['#FF8A6B', '#F5C26B', '#4FC3C9'] as const, // corail, ambre, lagon : la lumière du foyer, jamais de violet
  ring: '#2E4466',
  ink: '#FFFFFF',
  /** ombre colorée douce sous la lentille (CSS / RN boxShadow) */
  shadow: '0px 4px 12px rgba(46,68,102,0.35)',
} as const;

/** App icon et mot-symbole : fonds de la tuile (clair / sombre) — mêmes valeurs que assets/brand/homi-app-icon*.svg. */
export const APP_ICON = {
  light: { top: '#FBF1EC', bottom: '#EBD9D1', glow: ['#F7A08E', '#C9B6FF'] as const, ink: '#1F1B1A', lens: '#FFFFFF', shadow: '0px 6px 18px rgba(84,40,60,0.18)' },
  dark: { top: '#2A1C24', bottom: '#120C10', glow: ['#E2735E', '#7C64D8'] as const, ink: '#F7F1E8', lens: '#FFFFFF', shadow: '0px 6px 18px rgba(0,0,0,0.5)' },
} as const;

/**
 * Logo de « Mes apps » (consigne de la propriétaire, 21/11/2026) : quatre petites tuiles d'app en verre dépoli (2 × 2),
 * chacune allumée de la lumière d'un public des logos d'outils — rose (femme), bleu (bébé), menthe (enfant), ambre
 * (famille). Plaque et symbole nacré : mêmes teintes que les logos d'outils (GLASS_CENTER, PEARL).
 */
export const APPS_LOGO = {
  lights: [PUBLIC_LIGHT.woman, PUBLIC_LIGHT.baby, PUBLIC_LIGHT.child, PUBLIC_LIGHT.family] as const,
  plateTop: '#CACACF',
  plateBottom: GLASS_CENTER,
  edge: '#FFFFFF',
  pearl: PEARL.top,
  /** opacité de la lumière au centre de chaque tuile : repos, sommet de la cascade à l'appui */
  rest: 0.85,
  lit: 1,
  /** décalage entre deux tuiles dans la cascade (ms) */
  step: 70,
} as const;
