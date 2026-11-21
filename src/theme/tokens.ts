/**
 * HOMI v7 (21/11/2026) — design tokens centralisés, HUIT thèmes d'accueil + mode Adaptatif, en clair et en sombre.
 *
 * Tout ce qui est couleur d'interface part d'ici : `PALETTE_SPECS[thème][clair|sombre|nuit]` → `buildTheme` →
 * `useTheme()` (`tokens`, `colors`, `material`). Aucun composant ne connaît le nom d'un thème.
 * Thèmes (ordre du sélecteur « Personnaliser l'accueil ») : Blanc nacré, Noir graphite, Beige sable, Olive HOMI (défaut
 * d'une nouvelle installation), Brume lavande, Bleu glacier, Rose poudré, Nuit améthyste — couleurs de départ de la
 * propriétaire dans `THEME_STARTS`. Noir graphite et Nuit améthyste sont sombres par nature (`effectiveMode`).
 * Jetons partagés : fond, surfaces, contours, texte, texte secondaire, accent, texte sur accent, LUEUR INTERNE (`glow`).
 * Adaptatif : le thème suit le profil affiché (`ADAPTIVE_PALETTE`, correspondance fixe).
 * `migratePalette` : chaque ancienne palette (v3, v4, v6) devient le thème le plus proche (docs/THEMES_AURA.md).
 *
 * Rappels v5 (toujours vrais) : fond UNI partout ; la seule lumière décorative est le HALO (`tokens.halo`), réservé à
 * l'accueil, à l'entrée et à l'onboarding. Profondeur = plans (fond → surface → surface élevée) ; ombres très légères.
 * Le VERRE (barres, sélecteur, feuilles) est résolu par src/theme/glass.ts à partir de ces jetons. Nuit (écran /night) :
 * interne, très tamisée. Contrastes de CHAQUE thème testés (src/__tests__/contrast.test.ts).
 */

// ======================================================================== Couleurs de base
type Hex = string;
const hexRgb = (c: Hex): [number, number, number] => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)) as [number, number, number];
const toHex = (v: number[]) => `#${v.map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
/** Mélange linéaire de deux couleurs #RRGGBB (k = 0 → a, k = 1 → b). */
export function mixHex(a: Hex, b: Hex, k: number): Hex {
  const A = hexRgb(a); const B = hexRgb(b);
  return toHex(A.map((x, i) => x + (B[i] - x) * k));
}
/** « r,g,b » pour composer des rgba(). */
export const rgbOf = (c: Hex) => hexRgb(c).join(',');
/** « r,g,b » → #RRGGBB. */
const rgbHex = (rgb: string): Hex => toHex(rgb.split(',').map(Number));
/** rgba() depuis une couleur #RRGGBB. */
export const alpha = (c: Hex, a: number) => `rgba(${rgbOf(c)},${a})`;

/**
 * Identité HOMI v5 (verrouillée par contrast.test.ts). Trois familles :
 *  - `*Deep` : encres pour le clair (texte, icônes, aplats à texte blanc) — ≥ 4,5:1 sur le fond et les surfaces ;
 *  - `*Glow` : lueurs pour le sombre (texte coloré, aplats à texte encre) — ≥ 4,5:1 sur le prune et ses surfaces ;
 *  - teintes pures (`coral`, `rose`, `lilac`) : DÉCOR uniquement (halo, illustration, pastilles), jamais un texte.
 */
export const IDENTITY = {
  coral: '#F2826F',
  coralDeep: '#B5452F',
  coralGlow: '#FFA08A',
  rose: '#EC7E9C',
  roseDeep: '#A8365F',
  roseGlow: '#F4A3C0',
  lilac: '#B9A6F2',
  lilacDeep: '#6A4FB8',
  lilacGlow: '#C9B6FF',
  /** Encre prune : texte principal du clair, aplat de l'action principale */
  plum: '#2A1621',
  plumAction: '#3B1D2C',
} as const;

/**
 * Neutres v5 : ivoire rosé (clair), prune-anthracite (sombre), prune tamisée (nuit). Les anciens noms (`ivory`,
 * `obsidian`, `graphite*`, `pearl*`, `smoke`, `mist`, `peach`, `lilac`) sont conservés pour les imports existants et
 * pointent sur les nouvelles valeurs.
 */
export const NEUTRALS = {
  ivory: '#FBF4F2',
  ivoryHigh: '#FFFAF8',
  ivoryLow: '#F5EAE7',
  ink: IDENTITY.plum,
  inkSoft: '#6E5562',
  obsidian: '#1A1217',
  obsidianHigh: '#241A20',
  obsidianLow: '#140E12',
  graphite: '#1A1217',
  graphiteHigh: '#241A20',
  graphiteLow: '#140E12',
  smoke: '#2E2229',
  pearl: '#F6ECEF',
  pearlSoft: '#C2AFB8',
  nightBg: '#0E0A0C',
  white: '#FFFFFF',
  /** Teintes pâles de l'identité (fonds de pastilles, illustrations) : corail, rose, lilas */
  mist: '#FFE4DC',
  peach: '#FCE3EA',
  lilac: '#ECE5FB',
} as const;

/** Couleurs d'origine conservées comme noms (anciens imports) mais réalignées sur la v5. */
export const palette = {
  night: NEUTRALS.obsidian,
  nightDeep: NEUTRALS.obsidianLow,
  nightSoft: NEUTRALS.smoke,
  mist: NEUTRALS.ivory,
  mistDeep: NEUTRALS.ivoryLow,
  milk: NEUTRALS.pearl,
  powder: '#F6E7E3',
  powderDeep: '#EBCFC8',
  clay: IDENTITY.roseDeep, // cœur, repas
  lavender: IDENTITY.lilacGlow,
  lavenderInk: IDENTITY.lilacDeep,
  gold: '#F0BC6C',
  goldInk: '#7F4B0C',
  ink: NEUTRALS.ink,
  inkSoft: NEUTRALS.inkSoft,
  white: NEUTRALS.white,
  danger: '#B3111B',
  dangerSoft: '#FCE8E8',
};

// ======================================================================== Thèmes d'accueil (v7, huit thèmes)
/**
 * v7 (21/11/2026, brief « Refonte Apple premium et intégration d'Aura ») : HUIT thèmes, dans l'ordre du sélecteur
 * « Personnaliser l'accueil » — Blanc nacré, Noir graphite, Beige sable, Olive HOMI, Brume lavande, Bleu glacier,
 * Rose poudré, Nuit améthyste. Ils REMPLACENT les cinq palettes v6 (même mécanique : `PALETTE_SPECS` → `buildTheme` →
 * `useTheme()`), avec les couleurs de départ de la propriétaire (fond / surface / accent / texte) reprises telles quelles.
 *
 *  - Thèmes CLAIRS (6) : ils suivent l'apparence choisie (Système / Clair / Sombre) ; leur version sombre est un jeu
 *    profond teinté de la même famille.
 *  - Thèmes SOMBRES par nature (Noir graphite, Nuit améthyste, `scheme: 'dark'`) : toujours sombres, quelle que soit
 *    l'apparence (on les choisit pour leur noir) ; `light` y pointe sur le jeu sombre.
 *  - L'action principale est l'ACCENT du thème (bouton « J'accepte » de la référence), texte sur accent lisible.
 *  - `glow` : LUEUR INTERNE (pictogrammes de verre, lentille de l'onglet actif, bouton +) — décor, jamais un texte.
 *
 * Migration (`migratePalette`) : chaque ancienne palette devient le thème le plus proche (v6 Rose poudré et pêche → Rose
 * poudré, Lavande → Brume lavande, Bleu nuit → Bleu glacier, Sauge → Olive HOMI, Champagne → Beige sable ; v3/v4 →
 * Rose poudré, comme avant). Une nouvelle installation part d'Olive HOMI, la référence de la propriétaire.
 *
 * AUCUN composant ne connaît le nom d'un thème : ils lisent `useTheme()` (`tokens`, `colors`, `material`). Seuls ce
 * fichier, le fournisseur de thème, le magasin, le sélecteur (src/features/themePicker) et Réglages → Apparence
 * manipulent `PaletteName`.
 */
export type PaletteName = 'nacre' | 'graphite' | 'sable' | 'olive' | 'lavande' | 'glacier' | 'rose' | 'amethyste';
/** Choix enregistré : un thème fixe, ou « Adaptatif » (le thème suit le profil affiché). */
export type PaletteChoice = 'adaptive' | PaletteName;
/** Ordre du sélecteur (deux colonnes, ligne par ligne) = ordre du tableau de la propriétaire. */
export const PALETTE_NAMES: PaletteName[] = ['nacre', 'graphite', 'sable', 'olive', 'lavande', 'glacier', 'rose', 'amethyste'];
export const SIGNATURE_PALETTE: PaletteName = 'olive';
/** Nouvelle installation : Olive HOMI. Les personnes déjà inscrites gardent leur choix (migré, voir `migratePalette`). */
export const DEFAULT_PALETTE: PaletteName = SIGNATURE_PALETTE;

export interface StatusColors { success: Hex; warning: Hex; danger: Hex; info: Hex }
export type CardTint = 'soft' | 'lavender' | 'gold';

/** Jeu de couleurs d'un thème pour UNE apparence (clair ou sombre). */
export interface PaletteTone {
  /** Plans : fond de page (uni), variante du fond, carte, surface élevée (feuille, menu), creux (rail, champ) */
  bg: Hex; bgAlt: Hex; surface: Hex; raised: Hex; sunken: Hex;
  text: Hex; textMuted: Hex;
  /** Texte posé sur un aplat d'accent */
  onAccent: Hex;
  /** Encre des traits, séparateurs et liserés (« r,g,b ») : neutre teinté du thème */
  line: string;
  /** Voile du creux (translucide) */
  inset: string;
  /** Indicateur de sélection, pastille d'icône, teintes de carte (opaques) */
  lens: Hex; iconWell: Hex; tint: Record<CardTint, Hex>;
  /** Accents LISIBLES : encres en clair, lueurs en sombre (a = principal, b = second) ; `third` = accent rare */
  accent: [Hex, Hex]; third: Hex;
  /** Action principale (aplat + texte) et action posée sur le halo */
  action: { fill: Hex; text: Hex }; onHero: { fill: Hex; text: Hex };
  gold: Hex; heart: Hex;
  overlay: string; shadowInk: string;
  /** Succès, attention, alerte, info — harmonisés avec le thème, rouge d'alerte toujours distinct de l'accent */
  status: StatusColors;
  /** Fonds doux des bandeaux de statut */
  statusSoft: Record<keyof StatusColors, string>;
  /** Séries de graphiques (6 couleurs distinctes, ≥ 3:1 sur le fond et les cartes) */
  chart: Hex[];
}

/** Nuit (écran /night) : dérivée du sombre, très tamisée, sans halo ni ombre. */
export interface NightTone {
  bg: Hex; bgAlt: Hex; card: Hex; raised: Hex; sunken: Hex; edge: Hex; lens: Hex; lensEdge: Hex; iconWell: Hex;
  tint: Record<CardTint, Hex>; text: Hex; textMuted: Hex; accentSoft: Hex; dangerSoft: Hex; gold: Hex; heart: Hex;
  /** Encre des traits (« r,g,b ») */
  line: string; status: StatusColors;
}

export interface PaletteSpec {
  /** `light` : suit l'apparence choisie ; `dark` : toujours sombre (Noir graphite, Nuit améthyste) */
  scheme: 'light' | 'dark';
  /** Teintes pures : DÉCOR uniquement (halo, illustrations, pastilles, anneaux) — jamais un texte */
  decor: [Hex, Hex, Hex];
  /** Teintes pâles opaques (fonds de pastilles, tuiles d'illustration) */
  wash: [Hex, Hex, Hex];
  /** Lueur interne (clair, sombre) : cœur lumineux des pictogrammes de verre et de la lentille active */
  glow: { light: Hex; dark: Hex };
  /** Aperçu du sélecteur : reflet nacré de la vignette (deux arrêts) — même logique que la référence 01 */
  swatch: [Hex, Hex];
  light: PaletteTone;
  dark: PaletteTone;
  night: NightTone;
}

const WHITE = '#FFFFFF';
const BLACK = '#000000';
/** Gris de tamisage des accents la nuit. */
const NIGHT_GREY = '#A39A9E';

const STATUS = {
  // Rouge d'alerte santé : rouge franc (≈ 357°), distinct des accents ; toujours + icône + libellé
  light: { success: '#1B6B3A', warning: '#8A4B00', danger: '#B3111B', info: '#1D5AA6' },
  dark: { success: '#8BE0A6', warning: '#F7C770', danger: '#FF6B6B', info: '#9CC4FF' },
  night: { success: '#94C29E', warning: '#D9B577', danger: '#F08C8C', info: '#9EB6D8' },
} as const;

/** Clair : tout ce qui se déduit de quelques graines (fond, SURFACE de la propriétaire, encres, décor). */
function lightTone(s: {
  bg: Hex; surface: Hex; sunken: Hex; text: Hex; textMuted: Hex; line: Hex; accent: [Hex, Hex]; third: Hex;
  gold: Hex; heart: Hex; status: StatusColors; decor: [Hex, Hex, Hex];
}): PaletteTone {
  const raised = mixHex(s.surface, WHITE, 0.6);
  // « papier » des pastilles et fonds doux : la surface éclaircie (les surfaces teintées de la propriétaire restent lisibles)
  const paper = mixHex(s.surface, WHITE, 0.35);
  return {
    bg: s.bg, bgAlt: mixHex(s.bg, s.line, 0.05), surface: s.surface, raised, sunken: s.sunken,
    text: s.text, textMuted: s.textMuted, onAccent: WHITE,
    line: rgbOf(s.line), inset: alpha(s.line, 0.055),
    lens: mixHex(s.surface, WHITE, 0.75), iconWell: mixHex(paper, s.decor[0], 0.2),
    tint: { soft: mixHex(paper, s.decor[0], 0.13), lavender: mixHex(paper, s.decor[2], 0.16), gold: mixHex(paper, '#F0BC6C', 0.16) },
    accent: s.accent, third: s.third,
    // l'action principale EST l'accent du thème (référence : « J'accepte » olive sur l'accueil Olive HOMI)
    action: { fill: s.accent[0], text: WHITE }, onHero: { fill: WHITE, text: s.text },
    gold: s.gold, heart: s.heart, overlay: alpha(s.text, 0.36), shadowInk: rgbOf(s.line),
    status: s.status,
    statusSoft: { success: mixHex(paper, s.status.success, 0.1), warning: mixHex(paper, s.status.warning, 0.1), danger: mixHex(paper, s.status.danger, 0.09), info: mixHex(paper, s.status.info, 0.09) },
    chart: [s.accent[0], s.accent[1], s.third, s.status.info, s.status.success, s.gold],
  };
}

/** Sombre : fond teinté profond (jamais noir pur), surfaces légèrement plus claires, lueurs lisibles. */
function darkTone(s: {
  bg: Hex; surface: Hex; raised: Hex; sunken: Hex; text: Hex; textMuted: Hex; line: Hex; ink: Hex; accent: [Hex, Hex]; third: Hex;
  gold: Hex; heart: Hex; status: StatusColors;
}): PaletteTone {
  return {
    bg: s.bg, bgAlt: s.sunken, surface: s.surface, raised: s.raised, sunken: s.sunken,
    text: s.text, textMuted: s.textMuted, onAccent: s.ink,
    line: rgbOf(s.line), inset: alpha(s.line, 0.06),
    lens: mixHex(s.raised, s.text, 0.06), iconWell: mixHex(s.surface, s.accent[0], 0.14),
    tint: { soft: mixHex(s.surface, s.accent[0], 0.07), lavender: mixHex(s.surface, s.third, 0.07), gold: mixHex(s.surface, s.gold, 0.07) },
    accent: s.accent, third: s.third,
    action: { fill: s.accent[0], text: s.ink }, onHero: { fill: s.text, text: s.ink },
    gold: s.gold, heart: s.heart, overlay: alpha(mixHex(s.bg, BLACK, 0.6), 0.6), shadowInk: rgbOf(mixHex(s.bg, BLACK, 0.7)),
    status: s.status,
    statusSoft: { success: alpha(s.status.success, 0.09), warning: alpha(s.status.warning, 0.1), danger: alpha(s.status.danger, 0.14), info: alpha(s.status.info, 0.1) },
    chart: [s.accent[0], s.accent[1], s.third, s.status.info, s.status.success, s.gold],
  };
}

/** Nuit dérivée du sombre : mêmes teintes, beaucoup moins de lumière. */
function nightTone(d: PaletteTone): NightTone {
  const bg = mixHex(d.bg, BLACK, 0.45);
  const card = mixHex(d.surface, BLACK, 0.37);
  const raised = mixHex(d.raised, BLACK, 0.36);
  return {
    bg, bgAlt: mixHex(d.bg, BLACK, 0.32), card, raised, sunken: mixHex(d.sunken, BLACK, 0.1),
    edge: mixHex(card, d.text, 0.09), lens: mixHex(raised, d.text, 0.04), lensEdge: mixHex(raised, d.text, 0.1), iconWell: mixHex(raised, d.text, 0.02),
    tint: { soft: mixHex(card, d.accent[0], 0.03), lavender: mixHex(card, d.third, 0.03), gold: mixHex(card, d.gold, 0.03) },
    text: mixHex(d.text, bg, 0.12), textMuted: mixHex(d.textMuted, bg, 0.18),
    accentSoft: mixHex(card, d.accent[0], 0.06), dangerSoft: mixHex(card, STATUS.night.danger, 0.1),
    gold: mixHex(d.gold, NIGHT_GREY, 0.35), heart: mixHex(d.heart, NIGHT_GREY, 0.2),
    line: rgbOf(d.text), status: STATUS.night,
  };
}

/**
 * Couleurs de DÉPART de la propriétaire (fond / surface / accent / texte), reprises telles quelles dans les jeux clairs
 * (thèmes clairs) et sombres (thèmes sombres). Verrouillées par src/__tests__/contrast.test.ts.
 */
export const THEME_STARTS: Record<PaletteName, { bg: Hex; surface: Hex; accent: Hex; text: Hex }> = {
  nacre: { bg: '#F4F5F8', surface: '#FFFFFF', accent: '#424957', text: '#191D26' },
  graphite: { bg: '#111214', surface: '#24262B', accent: '#E3E5EB', text: '#F5F6F8' },
  sable: { bg: '#F6EDE2', surface: '#FFF6E9', accent: '#674B36', text: '#2D2119' },
  olive: { bg: '#EBEDDF', surface: '#F8F5E8', accent: '#485532', text: '#252D1A' },
  lavande: { bg: '#F7F4FB', surface: '#EDE4F6', accent: '#674A8B', text: '#352345' },
  glacier: { bg: '#EDF4FA', surface: '#DBE9F4', accent: '#315B79', text: '#172C3B' },
  rose: { bg: '#FAF0F3', surface: '#F3DDE5', accent: '#854964', text: '#392331' },
  amethyste: { bg: '#181426', surface: '#272138', accent: '#CBB5F1', text: '#F4EDF9' },
};
const S = THEME_STARTS;

// ---------------------------------------------------------------- 1. Blanc nacré
const NACRE_DECOR: [Hex, Hex, Hex] = ['#BFC6D4', '#A9B9D3', '#D3CBE3'];
const NACRE_LIGHT = lightTone({
  ...S.nacre, sunken: '#E8EAF0', textMuted: '#4F5664', line: '#2A3140',
  accent: [S.nacre.accent, '#2F5689'], third: '#5E47A6', gold: '#734B10', heart: '#A3345C',
  status: STATUS.light, decor: NACRE_DECOR,
});
const NACRE_DARK = darkTone({
  bg: '#121419', surface: '#1D2027', raised: '#262A33', sunken: '#0D0F13', text: '#F2F4F8', textMuted: '#AEB4C0', line: '#DCE4F2', ink: '#191D26',
  accent: ['#C9D3E6', '#A9C3EA'], third: '#C9B6FF', gold: '#EDC583', heart: '#F4A3C0', status: { ...STATUS.dark, danger: '#FF8C8C' },
});

// ---------------------------------------------------------------- 2. Noir graphite (sombre par nature)
const GRAPHITE_DARK = darkTone({
  ...S.graphite, raised: '#2E3036', sunken: '#0C0D0F', textMuted: '#B4B8C2', line: '#E6EAF2', ink: S.graphite.bg,
  accent: [S.graphite.accent, '#C3CEE2'], third: '#C9B6FF', gold: '#F0C987', heart: '#F4A3C0', status: { ...STATUS.dark, danger: '#FF8C8C' },
});

// ---------------------------------------------------------------- 3. Beige sable
const SABLE_DECOR: [Hex, Hex, Hex] = ['#E4C892', '#EBBDA4', '#D3C0AC'];
const SABLE_LIGHT = lightTone({
  ...S.sable, sunken: '#EEE2D3', textMuted: '#5F5043', line: '#4A3620',
  accent: [S.sable.accent, '#844C3B'], third: '#6E4D6C', gold: '#72540F', heart: '#A0364F',
  status: { success: '#24622C', warning: '#8C4100', danger: '#B3111B', info: '#25548F' }, decor: SABLE_DECOR,
});
const SABLE_DARK = darkTone({
  bg: '#181410', surface: '#221C16', raised: '#2D261E', sunken: '#120F0B', text: '#F6EFE6', textMuted: '#C5B8A7', line: '#FFEBD2', ink: '#2A2118',
  accent: ['#E7C9A6', '#EFBBA4'], third: '#DCC0DF', gold: '#E0B062', heart: '#F2A6BA',
  status: { success: '#9BDD9C', warning: '#FFB86B', danger: '#FF857C', info: '#A6C6F2' },
});

// ---------------------------------------------------------------- 4. Olive HOMI (référence de la démo)
const OLIVE_DECOR: [Hex, Hex, Hex] = ['#B5C18F', '#D9CB93', '#A7B89C'];
const OLIVE_LIGHT = lightTone({
  ...S.olive, sunken: '#E0E3D1', textMuted: '#4D5640', line: '#34401F',
  accent: [S.olive.accent, '#6A5418'], third: '#664B79', gold: '#6C500E', heart: '#9C3550',
  status: { success: '#1D6233', warning: '#844400', danger: '#B3111B', info: '#1F5598' }, decor: OLIVE_DECOR,
});
const OLIVE_DARK = darkTone({
  bg: '#13160F', surface: '#1C2117', raised: '#262C1F', sunken: '#0E110B', text: '#EEF0E4', textMuted: '#B7BDA6', line: '#E4ECCF', ink: S.olive.text,
  accent: ['#C5D49B', '#E3D49A'], third: '#D9C2E8', gold: '#E8C583', heart: '#F2A6BA',
  status: { success: '#8FE0A4', warning: '#F5C872', danger: '#FF857C', info: '#9FC6F5' },
});

// ---------------------------------------------------------------- 5. Brume lavande
const LAVANDE_DECOR: [Hex, Hex, Hex] = ['#A48BEA', '#CF93D9', '#93A9F0'];
const LAVANDE_LIGHT = lightTone({
  ...S.lavande, sunken: '#E6DCF1', textMuted: '#57466A', line: '#3A2A5C',
  accent: [S.lavande.accent, '#8A3473'], third: '#38509A', gold: '#6E450F', heart: '#9C3157',
  status: { success: '#195E3F', warning: '#7A4208', danger: '#A80F2D', info: '#214E96' }, decor: LAVANDE_DECOR,
});
const LAVANDE_DARK = darkTone({
  bg: '#15121D', surface: '#1E1A29', raised: '#282335', sunken: '#100E17', text: '#EFEBF8', textMuted: '#B9B1C9', line: '#E4DCFF', ink: '#1F1730',
  accent: ['#BDA7FF', '#E5A9EE'], third: '#A9BEFF', gold: '#EDC27A', heart: '#F4A3C0',
  status: { success: '#8EDDB0', warning: '#F4C878', danger: '#FF7088', info: '#9CC4FF' },
});

// ---------------------------------------------------------------- 6. Bleu glacier
const GLACIER_DECOR: [Hex, Hex, Hex] = ['#8FC2E0', '#77B6C8', '#AFBDEB'];
const GLACIER_LIGHT = lightTone({
  ...S.glacier, sunken: '#D9E6F1', textMuted: '#3E5263', line: '#1C3558',
  accent: [S.glacier.accent, '#0D5F70'], third: '#5944A0', gold: '#694709', heart: '#983158',
  status: { success: '#145C3F', warning: '#7A4100', danger: '#A80F18', info: '#1A4F93' }, decor: GLACIER_DECOR,
});
const GLACIER_DARK = darkTone({
  bg: '#0F1622', surface: '#17202E', raised: '#202B3C', sunken: '#0B111A', text: '#E9F0F8', textMuted: '#AAB7C8', line: '#D6E6FF', ink: '#0F1F33',
  accent: ['#9CC8E8', '#8ADCE8'], third: '#C9B6FF', gold: '#EFC47E', heart: '#F4A3C0',
  status: { success: '#86DDB4', warning: '#F5C972', danger: '#FF857C', info: '#A6C0FF' },
});

// ---------------------------------------------------------------- 7. Rose poudré (héritière de l'identité v5 « Lumière corail »)
const ROSE_DECOR: [Hex, Hex, Hex] = [IDENTITY.coral, IDENTITY.rose, IDENTITY.lilac];
const ROSE_LIGHT = lightTone({
  ...S.rose, sunken: '#F0DCE4', textMuted: '#614453', line: '#54283C',
  accent: [S.rose.accent, '#9C3D29'], third: '#5E45A6', gold: '#6E450F', heart: '#9A2F57',
  status: { success: '#175E33', warning: '#7B4200', danger: '#A80F18', info: '#1A4F93' }, decor: ROSE_DECOR,
});
const ROSE_DARK = darkTone({
  bg: NEUTRALS.obsidian, surface: NEUTRALS.obsidianHigh, raised: NEUTRALS.smoke, sunken: NEUTRALS.obsidianLow, text: NEUTRALS.pearl, textMuted: NEUTRALS.pearlSoft, line: '#FFDCE8', ink: IDENTITY.plum,
  accent: ['#EBA9C6', IDENTITY.coralGlow], third: IDENTITY.lilacGlow, gold: '#F0BC6C', heart: IDENTITY.roseGlow, status: STATUS.dark,
});

// ---------------------------------------------------------------- 8. Nuit améthyste (sombre par nature)
const AMETHYSTE_DARK = darkTone({
  ...S.amethyste, raised: '#312A46', sunken: '#120F1D', textMuted: '#BDB1CF', line: '#E9DCFF', ink: S.amethyste.bg,
  accent: [S.amethyste.accent, '#F0B6E0'], third: '#A9C4FF', gold: '#EDC27A', heart: '#F4A3C0',
  status: { success: '#8EDDB0', warning: '#F4C878', danger: '#FF8A9A', info: '#9CC4FF' },
});

/** Les huit thèmes. Ordre de `decor` et `wash` : accent principal, second accent, accent rare. */
export const PALETTE_SPECS: Record<PaletteName, PaletteSpec> = {
  nacre: { scheme: 'light', decor: NACRE_DECOR, wash: ['#E9ECF2', '#E4EAF4', '#EEEAF5'], glow: { light: '#FFFFFF', dark: '#E8EEFF' }, swatch: ['#FFFFFF', '#DCE0E8'], light: NACRE_LIGHT, dark: NACRE_DARK, night: nightTone(NACRE_DARK) },
  graphite: { scheme: 'dark', decor: ['#8E939E', '#6F7684', '#B9BEC9'], wash: ['#2C2F35', '#292C33', '#30323A'], glow: { light: '#FFE3A6', dark: '#FFE3A6' }, swatch: ['#55585F', '#26282D'], light: GRAPHITE_DARK, dark: GRAPHITE_DARK, night: nightTone(GRAPHITE_DARK) },
  sable: { scheme: 'light', decor: SABLE_DECOR, wash: ['#F9EFDB', '#FBEAE1', '#F2EAE1'], glow: { light: '#FFF1D2', dark: '#FFE2B8' }, swatch: ['#FBF1E6', '#E9D2BC'], light: SABLE_LIGHT, dark: SABLE_DARK, night: nightTone(SABLE_DARK) },
  olive: { scheme: 'light', decor: OLIVE_DECOR, wash: ['#EDF0DF', '#F5EFD6', '#E8EEE3'], glow: { light: '#FFF2B8', dark: '#F6E7A4' }, swatch: ['#64713E', '#48532C'], light: OLIVE_LIGHT, dark: OLIVE_DARK, night: nightTone(OLIVE_DARK) },
  lavande: { scheme: 'light', decor: LAVANDE_DECOR, wash: ['#ECE5FB', '#F8E6F8', '#E4EAFC'], glow: { light: '#FFF0D2', dark: '#FFE6C4' }, swatch: ['#EDE6FA', '#CBB9EC'], light: LAVANDE_LIGHT, dark: LAVANDE_DARK, night: nightTone(LAVANDE_DARK) },
  glacier: { scheme: 'light', decor: GLACIER_DECOR, wash: ['#DDEEF7', '#DCEFF2', '#E8ECFA'], glow: { light: '#FFFFFF', dark: '#E2F3FF' }, swatch: ['#EAF3FA', '#BCD3E6'], light: GLACIER_LIGHT, dark: GLACIER_DARK, night: nightTone(GLACIER_DARK) },
  rose: { scheme: 'light', decor: ROSE_DECOR, wash: [NEUTRALS.mist, NEUTRALS.peach, NEUTRALS.lilac], glow: { light: '#FFE9D6', dark: '#FFD9C8' }, swatch: ['#F8E7EC', '#E5BFCD'], light: ROSE_LIGHT, dark: ROSE_DARK, night: nightTone(ROSE_DARK) },
  amethyste: { scheme: 'dark', decor: ['#8E6BD1', '#C77DC8', '#6F7FD8'], wash: ['#2F2742', '#34263F', '#28294A'], glow: { light: '#E9D8FF', dark: '#E9D8FF' }, swatch: ['#7A5CA6', '#3E2F5E'], light: AMETHYSTE_DARK, dark: AMETHYSTE_DARK, night: nightTone(AMETHYSTE_DARK) },
};

/** Apparence réellement affichée : un thème sombre par nature reste sombre en « Clair » (la nuit reste prioritaire). */
export function effectiveMode(mode: ThemeName, paletteName: PaletteName): ThemeName {
  return mode === 'light' && PALETTE_SPECS[paletteName]?.scheme === 'dark' ? 'dark' : mode;
}

/** Accents lisibles de chaque thème : encres (clair) et lueurs (sombre). Dérivé de `PALETTE_SPECS`. */
export interface PaletteAccents { ink: [Hex, Hex]; glow: [Hex, Hex] }
export const PALETTES = Object.fromEntries(
  PALETTE_NAMES.map((p) => [p, { ink: PALETTE_SPECS[p].light.accent, glow: PALETTE_SPECS[p].dark.accent }]),
) as Record<PaletteName, PaletteAccents>;

/**
 * Préférences enregistrées par les versions précédentes → thème le plus proche (sans perdre le choix de la personne) :
 *  - v6 : homi (Rose poudré et pêche) → rose, lavande → lavande, nuit (Bleu nuit et cyan) → glacier, sauge → olive,
 *    champagne → sable ;
 *  - v3 / v4 (déjà lues comme « Rose poudré et pêche » en v6) → rose.
 */
export const LEGACY_PALETTE: Record<string, PaletteName> = {
  homi: 'rose', nuit: 'glacier', sauge: 'olive', champagne: 'sable',
  auto: 'rose', peche: 'rose', lilas: 'rose', lagune: 'rose', ambre: 'rose',
  turquoise: 'rose', menthe: 'rose', aurore: 'rose', iris: 'rose', crepuscule: 'rose',
};
/**
 * Préférence enregistrée → choix valide (pur, testé). Un choix v7 (un des huit thèmes, ou « adaptive ») est conservé ;
 * une ancienne valeur devient le thème le plus proche (`LEGACY_PALETTE`) ; une valeur absente ou inconnue, le thème
 * par défaut (nouvelle installation).
 */
export function migratePalette(p?: string | null): PaletteChoice {
  if (p === 'adaptive') return 'adaptive';
  if (p && (PALETTE_NAMES as string[]).includes(p)) return p as PaletteName;
  if (p && LEGACY_PALETTE[p]) return LEGACY_PALETTE[p];
  return DEFAULT_PALETTE;
}

/** Profil affiché (sélecteur de profil) : moi, grossesse, enfant, post-partum, famille. */
export type ProfileKind = 'me' | 'pregnancy' | 'child' | 'postpartum' | 'family';
export const PROFILE_KINDS: ProfileKind[] = ['me', 'pregnancy', 'child', 'postpartum', 'family'];
/**
 * Mode Adaptatif — correspondance FIXE profil → thème (testée), reprise de la v6 avec les thèmes les plus proches :
 * moi → Rose poudré · grossesse → Brume lavande · enfant → Olive HOMI · post-partum → Beige sable · famille → Bleu glacier.
 */
export const ADAPTIVE_PALETTE: Record<ProfileKind, PaletteName> = {
  me: 'rose', pregnancy: 'lavande', child: 'olive', postpartum: 'sable', family: 'glacier',
};
/** Thème affiché pour un choix et un profil (pur, testé). */
export function resolvePalette(choice: string | null | undefined, profile: ProfileKind | null | undefined): PaletteName {
  const c = migratePalette(choice);
  if (c !== 'adaptive') return c;
  return (profile && ADAPTIVE_PALETTE[profile]) || DEFAULT_PALETTE;
}
// ======================================================================== Thèmes
export type ThemeName = 'light' | 'dark' | 'night';

/** Moment de la journée (salutation de l'accueil, aperçu). N'a plus d'effet sur les couleurs. */
export type SkyPhase = 'dawn' | 'day' | 'dusk' | 'night';
export function skyPhase(d: Date = new Date()): SkyPhase {
  const h = d.getHours() + d.getMinutes() / 60;
  if (h >= 6 && h < 11) return 'dawn';
  if (h >= 11 && h < 17) return 'day';
  if (h >= 17 && h < 21) return 'dusk';
  return 'night';
}
/** Fonds unis (anciens imports : bannières de profil). Trois fois la même couleur : plus de dégradé de page. */
export const SKY_GRADIENTS: Record<Exclude<SkyPhase, 'night'>, [string, string, string]> = {
  dawn: [NEUTRALS.ivory, NEUTRALS.ivory, NEUTRALS.ivory],
  day: [NEUTRALS.ivory, NEUTRALS.ivory, NEUTRALS.ivory],
  dusk: [NEUTRALS.obsidian, NEUTRALS.obsidian, NEUTRALS.obsidian],
};
/** Heure représentative de chaque moment (aperçu « voir à 8 h » de l'accueil). */
export function previewTime(p: SkyPhase): Date {
  const d = new Date();
  const [h, m] = { dawn: [8, 0], day: [14, 0], dusk: [19, 0], night: [23, 0] }[p];
  d.setHours(h, m, 0, 0);
  return d;
}

/**
 * Jetons sémantiques (une seule source pour chaque rôle). Tous les composants partagés lisent ces jetons ;
 * `colors` (rôles historiques) en est un alias.
 */
export interface DesignTokens {
  surface: {
    background: string; card: string; glass: string; glassStrong: string; opaque: string; /** surface élevée (feuille, menu) */ raised: string; /** creux (rail, champ) */ sunken: string;
    /** curseur d'interrupteur */ thumb: string; /** voile clair posé sur une surface teintée (pastille d'icône de bandeau) */ veil: string;
  };
  text: { primary: string; secondary: string; onAccent: string; /** encre foncée lisible sur les teintes de décor et leurs fonds pâles */ onDecor: string };
  /**
   * Surface « inverse » : scène sombre posée sur la page, même en clair (carte nuit, pastille hors connexion,
   * accès au mode nuit). Texte clair dessus ; `accent` = touche dorée.
   */
  inverse: { fill: string; text: string; textMuted: string; accent: string; edge: string };
  /** Encre des ombres (couleur opaque, pour `shadowColor`) */
  shadowColor: string;
  accent: { accent: string; accent2: string; /** lilas : accent secondaire RARE */ lilac: string; gradient: [string, string]; /** version lumineuse (décor), même en clair */ glow: [string, string] };
  /** Action principale : aplat profond + texte clair (clair : prune ; sombre : corail) */
  action: { fill: string; text: string; /** aplat pendant l'appui */ pressed: string; /** aplat et texte désactivés (fondu sur le fond) */ disabledFill: string; disabledText: string };
  /** Action principale posée sur le halo corail (`Button variant="onHero"`) : surface claire opaque + texte foncé */
  onHero: { fill: string; text: string };
  border: { rest: string; active: string };
  /**
   * HALO CORAIL (accueil, entrée, onboarding uniquement) : dégradé radial localisé derrière l'illustration.
   * `color` = cœur corail, `color2` = rose chaud, `color3` = bord lilas ; `intensity` 0 = éteint (nuit).
   */
  halo: { color: string; color2: string; color3: string; intensity: number };
  status: StatusColors;
  /** Fonds doux des statuts (bandeaux, pastilles) */
  statusSoft: Record<keyof StatusColors, string>;
  /**
   * Teintes pures de la palette : DÉCOR uniquement (halo, anneaux, avatars, illustrations d'interface), jamais un
   * texte. `ring` = a → b → c ; `wash` = versions pâles opaques (fonds de pastilles).
   */
  decor: { a: string; b: string; c: string; ring: [string, string, string]; wash: [string, string, string] };
  /** Séries de graphiques (6 couleurs, ≥ 3:1 sur le fond et les cartes) */
  chart: string[];
  /** Anneau de focus visible (clavier, lecteur d'écran) */
  focus: string;
  /**
   * LUEUR INTERNE (v7) : cœur lumineux des pictogrammes de verre, de la lentille de l'onglet actif et du bouton +.
   * `inner` = couleur pleine (centre), `soft` = halo translucide, `edge` = arête claire du verre. Décor, jamais un texte.
   */
  glow: { inner: string; soft: string; edge: string };
}

export interface Theme {
  name: ThemeName;
  phase?: SkyPhase;
  isDark: boolean;
  /** Palette affichée (information de diagnostic : les composants ne doivent pas s'en servir) */
  palette: PaletteName;
  tokens: DesignTokens;
  /** Matière dérivée (surfaces, traits, teintes) : voir plus bas */
  material: Material;
  colors: {
    background: string;
    backgroundAlt: string;
    /** Conservé pour compatibilité : trois fois le fond (fond uni) */
    gradient: [string, string, string];
    surface: string;
    surfaceAlt: string;
    border: string;
    text: string;
    textMuted: string;
    primary: string;
    primaryText: string;
    accent: string;
    accentSoft: string;
    lavender: string;
    gold: string;
    success: string;
    warning: string;
    info: string;
    danger: string;
    dangerSoft: string;
    tabBar: string;
    overlay: string;
    heart: string;
  };
}

// ======================================================================== Matière (surfaces, traits, teintes)
/**
 * Niveaux de surface historiques : `inset` (creux : rails, champs), `raised` (cartes = `colors.surface`),
 * `floating` (feuilles, menus = surface élevée). v5 : tous OPAQUES (sauf le creux, une teinte légère), sans flou.
 */
export type SurfaceLevel = 'inset' | 'raised' | 'floating';
export type ElevationLevel = 'low' | 'mid' | 'high';
export interface GlassLevel { fill: string; edge: string; highlight: string; blur: number; shadow: ElevationLevel | null }
export interface Lines { controlFill: string; hairline: string; separator: string; track: string; iconWell: string; thumbEdge: string }

/** Noms des anciennes matières v4 (conservés) : en v5 ce sont des surfaces opaques. */
export type SurfaceKind = 'optical' | 'frosted' | 'matte';
export interface SurfaceSpec {
  fill: string;
  edge: string;
  highlight: string;
  inner: [string, string];
  /** v5 : toujours 0 (aucun flou) */
  blur: number;
  shadow: ElevationLevel | null;
  /** v5 : toujours 0 (aucune ombre colorée) */
  glow: number;
}

/** Indicateur de sélection (sélecteurs, ex-« lentille ») : surface claire qui glisse sous l'option active. */
export interface LensSpec { fill: string; edge: string; rim: string; caustic: string; shade: string; shadow: string }

/** Ancienne direction de la lumière (reflets) : v5, reflets éteints (transparents). */
export interface LightSpec { start: { x: number; y: number }; end: { x: number; y: number }; edge: string; sheen: string }
export interface Material {
  glass: Record<SurfaceLevel, GlassLevel>;
  surfaces: Record<SurfaceKind, SurfaceSpec>;
  lens: LensSpec;
  light: LightSpec;
  lines: Lines;
  cardTint: Record<CardTint, string>;
  /** Aplat de l'action principale (trois fois la même couleur : plus de dégradé) — texte `primaryText` lisible */
  primaryGradient: [string, string, string];
  accentRgb: string;
  accent2Rgb: string;
  /** Encre des ombres physiques (« r,g,b ») */
  shadowInk: string;
  /** Encre des traits et liserés (« r,g,b ») : neutre teinté de la palette */
  lineRgb: string;
}

/** Voile d'appui d'un aplat (même valeur que `stateVeil.pressSolidDarken`, déclaré plus bas). */
const PRESS_VEIL = 0.14;
const LIGHT_DIR = { start: { x: 0, y: 0 }, end: { x: 0.85, y: 1 } };
const NO_LIGHT = 'rgba(255,255,255,0)';
const flatSurface = (fill: string, edge: string, shadow: ElevationLevel | null): SurfaceSpec => ({ fill, edge, highlight: NO_LIGHT, inner: [NO_LIGHT, NO_LIGHT], blur: 0, shadow, glow: 0 });
const lineA = (rgb: string, a: number | string) => `rgba(${rgb},${a})`;

/**
 * Thème complet pour une apparence et une palette. Tout vient de `PALETTE_SPECS[palette]` : aucun composant ne lit
 * une couleur ailleurs. La palette par défaut redonne exactement l'identité v5.
 */
export function buildTheme(requested: ThemeName, paletteName: PaletteName = DEFAULT_PALETTE): Theme {
  const spec = PALETTE_SPECS[paletteName] ?? PALETTE_SPECS[DEFAULT_PALETTE];
  // thème sombre par nature (Noir graphite, Nuit améthyste) : sombre même en « Clair »
  const mode = effectiveMode(requested, paletteName);
  const glowOf = (c: string, isDark: boolean) => ({ inner: c, soft: alpha(c, isDark ? 0.32 : 0.5), edge: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.85)' });
  const [d0, d1, d2] = spec.decor;
  // scène sombre posée sur la page (identique en clair et en sombre) : le fond sombre de la palette
  const inverse = { fill: spec.dark.bg, text: spec.dark.text, textMuted: spec.dark.textMuted, accent: spec.dark.gold, edge: 'rgba(255,255,255,0.10)' };
  if (mode === 'light') {
    const p = spec.light;
    const [a, b] = p.accent;
    const [ga, gb] = spec.dark.accent;
    const status = p.status;
    const surface = p.surface;
    const sunken = p.sunken;
    const edge = lineA(p.line, '0.10');
    const separator = lineA(p.line, 0.08);
    const raisedSpec = flatSurface(surface, edge, 'low');
    const decor = { a: d0, b: d1, c: d2, ring: spec.decor, wash: spec.wash };
    const material: Material = {
      glass: {
        inset: { fill: p.inset, edge, highlight: NO_LIGHT, blur: 0, shadow: null },
        raised: { fill: surface, edge, highlight: NO_LIGHT, blur: 0, shadow: 'low' },
        floating: { fill: p.raised, edge, highlight: NO_LIGHT, blur: 0, shadow: 'mid' },
      },
      surfaces: { optical: raisedSpec, frosted: raisedSpec, matte: flatSurface(surface, edge, null) },
      lens: { fill: p.lens, edge: lineA(p.line, 0.12), rim: NO_LIGHT, caustic: NO_LIGHT, shade: NO_LIGHT, shadow: lineA(p.line, '0.10') },
      light: { ...LIGHT_DIR, edge: NO_LIGHT, sheen: NO_LIGHT },
      lines: { controlFill: sunken, hairline: lineA(p.line, 0.16), separator, track: lineA(p.line, 0.24), iconWell: p.iconWell, thumbEdge: lineA(p.line, '0.10') },
      cardTint: p.tint,
      primaryGradient: [p.action.fill, p.action.fill, p.action.fill],
      accentRgb: rgbOf(a), accent2Rgb: rgbOf(b), shadowInk: p.shadowInk, lineRgb: p.line,
    };
    return {
      name: 'light', isDark: false, palette: paletteName, material,
      tokens: {
        surface: { background: p.bg, card: surface, glass: surface, glassStrong: surface, opaque: surface, raised: p.raised, sunken, thumb: WHITE, veil: 'rgba(255,255,255,0.7)' },
        text: { primary: p.text, secondary: p.textMuted, onAccent: p.onAccent, onDecor: p.text },
        inverse, shadowColor: rgbHex(p.shadowInk),
        accent: { accent: a, accent2: b, lilac: p.third, gradient: [a, b], glow: [ga, gb] },
        action: { ...p.action, pressed: mixHex(p.action.fill, WHITE, PRESS_VEIL), disabledFill: mixHex(p.bg, p.action.fill, 0.48), disabledText: p.action.text },
        onHero: p.onHero,
        border: { rest: edge, active: alpha(a, 0.6) },
        halo: { color: d0, color2: d1, color3: d2, intensity: 0.55 },
        status, statusSoft: p.statusSoft,
        decor, chart: p.chart,
        focus: a,
        glow: glowOf(spec.glow.light, false),
      },
      colors: {
        background: p.bg, backgroundAlt: p.bgAlt, gradient: [p.bg, p.bg, p.bg],
        surface, surfaceAlt: sunken, border: edge,
        text: p.text, textMuted: p.textMuted,
        primary: a, primaryText: p.onAccent,
        accent: d0, accentSoft: alpha(d0, 0.16),
        lavender: p.third, gold: p.gold,
        success: status.success, warning: status.warning, info: status.info, danger: status.danger, dangerSoft: p.statusSoft.danger,
        tabBar: surface, overlay: p.overlay, heart: p.heart,
      },
    };
  }
  if (mode === 'dark') {
    const p = spec.dark;
    const [a, b] = p.accent;
    const status = p.status;
    const surface = p.surface;
    const raised = p.raised;
    const edge = lineA(p.line, '0.10');
    // sombre : les fonds pâles deviennent des surfaces à peine teintées (jamais une tache claire)
    const wash = spec.decor.map((c) => mixHex(surface, c, 0.16)) as [string, string, string];
    const decor = { a: d0, b: d1, c: d2, ring: spec.decor, wash };
    const separator = lineA(p.line, 0.08);
    const material: Material = {
      glass: {
        inset: { fill: p.inset, edge, highlight: NO_LIGHT, blur: 0, shadow: null },
        raised: { fill: surface, edge, highlight: NO_LIGHT, blur: 0, shadow: 'low' },
        floating: { fill: raised, edge, highlight: NO_LIGHT, blur: 0, shadow: 'mid' },
      },
      surfaces: { optical: flatSurface(raised, edge, 'low'), frosted: flatSurface(raised, edge, 'low'), matte: flatSurface(surface, edge, null) },
      lens: { fill: p.lens, edge: lineA(p.line, 0.14), rim: NO_LIGHT, caustic: NO_LIGHT, shade: NO_LIGHT, shadow: 'rgba(0,0,0,0.25)' },
      light: { ...LIGHT_DIR, edge: NO_LIGHT, sheen: NO_LIGHT },
      lines: { controlFill: raised, hairline: lineA(p.line, 0.16), separator, track: lineA(p.line, 0.22), iconWell: p.iconWell, thumbEdge: 'rgba(0,0,0,0)' },
      cardTint: p.tint,
      primaryGradient: [p.action.fill, p.action.fill, p.action.fill],
      accentRgb: rgbOf(a), accent2Rgb: rgbOf(b), shadowInk: p.shadowInk, lineRgb: p.line,
    };
    return {
      name: 'dark', isDark: true, palette: paletteName, material,
      tokens: {
        surface: { background: p.bg, card: surface, glass: raised, glassStrong: raised, opaque: surface, raised, sunken: p.sunken, thumb: WHITE, veil: 'rgba(255,255,255,0.06)' },
        text: { primary: p.text, secondary: p.textMuted, onAccent: p.onAccent, onDecor: p.onAccent },
        inverse, shadowColor: rgbHex(p.shadowInk),
        accent: { accent: a, accent2: b, lilac: p.third, gradient: [a, b], glow: [a, b] },
        action: { ...p.action, pressed: mixHex(p.action.fill, p.action.text, PRESS_VEIL), disabledFill: mixHex(p.bg, p.action.fill, 0.48), disabledText: p.action.text },
        onHero: p.onHero,
        border: { rest: edge, active: alpha(a, 0.6) },
        halo: { color: d0, color2: d1, color3: d2, intensity: 0.32 },
        status, statusSoft: p.statusSoft,
        decor, chart: p.chart,
        focus: a,
        glow: glowOf(spec.glow.dark, true),
      },
      colors: {
        background: p.bg, backgroundAlt: p.bgAlt, gradient: [p.bg, p.bg, p.bg],
        surface, surfaceAlt: raised, border: edge,
        text: p.text, textMuted: p.textMuted,
        primary: a, primaryText: p.onAccent,
        accent: b, accentSoft: alpha(b, 0.16),
        lavender: p.third, gold: p.gold,
        success: status.success, warning: status.warning, info: status.info, danger: status.danger, dangerSoft: p.statusSoft.danger,
        tabBar: surface, overlay: p.overlay, heart: p.heart,
      },
    };
  }
  // Nuit (soins à 3 h) : teinte de la palette très tamisée, accents atténués, ni halo ni ombre
  const n = spec.night;
  const [ga, gb] = spec.dark.accent;
  const a = mixHex(ga, NIGHT_GREY, 0.35);
  const b = mixHex(gb, NIGHT_GREY, 0.35);
  const third = mixHex(spec.dark.third, NIGHT_GREY, 0.35);
  const status = n.status;
  const flat = (fill: string): SurfaceSpec => flatSurface(fill, n.edge, null);
  const material: Material = {
    glass: {
      inset: { fill: n.sunken, edge: n.edge, highlight: NO_LIGHT, blur: 0, shadow: null },
      raised: { fill: n.card, edge: n.edge, highlight: NO_LIGHT, blur: 0, shadow: null },
      floating: { fill: n.raised, edge: n.edge, highlight: NO_LIGHT, blur: 0, shadow: null },
    },
    surfaces: { optical: flat(n.raised), frosted: flat(n.raised), matte: flat(n.card) },
    lens: { fill: n.lens, edge: n.lensEdge, rim: NO_LIGHT, caustic: NO_LIGHT, shade: NO_LIGHT, shadow: 'rgba(0,0,0,0)' },
    light: { ...LIGHT_DIR, edge: NO_LIGHT, sheen: NO_LIGHT },
    lines: { controlFill: n.raised, hairline: lineA(n.line, 0.11), separator: lineA(n.line, 0.07), track: lineA(n.line, 0.16), iconWell: n.iconWell, thumbEdge: 'rgba(0,0,0,0)' },
    cardTint: n.tint,
    primaryGradient: [a, a, a],
    accentRgb: rgbOf(a), accent2Rgb: rgbOf(b), shadowInk: '0,0,0', lineRgb: spec.dark.line,
  };
  const nightSoft = { success: alpha(status.success, 0.09), warning: alpha(status.warning, 0.1), danger: n.dangerSoft, info: alpha(status.info, 0.1) };
  return {
    name: 'night', isDark: true, palette: paletteName, material,
    tokens: {
      surface: { background: n.bg, card: n.card, glass: n.card, glassStrong: n.raised, opaque: n.card, raised: n.raised, sunken: n.sunken, thumb: n.text, veil: 'rgba(255,255,255,0.06)' },
      text: { primary: n.text, secondary: n.textMuted, onAccent: n.bg, onDecor: n.bg },
      inverse, shadowColor: BLACK,
      accent: { accent: a, accent2: b, lilac: third, gradient: [a, b], glow: [a, b] },
      action: { fill: a, text: n.bg, pressed: mixHex(a, n.bg, PRESS_VEIL), disabledFill: mixHex(n.bg, a, 0.48), disabledText: n.bg },
      onHero: { fill: n.text, text: n.bg },
      border: { rest: n.edge, active: alpha(a, 0.5) },
      halo: { color: a, color2: b, color3: b, intensity: 0 },
      status, statusSoft: nightSoft,
      decor: { a, b, c: third, ring: [a, b, third], wash: [n.tint.soft, n.tint.gold, n.tint.lavender] },
      chart: [a, b, third, status.info, status.success, n.gold],
      focus: a,
      glow: { inner: mixHex(spec.glow.dark, NIGHT_GREY, 0.5), soft: alpha(spec.glow.dark, 0.12), edge: 'rgba(255,255,255,0.08)' },
    },
    colors: {
      background: n.bg, backgroundAlt: n.bgAlt, gradient: [n.bg, n.bg, n.bg],
      surface: n.card, surfaceAlt: n.raised, border: n.edge,
      text: n.text, textMuted: n.textMuted,
      primary: a, primaryText: n.bg,
      accent: b, accentSoft: n.accentSoft,
      lavender: b, gold: n.gold,
      success: status.success, warning: status.warning, info: status.info, danger: status.danger, dangerSoft: n.dangerSoft,
      tabBar: n.bg, overlay: 'rgba(0,0,0,0.6)', heart: n.heart,
    },
  };
}

/** Thèmes mis en cache (apparence × palette) : un seul objet par combinaison, références stables pour React. */
const THEME_CACHE = new Map<string, Theme>();
export function themeFor(mode: ThemeName, paletteName: PaletteName = DEFAULT_PALETTE): Theme {
  const key = `${mode}:${paletteName}`;
  let t = THEME_CACHE.get(key);
  if (!t) { t = buildTheme(mode, paletteName); THEME_CACHE.set(key, t); }
  return t;
}

/** Thèmes de la palette par défaut (anciens imports, tests). Préférer `useTheme()`. */
export const themes: Record<ThemeName, Theme> = {
  light: themeFor('light'),
  dark: themeFor('dark'),
  night: themeFor('night'),
};

/**
 * Dégradé de la palette PAR DÉFAUT (corail → rose → lilas) : réservé au logo et aux illustrations figées. Dans
 * l'interface, lire `theme.tokens.decor.ring` (suit la palette affichée).
 */
export const NACRE: [string, string, string] = [IDENTITY.coral, IDENTITY.rose, IDENTITY.lilac];
export const spacing = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 48 };
/**
 * Rayons v5 : `control` (boutons, champs, sélecteurs : rectangle aux angles souples, PAS une capsule) ; `lg` cartes ;
 * `xl` grandes surfaces ; `sheet` panneau du bas ; `pill` RÉSERVÉ aux filtres et statuts (`Chip`, pastilles).
 */
export const radius = { sm: 10, control: 14, md: 16, lg: 20, xl: 24, tile: 20, sheet: 28, orb: 24, pill: 999 };

/**
 * UNE seule famille : Manrope (déjà chargée ; humaniste, lisible en petit, chiffres nets). Space Grotesk et
 * Instrument Serif (italique éditoriale) sont retirés. Les anciens noms (`display*`, `serifItalic`) pointent sur
 * des graisses de Manrope.
 */
export const fonts = {
  display: 'Manrope_800ExtraBold',
  displayMedium: 'Manrope_700Bold',
  displayItalic: 'Manrope_600SemiBold',
  body: 'Manrope_500Medium',
  bodyMedium: 'Manrope_600SemiBold',
  bodyBold: 'Manrope_700Bold',
  /** Ancienne italique éditoriale (Instrument Serif) : remplacée par Manrope 600, droite */
  serifItalic: 'Manrope_600SemiBold',
};

/** Tailles de base ; elles suivent le réglage de taille de texte du téléphone (allowFontScaling). */
export const typeScale = {
  hero: { fontSize: 36, lineHeight: 42, letterSpacing: -1.1 },
  title: { fontSize: 28, lineHeight: 34, letterSpacing: -0.7 },
  heading: { fontSize: 19, lineHeight: 25, letterSpacing: -0.3 },
  body: { fontSize: 16, lineHeight: 24 },
  small: { fontSize: 14, lineHeight: 20 },
  caption: { fontSize: 12.5, lineHeight: 17 },
};

/**
 * Échelle typographique v5 (une famille, Manrope) : display, titre, titre de section, corps, libellé, métadonnée,
 * chiffres tabulaires. La couleur vient du thème ; les tailles suivent le réglage du téléphone, plafonnées par `maxScale`.
 */
export interface TypeStyle { fontFamily: string; fontSize: number; lineHeight: number; letterSpacing: number; color: 'text' | 'textMuted' | 'primaryText'; maxScale: number; fontVariant?: 'tabular-nums'[] }
export const typography = {
  /** Display : titre d'accueil, d'entrée, d'onboarding (une fois par écran) */
  display: { fontFamily: fonts.display, ...typeScale.hero, color: 'text', maxScale: 1.3 },
  /** Titre d'écran */
  headingXL: { fontFamily: fonts.display, ...typeScale.title, color: 'text', maxScale: 1.5 },
  headingL: { fontFamily: fonts.displayMedium, fontSize: 22, lineHeight: 28, letterSpacing: -0.4, color: 'text', maxScale: 1.5 },
  /** Titre de section */
  headingM: { fontFamily: fonts.displayMedium, ...typeScale.heading, color: 'text', maxScale: 1.7 },
  bodyL: { fontFamily: fonts.body, fontSize: 18, lineHeight: 27, letterSpacing: 0, color: 'text', maxScale: 1.7 },
  /** Corps */
  bodyM: { fontFamily: fonts.body, ...typeScale.body, letterSpacing: 0, color: 'text', maxScale: 1.7 },
  bodyS: { fontFamily: fonts.body, ...typeScale.small, letterSpacing: 0, color: 'text', maxScale: 1.7 },
  /** Métadonnée (heure, source, compteur) */
  caption: { fontFamily: fonts.body, ...typeScale.caption, letterSpacing: 0.1, color: 'textMuted', maxScale: 1.7 },
  /** Libellé (champ, groupe, rangée), casse de phrase */
  label: { fontFamily: fonts.bodyMedium, ...typeScale.small, letterSpacing: 0.1, color: 'textMuted', maxScale: 1.5 },
  /** Sur-titre en capitales (« GROSSESSE · 2 BÉBÉS ») */
  overline: { fontFamily: fonts.bodyBold, fontSize: 12, lineHeight: 16, letterSpacing: 1, color: 'textMuted', maxScale: 1.4 },
  button: { fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 22, letterSpacing: 0, color: 'primaryText', maxScale: 1.4 },
  /** Chiffres tabulaires (compteurs, mesures, durées : les chiffres ne « dansent » pas) */
  numeric: { fontFamily: fonts.bodyBold, fontSize: 28, lineHeight: 34, letterSpacing: -0.5, color: 'text', maxScale: 1.4, fontVariant: ['tabular-nums'] },
  /** Anciennes voix « journal » : même famille, droite (plus d'italique éditoriale) */
  editorial: { fontFamily: fonts.displayMedium, fontSize: 22, lineHeight: 28, letterSpacing: -0.3, color: 'text', maxScale: 1.4 },
  editorialS: { fontFamily: fonts.bodyMedium, fontSize: 17, lineHeight: 24, letterSpacing: -0.1, color: 'textMuted', maxScale: 1.5 },
} as const satisfies Record<string, TypeStyle>;
export type TypographyRole = keyof typeof typography;

/** Élévations (ancien format) : très légères, encre prune (jamais noire). */
export const elevation = {
  none: { shadowOpacity: 0, elevation: 0 },
  low: { shadowColor: '#54283C', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  mid: { shadowColor: '#54283C', shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  high: { shadowColor: '#54283C', shadowOpacity: 0.09, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 6 },
} as const;

// ======================================================================== Ombres (très légères)
/** Encre des ombres : prune en clair, presque noir rosé en sombre (jamais #000 pur). */
export const SHADOW_INK = { light: '84,40,60', dark: '6,3,5' } as const;

/** Couche d'ombre au format `boxShadow` de React Native (iOS, Android et web avec la même syntaxe). */
export interface ShadowLayer { offsetX: number; offsetY: number; blurRadius: number; spreadDistance?: number; color: string; inset?: boolean }

/**
 * Ombres v5 : très légères — la profondeur vient des plans (fond → surface → surface élevée), pas de l'ombre.
 * Une ombre de contact + une ambiance diffuse, opacités faibles.
 */
const SHADOW_STEPS: Record<ElevationLevel, { contact: [number, number, number]; ambient: [number, number, number] }> = {
  low: { contact: [1, 2, 0.035], ambient: [2, 8, 0.03] },
  mid: { contact: [1, 2, 0.04], ambient: [6, 18, 0.05] },
  high: { contact: [1, 3, 0.05], ambient: [12, 32, 0.08] },
};
export function physicalShadow(level: ElevationLevel, isDark: boolean, inkRgb?: string): ShadowLayer[] {
  const s = SHADOW_STEPS[level];
  // encre de la palette affichée si elle est fournie (`theme.material.shadowInk`), sinon celle de la palette par défaut
  const ink = inkRgb ?? (isDark ? SHADOW_INK.dark : SHADOW_INK.light);
  const a = (o: number) => Math.min(isDark ? o * 4 : o, 0.45).toFixed(3);
  return [
    { offsetX: 0, offsetY: s.contact[0], blurRadius: s.contact[1], color: `rgba(${ink},${a(s.contact[2])})` },
    { offsetX: 0, offsetY: s.ambient[0], blurRadius: s.ambient[1], spreadDistance: -Math.round(s.ambient[1] / 6), color: `rgba(${ink},${a(s.ambient[2])})` },
  ];
}

/** Aplat de l'action principale (ancien « dégradé » : trois arrêts identiques). */
export const primaryGradient = (isDark: boolean): [string, string, string] => themes[isDark ? 'dark' : 'light'].material.primaryGradient;
export const primaryGradientOf = (t: Theme): [string, string, string] => t.material.primaryGradient;

/** Ancienne ombre colorée : v5, une ombre de contact discrète (plus d'ombre teintée épaisse). */
export function tintedShadow(_rgb: string, isDark: boolean): ShadowLayer[] {
  return physicalShadow('low', isDark);
}

/** Ancien halo diffus des cartes sélectionnées : v5, aucun (la sélection est un contour corail). */
export function haloShadow(_t: Theme, _strength = 1): ShadowLayer[] {
  return [];
}

/** Surfaces par thème (anciens imports). Préférer `glassOf(theme)`. */
export const glass: Record<ThemeName, Record<SurfaceLevel, GlassLevel>> = {
  light: themes.light.material.glass,
  dark: themes.dark.material.glass,
  night: themes.night.material.glass,
};
export const glassOf = (t: Theme) => t.material.glass;

/** Teintes de carte (`<Card tone>`). Préférer `cardTintOf(theme)`. */
export const cardTint: Record<'light' | 'dark', Record<CardTint, string>> = { light: themes.light.material.cardTint, dark: themes.dark.material.cardTint };
export const cardTintOf = (t: Theme) => t.material.cardTint;

/** Bandeaux : fond teinté OPAQUE + liseré + couleur d'accent (icône, titre). `fg` est lu comme du texte : ≥ 4,5:1. */
export type BannerTone = 'info' | 'warning' | 'danger' | 'demo' | 'success';
export interface BannerColors { bg: string; edge: string; fg: string }
export function bannerColors(theme: Theme): Record<BannerTone, BannerColors> {
  const s = theme.tokens.status;
  const soft = theme.tokens.statusSoft;
  const c = theme.colors;
  if (!theme.isDark) {
    return {
      info: { bg: soft.info, edge: alpha(s.info, 0.18), fg: s.info },
      warning: { bg: soft.warning, edge: alpha(s.warning, 0.2), fg: s.warning },
      danger: { bg: c.dangerSoft, edge: alpha(s.danger, 0.22), fg: s.danger },
      demo: { bg: c.surface, edge: c.border, fg: c.textMuted },
      success: { bg: soft.success, edge: alpha(s.success, 0.18), fg: s.success },
    };
  }
  return {
    info: { bg: soft.info, edge: alpha(s.info, 0.22), fg: s.info },
    warning: { bg: soft.warning, edge: alpha(s.warning, 0.22), fg: s.warning },
    danger: { bg: c.dangerSoft, edge: alpha(s.danger, 0.24), fg: s.danger },
    demo: { bg: `rgba(${theme.material.lineRgb},0.05)`, edge: c.border, fg: c.textMuted },
    success: { bg: soft.success, edge: alpha(s.success, 0.2), fg: s.success },
  };
}

/** Traits et voiles d'interaction. Préférer `linesOf(theme)`. */
export const lines = { light: themes.light.material.lines, dark: themes.dark.material.lines } as const;
export const linesFor = (isDark: boolean) => (isDark ? lines.dark : lines.light);
export const linesOf = (t: Theme) => t.material.lines;

/** Voiles d'état (survol web, appui) : opacités, sur une couche absolue (aucun décalage de mise en page). */
export const stateVeil = { hoverSolid: 0.08, hoverGlass: 0.04, pressSolidDarken: 0.14, pressGlass: 0.07, pressTint: 0.1 } as const;

/** Tailles de contrôle (hauteur minimale) : boutons, champs, pastilles. Cible tactile ≥ 44 pt (hitSlop si besoin). */
export const controlSize = { sm: 44, md: 52, lg: 56, chip: 44, field: 52 } as const;

export const MIN_TOUCH = 48; // zone tactile minimale (Android 48dp, iOS 44pt)

/** Animations natives sur téléphone ; le web n'a pas de pilote natif (évite un avertissement console). */
// eslint-disable-next-line @typescript-eslint/no-require-imports
export const NATIVE_DRIVER: boolean = (require('react-native') as typeof import('react-native')).Platform.OS !== 'web';

// ======================================================================== Aides
/** Surface d'un type pour le thème affiché (noms v4 conservés). */
export const surfaceOf = (t: Theme, kind: SurfaceKind): SurfaceSpec => t.material.surfaces[kind];

/** Ombre d'une surface : très légère (aucune la nuit, aucune ombre colorée). */
export function surfaceShadow(t: Theme, kind: SurfaceKind, _strength = 1): ShadowLayer[] | undefined {
  const s = t.material.surfaces[kind];
  if (t.name === 'night' || !s.shadow) return undefined;
  return physicalShadow(s.shadow, t.isDark, t.material.shadowInk);
}

/** Teinte intérieure d'une tuile de données (statut ou accent) : très douce, texte ≥ 4,5:1 (testé). */
export function innerLight(t: Theme, tint: string): { color: string; opacity: number } {
  if (t.name === 'night') return { color: tint, opacity: 0 };
  return { color: tint, opacity: t.isDark ? 0.12 : 0.07 };
}

/**
 * Sélecteur de thème (« Personnaliser l'accueil », référence 01 de la propriétaire, 21/11/2026) : vignette active
 * cerclée d'un LISERÉ LUMINEUX clair et doré, coche dans une pastille nacrée cerclée d'or. Mêmes valeurs pour les huit
 * vignettes (elles montrent chacune leur thème, pas celui de l'app). Contraste : coche encre sur nacre 15,0:1, cercle d’or sur vignette olive 5,0:1 ;
 * pastille nacrée cerclée d'or lisible sur les vignettes claires comme sombres (le contour d'or et la coche portent
 * la sélection, avec l'état « coché » annoncé).
 */
export const THEME_PICKER = {
  /** liseré lumineux de la vignette active (or clair) et sa lueur */
  rim: '#F3D98B',
  rimInner: 'rgba(255,253,244,0.85)',
  rimGlow: 'rgba(243,217,139,0.55)',
  /** pastille de la coche : nacre, cercle d'or, coche encre */
  badge: '#FFFDF6',
  badgeRing: '#E7C766',
  badgeInk: '#25261E',
} as const;
