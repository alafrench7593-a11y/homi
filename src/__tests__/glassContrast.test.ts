/**
 * Contrastes du matériau « Liquid Glass » (WCAG 2.1 AA) — 5 palettes × clair et sombre, comme contrast.test.ts.
 *
 * Ce qui se trouve sous un verre est inconnu : un flou ne sort jamais de l'enveloppe des couleurs qu'il mélange, donc
 * le PIRE fond est un noir ou un blanc uni. Pour chaque variante, chaque encre promise est vérifiée sur ces deux
 * fonds, à travers le voile de contraste, et sous chaque couche qui peut s'y ajouter (reflet, indicateur de
 * sélection, voile d'appui). Les seuils ne se baissent pas : on ajuste `src/theme/glass.ts`.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));

import { PALETTE_NAMES, themeFor, type PaletteName, type ThemeName } from '@/theme/tokens';
import { contrastRatio, over, parseColor, type RGB } from '@/theme/contrast';
import { AA_GRAPHIC, GLASS_AA, GLASS_FLOOR, GLASS_WORST_BACKDROPS, glassBase, glassSpec, resolveGlassTier, solveVeilAlpha, type GlassVariant } from '@/theme/glass';
import { glassButtonColors, type GlassButtonVariant } from '@/components/glass/GlassButton';

const CASES: [PaletteName, ThemeName][] = PALETTE_NAMES.flatMap((p) => (['light', 'dark'] as ThemeName[]).map((m): [PaletteName, ThemeName] => [p, m]));
const ratio = (ink: string, bg: RGB) => contrastRatio(over(ink, bg), bg);
/** Fonds d'essai : les deux pires cas, plus le fond de page et un gris moyen (photo quelconque). */
const backdrops = (page: string): RGB[] => [...GLASS_WORST_BACKDROPS, parseColor(page).rgb, [128, 128, 128]];

describe.each(CASES)('verre — palette %s, %s', (palette, mode) => {
  const t = themeFor(mode, palette);
  const c = t.colors;

  it.each(['chrome', 'card'] as GlassVariant[])('%s : texte et secondaire ≥ 4,5:1, accent ≥ 3:1, sur tout fond et sous chaque couche', (variant) => {
    const s = glassSpec(t, variant);
    const stacks = [[], [s.highlight[0]], [s.indicator], [s.press], [s.indicator, s.press]];
    for (const b of backdrops(c.background)) for (const layers of stacks) {
      const bg = glassBase(s.veil, b, layers);
      expect(ratio(s.inks.text, bg)).toBeGreaterThanOrEqual(GLASS_AA);
      expect(ratio(s.inks.muted, bg)).toBeGreaterThanOrEqual(GLASS_AA);
      expect(ratio(s.inks.accent, bg)).toBeGreaterThanOrEqual(AA_GRAPHIC);
    }
  });

  it('sheet (feuille, fenêtre, menu) : toutes les encres du thème ≥ 4,5:1 sur tout fond', () => {
    const s = glassSpec(t, 'sheet');
    for (const b of backdrops(c.background)) for (const layers of [[], [s.highlight[0]]]) {
      const bg = glassBase(s.veil, b, layers);
      for (const ink of [c.text, c.textMuted, c.primary, c.danger, c.success, c.warning, c.info]) expect(ratio(ink, bg)).toBeGreaterThanOrEqual(GLASS_AA);
    }
  });

  it('le voile reste un verre (translucide) pour chrome et card, jamais sous son plancher', () => {
    for (const v of ['chrome', 'card', 'sheet'] as GlassVariant[]) {
      const s = glassSpec(t, v);
      expect(s.veilAlpha).toBeGreaterThanOrEqual(GLASS_FLOOR[v]);
      expect(parseColor(s.veil).a).toBeCloseTo(s.veilAlpha, 5);
    }
    expect(glassSpec(t, 'chrome').veilAlpha).toBeLessThan(0.9);
    expect(glassSpec(t, 'card').veilAlpha).toBeLessThan(0.9);
  });

  it('repli opaque : mêmes encres ≥ 4,5:1 (accent ≥ 3:1) sur la surface du thème, sélection et appui compris', () => {
    for (const v of ['chrome', 'card'] as GlassVariant[]) {
      const s = glassSpec(t, v);
      for (const layers of [[], [s.indicator], [s.press], [s.indicator, s.press]]) {
        const bg = layers.reduce<RGB>((acc, l) => over(l, acc), over(s.opaque, parseColor(c.background).rgb));
        expect(ratio(s.inks.text, bg)).toBeGreaterThanOrEqual(GLASS_AA);
        expect(ratio(s.inks.muted, bg)).toBeGreaterThanOrEqual(GLASS_AA);
        expect(ratio(s.inks.accent, bg)).toBeGreaterThanOrEqual(AA_GRAPHIC);
      }
    }
    const sheet = glassSpec(t, 'sheet');
    const bg = over(sheet.opaque, parseColor(c.background).rgb);
    for (const ink of [c.text, c.textMuted, c.primary, c.danger]) expect(ratio(ink, bg)).toBeGreaterThanOrEqual(GLASS_AA);
  });

  it.each(['primary', 'secondary', 'tertiary', 'destructive'] as GlassButtonVariant[])('GlassButton %s : libellé ≥ 4,5:1 au repos, pendant l’appui et sous le reflet', (variant) => {
    const s = glassSpec(t, 'chrome');
    const b = glassButtonColors(t, s.inks.text, variant);
    if (b.fill) {
      const fill = parseColor(b.fill).rgb;
      const { rgb } = parseColor(b.fg);
      const pressed = over(`rgba(${rgb.join(',')},0.12)`, fill);
      expect(ratio(b.fg, fill)).toBeGreaterThanOrEqual(GLASS_AA);
      expect(ratio(b.fg, pressed)).toBeGreaterThanOrEqual(GLASS_AA);
    } else if (variant === 'tertiary') {
      // sans surface : réservé au fond uni et aux surfaces du thème
      for (const base of [c.background, c.surface, t.tokens.surface.raised]) expect(ratio(b.fg, parseColor(base).rgb)).toBeGreaterThanOrEqual(GLASS_AA);
    } else {
      for (const back of backdrops(c.background)) for (const layers of [[], [s.press]]) expect(ratio(b.fg, glassBase(s.veil, back, layers))).toBeGreaterThanOrEqual(GLASS_AA);
    }
  });

  it('toast : pictogramme d’état ≥ 3:1 sur sa pastille opaque', () => {
    const pill = parseColor(t.tokens.surface.raised).rgb;
    for (const ink of [c.success, c.danger]) expect(ratio(ink, pill)).toBeGreaterThanOrEqual(AA_GRAPHIC);
  });
});

describe('solveur du voile et niveau de verre', () => {
  it('le solveur renvoie la plus petite opacité suffisante (un cran en dessous échoue)', () => {
    const base = '#FFFFFF';
    const a = solveVeilAlpha({ base, inks: [['#222222', 4.5]], stacks: [[]], floor: 0.3 });
    expect(a).toBeGreaterThan(0.3);
    expect(a).toBeLessThan(1);
    const at = (alpha: number) => Math.min(...GLASS_WORST_BACKDROPS.map((b) => ratio('#222222', glassBase(`rgba(255,255,255,${alpha})`, b))));
    expect(at(a)).toBeGreaterThanOrEqual(4.5);
    expect(at(Math.round(a * 100 - 1) / 100)).toBeLessThan(4.5);
  });
  it('encre impossible : voile opaque (1), jamais un contraste insuffisant', () => {
    expect(solveVeilAlpha({ base: '#FFFFFF', inks: [['#FFFFFF', 4.5]], stacks: [[]], floor: 0.5 })).toBe(1);
  });
  it('Réduire la transparence et la nuit passent AVANT tout (même devant un niveau imposé ou le verre natif)', () => {
    const base = { reduceTransparency: false, night: false, nativeGlass: false, blur: true };
    expect(resolveGlassTier({ ...base, reduceTransparency: true, nativeGlass: true })).toBe('opaque');
    expect(resolveGlassTier({ ...base, reduceTransparency: true, forced: 'blur' })).toBe('opaque');
    expect(resolveGlassTier({ ...base, night: true, nativeGlass: true })).toBe('opaque');
    expect(resolveGlassTier({ ...base, nativeGlass: true })).toBe('native');
    expect(resolveGlassTier({ ...base, nativeGlass: true, forced: 'blur' })).toBe('blur');
    expect(resolveGlassTier(base)).toBe('blur');
    expect(resolveGlassTier({ ...base, blur: false })).toBe('opaque');
    expect(resolveGlassTier({ ...base, blur: false, forced: 'blur' })).toBe('opaque');
    expect(resolveGlassTier({ ...base, nativeGlass: true, forced: 'opaque' })).toBe('opaque');
  });
  it('nuit : aucune ombre, niveau opaque', () => {
    const t = themeFor('night');
    expect(glassSpec(t, 'chrome').shadow).toBeUndefined();
  });
});
