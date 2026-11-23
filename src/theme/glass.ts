/**
 * Matériau « Liquid Glass » HOMI — jetons (voir HOMI_DESIGN_SYSTEM.md § 10 « Liquid Glass et mouvement »).
 *
 * Trois niveaux, choisis à l'exécution par `src/components/glass/Glass.tsx` :
 *  1. `native` : verre d'iOS 26 (`expo-glass-effect`) — la matière, le reflet et l'adaptation au fond sont ceux du système ;
 *  2. `blur`   : flou réel (`expo-blur`) + VOILE DE CONTRASTE (teinte de la palette, translucide) + liseré clair + reflet ;
 *  3. `opaque` : surface du thème, même forme (« Réduire la transparence », nuit, Android sans cible de flou).
 *
 * VOILE DE CONTRASTE. Ce qui se trouve sous un verre est inconnu (fond uni, photo claire, photo sombre). Un flou ne
 * sort jamais de l'enveloppe des couleurs qu'il mélange : le pire cas est donc un fond NOIR ou BLANC uni. L'opacité
 * du voile est RÉSOLUE ici (`solveVeilAlpha`) : la plus petite valeur pour laquelle chaque encre promise par la
 * variante reste ≥ 4,5:1 (WCAG AA) sur noir ET sur blanc, y compris sous le reflet, l'indicateur de sélection et le
 * voile d'appui. Le test `src/__tests__/glassContrast.test.ts` refait le calcul pour les 5 palettes, en clair et sombre.
 *
 * Variantes :
 *  - `chrome` : barres, boutons flottants, recherche — libellés courts et pictogrammes ;
 *  - `card`   : PETITES surfaces (carte d'outil, pastille) ;
 *               encres de ces deux variantes : texte et secondaire renforcé ≥ 4,5:1, accent renforcé ≥ 3:1 (pictogrammes) ;
 *  - `sheet`  : feuille du bas, fenêtre modale — contenu libre de l'application (toutes les encres du thème), donc
 *               voile presque opaque.
 * Règle : une zone riche en texte (article, formulaire long, liste de données) reste une surface OPAQUE.
 */
import { contrastRatio, over, parseColor, type RGB } from './contrast';
import { alpha, mixHex, physicalShadow, type ShadowLayer, type Theme } from './tokens';

export type GlassVariant = 'chrome' | 'sheet' | 'card';
export type GlassTier = 'native' | 'blur' | 'opaque';

export interface GlassInks {
  /** texte principal posé sur le verre */
  text: string;
  /** texte secondaire RENFORCÉ (plus dense que `colors.textMuted` : il doit tenir sur une photo) */
  muted: string;
  /** accent RENFORCÉ pour les pictogrammes et repères graphiques (≥ 3:1 : anneau de sélection, étoile, focus) */
  accent: string;
}

export interface GlassSpec {
  variant: GlassVariant;
  /** teinte opaque du voile (surface élevée de la palette, à peine teintée par son décor) */
  base: string;
  /** opacité résolue du voile */
  veilAlpha: number;
  /** voile de contraste = `base` à `veilAlpha` */
  veil: string;
  /** liseré clair (arête du verre) */
  edge: string;
  /** contour extérieur très fin (détache le verre d'un fond de même clarté) */
  outline: string;
  /** reflet discret : dégradé du haut (lumière) vers le transparent */
  highlight: [string, string];
  /** indicateur de sélection posé SUR le verre (onglet actif, segment choisi) */
  indicator: string;
  indicatorEdge: string;
  /** voile d'appui (pression) */
  press: string;
  /** intensité du flou (`BlurView`, 1–100) et teinte système */
  blur: number;
  blurTint: 'systemUltraThinMaterialLight' | 'systemUltraThinMaterialDark';
  /** web : `expo-blur` ajoute sa propre teinte au `backdrop-filter` — on prend la plus légère (le voile fait le reste) */
  blurTintWeb: 'default' | 'systemUltraThinMaterialDark';
  /** ombre de contact de l'indicateur de sélection */
  indicatorShadow: ShadowLayer[] | undefined;
  /** repli opaque : surface du thème + liseré */
  opaque: string;
  opaqueEdge: string;
  /** verre natif (iOS 26) : style, teinte et apparence imposée (l'app a son propre réglage clair / sombre) */
  nativeStyle: 'regular' | 'clear';
  nativeTint: string | undefined;
  colorScheme: 'light' | 'dark';
  /** ombre au repos / pendant l'appui (aucune la nuit) */
  shadow: ShadowLayer[] | undefined;
  shadowPressed: ShadowLayer[] | undefined;
  inks: GlassInks;
}

export const GLASS_AA = 4.5;
/** Pictogrammes et repères graphiques (WCAG 1.4.11). */
export const AA_GRAPHIC = 3;
/** Pires fonds possibles sous un flou (voir l'en-tête). */
export const GLASS_WORST_BACKDROPS: RGB[] = [[0, 0, 0], [255, 255, 255]];
/** Plancher esthétique de l'opacité du voile par variante (le solveur ne descend jamais dessous). */
export const GLASS_FLOOR: Record<GlassVariant, number> = { chrome: 0.56, card: 0.64, sheet: 0.86 };
const BLUR: Record<GlassVariant, number> = { chrome: 80, card: 70, sheet: 100 };

const rgba = (rgb: RGB, a: number) => `rgba(${rgb.map((v) => Math.round(v)).join(',')},${a})`;

/** Fond réellement vu sous une encre : voile sur le pire fond, puis les couches éventuelles (reflet, indicateur, appui). */
export function glassBase(veil: string, backdrop: RGB, layers: string[] = []): RGB {
  return layers.reduce<RGB>((acc, l) => over(l, acc), over(veil, backdrop));
}

/**
 * Plus petite opacité du voile (pas de 0,01, ≥ `floor`) pour laquelle chaque encre atteint `target` sur chaque pire
 * fond et sous chaque pile de couches. Pur, testé.
 */
export function solveVeilAlpha(o: { base: string; inks: [ink: string, target: number][]; stacks: string[][]; floor: number }): number {
  const baseRgb = parseColor(o.base).rgb;
  for (let a = Math.round(o.floor * 100); a <= 100; a++) {
    const veil = rgba(baseRgb, a / 100);
    const ok = GLASS_WORST_BACKDROPS.every((b) => o.stacks.every((layers) => {
      const bg = glassBase(veil, b, layers);
      return o.inks.every(([ink, target]) => contrastRatio(over(ink, bg), bg) >= target);
    }));
    if (ok) return a / 100;
  }
  return 1;
}

const WHITE = '#FFFFFF';
const clear = (c: string) => alpha(c, 0);

function build(t: Theme, variant: GlassVariant): GlassSpec {
  const c = t.colors;
  const dark = t.isDark;
  const night = t.name === 'night';
  // Teinte du voile. Clair : la surface élevée, à peine colorée par le décor de la palette (verre givré).
  // Sombre : le FOND de la palette, à peine éclairci par son accent (verre fumé) — une teinte plus claire devrait
  // être presque opaque pour rester lisible sur une photo claire.
  const base = dark ? mixHex(c.background, t.tokens.accent.accent, 0.04) : mixHex(t.tokens.surface.raised, t.tokens.decor.a, 0.07);
  // Encres du verre : plus denses que celles des surfaces opaques (elles doivent tenir sur une photo)
  const inks: GlassInks = dark
    ? { text: mixHex(c.text, WHITE, 0.5), muted: mixHex(c.textMuted, WHITE, 0.55), accent: mixHex(c.primary, WHITE, 0.25) }
    : { text: c.text, muted: mixHex(c.textMuted, c.text, 0.55), accent: mixHex(c.primary, c.text, 0.25) };
  const highlight: [string, string] = dark ? [alpha(WHITE, 0.08), clear(WHITE)] : [alpha(WHITE, 0.5), clear(WHITE)];
  // Sélection (DA Liquid Glass 20/11/2026) : une GOUTTE teintée de l'accent, visible d'un coup d'œil (plus un blanc sur blanc) ;
  // elle entre dans le calcul du voile ci-dessous, donc les encres restent garanties dessus
  const indicator = dark ? alpha(mixHex(c.background, c.primary, 0.42), 0.55) : alpha(mixHex(WHITE, t.tokens.decor.a, 0.24), 0.9);
  const press = dark ? alpha(WHITE, 0.06) : alpha(c.text, 0.07);
    const promised: [string, number][] = variant === 'chrome' ? [[inks.text, GLASS_AA], [inks.muted, GLASS_AA], [inks.accent, AA_GRAPHIC]]
    : variant === 'card' ? [[inks.text, GLASS_AA], [inks.muted, GLASS_AA], [inks.accent, AA_GRAPHIC]]
      : [c.text, c.textMuted, c.primary, c.danger, c.success, c.warning, c.info].map((i): [string, number] => [i, GLASS_AA]);
  const stacks = variant === 'sheet' ? [[], [highlight[0]]] : [[], [highlight[0]], [indicator], [press], [indicator, press]];
  const veilAlpha = solveVeilAlpha({ base, inks: promised, stacks, floor: GLASS_FLOOR[variant] });
  const ink = t.material.shadowInk;
  const level = variant === 'card' ? 'mid' : 'high';
  return {
    variant, base, veilAlpha, veil: alpha(base, veilAlpha),
    edge: dark ? alpha(WHITE, 0.16) : alpha(WHITE, 0.72),
    outline: `rgba(${t.material.lineRgb},${dark ? 0.1 : 0.09})`,
    highlight, indicator, indicatorEdge: dark ? alpha(WHITE, 0.22) : alpha(WHITE, 0.95), press,
    blur: BLUR[variant], blurTint: dark ? 'systemUltraThinMaterialDark' : 'systemUltraThinMaterialLight',
    blurTintWeb: dark ? 'systemUltraThinMaterialDark' : 'default',
    indicatorShadow: night ? undefined : [{ offsetX: 0, offsetY: 1, blurRadius: 5, color: `rgba(${ink},${dark ? 0.4 : 0.16})` }],
    opaque: variant === 'card' ? c.surface : t.tokens.surface.raised, opaqueEdge: t.tokens.border.rest,
    nativeStyle: 'regular', nativeTint: variant === 'chrome' ? undefined : alpha(base, variant === 'card' ? 0.38 : 0.6),
    colorScheme: dark ? 'dark' : 'light',
    shadow: night ? undefined : physicalShadow(level, dark, ink),
    shadowPressed: night ? undefined : physicalShadow('low', dark, ink),
    inks,
  };
}

const CACHE = new WeakMap<Theme, Partial<Record<GlassVariant, GlassSpec>>>();
/** Jetons du verre pour le thème affiché (mis en cache par thème : le solveur ne tourne qu'une fois). */
export function glassSpec(t: Theme, variant: GlassVariant): GlassSpec {
  let per = CACHE.get(t);
  if (!per) { per = {}; CACHE.set(t, per); }
  return (per[variant] ??= build(t, variant));
}

/** Décision pure (testée) du niveau de verre. */
export function resolveGlassTier(o: { reduceTransparency: boolean; night: boolean; nativeGlass: boolean; blur: boolean; forced?: GlassTier | null }): GlassTier {
  // l'accessibilité passe avant tout, même devant un niveau imposé (galerie, tests)
  if (o.reduceTransparency || o.night) return 'opaque';
  if (o.forced === 'opaque') return 'opaque';
  if (o.forced === 'blur') return o.blur ? 'blur' : 'opaque';
  if (o.nativeGlass) return 'native';
  return o.blur ? 'blur' : 'opaque';
}

/**
 * Fond perle « Blanc nacré » (maquette validée le 23/11/2026) : couleurs du fond, des reflets, des sphères chromées et
 * du verre translucide des cartes. Seul le thème Blanc nacré en clair l'utilise (`usesPearl`).
 */
export const PEARL = {
  base: ['#F6F6F7', '#DEDEE2', '#EDEDF0', '#D9D9DD'] as const,
  sheen: ['rgba(255,255,255,0)', 'rgba(255,255,255,0.9)', 'rgba(255,255,255,0)'] as const,
  orb: ['#FFFFFF', '#E2E2E5', '#B4B4B9', '#7E7E84', '#5E5E64'] as const,
  /** remplissage des cartes : 74 % de blanc (texte secondaire ≥ 4,5:1 même au-dessus d'une sphère) */
  cardFill: 'rgba(255,255,255,0.74)',
  /** pastille d'initiales des enfants (sans couleur par enfant : noir et gris uniquement) */
  avatar: '#CFCFD4',
};
export const usesPearl = (t: Pick<Theme, 'palette' | 'isDark'>) => t.palette === 'nacre' && !t.isDark;
