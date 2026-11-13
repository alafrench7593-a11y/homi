/**
 * Design system HOMI (DESIGN_SYSTEM.md) : chaque surface de verre, teinte de carte, bandeau, bouton et pastille
 * garde un texte ≥ 4,5:1 (WCAG AA), mesuré après mélange avec TOUT ce qui peut se trouver dessous (fond et les trois
 * arrêts du dégradé de page). Les ombres restent nuit violette, jamais noir pur.
 */
import { bannerColors, cardTint, glass, linesFor, physicalShadow, primaryGradient as PRIMARY_GRADIENT, SHADOW_INK, themes, tintedShadow, type ThemeName } from '@/theme/tokens';
import { contrastRatio, over, parseColor, stack, type RGB } from '@/theme/contrast';
import { initialsColor } from '@/components/Illustrations';

const AA = 4.5;
const NAMES = Object.keys(themes) as ThemeName[];
/** Tout ce qui peut se trouver sous une carte : le fond et le dégradé de page. */
const backdrops = (name: ThemeName): string[] => {
  const c = themes[name].colors;
  return [c.background, ...c.gradient];
};
const worst = (fg: string, fill: string, name: ThemeName) => Math.min(...backdrops(name).map((b) => contrastRatio(fg, over(fill, parseColor(b).rgb))));

describe.each(NAMES)('verre lisible — thème %s', (name) => {
  const c = themes[name].colors;
  for (const level of ['inset', 'raised', 'floating'] as const) {
    it(`niveau ${level} : texte, texte secondaire, primaire et erreurs ≥ 4,5`, () => {
      const fill = glass[name][level].fill;
      for (const k of ['text', 'textMuted', 'primary', 'danger'] as const) {
        expect([level, k, worst(c[k], fill, name) >= AA]).toEqual([level, k, true]);
      }
    });
  }
  it('le niveau « raised » est exactement la surface de carte du thème (aucune couleur verrouillée modifiée)', () => {
    expect(glass[name].raised.fill).toBe(c.surface);
  });
  it('les surfaces montent en opacité avec l’élévation (inset ≤ raised ≤ floating)', () => {
    const a = (s: string) => parseColor(s).a;
    if (name === 'night') return; // nuit : surfaces opaques
    expect(a(glass[name].inset.fill)).toBeLessThanOrEqual(a(glass[name].raised.fill));
    expect(a(glass[name].floating.fill)).toBeGreaterThan(a(glass[name].raised.fill));
  });
  it('mode nuit : ni flou ni ombre', () => {
    if (name !== 'night') return;
    for (const l of Object.values(glass.night)) { expect(l.blur).toBe(0); expect(l.shadow).toBeNull(); }
  });
});

describe.each(['light', 'dark'] as const)('teintes de carte — %s', (mode) => {
  const names: ThemeName[] = mode === 'light' ? ['light'] : ['dark', 'night'];
  for (const name of names) {
    for (const [tint, fill] of Object.entries(cardTint[mode])) {
      it(`${name} / ${tint} : texte, secondaire et primaire ≥ 4,5`, () => {
        const c = themes[name].colors;
        for (const k of ['text', 'textMuted', 'primary'] as const) expect([tint, k, worst(c[k], fill, name) >= AA]).toEqual([tint, k, true]);
      });
    }
  }
});

describe.each(NAMES)('bandeaux — thème %s', (name) => {
  const theme = themes[name];
  for (const [tone, b] of Object.entries(bannerColors(theme))) {
    it(`${tone} : accent et texte lisibles (≥ 4,5)`, () => {
      expect([tone, 'fg', worst(b.fg, b.bg, name) >= AA]).toEqual([tone, 'fg', true]);
      expect([tone, 'text', worst(theme.colors.text, b.bg, name) >= AA]).toEqual([tone, 'text', true]);
    });
  }
});

describe.each(NAMES)('boutons et pastilles — thème %s', (name) => {
  const c = themes[name].colors;
  it('texte du bouton principal lisible sur tout son dégradé', () => {
    for (const stop of PRIMARY_GRADIENT(themes[name].isDark)) expect([stop, contrastRatio(c.primaryText, stop) >= AA]).toEqual([stop, true]);
  });
  it('bouton secondaire (verre flottant) et fantôme (creux) lisibles', () => {
    expect(worst(c.text, glass[name].floating.fill, name)).toBeGreaterThanOrEqual(AA);
    expect(worst(c.text, linesFor(themes[name].isDark).controlFill, name)).toBeGreaterThanOrEqual(AA);
    expect(worst(c.primary, glass[name].inset.fill, name)).toBeGreaterThanOrEqual(AA);
  });
  it('bouton « nuit » lisible', () => {
    expect(contrastRatio(themes.night.colors.primaryText, themes.night.colors.primary)).toBeGreaterThanOrEqual(AA);
  });
  it('pastille choisie non pleine (teinte de l’accent) lisible', () => {
    for (const accent of [c.primary, c.lavender]) {
      const fill = accent + (themes[name].isDark ? '33' : '1F');
      expect([accent, worst(accent, fill, name) >= AA]).toEqual([accent, true]);
    }
  });
});

describe('ombres physiques', () => {
  it('jamais de noir pur ; encre nuit violette en clair', () => {
    for (const dark of [false, true]) {
      const layers = [...physicalShadow('low', dark), ...physicalShadow('mid', dark), ...physicalShadow('high', dark), ...tintedShadow('91,42,134', dark)];
      for (const l of layers) expect(l.color.startsWith('rgba(0,0,0')).toBe(false);
    }
    for (const l of physicalShadow('mid', false)) expect(l.color.startsWith(`rgba(${SHADOW_INK.light},`)).toBe(true);
  });
  it('deux couches (contact court + ambiance diffuse) qui grandissent avec l’élévation', () => {
    const [cl, al] = physicalShadow('low', false);
    const [, ah] = physicalShadow('high', false);
    expect(cl.blurRadius).toBeLessThan(al.blurRadius);
    expect(ah.blurRadius).toBeGreaterThan(al.blurRadius);
    expect(ah.offsetY).toBeGreaterThan(al.offsetY);
  });
});

describe('traits et avatars', () => {
  it('le séparateur se voit sur une carte claire (différent du liseré blanc)', () => {
    const card: RGB = stack(themes.light.colors.background, themes.light.colors.surface);
    expect(contrastRatio(over(linesFor(false).separator, card), card)).toBeGreaterThan(1.1);
  });
  it('initiales lisibles sur toutes les pastilles d’avatar', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 400; i++) seen.add(initialsColor(`enfant-${i}`));
    expect(seen.size).toBeGreaterThanOrEqual(5);
    for (const bg of seen) expect([bg, contrastRatio('#2B2433', bg) >= AA]).toEqual([bg, true]);
  });
});
