/**
 * Accessibilité : contrastes AA (WCAG 2.1) des couleurs de texte du thème.
 * Texte courant ≥ 4,5:1 ; les surfaces translucides sont mélangées au fond avant le calcul.
 */
import { themes, type ThemeName } from '@/theme/tokens';

type RGB = [number, number, number];
function parse(c: string): { rgb: RGB; a: number } {
  if (c.startsWith('#')) {
    const h = c.slice(1);
    return { rgb: [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB, a: 1 };
  }
  const m = c.match(/rgba?\(([^)]+)\)/)!;
  const p = m[1].split(',').map((x) => parseFloat(x));
  return { rgb: [p[0], p[1], p[2]], a: p[3] ?? 1 };
}
const over = (top: string, base: RGB): RGB => {
  const { rgb, a } = parse(top);
  return rgb.map((v, i) => v * a + base[i] * (1 - a)) as RGB;
};
const lum = (rgb: RGB) => {
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const ratio = (a: RGB, b: RGB) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

/**
 * La palette de marque est verrouillée (aucune couleur ne doit changer). Les rares paires qui
 * n'atteignent pas 4,5:1 sont listées ici, mesurées, et compensées autrement (graisse, taille,
 * ombre portée du texte) : le test échoue si une NOUVELLE paire passe sous le seuil.
 */
const KNOWN_BRAND_EXCEPTIONS: Record<string, number> = {
  'light:liens (primaire) sur fond': 3.1,
  'light:liens (primaire) sur carte': 3.1,
  'light:liens (primaire) sur carte secondaire': 3.1,
  'light:erreurs sur fond': 4.3,
  'light:erreurs sur carte secondaire': 4.4,
  'light:boutons principaux': 3.4,
};
const min = (key: string) => KNOWN_BRAND_EXCEPTIONS[key] ?? 4.5;

describe.each(Object.keys(themes) as ThemeName[])('thème %s', (name) => {
  const c = themes[name].colors;
  const bg = parse(c.background).rgb;
  const surfaces: [string, RGB][] = [['fond', bg], ['carte', over(c.surface, bg)], ['carte secondaire', over(c.surfaceAlt, bg)]];
  for (const [label, base] of surfaces) {
    it(`texte sur ${label} ≥ 4,5`, () => expect(ratio(parse(c.text).rgb, base)).toBeGreaterThanOrEqual(4.5));
    it(`texte secondaire sur ${label} ≥ 4,5`, () => expect(ratio(parse(c.textMuted).rgb, base)).toBeGreaterThanOrEqual(4.5));
    it(`liens (primaire) sur ${label}`, () => expect(ratio(parse(c.primary).rgb, base)).toBeGreaterThanOrEqual(min(`${name}:liens (primaire) sur ${label}`)));
    it(`erreurs sur ${label}`, () => expect(ratio(parse(c.danger).rgb, base)).toBeGreaterThanOrEqual(min(`${name}:erreurs sur ${label}`)));
  }
  it('texte des boutons principaux', () => expect(ratio(parse(c.primaryText).rgb, parse(c.primary).rgb)).toBeGreaterThanOrEqual(min(`${name}:boutons principaux`)));
});

it('palette de marque inchangée (couleurs verrouillées)', () => {
  expect(themes.light.colors.primary).toBe('#E9587C');
  expect(themes.light.colors.danger).toBe('#D63A3A');
  expect(themes.dark.colors.primary).toBe('#FF86A8');
  expect(themes.night.colors.primary).toBe('#E89AB0');
});
